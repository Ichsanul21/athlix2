import { Link } from '@inertiajs/react';
import { 
    Home, 
    Calendar,
    ScanLine,
    CreditCard,
    User,
    Download,
    Bell,
    Sun,
    Moon
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from '@/Components/ThemeProvider';

export default function PwaLayout({ user, header, children }) {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallBanner(true);
        });
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            setDeferredPrompt(null);
            setShowInstallBanner(false);
        }
    };

    const tabs = [
        { name: 'Home', route: 'pwa.home', icon: Home },
        { name: 'Jadwal', route: 'schedule.index', icon: Calendar },
        { name: 'Scan', route: 'scan.index', icon: ScanLine, isPrimary: true },
        { name: 'Billing', route: 'billing.index', icon: CreditCard },
        { name: 'Profile', route: 'profile.pwa', icon: User, subRoutes: 'profile.*' },
    ];

    return (
        <div className="min-h-[100dvh] bg-neutral-50 dark:bg-athlix-black text-athlix-black dark:text-athlix-white flex flex-col relative font-sans selection:bg-athlix-red selection:text-white pb-safe transition-colors duration-300">
            
            {/* Install Banner */}
            {showInstallBanner && (
                <div className="fixed top-2 left-2 right-2 z-[100] p-4 bg-gradient-to-r from-athlix-red to-red-600 text-white flex items-center justify-between shadow-2xl shadow-athlix-red/30 rounded-2xl animate-slide-up">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                            <Download size={18} />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest block">Instal Aplikasi</span>
                            <span className="text-[9px] opacity-80">Akses cepat dari layar utama</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleInstallClick}
                            className="bg-white text-athlix-red px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
                        >
                            PASANG
                        </button>
                        <button onClick={() => setShowInstallBanner(false)} className="p-2 opacity-50 underline text-[10px] font-bold uppercase">Nanti</button>
                    </div>
                </div>
            )}

            {/* Premium Header */}
            <header className="sticky top-0 z-30 glass-strong px-5 h-16 flex items-center justify-between border-gradient">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <img src="/logo.png" alt="ATHLIX Logo" className="w-10 h-10 rounded-xl shadow-lg shadow-athlix-red/20 object-cover transition-transform duration-300 hover:scale-105" />
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-neutral-900 animate-pulse"></div>
                    </div>
                    <div>
                        <h1 className="text-sm font-black uppercase tracking-tighter leading-none">{header || 'ATHLIX'}</h1>
                        <p className="text-[8px] font-bold text-neutral-400 uppercase tracking-[0.2em] mt-0.5">Dojo Management</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Dark/Light Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-xl border border-neutral-200/80 dark:border-neutral-700 transition-all duration-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-95 text-neutral-500 dark:text-neutral-400"
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <button className="text-neutral-400 p-2 rounded-xl border border-neutral-200/80 dark:border-neutral-700 transition-all duration-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-95 relative">
                        <Bell size={18} />
                        <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-athlix-red rounded-full"></div>
                    </button>
                    <div className="w-9 h-9 rounded-xl bg-athlix-red text-white flex items-center justify-center font-black text-xs shadow-md shadow-athlix-red/20 transition-transform duration-300 hover:scale-105 ring-2 ring-neutral-100 dark:ring-neutral-800">
                        {user.name.charAt(0)}
                    </div>
                </div>
            </header>

            {/* Scrollable Main Area */}
            <main className="flex-1 overflow-y-auto px-5 py-6 animate-fade-in-up">
                {children}
            </main>

            {/* Floating Premium Bottom Bar */}
            <div className="fixed bottom-4 w-full px-5 z-50 pointer-events-none">
                <nav className="max-w-md mx-auto h-[68px] bg-neutral-900/95 dark:bg-neutral-800/95 backdrop-blur-2xl rounded-[26px] border border-white/10 shadow-nav-float flex items-center justify-between px-3 pointer-events-auto transition-colors duration-300">
                    {tabs.map((tab) => {
                        const isMainActive = route().current(tab.route);
                        const isActive = tab.subRoutes ? (route().current(tab.route) || route().current(tab.subRoutes)) : isMainActive;
                        
                        if (tab.isPrimary) {
                            return (
                                <Link 
                                    key={tab.name} 
                                    href={route(tab.route)}
                                    className="flex flex-col items-center justify-center relative -mt-8"
                                >
                                    <div className={`w-[56px] h-[56px] rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-500 border-4 border-neutral-100 dark:border-neutral-900 ${
                                        isMainActive 
                                        ? 'bg-athlix-red text-white scale-110 shadow-athlix-red/40 animate-pulse-glow' 
                                        : 'bg-white dark:bg-neutral-900 text-athlix-red hover:scale-105 active:scale-95'
                                    }`}>
                                        <tab.icon size={22} strokeWidth={2.5} />
                                    </div>
                                    <div className={`w-1.5 h-1.5 rounded-full bg-athlix-red mt-1.5 transition-all duration-300 ${isMainActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}></div>
                                </Link>
                            )
                        }

                        return (
                            <Link 
                                key={tab.name}
                                href={route(tab.route)}
                                className={`group flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-300 relative ${
                                    isActive 
                                    ? 'text-white' 
                                    : 'text-neutral-500 hover:text-neutral-300'
                                }`}
                            >
                                {isActive && (
                                    <div className="absolute inset-1 bg-athlix-red/20 rounded-xl animate-scale-in"></div>
                                )}
                                <tab.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} className={`relative z-10 transition-all duration-300 ${isActive ? 'scale-110 text-athlix-red' : 'group-active:scale-90'}`} />
                                <span className={`relative z-10 text-[8px] font-bold uppercase tracking-wider mt-0.5 transition-all duration-300 ${isActive ? 'opacity-100 text-athlix-red' : 'opacity-40'}`}>
                                    {tab.name}
                                </span>
                            </Link>
                        )
                    })}
                </nav>
            </div>
        </div>
    );
}
