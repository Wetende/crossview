<?php

declare(strict_types=1);

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\View\View;
use App\Models\Enrollment;
use App\Models\Course;
use App\Models\QuizAttempt;
use App\Models\StudentPerformance;
use App\Models\StudentRanking;
use App\Models\Subject;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Services\RecommendationService;

final class DashboardController extends Controller
{
    public function __construct(
        private readonly RecommendationService $recommendationService
    ) {
    }

    public function overview(Request $request): View
    {
        $user = Auth::user();

        $enrollments = Enrollment::where('user_id', $user->id)
            ->with(['course' => function ($query) {
                $query->select('id', 'title', 'slug', 'thumbnail_path', 'short_description');
            }])
            ->get();

        $totalEnrolled = $enrollments->count();
        $activeCourses = $enrollments->where('completed_at', null)->count();
        $completedCourses = $enrollments->whereNotNull('completed_at')->count();


        $recentlyAccessedCourses = Course::select('courses.*', 'latest_progress.last_accessed')
            ->join('enrollments', 'courses.id', '=', 'enrollments.course_id')
            ->joinSub(
                DB::table('lesson_progress')
                    ->select('enrollment_id', DB::raw('MAX(last_accessed_at) as last_accessed'))
                    ->whereNotNull('last_accessed_at')
                    ->groupBy('enrollment_id'),
                'latest_progress',
                function ($join) {
                    $join->on('enrollments.id', '=', 'latest_progress.enrollment_id');
                }
            )
            ->where('enrollments.user_id', $user->id)
            ->orderBy('latest_progress.last_accessed', 'desc')
            ->take(5)
            ->get();


        foreach ($recentlyAccessedCourses as $course) {
            if (isset($course->last_accessed)) {
                $course->last_accessed = \Carbon\Carbon::parse($course->last_accessed);
            }
        }

        $recentQuizAttempts = QuizAttempt::where('user_id', $user->id)
            ->with(['quiz' => function ($query) {
                $query->select('id', 'title', 'description', 'pass_mark');
            }])
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();


        $hasPerformanceData = StudentPerformance::where('user_id', $user->id)->exists();


        $bestPerformingSubjects = [];
        if ($hasPerformanceData) {

            $subjectPerformances = DB::table('student_performances')
                ->select('subject_id', DB::raw('AVG(percentage_score) as avg_score'))
                ->where('user_id', $user->id)
                ->groupBy('subject_id')
                ->orderByDesc('avg_score')
                ->take(3)
                ->get();


            if ($subjectPerformances->isNotEmpty()) {
                $subjectIds = $subjectPerformances->pluck('subject_id')->toArray();
                $subjects = Subject::whereIn('id', $subjectIds)->get()->keyBy('id');

                foreach ($subjectPerformances as $performance) {
                    if (isset($subjects[$performance->subject_id])) {
                        $subject = $subjects[$performance->subject_id];
                        $bestPerformingSubjects[] = [
                            'subject' => $subject,
                            'avg_score' => $performance->avg_score,
                        ];
                    }
                }
            }
        }


        $overallRanking = StudentRanking::where('user_id', $user->id)
            ->where('ranking_type', 'overall')
            ->with('gradeLevel')
            ->first();


        $recommendations = $this->recommendationService->getRecommendedCourses($user, 3);

        return view('student.overview', [
            'totalEnrolled' => $totalEnrolled,
            'activeCourses' => $activeCourses,
            'completedCourses' => $completedCourses,
            'enrollments' => $enrollments,
            'recentlyAccessedCourses' => $recentlyAccessedCourses,
            'recentQuizAttempts' => $recentQuizAttempts,
            'hasPerformanceData' => $hasPerformanceData,
            'bestPerformingSubjects' => $bestPerformingSubjects,
            'overallRanking' => $overallRanking,
            'recommendations' => $recommendations,
        ]);
    }

    public function myLearning(Request $request): View
    {
        $user = Auth::user();

        $enrollments = Enrollment::where('user_id', $user->id)
            ->with(['course' => function ($query) {
                $query->select('id', 'title', 'slug', 'thumbnail_path', 'short_description', 'user_id')
                    ->with(['user' => function ($q) {
                        $q->select('id', 'name');
                    }]);
            }])
            ->orderBy('created_at', 'desc')
            ->get();

        return view('student.courses.index', [
            'enrollments' => $enrollments,
        ]);
    }

    public function myCertificates(Request $request): View
    {
        return view('student.certificates.index');
    }

    public function bookmarkedCourses(Request $request): View
    {
        return view('student.bookmarks.index');
    }

    public function settings(Request $request): View
    {
        return view('student.settings.profile');
    }

    public function messages(Request $request): View
    {
        return view('student.messages.index');
    }

    public function storeMessage(Request $request)
    {

        return redirect()->back()->with('success', 'Message sent successfully.');
    }
}
