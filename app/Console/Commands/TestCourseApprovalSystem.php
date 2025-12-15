<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Course;
use App\Models\Role;
use App\Models\Category;
use App\Models\Subject;
use App\Models\GradeLevel;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

final class TestCourseApprovalSystem extends Command
{
    protected $signature = 'test:course-approval-system';
    protected $description = 'Test the course approval system implementation - Phase 7 QA';

    public function handle(): int
    {
        $this->info('🧪 Phase 7: Testing Course Approval System');
        $this->info('=' . str_repeat('=', 50));


        $this->testDatabaseSchema();


        $this->testUserRoles();


        $this->testCourseCreation();


        $this->testApprovalWorkflow();


        $this->testAdminAccess();


        $this->testRoutes();

        $this->info('✅ All tests completed!');
        return 0;
    }

    private function testDatabaseSchema(): void
    {
        $this->info('🔍 Testing Database Schema...');


        $columns = [
            'approval_status',
            'submitted_at',
            'approved_at',
            'rejected_at',
            'reviewed_by_admin_id',
            'rejection_reason',
            'approval_notes',
            'editing_locked'
        ];

        foreach ($columns as $column) {
            $exists = DB::getSchemaBuilder()->hasColumn('courses', $column);
            $this->line("  - courses.{$column}: " . ($exists ? '✅' : '❌'));
        }


        $this->line('  - Course model methods:');
        $course = new Course();
        $methods = [
            'isSubmittedForApproval',
            'isApproved',
            'isRejected',
            'isDraft',
            'canBeSubmittedForApproval',
            'submitForApproval',
            'approveByAdmin',
            'rejectByAdmin'
        ];

        foreach ($methods as $method) {
            $exists = method_exists($course, $method);
            $this->line("    - {$method}(): " . ($exists ? '✅' : '❌'));
        }
    }

    private function testUserRoles(): void
    {
        $this->info('👥 Testing User Roles & Authentication...');


        $roles = ['admin', 'teacher', 'student', 'parent'];
        foreach ($roles as $roleName) {
            $role = Role::where('name', $roleName)->first();
            $this->line("  - Role '{$roleName}': " . ($role ? '✅' : '❌'));
        }


        $admin = User::whereHas('roles', function ($query) {
            $query->where('name', 'admin');
        })->first();

        if ($admin) {
            $this->line("  - Admin user exists: ✅");
            $this->line("    - hasRole('admin'): " . ($admin->hasRole('admin') ? '✅' : '❌'));
            $this->line("    - isAdmin(): " . ($admin->isAdmin() ? '✅' : '❌'));
        } else {
            $this->line("  - Admin user exists: ❌");
            $this->warn("    Creating test admin user...");
            $this->createTestAdmin();
        }


        $teacher = User::whereHas('roles', function ($query) {
            $query->where('name', 'teacher');
        })->first();

        if ($teacher) {
            $this->line("  - Teacher user exists: ✅");
            $this->line("    - hasRole('teacher'): " . ($teacher->hasRole('teacher') ? '✅' : '❌'));
        } else {
            $this->line("  - Teacher user exists: ❌");
            $this->warn("    Creating test teacher user...");
            $this->createTestTeacher();
        }
    }

    private function testCourseCreation(): void
    {
        $this->info('📚 Testing Course Creation...');


        $category = Category::first();
        $subject = Subject::first();
        $gradeLevel = GradeLevel::first();

        $this->line("  - Category exists: " . ($category ? '✅' : '❌'));
        $this->line("  - Subject exists: " . ($subject ? '✅' : '❌'));
        $this->line("  - Grade Level exists: " . ($gradeLevel ? '✅' : '❌'));

        if (!$category || !$subject || !$gradeLevel) {
            $this->warn("    Creating test data...");
            $this->createTestData();
        }


        $teacher = User::whereHas('roles', function ($query) {
            $query->where('name', 'teacher');
        })->first();

        if ($teacher) {
            $course = Course::create([
                'user_id' => $teacher->id,
                'title' => 'Test Course - ' . now()->format('Y-m-d H:i:s'),
                'slug' => 'test-course-' . now()->timestamp,
                'description' => 'This is a test course created during Phase 7 testing. This description meets the minimum 50 character requirement for course submission.',
                'approval_status' => 'draft',
                'category_id' => Category::first()->id,
                'subject_id' => Subject::first()->id,
                'grade_level_id' => GradeLevel::first()->id,
                'pricing_type' => 'free',
                'is_published' => false,
            ]);

            $this->line("  - Test course created: ✅ (ID: {$course->id})");
            $this->line("    - Status: {$course->approval_status}");
            $this->line("    - Can submit: " . ($course->canBeSubmittedForApproval() ? '✅' : '❌'));
        }
    }

    private function testApprovalWorkflow(): void
    {
        $this->info('🔄 Testing Approval Workflow...');

        $course = Course::where('approval_status', 'draft')->first();
        $admin = User::whereHas('roles', function ($query) {
            $query->where('name', 'admin');
        })->first();

        if (!$course || !$admin) {
            $this->warn("  - Skipping workflow test (no test data)");
            return;
        }


        try {
            $course->submitForApproval();
            $this->line("  - Submit for approval: ✅");
            $this->line("    - Status: {$course->approval_status}");
            $this->line("    - Editing locked: " . ($course->editing_locked ? '✅' : '❌'));
        } catch (\Exception $e) {
            $this->line("  - Submit for approval: ❌ ({$e->getMessage()})");
        }


        try {
            $course->approveByAdmin($admin);
            $this->line("  - Approve by admin: ✅");
            $this->line("    - Status: {$course->approval_status}");
            $this->line("    - Published: " . ($course->is_published ? '✅' : '❌'));
        } catch (\Exception $e) {
            $this->line("  - Approve by admin: ❌ ({$e->getMessage()})");
        }
    }

    private function testAdminAccess(): void
    {
        $this->info('🔐 Testing Admin Access...');

        $admin = User::whereHas('roles', function ($query) {
            $query->where('name', 'admin');
        })->first();

        if (!$admin) {
            $this->warn("  - No admin user found");
            return;
        }


        $course = Course::first();
        if ($course) {
            $canManage = $admin->hasRole('admin') || $admin->id === $course->user_id;
            $this->line("  - Admin can manage course: " . ($canManage ? '✅' : '❌'));
        }


        $coursePolicy = new \App\Policies\CoursePolicy();
        $this->line("  - Policy create: " . ($coursePolicy->create($admin) ? '✅' : '❌'));
        $this->line("  - Policy viewAny: " . ($coursePolicy->viewAny($admin) ? '✅' : '❌'));

        if ($course) {
            $this->line("  - Policy update: " . ($coursePolicy->update($admin, $course) ? '✅' : '❌'));
        }
    }

    private function testRoutes(): void
    {
        $this->info('🛣️ Testing Routes...');

        $routes = [
            'admin.teacher.courses.index',
            'admin.teacher.courses.create',
            'admin.course-approvals.index',
        ];

        foreach ($routes as $routeName) {
            try {
                $route = route($routeName);
                $this->line("  - {$routeName}: ✅");
            } catch (\Exception $e) {
                $this->line("  - {$routeName}: ❌ ({$e->getMessage()})");
            }
        }
    }

    private function createTestAdmin(): void
    {
        $adminRole = Role::where('name', 'admin')->first();
        if (!$adminRole) {
            $adminRole = Role::create(['name' => 'admin', 'display_name' => 'Administrator']);
        }

        $admin = User::create([
            'name' => 'Test Admin',
            'email' => 'admin@test.local',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);

        $admin->roles()->attach($adminRole->id);
        $this->info("  - Created test admin: admin@test.local / password");
    }

    private function createTestTeacher(): void
    {
        $teacherRole = Role::where('name', 'teacher')->first();
        if (!$teacherRole) {
            $teacherRole = Role::create(['name' => 'teacher', 'display_name' => 'Teacher']);
        }

        $teacher = User::create([
            'name' => 'Test Teacher',
            'email' => 'teacher@test.local',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);

        $teacher->roles()->attach($teacherRole->id);
        $this->info("  - Created test teacher: teacher@test.local / password");
    }

    private function createTestData(): void
    {
        if (!Category::exists()) {
            Category::create([
                'name' => 'Test Category',
                'slug' => 'test-category',
                'description' => 'Test category for QA',
                'order' => 1,
                'is_active' => true,
            ]);
        }

        if (!Subject::exists()) {
            Subject::create([
                'name' => 'Test Subject',
                'slug' => 'test-subject',
                'description' => 'Test subject for QA',
                'order' => 1,
                'is_active' => true,
            ]);
        }

        if (!GradeLevel::exists()) {
            GradeLevel::create([
                'name' => 'Test Grade',
                'slug' => 'test-grade',
                'description' => 'Test grade for QA',
                'order' => 1,
                'is_active' => true,
            ]);
        }
    }
}
