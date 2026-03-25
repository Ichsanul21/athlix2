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

class SuperAdminController extends Controller
{
    public function users()
    {
        return Inertia::render('SuperAdmin/Users', [
            'users' => Inertia::defer(fn () => User::query()->with('athlete')->orderBy('created_at', 'desc')->get()),
            'dojos' => Inertia::defer(fn () => Dojo::query()->orderBy('name')->get()),
            'athletes' => Inertia::defer(fn () => Athlete::query()->select('id', 'full_name', 'athlete_code', 'dojo_id', 'phone_number')->orderBy('full_name')->get()),
        ]);
    }

    public function storeUser(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone_number' => 'required|string|max:20',
            'password' => 'required|string|min:8',
            'role' => 'required|in:super_admin,landing_admin,sensei,murid',
            'dojo_id' => 'nullable|exists:dojos,id',
            'profile_photo' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120',
            'athlete_id' => [
                'nullable',
                'required_if:role,murid',
                'exists:athletes,id',
                Rule::unique('users', 'athlete_id'),
            ],
        ]);

        if (($validated['role'] ?? null) === 'murid' && !empty($validated['athlete_id'])) {
            $athlete = Athlete::find($validated['athlete_id']);
            $validated['name'] = $athlete?->full_name ?? $validated['name'];
            $validated['dojo_id'] = $athlete?->dojo_id;
            if ($athlete && !empty($validated['phone_number'])) {
                $athlete->update(['phone_number' => $validated['phone_number']]);
            }
        } else {
            $validated['athlete_id'] = null;
        }

        if ($request->hasFile('profile_photo')) {
            $validated['profile_photo_path'] = $request->file('profile_photo')->store('profiles', 'public');
        }
        unset($validated['profile_photo']);
        $validated['password'] = Hash::make($validated['password']);

        User::create($validated);

        return back()->with('success', 'Akun baru berhasil dibuat.');
    }

    public function updateUser(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'phone_number' => 'required|string|max:20',
            'role' => 'required|in:super_admin,landing_admin,sensei,murid',
            'dojo_id' => 'nullable|exists:dojos,id',
            'password' => 'nullable|string|min:8',
            'profile_photo' => [
                Rule::requiredIf(fn () => empty($user->profile_photo_path)),
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
            'athlete_id' => [
                'nullable',
                'required_if:role,murid',
                'exists:athletes,id',
                Rule::unique('users', 'athlete_id')->ignore($user->id),
            ],
        ]);

        if (($validated['role'] ?? null) === 'murid' && !empty($validated['athlete_id'])) {
            $athlete = Athlete::find($validated['athlete_id']);
            $validated['name'] = $athlete?->full_name ?? $validated['name'];
            $validated['dojo_id'] = $athlete?->dojo_id;
            if ($athlete && !empty($validated['phone_number'])) {
                $athlete->update(['phone_number' => $validated['phone_number']]);
            }
        } else {
            $validated['athlete_id'] = null;
        }

        if ($request->hasFile('profile_photo')) {
            if ($user->profile_photo_path) {
                Storage::disk('public')->delete($user->profile_photo_path);
            }

            $validated['profile_photo_path'] = $request->file('profile_photo')->store('profiles', 'public');
        }
        unset($validated['profile_photo']);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return back()->with('success', 'Akun berhasil diperbarui.');
    }

    public function destroyUser(User $user)
    {
        if ($user->id === auth()->id()) {
            return back()->with('error', 'Tidak bisa menghapus akun sendiri.');
        }

        if ($user->profile_photo_path) {
            Storage::disk('public')->delete($user->profile_photo_path);
        }

        $user->delete();

        return back()->with('success', 'Akun berhasil dihapus.');
    }
}
