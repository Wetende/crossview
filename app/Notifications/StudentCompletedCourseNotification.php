<?php

namespace App\Notifications;

use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class StudentCompletedCourseNotification extends Notification implements ShouldQueue
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
            ->subject('Your child has completed a ' . get_lms_term('course') . '!')
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('Great news! ' . $this->student->name . ' has completed a ' . get_lms_term('course') . '.')
            ->line(get_lms_term('Course') . ': ' . $this->enrollment->course->title)
            ->line('Completed on: ' . $this->enrollment->completed_at->format('F j, Y'))
            ->action('View Progress', route('parent.child.course.progress', [
                'child' => $this->student->id,
                'course' => $this->enrollment->course_id
            ]))
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
            'title' => get_lms_term('Course') . ' Completion',
            'message' => $this->student->name . ' has completed the ' . get_lms_term('course') . ' "' . $this->enrollment->course->title . '"',
            'student_id' => $this->student->id,
            'course_id' => $this->enrollment->course_id,
            'enrollment_id' => $this->enrollment->id,
            'action_text' => 'View Progress',
            'action_url' => route('parent.child.course.progress', [
                'child' => $this->student->id,
                'course' => $this->enrollment->course_id
            ]),
            'icon' => 'icon-trophy',
            'icon_bg' => 'bg-green-1',
        ];
    }
}
