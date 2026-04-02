<?php

namespace App\Services\Billing;

use App\Models\Athlete;
use App\Models\AthleteBillingOverride;
use App\Models\BillingDefault;
use App\Models\BillingInvoice;
use App\Models\FinanceRecord;
use App\Models\InvoiceRun;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DynamicBillingService
{
    private const FALLBACK_MONTHLY_FEE = 150000;

    public function generateMonthlyInvoices(
        int $tenantId,
        ?Carbon $periodStart = null,
        ?Carbon $dueDate = null,
        ?int $initiatedBy = null,
        bool $mirrorLegacyFinanceRecord = true,
        ?float $manualMonthlyFee = null,
        ?string $manualClassNote = null
    ): InvoiceRun {
        $periodStart = ($periodStart?->copy() ?? now())->startOfMonth();
        $periodEnd = $periodStart->copy()->endOfMonth();
        $dueDate = ($dueDate?->copy() ?? $periodEnd->copy())->startOfDay();
        $periodKey = $periodStart->format('Y-m');

        return DB::transaction(function () use (
            $tenantId,
            $periodStart,
            $periodEnd,
            $dueDate,
            $periodKey,
            $initiatedBy,
            $mirrorLegacyFinanceRecord,
            $manualMonthlyFee,
            $manualClassNote
        ) {
            $run = InvoiceRun::query()->updateOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'period_key' => $periodKey,
                ],
                [
                    'period_start' => $periodStart->toDateString(),
                    'period_end' => $periodEnd->toDateString(),
                    'scheduled_due_date' => $dueDate->toDateString(),
                    'status' => 'processing',
                    'initiated_by' => $initiatedBy,
                    'run_at' => now(),
                ]
            );

            $athletes = Athlete::query()
                ->where('dojo_id', $tenantId)
                ->orderBy('id')
                ->get();

            $defaults = $this->activeDefaults($tenantId, $periodStart);
            $overrides = $this->activeOverrides($tenantId, $periodStart)
                ->groupBy('athlete_id');

            /** @var Athlete $athlete */
            foreach ($athletes as $athlete) {
                // Determine base amount: use manual if provided or resolve from defaults
                $baseAmount = $manualMonthlyFee ?? $this->resolveDefaultFee($athlete, $defaults);
                
                $resolved = $this->resolveAmountForAthlete($athlete, (float) $baseAmount, $overrides->get($athlete->id, collect()));
                $this->upsertInvoiceForAthlete($run, $athlete, $periodStart, $periodEnd, $dueDate, (float) $resolved['base'], (float) $resolved['final']);

                if ($mirrorLegacyFinanceRecord) {
                    $this->upsertLegacyFinanceRecord($athlete, $periodStart, $dueDate, (float) $resolved['final']);
                }
            }

            $run->update([
                'status' => 'completed',
                'notes' => 'Generated invoices: ' . $athletes->count(),
            ]);

            return $run->fresh();
        });
    }

    private function activeDefaults(int $tenantId, Carbon $periodStart): Collection
    {
        return BillingDefault::query()
            ->where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->where(function ($query) use ($periodStart) {
                $query->whereNull('effective_from')->orWhere('effective_from', '<=', $periodStart->toDateString());
            })
            ->where(function ($query) use ($periodStart) {
                $query->whereNull('effective_to')->orWhere('effective_to', '>=', $periodStart->toDateString());
            })
            ->orderByDesc('effective_from')
            ->get();
    }

    private function activeOverrides(int $tenantId, Carbon $periodStart): Collection
    {
        return AthleteBillingOverride::query()
            ->where('tenant_id', $tenantId)
            ->where(function ($query) use ($periodStart) {
                $query->whereNull('valid_from')->orWhere('valid_from', '<=', $periodStart->toDateString());
            })
            ->where(function ($query) use ($periodStart) {
                $query->whereNull('valid_to')->orWhere('valid_to', '>=', $periodStart->toDateString());
            })
            ->latest('id')
            ->get();
    }

    private function resolveAmountForAthlete(Athlete $athlete, float $baseAmount, Collection $overrides): array
    {
        $override = $overrides->first();

        if (! $override) {
            return [
                'base' => $baseAmount,
                'final' => $baseAmount,
            ];
        }

        $finalAmount = $baseAmount;
        if ($override->override_mode === 'fixed') {
            $finalAmount = $override->override_value;
        } elseif ($override->override_mode === 'discount_amount') {
            $finalAmount = max($baseAmount - $override->override_value, 0);
        } elseif ($override->override_mode === 'discount_percent') {
            $finalAmount = max($baseAmount - ($baseAmount * ($override->override_value / 100)), 0);
        }

        return [
            'base' => round($baseAmount, 2),
            'final' => round($finalAmount, 2),
        ];
    }

    private function resolveDefaultFee(Athlete $athlete, Collection $defaults): float
    {
        if ($defaults->isEmpty()) {
            return self::FALLBACK_MONTHLY_FEE;
        }

        $scored = $defaults->map(function (BillingDefault $default) use ($athlete) {
            $score = 0;
            if ($default->belt_id && (int) $default->belt_id === (int) $athlete->current_belt_id) {
                $score += 50;
            } elseif ($default->belt_id) {
                $score -= 30;
            }

            $athleteClass = strtolower(trim((string) $athlete->class_note));
            $defaultClass = strtolower(trim((string) $default->class_note));
            if ($defaultClass !== '' && $athleteClass !== '' && $defaultClass === $athleteClass) {
                $score += 40;
            } elseif ($defaultClass !== '') {
                $score -= 20;
            }

            if (! $default->belt_id && $defaultClass === '') {
                $score += 10;
            }

            return [
                'score' => $score,
                'default' => $default,
            ];
        })->sortByDesc('score')->values();

        /** @var BillingDefault|null $winner */
        $winner = $scored->first()['default'] ?? null;

        return (float) ($winner?->monthly_fee ?? self::FALLBACK_MONTHLY_FEE);
    }

    private function upsertInvoiceForAthlete(
        InvoiceRun $run,
        Athlete $athlete,
        Carbon $periodStart,
        Carbon $periodEnd,
        Carbon $dueDate,
        float $baseAmount,
        float $finalAmount
    ): void {
        $invoiceNo = sprintf(
            'INV-%d-%s-%04d',
            $run->tenant_id,
            $periodStart->format('Ym'),
            $athlete->id
        );

        $invoice = BillingInvoice::query()->updateOrCreate(
            [
                'tenant_id' => $run->tenant_id,
                'invoice_no' => $invoiceNo,
            ],
            [
                'athlete_id' => $athlete->id,
                'period_start' => $periodStart->toDateString(),
                'period_end' => $periodEnd->toDateString(),
                'invoice_run_id' => $run->id,
                'due_date' => $dueDate->toDateString(),
                'subtotal' => $baseAmount,
                'discount_total' => max(round($baseAmount - $finalAmount, 2), 0),
                'total_due' => $finalAmount,
                'status' => $finalAmount > 0 ? 'unpaid' : 'paid',
                'generated_at' => now(),
                'paid_at' => $finalAmount > 0 ? null : now(),
            ]
        );

        $invoice->items()->delete();
        $invoice->items()->create([
            'item_type' => 'membership_fee',
            'description' => 'Iuran bulanan ' . $periodStart->translatedFormat('F Y'),
            'qty' => 1,
            'unit_amount' => $baseAmount,
            'amount' => $finalAmount,
        ]);
    }

    private function upsertLegacyFinanceRecord(Athlete $athlete, Carbon $periodStart, Carbon $dueDate, float $amount): void
    {
        $description = 'Iuran Bulanan - ' . $periodStart->translatedFormat('F Y');
        FinanceRecord::query()->updateOrCreate(
            [
                'athlete_id' => $athlete->id,
                'description' => $description,
            ],
            [
                'amount' => $amount,
                'status' => $amount > 0 ? 'unpaid' : 'paid',
                'due_date' => $dueDate->toDateString(),
                'paid_at' => $amount > 0 ? null : now(),
            ]
        );
    }
}
