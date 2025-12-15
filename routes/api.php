<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PerformanceController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    
    Route::prefix('performance')->name('performance.')->group(function () {
        Route::get('/overall', [PerformanceController::class, 'getOverallPerformance'])->name('overall');
        Route::get('/subjects', [PerformanceController::class, 'getSubjectPerformance'])->name('subjects');
        Route::get('/rankings', [PerformanceController::class, 'getRankings'])->name('rankings');
        Route::get('/history', [PerformanceController::class, 'getPerformanceHistory'])->name('history');
    });

    
});
