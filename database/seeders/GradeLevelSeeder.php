<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\GradeLevel;
use Illuminate\Database\Seeder;

final class GradeLevelSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Seeding grade levels...');

        
        if (GradeLevel::count() > 0) {
            $this->command->info('Grade levels already exist. Skipping seeding.');
            return;
        }

        $gradeLevels = [
            // Pre-Primary
            [
                'name' => 'Pre-Primary 1 (PP1)',
                'level_order' => 1,
                'description' => 'Pre-Primary 1',
                'age_range' => '4-5',
                'curriculum_code' => 'PP1',
                'is_active' => true
            ],
            [
                'name' => 'Pre-Primary 2 (PP2)',
                'level_order' => 2,
                'description' => 'Pre-Primary 2',
                'age_range' => '5-6',
                'curriculum_code' => 'PP2',
                'is_active' => true
            ],
            // Lower Primary (Grades 1–3)
            [
                'name' => 'Grade 1',
                'level_order' => 3,
                'description' => 'Lower Primary - Grade 1',
                'age_range' => '6-7',
                'curriculum_code' => 'G1',
                'is_active' => true
            ],
            [
                'name' => 'Grade 2',
                'level_order' => 4,
                'description' => 'Lower Primary - Grade 2',
                'age_range' => '7-8',
                'curriculum_code' => 'G2',
                'is_active' => true
            ],
            [
                'name' => 'Grade 3',
                'level_order' => 5,
                'description' => 'Lower Primary - Grade 3',
                'age_range' => '8-9',
                'curriculum_code' => 'G3',
                'is_active' => true
            ],
            // Upper Primary (Grades 4–6)
            [
                'name' => 'Grade 4',
                'level_order' => 6,
                'description' => 'Upper Primary - Grade 4',
                'age_range' => '9-10',
                'curriculum_code' => 'G4',
                'is_active' => true
            ],
            [
                'name' => 'Grade 5',
                'level_order' => 7,
                'description' => 'Upper Primary - Grade 5',
                'age_range' => '10-11',
                'curriculum_code' => 'G5',
                'is_active' => true
            ],
            [
                'name' => 'Grade 6',
                'level_order' => 8,
                'description' => 'Upper Primary - Grade 6 (KPSEA)',
                'age_range' => '11-12',
                'curriculum_code' => 'G6',
                'is_active' => true
            ],
            // Junior Secondary (Grades 7–9)
            [
                'name' => 'Grade 7',
                'level_order' => 9,
                'description' => 'Junior Secondary - Grade 7',
                'age_range' => '12-13',
                'curriculum_code' => 'G7',
                'is_active' => true
            ],
            [
                'name' => 'Grade 8',
                'level_order' => 10,
                'description' => 'Junior Secondary - Grade 8',
                'age_range' => '13-14',
                'curriculum_code' => 'G8',
                'is_active' => true
            ],
            [
                'name' => 'Grade 9',
                'level_order' => 11,
                'description' => 'Junior Secondary - Grade 9 (National Exam)',
                'age_range' => '14-15',
                'curriculum_code' => 'G9',
                'is_active' => true
            ],
            // Senior School (Grades 10–12)
            [
                'name' => 'Grade 10',
                'level_order' => 12,
                'description' => 'Senior School - Grade 10',
                'age_range' => '15-16',
                'curriculum_code' => 'G10',
                'is_active' => true
            ],
            [
                'name' => 'Grade 11',
                'level_order' => 13,
                'description' => 'Senior School - Grade 11',
                'age_range' => '16-17',
                'curriculum_code' => 'G11',
                'is_active' => true
            ],
            [
                'name' => 'Grade 12',
                'level_order' => 14,
                'description' => 'Senior School - Grade 12',
                'age_range' => '17-18',
                'curriculum_code' => 'G12',
                'is_active' => true
            ],
            [
                'name' => 'Other',
                'level_order' => 99,
                'description' => 'Other/Not Specified',
                'age_range' => null,
                'curriculum_code' => 'OTHER',
                'is_active' => true
            ],
        ];

        foreach ($gradeLevels as $level) {
            GradeLevel::updateOrCreate(
                ['name' => $level['name']],
                $level
            );
        }

        $this->command->info('Grade levels seeded successfully.');
    }
}
