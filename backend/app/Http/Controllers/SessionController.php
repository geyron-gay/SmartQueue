<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\QueueSession;
use App\Events\QueueUpdated;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use App\Models\Queue;

class SessionController extends Controller
{
    // SessionController.php

public function startSession(Request $request)
{
    // ✅ 1. Validate input
    $validated = $request->validate([
        'department' => 'required|string',
        'target_year' => 'required|string',
        'capacity_limit' => 'required|integer|min:1|max:500',
        'stop_time_at' => 'nullable|required|date|after:now', // optional but powerful
    ]);


    $start = Carbon::now();
$stop = Carbon::parse($request->stop_time_at);

$durationMinutes = $start->diffInMinutes($stop);

if ($durationMinutes < 2) {
    throw ValidationException::withMessages([
        'stop_time_at' => ['Minimum session time is 2 minutes.']
    ]);
}

if ($durationMinutes > 480) {
    throw ValidationException::withMessages([
        'stop_time_at' => ['Maximum session time is 8 hours.']
    ]);
}

    // ✅ 2. Close previous sessions (ONLY active ones)
    QueueSession::where('user_id', auth()->id())
        ->where('is_active', true)
        ->update([
            'is_active' => false,
            'stop_time_at' => Carbon::now()
        ]);

    // ✅ 3. Define times
    $startTime = Carbon::now();

    $stopTime = $validated['stop_time_at']
        ? Carbon::parse($validated['stop_time_at'])
        : $startTime->copy()->addHours(8);

    // ✅ 4. Create session
    $session = QueueSession::create([
        'user_id' => auth()->id(),
        'department' => $validated['department'],
        'target_year' => $validated['target_year'],
        'capacity_limit' => $validated['capacity_limit'],
        'stop_time_at' => $stopTime,
        'is_active' => true
    ]);

    // 📣 Broadcast update
    broadcast(new QueueUpdated("refresh"))->toOthers();

    return response()->json($session);
}


public function current()
{
    $user = auth()->user();

    if (!$user) {
        return response()->json(['error' => 'Not Authenticated'], 401);
    }

    $session = QueueSession::where('user_id', $user->id)
                ->where('is_active', true)
                ->whereDate('created_at', today())
                ->first();

    if (!$session) {
        return response()->json(['session' => null], 200);
    }

    return response()->json([
        'session' => [
            'id'             => $session->id,
            'department'     => $session->department,
            'target_year'    => $session->target_year,
            'created_at'     => $session->created_at,
            'capacity_limit' => (int) $session->capacity_limit,
            'current_count'  => (int) $session->current_count,
            'is_autocall_enabled' => (bool) $session->is_autocall_enabled,
            'is_full_auto' => (bool) $session->is_full_auto,
            'is_paused' => (bool) $session->is_paused,
            'stop_time_at' => $session->stop_time_at ? $session->stop_time_at->toIso8601String() : null,
            'batch_size' => (int) $session->batch_size,
       
        
        ]
    ], 200);
}

public function update(Request $request, $id)
{
    $session = QueueSession::findOrFail($id);

    $data = $request->validate([
        'is_autocall_enabled' => 'boolean',
        'is_full_auto'        => 'boolean',
        'is_paused'           => 'boolean',
    ]);

    // --- PAUSE / RESUME LOGIC ---
    if (isset($data['is_paused'])) {
        // CASE 1: Turning PAUSE ON
        if ($data['is_paused'] === true && !$session->is_paused) {
            $data['paused_at'] = now();
        } 
        
        // CASE 2: Turning PAUSE OFF (Resuming)
        else if ($data['is_paused'] === false && $session->is_paused) {
            // 1. Calculate how long they were paused
            $pauseDurationSeconds = now()->diffInSeconds($session->paused_at);

            // 2. Find the student currently being served at this desk
            $activeStudent = Queue::where('queue_session_id', $session->id)
                ->where('status', 'serving')
                ->whereNotNull('expires_at')
                ->first();

            if ($activeStudent) {
                // 3. Add that "lost time" back to their expiry deadline
                $activeStudent->update([
                    'expires_at' => $activeStudent->expires_at->addSeconds($pauseDurationSeconds)
                ]);
            }

            // 4. Clear the timestamp so it's ready for the next pause
            $data['paused_at'] = null;
        }
    }

    // --- SAFETY SHUTDOWN ---
    // If Auto-Call is killed, everything nested under it must die too
    if (isset($data['is_autocall_enabled']) && $data['is_autocall_enabled'] === false) {
        $data['is_full_auto'] = false;
        $data['is_paused'] = false;
        $data['paused_at'] = null;
    }

    $session->update($data);

    return response()->json([
        'message' => 'Session updated',
        'session' => $session
    ]);
}



public function updateSession(Request $request, $id)
{
    $session = QueueSession::findOrFail($id);

    $validated = $request->validate([
        'capacity_limit' => 'nullable|integer|min:1',
        'stop_time_at' => 'nullable|date',
    ]);

    // ✅ only validate if actually sent
    if ($request->has('stop_time_at') && $validated['stop_time_at']) {

        $stopTime = Carbon::parse($validated['stop_time_at']);
        $now = Carbon::now();

        if ($stopTime->lessThanOrEqualTo($now)) {
            return response()->json([
                'message' => 'Stop time must be in the future.'
            ], 422);
        }

        if ($stopTime->lessThan($now->copy()->addMinutes(30))) {
            return response()->json([
                'message' => 'Stop time must be at least 30 minutes from now.'
            ], 422);
        }
    }

    $session->update($validated);

    return response()->json([
        'message' => 'Session updated successfully',
        'session' => $session
    ]);
}

public function updateBatchSize(Request $request)
{
    $session = QueueSession::where('department', $request->department)
                ->where('is_active', true)
                ->firstOrFail();

    $session->update(['batch_size' => $request->batch_size]);

    return response()->json(['message' => 'Batch size updated']);
}


public function end(Request $request) {
    // 1. Find the active session for this staff member
    $session = QueueSession::where('user_id', auth()->id())
                ->where('is_active', true)
                ->first();

    if ($session) {
        // 2. Set it to inactive
        $session->update(['is_active' => false]);
        
        // 3. Broadcast to students so the "Office" disappears from their phone instantly!
        broadcast(new QueueUpdated("refresh"))->toOthers();
    }

    return response()->json(['message' => 'Shift ended']);
}
}
