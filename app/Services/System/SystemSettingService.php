<?php

namespace App\Services\System;

use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

class SystemSettingService
{
    public const KEY_BILLING_INVOICE_DAY = 'BILLING_INVOICE_DAY';
    public const KEY_BILLING_INVOICE_TIME = 'BILLING_INVOICE_TIME';
    public const KEY_BILLING_SCHEDULE_TIMEZONE = 'BILLING_SCHEDULE_TIMEZONE';
    public const KEY_SAAS_ENFORCEMENT_TIME = 'SAAS_ENFORCEMENT_TIME';
    public const KEY_SAAS_SCHEDULE_TIMEZONE = 'SAAS_SCHEDULE_TIMEZONE';
    public const KEY_ALLOW_PUBLIC_REGISTRATION = 'ALLOW_PUBLIC_REGISTRATION';
    public const KEY_WHATSAPP_ENABLED = 'WHATSAPP_ENABLED';
    public const KEY_WHATSAPP_PROVIDER = 'WHATSAPP_PROVIDER';
    public const KEY_WHATSAPP_BASE_URL = 'WHATSAPP_BASE_URL';
    public const KEY_WHATSAPP_TOKEN = 'WHATSAPP_TOKEN';
    public const KEY_WHATSAPP_AUTH_HEADER = 'WHATSAPP_AUTH_HEADER';
    public const KEY_WHATSAPP_TIMEOUT = 'WHATSAPP_TIMEOUT';
    public const KEY_WHATSAPP_COUNTRY_CODE = 'WHATSAPP_COUNTRY_CODE';

    private const CACHE_KEY = 'system_settings.key_value_map';

    private const SECRET_KEYS = [
        self::KEY_WHATSAPP_TOKEN,
    ];

    /**
     * @return array<string, array{type:string,default:mixed}>
     */
    public function definitions(): array
    {
        return [
            self::KEY_BILLING_INVOICE_DAY => ['type' => 'int', 'default' => (int) config('system.billing.invoice_day', 1)],
            self::KEY_BILLING_INVOICE_TIME => ['type' => 'string', 'default' => (string) config('system.billing.invoice_time', '00:10')],
            self::KEY_BILLING_SCHEDULE_TIMEZONE => ['type' => 'string', 'default' => (string) config('system.billing.timezone', 'Asia/Makassar')],
            self::KEY_SAAS_ENFORCEMENT_TIME => ['type' => 'string', 'default' => (string) config('system.saas.enforcement_time', '00:30')],
            self::KEY_SAAS_SCHEDULE_TIMEZONE => ['type' => 'string', 'default' => (string) config('system.saas.timezone', 'Asia/Makassar')],
            self::KEY_ALLOW_PUBLIC_REGISTRATION => ['type' => 'bool', 'default' => (bool) config('auth.allow_public_registration', false)],
            self::KEY_WHATSAPP_ENABLED => ['type' => 'bool', 'default' => (bool) config('system.whatsapp.enabled', false)],
            self::KEY_WHATSAPP_PROVIDER => ['type' => 'string', 'default' => (string) config('system.whatsapp.provider', 'fonnte')],
            self::KEY_WHATSAPP_BASE_URL => ['type' => 'string', 'default' => (string) config('system.whatsapp.base_url', 'https://api.fonnte.com/send')],
            self::KEY_WHATSAPP_TOKEN => ['type' => 'string', 'default' => (string) config('system.whatsapp.token', '')],
            self::KEY_WHATSAPP_AUTH_HEADER => ['type' => 'string', 'default' => (string) config('system.whatsapp.auth_header', 'Authorization')],
            self::KEY_WHATSAPP_TIMEOUT => ['type' => 'int', 'default' => (int) config('system.whatsapp.timeout', 10)],
            self::KEY_WHATSAPP_COUNTRY_CODE => ['type' => 'string', 'default' => (string) config('system.whatsapp.country_code', '62')],
        ];
    }

    public function get(string $key): mixed
    {
        $definitions = $this->definitions();
        if (! isset($definitions[$key])) {
            return null;
        }

        $raw = $this->allRawValues()[$key] ?? null;
        $value = $raw === null ? $definitions[$key]['default'] : $raw;

        return $this->castValue($value, $definitions[$key]['type']);
    }

    public function getString(string $key): string
    {
        return (string) ($this->get($key) ?? '');
    }

    public function getInt(string $key): int
    {
        return (int) ($this->get($key) ?? 0);
    }

    public function getBool(string $key): bool
    {
        return (bool) ($this->get($key) ?? false);
    }

    /**
     * @return array<string, mixed>
     */
    public function forDashboard(): array
    {
        $data = [];
        foreach (array_keys($this->definitions()) as $key) {
            if (in_array($key, self::SECRET_KEYS, true)) {
                continue;
            }

            $data[$key] = $this->get($key);
        }

        $data['WHATSAPP_TOKEN'] = '';
        $data['WHATSAPP_TOKEN_SET'] = filled($this->allRawValues()[self::KEY_WHATSAPP_TOKEN] ?? null)
            || filled((string) config('system.whatsapp.token', ''));

        return $data;
    }

    /**
     * @param array<string, mixed> $values
     */
    public function updateMany(array $values, ?User $actor = null): void
    {
        $definitions = $this->definitions();

        foreach ($values as $key => $value) {
            if (! isset($definitions[$key])) {
                continue;
            }

            if (in_array($key, self::SECRET_KEYS, true) && $value === '') {
                continue;
            }

            $persisted = $this->normalizeForStorage($value, $definitions[$key]['type']);

            SystemSetting::query()->updateOrCreate(
                ['key' => $key],
                [
                    'value' => $persisted,
                    'updated_by' => $actor?->id,
                ]
            );
        }

        Cache::forget(self::CACHE_KEY);
    }

    /**
     * @return array<string, string|null>
     */
    private function allRawValues(): array
    {
        try {
            if (! Schema::hasTable('system_settings')) {
                return [];
            }
        } catch (\Throwable) {
            return [];
        }

        return Cache::remember(self::CACHE_KEY, 300, function () {
            return SystemSetting::query()
                ->pluck('value', 'key')
                ->all();
        });
    }

    private function castValue(mixed $value, string $type): mixed
    {
        return match ($type) {
            'int' => (int) $value,
            'bool' => filter_var($value, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? false,
            default => (string) $value,
        };
    }

    private function normalizeForStorage(mixed $value, string $type): ?string
    {
        if ($value === null) {
            return null;
        }

        return match ($type) {
            'int' => (string) ((int) $value),
            'bool' => ((bool) $value) ? '1' : '0',
            default => trim((string) $value),
        };
    }
}
