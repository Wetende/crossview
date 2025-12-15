<?php

declare(strict_types=1);

namespace App\Http\Controllers\Student;

use App\Enums\LessonType;
use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Models\LessonProgress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use HTMLPurifier;
use HTMLPurifier_Config;
use Illuminate\Support\Facades\Storage;
use App\Models\LessonAttachment;

final class LearnController extends Controller
{
    /**
     * Display the learning interface for a course
     */
    public function showCourse(Course $course)
    {
        $user = Auth::user();
        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('status', 'active')
            ->firstOrFail();

        $courseSections = $course->sections()
            ->with(['lessons' => function ($query) {
                $query->orderBy('order');
            }])
            ->orderBy('order')
            ->get();


        $firstLesson = $course->lessons()
            ->where('is_published', true)
            ->orderBy('order')
            ->first();


        if (!$firstLesson) {
            return view('student.courses.no-lessons', compact('course', 'courseSections'))
                ->with('info', 'This course does not have any lessons available yet.');
        }

        return $this->showLesson($course, $firstLesson);
    }

    /**
     * Display a specific lesson within a course
     */
    public function showLesson(Course $course, Lesson $lesson)
    {
        $user = Auth::user();
        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('status', 'active')
            ->firstOrFail();


        if ($lesson->course_id !== $course->id) {
            return redirect()->route('student.learn.course', $course)
                ->with('error', 'The lesson does not belong to this course.');
        }

        $courseSections = $course->sections()
            ->with(['lessons' => function ($query) use ($user) {
                $query->orderBy('order');
            }])
            ->orderBy('order')
            ->get();


        $lessonProgress = LessonProgress::where('enrollment_id', $enrollment->id)
            ->where('lesson_id', $lesson->id)
            ->first();

        if (!$lessonProgress) {

            $lessonProgress = LessonProgress::create([
                'enrollment_id' => $enrollment->id,
                'lesson_id' => $lesson->id,
                'progress_percentage' => 0,
                'last_accessed_at' => now(),
            ]);
        } else {

            $lessonProgress->update([
                'last_accessed_at' => now(),
            ]);
        }


        $isCompleted = $lesson->isCompletedByUser($user->id);


        $attachments = $lesson->attachments()->orderBy('order')->get();


        $previousLesson = $lesson->getPreviousLesson();
        $nextLesson = $lesson->getNextLesson();


        $content = null;
        if ($lesson->lesson_type === LessonType::TEXT) {
            $config = HTMLPurifier_Config::createDefault();
            $purifier = new HTMLPurifier($config);
            $content = $purifier->purify($lesson->content);
        }

        return view('student.lessons.show', compact(
            'course',
            'lesson',
            'courseSections',
            'lessonProgress',
            'isCompleted',
            'attachments',
            'previousLesson',
            'nextLesson',
            'content'
        ));
    }

    /**
     * Update progress for a lesson
     */
    public function updateProgress(Request $request, Course $course, Lesson $lesson)
    {
        $user = Auth::user();
        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('status', 'active')
            ->firstOrFail();


        $validator = Validator::make($request->all(), [
            'progress_percentage' => ['required', 'integer', 'min:0', 'max:100'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }


        $progress = LessonProgress::updateOrCreate(
            [
                'enrollment_id' => $enrollment->id,
                'lesson_id' => $lesson->id,
            ],
            [
                'progress_percentage' => $request->progress_percentage,
                'last_accessed_at' => now(),
            ]
        );



        if ($request->progress_percentage >= 95 &&
            in_array($lesson->lesson_type, [LessonType::VIDEO, LessonType::TEXT], true) &&
            !$lesson->isCompletedByUser($user->id)) {

            $this->markLessonComplete($request, $course, $lesson);
            return response()->json([
                'message' => 'Progress updated and lesson automatically marked as complete',
                'progress' => $progress,
                'completed' => true
            ]);
        }

        return response()->json([
            'message' => 'Progress updated successfully',
            'progress' => $progress
        ]);
    }

    /**
     * Mark a lesson as complete
     */
    public function markLessonComplete(Request $request, Course $course, Lesson $lesson)
    {
        $user = Auth::user();


        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('status', 'active')
            ->firstOrFail();


        if ($lesson->course_id !== $course->id) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Unauthorized action'], 403);
            }
            return redirect()->route('student.learn.course', $course)
                ->with('error', 'The lesson does not belong to this course.');
        }


        if (!$lesson->is_published) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'This lesson is not available'], 403);
            }
            return redirect()->route('student.learn.course', $course)
                ->with('error', 'This lesson is not available for completion.');
        }


        DB::beginTransaction();

        try {

            $completion = LessonCompletion::firstOrCreate(
                [
                    'user_id' => $user->id,
                    'lesson_id' => $lesson->id,
                ],
                [
                    'completed_at' => now(),
                ]
            );


            LessonProgress::updateOrCreate(
                [
                    'enrollment_id' => $enrollment->id,
                    'lesson_id' => $lesson->id,
                ],
                [
                    'progress_percentage' => 100,
                    'completed_at' => now(),
                    'last_accessed_at' => now(),
                ]
            );


            $totalLessons = $course->lessons()->where('is_published', true)->count();
            $completedLessons = LessonCompletion::where('user_id', $user->id)
                ->whereIn('lesson_id', $course->lessons()->where('is_published', true)->pluck('id'))
                ->count();

            $progressPercentage = $totalLessons > 0
                ? ($completedLessons / $totalLessons) * 100
                : 0;


            $enrollment->progress = $progressPercentage;


            if ($completedLessons >= $totalLessons) {
                $enrollment->completed_at = now();
            }

            $enrollment->save();

            DB::commit();

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Lesson marked as complete',
                    'progress' => $progressPercentage
                ]);
            }

            return redirect()->back()->with('success', 'Lesson marked as complete!');

        } catch (\Exception $e) {
            DB::rollBack();

            if ($request->expectsJson()) {
                return response()->json(['message' => 'An error occurred: ' . $e->getMessage()], 500);
            }

            return redirect()->back()->with('error', 'An error occurred while marking the lesson as complete.');
        }
    }

    /**
     * Download a lesson attachment
     */
    public function downloadAttachment(Course $course, Lesson $lesson, LessonAttachment $attachment)
    {
        $user = Auth::user();
        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('status', 'active')
            ->firstOrFail();


        if ($attachment->lesson_id !== $lesson->id) {
            return redirect()->route('student.learn.lesson', [$course, $lesson])
                ->with('error', 'The attachment does not belong to this lesson.');
        }


        if (Storage::disk('public')->exists($attachment->file_path)) {
            $file = Storage::disk('public')->get($attachment->file_path);
            $filePath = storage_path('app/public/' . $attachment->file_path);
            $mimeType = mime_content_type($filePath);

            return response($file, 200, [
                'Content-Type' => $mimeType,
                'Content-Disposition' => 'attachment; filename="' . $attachment->original_filename . '"',
            ]);
        }


        if (filter_var($attachment->file_path, FILTER_VALIDATE_URL)) {
            return redirect($attachment->file_path);
        }

        return redirect()->back()->with('error', 'File not found.');
    }
}
