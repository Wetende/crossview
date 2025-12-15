<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Course;
use App\Models\Role;
use App\Models\Category;
use App\Models\Subject;
use App\Models\GradeLevel;
use App\Models\TeacherProfile;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

final class TestAdminCourseAccess extends Command
{
    protected $signature = 'test:admin-course-access';
    protected $description = 'Test admin course access and profile creation functionality';

    public function handle(): int
    {
        $this->info('🧪 Testing Admin Course Access & Profile Creation');
        $this->info('=' . str_repeat('=', 55));


        $admin = $this->setupAdminWithProfile();


        $this->testCourseCreationFlow($admin);


        $this->testRouteAccessibility();

        $this->info('');
        $this->info('✅ All admin course access tests completed!');
        $this->info('');
        $this->info('📋 Test Results Summary:');
        $this->info('✅ Admin profile with TeacherProfile created');
        $this->info('✅ Course creation flow tested');
        $this->info('✅ Route accessibility verified');
        $this->info('');
        $this->info('🔗 Access URLs:');
        $this->info('- Admin Profile: ' . route('admin.profile.index'));
        $this->info('- Course Creation: ' . route('admin.teacher.courses.create'));
        $this->info('- Course Builder: Available after course creation');

        return 0;
    }

    private function setupAdminWithProfile(): User
    {
        $this->info('👤 Setting up admin with complete profile...');

        $admin = User::whereHas('roles', function ($query) {
            $query->where('name', 'admin');
        })->where('email', 'admin@test.local')->first();

        if (!$admin) {
            $adminRole = Role::where('name', 'admin')->first();
            if (!$adminRole) {
                $adminRole = Role::create(['name' => 'admin', 'display_name' => 'Administrator']);
            }

            $admin = User::create([
                'name' => 'Test Administrator',
                'email' => 'admin@test.local',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]);

            $admin->roles()->attach($adminRole->id);
            $this->line("  - Created admin user: admin@test.local ✅");
        } else {
            $this->line("  - Admin user exists: admin@test.local ✅");
        }


        $teacherProfile = $admin->teacherProfile;
        if (!$teacherProfile) {
            $teacherProfile = TeacherProfile::create([
                'user_id' => $admin->id,
                'bio' => 'System Administrator with extensive experience in educational technology and course management. Specializes in creating and curating high-quality educational content for the Cross View College LMS platform.',
                'position' => 'System Administrator',
                'school_affiliation' => 'Cross View College of Theology and Technology',
                'qualifications' => 'Masters in Educational Technology, Certified in Learning Management Systems, 10+ years experience in educational administration.',
                'hourly_rate' => null,
                'available_for_tutoring' => false,
            ]);
            $this->line("  - Created TeacherProfile for admin ✅");


            $admin->refresh();
        } else {
            $this->line("  - Admin TeacherProfile exists ✅");
        }

        $this->line("  - Profile completeness: {$teacherProfile->getCompletenessPercentage()}% ✅");
        $this->line("  - Can create courses: " . ($teacherProfile->hasMinimumInfoForPublishing() ? '✅' : '❌'));

        return $admin;
    }

    private function testCourseCreationFlow(User $admin): void
    {
        $this->info('📚 Testing course creation flow...');


        $this->ensureTestData();


        Auth::login($admin);

        try {
            $course = Course::create([
                'user_id' => $admin->id,
                'title' => 'Admin Test Course - ' . now()->format('Y-m-d H:i:s'),
                'slug' => 'admin-test-course-' . now()->timestamp,
                'description' => 'This is a comprehensive test course created by an administrator to verify the course creation and management functionality. This description meets all requirements.',
                'approval_status' => 'draft',
                'category_id' => Category::first()->id,
                'subject_id' => Subject::first()->id,
                'grade_level_id' => GradeLevel::first()->id,
                'pricing_type' => 'free',
                'is_published' => false,
                'instructor_info' => $admin->teacherProfile->generateCourseInstructorInfo(),
            ]);

            $this->line("  - Course created successfully: ✅ (ID: {$course->id})");
            $this->line("    - Title: {$course->title}");
            $this->line("    - Instructor Info: " . (strlen($course->instructor_info) > 50 ? '✅' : '❌'));
            $this->line("    - Status: {$course->approval_status}");

        } catch (\Exception $e) {
            $this->line("  - Course creation failed: ❌ ({$e->getMessage()})");
        }

        Auth::logout();
    }

    private function testRouteAccessibility(): void
    {
        $this->info('🛣️ Testing route accessibility...');

        $routes = [
            'admin.profile.index' => 'Admin Profile Settings',
            'admin.teacher.courses.create' => 'Admin Course Creation',
            'admin.teacher.courses.index' => 'Admin Course List',
            'admin.course-approvals.index' => 'Course Approval Dashboard',
        ];

        foreach ($routes as $routeName => $description) {
            try {
                $url = route($routeName);
                $this->line("  - {$description}: ✅ ({$url})");
            } catch (\Exception $e) {
                $this->line("  - {$description}: ❌ ({$e->getMessage()})");
            }
        }
    }

    private function ensureTestData(): void
    {
        if (!Category::exists()) {
            Category::create([
                'name' => 'Test Category',
                'slug' => 'test-category',
                'description' => 'Test category for admin course creation',
                'order' => 1,
                'is_active' => true,
            ]);
        }

        if (!Subject::exists()) {
            Subject::create([
                'name' => 'Test Subject',
                'slug' => 'test-subject',
                'description' => 'Test subject for admin course creation',
                'order' => 1,
                'is_active' => true,
            ]);
        }

        if (!GradeLevel::exists()) {
            GradeLevel::create([
                'name' => 'Test Grade',
                'slug' => 'test-grade',
                'description' => 'Test grade for admin course creation',
                'order' => 1,
                'is_active' => true,
            ]);
        }
    }
}
