<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user) {
            return $next($request);
        }

        if ($user->isSuperAdmin() || $user->isLandingAdmin()) {
            return $next($request);
        }

        if (! $user->dojo_id) {
            return $next($request);
        }

        $dojo = $user->dojo()->first();
        if (! $dojo || $dojo->canAccessSaas()) {
            return $next($request);
        }

        $status = $dojo->accessStatusLabel();
        
        $message = "Maaf, akses dashboard telah ditutup. Masa berlangganan atau paket uji coba (Trial) klub Anda telah berakhir. Silakan lakukan pembayaran paket atau hubungi Admin Athlix untuk mengaktifkan kembali fitur pengelolaan klub Anda.";

        if ($status === 'Grace Tahap 2 (Terbatas)') {
            $message = "Masa tenggang pembayaran paket klub Anda telah memasuki tahap akhir (Terbatas). Sebagian fitur telah dibatasi. Silakan lakukan pembayaran segera agar akses penuh dashboard tetap dapat digunakan.";
        } elseif ($status === 'Diblokir Manual') {
            $message = "Akses klub Anda telah diblokir secara manual oleh sistem karena alasan kepatuhan atau pelanggaran Syarat & Ketentuan. Silakan hubungi dukungan pusat untuk informasi lebih lanjut.";
        } elseif ($status === 'Nonaktif') {
            $message = "Klub ini saat ini dalam status Nonaktif. Silakan hubungi administrator klub Anda atau pusat bantuan Athlix.";
        }

        if ($request->expectsJson()) {
            return response()->json([
                'message' => $message,
                'tenant_status' => $status,
            ], 423);
        }

        Auth::guard('web')->logout();
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return redirect()->route('login')->withErrors([
            'identifier' => $message,
        ]);
    }
}
