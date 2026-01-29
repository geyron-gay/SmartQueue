<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\QueueSession;
use App\Events\QueueUpdated;

class SessionController extends Controller
{
    // SessionController.php
public function startSession(Request $request) {
    // 1. Close any old active sessions for this user
    QueueSession::where('user_id', auth()->id())->update(['is_active' => false]);

    // 2. Create the new "Rule Set" for today
    $session = QueueSession::create([
        'user_id' => auth()->id(),
        'department' => $request->department,
        'target_year' => $request->target_year,
        'capacity_limit' => $request->capacity_limit,
        'is_active' => true
    ]);

    // 📣 Broadcast to students that a new counter is OPEN!
    broadcast(new QueueUpdated("session_changed"))->toOthers();

    return response()->json($session);
}


public function current() {
    $session = QueueSession::where('user_id', auth()->id())
                ->where('is_active', true)
                ->first();
                
    return $session ? response()->json($session) : response()->json(null, 404);
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
        broadcast(new QueueUpdated("session_closed"))->toOthers();
    }

    return response()->json(['message' => 'Shift ended']);
}
}
