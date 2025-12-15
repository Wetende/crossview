<?php

declare(strict_types=1);

namespace App\Http\Controllers\Parent;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Enrollment;
use App\Models\QuizAttempt;
use App\Models\StudentRanking;
use App\Models\StudentPerformance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

final class DashboardController extends Controller
{
    public function index(Request $request): View
    {
        $parent = Auth::user();
        $linkedStudents = $parent->linkedStudents()->get();


        $selectedStudentId = $request->session()->get('selected_student_id');


        $selectedStudent = null;
        if ($selectedStudentId) {
            $selectedStudent = $linkedStudents->firstWhere('id', $selectedStudentId);
        }


        if (!$selectedStudent && $linkedStudents->isNotEmpty()) {
            $selectedStudent = $linkedStudents->first();
            $request->session()->put('selected_student_id', $selectedStudent->id);
        }


        $summaryData = [];
        $totalChildren = $linkedStudents->count();
        $totalCoursesAcrossChildren = 0;
        $totalCompletedCoursesAcrossChildren = 0;
        $averagePerformanceAcrossChildren = 0;
        $topPerformers = [];
        $childrenWithPerformanceData = 0;

        foreach ($linkedStudents as $student) {
            $enrollments = Enrollment::where('user_id', $student->id)->get();
            $activeCourses = $enrollments->whereNull('completed_at')->count();
            $completedCourses = $enrollments->whereNotNull('completed_at')->count();
            $avgProgress = (float) ($enrollments->avg('progress') ?? 0);


            $overallRanking = StudentRanking::where('user_id', $student->id)
                ->where('ranking_type', 'overall')
                ->with('gradeLevel')
                ->first();


            $subjectRankingsCount = StudentRanking::where('user_id', $student->id)
                ->where('ranking_type', 'subject_grade')
                ->count();


            $avgPerformanceScore = (float) (StudentPerformance::where('user_id', $student->id)
                ->avg('percentage_score') ?? 0);

            $totalCoursesAcrossChildren += $enrollments->count();
            $totalCompletedCoursesAcrossChildren += $completedCourses;

            if ($overallRanking || $avgPerformanceScore > 0) {
                $childrenWithPerformanceData++;
                $averagePerformanceAcrossChildren += $avgPerformanceScore;

                if ($overallRanking && $overallRanking->percentile >= 75) {
                    $topPerformers[] = [
                        'student' => $student,
                        'ranking' => $overallRanking,
                        'performance_score' => $avgPerformanceScore,
                    ];
                }
            }

            $summaryData[$student->id] = [
                'name' => $student->name,
                'active_courses' => $activeCourses,
                'completed_courses' => $completedCourses,
                'avg_progress' => round($avgProgress, 2),
                'overall_ranking' => $overallRanking,
                'subject_rankings_count' => $subjectRankingsCount,
                'avg_performance_score' => round($avgPerformanceScore, 1),
                'has_performance_data' => $overallRanking || $avgPerformanceScore > 0,
            ];
        }


        if ($childrenWithPerformanceData > 0) {
            $averagePerformanceAcrossChildren = round($averagePerformanceAcrossChildren / $childrenWithPerformanceData, 1);
        }


        usort($topPerformers, function ($a, $b) {
            return $b['ranking']->percentile <=> $a['ranking']->percentile;
        });
        $topPerformers = array_slice($topPerformers, 0, 3);


        $studentData = null;
        if ($selectedStudent) {
            $enrollments = Enrollment::where('user_id', $selectedStudent->id)
                ->with('course')
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get();

            $quizAttempts = QuizAttempt::where('user_id', $selectedStudent->id)
                ->with('quiz')
                ->orderBy('completed_at', 'desc')
                ->take(5)
                ->get();

            $recentActivity = Enrollment::where('user_id', $selectedStudent->id)
                ->whereNotNull('updated_at')
                ->with('course')
                ->orderBy('updated_at', 'desc')
                ->take(5)
                ->get();


            $recentPerformances = StudentPerformance::where('user_id', $selectedStudent->id)
                ->with(['subject', 'performanceMetric'])
                ->orderBy('last_calculated_at', 'desc')
                ->take(3)
                ->get();

            $studentData = [
                'student' => $selectedStudent,
                'enrollments' => $enrollments,
                'quiz_attempts' => $quizAttempts,
                'recent_activity' => $recentActivity,
                'recent_performances' => $recentPerformances,
            ];
        }


        $globalStats = [
            'total_children' => $totalChildren,
            'total_courses_across_children' => $totalCoursesAcrossChildren,
            'total_completed_courses' => $totalCompletedCoursesAcrossChildren,
            'average_performance_across_children' => $averagePerformanceAcrossChildren,
            'children_with_performance_data' => $childrenWithPerformanceData,
            'top_performers' => $topPerformers,
            'completion_rate' => $totalCoursesAcrossChildren > 0 ? round(($totalCompletedCoursesAcrossChildren / $totalCoursesAcrossChildren) * 100, 1) : 0,
        ];

        return view('parent.overview', [
            'linkedStudents' => $linkedStudents,
            'selectedStudent' => $selectedStudent,
            'summaryData' => $summaryData,
            'studentData' => $studentData,
            'globalStats' => $globalStats,
        ]);
    }

    public function selectStudent(Request $request): \Illuminate\Http\RedirectResponse
    {
        $request->validate([
            'student_id' => 'required|exists:users,id',
        ]);

        $parent = Auth::user();
        $studentId = $request->input('student_id');


        $isLinked = $parent->linkedStudents()->where('student_user_id', $studentId)->exists();

        if ($isLinked) {
            $request->session()->put('selected_student_id', $studentId);
            return redirect()->back()->with('success', 'Selected student updated successfully.');
        }

        return redirect()->back()->with('error', 'Invalid student selection.');
    }

    public function childProgress(Request $request): View
    {
        $parent = Auth::user();
        $linkedStudents = $parent->linkedStudents()->get();


        $selectedStudentId = $request->session()->get('selected_student_id');
        $selectedStudent = null;

        if ($selectedStudentId) {
            $selectedStudent = $linkedStudents->firstWhere('id', $selectedStudentId);
        }

        if (!$selectedStudent && $linkedStudents->isNotEmpty()) {
            $selectedStudent = $linkedStudents->first();
            $request->session()->put('selected_student_id', $selectedStudent->id);
        }

        $enrollments = [];
        if ($selectedStudent) {
            $enrollments = Enrollment::where('user_id', $selectedStudent->id)
                ->with(['course', 'course.quizzes'])
                ->orderBy('created_at', 'desc')
                ->get();
        }

        return view('parent.children.progress', [
            'linkedStudents' => $linkedStudents,
            'selectedStudent' => $selectedStudent,
            'enrollments' => $enrollments,
        ]);
    }

    public function childCourseProgress(Request $request, User $child, $courseId): View
    {
        $parent = Auth::user();


        $isLinked = $parent->linkedStudents()->where('student_user_id', $child->id)->exists();

        if (!$isLinked) {
            abort(403, 'You are not authorized to view this child\'s progress.');
        }


        $enrollment = Enrollment::where('user_id', $child->id)
            ->where('course_id', $courseId)
            ->with(['course', 'course.sections', 'course.sections.lessons'])
            ->firstOrFail();

        return view('parent.children.course-progress', [
            'child' => $child,
            'enrollment' => $enrollment,
        ]);
    }

    public function childQuizResults(Request $request, User $child, QuizAttempt $quizAttempt): View
    {
        $parent = Auth::user();


        $isLinked = $parent->linkedStudents()->where('student_user_id', $child->id)->exists();

        if (!$isLinked) {
            abort(403, 'You are not authorized to view this child\'s quiz results.');
        }


        if ($quizAttempt->user_id !== $child->id) {
            abort(404, 'Quiz attempt not found.');
        }

        $quizAttempt->load(['quiz', 'answers', 'answers.question', 'answers.question.options']);

        return view('parent.children.quiz-results', [
            'child' => $child,
            'quizAttempt' => $quizAttempt,
        ]);
    }

    public function subscriptions(Request $request): View
    {

        return view('parent.subscriptions.index');
    }

    public function messages(Request $request): View
    {

        return view('parent.messages.index');
    }

    public function settings(Request $request): View
    {

        return view('parent.settings.profile');
    }

    public function childDashboard(Request $request, User $child): View
    {
        $parent = Auth::user();


        $isLinked = $parent->linkedStudents()->where('student_user_id', $child->id)->exists();

        if (!$isLinked) {
            abort(403, 'You are not authorized to view this child\'s dashboard.');
        }


        $enrollments = Enrollment::where('user_id', $child->id)
            ->with(['course', 'course.quizzes'])
            ->orderBy('created_at', 'desc')
            ->get();


        $quizAttempts = QuizAttempt::where('user_id', $child->id)
            ->with('quiz')
            ->orderBy('completed_at', 'desc')
            ->take(5)
            ->get();


        $recentActivity = Enrollment::where('user_id', $child->id)
            ->whereNotNull('updated_at')
            ->with('course')
            ->orderBy('updated_at', 'desc')
            ->take(5)
            ->get();


        $totalCourses = $enrollments->count();
        $completedCourses = $enrollments->whereNotNull('completed_at')->count();
        $inProgressCourses = $totalCourses - $completedCourses;
        $avgProgress = $enrollments->avg('progress') ?? 0;


        $recentPerformances = StudentPerformance::where('user_id', $child->id)
            ->with(['subject', 'performanceMetric'])
            ->orderBy('last_calculated_at', 'desc')
            ->take(10)
            ->get();

        return view('parent.children.dashboard', [
            'child' => $child,
            'enrollments' => $enrollments,
            'quizAttempts' => $quizAttempts,
            'recentActivity' => $recentActivity,
            'recentPerformances' => $recentPerformances,
            'totalCourses' => $totalCourses,
            'completedCourses' => $completedCourses,
            'inProgressCourses' => $inProgressCourses,
            'avgProgress' => round($avgProgress, 2),
        ]);
    }
}
