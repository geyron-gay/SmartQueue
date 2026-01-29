<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QueueSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'department',
        'target_year',
        'capacity_limit',
        'current_count',
        'is_active'
    ];
}
