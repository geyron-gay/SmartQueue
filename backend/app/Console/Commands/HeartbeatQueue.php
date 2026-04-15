<?php

// app/Console/Commands/HeartbeatQueue.php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Queue;
use App\Http\Controllers\QueueController;
use Illuminate\Http\Request;
use App\Events\QueueUpdated;

class HeartbeatQueue extends Command
{
    protected $signature = 'queue:heartbeat';
    protected $description = 'Automatically complete expired tickets for Full Auto sessions';

 public function handle()
{
    $this->info("Heartbeat Monitor Started...");

    for ($i = 0; $i < 12; $i++) {
        $expiredTickets = Queue::where('status', 'serving')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->whereHas('queue_session', function ($query) {
                $query->where('is_full_auto', true)
                      ->where('is_paused', false);
            })->get();

        if ($expiredTickets->isEmpty()) {
            sleep(5);
            continue; 
        }

        $controller = new QueueController();
        
        // 1. Group tickets by department (In case multiple departments are running)
        $groupedByDept = $expiredTickets->groupBy('department');

        foreach ($groupedByDept as $dept => $tickets) {
            foreach ($tickets as $ticket) {
                $this->info("Auto-completing Ticket #{$ticket->queue_number}");
                
                // Mark as completed
                $request = new Request(['status' => 'completed']);
                $controller->updateStatus($request, $ticket->id);
                
                broadcast(new QueueUpdated([
                    'type' => 'auto_completed',
                    'queue_id' => $ticket->id,
                    'message' => "Ticket #{$ticket->queue_number} was auto-completed."
                ]))->toOthers();
            }

            // 2. CRITICAL: Trigger the next batch call ONCE per department
            // This replaces exactly the number of students who just expired.
            $controller->dispatchNextCall($dept, null);
        }

        sleep(5);
    }
}
}