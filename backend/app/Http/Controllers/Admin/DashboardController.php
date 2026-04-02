<?php


namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AdminDashboardService;
use Illuminate\Http\Request;
use App\Http\Resources\AdminDashboardResource;
use App\Models\User;
use App\Http\Resources\UserResource;

class DashboardController extends Controller
{

    protected $adminDashboardService;

    public function __construct(AdminDashboardService $adminDashboardService)
    {
        $this->adminDashboardService = $adminDashboardService;
    }

    public function index()
    {
        $performanceData = $this->adminDashboardService->getRegistrarStaffPerformance();

      
        return AdminDashboardResource::collection($performanceData);
    }

   
public function logs($id)
{
    $logs = $this->adminDashboardService->getStaffActivity($id);
    
 
    return response()->json($logs);
}

public function relocateStaff(Request $request, User $user)
{
    $validated = $request->validate([
        'relocated_to' => 'nullable|string'
    ]);

    $updatedUser = $this->adminDashboardService->relocateStaffMember($user, $validated['relocated_to']);

    return new UserResource($updatedUser);
}
}