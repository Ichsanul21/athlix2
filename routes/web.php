<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\Athlete;
use App\Models\Dojo;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');

    Route::get('/attendance-logs', [\App\Http\Controllers\AttendanceController::class, 'index'])->name('attendance.index');
    Route::get('/attendance/scan', [\App\Http\Controllers\AttendanceController::class, 'scan'])->name('attendance.scan');

    Route::get('/athletes', [\App\Http\Controllers\AthleteController::class, 'index'])->name('athletes.index');
    Route::get('/athletes/create', [\App\Http\Controllers\AthleteController::class, 'create'])->name('athletes.create');
    Route::post('/athletes', [\App\Http\Controllers\AthleteController::class, 'store'])->name('athletes.store');
    Route::get('/athletes/{athlete}', [\App\Http\Controllers\AthleteController::class, 'show'])->name('athletes.show');

    Route::get('/finance', [\App\Http\Controllers\FinanceController::class, 'index'])->name('finance.index');
    Route::post('/finance/generate', [\App\Http\Controllers\FinanceController::class, 'generateMonthly'])->name('finance.generate');
    Route::patch('/finance/{finance}', [\App\Http\Controllers\FinanceController::class, 'update'])->name('finance.update');
    Route::get('/exams', [\App\Http\Controllers\ExamController::class, 'index'])->name('exams.index');
    Route::post('/exams/mass-schedule', [\App\Http\Controllers\ExamController::class, 'massSchedule'])->name('exams.mass-schedule');
    Route::patch('/exams/bulk-grade', [\App\Http\Controllers\ExamController::class, 'bulkGrade'])->name('exams.bulk-grade');
    Route::patch('/exams/{exam}/grade', [\App\Http\Controllers\ExamController::class, 'grade'])->name('exams.grade');
    Route::get('/physical-condition', [\App\Http\Controllers\PhysicalConditionController::class, 'index'])->name('physical-condition.index');
    
    Route::get('/training-programs', [\App\Http\Controllers\TrainingProgramController::class, 'index'])->name('training-programs.index');
    Route::post('/training-programs', [\App\Http\Controllers\TrainingProgramController::class, 'store'])->name('training-programs.store');
    Route::patch('/training-programs/{trainingProgram}', [\App\Http\Controllers\TrainingProgramController::class, 'update'])->name('training-programs.update');
    Route::delete('/training-programs/{trainingProgram}', [\App\Http\Controllers\TrainingProgramController::class, 'destroy'])->name('training-programs.destroy');
    
    Route::get('/statistics', [\App\Http\Controllers\StatisticsController::class, 'index'])->name('statistics.index');

    Route::get('/ai-assistant', [\App\Http\Controllers\AiAssistantController::class, 'index'])->name('ai-assistant.index');
    Route::post('/ai-assistant/chat', [\App\Http\Controllers\AiAssistantController::class, 'chat'])->name('ai-assistant.chat');

    // PWA Mobile Routes
    Route::get('/pwa-home', [\App\Http\Controllers\PwaController::class, 'home'])->name('pwa.home');
    Route::get('/scan', [\App\Http\Controllers\PwaController::class, 'scan'])->name('scan.index');
    Route::get('/schedule', [\App\Http\Controllers\PwaController::class, 'schedule'])->name('schedule.index');
    Route::get('/billing', [\App\Http\Controllers\PwaController::class, 'billing'])->name('billing.index');
    Route::get('/profile-pwa', [\App\Http\Controllers\PwaController::class, 'profile'])->name('profile.pwa');
    Route::get('/personal-info', [\App\Http\Controllers\PwaController::class, 'personalInfo'])->name('profile.info');
    Route::get('/grading-history', [\App\Http\Controllers\PwaController::class, 'gradingHistory'])->name('profile.grading');
    Route::get('/settings', [\App\Http\Controllers\PwaController::class, 'settings'])->name('profile.settings');

    Route::post('/attendance', [\App\Http\Controllers\AttendanceController::class, 'store'])->name('attendance.store');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
