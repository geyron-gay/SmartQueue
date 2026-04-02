<?php
// app/Repositories/UserRepository.php
namespace App\Repositories;

use App\Models\User;

class UserRepository
{
   public function getAdminViewUsers($adminId)
{
    return User::with('priorityVerification')->get();
}

    public function getStaffViewUsers($department, $staffId)
    {
        return User::where('department', $department)
            ->where('role', '!=', 'admin')
            ->where('id', '!=', $staffId)
            ->get();
    }

    public function create(array $data) { return User::create($data); }
    public function update(User $user, array $data) { return $user->update($data); }
    public function delete(User $user) { return $user->delete(); }
    public function countAdmins() { return User::where('role', 'admin')->count(); }
}