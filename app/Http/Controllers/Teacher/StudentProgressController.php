<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Models\QuizAttempt;
use App\Models\User;
use App\Models\AssignmentSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

final class StudentProgressController extends Controller
{
    /**
     * Display a listing of students enrolled in a course.
     */
    public function index(Request $request, Course $course): View
    {
        
        $this->authorize('view', $course);

        $enrollmentsQuery = Enrollment::with('user')
            ->where('course_id', $course->id)
            ->orderBy('enrolled_at', 'desc');

        
        if ($request->filled('status')) {
            $status = $request->input('status');
            if ($status === 'completed') {
                $enrollmentsQuery->whereNotNull('completed_at');
            } elseif ($status === 'in_progress') {
                $enrollmentsQuery->whereNull('completed_at');
            }
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $enrollmentsQuery->whereHas('user', function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $enrollments = $enrollmentsQuery->paginate(20)->withQueryString();

        return view('teacher.students.progress.index', [
            'course' => $course,
            'enrollments' => $enrollments
        ]);
    }

    /**
     * Display the detailed progress of a specific student in a course.
     */
    public function show(Course $course, User $student): View
    {
        
        $this->authorize('view', $course);

        
        $enrollment = Enrollment::where('course_id', $course->id)
            ->where('user_id', $student->id)
            ->firstOrFail();


        $lessonCompletions = LessonCompletion::whereHas('lesson', function ($q) use ($course) {
            $q->where('course_id', $course->id);
        })
            ->where('user_id', $student->id)
            ->get();


        $quizAttempts = QuizAttempt::whereHas('quiz', function ($q) use ($course) {
            $q->whereHas('courseSection', function ($q2) use ($course) {
                $q2->where('course_id', $course->id);
            });
        })
            ->where('user_id', $student->id)
            ->get();


        $assignmentSubmissions = AssignmentSubmission::whereHas('assignment', function ($q) use ($course) {
            $q->whereHas('courseSection', function ($q2) use ($course) {
                $q2->where('course_id', $course->id);
            });
        })
            ->where('user_id', $student->id)
            ->get();

        
        $totalLessons = $course->lessons()->count();
        $completedLessons = $lessonCompletions->count();
        $progressPercentage = $totalLessons > 0 ? round(($completedLessons / $totalLessons) * 100) : 0;

        return view('teacher.student-progress.show', [
            'course' => $course,
            'student' => $student,
            'enrollment' => $enrollment,
            'lessonCompletions' => $lessonCompletions,
            'quizAttempts' => $quizAttempts,
            'assignmentSubmissions' => $assignmentSubmissions,
            'progressPercentage' => $progressPercentage
        ]);
    }

    /**
     * Display progress for all students across all teacher's courses
     */
    public function allStudents(): View
    {
        $user = Auth::user();
        $courses = Course::where('user_id', $user->id)->get();
        $courseIds = $courses->pluck('id')->toArray();


        $enrollments = Enrollment::whereIn('course_id', $courseIds)
            ->with(['user', 'course'])
            ->get()
            ->groupBy('user_id');

        
        $studentProgress = [];

        foreach ($enrollments as $userId => $userEnrollments) {
            $student = $userEnrollments->first()->user;
            $totalCourses = $userEnrollments->count();
            $completedCourses = $userEnrollments->whereNotNull('completed_at')->count();

            
            $totalLessons = 0;
            $completedLessons = 0;

            foreach ($userEnrollments as $enrollment) {
                $course = $enrollment->course;
                $courseLessons = $course->lessons()->count();

                $completedCourseLessons = LessonCompletion::whereHas('lesson', function ($q) use ($course) {
                    $q->where('course_id', $course->id);
                })
                    ->where('user_id', $userId)
                    ->count();

                $totalLessons += $courseLessons;
                $completedLessons += $completedCourseLessons;
            }

            $overallProgressPercentage = $totalLessons > 0 ? round(($completedLessons / $totalLessons) * 100) : 0;

            $studentProgress[] = [
                'student' => $student,
                'total_courses' => $totalCourses,
                'completed_courses' => $completedCourses,
                'enrollments' => $userEnrollments,
                'overall_progress' => $overallProgressPercentage,
            ];
        }

        return view('teacher.student-progress.all', [
            'courses' => $courses,
            'studentProgress' => $studentProgress
        ]);
    }
}
