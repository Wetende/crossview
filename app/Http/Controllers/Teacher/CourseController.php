<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseSection;
use App\Http\Requests\StoreCourseRequest;
use App\Http\Requests\Teacher\UpdateCourseSectionRequest;
use App\Models\Category;
use App\Models\Subject;
use App\Models\GradeLevel;
use App\Models\SubscriptionTier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\View\View;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use App\Models\Lesson;
use App\Models\Quiz;
use App\Models\Assignment;
use App\Enums\LessonType;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use App\Services\CourseCreationService;

final class CourseController extends Controller
{
    /**
     * Create a new controller instance.
     */
    public function __construct(private readonly CourseCreationService $courseCreationService)
    {
    }

    /**
     * Check if the current user can manage the course (owns it or is an admin)
     */
    private function canManageCourse(Course $course): bool
    {
        /** @var User $user */
        $user = Auth::user();

        return $user->id === $course->user_id || $user->hasRole('admin');
    }

    public function index(Request $request)
    {
        $user = Auth::user();



        $coursesQuery = Course::where('user_id', $user->id);

        if ($request->filled('status')) {
            $status = $request->input('status');
            if ($status === 'published') {
                $coursesQuery->where('is_published', true);
            } elseif ($status === 'draft') {
                $coursesQuery->where('is_published', false);
            }
        }

        if ($request->filled('category')) {
            $coursesQuery->where('category_id', $request->input('category'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $coursesQuery->where(function ($query) use ($search) {
                $query->where('title', 'like', "%{$search}%")
                    ->orWhere('short_description', 'like', "%{$search}%");
            });
        }

        $sortField = $request->input('sort', 'created_at');
        $sortDirection = $request->input('direction', 'desc');

        $allowedSortFields = ['title', 'created_at', 'published_at', 'price'];
        if (!in_array($sortField, $allowedSortFields, true)) {
            $sortField = 'created_at';
        }

        $coursesQuery->orderBy($sortField, $sortDirection === 'asc' ? 'asc' : 'desc');
        $coursesQuery->with(['category', 'subject', 'gradeLevel']);
        $coursesQuery->withCount('purchases as enrollment_count');
        $courses = $coursesQuery->paginate(10)->withQueryString();
        $categories = \App\Models\Category::orderBy('name')->get();

        return view('teacher.courses.index', compact('courses', 'categories'));
    }


    public function create(): View
    {
        $categories = Category::orderBy('name')->get();
        $subjects = Subject::orderBy('name')->get();
        $gradeLevels = GradeLevel::orderBy('name')->get();
        $subscriptionTiers = SubscriptionTier::orderBy('price')->get();

        return view('teacher.courses.create', compact(
            'categories',
            'subjects',
            'gradeLevels',
            'subscriptionTiers'
        ));
    }


    public function store(StoreCourseRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $thumbnail = $request->hasFile('thumbnail_path') ? $request->file('thumbnail_path') : null;
        
        // Create the course using the service
        $course = $this->courseCreationService->createCourse(
            $validated,
            $thumbnail,
            $request->user()
        );
        
        return redirect()
            ->route('teacher.courses.builder', $course)
            ->with('success', get_lms_term('Study Material') . ' created successfully. Now you can add content to your curriculum.');
    }


    public function show(Course $course): View
    {
        return view('teacher.courses.edit.settings', compact('course'));
    }


    public function edit(Course $course): View
    {
        return $this->builder($course);
    }


    public function update(Request $request, Course $course)
    {
    }


    public function updateStatus(Request $request, Course $course): JsonResponse|RedirectResponse
    {
        if (!$this->canManageCourse($course)) {
            return redirect()->back()->with('error', 'You are not authorized to update this ' . get_lms_term('study material') . '.');
        }

        $request->validate([
            'is_published' => 'required|boolean',
        ]);

        $wasPublished = $course->is_published;
        $isPublished = (bool) $request->input('is_published');


        if (!$wasPublished && $isPublished) {
            $publishingRequirements = $this->validatePublishingRequirements($course);

            if (!$publishingRequirements['allRequirementsMet']) {
                $missingRequirements = array_keys(array_filter(
                    $publishingRequirements['requirements'],
                    fn ($req) => $req['required'] && !$req['met']
                ));

                return response()->json([
                    'success' => false,
                    'error' => 'Course does not meet publishing requirements',
                    'missing_requirements' => $missingRequirements,
                    'requirements' => $publishingRequirements['requirements']
                ], 422);
            }

            $course->published_at = now();
        }

        $course->is_published = $isPublished;
        $course->save();

        $message = $isPublished ? 'Course published successfully.' : 'Course unpublished successfully.';

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => $message,
                'is_published' => $isPublished
            ]);
        }

        return redirect()->back()->with('success', $message);
    }

    /**
     * Validate course publishing requirements
     */
    private function validatePublishingRequirements(Course $course): array
    {
        $requirements = [
            'title' => [
                'label' => 'Course Title',
                'met' => !empty($course->title),
                'required' => true
            ],
            'description' => [
                'label' => 'Course Description',
                'met' => !empty($course->description) && strlen($course->description) >= 50,
                'required' => true
            ],
            'thumbnail' => [
                'label' => 'Course Thumbnail',
                'met' => !empty($course->thumbnail_path),
                'required' => true
            ],
            'content' => [
                'label' => 'Course Content',
                'met' => $course->sections()->count() > 0 && $course->sections()->whereHas('lessons')->count() > 0,
                'required' => true
            ],
            'pricing' => [
                'label' => 'Pricing Setup',
                'met' => $this->validatePricingSetup($course),
                'required' => true
            ],
            'instructor' => [
                'label' => 'Instructor Information',
                'met' => !empty($course->instructor_info),
                'required' => true
            ]
        ];

        $requiredMet = array_filter($requirements, fn ($req) => $req['required'] && $req['met']);
        $allRequiredCount = count(array_filter($requirements, fn ($req) => $req['required']));
        $allRequirementsMet = count($requiredMet) === $allRequiredCount;

        return [
            'requirements' => $requirements,
            'allRequirementsMet' => $allRequirementsMet,
            'completionPercentage' => $allRequiredCount > 0 ? round((count($requiredMet) / $allRequiredCount) * 100) : 0
        ];
    }

    /**
     * Validate course submission requirements (updated for approval workflow)
     */
    private function validateSubmissionRequirements(Course $course): array
    {
        $requirements = [
            'title' => [
                'label' => 'Course Title',
                'met' => !empty($course->title),
                'required' => true
            ],
            'description' => [
                'label' => 'Course Description (minimum 50 characters)',
                'met' => !empty($course->description) && strlen($course->description) >= 50,
                'required' => true
            ],
            'thumbnail' => [
                'label' => 'Course Thumbnail',
                'met' => !empty($course->thumbnail_path),
                'required' => false
            ],
            'content' => [
                'label' => 'Course Content (at least one lesson)',
                'met' => $course->sections()->count() > 0 && $course->sections()->whereHas('lessons')->count() > 0,
                'required' => true
            ],
            'pricing' => [
                'label' => 'Pricing Setup',
                'met' => $this->validatePricingSetup($course),
                'required' => true
            ],
            'duration' => [
                'label' => 'Course Duration',
                'met' => $course->calculateTotalDuration() > 0,
                'required' => true
            ]
        ];

        $requiredMet = array_filter($requirements, fn ($req) => $req['required'] && $req['met']);
        $allRequiredCount = count(array_filter($requirements, fn ($req) => $req['required']));
        $allRequirementsMet = count($requiredMet) === $allRequiredCount;

        return [
            'requirements' => $requirements,
            'allRequirementsMet' => $allRequirementsMet,
            'completionPercentage' => $allRequiredCount > 0 ? round((count($requiredMet) / $allRequiredCount) * 100) : 0
        ];
    }

    /**
     * Validate course pricing setup based on pricing type
     */
    private function validatePricingSetup(Course $course): bool
    {
        $pricingType = $course->pricing_type ?? 'free';

        switch ($pricingType) {
            case 'free':
                return true;

            case 'purchase':
                return !empty($course->price) && $course->price > 0;

            case 'subscription':
                return !empty($course->required_subscription_tier_id);

            case 'both':
                return !empty($course->price) && $course->price > 0 && !empty($course->required_subscription_tier_id);

            default:
                return false;
        }
    }

    /**
     * AJAX endpoint to validate publishing requirements
     */
    public function validatePublishingRequirementsAjax(Course $course): JsonResponse
    {
        if (Auth::id() !== $course->user_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $publishingRequirements = $this->validatePublishingRequirements($course);

        return response()->json($publishingRequirements);
    }

    /**
     * AJAX endpoint to validate submission requirements (for approval workflow)
     */
    public function validateSubmissionRequirementsAjax(Course $course): JsonResponse
    {
        if (Auth::id() !== $course->user_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $submissionRequirements = $this->validateSubmissionRequirements($course);

        return response()->json($submissionRequirements);
    }

    /**
     * Publish course endpoint - Updated for approval workflow
     */
    public function publishCourse(Request $request, Course $course): JsonResponse
    {
        if (!$this->canManageCourse($course)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to publish this ' . get_lms_term('study material') . '.'
            ], 403);
        }

        $request->validate([
            'action' => 'required|string|in:submit,unpublish',
        ]);

        $action = $request->input('action');

        if ($action === 'submit') {

            if ($course->isSubmittedForApproval() || $course->isApproved()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course is already submitted or approved',
                ], 422);
            }


            $calculatedDuration = $course->calculateTotalDuration();


            $course->update(['duration_in_minutes' => $calculatedDuration]);
            $course->refresh();

            if (!$course->canBeSubmittedForApproval()) {
                $submissionRequirements = $this->validateSubmissionRequirements($course);

                if (!$submissionRequirements['allRequirementsMet']) {
                    $missingRequirements = array_keys(array_filter(
                        $submissionRequirements['requirements'],
                        fn ($req) => $req['required'] && !$req['met']
                    ));

                    return response()->json([
                        'success' => false,
                        'message' => 'Course does not meet submission requirements',
                        'missing_requirements' => $missingRequirements,
                        'requirements' => $submissionRequirements['requirements']
                    ], 422);
                }
            }

            $course->submitForApproval();

            return response()->json([
                'success' => true,
                'message' => get_lms_term('Study Material') . ' has been published successfully.',
                'redirect' => route('teacher.courses.index')
            ]);

        } elseif ($action === 'unpublish') {

            if (!$course->is_published) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course is not currently published',
                ], 422);
            }

            $course->update([
                'is_published' => false,
                'approval_status' => 'draft',
                'editing_locked' => false,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Course unpublished successfully.',
                'is_published' => false,
                'approval_status' => $course->approval_status
            ]);
        }

        return response()->json(['error' => 'Invalid action'], 400);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Course $course)
    {

        if (!$this->canManageCourse($course)) {
            return redirect()->back()->with('error', 'You are not authorized to delete this course.');
        }


        $course->delete();

        return redirect()->route('teacher.courses.index')->with('success', 'Course deleted successfully.');
    }



    /**
     * Display the curriculum tab for a course.
     */
    public function showCurriculumTab(Course $course): View
    {




        return $this->builder($course);
    }


    public function storeSection(Request $request, Course $course): JsonResponse
    {

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $maxOrder = $course->sections()->max('order') ?? 0;

        $section = $course->sections()->create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'order' => $maxOrder + 1,
            'is_published' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Section created successfully.',
            'section' => $section->load('lessons')
        ]);
    }


    public function updateSection(UpdateCourseSectionRequest $request, Course $course, CourseSection $section): JsonResponse
    {
        try {


            $validated = $request->validated();
            $section->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Section updated successfully.',
                'section' => $section->fresh()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update section: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroySection(Course $course, CourseSection $section): JsonResponse
    {
        try {







            $section->delete();

            return response()->json([
                'success' => true,
                'message' => 'Section deleted successfully.',
                'section_id' => $section->id
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete section: ' . $e->getMessage()
            ], 500);
        }
    }


    public function reorderSections(Request $request, Course $course): JsonResponse
    {

        $request->validate([
            'section_ids' => 'required|array',
            'section_ids.*' => 'exists:course_sections,id',
        ]);

        foreach ($request->input('section_ids') as $index => $sectionId) {
            CourseSection::where('id', $sectionId)
                ->where('course_id', $course->id)
                ->update(['order' => $index + 1]);
        }

        return response()->json(['message' => 'Sections reordered successfully.']);
    }

    /**
     * Reorder content (lessons, quizzes, assignments) within a section.
     * Expects a request with an ordered array of content item IDs and their types.
     * e.g., ['items' => [
     *     ['id' => 1, 'type' => 'lesson', 'order' => 1],
     *     ['id' => 1, 'type' => 'quiz', 'order' => 2],
     * ]]
     */
    public function reorderSectionContent(Request $request, Course $course, CourseSection $section): JsonResponse
    {

        $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|integer',
            'items.*.type' => 'required|string|in:lesson,quiz,assignment',
            'items.*.order' => 'required|integer|min:1',
        ]);

        foreach ($request->input('items') as $itemData) {
            $modelClass = match ($itemData['type']) {
                'lesson' => \App\Models\Lesson::class,
                'quiz' => \App\Models\Quiz::class,
                'assignment' => \App\Models\Assignment::class,
                default => null,
            };

            if ($modelClass) {
                $modelClass::where('id', $itemData['id'])
                    ->where('course_section_id', $section->id)
                    ->update(['order' => $itemData['order']]);
            }
        }
        return response()->json(['message' => 'Section content reordered successfully.']);
    }

    /**
     * Display the materials search and import tab for a course.
     */
    public function showMaterialsTab(Course $course): View
    {

        if (Auth::id() !== $course->user_id) {
            abort(403, 'You are not authorized to manage materials for this course.');
        }


        $otherCourses = Course::where('user_id', Auth::id())
            ->where('id', '!=', $course->id)
            ->orderBy('title')
            ->get();


        $sections = $course->sections()->orderBy('order')->get();

        return view('teacher.courses.builder', compact('course', 'otherCourses', 'sections'));
    }

    /**
     * Search for course materials to import.
     */
    public function searchCourseMaterials(Request $request, Course $course): JsonResponse
    {

        if (Auth::id() !== $course->user_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'q' => 'required|string|min:2|max:100',
            'type' => 'nullable|string|in:all,lesson,quiz,assignment',
            'course_id' => 'nullable|integer|exists:courses,id'
        ]);

        $query = $validated['q'];
        $type = $validated['type'] ?? 'all';
        $sourceId = $validated['course_id'] ?? null;


        if ($sourceId && Course::where('id', $sourceId)->where('user_id', Auth::id())->doesntExist()) {
            return response()->json(['error' => 'Unauthorized source course'], 403);
        }


        $results = [];


        $coursesToSearch = $sourceId
            ? Course::where('id', $sourceId)->get()
            : Course::where('user_id', Auth::id())->where('id', '!=', $course->id)->get();

        foreach ($coursesToSearch as $sourceCourse) {

            if ($type === 'all' || $type === 'lesson') {
                $lessons = $sourceCourse->lessons()
                    ->where(function ($q) use ($query) {
                        $q->where('title', 'like', "%{$query}%")
                            ->orWhere('short_description', 'like', "%{$query}%");
                    })
                    ->get();

                foreach ($lessons as $lesson) {
                    $results[] = [
                        'id' => $lesson->id,
                        'title' => $lesson->title,
                        'type' => 'lesson',
                        'description' => $lesson->short_description,
                        'course' => [
                            'id' => $sourceCourse->id,
                            'title' => $sourceCourse->title
                        ]
                    ];
                }
            }


            if ($type === 'all' || $type === 'quiz') {
                $quizzes = $sourceCourse->quizzes()
                    ->where(function ($q) use ($query) {
                        $q->where('title', 'like', "%{$query}%")
                            ->orWhere('description', 'like', "%{$query}%");
                    })
                    ->get();

                foreach ($quizzes as $quiz) {
                    $results[] = [
                        'id' => $quiz->id,
                        'title' => $quiz->title,
                        'type' => 'quiz',
                        'description' => Str::limit($quiz->description, 100),
                        'course' => [
                            'id' => $sourceCourse->id,
                            'title' => $sourceCourse->title
                        ]
                    ];
                }
            }


            if ($type === 'all' || $type === 'assignment') {
                $assignments = $sourceCourse->assignments()
                    ->where(function ($q) use ($query) {
                        $q->where('title', 'like', "%{$query}%")
                            ->orWhere('description', 'like', "%{$query}%");
                    })
                    ->get();

                foreach ($assignments as $assignment) {
                    $results[] = [
                        'id' => $assignment->id,
                        'title' => $assignment->title,
                        'type' => 'assignment',
                        'description' => Str::limit($assignment->description, 100),
                        'course' => [
                            'id' => $sourceCourse->id,
                            'title' => $sourceCourse->title
                        ]
                    ];
                }
            }
        }

        return response()->json([
            'success' => true,
            'results' => $results
        ]);
    }


    public function importMaterialToSection(Request $request, Course $course, CourseSection $section): JsonResponse
    {

        if (Auth::id() !== $course->user_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }


        $validated = $request->validate([
            'items' => 'required|array',
            'items.*' => 'required|string',
        ]);

        $importedItems = [];
        $errors = [];


        DB::beginTransaction();

        try {
            foreach ($validated['items'] as $item) {

                list($type, $id) = explode('_', $item);

                switch ($type) {
                    case 'lesson':
                        $importedItems[] = $this->importLesson((int)$id, $course, $section);
                        break;

                    case 'quiz':
                        $importedItems[] = $this->importQuiz((int)$id, $course, $section);
                        break;

                    case 'assignment':
                        $importedItems[] = $this->importAssignment((int)$id, $course, $section);
                        break;

                    default:
                        $errors[] = "Unknown item type: {$type}";
                }
            }


            if (!empty($errors)) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'errors' => $errors
                ], 422);
            }


            DB::commit();

            return response()->json([
                'success' => true,
                'imported' => $importedItems,
                'message' => count($importedItems) . ' items successfully imported.'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'error' => 'Import failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Import a lesson from another course.
     */
    private function importLesson(int $lessonId, Course $targetCourse, CourseSection $targetSection): array
    {

        $sourceLesson = \App\Models\Lesson::findOrFail($lessonId);


        if ($sourceLesson->course->user_id !== Auth::id()) {
            throw new \Exception('Unauthorized to import this lesson');
        }


        $maxOrder = $targetSection->lessons()->max('order') ?? 0;


        $newLesson = $sourceLesson->replicate();
        $newLesson->course_id = $targetCourse->id;
        $newLesson->course_section_id = $targetSection->id;
        $newLesson->order = $maxOrder + 1;
        $newLesson->created_at = now();
        $newLesson->updated_at = now();
        $newLesson->save();


        if ($sourceLesson->video_source === 'upload' && $sourceLesson->video_upload_path) {


        }


        if ($sourceLesson->attachments()->count() > 0) {
            foreach ($sourceLesson->attachments as $attachment) {
                $newAttachment = $attachment->replicate();
                $newAttachment->lesson_id = $newLesson->id;
                $newAttachment->created_at = now();
                $newAttachment->updated_at = now();
                $newAttachment->save();



            }
        }

        return [
            'type' => 'lesson',
            'id' => $newLesson->id,
            'title' => $newLesson->title
        ];
    }

    /**
     * Import a quiz from another course.
     */
    private function importQuiz(int $quizId, Course $targetCourse, CourseSection $targetSection): array
    {

        $sourceQuiz = \App\Models\Quiz::with('questions.options', 'questions.keywordAnswers', 'questions.gapAnswers', 'questions.matchingPairs')
            ->findOrFail($quizId);


        if ($sourceQuiz->course->user_id !== Auth::id()) {
            throw new \Exception('Unauthorized to import this quiz');
        }


        $maxOrder = $targetSection->quizzes()->max('order') ?? 0;


        $newQuiz = $sourceQuiz->replicate();
        $newQuiz->course_id = $targetCourse->id;
        $newQuiz->course_section_id = $targetSection->id;
        $newQuiz->order = $maxOrder + 1;
        $newQuiz->created_at = now();
        $newQuiz->updated_at = now();
        $newQuiz->save();


        foreach ($sourceQuiz->questions as $question) {
            $newQuestion = $question->replicate();
            $newQuestion->quiz_id = $newQuiz->id;
            $newQuestion->created_at = now();
            $newQuestion->updated_at = now();
            $newQuestion->save();


            foreach ($question->options as $option) {
                $newOption = $option->replicate();
                $newOption->question_id = $newQuestion->id;
                $newOption->save();
            }


            foreach ($question->keywordAnswers as $keyword) {
                $newKeyword = $keyword->replicate();
                $newKeyword->question_id = $newQuestion->id;
                $newKeyword->save();
            }


            foreach ($question->gapAnswers as $gap) {
                $newGap = $gap->replicate();
                $newGap->question_id = $newQuestion->id;
                $newGap->save();
            }


            foreach ($question->matchingPairs as $pair) {
                $newPair = $pair->replicate();
                $newPair->question_id = $newQuestion->id;
                $newPair->save();



            }
        }

        return [
            'type' => 'quiz',
            'id' => $newQuiz->id,
            'title' => $newQuiz->title
        ];
    }

    /**
     * Import an assignment from another course.
     */
    private function importAssignment(int $assignmentId, Course $targetCourse, CourseSection $targetSection): array
    {

        $sourceAssignment = \App\Models\Assignment::findOrFail($assignmentId);


        if ($sourceAssignment->course->user_id !== Auth::id()) {
            throw new \Exception('Unauthorized to import this assignment');
        }


        $maxOrder = $targetSection->assignments()->max('order') ?? 0;


        $newAssignment = $sourceAssignment->replicate();
        $newAssignment->course_id = $targetCourse->id;
        $newAssignment->course_section_id = $targetSection->id;
        $newAssignment->order = $maxOrder + 1;
        $newAssignment->created_at = now();
        $newAssignment->updated_at = now();
        $newAssignment->save();

        return [
            'type' => 'assignment',
            'id' => $newAssignment->id,
            'title' => $newAssignment->title
        ];
    }

    /**
     * Display the settings tab for a course.
     */
    public function showSettingsTab(Course $course): View
    {




        $categories = \App\Models\Category::orderBy('name')->get();
        $subjects = \App\Models\Subject::orderBy('name')->get();
        $gradeLevels = \App\Models\GradeLevel::orderBy('name')->get();
        $certificateTemplates = \App\Models\CertificateTemplate::where('is_active', true)->orderBy('name')->get();
        $allCourses = \App\Models\Course::where('user_id', Auth::id())
            ->where('id', '!=', $course->id)
            ->get();

        return view('teacher.courses.builder', compact(
            'course',
            'categories',
            'subjects',
            'gradeLevels',
            'certificateTemplates',
            'allCourses'
        ));
    }

    /**
     * Update the course settings.
     */
    public function updateSettings(Request $request, Course $course): RedirectResponse
    {

        if (Auth::id() !== $course->user_id) {
            return redirect()->back()->with('error', 'You are not authorized to update this course.');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', \Illuminate\Validation\Rule::unique('courses', 'slug')->ignore($course->id)],
            'short_description' => ['required', 'string', 'max:500'],
            'description' => ['required', 'string'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'subject_id' => ['required', 'integer', 'exists:subjects,id'],
            'grade_level_id' => ['required', 'integer', 'exists:grade_levels,id'],
            'language' => ['nullable', 'string', 'max:50'],
            'tags' => ['nullable', 'string'],
            'what_you_will_learn' => ['nullable', 'string'],
            'requirements' => ['nullable', 'string'],
            'instructor_info' => ['nullable', 'string'],
            'is_featured' => ['nullable', 'boolean'],
            'is_recommended' => ['nullable', 'boolean'],
            'allow_certificate' => ['nullable', 'boolean'],
            'certificate_template_id' => ['nullable', 'integer', 'exists:certificate_templates,id'],
            'is_published' => ['required', 'boolean'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:255'],
            'meta_keywords' => ['nullable', 'string', 'max:255'],
        ]);


        if (isset($validated['tags']) && !empty($validated['tags'])) {
            $validated['tags'] = array_map('trim', explode(',', $validated['tags']));
        } else {
            $validated['tags'] = [];
        }


        if ($request->hasFile('thumbnail')) {
            $request->validate([
                'thumbnail' => ['image', 'mimes:jpeg,png,jpg,gif', 'max:2048'],
            ]);

            $file = $request->file('thumbnail');


            $cloudPath = Storage::cloud()->put('course-thumbnails', $file);


            if ($course->thumbnail_path && Storage::cloud()->exists($course->thumbnail_path)) {
                Storage::cloud()->delete($course->thumbnail_path);
            }

            $validated['thumbnail_path'] = $cloudPath;
            $validated['thumbnail_url'] = Storage::cloud()->url($cloudPath);
        }


        if ($validated['is_published'] && !$course->is_published) {
            $validated['published_at'] = now();
        }

        $course->update($validated);

        return redirect()->route('teacher.courses.settings', $course)->with('success', 'Course settings updated successfully.');
    }

    /**
     * Display the pricing tab for a course.
     */
    public function showPricingTab(Course $course): View
    {

        if (Auth::id() !== $course->user_id) {
            abort(403, 'You are not authorized to manage pricing for this course.');
        }


        $subscriptionTiers = \App\Models\SubscriptionTier::where('is_active', true)
            ->orderBy('level')
            ->get();

        return view('teacher.courses.builder.partials._pricing_content', compact('course', 'subscriptionTiers'));
    }

    /**
     * Update the pricing settings for a course.
     */
    public function updatePricing(Request $request, Course $course): RedirectResponse
    {

        if (Auth::id() !== $course->user_id) {
            return redirect()->back()->with('error', 'You are not authorized to update pricing for this course.');
        }

        $validated = $request->validate([
            'pricing_type' => ['required', 'string', 'in:free,subscription,purchase,both'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'sale_price' => ['nullable', 'numeric', 'min:0'],
            'sale_start_date' => ['nullable', 'date'],
            'sale_end_date' => ['nullable', 'date', 'after_or_equal:sale_start_date'],
            'required_subscription_tier_id' => ['nullable', 'integer', 'exists:subscription_tiers,id'],
            'enable_coupon' => ['nullable', 'boolean'],
            'enable_bulk_purchase' => ['nullable', 'boolean'],
            'enable_gift_option' => ['nullable', 'boolean'],
            'course_points' => ['nullable', 'integer', 'min:0'],
            'price_info' => ['nullable', 'string', 'max:1000'],
        ]);


        if (($validated['pricing_type'] === 'purchase' || $validated['pricing_type'] === 'both') &&
            (!isset($validated['price']) || $validated['price'] <= 0)) {
            return redirect()->back()
                ->withErrors(['price' => 'Price is required and must be greater than 0 for purchase options.'])
                ->withInput();
        }

        if (($validated['pricing_type'] === 'subscription' || $validated['pricing_type'] === 'both') &&
            empty($validated['required_subscription_tier_id'])) {
            return redirect()->back()
                ->withErrors(['required_subscription_tier_id' => 'Subscription tier is required for subscription options.'])
                ->withInput();
        }


        DB::beginTransaction();

        try {

            $updateData = [
                'pricing_type' => $validated['pricing_type'],
                'enable_coupon' => $validated['enable_coupon'] ?? false,
                'enable_bulk_purchase' => $validated['enable_bulk_purchase'] ?? false,
                'enable_gift_option' => $validated['enable_gift_option'] ?? false,
                'sale_price' => $validated['sale_price'],
                'sale_start_date' => $validated['sale_start_date'],
                'sale_end_date' => $validated['sale_end_date'],
                'course_points' => $validated['course_points'],
                'price_info' => $validated['price_info'],
            ];

            switch ($validated['pricing_type']) {
                case 'free':
                    $updateData['price'] = 0;
                    $updateData['subscription_required'] = false;
                    $updateData['required_subscription_tier_id'] = null;
                    break;

                case 'purchase':
                    $updateData['price'] = $validated['price'];
                    $updateData['subscription_required'] = false;
                    $updateData['required_subscription_tier_id'] = null;
                    break;

                case 'subscription':
                    $updateData['price'] = 0;
                    $updateData['subscription_required'] = true;
                    $updateData['required_subscription_tier_id'] = $validated['required_subscription_tier_id'];
                    break;

                case 'both':
                    $updateData['price'] = $validated['price'];
                    $updateData['subscription_required'] = true;
                    $updateData['required_subscription_tier_id'] = $validated['required_subscription_tier_id'];
                    break;
            }


            $course->update($updateData);

            DB::commit();


            $message = match ($validated['pricing_type']) {
                'free' => 'Course set as free successfully.',
                'purchase' => 'Purchase pricing updated successfully.',
                'subscription' => 'Subscription-only pricing updated successfully.',
                'both' => 'Pricing updated to allow both purchase and subscription access.',
                default => 'Pricing updated successfully.'
            };

            return redirect()->back()->with('success', $message);

        } catch (\Exception $e) {
            DB::rollBack();

            return redirect()->back()
                ->with('error', 'Failed to update pricing. Please try again.')
                ->withInput();
        }
    }

    /**
     * Handle thumbnail upload for a course.
     */
    public function uploadThumbnail(Request $request, Course $course): JsonResponse
    {

        if (Auth::id() !== $course->user_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'thumbnail' => ['required', 'image', 'mimes:jpeg,png,jpg,gif', 'max:2048'],
        ]);

        $file = $request->file('thumbnail');


        $cloudPath = Storage::cloud()->put('course-thumbnails', $file);


        if ($course->thumbnail_path && Storage::cloud()->exists($course->thumbnail_path)) {
            Storage::cloud()->delete($course->thumbnail_path);
        }


        $course->update([
            'thumbnail_path' => $cloudPath,
            'thumbnail_url' => Storage::cloud()->url($cloudPath)
        ]);

        return response()->json([
            'message' => 'Thumbnail uploaded successfully.',
            'thumbnail_url' => $course->thumbnail_url
        ]);
    }

    /**
     * Display the notices tab for a course.
     */
    public function showNoticeTab(Course $course): View
    {

        if (Auth::id() !== $course->user_id) {
            abort(403, 'You are not authorized to view notices for this course.');
        }


        $notices = $course->notices()->orderBy('order')->get();

        return view('teacher.courses.builder', compact('course', 'notices'));
    }

    /**
     * Display the drip content tab for a course.
     */
    public function showDripTab(Course $course): View
    {

        if (Auth::id() !== $course->user_id) {
            abort(403, 'You are not authorized to manage drip content for this course.');
        }


        $sections = $course->sections()
            ->orderBy('order')
            ->with(['lessons' => function ($query) {
                $query->orderBy('order');
            }])
            ->get();

        return view('teacher.courses.builder', compact('course', 'sections'));
    }

    /**
     * Update the drip content settings for a course.
     */
    public function updateDrip(Request $request, Course $course): RedirectResponse
    {

        if (Auth::id() !== $course->user_id) {
            return redirect()->back()->with('error', 'You are not authorized to update this course.');
        }

        $validated = $request->validate([
            'sections' => 'array',
            'sections.*.id' => 'required|exists:course_sections,id',
            'sections.*.unlock_date' => 'nullable|date',
            'sections.*.unlock_after_days' => 'nullable|integer|min:0',
            'lessons' => 'array',
            'lessons.*.id' => 'required|exists:lessons,id',
            'lessons.*.unlock_date' => 'nullable|date',
            'lessons.*.unlock_after_purchase_days' => 'nullable|integer|min:0',
        ]);


        DB::beginTransaction();

        try {

            if (isset($validated['sections'])) {
                foreach ($validated['sections'] as $sectionData) {
                    $section = \App\Models\CourseSection::findOrFail($sectionData['id']);


                    if ($section->course_id !== $course->id) {
                        throw new \Exception('Section does not belong to this course');
                    }

                    $section->update([
                        'unlock_date' => $sectionData['unlock_date'] ?? null,
                        'unlock_after_days' => $sectionData['unlock_after_days'] ?? null,
                    ]);
                }
            }


            if (isset($validated['lessons'])) {
                foreach ($validated['lessons'] as $lessonData) {
                    $lesson = \App\Models\Lesson::findOrFail($lessonData['id']);


                    if ($lesson->course_id !== $course->id) {
                        throw new \Exception('Lesson does not belong to this course');
                    }

                    $lesson->update([
                        'unlock_date' => $lessonData['unlock_date'] ?? null,
                        'unlock_after_purchase_days' => $lessonData['unlock_after_purchase_days'] ?? null,
                    ]);
                }
            }

            DB::commit();
            return redirect()->route('teacher.courses.drip', $course)
                ->with('success', 'Drip content settings updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->with('error', 'Error updating drip content settings: ' . $e->getMessage());
        }
    }

    /**
     * Display the FAQ tab for a course.
     */
    public function showFaqTab(Course $course): View
    {

        if (Auth::id() !== $course->user_id) {
            abort(403, 'You are not authorized to view FAQs for this course.');
        }


        $faqs = $course->faqs()->orderBy('order')->get();

        return view('teacher.courses.builder', compact('course', 'faqs'));
    }

    /**
     * Show the course builder interface.
     *
     * This provides a unified editor with proper sidebar navigation.
     */
    public function builder(Course $course): View
    {
        /** @var User $user */
        $user = Auth::user();







        if ($course->sections()->count() === 0) {
            DB::transaction(function () use ($course) {
                $defaultSection = $course->sections()->create([
                    'title' => 'Getting Started',
                    'description' => 'This is your first section. Start by adding content to these lessons or create new ones.',
                    'order' => 1,
                ]);

                $textLessonTitle = 'Your First Text Lesson';
                Lesson::create([
                    'course_id' => $course->id,
                    'section_id' => $defaultSection->id,
                    'title' => $textLessonTitle,
                    'slug' => Str::slug($textLessonTitle . '-' . $defaultSection->id . '-1'),
                    'lesson_type' => LessonType::TEXT->value,
                    'order' => 1,
                    'content' => '<p>Start writing your text-based lesson here! You can use the editor to format your content, add images, and more.</p>',
                    'duration_minutes' => 5,
                ]);


                $videoLessonTitle = 'Add an Introduction Video';
                Lesson::create([
                    'course_id' => $course->id,
                    'section_id' => $defaultSection->id,
                    'title' => $videoLessonTitle,
                    'slug' => Str::slug($videoLessonTitle . '-' . $defaultSection->id . '-2'),
                    'lesson_type' => LessonType::VIDEO->value,
                    'order' => 2,
                    'video_url' => 'https://example.com/default_video.mp4',
                    'description' => '<p>Embed a video from YouTube, Vimeo, or upload your own.</p>',
                    'duration_minutes' => 10,
                ]);

                $streamLessonTitle = 'Set Up a Live Stream';
                Lesson::create([
                    'course_id' => $course->id,
                    'section_id' => $defaultSection->id,
                    'title' => $streamLessonTitle,
                    'slug' => Str::slug($streamLessonTitle . '-' . $defaultSection->id . '-3'),
                    'lesson_type' => LessonType::STREAM->value,
                    'order' => 3,
                    'stream_url' => 'https://example.com/default_stream',
                    'stream_start_time' => now()->addDays(1),
                    'description' => '<p>Schedule and set up your live streaming lesson details here.</p>',
                    'duration_minutes' => 60,
                ]);

                $defaultSection->quizzes()->create([
                    'course_id' => $course->id,
                    'title' => 'Create a Quick Quiz',
                    'description' => 'Test your students\' understanding with a few questions.',
                    'pass_mark' => 50,
                    'order' => 4,
                ]);
            });
        }


        $course->load([
            'sections' => function ($query) {
                $query->orderBy('order')->select(['id', 'course_id', 'title', 'order', 'is_published']);
            }
        ]);


        foreach ($course->sections as $section) {
            $section->load([
                'lessons' => function ($query) {
                    $query->orderBy('order')->select(['id', 'course_section_id', 'title', 'lesson_type', 'order']);
                },
                'quizzes' => function ($query) {
                    $query->orderBy('order')->select(['id', 'course_section_id', 'title', 'order']);
                },
                'assignments' => function ($query) {
                    $query->orderBy('order')->select(['id', 'course_section_id', 'title', 'order']);
                }
            ]);
        }

        return view('teacher.courses.builder', compact('course'));
    }

    /**
     * Preview the course as a student would see it.
     */
    public function preview(Course $course): View
    {

        if (Auth::id() !== $course->user_id) {
            abort(403, 'You do not have permission to preview this course.');
        }


        $course->load(['sections.lessons', 'sections.quizzes', 'sections.assignments', 'faqs', 'notices']);

        return view('teacher.courses.preview', compact('course'));
    }

    /**
     * Get lesson type-specific fields for dynamic loading in the course builder.
     */
    public function getLessonTypeFields(Course $course, string $type): JsonResponse
    {

        if (Auth::id() !== $course->user_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }


        $typeMapping = [
            'quiz' => 'quiz_link',
            'assignment' => 'assignment_link'
        ];

        $templateType = $typeMapping[$type] ?? $type;


        $validTypes = ['quiz', 'assignment', 'text', 'video', 'stream', 'past_papers'];

        if (!in_array($type, $validTypes, true)) {
            return response()->json(['error' => 'Invalid lesson type'], 400);
        }

        try {
            $data = [];

            switch ($type) {
                case 'quiz':

                    $data['quizzes'] = $course->sections()
                        ->with(['quizzes' => function ($query) {
                            $query->orderBy('title');
                        }])
                        ->get()
                        ->pluck('quizzes')
                        ->flatten()
                        ->map(function ($quiz) {
                            return [
                                'id' => $quiz->id,
                                'title' => $quiz->title,
                                'question_count' => $quiz->questions()->count(),
                                'pass_mark' => $quiz->passing_grade ?? $quiz->pass_mark ?? 70
                            ];
                        });
                    break;

                case 'assignment':

                    $data['assignments'] = $course->sections()
                        ->with(['assignments' => function ($query) {
                            $query->orderBy('title');
                        }])
                        ->get()
                        ->pluck('assignments')
                        ->flatten()
                        ->map(function ($assignment) {
                            return [
                                'id' => $assignment->id,
                                'title' => $assignment->title,
                                'max_points' => $assignment->points_possible ?? $assignment->max_points ?? 100,
                                'submission_type' => $assignment->submission_type ?? 'file'
                            ];
                        });
                    break;

                case 'text':
                    $data['editorConfig'] = [
                        'toolbar' => 'full',
                        'height' => 300
                    ];
                    break;

                case 'video':
                    $data['editorConfig'] = [
                        'toolbar' => 'full',
                        'height' => 300
                    ];
                    break;

                case 'stream':
                    $data['editorConfig'] = [
                        'toolbar' => 'full',
                        'height' => 300
                    ];
                    break;

                case 'past_papers':
                    $data['editorConfig'] = [
                        'toolbar' => 'full',
                        'height' => 300
                    ];
                    break;
            }


            $view = "teacher.courses.builder.lesson-types.{$templateType}-lesson-fields";

            if (!view()->exists($view)) {
                return response()->json([
                    'error' => 'Template not found',
                    'message' => "Template '{$view}' does not exist",
                    'debug_info' => [
                        'original_type' => $type,
                        'template_type' => $templateType,
                        'view_path' => $view
                    ]
                ], 404);
            }

            $html = view($view, $data)->render();

            return response()->json([
                'success' => true,
                'html' => $html,
                'data' => $data
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to load lesson type fields',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Resubmit a rejected course for approval.
     */
    public function resubmitCourse(Course $course): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();


        if ($course->user_id !== $user->id) {
            abort(403, 'You are not authorized to resubmit this course.');
        }


        if ($course->approval_status !== 'rejected') {
            return redirect()->back()->with('error', 'Only rejected courses can be resubmitted.');
        }


        $validationResult = $this->validateSubmissionRequirements($course);
        if (!$validationResult['allRequirementsMet']) {
            $missingRequirements = array_keys(array_filter(
                $validationResult['requirements'],
                fn ($req) => $req['required'] && !$req['met']
            ));

            return redirect()->back()
                ->withErrors(['requirements' => 'Please fix the following issues before resubmitting: ' . implode(', ', $missingRequirements)]);
        }


        $course->update([
            'approval_status' => 'submitted',
            'submitted_at' => now(),
            'rejected_at' => null,
            'editing_locked' => true,
        ]);


        $admins = User::whereHas('roles', function ($query) {
            $query->where('name', 'admin');
        })->get();

        foreach ($admins as $admin) {
            $admin->notify(new \App\Notifications\CourseResubmittedNotification($course, $user));
        }

        return redirect()->route('teacher.courses.builder', $course)
            ->with('success', 'Course has been resubmitted for approval. You will be notified once it has been reviewed.');
    }

    /**
     * Submit a course for approval - simplified endpoint
     */
    public function submitForApproval(Course $course): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();


        if ($course->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to submit this course.'
            ], 403);
        }


        if ($course->isSubmittedForApproval() || $course->isApproved()) {
            return response()->json([
                'success' => false,
                'message' => 'Course is already submitted or approved'
            ], 422);
        }

        try {

            $calculatedDuration = $course->calculateTotalDuration();


            $course->update(['duration_in_minutes' => $calculatedDuration]);
            $course->refresh();


            $course->submitForApproval();

            return response()->json([
                'success' => true,
                'message' => 'Course submitted for approval successfully! You will be notified once it is reviewed.',
                'approval_status' => $course->approval_status
            ]);
        } catch (\Exception $e) {

            Log::error('Course submission error', [
                'course_id' => $course->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while submitting your course.'
            ], 500);
        }
    }
}
