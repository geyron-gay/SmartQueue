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


