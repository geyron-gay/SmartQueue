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

    // We build the list of departments the user has access to
    $targetDepartments = [$user->department];

    if ($user->relocated_to) {
        $targetDepartments[] = $user->relocated_to;
    }

    return $this->queueRepo->getQueuesByDepartments($targetDepartments, $statuses);
}
}