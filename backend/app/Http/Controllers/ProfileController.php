<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Queue;
use Illuminate\Support\Facades\Hash;

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

public function updateProfile(Request $request) {
    $user = $request->user();

    // Check if the current password provided matches the DB
    if (!Hash::check($request->current_password, $user->password)) {
        return response()->json(['errors' => ['current_password' => ['Incorrect current password.']]], 422);
    }

    // Now proceed with the update...
    $user->update($request->only('name', 'email', 'username', 'department'));

    if ($request->filled('new_password')) {
        $user->password = Hash::make($request->new_password);
        $user->save();
    }

    return response()->json(['user' => $user]);
}
}
