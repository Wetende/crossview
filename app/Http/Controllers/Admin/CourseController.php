<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminStoreCourseRequest;
use App\Models\Course;
use App\Models\User;
use App\Models\Category;
use App\Models\Subject;
use App\Models\GradeLevel;
use App\Models\SubscriptionTier;
use App\Services\CourseCreationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\View\View;

final class CourseController extends Controller
{
    /**
     * Create a new controller instance.
     */
    public function __construct(private readonly CourseCreationService $courseCreationService)
    {
    }

    /**
     * Display a listing of the courses.
     */
    public function index(Request $request): View
    {
        $query = Course::query()
            ->with(['user', 'category', 'gradeLevel']);


        if ($request->filled('status')) {
            $query->status($request->status);
        }

        if ($request->filled('category')) {
            $query->where('category_id', $request->category);
        }

        if ($request->filled('grade_level')) {
            $query->where('grade_level_id', $request->grade_level);
        }

        if ($request->filled('search')) {
            $search = '%' . $request->search . '%';
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', $search)
                  ->orWhere('description', 'like', $search);
            });
        }


        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $courses = $query->paginate(10)->withQueryString();


        $categories = Category::pluck('name', 'id');
        $gradeLevels = GradeLevel::pluck('name', 'id');

        return view('admin.courses.index', compact(
            'courses',
            'categories',
            'gradeLevels'
        ));
    }

    /**
     * Display the specified course.
     */
    public function show(Course $course): View
    {
        $course->load(['user', 'category', 'subject', 'gradeLevel']);
        $course->loadCount('purchases as enrollment_count');

        return view('admin.courses.show', compact('course'));
    }

    /**
     * Show the form for editing the course.
     */
    public function edit(Course $course): View
    {
        $course->load(['user', 'category', 'subject', 'gradeLevel']);

        $categories = Category::orderBy('name')->get();
        $subjects = Subject::orderBy('name')->get();
        $gradeLevels = GradeLevel::orderBy('name')->get();
        $teachers = User::role('teacher')->orderBy('name')->get();

        return view('admin.courses.edit', compact(
            'course',
            'categories',
            'subjects',
            'gradeLevels',
            'teachers'
        ));
    }

    /**
     * Update the course status (publish/unpublish).
     */
    public function updateStatus(Request $request, Course $course): RedirectResponse
    {
        $request->validate([
            'is_published' => 'required|boolean',
        ]);

        $wasPublished = $course->is_published;
        $isPublished = (bool) $request->input('is_published');


        if (!$wasPublished && $isPublished) {
            $course->published_at = now();
        }

        $course->is_published = $isPublished;
        $course->save();

        $message = $isPublished ? get_lms_term('Study Material') . ' published successfully.' : get_lms_term('Study Material') . ' unpublished successfully.';
        return redirect()->back()->with('success', $message);
    }

    /**
     * Make a course featured/unfeatured.
     */
    public function toggleFeatured(Request $request, Course $course): RedirectResponse
    {
        $course->is_featured = !$course->is_featured;
        $course->save();

        $message = $course->is_featured
            ? 'Course marked as featured.'
            : 'Course removed from featured.';

        return redirect()->back()->with('success', $message);
    }

    /**
     * Make a course recommended/unrecommended.
     */
    public function toggleRecommended(Request $request, Course $course): RedirectResponse
    {
        $course->is_recommended = !$course->is_recommended;
        $course->save();

        $message = $course->is_recommended
            ? 'Course marked as recommended.'
            : 'Course removed from recommended.';

        return redirect()->back()->with('success', $message);
    }

    /**
     * Remove the specified course.
     */
    public function destroy(Course $course): RedirectResponse
    {

        $course->delete();

        return redirect()->route('admin.courses.index')->with('success', get_lms_term('Study Material') . ' deleted successfully.');
    }

    /**
     * Permanently remove the specified course.
     */
    public function forceDelete(Course $course): RedirectResponse
    {

        if ($course->purchases()->count() > 0) {
            return redirect()->back()->with('error', 'Cannot permanently delete a course with enrollments.');
        }


        if ($course->thumbnail_path && Storage::cloud()->exists($course->thumbnail_path)) {
            Storage::cloud()->delete($course->thumbnail_path);
        }


        $course->forceDelete();

        return redirect()->route('admin.courses.index')->with('success', get_lms_term('Study Material') . ' permanently deleted.');
    }

    /**
     * Restore a soft-deleted course.
     */
    public function restore(int $courseId): RedirectResponse
    {
        $course = Course::withTrashed()->findOrFail($courseId);
        $course->restore();

        return redirect()->route('admin.courses.index')->with('success', get_lms_term('Study Material') . ' restored successfully.');
    }

    /**
     * Display a listing of trashed courses.
     */
    public function trash(Request $request): View
    {

        $coursesQuery = Course::onlyTrashed();


        if ($request->filled('search')) {
            $search = $request->input('search');
            $coursesQuery->where(function ($query) use ($search) {
                $query->where('title', 'like', "%{$search}%")
                      ->orWhere('short_description', 'like', "%{$search}%");
            });
        }


        $coursesQuery->with(['category', 'subject', 'gradeLevel', 'user']);


        $coursesQuery->orderBy('deleted_at', 'desc');


        $courses = $coursesQuery->paginate(15)->withQueryString();

        return view('admin.courses.trash', compact('courses'));
    }

    /**
     * Display the curriculum for a course (admin oversight).
     */
    public function showCurriculum(Course $course): View
    {

        $course->load(['sections' => function ($query) {
            $query->orderBy('order')->with([
                'lessons' => function ($q) { $q->orderBy('order'); },
                'quizzes' => function ($q) { $q->orderBy('order'); },
                'assignments' => function ($q) { $q->orderBy('order'); }
            ]);
        }]);

        return view('admin.courses.curriculum', compact('course'));
    }

    /**
     * Show the form for creating a new course.
     */
    public function create(): View
    {
        $categories = Category::orderBy('name')->get();
        $subjects = Subject::orderBy('name')->get();
        $gradeLevels = GradeLevel::orderBy('name')->get();
        $subscriptionTiers = SubscriptionTier::orderBy('price')->get();
        $teachers = User::role('teacher')->orderBy('name')->get();

        return view('admin.courses.create', compact(
            'categories',
            'subjects',
            'gradeLevels',
            'subscriptionTiers',
            'teachers'
        ));
    }

    /**
     * Store a newly created course in storage.
     */
    public function store(AdminStoreCourseRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $thumbnail = $request->hasFile('thumbnail_path') ? $request->file('thumbnail_path') : null;
        
        // Create the course using the service
        $course = $this->courseCreationService->createCourse(
            $validated,
            $thumbnail,
            $request->user(),
            $validated['teacher_id']
        );
        
        return redirect()
            ->route('admin.courses.show', $course)
            ->with('success', get_lms_term('Study Material') . ' created successfully.');
    }
}
