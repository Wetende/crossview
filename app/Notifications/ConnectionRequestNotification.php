<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ConnectionRequestNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * The parent user who sent the connection request.
     */
    protected User $parent;

    /**
     * Create a new notification instance.
     */
    public function __construct(User $parent)
    {
        $this->parent = $parent;
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
            ->subject('New Parent Connection Request')
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line($this->parent->name . ' (' . $this->parent->email . ') has requested to connect with your account as a parent.')
            ->line('By accepting this request, the parent will be able to view your course progress and academic performance.')
            ->action('Manage Connection Requests', route('student.connections.requests'))
            ->line('If you do not know this person, you can safely reject this request.')
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
            'parent_id' => $this->parent->id,
            'parent_name' => $this->parent->name,
            'parent_email' => $this->parent->email,
            'message' => $this->parent->name . ' has requested to connect with your account as a parent.',
            'type' => 'connection_request',
        ];
    }
}
