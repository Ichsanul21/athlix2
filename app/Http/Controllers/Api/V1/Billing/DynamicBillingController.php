<?php

namespace App\Http\Controllers\Api\V1\Billing;

use App\Http\Controllers\Controller;
use App\Models\AthleteBillingOverride;
use App\Models\BillingOverrideRequest as BillingOverrideRequestModel;
use App\Models\BillingDefault;
use App\Models\BillingInvoice;
use App\Services\Billing\DynamicBillingService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DynamicBillingController extends Controller
{
    private function resolveTenantId($user, ?int $explicitTenantId = null): int
    {
        if ($user->isSuperAdmin()) {
            return (int) ($explicitTenantId ?? $user->dojo_id);
        }

        $userTenantId = (int) ($user->dojo_id ?? 0);
        if ($explicitTenantId !== null && (int) $explicitTenantId !== $userTenantId) {
            abort(403, 'Cross-tenant access is not allowed.');
        }

        return $userTenantId;
    }

    private function ensureBillingAdmin($user): void
    {
        if (! $user->isSuperAdmin() && ! $user->isDojoAdmin()) {
            abort(403);
        }
    }

    private function ensureBillingRequester($user): void
    {
        if (! ($user->isCoachGroup() || $user->isParent())) {
            abort(403);
        }
    }

    public function defaults(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->ensureBillingAdmin($user);

        $tenantId = $this->resolveTenantId($user, $request->integer('tenant_id'));
        if ($tenantId <= 0) {
            abort(422, 'Tenant context is required.');
        }

        // PERBAIKAN: Sort by created_at DESC, bukan effective_from
        // Karena effective_from bisa null (otomatis dari now()) dan null
        // selalu di urutan terbawah pada DESC.
        $items = BillingDefault::query()
            ->where('tenant_id', $tenantId)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['items' => $items]);
    }

    public function storeDefault(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->ensureBillingAdmin($user);

        $validated = $request->validate([
            'tenant_id' => 'nullable|integer|exists:dojos,id',
            'belt_id' => 'nullable|integer|exists:belts,id',
            'class_note' => 'nullable|string|max:255',
            'monthly_fee' => 'required|numeric|min:0',
            'effective_from' => 'nullable|date',
            'effective_to' => 'nullable|date|after_or_equal:effective_from',
            'is_active' => 'nullable|boolean',
        ]);

        $tenantId = $this->resolveTenantId($user, isset($validated['tenant_id']) ? (int) $validated['tenant_id'] : null);
        if ($tenantId <= 0) {
            abort(422, 'Tenant context is required.');
        }

        // PERBAIKAN: Nonaktifkan default sebelumnya dan set effective_to = now()
        $now = now();
        BillingDefault::query()
            ->where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->update([
                'is_active' => false,
                'effective_to' => $now,
            ]);

        $item = BillingDefault::query()->create([
            'tenant_id' => $tenantId,
            'belt_id' => $validated['belt_id'] ?? null,
            'class_note' => $validated['class_note'] ?? null,
            'monthly_fee' => round((float) $validated['monthly_fee'], 2),
            // PERBAIKAN: Jika effective_from tidak dikirim, otomatis pakai now()
            'effective_from' => !empty($validated['effective_from'])
                ? Carbon::parse($validated['effective_from'])
                : $now,
            'effective_to' => null,
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Billing default created.',
            'item' => $item,
        ], 201);
    }

    public function storeOverride(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->ensureBillingAdmin($user);

        $validated = $request->validate([
            'tenant_id' => 'nullable|integer|exists:dojos,id',
            'athlete_id' => 'required|integer|exists:athletes,id',
            'override_mode' => 'required|in:fixed,discount_amount,discount_percent',
            'override_value' => 'required|numeric|min:0',
            'reason' => 'nullable|string|max:255',
            'valid_from' => 'nullable|date',
            'valid_to' => 'nullable|date|after_or_equal:valid_from',
        ]);

        $tenantId = $this->resolveTenantId($user, isset($validated['tenant_id']) ? (int) $validated['tenant_id'] : null);
        if ($tenantId <= 0) {
            abort(422, 'Tenant context is required.');
        }

        $item = AthleteBillingOverride::query()->create([
            'tenant_id' => $tenantId,
            'athlete_id' => (int) $validated['athlete_id'],
            'override_mode' => $validated['override_mode'],
            'override_value' => round((float) $validated['override_value'], 2),
            'reason' => $validated['reason'] ?? null,
            'valid_from' => $validated['valid_from'] ?? null,
            'valid_to' => $validated['valid_to'] ?? null,
            'created_by' => $user->id,
        ]);

        return response()->json([
            'message' => 'Athlete billing override saved.',
            'item' => $item,
        ], 201);
    }

    public function generate(Request $request, DynamicBillingService $service): JsonResponse
    {
        $user = $request->user();
        $this->ensureBillingAdmin($user);

        $validated = $request->validate([
            'tenant_id' => 'nullable|integer|exists:dojos,id',
            'period' => 'nullable|date_format:Y-m',
            'due_date' => 'nullable|date',
            'mirror_legacy_finance' => 'nullable|boolean',
        ]);

        $tenantId = $this->resolveTenantId($user, isset($validated['tenant_id']) ? (int) $validated['tenant_id'] : null);
        if ($tenantId <= 0) {
            abort(422, 'Tenant context is required.');
        }

        $periodStart = ! empty($validated['period'])
            ? Carbon::createFromFormat('Y-m', $validated['period'])->startOfMonth()
            : now()->startOfMonth();

        $dueDate = ! empty($validated['due_date']) ? Carbon::parse($validated['due_date']) : null;

        $run = $service->generateMonthlyInvoices(
            $tenantId,
            $periodStart,
            $dueDate,
            $user->id,
            (bool) ($validated['mirror_legacy_finance'] ?? true)
        );

        return response()->json([
            'message' => 'Invoice run completed.',
            'run' => $run,
        ]);
    }

    public function invoices(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tenant_id' => 'nullable|integer|exists:dojos,id',
            'athlete_id' => 'nullable|integer|exists:athletes,id',
            'status' => 'nullable|in:draft,unpaid,partial,paid,overdue,void',
            'limit' => 'nullable|integer|min:1|max:200',
        ]);

        $user = $request->user();
        $tenantId = $this->resolveTenantId($user, isset($validated['tenant_id']) ? (int) $validated['tenant_id'] : null);
        if ($tenantId <= 0) {
            abort(422, 'Tenant context is required.');
        }

        $limit = (int) ($validated['limit'] ?? 50);
        $query = BillingInvoice::query()
            ->with(['athlete:id,full_name,athlete_code', 'items'])
            ->where('tenant_id', $tenantId)
            ->latest('period_start')
            ->latest('id');

        if (! empty($validated['athlete_id'])) {
            $query->where('athlete_id', $validated['athlete_id']);
        }

        if (! empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        if ($user->isMurid() && $user->athlete_id) {
            $query->where('athlete_id', $user->athlete_id);
        }

        return response()->json([
            'items' => $query->limit($limit)->get(),
        ]);
    }

    public function overrides(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tenant_id' => 'nullable|integer|exists:dojos,id',
            'athlete_id' => 'nullable|integer|exists:athletes,id',
            'limit' => 'nullable|integer|min:1|max:200',
        ]);

        $user = $request->user();
        $this->ensureBillingAdmin($user);

        $tenantId = $this->resolveTenantId($user, isset($validated['tenant_id']) ? (int) $validated['tenant_id'] : null);
        if ($tenantId <= 0) {
            abort(422, 'Tenant context is required.');
        }

        $limit = (int) ($validated['limit'] ?? 50);
        $query = AthleteBillingOverride::query()
            ->with([
                'athlete:id,full_name,athlete_code',
                'creator:id,name',
            ])
            ->where('tenant_id', $tenantId)
            ->latest('id');

        if (! empty($validated['athlete_id'])) {
            $query->where('athlete_id', $validated['athlete_id']);
        }

        return response()->json([
            'items' => $query->limit($limit)->get(),
        ]);
    }

    public function overrideRequests(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tenant_id' => 'nullable|integer|exists:dojos,id',
            'athlete_id' => 'nullable|integer|exists:athletes,id',
            'status' => 'nullable|in:pending,approved,rejected',
            'limit' => 'nullable|integer|min:1|max:200',
        ]);

        $user = $request->user();
        $this->ensureBillingRequester($user);

        $tenantId = $this->resolveTenantId($user, isset($validated['tenant_id']) ? (int) $validated['tenant_id'] : null);
        if ($tenantId <= 0) {
            abort(422, 'Tenant context is required.');
        }

        $limit = (int) ($validated['limit'] ?? 50);
        $query = BillingOverrideRequestModel::query()
            ->with([
                'athlete:id,full_name,athlete_code',
                'requester:id,name',
                'reviewer:id,name',
            ])
            ->where('tenant_id', $tenantId)
            ->latest('id');

        if (! empty($validated['athlete_id'])) {
            $query->where('athlete_id', $validated['athlete_id']);
        }
        if (! empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        if (! $user->isSuperAdmin() && ! $user->isDojoAdmin()) {
            $query->where('requested_by', $user->id);
        }

        return response()->json([
            'items' => $query->limit($limit)->get(),
        ]);
    }

    public function storeOverrideRequest(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tenant_id' => 'nullable|integer|exists:dojos,id',
            'athlete_id' => 'required|integer|exists:athletes,id',
            'override_mode' => 'required|in:fixed,discount_amount,discount_percent',
            'override_value' => 'required|numeric|min:0',
            'reason' => 'nullable|string|max:255',
            'valid_from' => 'nullable|date',
            'valid_to' => 'nullable|date|after_or_equal:valid_from',
        ]);

        $user = $request->user();
        $this->ensureBillingRequester($user);

        $tenantId = $this->resolveTenantId($user, isset($validated['tenant_id']) ? (int) $validated['tenant_id'] : null);
        if ($tenantId <= 0) {
            abort(422, 'Tenant context is required.');
        }

        $item = BillingOverrideRequestModel::query()->create([
            'tenant_id' => $tenantId,
            'athlete_id' => (int) $validated['athlete_id'],
            'override_mode' => $validated['override_mode'],
            'override_value' => round((float) $validated['override_value'], 2),
            'reason' => $validated['reason'] ?? null,
            'valid_from' => $validated['valid_from'] ?? null,
            'valid_to' => $validated['valid_to'] ?? null,
            'status' => 'pending',
            'requested_by' => $user->id,
        ]);

        return response()->json([
            'message' => 'Override request submitted.',
            'item' => $item,
        ], 201);
    }

    public function reviewOverrideRequest(Request $request, BillingOverrideRequestModel $overrideRequest): JsonResponse
    {
        $validated = $request->validate([
            'decision' => 'required|in:approved,rejected',
            'review_note' => 'nullable|string|max:255',
        ]);

        $user = $request->user();
        $this->ensureBillingAdmin($user);

        if ($overrideRequest->status !== 'pending') {
            abort(422, 'Request already reviewed.');
        }

        $tenantId = $this->resolveTenantId($user);
        if (! $user->isSuperAdmin() && (int) $overrideRequest->tenant_id !== $tenantId) {
            abort(403);
        }

        $updated = DB::transaction(function () use ($validated, $overrideRequest, $user) {
            $appliedOverrideId = null;
            if ($validated['decision'] === 'approved') {
                $applied = AthleteBillingOverride::query()->create([
                    'tenant_id' => $overrideRequest->tenant_id,
                    'athlete_id' => $overrideRequest->athlete_id,
                    'override_mode' => $overrideRequest->override_mode,
                    'override_value' => $overrideRequest->override_value,
                    'reason' => $overrideRequest->reason,
                    'valid_from' => $overrideRequest->valid_from,
                    'valid_to' => $overrideRequest->valid_to,
                    'created_by' => $user->id,
                ]);
                $appliedOverrideId = $applied->id;
            }

            $overrideRequest->update([
                'status' => $validated['decision'],
                'review_note' => $validated['review_note'] ?? null,
                'reviewed_by' => $user->id,
                'reviewed_at' => now(),
                'applied_override_id' => $appliedOverrideId,
            ]);

            return $overrideRequest->fresh(['athlete:id,full_name,athlete_code', 'requester:id,name', 'reviewer:id,name']);
        });

        return response()->json([
            'message' => 'Override request reviewed.',
            'item' => $updated,
        ]);
    }
}
