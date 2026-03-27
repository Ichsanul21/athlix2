<?php

namespace Database\Seeders;

use App\Models\Athlete;
use App\Models\AthleteBillingOverride;
use App\Models\BillingDefault;
use App\Models\BillingInvoice;
use App\Models\BillingInvoiceItem;
use App\Models\BillingOverrideRequest;
use App\Models\BillingPayment;
use App\Models\Dojo;
use App\Models\FinanceAdjustment;
use App\Models\FinanceRecord;
use App\Models\InvoiceRun;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class BillingDomainSeeder extends Seeder
{
    private const ADMIN_FEE = 5000;

    public function run(): void
    {
        $periodStart = now()->startOfMonth();
        $periodEnd = now()->endOfMonth();
        $periodKey = $periodStart->format('Y-m');

        $dojos = Dojo::query()->orderBy('id')->get();
        foreach ($dojos as $dojo) {
            $this->seedBillingDefaults($dojo, $periodStart);

            $initiatorId = User::query()
                ->where('dojo_id', $dojo->id)
                ->whereIn('role', ['dojo_admin', 'super_admin'])
                ->orderByRaw("CASE WHEN role = 'dojo_admin' THEN 0 WHEN role = 'super_admin' THEN 1 ELSE 2 END")
                ->value('id');

            $run = InvoiceRun::query()->create([
                'tenant_id' => $dojo->id,
                'period_key' => $periodKey,
                'period_start' => $periodStart->toDateString(),
                'period_end' => $periodEnd->toDateString(),
                'scheduled_due_date' => $periodEnd->copy()->toDateString(),
                'status' => 'completed',
                'initiated_by' => $initiatorId,
                'run_at' => now(),
                'notes' => 'Seeded invoice run untuk simulasi dynamic billing.',
            ]);

            $athletes = Athlete::query()->where('dojo_id', $dojo->id)->orderBy('id')->get();
            foreach ($athletes as $index => $athlete) {
                $baseFee = $this->resolveBaseFee($athlete);
                $this->seedFinanceRecords($athlete, $index, $baseFee, $initiatorId);
                $overrideId = $this->seedOverrides($dojo->id, $athlete, $index, $initiatorId);
                $this->seedOverrideRequests($dojo->id, $athlete, $index, $overrideId);
                $this->seedInvoiceAndPayments($dojo->id, $run->id, $athlete, $index, $baseFee, $periodStart, $periodEnd, $initiatorId);
            }
        }
    }

    private function seedBillingDefaults(Dojo $dojo, Carbon $periodStart): void
    {
        $defaults = [
            ['class_note' => 'Kelas Usia Dini', 'monthly_fee' => 175000],
            ['class_note' => 'Kelas Pemula', 'monthly_fee' => 225000],
            ['class_note' => 'Kelas Junior', 'monthly_fee' => 260000],
        ];

        foreach ($defaults as $item) {
            BillingDefault::query()->create([
                'tenant_id' => $dojo->id,
                'belt_id' => null,
                'class_note' => $item['class_note'],
                'monthly_fee' => $item['monthly_fee'],
                'effective_from' => $periodStart->toDateString(),
                'effective_to' => null,
                'is_active' => true,
            ]);
        }
    }

    private function seedFinanceRecords(Athlete $athlete, int $index, float $baseFee, ?int $adjustedBy): void
    {
        $previousMonth = now()->subMonthNoOverflow();
        $currentMonth = now();

        $previousStatus = $index % 6 === 0 ? 'unpaid' : 'paid';
        $previousRecord = FinanceRecord::query()->create([
            'athlete_id' => $athlete->id,
            'amount' => $baseFee,
            'description' => 'Iuran Pembinaan ' . $previousMonth->translatedFormat('F Y'),
            'status' => $previousStatus,
            'due_date' => $previousMonth->endOfMonth()->toDateString(),
            'paid_at' => $previousStatus === 'paid' ? $previousMonth->endOfMonth()->subDays(4)->setTime(12, 0) : null,
        ]);

        $currentStatus = match ($index % 5) {
            0 => 'unpaid',
            1 => 'paid',
            default => 'unpaid',
        };
        $currentRecord = FinanceRecord::query()->create([
            'athlete_id' => $athlete->id,
            'amount' => $baseFee + (($index % 4 === 0) ? 15000 : 0),
            'description' => 'Iuran Pembinaan ' . $currentMonth->translatedFormat('F Y'),
            'status' => $currentStatus,
            'due_date' => $currentMonth->endOfMonth()->toDateString(),
            'paid_at' => $currentStatus === 'paid' ? $currentMonth->startOfMonth()->addDays(5)->setTime(11, 30) : null,
        ]);

        if ($index % 7 === 0) {
            $newAmount = max(125000, (float) $currentRecord->amount - 30000);
            FinanceAdjustment::query()->create([
                'finance_record_id' => $currentRecord->id,
                'athlete_id' => $athlete->id,
                'source_athlete_id' => $athlete->id !== $previousRecord->athlete_id ? $previousRecord->athlete_id : null,
                'old_amount' => $currentRecord->amount,
                'new_amount' => $newAmount,
                'delta_amount' => $newAmount - (float) $currentRecord->amount,
                'reason' => 'Cross-subsidi seed untuk atlet berprestasi.',
                'adjusted_by' => $adjustedBy,
            ]);
            $currentRecord->update(['amount' => $newAmount]);
        }
    }

    private function seedOverrides(int $tenantId, Athlete $athlete, int $index, ?int $creatorId): ?int
    {
        if ($index % 4 !== 0) {
            return null;
        }

        $override = AthleteBillingOverride::query()->create([
            'tenant_id' => $tenantId,
            'athlete_id' => $athlete->id,
            'override_mode' => 'discount_amount',
            'override_value' => 25000 + (($index % 3) * 5000),
            'reason' => 'Override seed: diskon pembinaan.',
            'valid_from' => now()->startOfMonth()->toDateString(),
            'valid_to' => now()->endOfMonth()->toDateString(),
            'created_by' => $creatorId,
        ]);

        return $override->id;
    }

    private function seedOverrideRequests(int $tenantId, Athlete $athlete, int $index, ?int $appliedOverrideId): void
    {
        $requesterId = User::query()
            ->where('dojo_id', $tenantId)
            ->whereIn('role', ['sensei', 'head_coach', 'assistant'])
            ->orderByRaw("CASE WHEN role = 'sensei' THEN 0 WHEN role = 'head_coach' THEN 1 WHEN role = 'assistant' THEN 2 ELSE 3 END")
            ->value('id');

        $reviewerId = User::query()
            ->where('dojo_id', $tenantId)
            ->where('role', 'dojo_admin')
            ->value('id');

        if (! $requesterId) {
            return;
        }

        BillingOverrideRequest::query()->create([
            'tenant_id' => $tenantId,
            'athlete_id' => $athlete->id,
            'override_mode' => 'discount_amount',
            'override_value' => 20000 + (($index % 3) * 10000),
            'reason' => 'Pengajuan seed: subsidi untuk atlet aktif.',
            'valid_from' => now()->startOfMonth()->toDateString(),
            'valid_to' => now()->endOfMonth()->toDateString(),
            'status' => $index % 6 === 0 ? 'pending' : 'approved',
            'requested_by' => $requesterId,
            'reviewed_by' => $index % 6 === 0 ? null : $reviewerId,
            'reviewed_at' => $index % 6 === 0 ? null : now()->subDays(2),
            'review_note' => $index % 6 === 0 ? null : 'Disetujui untuk periode bulan berjalan.',
            'applied_override_id' => $index % 6 === 0 ? null : $appliedOverrideId,
        ]);
    }

    private function seedInvoiceAndPayments(
        int $tenantId,
        int $invoiceRunId,
        Athlete $athlete,
        int $index,
        float $baseFee,
        Carbon $periodStart,
        Carbon $periodEnd,
        ?int $creatorId
    ): void {
        $status = match ($index % 5) {
            0 => 'unpaid',
            1 => 'paid',
            2 => 'partial',
            3 => 'overdue',
            default => 'unpaid',
        };

        $membershipAmount = $baseFee;
        $subtotal = $membershipAmount + self::ADMIN_FEE;
        $discountTotal = $index % 4 === 0 ? 15000 : 0;
        $totalDue = max(0, $subtotal - $discountTotal);
        $paidAt = $status === 'paid' ? now()->subDays(2) : null;

        $invoice = BillingInvoice::query()->create([
            'tenant_id' => $tenantId,
            'athlete_id' => $athlete->id,
            'invoice_run_id' => $invoiceRunId,
            'invoice_no' => sprintf('INV-%02d-%s-%04d', $tenantId, $periodStart->format('Ym'), $index + 1),
            'period_start' => $periodStart->toDateString(),
            'period_end' => $periodEnd->toDateString(),
            'due_date' => $periodEnd->toDateString(),
            'subtotal' => $subtotal,
            'discount_total' => $discountTotal,
            'total_due' => $totalDue,
            'status' => $status,
            'generated_at' => now()->subDays(5),
            'paid_at' => $paidAt,
        ]);

        BillingInvoiceItem::query()->create([
            'invoice_id' => $invoice->id,
            'item_type' => 'membership_fee',
            'description' => 'Iuran Pembinaan Bulanan',
            'qty' => 1,
            'unit_amount' => $membershipAmount,
            'amount' => $membershipAmount,
        ]);

        BillingInvoiceItem::query()->create([
            'invoice_id' => $invoice->id,
            'item_type' => 'admin_fee',
            'description' => 'Biaya Admin',
            'qty' => 1,
            'unit_amount' => self::ADMIN_FEE,
            'amount' => self::ADMIN_FEE,
        ]);

        if ($status === 'paid') {
            BillingPayment::query()->create([
                'tenant_id' => $tenantId,
                'invoice_id' => $invoice->id,
                'amount' => $totalDue,
                'method' => 'qris',
                'reference_no' => 'PAY-' . $invoice->invoice_no,
                'status' => 'confirmed',
                'paid_at' => now()->subDays(2),
                'created_by' => $creatorId,
            ]);
        }

        if ($status === 'partial') {
            BillingPayment::query()->create([
                'tenant_id' => $tenantId,
                'invoice_id' => $invoice->id,
                'amount' => round($totalDue * 0.5, 2),
                'method' => 'cash',
                'reference_no' => 'PAY-PARTIAL-' . $invoice->invoice_no,
                'status' => 'confirmed',
                'paid_at' => now()->subDay(),
                'created_by' => $creatorId,
            ]);
        }
    }

    private function resolveBaseFee(Athlete $athlete): float
    {
        $age = Carbon::parse($athlete->dob)->age;
        $amount = match (true) {
            $age <= 12 => 175000,
            $age <= 17 => 225000,
            default => 260000,
        };

        if ($athlete->specialization === 'both') {
            $amount += 15000;
        }

        return (float) $amount;
    }
}
