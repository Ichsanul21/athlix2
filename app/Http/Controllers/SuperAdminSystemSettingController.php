<?php

namespace App\Http\Controllers;

use App\Services\System\SystemSettingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SuperAdminSystemSettingController extends Controller
{
    public function __construct(
        private readonly SystemSettingService $settings
    ) {
    }

    public function index(): Response
    {
        return Inertia::render('SuperAdmin/SystemSettings', [
            'settings' => Inertia::defer(fn () => $this->settings->forDashboard()),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'billing_invoice_day' => 'required|integer|min:1|max:28',
            'billing_invoice_time' => 'required|date_format:H:i',
            'billing_schedule_timezone' => 'required|timezone',
            'saas_enforcement_time' => 'required|date_format:H:i',
            'saas_schedule_timezone' => 'required|timezone',
            'allow_public_registration' => 'required|boolean',
            'whatsapp_enabled' => 'required|boolean',
            'whatsapp_provider' => ['required', Rule::in(['fonnte', 'generic'])],
            'whatsapp_base_url' => 'required|url|max:255',
            'whatsapp_auth_header' => 'required|string|max:100',
            'whatsapp_timeout' => 'required|integer|min:3|max:60',
            'whatsapp_country_code' => 'required|string|max:5',
            'whatsapp_token' => 'nullable|string|max:255',
        ]);

        $this->settings->updateMany([
            SystemSettingService::KEY_BILLING_INVOICE_DAY => (int) $validated['billing_invoice_day'],
            SystemSettingService::KEY_BILLING_INVOICE_TIME => $validated['billing_invoice_time'],
            SystemSettingService::KEY_BILLING_SCHEDULE_TIMEZONE => $validated['billing_schedule_timezone'],
            SystemSettingService::KEY_SAAS_ENFORCEMENT_TIME => $validated['saas_enforcement_time'],
            SystemSettingService::KEY_SAAS_SCHEDULE_TIMEZONE => $validated['saas_schedule_timezone'],
            SystemSettingService::KEY_ALLOW_PUBLIC_REGISTRATION => (bool) $validated['allow_public_registration'],
            SystemSettingService::KEY_WHATSAPP_ENABLED => (bool) $validated['whatsapp_enabled'],
            SystemSettingService::KEY_WHATSAPP_PROVIDER => $validated['whatsapp_provider'],
            SystemSettingService::KEY_WHATSAPP_BASE_URL => $validated['whatsapp_base_url'],
            SystemSettingService::KEY_WHATSAPP_AUTH_HEADER => $validated['whatsapp_auth_header'],
            SystemSettingService::KEY_WHATSAPP_TIMEOUT => (int) $validated['whatsapp_timeout'],
            SystemSettingService::KEY_WHATSAPP_COUNTRY_CODE => $validated['whatsapp_country_code'],
            SystemSettingService::KEY_WHATSAPP_TOKEN => $validated['whatsapp_token'] ?? '',
        ], $request->user());

        return back()->with('success', 'System settings berhasil diperbarui.');
    }
}
