<?php 
namespace App\Services;

use App\Repositories\UserRepository;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Models\User;
use App\Models\Purpose;
use App\Repositories\PurposeRepository;

class PurposeManagementService
{
    protected $purposeRepo;

    public function __construct(PurposeRepository $purposeRepo) {
        $this->purposeRepo = $purposeRepo;
    }

    public function getPurposesForDashboard($currentUser) {
        if ($currentUser->role === 'admin') {
            return $this->purposeRepo->getAdminViewPurposes();
        }
        return $this->purposeRepo->getStaffViewPurposes($currentUser->department);
    }

      public function createPurpose(array $data) {
        return $this->purposeRepo->create($data);
    }

    
    public function updatePurpose($purpose, array $data, $currentUser) {
        if ($currentUser->role !== 'admin' && $currentUser->department !== $purpose->department) {
            throw new \Exception("Unauthorized to update this purpose", 403);
        }


        return $this->purposeRepo->update($purpose, $data);
    }

    public function deletePurpose($purpose, $currentUser) {
    

        if ($currentUser->role !== 'admin' && $currentUser->department !== $purpose->department) {
            throw new \Exception("Unauthorized to delete this purpose", 403);
        }

        return $this->purposeRepo->delete($purpose);
    }
}