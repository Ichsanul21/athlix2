<?php

namespace App\Http\Controllers;

use App\Models\Dojo;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DojoController extends Controller
{
    /**
     * Mapping from Indonesian province code to timezone.
     */
    private const PROVINCE_TIMEZONES = [
        // WIB (UTC+7) — Western Indonesia Time
        '11' => 'Asia/Jakarta',      // Aceh
        '12' => 'Asia/Jakarta',      // Sumatera Utara
        '13' => 'Asia/Jakarta',      // Sumatera Barat
        '14' => 'Asia/Jakarta',      // Riau
        '15' => 'Asia/Jakarta',      // Jambi
        '16' => 'Asia/Jakarta',      // Sumatera Selatan
        '17' => 'Asia/Jakarta',      // Bengkulu
        '18' => 'Asia/Jakarta',      // Lampung
        '19' => 'Asia/Jakarta',      // Kepulauan Bangka Belitung
        '21' => 'Asia/Jakarta',      // Kepulauan Riau
        '31' => 'Asia/Jakarta',      // DKI Jakarta
        '32' => 'Asia/Jakarta',      // Jawa Barat
        '33' => 'Asia/Jakarta',      // Jawa Tengah
        '34' => 'Asia/Jakarta',      // DI Yogyakarta
        '35' => 'Asia/Jakarta',      // Jawa Timur
        '36' => 'Asia/Jakarta',      // Banten

        // WITA (UTC+8) — Central Indonesia Time
        '51' => 'Asia/Makassar',     // Bali
        '52' => 'Asia/Makassar',     // Nusa Tenggara Barat
        '53' => 'Asia/Makassar',     // Nusa Tenggara Timur
        '61' => 'Asia/Makassar',     // Kalimantan Barat
        '62' => 'Asia/Makassar',     // Kalimantan Tengah
        '63' => 'Asia/Makassar',     // Kalimantan Selatan
        '64' => 'Asia/Makassar',     // Kalimantan Timur
        '65' => 'Asia/Makassar',     // Kalimantan Utara
        '71' => 'Asia/Makassar',     // Sulawesi Utara
        '72' => 'Asia/Makassar',     // Sulawesi Tengah
        '73' => 'Asia/Makassar',     // Sulawesi Selatan
        '74' => 'Asia/Makassar',     // Sulawesi Tenggara
        '75' => 'Asia/Makassar',     // Gorontalo
        '76' => 'Asia/Makassar',     // Sulawesi Barat

        // WIT (UTC+9) — Eastern Indonesia Time
        '81' => 'Asia/Jayapura',     // Maluku
        '82' => 'Asia/Jayapura',     // Maluku Utara
        '91' => 'Asia/Jayapura',     // Papua
        '92' => 'Asia/Jayapura',     // Papua Barat
        '93' => 'Asia/Jayapura',     // Papua Selatan
        '94' => 'Asia/Jayapura',     // Papua Tengah
        '95' => 'Asia/Jayapura',     // Papua Pegunungan
        '96' => 'Asia/Jayapura',     // Papua Barat Daya
    ];

    /**
     * SaaS plan pricing (monthly fee in IDR).
     */
    private const PLAN_PRICING = [
        'Basic'   => 300000,
        'Pro'     => 600000,
        'Advance' => 1200000,
    ];

    public function index()
    {
        return Inertia::render('SuperAdmin/Dojos', [
            'dojos' => Inertia::defer(fn () => Dojo::query()
                ->withCount(['users', 'athletes'])
                ->orderBy('name')
                ->get()
                ->map(function (Dojo $dojo) {
                    return [
                        ...$dojo->toArray(),
                        'access_status' => $dojo->accessStatusLabel(),
                    ];
                })),
            'planPricing' => self::PLAN_PRICING,
            'provinceTimezones' => self::PROVINCE_TIMEZONES,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_name' => 'nullable|string|max:255',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:30',
            'country' => 'required|string|max:3',
            'province_code' => 'nullable|string|max:10',
            'province_name' => 'nullable|string|max:100',
            'regency_code' => 'nullable|string|max:10',
            'regency_name' => 'nullable|string|max:100',
            'district_code' => 'nullable|string|max:15',
            'district_name' => 'nullable|string|max:100',
            'village_code' => 'nullable|string|max:20',
            'village_name' => 'nullable|string|max:100',
            'address_detail' => 'nullable|string|max:500',
            'timezone' => 'required|string|max:64',
            'is_active' => 'required|boolean',
            'saas_plan_name' => 'nullable|string|max:100',
            'monthly_saas_fee' => 'required|numeric|min:0',
            'billing_cycle_months' => 'required|integer|min:1|max:24',
            'subscription_started_at' => 'nullable|date',
            'subscription_expires_at' => 'nullable|date|after_or_equal:subscription_started_at',
            'grace_period_stage1_ends_at' => 'nullable|date|after_or_equal:subscription_expires_at',
            'grace_period_ends_at' => 'nullable|date|after_or_equal:subscription_expires_at',
            'is_saas_blocked' => 'required|boolean',
            'saas_block_reason' => 'nullable|string|max:255',
        ]);

        // Auto-resolve timezone from province code if available
        if (! empty($validated['province_code'])) {
            $validated['timezone'] = self::PROVINCE_TIMEZONES[$validated['province_code']] ?? $validated['timezone'];
        }

        // Auto-compute subscription dates if started_at is set
        if (! empty($validated['subscription_started_at'])) {
            $computed = \App\Models\Dojo::computeSubscriptionDates(
                $validated['subscription_started_at'],
                (int) $validated['billing_cycle_months']
            );
            // Only auto-fill if not overridden manually
            if (empty($validated['subscription_expires_at'])) {
                $validated['subscription_expires_at'] = $computed['subscription_expires_at'];
            }
            if (empty($validated['grace_period_stage1_ends_at'])) {
                $validated['grace_period_stage1_ends_at'] = $computed['grace_period_stage1_ends_at'];
            }
            if (empty($validated['grace_period_ends_at'])) {
                $validated['grace_period_ends_at'] = $computed['grace_period_ends_at'];
            }
        }

        if (! $validated['is_saas_blocked']) {
            $validated['saas_block_reason'] = null;
            $validated['blocked_at'] = null;
        } else {
            $validated['blocked_at'] = now();
        }

        Dojo::create($validated);

        return back()->with('success', 'Dojo berhasil ditambahkan.');
    }

    public function update(Request $request, Dojo $dojo)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_name' => 'nullable|string|max:255',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:30',
            'country' => 'required|string|max:3',
            'province_code' => 'nullable|string|max:10',
            'province_name' => 'nullable|string|max:100',
            'regency_code' => 'nullable|string|max:10',
            'regency_name' => 'nullable|string|max:100',
            'district_code' => 'nullable|string|max:15',
            'district_name' => 'nullable|string|max:100',
            'village_code' => 'nullable|string|max:20',
            'village_name' => 'nullable|string|max:100',
            'address_detail' => 'nullable|string|max:500',
            'timezone' => 'required|string|max:64',
            'is_active' => 'required|boolean',
            'saas_plan_name' => 'nullable|string|max:100',
            'monthly_saas_fee' => 'required|numeric|min:0',
            'billing_cycle_months' => 'required|integer|min:1|max:24',
            'subscription_started_at' => 'nullable|date',
            'subscription_expires_at' => 'nullable|date|after_or_equal:subscription_started_at',
            'grace_period_stage1_ends_at' => 'nullable|date|after_or_equal:subscription_expires_at',
            'grace_period_ends_at' => 'nullable|date|after_or_equal:subscription_expires_at',
            'is_saas_blocked' => 'required|boolean',
            'saas_block_reason' => 'nullable|string|max:255',
        ]);

        // Auto-resolve timezone from province code if available
        if (! empty($validated['province_code'])) {
            $validated['timezone'] = self::PROVINCE_TIMEZONES[$validated['province_code']] ?? $validated['timezone'];
        }

        // Auto-compute subscription dates if started_at is set and expires is not manually set
        if (! empty($validated['subscription_started_at'])) {
            $computed = \App\Models\Dojo::computeSubscriptionDates(
                $validated['subscription_started_at'],
                (int) $validated['billing_cycle_months']
            );
            if (empty($validated['subscription_expires_at'])) {
                $validated['subscription_expires_at'] = $computed['subscription_expires_at'];
            }
            if (empty($validated['grace_period_stage1_ends_at'])) {
                $validated['grace_period_stage1_ends_at'] = $computed['grace_period_stage1_ends_at'];
            }
            if (empty($validated['grace_period_ends_at'])) {
                $validated['grace_period_ends_at'] = $computed['grace_period_ends_at'];
            }
        }

        if (! $validated['is_saas_blocked']) {
            $validated['saas_block_reason'] = null;
            $validated['blocked_at'] = null;
        } else {
            $validated['blocked_at'] = $dojo->blocked_at ?: now();
        }

        $dojo->update($validated);

        return back()->with('success', 'Dojo berhasil diperbarui.');
    }

    public function destroy(Dojo $dojo)
    {
        $dojo->delete();

        return back()->with('success', 'Dojo berhasil dihapus.');
    }
}
