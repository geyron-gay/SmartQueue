<?php 

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
   public function toArray($request)
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'username' => $this->username,
        'student_id' => $this->student_id,
        'email' => $this->email,
        'role' => $this->role,
        'relocated_to' => $this->relocated_to,
        'department' => $this->department,
        'created_at' => $this->created_at->format('Y-m-d H:i:s'),
        'priority_type' => $this->whenLoaded('priorityVerification', function () {
    return $this->priorityVerification->priority_type;
}),


        // ✅ ADD THIS
        'priority_verification' => $this->when(
    $this->relationLoaded('priorityVerification') &&
    $this->priorityVerification &&
    $this->priorityVerification->status !== 'none',

    function () {
        return [
            'id' => $this->priorityVerification->id,
            'status' => $this->priorityVerification->status,
            'type' => $this->priorityVerification->priority_type,
            'url' => route('priority.download', $this->id),
        ];
    }
),
    ];
}
}