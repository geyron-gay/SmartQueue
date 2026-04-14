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
    $this->info("Heartbeat Monitor Started (High Precision)...");

    for ($i = 0; $i < 12; $i++) {
        $expiredTickets = Queue::where('status', 'serving')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->whereHas('queue_session', function ($query) {
                $query->where('is_full_auto', true)
                      ->where('is_paused', false);
            })
            ->get();

        // If no tickets, just wait for the next 5-second tick
        if ($expiredTickets->isEmpty()) {
            sleep(5);
            continue; 
        }

        $controller = new QueueController();

        foreach ($expiredTickets as $ticket) {
            $this->info("Auto-completing Ticket #{$ticket->queue_number}");
            
            $request = new Request();
            $request->replace(['status' => 'completed']);
            
            $countCleared = $expiredTickets->count();

                // Call exactly the number of people who just expired
            $controller->dispatchNextCall($expiredTickets->first()->department, $countCleared);
            
            // Broadcast the specific auto-complete event
            broadcast(new QueueUpdated([
                'type' => 'auto_completed',
                'queue_id' => $ticket->id,
                'message' => "Ticket #{$ticket->queue_number} was auto-completed."
            ]))->toOthers();
        }

        sleep(5);
    }
    
    $this->info("Heartbeat cycle finished.");
}
}