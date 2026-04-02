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
public function getQueuesByDepartments(array $departments, array $statuses)
{
    return Queue::whereIn('department', $departments) // Changed from where to whereIn
        ->whereDate('created_at', Carbon::today())
        ->whereIn('status', $statuses)
        ->orderBy('priority_level', 'desc')
        ->orderBy('queue_number', 'asc')
        ->get();
}
}