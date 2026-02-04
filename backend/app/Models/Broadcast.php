<?php

// app/Models/Broadcast.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Broadcast extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'message',
        'type',
        'department',
        'is_active'
    ];

    // Senior Tip: Add a relationship to the User
    public function sender()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
