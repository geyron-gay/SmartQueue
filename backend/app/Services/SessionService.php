<?php

namespace App\Services;

use App\Repositories\SessionRepository;

class SessionService {
    protected $repo;

    public function __construct(SessionRepository $repo) {
        $this->repo = $repo;
    }

    public function getHistory($filters) {
        return $this->repo->getSessions($filters);
    }

    public function getDetails($id) {
        return $this->repo->findSessionWithAttendees($id);
    }
}