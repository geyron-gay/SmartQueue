<?php

namespace App\Http\Controllers;

use App\Models\Queue;
use Illuminate\Http\Request;
use App\Events\QueueUpdated;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Models\QueueSession;

class QueueController extends Controller
{
 
public function joinQueue(Request $request) {
    // 1. Get the authenticated user
    $user = auth()->user();

    // 2. Validate (Only 'purpose', 'department', and 'year_level' come from the phone)
    $request->validate([   
        'purpose'    => 'required|string',
        'department' => 'required|string',
        'year_level' => 'required|string',
    ]);

    // 2. 🛡️ THE BOUNCER: Check if this user already has a PENDING ticket for THIS department
    $existingTicket = Queue::where('user_id', $user->id)
                        ->where('department', $request->department)
                        ->where('status', 'pending')
                        ->first();

    if ($existingTicket) {
        return response()->json([
            'error' => "You already have an active ticket (#{$existingTicket->queue_number}) for the {$request->department}. Please finish that first!",
            'active_ticket_id' => $existingTicket->id
        ], 403); // 403 Forbidden
    }

    return DB::transaction(function () use ($request, $user) {
        // 3. Find session
        $session = QueueSession::where('department', $request->department)
                    ->where('target_year', $request->year_level)
                    ->where('is_active', true)
                    ->lockForUpdate()
                    ->first();

        if (!$session) {
            return response()->json(['error' => 'Office is closed for your level.'], 403);
        }

        if ($session->current_count >= $session->capacity_limit) {
            return response()->json(['error' => 'Daily quota reached.'], 403);
        }

        // 4. Calculate Queue Number
        $lastPerson = Queue::whereDate('created_at', today())->latest()->first();
        $nextNumber = $lastPerson ? $lastPerson->queue_number + 1 : 1;

        // 5. Create Ticket (Pull Name/ID from the $user object, not the request)
        $queue = Queue::create([
            'user_id'      => $user->id,
            'student_name' => $user->name,
            'student_id'   => $user->student_id ?? 'VISITOR', // Use 'VISITOR' if null
            'purpose'      => $request->purpose,
            'queue_number' => $nextNumber,
            'status'       => 'pending',
            'department'   => $request->department,
        ]);

        $session->increment('current_count');
        broadcast(new QueueUpdated("refresh"))->toOthers();

        return response()->json($queue);
    });
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

    public function getUserHistory() {
    $history = Queue::where('user_id', auth()->id())
        ->orderBy('created_at', 'desc')
        ->get();

    return response()->json($history);
}



   public function getActiveTicket() {
    // Find the first ticket that is still 'pending' or 'serving'
    $ticket = Queue::where('user_id', auth()->id())
                   ->whereIn('status', ['pending', 'serving']) // 👈 include multiple statuses
                   ->first();

    return response()->json([
        'has_active' => !!$ticket, // true if ticket exists
        'ticket'     => $ticket
    ]);
}
}