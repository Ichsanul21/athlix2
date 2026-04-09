<?php

namespace App\Http\Middleware;

use App\Models\Athlete;
use App\Models\AthleteNotification;
use App\Models\AthleteNotificationRead;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Inertia\Inertia;
use App\Models\Dojo;
use App\Models\BillingInvoice;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $resolveMediaUrl = static function (?string $path): ?string {
            if (! $path) {
                return null;
            }

            $normalized = ltrim($path, '/');

            if (str_starts_with($normalized, 'seed/')) {
                return asset($normalized);
            }

            if (! str_contains($normalized, '/') && str_ends_with($normalized, '-placeholder.svg')) {
                return asset('seed/' . $normalized);
            }

            if (str_starts_with($normalized, 'storage/')) {
                return asset($normalized);
            }

            return asset('storage/' . $normalized);
        };

        return [
            ...parent::share($request),
            'auth' => [
                'user' => Inertia::defer(function () use ($request, $resolveMediaUrl) {
                    $user = $request->user();
                    if (! $user) {
                        return null;
                    }

                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'phone_number' => $user->phone_number,
                        'profile_photo_path' => $user->profile_photo_path,
                        'profile_photo_url' => $resolveMediaUrl($user->profile_photo_path),
                        'role' => $user->role ?? null,
                        'dojo_id' => $user->dojo_id ?? null,
                        'email_verified_at' => $user->email_verified_at,
                    ];
                }),
                'dojo_branding' => Inertia::defer(function () use ($request, $resolveMediaUrl) {
                    $user = $request->user();
                    if (! $user || ! $user->dojo_id) {
                        return null;
                    }
                    
                    $dojo = \App\Models\Dojo::find($user->dojo_id);
                    if (! $dojo) {
                        return null;
                    }

                    return [
                        'logo_url' => $dojo->logo_path ? $resolveMediaUrl($dojo->logo_path) : null,
                        'accent_color' => $dojo->accent_color ?? '#dc2626',
                    ];
                }),
                'dojo' => Inertia::defer(function () use ($request) {
                    $user = $request->user();
                    if (! $user || ! $user->dojo_id) {
                        return null;
                    }
                    $dojo = \App\Models\Dojo::find($user->dojo_id);
                    if (! $dojo) {
                        return null;
                    }
                    return [
                        'id' => $dojo->id,
                        'name' => $dojo->name,
                        'saas_plan_name' => $dojo->saas_plan_name ?? 'Basic',
                    ];
                }),
            ],
            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'flash' => fn () => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'warning' => $request->session()->get('warning'),
            ],
            'pwaNotifications' => Inertia::defer(function () use ($request) {
                $user = $request->user();
                if (! $user) {
                    return [
                        'items' => [],
                        'latest_popup' => null,
                        'unread_count' => 0,
                    ];
                }

                $athlete = null;
                if ($user->isMurid() && $user->athlete_id) {
                    $athlete = Athlete::find($user->athlete_id);
                } elseif ($user->isParent()) {
                    $linkedAthleteIds = $user->guardianAthletes()
                        ->select('athletes.id')
                        ->orderByDesc('athlete_guardians.is_primary')
                        ->orderBy('athletes.full_name')
                        ->pluck('athletes.id')
                        ->values();

                    if ($linkedAthleteIds->isNotEmpty()) {
                        $requestedAthleteId = (int) $request->input('athlete_id', 0);
                        $resolvedAthleteId = ($requestedAthleteId > 0 && $linkedAthleteIds->contains($requestedAthleteId))
                            ? $requestedAthleteId
                            : (int) $linkedAthleteIds->first();
                        $athlete = Athlete::find($resolvedAthleteId);
                    }
                }

                if (! $athlete) {
                    return [
                        'items' => [],
                        'latest_popup' => null,
                        'unread_count' => 0,
                    ];
                }

                $notifications = AthleteNotification::query()
                    ->where('is_active', true)
                    ->where(function ($query) use ($athlete) {
                        $query->where('athlete_id', $athlete->id)
                            ->orWhere(function ($broadcastQuery) use ($athlete) {
                                $broadcastQuery->whereNull('athlete_id')
                                    ->where(function ($dojoQuery) use ($athlete) {
                                        $dojoQuery->whereNull('dojo_id')
                                            ->orWhere('dojo_id', $athlete->dojo_id);
                                    });
                            });
                    })
                    ->where(function ($query) {
                        $query->whereNull('published_at')->orWhere('published_at', '<=', now());
                    })
                    ->where(function ($query) {
                        $query->whereNull('expires_at')->orWhere('expires_at', '>=', now());
                    })
                    ->orderByDesc('published_at')
                    ->orderByDesc('id')
                    ->take(20)
                    ->get(['id', 'title', 'message', 'is_popup', 'published_at', 'created_at']);

                $readIds = AthleteNotificationRead::query()
                    ->where('athlete_id', $athlete->id)
                    ->pluck('notification_id')
                    ->all();

                $items = $notifications->map(function ($notification) use ($readIds) {
                    return [
                        'id' => $notification->id,
                        'title' => $notification->title,
                        'message' => $notification->message,
                        'is_popup' => (bool) $notification->is_popup,
                        'is_read' => in_array($notification->id, $readIds, true),
                        'published_at' => optional($notification->published_at ?? $notification->created_at)->toIso8601String(),
                        'published_label' => optional($notification->published_at ?? $notification->created_at)->translatedFormat('d M Y H:i'),
                    ];
                })->values();

                return [
                    'items' => $items,
                    'latest_popup' => $items->first(fn ($item) => $item['is_popup']),
                    'unread_count' => $items->where('is_read', false)->count(),
                ];
            }),
            'billing' => Inertia::defer(function () use ($request) {
                $user = $request->user();
                if (!$user || $user->isSuperAdmin()) {
                    return null;
                }

                $dojo = $user->dojo;
                if (!$dojo) return null;

                $statusLabel = $dojo->accessStatusLabel();
                $clubStatus = [
                    'is_grace' => $statusLabel === 'Grace Tahap 1 (Peringatan)',
                    'is_expired' => in_array($statusLabel, ['Grace Tahap 2 (Terbatas)', 'Expired']),
                    'remaining_days' => $dojo->remaining_days,
                    'expires_at' => $dojo->subscription_expires_at?->toDateString(),
                ];

                $userBilling = [
                    'has_unpaid' => false,
                    'grace_invoices' => [],
                ];

                if ($user->isAtlet() || $user->isParent()) {
                    $athleteIds = [];
                    if ($user->isAtlet() && $user->athlete_id) {
                        $athleteIds = [$user->athlete_id];
                    } elseif ($user->isParent()) {
                        $athleteIds = $user->guardianAthletes()->pluck('athletes.id')->toArray();
                    }

                    if (!empty($athleteIds)) {
                        $unpaidInvoices = \App\Models\BillingInvoice::query()
                            ->whereIn('athlete_id', $athleteIds)
                            ->whereNull('paid_at')
                            ->where('due_date', '<=', now())
                            ->get();

                        if ($unpaidInvoices->isNotEmpty()) {
                            $userBilling['has_unpaid'] = true;
                            $userBilling['grace_invoices'] = $unpaidInvoices->map(fn($inv) => [
                                'id' => $inv->id,
                                'title' => $inv->title,
                                'due_date' => $inv->due_date?->toDateString(),
                                'total' => $inv->total_due,
                                'is_grace' => now()->diffInDays($inv->due_date, false) >= -7,
                            ]);
                        }
                    }
                }

                return [
                    'club' => $clubStatus,
                    'user' => $userBilling,
                ];
            }),
        ];
    }
}
