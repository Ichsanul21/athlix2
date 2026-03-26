<?php

namespace App\Services\Messaging;

use App\Services\System\SystemSettingService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppGatewayService
{
    public function __construct(
        private readonly SystemSettingService $settings
    ) {
    }

    public function isEnabled(): bool
    {
        return $this->settings->getBool(SystemSettingService::KEY_WHATSAPP_ENABLED)
            && filled($this->settings->getString(SystemSettingService::KEY_WHATSAPP_BASE_URL))
            && filled($this->settings->getString(SystemSettingService::KEY_WHATSAPP_TOKEN));
    }

    public function normalizePhone(?string $phone): ?string
    {
        if (! $phone) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $phone);
        if (! $digits) {
            return null;
        }

        if (str_starts_with($digits, '0')) {
            $digits = $this->settings->getString(SystemSettingService::KEY_WHATSAPP_COUNTRY_CODE) . substr($digits, 1);
        }

        if (str_starts_with($digits, '00')) {
            $digits = substr($digits, 2);
        }

        return $digits;
    }

    public function sendText(?string $phoneNumber, string $message): bool
    {
        if (! $this->isEnabled()) {
            return false;
        }

        $normalized = $this->normalizePhone($phoneNumber);
        if (! $normalized) {
            return false;
        }

        $provider = strtolower($this->settings->getString(SystemSettingService::KEY_WHATSAPP_PROVIDER) ?: 'fonnte');

        try {
            return match ($provider) {
                'fonnte' => $this->sendViaFonnte($normalized, $message),
                default => $this->sendViaGenericWebhook($normalized, $message),
            };
        } catch (\Throwable $exception) {
            Log::warning('WhatsApp send failed', [
                'provider' => $provider,
                'phone' => $normalized,
                'error' => $exception->getMessage(),
            ]);

            return false;
        }
    }

    private function sendViaFonnte(string $phone, string $message): bool
    {
        $response = Http::timeout($this->settings->getInt(SystemSettingService::KEY_WHATSAPP_TIMEOUT))
            ->withHeaders([
                $this->settings->getString(SystemSettingService::KEY_WHATSAPP_AUTH_HEADER) ?: 'Authorization'
                    => $this->settings->getString(SystemSettingService::KEY_WHATSAPP_TOKEN),
            ])
            ->asForm()
            ->post($this->settings->getString(SystemSettingService::KEY_WHATSAPP_BASE_URL), [
                'target' => $phone,
                'message' => $message,
                'countryCode' => $this->settings->getString(SystemSettingService::KEY_WHATSAPP_COUNTRY_CODE),
            ]);

        if (! $response->successful()) {
            Log::warning('WhatsApp provider non-success response', [
                'provider' => 'fonnte',
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
        }

        return $response->successful();
    }

    private function sendViaGenericWebhook(string $phone, string $message): bool
    {
        $request = Http::timeout($this->settings->getInt(SystemSettingService::KEY_WHATSAPP_TIMEOUT));

        $token = $this->settings->getString(SystemSettingService::KEY_WHATSAPP_TOKEN);
        if ($token !== '') {
            $request = $request->withHeaders([
                $this->settings->getString(SystemSettingService::KEY_WHATSAPP_AUTH_HEADER) ?: 'Authorization' => $token,
            ]);
        }

        $response = $request->post($this->settings->getString(SystemSettingService::KEY_WHATSAPP_BASE_URL), [
            'to' => $phone,
            'message' => $message,
        ]);

        if (! $response->successful()) {
            Log::warning('WhatsApp generic webhook non-success response', [
                'provider' => 'generic',
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
        }

        return $response->successful();
    }
}
