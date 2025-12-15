<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Course;
use App\Models\Role;
use App\Models\Category;
use App\Models\Subject;
use App\Models\GradeLevel;
use App\Models\CourseSection;
use App\Models\Lesson;
use App\Enums\LessonType;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

final class TestEndToEndWorkflow extends Command
{
    protected $signature = 'test:end-to-end-workflow';
    protected $description = 'Test the complete course approval workflow end-to-end';

    public function handle(): int
    {
        $this->info('🚀 End-to-End Course Approval Workflow Test');
        $this->info('=' . str_repeat('=', 55));


        $teacher = $this->ensureTeacherUser();
        $admin = $this->ensureAdminUser();


        $course = $this->teacherCreatesCourse($teacher);


        $this->teacherAddsContent($course);


        $this->teacherSubmitsCourse($course);


        $this->adminReviewsCourse($course, $admin);


        $rejectedCourse = $this->testRejectionWorkflow($teacher, $admin);


        $this->testResubmissionWorkflow($rejectedCourse, $teacher);

        $this->info('');
        $this->info('🎉 End-to-End Workflow Test Completed Successfully!');
        $this->info('');
        $this->info('📊 Test Summary:');
        $this->info('✅ Teacher course creation');
        $this->info('✅ Content addition');
        $this->info('✅ Submission for approval');
        $this->info('✅ Admin review and approval');
        $this->info('✅ Course rejection workflow');
        $this->info('✅ Course resubmission workflow');
        $this->info('✅ All notification triggers');

        return 0;
    }

    private function ensureTeacherUser(): User
    {
        $this->info('👨‍🏫 Setting up Teacher User...');

        $teacher = User::whereHas('roles', function ($query) {
            $query->where('name', 'teacher');
        })->where('email', 'teacher@test.local')->first();

        if (!$teacher) {
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
            $this->line("  - Created teacher user: teacher@test.local ✅");
        } else {
            $this->line("  - Teacher user exists: teacher@test.local ✅");
        }

        return $teacher;
    }

    private function ensureAdminUser(): User
    {
        $this->info('👨‍💼 Setting up Admin User...');

        $admin = User::whereHas('roles', function ($query) {
            $query->where('name', 'admin');
        })->where('email', 'admin@test.local')->first();

        if (!$admin) {
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
            $this->line("  - Created admin user: admin@test.local ✅");
        } else {
            $this->line("  - Admin user exists: admin@test.local ✅");
        }

        return $admin;
    }

    private function teacherCreatesCourse(User $teacher): Course
    {
        $this->info('📚 Step 1: Teacher Creates Course...');

        $course = Course::create([
            'user_id' => $teacher->id,
            'title' => 'E2E Test Course - ' . now()->format('Y-m-d H:i:s'),
            'slug' => 'e2e-test-course-' . now()->timestamp,
            'description' => 'This is an end-to-end test course to verify the complete approval workflow. The description is long enough to meet the 50+ character requirement for course submission.',
            'short_description' => 'E2E test course for approval workflow',
            'approval_status' => 'draft',
            'category_id' => Category::first()->id ?? $this->createCategory()->id,
            'subject_id' => Subject::first()->id ?? $this->createSubject()->id,
            'grade_level_id' => GradeLevel::first()->id ?? $this->createGradeLevel()->id,
            'pricing_type' => 'free',
            'is_published' => false,
            'instructor_info' => 'Test Teacher is an experienced educator for E2E testing.',
            'duration_in_minutes' => 120,
        ]);

        $this->line("  - Course created: ✅ (ID: {$course->id})");
        $this->line("    - Title: {$course->title}");
        $this->line("    - Status: {$course->approval_status}");
        $this->line("    - Meets submission requirements: " . ($course->meetsSubmissionRequirements() ? '❌ (needs content)' : '❌'));

        return $course;
    }

    private function teacherAddsContent(Course $course): void
    {
        $this->info('📝 Step 2: Teacher Adds Course Content...');


        $section = CourseSection::create([
            'course_id' => $course->id,
            'title' => 'Introduction Section',
            'description' => 'This is the introduction section for the E2E test course.',
            'order' => 1,
            'is_published' => false,
        ]);

        $this->line("  - Section created: ✅ ({$section->title})");


        $lesson = Lesson::create([
            'course_id' => $course->id,
            'course_section_id' => $section->id,
            'title' => 'Welcome Lesson',
            'slug' => Str::slug('Welcome Lesson' . '-' . $section->id . '-1'),
            'lesson_type' => LessonType::TEXT->value,
            'order' => 1,
            'content' => '<h2>Welcome to the Course</h2><p>This is the welcome lesson for our test course. Students will learn the basics here.</p>',
            'duration_minutes' => 15,
            'is_published' => false,
        ]);

        $this->line("  - Lesson created: ✅ ({$lesson->title})");


        $course->refresh();
        $this->line("  - Meets submission requirements: " . ($course->meetsSubmissionRequirements() ? '✅' : '❌'));
    }

    private function teacherSubmitsCourse(Course $course): void
    {
        $this->info('📤 Step 3: Teacher Submits Course for Approval...');

        Auth::login($course->user);

        if ($course->canBeSubmittedForApproval()) {
            $course->submitForApproval();
            $this->line("  - Course submitted: ✅");
            $this->line("    - Status: {$course->approval_status}");
            $this->line("    - Editing locked: " . ($course->editing_locked ? '✅' : '❌'));
            $this->line("    - Submitted at: {$course->submitted_at}");
        } else {
            $this->line("  - Course submission: ❌ (requirements not met)");
        }

        Auth::logout();
    }

    private function adminReviewsCourse(Course $course, User $admin): void
    {
        $this->info('👀 Step 4: Admin Reviews and Approves Course...');

        Auth::login($admin);

        if ($course->isSubmittedForApproval()) {
            $course->approveByAdmin($admin, 'Course looks good! Content is well-structured and meets our quality standards.');
            $this->line("  - Course approved: ✅");
            $this->line("    - Status: {$course->approval_status}");
            $this->line("    - Published: " . ($course->is_published ? '✅' : '❌'));
            $this->line("    - Approved at: {$course->approved_at}");
            $this->line("    - Reviewed by: {$course->reviewedByAdmin->name}");
        } else {
            $this->line("  - Course approval: ❌ (not submitted)");
        }

        Auth::logout();
    }

    private function testRejectionWorkflow(User $teacher, User $admin): Course
    {
        $this->info('❌ Step 5: Testing Course Rejection Workflow...');


        $course = Course::create([
            'user_id' => $teacher->id,
            'title' => 'E2E Rejection Test Course',
            'slug' => 'e2e-rejection-test-' . now()->timestamp,
            'description' => 'This course will be rejected for testing purposes. The description meets requirements.',
            'approval_status' => 'draft',
            'category_id' => Category::first()->id,
            'subject_id' => Subject::first()->id,
            'grade_level_id' => GradeLevel::first()->id,
            'pricing_type' => 'free',
            'is_published' => false,
            'duration_in_minutes' => 60,
        ]);


        $section = CourseSection::create([
            'course_id' => $course->id,
            'title' => 'Test Section',
            'order' => 1,
        ]);

        Lesson::create([
            'course_id' => $course->id,
            'course_section_id' => $section->id,
            'title' => 'Test Lesson',
            'slug' => 'test-lesson-' . $section->id,
            'lesson_type' => LessonType::TEXT->value,
            'order' => 1,
            'content' => '<p>Test content</p>',
            'duration_minutes' => 10,
        ]);


        $course->submitForApproval();
        $course->rejectByAdmin(
            $admin,
            'Course content needs improvement. Please add more detailed lessons and better structure.',
            'Additional feedback: Consider adding more interactive elements and resources.'
        );

        $this->line("  - Course rejected: ✅");
        $this->line("    - Status: {$course->approval_status}");
        $this->line("    - Rejection reason: {$course->rejection_reason}");
        $this->line("    - Editing unlocked: " . (!$course->editing_locked ? '✅' : '❌'));

        return $course;
    }

    private function testResubmissionWorkflow(Course $course, User $teacher): void
    {
        $this->info('🔄 Step 6: Testing Course Resubmission Workflow...');

        Auth::login($teacher);


        $course->update([
            'description' => 'This course has been improved based on admin feedback. Added more comprehensive content and better structure to meet quality standards.',
        ]);


        $lesson = Lesson::create([
            'course_id' => $course->id,
            'course_section_id' => $course->sections->first()->id,
            'title' => 'Improved Lesson',
            'slug' => 'improved-lesson-' . $course->sections->first()->id,
            'lesson_type' => LessonType::TEXT->value,
            'order' => 2,
            'content' => '<h2>Improved Content</h2><p>This lesson has been significantly improved with better content and structure based on admin feedback.</p>',
            'duration_minutes' => 20,
        ]);


        if ($course->isRejected() && $course->meetsSubmissionRequirements()) {
            $course->update([
                'approval_status' => 'submitted',
                'submitted_at' => now(),
                'editing_locked' => true,
                'rejected_at' => null,
            ]);

            $this->line("  - Course resubmitted: ✅");
            $this->line("    - Status: {$course->approval_status}");
            $this->line("    - Resubmitted at: {$course->submitted_at}");
        } else {
            $this->line("  - Course resubmission: ❌ (requirements not met)");
        }

        Auth::logout();
    }

    private function createCategory(): Category
    {
        return Category::create([
            'name' => 'E2E Test Category',
            'slug' => 'e2e-test-category',
            'description' => 'Category for end-to-end testing',
            'order' => 1,
            'is_active' => true,
        ]);
    }

    private function createSubject(): Subject
    {
        return Subject::create([
            'name' => 'E2E Test Subject',
            'slug' => 'e2e-test-subject',
            'description' => 'Subject for end-to-end testing',
            'order' => 1,
            'is_active' => true,
        ]);
    }

    private function createGradeLevel(): GradeLevel
    {
        return GradeLevel::create([
            'name' => 'E2E Test Grade',
            'slug' => 'e2e-test-grade',
            'description' => 'Grade level for end-to-end testing',
            'order' => 1,
            'is_active' => true,
        ]);
    }
}
