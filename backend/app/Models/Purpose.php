<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Purpose extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 
        'department',
        'default_service_time',
        'buffer_time',
        'max_extension_limit'
        ];
}
