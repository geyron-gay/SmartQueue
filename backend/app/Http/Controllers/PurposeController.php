<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Resources\PurposeResource;
use App\Services\PurposeManagementService;
use App\Models\Purpose;

class PurposeController extends Controller
{
     protected $purposeService;

    public function __construct(PurposeManagementService $purposeService) {
        $this->purposeService = $purposeService;
    }

    public function index(Request $request) {
        $purposes = $this->purposeService->getPurposesForDashboard($request->user());
        return PurposeResource::collection($purposes);
    }

        public function store(Request $request) {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'department' => 'required|string|max:255',
            'default_service_time' => 'required|integer|min:0',
            'buffer_time' => 'required|integer|min:0',
            'max_extension_limit' => 'required|integer|min:0',
        ]);

        $user = $this->purposeService->createPurpose($validated);
        return new PurposeResource($user);
    }

    public function update(Request $request, Purpose $purpose) {
        try {
            $this->purposeService->updatePurpose($purpose, $request->all(), $request->user());
            return response()->json(['message' => 'Purpose updated']);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], $e->getCode() ?: 400);
        }
    }   

    public function destroy(Purpose $purpose, Request $request) {
        try {
            $this->purposeService->deletePurpose($purpose, $request->user());
            return response()->json(['message' => 'Purpose deleted']);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], $e->getCode() ?: 400);
        }
    }
}
