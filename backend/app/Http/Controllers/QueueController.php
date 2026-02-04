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
    $user = auth()->user();

    $request->validate([   
        'purpose'    => 'required|string',
        'department' => 'required|string',
        'year_level' => 'required|string',
    ]);

    // 1. Block if already in THIS specific department
    $alreadyInThisDept = Queue::where('user_id', $user->id)
                        ->where('department', $request->department)
                        ->whereIn('status', ['pending', 'serving'])
                        ->exists();

    if ($alreadyInThisDept) {
        return response()->json(['error' => "You are already in line for {$request->department}!"], 403);
    }

    // 2. 🛡️ CALCULATE NEXT NUMBER FOR THIS DEPT (Needed for Gap Check)
    $lastPersonInDept = Queue::where('department', $request->department)
                        ->whereDate('created_at', today())
                        ->latest('id')
                        ->first();
    
    $nextNumberForThisDept = $lastPersonInDept ? $lastPersonInDept->queue_number + 1 : 1;

    // 3. 🛡️ THE SAFETY GAP LOGIC
    $firstTicket = Queue::where('user_id', $user->id)
                        ->whereIn('status', ['pending', 'serving'])
                        ->orderBy('created_at', 'asc')
                        ->first();

    if ($firstTicket) {
        // Gap = The number you ARE ABOUT TO GET - Your current active number
        $gap = $nextNumberForThisDept - $firstTicket->queue_number;

        // Condition: If the new ticket is less than 10 slots away from your current one
        if ($gap < -2 && $firstTicket->status === 'pending') {
            return response()->json([
                'error' => "Safety Gap: You are #{$firstTicket->queue_number} in {$firstTicket->department}. To avoid conflict, you can only join {$request->department} when its queue reaches at least #" . ($firstTicket->queue_number + 10) . "."
            ], 403);
        }
    }

    return DB::transaction(function () use ($request, $user, $nextNumberForThisDept) {
        $session = QueueSession::where('department', $request->department)
                    ->where('target_year', $request->year_level)
                    ->where('is_active', true)
                    ->lockForUpdate()
                    ->first();

        if (!$session) return response()->json(['error' => 'Office is closed.'], 403);
        if ($session->current_count >= $session->capacity_limit) return response()->json(['error' => 'Quota reached.'], 403);

        // 4. Create Ticket using the DEPARTMENT-SPECIFIC number
        $queue = Queue::create([
            'user_id'      => $user->id,
            'student_name' => $user->name,
            'student_id'   => $user->student_id ?? 'VISITOR',
            'purpose'      => $request->purpose,
            'queue_number' => $nextNumberForThisDept, // Independent sequence!
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
        $user = auth()->user();
        // Fetch only those who are waiting or being served
        return Queue::where('department', $user->department)
                     ->whereDate('created_at', \Carbon\Carbon::today())
                    ->whereIn('status', ['pending', 'serving',"cancelled"])
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

    $peopleAhead = Queue::where('department', $myTicket->department) // Scope to same office
    ->where('status', 'pending')                                // Only those still waiting
    ->where('queue_number', '<', $myTicket->queue_number)       // Based on the dept sequence
    ->whereDate('created_at', today())                          // Only for today
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



public function getActiveTickets(Request $request) {
    $user = $request->user();

    // Fetch all tickets that are still "active"
    $tickets = Queue::where('user_id', $user->id)
                    ->whereIn('status', ['pending', 'serving'])
                    ->orderBy('created_at', 'desc')
                    ->get();

    return response()->json([
        'has_active' => $tickets->isNotEmpty(),
        'tickets' => $tickets,
        'count' => $tickets->count()
    ]);
}


public function cancel(Request $request, $id) 
{
    $ticket = Queue::findOrFail($id);
    
    // Safety check: Don't let them cancel if they are already being served
    if ($ticket->status === 'serving') {
        return response()->json(['message' => 'Cannot cancel while being served'], 403);
    }

    $ticket->update(['status' => 'cancelled']);

    // 📣 CRITICAL: Broadcast the update so the Staff Dashboard sees it real-time
    event(new \App\Events\QueueUpdated($ticket));

    return response()->json(['message' => 'Ticket cancelled successfully']);
}



public function lookupStudent(Request $request) {
    $search = $request->query('query');

    // Add this log to see what Laravel is actually receiving in your storage/logs/laravel.log
   // Log::info("Searching for: " . $search);

    $results = Queue::where('department', auth()->user()->department)
        -> where(function($q) use ($search) {
            // Use strtolower to make it case-insensitive
            
            $q->where('student_id', 'LIKE', "%" . strtolower($search) . "%")
              ->orWhere('student_name', 'LIKE', "%" . strtolower($search) . "%");
              
        })
        ->get();

    return response()->json($results);
}


public function getDepartmentHistory(Request $request) {
    $user = auth()->user();
    $date = $request->query('date'); // Format: YYYY-MM-DD

    $history = Queue::where('department', $user->department)
        ->whereIn('status', ['completed', 'cancelled'])
        // ✅ High-Level Filtering logic
        ->when($date, function ($query, $date) {
            return $query->whereDate('updated_at', $date);
        })
        ->orderBy('updated_at', 'desc')
        ->paginate(15);

    return response()->json($history);
}

}