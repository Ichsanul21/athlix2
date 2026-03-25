import PwaLayout from '@/Layouts/PwaLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { User, Award, ShieldCheck, LogOut, ChevronRight, Settings } from 'lucide-react';
import { Skeleton } from '@/Components/ui/skeleton';

export default function Index({ auth, athlete }) {
    if (!athlete) {
        return (
            <PwaLayout user={auth?.user} header="Profile">
                <div className="space-y-6 pb-24">
                    <Skeleton className="h-24 w-24 rounded-full mx-auto" />
                    <Skeleton className="h-6 w-40 mx-auto" />
                    <div className="grid grid-cols-2 gap-3">
                        <Skeleton className="h-20" />
                        <Skeleton className="h-20" />
                    </div>
                    <Skeleton className="h-40 w-full" />
                </div>
            </PwaLayout>
        );
    }

    return (
        <PwaLayout user={auth?.user} header="My Profile">
            <Head title="Profile" />
            <div className="space-y-6 pb-24">
                {/* Profile Header */}
                <div className="flex flex-col items-center py-4 animate-fade-in-up fill-both">
                    <div className="relative mb-4">
                        <div className="absolute inset-0 bg-athlix-red/20 rounded-full blur-xl animate-pulse"></div>
                        <div className="relative w-24 h-24 rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center text-athlix-red text-4xl font-black border-4 border-athlix-red shadow-xl shadow-athlix-red/20 overflow-hidden">
                            {auth?.user?.profile_photo_url ? (
                                <img src={auth.user.profile_photo_url} alt={athlete.full_name} className="w-full h-full object-cover" />
                            ) : (
                                athlete.full_name.charAt(0)
                            )}
                        </div>
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter">{athlete.full_name}</h2>
                    <div className="flex items-center gap-2 mt-1.5">
                        <span className="px-3 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-500 uppercase tracking-widest border border-neutral-200/80 dark:border-neutral-700">
                            {athlete.athlete_code}
                        </span>
                    </div>
                </div>

                {/* Quick Info Cards */}
                <div className="grid grid-cols-2 gap-3 animate-fade-in-up fill-both" style={{ animationDelay: '80ms' }}>
                    <Card className="border-none bg-white dark:bg-neutral-900 shadow-sm card-hover">
                        <CardContent className="p-4 flex flex-col items-center text-center">
                            <div className="w-10 h-10 rounded-xl bg-athlix-red/10 flex items-center justify-center text-athlix-red mb-2 transition-transform duration-300 hover:scale-110">
                                <Award size={20} />
                            </div>
                            <p className="text-xs text-neutral-500 uppercase font-black tracking-widest">Sabuk</p>
                            <p className="font-bold text-sm leading-tight">{athlete.belt?.name || 'Putih'}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-none bg-white dark:bg-neutral-900 shadow-sm card-hover">
                        <CardContent className="p-4 flex flex-col items-center text-center">
                            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 mb-2 transition-transform duration-300 hover:scale-110">
                                <ShieldCheck size={20} />
                            </div>
                            <p className="text-xs text-neutral-500 uppercase font-black tracking-widest">Status</p>
                            <p className="font-bold text-sm leading-tight text-green-600">AKTIF</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Menu Items */}
                <div className="space-y-2 animate-fade-in-up fill-both" style={{ animationDelay: '160ms' }}>
                    <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500 mb-3 px-1">Menu Akun</h3>
                    
                    {[
                        { href: route('profile.info'), icon: User, label: 'Informasi Pribadi', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' },
                        { href: route('profile.achievements'), icon: Award, label: 'Riwayat Prestasi', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600' },
                        { href: route('profile.settings'), icon: Settings, label: 'Pengaturan Aplikasi', color: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500' },
                    ].map((item, idx) => (
                        <Link 
                            key={item.label}
                            href={item.href} 
                            className="w-full flex items-center justify-between p-4 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all duration-300 active:scale-[0.98] animate-fade-in-up fill-both"
                            style={{ animationDelay: `${200 + idx * 50}ms` }}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl ${item.color} flex items-center justify-center transition-transform duration-300 hover:scale-110`}>
                                    <item.icon size={18} />
                                </div>
                                <span className="text-sm font-bold">{item.label}</span>
                            </div>
                            <ChevronRight size={16} className="text-neutral-300" />
                        </Link>
                    ))}

                    <div className="pt-4">
                        <Link 
                            href={route('logout')} 
                            method="post" 
                            as="button" 
                            className="w-full flex items-center justify-center gap-3 p-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-red-50 dark:hover:bg-athlix-red/10 hover:text-athlix-red transition-all duration-300 active:scale-[0.98] animate-fade-in-up fill-both"
                            style={{ animationDelay: '400ms' }}
                        >
                            <LogOut size={16} />
                            Keluar Akun
                        </Link>
                    </div>
                </div>
            </div>
        </PwaLayout>
    );
}

