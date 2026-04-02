<?php 



namespace App\Repositories;

use App\Models\User;
use Spatie\Activitylog\Models\Activity;

class AdminDashboardRepository
{
    public function getStaffByOfficeAndDepartments(array $departments)
{
    return User::where('role', 'staff')
        ->whereIn('department', $departments)
        ->get();
}
public function getStaffLogs(int $userId)
{
    return Activity::where('causer_id', $userId)
        ->with('subject') // This links to the Queue/Ticket they handled
        ->latest()
        ->paginate(10);
}

public function updateRelocation(User $user, ?string $department)
{
    $user->relocated_to = $department;
    $user->save();
    return $user;
}
}