<?php

declare(strict_types=1);

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\PerformanceLevel;
use App\Models\PerformanceMetric;
use App\Models\StudentPerformance;
use App\Models\StudentRanking;
use App\Models\Subject;
use App\Models\GradeLevel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

final class PerformanceController extends Controller
{
    /**
     * Display the performance overview page
     */
    public function overview(Request $request): View
    {
        $user = Auth::user();
        $hasPerformanceData = StudentPerformance::where('user_id', $user->id)->exists();


        $overallRanking = StudentRanking::where('user_id', $user->id)
            ->where('ranking_type', 'overall')
            ->with('gradeLevel')
            ->first();


        $recentPerformances = StudentPerformance::where('user_id', $user->id)
            ->with(['subject', 'performanceLevel'])
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();


        $performanceMetrics = PerformanceMetric::all();


        $bestPerformingSubjects = [];
        if ($hasPerformanceData) {
            $topSubjectPerformances = DB::table('student_performances')
                ->select('subject_id', DB::raw('AVG(percentage_score) as average_score'))
                ->where('user_id', $user->id)
                ->groupBy('subject_id')
                ->orderByDesc('average_score')
                ->take(3)
                ->get();

            if ($topSubjectPerformances->isNotEmpty()) {
                $subjectIds = $topSubjectPerformances->pluck('subject_id')->toArray();
                $subjectsDetails = Subject::whereIn('id', $subjectIds)->get()->keyBy('id');
                $rankingsDetails = StudentRanking::where('user_id', $user->id)
                                                ->whereIn('subject_id', $subjectIds)
                                                ->where('ranking_type', 'subject_grade')
                                                ->get()
                                                ->keyBy('subject_id');

                foreach ($topSubjectPerformances as $perf) {
                    if (isset($subjectsDetails[$perf->subject_id])) {
                        $bestPerformingSubjects[] = [
                            'subject' => $subjectsDetails[$perf->subject_id],
                            'average_score' => $perf->average_score,
                            'ranking' => $rankingsDetails[$perf->subject_id] ?? null,
                        ];
                    }
                }
            }
        }


        $allSubjectPerformancesQuery = DB::table('student_performances')
            ->select('subject_id', DB::raw('AVG(percentage_score) as avg_score'))
            ->where('user_id', $user->id)
            ->groupBy('subject_id')
            ->get();

        $allSubjectsDetails = Subject::whereIn('id', $allSubjectPerformancesQuery->pluck('subject_id')->toArray())
            ->get()
            ->keyBy('id');

        $allSubjectRankings = StudentRanking::where('user_id', $user->id)
            ->where('ranking_type', 'subject_grade')
            ->whereIn('subject_id', $allSubjectPerformancesQuery->pluck('subject_id')->toArray())
            ->get()
            ->keyBy('subject_id');

        $formattedSubjectPerformances = [];
        foreach ($allSubjectPerformancesQuery as $performance) {
            if (isset($allSubjectsDetails[$performance->subject_id])) {
                $formattedSubjectPerformances[] = [
                    'subject' => $allSubjectsDetails[$performance->subject_id],
                    'average_score' => $performance->avg_score,
                    'ranking' => $allSubjectRankings[$performance->subject_id] ?? null,
                ];
            }
        }


        $performanceLevels = PerformanceLevel::orderBy('min_score')->get();

        return view('student.performance.overview', [
            'overallRanking' => $overallRanking,
            'recentPerformances' => $recentPerformances,
            'performanceMetrics' => $performanceMetrics,
            'subjectPerformances' => $formattedSubjectPerformances,
            'bestSubjects' => $bestPerformingSubjects,
            'performanceLevels' => $performanceLevels,
            'hasPerformanceData' => $hasPerformanceData
        ]);
    }

    /**
     * Display performance for a specific subject
     */
    public function subject(Request $request, Subject $subject): View
    {
        $user = Auth::user();


        $subjectMetrics = $subject->performanceMetrics()
            ->orderBy('pivot_weight', 'desc')
            ->get();


        $performances = StudentPerformance::where('user_id', $user->id)
            ->where('subject_id', $subject->id)
            ->with(['performanceLevel', 'performanceMetric'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);


        $averageScore = StudentPerformance::where('user_id', $user->id)
            ->where('subject_id', $subject->id)
            ->avg('percentage_score') ?? 0;


        $currentLevel = null;
        if ($averageScore > 0) {
            $currentLevel = PerformanceLevel::where('min_score', '<=', $averageScore)
                ->where('max_score', '>=', $averageScore)
                ->first();
        }


        $ranking = StudentRanking::where('user_id', $user->id)
            ->where('subject_id', $subject->id)
            ->where('ranking_type', 'subject_grade')
            ->with('gradeLevel')
            ->first();


        $performanceLevels = PerformanceLevel::orderBy('min_score')->get();

        return view('student.performance.subject', [
            'subject' => $subject,
            'subjectMetrics' => $subjectMetrics,
            'performances' => $performances,
            'averageScore' => $averageScore,
            'currentLevel' => $currentLevel,
            'ranking' => $ranking,
            'performanceLevels' => $performanceLevels,
        ]);
    }

    /**
     * Display performance history
     */
    public function history(Request $request): View
    {
        $user = Auth::user();


        $subjectId = $request->input('subject_id');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');


        $query = StudentPerformance::where('user_id', $user->id)
            ->with(['subject', 'performanceLevel']);


        if ($subjectId) {
            $query->where('subject_id', $subjectId);
        }

        if ($startDate) {
            $query->whereDate('created_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->whereDate('created_at', '<=', $endDate);
        }


        $performances = $query->orderBy('created_at', 'desc')
            ->paginate(15);


        $subjects = Subject::where('has_performance_tracking', true)
            ->orderBy('name')
            ->get();


        $performanceLevels = PerformanceLevel::orderBy('min_score')->get();

        return view('student.performance.history', [
            'performances' => $performances,
            'subjects' => $subjects,
            'selectedSubject' => $subjectId,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'performanceLevels' => $performanceLevels,
        ]);
    }

    /**
     * Display performance rankings
     */
    public function rankings(Request $request): View
    {
        $user = Auth::user();


        $overallRanking = StudentRanking::where('user_id', $user->id)
            ->where('ranking_type', 'overall')
            ->with(['gradeLevel'])
            ->first();


        $subjectRankings = StudentRanking::where('user_id', $user->id)
            ->where('ranking_type', 'subject_grade')
            ->with(['subject', 'gradeLevel'])
            ->get();


        $userGradeLevelId = $overallRanking ? $overallRanking->grade_level_id : null;

        $topStudentsInGrade = [];
        if ($userGradeLevelId) {
            $topStudentsInGrade = StudentRanking::where('grade_level_id', $userGradeLevelId)
                ->where('ranking_type', 'overall')
                ->orderBy('rank')
                ->with(['user' => function ($query) {
                    $query->select('id', 'name', 'profile_picture_path');
                }])
                ->take(10)
                ->get();
        }


        $subjects = Subject::where('has_performance_tracking', true)
            ->orderBy('name')
            ->get();


        $gradeLevels = GradeLevel::orderBy('name')->get();


        $rankingsQuery = StudentRanking::where('user_id', $user->id)
            ->with(['subject', 'gradeLevel']);

        if ($request->filled('subject_id')) {
            $rankingsQuery->where('subject_id', $request->input('subject_id'));
        }

        if ($request->filled('grade_level_id')) {
            $rankingsQuery->where('grade_level_id', $request->input('grade_level_id'));
        }

        if ($request->filled('ranking_type')) {
            $rankingsQuery->where('ranking_type', $request->input('ranking_type'));
        } else {


        }

        $rankings = $rankingsQuery->orderBy('rank')->paginate(15);

        return view('student.performance.rankings', [
            'overallRanking' => $overallRanking,
            'subjectRankings' => $subjectRankings,
            'topStudentsInGrade' => $topStudentsInGrade,
            'subjects' => $subjects,
            'gradeLevels' => $gradeLevels,
            'rankings' => $rankings,
        ]);
    }
}
