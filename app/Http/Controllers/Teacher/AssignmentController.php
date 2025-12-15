<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Http\Requests\Teacher\StoreAssignmentRequest;
use App\Http\Requests\Teacher\UpdateAssignmentRequest;
use App\Http\Requests\Teacher\GradeSubmissionRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;
use Illuminate\Http\JsonResponse;

final class AssignmentController extends Controller
{
    /**
     * Show the form for creating a new assignment.
     */
    public function create(Course $course, CourseSection $section): View
    {
        $this->authorize('update', $section);

        $assignment = new Assignment();

        return view('teacher.assignments.create', compact('course', 'section', 'assignment'));
    }

    /**
     * Store a newly created assignment in storage.
     */
    public function store(StoreAssignmentRequest $request, Course $course, CourseSection $section): JsonResponse
    {
        $this->authorize('update', $section);

        $validated = $request->validated();

        $maxOrder = $section->assignments()->max('order') ?? 0;

        $assignmentData = [
            'course_id' => $course->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'instructions' => $validated['instructions'] ?? null,
            'due_date' => $validated['due_date'] ?? null,
            'points_possible' => $validated['points_possible'] ?? null,
            'allowed_submission_types' => $validated['allowed_submission_types'] ?? ['pdf', 'docx', 'zip'],
            'unlock_date' => $validated['unlock_date'] ?? null,
            'order' => $maxOrder + 1,
        ];

        try {
            $assignment = $section->assignments()->create($assignmentData);
            return response()->json(['message' => 'Assignment created successfully.', 'assignment' => $assignment], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to create assignment: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified assignment.
     */
    public function show(Course $course, CourseSection $section, Assignment $assignment, Request $request): JsonResponse|View
    {
        $this->authorize('view', $assignment);

        if ($request->wantsJson() || $request->query('format') === 'json') {

            return response()->json($assignment);
        }

        return view('teacher.assignments.show', compact('course', 'section', 'assignment'));
    }

    /**
     * Show the form for editing the specified assignment.
     */
    public function edit(Course $course, CourseSection $section, Assignment $assignment): View
    {
        $this->authorize('update', $assignment);

        return view('teacher.assignments.edit', compact('course', 'section', 'assignment'));
    }

    /**
     * Update the specified assignment in storage.
     */
    public function update(UpdateAssignmentRequest $request, Course $course, CourseSection $section, Assignment $assignment): JsonResponse
    {
        $this->authorize('update', $assignment);

        if ((int)$assignment->course_id !== (int)$course->id || (int)$assignment->section_id !== (int)$section->id) {
            return response()->json(['message' => 'Assignment does not belong to the specified course or section.'], 403);
        }

        $validated = $request->validated();

        $assignmentData = [
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'instructions' => $validated['instructions'] ?? null,
            'due_date' => $validated['due_date'] ?? null,
            'points_possible' => $validated['points_possible'] ?? null,
            'allowed_submission_types' => $validated['allowed_submission_types'] ?? ['pdf', 'docx', 'zip'],
            'unlock_date' => $validated['unlock_date'] ?? null,

        ];

        try {
            $assignment->update($assignmentData);
            $assignment->refresh();
            return response()->json(['message' => 'Assignment updated successfully.', 'assignment' => $assignment]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to update assignment: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified assignment from storage.
     */
    public function destroy(Course $course, CourseSection $section, Assignment $assignment): JsonResponse
    {
        $this->authorize('delete', $assignment);
        if ((int)$assignment->course_id !== (int)$course->id || (int)$assignment->section_id !== (int)$section->id) {
            return response()->json(['message' => 'Assignment does not belong to the specified course or section.'], 403);
        }

        try {


            $assignment->delete();
            return response()->json(['message' => 'Assignment deleted successfully.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to delete assignment: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Reorder assignments within a section.
     */
    public function reorder(Request $request, Course $course, CourseSection $section): JsonResponse
    {
        $this->authorize('update', $section);

        $orderedAssignmentIds = $request->input('ordered_ids');

        if (!is_array($orderedAssignmentIds)) {
            return response()->json(['message' => 'Invalid data provided for reordering.'], 400);
        }

        try {
            foreach ($orderedAssignmentIds as $index => $assignmentId) {

                $assignment = $section->assignments()->find($assignmentId);
                if ($assignment) {
                    $assignment->order = $index + 1;
                    $assignment->save();
                }
            }
            return response()->json(['message' => 'Assignments reordered successfully.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to reorder assignments: ' . $e->getMessage()], 500);
        }
    }

    /**
     * View all submissions for an assignment.
     */
    public function submissions(Course $course, CourseSection $section, Assignment $assignment): View
    {
        $this->authorize('view', $assignment);

        $submissions = $assignment->submissions()
            ->with('user')
            ->orderBy('submitted_at', 'desc')
            ->paginate(20);

        return view('teacher.assignments.submissions.index', compact(
            'course',
            'section',
            'assignment',
            'submissions'
        ));
    }

    /**
     * View a specific submission.
     */
    public function viewSubmission(Course $course, CourseSection $section, Assignment $assignment, AssignmentSubmission $submission): View
    {
        $this->authorize('view', $submission);

        return view('teacher.assignments.submissions.show', compact(
            'course',
            'section',
            'assignment',
            'submission'
        ));
    }

    /**
     * Grade a submission.
     */
    public function gradeSubmission(GradeSubmissionRequest $request, Course $course, CourseSection $section, Assignment $assignment, AssignmentSubmission $submission): RedirectResponse
    {
        $this->authorize('grade', $submission);

        $validated = $request->validated();

        $submission->update([
            'grade' => $validated['grade'],
            'teacher_feedback' => $validated['teacher_feedback'] ?? null,
            'graded_at' => now(),
            'grading_teacher_id' => Auth::id(),
        ]);

        return redirect()->route('teacher.courses.assignments.submissions', [
            $course,
            $section,
            $assignment,
        ])->with('success', 'Submission graded successfully.');
    }
}
