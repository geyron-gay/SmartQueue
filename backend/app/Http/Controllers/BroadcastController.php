<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Broadcast;

class BroadcastController extends Controller
{
    public function createBroadcast(Request $request) {
    $request->validate([
        'message' => 'required|string|max:255',
        'type' => 'required|in:info,warning,emergency',
    ]);

    $broadcast = Broadcast::create([
        'user_id' => auth()->id(),
        'message' => $request->message,
        'type' => $request->type,
        'department' => auth()->user()->department,
        'is_active' => true,
    ]);

    // Senior Tip: In a full production app, you would trigger a Broadcast Event here:
    // event(new RealTimeMessage($broadcast));

    return response()->json([
        'success' => true,
        'message' => 'Broadcast sent successfully!',
        'data' => $broadcast
    ]);
}

public function getActiveBroadcasts() {
    // Fetch active notices for the student display
    return response()->json(Broadcast::where('is_active', true)->latest()->get());
}
}
