<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Course;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CourseSubmittedForApprovalNotification extends Notification implements ShouldQueue
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
            ->subject('New ' . get_lms_term('Course') . ' Submitted for Approval')
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('A new ' . get_lms_term('course') . ' has been submitted for approval.')
            ->line(get_lms_term('Course') . ': ' . $this->course->title)
            ->line('Submitted by: ' . $this->teacher->name)
            ->line('Submitted on: ' . now()->format('F j, Y'))
            ->action('Review ' . get_lms_term('Course'), route('admin.courses.review', $this->course->id));
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'New ' . get_lms_term('Course') . ' Submitted',
            'message' => $this->teacher->name . ' submitted "' . $this->course->title . '" for approval',
            'course_id' => $this->course->id,
            'teacher_id' => $this->teacher->id,
            'action_text' => 'Review ' . get_lms_term('Course'),
            'action_url' => route('admin.courses.review', $this->course->id),
            'icon' => 'icon-message',
            'icon_bg' => 'bg-purple-1',
        ];
    }
}
