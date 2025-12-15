<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

final class CourseApprovalController extends Controller
{
    /**
     * Display a listing of courses pending approval.
     */
    public function index(Request $request): View
    {
        $query = Course::submittedForApproval()
            ->with(['teacher', 'category', 'gradeLevel'])
            ->orderBy('submitted_at', 'asc');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhereHas('teacher', function ($tq) use ($search) {
                      $tq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('category')) {
            $query->where('category_id', $request->input('category'));
        }

        if ($request->filled('grade_level')) {
            $query->where('grade_level_id', $request->input('grade_level'));
        }

        $pendingCourses = $query->paginate(15);

        $stats = [
            'pending' => Course::submittedForApproval()->count(),
            'approved_today' => Course::where('approved_at', '>=', today())->count(),
            'rejected_today' => Course::where('rejected_at', '>=', today())->count(),
            'total_submitted' => Course::whereIn('approval_status', ['submitted', 'approved', 'rejected'])->count(),
        ];

        $categories = \App\Models\Category::orderBy('name')->get();
        $gradeLevels = \App\Models\GradeLevel::orderBy('name')->get();

        return view('admin.course-approvals.index', compact('pendingCourses', 'stats', 'categories', 'gradeLevels'));
    }

    /**
     * Display the specified course for review.
     */
    public function show(Course $course): View|RedirectResponse
    {
        if (!$course->isSubmittedForApproval()) {
            return redirect()->route('admin.course-approvals.index')
                ->with('error', 'This course is not submitted for approval.');
        }

        $course->load([
            'teacher',
            'category',
            'subject',
            'gradeLevel',
            'sections.lessons',
            'sections.quizzes',
            'sections.assignments'
        ]);

        return view('admin.course-approvals.review', compact('course'));
    }

    /**
     * Approve a course submission.
     */
    public function approve(Request $request, Course $course): RedirectResponse
    {
        $request->validate([
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($course->approval_status !== 'submitted') {
            return redirect()->back()->with('error', 'Only submitted courses can be approved.');
        }

        $admin = Auth::user();
        $notes = $request->input('notes');

        $course->approveByAdmin($admin, $notes);

        return redirect()->route('admin.course-approvals.index')
            ->with('success', get_lms_term('Study Material') . " '{$course->title}' has been approved and published successfully.");
    }

    /**
     * Reject a course submission.
     */
    public function reject(Request $request, Course $course): RedirectResponse
    {
        $request->validate([
            'reason' => 'required|string|max:500',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($course->approval_status !== 'submitted') {
            return redirect()->back()->with('error', 'Only submitted courses can be rejected.');
        }

        $admin = Auth::user();
        $reason = $request->input('reason');
        $notes = $request->input('notes');

        $course->rejectByAdmin($admin, $reason, $notes);

        return redirect()->route('admin.course-approvals.index')
            ->with('success', get_lms_term('Study Material') . " '{$course->title}' has been rejected. The teacher has been notified.");
    }

    /**
     * Get approval statistics for dashboard.
     */
    public function getStats(): JsonResponse
    {
        $stats = [
            'pending' => Course::submittedForApproval()->count(),
            'approved_today' => Course::where('approved_at', '>=', today())->count(),
            'rejected_today' => Course::where('rejected_at', '>=', today())->count(),
            'approved_this_week' => Course::where('approved_at', '>=', now()->startOfWeek())->count(),
            'rejected_this_week' => Course::where('rejected_at', '>=', now()->startOfWeek())->count(),
            'total_submitted' => Course::whereIn('approval_status', ['submitted', 'approved', 'rejected'])->count(),
            'average_approval_time' => $this->getAverageApprovalTime(),
        ];

        return response()->json($stats);
    }

    /**
     * Calculate average approval time in hours.
     */
    private function getAverageApprovalTime(): float
    {
        $approvedCourses = Course::whereNotNull('approved_at')
            ->whereNotNull('submitted_at')
            ->get();

        if ($approvedCourses->isEmpty()) {
            return 0;
        }

        $totalHours = $approvedCourses->sum(function ($course) {
            return $course->submitted_at->diffInHours($course->approved_at);
        });

        return round($totalHours / $approvedCourses->count(), 1);
    }

    /**
     * Bulk approve multiple courses.
     */
    public function bulkApprove(Request $request): JsonResponse
    {
        $request->validate([
            'course_ids' => 'required|array',
            'course_ids.*' => 'exists:courses,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        $courseIds = $request->input('course_ids');
        $notes = $request->input('notes');
        $admin = Auth::user();

        $courses = Course::whereIn('id', $courseIds)
            ->where('approval_status', 'submitted')
            ->get();

        $approvedCount = 0;
        foreach ($courses as $course) {
            $course->approveByAdmin($admin);

            if ($notes) {
                $course->update([
                    'approval_notes' => array_merge(
                        $course->approval_notes ?? [],
                        [
                            [
                                'approved_at' => now()->toISOString(),
                                'notes' => $notes,
                                'admin' => $admin->name,
                            ]
                        ]
                    )
                ]);
            }

            $approvedCount++;
        }

        return response()->json([
            'success' => true,
            'message' => "{$approvedCount} courses approved successfully.",
            'approved_count' => $approvedCount
        ]);
    }

    /**
     * Bulk reject multiple courses.
     */
    public function bulkReject(Request $request): JsonResponse
    {
        $request->validate([
            'course_ids' => 'required|array',
            'course_ids.*' => 'exists:courses,id',
            'reason' => 'required|string|max:1000',
        ]);

        $courseIds = $request->input('course_ids');
        $reason = $request->input('reason');
        $admin = Auth::user();

        $courses = Course::whereIn('id', $courseIds)
            ->where('approval_status', 'submitted')
            ->get();

        $rejectedCount = 0;
        foreach ($courses as $course) {
            $course->rejectByAdmin($admin, $reason);
            $rejectedCount++;
        }

        return response()->json([
            'success' => true,
            'message' => "{$rejectedCount} courses rejected successfully.",
            'rejected_count' => $rejectedCount
        ]);
    }
}
