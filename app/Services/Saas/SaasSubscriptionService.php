<?php

namespace App\Services\Saas;

use App\Services\Messaging\WhatsAppGatewayService;
use App\Models\Dojo;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Mail;

class SaasSubscriptionService
{
    public const AUTO_BLOCK_REASON = 'AUTO: Subscription expired and grace period ended.';

    public function __construct(
        private readonly WhatsAppGatewayService $whatsAppGateway
    ) {
    }

    /**
     * @return array{processed:int, warned_h7:int, warned_h1:int, warned_expired:int, auto_blocked:int, auto_unblocked:int, whatsapp_sent:int, whatsapp_failed:int}
     */
    public function enforceAndNotify(?int $dojoId = null): array
    {
        $today = now()->startOfDay();
        $summary = [
            'processed' => 0,
            'warned_h7' => 0,
            'warned_h1' => 0,
            'warned_expired' => 0,
            'auto_blocked' => 0,
            'auto_unblocked' => 0,
            'whatsapp_sent' => 0,
            'whatsapp_failed' => 0,
        ];

        $dojos = Dojo::query()
            ->when($dojoId, fn ($query) => $query->whereKey($dojoId))
            ->whereNotNull('subscription_expires_at')
            ->get();

        /** @var Collection<int, User> $superAdmins */
        $superAdmins = User::query()
            ->where('role', 'super_admin')
            ->where(function ($query) {
                $query->whereNotNull('email')
                    ->orWhereNotNull('phone_number');
            })
            ->get(['id', 'name', 'email', 'phone_number']);

        foreach ($dojos as $dojo) {
            $summary['processed']++;

            $expiryDate = $dojo->subscription_expires_at?->copy()->startOfDay();
            if (! $expiryDate) {
                continue;
            }

            $daysUntilExpiry = (int) $today->diffInDays($expiryDate, false);
            $graceEnd = ($dojo->grace_period_ends_at ?? $dojo->subscription_expires_at)?->copy()->startOfDay();
            $isPastGrace = $graceEnd ? $today->gt($graceEnd) : false;

            $recipients = $this->resolveRecipients($dojo, $superAdmins);

            if ($daysUntilExpiry === 7 && $this->shouldSendToday($dojo->last_notice_h7_sent_at, $today)) {
                $noticeResult = $this->sendNotice(
                    $recipients,
                    '[ATHLIX SaaS] Reminder H-7 Berlangganan Dojo',
                    $this->buildReminderBody($dojo, 7, $expiryDate),
                    $this->buildReminderWhatsappBody($dojo, 7, $expiryDate)
                );
                $dojo->last_notice_h7_sent_at = $today->toDateString();
                $summary['warned_h7']++;
                $summary['whatsapp_sent'] += $noticeResult['whatsapp_sent'];
                $summary['whatsapp_failed'] += $noticeResult['whatsapp_failed'];
            }

            if ($daysUntilExpiry === 1 && $this->shouldSendToday($dojo->last_notice_h1_sent_at, $today)) {
                $noticeResult = $this->sendNotice(
                    $recipients,
                    '[ATHLIX SaaS] Reminder H-1 Berlangganan Dojo',
                    $this->buildReminderBody($dojo, 1, $expiryDate),
                    $this->buildReminderWhatsappBody($dojo, 1, $expiryDate)
                );
                $dojo->last_notice_h1_sent_at = $today->toDateString();
                $summary['warned_h1']++;
                $summary['whatsapp_sent'] += $noticeResult['whatsapp_sent'];
                $summary['whatsapp_failed'] += $noticeResult['whatsapp_failed'];
            }

            if ($isPastGrace) {
                if ($this->shouldSendToday($dojo->last_notice_expired_sent_at, $today)) {
                    $noticeResult = $this->sendNotice(
                        $recipients,
                        '[ATHLIX SaaS] Akses Dojo Diblokir (Tagihan Jatuh Tempo)',
                        $this->buildExpiredBody($dojo, $expiryDate, $graceEnd),
                        $this->buildExpiredWhatsappBody($dojo, $expiryDate, $graceEnd)
                    );
                    $dojo->last_notice_expired_sent_at = $today->toDateString();
                    $summary['warned_expired']++;
                    $summary['whatsapp_sent'] += $noticeResult['whatsapp_sent'];
                    $summary['whatsapp_failed'] += $noticeResult['whatsapp_failed'];
                }

                if (! $dojo->is_saas_blocked) {
                    $dojo->is_saas_blocked = true;
                    $dojo->saas_block_reason = self::AUTO_BLOCK_REASON;
                    $dojo->blocked_at = now();
                    $summary['auto_blocked']++;
                }
            } elseif ($dojo->is_saas_blocked && $this->wasAutoBlocked($dojo)) {
                $dojo->is_saas_blocked = false;
                $dojo->saas_block_reason = null;
                $dojo->blocked_at = null;
                $summary['auto_unblocked']++;
            }

            if ($dojo->isDirty()) {
                $dojo->save();
            }
        }

        return $summary;
    }

    private function wasAutoBlocked(Dojo $dojo): bool
    {
        return str_starts_with((string) ($dojo->saas_block_reason ?? ''), 'AUTO:');
    }

    private function shouldSendToday(?Carbon $lastSentAt, Carbon $today): bool
    {
        return ! $lastSentAt || $lastSentAt->toDateString() !== $today->toDateString();
    }

    /**
     * @param Collection<int, User> $superAdmins
     * @return Collection<int, User>
     */
    private function resolveRecipients(Dojo $dojo, Collection $superAdmins): Collection
    {
        $dojoRecipients = User::query()
            ->where('dojo_id', $dojo->id)
            ->whereIn('role', ['dojo_admin', 'head_coach'])
            ->where(function ($query) {
                $query->whereNotNull('email')
                    ->orWhereNotNull('phone_number');
            })
            ->get(['id', 'name', 'email', 'phone_number']);

        return $dojoRecipients
            ->merge($superAdmins)
            ->unique(fn (User $user) => $user->email ?: ('phone:' . ($user->phone_number ?: $user->id)))
            ->values();
    }

    /**
     * @param Collection<int, User> $recipients
     */
    private function sendNotice(Collection $recipients, string $subject, string $body, string $whatsAppBody): array
    {
        $summary = [
            'whatsapp_sent' => 0,
            'whatsapp_failed' => 0,
        ];

        foreach ($recipients as $recipient) {
            if ($recipient->email) {
                Mail::raw($body, function ($message) use ($recipient, $subject) {
                    $message->to($recipient->email, $recipient->name)->subject($subject);
                });
            }
        }

        if (! $this->whatsAppGateway->isEnabled()) {
            return $summary;
        }

        $phoneRecipients = $recipients
            ->filter(fn (User $user) => filled($user->phone_number))
            ->unique(fn (User $user) => $this->whatsAppGateway->normalizePhone($user->phone_number) ?: $user->id)
            ->values();

        foreach ($phoneRecipients as $recipient) {
            $sent = $this->whatsAppGateway->sendText($recipient->phone_number, $whatsAppBody);
            if ($sent) {
                $summary['whatsapp_sent']++;
            } else {
                $summary['whatsapp_failed']++;
            }
        }

        return $summary;
    }

    private function buildReminderBody(Dojo $dojo, int $daysRemaining, Carbon $expiryDate): string
    {
        return implode(PHP_EOL, [
            "Dojo: {$dojo->name}",
            "Paket: " . ($dojo->saas_plan_name ?: '-'),
            "Sisa masa aktif: {$daysRemaining} hari",
            "Berakhir pada: {$expiryDate->toDateString()}",
            '',
            'Silakan proses pembayaran perpanjangan untuk menghindari pemblokiran akses otomatis.',
        ]);
    }

    private function buildExpiredBody(Dojo $dojo, Carbon $expiryDate, ?Carbon $graceEnd): string
    {
        return implode(PHP_EOL, [
            "Dojo: {$dojo->name}",
            "Paket: " . ($dojo->saas_plan_name ?: '-'),
            "Berakhir pada: {$expiryDate->toDateString()}",
            'Batas grace period: ' . ($graceEnd?->toDateString() ?: $expiryDate->toDateString()),
            '',
            'Akses tenant telah diblokir otomatis karena melewati masa berlangganan dan grace period.',
            'Silakan perpanjang subscription untuk mengaktifkan akses kembali.',
        ]);
    }

    private function buildReminderWhatsappBody(Dojo $dojo, int $daysRemaining, Carbon $expiryDate): string
    {
        return implode(PHP_EOL, [
            'ATHLIX SaaS Reminder',
            "Dojo: {$dojo->name}",
            "Sisa masa aktif: H-{$daysRemaining}",
            'Tanggal akhir: ' . $expiryDate->toDateString(),
            'Mohon proses perpanjangan agar akses tetap aktif.',
        ]);
    }

    private function buildExpiredWhatsappBody(Dojo $dojo, Carbon $expiryDate, ?Carbon $graceEnd): string
    {
        return implode(PHP_EOL, [
            'ATHLIX SaaS Notice',
            "Dojo: {$dojo->name}",
            'Langganan berakhir: ' . $expiryDate->toDateString(),
            'Grace period: ' . ($graceEnd?->toDateString() ?: $expiryDate->toDateString()),
            'Akses tenant diblokir otomatis. Silakan perpanjang untuk aktivasi kembali.',
        ]);
    }
}
