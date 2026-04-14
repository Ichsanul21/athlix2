<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Models\Athlete;
use App\Models\Dojo;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form with role-specific data.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        $athleteData = null;
        $guardianData = null;
        $dojoData = null;

        // Load athlete profile for atlet role
        if ($user?->athlete_id) {
            $athleteData = Athlete::with([
                'level:id,name',
                'dojo:id,name',
                'guardians' => fn ($q) => $q->withPivot(['relation_type', 'is_primary'])->orderByPivot('is_primary', 'desc'),
                'latestReport',
            ])->find($user->athlete_id);

            if ($athleteData) {
                $athleteData->photo_url  = $athleteData->photo_path ? Storage::url($athleteData->photo_path) : null;
                $athleteData->documents  = [
                    'kk'   => $athleteData->doc_kk_path   ? Storage::url($athleteData->doc_kk_path)   : null,
                    'akte' => $athleteData->doc_akte_path  ? Storage::url($athleteData->doc_akte_path)  : null,
                    'ktp'  => $athleteData->doc_ktp_path   ? Storage::url($athleteData->doc_ktp_path)   : null,
                ];
                $guardianData = $athleteData->guardians->firstWhere('pivot.is_primary', true);
            }
        }

        // Load parent data for parent role
        if ($user?->isParent()) {
            $linkedAthletes = $user->guardianAthletes()
                ->with(['level:id,name', 'dojo:id,name'])
                ->withPivot(['relation_type', 'is_primary'])
                ->orderByPivot('is_primary', 'desc')
                ->get()
                ->map(fn ($a) => [
                    'id'           => $a->id,
                    'full_name'    => $a->full_name,
                    'athlete_code' => $a->athlete_code,
                    'level'         => $a->level?->name,
                    'dojo'         => $a->dojo?->name,
                    'relation_type' => $a->pivot->relation_type,
                    'is_primary'   => (bool) $a->pivot->is_primary,
                ]);
            $athleteData = ['linked_athletes' => $linkedAthletes];
        }

        // Load dojo data for admin/sensei roles
        if ($user?->dojo_id && ! $user?->isParent() && ! $user?->athlete_id) {
            $dojoData = Dojo::find($user->dojo_id)?->only([
                'id', 'name', 'contact_name', 'contact_email', 'contact_phone',
                'province_name', 'regency_name', 'district_name', 'address_detail',
                'timezone', 'saas_plan_name', 'subscription_started_at',
                'subscription_expires_at', 'grace_period_stage1_ends_at',
                'grace_period_ends_at', 'is_active', 'is_saas_blocked',
            ]);
        }

        $profilePhotoUrl = $user?->profile_photo_path ? Storage::url($user->profile_photo_path) : null;

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => Inertia::defer(fn () => $user instanceof MustVerifyEmail),
            'status'          => Inertia::defer(fn () => session('status')),
            'profilePhotoUrl' => $profilePhotoUrl,
            'athleteData'     => Inertia::defer(fn () => $athleteData),
            'guardianData'    => Inertia::defer(fn () => $guardianData),
            'dojoData'        => Inertia::defer(fn () => $dojoData),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $user = $request->user();

        if ($request->hasFile('profile_photo')) {
            if ($user->profile_photo_path) {
                Storage::disk('public')->delete($user->profile_photo_path);
            }

            $validated['profile_photo_path'] = $request->file('profile_photo')->store('profiles', 'public');
        }

        unset($validated['profile_photo']);

        $user->fill($validated);

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        if ($user->athlete_id && $user->phone_number) {
            $user->athlete()?->update([
                'phone_number' => $user->phone_number,
            ]);
        }

        if ($request->headers->has('referer')) {
            return Redirect::back()->with('success', 'Data akun berhasil diperbarui.');
        }

        return Redirect::route('profile.edit')->with('success', 'Data akun berhasil diperbarui.');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        if ($user->profile_photo_path) {
            Storage::disk('public')->delete($user->profile_photo_path);
        }

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
