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
use App\Http\Resources\QueueResource;
use App\Services\QueueService;

    
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
        'department' => 'required|string',
        'year_level' => 'required|string',
    ]);

    
    $alreadyInThisDept = Queue::where('user_id', $user->id)
                        ->where('department', $request->department)
                        ->whereIn('status', ['pending', 'serving'])
                        ->exists();

    if ($alreadyInThisDept) {
        return response()->json(['error' => "You are already in line for {$request->department}!"], 403);
    }

    $lastPersonInDept = Queue::where('department', $request->department)
                        ->whereDate('created_at', today())
                        ->latest('id')
                        ->first();
    
    $nextNumberForThisDept = $lastPersonInDept ? $lastPersonInDept->queue_number + 1 : 1;


    $firstTicket = Queue::where('user_id', $user->id)
                        ->whereIn('status', ['pending', 'serving'])
                        ->orderBy('created_at', 'asc')
                        ->latest('id')
                        ->first();

    if ($firstTicket) {

        $gap = $nextNumberForThisDept - $firstTicket->queue_number;

  
        if ($gap < -5 && $firstTicket->status === 'pending') {
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

     $priorityVerification = $user->priorityVerification;

$priorityScore = ($priorityVerification && $priorityVerification->status === 'verified') ? 1 : 0;
        $queue = Queue::create([
        'user_id'      => $user->id,
        'student_name' => $user->name,
        'student_id'   => $user->student_id ?? 'VISITOR',
        'purpose'      => $request->purpose,
        'priority_level' => $priorityScore,
        'queue_number' => $nextNumberForThisDept, 
        'status'       => 'pending',
        'department'   => $request->department,
    ]);

        $session->increment('current_count');
        $stats = $this->calculateTicketStats($queue);

   $payload = $queue->toArray();
$payload['people_ahead'] = $stats['people_ahead'] ?? 0;
$payload['estimated_wait_time'] = $stats['estimated_wait_time'] ?? 0;

// Use 'event' or 'broadcast' - just make sure it's the object, not a string!
event(new QueueUpdated($payload));

    return response()->json([
        'queue' => $queue,
        'stats' => $stats // Sending stats back to app UI too!
    ]);
    });
}







public function index(QueueService $queueService) 
{
    $user = auth()->user();
    
    // The Service handles the logic, the Repository handles the Query
    $queues = $queueService->getActiveDepartmentWork($user);

    // The Resource handles the JSON formatting
    return QueueResource::collection($queues);
}









public function updateStatus(Request $request, $id) {
    // 1. Load the queue ticket along with the student (user)
    $queue = Queue::with('user')->findOrFail($id);
    $status = $request->status;
    $autoCall = $request->auto_call ?? false;


        if ($status === 'serving') {

        $next = Queue::where('department', $queue->department)
            ->where('status', 'pending')
            ->orderBy('priority_level', 'desc')
            ->orderBy('queue_number', 'asc')
            ->first();

        // ❌ BLOCK if not next in line
        if (!$next || $queue->id !== $next->id) {
            return response()->json([
                'message' => '⚠️ You can only call the next student in line.'
            ], 403);
        }
    }

    $updateData = ['status' => $status];

     if ($status === 'serving') {
        $updateData['started_at'] = now();
    } elseif (in_array($status, ['completed', 'cancelled'])) {
        $updateData['completed_at'] = now();
    }
    
    $queue->update($updateData);

if ($status === 'completed' && $autoCall) {

    dispatch(function () use ($queue) {

        $next = Queue::where('department', $queue->department)
            ->where('status', 'pending')
            ->orderBy('priority_level', 'desc')
            ->orderBy('queue_number', 'asc')
            ->first();

        if ($next) {
            $next->update([
                'status' => 'serving',
                'started_at' => now()
            ]);

            event(new QueueUpdated($next->toArray()));
        }

    })->delay(now()->addSeconds(3)); // ⏱️ delay here
}


    // 2. 🔥 CALCULATE "PEOPLE AHEAD" (Senior Touch)
    // Count tickets in the same department that are still 'pending' and older than this one
    $peopleAhead = Queue::where('department', $queue->department)
        ->where('status', 'pending')
        ->where('id', '<', $queue->id)
        ->count();

    // 3. 🔥 TRIGGER THE DATA-RICH BROADCAST
    try {
        // Instead of "refresh", we send the whole $queue object + metadata
        $payload = $queue->toArray();
        $payload['people_ahead'] = $peopleAhead;
        $payload['estimated_wait_time'] = $peopleAhead * 5; // Simple 5-min per person logic

        event(new QueueUpdated($payload)); 
        
        Log::info("Broadcast event triggered with DATA for ticket " . $id);
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

    $cancelled = Queue::where('department', $myTicket->department)
        ->where('status', 'cancelled')
        ->whereDate('created_at', today())
        ->get();

    $noShow = Queue::where('department', $myTicket->department)
        ->where('status', 'noshow')
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
  $neighborhood = $completed
        ->merge($cancelled)
        ->merge($serving)
        ->merge($upcoming)
        ->merge($noShow)
        ->sortBy('queue_number')
        ->values();

    return response()->json([
        'ticket' => $myTicket,
        'people_ahead' => $peopleAhead,
        'started_at' => $myTicket->started_at, 
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
                ->whereDate('created_at', today())
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

if(auth()->user()->role === 'staff') {
    $results = Queue::where('department', auth()->user()->department)
        -> where(function($q) use ($search) {           
            $q->where('student_id', 'LIKE', "%" . strtolower($search) . "%")
              ->orWhere('student_name', 'LIKE', "%" . strtolower($search) . "%");            
        })
        ->get();
} 
if(auth()->user()->role === 'admin') {
    $results = Queue::where(function($q) use ($search) {
            $q->where('student_id', 'LIKE', "%" . strtolower($search) . "%")
              ->orWhere('student_name', 'LIKE', "%" . strtolower($search) . "%");            
        })
        ->get();
}

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