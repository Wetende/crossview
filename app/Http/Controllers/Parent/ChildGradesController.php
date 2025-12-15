<?php

declare(strict_types=1);

namespace App\Http\Controllers\Parent;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\View\View;
use Illuminate\Support\Facades\Auth;
use App\Models\Enrollment;

final class ChildGradesController extends Controller
{
    /**
     * Display the grades for a specific child of the authenticated parent.
     *
     * @param User $child The child user model instance.
     */
    public function show(User $child): View
    {
        /** @var User $parent */
        $parent = Auth::user();


        $this->authorize('viewChildDetails', [$parent, $child]);


        $child->load([
            'enrollments.course.assignments.submissions' => function ($query) use ($child) {
                $query->where('user_id', $child->id);
            },




        ]);

        $coursesWithGrades = $child->enrollments->map(function (Enrollment $enrollment) {
            $course = $enrollment->course;
            if (!$course) {
                return null;
            }

            $gradeItems = collect();
            $totalScore = 0;
            $totalMaxScore = 0;
            $itemsCount = 0;


            if ($course->relationLoaded('assignments')) {
                foreach ($course->assignments as $assignment) {
                    $submission = $assignment->submissions->first();
                    $gradeItems->push([
                        'title' => $assignment->title,
                        'score' => $submission ? $submission->score : 'Not Submitted',
                        'max_score' => $assignment->max_score,
                        'type' => 'Assignment',
                    ]);
                    if ($submission && is_numeric($submission->score) && is_numeric($assignment->max_score)) {
                        $totalScore += (float)$submission->score;
                        $totalMaxScore += (float)$assignment->max_score;
                        $itemsCount++;
                    }
                }
            }




            $overallGrade = 'N/A';
            if ($itemsCount > 0 && $totalMaxScore > 0) {
                $overallGrade = round(($totalScore / $totalMaxScore) * 100) . '%';
            } elseif ($itemsCount > 0) {
                $overallGrade = 'Graded (no max score)';
            }

            return (object)[
                'id' => $course->id,
                'title' => $course->title,
                'overall_grade' => $overallGrade,
                'items' => $gradeItems->all(),
            ];
        })->filter();

        return view('parent.children.grades', [
            'child' => $child,
            'coursesWithGrades' => $coursesWithGrades,
        ]);
    }
}
