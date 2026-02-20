<?php

namespace App\Models;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Queue extends Model
{

use LogsActivity;

    use HasFactory;
    protected $fillable = [
        'user_id',
        'student_name',
        'student_id',
        'purpose',
        'queue_number',
        'status',
        'department',
        'priority_level',
        'priority',
    ];

    protected $casts = [
    'started_at' => 'datetime',
    'completed_at' => 'datetime',
];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            // Log changes to these fields
            ->logOnly(['status', 'department', 'priority', 'purpose'])
            // 🔥 Only record if the value actually changed
            ->logOnlyDirty() 
            // Don't log if nothing actually changed
            ->dontSubmitEmptyLogs();
    }

    // app/Models/Queue.php

public function user()
{
    return $this->belongsTo(User::class);
}
}
