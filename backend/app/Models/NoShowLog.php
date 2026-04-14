<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NoShowLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'queue_id',
        'department',
        'staff_id',
        'created_at',
        'updated_at',
    ];
}
