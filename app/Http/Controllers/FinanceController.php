<?php

namespace App\Http\Controllers;

use App\Models\Athlete;
use App\Models\AthleteBillingOverride;
use App\Models\BillingDefault;
use App\Models\BillingOverrideRequest;
use App\Models\Dojo;
use App\Models\FinanceAdjustment;
use App\Models\FinanceRecord;
use App\Services\Billing\DynamicBillingService;
use Inertia\Inertia;
use Illuminate\Http\Request;

class FinanceController extends Controller
{
    private const ADMIN_FEE = 5000;

    public function index()
    {
        $search = trim((string) request('search', ''));
        $user = auth()->user();
        $requestedDojoId = request('dojo_id') ? (int) request('dojo_id') : null;
        $selectedDojoId = $this->resolveDojoId($user, $requestedDojoId);
        if ($user?->isSuperAdmin() && ! $selectedDojoId) {
            $selectedDojoId = Dojo::query()->value('id');
        }

        $athleteScope = $this->scopeAthletesForUser(Athlete::query(), $user);
        if ($user?->isSuperAdmin() && $selectedDojoId) {
            $athleteScope->where('dojo_id', $selectedDojoId);
        }
        $athleteIdSubquery = (clone $athleteScope)->select('id');
        $athleteListQuery = (clone $athleteScope)->select('id', 'full_name')->orderBy('full_name');

        $records = FinanceRecord::query()
            ->with([
                'athlete.belt',
                'athlete.physicalMetrics' => fn ($query) => $query->latest('recorded_at'),
                'adjustments.sourceAthlete',
            ])
            ->whereIn('athlete_id', $athleteIdSubquery)
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($nested) use ($search) {
                    $nested
                        ->where('description', 'like', "%{$search}%")
                        ->orWhereHas('athlete', function ($athleteQuery) use ($search) {
                            $athleteQuery
                                ->where('full_name', 'like', "%{$search}%")
                                ->orWhere('athlete_code', 'like', "%{$search}%");
                        });
                });
            })
            ->latest()
            ->get()
            ->map(function ($record) {
                $latestMetric = $record->athlete?->physicalMetrics?->first();
                $isPrima = $latestMetric && $latestMetric->bmi >= 18.5 && $latestMetric->bmi <= 24.9;

                $status = $record->status === 'paid' ? 'paid' : 'unpaid';

                return [
                    'id' => $record->id,
                    'athlete' => $record->athlete,
                    'description' => $record->description,
                    'amount' => (float) $record->amount,
                    'admin_fee' => self::ADMIN_FEE,
                    'total_amount' => (float) $record->amount + self::ADMIN_FEE,
                    'status' => $status,
                    'due_date' => $record->due_date,
                    'athlete_condition' => $isPrima ? 'Prima' : 'Tidak Prima',
                    'adjustments' => $record->adjustments->map(function ($adjustment) {
                        return [
                            'id' => $adjustment->id,
                            'old_amount' => (float) $adjustment->old_amount,
                            'new_amount' => (float) $adjustment->new_amount,
                            'delta_amount' => (float) $adjustment->delta_amount,
                            'reason' => $adjustment->reason,
                            'source_athlete' => $adjustment->sourceAthlete?->full_name,
                            'created_at' => $adjustment->created_at?->format('Y-m-d H:i'),
                        ];
                    })->values(),
                ];
            });

        $tenantId = (int) ($selectedDojoId ?? $user?->dojo_id);
        $billingDefaults = collect();
        $billingOverrides = collect();
        $overrideRequests = collect();
        $canManageDynamicBilling = (bool) ($user?->isSuperAdmin() || $user?->isDojoAdmin());
        $canRequestDynamicBilling = (bool) ($user?->isCoachGroup() || $user?->isParent());

        if ($tenantId > 0) {
            $billingDefaults = BillingDefault::query()
                ->where('tenant_id', $tenantId)
                ->with('belt:id,name')
                ->latest('effective_from')
                ->latest('id')
                ->get();

            $billingOverrides = AthleteBillingOverride::query()
                ->where('tenant_id', $tenantId)
                ->with([
                    'athlete:id,full_name,athlete_code',
                    'creator:id,name',
                ])
                ->latest('id')
                ->limit(40)
                ->get();

            $overrideRequestsQuery = BillingOverrideRequest::query()
                ->where('tenant_id', $tenantId)
                ->with([
                    'athlete:id,full_name,athlete_code',
                    'requester:id,name',
                    'reviewer:id,name',
                ])
                ->latest('id');

            if ($canManageDynamicBilling) {
                $overrideRequests = (clone $overrideRequestsQuery)
                    ->where('status', 'pending')
                    ->limit(40)
                    ->get();
            } elseif ($canRequestDynamicBilling && $user) {
                $overrideRequests = (clone $overrideRequestsQuery)
                    ->where('requested_by', $user->id)
                    ->limit(40)
                    ->get();
            }
        }

        return Inertia::render('Finance/Index', [
            'records' => Inertia::defer(fn () => $records),
            'filters' => Inertia::defer(fn () => ['search' => $search]),
            'adminFee' => Inertia::defer(fn () => self::ADMIN_FEE),
            'athletes' => Inertia::defer(fn () => $athleteListQuery->get()),
            'billingDefaults' => Inertia::defer(fn () => $billingDefaults),
            'billingOverrides' => Inertia::defer(fn () => $billingOverrides),
            'overrideRequests' => Inertia::defer(fn () => $overrideRequests),
            'canManageDynamicBilling' => Inertia::defer(fn () => $canManageDynamicBilling),
            'canRequestDynamicBilling' => Inertia::defer(fn () => $canRequestDynamicBilling),
            'dojos' => Inertia::defer(fn () => $user?->isSuperAdmin() ? Dojo::orderBy('name')->get(['id', 'name']) : []),
            'selectedDojoId' => Inertia::defer(fn () => $selectedDojoId),
        ]);
    }

    public function update(Request $request, FinanceRecord $finance)
    {
        $this->ensureFinanceManager($finance);

        $finance->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        return back()->with('success', 'Pembayaran berhasil dicatat sebagai lunas.');
    }

    public function customize(Request $request, FinanceRecord $finance)
    {
        $this->ensureFinanceManager($finance);

        if (($request->input('source_athlete_id') ?? '') === '') {
            $request->merge(['source_athlete_id' => null]);
        }

        $validated = $request->validate([
            'new_amount' => 'required|numeric|min:0',
            'reason' => 'required|string|max:500',
            'source_athlete_id' => 'nullable|exists:athletes,id',
        ]);

        $oldAmount = (float) $finance->amount;
        $newAmount = (float) $validated['new_amount'];
        $sourceAthleteId = $validated['source_athlete_id'] ?? null;
        if ($sourceAthleteId === $finance->athlete_id) {
            $sourceAthleteId = null;
        }

        if ($sourceAthleteId) {
            $allowedSource = $this->scopeAthletesForUser(Athlete::query()->whereKey($sourceAthleteId), auth()->user())->exists();
            $sameDojo = Athlete::query()
                ->whereKey($sourceAthleteId)
                ->where('dojo_id', Athlete::query()->whereKey($finance->athlete_id)->value('dojo_id'))
                ->exists();
            if (! $allowedSource || ! $sameDojo) {
                $sourceAthleteId = null;
            }
        }

        FinanceAdjustment::create([
            'finance_record_id' => $finance->id,
            'athlete_id' => $finance->athlete_id,
            'source_athlete_id' => $sourceAthleteId,
            'old_amount' => $oldAmount,
            'new_amount' => $newAmount,
            'delta_amount' => $newAmount - $oldAmount,
            'reason' => $validated['reason'],
            'adjusted_by' => auth()->id(),
        ]);

        $finance->update(['amount' => $newAmount]);

        return back()->with('success', 'Nominal tagihan berhasil dikustom untuk skema cross-subsidi.');
    }

    public function generateMonthly(DynamicBillingService $billingService)
    {
        $user = auth()->user();
        if (! $user?->isSuperAdmin() && ! $user?->isDojoAdmin()) {
            return back()->with('error', 'Hanya admin keuangan dojo yang dapat generate tagihan.');
        }

        $requestedDojoId = request('dojo_id') ? (int) request('dojo_id') : null;
        $selectedDojoId = $this->resolveDojoId($user, $requestedDojoId);

        if ($user?->isSuperAdmin() && ! $selectedDojoId) {
            return back()->with('error', 'Pilih dojo terlebih dahulu sebelum menerbitkan tagihan.');
        }

        $tenantId = (int) ($selectedDojoId ?? $user?->dojo_id);
        if ($tenantId <= 0) {
            return back()->with('error', 'Tenant dojo tidak ditemukan untuk generate tagihan.');
        }

        $run = $billingService->generateMonthlyInvoices(
            $tenantId,
            now()->startOfMonth(),
            now()->endOfMonth(),
            auth()->id(),
            true
        );

        $invoiceCount = $run->invoices()->count();
        $monthName = now()->translatedFormat('F Y');

        return back()->with('success', "Berhasil menerbitkan {$invoiceCount} tagihan iuran bulan {$monthName}.");
    }

    private function ensureFinanceManager(FinanceRecord $finance): void
    {
        $user = auth()->user();
        if (! $user) {
            abort(403);
        }

        if (! $user->isSuperAdmin() && ! $user->isDojoAdmin()) {
            abort(403);
        }

        if ($user->isSuperAdmin()) {
            return;
        }

        $allowed = $user->dojo_id
            ? Athlete::query()->whereKey($finance->athlete_id)->where('dojo_id', $user->dojo_id)->exists()
            : false;
        if (! $allowed) {
            abort(403);
        }
    }
}
