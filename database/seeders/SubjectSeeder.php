<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Subject;
use App\Models\SubjectCategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

final class SubjectSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Seeding subjects...');
        
        // Junior Secondary categories (Grades 7–9)
        $jsLanguages = SubjectCategory::where('name', 'Languages')->where('level', 'Junior Secondary')->first()?->id;
        $jsMathematics = SubjectCategory::where('name', 'Mathematics')->where('level', 'Junior Secondary')->first()?->id;
        $jsIntegratedScience = SubjectCategory::where('name', 'Integrated Science')->where('level', 'Junior Secondary')->first()?->id;
        $jsSocialLife = SubjectCategory::where('name', 'Social Studies & Life Skills')->where('level', 'Junior Secondary')->first()?->id;
        $jsPreTechnical = SubjectCategory::where('name', 'Pre-Technical Studies')->where('level', 'Junior Secondary')->first()?->id;
        $jsCreativeSports = SubjectCategory::where('name', 'Creative Arts & Sports')->where('level', 'Junior Secondary')->first()?->id;
        $jsAgricultureNutrition = SubjectCategory::where('name', 'Agriculture & Nutrition')->where('level', 'Junior Secondary')->first()?->id;

        // Senior School pathways (Grades 10–12)
        $ssStem = SubjectCategory::where('name', 'STEM Pathway')->where('level', 'Senior School')->first()?->id;
        $ssSocial = SubjectCategory::where('name', 'Social Sciences Pathway')->where('level', 'Senior School')->first()?->id;
        $ssArtsSports = SubjectCategory::where('name', 'Arts & Sports Pathway')->where('level', 'Senior School')->first()?->id;
        
        $subjects = [
            // Junior Secondary
            ['name' => 'English', 'category_id' => $jsLanguages],
            ['name' => 'Kiswahili', 'category_id' => $jsLanguages],
            ['name' => 'Indigenous Languages', 'category_id' => $jsLanguages],
            ['name' => 'Foreign Languages', 'category_id' => $jsLanguages],
            ['name' => 'Mathematics', 'category_id' => $jsMathematics],
            ['name' => 'Integrated Science', 'category_id' => $jsIntegratedScience],
            ['name' => 'Social Studies & Life Skills', 'category_id' => $jsSocialLife],
            ['name' => 'Pre-Technical Studies', 'category_id' => $jsPreTechnical],
            ['name' => 'Creative Arts & Sports', 'category_id' => $jsCreativeSports],
            ['name' => 'Agriculture & Nutrition', 'category_id' => $jsAgricultureNutrition],

            // Senior School - STEM
            ['name' => 'Mathematics', 'category_id' => $ssStem],
            ['name' => 'Physics', 'category_id' => $ssStem],
            ['name' => 'Chemistry', 'category_id' => $ssStem],
            ['name' => 'Biology', 'category_id' => $ssStem],
            ['name' => 'Computer Science', 'category_id' => $ssStem],

            // Senior School - Social Sciences
            ['name' => 'History', 'category_id' => $ssSocial],
            ['name' => 'Geography', 'category_id' => $ssSocial],
            ['name' => 'Business Studies', 'category_id' => $ssSocial],
            ['name' => 'Economics', 'category_id' => $ssSocial],
            ['name' => 'Religious Education', 'category_id' => $ssSocial],

            // Senior School - Arts & Sports
            ['name' => 'Visual Arts', 'category_id' => $ssArtsSports],
            ['name' => 'Performing Arts', 'category_id' => $ssArtsSports],
            ['name' => 'Music', 'category_id' => $ssArtsSports],
            ['name' => 'Sports Science', 'category_id' => $ssArtsSports],
        ];

        foreach ($subjects as $subject) {
            if (!$subject['category_id']) {
                // Skip if the mapped category is missing
                continue;
            }

            Subject::updateOrCreate([
                'name' => $subject['name'],
            ], [
                'slug' => Str::slug($subject['name']),
                'description' => "Courses and materials related to {$subject['name']} following the Kenya CBC curriculum.",
                'subject_category_id' => $subject['category_id'],
            ]);
        }
        $this->command->info('Subjects seeded.');
    }
}
