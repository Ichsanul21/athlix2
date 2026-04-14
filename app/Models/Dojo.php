<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class Dojo extends Model
{
    /** @use HasFactory<\Database\Factories\DojoFactory> */
    use HasFactory;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_saas_blocked' => 'boolean',
            'monthly_saas_fee' => 'float',
            'subscription_started_at' => 'date',
            'subscription_expires_at' => 'date',
            'grace_period_stage1_ends_at' => 'date',
            'grace_period_ends_at' => 'date',
            'blocked_at' => 'datetime',
            'last_notice_h7_sent_at' => 'date',
            'last_notice_h1_sent_at' => 'date',
            'last_notice_expired_sent_at' => 'date',
        ];
    }

    public function athletes()
    {
        return $this->hasMany(Athlete::class);
    }

    public function levels()
    {
        return $this->hasMany(Level::class);
    }

    public function specializations()
    {
        return $this->hasMany(Specialization::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function senseis()
    {
        return $this->hasMany(User::class)->where('role', 'sensei');
    }

    public function dojoAdmins()
    {
        return $this->hasMany(User::class)->where('role', 'dojo_admin');
    }

    public function trainingPrograms()
    {
        return $this->hasMany(TrainingProgram::class);
    }

    public function billingDefaults()
    {
        return $this->hasMany(BillingDefault::class, 'tenant_id');
    }

    public function invoiceRuns()
    {
        return $this->hasMany(InvoiceRun::class, 'tenant_id');
    }

    public function tenantSetting()
    {
        return $this->hasOne(TenantSetting::class, 'tenant_id');
    }

    public function hasActiveSubscription(?Carbon $now = null): bool
    {
        $now = $now ?? now();

        if (! $this->subscription_expires_at) {
            return true;
        }

        return $now->toDateString() <= \Carbon\Carbon::parse($this->subscription_expires_at)->toDateString();
    }

    public function canAccessSaas(?Carbon $now = null): bool
    {
        $now = $now ?? now();
        $isGraceStage1 = $this->subscription_expires_at 
            && $this->grace_period_stage1_ends_at 
            && $now->toDateString() > \Carbon\Carbon::parse($this->subscription_expires_at)->toDateString()
            && $now->toDateString() <= \Carbon\Carbon::parse($this->grace_period_stage1_ends_at)->toDateString();

        return (bool) $this->is_active
            && ! (bool) $this->is_saas_blocked
            && ($this->hasActiveSubscription($now) || $isGraceStage1);
    }

    /**
     * Grace period is split into 2 stages:
     *   Stage 1 (Peringatan)  – subscription_expires_at < today <= grace_period_stage1_ends_at (week 1)
     *   Stage 2 (Terbatas)   – grace_period_stage1_ends_at < today <= grace_period_ends_at (week 2)
     */
    public function accessStatusLabel(?Carbon $now = null): string
    {
        $now = $now ?? now();

        if (! $this->is_active) {
            return 'Nonaktif';
        }

        if ($this->is_saas_blocked) {
            return 'Diblokir Manual';
        }

        if ($this->subscription_expires_at && $now->toDateString() > \Carbon\Carbon::parse($this->subscription_expires_at)->toDateString()) {
            // Stage 1 grace: warning only, full access
            if ($this->grace_period_stage1_ends_at && $now->toDateString() <= \Carbon\Carbon::parse($this->grace_period_stage1_ends_at)->toDateString()) {
                return 'Grace Tahap 1 (Peringatan)';
            }

            // Stage 2 grace: restricted access
            if ($this->grace_period_ends_at && $now->toDateString() <= \Carbon\Carbon::parse($this->grace_period_ends_at)->toDateString()) {
                return 'Grace Tahap 2 (Terbatas)';
            }

            return 'Expired';
        }

        return 'Aktif';
    }

    /**
     * Compute subscription_expires_at from started_at + billing_cycle_months.
     * Also auto-set grace period stage 1 (+ 7 days) and stage 2 (+ 14 days).
     */
    public static function computeSubscriptionDates(string $startedAt, int $cycleMonths): array
    {
        $start = Carbon::parse($startedAt);
        $expiresAt = $start->copy()->addMonths($cycleMonths)->subDay();
        $stage1 = $expiresAt->copy()->addDays(7);
        $stage2 = $expiresAt->copy()->addDays(14);

        return [
            'subscription_expires_at' => $expiresAt->toDateString(),
            'grace_period_stage1_ends_at' => $stage1->toDateString(),
            'grace_period_ends_at' => $stage2->toDateString(),
        ];
    }

    public function getRemainingDaysAttribute(): int
    {
        if (!$this->subscription_expires_at) return 0;
        $expires = Carbon::parse($this->subscription_expires_at);
        $diff = now()->startOfDay()->diffInDays($expires->startOfDay(), false);
        return (int) $diff;
    }

    public function getSubscriptionTypeAttribute(): string
    {
        // If they have any paid invoices, or if duration is > 14 days since start
        // For simplicity: if start and expires is exactly 14 days apart, it's trial
        if (!$this->subscription_started_at || !$this->subscription_expires_at) return 'Unknown';
        
        $start = Carbon::parse($this->subscription_started_at);
        $expires = Carbon::parse($this->subscription_expires_at);
        $diff = $start->diffInDays($expires);
        
        // A 14-day trial means expires is 14 days after start (addDays(14))
        // diffInDays will return 14
        return $diff <= 14 ? 'Trial' : 'Subscriber';
    }
}
