<?php

declare(strict_types=1);

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizAttemptAnswer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

final class QuizController extends Controller
{
    /**
     * Show the quiz taking interface
     */
    public function takeQuiz(Request $request, Course $course, Quiz $quiz)
    {
        $user = Auth::user();
        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('status', 'active')
            ->firstOrFail();


        $lesson = Lesson::where('course_id', $course->id)
            ->where('quiz_id', $quiz->id)
            ->first();

        if (!$lesson) {
            return redirect()->route('student.learn.course', $course)
                ->with('error', 'The quiz does not belong to this course.');
        }


        $attempts = QuizAttempt::where('user_id', $user->id)
            ->where('quiz_id', $quiz->id)
            ->orderBy('attempt_number', 'desc')
            ->get();

        $lastAttempt = $attempts->first();




        if ($lastAttempt && !$quiz->allow_retakes) {
            if ($lastAttempt->passed) {
                return redirect()->route('student.learn.lesson', [$course, $lesson])
                    ->with('info', 'You have already passed this quiz and retakes are not allowed.');
            }
        }

        if ($quiz->max_attempts !== null && $attempts->count() >= $quiz->max_attempts) {
            return redirect()->route('student.learn.lesson', [$course, $lesson])
                ->with('info', 'You have reached the maximum number of attempts allowed for this quiz.');
        }


        $quiz->load(['questions' => function ($query) {
            $query->orderBy('order')->with(['options' => function ($q) {
                $q->orderBy('order');
            }]);
        }]);

        return view('student.quizzes.take', compact('course', 'quiz', 'lesson', 'attempts'));
    }

    /**
     * Submit a quiz attempt
     */
    public function submitQuiz(Request $request, Course $course, Quiz $quiz)
    {
        $user = Auth::user();
        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('status', 'active')
            ->firstOrFail();


        $lesson = Lesson::where('course_id', $course->id)
            ->where('quiz_id', $quiz->id)
            ->first();

        if (!$lesson) {
            return redirect()->route('student.learn.course', $course)
                ->with('error', 'The quiz does not belong to this course.');
        }


        $validator = Validator::make($request->all(), [
            'answers' => 'required|array',
            'answers.*' => 'required',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }


        $previousAttempts = QuizAttempt::where('user_id', $user->id)
            ->where('quiz_id', $quiz->id)
            ->count();

        if (!$quiz->allow_retakes && $previousAttempts > 0) {
            $lastAttempt = QuizAttempt::where('user_id', $user->id)
                ->where('quiz_id', $quiz->id)
                ->orderBy('attempt_number', 'desc')
                ->first();

            if ($lastAttempt && $lastAttempt->passed) {
                return redirect()->route('student.learn.lesson', [$course, $lesson])
                    ->with('info', 'You have already passed this quiz and retakes are not allowed.');
            }
        }

        if ($quiz->max_attempts !== null && $previousAttempts >= $quiz->max_attempts) {
            return redirect()->route('student.learn.lesson', [$course, $lesson])
                ->with('info', 'You have reached the maximum number of attempts allowed for this quiz.');
        }

        DB::beginTransaction();

        try {

            $attempt = new QuizAttempt([
                'user_id' => $user->id,
                'quiz_id' => $quiz->id,
                'attempt_number' => $previousAttempts + 1,
                'started_at' => now(),
                'completed_at' => now(),
            ]);

            $attempt->save();


            $answers = [];
            $score = 0;
            $maxScore = 0;

            $quiz->load('questions.options');

            foreach ($quiz->questions as $question) {
                $maxScore += $question->points;

                if (isset($request->answers[$question->id])) {

                    $answerData = $request->answers[$question->id];
                    $answerText = null;
                    $isCorrect = false;
                    $answerScore = 0;



                    $answerText = json_encode($answerData);




                    $quizAnswer = new QuizAttemptAnswer([
                        'quiz_attempt_id' => $attempt->id,
                        'question_id' => $question->id,
                        'answer_text' => $answerText,
                        'is_correct' => $isCorrect,
                        'score' => $answerScore,
                    ]);

                    $quizAnswer->save();
                    $score += $answerScore;
                }
            }


            if ($quiz->allow_retakes && $quiz->retake_penalty_percent > 0 && $previousAttempts > 0) {
                $penalty = ($quiz->retake_penalty_percent / 100) * $score;
                $score = max(0, $score - $penalty);
            }


            $attempt->score = $maxScore > 0 ? ($score / $maxScore) * 100 : 0;
            $attempt->passed = $quiz->pass_mark === null || $attempt->score >= $quiz->pass_mark;
            $attempt->save();

            DB::commit();


            if ($lesson && $attempt->passed) {
                $learnController = app()->make(LearnController::class);
                $learnController->markLessonComplete($request, $course, $lesson);
            }

            return redirect()->route('student.quizzes.results', [$course, $quiz, $attempt])
                ->with('success', 'Quiz submitted successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->with('error', 'An error occurred while submitting your quiz: ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Show quiz attempt results
     */
    public function showResults(Course $course, Quiz $quiz, QuizAttempt $attempt)
    {
        $user = Auth::user();


        if ($attempt->user_id !== $user->id) {
            return redirect()->route('student.learn.course', $course)
                ->with('error', 'You do not have permission to view these results.');
        }


        $lesson = Lesson::where('course_id', $course->id)
            ->where('quiz_id', $quiz->id)
            ->first();

        if (!$lesson) {
            return redirect()->route('student.learn.course', $course)
                ->with('error', 'The quiz does not belong to this course.');
        }

        $attempt->load('answers.question.options');

        return view('student.quizzes.results', compact('course', 'quiz', 'attempt', 'lesson'));
    }
}
