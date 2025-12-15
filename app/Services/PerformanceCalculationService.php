<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use App\Models\Subject;
use App\Models\GradeLevel;
use App\Models\PerformanceMetric;
use App\Models\StudentPerformance;
use App\Models\PerformanceCalculationLog;
use App\Models\QuizAttempt;
use App\Models\Assignment;
use App\Models\SubjectPerformanceMetric;
use App\Models\PerformanceLevel;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Service for calculating student performance metrics
 */
final class PerformanceCalculationService
{
    /**
     * Calculate performance for a student in a specific subject and metric
     */
    public function calculatePerformance(
        User $student,
        Subject $subject,
        GradeLevel $gradeLevel,
        PerformanceMetric $metric
    ): StudentPerformance {

        $performance = StudentPerformance::firstOrNew([
            'user_id' => $student->id,
            'subject_id' => $subject->id,
            'grade_level_id' => $gradeLevel->id,
            'performance_metric_id' => $metric->id,
        ]);

        
        $previousScore = $performance->percentage_score;

        
        $rawScore = $this->calculateRawScore($student, $subject, $gradeLevel, $metric);
        $percentageScore = $this->convertToPercentage($rawScore, $student, $subject, $metric);

        
        $level = $this->determinePerformanceLevel($percentageScore);

        
        $performance->raw_score = $rawScore;
        $performance->percentage_score = $percentageScore;
        $performance->level = $level;
        $performance->last_calculated_at = now();
        $performance->save();

        
        $this->logPerformanceCalculation(
            $student,
            $subject,
            $gradeLevel,
            $metric,
            $previousScore,
            $percentageScore,
            null,
            'automatic'
        );

        return $performance;
    }

    /**
     * Calculate raw score for a specific metric
     */
    private function calculateRawScore(
        User $student,
        Subject $subject,
        GradeLevel $gradeLevel,
        PerformanceMetric $metric
    ): float {
        $scores = [];


        

        
        switch ($metric->slug) {
            case 'knowledge':
                
                $scores = array_merge(
                    $scores,
                    $this->getQuizScores($student, $subject, $gradeLevel)
                );
                break;

            case 'application':
                
                $scores = array_merge(
                    $scores,
                    $this->getAssignmentScores($student, $subject, $gradeLevel)
                );
                break;

            case 'presentation':
                
                $scores = array_merge(
                    $scores,
                    $this->getAssignmentScores($student, $subject, $gradeLevel, 'presentation')
                );
                break;

            case 'participation':
                
                
                $scores[] = 75.0;
                break;

            default:
                
                $scores = array_merge(
                    $scores,
                    $this->getQuizScores($student, $subject, $gradeLevel),
                    $this->getAssignmentScores($student, $subject, $gradeLevel)
                );
        }

        
        if (empty($scores)) {
            return 0.0;
        }


        return array_sum($scores) / count($scores);
    }

    /**
     * Get quiz scores for a student in a subject
     */
    private function getQuizScores(
        User $student,
        Subject $subject,
        GradeLevel $gradeLevel,
        string $type = null
    ): array {
        $query = QuizAttempt::query()
            ->join('quizzes', 'quiz_attempts.quiz_id', '=', 'quizzes.id')
            ->join('courses', 'quizzes.course_id', '=', 'courses.id')
            ->where('quiz_attempts.user_id', $student->id)
            ->where('courses.subject_id', $subject->id)
            ->where('courses.grade_level_id', $gradeLevel->id)
            ->whereNotNull('quiz_attempts.submitted_at')
            ->select('quiz_attempts.score_percentage');

        if ($type) {
            $query->where('quizzes.type', $type);
        }

        return $query->pluck('score_percentage')->toArray();
    }

    /**
     * Get assignment scores for a student in a subject
     */
    private function getAssignmentScores(
        User $student,
        Subject $subject,
        GradeLevel $gradeLevel,
        string $type = null
    ): array {
        $query = DB::table('assignment_submissions')
            ->join('assignments', 'assignment_submissions.assignment_id', '=', 'assignments.id')
            ->join('courses', 'assignments.course_id', '=', 'courses.id')
            ->where('assignment_submissions.user_id', $student->id)
            ->where('courses.subject_id', $subject->id)
            ->where('courses.grade_level_id', $gradeLevel->id)
            ->whereNotNull('assignment_submissions.submitted_at')
            ->whereNotNull('assignment_submissions.score')
            ->select(
                'assignment_submissions.score',
                'assignments.max_score'
            );

        if ($type) {
            $query->where('assignments.type', $type);
        }

        $submissions = $query->get();

        
        return $submissions->map(function ($submission) {
            if ($submission->max_score > 0) {
                return ($submission->score / $submission->max_score) * 100;
            }
            return 0;
        })->toArray();
    }

    /**
     * Convert raw score to percentage, applying weights if applicable
     */
    private function convertToPercentage(
        float $rawScore,
        User $student,
        Subject $subject,
        PerformanceMetric $metric
    ): float {
        
        

        
        $subjectMetric = SubjectPerformanceMetric::where('subject_id', $subject->id)
            ->where('performance_metric_id', $metric->id)
            ->first();

        if ($subjectMetric && $subjectMetric->weight != 1.0) {
            
            
            
        }

        
        return max(0.0, min(100.0, $rawScore));
    }

    /**
     * Determine the performance level based on a percentage score
     */
    private function determinePerformanceLevel(float $percentageScore): string
    {
        
        $level = PerformanceLevel::where('min_score', '<=', $percentageScore)
            ->where('max_score', '>=', $percentageScore)
            ->orderBy('display_order')
            ->first();

        if ($level) {
            return $level->name;
        }

        
        return 'Not Assessed';
    }

    /**
     * Log a performance calculation
     */
    private function logPerformanceCalculation(
        User $student,
        Subject $subject,
        GradeLevel $gradeLevel,
        PerformanceMetric $metric,
        float $previousScore,
        float $newScore,
        ?int $calculatedBy = null,
        string $calculationType = 'automatic'
    ): void {
        PerformanceCalculationLog::create([
            'user_id' => $student->id,
            'subject_id' => $subject->id,
            'grade_level_id' => $gradeLevel->id,
            'performance_metric_id' => $metric->id,
            'previous_score' => $previousScore,
            'new_score' => $newScore,
            'change' => $newScore - $previousScore,
            'calculated_by' => $calculatedBy,
            'calculation_type' => $calculationType,
        ]);
    }

    /**
     * Calculate performance for all metrics for a student in a subject
     */
    public function calculateAllMetricsForStudent(
        User $student,
        Subject $subject,
        GradeLevel $gradeLevel
    ): Collection {
        $performances = collect();


        $metrics = SubjectPerformanceMetric::where('subject_id', $subject->id)
            ->where('is_active', true)
            ->with('performanceMetric')
            ->get()
            ->pluck('performanceMetric');

        foreach ($metrics as $metric) {
            $performances->push(
                $this->calculatePerformance($student, $subject, $gradeLevel, $metric)
            );
        }

        return $performances;
    }

    /**
     * Calculate performance for all students in a subject
     */
    public function calculateAllStudentsForSubject(
        Subject $subject,
        GradeLevel $gradeLevel
    ): array {
        $stats = [
            'total_students' => 0,
            'students_processed' => 0,
            'metrics_processed' => 0,
            'errors' => 0,
        ];


        $students = User::whereHas('enrollments', function ($query) use ($subject, $gradeLevel) {
            $query->whereHas('course', function ($q) use ($subject, $gradeLevel) {
                $q->where('subject_id', $subject->id)
                  ->where('grade_level_id', $gradeLevel->id);
            });
        })->get();

        $stats['total_students'] = $students->count();

        foreach ($students as $student) {
            try {
                $performances = $this->calculateAllMetricsForStudent($student, $subject, $gradeLevel);
                $stats['students_processed']++;
                $stats['metrics_processed'] += $performances->count();
            } catch (\Exception $e) {
                Log::error("Error calculating performance for student {$student->id} in subject {$subject->id}: {$e->getMessage()}");
                $stats['errors']++;
            }
        }

        return $stats;
    }
}
