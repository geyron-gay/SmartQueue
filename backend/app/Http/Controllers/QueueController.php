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
use App\Services\PenaltyService;
use App\Models\NoShowLog;   

    
class QueueController extends Controller
{
 
public function joinQueue(Request $request , PenaltyService $penaltyService) {

    $user = auth()->user();

    $penalty = $penaltyService->getPenaltyStatus($user->id);

    Log::info("User {$user->id} penalty check: " . json_encode($penalty['is_restricted']));
    
    if ($penalty['is_restricted']) {
        return response()->json([
            'error' => "Access Denied",
            'message' => $penalty['reason'],
            'unlocks_at' => $penalty['unlocks_at'],
            'minutes_remaining' => $penalty['minutes_remaining'],
            'no_show_count' => $penalty['count']
        ], 403); 
    }

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
                        ->whereDate('created_at', today())
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
                        ->whereDate('created_at', today())
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

    $purposeRecord = \App\Models\Purpose::where('name', $request->purpose)
                    ->where('department', $request->department)
                    ->first();

    if (!$purposeRecord) {
        return response()->json(['error' => 'Invalid purpose selected.'], 422);
    }

    $priorityVerification = $user->priorityVerification;

    $priorityScore = ($priorityVerification && $priorityVerification->status === 'approved') ? 1 : 0;
    $queue = Queue::create([
    'user_id'      => $user->id,
    'queue_session_id' => $session->id,
    'student_name' => $user->name,
    'student_id'   => $user->student_id ?? 'VISITOR',
    'purpose'      => $request->purpose,
    'priority_level' => $priorityScore,
    'queue_number' => $nextNumberForThisDept, 
    'status'       => 'pending',
    'department'   => $request->department,
    'purpose_id'   => $purposeRecord->id,
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









public function updateStatus(Request $request, $id) 
{
    $queue = Queue::with(['user', 'purpose_ref'])->findOrFail($id);
    $session = \App\Models\QueueSession::where('department', $queue->department)
                ->where('is_active', true)
                ->first();

    $status = $request->status;

    Log::info("--- START updateStatus for Ticket #{$queue->queue_number} ---");
    Log::info("Requested Status: {$status}");

    return DB::transaction(function () use ($session, $queue, $status) {
        $updateData = ['status' => $status];

        // 1. Validation & Heartbeat Initiation
        if ($status === 'serving') {
            Log::info("Status is 'serving'. Checking session gates...");
            $next = Queue::where('department', $queue->department)
                ->where('status', 'pending')
                ->orderBy('priority_level', 'desc')
                ->orderBy('queue_number', 'asc')
                ->first();

            if (!$next || $queue->id !== $next->id) {
                return response()->json(['message' => '⚠️ You can only call the next student.'], 403);
            }

            Log::info("Session exists: " . ($session ? 'YES' : 'NO'));
            if ($session) {
                Log::info("is_full_auto: " . ($session->is_full_auto ? 'TRUE' : 'FALSE'));
                Log::info("is_paused: " . ($session->is_paused ? 'TRUE' : 'FALSE'));
            }

            $updateData['started_at'] = now();

           if ($session && $session->is_full_auto && !$session->is_paused) {
                
                // Debugging the relationship
                if (!$queue->purpose_ref) {
                    Log::error("CRITICAL: purpose_ref is NULL for this ticket. Check if purpose_id exists in the database.");
                }

                $duration = $queue->purpose_ref->default_service_time ?? 5;
                $updateData['expires_at'] = now()->addMinutes($duration);
                
                Log::info("SUCCESS: Setting expires_at to " . $updateData['expires_at']->toDateTimeString() . " (Duration: {$duration}m)");
            } else {
                Log::warning("HEARTBEAT SKIPPED: One of the session gates (full_auto/paused) failed.");
            }
        }
        

        // 2. Logging for No-Shows
        if ($status === 'noshow') {
            NoShowLog::create([
                'user_id'    => $queue->user_id,
                'queue_id'   => $queue->id,
                'department' => $queue->department,
                'staff_id'   => auth()->id(),
            ]);
        }

        // 3. Cleanup: If finished, clear the heartbeat
        if (in_array($status, ['completed', 'cancelled', 'noshow'])) {
            $updateData['completed_at'] = now();
            $updateData['expires_at'] = null; // Kill the timer
        }

        $queue->update($updateData);

        // 4. THE AUTO-CALL TRIGGER (Manual or System triggered)
        $isAutoCallOn = $session && $session->is_autocall_enabled;
        $isFinishingAction = in_array($status, ['completed', 'noshow']);

        if ($isFinishingAction && $isAutoCallOn) {
            $this->dispatchNextCall($queue->department);
        }

        $this->broadcastQueueUpdate($queue);
        return response()->json($queue);
    });
}

/**
 * Senior Move: Extract the dispatch logic to a private helper 
 * so it stays clean and reusable.
 */
// In QueueController.php

private function dispatchNextCall($department, $limit = 1) { // Default to 1
    dispatch(function () use ($department, $limit) {
        $session = \App\Models\QueueSession::where('department', $department)
                    ->where('is_active', true)
                    ->first();

        if (!$session || !$session->is_autocall_enabled) return;

        // Smart Check: Never exceed the batch size
        $currentServing = Queue::where('department', $department)
            ->where('status', 'serving')
            ->count();
            
        $maxCanCall = $session->batch_size - $currentServing;
        
        // Use whichever is smaller: the requested limit or the actual room left

        $finalLimit = ($limit === null) ? $maxCanCall : min($limit, $maxCanCall);

        $toCall = Queue::with('purpose_ref')
            ->where('department', $department)
            ->where('status', 'pending')
            ->orderBy('priority_level', 'desc')
            ->orderBy('queue_number', 'asc')
            ->limit($finalLimit)
            ->get();

            if ($toCall->isEmpty()) {
    Log::info("Auto-Call: No pending students left in {$department}. Desk will remain open.");
    return;
}

        foreach ($toCall as $next) {
            $updateData = [
                'status' => 'serving',
                'started_at' => now(),
            ];

            if ($session->is_full_auto && !$session->is_paused) {
                $duration = $next->purpose_ref->default_service_time ?? 5;
                $updateData['expires_at'] = now()->addMinutes($duration);
            }

            $next->update($updateData);
            event(new \App\Events\QueueUpdated($next->toArray()));
        }
    })->delay(now()->addSeconds(1));
}


private function broadcastQueueUpdate($queue) {
    try {
        $peopleAhead = Queue::where('department', $queue->department)
            ->where('status', 'pending')
            ->where('id', '<', $queue->id)
            ->count();

        $payload = $queue->toArray();
        $payload['people_ahead'] = $peopleAhead;
        $payload['estimated_wait_time'] = $peopleAhead * 5;

        event(new QueueUpdated($payload)); 
    } catch (\Exception $e) {
        Log::error("Broadcast error: " . $e->getMessage());
    }
}




public function callBatch(Request $request) 
{
    $limit = $request->input('limit', 1);
    $dept = $request->input('department');

    Log::info("--- START callBatch for Dept: {$dept} ---");

    return DB::transaction(function () use ($limit, $dept) {
        // 1. Get the students with their purpose details
        $nextStudents = Queue::with('purpose_ref')
            ->where('department', $dept)
            ->where('status', 'pending')
            ->orderBy('priority_level', 'desc')
            ->orderBy('queue_number', 'asc')
            ->limit($limit)
            ->lockForUpdate() 
            ->get();

        if ($nextStudents->isEmpty()) {
            Log::warning("callBatch: No pending students found for {$dept}");
            return response()->json(['message' => 'Queue is empty'], 404);
        }

        // 2. Fetch the Session settings once (efficiency!)
        $session = \App\Models\QueueSession::where('department', $dept)
                    ->where('is_active', true)
                    ->first();

        Log::info("Session Found: " . ($session ? 'YES' : 'NO'));
        if ($session) {
            Log::info("Full Auto: " . ($session->is_full_auto ? 'ON' : 'OFF'));
        }

        // 3. Process each student to set their individual expiry
        foreach ($nextStudents as $student) {
            $updateData = [
                'status' => 'serving',
                'started_at' => now(),
            ];

            // HEARTBEAT LOGIC
            if ($session && $session->is_full_auto && !$session->is_paused) {
                // If purpose_id is missing, this will default to 5
                $duration = $student->purpose_ref->default_service_time ?? 5;
                $updateData['expires_at'] = now()->addMinutes($duration);
                
                Log::info("Setting Expiry for Ticket #{$student->queue_number}: {$duration} mins");
            } else {
                Log::info("Heartbeat skipped for Ticket #{$student->queue_number} (Full Auto is OFF)");
            }

            // Update this specific student
            $student->update($updateData);
        }

        // 4. Broadcast the update
        $ids = $nextStudents->pluck('id');
        event(new QueueUpdated(['ids' => $ids, 'status' => 'serving']));

        Log::info("--- END callBatch: Called " . $nextStudents->count() . " students ---");

        return response()->json([
            'called_count' => $nextStudents->count(),
            'students' => $nextStudents
        ]);
    });
}



public function completeBatch(Request $request)
{
    $limit = $request->input('limit', 1);
    $dept = $request->input('department');

    return DB::transaction(function () use ($limit, $dept) {
        $servingTickets = Queue::where('department', $dept)
            ->where('status', 'serving')
            ->limit($limit)
            ->get();

        foreach ($servingTickets as $ticket) {
            $ticket->update([
                'status' => 'completed',
                'completed_at' => now(),
                'expires_at' => null // Critical: stop the heartbeat timer
            ]);
            
            $this->broadcastQueueUpdate($ticket);
        }

        // After clearing the batch, call a full new batch
        $session = \App\Models\QueueSession::where('department', $dept)->where('is_active', true)->first();
        if ($session && $session->is_autocall_enabled) {
            $this->dispatchNextCall($dept, $session->batch_size);
        }

        return response()->json(['message' => 'Batch completed and next called']);
    });
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
// 1. Get every single person in the department for TODAY
$neighborhood = Queue::where('department', $myTicket->department)
    ->whereDate('created_at', today())
    // Include all statuses you care about
    ->whereIn('status', ['completed', 'serving', 'pending', 'cancelled', 'noshow'])
    // Sort them globally so the list is in perfect numerical order
    ->orderBy('queue_number', 'asc')
    ->get();

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
    $date = $request->query('date');

    $history = Queue::where('department', $user->department)
        ->whereIn('status', ['completed', 'cancelled','pending','serving','noshow'])
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