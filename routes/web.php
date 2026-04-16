<?php

use App\Http\Controllers\AiAssistantController;
use App\Http\Controllers\Api\V1\Billing\DynamicBillingController;
use App\Http\Controllers\AthleteController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DojoAdminController;
use App\Http\Controllers\DojoController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\LandingCmsController;
use App\Http\Controllers\LandingController;
use App\Http\Controllers\PhysicalConditionController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PwaController;
use App\Http\Controllers\SenpaiNotificationController;
use App\Http\Controllers\StatisticsController;
use App\Http\Controllers\SuperAdminController;
use App\Http\Controllers\SuperAdminSystemSettingController;
use App\Http\Controllers\PasswordChangeController;
use App\Http\Controllers\RegionController;
use App\Http\Controllers\TrainingProgramController;
use App\Http\Controllers\TestCategoryController;
use Illuminate\Support\Facades\Route;

Route::get('/', [LandingController::class, 'index'])->name('landing.index');
Route::get('/sitemap.xml', [LandingController::class, 'sitemap'])->name('seo.sitemap');
Route::get('/robots.txt', [LandingController::class, 'robots'])->name('seo.robots');
Route::get('/artikel/{slug}', [LandingController::class, 'showArticle'])->name('landing.articles.show');
Route::get('/galeri/{slug}', [LandingController::class, 'showGallery'])->name('landing.galleries.show');
Route::post('/landing/register-dojo', [LandingController::class, 'registerDojo'])->name('landing.register-dojo');
Route::get('/landing/check-email', [LandingController::class, 'checkEmailAvailability'])->name('landing.check-email');

Route::prefix('/api/regions')->group(function () {
    Route::get('/provinces', [RegionController::class, 'provinces'])->name('api.regions.provinces');
    Route::get('/regencies/{provinceCode}', [RegionController::class, 'regencies'])->where('provinceCode', '[0-9]+')->name('api.regions.regencies');
    Route::get('/districts/{regencyCode}', [RegionController::class, 'districts'])->where('regencyCode', '[0-9.]+')->name('api.regions.districts');
    Route::get('/villages/{districtCode}', [RegionController::class, 'villages'])->where('districtCode', '[0-9.]+')->name('api.regions.villages');
});

Route::middleware(['auth', 'verified', 'tenant.access', 'force.password'])->group(function () {
    Route::get('/change-password', [PasswordChangeController::class, 'show'])->name('password.change');
    Route::post('/change-password', [PasswordChangeController::class, 'update'])->name('password.change.update');

    Route::middleware('role:super_admin,sensei,head_coach,assistant,medical_staff,dojo_admin')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

        Route::get('/attendance-logs', [AttendanceController::class, 'index'])->name('attendance.index');
        Route::get('/attendance/scan', [AttendanceController::class, 'scan'])->name('attendance.scan');
        Route::get('/attendance/dojo-qr', [AttendanceController::class, 'dojoQr'])->name('attendance.dojo-qr');
        Route::post('/attendance', [AttendanceController::class, 'store'])->name('attendance.store');
        Route::patch('/attendance/{attendance}/sensei-feedback', [AttendanceController::class, 'senseiFeedback'])->name('attendance.sensei-feedback');

        Route::get('/athletes', [AthleteController::class, 'index'])->name('athletes.index');
        Route::get('/athletes/check-guardian-phone', [AthleteController::class, 'checkGuardianPhone'])->name('athletes.check-guardian-phone');
        Route::get('/athletes-api/check-phone', [AthleteController::class, 'checkPhoneAvailability'])->name('api.athletes.check-phone');
        Route::post('/athletes', [AthleteController::class, 'store'])->name('athletes.store');
        Route::get('/athletes/{athlete}', [AthleteController::class, 'show'])->name('athletes.show');
        Route::post('/athletes/{athlete}', [AthleteController::class, 'update'])->name('athletes.update');
        Route::delete('/athletes/{athlete}', [AthleteController::class, 'destroy'])->name('athletes.destroy');
        Route::post('/athletes/{athlete}/achievements', [AthleteController::class, 'storeAchievement'])->name('athletes.achievements.store');
        Route::delete('/athletes/{athlete}/achievements/{achievement}', [AthleteController::class, 'destroyAchievement'])->name('athletes.achievements.destroy');
        Route::post('/athletes/{athlete}/reports', [AthleteController::class, 'storeReport'])->name('athletes.reports.store');
        Route::match(['put', 'patch', 'post'], '/athletes/{athlete}/reports/{report}', [AthleteController::class, 'updateReport'])->name('athletes.reports.update');
        Route::delete('/athletes/{athlete}/reports/{report}', [AthleteController::class, 'destroyReport'])->name('athletes.reports.destroy');
        Route::post('/athletes/{athlete}/ppa-upload', [AthleteController::class, 'uploadPpa'])->name('athletes.ppa-upload');

        Route::get('/finance', [FinanceController::class, 'index'])->name('finance.index');
        Route::post('/finance/generate', [FinanceController::class, 'generateMonthly'])->name('finance.generate');
        Route::patch('/finance/{finance}', [FinanceController::class, 'update'])->name('finance.update');
        Route::post('/finance/{finance}/customize', [FinanceController::class, 'customize'])->name('finance.customize');
        Route::prefix('/finance-api/billing/dynamic')->group(function () {
            Route::get('/defaults', [DynamicBillingController::class, 'defaults'])->name('finance-api.billing.defaults.index');
            Route::post('/defaults', [DynamicBillingController::class, 'storeDefault'])->name('finance-api.billing.defaults.store');
            Route::get('/overrides', [DynamicBillingController::class, 'overrides'])->name('finance-api.billing.overrides.index');
            Route::post('/overrides', [DynamicBillingController::class, 'storeOverride'])->name('finance-api.billing.overrides.store');
            Route::get('/override-requests', [DynamicBillingController::class, 'overrideRequests'])->name('finance-api.billing.override-requests.index');
            Route::post('/override-requests', [DynamicBillingController::class, 'storeOverrideRequest'])->name('finance-api.billing.override-requests.store');
            Route::patch('/override-requests/{overrideRequest}/review', [DynamicBillingController::class, 'reviewOverrideRequest'])->name('finance-api.billing.override-requests.review');
            Route::post('/generate', [DynamicBillingController::class, 'generate'])->name('finance-api.billing.generate');
            Route::get('/invoices', [DynamicBillingController::class, 'invoices'])->name('finance-api.billing.invoices.index');
        });

        Route::get('/physical-condition', [PhysicalConditionController::class, 'index'])->name('physical-condition.index');
        Route::get('/reports', [AthleteController::class, 'reportsIndex'])->name('reports.index');

        Route::get('/training-programs', [TrainingProgramController::class, 'index'])->name('training-programs.index');
        Route::post('/training-programs', [TrainingProgramController::class, 'store'])->name('training-programs.store');
        Route::patch('/training-programs/{trainingProgram}', [TrainingProgramController::class, 'update'])->name('training-programs.update');
        Route::delete('/training-programs/{trainingProgram}', [TrainingProgramController::class, 'destroy'])->name('training-programs.destroy');
        Route::post('/training-programs/ppa-upload', [TrainingProgramController::class, 'uploadPPA'])->name('training-programs.ppa-upload');

        Route::get('/statistics', [StatisticsController::class, 'index'])->name('statistics.index');

        Route::get('/ai-assistant', [AiAssistantController::class, 'index'])->name('ai-assistant.index');
        Route::post('/ai-assistant/chat', [AiAssistantController::class, 'chat'])->name('ai-assistant.chat');

        Route::get('/senpai-notifications', [SenpaiNotificationController::class, 'index'])->name('senpai-notifications.index');
        Route::post('/senpai-notifications', [SenpaiNotificationController::class, 'store'])->name('senpai-notifications.store');
        Route::patch('/senpai-notifications/{notification}', [SenpaiNotificationController::class, 'update'])->name('senpai-notifications.update');
        Route::delete('/senpai-notifications/{notification}', [SenpaiNotificationController::class, 'destroy'])->name('senpai-notifications.destroy');
    });

    Route::middleware('role:super_admin,landing_admin')->group(function () {
        Route::get('/cms', [LandingCmsController::class, 'index'])->name('cms.index');
        Route::get('/cms/articles', [LandingCmsController::class, 'articles'])->name('cms.articles.index');
        Route::get('/cms/galleries', [LandingCmsController::class, 'galleries'])->name('cms.galleries.index');
        Route::get('/cms/pricelists', [LandingCmsController::class, 'pricelists'])->name('cms.pricelists.index');
        Route::post('/cms/articles', [LandingCmsController::class, 'storeArticle'])->name('cms.articles.store');
        Route::post('/cms/articles/editor-image', [LandingCmsController::class, 'uploadArticleEditorImage'])->name('cms.articles.editor-image');
        Route::post('/cms/articles/{article}/preview-token', [LandingCmsController::class, 'refreshArticlePreviewToken'])->name('cms.articles.preview-token');
        Route::patch('/cms/articles/{article}', [LandingCmsController::class, 'updateArticle'])->name('cms.articles.update');
        Route::delete('/cms/articles/{article}', [LandingCmsController::class, 'destroyArticle'])->name('cms.articles.destroy');
        Route::post('/cms/galleries', [LandingCmsController::class, 'storeGallery'])->name('cms.galleries.store');
        Route::post('/cms/galleries/{gallery}/preview-token', [LandingCmsController::class, 'refreshGalleryPreviewToken'])->name('cms.galleries.preview-token');
        Route::patch('/cms/galleries/{gallery}', [LandingCmsController::class, 'updateGallery'])->name('cms.galleries.update');
        Route::delete('/cms/galleries/{gallery}', [LandingCmsController::class, 'destroyGallery'])->name('cms.galleries.destroy');
        Route::post('/cms/pricelists', [LandingCmsController::class, 'storePriceList'])->name('cms.pricelists.store');
        Route::patch('/cms/pricelists/{priceList}', [LandingCmsController::class, 'updatePriceList'])->name('cms.pricelists.update');
        Route::delete('/cms/pricelists/{priceList}', [LandingCmsController::class, 'destroyPriceList'])->name('cms.pricelists.destroy');

        Route::get('/cms/dojo-registrations', [LandingCmsController::class, 'dojoRegistrations'])->name('cms.dojo-registrations.index');
        Route::post('/cms/dojo-registrations/{dojoRegistration}/approve', [LandingCmsController::class, 'approveRegistration'])->name('cms.dojo-registrations.approve');
        Route::post('/cms/dojo-registrations/{dojoRegistration}/reject', [LandingCmsController::class, 'rejectRegistration'])->name('cms.dojo-registrations.reject');
        Route::delete('/cms/dojo-registrations/{dojoRegistration}', [LandingCmsController::class, 'destroyRegistration'])->name('cms.dojo-registrations.destroy');
    });

    Route::middleware('role:super_admin')->group(function () {
        Route::get('/super-admin/users', [SuperAdminController::class, 'users'])->name('super-admin.users.index');
        Route::post('/super-admin/users', [SuperAdminController::class, 'storeUser'])->name('super-admin.users.store');
        Route::patch('/super-admin/users/{user}', [SuperAdminController::class, 'updateUser'])->name('super-admin.users.update');
        Route::post('/super-admin/users/{user}/reset-password', [SuperAdminController::class, 'resetUserPassword'])->name('super-admin.users.reset-password');
        Route::delete('/super-admin/users/{user}', [SuperAdminController::class, 'destroyUser'])->name('super-admin.users.destroy');

        Route::get('/super-admin/dojos', [DojoController::class, 'index'])->name('super-admin.dojos.index');
        Route::post('/super-admin/dojos', [DojoController::class, 'store'])->name('super-admin.dojos.store');
        Route::patch('/super-admin/dojos/{dojo}', [DojoController::class, 'update'])->name('super-admin.dojos.update');
        Route::delete('/super-admin/dojos/{dojo}', [DojoController::class, 'destroy'])->name('super-admin.dojos.destroy');

        Route::get('/super-admin/system-settings', [SuperAdminSystemSettingController::class, 'index'])->name('super-admin.system-settings.index');
        Route::patch('/super-admin/system-settings', [SuperAdminSystemSettingController::class, 'update'])->name('super-admin.system-settings.update');

        Route::get('/super-admin/subscription-requests', [DojoController::class, 'subscriptionRequests'])->name('super-admin.subscription-requests.index');
        Route::post('/super-admin/subscription-requests/{subscriptionRequest}/approve', [DojoController::class, 'approveSubscriptionRequest'])->name('super-admin.subscription-requests.approve');
        Route::post('/super-admin/subscription-requests/{subscriptionRequest}/reject', [DojoController::class, 'rejectSubscriptionRequest'])->name('super-admin.subscription-requests.reject');
    });

    Route::middleware('role:dojo_admin,super_admin,head_coach')->group(function () {
        Route::get('/dojo-admin/settings', [DojoAdminController::class, 'settings'])->name('dojo-admin.settings.index');
        Route::post('/dojo-admin/settings', [DojoAdminController::class, 'updateSettings'])->name('dojo-admin.settings.update');
        Route::get('/dojo-admin/sensei', [DojoAdminController::class, 'senseiIndex'])->name('dojo-admin.sensei.index');
        Route::post('/dojo-admin/sensei', [DojoAdminController::class, 'storeSensei'])->name('dojo-admin.sensei.store');
        Route::patch('/dojo-admin/sensei/{sensei}', [DojoAdminController::class, 'updateSensei'])->name('dojo-admin.sensei.update');
        Route::delete('/dojo-admin/sensei/{sensei}', [DojoAdminController::class, 'destroySensei'])->name('dojo-admin.sensei.destroy');
        Route::patch('/dojo-admin/sensei/{sensei}/assignments', [DojoAdminController::class, 'updateAssignments'])->name('dojo-admin.sensei.assignments');
        Route::post('/dojo-admin/request-plan-change', [DojoAdminController::class, 'requestPlanChange'])->name('dojo-admin.request-plan-change');

        // ── Test Category Management ──
        Route::get('/report-categories', [TestCategoryController::class, 'index'])->name('report-categories.index');
        Route::post('/report-categories', [TestCategoryController::class, 'storeCategory'])->name('report-categories.store');
        Route::patch('/report-categories/{reportCategory}', [TestCategoryController::class, 'updateCategory'])->name('report-categories.update');
        Route::delete('/report-categories/{reportCategory}', [TestCategoryController::class, 'destroyCategory'])->name('report-categories.destroy');
        Route::post('/report-sub-categories', [TestCategoryController::class, 'storeSubCategory'])->name('report-sub-categories.store');
        Route::patch('/report-sub-categories/{reportSubCategory}', [TestCategoryController::class, 'updateSubCategory'])->name('report-sub-categories.update');
        Route::delete('/report-sub-categories/{reportSubCategory}', [TestCategoryController::class, 'destroySubCategory'])->name('report-sub-categories.destroy');
        Route::post('/report-tests', [TestCategoryController::class, 'storeTest'])->name('report-tests.store');
        Route::patch('/report-tests/{reportTest}', [TestCategoryController::class, 'updateTest'])->name('report-tests.update');
        Route::delete('/report-tests/{reportTest}', [TestCategoryController::class, 'destroyTest'])->name('report-tests.destroy');

        Route::post('/report-labels', [TestCategoryController::class, 'storeLabel'])->name('report-labels.store');
        Route::patch('/report-labels/{testLabel}', [TestCategoryController::class, 'updateLabel'])->name('report-labels.update');
        Route::delete('/report-labels/{testLabel}', [TestCategoryController::class, 'destroyLabel'])->name('report-labels.destroy');

        // ── Level & Specialization Management ──
        Route::get('/master-data', [\App\Http\Controllers\DojoMasterDataController::class, 'index'])->name('master-data.index');
        Route::post('/levels', [\App\Http\Controllers\DojoMasterDataController::class, 'storeLevel'])->name('levels.store');
        Route::patch('/levels/{level}', [\App\Http\Controllers\DojoMasterDataController::class, 'updateLevel'])->name('levels.update');
        Route::delete('/levels/{level}', [\App\Http\Controllers\DojoMasterDataController::class, 'destroyLevel'])->name('levels.destroy');
        Route::post('/specializations', [\App\Http\Controllers\DojoMasterDataController::class, 'storeSpecialization'])->name('specializations.store');
        Route::patch('/specializations/{specialization}', [\App\Http\Controllers\DojoMasterDataController::class, 'updateSpecialization'])->name('specializations.update');
        Route::delete('/specializations/{specialization}', [\App\Http\Controllers\DojoMasterDataController::class, 'destroySpecialization'])->name('specializations.destroy');
    });

    Route::middleware('role:super_admin,sensei,head_coach,assistant,atlet')->group(function () {
        Route::post('/attendance/scan-dojo', [AttendanceController::class, 'scanDojo'])->name('attendance.scan-dojo');
        Route::post('/attendance/mark-status', [AttendanceController::class, 'markStatus'])->name('attendance.mark-status');
        Route::post('/attendance/post-training-feedback', [AttendanceController::class, 'submitPostTrainingFeedback'])->name('attendance.post-training-feedback');
    });

    Route::middleware('role:sensei,head_coach,assistant')->group(function () {
        Route::redirect('/sensei-pwa', '/sensei-pwa/home')->name('sensei-pwa.entry');
        Route::get('/sensei-pwa/home', [PwaController::class, 'senseiHome'])->name('sensei-pwa.home');
        Route::get('/sensei-pwa/scan', [PwaController::class, 'senseiScan'])->name('sensei-pwa.scan');
        Route::get('/sensei-pwa/schedule', [PwaController::class, 'senseiSchedule'])->name('sensei-pwa.schedule');
        Route::get('/sensei-pwa/training-program', [PwaController::class, 'senseiTrainingProgram'])->name('sensei-pwa.training-program');
        Route::get('/sensei-pwa/condition', [PwaController::class, 'senseiCondition'])->name('sensei-pwa.condition');
        Route::get('/sensei-pwa/athletes', [PwaController::class, 'senseiAthletes'])->name('sensei-pwa.athletes');
        Route::get('/sensei-pwa/notifications', [PwaController::class, 'senseiNotifications'])->name('sensei-pwa.notifications');
    });

    Route::middleware('role:atlet,parent')->group(function () {
        Route::get('/pwa-home', [PwaController::class, 'home'])->name('pwa.home');
        Route::get('/schedule', [PwaController::class, 'schedule'])->name('schedule.index');
        Route::get('/billing', [PwaController::class, 'billing'])->name('billing.index');
        Route::get('/kondisi-fisik', [PwaController::class, 'condition'])->name('condition.index');
        Route::get('/profile-pwa', [PwaController::class, 'profile'])->name('profile.pwa');
        Route::get('/personal-info', [PwaController::class, 'personalInfo'])->name('profile.info');
        Route::get('/achievement-history', [PwaController::class, 'achievementHistory'])->name('profile.achievements');
        Route::get('/settings', [PwaController::class, 'settings'])->name('profile.settings');
    });

    Route::middleware('role:atlet,parent')->group(function () {
        Route::get('/scan', [PwaController::class, 'scan'])->name('scan.index');
    });

    Route::middleware('role:atlet,parent')->group(function () {
        Route::post('/pwa-notifications/{notification}/read', [SenpaiNotificationController::class, 'markRead'])->name('pwa-notifications.read');
        Route::get('/pwa-notifications/feed', [SenpaiNotificationController::class, 'feed'])->name('pwa-notifications.feed');
    });
});

Route::middleware(['auth', 'tenant.access'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__ . '/auth.php';
