import React, { useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import RegistrationModal from './RegistrationModal';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import {
    CalendarDays,
    Users,
    Trophy,
    CreditCard,
    BarChart3,
    ChevronRight,
    Menu,
    X,
    Play,
    ShieldCheck,
    Zap,
    CheckCircle2,
    Clapperboard,
} from 'lucide-react';
import LanguageSwitch from '@/Components/LanguageSwitch';

const features = [
    {
        icon: Users,
        title: 'Manajemen Anggota',
        description: 'Pantau sabuk, absensi, dan perkembangan fisik setiap anggota dojo dari satu dashboard.',
    },
    {
        icon: CalendarDays,
        title: 'Penjadwalan Cerdas',
        description: 'Atur jadwal kelas, sesi privat, dan ujian kenaikan tingkat tanpa bentrok antar pelatih.',
    },
    {
        icon: CreditCard,
        title: 'Otomatisasi Tagihan',
        description: 'Sistem pembayaran SPP dan pendaftaran otomatis yang terhubung ke laporan keuangan.',
    },
    {
        icon: Trophy,
        title: 'Pelacakan Prestasi',
        description: 'Catat riwayat turnamen, medali, dan sertifikasi untuk memantau karier atlet.',
    },
];

const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(date);
};

export default function Index({ articles = [], galleries = [], localeAlternates = [] }) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showRegistrationModal, setShowRegistrationModal] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <Head title="ATHLIX | Dojo Operating System">
                <meta name="description" content="Platform operasi dojo modern: anggota, jadwal, tagihan, artikel, galeri, dan performa dalam satu sistem." />
                <meta property="og:title" content="ATHLIX | Dojo Operating System" />
                <meta property="og:description" content="Kelola operasional dojo dengan kecepatan enterprise." />
                <meta property="og:image" content="/logo.png" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="ATHLIX | Dojo Operating System" />
                <meta name="twitter:description" content="Kelola operasional dojo dengan kecepatan enterprise." />
                <meta name="twitter:image" content="/logo.png" />
                <link rel="canonical" href={route('landing.index')} />
                {localeAlternates.map((alternate) => (
                    <link key={alternate.locale} rel="alternate" hrefLang={alternate.locale} href={alternate.href} />
                ))}
            </Head>

            <div className="min-h-screen overflow-x-hidden bg-slate-950 font-sans text-slate-50 selection:bg-red-500 selection:text-white">
                <nav className={`fixed z-50 w-full transition-all duration-300 ${isScrolled ? 'border-b border-slate-800 bg-slate-950/90 py-4 backdrop-blur-md' : 'bg-transparent py-6'}`}>
                    <div className="container mx-auto flex items-center justify-between px-6 lg:px-12">
                        <div className="flex items-center gap-3">
                            <img src="/logo.png" alt="ATHLIX Logo" className="h-10 w-10 rounded-xl object-cover ring-1 ring-white/20" />
                            <span className="text-2xl font-black tracking-wide text-white">ATHLIX</span>
                        </div>

                        <div className="hidden items-center gap-8 text-sm font-semibold tracking-widest text-slate-300 md:flex">
                            <a href="#fitur" className="transition-colors hover:text-red-500">FITUR</a>
                            <a href="#sistem" className="transition-colors hover:text-red-500">SISTEM</a>
                            <a href="#artikel" className="transition-colors hover:text-red-500">ARTIKEL</a>
                            <a href="#galeri" className="transition-colors hover:text-red-500">GALERI</a>
                            <LanguageSwitch compact />
                            <Link href={route('login')} className="rounded-md bg-red-600 px-6 py-2.5 text-white shadow-[0_4px_14px_0_rgba(220,38,38,0.39)] transition-all hover:-translate-y-0.5 hover:bg-red-700">
                                LOGIN DOJO
                            </Link>
                        </div>

                        <button className="text-slate-300 transition-colors hover:text-white md:hidden" onClick={() => setMobileMenuOpen((prev) => !prev)}>
                            {mobileMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
                        </button>
                    </div>

                    {mobileMenuOpen && (
                        <div className="absolute left-0 top-full flex w-full animate-fade-in flex-col gap-4 border-b border-slate-800 bg-slate-900 px-6 py-4 shadow-xl md:hidden">
                            <a href="#fitur" className="border-b border-slate-800 py-2 font-bold tracking-wider text-slate-300" onClick={() => setMobileMenuOpen(false)}>FITUR</a>
                            <a href="#sistem" className="border-b border-slate-800 py-2 font-bold tracking-wider text-slate-300" onClick={() => setMobileMenuOpen(false)}>SISTEM</a>
                            <a href="#artikel" className="border-b border-slate-800 py-2 font-bold tracking-wider text-slate-300" onClick={() => setMobileMenuOpen(false)}>ARTIKEL</a>
                            <a href="#galeri" className="border-b border-slate-800 py-2 font-bold tracking-wider text-slate-300" onClick={() => setMobileMenuOpen(false)}>GALERI</a>
                            <div className="py-2"><LanguageSwitch compact={false} /></div>
                            <Link href={route('login')} className="mt-2 rounded-md bg-red-600 px-4 py-3 text-center font-bold tracking-wider text-white">
                                LOGIN DOJO
                            </Link>
                        </div>
                    )}
                </nav>

                <section className="relative pb-20 pt-32 lg:pb-32 lg:pt-48">
                    <div className="absolute left-0 top-0 -z-10 h-full w-full overflow-hidden">
                        <div className="absolute right-[-5%] top-[-10%] h-[400px] w-[400px] rounded-full bg-red-600/20 blur-[120px]" />
                        <div className="absolute bottom-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-900/20 blur-[120px]" />
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                        <div className="absolute inset-0 bg-slate-950 [mask-image:radial-gradient(transparent,black)]" />
                    </div>

                    <div className="container relative z-10 mx-auto flex flex-col items-center gap-16 px-6 lg:flex-row lg:px-12">
                        <div className="flex flex-col gap-6 text-center lg:w-1/2 lg:text-left">
                            <div className="mx-auto inline-flex w-max items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1 lg:mx-0">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Dojo Operating System</span>
                            </div>

                            <h1 className="text-5xl font-black uppercase leading-tight tracking-tight lg:text-7xl">
                                Fokus pada <span className="bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">Latihan.</span>
                                <br />
                                Kami urus sisanya.
                            </h1>

                            <p className="mx-auto max-w-xl text-lg leading-relaxed text-slate-400 lg:mx-0">
                                Sistem operasi dojo yang dirancang khusus untuk sasana bela diri. Kelola anggota, jadwal kelas, tagihan, dan level sabuk dalam satu platform super cepat.
                            </p>

                            <div className="mt-4 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
                                <button onClick={() => setShowRegistrationModal(true)} className="group flex items-center justify-center gap-2 rounded-md bg-red-600 px-8 py-4 font-bold text-white shadow-[0_10px_30px_-10px_rgba(220,38,38,0.7)] transition-transform hover:-translate-y-1 hover:bg-red-700">
                                    MULAI GRATIS
                                    <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </button>
                                <a href="#artikel" className="flex items-center justify-center gap-2 rounded-md border border-slate-700 bg-slate-800/80 px-8 py-4 font-bold text-white transition-colors hover:border-slate-500 hover:bg-slate-700">
                                    <Play className="h-5 w-5" /> LIHAT DEMO
                                </a>
                            </div>

                            <div className="mt-8 flex items-center justify-center gap-8 border-t border-slate-800/60 pt-8 lg:justify-start">
                                <div className="flex flex-col">
                                    <span className="text-3xl font-black text-white">500+</span>
                                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Dojo Aktif</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-3xl font-black text-white">50k+</span>
                                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Atlet Dikelola</span>
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 hidden w-full [perspective:2000px] md:block lg:w-1/2">
                            <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl transition-all duration-700 hover:shadow-[0_20px_50px_rgba(220,38,38,0.2)] [transform:rotateY(-15deg)_rotateX(5deg)] hover:[transform:rotateY(-5deg)_rotateX(2deg)]">
                                <div className="flex h-10 items-center gap-2 border-b border-slate-800 bg-slate-950 px-4">
                                    <div className="h-3 w-3 rounded-full bg-red-500/80" />
                                    <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                                    <div className="h-3 w-3 rounded-full bg-green-500/80" />
                                    <div className="ml-4 flex-1 truncate rounded bg-slate-800 px-3 py-1 font-mono text-[10px] text-slate-400">athlix.app/dashboard/admin</div>
                                </div>
                                <div className="grid h-[400px] grid-cols-4 gap-6 bg-slate-900/80 p-6">
                                    <div className="col-span-1 flex flex-col gap-4 border-r border-slate-800 pr-4">
                                        <div className="flex h-8 w-full items-center rounded border border-red-500/30 bg-red-600/20 px-2 text-red-500">
                                            <div className="mr-2 h-4 w-4 rounded bg-red-500" />
                                            <span className="text-xs font-bold">Dashboard</span>
                                        </div>
                                        <div className="h-6 w-3/4 rounded bg-slate-800" />
                                        <div className="h-6 w-5/6 rounded bg-slate-800" />
                                        <div className="h-6 w-4/5 rounded bg-slate-800" />
                                        <div className="mt-auto h-6 w-full rounded bg-slate-800" />
                                    </div>
                                    <div className="col-span-3 flex flex-col gap-6">
                                        <div className="flex gap-4">
                                            <div className="flex h-24 flex-1 flex-col justify-between rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-4 shadow-inner">
                                                <span className="text-xs font-medium text-slate-400">Total Anggota</span>
                                                <span className="text-2xl font-black text-white">1,204</span>
                                            </div>
                                            <div className="relative flex h-24 flex-1 flex-col justify-between overflow-hidden rounded-xl border border-red-900/50 bg-gradient-to-br from-red-900/40 to-slate-900 p-4">
                                                <span className="text-xs font-medium text-red-400">Pendapatan Bulan Ini</span>
                                                <span className="text-2xl font-black text-white">Rp 45M</span>
                                                <BarChart3 className="absolute bottom-[-10px] right-[-10px] h-16 w-16 text-red-500/10" />
                                            </div>
                                        </div>
                                        <div className="flex flex-1 items-end gap-2 rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
                                            {[40, 70, 45, 90, 65, 80, 55, 100].map((height, index) => (
                                                <div key={index} className="flex-1 rounded-t-sm bg-red-500/80 transition-all duration-700" style={{ height: `${height}%`, animationDelay: `${index * 100}ms` }} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute -bottom-8 -left-8 z-20 flex animate-bounce items-center gap-4 rounded-xl border border-slate-700 bg-slate-800 p-4 shadow-2xl" style={{ animationDuration: '4s' }}>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
                                    <ShieldCheck className="h-6 w-6 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">Sistem Aman</p>
                                    <p className="text-xs text-slate-400">Enkripsi Data 256-bit</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="relative overflow-hidden border-y border-slate-800 bg-slate-950/80 py-5 backdrop-blur-sm">
                    <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-slate-950 via-transparent to-slate-950" />
                    <div className="flex w-max items-center gap-16 px-4 [animation:scrollX_40s_linear_infinite]">
                        {[1, 2].map((group) => (
                            <React.Fragment key={group}>
                                <span className="flex items-center gap-3 text-xl font-black uppercase tracking-widest text-slate-600"><Zap className="h-5 w-5 text-red-600/50" />KARATE KYOKUSHIN</span>
                                <span className="text-2xl text-slate-800">|</span>
                                <span className="flex items-center gap-3 text-xl font-black uppercase tracking-widest text-slate-600"><Zap className="h-5 w-5 text-red-600/50" />BRAZILIAN JIU-JITSU</span>
                                <span className="text-2xl text-slate-800">|</span>
                                <span className="flex items-center gap-3 text-xl font-black uppercase tracking-widest text-slate-600"><Zap className="h-5 w-5 text-red-600/50" />MUAY THAI CAMP</span>
                                <span className="text-2xl text-slate-800">|</span>
                                <span className="flex items-center gap-3 text-xl font-black uppercase tracking-widest text-slate-600"><Zap className="h-5 w-5 text-red-600/50" />TAEKWONDO ACADEMY</span>
                                <span className="text-2xl text-slate-800">|</span>
                                <span className="flex items-center gap-3 text-xl font-black uppercase tracking-widest text-slate-600"><Zap className="h-5 w-5 text-red-600/50" />MMA GYM</span>
                                <span className="text-2xl text-slate-800">|</span>
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <section id="fitur" className="relative bg-slate-900 py-24">
                    <div className="container mx-auto px-6 lg:px-12">
                        <div className="mx-auto mb-16 max-w-2xl text-center">
                            <h2 className="mb-3 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest text-red-500">
                                <span className="h-px w-8 bg-red-500" /> Mengapa ATHLIX? <span className="h-px w-8 bg-red-500" />
                            </h2>
                            <h3 className="text-3xl font-black uppercase tracking-tight md:text-5xl">Segala Kebutuhan Dojo<br />di Ujung Jari</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                            {features.map((feature, index) => (
                                <div key={index} className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:border-red-500/50 hover:shadow-red-500/10">
                                    <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-red-600/10 opacity-0 blur-[50px] transition-opacity duration-500 group-hover:opacity-100" />
                                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 shadow-inner transition-colors group-hover:border-red-500/30 group-hover:bg-red-600/10">
                                        <feature.icon className="h-8 w-8 text-red-500" />
                                    </div>
                                    <h4 className="mb-3 text-xl font-bold text-white transition-colors group-hover:text-red-400">{feature.title}</h4>
                                    <p className="text-sm leading-relaxed text-slate-400">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="sistem" className="relative overflow-hidden bg-slate-950 py-24">
                    <div className="pointer-events-none absolute inset-0 z-0 h-[120%] -translate-y-[10%] -skew-y-3 bg-red-600 opacity-[0.03]" />
                    <div className="container relative z-10 mx-auto px-6 lg:px-12">
                        <div className="flex flex-col items-center gap-16 lg:flex-row">
                            <div className="lg:w-1/2">
                                <h2 className="mb-6 text-4xl font-black uppercase italic leading-tight md:text-6xl">
                                    Performa Maksimal.<br />Tanpa <span className="text-red-500">Keringat.</span>
                                </h2>
                                <p className="mb-8 text-lg leading-relaxed text-slate-400">
                                    Hadir dengan infrastruktur server mutakhir, ATHLIX menjamin kecepatan, keamanan, dan reliabilitas kelas enterprise. Kurangi pekerjaan administratif, fokus kembali ke matras.
                                </p>
                                <ul className="space-y-5">
                                    {[
                                        'Manajemen inventaris peralatan dan merchandise',
                                        'Notifikasi WhatsApp otomatis untuk tagihan bulanan',
                                        'Portal khusus untuk atlet dan orang tua',
                                        'Laporan analitik performa pelatih dan kelas',
                                    ].map((item, index) => (
                                        <li key={index} className="group flex items-start gap-4">
                                            <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-900 transition-colors group-hover:border-red-500 group-hover:bg-red-600">
                                                <CheckCircle2 className="h-4 w-4 text-slate-500 transition-colors group-hover:text-white" />
                                            </div>
                                            <span className="font-medium text-slate-300 transition-colors group-hover:text-white">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="mt-10 w-full lg:mt-0 lg:w-1/2">
                                <div className="relative rounded-2xl border border-slate-800 bg-slate-900/50 p-2">
                                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-red-600 to-red-900 opacity-20 blur" />
                                    <img src="https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80&w=800" alt="Martial Arts Dojo Training" className="relative h-[400px] w-full rounded-xl object-cover grayscale transition-all duration-700 hover:opacity-100 hover:grayscale-0" />
                                    <div className="absolute bottom-6 right-6 rotate-[-5deg] rounded-lg bg-red-600 px-6 py-3 font-black uppercase tracking-wider text-white shadow-xl">Ready to Fight</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="artikel" className="bg-slate-900 py-24">
                    <div className="container mx-auto space-y-12 px-6 lg:px-12">
                        <div className="text-center">
                            <p className="text-sm font-bold uppercase tracking-widest text-red-500">Konten Terbaru</p>
                            <h3 className="mt-2 text-3xl font-black uppercase tracking-tight md:text-5xl">Artikel ATHLIX</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {articles.length === 0 && (
                                <div className="col-span-full rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center text-slate-400">
                                    Artikel belum tersedia.
                                </div>
                            )}
                            {articles.map((article) => (
                                <Link key={article.id} href={article.slug ? route('landing.articles.show', article.slug) : '#artikel'} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-lg transition-transform hover:-translate-y-1">
                                    {article.thumbnail_path && (
                                        <img src={resolveMediaUrl(article.thumbnail_path)} alt={article.thumbnail_alt || article.title} className="h-44 w-full object-cover" />
                                    )}
                                    <div className="space-y-3 p-5">
                                        <div className="flex items-center justify-between text-xs uppercase tracking-widest text-slate-500">
                                            <span>{article.category || 'General'}</span>
                                            <span>{formatDate(article.publish_at)}</span>
                                        </div>
                                        <h4 className="line-clamp-2 text-xl font-black text-white">{article.title}</h4>
                                        <p className="line-clamp-3 text-sm text-slate-400">{article.excerpt || article.seo_description || ''}</p>
                                        <div className="text-xs font-semibold uppercase tracking-widest text-red-400">{article.reading_time ? `${article.reading_time} menit baca` : 'Insight ATHLIX'}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="galeri" className="bg-slate-950 py-24">
                    <div className="container mx-auto space-y-10 px-6 lg:px-12">
                        <div className="text-center">
                            <p className="text-sm font-bold uppercase tracking-widest text-red-500">Visual Story</p>
                            <h3 className="mt-2 text-3xl font-black uppercase tracking-tight md:text-5xl">Galeri Dojo</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                            {galleries.length === 0 && (
                                <div className="col-span-full rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
                                    Galeri belum tersedia.
                                </div>
                            )}
                            {galleries.map((gallery) => (
                                <Link key={gallery.id} href={gallery.slug ? route('landing.galleries.show', gallery.slug) : '#galeri'} className="group overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                                    {gallery.media_type === 'video' && gallery.video_url ? (
                                        <div className="relative">
                                            <video
                                                src={resolveMediaUrl(gallery.video_url)}
                                                poster={resolveMediaUrl(gallery.image_path)}
                                                className="h-36 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-44"
                                                muted
                                                playsInline
                                            />
                                            <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                                                <Clapperboard className="h-3 w-3" />
                                                Video
                                            </div>
                                        </div>
                                    ) : (
                                        <img src={resolveMediaUrl(gallery.image_path)} alt={gallery.image_alt || gallery.title} className="h-36 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-44" />
                                    )}
                                    <div className="p-3">
                                        <p className="truncate text-sm font-bold text-white">{gallery.title}</p>
                                        <p className="truncate text-xs text-slate-400">{gallery.caption || gallery.location || 'Dokumentasi ATHLIX'}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="relative overflow-hidden bg-red-600 py-24">
                    <div className="absolute inset-0 opacity-10 mix-blend-multiply">
                        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <pattern id="diagonal-lines" width="40" height="40" patternUnits="userSpaceOnUse">
                                    <path d="M-10,10 l20,-20 M0,40 l40,-40 M30,50 l20,-20" stroke="currentColor" strokeWidth="4" />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#diagonal-lines)" />
                        </svg>
                    </div>

                    <div className="container relative z-10 mx-auto flex flex-col items-center px-6 text-center lg:px-12">
                        <img src="/logo.png" alt="ATHLIX Logo" className="mb-6 h-16 w-16 rounded-2xl object-cover ring-2 ring-white/30" />
                        <h2 className="mb-6 text-4xl font-black uppercase tracking-tight text-white md:text-6xl">Siap Berevolusi?</h2>
                        <p className="mx-auto mb-10 max-w-2xl text-xl text-red-100">
                            Bergabung dengan ratusan pemilik dojo yang sudah mengoptimalkan manajemen sasana mereka bersama ATHLIX.
                        </p>
                        <button onClick={() => setShowRegistrationModal(true)} className="flex items-center gap-3 rounded-lg border-b-4 border-slate-800 bg-slate-950 px-10 py-5 font-black uppercase tracking-widest text-white shadow-2xl transition-all hover:scale-105 hover:bg-black active:translate-y-1 active:border-b-0">
                            DAFTAR SEKARANG - GRATIS 14 HARI <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </section>

                <footer className="border-t border-slate-900 bg-slate-950 py-12">
                    <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-6 md:flex-row lg:px-12">
                        <div className="flex cursor-pointer items-center gap-2 opacity-80 transition-opacity hover:opacity-100">
                            <img src="/logo.png" alt="ATHLIX Logo" className="h-9 w-9 rounded-lg object-cover ring-1 ring-white/20" />
                            <span className="text-xl font-black tracking-wide text-white">ATHLIX</span>
                        </div>
                        <p className="text-sm font-medium text-slate-500">&copy; 2026 ATHLIX Dojo Operating System. All rights reserved.</p>
                        <div className="flex gap-4">
                            <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-400 transition-all hover:border-slate-700 hover:bg-slate-800 hover:text-red-500">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
                            </a>
                            <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-400 transition-all hover:border-slate-700 hover:bg-slate-800 hover:text-red-500">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                            </a>
                        </div>
                    </div>
                </footer>
            </div>

            <style>{`@keyframes scrollX { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
            
            <RegistrationModal show={showRegistrationModal} onClose={() => setShowRegistrationModal(false)} />
        </>
    );
}
