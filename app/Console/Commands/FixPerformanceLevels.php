<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\StudentPerformance;
use App\Models\PerformanceLevel;
use App\Services\RankingService;
use Illuminate\Console\Command;

final class FixPerformanceLevels extends Command
{
    protected $signature = 'performance:fix-levels {--debug-rankings : Debug ranking generation}';

    protected $description = 'Fix StudentPerformance records with invalid or missing level values and debug rankings';

    public function handle(): int
    {
        if ($this->option('debug-rankings')) {
            return $this->debugRankings();
        }

        $this->info('Starting to fix performance levels...');


        $invalidRecords = StudentPerformance::whereNull('level')
            ->orWhere('level', '')
            ->orWhereNotIn('level', PerformanceLevel::pluck('name'))
            ->get();

        $this->info("Found {$invalidRecords->count()} records with invalid levels.");

        $fixed = 0;
        $errors = 0;

        foreach ($invalidRecords as $performance) {
            try {

                $level = PerformanceLevel::where('min_score', '<=', $performance->percentage_score)
                    ->where('max_score', '>=', $performance->percentage_score)
                    ->first();

                if ($level) {
                    $performance->level = $level->name;
                    $performance->save();
                    $fixed++;
                } else {

                    $performance->level = 'Not Assessed';
                    $performance->save();
                    $fixed++;
                }
            } catch (\Exception $e) {
                $this->error("Error fixing record ID {$performance->id}: {$e->getMessage()}");
                $errors++;
            }
        }

        $this->info("Fixed {$fixed} records.");
        if ($errors > 0) {
            $this->warn("Failed to fix {$errors} records.");
        }

        $this->info('Performance level fixing completed!');

        return 0;
    }

    private function debugRankings(): int
    {
        $this->info('Debugging ranking generation...');


        $this->info('Checking available data...');

        $performancesBySubjectGrade = StudentPerformance::selectRaw('subject_id, grade_level_id, count(*) as student_count')
            ->groupBy('subject_id', 'grade_level_id')
            ->with(['subject', 'gradeLevel'])
            ->get();

        if ($performancesBySubjectGrade->isEmpty()) {
            $this->error('No student performance data found.');
            return 1;
        }

        foreach ($performancesBySubjectGrade as $record) {
            $this->info("Subject: {$record->subject->name}, Grade: {$record->gradeLevel->name}, Students: {$record->student_count}");
        }


        $multiStudentRecord = $performancesBySubjectGrade->where('student_count', '>', 1)->first();

        if (!$multiStudentRecord) {
            $this->warn('No subject-grade combinations found with multiple students. Testing with single student...');
            $multiStudentRecord = $performancesBySubjectGrade->first();
        }

        $subject = $multiStudentRecord->subject;
        $gradeLevel = $multiStudentRecord->gradeLevel;

        $this->info("Testing ranking generation for Subject: {$subject->name}, Grade: {$gradeLevel->name}");


        $rankingService = app(RankingService::class);

        try {
            $stats = $rankingService->generateSubjectRankings($subject, $gradeLevel);
            $this->info('Ranking generation stats:');
            $this->table(['Metric', 'Value'], [
                ['Total Students', $stats['total_students']],
                ['Students Processed', $stats['students_processed']],
                ['Rankings Generated', $stats['rankings_generated']],
                ['Errors', $stats['errors']],
            ]);


            $createdRankings = \App\Models\StudentRanking::where('subject_id', $subject->id)
                ->where('grade_level_id', $gradeLevel->id)
                ->count();

            $this->info("Actual rankings created in database: {$createdRankings}");


            $this->info("Testing overall rankings for Grade: {$gradeLevel->name}");
            $overallStats = $rankingService->generateOverallRankings($gradeLevel);
            $this->info('Overall ranking generation stats:');
            $this->table(['Metric', 'Value'], [
                ['Total Students', $overallStats['total_students']],
                ['Students Processed', $overallStats['students_processed']],
                ['Rankings Generated', $overallStats['rankings_generated']],
                ['Errors', $overallStats['errors']],
            ]);

        } catch (\Exception $e) {
            $this->error("Error generating rankings: {$e->getMessage()}");
            $this->error("Trace: {$e->getTraceAsString()}");
        }

        return 0;
    }
}
