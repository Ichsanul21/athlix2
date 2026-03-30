import { Head, useForm } from '@inertiajs/react';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export default function ChangePassword({ auth }) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('password.change.update'));
    };

    const strength = (() => {
        const p = data.password;
        if (!p) return 0;
        let score = 0;
        if (p.length >= 8) score++;
        if (p.length >= 12) score++;
        if (/[A-Z]/.test(p)) score++;
        if (/[0-9]/.test(p)) score++;
        if (/[^A-Za-z0-9]/.test(p)) score++;
        return score;
    })();

    const strengthLabel = ['', 'Lemah', 'Cukup', 'Sedang', 'Kuat', 'Sangat Kuat'][strength] ?? '';
    const strengthColor = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-emerald-500'][strength] ?? 'bg-neutral-200';

    return (
        <>
            <Head title="Ganti Password — Athlix" />

            <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center p-4">
                {/* Decorative orb */}
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="relative w-full max-w-md">
                    {/* Logo / Brand */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-athlix-red to-red-700 shadow-xl shadow-red-900/40 mb-4">
                            <ShieldCheck className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-white uppercase">
                            Ganti Password
                        </h1>
                        <p className="mt-2 text-sm text-neutral-400">
                            Akun Anda memerlukan password baru sebelum bisa melanjutkan.
                        </p>
                    </div>

                    {/* Card */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                        {/* Info box */}
                        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 mb-6">
                            <Lock className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-red-300 leading-relaxed">
                                Password default sistem tidak boleh digunakan kembali.
                                Buat password baru yang kuat dan mudah diingat.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Password baru */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">
                                    Password Baru
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Minimal 8 karakter"
                                        className="w-full bg-white/5 border border-white/10 text-white placeholder-neutral-500 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-athlix-red/60 focus:ring-1 focus:ring-athlix-red/30 transition"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300 transition"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>

                                {/* Strength bar */}
                                {data.password && (
                                    <div className="mt-2 space-y-1">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <div
                                                    key={i}
                                                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                                        i <= strength ? strengthColor : 'bg-white/10'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs text-neutral-500">
                                            Kekuatan: <span className="text-neutral-300 font-medium">{strengthLabel}</span>
                                        </p>
                                    </div>
                                )}

                                {errors.password && (
                                    <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>
                                )}
                            </div>

                            {/* Konfirmasi */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">
                                    Konfirmasi Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        placeholder="Ulangi password baru"
                                        className="w-full bg-white/5 border border-white/10 text-white placeholder-neutral-500 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-athlix-red/60 focus:ring-1 focus:ring-athlix-red/30 transition"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300 transition"
                                    >
                                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {data.password && data.password_confirmation && data.password === data.password_confirmation && (
                                    <p className="mt-1.5 text-xs text-emerald-400 flex items-center gap-1">
                                        <ShieldCheck size={12} /> Password cocok
                                    </p>
                                )}
                                {errors.password_confirmation && (
                                    <p className="mt-1.5 text-xs text-red-400">{errors.password_confirmation}</p>
                                )}
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={processing || strength < 2}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-athlix-red to-red-700 hover:from-red-600 hover:to-red-800 disabled:from-neutral-700 disabled:to-neutral-700 disabled:cursor-not-allowed text-white font-bold text-sm uppercase tracking-wider rounded-xl px-6 py-3.5 transition-all duration-200 shadow-lg shadow-red-900/30 mt-2"
                            >
                                {processing ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Menyimpan...
                                    </span>
                                ) : (
                                    <>
                                        Simpan dan Lanjutkan
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* User info */}
                    <p className="text-center text-xs text-neutral-600 mt-6">
                        Login sebagai <span className="text-neutral-400 font-medium">{auth?.user?.name}</span>
                    </p>
                </div>
            </div>
        </>
    );
}
