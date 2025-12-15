<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Course;
use App\Models\User;
use App\Models\Category;
use App\Models\Subject;
use App\Models\GradeLevel;
use App\Models\CertificateTemplate;
use App\Models\SubscriptionTier; 
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Faker\Factory as Faker;

final class CourseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();
        $this->command->info('Seeding courses...');

        
        $teacherUsers = User::whereHas('roles', fn ($q) => $q->where('name', 'teacher'))->get();
        $categories = Category::all();
        $subjects = Subject::all();
        $gradeLevels = GradeLevel::all();
        $certificateTemplates = CertificateTemplate::where('is_active', true)->get();
        $subscriptionTiers = SubscriptionTier::all(); 

        if ($teacherUsers->isEmpty()) {
            $this->command->warn('No teachers found. Courses cannot be created. Skipping CourseSeeder.');
            return;
        }
        if ($categories->isEmpty() || $subjects->isEmpty() || $gradeLevels->isEmpty()) {
            $this->command->warn('Missing categories, subjects, or grade levels. Please seed them first. Skipping CourseSeeder.');
            return;
        }

        $courseTitles = [
            "Introduction to Algebra", "Advanced Quantum Mechanics", "Creative Writing Workshop",
            "Beginner Python Programming", "Digital Marketing Fundamentals", "History of Ancient Civilizations",
            "Calculus I", "Organic Chemistry", "Introduction to Psychology", "Graphic Design Basics",
            "Data Science with Python", "Learn Spanish for Beginners", "Music Theory Fundamentals",
            "Introduction to Artificial Intelligence", "Project Management Essentials"
        ];

        for ($i = 0; $i < count($courseTitles); $i++) {
            $title = $faker->randomElement($courseTitles); 
            $courseTitles = array_diff($courseTitles, [$title]); 
            if (empty($title)) {
                continue;
            } 

            $isPublished = $faker->boolean(85); 
            $price = $faker->randomElement([0.00, 0.00, 9.99, 19.99, 29.99, 49.99, 79.99]);
            $isFree = $price == 0.00;

            $allowCertificate = $certificateTemplates->isNotEmpty() && $faker->boolean(60);
            $subscriptionRequired = !$isFree && $subscriptionTiers->isNotEmpty() && $faker->boolean(20); 


            $subject = Subject::factory()->existing();

            Course::factory()->create([
                'user_id' => $teacherUsers->random()->id,
                'title' => $title,
                'slug' => Str::slug($title) . '-' . Str::random(4), 
                'description' => $faker->paragraphs(3, true),
                'short_description' => $faker->sentence(15),
                'price' => $price,
                'level' => $faker->randomElement(['S1', 'S2', 'S3', 'S4', 'S5', 'S6']),
                'category_id' => $categories->random()->id,
                'subject_id' => $subject->id,
                'grade_level_id' => $gradeLevels->random()->id,
                'is_published' => $isPublished,
                'published_at' => $isPublished ? $faker->dateTimeThisYear() : null,
                'allow_certificate' => $allowCertificate,
                'certificate_template_id' => $allowCertificate ? $certificateTemplates->random()->id : null,
                'subscription_required' => $subscriptionRequired,
                'required_subscription_tier_id' => $subscriptionRequired ? $subscriptionTiers->random()->id : null,
                'what_you_will_learn' => json_encode($faker->sentences($faker->numberBetween(3, 6))),
                'requirements' => json_encode($faker->sentences($faker->numberBetween(2, 4))),
                'meta_title' => $title . ' | StudySafari',
                'meta_description' => Str::limit($faker->sentence(20), 160),
                'meta_keywords' => implode(', ', $faker->words(5)),
                'thumbnail_path' => 'placeholders/course_thumbnail_' . ($i % 5 + 1) . '.jpg', 
                'duration_in_minutes' => $faker->numberBetween(60, 600),
            ]);
        }
        $this->command->info(count($courseTitles) . ' courses seeded (target 15-25 based on plan).');
    }
}
