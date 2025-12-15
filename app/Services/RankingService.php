<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Subject;
use App\Models\GradeLevel;
use App\Models\StudentRanking;
use App\Models\RankingSchedule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Service for generating and managing student performance rankings
 */
final readonly class RankingService
{
    /**
     * Generate rankings for all students in a subject and grade level
     */
    public function generateSubjectRankings(
        Subject $subject,
        GradeLevel $gradeLevel
    ): array {
        $stats = [
            'total_students' => 0,
            'students_processed' => 0,
            'rankings_generated' => 0,
            'errors' => 0,
        ];

        try {

            $performances = DB::table('student_performances')
                ->select(
                    'user_id',
                    DB::raw('AVG(percentage_score) as average_score')
                )
                ->where('subject_id', $subject->id)
                ->where('grade_level_id', $gradeLevel->id)
                ->groupBy('user_id')
                ->get();

            $stats['total_students'] = $performances->count();

            if ($performances->isEmpty()) {
                return $stats;
            }

            
            $sortedPerformances = $performances->sortByDesc('average_score');

            
            $rank = 1;
            $previousScore = null;
            $sameRankCount = 0;

            foreach ($sortedPerformances as $index => $performance) {
                try {
                    
                    if ($previousScore !== null && $performance->average_score === $previousScore) {
                        $sameRankCount++;
                    } else {
                        $rank = $index + 1;
                        $sameRankCount = 0;
                    }

                    $previousScore = $performance->average_score;

                    
                    $percentile = $this->calculatePercentile($rank, $stats['total_students']);

                    
                    $this->storeRanking(
                        $performance->user_id,
                        $subject->id,
                        $gradeLevel->id,
                        'subject_grade',
                        $rank,
                        $stats['total_students'],
                        $percentile
                    );

                    $stats['students_processed']++;
                    $stats['rankings_generated']++;
                } catch (\Exception $e) {
                    Log::error("Error generating ranking for user {$performance->user_id} in subject {$subject->id}: {$e->getMessage()}");
                    $stats['errors']++;
                }
            }
        } catch (\Exception $e) {
            Log::error("Error generating subject rankings for subject {$subject->id}, grade level {$gradeLevel->id}: {$e->getMessage()}");
            $stats['errors']++;
        }

        return $stats;
    }

    /**
     * Generate overall rankings for all students in a grade level
     */
    public function generateOverallRankings(GradeLevel $gradeLevel): array
    {
        $stats = [
            'total_students' => 0,
            'students_processed' => 0,
            'rankings_generated' => 0,
            'errors' => 0,
        ];

        try {

            $performances = DB::table('student_performances')
                ->select(
                    'user_id',
                    DB::raw('AVG(percentage_score) as average_score')
                )
                ->where('grade_level_id', $gradeLevel->id)
                ->groupBy('user_id')
                ->get();

            $stats['total_students'] = $performances->count();

            if ($performances->isEmpty()) {
                return $stats;
            }

            
            $sortedPerformances = $performances->sortByDesc('average_score');

            
            $rank = 1;
            $previousScore = null;
            $sameRankCount = 0;

            foreach ($sortedPerformances as $index => $performance) {
                try {
                    
                    if ($previousScore !== null && $performance->average_score === $previousScore) {
                        $sameRankCount++;
                    } else {
                        $rank = $index + 1;
                        $sameRankCount = 0;
                    }

                    $previousScore = $performance->average_score;

                    
                    $percentile = $this->calculatePercentile($rank, $stats['total_students']);

                    
                    $this->storeRanking(
                        $performance->user_id,
                        null, 
                        $gradeLevel->id,
                        'overall',
                        $rank,
                        $stats['total_students'],
                        $percentile
                    );

                    $stats['students_processed']++;
                    $stats['rankings_generated']++;
                } catch (\Exception $e) {
                    Log::error("Error generating overall ranking for user {$performance->user_id}: {$e->getMessage()}");
                    $stats['errors']++;
                }
            }
        } catch (\Exception $e) {
            Log::error("Error generating overall rankings for grade level {$gradeLevel->id}: {$e->getMessage()}");
            $stats['errors']++;
        }

        return $stats;
    }

    /**
     * Calculate percentile based on rank and total number of students
     */
    private function calculatePercentile(int $rank, int $totalStudents): float
    {
        if ($totalStudents <= 1) {
            return 100.0;
        }

        
        return (($totalStudents - $rank) / ($totalStudents - 1)) * 100;
    }

    /**
     * Store or update a ranking
     */
    private function storeRanking(
        int $userId,
        ?int $subjectId,
        int $gradeLevelId,
        string $rankingType,
        int $rank,
        int $totalStudents,
        float $percentile
    ): StudentRanking {
        return StudentRanking::updateOrCreate(
            [
                'user_id' => $userId,
                'subject_id' => $subjectId,
                'grade_level_id' => $gradeLevelId,
                'ranking_type' => $rankingType,
            ],
            [
                'rank' => $rank,
                'total_students' => $totalStudents,
                'percentile' => $percentile,
            ]
        );
    }

    /**
     * Process a ranking schedule
     */
    public function processSchedule(RankingSchedule $schedule): array
    {
        $results = [
            'subjects_processed' => 0,
            'grade_levels_processed' => 0,
            'total_rankings_generated' => 0,
            'total_errors' => 0,
        ];


        $subjectIds = $schedule->subjects ?? [];
        $gradeLevelIds = $schedule->grade_levels ?? [];

        
        if (empty($subjectIds)) {
            $subjectIds = Subject::where('has_performance_tracking', true)
                ->where('is_active', true)
                ->pluck('id')
                ->toArray();
        }

        if (empty($gradeLevelIds)) {
            $gradeLevelIds = GradeLevel::where('is_active', true)
                ->pluck('id')
                ->toArray();
        }

        
        foreach ($subjectIds as $subjectId) {
            foreach ($gradeLevelIds as $gradeLevelId) {
                try {
                    $subject = Subject::find($subjectId);
                    $gradeLevel = GradeLevel::find($gradeLevelId);

                    if ($subject && $gradeLevel) {
                        $stats = $this->generateSubjectRankings($subject, $gradeLevel);

                        $results['subjects_processed']++;
                        $results['total_rankings_generated'] += $stats['rankings_generated'];
                        $results['total_errors'] += $stats['errors'];
                    }
                } catch (\Exception $e) {
                    Log::error("Error processing subject {$subjectId} and grade level {$gradeLevelId}: {$e->getMessage()}");
                    $results['total_errors']++;
                }
            }
        }

        
        foreach ($gradeLevelIds as $gradeLevelId) {
            try {
                $gradeLevel = GradeLevel::find($gradeLevelId);

                if ($gradeLevel) {
                    $stats = $this->generateOverallRankings($gradeLevel);

                    $results['grade_levels_processed']++;
                    $results['total_rankings_generated'] += $stats['rankings_generated'];
                    $results['total_errors'] += $stats['errors'];
                }
            } catch (\Exception $e) {
                Log::error("Error processing overall rankings for grade level {$gradeLevelId}: {$e->getMessage()}");
                $results['total_errors']++;
            }
        }

        
        $schedule->last_run_at = now();
        $schedule->save();

        return $results;
    }
}
