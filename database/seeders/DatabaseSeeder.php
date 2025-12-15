<?php

declare(strict_types=1);

namespace Database\Seeders;


use Illuminate\Database\Seeder;

final class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->command->info('Starting database seeding process...');

        $this->call([
            
            RoleSeeder::class,
            
            
            GradeLevelSeeder::class,
            SubjectCategorySeeder::class,
            SubjectSeeder::class,         
            CategorySeeder::class,        
            SubscriptionTierSeeder::class,

            UserSeeder::class,              
            TeacherSubjectSeeder::class,    
            CertificateTemplateSeeder::class, 
            CourseSeeder::class,            

            
            CourseContentSeeder::class, 
            UserActivitySeeder::class,  
            FinancialSeeder::class,     
            GamificationSeeder::class,  

            
            PerformanceMetricsSeeder::class,   
            StudentPerformanceSeeder::class,    
            StudentRankingSeeder::class,        
            LeaderboardSeeder::class,           
        ]);

        $this->command->info('Database seeding completed successfully!');
    }
}
