<?php

namespace App\Notifications;

use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class StudentEnrolledInCourseNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected Enrollment $enrollment;
    protected User $student;

    /**
     * Create a new notification instance.
     */
    public function __construct(Enrollment $enrollment, User $student)
    {
        $this->enrollment = $enrollment;
        $this->student = $student;
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
            ->subject('Your child enrolled in a new ' . get_lms_term('course') . '!')
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line($this->student->name . ' has enrolled in a new ' . get_lms_term('course') . '.')
            ->line(get_lms_term('Course') . ': ' . $this->enrollment->course->title)
            ->line('Enrolled on: ' . $this->enrollment->enrolled_at->format('F j, Y'))
            ->action('View ' . get_lms_term('Course'), route('parent.child.course.progress', [
                'child' => $this->student->id,
                'course' => $this->enrollment->course_id
            ]))
            ->line('You can monitor your child\'s progress in this ' . get_lms_term('course') . ' from your dashboard.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'New ' . get_lms_term('Course') . ' Enrollment',
            'message' => $this->student->name . ' enrolled in "' . $this->enrollment->course->title . '"',
            'student_id' => $this->student->id,
            'course_id' => $this->enrollment->course_id,
            'enrollment_id' => $this->enrollment->id,
            'action_text' => 'View ' . get_lms_term('Course'),
            'action_url' => route('parent.child.course.progress', [
                'child' => $this->student->id,
                'course' => $this->enrollment->course_id
            ]),
            'icon' => 'icon-play-button',
            'icon_bg' => 'bg-purple-1',
        ];
    }
}
