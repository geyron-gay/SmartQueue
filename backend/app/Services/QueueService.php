<?php

namespace App\Services;

use App\Repositories\QueueRepository;
use App\Models\User;

class QueueService
{
    public function __construct(
        protected QueueRepository $queueRepo
    ) {}

   // App\Services\QueueService.php
public function getActiveDepartmentWork(User $user)
{
    $statuses = ['pending', 'serving', 'cancelled', 'completed', 'noshow'];
    
    // 1. Always get 100% of Home Department
    $homeQueues = $this->queueRepo->getQueuesByDepartments([$user->department], $statuses);

    // 2. Handle Relocation Slice
    $relocatedQueues = collect();
    if ($user->relocated_to) {
        $totalInTarget = $this->queueRepo->countDepartmentLive($user->relocated_to, $statuses);

        if ($totalInTarget > 10) {
            // Apply the 70% Skip (Offset)
            $offset = floor($totalInTarget * 0.70);
            $relocatedQueues = $this->queueRepo->getQueuesByDepartments(
                [$user->relocated_to], 
                $statuses, 
                $offset
            );
        } else {
            // Small queue? No offset, just help everyone.
            $relocatedQueues = $this->queueRepo->getQueuesByDepartments([$user->relocated_to], $statuses);
        }
    }

    // Merge and return
    return $homeQueues->merge($relocatedQueues);
}
}