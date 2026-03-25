<?php

namespace App\Http\Controllers;

use App\Models\Athlete;
use App\Models\Dojo;
use App\Models\FinanceAdjustment;
use App\Models\FinanceRecord;
use Inertia\Inertia;
use Illuminate\Http\Request;

class FinanceController extends Controller
{
    private const ADMIN_FEE = 5000;
    private const BASE_FEE_PRIMA = 150000;
    private const BASE_FEE_NON_PRIMA = 175000;

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

                return [
                    'id' => $record->id,
                    'athlete' => $record->athlete,
                    'description' => $record->description,
                    'amount' => (float) $record->amount,
                    'admin_fee' => self::ADMIN_FEE,
                    'total_amount' => (float) $record->amount + self::ADMIN_FEE,
                    'status' => $record->status,
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

        return Inertia::render('Finance/Index', [
            'records' => Inertia::defer(fn () => $records),
            'filters' => Inertia::defer(fn () => ['search' => $search]),
            'adminFee' => Inertia::defer(fn () => self::ADMIN_FEE),
            'athletes' => Inertia::defer(fn () => $athleteListQuery->get()),
            'dojos' => Inertia::defer(fn () => $user?->isSuperAdmin() ? Dojo::orderBy('name')->get(['id', 'name']) : []),
            'selectedDojoId' => Inertia::defer(fn () => $selectedDojoId),
        ]);
    }

    public function update(Request $request, FinanceRecord $finance)
    {
        $this->ensureFinanceAccessible($finance);

        $finance->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        return back()->with('success', 'Pembayaran berhasil dicatat sebagai lunas.');
    }

    public function customize(Request $request, FinanceRecord $finance)
    {
        $this->ensureFinanceAccessible($finance);

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

    public function generateMonthly()
    {
        $user = auth()->user();
        $requestedDojoId = request('dojo_id') ? (int) request('dojo_id') : null;
        $selectedDojoId = $this->resolveDojoId($user, $requestedDojoId);

        if ($user?->isSuperAdmin() && ! $selectedDojoId) {
            return back()->with('error', 'Pilih dojo terlebih dahulu sebelum menerbitkan tagihan.');
        }

        $athleteQuery = Athlete::with(['physicalMetrics' => fn ($query) => $query->latest('recorded_at')]);
        $athleteQuery = $this->scopeAthletesForUser($athleteQuery, $user);
        if ($selectedDojoId) {
            $athleteQuery->where('dojo_id', $selectedDojoId);
        }

        $athletes = $athleteQuery->get();
        $monthName = now()->translatedFormat('F Y');
        $dueDate = now()->endOfMonth()->format('Y-m-d');
        
        $count = 0;
        foreach ($athletes as $athlete) {
            $latestMetric = $athlete->physicalMetrics->first();
            $isPrima = $latestMetric && $latestMetric->bmi >= 18.5 && $latestMetric->bmi <= 24.9;
            $amount = $isPrima ? self::BASE_FEE_PRIMA : self::BASE_FEE_NON_PRIMA;
            $conditionLabel = $isPrima ? 'Prima' : 'Tidak Prima';

            // Check if already generated for this month to avoid duplicates
            $exists = FinanceRecord::where('athlete_id', $athlete->id)
                ->where('description', "Iuran Bulanan ({$conditionLabel}) - {$monthName}")
                ->exists();
                
            if (!$exists) {
                FinanceRecord::create([
                    'athlete_id' => $athlete->id,
                    'amount' => $amount,
                    'description' => "Iuran Bulanan ({$conditionLabel}) - {$monthName}",
                    'status' => 'unpaid',
                    'due_date' => $dueDate,
                ]);
                $count++;
            }
        }

        return back()->with('success', "Berhasil menerbitkan {$count} tagihan iuran bulan {$monthName}.");
    }

    private function ensureFinanceAccessible(FinanceRecord $finance): void
    {
        $user = auth()->user();
        if (! $user) {
            abort(403);
        }

        if ($user->isSuperAdmin()) {
            return;
        }

        if ($user->isSensei()) {
            $allowed = $user->senseiAthletes()->whereKey($finance->athlete_id)->exists();
            if (! $allowed) {
                abort(403);
            }
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
