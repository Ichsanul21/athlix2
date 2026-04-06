import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col items-center bg-neutral-100 dark:bg-athlix-black relative overflow-hidden transition-colors duration-300">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Gradient orbs */}
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-athlix-red/10 rounded-full blur-3xl animate-float"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-athlix-red/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-athlix-red/[0.03] rounded-full blur-3xl"></div>

                {/* Grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]"></div>

                {/* Decorative lines */}
                <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-athlix-red/10 to-transparent"></div>
                <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-neutral-200 dark:via-neutral-800 to-transparent"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full px-4 py-8 sm:px-6">
                {/* Brand */}
                <div className="mb-8 animate-fade-in-up">
                    <Link href="/" className="flex flex-col items-center gap-3 group">
                        <div className="relative flex items-center gap-4">
                            <div className="absolute inset-0 bg-athlix-red/20 rounded-2xl blur-xl group-hover:bg-athlix-red/30 transition-all duration-500"></div>
                            <div className="relative w-16 h-16 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl flex items-center justify-center border border-neutral-200/50 dark:border-neutral-700/50 group-hover:scale-105 transition-transform duration-500">
                                <img src="/logo.png" alt="ATHLIX" className="w-12 h-12 rounded-xl object-cover" />
                            </div>
                            <span className="relative text-neutral-400 font-bold mx-0.5 text-xl">X</span>
                            <div className="relative h-16 bg-white dark:bg-neutral-900 px-4 rounded-2xl shadow-xl flex items-center justify-center border border-neutral-200/50 dark:border-neutral-700/50 group-hover:scale-105 transition-transform duration-500">
                                <img src="/icons/winpro_logo.png" alt="WINPRO" className="h-8 w-auto object-contain" />
                            </div>
                        </div>
                        <div className="text-center">
                            <h1 className="text-2xl font-black tracking-tighter text-athlix-black ">
                                ATHLIX<span className="text-athlix-red">.</span>
                            </h1>
                            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.3em]">Dojo Management</p>
                        </div>
                    </Link>
                </div>

                {/* Form Card */}
                <div className="w-full max-w-md animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    <div className="glass rounded-3xl shadow-xl p-8 sm:p-10 relative overflow-hidden">
                        {/* Red accent line */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-transparent via-athlix-red to-transparent rounded-full"></div>

                        {children}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: '200ms' }}>
                    <p className="text-xs text-neutral-400 font-bold uppercase tracking-[0.2em]">
                        &copy; {new Date().getFullYear()} ATHLIX. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}

