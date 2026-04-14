<?php

namespace App\Services;

use App\Models\NoShowLog;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class PenaltyService
{
    /**
     * Get the current penalty status for a user today.
     */
    public function getPenaltyStatus($userId)
    {
        // 1. Get all no-shows for THIS user TODAY
        $logs = NoShowLog::where('user_id', $userId)
            ->whereDate('created_at', Carbon::today())
            ->orderBy('created_at', 'desc')
            ->get();

            Log::info("User {$userId} has {$logs->count()} no-show(s) today.");

        $count = $logs->count();

        if ($count === 0) {
            return ['is_restricted' => false];
        }

        $lastNoShowAt = $logs->first()->created_at;
        $unlocksAt = null;
        $reason = "";

        // 2. THE BOUNCER MATH
        switch ($count) {
    case 1:
        // 🧪 TEST MODE: 2 Minutes
        $unlocksAt = $lastNoShowAt->addMinutes(2);
        $reason = "1st No-Show: 2-minute cooling period (Testing).";
        break;

    case 2:
        // 🧪 TEST MODE: 5 Minutes
        $unlocksAt = $lastNoShowAt->addMinutes(5);
        $reason = "2nd No-Show: 5-minute cooling period (Testing).";
        break;

    case 3:
        // 🧪 TEST MODE: 7 Minutes
        $unlocksAt = $lastNoShowAt->addMinutes(7);
        $reason = "3rd No-Show: 7-minute cooling period (Testing).";
        break;

    default:
        // Level 4+: Still block until tomorrow to show "Daily Reset"
        $unlocksAt = Carbon::tomorrow();
        $reason = "Critical No-Shows: Restricted until tomorrow.";
        break;
}

        // 3. Check if the penalty is still active
        $isRestricted = Carbon::now()->lt($unlocksAt);

        return [
            'is_restricted' => $isRestricted,
            'count' => $count,
            'unlocks_at' => $unlocksAt->toIso8601String(),
            'minutes_remaining' => $isRestricted ? Carbon::now()->diffInMinutes($unlocksAt) : 0,
            'reason' => $reason,
        ];
    }
}