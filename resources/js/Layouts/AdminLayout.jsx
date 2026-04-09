import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useLanguage } from '@/Components/LanguageProvider';
import LanguageSwitch from '@/Components/LanguageSwitch';
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
    BellRing,
    Newspaper,
    Images,
    HandCoins,
    ShieldCheck,
    Smartphone,
    ClipboardList
} from 'lucide-react';
import GlobalFlashModal from '@/Components/GlobalFlashModal';
import BillingGraceModal from '@/Components/BillingGraceModal';

export default function AdminLayout({ user, header, children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { t } = useLanguage();
    const { props } = usePage();

    const dojoBranding = props?.auth?.dojo_branding || null;
    const logoSrc = dojoBranding?.logo_url || '/logo.png';
    const accentColor = dojoBranding?.accent_color || null;

    const role = user?.role;
    const saasPlan = props?.auth?.dojo?.saas_plan_name ?? 'Basic';
    const isProOrAdvance = ['Pro', 'Advance'].includes(saasPlan);

    const navigation = [
        ...(['super_admin', 'sensei', 'dojo_admin', 'head_coach', 'assistant', 'medical_staff'].includes(role)
            ? [
                  { name: t('common.dashboard', 'Dashboard'), href: route('dashboard'), icon: LayoutDashboard, current: 'dashboard' },
                  { name: t('admin.db_athlete', 'Database Atlet'), href: route('athletes.index'), icon: Users, current: 'athletes.*' },
                  { name: t('admin.physical_condition', 'Kondisi Atlet'), href: route('physical-condition.index'), icon: Activity, current: 'physical-condition.*' },
                  ...(isProOrAdvance ? [{ name: t('admin.rapor', 'Rapor'), href: route('reports.index'), icon: ClipboardList, current: 'reports.*' }] : []),
                  { name: t('admin.training_program', 'Program Latihan'), href: route('training-programs.index'), icon: Dumbbell, current: 'training-programs.*' },
                  { name: t('admin.attendance', 'Absensi'), href: route('attendance.index'), icon: CalendarCheck, current: 'attendance.*' },
                  { name: t('admin.payment', 'Pembayaran'), href: route('finance.index'), icon: CreditCard, current: 'finance.*' },
                  { name: t('admin.statistics', 'Statistik'), href: route('statistics.index'), icon: BarChart3, current: 'statistics.*' },
                  { name: t('admin.athlete_notification', 'Notifikasi Atlet'), href: route('senpai-notifications.index'), icon: BellRing, current: 'senpai-notifications.*' },
              ]
            : []),
        ...(role === 'dojo_admin' || role === 'super_admin' || role === 'head_coach'
            ? [
                  ...(isProOrAdvance ? [{ name: t('admin.report_category', 'Kategori Test'), href: route('report-categories.index'), icon: ClipboardList, current: 'report-categories.*' }] : []),
                  { name: t('admin.db_coach', 'Database Pelatih'), href: route('dojo-admin.sensei.index'), icon: Users, current: 'dojo-admin.sensei.*' },
                  { name: t('admin.system_settings', 'Pengaturan Dojo'), href: route('dojo-admin.settings.index'), icon: ShieldCheck, current: 'dojo-admin.settings.*' }
              ]
            : []),
        ...(role === 'super_admin' || role === 'landing_admin'
            ? [
                  { name: t('admin.cms_articles', 'CMS Artikel'), href: route('cms.articles.index'), icon: Newspaper, current: 'cms.articles.*' },
                  { name: t('admin.cms_gallery', 'CMS Galeri'), href: route('cms.galleries.index'), icon: Images, current: 'cms.galleries.*' },
                  { name: t('admin.cms_pricelist', 'CMS Pricelist'), href: route('cms.pricelists.index'), icon: HandCoins, current: 'cms.pricelists.*' },
                  { name: t('admin.cms_dojo_registrations', 'Pendaftaran Club'), href: route('cms.dojo-registrations.index'), icon: Users, current: 'cms.dojo-registrations.*' },
              ]
            : []),
        ...(role === 'super_admin'
            ? [
                  { name: t('admin.master_account', 'Master Akun'), href: route('super-admin.users.index'), icon: ShieldCheck, current: 'super-admin.users.*' },
                  { name: t('admin.master_dojo', 'Master Club'), href: route('super-admin.dojos.index'), icon: CalendarCheck, current: 'super-admin.dojos.*' },
                  { name: 'Subscription Requests', href: route('super-admin.subscription-requests.index'), icon: CreditCard, current: 'super-admin.subscription-requests.*' },
                  { name: t('admin.system_settings', 'System Settings'), href: route('super-admin.system-settings.index'), icon: ShieldCheck, current: 'super-admin.system-settings.*' },
              ]
            : []),
        ...(['sensei', 'head_coach', 'assistant'].includes(role)
            ? [{ name: t('admin.sensei_pwa', 'PWA Sensei'), href: route('sensei-pwa.home'), icon: Smartphone, current: 'sensei-pwa.*' }]
            : []),
    ];
    const aiNavigation = ['super_admin', 'sensei', 'dojo_admin', 'head_coach', 'assistant', 'medical_staff'].includes(role)
        ? [{ name: t('admin.ai_assistant', 'Asisten Gemini AI'), href: route('ai-assistant.index'), icon: Sparkles, current: 'ai-assistant.*' }]
        : [];

    return (
        <div className="min-h-screen bg-neutral-50 text-athlix-black transition-colors duration-300">
            {accentColor && (
                <style dangerouslySetInnerHTML={{
                    __html: `
                    :root { --athlix-red: ${accentColor}; }
                    .text-athlix-red { color: ${accentColor} !important; }
                    .bg-athlix-red { background-color: ${accentColor} !important; }
                    .border-athlix-red { border-color: ${accentColor} !important; }
                    .hover\\:text-athlix-red:hover { color: ${accentColor} !important; }
                    .hover\\:bg-red-50:hover { background-color: color-mix(in srgb, ${accentColor} 10%, white) !important; }
                    .shadow-athlix-red\\/20 { box-shadow: 0 4px 6px -1px color-mix(in srgb, ${accentColor} 20%, transparent), 0 2px 4px -2px color-mix(in srgb, ${accentColor} 20%, transparent) !important; }
                    .shadow-athlix-red\\/30 { box-shadow: 0 4px 6px -1px color-mix(in srgb, ${accentColor} 30%, transparent), 0 2px 4px -2px color-mix(in srgb, ${accentColor} 30%, transparent) !important; }
                    `
                }} />
            )}
            <GlobalFlashModal />
            <BillingGraceModal />
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 lg:hidden bg-athlix-black/60 backdrop-blur-sm animate-fade-in"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-neutral-200/80 transition-all duration-500 ease-out ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="flex flex-col h-full">
                    {/* Brand */}
                    <div className="flex-shrink-0 flex items-center justify-between h-16 px-6 border-b border-neutral-200/80">
                        <div className="flex items-center gap-3 animate-fade-in">
                            <div className="relative">
                                <img src={logoSrc} alt="ATHLIX Logo" className="w-9 h-9 rounded-xl shadow-md object-cover" />
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            </div>
                            <div>
                                <span className="text-lg font-black tracking-tight text-athlix-red">ATHLIX</span>
                                <span className="text-lg font-light text-neutral-300 ">.</span>
                            </div>
                        </div>
                        <button className="lg:hidden text-neutral-500 hover:text-athlix-black p-1 rounded-lg hover:bg-neutral-100 transition-colors" onClick={() => setSidebarOpen(false)}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                        {navigation.map((item, idx) => {
                            const isActive = route().current(item.current);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 relative overflow-hidden fill-both ${
                                        isActive
                                        ? 'bg-athlix-red text-white shadow-lg shadow-athlix-red/20'
                                        : 'text-neutral-600  hover:bg-neutral-100 hover:text-athlix-black'
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

                    {/* Bottom Actions */}
                    <div className="flex-shrink-0 w-full bg-white border-t border-neutral-200/80">
                        <div className="lg:hidden flex justify-center pt-3 pb-1">
                            <LanguageSwitch />
                        </div>

                        <div className="p-3 pt-1 lg:pt-3 space-y-1">
                            {aiNavigation.map((item) => {
                                const isActive = route().current(item.current);
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ${
                                            isActive
                                                ? 'bg-athlix-red text-white shadow-lg shadow-athlix-red/20'
                                                : 'text-neutral-600 hover:bg-neutral-100 hover:text-athlix-black'
                                        }`}
                                    >
                                        <item.icon className="w-5 h-5 mr-3" />
                                        {item.name}
                                    </Link>
                                );
                            })}
                            <Link href={route('logout')} method="post" as="button" className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-neutral-500  rounded-xl hover:bg-red-50 hover:text-athlix-red transition-all duration-300">
                                <LogOut className="w-5 h-5 mr-3" />
                                {t('common.sign_out', 'Sign Out')}
                            </Link>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Workspace */}
            <div className="lg:pl-64 flex flex-col min-h-screen relative transition-all duration-300">
                {/* Header */}
                <header className="sticky top-0 z-30 flex items-center justify-between min-h-16 py-2 px-3 sm:px-6 gap-3 glass-strong border-gradient">
                    <div className="flex items-center min-w-0 flex-1">
                        <button
                            className="mr-4 lg:hidden text-neutral-500 hover:text-athlix-black p-2 rounded-xl hover:bg-neutral-100 transition-all duration-300 active:scale-95"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu size={22} />
                        </button>
                        {header && (
                            <div className="font-semibold tracking-tight animate-fade-in min-w-0 text-sm sm:text-base line-clamp-2">
                                {header}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <div className="hidden lg:flex">
                            <LanguageSwitch />
                        </div>

                        <div className="text-sm font-medium text-neutral-700 hidden sm:block">
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
