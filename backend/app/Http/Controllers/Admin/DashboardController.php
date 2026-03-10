<?php


namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AdminDashboardService;
use App\Http\Resources\AdminDashboardResource;

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
}