<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast; // 👈 Make sure this is here!
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class QueueUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;

    public function __construct($message = "refresh")
    {
        $this->message = $message;
    }

    public function broadcastOn(): array
    {
        // This is the "Radio Station" name
        return [
            new Channel('queue-channel'),
        ];
    }

    public function broadcastAs()
{
    return 'QueueUpdated'; // This removes the "App\Events" prefix
}
}