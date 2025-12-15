<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\SubjectCategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SubjectCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            // Pre-Primary
            [
                'name' => 'Foundational Learning Areas',
                'description' => 'Language, Environmental and Mathematical Activities for Pre-Primary (PP1–PP2)',
                'level' => 'Pre-Primary',
                'position' => 1,
            ],
            [
                'name' => 'Literacy and Communication',
                'description' => 'Pre-Primary language and communication',
                'level' => 'Pre-Primary',
                'position' => 2,
            ],
            [
                'name' => 'Environmental Activities',
                'description' => 'Environmental learning areas for Pre-Primary',
                'level' => 'Pre-Primary',
                'position' => 3,
            ],
            [
                'name' => 'Mathematical Activities',
                'description' => 'Pre-Primary mathematical activities',
                'level' => 'Pre-Primary',
                'position' => 4,
            ],
            
            // Lower Primary (Grades 1–3)
            [
                'name' => 'Languages',
                'description' => 'English, Kiswahili, Indigenous Languages (Grades 1–3)',
                'level' => 'Lower Primary',
                'position' => 5,
            ],
            [
                'name' => 'Mathematics',
                'description' => 'Mathematics (Grades 1–3)',
                'level' => 'Lower Primary',
                'position' => 6,
            ],
            [
                'name' => 'Environmental Activities',
                'description' => 'Environmental and hygiene activities (Grades 1–3)',
                'level' => 'Lower Primary',
                'position' => 7,
            ],

            // Upper Primary (Grades 4–6)
            [
                'name' => 'Languages',
                'description' => 'English, Kiswahili, Indigenous Languages (Grades 4–6)',
                'level' => 'Upper Primary',
                'position' => 8,
            ],
            [
                'name' => 'Mathematics',
                'description' => 'Mathematics (Grades 4–6)',
                'level' => 'Upper Primary',
                'position' => 9,
            ],
            [
                'name' => 'Science & Technology',
                'description' => 'Integrated science and technology (Grades 4–6)',
                'level' => 'Upper Primary',
                'position' => 10,
            ],
            [
                'name' => 'Social Studies',
                'description' => 'Social studies (Grades 4–6)',
                'level' => 'Upper Primary',
                'position' => 11,
            ],
            [
                'name' => 'Creative Arts',
                'description' => 'Art, craft, music (Grades 4–6)',
                'level' => 'Upper Primary',
                'position' => 12,
            ],

            // Junior Secondary (Grades 7–9)
            [
                'name' => 'Languages',
                'description' => 'English, Kiswahili, Foreign & Indigenous Languages (Grades 7–9)',
                'level' => 'Junior Secondary',
                'position' => 13,
            ],
            [
                'name' => 'Mathematics',
                'description' => 'Mathematics (Grades 7–9)',
                'level' => 'Junior Secondary',
                'position' => 14,
            ],
            [
                'name' => 'Integrated Science',
                'description' => 'Integrated Science (Grades 7–9)',
                'level' => 'Junior Secondary',
                'position' => 15,
            ],
            [
                'name' => 'Social Studies & Life Skills',
                'description' => 'Social Studies merged with Life Skills (Grades 7–9)',
                'level' => 'Junior Secondary',
                'position' => 16,
            ],
            [
                'name' => 'Pre-Technical Studies',
                'description' => 'Pre-Technical and Pre-Career (Grades 7–9)',
                'level' => 'Junior Secondary',
                'position' => 17,
            ],
            [
                'name' => 'Creative Arts & Sports',
                'description' => 'Creative Arts and Sports (Grades 7–9)',
                'level' => 'Junior Secondary',
                'position' => 18,
            ],
            [
                'name' => 'Agriculture & Nutrition',
                'description' => 'Agriculture and Home Science/Nutrition (Grades 7–9)',
                'level' => 'Junior Secondary',
                'position' => 19,
            ],

            // Senior School (Grades 10–12) pathways
            [
                'name' => 'STEM Pathway',
                'description' => 'Science, Technology, Engineering, Mathematics (Grades 10–12)',
                'level' => 'Senior School',
                'position' => 20,
            ],
            [
                'name' => 'Social Sciences Pathway',
                'description' => 'Humanities and Social Sciences (Grades 10–12)',
                'level' => 'Senior School',
                'position' => 21,
            ],
            [
                'name' => 'Arts & Sports Pathway',
                'description' => 'Visual and Performing Arts, Sports Science (Grades 10–12)',
                'level' => 'Senior School',
                'position' => 22,
            ],
        ];

        foreach ($categories as $category) {
            SubjectCategory::create([
                'name' => $category['name'],
                'slug' => Str::slug($category['name']),
                'description' => $category['description'],
                'level' => $category['level'],
                'position' => $category['position'],
                'is_active' => true,
            ]);
        }
    }
}
