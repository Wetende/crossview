<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\LessonCompletion;
use App\Models\LessonProgress;
use App\Models\QuizAttempt;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\View\View;
use Carbon\Carbon;

final class AnalyticsController extends Controller
{
    /**
     * Display the analytics dashboard overview for a teacher.
     */
    public function index(): View
    {
        $user = Auth::user();


        $coursesQuery = Course::where('user_id', $user->id);
        $totalCourses = $coursesQuery->count();


        $courseIds = $coursesQuery->pluck('id')->toArray();


        $totalEnrollments = Enrollment::whereIn('course_id', $courseIds)->count();


        $activeEnrollments = Enrollment::whereIn('course_id', $courseIds)
            ->whereNull('completed_at')
            ->count();


        $completionRate = $totalEnrollments > 0
            ? round((($totalEnrollments - $activeEnrollments) / $totalEnrollments) * 100, 2)
            : 0;


        $recentEnrollments = Enrollment::whereIn('course_id', $courseIds)
            ->where('enrolled_at', '>=', Carbon::now()->subDays(30))
            ->count();


        $directRevenue = DB::table('course_purchases')
            ->join('payments', 'course_purchases.payment_id', '=', 'payments.id')
            ->whereIn('course_purchases.course_id', $courseIds)
            ->where('payments.status', 'completed')
            ->sum('payments.amount');


        $popularCourses = Course::where('user_id', $user->id)
            ->withCount('enrollments')
            ->orderByDesc('enrollments_count')
            ->limit(5)
            ->get();


        $enrollmentTrends = $this->getEnrollmentTrends($courseIds);


        $activeStudentsByMonth = $this->getActiveStudentsByMonth($courseIds);

        return view('teacher.analytics.index', [
            'totalCourses' => $totalCourses,
            'totalEnrollments' => $totalEnrollments,
            'activeEnrollments' => $activeEnrollments,
            'completionRate' => $completionRate,
            'recentEnrollments' => $recentEnrollments,
            'directRevenue' => $directRevenue,
            'popularCourses' => $popularCourses,
            'enrollmentTrends' => $enrollmentTrends,
            'activeStudentsByMonth' => $activeStudentsByMonth,
        ]);
    }

    /**
     * Display course-specific analytics.
     */
    public function showCourseAnalytics(Course $course): View
    {

        $this->authorize('view', $course);


        $enrollmentCount = $course->enrollments()->count();
        $completionCount = $course->enrollments()->whereNotNull('completed_at')->count();
        $completionRate = $enrollmentCount > 0 ? round(($completionCount / $enrollmentCount) * 100, 2) : 0;


        $directRevenue = DB::table('course_purchases')
            ->join('payments', 'course_purchases.payment_id', '=', 'payments.id')
            ->where('course_purchases.course_id', $course->id)
            ->where('payments.status', 'completed')
            ->sum('payments.amount');


        $averageQuizScore = QuizAttempt::whereIn('quiz_id', $course->sections->flatMap->quizzes->pluck('id'))
            ->avg('score_percentage') ?? 0;




        $timeSpent = LessonProgress::whereIn('lesson_id', $course->lessons->pluck('id'))
            ->sum('duration_seconds') / 60;


        $accessFrequency = LessonProgress::whereIn('lesson_id', $course->lessons->pluck('id'))
            ->count();


        $avgCompletionTime = DB::table('enrollments')
            ->where('course_id', $course->id)
            ->whereNotNull('completed_at')
            ->select(DB::raw('AVG(TIMESTAMPDIFF(DAY, enrolled_at, completed_at)) as avg_days'))
            ->first()->avg_days ?? 0;


        $activeStudents7Days = DB::table('lesson_progress')
            ->join('enrollments', 'lesson_progress.enrollment_id', '=', 'enrollments.id')
            ->whereIn('lesson_progress.lesson_id', $course->lessons->pluck('id'))
            ->where('lesson_progress.last_accessed_at', '>=', Carbon::now()->subDays(7))
            ->distinct('enrollments.user_id')
            ->count('enrollments.user_id');


        $activeStudents30Days = DB::table('lesson_progress')
            ->join('enrollments', 'lesson_progress.enrollment_id', '=', 'enrollments.id')
            ->whereIn('lesson_progress.lesson_id', $course->lessons->pluck('id'))
            ->where('lesson_progress.last_accessed_at', '>=', Carbon::now()->subDays(30))
            ->distinct('enrollments.user_id')
            ->count('enrollments.user_id');


        $enrollmentTrends = $this->getEnrollmentTrendsForCourse($course->id);


        $lessonCompletionRates = $this->getLessonCompletionRates($course);

        return view('teacher.analytics.course', [
            'course' => $course,
            'enrollmentCount' => $enrollmentCount,
            'completionCount' => $completionCount,
            'completionRate' => $completionRate,
            'directRevenue' => $directRevenue,
            'averageQuizScore' => $averageQuizScore,
            'timeSpent' => $timeSpent,
            'accessFrequency' => $accessFrequency,
            'avgCompletionTime' => $avgCompletionTime,
            'activeStudents7Days' => $activeStudents7Days,
            'activeStudents30Days' => $activeStudents30Days,
            'enrollmentTrends' => $enrollmentTrends,
            'lessonCompletionRates' => $lessonCompletionRates,
        ]);
    }

    /**
     * Get enrollment trends data (monthly, last 6 months).
     */
    private function getEnrollmentTrends(array $courseIds): array
    {
        $cacheKey = 'teacher_enrollment_trends_' . implode('_', $courseIds);

        return Cache::remember($cacheKey, now()->addHours(6), function () use ($courseIds) {
            $trends = [];


            for ($i = 5; $i >= 0; $i--) {
                $startOfMonth = Carbon::now()->subMonths($i)->startOfMonth();
                $endOfMonth = Carbon::now()->subMonths($i)->endOfMonth();

                $count = Enrollment::whereIn('course_id', $courseIds)
                    ->whereBetween('enrolled_at', [$startOfMonth, $endOfMonth])
                    ->count();

                $trends[] = [
                    'month' => $startOfMonth->format('M Y'),
                    'count' => $count,
                ];
            }

            return $trends;
        });
    }

    /**
     * Get enrollment trends data for a specific course (monthly, last 6 months).
     */
    private function getEnrollmentTrendsForCourse(int $courseId): array
    {
        $cacheKey = 'course_enrollment_trends_' . $courseId;

        return Cache::remember($cacheKey, now()->addHours(6), function () use ($courseId) {
            $trends = [];


            for ($i = 5; $i >= 0; $i--) {
                $startOfMonth = Carbon::now()->subMonths($i)->startOfMonth();
                $endOfMonth = Carbon::now()->subMonths($i)->endOfMonth();

                $count = Enrollment::where('course_id', $courseId)
                    ->whereBetween('enrolled_at', [$startOfMonth, $endOfMonth])
                    ->count();

                $trends[] = [
                    'month' => $startOfMonth->format('M Y'),
                    'count' => $count,
                ];
            }

            return $trends;
        });
    }

    /**
     * Get active students by month (last 6 months).
     */
    private function getActiveStudentsByMonth(array $courseIds): array
    {
        $cacheKey = 'teacher_active_students_' . implode('_', $courseIds);

        return Cache::remember($cacheKey, now()->addHours(6), function () use ($courseIds) {
            $activeStudents = [];


            for ($i = 5; $i >= 0; $i--) {
                $startOfMonth = Carbon::now()->subMonths($i)->startOfMonth();
                $endOfMonth = Carbon::now()->subMonths($i)->endOfMonth();

                $count = DB::table('lesson_progress')
                    ->join('enrollments', 'lesson_progress.enrollment_id', '=', 'enrollments.id')
                    ->whereIn('lesson_progress.lesson_id', function ($query) use ($courseIds) {
                        $query->select('id')
                            ->from('lessons')
                            ->whereIn('course_id', $courseIds);
                    })
                    ->whereBetween('lesson_progress.last_accessed_at', [$startOfMonth, $endOfMonth])
                    ->distinct('enrollments.user_id')
                    ->count('enrollments.user_id');

                $activeStudents[] = [
                    'month' => $startOfMonth->format('M Y'),
                    'count' => $count,
                ];
            }

            return $activeStudents;
        });
    }

    /**
     * Get lesson completion rates for a course.
     */
    private function getLessonCompletionRates(Course $course): array
    {
        $cacheKey = 'course_lesson_completion_rates_' . $course->id;

        return Cache::remember($cacheKey, now()->addHours(6), function () use ($course) {
            $results = [];
            $enrollmentCount = $course->enrollments()->count();

            if ($enrollmentCount === 0) {
                return [];
            }

            foreach ($course->lessons as $lesson) {
                $completionCount = LessonCompletion::where('lesson_id', $lesson->id)->count();
                $completionRate = round(($completionCount / $enrollmentCount) * 100, 2);

                $results[] = [
                    'title' => $lesson->title,
                    'completion_rate' => $completionRate,
                ];
            }

            return $results;
        });
    }
}
