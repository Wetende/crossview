<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Student\DashboardController;
use App\Http\Controllers\Student\ForumController;
use App\Http\Controllers\Student\GradeController;
use App\Http\Controllers\Student\ActivityController;
use App\Http\Controllers\Student\CalendarController;
use App\Http\Controllers\Student\LearnController;
use App\Http\Controllers\Student\QuizController;
use App\Http\Controllers\Student\PerformanceController;
use App\Http\Controllers\Parent\StudentLinkController;
use App\Http\Controllers\Student\ConnectionRequestController;
use App\Http\Controllers\Student\BadgeController;
use App\Http\Controllers\Student\LeaderboardController;
use App\Http\Controllers\Student\RecommendationController;

Route::middleware(['auth', 'verified', 'role:student'])
    ->prefix('student')
    ->name('student.')
    ->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'overview'])->name('overview');
        Route::get('/my-learning', [DashboardController::class, 'myLearning'])->name('my-learning');
        Route::get('/my-certificates', [DashboardController::class, 'myCertificates'])->name('my-certificates');
        Route::get('/bookmarked-courses', [DashboardController::class, 'bookmarkedCourses'])->name('bookmarked-courses');
        Route::get('/settings', [DashboardController::class, 'settings'])->name('settings');
        Route::get('/messages', [DashboardController::class, 'messages'])->name('messages');
        Route::post('/messages', [DashboardController::class, 'storeMessage'])->name('messages.store');

        Route::get('/badges', [BadgeController::class, 'index'])->name('badges.index');

        
        Route::prefix('performance')->name('performance.')->group(function () {
            Route::get('/', [PerformanceController::class, 'overview'])->name('overview');
            Route::get('/subject/{subject}', [PerformanceController::class, 'subject'])->name('subject');
            Route::get('/history', [PerformanceController::class, 'history'])->name('history');
            Route::get('/rankings', [PerformanceController::class, 'rankings'])->name('rankings');
        });

        
        Route::get('leaderboards', [LeaderboardController::class, 'index'])->name('leaderboards.index');
        Route::get('leaderboards/{leaderboard}', [LeaderboardController::class, 'show'])->name('leaderboards.show');
        Route::get('courses/{course}/leaderboard', [LeaderboardController::class, 'courseLeaderboard'])->name('courses.leaderboard');
        Route::get('points-history', [LeaderboardController::class, 'pointsHistory'])->name('points-history');
        Route::post('leaderboards/visibility', [LeaderboardController::class, 'updateVisibility'])->name('leaderboards.visibility');

        Route::get('/forums', [ForumController::class, 'index'])->name('forums.index');
        Route::get('/forums/{threadId}', [ForumController::class, 'showThread'])->name('forums.show');

        Route::get('/grades', [GradeController::class, 'index'])->name('grades.index');
        Route::get('/grades/{courseId}', [GradeController::class, 'course'])->name('grades.course');

        Route::get('/assessments', [ActivityController::class, 'index'])->name('assessments.index');
        Route::get('/assessments/{activityId}', [ActivityController::class, 'show'])->name('assessments.show');

        Route::get('/calendar', [CalendarController::class, 'index'])->name('calendar.index');
        Route::get('/calendar/events', [CalendarController::class, 'events'])->name('calendar.events'); 

        
        Route::middleware(['enrollment.check:course'])->group(function () {
            
            Route::get('/courses/{course:slug}/learn', [LearnController::class, 'showCourse'])
                ->name('learn.course');

            
            Route::get('/courses/{course:slug}/lessons/{lesson}', [LearnController::class, 'showLesson'])
                ->name('learn.lesson');

            
            Route::post('/courses/{course:slug}/lessons/{lesson}/progress', [LearnController::class, 'updateProgress'])
                ->name('lessons.progress.update');

            
            Route::post('/courses/{course:slug}/lessons/{lesson}/complete', [LearnController::class, 'markLessonComplete'])
                ->name('lessons.complete');

            
            Route::get('/courses/{course:slug}/quizzes/{quiz}/take', [QuizController::class, 'takeQuiz'])
                ->name('quizzes.take');

            
            Route::post('/courses/{course:slug}/quizzes/{quiz}/submit', [QuizController::class, 'submitQuiz'])
                ->name('quizzes.submit');

            
            Route::get('/courses/{course:slug}/quizzes/{quiz}/attempts/{attempt}', [QuizController::class, 'showResults'])
                ->name('quizzes.results');

            
            Route::get('/courses/{course:slug}/lessons/{lesson}/attachments/{attachment}/download', [LearnController::class, 'downloadAttachment'])
                ->name('lessons.attachment.download');
        });

        
        Route::get('parent-invites/generate', [StudentLinkController::class, 'generateInviteCode'])->name('parent_invite.generate');
        Route::get('parent-invites', [StudentLinkController::class, 'viewInviteCode'])->name('parent_invite.view');

        
        Route::prefix('connections')->name('connections.')->group(function () {
            Route::get('/requests', [ConnectionRequestController::class, 'index'])->name('requests');
            Route::post('/approve/{parentId}', [ConnectionRequestController::class, 'approve'])->name('approve');
            Route::post('/reject/{parentId}', [ConnectionRequestController::class, 'reject'])->name('reject');
            Route::delete('/{parentId}', [ConnectionRequestController::class, 'destroy'])->name('destroy');
        });

        
        Route::get('recommendations', [RecommendationController::class, 'index'])
            ->name('recommendations');
        Route::get('courses/{course}/similar', [RecommendationController::class, 'similarCourses'])
            ->name('courses.similar');
        
        Route::get('api/recommendations', [RecommendationController::class, 'getRecommendedCourses'])
            ->name('api.recommendations');
        Route::get('api/courses/{course}/similar', [RecommendationController::class, 'getSimilarCourses'])
            ->name('api.courses.similar');

        
        Route::get('/learning', [LearnController::class, 'index'])->name('student.learning');

        
        
    });
