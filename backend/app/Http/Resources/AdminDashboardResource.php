<?php 

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class AdminDashboardResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'department' => $this->department,
            'relocated_to' => $this->relocated_to,
            'status' => $this->resource->is_online ? 'Active' : 'Offline',
            'served' => $this->resource->served_count,
            'last_action' => $this->resource->last_action_formatted,
        ];
    }

    
}