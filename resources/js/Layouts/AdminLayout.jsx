import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { useTheme } from '@/Components/ThemeProvider';
import { 
    LayoutDashboard, 
    Users, 
    CalendarCheck, 
    CreditCard, 
    LogOut,
    Menu,
    X,
    Activity,
    Dumbbell,
    BarChart3,
    Sparkles,
    Newspaper,
    Images,
    HandCoins,
    ShieldCheck,
    Sun,
    Moon
} from 'lucide-react';

export default function AdminLayout({ user, header, children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();

    const role = user?.role;
    const navigation = [
        ...(role === 'super_admin' || role === 'sensei'
            ? [
                  { name: 'Dashboard', href: route('dashboard'), icon: LayoutDashboard, current: 'dashboard' },
                  { name: 'Database Atlet', href: route('athletes.index'), icon: Users, current: 'athletes.*' },
                  { name: 'Absensi', href: route('attendance.index'), icon: CalendarCheck, current: 'attendance.*' },
                  { name: 'Pembayaran', href: route('finance.index'), icon: CreditCard, current: 'finance.*' },
                  { name: 'Kondisi Fisik', href: route('physical-condition.index'), icon: Activity, current: 'physical-condition.*' },
                  { name: 'Program Latihan', href: route('training-programs.index'), icon: Dumbbell, current: 'training-programs.*' },
                  { name: 'Statistik', href: route('statistics.index'), icon: BarChart3, current: 'statistics.*' },
                  { name: 'Asisten Gemini AI', href: route('ai-assistant.index'), icon: Sparkles, current: 'ai-assistant.*' },
              ]
            : []),
        ...(role === 'dojo_admin'
            ? [{ name: 'Manajemen Sensei', href: route('dojo-admin.sensei.index'), icon: Users, current: 'dojo-admin.sensei.*' }]
            : []),
        ...(role === 'super_admin' || role === 'landing_admin'
            ? [
                  { name: 'CMS Artikel', href: route('cms.articles.index'), icon: Newspaper, current: 'cms.articles.*' },
                  { name: 'CMS Galeri', href: route('cms.galleries.index'), icon: Images, current: 'cms.galleries.*' },
                  { name: 'CMS Pricelist', href: route('cms.pricelists.index'), icon: HandCoins, current: 'cms.pricelists.*' },
              ]
            : []),
        ...(role === 'super_admin'
            ? [
                  { name: 'Master Akun', href: route('super-admin.users.index'), icon: ShieldCheck, current: 'super-admin.users.*' },
                  { name: 'Master Dojo', href: route('super-admin.dojos.index'), icon: CalendarCheck, current: 'super-admin.dojos.*' },
              ]
            : []),
    ];

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-athlix-black text-athlix-black  transition-colors duration-300">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 z-40 lg:hidden bg-athlix-black/60 backdrop-blur-sm animate-fade-in" 
                    onClick={() => setSidebarOpen(false)} 
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 z-50 h-screen w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200/80 dark:border-neutral-800 transition-all duration-500 ease-out ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}`}>
                {/* Brand */}
                <div className="flex items-center justify-between h-16 px-6 border-b border-neutral-200/80 dark:border-neutral-800">
                    <div className="flex items-center gap-3 animate-fade-in">
                        <div className="relative">
                            <img src="/logo.png" alt="ATHLIX Logo" className="w-9 h-9 rounded-xl shadow-md object-cover" />
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-neutral-900"></div>
                        </div>
                        <div>
                            <span className="text-lg font-black tracking-tight text-athlix-red">ATHLIX</span>
                            <span className="text-lg font-light text-neutral-300 ">.</span>
                        </div>
                    </div>
                    <button className="lg:hidden text-neutral-500 hover:text-athlix-black dark:hover:text-athlix-white p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" onClick={() => setSidebarOpen(false)}>
                        <X size={20} />
                    </button>
                </div>
                
                {/* Navigation */}
                <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)]">
                    {navigation.map((item, idx) => {
                        const isActive = route().current(item.current);
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 relative overflow-hidden fill-both ${
                                    isActive 
                                    ? 'bg-athlix-red text-white shadow-lg shadow-athlix-red/20' 
                                    : 'text-neutral-600  hover:bg-neutral-100 dark:hover:bg-neutral-800/80 hover:text-athlix-black dark:hover:text-athlix-white'
                                }`}
                                style={{ animationDelay: `${idx * 40}ms` }}
                            >
                                <item.icon className={`w-5 h-5 mr-3 transition-transform duration-300 ${isActive ? '' : 'group-hover:scale-110'}`} />
                                {item.name}
                                {isActive && (
                                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="absolute bottom-0 w-full p-3 border-t border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                    <Link href={route('logout')} method="post" as="button" className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-neutral-500  rounded-xl hover:bg-red-50 dark:hover:bg-athlix-red/10 hover:text-athlix-red transition-all duration-300">
                        <LogOut className="w-5 h-5 mr-3" />
                        Sign Out
                    </Link>
                </div>
            </aside>

            {/* Main Content Workspace */}
            <div className="lg:pl-64 flex flex-col min-h-screen relative transition-all duration-300">
                {/* Header */}
                <header className="sticky top-0 z-30 flex items-center justify-between min-h-16 py-2 px-3 sm:px-6 gap-3 glass-strong border-gradient">
                    <div className="flex items-center min-w-0 flex-1">
                        <button 
                            className="mr-4 lg:hidden text-neutral-500 hover:text-athlix-black dark:hover:text-athlix-white p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-300 active:scale-95" 
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu size={22} />
                        </button>
                        {header && (
                            <div className="font-semibold tracking-tight animate-fade-in min-w-0">
                                {header}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        {/* Dark/Light Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="relative w-14 h-7 rounded-full transition-all duration-500 cursor-pointer bg-neutral-200 dark:bg-neutral-700 hover:shadow-md"
                            aria-label="Toggle theme"
                        >
                            <div className={`absolute top-0.5 w-6 h-6 rounded-full shadow-md transition-all duration-500 flex items-center justify-center ${
                                theme === 'dark' 
                                    ? 'translate-x-7 bg-athlix-red text-white' 
                                    : 'translate-x-0.5 bg-white text-amber-500'
                            }`}>
                                {theme === 'dark' ? <Moon size={12} /> : <Sun size={12} />}
                            </div>
                        </button>

                        <div className="text-sm font-medium text-neutral-700  hidden sm:block">
                            {user?.name || 'Sensei'}
                        </div>
                        <div className="h-9 w-9 rounded-xl bg-athlix-red text-white flex items-center justify-center font-bold text-sm shadow-md shadow-athlix-red/20 transition-transform duration-300 hover:scale-105 overflow-hidden">
                            {user?.profile_photo_url ? (
                                <img src={user.profile_photo_url} alt={user?.name || 'User'} className="w-full h-full object-cover" />
                            ) : (
                                (user?.name?.charAt(0) || 'S')
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-3 sm:p-5 lg:p-6 pb-20 lg:pb-6 animate-fade-in-up">
                    {children}
                </main>
            </div>
        </div>
    );
}

