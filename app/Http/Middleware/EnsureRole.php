<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        $legacyRoleAllowed = in_array($user->role, ['atlet', 'athlete'], true) && in_array('murid', $roles, true);

        if (empty($roles) || in_array($user->role, $roles, true) || $legacyRoleAllowed) {
            return $next($request);
        }

        return redirect()->route(match ($user->role) {
            'atlet' => 'pwa.home',
            'murid' => 'pwa.home',
            'athlete' => 'pwa.home',
            'landing_admin' => 'cms.index',
            'dojo_admin' => 'dashboard',
            'parent' => 'pwa.home',
            'medical_staff' => 'dashboard',
            'head_coach' => 'dashboard',
            'assistant' => 'dashboard',
            default => 'dashboard',
        })->with('error', 'Anda tidak memiliki akses ke halaman tersebut.');
    }
}
