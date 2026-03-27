import { Head, Link } from '@inertiajs/react';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import {
    ArrowUpRight,
    CalendarCheck2,
    Activity,
    CreditCard,
    Dumbbell,
    ShieldCheck,
    Smartphone,
    Sparkles,
} from 'lucide-react';

const formatCurrency = (amount, currency = 'IDR') => {
    if (currency === 'IDR') {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(amount || 0);
    }

    return `${currency} ${amount || 0}`;
};

const pillars = [
    {
        title: 'Sensei Operations',
        desc: 'Database atlet, rapor kemampuan, presensi cepat, dan evaluasi sesi real-time.',
        icon: CalendarCheck2,
    },
    {
        title: 'Athlete PWA',
        desc: 'QR attendance, kondisi fisik harian, feedback pasca latihan, dan notifikasi native.',
        icon: Smartphone,
    },
    {
        title: 'Dynamic Billing',
        desc: 'Iuran default per kelas, override per atlet, approval queue, dan invoice otomatis.',
        icon: CreditCard,
    },
    {
        title: 'Performance Intel',
        desc: 'Radar skill, trend kondisi fisik, dan data readiness untuk mencegah overtraining.',
        icon: Activity,
    },
];

const journey = [
    {
        label: 'White Belt',
        title: 'Onboard Atlet & Kelas',
        desc: 'Registrasi data lengkap, dokumen, foto, dan assignment sensei dalam satu flow.',
    },
    {
        label: 'Orange Belt',
        title: 'Ritme Operasional Harian',
        desc: 'Absensi QR, jadwal latihan, catatan performa, dan komunikasi atlet berjalan otomatis.',
    },
    {
        label: 'Black Belt',
        title: 'Dojo Growth Engine',
        desc: 'Analitik kondisi fisik, billing dinamis, serta dashboard bisnis untuk keputusan cepat.',
    },
];

export default function Index({ auth, articles = [], galleries = [], priceLists = [] }) {
    return (
        <>
            <Head title="ATHLIX - End-to-End Dojo OS" />

            <div
                className="min-h-screen text-neutral-900"
                style={{
                    fontFamily: "'Space Grotesk', 'Sora', sans-serif",
                    background: 'radial-gradient(circle at 10% 0%, rgba(15,23,42,0.9), rgba(15,23,42,0.96) 35%), linear-gradient(140deg, #0f172a 0%, #1e1b4b 40%, #1f2937 70%, #7c2d12 100%)',
                }}
            >
                <div className="min-h-screen bg-[radial-gradient(circle_at_85%_10%,rgba(230,30,50,0.28),transparent_34%),radial-gradient(circle_at_25%_75%,rgba(245,158,11,0.16),transparent_40%)]">
                    <header className="sticky top-0 z-30 border-b border-white/10 bg-neutral-950/45 backdrop-blur-xl">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                                <img src="/logo.png" alt="ATHLIX" className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/20" />
                                <div className="min-w-0">
                                    <p className="text-lg font-black tracking-tight text-white">ATHLIX</p>
                                    <p className="text-[10px] uppercase tracking-[0.28em] text-white/60">Disciplined Energy Platform</p>
                                </div>
                            </div>
                            <Link href={route('login')} className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-athlix-red text-white hover:bg-red-700 transition-colors">
                                Masuk
                            </Link>
                        </div>
                    </header>

                    <main>
                        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
                            <div className="grid lg:grid-cols-12 gap-7 items-stretch">
                                <div className="lg:col-span-7 rounded-3xl border border-white/15 bg-white/5 backdrop-blur-xl p-7 sm:p-10 shadow-2xl shadow-black/30 relative overflow-hidden">
                                    <div className="absolute -top-20 -right-10 w-52 h-52 rounded-full bg-athlix-red/30 blur-3xl" />
                                    <div className="absolute -bottom-20 -left-8 w-56 h-56 rounded-full bg-amber-400/20 blur-3xl" />

                                    <div className="relative z-10 space-y-5">
                                        <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] font-black text-white">
                                            <Sparkles size={12} /> One-Page Dojo Command Center
                                        </p>

                                        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
                                            Tradisi dojo, 
                                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-white to-amber-200"> kecepatan digital modern.</span>
                                        </h1>

                                        <p className="text-sm sm:text-base text-white/80 max-w-2xl">
                                            ATHLIX menyatukan operasi tatami, progres atlet, notifikasi, dan keuangan dalam satu alur secepat gerakan kumite: presisi, responsif, dan siap skala dari dojo lokal sampai federasi.
                                        </p>

                                        <div className="flex flex-wrap gap-3 pt-1">
                                            <Link href={route('login')} className="px-5 py-3 rounded-2xl bg-athlix-red text-white text-sm font-black uppercase tracking-wider inline-flex items-center gap-2">
                                                Mulai Operasional
                                                <ArrowUpRight size={16} />
                                            </Link>
                                            <a href="#journey" className="px-5 py-3 rounded-2xl bg-white/10 border border-white/30 text-sm font-black uppercase tracking-wider text-white">
                                                Lihat Journey
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                                    <div className="col-span-2 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-5 text-white">
                                        <p className="text-[11px] font-black uppercase tracking-widest text-white/70">Athlix Ops Pulse</p>
                                        <p className="text-2xl font-black mt-2">Agile Precision for Dojo Teams</p>
                                    </div>
                                    <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-5 text-white">
                                        <p className="text-[11px] uppercase tracking-widest text-white/70 font-black">Engine</p>
                                        <p className="text-lg font-black mt-2">Multi-Tenant</p>
                                    </div>
                                    <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-5 text-white">
                                        <p className="text-[11px] uppercase tracking-widest text-white/70 font-black">Workflow</p>
                                        <p className="text-lg font-black mt-2">Offline-First PWA</p>
                                    </div>
                                    <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-5 text-white">
                                        <p className="text-[11px] uppercase tracking-widest text-white/70 font-black">Decision</p>
                                        <p className="text-lg font-black mt-2">Realtime Analytics</p>
                                    </div>
                                    <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-5 text-white">
                                        <p className="text-[11px] uppercase tracking-widest text-white/70 font-black">Finance</p>
                                        <p className="text-lg font-black mt-2">Dynamic Billing</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section id="journey" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8">
                            <div className="rounded-3xl border border-white/10 bg-white/95 p-6 sm:p-8 shadow-2xl">
                                <div className="flex items-center gap-2 mb-5">
                                    <Dumbbell size={16} className="text-athlix-red" />
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">Athlete Lifecycle Kata</p>
                                </div>
                                <div className="grid md:grid-cols-3 gap-4">
                                    {journey.map((step, index) => (
                                        <article key={step.label} className="rounded-2xl border border-neutral-200 bg-white p-5">
                                            <p className="text-[11px] font-black uppercase tracking-widest text-athlix-red">{index + 1}. {step.label}</p>
                                            <h3 className="text-lg font-black mt-2 leading-tight">{step.title}</h3>
                                            <p className="text-sm text-neutral-600 mt-2">{step.desc}</p>
                                        </article>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <section id="modul" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
                            <div className="flex items-end justify-between gap-4">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] font-black text-white/70">Core Modules</p>
                                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-1 text-white">End-to-End Dojo Operating Stack</h2>
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
                                {pillars.map((module) => (
                                    <article key={module.title} className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-5 text-white hover:-translate-y-1 transition-transform">
                                        <module.icon size={18} className="text-red-300" />
                                        <p className="text-base font-black mt-3">{module.title}</p>
                                        <p className="text-sm text-white/75 mt-2">{module.desc}</p>
                                    </article>
                                ))}
                            </div>
                        </section>

                        <section id="pricelist" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
                            <div className="rounded-3xl border border-white/10 bg-white p-6 sm:p-8">
                                <h2 className="text-2xl font-black tracking-tight">Pricelist</h2>
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
                                    {priceLists.map((item) => (
                                        <article
                                            key={item.id}
                                            className={`rounded-2xl p-5 border ${
                                                item.is_featured
                                                    ? 'border-athlix-red bg-white shadow-lg shadow-athlix-red/10'
                                                    : 'border-neutral-200 bg-white'
                                            }`}
                                        >
                                            <p className="text-xs font-black uppercase tracking-widest text-neutral-500">{item.title}</p>
                                            <p className="text-2xl font-black mt-2">{formatCurrency(item.price, item.currency)}</p>
                                            <p className="text-sm text-neutral-600 mt-2">{item.description}</p>
                                        </article>
                                    ))}
                                    {priceLists.length === 0 && <p className="text-sm text-neutral-500">Pricelist belum tersedia.</p>}
                                </div>
                            </div>
                        </section>

                        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
                            <div className="rounded-3xl border border-white/10 bg-white p-6 sm:p-8">
                                <h2 className="text-2xl font-black tracking-tight">Artikel</h2>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
                                    {articles.map((article) => (
                                        <article key={article.id} className="rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                                            {article.thumbnail_path && (
                                                <img src={resolveMediaUrl(article.thumbnail_path)} alt={article.title} className="w-full h-40 object-cover" />
                                            )}
                                            <div className="p-4">
                                                <h3 className="font-black text-lg leading-tight">{article.title}</h3>
                                                <p className="text-sm text-neutral-600 mt-2">{article.excerpt || article.content?.slice(0, 120)}</p>
                                            </div>
                                        </article>
                                    ))}
                                    {articles.length === 0 && <p className="text-sm text-neutral-500">Artikel belum tersedia.</p>}
                                </div>
                            </div>
                        </section>

                        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 pb-20">
                            <div className="rounded-3xl border border-white/10 bg-white p-6 sm:p-8">
                                <h2 className="text-2xl font-black tracking-tight">Galeri Dojo</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-5">
                                    {galleries.map((gallery) => (
                                        <figure key={gallery.id} className="rounded-xl overflow-hidden border border-neutral-200 bg-white shadow-sm hover:scale-[1.02] transition-transform">
                                            <img src={resolveMediaUrl(gallery.image_path)} alt={gallery.title} className="w-full h-32 sm:h-40 object-cover" />
                                        </figure>
                                    ))}
                                    {galleries.length === 0 && <p className="text-sm text-neutral-500">Galeri belum tersedia.</p>}
                                </div>

                                <div className="mt-8 rounded-2xl bg-neutral-900 px-5 py-6 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-red-300">Ready to Move</p>
                                        <p className="text-lg font-black mt-1">Bangun dojo yang disiplin, cepat, dan terukur.</p>
                                    </div>
                                    <Link href={route('login')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-athlix-red px-4 py-2.5 text-sm font-black text-white">
                                        Masuk ke ATHLIX
                                        <ShieldCheck size={15} />
                                    </Link>
                                </div>
                            </div>
                        </section>
                    </main>
                </div>
            </div>
        </>
    );
}
