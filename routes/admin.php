<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\MessagesController;
use App\Http\Controllers\Admin\CourseController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\SubjectController;
use App\Http\Controllers\Admin\GradeLevelController;
use App\Http\Controllers\Admin\SubjectTopicController;
use App\Http\Controllers\Admin\ParentStudentLinkController;
use App\Http\Controllers\Admin\TeacherPaymentVerificationController;
use App\Http\Controllers\Admin\BadgeController;
use App\Http\Controllers\Admin\LeaderboardController;
use App\Http\Controllers\Admin\SubscriptionTierController;
use App\Http\Controllers\Admin\PerformanceMetricController;
use App\Http\Controllers\Admin\PerformanceLevelController;
use App\Http\Controllers\Admin\PerformanceController;
use App\Http\Controllers\Admin\CourseApprovalController;
use App\Http\Controllers\Teacher\CourseController as TeacherCourseController;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Admin\SubjectCategoryController;

Route::middleware(['auth', 'verified', 'role:admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'overview'])->name('overview');

        
        Route::resource('users', UserController::class);
        Route::post('/users/bulk-action', [UserController::class, 'bulkAction'])->name('users.bulk-action');
        Route::get('/users/{user}/impersonate', [UserController::class, 'impersonate'])->name('users.impersonate');

        
        Route::get('/user-management', function () {
            return redirect()->route('admin.users.index');
        });

        Route::get('/settings', [DashboardController::class, 'settings'])->name('settings.index');
        Route::post('/settings', [DashboardController::class, 'updateSettings'])->name('settings.update');
        Route::post('/settings/password', [DashboardController::class, 'updatePassword'])->name('settings.password.update');

        
        Route::get('/profile', function () {
            $user = Auth::user();
            $teacherProfile = $user->teacherProfile;
            return view('admin.profile.settings', compact('user', 'teacherProfile'));
        })->name('profile.index');
        Route::post('/profile', [DashboardController::class, 'updateSettings'])->name('profile.update');
        Route::post('/profile/password', [DashboardController::class, 'updatePassword'])->name('profile.password.update');

        Route::get('/reports', [DashboardController::class, 'reports'])->name('reports.index');

        Route::prefix('messages')->name('messages.')->group(function () {
            Route::get('/', [MessagesController::class, 'index'])->name('index');
            Route::get('/{message}', [MessagesController::class, 'show'])->name('show');
            Route::post('/', [MessagesController::class, 'store'])->name('store');
        });

        Route::resource('courses', CourseController::class);
        Route::get('courses/create', [CourseController::class, 'create'])->name('courses.create');
        Route::post('courses', [CourseController::class, 'store'])->name('courses.store');
        Route::put('courses/{course}/status', [CourseController::class, 'updateStatus'])->name('courses.status.update');

        Route::put('courses/{course}/featured', [CourseController::class, 'toggleFeatured'])->name('courses.featured.toggle');
        Route::put('courses/{course}/recommended', [CourseController::class, 'toggleRecommended'])->name('courses.recommended.toggle');

        Route::get('courses/trash', [CourseController::class, 'trash'])->name('courses.trash');
        Route::delete('courses/{course}/force-delete', [CourseController::class, 'forceDelete'])->name('courses.force-delete');
        Route::put('courses/{courseId}/restore', [CourseController::class, 'restore'])->name('courses.restore');

        
        Route::prefix('course-approvals')->name('course-approvals.')->group(function () {
            Route::get('/', [CourseApprovalController::class, 'index'])->name('index');
            Route::get('/{course}', [CourseApprovalController::class, 'show'])->name('show');
            Route::post('/{course}/approve', [CourseApprovalController::class, 'approve'])->name('approve');
            Route::post('/{course}/reject', [CourseApprovalController::class, 'reject'])->name('reject');
            Route::post('/bulk/approve', [CourseApprovalController::class, 'bulkApprove'])->name('bulk.approve');
            Route::post('/bulk/reject', [CourseApprovalController::class, 'bulkReject'])->name('bulk.reject');
            Route::get('/export/pending', [CourseApprovalController::class, 'exportPending'])->name('export.pending');
            Route::get('/statistics', [CourseApprovalController::class, 'statistics'])->name('statistics');
        });

        Route::get('courses/{course}/curriculum', [CourseController::class, 'showCurriculum'])->name('courses.curriculum');

        Route::resource('categories', CategoryController::class);
        Route::resource('subjects', SubjectController::class);
        Route::resource('subject-categories', SubjectCategoryController::class);
        Route::resource('grade-levels', GradeLevelController::class);
        Route::resource('subject-topics', SubjectTopicController::class);
        Route::resource('badges', BadgeController::class);

        
        Route::resource('subscription-tiers', SubscriptionTierController::class);
        Route::put('subscription-tiers/{subscriptionTier}/toggle-status', [SubscriptionTierController::class, 'toggleStatus'])
            ->name('subscription-tiers.toggle-status');
        Route::post('subscription-tiers/update-discount', [SubscriptionTierController::class, 'updateDiscount'])
            ->name('subscription-tiers.update-discount');
        Route::get('subscription-tiers/get-discount', [SubscriptionTierController::class, 'getDiscount'])
            ->name('subscription-tiers.get-discount');

        
        Route::resource('leaderboards', LeaderboardController::class);
        Route::post('leaderboards/{leaderboard}/update-rankings', [LeaderboardController::class, 'updateRankings'])
            ->name('leaderboards.update-rankings');

        
        Route::prefix('performance')->name('performance.')->group(function () {

            Route::get('/', [PerformanceController::class, 'dashboard'])->name('dashboard');

            
            Route::get('/metrics', [PerformanceMetricController::class, 'index'])->name('metrics.index');
            Route::get('/metrics/create', [PerformanceMetricController::class, 'create'])->name('metrics.create');
            Route::post('/metrics', [PerformanceMetricController::class, 'store'])->name('metrics.store');
            Route::get('/metrics/{metric}/edit', [PerformanceMetricController::class, 'edit'])->name('metrics.edit');
            Route::put('/metrics/{metric}', [PerformanceMetricController::class, 'update'])->name('metrics.update');
            Route::delete('/metrics/{metric}', [PerformanceMetricController::class, 'destroy'])->name('metrics.destroy');
            Route::post('/metrics/update-order', [PerformanceMetricController::class, 'updateOrder'])->name('metrics.update-order');

            
            Route::get('/levels', [PerformanceLevelController::class, 'index'])->name('levels.index');
            Route::get('/levels/create', [PerformanceLevelController::class, 'create'])->name('levels.create');
            Route::post('/levels', [PerformanceLevelController::class, 'store'])->name('levels.store');
            Route::get('/levels/{level}/edit', [PerformanceLevelController::class, 'edit'])->name('levels.edit');
            Route::put('/levels/{level}', [PerformanceLevelController::class, 'update'])->name('levels.update');
            Route::delete('/levels/{level}', [PerformanceLevelController::class, 'destroy'])->name('levels.destroy');
            Route::post('/levels/update-order', [PerformanceLevelController::class, 'updateOrder'])->name('levels.update-order');

            
            Route::get('/subjects', [PerformanceController::class, 'listSubjects'])->name('subjects.index');
            Route::get('/subjects/{subject}/configure', [PerformanceController::class, 'configureSubject'])->name('subjects.configure');
            Route::post('/subjects/{subject}/configure', [PerformanceController::class, 'updateSubjectConfiguration'])->name('subjects.configure.update');

            
            Route::get('/schedules', [PerformanceController::class, 'listSchedules'])->name('schedules.index');
            Route::get('/schedules/create', [PerformanceController::class, 'createSchedule'])->name('schedules.create');
            Route::post('/schedules', [PerformanceController::class, 'storeSchedule'])->name('schedules.store');
            Route::get('/schedules/{schedule}/edit', [PerformanceController::class, 'editSchedule'])->name('schedules.edit');
            Route::put('/schedules/{schedule}', [PerformanceController::class, 'updateSchedule'])->name('schedules.update');
            Route::delete('/schedules/{schedule}', [PerformanceController::class, 'destroySchedule'])->name('schedules.destroy');

            
            Route::get('/calculate', [PerformanceController::class, 'showCalculationForm'])->name('calculate.form');
            Route::post('/calculate', [PerformanceController::class, 'triggerCalculation'])->name('calculate.trigger');

            
            Route::get('/generate', [DashboardController::class, 'showPerformanceGenerationForm'])->name('generate.form');
            Route::post('/generate', [DashboardController::class, 'triggerPerformanceGeneration'])->name('generate.trigger');
        });

        Route::post('categories/reorder', [CategoryController::class, 'reorder'])->name('categories.reorder');
        Route::post('subjects/reorder', [SubjectController::class, 'reorder'])->name('subjects.reorder');
        Route::post('grade-levels/reorder', [GradeLevelController::class, 'reorder'])->name('grade-levels.reorder');
        Route::post('subject-topics/reorder', [SubjectTopicController::class, 'reorder'])->name('subject-topics.reorder');

        
        Route::prefix('parent-student')->name('parent-student.')->group(function () {
            Route::get('/', [ParentStudentLinkController::class, 'index'])->name('index');
            Route::get('/create', [ParentStudentLinkController::class, 'create'])->name('create');
            Route::post('/', [ParentStudentLinkController::class, 'store'])->name('store');
            Route::get('/{parentId}/{studentId}', [ParentStudentLinkController::class, 'show'])->name('show');
            Route::post('/{parentId}/{studentId}/update-status', [ParentStudentLinkController::class, 'updateStatus'])->name('update-status');
            Route::delete('/{parentId}/{studentId}', [ParentStudentLinkController::class, 'destroy'])->name('destroy');

            
            Route::get('/search/parents', [ParentStudentLinkController::class, 'searchParents'])->name('search.parents');
            Route::get('/search/students', [ParentStudentLinkController::class, 'searchStudents'])->name('search.students');
        });

        
        Route::prefix('teacher-payment-verification')->name('teacher-payment-verification.')->group(function () {
            Route::get('/', [TeacherPaymentVerificationController::class, 'index'])->name('index');
            Route::get('/{paymentDetail}', [TeacherPaymentVerificationController::class, 'show'])->name('show');
            Route::put('/{paymentDetail}/status', [TeacherPaymentVerificationController::class, 'updateStatus'])->name('status.update');
        });

        
        Route::prefix('payouts')->name('payouts.')->group(function () {
            Route::get('/', [App\Http\Controllers\Admin\PayoutController::class, 'index'])->name('index');
            Route::get('/create', [App\Http\Controllers\Admin\PayoutController::class, 'create'])->name('create');
            Route::post('/generate', [App\Http\Controllers\Admin\PayoutController::class, 'generate'])->name('generate');
            Route::get('/{payout}', [App\Http\Controllers\Admin\PayoutController::class, 'show'])->name('show');
            Route::get('/{payout}/edit', [App\Http\Controllers\Admin\PayoutController::class, 'edit'])->name('edit');
            Route::put('/{payout}', [App\Http\Controllers\Admin\PayoutController::class, 'update'])->name('update');
        });

        
        Route::prefix('courses')->name('courses.')->group(function () {
            Route::get('/{course}/builder', [\App\Http\Controllers\Teacher\CourseController::class, 'builder'])->name('builder');
            Route::get('/{course}/edit-advanced', [\App\Http\Controllers\Teacher\CourseController::class, 'edit'])->name('edit-advanced');
        });

        
        Route::prefix('course-creation')->name('course-creation.')->group(function () {
            Route::get('/create', [\App\Http\Controllers\Teacher\CourseController::class, 'create'])->name('create');
            Route::post('/store', [\App\Http\Controllers\Teacher\CourseController::class, 'store'])->name('store');
            Route::get('/my-courses', [\App\Http\Controllers\Teacher\CourseController::class, 'index'])->name('my-courses');
        });
    });


Route::middleware(['auth', 'verified', 'role:admin,teacher'])
    ->prefix('admin/teacher-access')
    ->name('admin.teacher.')
    ->group(function () {
        Route::get('/courses', [TeacherCourseController::class, 'index'])->name('courses.index');
        Route::get('/courses/create', [TeacherCourseController::class, 'create'])->name('courses.create');
        Route::post('/courses', [TeacherCourseController::class, 'store'])->name('courses.store');
        Route::get('/courses/{course}', [TeacherCourseController::class, 'show'])->name('courses.show');
        Route::get('/courses/{course}/edit', [TeacherCourseController::class, 'edit'])->name('courses.edit');
        Route::put('/courses/{course}', [TeacherCourseController::class, 'update'])->name('courses.update');
        Route::delete('/courses/{course}', [TeacherCourseController::class, 'destroy'])->name('courses.destroy');
        Route::get('/courses/{course}/builder', [TeacherCourseController::class, 'builder'])->name('courses.builder');
        Route::get('/courses/{course}/pricing', [TeacherCourseController::class, 'showPricingTab'])->name('courses.pricing');
        Route::put('/courses/{course}/pricing', [TeacherCourseController::class, 'updatePricing'])->name('courses.pricing.update');
        Route::get('/courses/{course}/settings', [TeacherCourseController::class, 'showSettingsTab'])->name('courses.settings');
        Route::put('/courses/{course}/settings', [TeacherCourseController::class, 'updateSettings'])->name('courses.settings.update');
        Route::post('/courses/{course}/publish', [TeacherCourseController::class, 'publishCourse'])->name('courses.publish');
        Route::post('/courses/{course}/resubmit', [TeacherCourseController::class, 'resubmitCourse'])->name('courses.resubmit');
        Route::get('/courses/{course}/validate-submission', [TeacherCourseController::class, 'validateSubmissionRequirementsAjax'])->name('courses.validate-submission');
    });
