<?php

namespace App\Http\Controllers;

use App\Models\Queue;
use Illuminate\Http\Request;
use App\Events\QueueUpdated;
use Illuminate\Support\Facades\Log;

class QueueController extends Controller
{
    // 1. FOR STUDENTS: Join the queue
    public function joinQueue(Request $request) {
        $request->validate([
            'student_name' => 'required|string',
            'student_id' => 'required|string',
            'purpose' => 'required|string',
        ]);

        // Logic to get the next number: Look at the last person today and add +1
        $lastPerson = Queue::whereDate('created_at', today())->latest()->first();
        $nextNumber = $lastPerson ? $lastPerson->queue_number + 1 : 1;

        $queue = Queue::create([
            'student_name' => $request->student_name,
            'student_id' => $request->student_id,
            'purpose' => $request->purpose,
            'queue_number' => $nextNumber,
            'status' => 'pending'
        ]);

        return response()->json($queue);
    }








    // 2. FOR STAFF: Get all pending students
    public function index() {
        // Fetch only those who are waiting or being served
        return Queue::whereIn('status', ['pending', 'serving'])
                    ->orderBy('queue_number', 'asc')
                    ->get();
    }










    // 3. FOR STAFF: Update status (e.g., mark as Completed)
 public function updateStatus(Request $request, $id) {
    $queue = Queue::findOrFail($id);
    $queue->update(['status' => $request->status]);

    try {
        // 🔥 Trigger the event
        event(new QueueUpdated("refresh")); 
        Log::info("Broadcast event triggered for ticket " . $id);
    } catch (\Exception $e) {
        Log::error("Broadcast error: " . $e->getMessage());
    }

    return response()->json($queue);
}












    // Add this to your QueueController.php
public function getTicketStatus($id) {
    $myTicket = Queue::findOrFail($id);

    $recentCompletions = Queue::where('status', 'completed')
        ->whereDate('created_at', today())
        ->latest('updated_at')
        ->take(5)
        ->get();

    // Calculate average minutes it took to serve those 5 people
    $avgServiceMinutes = $recentCompletions->count() > 0 
        ? $recentCompletions->avg(function($q) {
            return $q->created_at->diffInMinutes($q->updated_at);
        })
        : 10;

    $peopleAhead = Queue::where('status', 'pending')
        ->where('id', '<', $myTicket->id)
        ->whereDate('created_at', today())
        ->count();

    // 3. The Prediction
    $estimatedWait = round($peopleAhead * $avgServiceMinutes);
  
    $nowServing = Queue::where('status', 'serving')
        ->whereDate('created_at', today())
        ->orderBy('queue_number', 'desc')
        ->first();

    return response()->json([
        'ticket' => $myTicket,
        'people_ahead' => $peopleAhead,
        'estimated_wait_time' => $estimatedWait, // Minutes
        'now_serving' => $nowServing ? $nowServing->queue_number : 'None'
    ]);
}
}