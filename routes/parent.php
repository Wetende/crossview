<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Parent\StudentLinkController;
use App\Http\Controllers\Parent\DashboardController;
use App\Http\Controllers\Parent\ChildGradesController;
use App\Http\Controllers\Parent\ChildCalendarController;
use App\Http\Controllers\Parent\ConnectionRequestController;

/*
|--------------------------------------------------------------------------
| Parent Routes
|--------------------------------------------------------------------------
|
| Here is where you can register parent-specific routes for your application.
| These routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group.
|
*/

Route::middleware(['auth', 'verified', 'role:parent'])->prefix('parent')->name('parent.')->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('overview');
    Route::post('select-student', [DashboardController::class, 'selectStudent'])->name('select-student');
    Route::get('link-student', [StudentLinkController::class, 'createLink'])->name('link.create');
    Route::post('link-student', [StudentLinkController::class, 'storeLinkByInviteCode'])->name('link.store.invite_code');
    Route::delete('unlink-student/{student}', [StudentLinkController::class, 'destroyLink'])->name('link.destroy');
    Route::get('linked-students', [StudentLinkController::class, 'listLinkedStudents'])->name('linked_students.index');

    
    
    Route::get('child-progress', [DashboardController::class, 'childProgress'])->name('child-progress'); 
    Route::get('child/{child}/dashboard', [DashboardController::class, 'childDashboard'])->name('child.dashboard'); 
    Route::get('subscriptions', [DashboardController::class, 'subscriptions'])->name('subscriptions');
    Route::get('messages', [DashboardController::class, 'messages'])->name('messages');
    Route::get('settings', [DashboardController::class, 'settings'])->name('settings');

    
    

    Route::get('/child/{child}/grades', [ChildGradesController::class, 'show'])->name('child.grades');

    
    Route::get('/child/{child}/calendar', [ChildCalendarController::class, 'index'])->name('child.calendar.index');
    Route::get('/child/{child}/calendar/events', [ChildCalendarController::class, 'events'])->name('child.calendar.events');

    Route::post('/messages', [DashboardController::class, 'storeMessage'])->name('messages.store');

    
    Route::get('child/{child}/course/{course}/progress', [DashboardController::class, 'childCourseProgress'])->name('child.course.progress');
    Route::get('child/{child}/quiz-attempt/{quizAttempt}', [DashboardController::class, 'childQuizResults'])->name('child.quiz-results');

    
    Route::prefix('connections')->name('connections.')->group(function () {
        Route::get('/', [ConnectionRequestController::class, 'index'])->name('index');
        Route::get('/create', [ConnectionRequestController::class, 'create'])->name('create');
        Route::post('/', [ConnectionRequestController::class, 'store'])->name('store');
        Route::delete('/{studentId}', [ConnectionRequestController::class, 'destroy'])->name('destroy');
    });
});
