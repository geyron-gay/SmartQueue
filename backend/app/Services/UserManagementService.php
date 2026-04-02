<?php 
namespace App\Services;

use App\Repositories\UserRepository;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class UserManagementService
{
    protected $userRepo;

    public function __construct(UserRepository $userRepo) {
        $this->userRepo = $userRepo;
    }

    public function getUsersForDashboard($currentUser) {
        if ($currentUser->role === 'admin') {
            return $this->userRepo->getAdminViewUsers($currentUser->id);
        }
        return $this->userRepo->getStaffViewUsers($currentUser->department, $currentUser->id);
    }

    

    public function createUser(array $data) {
        $data['password'] = Hash::make($data['password']);
        return $this->userRepo->create($data);
    }



    public function updateUser($user, array $data, $currentUser) {
        if ($currentUser->role !== 'admin' && $currentUser->department !== $user->department) {
            throw new \Exception("Unauthorized to update this user", 403);
        }

        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        return $this->userRepo->update($user, $data);
    }

    public function deleteUser($user, $currentUser) {
    

        if ($currentUser->role !== 'admin' && $currentUser->department !== $user->department) {
            throw new \Exception("Unauthorized to delete this user", 403);
        }

        return $this->userRepo->delete($user);
    }
}