<?php

use App\Http\Controllers\Api\V1\Billing\DynamicBillingController;
use App\Http\Controllers\Api\V1\LocalizationController;
use App\Http\Controllers\Api\V1\NotificationDeviceController;
use App\Http\Controllers\Api\V1\Wellness\DashboardController;
use App\Http\Controllers\Api\V1\Wellness\ReadinessController;
use App\Http\Controllers\Api\V1\Wellness\RpeLogController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['status' => 'ok']));
Route::post('/v1/localization/translate', [LocalizationController::class, 'translate'])
    ->middleware('throttle:600,1')
    ->name('api.v1.localization.translate');

Route::prefix('v1')->middleware(['auth:sanctum', 'tenant.access'])->group(function () {
    Route::prefix('wellness')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'show'])->name('api.v1.wellness.dashboard');

        Route::get('/readiness', [ReadinessController::class, 'index'])->name('api.v1.wellness.readiness.index');
        Route::get('/readiness/latest', [ReadinessController::class, 'latest'])->name('api.v1.wellness.readiness.latest');
        Route::post('/readiness', [ReadinessController::class, 'store'])->name('api.v1.wellness.readiness.store');

        Route::get('/rpe-logs', [RpeLogController::class, 'index'])->name('api.v1.wellness.rpe.index');
        Route::post('/rpe-logs', [RpeLogController::class, 'store'])->name('api.v1.wellness.rpe.store');
        Route::get('/workload/latest', [RpeLogController::class, 'latestSnapshot'])->name('api.v1.wellness.workload.latest');
    });

    Route::prefix('notifications/devices')->group(function () {
        Route::get('/', [NotificationDeviceController::class, 'index'])->name('api.v1.notifications.devices.index');
        Route::post('/', [NotificationDeviceController::class, 'store'])->name('api.v1.notifications.devices.store');
        Route::delete('/{device}', [NotificationDeviceController::class, 'destroy'])->name('api.v1.notifications.devices.destroy');
    });

    Route::prefix('billing/dynamic')->group(function () {
        Route::get('/defaults', [DynamicBillingController::class, 'defaults'])->name('api.v1.billing.defaults.index');
        Route::post('/defaults', [DynamicBillingController::class, 'storeDefault'])->name('api.v1.billing.defaults.store');
        Route::get('/overrides', [DynamicBillingController::class, 'overrides'])->name('api.v1.billing.overrides.index');
        Route::post('/overrides', [DynamicBillingController::class, 'storeOverride'])->name('api.v1.billing.overrides.store');
        Route::get('/override-requests', [DynamicBillingController::class, 'overrideRequests'])->name('api.v1.billing.override-requests.index');
        Route::post('/override-requests', [DynamicBillingController::class, 'storeOverrideRequest'])->name('api.v1.billing.override-requests.store');
        Route::patch('/override-requests/{overrideRequest}/review', [DynamicBillingController::class, 'reviewOverrideRequest'])->name('api.v1.billing.override-requests.review');
        Route::post('/generate', [DynamicBillingController::class, 'generate'])->name('api.v1.billing.generate');
        Route::get('/invoices', [DynamicBillingController::class, 'invoices'])->name('api.v1.billing.invoices.index');
    });
});
