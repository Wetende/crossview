<?php

namespace App\Events;

use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CourseEnrollment
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public Enrollment $enrollment;
    public User $user;

    public function __construct(Enrollment $enrollment, User $user)
    {
        $this->enrollment = $enrollment;
        $this->user = $user;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('channel-name'),
        ];
    }
}
