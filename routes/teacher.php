<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Teacher\DashboardController;
use App\Http\Controllers\Teacher\ForumController;
use App\Http\Controllers\Teacher\GradebookController;
use App\Http\Controllers\Teacher\CalendarController;
use App\Http\Controllers\Teacher\StudentProgressController;
use App\Http\Controllers\Teacher\AnalyticsController;
use App\Http\Controllers\Teacher\PaymentDetailsController;

use App\Http\Controllers\Teacher\CourseController;
use App\Http\Controllers\Teacher\LessonController;
use App\Http\Controllers\Teacher\LessonAttachmentController;
use App\Http\Controllers\Teacher\CourseFaqController;
use App\Http\Controllers\Teacher\CourseNoticeController;
use App\Http\Controllers\Teacher\QuizController;
use App\Http\Controllers\Teacher\QuestionController;
use App\Http\Controllers\Teacher\QuestionLibraryController;
use App\Http\Controllers\Teacher\AssignmentController;

/*
|--------------------------------------------------------------------------
| Teacher Routes
|--------------------------------------------------------------------------
|
| Here is where all teacher-specific routes are defined. These routes are
| loaded by the RouteServiceProvider and all of them will be assigned to
| the "web" middleware group with "auth", "verified", and "role:teacher"
| middleware applied.
|
*/

Route::middleware(['auth', 'verified', 'role:teacher,admin'])
    ->prefix('teacher')
    ->name('teacher.')
    ->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'overview'])->name('overview');

        Route::get('/study-materials', [CourseController::class, 'index'])->name('courses.index');

        Route::resource('study-materials', CourseController::class)->except(['index'])->names([
            'create' => 'courses.create',
            'store' => 'courses.store',
            'show' => 'courses.show',
            'edit' => 'courses.edit',
            'update' => 'courses.update',
            'destroy' => 'courses.destroy',
        ]);

        Route::prefix('study-materials/{course}')->name('courses.')->group(function () {
            Route::get('builder', [CourseController::class, 'builder'])->name('builder');

            Route::get('preview', [CourseController::class, 'preview'])->name('preview');

            Route::get('curriculum', [CourseController::class, 'showCurriculumTab'])->name('curriculum');

            Route::get('settings', [CourseController::class, 'showSettingsTab'])->name('settings');
            Route::put('settings', [CourseController::class, 'updateSettings'])->name('settings.update');

            Route::get('pricing', [CourseController::class, 'showPricingTab'])->name('pricing');
            Route::put('pricing', [CourseController::class, 'updatePricing'])->name('pricing.update');

            Route::get('drip', [CourseController::class, 'showDripTab'])->name('drip');
            Route::put('drip', [CourseController::class, 'updateDrip'])->name('drip.update');

            Route::get('faq', [CourseController::class, 'showFaqTab'])->name('faq');
            Route::resource('faq', CourseFaqController::class)->except(['index', 'show'])->shallow();
            Route::post('faq/reorder', [CourseFaqController::class, 'reorder'])->name('faq.reorder');

            Route::get('notices', [CourseController::class, 'showNoticeTab'])->name('notices');
            Route::resource('notices', CourseNoticeController::class)->except(['index', 'show'])->shallow();

            Route::put('status', [CourseController::class, 'updateStatus'])->name('status.update');

            
            Route::get('validate-publishing', [CourseController::class, 'validatePublishingRequirementsAjax'])->name('validate-publishing');
            Route::get('validate-submission', [CourseController::class, 'validateSubmissionRequirementsAjax'])->name('validate-submission');
            Route::post('publish', [CourseController::class, 'publishCourse'])->name('courses.publish');

            Route::post('thumbnail', [CourseController::class, 'uploadThumbnail'])->name('thumbnail.upload');
        });

        Route::post('study-materials/{course}/sections', [CourseController::class, 'storeSection'])->name('courses.sections.store');
        Route::patch('study-materials/{course}/sections/{section}', [CourseController::class, 'updateSection'])->name('courses.sections.update');
        Route::delete('study-materials/{course}/sections/{section}', [CourseController::class, 'destroySection'])->name('courses.sections.destroy');
        Route::post('study-materials/{course}/sections/reorder', [CourseController::class, 'reorderSections'])->name('courses.sections.reorder');

        Route::post('study-materials/{course}/sections/{section}/content/reorder', [CourseController::class, 'reorderSectionContent'])->name('courses.sections.content.reorder');

        Route::get('study-materials/{course}/materials/search', [CourseController::class, 'searchCourseMaterials'])->name('courses.materials.search');
        Route::post('study-materials/{course}/sections/{section}/materials/import', [CourseController::class, 'importMaterialToSection'])->name('courses.sections.materials.import');
        Route::get('study-materials/{course}/materials', [CourseController::class, 'showMaterialsTab'])->name('courses.materials');

        Route::post('study-materials/{course}/sections/{section}/lessons', [LessonController::class, 'store'])
            ->name('teacher.courses.sections.lessons.store');
        Route::post('study-materials/{course}/lessons/save', [LessonController::class, 'saveLesson'])
            ->name('teacher.courses.lessons.save');
        Route::post('study-materials/{course}/lessons/test', [LessonController::class, 'testEndpoint'])
            ->name('teacher.courses.lessons.test');
        Route::get('study-materials/{course}/lessons/{lesson}/builder-data', [LessonController::class, 'getLessonBuilderData'])
            ->name('teacher.courses.lessons.builder-data');
        Route::get('study-materials/{course}/builder/lesson-types/{type}', [CourseController::class, 'getLessonTypeFields'])
            ->name('teacher.courses.builder.lesson-types');
        Route::get('study-materials/{course}/lessons/{lesson}/edit', [LessonController::class, 'editInBuilder'])
            ->name('teacher.courses.lessons.edit');
        Route::delete('study-materials/{course}/lessons/{lesson}', [LessonController::class, 'destroy'])
            ->name('teacher.courses.lessons.destroy');

        Route::resource('study-materials.lessons.attachments', LessonAttachmentController::class)
            ->except(['create', 'edit', 'show'])
            ->parameters([
                'lessons' => 'lesson',
                'attachments' => 'attachment'
            ])->shallow();

        Route::post('study-materials/{course}/lessons/{lesson}/attachments/reorder', [LessonAttachmentController::class, 'reorder'])
            ->name('courses.lessons.attachments.reorder');

        Route::resource('study-materials.sections.quizzes', QuizController::class)->except([
            'index', 'create', 'edit'
        ])->parameters([
            'sections' => 'section',
            'quizzes' => 'quiz'
        ]);

        Route::get('study-materials/{course}/quizzes/{quiz}/edit', [QuizController::class, 'edit'])
            ->name('courses.quizzes.edit');

        Route::post('study-materials/{course}/sections/{section}/quizzes/reorder', [QuizController::class, 'reorder'])
            ->name('courses.sections.quizzes.reorder');

        Route::resource('study-materials.sections.quizzes.questions', QuestionController::class)->except([
            'index'
        ])->parameters([
            'sections' => 'section',
            'quizzes' => 'quiz',
            'questions' => 'question'
        ]);

        Route::post('study-materials/{course}/sections/{section}/quizzes/{quiz}/questions/reorder', [QuestionController::class, 'reorder'])
            ->name('courses.sections.quizzes.questions.reorder');

        Route::post('study-materials/{course}/sections/{section}/quizzes/{quiz}/questions/import', [QuestionController::class, 'import'])
            ->name('courses.sections.quizzes.questions.import');

        Route::get('questions/library', [QuestionLibraryController::class, 'index'])->name('questions.library.index');
        Route::get('questions/library/search', [QuestionLibraryController::class, 'search'])->name('questions.library.search');
        Route::get('questions/library/topics/{subjectId}', [QuestionLibraryController::class, 'getSubjectTopics'])->name('questions.library.topics');

        Route::resource('study-materials.sections.assignments', AssignmentController::class)->except([
            'index', 'create', 'edit'
        ])->parameters([
            'sections' => 'section',
            'assignments' => 'assignment'
        ]);

        Route::post('study-materials/{course}/sections/{section}/assignments/reorder', [AssignmentController::class, 'reorder'])
            ->name('courses.sections.assignments.reorder');

        Route::get('study-materials/{course}/sections/{section}/assignments/{assignment}/submissions', [AssignmentController::class, 'submissions'])
            ->name('courses.assignments.submissions');

        Route::get('study-materials/{course}/sections/{section}/assignments/{assignment}/submissions/{submission}', [AssignmentController::class, 'viewSubmission'])
            ->name('courses.assignments.submissions.show');

        Route::put('study-materials/{course}/sections/{section}/assignments/{assignment}/submissions/{submission}/grade', [AssignmentController::class, 'gradeSubmission'])
            ->name('courses.assignments.submissions.grade');

        Route::get('/reviews', [DashboardController::class, 'reviews'])->name('reviews.index');

        Route::get('/messages', [DashboardController::class, 'messages'])->name('messages.index');
        Route::post('/messages', [DashboardController::class, 'storeMessage'])->name('messages.store');

        Route::get('/settings', [DashboardController::class, 'settings'])->name('settings');
        Route::get('/settings/profile', [DashboardController::class, 'settings'])->name('settings.profile');

        Route::put('/profile/update', [DashboardController::class, 'updateProfile'])->name('profile.update');
        Route::put('/password/update', [DashboardController::class, 'updatePassword'])->name('password.update');
        Route::put('/notification-settings/update', [DashboardController::class, 'updateNotificationSettings'])->name('notification-settings.update');

        Route::prefix('forums')->name('forums.')->group(function () {
            Route::get('', [ForumController::class, 'index'])->name('index');
            Route::get('course/{course}', [ForumController::class, 'showCourseForums'])->name('course.forums.show');
            Route::get('course/{course}/thread/create', [ForumController::class, 'createThreadForm'])->name('course.forums.thread.create');
            Route::post('course/{course}/thread', [ForumController::class, 'store'])->name('course.forums.thread.store');
            Route::get('thread/{thread}', [ForumController::class, 'showThread'])->name('thread.show');
            Route::get('thread/{thread}/edit', [ForumController::class, 'editThreadForm'])->name('thread.edit');
            Route::put('thread/{thread}', [ForumController::class, 'update'])->name('thread.update');
            Route::delete('thread/{thread}', [ForumController::class, 'destroy'])->name('thread.destroy');
        });

        Route::prefix('gradebook')->name('gradebook.')->group(function () {
            Route::get('', [GradebookController::class, 'index'])->name('index');
            Route::get('course/{course}', [GradebookController::class, 'showCourseGradebook'])->name('course');
            Route::post('course/{course}/student/{student}/update-grade', [GradebookController::class, 'updateGrade'])->name('grade.update');
        });



        Route::prefix('calendar')->name('calendar.')->group(function () {
            Route::get('', [CalendarController::class, 'index'])->name('index');
            Route::get('events', [CalendarController::class, 'listEvents'])->name('events.list');
            Route::post('events', [CalendarController::class, 'storeEvent'])->name('events.store');
            Route::put('events/{event}', [CalendarController::class, 'updateEvent'])->name('events.update');
            Route::delete('events/{event}', [CalendarController::class, 'destroyEvent'])->name('events.destroy');
        });

        Route::prefix('study-materials/{course}/students')->name('courses.students.')->group(function () {
            Route::get('/', [StudentProgressController::class, 'index'])->name('index');
            Route::get('/{student}/progress', [StudentProgressController::class, 'show'])->name('progress');
        });

        Route::get('/students/progress', [StudentProgressController::class, 'allStudents'])->name('students.progress');

        Route::prefix('analytics')->name('analytics.')->group(function () {
            Route::get('/', [AnalyticsController::class, 'index'])->name('index');
            Route::get('/courses/{course}', [AnalyticsController::class, 'showCourseAnalytics'])->name('course');
        });

        Route::prefix('payment-details')->name('payment-details.')->group(function () {
            Route::get('/', [PaymentDetailsController::class, 'index'])->name('index');
            Route::post('/', [PaymentDetailsController::class, 'store'])->name('store');
            Route::put('/{paymentDetail}', [PaymentDetailsController::class, 'update'])->name('update');
        });

        Route::prefix('payouts')->name('payouts.')->group(function () {
            Route::get('/', [App\Http\Controllers\Teacher\PayoutController::class, 'index'])->name('index');
            Route::get('/{payout}', [App\Http\Controllers\Teacher\PayoutController::class, 'show'])->name('show');
        });

        Route::post('upload-image', [App\Http\Controllers\Teacher\UploadController::class, 'uploadImage'])->name('upload.image');

        Route::post('media/upload', [App\Http\Controllers\Teacher\UploadController::class, 'upload'])->name('media.upload');

        Route::post('study-materials/{course}/publish', [CourseController::class, 'publishCourse'])->name('courses.publish');
        Route::post('study-materials/{course}/resubmit', [CourseController::class, 'resubmitCourse'])->name('courses.resubmit');
        Route::post('study-materials/validate-submission', [CourseController::class, 'validateSubmissionRequirementsAjax'])->name('courses.validate-submission');
        Route::post('study-materials/{course}/submit-for-approval', [CourseController::class, 'submitForApproval'])->name('courses.submit');
    });
