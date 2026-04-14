<?php

namespace App\Repositories;

use App\Models\Queue;
use App\Models\User;
use Carbon\Carbon;

class QueueRepository
{
    /**
     * Fetch records for a specific department and date.
     */
   // App\Repositories\QueueRepository.php
public function getQueuesByDepartments(array $departments, array $statuses, int $offset = 0)
{
    $query = Queue::whereIn('department', $departments)
        ->whereDate('created_at', Carbon::today())
        ->whereIn('status', $statuses)
        ->orderBy('priority_level', 'desc') // Priority 1 jumps to top
        ->orderBy('queue_number', 'asc');

    if ($offset > 0) {
        $query->offset($offset)->limit(100); // Limit is required by SQL when using Offset
    }

    return $query->get();
}

public function countDepartmentLive(string $department, array $statuses)
{
    return Queue::where('department', $department)
        ->whereDate('created_at', Carbon::today())
        ->whereIn('status', $statuses)
        ->count();
}
}