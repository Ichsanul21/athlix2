<?php

return [
    'billing' => [
        'invoice_day' => (int) env('BILLING_INVOICE_DAY', 1),
        'invoice_time' => env('BILLING_INVOICE_TIME', '00:10'),
        'timezone' => env('BILLING_SCHEDULE_TIMEZONE', 'Asia/Makassar'),
    ],

    'saas' => [
        'enforcement_time' => env('SAAS_ENFORCEMENT_TIME', '00:30'),
        'timezone' => env('SAAS_SCHEDULE_TIMEZONE', 'Asia/Makassar'),
    ],

    'whatsapp' => [
        'enabled' => (bool) env('WHATSAPP_ENABLED', false),
        'provider' => env('WHATSAPP_PROVIDER', 'fonnte'),
        'base_url' => env('WHATSAPP_BASE_URL', 'https://api.fonnte.com/send'),
        'token' => env('WHATSAPP_TOKEN'),
        'auth_header' => env('WHATSAPP_AUTH_HEADER', 'Authorization'),
        'timeout' => (int) env('WHATSAPP_TIMEOUT', 10),
        'country_code' => env('WHATSAPP_COUNTRY_CODE', '62'),
    ],
];
