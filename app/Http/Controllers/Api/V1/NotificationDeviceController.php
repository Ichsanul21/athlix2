<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\NotificationDevice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationDeviceController extends Controller
{
    private function resolveTenantId($user): int
    {
        if ($user?->dojo_id) {
            return (int) $user->dojo_id;
        }

        if ($user?->athlete_id && $user->athlete) {
            return (int) $user->athlete->dojo_id;
        }

        return 0;
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $tenantId = $this->resolveTenantId($user);
        if ($tenantId <= 0) {
            return response()->json(['items' => []]);
        }

        $items = NotificationDevice::query()
            ->where('tenant_id', $tenantId)
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->latest('last_seen_at')
            ->get();

        return response()->json(['items' => $items]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'platform' => 'required|in:webpush,android,ios',
            'device_label' => 'nullable|string|max:120',
            'push_token' => 'required|string|min:20|max:4096',
        ]);

        $user = $request->user();
        $tenantId = $this->resolveTenantId($user);
        if ($tenantId <= 0) {
            abort(422, 'Tenant context is required.');
        }
        $tokenHash = hash('sha256', $validated['push_token']);

        $device = NotificationDevice::query()->updateOrCreate(
            ['token_hash' => $tokenHash],
            [
                'tenant_id' => $tenantId,
                'user_id' => $user->id,
                'platform' => $validated['platform'],
                'device_label' => $validated['device_label'] ?? null,
                'push_token' => $validated['push_token'],
                'last_seen_at' => now(),
                'is_active' => true,
            ]
        );

        return response()->json([
            'message' => 'Device registered.',
            'item' => $device,
        ], 201);
    }

    public function destroy(Request $request, NotificationDevice $device): JsonResponse
    {
        $user = $request->user();
        if ((int) $device->user_id !== (int) $user->id) {
            abort(403);
        }

        $device->update(['is_active' => false]);

        return response()->json(['message' => 'Device deactivated.']);
    }
}
