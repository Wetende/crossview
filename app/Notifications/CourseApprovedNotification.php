<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Course;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CourseApprovedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected Course $course;
    protected User $admin;
    protected ?string $notes;

    /**
     * Create a new notification instance.
     */
    public function __construct(Course $course, User $admin, ?string $notes = null)
    {
        $this->course = $course;
        $this->admin = $admin;
        $this->notes = $notes;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $message = (new MailMessage())
            ->subject('Your ' . get_lms_term('course') . ' has been approved!')
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('Good news! Your ' . get_lms_term('course') . ' "' . $this->course->title . '" has been approved by our team.')
            ->line('Your ' . get_lms_term('course') . ' is now live and available for students to enroll.')
            ->line('Thank you for your contribution to our learning platform!');

        if ($this->notes) {
            $message->line('**Admin Notes:** ' . $this->notes);
        }

        return $message
            ->action('View ' . get_lms_term('Course'), route('teacher.courses.edit', $this->course->id))
            ->line('Congratulations on your successful course publication!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => get_lms_term('Course') . ' Approved',
            'message' => 'Your ' . get_lms_term('course') . ' "' . $this->course->title . '" has been approved!',
            'course_id' => $this->course->id,
            'action_text' => 'View ' . get_lms_term('Course'),
            'action_url' => route('teacher.courses.edit', $this->course->id),
            'icon' => 'icon-check-2',
            'icon_bg' => 'bg-green-1',
            'notification_type' => 'course_approval',
            'status' => 'approved',
        ];
    }
}
