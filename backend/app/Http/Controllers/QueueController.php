<?php

namespace App\Http\Controllers;

use App\Models\Queue;
use Illuminate\Http\Request;
use App\Events\QueueUpdated;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Models\QueueSession;
use Illuminate\Validation\Rule;
use App\Services\FcmService;


    
class QueueController extends Controller
{
 
public function joinQueue(Request $request) {
    $user = auth()->user();

    $request->validate([   
     'purpose' => [
    'required',
        Rule::exists('purposes', 'name')->where(function ($query) use ($request) {
        $query->where('department', $request->department);
    }),
],
        'priority' => 'required|in:Regular,Priority',
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
                        ->latest('id')
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

        $priorityScore = ($request->priority === 'Priority') ? 1 : 0;

        // 4. Create Ticket using the DEPARTMENT-SPECIFIC number
        $queue = Queue::create([
        'user_id'      => $user->id,
        'student_name' => $user->name,
        'student_id'   => $user->student_id ?? 'VISITOR',
        'purpose'      => $request->purpose,
        'priority'     => $request->priority, // Save 'Regular' or 'Priority'
        'priority_level' => $priorityScore,   // Save 1 for PWD, 0 for Regular
        'queue_number' => $nextNumberForThisDept, 
        'status'       => 'pending',
        'department'   => $request->department,
    ]);

        $session->increment('current_count');
        $stats = $this->calculateTicketStats($queue);

    // 3. 🔥 SEND THE DATA-RICH STICKY NOTIFICATION
    if ($user->fcm_token) {
        try {
          FcmService::sendStickyNotification(
                $user->fcm_token,
                "Ticket #{$queue->queue_number} Registered!",
                "People Ahead: {$stats['people_ahead']} | Est. Wait: {$stats['estimated_wait_time']} mins"
            );
        } catch (\Exception $e) {
            Log::error("FCM Initial Notification Error: " . $e->getMessage());
        }
    }

    broadcast(new QueueUpdated("refresh"))->toOthers();

    return response()->json([
        'queue' => $queue,
        'stats' => $stats // Sending stats back to app UI too!
    ]);
    });
}







    // 2. FOR STAFF: Get all pending students
    public function index() {
        $user = auth()->user();
        // Fetch only those who are waiting or being served
        return Queue::where('department', $user->department)
                     ->whereDate('created_at', \Carbon\Carbon::today())
                    ->whereIn('status', ['pending', 'serving',"cancelled"])
                    ->orderBy('priority_level', 'desc')
                    ->orderBy('queue_number', 'asc')
                    ->get();
    }










public function updateStatus(Request $request, $id) {
    // 1. Load the queue ticket along with the student (user)
    $queue = Queue::with('user')->findOrFail($id);
    $status = $request->status;

    $data = ['status' => $status];

    if ($status === 'serving') {
        $data['started_at'] = now();
    } elseif ($status === 'completed') {
        $data['completed_at'] = now();
    }
    
    $queue->update($data);

    // 2. 🔥 TRIGGER THE STICKY NOTIFICATION
    // We only send this if the status is 'serving' and the student has a token
    if ($status === 'serving' && $queue->user && $queue->user->fcm_token) {
        try {
            FcmService::sendStickyNotification(
                $queue->user->fcm_token, 
                "Your Ticket is Being Served!", 
                "Ticket #{$queue->ticket_number}: Please proceed to the counter."
            );
            Log::info("Sticky Notification sent to user: " . $queue->user->id);
        } catch (\Exception $e) {
            Log::error("FCM Notification failed: " . $e->getMessage());
        }
    }

    // 3. Keep your existing Broadcast event for the TV/Dashboard
    try {
        event(new QueueUpdated("refresh")); 
        Log::info("Broadcast event triggered for ticket " . $id);
    } catch (\Exception $e) {
        Log::error("Broadcast error: " . $e->getMessage());
    }

    return response()->json($queue);
}













public function getTicketStatus($id) {
    $myTicket = Queue::findOrFail($id);

    $stats = $this->calculateTicketStats($myTicket);

    $peopleAhead = $stats['people_ahead'];
    $estimatedWait = $stats['estimated_wait_time'];

    $nowServing = Queue::where('department', $myTicket->department)
        ->where('status', 'serving')
        ->whereDate('created_at', today())
        ->orderBy('updated_at', 'desc')
        ->first();

        $completed = Queue::where('department', $myTicket->department)
        ->where('status', 'completed')
        ->whereDate('created_at', today())
        ->orderBy('completed_at', 'desc')
        ->take(2)
        ->get();

    // 2. Get whoever is Serving
    $serving = Queue::where('department', $myTicket->department)
        ->where('status', 'serving')
        ->whereDate('created_at', today())
        ->get();

    // 3. Get the next 5 Pending (Sorted by Priority then Queue Number)
    $upcoming = Queue::where('department', $myTicket->department)
        ->where('status', 'pending')
        ->whereDate('created_at', today())
        ->orderBy('priority_level', 'desc')
        ->orderBy('queue_number', 'asc')
        ->take(5)
        ->get();

    // Merge them into one neighborhood list
    $neighborhood = $completed->merge($serving)->merge($upcoming);

    return response()->json([
        'ticket' => $myTicket,
        'people_ahead' => $peopleAhead,
        'estimated_wait_time' => (int)$estimatedWait,
        'now_serving' => $nowServing ? $nowServing->queue_number : '---',
        'neighborhood' => $neighborhood->map(function($q) use ($myTicket) {
            return [
                'id' => $q->id,
                'queue_number' => $q->queue_number,
                'status' => $q->status,
                'student_name' => $this->maskName($q->student_name),
                'is_me' => $q->id == $myTicket->id,
                'priority' => $q->priority,
                'purpose' => $q->purpose
            ];
        })
    ]);
}




private function maskName($name) {
    $parts = explode(' ', $name);
    $first = $parts[0];
    $last = isset($parts[1]) ? $parts[1][0] . '.' : '';
    return substr($first, 0, 1) . '*** ' . $last;
}




private function calculateTicketStats($myTicket) {
        
$avgServiceMinutes = Queue::where('status', 'completed')
    ->where('department', $myTicket->department)
    ->whereDate('created_at', today())
    ->whereNotNull('started_at')
    ->whereNotNull('completed_at')
    ->latest('completed_at')
    ->take(10) 
    ->get()
    ->avg(function($q) {
        
        $diff = $q->started_at->diffInMinutes($q->completed_at);
        return $diff > 0 ? $diff : 3; 
    }) ?? 8; 


    $peopleAhead = Queue::where('department', $myTicket->department)
    ->where('status', 'pending')
    ->whereDate('created_at', today())
    ->where(function ($query) use ($myTicket) {
    
       
        $query->where('priority_level', '>', $myTicket->priority_level)
              ->orWhere(function ($q) use ($myTicket) {
                  $q->where('priority_level', $myTicket->priority_level)
                    ->where('queue_number', '<', $myTicket->queue_number);
              });
    })
    ->count();


    $estimatedWait = round($peopleAhead * $avgServiceMinutes);
    
   
    $isSomeoneBeingServed = Queue::where('department', $myTicket->department)
        ->where('status', 'serving')
        ->whereDate('created_at', today())
        ->exists();

   
    if ($peopleAhead == 0 && $myTicket->status == 'pending' && $isSomeoneBeingServed) {
        $estimatedWait = ceil($avgServiceMinutes / 2); 
    }

    return [
        'people_ahead' => $peopleAhead,
        'estimated_wait_time' => (int)$estimatedWait,
    ];
}



    public function getUserHistory() {
    $history = Queue::where('user_id', auth()->id())
        ->orderBy('created_at', 'desc')
        ->get();

    return response()->json($history);
}



public function getActiveTickets(Request $request) {
    $user = $request->user();

    $tickets = Queue::where('user_id', $user->id)
                ->whereIn('status', ['pending', 'serving'])
                ->orderBy('created_at', 'desc')
                ->get();

    // 🚀 THE PRODUCTION INJECTION
    $ticketsWithStats = $tickets->map(function($ticket) {
        // 1. Calculate stats for THIS specific ticket
        $stats = $this->calculateTicketStats($ticket);
        
        // 2. Merge the stats into the ticket data
        $ticketData = $ticket->toArray();
        $ticketData['people_ahead'] = $stats['people_ahead'];
        $ticketData['estimated_wait_time'] = $stats['estimated_wait_time'];
        
        return $ticketData;
    });

    return response()->json([
        'has_active' => $tickets->isNotEmpty(),
        'tickets' => $ticketsWithStats, // Now sending the version with stats!
        'count' => $tickets->count()
    ]);
}


public function cancel($id) 
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
        ->whereIn('status', ['completed', 'cancelled','pending','serving'])
        // ✅ High-Level Filtering logic
        ->when($date, function ($query, $date) {
            return $query->whereDate('updated_at', $date);
        })
        ->orderBy('updated_at', 'desc')
        ->paginate(15);

    return response()->json($history);
}



public function demoteStudent($id) {
    return DB::transaction(function () use ($id) {
        $ticket = Queue::findOrFail($id);

        // 1. Find the highest queue_number in the REGULAR line for this department today
        $lastRegularNumber = Queue::where('department', $ticket->department)
            ->whereDate('created_at', today())
            ->where('priority_level', 0) // Regulars
            ->max('queue_number') ?? 0;

        // 2. Update the ticket: Change to Regular and move to the end
        $ticket->update([
            'priority' => 'Regular',
            'priority_level' => 0,
            'queue_number' => $lastRegularNumber + 1,
            'status' => 'pending' // Ensure they are back to pending if they were 'serving'
        ]);

        // 3. Notify everyone (Phone & Dashboard)
        broadcast(new QueueUpdated("refresh"))->toOthers();

        return response()->json(['message' => 'Student demoted to regular queue', 'new_number' => $ticket->queue_number]);
    });
}
}