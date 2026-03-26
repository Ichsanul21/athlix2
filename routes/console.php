<?php

use App\Models\Dojo;
use App\Services\Billing\DynamicBillingService;
use App\Services\Saas\SaasSubscriptionService;
use App\Services\System\SystemSettingService;
use Carbon\Carbon;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('billing:generate-invoices {tenant_id?} {--period=} {--due-date=} {--initiated-by=}', function (
    DynamicBillingService $service
) {
    $tenantId = $this->argument('tenant_id');
    $periodOption = $this->option('period');
    $dueDateOption = $this->option('due-date');
    $initiatedBy = $this->option('initiated-by');

    $periodStart = is_string($periodOption) && $periodOption !== ''
        ? Carbon::createFromFormat('Y-m', $periodOption)->startOfMonth()
        : now()->startOfMonth();
    $dueDate = is_string($dueDateOption) && $dueDateOption !== ''
        ? Carbon::parse($dueDateOption)
        : null;

    $tenantIds = $tenantId
        ? [(int) $tenantId]
        : Dojo::query()->where('is_active', true)->pluck('id')->all();

    if (empty($tenantIds)) {
        $this->warn('No active tenant found.');

        return;
    }

    foreach ($tenantIds as $currentTenantId) {
        $run = $service->generateMonthlyInvoices(
            (int) $currentTenantId,
            $periodStart,
            $dueDate,
            $initiatedBy ? (int) $initiatedBy : null,
            true
        );

        $this->info(sprintf(
            'Tenant #%d period %s run #%d status %s',
            $currentTenantId,
            $run->period_key,
            $run->id,
            $run->status
        ));
    }
})->purpose('Generate dynamic monthly invoices per tenant');

Artisan::command('saas:enforce-subscriptions {dojo_id?}', function (SaasSubscriptionService $service) {
    $dojoId = $this->argument('dojo_id');
    $summary = $service->enforceAndNotify($dojoId ? (int) $dojoId : null);

    $this->info(sprintf(
        'Processed:%d | H-7:%d | H-1:%d | ExpiredNotice:%d | AutoBlocked:%d | AutoUnblocked:%d | WA Sent:%d | WA Failed:%d',
        $summary['processed'],
        $summary['warned_h7'],
        $summary['warned_h1'],
        $summary['warned_expired'],
        $summary['auto_blocked'],
        $summary['auto_unblocked'],
        $summary['whatsapp_sent'],
        $summary['whatsapp_failed']
    ));
})->purpose('Enforce SaaS subscription access and send expiry reminders');

$settings = app(SystemSettingService::class);

$billingDay = max(1, min($settings->getInt(SystemSettingService::KEY_BILLING_INVOICE_DAY), 28));
$billingTime = $settings->getString(SystemSettingService::KEY_BILLING_INVOICE_TIME);
$billingTz = $settings->getString(SystemSettingService::KEY_BILLING_SCHEDULE_TIMEZONE);
$saasTime = $settings->getString(SystemSettingService::KEY_SAAS_ENFORCEMENT_TIME);
$saasTz = $settings->getString(SystemSettingService::KEY_SAAS_SCHEDULE_TIMEZONE);

Schedule::command('billing:generate-invoices')
    ->monthlyOn($billingDay, $billingTime)
    ->timezone($billingTz);

Schedule::command('saas:enforce-subscriptions')
    ->dailyAt($saasTime)
    ->timezone($saasTz);
