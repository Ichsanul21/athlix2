<?php

namespace App\Http\Middleware;

use App\Models\Athlete;
use App\Models\AthleteNotification;
use App\Models\AthleteNotificationRead;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Inertia\Inertia;
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
                if (! $user || ! $user->isMurid() || ! $user->athlete_id) {
                    return [
                        'items' => [],
                        'latest_popup' => null,
                        'unread_count' => 0,
                    ];
                }

                $athlete = Athlete::find($user->athlete_id);
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
        ];
    }
}
