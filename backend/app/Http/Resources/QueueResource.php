<?php 

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class QueueResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'          => $this->id,
            'student_name'        => $this->student_name, // Mapping student_name to 'student'
            'student_id'     => $this->student_id,
            'queue_number'  => "QN-" . str_pad($this->queue_number, 3, '0', STR_PAD_LEFT), // Formats 1 to QN-001
           'status'      => strtolower($this->status),
            'priority'    => $this->priority_level ? "Priority" : "Normal",
            'purpose'        => $this->purpose,
           
            'created_at'     => $this->created_at->diffForHumans(), // "5 minutes ago"
        ];
    }
}