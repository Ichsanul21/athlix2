<?php

namespace App\Http\Controllers;

use App\Models\Athlete;
use App\Models\Dojo;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class DojoAdminController extends Controller
{
    public function settings()
    {
        $user = auth()->user();
        $dojoId = $user?->dojo_id;
        
        if (! $dojoId) {
            return back()->with('error', 'Akun Anda belum terhubung dengan dojo.');
        }

        return Inertia::render('DojoAdmin/Settings', [
            'dojo' => Inertia::defer(fn () => Dojo::find($dojoId)),
        ]);
    }

    public function updateSettings(Request $request)
    {
        $user = auth()->user();
        $dojoId = $user?->dojo_id;

        if (! $dojoId) {
            return back()->with('error', 'Akun Anda belum terhubung dengan dojo.');
        }

        $dojo = Dojo::find($dojoId);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'address_detail' => ['nullable', 'string'],
            'contact_name' => ['nullable', 'string', 'max:255'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:50'],
            'accent_color' => ['nullable', 'string', 'max:50'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        if ($request->hasFile('logo')) {
            if ($dojo->logo_path) {
                Storage::disk('public')->delete($dojo->logo_path);
            }
            $validated['logo_path'] = $request->file('logo')->store('dojos/logos', 'public');
        }

        unset($validated['logo']);

        $dojo->update($validated);

        return back()->with('success', 'Pengaturan dojo berhasil disimpan.');
    }

    public function senseiIndex()
    {
        $user = auth()->user();
        $requestedDojoId = request('dojo_id') ? (int) request('dojo_id') : null;
        $dojoId = $this->resolveDojoId($user, $requestedDojoId);
        // Super admin: jika tidak ada filter dojo, tampilkan semua (null = semua dojo)
        $isAllDojos = $user?->isSuperAdmin() && !$dojoId;

        $senseis = User::query()
            ->whereIn('role', ['sensei', 'head_coach', 'assistant'])
            ->when(!$isAllDojos && $dojoId, fn ($q) => $q->where('dojo_id', $dojoId))
            ->with(['senseiAthletes:id,full_name,athlete_code', 'dojo:id,name'])
            ->orderBy('name')
            ->get()
            ->map(function (User $sensei) {
                return [
                    'id'                  => $sensei->id,
                    'name'                => $sensei->name,
                    'email'               => $sensei->email,
                    'role'                => $sensei->role,
                    'phone_number'        => $sensei->phone_number,
                    'profile_photo_path'  => $sensei->profile_photo_path,
                    'dojo_name'           => $sensei->dojo?->name,
                    'athlete_ids'         => $sensei->senseiAthletes->pluck('id')->values(),
                    'athletes'            => $sensei->senseiAthletes->map(fn ($a) => [
                        'id'           => $a->id,
                        'full_name'    => $a->full_name,
                        'athlete_code' => $a->athlete_code,
                    ])->values(),
                ];
            });

        $athletes = Athlete::query()
            ->when(!$isAllDojos && $dojoId, fn ($q) => $q->where('dojo_id', $dojoId))
            ->orderBy('full_name')
            ->get(['id', 'full_name', 'athlete_code', 'dojo_id']);

        $dojo = (!$isAllDojos && $dojoId) ? Dojo::find($dojoId) : null;

        return Inertia::render('DojoAdmin/Sensei', [
            'senseis'       => Inertia::defer(fn () => $senseis),
            'athletes'      => Inertia::defer(fn () => $athletes),
            'dojo'          => Inertia::defer(fn () => $dojo),
            'dojos'         => Inertia::defer(fn () => $user?->isSuperAdmin() ? Dojo::orderBy('name')->get(['id', 'name']) : []),
            'selectedDojoId'=> Inertia::defer(fn () => $isAllDojos ? null : $dojoId),
            'isAllDojos'    => Inertia::defer(fn () => $isAllDojos),
        ]);
    }

    public function storeSensei(Request $request)
    {
        $user = auth()->user();
        $dojoId = $this->resolveDojoId($user, $request->dojo_id ? (int) $request->dojo_id : null);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone_number' => 'nullable|string|max:20',
            'password' => 'required|string|min:8',
            'profile_photo' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120',
            'dojo_id' => $user?->isSuperAdmin() ? 'required|exists:dojos,id' : 'nullable',
        ]);

        if (!$dojoId) {
            return back()->with('error', 'Dojo belum terhubung. Hubungi super admin.');
        }

        $validated['dojo_id'] = $dojoId;
        $validated['role'] = 'sensei';

        if ($request->hasFile('profile_photo')) {
            $validated['profile_photo_path'] = $request->file('profile_photo')->store('profiles', 'public');
        }
        unset($validated['profile_photo']);
        $validated['password'] = Hash::make($validated['password']);

        User::create($validated);

        return back()->with('success', 'Sensei berhasil ditambahkan.');
    }

    public function updateSensei(Request $request, User $sensei)
    {
        $user = auth()->user();
        $dojoId = $user?->dojo_id;

        if ($sensei->role !== 'sensei' || (! $user?->isSuperAdmin() && $sensei->dojo_id !== $dojoId)) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $sensei->id,
            'phone_number' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:8',
            'profile_photo' => [
                Rule::requiredIf(empty($sensei->profile_photo_path)),
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
        ]);

        if ($request->hasFile('profile_photo')) {
            if ($sensei->profile_photo_path) {
                Storage::disk('public')->delete($sensei->profile_photo_path);
            }
            $validated['profile_photo_path'] = $request->file('profile_photo')->store('profiles', 'public');
        }
        unset($validated['profile_photo']);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $sensei->update($validated);

        return back()->with('success', 'Data sensei berhasil diperbarui.');
    }

    public function destroySensei(User $sensei)
    {
        $user = auth()->user();
        $dojoId = $user?->dojo_id;

        if ($sensei->role !== 'sensei' || (! $user?->isSuperAdmin() && $sensei->dojo_id !== $dojoId)) {
            abort(403);
        }

        if ($sensei->profile_photo_path) {
            Storage::disk('public')->delete($sensei->profile_photo_path);
        }

        $sensei->delete();

        return back()->with('success', 'Sensei berhasil dihapus.');
    }

    public function updateAssignments(Request $request, User $sensei)
    {
        $user = auth()->user();
        $dojoId = $sensei->dojo_id;

        if ($sensei->role !== 'sensei' || (! $user?->isSuperAdmin() && $sensei->dojo_id !== $user?->dojo_id)) {
            abort(403);
        }

        $validated = $request->validate([
            'athlete_ids' => 'array',
            'athlete_ids.*' => 'exists:athletes,id',
        ]);

        $athleteIds = collect($validated['athlete_ids'] ?? [])
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        $validAthletes = Athlete::query()
            ->whereIn('id', $athleteIds)
            ->where('dojo_id', $dojoId)
            ->pluck('id');

        $syncPayload = [];
        foreach ($validAthletes as $athleteId) {
            $syncPayload[$athleteId] = [
                'dojo_id' => $dojoId,
                'assigned_by' => auth()->id(),
            ];
        }

        $sensei->senseiAthletes()->sync($syncPayload);

        return back()->with('success', 'Penugasan atlet berhasil diperbarui.');
    }
}
