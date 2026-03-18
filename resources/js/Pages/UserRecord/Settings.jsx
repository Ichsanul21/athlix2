import PwaLayout from '@/Layouts/PwaLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { ArrowLeft, Moon, Sun, Bell, Shield, HelpCircle, Info } from 'lucide-react';
import { useTheme } from '@/Components/ThemeProvider';

export default function Settings({ auth }) {
    const { theme, toggleTheme } = useTheme();

    return (
        <PwaLayout user={auth.user} header="Pengaturan">
            <Head title="Settings" />
            
            <div className="space-y-6 pb-24">
                <div className="flex items-center gap-4 py-2 animate-fade-in-up fill-both">
                    <Link href={route('profile.pwa')} className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all duration-300 active:scale-95">
                        <ArrowLeft size={20} />
                    </Link>
                    <h2 className="text-xl font-black uppercase tracking-tighter">Opsi Aplikasi</h2>
                </div>

                <div className="space-y-4">
                    <Card className="border-none bg-white dark:bg-neutral-900 shadow-sm divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden animate-fade-in-up fill-both" style={{ animationDelay: '80ms' }}>
                        {/* Dark Mode Toggle - FUNCTIONAL */}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-athlix-red/10 text-blue-600 dark:text-athlix-red transition-colors duration-300">
                                    {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                                </div>
                                <div>
                                    <span className="font-bold text-sm">Mode Gelap</span>
                                    <p className="text-[10px] text-neutral-400">{theme === 'dark' ? 'Aktif' : 'Nonaktif'}</p>
                                </div>
                            </div>
                            <button
                                onClick={toggleTheme}
                                className={`relative w-12 h-6 rounded-full transition-all duration-500 cursor-pointer ${
                                    theme === 'dark' ? 'bg-athlix-red shadow-glow-red' : 'bg-neutral-200'
                                }`}
                                aria-label="Toggle dark mode"
                            >
                                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-500 flex items-center justify-center ${
                                    theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'
                                }`}>
                                    {theme === 'dark' ? <Moon size={10} className="text-athlix-red" /> : <Sun size={10} className="text-amber-500" />}
                                </div>
                            </button>
                        </div>

                        {/* Notifications Toggle */}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600">
                                    <Bell size={18} />
                                </div>
                                <div>
                                    <span className="font-bold text-sm">Notifikasi Push</span>
                                    <p className="text-[10px] text-neutral-400">Aktif</p>
                                </div>
                            </div>
                            <div className="relative w-12 h-6 bg-athlix-red rounded-full p-0.5 shadow-glow-red cursor-pointer">
                                <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-md"></div>
                            </div>
                        </div>

                        {/* Privacy */}
                        <div className="p-4 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600">
                                    <Shield size={18} />
                                </div>
                                <div>
                                    <span className="font-bold text-sm">Privasi Data</span>
                                    <p className="text-[10px] text-neutral-400">Terlindungi</p>
                                </div>
                            </div>
                            <Info size={16} className="text-neutral-400" />
                        </div>
                    </Card>

                    <Card className="border-none bg-white dark:bg-neutral-900 shadow-sm overflow-hidden animate-fade-in-up fill-both" style={{ animationDelay: '160ms' }}>
                        <button className="w-full p-4 flex items-center gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all duration-300 active:scale-[0.98]">
                            <HelpCircle size={18} className="text-neutral-400" />
                            <span className="font-bold text-sm">Bantuan & FAQ</span>
                        </button>
                    </Card>

                    <div className="text-center py-4 animate-fade-in fill-both" style={{ animationDelay: '240ms' }}>
                        <p className="text-[10px] font-black uppercase text-neutral-300 dark:text-neutral-700 tracking-[0.2em]">ATHLIX. Prototype v1.0.1</p>
                    </div>
                </div>
            </div>
        </PwaLayout>
    );
}
