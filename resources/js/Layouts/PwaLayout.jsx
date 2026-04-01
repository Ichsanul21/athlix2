import { Link, router, usePage } from '@inertiajs/react';
import {
    Home,
    Calendar,
    ScanLine,
    Activity,
    Users,
    User,
    Download,
    Bell,
    CreditCard
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/Components/LanguageProvider';
import LanguageSwitch from '@/Components/LanguageSwitch';
import { registerWebNotificationDevice } from '@/lib/notificationDevice';
import GlobalFlashModal from '@/Components/GlobalFlashModal';

export default function PwaLayout({ user, header, children }) {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);
    const [forceInstallModal, setForceInstallModal] = useState(false);
    const [showNotificationPanel, setShowNotificationPanel] = useState(false);
    const [popupNotification, setPopupNotification] = useState(null);
    const [notificationPermission, setNotificationPermission] = useState(
        typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
    );
    const { t } = useLanguage();
    const { props } = usePage();
    const normalizedRole = String(user?.role || '').toLowerCase();
    const isParentRole = normalizedRole === 'parent';
    const isAthleteRole = ['atlet', 'murid', 'athlete', 'parent'].includes(normalizedRole);
    const isNotificationPollingRole = ['atlet', 'murid', 'athlete', 'parent'].includes(normalizedRole);
    const isSenseiPwaRole = ['sensei', 'head_coach', 'assistant'].includes(normalizedRole);
    const pwaNotifications = props?.pwaNotifications || { items: [], unread_count: 0, latest_popup: null };
    const dojoBranding = props?.auth?.dojo_branding || null;
    const [notificationFeed, setNotificationFeed] = useState(pwaNotifications);
    const latestKnownNotificationId = useRef(0);

    const logoSrc = dojoBranding?.logo_url || '/logo.png';
    const accentColor = dojoBranding?.accent_color || null;

    useEffect(() => {
        const handleInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallBanner(true);
            setForceInstallModal(true);
        };

        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
        if (!isStandalone) {
            setForceInstallModal(true);
        }

        window.addEventListener('beforeinstallprompt', handleInstallPrompt);

        const nagInterval = window.setInterval(() => {
            const standaloneNow = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
            if (!standaloneNow) {
                setForceInstallModal(true);
            }
        }, 20000);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
            window.clearInterval(nagInterval);
        };
    }, []);

    useEffect(() => {
        if (!user) return;
        if (!isAthleteRole) return;
        if (notificationPermission !== 'granted') return;

        registerWebNotificationDevice();
    }, [user?.id, isAthleteRole, notificationPermission]);

    useEffect(() => {
        setNotificationFeed(pwaNotifications);
    }, [pwaNotifications]);

    useEffect(() => {
        const maxId = Math.max(0, ...(notificationFeed?.items || []).map((item) => Number(item.id) || 0));
        if (maxId > latestKnownNotificationId.current) {
            latestKnownNotificationId.current = maxId;
        }
    }, [notificationFeed?.items]);

    useEffect(() => {
        if (!user || !isNotificationPollingRole) {
            return undefined;
        }

        let cancelled = false;

        const fetchFeed = async () => {
            try {
                const response = await fetch(
                    `${route('pwa-notifications.feed')}?since_id=${latestKnownNotificationId.current}`,
                    {
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        credentials: 'same-origin',
                    }
                );

                if (!response.ok || cancelled) {
                    return;
                }

                const payload = await response.json();
                if (cancelled || !payload) {
                    return;
                }

                if (Array.isArray(payload.items) && payload.items.length > 0) {
                    for (const item of payload.items) {
                        const nextId = Number(item?.id) || 0;
                        if (nextId > latestKnownNotificationId.current) {
                            latestKnownNotificationId.current = nextId;
                        }

                        if (!item?.is_read) {
                            triggerNativeNotification(item, notificationPermission);
                        }
                    }
                }

                setNotificationFeed((previous) => {
                    const currentItems = previous?.items || [];
                    const incoming = Array.isArray(payload.items) ? payload.items : [];
                    const merged = [...incoming, ...currentItems];
                    const deduped = [];
                    const seen = new Set();

                    for (const item of merged) {
                        const key = Number(item?.id) || 0;
                        if (key <= 0 || seen.has(key)) continue;
                        seen.add(key);
                        deduped.push(item);
                    }

                    deduped.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));

                    return {
                        items: deduped,
                        latest_popup: payload.latest_popup ?? previous?.latest_popup ?? null,
                        unread_count: typeof payload.unread_count === 'number'
                            ? payload.unread_count
                            : deduped.filter((item) => !item.is_read).length,
                    };
                });
            } catch (error) {
                // noop
            }
        };

        fetchFeed();
        const intervalId = window.setInterval(fetchFeed, 20000);

        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
        };
    }, [user?.id, isNotificationPollingRole, notificationPermission]);

    useEffect(() => {
        const latestPopup = notificationFeed?.latest_popup;
        if (!latestPopup?.id) return;

        const storageKey = `athlix_popup_seen_${latestPopup.id}`;
        if (window.localStorage.getItem(storageKey)) return;
        if (latestPopup.is_read) return;

        setPopupNotification(latestPopup);
    }, [notificationFeed?.latest_popup?.id]);

    const handleNotificationButtonClick = () => {
        if (isSenseiPwaRole) {
            router.visit(route('sensei-pwa.notifications'));
            return;
        }

        setShowNotificationPanel(true);
    };

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            setDeferredPrompt(null);
            const installed = outcome === 'accepted';
            setShowInstallBanner(!installed);
            setForceInstallModal(!installed);
        }
    };

    const markNotificationRead = (notificationId) => {
        if (!notificationId) return;

        setNotificationFeed((previous) => {
            const nextItems = (previous?.items || []).map((item) => {
                if (Number(item.id) === Number(notificationId)) {
                    return { ...item, is_read: true };
                }
                return item;
            });

            return {
                ...previous,
                items: nextItems,
                unread_count: Math.max(0, (previous?.unread_count || 0) - 1),
            };
        });

        router.post(route('pwa-notifications.read', notificationId), {}, { preserveScroll: true, preserveState: true });
    };

    const requestNativePermission = async () => {
        if (!('Notification' in window)) {
            setNotificationPermission('unsupported');
            return;
        }

        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);

        if (permission === 'granted') {
            registerWebNotificationDevice();
        }
    };

    const closePopupNotification = () => {
        if (popupNotification?.id) {
            window.localStorage.setItem(`athlix_popup_seen_${popupNotification.id}`, '1');
            markNotificationRead(popupNotification.id);
        }
        setPopupNotification(null);
    };

    const tabs = isSenseiPwaRole
        ? [
            { name: t('common.home', 'Home'), route: 'sensei-pwa.home', icon: Home },
            { name: t('admin.db_athlete', 'Database'), route: 'sensei-pwa.athletes', icon: Users },
            { name: t('admin.athlete_notification', 'Notifikasi'), route: 'sensei-pwa.notifications', icon: Bell, isPrimary: true },
            { name: t('common.condition', 'Kondisi'), route: 'sensei-pwa.condition', icon: Activity },
            { name: t('common.training_program', 'Program'), route: 'sensei-pwa.training-program', icon: Calendar },
        ]
        : isParentRole
            ? [
                { name: t('common.home', 'Home'), route: 'pwa.home', icon: Home },
                { name: t('common.schedule', 'Jadwal'), route: 'schedule.index', icon: Calendar },
                { name: t('common.payment', 'Billing'), route: 'billing.index', icon: CreditCard },
                { name: t('common.condition', 'Kondisi'), route: 'condition.index', icon: Activity },
                { name: t('common.profile', 'Profile'), route: 'profile.pwa', icon: User, subRoutes: 'profile.*' },
            ]
        : [
            { name: t('common.home', 'Home'), route: 'pwa.home', icon: Home },
            { name: t('common.schedule', 'Jadwal'), route: 'schedule.index', icon: Calendar },
            { name: t('common.scan', 'Scan'), route: 'scan.index', icon: ScanLine, isPrimary: true },
            { name: t('common.condition', 'Kondisi'), route: 'condition.index', icon: Activity },
            { name: t('common.profile', 'Profile'), route: 'profile.pwa', icon: User, subRoutes: 'profile.*' },
        ];

    return (
        <div className="min-h-[100dvh] bg-neutral-50 text-athlix-black flex flex-col relative font-sans selection:bg-athlix-red selection:text-white pb-safe transition-colors duration-300">
            {accentColor && (
                <style dangerouslySetInnerHTML={{
                    __html: `
                    :root {
                        --athlix-red: ${accentColor};
                    }
                    .text-athlix-red { color: ${accentColor} !important; }
                    .bg-athlix-red { background-color: ${accentColor} !important; }
                    .border-athlix-red { border-color: ${accentColor} !important; }
                    .shadow-athlix-red\\/20 { box-shadow: 0 4px 6px -1px color-mix(in srgb, ${accentColor} 20%, transparent), 0 2px 4px -2px color-mix(in srgb, ${accentColor} 20%, transparent) !important; }
                    .shadow-athlix-red\\/30 { box-shadow: 0 4px 6px -1px color-mix(in srgb, ${accentColor} 30%, transparent), 0 2px 4px -2px color-mix(in srgb, ${accentColor} 30%, transparent) !important; }
                    .shadow-athlix-red\\/40 { box-shadow: 0 4px 6px -1px color-mix(in srgb, ${accentColor} 40%, transparent), 0 2px 4px -2px color-mix(in srgb, ${accentColor} 40%, transparent) !important; }
                    .from-athlix-red { --tw-gradient-from: ${accentColor} var(--tw-gradient-from-position) !important; }
                    .via-athlix-red { --tw-gradient-via: ${accentColor} var(--tw-gradient-via-position) !important; }
                    .to-athlix-red { --tw-gradient-to: ${accentColor} var(--tw-gradient-to-position) !important; }
                    .ring-athlix-red { --tw-ring-color: ${accentColor} !important; }
                    .fill-athlix-red { fill: ${accentColor} !important; }
                    .stroke-athlix-red { stroke: ${accentColor} !important; }
                    `
                }} />
            )}
            <GlobalFlashModal />

            {/* Install Banner */}
            {showInstallBanner && (
                <div className="fixed top-2 left-2 right-2 z-[100] p-3 sm:p-4 bg-gradient-to-r from-athlix-red to-red-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xl shadow-athlix-red/30 rounded-2xl animate-slide-up">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                            <Download size={18} />
                        </div>
                        <div className="min-w-0">
                            <span className="text-sm font-black uppercase tracking-widest block">{t('pwa.install_app', 'Instal Aplikasi')}</span>
                            <span className="text-[11px] opacity-80">{t('pwa.quick_access', 'Akses cepat dari layar utama')}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                            onClick={handleInstallClick}
                            className="bg-white text-athlix-red px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
                        >
                            {t('common.install', 'Pasang')}
                        </button>
                        <button onClick={() => setShowInstallBanner(false)} className="p-2 opacity-70 underline text-xs font-bold uppercase">{t('common.later', 'Nanti')}</button>
                    </div>
                </div>
            )}

            {forceInstallModal && (
                <div className="fixed inset-0 z-[110] bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl space-y-3">
                        <h3 className="text-lg font-black tracking-tight">Install ATHLIX PWA</h3>
                        <p className="text-sm text-neutral-600 ">{t('pwa.install_modal_desc', 'Pasang aplikasi agar notifikasi, absensi, dan reminder berjalan optimal di perangkat kamu.')}</p>
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setForceInstallModal(false)} className="px-4 py-2 rounded-xl border text-sm font-bold">{t('common.later', 'Nanti')}</button>
                            <button onClick={handleInstallClick} className="px-4 py-2 rounded-xl bg-athlix-red text-white text-sm font-bold">{t('pwa.install_now', 'Install Sekarang')}</button>
                        </div>
                    </div>
                </div>
            )}

            {showNotificationPanel && (
                <div className="fixed inset-0 z-[115] bg-black/35 backdrop-blur-sm flex items-start justify-end p-4" onClick={() => setShowNotificationPanel(false)}>
                    <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-4 space-y-3" onClick={(event) => event.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase tracking-widest">{t('pwa.notifications_title', 'Notifikasi Senpai')}</h3>
                            <button onClick={() => setShowNotificationPanel(false)} className="text-xs font-bold text-neutral-400">{t('common.close', 'Tutup')}</button>
                        </div>
                        {notificationPermission !== 'granted' && (
                            <div className="rounded-xl border border-athlix-red/20 bg-athlix-red/5 p-3 space-y-2">
                                <p className="text-xs text-neutral-600">{t('pwa.enable_native_desc', 'Aktifkan notifikasi perangkat agar update senpai tampil native di perangkat.')}</p>
                                <button
                                    type="button"
                                    onClick={requestNativePermission}
                                    className="text-xs font-black uppercase tracking-widest text-athlix-red"
                                >
                                    {t('pwa.enable_native', 'Aktifkan Notifikasi Native')}
                                </button>
                            </div>
                        )}
                        <div className="max-h-[60vh] overflow-y-auto space-y-2">
                            {(notificationFeed?.items || []).length > 0 ? (notificationFeed.items.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => markNotificationRead(item.id)}
                                    className={`w-full text-left rounded-xl border p-3 transition-colors ${item.is_read ? 'border-neutral-200 bg-neutral-50' : 'border-athlix-red/30 bg-athlix-red/5'}`}
                                >
                                    <p className="text-sm font-bold">{item.title}</p>
                                    <p className="text-xs text-neutral-500 mt-1">{item.message}</p>
                                    <p className="text-[11px] text-neutral-400 mt-1">{item.published_label}</p>
                                </button>
                            ))) : (
                                <p className="text-sm text-neutral-400">{t('pwa.notifications_empty', 'Belum ada notifikasi.')}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {popupNotification && (
                <div className="fixed inset-0 z-[118] bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-5 space-y-3 shadow-xl">
                        <p className="text-xs font-black uppercase tracking-widest text-athlix-red">{t('pwa.latest_notification', 'Notifikasi Terbaru')}</p>
                        <h3 className="text-lg font-black">{popupNotification.title}</h3>
                        <p className="text-sm text-neutral-600 ">{popupNotification.message}</p>
                        <div className="flex justify-end">
                            <button onClick={closePopupNotification} className="px-4 py-2 rounded-xl bg-athlix-red text-white text-sm font-bold">{t('common.close', 'Tutup')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Premium Header */}
            <header className="sticky top-0 z-30 glass-strong px-4 sm:px-5 h-16 flex items-center justify-between gap-3 border-gradient">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                        <img src={logoSrc} alt="Dojo Logo" className="w-10 h-10 rounded-xl shadow-lg shadow-athlix-red/20 object-cover transition-transform duration-300 hover:scale-105 bg-white" />
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-sm sm:text-base font-black uppercase tracking-tight leading-none truncate">{header || 'ATHLIX'}</h1>
                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-[0.18em] mt-0.5 truncate">{t('pwa.dojo_management', 'Dojo Management')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <LanguageSwitch compact />
                    <button
                        onClick={handleNotificationButtonClick}
                        className="text-neutral-400 p-2 rounded-xl border border-neutral-200/80 transition-all duration-300 hover:bg-neutral-100 active:scale-95 relative"
                    >
                        <Bell size={18} />
                        {notificationFeed?.unread_count > 0 && (
                            <div className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-athlix-red text-white text-[10px] font-black flex items-center justify-center">
                                {notificationFeed.unread_count > 9 ? '9+' : notificationFeed.unread_count}
                            </div>
                        )}
                    </button>
                    <div className="w-9 h-9 rounded-xl bg-athlix-red text-white flex items-center justify-center font-black text-xs shadow-md shadow-athlix-red/20 transition-transform duration-300 hover:scale-105 ring-2 ring-neutral-100 overflow-hidden">
                        {user?.profile_photo_url ? (
                            <img src={user.profile_photo_url} alt={user?.name || 'User'} className="w-full h-full object-cover" />
                        ) : (
                            (user?.name?.charAt(0) || 'A')
                        )}
                    </div>
                </div>
            </header>

            {/* Scrollable Main Area */}
            <main className="flex-1 overflow-y-auto px-4 sm:px-5 py-5 sm:py-6 pb-24 sm:pb-28 animate-fade-in-up">
                {children}
            </main>

            {/* Floating Premium Bottom Bar */}
            <div className="fixed bottom-3 sm:bottom-4 w-full px-3 sm:px-5 z-50 pointer-events-none">
                <nav className="max-w-md mx-auto h-[68px] bg-neutral-900/95 backdrop-blur-2xl rounded-[26px] border border-white/10 shadow-nav-float flex items-center justify-between px-2 sm:px-3 pointer-events-auto transition-colors duration-300">
                    {tabs.map((tab) => {
                        const isMainActive = route().current(tab.route);
                        const isActive = tab.subRoutes ? (route().current(tab.route) || route().current(tab.subRoutes)) : isMainActive;

                        if (tab.isPrimary) {
                            return (
                                <Link
                                    key={tab.name}
                                    href={route(tab.route)}
                                    className="flex flex-col items-center justify-center relative -mt-8 shrink-0"
                                >
                                    <div className={`w-[56px] h-[56px] rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-500 border-4 border-neutral-100 ${
                                        isMainActive
                                        ? 'bg-athlix-red text-white scale-110 shadow-athlix-red/40 animate-pulse-glow'
                                        : 'bg-white text-athlix-red hover:scale-105 active:scale-95'
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
                                className={`group flex-1 min-w-0 flex flex-col items-center justify-center h-14 rounded-xl transition-all duration-300 relative ${
                                    isActive
                                    ? 'text-white'
                                    : 'text-neutral-500 hover:text-neutral-300'
                                }`}
                            >
                                {isActive && (
                                    <div className="absolute inset-1 bg-athlix-red/20 rounded-xl animate-scale-in"></div>
                                )}
                                <tab.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} className={`relative z-10 transition-all duration-300 ${isActive ? 'scale-110 text-athlix-red' : 'group-active:scale-90'}`} />
                                <span className={`relative z-10 text-[11px] font-bold uppercase tracking-wide mt-0.5 transition-all duration-300 ${isActive ? 'opacity-100 text-athlix-red' : 'opacity-50'}`}>
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

function triggerNativeNotification(notification, permission) {
    if (permission !== 'granted') return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    try {
        const nativeNotification = new Notification(notification.title || 'Notifikasi ATHLIX', {
            body: notification.message || '',
            icon: '/logo.png', // Or dynamic depending on scope
            tag: `athlix-notif-${notification.id}`,
        });

        nativeNotification.onclick = () => {
            window.focus();
            nativeNotification.close();
        };
    } catch (error) {
        // noop
    }
}

