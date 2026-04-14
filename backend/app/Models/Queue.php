<?php

namespace App\Models;

use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Queue extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'user_id',
        'queue_session_id',
        'student_name',
        'student_id',
        'purpose',
        'purpose_id',
        'queue_number',
        'status',
        'department',
        'priority_level',
        'started_at',
        'completed_at',
        'expires_at',
        'queue_session_id', // add this to link with QueueSession
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    // Activity log settings
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'department', 'priority', 'purpose'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    // Relationship with User
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function purpose_ref()
{
    // I named it purpose_ref to avoid conflict with your 'purpose' string column
    return $this->belongsTo(Purpose::class, 'purpose_id');
}


    // Relationship with QueueSession
    public function queue_session()
    {
        return $this->belongsTo(QueueSession::class);
    }

    // Auto-generate queue_number based on department
    public function generateQueueNumber()
    {
        if (!$this->queue_session) return null;

        $prefix = strtoupper(substr($this->queue_session->department, 0, 1)); // first letter of department
        $lastQueue = self::where('queue_session_id', $this->queue_session_id)
                         ->latest('id')
                         ->first();

        $nextNumber = $lastQueue ? $lastQueue->queue_number_numeric() + 1 : 1;

        return $prefix . '-' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
    }

    // Helper to extract numeric part of queue_number
    public function queue_number_numeric()
    {
        return intval(substr($this->queue_number, strpos($this->queue_number, '-') + 1));
    }
}