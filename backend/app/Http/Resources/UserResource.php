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

        // ✅ ADD THIS
    'priority_verification' => $this->whenLoaded('priorityVerification', function () {
    return [
        'id' => $this->priorityVerification->id,
        'status' => $this->priorityVerification->status,
        'type' => $this->priorityVerification->priority_type,
        // Provide the **full URL** to fetch the file via your controller
        'url' => route('priority.download', $this->id),
    ];
}),
    ];
}
}