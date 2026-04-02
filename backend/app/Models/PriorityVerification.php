<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PriorityVerification extends Model
{
    use HasFactory;

      protected $table = 'priority_verifications'; 
      
    protected $fillable = [
        'user_id',
        'file_path',
        'priority_type',
        'status',
        'reviewed_by'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

