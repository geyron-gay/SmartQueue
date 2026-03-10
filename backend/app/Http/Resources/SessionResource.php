<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class SessionResource extends JsonResource
{
 public function toArray($request)
{
    return [
        'id' => $this->id,
        'department' => $this->department,
        'target_year' => $this->target_year,
        'capacity' => $this->capacity_limit,
        'count' => $this->current_count,
        'is_active' => (bool)$this->is_active,
        'created_at' => $this->created_at->format('Y-m-d H:i:s'),
        // 🔥 Change this line to check if the relation is set
        'attendees' => $this->relationLoaded('attendees') ? $this->attendees : [], 
    ];
}
}