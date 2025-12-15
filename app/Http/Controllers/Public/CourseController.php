<?php

declare(strict_types=1);

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\User;
use App\Models\Enrollment;
use App\Models\Payment;
use App\Models\CourseReview;
use App\Repositories\CourseRepository;
use App\Services\RecommendationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;

final class CourseController extends Controller
{
    private const DEFAULT_PER_PAGE = 12; 

    protected $courseRepository;
    protected $recommendationService;

    public function __construct(CourseRepository $courseRepository, RecommendationService $recommendationService)
    {
        $this->courseRepository = $courseRepository;
        $this->recommendationService = $recommendationService;
    }


    public function index(Request $request): JsonResponse
    {
        $query = Course::query()->where('is_published', true)
            ->with([
                'teacher' => function ($query) {
                    $query->select('id', 'name', 'profile_picture_path');
                },
                'category:id,name,slug',
                'subject:id,name,slug',
                'gradeLevel:id,name,slug'
            ]);


        if ($request->has('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }
        if ($request->has('subject_id')) {
            $query->where('subject_id', $request->input('subject_id'));
        }
        if ($request->has('grade_level_id')) {
            $query->where('grade_level_id', $request->input('grade_level_id'));
        }


        if ($request->has('q')) {
            $searchTerm = $request->input('q');
            $query->where(function (Builder $subQuery) use ($searchTerm) {
                $subQuery->where('title', 'like', "%{$searchTerm}%")
                         ->orWhere('short_description', 'like', "%{$searchTerm}%")
                         ->orWhere('description', 'like', "%{$searchTerm}%");
            });
        }


        $query->orderByDesc('created_at');

        $courses = $query->paginate($request->input('per_page', self::DEFAULT_PER_PAGE));

        return response()->json([
            'courses' => $courses,
        ]);
    }


    public function show(Request $request, Course $course): JsonResponse
    {
        if (!$course->is_published) {
            return response()->json(['message' => get_lms_term('Study Material') . ' not found or not published.'], 404);
        }

        $course->load([
            'teacher' => fn ($q) => $q->select('id', 'name', 'profile_picture_path', 'bio'),
            'category:id,name,slug',
            'subject:id,name,slug',
            'gradeLevel:id,name,slug',
            'sections' => function ($query) {
                $query->orderBy('order')->with([
                    'lessons' => fn ($q) => $q->orderBy('order')->select('id', 'section_id', 'title', 'content_type', 'duration', 'order'),
                    'quizzes' => fn ($q) => $q->orderBy('order')->select('id', 'section_id', 'title', 'duration', 'order'),
                    'assignments' => fn ($q) => $q->orderBy('order')->select('id', 'section_id', 'title', 'order')
                ]);
            }
        ]);

        $accessStatus = 'guest';
        $user = Auth::user();

        if ($user) {

            $isEnrolled = Enrollment::where('user_id', $user->id)
                ->where('course_id', $course->id)
                ->where('status', 'active')
                ->exists();

            if ($isEnrolled) {
                $accessStatus = 'enrolled';
            } else {

                $hasPendingPurchase = Payment::where('user_id', $user->id)
                    ->where('payable_id', $course->id)
                    ->where('payable_type', Course::class)
                    ->where('status', 'pending')
                    ->exists();

                if ($hasPendingPurchase) {
                    $accessStatus = 'pending_purchase';
                } else {
                    $isCourseFree = $course->price <= 0 && is_null($course->required_subscription_tier_id);

                    if ($isCourseFree) {
                        $accessStatus = 'can_enroll_free';
                    }

                    $canPurchase = $course->price > 0;
                    $canSubscribe = false;

                    if ($course->required_subscription_tier_id) {
                        $activeSubscription = $user->activeSubscription();
                        if ($activeSubscription && $activeSubscription->tier) {
                            if ($activeSubscription->tier->level >= $course->requiredSubscriptionTier->level) {
                                $canSubscribe = true;
                            }
                        }
                    }

                    if ($canSubscribe && $canPurchase) {
                        $accessStatus = 'can_subscribe_or_purchase';
                    } elseif ($canSubscribe) {
                        $accessStatus = 'can_subscribe';
                    } elseif ($canPurchase) {
                        $accessStatus = 'can_purchase';
                    } elseif (!$isCourseFree) {
                        $accessStatus = 'requires_higher_tier_or_unavailable';
                    }
                }
            }
        }


        $curriculumOutline = $course->sections->map(function ($section) {
            return [
                'id' => $section->id,
                'title' => $section->title,
                'order' => $section->order,
                'items' => collect($section->lessons)->map(fn ($item) => ['id' => $item->id, 'title' => $item->title, 'type' => 'lesson', 'duration' => $item->duration, 'order' => $item->order])
                    ->merge($section->quizzes->map(fn ($item) => ['id' => $item->id, 'title' => $item->title, 'type' => 'quiz', 'duration' => $item->duration, 'order' => $item->order]))
                    ->merge($section->assignments->map(fn ($item) => ['id' => $item->id, 'title' => $item->title, 'type' => 'assignment', 'duration' => null, 'order' => $item->order]))
                    ->sortBy('order')->values()
            ];
        });

        return response()->json([
            'course' => $course->toArray(),
            'curriculum_outline' => $curriculumOutline,
            'access_status' => $accessStatus
        ]);
    }

     public function indexView(Request $request): View
    {
        $filters = [
            'category_id' => $request->input('category_id'),
            'grade_level_id' => $request->input('grade_level_id'),
            'instructor_id' => $request->input('instructor_id'),
            'price_range' => $request->input('price_range'),
            'duration_range' => $request->input('duration_range'),
            'search' => $request->input('search'),
            'sort' => $request->input('sort', 'newest')
        ];

        $courses = $this->courseRepository->getPublishedCoursesWithFilters(
            array_filter($filters),
            (int) $request->input('per_page', self::DEFAULT_PER_PAGE)
        );

        $filterOptions = $this->courseRepository->getFilterOptions();

        $user = Auth::user();
        if ($user) {
            $recommendedCourses = $this->recommendationService->getRecommendedCourses($user, 6);
        } else {
            $recommendedCourses = $this->courseRepository->getPopularCourses(6);
        }

        return view('courses-list', compact(
            'courses',
            'filterOptions',
            'recommendedCourses',
            'filters'
        ));
    }

    /**
     * Display single course view for public users
     */
    public function showView(string $slug): View
    {
        $course = $this->courseRepository->getCourseWithDetails($slug);

        if (!$course) {
            abort(404, get_lms_term('Study Material') . ' not found or not published.');
        }

        $courseStats = $this->courseRepository->calculateCourseStats($course);


        $similarCourses = $this->recommendationService->getSimilarCourses($course, 6);


        $instructorCourses = Course::where('user_id', $course->teacher->id)
            ->where('id', '!=', $course->id)
            ->where('is_published', true)
            ->with(['gradeLevel:id,name'])
            ->withCount(['enrollments', 'reviews'])
            ->withAvg('reviews', 'rating')
            ->limit(6)
            ->get();


        $instructorStats = [
            'total_courses' => Course::where('user_id', $course->teacher->id)->where('is_published', true)->count(),
            'total_students' => Enrollment::whereHas('course', function ($query) use ($course) {
                $query->where('user_id', $course->teacher->id);
            })->distinct('user_id')->count(),
            'average_rating' => Course::where('user_id', $course->teacher->id)
                ->withAvg('reviews', 'rating')
                ->get()
                ->avg('reviews_avg_rating'),
            'total_reviews' => Course::where('user_id', $course->teacher->id)
                ->withCount('reviews')
                ->get()
                ->sum('reviews_count')
        ];


        $accessStatus = $this->determineAccessStatus($course);

        return view('courses-show', compact(
            'course',
            'courseStats',
            'similarCourses',
            'instructorCourses',
            'instructorStats',
            'accessStatus'
        ));
    }

    /**
     * Determine course access status for current user
     */
    private function determineAccessStatus(Course $course): array
    {
        $user = Auth::user();

        if (!$user) {
            return $this->getUnauthenticatedUserAccessStatus($course);
        }


        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('status', 'active')
            ->first();

        if ($enrollment) {
            return [
                'status' => 'enrolled',
                'access_type' => $enrollment->access_type ?? 'purchase',
                'can_access' => true
            ];
        }

        return $this->getAuthenticatedUserAccessStatus($course, $user);
    }

    /**
     * Get access status for unauthenticated users
     */
    private function getUnauthenticatedUserAccessStatus(Course $course): array
    {
        if ($course->price <= 0) {
            return [
                'status' => 'login_required_for_free',
                'message' => 'This is a free ' . get_lms_term('study material') . ' - please log in to enroll'
            ];
        }

        return [
            'status' => 'purchase_available',
            'message' => 'Purchase this ' . get_lms_term('study material') . ' to gain access'
        ];
    }

    /**
     * Get access status for authenticated users
     */
    private function getAuthenticatedUserAccessStatus(Course $course, User $user): array
    {

        $accessStatus = $course->getAccessStatusForUser($user);


        if ($accessStatus['status'] === 'can_purchase') {
            $hasPendingPurchase = Payment::where('user_id', $user->id)
                ->where('payable_id', $course->id)
                ->where('payable_type', Course::class)
                ->where('status', 'pending')
                ->exists();

            if ($hasPendingPurchase) {
                $accessStatus['status'] = 'pending_purchase';
                $accessStatus['message'] = 'You have a pending payment for this course';
            }
        }

        return $accessStatus;
    }

    public function storeReview(Request $request, Course $course): RedirectResponse
    {
        $user = Auth::user();


        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'title' => 'nullable|string|max:255',
            'content' => 'required|string|max:1000',
        ]);


        $existingReview = CourseReview::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->first();

        if ($existingReview) {
            return redirect()->back()
                ->withErrors(['review' => 'You have already reviewed this ' . get_lms_term('study material') . '.'])
                ->withInput();
        }


        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->first();


        CourseReview::create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'rating' => $validated['rating'],
            'title' => $validated['title'],
            'content' => $validated['content'],
            'enrollment_id' => $enrollment?->id,
            'is_approved' => true,
        ]);


        $this->courseRepository->clearCourseCache($course->id);

        return redirect()->back()->with('success', 'Thank you for your review! It has been submitted successfully.');
    }
}
