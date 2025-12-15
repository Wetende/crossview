<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\User;
use App\Models\Assignment;
use App\Models\Quiz;
use App\Models\AssignmentSubmission;
use App\Models\QuizAttempt;
use Illuminate\Http\Request;
use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Collection;

final class GradebookController extends Controller
{
    /**
     * Display a listing of courses for the teacher to select for viewing gradebook.
     */
    public function index(): View
    {
        /** @var User $teacher */
        $teacher = Auth::user();
        $courses = $teacher->courses()->orderBy('title')->get();

        return view('teacher.gradebook.index', ['courses' => $courses]);
    }

    /**
     * Show the gradebook for a specific course.
     * This will list students and their grades for various assignments/quizzes.
     */
    public function showCourseGradebook(Course $course, Request $request): View
    {



        $allStudents = $course->students()->orderBy('name')->get();

        $gradableItems = collect([]);
        $assignments = $course->assignments()->with('courseSection')->get();
        foreach ($assignments as $assignment) {
            if ($assignment->courseSection) {
                $gradableItems->push([
                    'id' => $assignment->id,
                    'title' => $assignment->title,
                    'type' => 'assignment',
                    'edit_route_name' => 'teacher.courses.sections.assignments.edit',
                    'edit_route_params' => [
                        'course' => $course->id,
                        'section' => $assignment->courseSection->id,
                        'assignment' => $assignment->id
                    ],
                    'item_key' => 'assignment_' . $assignment->id
                ]);
            }
        }

        $quizzes = $course->quizzes()->with('courseSection')->get();
        foreach ($quizzes as $quiz) {
            if ($quiz->courseSection) {
                $gradableItems->push([
                    'id' => $quiz->id,
                    'title' => $quiz->title,
                    'type' => 'quiz',
                    'edit_route_name' => 'teacher.courses.sections.quizzes.edit',
                    'edit_route_params' => [
                        'course' => $course->id,
                        'section' => $quiz->courseSection->id,
                        'quiz' => $quiz->id
                    ],
                    'item_key' => 'quiz_' . $quiz->id
                ]);
            }
        }
        $gradableItems = $gradableItems->sortBy('title')->values();

        $studentData = collect([]);
        foreach ($allStudents as $student) {
            $grades = $this->getStudentGradesForItemsArray($student, $gradableItems);
            $studentData->push([
                'student' => $student,
                'grades' => $grades
            ]);
        }


        $sortByItemIdKey = $request->input('sort_by_item_key');
        $sortDirection = $request->input('sort_direction', 'asc');

        if ($sortByItemIdKey) {
            $studentData = $studentData->sortBy(function ($data) use ($sortByItemIdKey, $sortDirection) {
                return $data['grades'][$sortByItemIdKey] ?? null;
            }, SORT_REGULAR, $sortDirection === 'desc');
        }

        return view('teacher.gradebook.course', [
            'course' => $course,
            'students' => $studentData,
            'gradableItems' => $gradableItems,
            'current_sort_item_key' => $sortByItemIdKey,
            'current_sort_direction' => $sortDirection,
        ]);
    }

    private function getStudentGradesForItemsArray(User $student, Collection $gradableItems): array
    {
        $studentGrades = [];
        foreach ($gradableItems as $item) {
            $score = null;
            if ($item['type'] === 'assignment') {
                $submission = AssignmentSubmission::where('assignment_id', $item['id'])
                                    ->where('user_id', $student->id)
                                    ->first();
                $score = $submission ? $submission->grade : null;
            } elseif ($item['type'] === 'quiz') {
                $attempt = QuizAttempt::where('quiz_id', $item['id'])
                                   ->where('user_id', $student->id)
                                   ->orderBy('score', 'desc')
                                   ->first();
                $score = $attempt ? $attempt->score : null;
            }
            $studentGrades[$item['item_key']] = $score;
        }
        return $studentGrades;
    }

    /**
     * Update a specific grade for a student in a course.
     * The $assignableId could be an ID for an Assignment, Quiz, etc.
     * The $assignableType would specify if it's an 'assignment', 'quiz', etc. (for polymorphic relations)
     */
    public function updateGrade(Request $request, Course $course, User $student): RedirectResponse
    {






        $validated = $request->validate([
            'item_id' => 'required|integer',
            'item_type' => 'required|string|in:assignment,quiz',
            'score' => 'nullable|numeric|min:0',
        ]);

        if ($validated['item_type'] === 'assignment') {
            $submission = AssignmentSubmission::updateOrCreate(
                [
                    'assignment_id' => $validated['item_id'],
                    'user_id' => $student->id,
                    'course_id' => $course->id,
                ],
                [
                    'grade' => $validated['score'],
                    'submitted_at' => now(),
                    'graded_at' => now(),
                    'grading_teacher_id' => Auth::id(),


                ]
            );
        } elseif ($validated['item_type'] === 'quiz') {




            $attempt = QuizAttempt::updateOrCreate(
                [
                    'quiz_id' => $validated['item_id'],
                    'user_id' => $student->id,

                ],
                [
                    'score' => $validated['score'],
                    'completed_at' => now(),
                    'started_at' => $attempt->started_at ?? now(),

                ]
            );
        }

        return redirect()->route('teacher.gradebook.course', [
            'course' => $course->id,
            'sort_by_item_key' => $request->input('current_sort_item_key'),
            'sort_direction' => $request->input('current_sort_direction')
            ])->with('success', "Grade for {$student->name} updated successfully.");
    }
}
