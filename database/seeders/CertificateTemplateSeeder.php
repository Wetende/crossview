<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\CertificateTemplate;
use Illuminate\Database\Seeder;

final class CertificateTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Seeding certificate templates...');
        $templates = [
            [
                'name' => 'Certificate of Completion - Basic',
                'description' => 'A basic certificate confirming course completion.',
                'template_path' => 'templates/certificates/basic_completion.pdf', 
                'fields' => json_encode([ 
                    'student_name',
                    'course_name',
                    'completion_date'
                ]),
                'is_active' => true,
            ],
            [
                'name' => 'Advanced Achievement Award',
                'description' => 'Certificate for advanced achievement in a course or specialization.',
                'template_path' => 'templates/certificates/advanced_achievement.pdf', 
                'fields' => json_encode([
                    'student_name',
                    'course_name',
                    'achievement_level',
                    'issued_date'
                ]),
                'is_active' => true,
            ],
            [
                'name' => 'Workshop Participation Certificate',
                'description' => 'Certificate for participation in a workshop.',
                'template_path' => 'templates/certificates/workshop_participation.pdf', 
                'fields' => json_encode([
                    'participant_name',
                    'workshop_title',
                    'workshop_date'
                ]),
                'is_active' => true,
            ],
        ];

        foreach ($templates as $templateData) {
            CertificateTemplate::updateOrCreate(
                ['name' => $templateData['name']], 
                $templateData
            );
        }
        $this->command->info('Certificate templates seeded successfully.');
    }
}
