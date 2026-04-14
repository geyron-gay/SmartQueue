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
        'stop_time_at',
        'is_active',
        'is_autocall_enabled',
        'is_full_auto',
        'is_paused',
        'paused_at',
        'batch_size'
    ];

   protected $casts = [
    'is_active' => 'boolean',
    'is_autocall_enabled' => 'boolean',
    'is_full_auto' => 'boolean',
    'is_paused' => 'boolean',
    'paused_at' => 'datetime', // Cast this to a Carbon instance
    'stop_time_at' => 'datetime',
];

    // app/Models/QueueSession.php
public function purposes() {
    // We match the department name from the session to the department in purposes table
    return $this->hasMany(Purpose::class, 'department', 'department');
}
// app/Models/QueueSession.php
public function attendees()
{
    return $this->hasMany(Queue::class, 'department', 'department');
}
}


