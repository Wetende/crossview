<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ConnectionRejectedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * The student user who rejected the connection request.
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
            ->subject('Your Connection Request was Not Approved')
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line($this->student->name . ' has declined your connection request.')
            ->line('If you believe this was a mistake, you may want to speak with the student directly or contact their teacher or a school administrator for assistance.')
            ->line('Thank you for your understanding.');
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
            'message' => $this->student->name . ' has declined your connection request.',
            'type' => 'connection_rejected',
        ];
    }
}
