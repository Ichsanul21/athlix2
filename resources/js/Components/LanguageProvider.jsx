import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'athlix-language';
const ATTRIBUTES_TO_TRANSLATE = ['placeholder', 'title', 'aria-label'];
const INPUT_TYPES_WITH_VALUE_LABEL = new Set(['button', 'submit', 'reset']);

const LanguageContext = createContext({
    locale: 'id',
    setLocale: () => {},
    toggleLocale: () => {},
    t: (key, fallback = '') => fallback || key,
});

const SUPPORTED_LOCALES = ['id', 'en'];

const MESSAGES = {
    id: {
        'common.dashboard': 'Dashboard',
        'common.sign_out': 'Keluar',
        'common.profile': 'Profil',
        'common.close': 'Tutup',
        'common.later': 'Nanti',
        'common.install': 'Pasang',
        'common.home': 'Home',
        'common.schedule': 'Jadwal',
        'common.scan': 'Scan',
        'common.condition': 'Kondisi',
        'common.settings': 'Pengaturan',
        'admin.db_athlete': 'Database Atlet',
        'admin.attendance': 'Absensi',
        'admin.payment': 'Pembayaran',
        'admin.physical_condition': 'Kondisi Fisik',
        'admin.training_program': 'Program Latihan',
        'admin.statistics': 'Statistik',
        'admin.ai_assistant': 'Gemini AI Assistant',
        'admin.athlete_notification': 'Notifikasi Atlet',
        'admin.db_coach': 'Database Pelatih',
        'admin.cms_articles': 'CMS Artikel',
        'admin.cms_gallery': 'CMS Galeri',
        'admin.cms_pricelist': 'CMS Pricelist',
        'admin.cms_dojo_registrations': 'Pendaftaran Dojo',
        'admin.master_account': 'Master Akun',
        'admin.master_dojo': 'Master Dojo',
        'admin.system_settings': 'Pengaturan Sistem',
        'admin.sensei_pwa': 'PWA Sensei',
        'pwa.install_app': 'Instal Aplikasi',
        'pwa.quick_access': 'Akses cepat dari layar utama',
        'pwa.install_now': 'Install Sekarang',
        'pwa.install_modal_desc': 'Pasang aplikasi agar notifikasi, absensi, dan reminder berjalan optimal di perangkat kamu.',
        'pwa.notifications_title': 'Notifikasi Senpai',
        'pwa.notifications_empty': 'Belum ada notifikasi.',
        'pwa.enable_native': 'Aktifkan Notifikasi Native',
        'pwa.enable_native_desc': 'Aktifkan notifikasi perangkat agar update senpai tampil native di perangkat.',
        'pwa.latest_notification': 'Notifikasi Terbaru',
        'pwa.dojo_management': 'Manajemen Dojo',
        'settings.app_options': 'Opsi Aplikasi',
        'settings.account_data': 'Data Akun',
        'settings.name_placeholder': 'Nama akun',
        'settings.phone_placeholder': 'No. WhatsApp',
        'settings.save_account': 'Simpan Data Akun',
        'settings.saving': 'Menyimpan...',
        'settings.language': 'Bahasa',
        'settings.language_desc': 'Pilih bahasa tampilan aplikasi',
        'settings.push_notifications': 'Notifikasi Push',
        'settings.active': 'Aktif',
        'settings.data_privacy': 'Privasi Data',
        'settings.protected': 'Terlindungi',
        'settings.help_faq': 'Bantuan & FAQ',
    },
    en: {
        'common.dashboard': 'Dashboard',
        'common.sign_out': 'Sign Out',
        'common.profile': 'Profile',
        'common.close': 'Close',
        'common.later': 'Later',
        'common.install': 'Install',
        'common.home': 'Home',
        'common.schedule': 'Schedule',
        'common.scan': 'Scan',
        'common.condition': 'Condition',
        'common.settings': 'Settings',
        'admin.db_athlete': 'Athlete Database',
        'admin.attendance': 'Attendance',
        'admin.payment': 'Billing',
        'admin.physical_condition': 'Physical Condition',
        'admin.training_program': 'Training Program',
        'admin.statistics': 'Statistics',
        'admin.ai_assistant': 'Gemini AI Assistant',
        'admin.athlete_notification': 'Athlete Notifications',
        'admin.db_coach': 'Coach Database',
        'admin.cms_articles': 'CMS Articles',
        'admin.cms_gallery': 'CMS Gallery',
        'admin.cms_pricelist': 'CMS Pricelist',
        'admin.cms_dojo_registrations': 'Dojo Registrations',
        'admin.master_account': 'Account Master',
        'admin.master_dojo': 'Dojo Master',
        'admin.system_settings': 'System Settings',
        'admin.sensei_pwa': 'Sensei PWA',
        'pwa.install_app': 'Install App',
        'pwa.quick_access': 'Quick access from your home screen',
        'pwa.install_now': 'Install Now',
        'pwa.install_modal_desc': 'Install the app so notifications, attendance, and reminders work optimally on your device.',
        'pwa.notifications_title': 'Senpai Notifications',
        'pwa.notifications_empty': 'No notifications yet.',
        'pwa.enable_native': 'Enable Native Notifications',
        'pwa.enable_native_desc': 'Enable device notifications so senpai updates appear as native alerts.',
        'pwa.latest_notification': 'Latest Notification',
        'pwa.dojo_management': 'Dojo Management',
        'settings.app_options': 'App Options',
        'settings.account_data': 'Account Data',
        'settings.name_placeholder': 'Account name',
        'settings.phone_placeholder': 'WhatsApp number',
        'settings.save_account': 'Save Account Data',
        'settings.saving': 'Saving...',
        'settings.language': 'Language',
        'settings.language_desc': 'Choose your app language',
        'settings.push_notifications': 'Push Notifications',
        'settings.active': 'Active',
        'settings.data_privacy': 'Data Privacy',
        'settings.protected': 'Protected',
        'settings.help_faq': 'Help & FAQ',
    },
};

const PHRASE_TRANSLATIONS = {
    // Auth & Navigation
    'Masuk Akun': 'Sign In',
    'Keluar Akun': 'Sign Out',
    'Keluar': 'Sign Out',
    'Buat Akun': 'Create Account',
    'Lupa Password': 'Forgot Password',
    'Informasi Pribadi': 'Personal Information',
    'Bantuan & FAQ': 'Help & FAQ',
    'Pengaturan Sistem': 'System Settings',
    'Notifikasi Senpai': 'Senpai Notifications',
    'Notifikasi Atlet': 'Athlete Notifications',
    'Belum ada notifikasi.': 'No notifications yet.',
    'Akses cepat dari layar utama': 'Quick access from your home screen',
    'Simpan Perubahan': 'Save Changes',

    // Landing Page
    'FITUR': 'FEATURES',
    'SISTEM': 'SYSTEM',
    'ARTIKEL': 'ARTICLES',
    'GALERI': 'GALLERY',
    'LOGIN DOJO': 'DOJO LOGIN',
    'Manajemen Anggota': 'Member Management',
    'Penjadwalan Cerdas': 'Smart Scheduling',
    'Otomatisasi Tagihan': 'Automated Billing',
    'Pelacakan Prestasi': 'Achievement Tracking',
    'Fokus pada ': 'Focus on ',
    'Fokus pada': 'Focus on',
    'Fokus pada Latihan.': 'Focus on Training.',
    'Kami urus sisanya.': 'We handle the rest.',
    'Dojo Operating System': 'Dojo Operating System',
    'Sistem operasi dojo yang dirancang khusus untuk sasana bela diri. Kelola anggota, jadwal kelas, tagihan, dan level sabuk dalam satu platform super cepat.': 'Dojo operating system designed specifically for martial arts gyms. Manage members, class schedules, billing, and belt levels in one super fast platform.',
    'MULAI GRATIS': 'START FREE',
    'LIHAT DEMO': 'VIEW DEMO',
    'Dojo Aktif': 'Active Dojos',
    'Atlet Dikelola': 'Athletes Managed',
    'Total Anggota': 'Total Members',
    'Pendapatan Bulan Ini': 'Monthly Revenue',
    'Sistem Aman': 'Secure System',
    'Enkripsi Data 256-bit': '256-bit Data Encryption',
    'Mengapa ATHLIX?': 'Why ATHLIX?',
    'Segala Kebutuhan Dojo': 'All Dojo Needs',
    'di Ujung Jari': 'at Your Fingertips',
    'Performa Maksimal.': 'Maximum Performance.',
    'Tanpa Keringat.': 'Without the Sweat.',
    'Konten Terbaru': 'Latest Content',
    'Artikel ATHLIX': 'ATHLIX Articles',
    'Visual Story': 'Visual Story',
    'Galeri Dojo': 'Dojo Gallery',
    'Siap Berevolusi?': 'Ready to Evolve?',
    'DAFTAR SEKARANG - GRATIS 14 HARI': 'SIGN UP NOW - 14 DAYS FREE',

    // Dojo & Admin Management
    'Master Dojo': 'Dojo Master',
    'Master Akun': 'Account Master',
    'Tambah Dojo': 'Add Dojo',
    'Edit Dojo': 'Edit Dojo',
    'Informasi Dojo': 'Dojo Information',
    'Alamat Dojo': 'Dojo Address',
    'Nama Dojo': 'Dojo Name',
    'Pilih Provinsi': 'Select Province',
    'Pilih Kab/Kota': 'Select City/Regency',
    'Pilih Kecamatan': 'Select District',
    'Pilih Kelurahan': 'Select Village',
    'Alamat Detail': 'Address Details',
    'Paket SaaS & Billing': 'SaaS Plan & Billing',
    'Paket SaaS': 'SaaS Plan',
    'Pilih Paket': 'Select Plan',
    'Biaya Bulanan': 'Monthly Fee',
    'Biaya Monthly': 'Monthly Fee',
    'Siklus Billing (bulan)': 'Billing Cycle (months)',
    'Siklus Billing': 'Billing Cycle',
    'Mulai Langganan': 'Subscription Start',
    'Berakhir Langganan': 'Subscription End',
    'Grace Period Sampai': 'Grace Period Until',
    'Beri Permission Access Active': 'Grant Active Access Permission',
    'Blokir Paksa Access SaaS Server': 'Force Block SaaS Server Access',

    // Modules
    'Database Atlet': 'Athlete Database',
    'Database Atlet Dojo': 'Dojo Athlete Database',
    'Database Pelatih': 'Coach Database',
    'Absensi Atlet': 'Athlete Attendance',
    'Scan Absensi': 'Attendance Scan',
    'Program Latihan': 'Training Program',
    'Jadwal Latihan Dojo': 'Dojo Training Schedule',
    'Kondisi Fisik': 'Physical Condition',
    'Monitoring Kondisi Fisik': 'Physical Condition Monitoring',
    'Statistik': 'Statistics',
    'Kemajuan': 'Progress',
    'Riwayat Prestasi': 'Achievement History',
    'Nama Lengkap': 'Full Name',
    'Cari Atlet...': 'Search Athlete...',
    'Data atlet tidak ditemukan.': 'Athlete data not found.',

    // Attendance & Operations
    'Tidak Ada Latihan Hari Ini': 'No Training Today',
    'Seluruh Agenda Latihan': 'All Training Agendas',
    'Lihat detail lengkap': 'View full details',
    'Sembunyikan detail': 'Hide details',
    'Kehadiran kamu sudah tercatat.': 'Your attendance has been recorded.',
    'Izin Kamera Ditolak': 'Camera Permission Denied',
    'Izinkan akses kamera agar bisa scan QR dojo.': 'Allow camera access to scan dojo QR.',
    'Check-in Berhasil': 'Check-in Successful',
    'Check-out Berhasil': 'Check-out Successful',
    'Form Check-in': 'Check-in Form',
    'Form Check-out': 'Check-out Form',
    'Status izin berhasil dikirim.': 'Permission status submitted successfully.',
    'Status sakit berhasil dikirim.': 'Sick status submitted successfully.',
    'Gagal mengirim status absensi.': 'Failed to submit attendance status.',
    'Gagal mengakses kamera. Pastikan kamera tersedia.': 'Failed to access camera. Make sure camera is available.',
    'Readiness pagi tersimpan ke server.': 'Morning readiness saved to server.',
    'Readiness tersimpan offline dan akan tersinkron otomatis.': 'Readiness saved offline and will sync automatically.',
    'RPE log tersimpan ke server.': 'RPE log saved to server.',
    'RPE log disimpan offline dan akan tersinkron otomatis.': 'RPE log saved offline and will sync automatically.',
    'Durasi latihan harus lebih dari 0 menit.': 'Training duration must be more than 0 minutes.',
    'Sinkronisasi offline berhasil': 'Offline sync successful',
    'Ringkasan Absensi Hari Ini': 'Today Attendance Summary',
    'Latihan Hari Ini': 'Today Training',
    'Menu Latihan Hari Ini': "Today's Training Menu",
    
    // Performance & Evaluation
    'Kondisi & Kemampuan': 'Condition & Ability',
    'Kondisi fisik saat ini': 'Current physical condition',
    'Belum Dinilai': 'Not Rated Yet',
    'Input Rapor Kemampuan Atlet': 'Athlete Skill Report Input',
    'Detail Kemampuan Atlet': 'Athlete Skill Details',
    'Skor Kemampuan Atlet (Diagram Jaring)': 'Athlete Skill Score (Radar Chart)',
    'Tambah Prestasi Atlet': 'Add Athlete Achievement',
    'Nama pertandingan': 'Competition name',
    'Tanggal Lahir': 'Date of Birth',
    'Nama Atlet': 'Athlete Name',

    // Billing & Finance
    'Data pembayaran tidak ditemukan.': 'Payment data not found.',
    'Data IMT belum tersedia.': 'BMI data is not available yet.',
    'Buat Tagihan Bulanan': 'Generate Monthly Billing',
    'Tagihan Bulanan': 'Monthly Billing',
    'Konfirmasi Pembayaran': 'Payment Confirmation',
    'Default billing berhasil disimpan.': 'Default billing has been saved.',
    'Override billing atlet berhasil disimpan.': 'Athlete billing override has been saved.',
    'Pengajuan override berhasil dikirim. Menunggu approval dojo admin.': 'Override request has been sent. Waiting for dojo admin approval.',
    'Queue Pending': 'Pending Queue',
    'Riwayat Pengajuan': 'Request History',
    'Belum Lunas': 'Unpaid',
    'Lunas': 'Paid',
    
    // Actions & General
    'Instal Aplikasi': 'Install App',
    'Install Sekarang': 'Install Now',
    'Simpan': 'Save',
    'Simpan Program': 'Save Program',
    'Simpan Rapor': 'Save Report Card',
    'Menyimpan...': 'Saving...',
    'Batal': 'Cancel',
    'Tutup': 'Close',
    'Kembali': 'Back',
    'Ya': 'Yes',
    'Tidak': 'No',
    'Pencarian': 'Search',
    'Izin': 'Permission',
    'Sakit': 'Sick',
    'Hadir': 'Present',
    'Kondisi': 'Condition',
    'Pengaturan': 'Settings',
};

// Word level translations - carefully curated to avoid phrase mangling
const WORD_TRANSLATIONS = {
    akun: 'account',
    atlet: 'athlete',
    pelatih: 'coach',
    pengguna: 'user',
    absensi: 'attendance',
    jadwal: 'schedule',
    kondisi: 'condition',
    fisik: 'physical',
    latihan: 'training',
    program: 'program',
    statistik: 'statistics',
    notifikasi: 'notification',
    pembayaran: 'billing',
    tagihan: 'invoice',
    laporan: 'report',
    penilaian: 'assessment',
    nilai: 'score',
    kehadiran: 'attendance',
    data: 'data',
    profil: 'profile',
    pengaturan: 'settings',
    bahasa: 'language',
    aktif: 'active',
    nonaktif: 'inactive',
    simpan: 'save',
    batal: 'cancel',
    hapus: 'delete',
    tambah: 'add',
    ubah: 'update',
    edit: 'edit',
    buat: 'create',
    lihat: 'view',
    cari: 'search',
    masuk: 'login',
    keluar: 'logout',
    hadir: 'present',
    izin: 'permission',
    sakit: 'sick',
    selesai: 'completed',
    gagal: 'failed',
    berhasil: 'successful',
    belum: 'not yet',
    sudah: 'already',
    tanggal: 'date',
    waktu: 'time',
    hari: 'day',
    minggu: 'week',
    bulan: 'month',
    tahun: 'year',
    nama: 'name',
    email: 'email',
    nomor: 'number',
    telepon: 'phone',
    alamat: 'address',
    kelas: 'class',
    status: 'status',
    aksi: 'action',
    dashboard: 'dashboard',
    master: 'master',
    sistem: 'system',
    terbaru: 'latest',
    cepat: 'quick',
    aplikasi: 'app',
    perangkat: 'device',
    admin: 'admin',
    super: 'super',
    staf: 'staff',
    medis: 'medical',
    kemajuan: 'progress',
    kesiapan: 'readiness',
    harian: 'daily',
    riwayat: 'history',
    prestasi: 'achievement',
    kemampuan: 'ability',
    sesi: 'session',
    catatan: 'notes',
    khusus: 'special',
    performa: 'performance',
    cedera: 'injury',
    peringatan: 'warning',
    otomatis: 'automatic',
    aktifkan: 'enable',
    nonaktifkan: 'disable',
    diblokir: 'blocked',
    akses: 'access',
    sewa: 'subscription',
    lunas: 'paid',
    iuran: 'fee',
    bulanan: 'monthly',
    diskon: 'discount',
    keluarga: 'family',
    formulir: 'form',
    masukan: 'input',
    keluaran: 'output',
    muncul: 'appear',
    hilang: 'missing',
    ganti: 'replace',
    bendera: 'flag',
    indonesia: 'indonesian',
    inggris: 'english',
    semua: 'all',
    modul: 'module',
    fitur: 'feature',
    manajemen: 'management',
    database: 'database',
    dojo: 'dojo',
    siswa: 'student',
    qr: 'qr',
    detail: 'details',
    persen: 'percent',
    persentase: 'percentage',
    push: 'push',
    native: 'native',
    tombol: 'button',
};

const ORIGINAL_TEXT_CACHE = new WeakMap();
const ORIGINAL_ATTR_CACHE = new WeakMap();

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchCase(source, replacement) {
    if (source === source.toUpperCase()) {
        return replacement.toUpperCase();
    }

    if (source[0] === source[0]?.toUpperCase()) {
        return replacement.charAt(0).toUpperCase() + replacement.slice(1);
    }

    return replacement;
}

function translateTextToEnglish(value) {
    if (!value || !String(value).trim()) {
        return value;
    }

    let output = String(value);

    const phraseEntries = Object.entries(PHRASE_TRANSLATIONS).sort((a, b) => b[0].length - a[0].length);
    for (const [source, target] of phraseEntries) {
        output = output.replace(new RegExp(escapeRegExp(source), 'gi'), (match) => matchCase(match, target));
    }

    output = output.replace(/\b([A-Za-z][A-Za-z-]*)\b/g, (match) => {
        const translated = WORD_TRANSLATIONS[match.toLowerCase()];
        if (!translated) {
            return match;
        }

        return matchCase(match, translated);
    });

    return output;
}

function shouldSkipNode(textNode) {
    const parent = textNode.parentElement;
    if (!parent) {
        return true;
    }

    if (parent.closest('[data-no-auto-translate="true"]')) {
        return true;
    }

    const tagName = parent.tagName;
    return ['SCRIPT', 'STYLE', 'NOSCRIPT', 'PRE', 'CODE', 'KBD', 'SAMP'].includes(tagName);
}

function applyTextNodeTranslation(node, locale) {
    if (shouldSkipNode(node)) {
        return;
    }

    const currentValue = node.nodeValue ?? '';
    if (!currentValue.trim()) {
        return;
    }

    const cachedOriginal = ORIGINAL_TEXT_CACHE.get(node);
    if (!cachedOriginal) {
        ORIGINAL_TEXT_CACHE.set(node, currentValue);
    } else {
        const translatedFromCache = translateTextToEnglish(cachedOriginal);
        const changedExternally = currentValue !== cachedOriginal && currentValue !== translatedFromCache;
        if (changedExternally) {
            ORIGINAL_TEXT_CACHE.set(node, currentValue);
        }
    }

    const original = ORIGINAL_TEXT_CACHE.get(node) ?? currentValue;
    const nextValue = locale === 'id' ? original : translateTextToEnglish(original);

    if (node.nodeValue !== nextValue) {
        node.nodeValue = nextValue;
    }
}

function applyAttributeTranslation(element, locale) {
    if (element.closest('[data-no-auto-translate="true"]')) {
        return;
    }

    let cached = ORIGINAL_ATTR_CACHE.get(element);
    if (!cached) {
        cached = {};
        ORIGINAL_ATTR_CACHE.set(element, cached);
    }

    for (const attr of ATTRIBUTES_TO_TRANSLATE) {
        const value = element.getAttribute(attr);
        if (!value || !value.trim()) {
            continue;
        }

        const existingOriginal = cached[attr];
        if (!existingOriginal) {
            cached[attr] = value;
        } else {
            const translatedFromCache = translateTextToEnglish(existingOriginal);
            const changedExternally = value !== existingOriginal && value !== translatedFromCache;
            if (changedExternally) {
                cached[attr] = value;
            }
        }

        const original = cached[attr];
        const nextValue = locale === 'id' ? original : translateTextToEnglish(original);

        if (value !== nextValue) {
            element.setAttribute(attr, nextValue);
        }
    }

    if (element instanceof HTMLInputElement && INPUT_TYPES_WITH_VALUE_LABEL.has((element.type || '').toLowerCase())) {
        const value = element.value;
        if (value && value.trim()) {
            if (!cached.value) {
                cached.value = value;
            } else {
                const translatedFromCache = translateTextToEnglish(cached.value);
                const changedExternally = value !== cached.value && value !== translatedFromCache;
                if (changedExternally) {
                    cached.value = value;
                }
            }

            const original = cached.value;
            const nextValue = locale === 'id' ? original : translateTextToEnglish(original);
            if (value !== nextValue) {
                element.value = nextValue;
            }
        }
    }
}

function translateSubtree(rootNode, locale) {
    if (!rootNode) {
        return;
    }

    if (rootNode.nodeType === Node.TEXT_NODE) {
        applyTextNodeTranslation(rootNode, locale);
        return;
    }

    if (rootNode.nodeType !== Node.ELEMENT_NODE) {
        return;
    }

    const rootElement = rootNode;
    applyAttributeTranslation(rootElement, locale);

    const walker = document.createTreeWalker(rootElement, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
        applyTextNodeTranslation(walker.currentNode, locale);
    }

    const elements = rootElement.querySelectorAll('*');
    for (const element of elements) {
        applyAttributeTranslation(element, locale);
    }
}

function resolveInitialLocale() {
    if (typeof window === 'undefined') {
        return 'id';
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LOCALES.includes(stored)) {
        return stored;
    }

    const htmlLang = (document.documentElement.lang || '').toLowerCase();
    if (htmlLang.startsWith('id')) {
        return 'id';
    }

    if (htmlLang.startsWith('en')) {
        return 'en';
    }

    return 'id';
}

export function LanguageProvider({ children }) {
    const [locale, setLocaleState] = useState(resolveInitialLocale);
    const originalTitleRef = useRef('');

    useEffect(() => {
        if (typeof document === 'undefined') {
            return;
        }

        document.documentElement.classList.remove('dark');
        document.documentElement.lang = locale;
        window.localStorage.setItem(STORAGE_KEY, locale);
    }, [locale]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }

        const originalConfirm = window.confirm;
        const originalAlert = window.alert;
        const originalPrompt = window.prompt;

        if (locale === 'en') {
            window.confirm = (message) => originalConfirm(translateTextToEnglish(String(message ?? '')));
            window.alert = (message) => originalAlert(translateTextToEnglish(String(message ?? '')));
            window.prompt = (message, defaultValue) => originalPrompt(
                translateTextToEnglish(String(message ?? '')),
                defaultValue,
            );
        }

        return () => {
            window.confirm = originalConfirm;
            window.alert = originalAlert;
            window.prompt = originalPrompt;
        };
    }, [locale]);

    useEffect(() => {
        if (typeof document === 'undefined') {
            return undefined;
        }

        let applying = false;
        let timerId = null;

        const runTranslate = (target = document.body) => {
            applying = true;
            try {
                translateSubtree(target, locale);

                if (locale === 'id') {
                    originalTitleRef.current = document.title;
                } else {
                    if (!originalTitleRef.current || document.title !== translateTextToEnglish(originalTitleRef.current)) {
                        originalTitleRef.current = document.title;
                    }
                    document.title = translateTextToEnglish(originalTitleRef.current);
                }
            } finally {
                applying = false;
            }
        };

        const scheduleTranslate = (target = document.body, delay = 40) => {
            if (timerId) {
                window.clearTimeout(timerId);
            }

            timerId = window.setTimeout(() => {
                runTranslate(target);
            }, delay);
        };

        runTranslate(document.body);

        const observer = new MutationObserver((mutations) => {
            if (applying) {
                return;
            }

            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    runTranslate(node);
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        const onInertiaFinish = () => {
            scheduleTranslate(document.body, 80);
        };

        document.addEventListener('inertia:finish', onInertiaFinish);

        return () => {
            observer.disconnect();
            document.removeEventListener('inertia:finish', onInertiaFinish);
            if (timerId) {
                window.clearTimeout(timerId);
            }
        };
    }, [locale]);

    const setLocale = (nextLocale) => {
        if (!SUPPORTED_LOCALES.includes(nextLocale)) {
            return;
        }

        setLocaleState(nextLocale);
    };

    const toggleLocale = () => {
        setLocaleState((previous) => (previous === 'id' ? 'en' : 'id'));
    };

    const value = useMemo(() => ({
        locale,
        setLocale,
        toggleLocale,
        t: (key, fallback = '') => {
            const direct = MESSAGES[locale]?.[key];
            if (direct) {
                return direct;
            }

            const base = fallback || key;
            return locale === 'en'
                ? translateTextToEnglish(base)
                : base;
        },
    }), [locale]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}

export default LanguageProvider;
