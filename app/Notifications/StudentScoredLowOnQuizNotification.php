<?php

namespace App\Notifications;

use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class StudentScoredLowOnQuizNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected QuizAttempt $quizAttempt;
    protected User $student;
    protected float $passingGrade;

    /**
     * Create a new notification instance.
     */
    public function __construct(QuizAttempt $quizAttempt, User $student, float $passingGrade)
    {
        $this->quizAttempt = $quizAttempt;
        $this->student = $student;
        $this->passingGrade = $passingGrade;
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
            ->subject('Your child needs help with a quiz')
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line($this->student->name . ' did not pass a recent quiz.')
            ->line('Quiz: ' . $this->quizAttempt->quiz->title)
            ->line('Score: ' . number_format($this->quizAttempt->score, 1) . '% (Passing grade: ' . number_format($this->passingGrade, 1) . '%)')
            ->line('Date: ' . $this->quizAttempt->completed_at->format('F j, Y'))
            ->action('View Quiz Results', route('parent.child.quiz-results', [
                'child' => $this->student->id,
                'quizAttempt' => $this->quizAttempt->id
            ]))
            ->line('You can help your child review this material.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Low Quiz Score',
            'message' => $this->student->name . ' scored ' . number_format($this->quizAttempt->score, 1) . '% on "' . $this->quizAttempt->quiz->title . '"',
            'student_id' => $this->student->id,
            'quiz_id' => $this->quizAttempt->quiz_id,
            'quiz_attempt_id' => $this->quizAttempt->id,
            'action_text' => 'View Quiz Results',
            'action_url' => route('parent.child.quiz-results', [
                'child' => $this->student->id,
                'quizAttempt' => $this->quizAttempt->id
            ]),
            'icon' => 'icon-alert-triangle',
            'icon_bg' => 'bg-red-1',
        ];
    }
}
