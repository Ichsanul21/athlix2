<?php

namespace App\Http\Controllers;

use App\Models\Athlete;
use App\Models\AthleteNotification;
use App\Models\AthleteNotificationRead;
use App\Models\Dojo;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SenpaiNotificationController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $requestedDojoId = request('dojo_id') ? (int) request('dojo_id') : null;
        $selectedDojoId = $this->resolveDojoId($user, $requestedDojoId);
        $isAllDojos = $user?->isSuperAdmin() && !$selectedDojoId;

        $athleteQuery = $this->scopeAthletesForUser(Athlete::query(), $user);
        if ($selectedDojoId) {
            $athleteQuery->where('dojo_id', $selectedDojoId);
        }
        $athleteIds = $athleteQuery->pluck('id');

        $notifications = AthleteNotification::query()
            ->with(['athlete:id,full_name,athlete_code', 'sender:id,name'])
            ->where(function ($query) use ($selectedDojoId, $athleteIds) {
                if ($selectedDojoId) {
                    $query->where('dojo_id', $selectedDojoId);
                }
                $query->orWhereIn('athlete_id', $athleteIds);
                $query->orWhere(function ($broadcastQuery) use ($selectedDojoId) {
                    $broadcastQuery->whereNull('athlete_id');
                    if ($selectedDojoId) {
                        $broadcastQuery->where(function ($dojoQuery) use ($selectedDojoId) {
                            $dojoQuery->whereNull('dojo_id')->orWhere('dojo_id', $selectedDojoId);
                        });
                    }
                    // isAllDojos: tampilkan semua broadcast tanpa filter dojo
                });
            })
            ->latest('published_at')
            ->latest('id')
            ->get()
            ->map(function (AthleteNotification $notification) {
                return [
                    'id'           => $notification->id,
                    'title'        => $notification->title,
                    'message'      => $notification->message,
                    'athlete_id'   => $notification->athlete_id,
                    'athlete_name' => $notification->athlete?->full_name,
                    'is_popup'     => (bool) $notification->is_popup,
                    'is_active'    => (bool) $notification->is_active,
                    'published_at' => optional($notification->published_at)->translatedFormat('d M Y H:i') ?? '-',
                    'expires_at'   => optional($notification->expires_at)->translatedFormat('d M Y H:i'),
                    'sender_name'  => $notification->sender?->name ?? 'System',
                ];
            });

        $athletes = $athleteQuery
            ->orderBy('full_name')
            ->get(['id', 'full_name', 'athlete_code']);

        return Inertia::render('Notifications/Index', [
            'notifications'  => Inertia::defer(fn () => $notifications),
            'athletes'       => Inertia::defer(fn () => $athletes),
            'dojos'          => Inertia::defer(fn () => $user?->isSuperAdmin() ? Dojo::orderBy('name')->get(['id', 'name']) : []),
            'selectedDojoId' => Inertia::defer(fn () => $isAllDojos ? null : $selectedDojoId),
            'isAllDojos'     => Inertia::defer(fn () => $isAllDojos),
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        $validated = $request->validate([
            'title' => 'required|string|max:150',
            'message' => 'required|string|max:2000',
            'athlete_id' => 'nullable|exists:athletes,id',
            'is_popup' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'published_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after_or_equal:published_at',
            'dojo_id' => $user?->isSuperAdmin() ? 'nullable|exists:dojos,id' : 'nullable',
        ]);

        $dojoId = $this->resolveDojoId($user, isset($validated['dojo_id']) ? (int) $validated['dojo_id'] : null);
        $targetAthleteId = isset($validated['athlete_id']) && $validated['athlete_id'] !== ''
            ? (int) $validated['athlete_id']
            : null;

        if (! $dojoId && $targetAthleteId === null) {
            return back()->with('error', 'Dojo target belum tersedia untuk notifikasi.');
        }

        if ($targetAthleteId !== null) {
            $athleteAllowed = $this->scopeAthletesForUser(Athlete::query(), $user)
                ->when($dojoId, fn ($query) => $query->where('dojo_id', $dojoId))
                ->whereKey($targetAthleteId)
                ->exists();

            if (! $athleteAllowed) {
                abort(403);
            }
        }

        AthleteNotification::create([
            'dojo_id' => $dojoId,
            'athlete_id' => $targetAthleteId,
            'sender_id' => $user?->id,
            'title' => $validated['title'],
            'message' => $validated['message'],
            'is_popup' => (bool) ($validated['is_popup'] ?? true),
            'is_active' => (bool) ($validated['is_active'] ?? true),
            'published_at' => $validated['published_at'] ?? now(),
            'expires_at' => $validated['expires_at'] ?? null,
        ]);

        return back()->with('success', 'Notifikasi senpai berhasil dikirim.');
    }

    public function update(Request $request, AthleteNotification $notification)
    {
        $this->authorizeNotification($notification, auth()->user());

        $validated = $request->validate([
            'title' => 'required|string|max:150',
            'message' => 'required|string|max:2000',
            'athlete_id' => 'nullable|exists:athletes,id',
            'is_popup' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'published_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after_or_equal:published_at',
        ]);

        $targetAthleteId = isset($validated['athlete_id']) && $validated['athlete_id'] !== ''
            ? (int) $validated['athlete_id']
            : null;

        if ($targetAthleteId !== null) {
            $athleteAllowed = $this->scopeAthletesForUser(Athlete::query(), auth()->user())
                ->when($notification->dojo_id, fn ($query) => $query->where('dojo_id', $notification->dojo_id))
                ->whereKey($targetAthleteId)
                ->exists();

            if (! $athleteAllowed) {
                abort(403);
            }
        }

        $notification->update([
            'title' => $validated['title'],
            'message' => $validated['message'],
            'athlete_id' => $targetAthleteId,
            'is_popup' => (bool) ($validated['is_popup'] ?? $notification->is_popup),
            'is_active' => (bool) ($validated['is_active'] ?? $notification->is_active),
            'published_at' => $validated['published_at'] ?? $notification->published_at,
            'expires_at' => $validated['expires_at'] ?? null,
        ]);

        return back()->with('success', 'Notifikasi berhasil diperbarui.');
    }

    public function destroy(AthleteNotification $notification)
    {
        $this->authorizeNotification($notification, auth()->user());
        $notification->delete();

        return back()->with('success', 'Notifikasi berhasil dihapus.');
    }

    public function markRead(Request $request, AthleteNotification $notification)
    {
        $user = auth()->user();
        $athlete = $this->resolvePwaAthleteForUser($request, $user);
        if (! $athlete) {
            abort(403);
        }

        $isTargeted = (int) $notification->athlete_id === (int) $athlete->id
            || (
                $notification->athlete_id === null
                && ($notification->dojo_id === null || (int) $notification->dojo_id === (int) $athlete->dojo_id)
            );

        if (! $isTargeted) {
            abort(403);
        }

        AthleteNotificationRead::updateOrCreate(
            [
                'notification_id' => $notification->id,
                'athlete_id' => $athlete->id,
            ],
            [
                'read_at' => now(),
            ]
        );

        if ($request->wantsJson()) {
            return response()->json(['ok' => true]);
        }

        return back()->with('success', 'Notifikasi ditandai sudah dibaca.');
    }

    public function feed(Request $request)
    {
        $user = auth()->user();
        $athlete = $this->resolvePwaAthleteForUser($request, $user);
        if (! $athlete) {
            abort(403);
        }

        $validated = $request->validate([
            'since_id' => 'nullable|integer|min:0',
        ]);
        $sinceId = (int) ($validated['since_id'] ?? 0);

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
            ->when($sinceId > 0, fn ($query) => $query->where('id', '>', $sinceId))
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

        $allActiveForUnread = AthleteNotification::query()
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
            ->pluck('id');

        $unreadCount = $allActiveForUnread
            ->filter(fn ($notificationId) => ! in_array($notificationId, $readIds, true))
            ->count();

        return response()->json([
            'items' => $items,
            'latest_popup' => $items->first(fn ($item) => $item['is_popup']),
            'unread_count' => $unreadCount,
        ]);
    }

    private function resolvePwaAthleteForUser(Request $request, $user): ?Athlete
    {
        if (! $user) {
            return null;
        }

        if ($user->isMurid() && $user->athlete_id) {
            return Athlete::find($user->athlete_id);
        }

        if (! $user->isParent()) {
            return null;
        }

        $linkedAthleteIds = $user->guardianAthletes()
            ->select('athletes.id')
            ->orderByDesc('athlete_guardians.is_primary')
            ->orderBy('athletes.full_name')
            ->pluck('athletes.id')
            ->values();

        if ($linkedAthleteIds->isEmpty()) {
            return null;
        }

        $requestedAthleteId = (int) $request->input('athlete_id', 0);
        if ($requestedAthleteId > 0 && $linkedAthleteIds->contains($requestedAthleteId)) {
            return Athlete::find($requestedAthleteId);
        }

        return Athlete::find((int) $linkedAthleteIds->first());
    }

    private function authorizeNotification(AthleteNotification $notification, $user): void
    {
        if (! $user) {
            abort(403);
        }

        if ($user->isSuperAdmin()) {
            return;
        }

        if (! $user->isSensei()) {
            abort(403);
        }

        if ((int) $notification->dojo_id !== (int) $user->dojo_id) {
            abort(403);
        }
    }
}
