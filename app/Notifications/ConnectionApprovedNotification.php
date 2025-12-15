<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ConnectionApprovedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * The student user who approved the connection request.
     */
    protected User $student;

    /**
     * Create a new notification instance.
     */
    public function __construct(User $student)
    {
        $this->student = $student;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject('Your Connection Request was Approved')
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line('Good news! ' . $this->student->name . ' has approved your connection request.')
            ->line('You can now view their academic progress and monitor their performance.')
            ->action('View Student Progress', route('parent.child-progress', ['student_id' => $this->student->id]))
            ->line('Thank you for using our platform!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'student_id' => $this->student->id,
            'student_name' => $this->student->name,
            'student_email' => $this->student->email,
            'message' => $this->student->name . ' has approved your connection request.',
            'type' => 'connection_approved',
        ];
    }
}
