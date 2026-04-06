<?php

namespace App\Http\Controllers;

use App\Models\Dojo;
use App\Models\DojoSubscriptionRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

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
                        'remaining_days' => $dojo->remaining_days,
                        'subscription_type' => $dojo->subscription_type,
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

        // Set default subscription start date to today if not provided
        if (empty($validated['subscription_started_at'])) {
            $validated['subscription_started_at'] = now()->toDateString();
        }

        // Auto-compute subscription dates
        if (empty($validated['subscription_expires_at'])) {
            // Default trial for new dojo is 14 days
            $start = \Illuminate\Support\Carbon::parse($validated['subscription_started_at']);
            $validated['subscription_expires_at'] = $start->addDays(14)->toDateString();
            
            // For trial, we might not need long grace periods, but we set them to same or slightly more
            $validated['grace_period_stage1_ends_at'] = $validated['subscription_expires_at'];
            $validated['grace_period_ends_at'] = $validated['subscription_expires_at'];
        } else {
            // If manually provided or billing cycle exists
            $computed = \App\Models\Dojo::computeSubscriptionDates(
                $validated['subscription_started_at'],
                (int) ($validated['billing_cycle_months'] ?? 1)
            );
            
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

        $dojo = Dojo::create($validated);

        if (!empty($validated['contact_email'])) {
            \App\Models\User::firstOrCreate(
                ['email' => $validated['contact_email']],
                [
                    'name' => $validated['contact_name'] ?: 'Admin Dojo',
                    'phone_number' => $validated['contact_phone'] ?: null,
                    'role' => 'dojo_admin',
                    'dojo_id' => $dojo->id,
                    'password' => \Illuminate\Support\Facades\Hash::make('athlix2026'),
                    'must_change_password' => true,
                    'email_verified_at' => now(),
                ]
            );
        }

        // Setup default 3-level report hierarchy
        $defaults = [
            'Power' => [['sub' => 'Upper Body', 'tests' => [['name' => 'Standing Long Jump', 'unit' => 'repetition', 'min' => 0, 'max' => 100], ['name' => 'Medicine Ball Throw', 'unit' => 'repetition', 'min' => 0, 'max' => 100]]], ['sub' => 'Lower Body', 'tests' => [['name' => 'Box Jump', 'unit' => 'repetition', 'min' => 0, 'max' => 50]]]],
            'Strength' => [['sub' => 'Upper Body', 'tests' => [['name' => 'Push Up', 'unit' => 'repetition', 'min' => 0, 'max' => 100, 'dur' => 60], ['name' => 'Pull Up', 'unit' => 'repetition', 'min' => 0, 'max' => 30]]], ['sub' => 'Lower Body', 'tests' => [['name' => 'Squat', 'unit' => 'repetition', 'min' => 0, 'max' => 100, 'dur' => 60]]]],
            'Endurance' => [['sub' => 'Cardio', 'tests' => [['name' => 'Lari 12 Menit', 'unit' => 'repetition', 'min' => 0, 'max' => 3000]]]],
            'Speed' => [['sub' => 'Sprint', 'tests' => [['name' => 'Sprint 30m', 'unit' => 'duration', 'min' => 10, 'max' => 3]]]],
            'Agility' => [['sub' => 'Shuttle', 'tests' => [['name' => 'Shuttle Run', 'unit' => 'duration', 'min' => 20, 'max' => 8], ['name' => 'T-Test', 'unit' => 'duration', 'min' => 15, 'max' => 8]]]],
            'Core' => [['sub' => 'Perut', 'tests' => [['name' => 'Sit Up', 'unit' => 'repetition', 'min' => 0, 'max' => 100, 'dur' => 60], ['name' => 'Plank Hold', 'unit' => 'duration', 'min' => 0, 'max' => 180]]]],
            'Flexibility' => [['sub' => 'General', 'tests' => [['name' => 'Sit and Reach', 'unit' => 'repetition', 'min' => 0, 'max' => 50]]]],
        ];

        foreach ($defaults as $catName => $subItems) {
            $cat = \App\Models\ReportCategory::create(['name' => $catName, 'dojo_id' => $dojo->id]);
            foreach ($subItems as $si => $subItem) {
                $sub = \App\Models\ReportSubCategory::create(['report_category_id' => $cat->id, 'name' => $subItem['sub'], 'sort_order' => $si]);
                foreach ($subItem['tests'] as $ti => $test) {
                    \App\Models\ReportTest::create([
                        'report_sub_category_id' => $sub->id, 'name' => $test['name'],
                        'unit' => $test['unit'], 'min_threshold' => $test['min'], 'max_threshold' => $test['max'],
                        'max_duration_seconds' => $test['dur'] ?? null, 'sort_order' => $ti,
                    ]);
                }
            }
        }

        return back()->with('success', 'Dojo berhasil ditambahkan beserta admin dan rapor tes bawaan.');
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

        return back()->with('success', 'Master Club berhasil dihapus.');
    }

    public function subscriptionRequests()
    {
        return Inertia::render('SuperAdmin/SubscriptionRequests', [
            'requests' => Inertia::defer(fn () => DojoSubscriptionRequest::with('dojo')
                ->latest()
                ->get()),
        ]);
    }

    public function approveSubscriptionRequest(Request $request, DojoSubscriptionRequest $subscriptionRequest)
    {
        $this->authorizeSuperAdmin();

        DB::transaction(function () use ($subscriptionRequest) {
            $dojo = $subscriptionRequest->dojo;
            
            // Get price from PLAN_PRICING
            $newPrice = self::PLAN_PRICING[$subscriptionRequest->requested_plan_name] ?? $dojo->monthly_saas_fee;

            $dojo->update([
                'saas_plan_name' => $subscriptionRequest->requested_plan_name,
                'monthly_saas_fee' => $newPrice,
            ]);

            $subscriptionRequest->update([
                'status' => 'approved',
                'processed_at' => now(),
                'processed_by' => auth()->id(),
            ]);
        });

        return back()->with('success', 'Request perubahan paket berhasil disetujui.');
    }

    public function rejectSubscriptionRequest(Request $request, DojoSubscriptionRequest $subscriptionRequest)
    {
        $this->authorizeSuperAdmin();

        $request->validate([
            'super_admin_notes' => 'required|string|max:500',
        ]);

        $subscriptionRequest->update([
            'status' => 'rejected',
            'super_admin_notes' => $request->super_admin_notes,
            'processed_at' => now(),
            'processed_by' => auth()->id(),
        ]);

        return back()->with('success', 'Request perubahan paket berhasil ditolak.');
    }

    private function authorizeSuperAdmin()
    {
        if (!auth()->user()?->isSuperAdmin()) {
            abort(403);
        }
    }
}
