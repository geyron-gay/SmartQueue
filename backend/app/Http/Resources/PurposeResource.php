<?php 

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PurposeResource extends JsonResource
{
   public function toArray($request)
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'department' => $this->department,
        'default_service_time' => $this->default_service_time,
        'buffer_time' => $this->buffer_time,
        'max_extension_limit' => $this->max_extension_limit,
    ];
}
}