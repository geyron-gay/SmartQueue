<?php 

// app/Services/StaffManagementService.php

namespace App\Services;

use App\Repositories\AdminDashboardRepository;
use Spatie\Activitylog\Models\Activity;
use Carbon\Carbon;
use App\Models\User;

class AdminDashboardService
{
    protected $userRepo;

    public function __construct(AdminDashboardRepository $userRepo)
    {
        $this->userRepo = $userRepo;
    }

    public function getRegistrarStaffPerformance()
    {
        $staffMembers = $this->userRepo->getStaffByOfficeAndDepartments(['Registrar-IT', 'Registrar-Crim','Registrar-BSOA','Registrar-CAS']);

        return $staffMembers->map(function ($staff) {
            // Business Logic: Count served today
            $staff->served_count = Activity::where('causer_id', $staff->id)
                ->where('description', 'updated')
                ->whereDate('created_at', Carbon::today())
                ->count();

            // Business Logic: Check Heartbeat
            $lastAction = Activity::where('causer_id', $staff->id)->latest()->first();
            
            $staff->is_online = $lastAction && $lastAction->created_at->diffInMinutes(now()) < 15;
            $staff->last_action_formatted = $lastAction ? $lastAction->created_at->diffForHumans() : 'Never';

            return $staff;
        });
    }

    public function getStaffActivity(int $userId)
{
    return $this->userRepo->getStaffLogs($userId);
}

// App\Services\AdminService.php
public function relocateStaffMember(User $user, ?string $targetDept)
{
    // Production Rule: You could add logic here to check if the 
    // targetDept actually exists before moving the staff.

    activity()
   ->performedOn($user)
   ->causedBy(auth()->user())
   ->withProperties(['new_dept' => $targetDept])
   ->log("Staff relocated to " . ($targetDept ?? 'Home Station'));
   
    return $this->userRepo->updateRelocation($user, $targetDept);
}
}