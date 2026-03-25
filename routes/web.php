<?php

use App\Http\Controllers\AiAssistantController;
use App\Http\Controllers\AthleteController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\LandingCmsController;
use App\Http\Controllers\LandingController;
use App\Http\Controllers\PhysicalConditionController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PwaController;
use App\Http\Controllers\StatisticsController;
use App\Http\Controllers\SuperAdminController;
use App\Http\Controllers\TrainingProgramController;
use Illuminate\Support\Facades\Route;

Route::get('/', [LandingController::class, 'index'])->name('landing.index');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::middleware('role:super_admin,sensei')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

        Route::get('/attendance-logs', [AttendanceController::class, 'index'])->name('attendance.index');
        Route::get('/attendance/scan', [AttendanceController::class, 'scan'])->name('attendance.scan');
        Route::get('/attendance/dojo-qr', [AttendanceController::class, 'dojoQr'])->name('attendance.dojo-qr');
        Route::post('/attendance', [AttendanceController::class, 'store'])->name('attendance.store');
        Route::patch('/attendance/{attendance}/sensei-feedback', [AttendanceController::class, 'senseiFeedback'])->name('attendance.sensei-feedback');

        Route::get('/athletes', [AthleteController::class, 'index'])->name('athletes.index');
        Route::get('/athletes/create', [AthleteController::class, 'create'])->name('athletes.create');
        Route::post('/athletes', [AthleteController::class, 'store'])->name('athletes.store');
        Route::get('/athletes/{athlete}', [AthleteController::class, 'show'])->name('athletes.show');
        Route::post('/athletes/{athlete}/achievements', [AthleteController::class, 'storeAchievement'])->name('athletes.achievements.store');
        Route::delete('/athletes/{athlete}/achievements/{achievement}', [AthleteController::class, 'destroyAchievement'])->name('athletes.achievements.destroy');

        Route::get('/finance', [FinanceController::class, 'index'])->name('finance.index');
        Route::post('/finance/generate', [FinanceController::class, 'generateMonthly'])->name('finance.generate');
        Route::patch('/finance/{finance}', [FinanceController::class, 'update'])->name('finance.update');
        Route::post('/finance/{finance}/customize', [FinanceController::class, 'customize'])->name('finance.customize');

        Route::get('/physical-condition', [PhysicalConditionController::class, 'index'])->name('physical-condition.index');

        Route::get('/training-programs', [TrainingProgramController::class, 'index'])->name('training-programs.index');
        Route::post('/training-programs', [TrainingProgramController::class, 'store'])->name('training-programs.store');
        Route::patch('/training-programs/{trainingProgram}', [TrainingProgramController::class, 'update'])->name('training-programs.update');
        Route::delete('/training-programs/{trainingProgram}', [TrainingProgramController::class, 'destroy'])->name('training-programs.destroy');

        Route::get('/statistics', [StatisticsController::class, 'index'])->name('statistics.index');
        Route::get('/statistics/ppa-preview', [StatisticsController::class, 'ppaPreview'])->name('statistics.ppa-preview');

        Route::get('/ai-assistant', [AiAssistantController::class, 'index'])->name('ai-assistant.index');
        Route::post('/ai-assistant/chat', [AiAssistantController::class, 'chat'])->name('ai-assistant.chat');
    });

    Route::middleware('role:super_admin,landing_admin')->group(function () {
        Route::get('/cms', [LandingCmsController::class, 'index'])->name('cms.index');
        Route::get('/cms/articles', [LandingCmsController::class, 'articles'])->name('cms.articles.index');
        Route::get('/cms/galleries', [LandingCmsController::class, 'galleries'])->name('cms.galleries.index');
        Route::get('/cms/pricelists', [LandingCmsController::class, 'pricelists'])->name('cms.pricelists.index');
        Route::post('/cms/articles', [LandingCmsController::class, 'storeArticle'])->name('cms.articles.store');
        Route::patch('/cms/articles/{article}', [LandingCmsController::class, 'updateArticle'])->name('cms.articles.update');
        Route::delete('/cms/articles/{article}', [LandingCmsController::class, 'destroyArticle'])->name('cms.articles.destroy');
        Route::post('/cms/galleries', [LandingCmsController::class, 'storeGallery'])->name('cms.galleries.store');
        Route::patch('/cms/galleries/{gallery}', [LandingCmsController::class, 'updateGallery'])->name('cms.galleries.update');
        Route::delete('/cms/galleries/{gallery}', [LandingCmsController::class, 'destroyGallery'])->name('cms.galleries.destroy');
        Route::post('/cms/pricelists', [LandingCmsController::class, 'storePriceList'])->name('cms.pricelists.store');
        Route::patch('/cms/pricelists/{priceList}', [LandingCmsController::class, 'updatePriceList'])->name('cms.pricelists.update');
        Route::delete('/cms/pricelists/{priceList}', [LandingCmsController::class, 'destroyPriceList'])->name('cms.pricelists.destroy');
    });

    Route::middleware('role:super_admin')->group(function () {
        Route::get('/super-admin/users', [SuperAdminController::class, 'users'])->name('super-admin.users.index');
        Route::post('/super-admin/users', [SuperAdminController::class, 'storeUser'])->name('super-admin.users.store');
        Route::patch('/super-admin/users/{user}', [SuperAdminController::class, 'updateUser'])->name('super-admin.users.update');
        Route::delete('/super-admin/users/{user}', [SuperAdminController::class, 'destroyUser'])->name('super-admin.users.destroy');
    });

    Route::middleware('role:super_admin,sensei,murid')->group(function () {
        Route::post('/attendance/scan-dojo', [AttendanceController::class, 'scanDojo'])->name('attendance.scan-dojo');
    });

    Route::middleware('role:murid')->group(function () {
        Route::get('/pwa-home', [PwaController::class, 'home'])->name('pwa.home');
        Route::get('/scan', [PwaController::class, 'scan'])->name('scan.index');
        Route::get('/schedule', [PwaController::class, 'schedule'])->name('schedule.index');
        Route::get('/billing', [PwaController::class, 'billing'])->name('billing.index');
        Route::get('/profile-pwa', [PwaController::class, 'profile'])->name('profile.pwa');
        Route::get('/personal-info', [PwaController::class, 'personalInfo'])->name('profile.info');
        Route::get('/achievement-history', [PwaController::class, 'achievementHistory'])->name('profile.achievements');
        Route::get('/settings', [PwaController::class, 'settings'])->name('profile.settings');
    });
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
