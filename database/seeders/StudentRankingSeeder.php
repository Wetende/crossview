<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\GradeLevel;
use App\Models\Subject;
use App\Services\RankingService;
use Illuminate\Database\Seeder;

final class StudentRankingSeeder extends Seeder
{
    public function __construct(
        private readonly RankingService $rankingService,
    ) {
    }

    public function run(): void
    {
        $this->command->info('Generating student rankings based on performance data...');


        $gradeLevels = GradeLevel::where('is_active', true)->get();
        $subjects = Subject::where('is_active', true)->get();

        if ($gradeLevels->isEmpty() || $subjects->isEmpty()) {
            $this->command->error('No active grade levels or subjects found. Please run prerequisite seeders first.');
            return;
        }

        
        foreach ($gradeLevels as $gradeLevel) {
            $this->command->info("Generating rankings for grade level: {$gradeLevel->name}");

            
            $overallStats = $this->rankingService->generateOverallRankings($gradeLevel);
            $this->command->info("  Overall rankings: {$overallStats['rankings_generated']} generated, {$overallStats['total_students']} students");

            
            foreach ($subjects as $subject) {
                $subjectStats = $this->rankingService->generateSubjectRankings($subject, $gradeLevel);
                $this->command->info("  {$subject->name} rankings: {$subjectStats['rankings_generated']} generated, {$subjectStats['total_students']} students");
            }
        }

        $this->command->info('Student rankings generated successfully.');
    }
}
