<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Course;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CourseRejectedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected Course $course;
    protected User $admin;
    protected string $rejectionReason;
    protected ?string $notes;

    /**
     * Create a new notification instance.
     */
    public function __construct(Course $course, User $admin, string $rejectionReason, ?string $notes = null)
    {
        $this->course = $course;
        $this->admin = $admin;
        $this->rejectionReason = $rejectionReason;
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
            ->subject(get_lms_term('Course') . ' Submission Requires Changes')
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('Your ' . get_lms_term('course') . ' submission has been reviewed and requires some changes before approval.')
            ->line('**' . get_lms_term('Course') . ':** ' . $this->course->title)
            ->line('**Reviewed by:** ' . $this->admin->name)
            ->line('**Reviewed on:** ' . $this->course->rejected_at->format('F j, Y g:i A'))
            ->line('')
            ->line('**Feedback:**')
            ->line($this->rejectionReason);

        if ($this->notes) {
            $message->line('')
                    ->line('**Additional Notes:**')
                    ->line($this->notes);
        }

        return $message
            ->line('')
            ->action('Edit ' . get_lms_term('Course'), route('teacher.courses.builder', $this->course))
            ->line('Once you\'ve made the necessary changes, you can resubmit your ' . get_lms_term('course') . ' for approval.')
            ->line('If you have any questions about this feedback, please don\'t hesitate to contact us.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'course_id' => $this->course->id,
            'course_title' => $this->course->title,
            'admin_id' => $this->admin->id,
            'admin_name' => $this->admin->name,
            'rejected_at' => $this->course->rejected_at,
            'rejection_reason' => $this->rejectionReason,
            'notes' => $this->notes,
            'message' => "Your " . get_lms_term('course') . " '{$this->course->title}' requires changes before approval",
            'type' => 'course_rejected',
            'action_url' => route('teacher.courses.builder', $this->course),
        ];
    }
}
