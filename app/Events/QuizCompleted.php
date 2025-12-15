<?php

namespace App\Events;

use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class QuizCompleted
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public QuizAttempt $quizAttempt;
    public User $user;
    public float $passingGrade;

    public function __construct(QuizAttempt $quizAttempt, User $user, float $passingGrade)
    {
        $this->quizAttempt = $quizAttempt;
        $this->user = $user;
        $this->passingGrade = $passingGrade;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('channel-name'),
        ];
    }
}
