<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Queue;

class ProfileController extends Controller
{
    public function getStudentStats(Request $request) {
    $user = $request->user();

    // 1. Total Queues Joined (Lifetime)
    $totalQueues = Queue::where('user_id', $user->id)->count();

    // 2. Time Saved (Estimated)
    // Logic: Sum of (Average Service Time) for all completed tickets
    // If you don't track exact "saved" time, we use the average (e.g., 10 mins per ticket)
    $completedCount = Queue::where('user_id', $user->id)->where('status', 'completed')->count();
    $timeSavedMinutes = $completedCount * 10; // Assuming 10 mins saved by not standing in physical line
    $timeSavedHours = round($timeSavedMinutes / 60, 1);

    // 3. Current Account Status
    // You can check if they have a pending ticket or if their account is "Verified"
    $hasActive = Queue::where('user_id', $user->id)
                      ->whereIn('status', ['pending', 'serving'])
                      ->exists();

    return response()->json([
        'total_queues' => $totalQueues,
        'hours_saved' => $timeSavedHours,
        'account_status' => $hasActive ? 'In Queue' : 'Active'
    ]);
}
}
