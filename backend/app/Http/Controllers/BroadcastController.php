<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Broadcast;
   use Illuminate\Support\Facades\Log; // Import this at the top!
use Illuminate\Support\Facades\Auth;

class BroadcastController extends Controller
{


public function createBroadcast(Request $request) {
    try {
        $request->validate([
            'message' => 'required|string|max:255',
            'type' => 'required|in:info,warning,emergency',
        ]);

        // LOG 1: Check if user is actually authenticated
        if (!Auth::check()) {
            Log::error('Broadcast Error: User is not authenticated.');
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $broadcast = Broadcast::create([
            'user_id'    => Auth::id(),
            'message'    => $request->message,
            'type'       => $request->type,
            'department' => Auth::user()->department ?? 'General', // Fallback
            'is_active'  => true,
        ]);

        return response()->json([
            'success' => true,
            'data' => $broadcast
        ]);

    } catch (\Exception $e) {
        // LOG 2: This captures the EXACT error (table missing, column typo, etc.)
        Log::error('BROADCAST FAILED: ' . $e->getMessage());
        Log::error($e->getTraceAsString()); // This shows the line number

        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
}

public function getActiveBroadcasts() {
    // Fetch active notices for the student display
    return response()->json(Broadcast::where('is_active', true)->latest()->get());
}
}
