<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\PerformanceMetric;
use App\Models\Subject;
use App\Models\SubjectPerformanceMetric;
use Illuminate\Database\Seeder;

final class PerformanceMetricsSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Seeding performance metrics...');

        if (PerformanceMetric::count() > 0) {
            $this->command->info('Performance metrics already exist. Skipping seeding.');
            return;
        }

        $metrics = [
            [
                'name' => 'Quizzes',
                'code' => 'QUIZ',
                'description' => 'Assessment through quizzes and tests',
                'calculation_method' => 'weighted_average',
                'calculation_rules' => json_encode(['count_best' => 5]),
                'is_active' => true,
            ],
            [
                'name' => 'Assignments',
                'code' => 'ASSIGN',
                'description' => 'Assessment through assignments and homework',
                'calculation_method' => 'weighted_average',
                'calculation_rules' => null,
                'is_active' => true,
            ],
            [
                'name' => 'Mid-Term Exam',
                'code' => 'MIDTERM',
                'description' => 'Mid-term examination performance',
                'calculation_method' => 'latest',
                'calculation_rules' => null,
                'is_active' => true,
            ],
            [
                'name' => 'Final Exam',
                'code' => 'FINAL',
                'description' => 'Final examination performance',
                'calculation_method' => 'latest',
                'calculation_rules' => null,
                'is_active' => true,
            ],
            [
                'name' => 'Practical Assessment',
                'code' => 'PRACT',
                'description' => 'Hands-on practical assessments',
                'calculation_method' => 'weighted_average',
                'calculation_rules' => null,
                'is_active' => true,
            ],
        ];

        foreach ($metrics as $metricData) {
            PerformanceMetric::create($metricData);
        }

        
        $subjects = Subject::all();

        if ($subjects->isEmpty()) {
            $this->command->info('No subjects found. Skipping subject performance metrics assignment.');
            return;
        }

        $metrics = PerformanceMetric::all();

        foreach ($subjects as $subject) {
            
            $weights = match ($subject->name) {
                'Mathematics' => [
                    'QUIZ' => 0.20,
                    'ASSIGN' => 0.20,
                    'MIDTERM' => 0.25,
                    'FINAL' => 0.35,
                ],
                'Physics', 'Chemistry', 'Biology' => [
                    'QUIZ' => 0.15,
                    'ASSIGN' => 0.15,
                    'MIDTERM' => 0.20,
                    'FINAL' => 0.30,
                    'PRACT' => 0.20,
                ],
                default => [
                    'QUIZ' => 0.20,
                    'ASSIGN' => 0.30,
                    'MIDTERM' => 0.20,
                    'FINAL' => 0.30,
                ],
            };

            
            foreach ($metrics as $metric) {
                if (isset($weights[$metric->code])) {
                    SubjectPerformanceMetric::create([
                        'subject_id' => $subject->id,
                        'performance_metric_id' => $metric->id,
                        'weight' => $weights[$metric->code],
                        'is_active' => true,
                    ]);
                }
            }
        }

        $this->command->info('Performance metrics seeded successfully.');
    }
}
