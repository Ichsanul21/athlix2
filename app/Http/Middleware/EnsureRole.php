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

        if (empty($roles) || in_array($user->role, $roles, true)) {
            return $next($request);
        }

        return redirect()->route(match ($user->role) {
            'murid' => 'pwa.home',
            'landing_admin' => 'cms.index',
            'dojo_admin' => 'dojo-admin.sensei.index',
            default => 'dashboard',
        })->with('error', 'Anda tidak memiliki akses ke halaman tersebut.');
    }
}
