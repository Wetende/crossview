<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Lesson;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\JsonResponse;
use Illuminate\View\View;
use App\Models\Quiz;
use App\Models\Assignment;

final class LessonController extends Controller
{
    public function create(Course $course, CourseSection $section, Request $request): View
    {


        $lessonType = $request->query('lesson_type', 'text');


        $allowedLessonTypes = array_column(\App\Enums\LessonType::cases(), 'value');
        if (!in_array($lessonType, $allowedLessonTypes, true)) {
            abort(400, 'Invalid lesson type specified.');
        }

        $lesson = new Lesson(['lesson_type' => $lessonType]);

        $availableQuizzes = [];
        $availableAssignments = [];

        if ($lessonType === 'quiz_link') {
            $availableQuizzes = $course->quizzes()->orderBy('title')->get();
        }

        if ($lessonType === 'assignment_link') {
            $availableAssignments = $course->assignments()->orderBy('title')->get();
        }

        return view('teacher.lessons.create', compact(
            'course',
            'section',
            'lesson',
            'lessonType',
            'availableQuizzes',
            'availableAssignments'
        ));
    }

    /**
     * Store a newly created lesson in storage.
     */










































































    public function store(Request $request, Course $course, CourseSection $section): JsonResponse
    {



        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'lesson_type' => 'required|string|in:text,video,stream,zoom,quiz,assignment',
            'is_published' => 'boolean'
        ]);

        $maxOrder = $section->lessons()->max('order') ?? 0;

        try {
            $lesson = $section->lessons()->create([
                'course_id' => $course->id,
                'title' => $validated['title'],
                'slug' => \Illuminate\Support\Str::slug($validated['title']) . '-' . \Illuminate\Support\Str::random(4),
                'lesson_type' => $validated['lesson_type'],
                'order' => $maxOrder + 1,
                'is_published' => $validated['is_published'] ?? false,
                'user_id' => \Illuminate\Support\Facades\Auth::id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Lesson created successfully.',
                'lesson' => $lesson
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create lesson: ' . $e->getMessage()
            ], 500);
        }
    }
    /**
     * Display the specified lesson (perhaps for a preview or direct linking, though typically edited in context).
     */
    public function show(Course $course, CourseSection $section, Lesson $lesson, Request $request): JsonResponse|View
    {
        $this->authorize('view', $lesson);

        if ($request->wantsJson() || $request->query('format') === 'json') {
            return response()->json($lesson);
        }

        return view('teacher.lessons.show', compact('course', 'section', 'lesson'));
    }

    /**
     * Temporary method to redirect lesson editing to the course builder
     * This will be removed when the builder integration is complete
     */
    public function editInBuilder(Course $course, Lesson $lesson)
    {
        $this->authorize('update', $course);


        return redirect()->route('teacher.courses.builder', $course)
            ->with('editLessonId', $lesson->id)
            ->with('info', 'Click on the lesson in the sidebar to edit it.');
    }

    /**
     * Get lesson data for the builder interface
     * Used for loading lesson content into the curriculum content area
     */
    public function getLessonBuilderData(Course $course, Lesson $lesson): JsonResponse
    {
        $this->authorize('update', $course);

        try {
            $lessonData = [
                'id' => $lesson->id,
                'title' => $lesson->title,
                'lesson_type' => $lesson->lesson_type->value,
                'lesson_duration' => $lesson->lesson_duration,
                'short_description' => $lesson->short_description,
                'content' => $lesson->content,
                'is_published' => $lesson->is_published,
                'order' => $lesson->order,
            ];


            switch ($lesson->lesson_type->value) {
                case 'video':
                    $lessonData['video_source'] = $lesson->video_source;
                    $lessonData['video_url'] = $lesson->video_url;
                    $lessonData['video_embed_code'] = $lesson->video_embed_code;
                    $lessonData['enable_download'] = $lesson->enable_download;
                    break;
                case 'stream':
                    $lessonData['stream_url'] = $lesson->stream_url;
                    $lessonData['stream_password'] = $lesson->stream_password;
                    $lessonData['stream_start_time'] = $lesson->stream_start_time;
                    $lessonData['stream_details'] = $lesson->stream_details;
                    $lessonData['is_recorded'] = $lesson->is_recorded;
                    $lessonData['recording_url'] = $lesson->recording_url;
                    break;
                case 'quiz':
                    $lessonData['quiz_id'] = $lesson->quiz_id;
                    $lessonData['quiz_instructions'] = $lesson->quiz_instructions;
                    $lessonData['auto_grade'] = $lesson->auto_grade;
                    $lessonData['show_results'] = $lesson->show_results;
                    $lessonData['show_correct_answers'] = $lesson->show_correct_answers;
                    $lessonData['enable_time_limit'] = $lesson->enable_time_limit;
                    $lessonData['quiz_hours'] = $lesson->quiz_hours;
                    $lessonData['quiz_minutes'] = $lesson->quiz_minutes;
                    $lessonData['max_attempts'] = $lesson->max_attempts;
                    $lessonData['retake_penalty'] = $lesson->retake_penalty;
                    $lessonData['randomize_questions'] = $lesson->randomize_questions;
                    $lessonData['randomize_options'] = $lesson->randomize_options;
                    break;
                case 'assignment':
                    $lessonData['assignment_id'] = $lesson->assignment_id;
                    $lessonData['assignment_instructions'] = $lesson->assignment_instructions;
                    $lessonData['submission_type'] = $lesson->submission_type;
                    $lessonData['assignment_due_date'] = $lesson->assignment_due_date;
                    $lessonData['max_file_size'] = $lesson->max_file_size;
                    $lessonData['allowed_file_types'] = $lesson->allowed_file_types ? explode(',', $lesson->allowed_file_types) : [];
                    $lessonData['allow_multiple_files'] = $lesson->allow_multiple_files;
                    $lessonData['late_submission_policy'] = $lesson->late_submission_policy;
                    $lessonData['late_penalty'] = $lesson->late_penalty;
                    $lessonData['auto_assign_points'] = $lesson->auto_assign_points;
                    $lessonData['allow_resubmission'] = $lesson->allow_resubmission;
                    $lessonData['peer_review'] = $lesson->peer_review;
                    break;
                case 'past_papers':
                    $lessonData['allow_bulk_download'] = $lesson->allow_bulk_download;
                    $lessonData['track_downloads'] = $lesson->track_downloads;
                    $lessonData['require_completion'] = $lesson->require_completion;


                    $lessonData['past_papers_files'] = $lesson->attachments()->orderBy('order')->get()->map(function ($attachment) {
                        return [
                            'id' => $attachment->id,
                            'file_name' => $attachment->file_name,
                            'original_name' => $attachment->original_name,
                            'file_size' => $attachment->file_size,
                            'file_type' => $attachment->file_type,
                            'download_url' => $attachment->download_url,
                            'order' => $attachment->order,
                        ];
                    });
                    break;
            }

            return response()->json([
                'success' => true,
                'lesson' => $lessonData,
                'lessonType' => $lesson->lesson_type->value
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load lesson data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test endpoint to check if basic functionality works
     */
    public function testEndpoint(Request $request, Course $course): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Test endpoint working',
            'course_id' => $course->id,
            'request_data' => $request->all()
        ]);
    }

    /**
     * Unified save endpoint for lessons (create or update)
     */
    public function saveLesson(Request $request, Course $course): JsonResponse
    {
        try {



            $lessonId = $request->input('lesson_id');
            $sectionId = $request->input('section_id');
            $originalLessonType = $request->input('lesson_type');


            $lessonTypeMapping = [
                'quiz' => 'quiz_link',
                'assignment' => 'assignment_link'
            ];

            $lessonType = $lessonTypeMapping[$originalLessonType] ?? $originalLessonType;


            $request->merge(['lesson_type' => $lessonType]);


            $validationRules = $this->getValidationRules($lessonType, $lessonId ? true : false);

            try {

                $requestData = $request->all();
                if (isset($requestData['grading_method']) && $requestData['grading_method'] !== 'rubric') {
                    $requestData['rubric_criteria'] = [];
                    $request->merge($requestData);
                }


                if ($lessonType === 'quiz_link') {

                    if ($request->input('quiz_id')) {
                        $validationRules = array_filter($validationRules, function ($key) {
                            return !str_starts_with($key, 'new_quiz_') && $key !== 'questions';
                        }, ARRAY_FILTER_USE_KEY);
                    } else {

                        $validationRules['new_quiz_title'] = 'required|string|max:255';
                        $validationRules['questions'] = 'required|array|min:1';
                    }
                }

                if ($lessonType === 'assignment_link') {

                    if ($request->input('assignment_id')) {
                        $validationRules = array_filter($validationRules, function ($key) {
                            return !str_starts_with($key, 'new_assignment_') && !str_starts_with($key, 'assignment_requirements');
                        }, ARRAY_FILTER_USE_KEY);
                    } else {

                        $validationRules['new_assignment_title'] = 'required|string|max:255';
                        $validationRules['assignment_requirements'] = 'required|array|min:1';
                    }
                }

                $validated = $request->validate($validationRules);

            } catch (\Illuminate\Validation\ValidationException $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors()
                ], 422);
            }

            if ($lessonId) {

                $lesson = Lesson::findOrFail($lessonId);



                $updateData = $this->prepareUpdateData($validated, $lessonType, $sectionId);


                if ($lessonType === 'video' && $validated['video_source'] === 'local' && $request->hasFile('video_file')) {
                    $videoFile = $request->file('video_file');
                    $path = $videoFile->store('courses/' . $course->id . '/lessons/videos', 'public');
                    $updateData['video_upload_path'] = $path;
                    $updateData['video_url'] = Storage::url($path);
                }


                if ($lessonType === 'past_papers') {
                    $this->handlePastPapersFiles($request, $lesson, $course);
                }

                $lesson->update($updateData);
                $message = 'Lesson updated successfully';
            } else {

                if (!$sectionId) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Section ID is required for new lessons'
                    ], 400);
                }

                $section = $course->sections()->findOrFail($sectionId);
                $maxOrder = $section->lessons()->max('order') ?? 0;

                $lessonData = $this->prepareCreateData($validated, $lessonType, $course, $maxOrder, (int)$sectionId);


                if ($lessonType === 'video' && $validated['video_source'] === 'local' && $request->hasFile('video_file')) {
                    $videoFile = $request->file('video_file');
                    $path = $videoFile->store('courses/' . $course->id . '/lessons/videos', 'public');
                    $lessonData['video_upload_path'] = $path;
                    $lessonData['video_url'] = Storage::url($path);
                }

                $lesson = $section->lessons()->create($lessonData);


                if ($lessonType === 'past_papers') {
                    $this->handlePastPapersFiles($request, $lesson, $course);
                }
                $message = 'Lesson created successfully';
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'lesson' => $lesson->fresh()
            ]);

        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to save lesson: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get validation rules based on lesson type
     */
    private function getValidationRules(string $lessonType, bool $isUpdate = false): array
    {
        $baseRules = [
            'title' => 'required|string|max:255',
            'lesson_duration' => 'nullable|string|max:50',
            'short_description' => 'nullable|string|max:500',
            'is_published' => 'boolean',
        ];


        if ($isUpdate) {
            $baseRules['lesson_id'] = 'required|integer|exists:lessons,id';
        } else {
            $baseRules['section_id'] = 'required|integer|exists:course_sections,id';
            $baseRules['lesson_type'] = 'required|string|in:text,video,stream,quiz_link,assignment_link,past_papers';
        }

        switch ($lessonType) {
            case 'text':
                return array_merge($baseRules, [
                    'content' => 'required|string',
                    'enable_print' => 'boolean',
                    'enable_copy' => 'boolean',
                ]);
            case 'video':
                return array_merge($baseRules, [
                    'video_source' => 'required|in:youtube,vimeo,local,other',
                    'video_url' => 'required_unless:video_source,local|url',
                    'video_file' => 'required_if:video_source,local|file|mimes:mp4,avi,mov,wmv,flv,webm|max:102400',
                    'content' => 'nullable|string',
                    'auto_play' => 'boolean',
                    'show_controls' => 'boolean',
                    'allow_download' => 'boolean',
                ]);
            case 'stream':
                return array_merge($baseRules, [
                    'stream_url' => 'required|url',
                    'stream_start_time' => 'nullable|date',
                    'stream_password' => 'nullable|string|max:255',
                    'stream_details' => 'nullable|string',
                    'is_recorded' => 'boolean',
                    'recording_url' => 'nullable|url',
                    'notify_students' => 'boolean',
                    'allow_chat' => 'boolean',
                    'require_attendance' => 'boolean',
                ]);
            case 'quiz_link':
                return array_merge($baseRules, [

                    'quiz_id' => 'nullable|exists:quizzes,id',
                    'new_quiz_title' => 'nullable|string|max:255',
                    'new_quiz_description' => 'nullable|string',
                    'new_quiz_pass_mark' => 'nullable|integer|min:0|max:100',
                    'new_quiz_duration' => 'nullable|integer|min:1',
                    'questions' => 'nullable|array',
                    'quiz_instructions' => 'nullable|string',
                    'auto_grade' => 'nullable|boolean',
                    'show_results' => 'nullable|boolean',
                    'show_correct_answers' => 'nullable|boolean',
                    'enable_time_limit' => 'nullable|boolean',
                    'quiz_hours' => 'nullable|integer|min:0|max:23',
                    'quiz_minutes' => 'nullable|integer|min:0|max:59',
                    'max_attempts' => 'nullable|integer|min:-1',
                    'retake_penalty' => 'nullable|integer|min:0|max:100',
                    'randomize_questions' => 'nullable|boolean',
                    'randomize_options' => 'nullable|boolean',
                ]);
            case 'assignment_link':
                return array_merge($baseRules, [

                    'assignment_id' => 'nullable|exists:assignments,id',


                    'new_assignment_title' => 'nullable|string|max:255',
                    'new_assignment_description' => 'nullable|string',
                    'new_assignment_max_points' => 'nullable|integer|min:1',
                    'new_assignment_type' => 'nullable|in:project,essay,research,presentation,portfolio,practical,other',


                    'assignment_requirements' => 'nullable|array',
                    'assignment_requirements.*' => 'string|max:500',


                    'grading_method' => 'nullable|in:points,rubric',
                    'rubric_criteria' => 'nullable|array',
                    'rubric_criteria.*.name' => 'required_if:grading_method,rubric|string|max:255',
                    'rubric_criteria.*.points' => 'required_if:grading_method,rubric|integer|min:1',
                    'rubric_criteria.*.description' => 'nullable|string',


                    'assignment_instructions' => 'nullable|string',
                    'submission_type' => 'nullable|in:file,text,link,both',
                    'assignment_due_date' => 'nullable|date',
                    'max_file_size' => 'nullable|integer|min:1|max:100',
                    'allowed_file_types' => 'nullable|array',
                    'allowed_file_types.*' => 'string|in:pdf,docx,txt,zip,images,videos,audio',
                    'allow_multiple_files' => 'boolean',
                    'late_submission_policy' => 'nullable|in:not_allowed,penalty,no_penalty',
                    'late_penalty' => 'nullable|integer|min:0|max:100',
                    'auto_assign_points' => 'boolean',
                    'allow_resubmission' => 'boolean',
                    'peer_review' => 'boolean',
                ]);
            case 'past_papers':
                return array_merge($baseRules, [
                    'content' => 'nullable|string',
                    'past_papers_files.*' => 'file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,txt,rtf,zip,rar,7z,jpg,jpeg,png,gif,bmp,svg|max:51200',
                    'allow_bulk_download' => 'boolean',
                    'track_downloads' => 'boolean',
                    'require_completion' => 'boolean',
                    'existing_files' => 'nullable|array',
                    'existing_files.*' => 'integer|exists:lesson_attachments,id',
                ]);
            default:
                return $baseRules;
        }
    }

    /**
     * Prepare data for lesson update
     */
    private function prepareUpdateData(array $validated, string $lessonType, int|string|null $sectionId = null): array
    {
        if ($sectionId !== null) {
            $sectionId = (int)$sectionId;
        }

        $updateData = [
            'title' => $validated['title'],
            'lesson_duration' => $validated['lesson_duration'] ?? null,
            'short_description' => $validated['short_description'] ?? null,
            'is_published' => $validated['is_published'] ?? false,
        ];


        switch ($lessonType) {
            case 'text':
                $updateData['content'] = $validated['content'];
                $updateData['enable_print'] = $validated['enable_print'] ?? false;
                $updateData['enable_copy'] = $validated['enable_copy'] ?? false;
                break;
            case 'video':
                $updateData['video_source'] = $validated['video_source'];
                $updateData['video_url'] = $validated['video_url'] ?? null;
                $updateData['content'] = $validated['content'] ?? null;
                $updateData['auto_play'] = $validated['auto_play'] ?? false;
                $updateData['show_controls'] = $validated['show_controls'] ?? true;
                $updateData['allow_download'] = $validated['allow_download'] ?? false;


                if ($validated['video_source'] === 'local' && isset($validated['video_file'])) {

                    $updateData['_has_video_file'] = true;
                }
                break;
            case 'stream':
                $updateData['stream_url'] = $validated['stream_url'];
                $updateData['stream_start_time'] = $validated['stream_start_time'] ?? null;
                $updateData['stream_password'] = $validated['stream_password'] ?? null;
                $updateData['stream_details'] = $validated['stream_details'] ?? null;
                $updateData['is_recorded'] = $validated['is_recorded'] ?? false;
                $updateData['recording_url'] = $validated['recording_url'] ?? null;
                $updateData['notify_students'] = $validated['notify_students'] ?? true;
                $updateData['allow_chat'] = $validated['allow_chat'] ?? true;
                $updateData['require_attendance'] = $validated['require_attendance'] ?? false;
                break;
            case 'quiz_link':

                if (!empty($validated['new_quiz_title'])) {

                    $quizData = $this->createQuizFromData($validated, $sectionId);
                    $updateData['quiz_id'] = $quizData['id'];
                } else {
                    $updateData['quiz_id'] = $validated['quiz_id'] ?? null;
                }


                $updateData['instructions'] = $validated['quiz_instructions'] ?? null;
                break;
            case 'assignment_link':

                if (!empty($validated['new_assignment_title'])) {

                    $assignmentData = $this->createAssignmentFromData($validated, $sectionId);
                    $updateData['assignment_id'] = $assignmentData['id'];
                } else {
                    $updateData['assignment_id'] = $validated['assignment_id'] ?? null;
                }


                $updateData['instructions'] = $validated['assignment_instructions'] ?? null;
                break;
            case 'past_papers':
                $updateData['content'] = $validated['content'] ?? null;
                $updateData['allow_bulk_download'] = $validated['allow_bulk_download'] ?? true;
                $updateData['track_downloads'] = $validated['track_downloads'] ?? true;
                $updateData['require_completion'] = $validated['require_completion'] ?? false;


                $updateData['_has_past_papers_files'] = true;
                break;
        }

        return $updateData;
    }

    /**
     * Prepare data for lesson creation
     */
    private function prepareCreateData(array $validated, string $lessonType, Course $course, int $maxOrder, int|string $sectionId): array
    {
        $sectionId = (int)$sectionId;

        $lessonData = [
            'course_id' => $course->id,
            'title' => $validated['title'],
            'slug' => \Illuminate\Support\Str::slug($validated['title']) . '-' . \Illuminate\Support\Str::random(4),
            'lesson_type' => $validated['lesson_type'],
            'order' => $maxOrder + 1,
            'lesson_duration' => $validated['lesson_duration'] ?? null,
            'short_description' => $validated['short_description'] ?? null,
            'is_published' => $validated['is_published'] ?? false,
        ];


        $updateData = $this->prepareUpdateData($validated, $lessonType, $sectionId);
        $finalData = array_merge($lessonData, $updateData);

        return $finalData;
    }

    /**
     * Remove the specified lesson from storage.
     */
    public function destroy(Course $course, Lesson $lesson): JsonResponse
    {
        $this->authorize('delete', $lesson);

        try {

            if ($lesson->lesson_type->value === 'video' && $lesson->video_source === 'html5' && $lesson->video_upload_path) {
                Storage::delete(str_replace(Storage::url(''), '', $lesson->video_upload_path));
            }


            $lesson->delete();
            return response()->json(['success' => true, 'message' => 'Lesson deleted successfully.']);
        } catch (\Exception $e) {

            return response()->json(['success' => false, 'message' => 'Failed to delete lesson. ' . $e->getMessage()], 500);
        }
    }

    /**
     * Create a new quiz from validated form data
     */
    private function createQuizFromData(array $validated, ?int $sectionId = null): array
    {

        $quiz = Quiz::create([
            'title' => $validated['new_quiz_title'],
            'description' => $validated['new_quiz_description'] ?? '',
            'passing_grade' => $validated['new_quiz_pass_mark'] ?? 70,
            'time_limit' => $validated['new_quiz_duration'] ?? 30,
            'randomize_questions' => $validated['randomize_questions'] ?? false,
            'show_correct_answer' => $validated['show_correct_answers'] ?? false,
            'retake_penalty_percent' => $validated['retake_penalty'] ?? 0,
            'user_id' => \Illuminate\Support\Facades\Auth::id(),
            'course_section_id' => $sectionId,
        ]);


        if (!empty($validated['questions'])) {
            foreach ($validated['questions'] as $index => $questionData) {
                if (empty($questionData['text'])) {
                    continue;
                }

                $question = $quiz->questions()->create([
                    'text' => $questionData['text'],
                    'question_type' => $questionData['type'] ?? 'single_choice',
                    'points' => $questionData['points'] ?? 1,
                    'order' => $index + 1,
                ]);


                switch ($questionData['type']) {
                    case 'single_choice':
                    case 'multiple_choice':
                        if (!empty($questionData['options'])) {
                            foreach ($questionData['options'] as $optionIndex => $optionData) {

                                $optionText = is_array($optionData) ? ($optionData['text'] ?? '') : $optionData;

                                if (!empty($optionText)) {
                                    $isCorrect = false;


                                    if ($questionData['type'] === 'single_choice') {
                                        $isCorrect = isset($questionData['correct_answer']) && $questionData['correct_answer'] == $optionIndex;
                                    } else {
                                        if (is_array($optionData) && isset($optionData['is_correct'])) {
                                            $isCorrect = (bool)$optionData['is_correct'];
                                        } elseif (isset($questionData['correct_answers']) && is_array($questionData['correct_answers'])) {
                                            $isCorrect = in_array($optionIndex, $questionData['correct_answers'], true);
                                        }
                                    }

                                    $question->options()->create([
                                        'text' => $optionText,
                                        'is_correct' => $isCorrect,
                                        'order' => $optionIndex + 1,
                                    ]);
                                }
                            }
                        }
                        break;

                    case 'true_false':

                        $question->options()->create([
                            'text' => 'True',
                            'is_correct' => isset($questionData['correct_answer']) && $questionData['correct_answer'] === 'true',
                            'order' => 1,
                        ]);
                        $question->options()->create([
                            'text' => 'False',
                            'is_correct' => isset($questionData['correct_answer']) && $questionData['correct_answer'] === 'false',
                            'order' => 2,
                        ]);
                        break;

                    case 'fill_gap':
                        if (!empty($questionData['gap_answers'])) {
                            $question->update([
                                'explanation' => json_encode($questionData['gap_answers'])
                            ]);
                        }
                        break;

                    case 'keywords':
                        if (!empty($questionData['keywords'])) {
                            $question->update([
                                'explanation' => json_encode($questionData['keywords'])
                            ]);
                        }
                        break;

                    case 'matching':
                        if (!empty($questionData['pairs'])) {
                            $question->update([
                                'explanation' => json_encode($questionData['pairs'])
                            ]);
                        }
                        break;
                }
            }
        }

        return ['id' => $quiz->id, 'title' => $quiz->title];
    }

    /**
     * Create a new assignment from validated form data
     */
    private function createAssignmentFromData(array $validated, ?int $sectionId = null): array
    {

        $assignment = \App\Models\Assignment::create([
            'course_section_id' => $sectionId,
            'title' => $validated['new_assignment_title'],
            'description' => $validated['new_assignment_description'] ?? '',
            'instructions' => $validated['assignment_instructions'] ?? '',
            'due_date' => $validated['assignment_due_date'] ?? null,
            'points_possible' => $validated['new_assignment_max_points'] ?? 100,
            'allowed_submission_types' => $this->prepareSubmissionTypes($validated),
            'order' => 1,
        ]);

        return ['id' => $assignment->id, 'title' => $assignment->title];
    }

    /**
     * Prepare submission types array from validated data
     */
    private function prepareSubmissionTypes(array $validated): array
    {
        $submissionTypes = [];

        $submissionType = $validated['submission_type'] ?? 'file';

        switch ($submissionType) {
            case 'file':
                $submissionTypes[] = 'file_upload';
                break;
            case 'text':
                $submissionTypes[] = 'text_entry';
                break;
            case 'link':
                $submissionTypes[] = 'url_submission';
                break;
            case 'both':
                $submissionTypes[] = 'file_upload';
                $submissionTypes[] = 'text_entry';
                break;
        }

        return $submissionTypes;
    }

    /**
     * Handle past papers file uploads and management
     */
    private function handlePastPapersFiles(Request $request, Lesson $lesson, Course $course): void
    {

        if ($request->hasFile('past_papers_files')) {
            $files = $request->file('past_papers_files');

            foreach ($files as $file) {

                $path = $file->store('courses/' . $course->id . '/lessons/' . $lesson->id . '/past-papers', 'public');


                $lesson->attachments()->create([
                    'file_name' => $file->getClientOriginalName(),
                    'file_path' => $path,
                    'file_type' => $file->getClientMimeType(),
                    'file_size' => $file->getSize(),
                    'original_name' => $file->getClientOriginalName(),
                    'download_url' => Storage::url($path),
                    'order' => $lesson->attachments()->count() + 1,
                ]);
            }
        }


        if ($request->has('existing_files')) {
            $existingFileIds = $request->input('existing_files', []);


            $currentAttachments = $lesson->attachments()->pluck('id')->toArray();


            $filesToRemove = array_diff($currentAttachments, $existingFileIds);

            if (!empty($filesToRemove)) {

                $attachmentsToRemove = $lesson->attachments()->whereIn('id', $filesToRemove)->get();

                foreach ($attachmentsToRemove as $attachment) {

                    if ($attachment->file_path && Storage::disk('public')->exists($attachment->file_path)) {
                        Storage::disk('public')->delete($attachment->file_path);
                    }


                    $attachment->delete();
                }
            }
        }
    }

}
