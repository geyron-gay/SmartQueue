<?php 

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class QueueResource extends JsonResource
{
 public function toArray($request)
{
    return [
        'id'            => $this->id,
        'student_name'  => $this->student_name,
        'student_id'    => $this->student_id,
        'department'    => $this->department,
        'queue_number' => strtoupper(substr($this->department, 0, 1)) 
                          . '-' 
                          . str_pad($this->queue_number, 3, '0', STR_PAD_LEFT),

        'status'        => strtolower($this->status),
        'priority'      => $this->priority_level ? 'Priority' : 'Regular',
        'purpose'       => $this->purpose,
        'created_at'    => $this->created_at->diffForHumans(),
        'started_at'    => $this->started_at ? $this->started_at->toDateTimeString() : null, 
        'completed_at'  => $this->completed_at ? $this->completed_at->toDateTimeString() : null,
    ];  
}
}