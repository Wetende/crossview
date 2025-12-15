<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\GradeLevel;
use App\Models\PerformanceLevel;
use App\Models\PerformanceMetric;
use App\Models\Role;
use App\Models\StudentPerformance;
use App\Models\Subject;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class StudentPerformanceSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Seeding student performance data...');

        // Clear existing student performance data to avoid conflicts
        Schema::disableForeignKeyConstraints();
        StudentPerformance::truncate();
        Schema::enableForeignKeyConstraints();
        
        $studentRole = Role::where('name', 'student')->first();
        if (!$studentRole) {
            $this->command->error('Student role not found. Please run RoleSeeder first.');
            return;
        }

        $students = User::whereHas('roles', function ($query) use ($studentRole) {
            $query->where('role_id', $studentRole->id);
        })->get();

        if ($students->isEmpty()) {
            $this->command->error('No students found. Please run UserSeeder first.');
            return;
        }


        $subjects = Subject::all();
        $gradeLevels = GradeLevel::all();
        $performanceMetrics = PerformanceMetric::all();
        $performanceLevels = PerformanceLevel::orderBy('min_score')->get();

        if ($subjects->isEmpty() || $gradeLevels->isEmpty() || $performanceMetrics->isEmpty() || $performanceLevels->isEmpty()) {
            $this->command->error('Missing required data. Please run all prerequisite seeders first.');
            return;
        }

        
        $semesterStart = Carbon::now()->subMonths(6);
        $semesterEnd = Carbon::now();

        $performanceData = [];
        $batchSize = 100; 
        
        // Track performance entries to avoid duplicates
        $existingEntries = [];

        foreach ($students as $student) {

            $studentProfile = $student->studentProfile;
            if (!$studentProfile || !$studentProfile->grade_level_id) {
                continue; 
            }

            $gradeLevel = $gradeLevels->firstWhere('id', $studentProfile->grade_level_id);
            if (!$gradeLevel) {
                continue; 
            }

            
            $studentSubjects = $subjects->random(rand(4, min(7, $subjects->count())));

            foreach ($studentSubjects as $subject) {
                
                foreach ($performanceMetrics as $metric) {
                    
                    $subjectMetric = DB::table('subject_performance_metrics')
                        ->where('subject_id', $subject->id)
                        ->where('performance_metric_id', $metric->id)
                        ->first();

                    if (!$subjectMetric) {
                        continue; 
                    }
                    
                    // Instead of creating multiple entries for the same unique combination,
                    // we'll create just one entry per unique combination
                    $entryKey = "{$student->id}-{$subject->id}-{$gradeLevel->id}-{$metric->id}";
                    
                    // Skip if we've already created an entry for this combination
                    if (isset($existingEntries[$entryKey])) {
                        continue;
                    }
                    
                    $existingEntries[$entryKey] = true;
                    
                    // The rest of the logic remains the same, but we'll only create one entry
                    
                    // Determine performance tier based on student ID
                    $studentPerformanceTier = $student->id % 5; 

                    // Define score ranges for different performance tiers
                    $baseScoreRanges = [
                        0 => [85, 99], 
                        1 => [75, 89], 
                        2 => [65, 79],
                        3 => [55, 69], 
                        4 => [40, 64],
                    ];

                    // Get score range for this student's tier
                    $scoreRange = $baseScoreRanges[$studentPerformanceTier];
                    $percentageScore = rand($scoreRange[0], $scoreRange[1]) + (rand(-5, 5));

                    // Ensure score is between 0-100
                    $percentageScore = max(0, min(100, $percentageScore));

                    // Calculate raw score based on metric type
                    $maxRawScore = match ($metric->code) {
                        'QUIZ' => 50,
                        'ASSIGN' => 100,
                        'MIDTERM' => 100,
                        'FINAL' => 100,
                        'PRACT' => 50,
                        default => 100,
                    };

                    $rawScore = (float)(($percentageScore / 100) * $maxRawScore);

                    // Determine performance level
                    $level = null;
                    foreach ($performanceLevels as $performanceLevel) {
                        if ($performanceLevel->containsScore($percentageScore)) {
                            $level = $performanceLevel->name;
                            break;
                        }
                    }

                    // Set appropriate date for the performance
                    $performanceDate = match ($metric->code) {
                        'MIDTERM' => $semesterStart->copy()->addMonths(2)->addDays(rand(0, 5)),
                        'FINAL' => $semesterEnd->copy()->subDays(rand(5, 20)),
                        default => $semesterStart->copy()->addDays(rand(0, (int)$semesterEnd->diffInDays($semesterStart))),
                    };

                    $performanceData[] = [
                        'user_id' => $student->id,
                        'subject_id' => $subject->id,
                        'grade_level_id' => $gradeLevel->id,
                        'performance_metric_id' => $metric->id,
                        'raw_score' => $rawScore,
                        'percentage_score' => $percentageScore,
                        'level' => $level,
                        'last_calculated_at' => $performanceDate,
                        'created_at' => $performanceDate,
                        'updated_at' => $performanceDate,
                    ];

                    // Insert in batches to improve performance
                    if (count($performanceData) >= $batchSize) {
                        StudentPerformance::insert($performanceData);
                        $performanceData = [];
                    }
                }
            }
        }

        // Insert any remaining records
        if (!empty($performanceData)) {
            StudentPerformance::insert($performanceData);
        }

        $this->command->info('Student performance data seeded successfully.');
    }
}
