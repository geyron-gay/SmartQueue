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
            'department' => Auth::user()->department ?? 'General', 
            'is_active'  => true,
        ]);

        event(new \App\Events\QueueUpdated([
            'is_broadcast' => true,
            'message' => $broadcast->message,
            'type' => $broadcast->type,
            'department' => $broadcast->department
        ]));
        
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

    $broadcasts = Broadcast::where('is_active', true)
        ->whereDate('created_at', today())
        ->latest()
        ->get();

    return response()->json($broadcasts);
}

public function getHistory() {
    $user = auth()->user();

    if($user->role === 'admin') {
        // Admins see all broadcasts
        $broadcasts = Broadcast::where('is_active', true)->latest()->get();
    } else {
        // Regular users see their department or 'General'
        $broadcasts = Broadcast::where('is_active', true)
        ->where(function($query) use ($user) {
            $query->where('department', $user->department)
                  ->orWhere('department', 'General');
        })
        ->latest()
        ->get();

    }

    // Total announcements
    $totalSent = $broadcasts->count();

    // Total announcements today
    $today = now()->toDateString(); // 'YYYY-MM-DD'
    $totalToday = $broadcasts->filter(function($b) use ($today) {
        return $b->created_at->toDateString() === $today;
    })->count();

    // Count by type
    $emergCount   = $broadcasts->where('type', 'emergency')->count();
    $infoCount    = $broadcasts->where('type', 'info')->count();
    $warningCount = $broadcasts->where('type', 'warning')->count();

    // Most recent time
    $lastTime = $broadcasts->first()?->created_at->format('Y-m-d H:i:s') ?? '—';

    // Return JSON
    return response()->json([
        'history'      => $broadcasts,
        'totalSent'    => $totalSent,
        'totalToday'   => $totalToday,
        'emergCount'   => $emergCount,
        'infoCount'    => $infoCount,
        'warningCount' => $warningCount,
        'lastTime'     => $lastTime,
    ]);
}
}
