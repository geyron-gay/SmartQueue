<?php
// app/Repositories/PurposeRepository.php
namespace App\Repositories;
    
use App\Models\Purpose;
use Illuminate\Support\Facades\Log;

class PurposeRepository
{
   public function getAdminViewPurposes()
{
    return Purpose::all();
}

  public function getStaffViewPurposes($department)
    {
        Log::error("Fetching purposes for department: $department");
        return Purpose::where('department', $department)
            ->get();
    }

    public function create(array $data) { return Purpose::create($data); }
     public function update(Purpose $purpose, array $data) { return $purpose->update($data); }
    public function delete(Purpose $purpose) { return $purpose->delete(); }

}