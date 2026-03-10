<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\SessionService;
use App\Http\Resources\SessionResource;
use Illuminate\Http\Request;

class QueueSessionController extends Controller {
    protected $service;

    public function __construct(SessionService $service) {
        $this->service = $service;
    }

    public function index(Request $request) {
        $sessions = $this->service->getHistory($request->all());
        return SessionResource::collection($sessions);
    }

    public function show($id) {
        $session = $this->service->getDetails($id);
        return new SessionResource($session);
    }
}