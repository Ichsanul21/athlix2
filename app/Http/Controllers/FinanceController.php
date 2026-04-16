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
        $isAllDojos = $user?->isSuperAdmin() && !$selectedDojoId;

        $athleteScope = $this->scopeAthletesForUser(Athlete::query(), $user);
        if ($selectedDojoId) {
            $athleteScope->where('dojo_id', $selectedDojoId);
        }
        $athleteIdSubquery = (clone $athleteScope)->select('id');
        $athleteListQuery  = (clone $athleteScope)->select('id', 'full_name')->orderBy('full_name');

        $records = FinanceRecord::query()
            ->with([
                'athlete.level',
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

        $tenantId = $isAllDojos ? null : (int) ($selectedDojoId ?? $user?->dojo_id);
        $billingDefaults = collect();
        $billingOverrides = collect();
        $overrideRequests = collect();
        $canManageDynamicBilling  = (bool) ($user?->isSuperAdmin() || $user?->isDojoAdmin() || $user?->isSensei());
        $canRequestDynamicBilling = false;
        $canDirectSenseiNominal   = false;

        if ($tenantId > 0) {
            // PERBAIKAN: Sort by created_at DESC agar data yang baru saja ditambahkan selalu di atas (index 0 = aktif)
            $billingDefaults = BillingDefault::query()
                ->where('tenant_id', $tenantId)
                ->with('level:id,name')
                ->latest('created_at')
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
        } elseif ($isAllDojos) {
            // PERBAIKAN: Sort by created_at DESC (sama seperti di atas)
            $billingDefaults = BillingDefault::query()
                ->with(['level:id,name', 'tenant:id,name'])
                ->latest('created_at')
                ->get();

            $billingOverrides = AthleteBillingOverride::query()
                ->with([
                    'athlete:id,full_name,athlete_code',
                    'creator:id,name',
                    'tenant:id,name',
                ])
                ->latest('id')
                ->limit(100)
                ->get();
        }

        $periodKey  = now()->format('Y-m');
        $isMonthlyGenerated = \App\Models\InvoiceRun::query()
            ->where('tenant_id', $tenantId)
            ->where('period_key', $periodKey)
            ->exists();

        return Inertia::render('Finance/Index', [
            'records'               => Inertia::defer(fn () => $records),
            'filters'               => Inertia::defer(fn () => ['search' => $search]),
            'adminFee'              => Inertia::defer(fn () => self::ADMIN_FEE),
            'athletes'              => Inertia::defer(fn () => $athleteListQuery->get()),
            'billingDefaults'       => Inertia::defer(fn () => $billingDefaults),
            'billingOverrides'      => Inertia::defer(fn () => $billingOverrides),
            'overrideRequests'      => Inertia::defer(fn () => $overrideRequests),
            'canManageDynamicBilling'  => Inertia::defer(fn () => $canManageDynamicBilling),
            'canRequestDynamicBilling' => Inertia::defer(fn () => $canRequestDynamicBilling),
            'canDirectSenseiNominal'   => Inertia::defer(fn () => $canDirectSenseiNominal),
            'dojos'         => Inertia::defer(fn () => $user?->isSuperAdmin() ? Dojo::orderBy('name')->get(['id', 'name']) : []),
            'selectedDojoId'=> Inertia::defer(fn () => $isAllDojos ? null : $selectedDojoId),
            'isAllDojos'    => Inertia::defer(fn () => $isAllDojos),
            'isMonthlyGenerated' => Inertia::defer(fn () => $isMonthlyGenerated),
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
        $this->ensureFinanceCustomizer($finance);

        $validated = $request->validate([
            'new_amount' => 'required|numeric|min:0',
            'reason' => 'required|string|max:500',
        ]);

        $oldAmount = (float) $finance->amount;
        $newAmount = (float) $validated['new_amount'];

        FinanceAdjustment::create([
            'finance_record_id' => $finance->id,
            'athlete_id' => $finance->athlete_id,
            'source_athlete_id' => null,
            'old_amount' => $oldAmount,
            'new_amount' => $newAmount,
            'delta_amount' => $newAmount - $oldAmount,
            'reason' => $validated['reason'],
            'adjusted_by' => auth()->id(),
        ]);

        $finance->update(['amount' => $newAmount]);

        return back();
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

        $monthStart = now()->startOfMonth();
        $monthEnd   = now()->endOfMonth();
        $monthName  = now()->translatedFormat('F Y');
        $periodKey  = now()->format('Y-m');

        $monthlyFee = request('monthly_fee');
        $classNote  = request('class_note');

        if (!$monthlyFee) {
            // PERBAIKAN: Ambil default yang paling baru ditambahkan (created_at DESC)
            $activeDefault = BillingDefault::where('tenant_id', $tenantId)
                ->latest('created_at')
                ->first();

            if (!$activeDefault) {
                return back()->with('error', 'Tidak ada aturan default bulanan yang aktif. Silakan atur nominal default terlebih dahulu.');
            }

            $monthlyFee = $activeDefault->monthly_fee;
            $classNote  = $classNote ?? $activeDefault->class_note;
        }

        $alreadyExists = \App\Models\InvoiceRun::query()
            ->where('tenant_id', $tenantId)
            ->where('period_key', $periodKey)
            ->exists();

        if ($alreadyExists) {
            return back()->with('error', "Tagihan untuk bulan {$monthName} sudah pernah diterbitkan (Run ID: {$periodKey}). Tidak dapat menduplikasi tagihan.");
        }

        $run = $billingService->generateMonthlyInvoices(
            $tenantId,
            $monthStart,
            $monthEnd,
            auth()->id(),
            true,
            $monthlyFee,
            $classNote
        );

        $invoiceCount = $run->invoices()->count();

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

    private function ensureFinanceCustomizer(FinanceRecord $finance): void
    {
        $user = auth()->user();
        if (! $user) {
            abort(403);
        }

        if (! $user->isSuperAdmin() && ! $user->isDojoAdmin() && ! $user->isSensei()) {
            abort(403);
        }

        if ($user->isSuperAdmin()) {
            return;
        }

        $allowed = $this->scopeAthletesForUser(
            Athlete::query()->whereKey($finance->athlete_id),
            $user
        )->exists();

        if (! $allowed) {
            abort(403);
        }
    }
}
