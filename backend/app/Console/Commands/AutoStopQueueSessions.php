<?php

// app/Console/Commands/AutoStopQueueSessions.php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\QueueSession;
use Carbon\Carbon;

class AutoStopQueueSessions extends Command
{
    protected $signature = 'sessions:auto-stop';
    protected $description = 'Automatically stop expired queue sessions';

    public function handle()
    {
        $now = Carbon::now();

        // ✅ Bulk update (FASTER than loop)
        $affected = QueueSession::where('is_active', true)
            ->whereNotNull('stop_time_at')
            ->where('stop_time_at', '<=', $now)
            ->update([
                'is_active' => false
            ]);

        if ($affected > 0) {
            // 🔥 Broadcast only if something changed
            broadcast(new \App\Events\QueueUpdated("refresh"));
        }

        $this->info("Auto-stopped {$affected} session(s).");
    }
}