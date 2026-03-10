<?php

namespace App\Services;

use App\Repositories\QueueRepository;
use App\Models\User;

class QueueService
{
    public function __construct(
        protected QueueRepository $queueRepo
    ) {}

    public function getActiveDepartmentWork(User $user)
    {
        // Business Rule: What statuses do we care about today?
        $statuses = ['pending', 'serving', 'cancelled'];

        // Business Rule: We only show queues belonging to the user's department
        return $this->queueRepo->getDepartmentQueuesByStatus(
            $user->department, 
            $statuses
        );
    }
}