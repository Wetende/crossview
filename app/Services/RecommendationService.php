<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Course;
use App\Models\User;
use App\Models\Category;
use App\Models\Subject;
use App\Models\Enrollment;
use App\Models\StudentPerformance;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

final readonly class RecommendationService
{
    /**
     * Cache duration for recommendations in seconds (12 hours - shorter for performance-based recommendations).
     */
    private const CACHE_DURATION = 43200;

    /**
     * Maximum number of recommended courses to return (can be overridden in method calls).
     */
    private const DEFAULT_LIMIT = 6;

    /**
     * Weight factors for different recommendation criteria.
     * Performance-driven weights prioritizing student improvement.
     */
    private const WEIGHTS = [
        'poor_performance_subject' => 10,
        'improvement_needed' => 8,
        'grade_level_progression' => 6,
        'subject_continuation' => 5,
        'prerequisite_gaps' => 7,
        'teacher_success_rate' => 3,
    ];

    /**
     * Performance thresholds for determining improvement needs.
     */
    private const PERFORMANCE_THRESHOLDS = [
        'poor' => 60,
        'needs_improvement' => 75,
        'good' => 85,

    ];

    protected function generatePerformanceBasedRecommendations(User $user): Collection
    {

        return Course::where('is_published', true)
            ->inRandomOrder()
            ->limit(10) 
            ->get()
            ->map(function ($course) {
                $course->recommendation_score = rand(1, 100);
                return $course;
            });
    }

    public function getRecommendedCourses(User $user, int $limit = 6): Collection
    {
        $recommendations = $this->generatePerformanceBasedRecommendations($user);
        $limitedRecommendations = $recommendations->sortByDesc('recommendation_score')->take($limit);

        return $limitedRecommendations->load(['teacher:id,name,profile_picture_path', 'category:id,name', 'subject:id,name']);
    }


    /**
     * Apply performance-based scoring criteria to courses.
     */
    private function applyPerformanceBasedScoring(Builder $query, User $user): Collection
    {

        $performanceData = $this->getUserPerformanceData($user);
        $poorPerformanceSubjects = $performanceData['poor_subjects'];
        $improvementNeededSubjects = $performanceData['improvement_subjects'];
        $strongSubjects = $performanceData['strong_subjects'];


        $userSubjectIds = $this->getUserSubjectIds($user);
        $userCategoryIds = $this->getUserCategoryIds($user);


        $courses = $query->with(['category', 'subject', 'user'])
            ->get();


        return $courses->map(function (Course $course) use ($poorPerformanceSubjects, $improvementNeededSubjects, $strongSubjects, $userSubjectIds, $userCategoryIds, $user) {
            $score = 0;


            if (in_array($course->subject_id, $poorPerformanceSubjects, true)) {
                $score += self::WEIGHTS['poor_performance_subject'];
            }


            if (in_array($course->subject_id, $improvementNeededSubjects, true)) {
                $score += self::WEIGHTS['improvement_needed'];
            }


            if (in_array($course->subject_id, $strongSubjects, true)) {
                $score += self::WEIGHTS['subject_continuation'];
            }


            if ($this->fillsPrerequisiteGap($course, $user)) {
                $score += self::WEIGHTS['prerequisite_gaps'];
            }


            if ($this->isGradeLevelProgression($course, $user)) {
                $score += self::WEIGHTS['grade_level_progression'];
            }


            if ($this->hasGoodTeacherSuccessRate($course, $user)) {
                $score += self::WEIGHTS['teacher_success_rate'];
            }


            $course->recommendation_score = $score;

            return $course;
        })->filter(function (Course $course) {

            return $course->recommendation_score > 0;
        });
    }

    /**
     * Get user's performance data categorized by performance level.
     */
    private function getUserPerformanceData(User $user): array
    {
        $performances = StudentPerformance::where('user_id', $user->id)
            ->with('subject')
            ->get();

        $subjectPerformances = [];


        foreach ($performances as $performance) {
            $subjectId = $performance->subject_id;
            if (!isset($subjectPerformances[$subjectId])) {
                $subjectPerformances[$subjectId] = [];
            }
            $subjectPerformances[$subjectId][] = $performance->percentage_score;
        }

        $poorSubjects = [];
        $improvementSubjects = [];
        $strongSubjects = [];

        foreach ($subjectPerformances as $subjectId => $scores) {
            $avgScore = array_sum($scores) / count($scores);

            if ($avgScore < self::PERFORMANCE_THRESHOLDS['poor']) {
                $poorSubjects[] = $subjectId;
            } elseif ($avgScore < self::PERFORMANCE_THRESHOLDS['needs_improvement']) {
                $improvementSubjects[] = $subjectId;
            } elseif ($avgScore >= self::PERFORMANCE_THRESHOLDS['good']) {
                $strongSubjects[] = $subjectId;
            }
        }

        return [
            'poor_subjects' => $poorSubjects,
            'improvement_subjects' => $improvementSubjects,
            'strong_subjects' => $strongSubjects,
        ];
    }

    /**
     * Check if course fills a prerequisite gap for the user.
     */
    private function fillsPrerequisiteGap(Course $course, User $user): bool
    {

        $completedCoursesInSubject = $this->getUserCompletedCoursesInSubject($user, $course->subject_id);


        if ($completedCoursesInSubject->isEmpty()) {
            return true;
        }



        return false;
    }

    /**
     * Check if course represents grade level progression.
     */
    private function isGradeLevelProgression(Course $course, User $user): bool
    {

        $completedCoursesInSubject = $this->getUserCompletedCoursesInSubject($user, $course->subject_id);


        return $completedCoursesInSubject->isNotEmpty();
    }

    /**
     * Check if teacher has good success rate with students.
     */
    private function hasGoodTeacherSuccessRate(Course $course, User $user): bool
    {


        $teacherAvgPerformance = DB::table('student_performances')
            ->join('enrollments', 'student_performances.user_id', '=', 'enrollments.user_id')
            ->join('courses', 'enrollments.course_id', '=', 'courses.id')
            ->where('courses.user_id', $course->user_id)
            ->where('student_performances.subject_id', $course->subject_id)
            ->avg('student_performances.percentage_score');


        return $teacherAvgPerformance && $teacherAvgPerformance > 75;
    }

    /**
     * Add courses from adjacent grade levels if needed.
     */
    private function addAdjacentGradeLevelCourses(Collection $scoredCourses, User $user, ?int $userGradeLevel, array $userCourseIds): Collection
    {
        if (!$userGradeLevel) {
            return $scoredCourses;
        }

        $needed = self::DEFAULT_LIMIT - $scoredCourses->count();
        if ($needed <= 0) {
            return $scoredCourses;
        }


        $adjacentCourses = Course::whereNotIn('id', array_merge($userCourseIds, $scoredCourses->pluck('id')->toArray()))
            ->where('is_published', true)
            ->whereIn('grade_level_id', [$userGradeLevel - 1, $userGradeLevel + 1])
            ->with(['category', 'subject', 'user'])
            ->limit($needed)
            ->get();


        $adjacentCourses->each(function (Course $course) {
            $course->recommendation_score = 1;
        });

        return $scoredCourses->concat($adjacentCourses);
    }

    /**
     * Infer grade level from user's enrollment history.
     */
    private function inferGradeLevelFromEnrollments(User $user): ?int
    {
        $mostCommonGradeLevel = DB::table('enrollments')
            ->join('courses', 'enrollments.course_id', '=', 'courses.id')
            ->where('enrollments.user_id', $user->id)
            ->whereNotNull('courses.grade_level_id')
            ->select('courses.grade_level_id', DB::raw('COUNT(*) as count'))
            ->groupBy('courses.grade_level_id')
            ->orderByDesc('count')
            ->first();

        return $mostCommonGradeLevel ? $mostCommonGradeLevel->grade_level_id : null;
    }

    /**
     * Get user's completed courses in a specific subject.
     */
    private function getUserCompletedCoursesInSubject(User $user, ?int $subjectId): Collection
    {
        if (!$subjectId) {
            return collect();
        }

        return DB::table('enrollments')
            ->join('courses', 'enrollments.course_id', '=', 'courses.id')
            ->where('enrollments.user_id', $user->id)
            ->where('courses.subject_id', $subjectId)
            ->whereNotNull('enrollments.completed_at')
            ->select('courses.*')
            ->get();
    }

    /**
     * Get course IDs the user is enrolled in.
     */
    private function getUserCourseIds(User $user): array
    {
        return $user->enrollments()
            ->pluck('course_id')
            ->toArray();
    }

    /**
     * Get category IDs from courses the user is enrolled in.
     */
    private function getUserCategoryIds(User $user): array
    {
        return DB::table('enrollments')
            ->join('courses', 'enrollments.course_id', '=', 'courses.id')
            ->where('enrollments.user_id', $user->id)
            ->whereNotNull('courses.category_id')
            ->pluck('courses.category_id')
            ->unique()
            ->toArray();
    }

    /**
     * Get subject IDs from courses the user is enrolled in.
     */
    private function getUserSubjectIds(User $user): array
    {
        return DB::table('enrollments')
            ->join('courses', 'enrollments.course_id', '=', 'courses.id')
            ->where('enrollments.user_id', $user->id)
            ->whereNotNull('courses.subject_id')
            ->pluck('courses.subject_id')
            ->unique()
            ->toArray();
    }

    /**
     * Get "You Might Also Like" recommendations for a specific course.
     * This maintains the existing similar courses functionality.
     */
    public function getSimilarCourses(Course $course, int $limit = self::DEFAULT_LIMIT): Collection
    {
        $cacheKey = "similar_courses_{$course->id}";


        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey)->take($limit);
        }


        $similarCourses = Course::where('id', '!=', $course->id)
            ->where('is_published', true)
            ->where(function (Builder $query) use ($course) {
                $query->where('grade_level_id', $course->grade_level_id)
                    ->orWhere('subject_id', $course->subject_id);
            })
            ->with(['category', 'subject', 'user'])
            ->limit($limit * 2)
            ->get();


        $scoredCourses = $similarCourses->map(function ($similarCourse) use ($course) {
            $score = 0;


            if ($similarCourse->grade_level_id === $course->grade_level_id) {
                $score += 5;
            }


            if ($similarCourse->subject_id === $course->subject_id) {
                $score += 4;
            }


            if ($similarCourse->category_id === $course->category_id) {
                $score += 2;
            }


            if ($similarCourse->user_id === $course->user_id) {
                $score += 1;
            }

            $similarCourse->similarity_score = $score;
            return $similarCourse;
        });


        $recommendations = $scoredCourses->sortByDesc('similarity_score')
            ->take($limit)
            ->values();

        Cache::put($cacheKey, $recommendations, self::CACHE_DURATION);

        return $recommendations;
    }

    /**
     * Get the cache key for user recommendations.
     */
    private function getCacheKey(User $user): string
    {
        return "user_{$user->id}_performance_recommendations";
    }

    /**
     * Clear cached recommendations for a specific user.
     */
    public function clearUserRecommendationCache(User $user): void
    {

        $commonLimits = [6, 10, 12, 20];

        foreach ($commonLimits as $limit) {
            $cacheKey = "recommendations_user_{$user->id}_limit_{$limit}";
            Cache::forget($cacheKey);
        }
    }
}
