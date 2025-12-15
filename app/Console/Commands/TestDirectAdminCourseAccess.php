<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Route;

final class TestDirectAdminCourseAccess extends Command
{
    protected $signature = 'test:direct-admin-course-access';
    protected $description = 'Test the new direct admin course access implementation';

    public function handle(): int
    {
        $this->info('🧪 Testing Direct Admin Course Access Implementation');
        $this->info('=' . str_repeat('=', 55));


        $this->testRoutes();


        $this->testUrls();

        $this->info('');
        $this->info('✅ All direct admin course access tests completed!');
        $this->info('');
        $this->info('📋 New Admin Course URLs:');
        $this->info('- Create Course: ' . route('admin.course-creation.create'));
        $this->info('- My Courses: ' . route('admin.course-creation.my-courses'));
        $this->info('- Course Builder: /admin/courses/{id}/builder');
        $this->info('');
        $this->info('🔗 Admin stays in admin dashboard context!');

        return 0;
    }

    private function testRoutes(): void
    {
        $this->info('🛣️ Testing route registration...');

        $routes = [
            'admin.course-creation.create' => 'GET admin/course-creation/create',
            'admin.course-creation.store' => 'POST admin/course-creation/store',
            'admin.course-creation.my-courses' => 'GET admin/course-creation/my-courses',
            'admin.courses.builder' => 'GET admin/courses/{course}/builder',
        ];

        foreach ($routes as $routeName => $expectedPattern) {
            try {
                $route = Route::getRoutes()->getByName($routeName);
                if ($route) {
                    $this->line("  - {$routeName}: ✅ ({$route->uri()})");
                } else {
                    $this->line("  - {$routeName}: ❌ (Not found)");
                }
            } catch (\Exception $e) {
                $this->line("  - {$routeName}: ❌ ({$e->getMessage()})");
            }
        }
    }

    private function testUrls(): void
    {
        $this->info('🔗 Testing URL generation...');

        $urlTests = [
            'admin.course-creation.create' => 'Admin Course Creation',
            'admin.course-creation.my-courses' => 'Admin My Courses',
        ];

        foreach ($urlTests as $routeName => $description) {
            try {
                $url = route($routeName);
                $this->line("  - {$description}: ✅ ({$url})");
            } catch (\Exception $e) {
                $this->line("  - {$description}: ❌ ({$e->getMessage()})");
            }
        }
    }
}
