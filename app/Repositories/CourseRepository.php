<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\Course;
use App\Models\Category;
use App\Models\GradeLevel;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

final readonly class CourseRepository
{
    private const CACHE_DURATION = 900;
    private const DEFAULT_PER_PAGE = 10;

    public function getPublishedCoursesWithFilters(array $filters = [], int $perPage = self::DEFAULT_PER_PAGE): LengthAwarePaginator
    {
        $query = Course::query()
            ->where('is_published', true)
            ->with([
                'teacher:id,name,profile_picture_path',
                'category:id,name',
                'subject:id,name',
                'gradeLevel:id,name',
                'requiredSubscriptionTier:id,name,level'
            ])
            ->withCount(['enrollments', 'reviews']);

        $this->applyFilters($query, $filters);
        $this->applySorting($query, $filters['sort'] ?? 'newest');

        return $query->paginate($perPage);
    }

    public function getCourseWithDetails(string $slug): ?Course
    {
        $cacheKey = "course_details_{$slug}";

        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($slug) {
            return Course::where('slug', $slug)
                ->where('is_published', true)
                ->with([
                    'teacher:id,name,profile_picture_path',
                    'teacher.teacherProfile:user_id,bio,qualifications,position',
                    'category:id,name,slug',
                    'subject:id,name,slug',
                    'gradeLevel:id,name,slug',
                    'requiredSubscriptionTier:id,name,level,price',
                    'sections' => function ($query) {
                        $query->orderBy('order')->with([
                            'lessons' => fn($q) => $q->orderBy('order')->select('id', 'course_section_id', 'title', 'lesson_type', 'lesson_duration', 'order', 'is_preview_allowed'),
                            'quizzes' => fn($q) => $q->orderBy('order')->select('id', 'course_section_id', 'title', 'time_limit', 'order')->withCount('questions'),
                            'assignments' => fn($q) => $q->orderBy('order')->select('id', 'course_section_id', 'title', 'order')
                        ]);
                    },
                    'reviews' => function ($query) {
                        $query->where('is_approved', true)
                            ->with('user:id,name')
                            ->orderByDesc('created_at')
                            ->limit(10);
                    }
                ])
                ->withCount(['enrollments', 'reviews'])
                ->first();
        });
    }

    public function getFilterOptions(): array
    {
        return [
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'gradeLevels' => GradeLevel::orderBy('name')->get(['id', 'name']),
            'instructors' => User::whereHas('courses', function ($query) {
                $query->where('is_published', true);
            })->orderBy('name')->get(['id', 'name']),
            'priceRanges' => [
                ['label' => 'Free', 'min' => 0, 'max' => 0],
                ['label' => '$0 - $50', 'min' => 0.01, 'max' => 50],
                ['label' => '$50 - $100', 'min' => 50.01, 'max' => 100],
                ['label' => '$100+', 'min' => 100.01, 'max' => null]
            ],
            'durationRanges' => [
                ['label' => '0-3 hours', 'min' => 0, 'max' => 180],
                ['label' => '3-7 hours', 'min' => 181, 'max' => 420],
                ['label' => '7+ hours', 'min' => 421, 'max' => null]
            ]
        ];
    }

    public function getPopularCourses(int $limit = 6): Collection
    {
        return Course::where('is_published', true)
            ->with([
                'teacher:id,name,profile_picture_path',
                'category:id,name,slug',
                'gradeLevel:id,name,slug'
            ])
            ->withCount('enrollments')
            ->orderByDesc('enrollments_count')
            ->limit($limit)
            ->get();
    }

    public function calculateCourseStats(Course $course): array
    {
        $cacheKey = "course_stats_{$course->id}";

        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($course) {
            $totalLessons = $course->sections->sum(function ($section) {
                return $section->lessons->count() + $section->quizzes->count() + $section->assignments->count();
            });

            $averageRating = $course->reviews_count > 0
                ? $course->reviews()->where('is_approved', true)->avg('rating')
                : 0;

            return [
                'total_lessons' => $totalLessons,
                'duration_formatted' => $this->formatDuration($course->duration_in_minutes),
                'average_rating' => round((float) $averageRating, 1),
                'enrollment_count' => $course->enrollments_count,
                'review_count' => $course->reviews_count
            ];
        });
    }

    public function formatDuration(int $minutes): string
    {
        if ($minutes < 60) {
            return "{$minutes}m";
        }

        $hours = intval($minutes / 60);
        $remainingMinutes = $minutes % 60;

        if ($remainingMinutes === 0) {
            return "{$hours}h";
        }

        return "{$hours}h {$remainingMinutes}m";
    }

    public function clearCourseCache(int $courseId): void
    {
        $course = Course::find($courseId);
        if ($course) {
            Cache::forget("course_details_{$course->slug}");
            Cache::forget("course_stats_{$courseId}");
        }


        Cache::forget('course_filter_options');


        for ($i = 1; $i <= 20; $i++) {
            Cache::forget("popular_courses_{$i}");
        }
    }

    private function applyFilters(Builder $query, array $filters): void
    {
        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (!empty($filters['grade_level_id'])) {
            $query->where('grade_level_id', $filters['grade_level_id']);
        }

        if (!empty($filters['instructor_id'])) {
            $query->where('user_id', $filters['instructor_id']);
        }

        if (!empty($filters['price_range'])) {
            $this->applyPriceFilter($query, $filters['price_range']);
        }

        if (!empty($filters['duration_range'])) {
            $this->applyDurationFilter($query, $filters['duration_range']);
        }

        if (!empty($filters['search'])) {
            $searchTerm = $filters['search'];
            $query->where(function (Builder $subQuery) use ($searchTerm) {
                $subQuery->where('title', 'like', "%{$searchTerm}%")
                    ->orWhere('short_description', 'like', "%{$searchTerm}%")
                    ->orWhere('description', 'like', "%{$searchTerm}%");
            });
        }
    }

    private function applyPriceFilter(Builder $query, string $priceRange): void
    {
        switch ($priceRange) {
            case 'free':
                $query->where('price', 0);
                break;
            case '0-50':
                $query->whereBetween('price', [0.01, 50]);
                break;
            case '50-100':
                $query->whereBetween('price', [50.01, 100]);
                break;
            case '100+':
                $query->where('price', '>', 100);
                break;
        }
    }

    private function applyDurationFilter(Builder $query, string $durationRange): void
    {
        switch ($durationRange) {
            case '0-3':
                $query->whereBetween('duration_in_minutes', [0, 180]);
                break;
            case '3-7':
                $query->whereBetween('duration_in_minutes', [181, 420]);
                break;
            case '7+':
                $query->where('duration_in_minutes', '>', 420);
                break;
        }
    }

    private function applySorting(Builder $query, string $sort): void
    {
        switch ($sort) {
            case 'newest':
                $query->orderByDesc('created_at');
                break;
            case 'oldest':
                $query->orderBy('created_at');
                break;
            case 'price_low':
                $query->orderBy('price');
                break;
            case 'price_high':
                $query->orderByDesc('price');
                break;
            case 'popular':
                $query->orderByDesc('enrollments_count');
                break;
            case 'rating':
                $query->withAvg('reviews', 'rating')->orderByDesc('reviews_avg_rating');
                break;
            default:
                $query->orderByDesc('created_at');
        }
    }

    private function buildCacheKey(string $prefix, array $filters, int $perPage): string
    {
        $filterString = md5(serialize($filters));
        return "{$prefix}_{$filterString}_{$perPage}";
    }
}
