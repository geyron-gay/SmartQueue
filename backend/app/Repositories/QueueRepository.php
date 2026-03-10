<?php

namespace App\Repositories;

use App\Models\Queue;
use Carbon\Carbon;

class QueueRepository
{
    /**
     * Fetch records for a specific department and date.
     */
    public function getDepartmentQueuesByStatus(string $department, array $statuses)
    {
        return Queue::where('department', $department)
            ->whereDate('created_at', Carbon::today())
            ->whereIn('status', $statuses)
            ->orderBy('priority_level', 'desc')
            ->orderBy('queue_number', 'asc')
            ->get();
    }
}