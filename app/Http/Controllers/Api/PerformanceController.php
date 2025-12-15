<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentPerformance;
use App\Models\StudentRanking;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

final class PerformanceController extends Controller
{
    /**
     * Get overall performance for a student.
     */
    public function getOverallPerformance(): JsonResponse
    {
        $user = Auth::user();

        $ranking = StudentRanking::where('user_id', $user->id)
            ->where('ranking_type', 'overall')
            ->with('gradeLevel')
            ->first();

        if (!$ranking) {
            return response()->json([
                'success' => false,
                'message' => 'No overall performance data found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'percentile' => $ranking->percentile,
                'rank' => $ranking->rank,
                'total_students' => $ranking->total_students,
                'grade_level' => $ranking->gradeLevel->name,
            ],
        ]);
    }

    /**
     * Get subject performance data.
     */
    public function getSubjectPerformance(Request $request): JsonResponse
    {
        $user = Auth::user();


        $subjectId = $request->input('subject_id');
        if ($subjectId) {
            $subject = Subject::find($subjectId);
            if (!$subject) {
                return response()->json([
                    'success' => false,
                    'message' => 'Subject not found',
                ], 404);
            }
        }


        $query = StudentPerformance::where('user_id', $user->id)
            ->with(['subject', 'performanceMetric', 'gradeLevel']);

        if ($subjectId) {
            $query->where('subject_id', $subjectId);
        }

        $performances = $query->get()
            ->groupBy('subject_id')
            ->map(function ($subjectPerformances) {
                $subject = $subjectPerformances->first()->subject;
                $averageScore = $subjectPerformances->avg('percentage_score');


                $ranking = StudentRanking::where('user_id', Auth::id())
                    ->where('subject_id', $subject->id)
                    ->where('ranking_type', 'subject_grade')
                    ->first();

                return [
                    'subject' => [
                        'id' => $subject->id,
                        'name' => $subject->name,
                        'code' => $subject->code,
                    ],
                    'average_score' => $averageScore,
                    'metrics' => $subjectPerformances->map(function ($performance) {
                        return [
                            'metric' => [
                                'id' => $performance->performanceMetric->id,
                                'name' => $performance->performanceMetric->name,
                                'description' => $performance->performanceMetric->description,
                            ],
                            'score' => $performance->percentage_score,
                            'level' => $performance->level,
                            'last_calculated_at' => $performance->last_calculated_at->toIso8601String(),
                        ];
                    }),
                    'ranking' => $ranking ? [
                        'percentile' => $ranking->percentile,
                        'rank' => $ranking->rank,
                        'total_students' => $ranking->total_students,
                    ] : null,
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'data' => $performances,
        ]);
    }

    /**
     * Get ranking data.
     */
    public function getRankings(Request $request): JsonResponse
    {
        $user = Auth::user();

        $query = StudentRanking::where('user_id', $user->id)
            ->with(['subject', 'gradeLevel']);


        if ($request->has('subject_id')) {
            $query->where('subject_id', $request->input('subject_id'));
        }


        if ($request->has('grade_level_id')) {
            $query->where('grade_level_id', $request->input('grade_level_id'));
        }


        if ($request->has('ranking_type')) {
            $query->where('ranking_type', $request->input('ranking_type'));
        }

        $rankings = $query->get()->map(function ($ranking) {
            return [
                'id' => $ranking->id,
                'subject' => $ranking->subject ? [
                    'id' => $ranking->subject->id,
                    'name' => $ranking->subject->name,
                ] : null,
                'grade_level' => [
                    'id' => $ranking->gradeLevel->id,
                    'name' => $ranking->gradeLevel->name,
                ],
                'ranking_type' => $ranking->ranking_type,
                'rank' => $ranking->rank,
                'total_students' => $ranking->total_students,
                'percentile' => $ranking->percentile,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $rankings,
        ]);
    }

    /**
     * Get performance history data.
     */
    public function getPerformanceHistory(Request $request): JsonResponse
    {
        $user = Auth::user();

        $query = StudentPerformance::where('user_id', $user->id)
            ->with(['subject', 'performanceMetric', 'gradeLevel']);


        if ($request->filled('subject_id')) {
            $query->where('subject_id', $request->input('subject_id'));
        }

        if ($request->filled('metric_id')) {
            $query->where('performance_metric_id', $request->input('metric_id'));
        }

        if ($request->filled('grade_level_id')) {
            $query->where('grade_level_id', $request->input('grade_level_id'));
        }


        $query->orderBy('last_calculated_at', 'desc');

        $performances = $query->get()->map(function ($performance) {
            return [
                'id' => $performance->id,
                'subject' => [
                    'id' => $performance->subject->id,
                    'name' => $performance->subject->name,
                ],
                'metric' => [
                    'id' => $performance->performanceMetric->id,
                    'name' => $performance->performanceMetric->name,
                ],
                'grade_level' => [
                    'id' => $performance->gradeLevel->id,
                    'name' => $performance->gradeLevel->name,
                ],
                'raw_score' => $performance->raw_score,
                'percentage_score' => $performance->percentage_score,
                'level' => $performance->level,
                'last_calculated_at' => $performance->last_calculated_at->toIso8601String(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $performances,
        ]);
    }
}
