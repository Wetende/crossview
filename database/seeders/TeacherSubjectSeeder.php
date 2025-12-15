<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use App\Models\Subject;
use Illuminate\Database\Seeder;
use Faker\Factory as Faker;

final class TeacherSubjectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();
        $this->command->info('Seeding teacher specializations (teacher_subjects)...');


        $teachers = User::whereHas('roles', function ($query) {
            $query->where('name', 'teacher');
        })->get();


        $subjects = Subject::all();

        if ($teachers->isEmpty()) {
            $this->command->warn('No teachers found to assign subjects. Skipping TeacherSubjectSeeder.');
            return;
        }

        if ($subjects->isEmpty()) {
            $this->command->warn('No subjects found to assign to teachers. Please seed subjects first. Skipping TeacherSubjectSeeder.');
            
            
            return;
        }

        foreach ($teachers as $teacher) {
            
            $numberOfSubjects = $faker->numberBetween(1, min(3, $subjects->count()));
            $assignedSubjects = $subjects->random($numberOfSubjects);

            
            if (!$assignedSubjects instanceof \Illuminate\Database\Eloquent\Collection) {
                $assignedSubjects = new \Illuminate\Database\Eloquent\Collection([$assignedSubjects]);
            }

            foreach ($assignedSubjects as $subject) {
                
                if (!$teacher->specializedSubjects()->where('subject_id', $subject->id)->exists()) {
                    $teacher->specializedSubjects()->attach($subject->id);
                }
            }
        }

        $this->command->info('Teacher specializations seeded successfully.');
    }
}
