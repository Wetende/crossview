<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Course;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CourseResubmittedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected Course $course;
    protected User $teacher;

    /**
     * Create a new notification instance.
     */
    public function __construct(Course $course, User $teacher)
    {
        $this->course = $course;
        $this->teacher = $teacher;
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
        return (new MailMessage())
            ->subject(get_lms_term('Course') . ' Resubmitted for Approval')
            ->greeting('Hello Admin,')
            ->line('A ' . get_lms_term('course') . ' has been resubmitted for approval after previous feedback.')
            ->line('**' . get_lms_term('Course') . ':** ' . $this->course->title)
            ->line('**Teacher:** ' . $this->teacher->name . ' (' . $this->teacher->email . ')')
            ->line('**Resubmitted:** ' . $this->course->submitted_at->format('F j, Y g:i A'))
            ->line('**Previous Rejection Reason:** ' . ($this->course->rejection_reason ?? 'Not specified'))
            ->action('Review ' . get_lms_term('Course'), route('admin.course-approvals.show', $this->course))
            ->line('Please review the updated ' . get_lms_term('course') . ' submission.');
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
            'teacher_id' => $this->teacher->id,
            'teacher_name' => $this->teacher->name,
            'teacher_email' => $this->teacher->email,
            'resubmitted_at' => $this->course->submitted_at,
            'previous_rejection' => $this->course->rejection_reason,
            'message' => get_lms_term('Course') . " '{$this->course->title}' has been resubmitted by {$this->teacher->name}",
            'type' => 'course_resubmitted',
            'action_url' => route('admin.course-approvals.show', $this->course),
        ];
    }
}
