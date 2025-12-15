<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Subject;
use App\Models\PerformanceMetric;
use App\Models\StudentPerformance;
use Illuminate\Support\Facades\DB;

final class ParentChildConnectionSeeder extends Seeder
{
    public function run(): void
    {
        
        $parent = User::firstOrCreate(
            ['email' => 'parent@studysafari.app'],
            [
                'name' => 'Parent User',
                'email' => 'parent@studysafari.app',
                'email_verified_at' => now(),
                'password' => bcrypt('password'),
            ]
        );

        
        $student = User::firstOrCreate(
            ['email' => 'temmi@studysafari.app'],
            [
                'name' => 'Temmi',
                'email' => 'temmi@studysafari.app',
                'email_verified_at' => now(),
                'password' => bcrypt('password'),
            ]
        );

        
        if (!$parent->hasRole('parent')) {
            $parentRole = \App\Models\Role::where('name', 'parent')->first();
            if ($parentRole) {
                $parent->roles()->attach($parentRole);
            }
        }

        if (!$student->hasRole('student')) {
            $studentRole = \App\Models\Role::where('name', 'student')->first();
            if ($studentRole) {
                $student->roles()->attach($studentRole);
            }
        }

        
        DB::table('parent_student')->updateOrInsert(
            [
                'parent_user_id' => $parent->id,
                'student_user_id' => $student->id,
            ],
            [
                'status' => 'active',
                'requested_at' => now(),
                'actioned_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        
        $subjects = ['Accounting', 'Literature', 'Mathematics', 'Computer Science', 'Physics'];
        foreach ($subjects as $subjectName) {
            Subject::firstOrCreate(['name' => $subjectName]);
        }

        
        $metrics = ['Mid-Term Exam', 'Practical Assessment', 'Assignments', 'Quizzes', 'Final Exam'];
        foreach ($metrics as $metricName) {
            PerformanceMetric::firstOrCreate(['name' => $metricName]);
        }

        
        $subjectModels = Subject::all();
        $metricModels = PerformanceMetric::all();

        $performanceData = [
            ['subject' => 'Accounting', 'metric' => 'Mid-Term Exam', 'score' => 85.0, 'date' => now()->subDays(5)],
            ['subject' => 'Accounting', 'metric' => 'Practical Assessment', 'score' => 78.0, 'date' => now()->subDays(10)],
            ['subject' => 'Literature', 'metric' => 'Assignments', 'score' => 84.0, 'date' => now()->subDays(15)],
            ['subject' => 'Mathematics', 'metric' => 'Assignments', 'score' => 79.0, 'date' => now()->subDays(20)],
            ['subject' => 'Computer Science', 'metric' => 'Quizzes', 'score' => 79.0, 'date' => now()->subDays(25)],
        ];

        foreach ($performanceData as $data) {
            $subject = $subjectModels->firstWhere('name', $data['subject']);
            $metric = $metricModels->firstWhere('name', $data['metric']);

            if ($subject && $metric) {
                StudentPerformance::firstOrCreate(
                    [
                        'user_id' => $student->id,
                        'subject_id' => $subject->id,
                        'performance_metric_id' => $metric->id,
                    ],
                    [
                        'percentage_score' => $data['score'],
                        'last_calculated_at' => $data['date'],
                        'created_at' => $data['date'],
                        'updated_at' => $data['date'],
                    ]
                );
            }
        }

        $this->command->info('Parent-child connection and performance data created successfully.');
    }
}
