<?php

namespace App\Repositories;

use App\Models\QueueSession;
use App\Models\Queue;

class SessionRepository {
    public function getSessions($filters) {
        $query = QueueSession::query();

        if (!empty($filters['department'])) {
            $query->where('department', 'like', "%{$filters['department']}%");
        }

        if (!empty($filters['start_date']) && !empty($filters['end_date'])) {
            $query->whereBetween('created_at', [$filters['start_date'].' 00:00:00', $filters['end_date'].' 23:59:59']);
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

   public function findSessionWithAttendees($id) {
    $session = QueueSession::findOrFail($id);
    
    // Define the time window for this specific session
    $startTime = $session->created_at;
    $endTime = $session->is_active ? now() : $session->updated_at;

    $attendees = Queue::where('department', $session->department)
        ->whereBetween('created_at', [$startTime, $endTime])
        ->get();

    // 🔥 This "forces" the relation to be recognized as loaded
    $session->setRelation('attendees', $attendees);
    
    return $session;
}
}