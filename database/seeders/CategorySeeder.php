<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

final class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Seeding categories...');
        $categories = [
            'Lower Secondary (O-Level)' => 'Courses for S1-S4 students preparing for UCE (Uganda Certificate of Education)',
            'Upper Secondary (A-Level)' => 'Courses for S5-S6 students preparing for UACE (Uganda Advanced Certificate of Education)',
            'Sciences' => 'Physics, Chemistry, Biology, and Mathematics courses',
            'Arts & Humanities' => 'Literature, History, Geography, Religious Education, and Fine Arts',
            'Languages' => 'English, Luganda, French, Swahili and other language courses',
            'Practical Subjects' => 'Agriculture, Technical Drawing, Home Economics, Computer Studies',
            'Business & Economics' => 'Entrepreneurship, Business Studies, Accounting, and Economics',
            'Test Preparation' => 'UCE and UACE examination preparation materials',
        ];

        foreach ($categories as $name => $desc) {
            Category::updateOrCreate([
                'name' => $name,
            ], [
                'slug' => Str::slug($name),
                'description' => $desc,
                
            ]);
        }
        $this->command->info('Categories seeded.');
    }
}
