<?php

declare(strict_types=1);

namespace App\Http\Controllers\Parent;

use App\Http\Controllers\Controller;
use App\Models\InviteCode;
use App\Models\User;
use App\Models\StudentRanking;
use App\Models\StudentPerformance;
use App\Models\Subject;
use App\Models\Enrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;
use Illuminate\Support\Facades\DB;
use App\Http\Requests\StoreInviteCodeLinkRequest;

final class StudentLinkController extends Controller
{
    /**
     * Show the page for a parent to enter an invite code.
     */
    public function createLink(): View
    {

        return view('parent.links.create');
    }

    /**
     * Student generates an invite code.
     */
    public function generateInviteCode(Request $request): RedirectResponse
    {
        /** @var User $student */
        $student = $request->user();


        $student->inviteCodes()->delete();

        $code = strtoupper(Str::random(8));
        $expiresAt = Carbon::now()->addDays(7);

        $student->inviteCodes()->create([
            'code' => $code,
            'expires_at' => $expiresAt,
        ]);

        return redirect()->route('student.parent_invite.view')->with('success', 'New invite code generated successfully.');
    }

    /**
     * Student views their current invite code.
     */
    public function viewInviteCode(Request $request): View
    {
        /** @var User $student */
        $student = $request->user();
        $activeCode = $student->inviteCodes()->where('expires_at', '>', Carbon::now())->first();


        return view('student.parent_invites.view', compact('activeCode'));
    }

    /**
     * Parent stores a link to a student using an invite code.
     */
    public function storeLinkByInviteCode(StoreInviteCodeLinkRequest $request): RedirectResponse
    {
        /** @var User $parent */
        $parent = $request->user();
        $validated = $request->validated();
        $inviteCodeString = strtoupper($validated['invite_code']);

        $inviteCode = InviteCode::where('code', $inviteCodeString)
            ->where('expires_at', '>', Carbon::now())
            ->first();

        if (!$inviteCode) {
            return back()->withErrors(['invite_code' => 'Invalid or expired invite code.'])->withInput();
        }

        $student = $inviteCode->student;


        $existingLink = DB::table('parent_student')
            ->where('parent_user_id', $parent->id)
            ->where('student_user_id', $student->id)
            ->first();

        if ($existingLink) {
            if ($existingLink->status === 'active') {
                return back()->with('info', 'You are already actively linked to this student.');
            } elseif ($existingLink->status === 'pending') {
                return back()->with('info', 'A link request for this student is already pending.');
            }

        }

        DB::table('parent_student')->insert([
            'parent_user_id' => $parent->id,
            'student_user_id' => $student->id,
            'status' => 'active',
            'requested_at' => Carbon::now(),
            'actioned_at' => Carbon::now(),
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);




        return redirect()->route('parent.linked_students.index')->with('success', 'Successfully linked to student: ' . $student->name);
    }

    /**
     * List students linked to the current parent with performance data and rankings.
     */
    public function listLinkedStudents(Request $request): View
    {
        /** @var User $parent */
        $parent = Auth::user();
        $linkedStudents = $parent->linkedStudents()->get();

        if ($linkedStudents->isEmpty()) {
            return view('parent.children.index', [
                'linkedStudents' => $linkedStudents,
                'selectedStudent' => null,
                'childrenPerformanceData' => [],
                'subjects' => collect(),
                'hasPerformanceData' => false,
            ]);
        }


        $selectedChildId = $request->input('child_id') ?: $linkedStudents->first()->id;
        $selectedStudent = $linkedStudents->firstWhere('id', $selectedChildId);

        if (!$selectedStudent) {
            $selectedStudent = $linkedStudents->first();
            $selectedChildId = $selectedStudent->id;
        }


        $subjects = Subject::where('has_performance_tracking', true)->orderBy('name')->get();


        $childrenPerformanceData = [];
        $hasPerformanceData = false;

        foreach ($linkedStudents as $student) {

            $overallRanking = StudentRanking::where('user_id', $student->id)
                ->where('ranking_type', 'overall')
                ->with('gradeLevel')
                ->first();


            $subjectRankings = StudentRanking::where('user_id', $student->id)
                ->where('ranking_type', 'subject_grade')
                ->with(['subject', 'gradeLevel'])
                ->get();


            $recentPerformances = StudentPerformance::where('user_id', $student->id)
                ->with(['subject', 'performanceMetric'])
                ->orderBy('last_calculated_at', 'desc')
                ->take(5)
                ->get();


            $subjectAverages = StudentPerformance::where('user_id', $student->id)
                ->select('subject_id', DB::raw('AVG(percentage_score) as average_score'))
                ->groupBy('subject_id')
                ->with('subject')
                ->get()
                ->mapWithKeys(function ($item) {
                    $score = round((float) ($item->average_score ?? 0), 1);
                    $cssClass = $score >= 80 ? 'bg-green-1' : ($score >= 65 ? 'bg-blue-1' : ($score >= 50 ? 'bg-orange-1' : 'bg-red-1'));
                    $textClass = $score >= 80 ? 'text-green-1' : ($score >= 65 ? 'text-blue-1' : ($score >= 50 ? 'text-orange-1' : 'text-red-1'));

                    return [$item->subject_id => [
                        'subject' => $item->subject,
                        'average_score' => $score,
                        'css_class' => $cssClass,
                        'text_class' => $textClass
                    ]];
                });


            $enrollments = Enrollment::where('user_id', $student->id)
                ->with('course')
                ->get();

            $totalCourses = $enrollments->count();
            $completedCourses = $enrollments->whereNotNull('completed_at')->count();
            $avgProgress = (float) ($enrollments->avg('progress') ?? 0);

            $childrenPerformanceData[$student->id] = [
                'student' => $student,
                'overall_ranking' => $overallRanking,
                'subject_rankings' => $subjectRankings,
                'recent_performances' => $recentPerformances,
                'subject_averages' => $subjectAverages,
                'total_courses' => $totalCourses,
                'completed_courses' => $completedCourses,
                'avg_progress' => round($avgProgress, 1),
                'has_data' => $overallRanking || $subjectRankings->isNotEmpty() || $recentPerformances->isNotEmpty(),
            ];

            if ($overallRanking || $subjectRankings->isNotEmpty() || $recentPerformances->isNotEmpty()) {
                $hasPerformanceData = true;
            }
        }


        $selectedStudentData = $childrenPerformanceData[$selectedChildId] ?? null;


        $performanceTrends = [];
        if ($selectedStudentData && $selectedStudentData['has_data']) {
            $performanceTrends = StudentPerformance::where('user_id', $selectedChildId)
                ->where('last_calculated_at', '>=', Carbon::now()->subMonths(6))
                ->with(['subject', 'performanceMetric'])
                ->orderBy('last_calculated_at')
                ->get()
                ->groupBy('subject_id')
                ->map(function ($performances) {
                    return [
                        'subject' => $performances->first()->subject,
                        'data' => $performances->map(function ($perf) {
                            return [
                                'date' => $perf->last_calculated_at->format('M Y'),
                                'score' => $perf->percentage_score,
                                'metric' => $perf->performanceMetric->name ?? 'Overall',
                            ];
                        })->toArray()
                    ];
                });
        }

        return view('parent.children.index', [
            'linkedStudents' => $linkedStudents,
            'selectedStudent' => $selectedStudent,
            'childrenPerformanceData' => $childrenPerformanceData,
            'selectedStudentData' => $selectedStudentData,
            'performanceTrends' => $performanceTrends,
            'subjects' => $subjects,
            'hasPerformanceData' => $hasPerformanceData,
        ]);
    }

    /**
     * Parent removes a link to a student.
     * We use Route Model Binding for $student, ensuring it's a User model.
     */
    public function destroyLink(User $student): RedirectResponse
    {
        /** @var User $parent */
        $parent = Auth::user();

        $unlinked = DB::table('parent_student')
            ->where('parent_user_id', $parent->id)
            ->where('student_user_id', $student->id)
            ->delete();

        if ($unlinked) {
            return redirect()->route('parent.linked_students.index')->with('success', 'Successfully unlinked from student: ' . $student->name);
        }

        return redirect()->route('parent.linked_students.index')->with('error', 'Could not unlink from student. The link might not exist.');
    }
}
