import { Head, Link } from '@inertiajs/react';
import { resolveMediaUrl } from '@/lib/mediaUrl';

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

const modules = [
    {
        title: 'Sensei Console',
        desc: 'Database atlet, rapor kemampuan, dan monitoring kondisi fisik real-time.',
    },
    {
        title: 'PWA Atlet',
        desc: 'Absensi QR, readiness harian, feedback latihan, dan notifikasi senpai native.',
    },
    {
        title: 'Dojo Finance',
        desc: 'Dynamic billing, override per atlet, invoice bulanan, dan audit penyesuaian.',
    },
    {
        title: 'Performance Lab',
        desc: 'Radar skill, workload ACWR, log medis, dan tren progres untuk atlet elit.',
    },
];

export default function Index({ auth, articles = [], galleries = [], priceLists = [] }) {
    return (
        <>
            <Head title="ATHLIX - Dojo Operating System" />

            <div
                className="min-h-screen text-neutral-900 bg-[radial-gradient(circle_at_10%_10%,_#fff1f2,_transparent_40%),radial-gradient(circle_at_85%_0%,_#fee2e2,_transparent_45%),linear-gradient(135deg,_#fafaf9,_#f8fafc_55%,_#f1f5f9)]"
                style={{ fontFamily: "'Space Grotesk', 'Sora', sans-serif" }}
            >
                <header className="sticky top-0 z-30 border-b border-neutral-200/60 bg-white/75 backdrop-blur-xl">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            <img src="/logo.png" alt="ATHLIX" className="w-10 h-10 rounded-xl object-cover ring-1 ring-athlix-red/20" />
                            <div className="min-w-0">
                                <p className="text-lg font-black tracking-tight text-athlix-red">ATHLIX</p>
                                <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-500">Dojo Operating System</p>
                            </div>
                        </div>
                        <Link href={route('login')} className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-athlix-red text-white hover:bg-red-700 transition-colors">
                            Masuk
                        </Link>
                    </div>
                </header>

                <main>
                    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
                            <div className="lg:col-span-7 rounded-3xl bg-neutral-900 text-white p-7 sm:p-10 shadow-2xl shadow-neutral-900/25 relative overflow-hidden">
                                <div className="absolute -right-16 -top-16 w-44 h-44 rounded-full bg-athlix-red/25 blur-2xl" />
                                <p className="text-[11px] uppercase tracking-[0.22em] font-black text-athlix-red mb-4 relative z-10">High Performance Dojo Platform</p>
                                <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight relative z-10">
                                    Satu sistem untuk operasional dojo, progres atlet, dan bisnis.
                                </h1>
                                <p className="text-sm sm:text-base text-neutral-300 mt-4 max-w-2xl relative z-10">
                                    Dari absensi QR, program latihan, laporan kemampuan, sampai billing dinamis dan notifikasi senpai native di PWA.
                                </p>
                                <div className="mt-7 flex flex-wrap gap-3 relative z-10">
                                    <Link href={route('login')} className="px-5 py-3 rounded-2xl bg-athlix-red text-white text-sm font-black uppercase tracking-wider">
                                        Mulai Sekarang
                                    </Link>
                                    <a href="#modul" className="px-5 py-3 rounded-2xl bg-white/10 border border-white/20 text-sm font-black uppercase tracking-wider">
                                        Lihat Modul
                                    </a>
                                </div>
                            </div>

                            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                                <div className="col-span-2 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                                    <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Status Platform</p>
                                    <p className="text-2xl font-black mt-2">Siap Skala Dojo ke Federasi</p>
                                </div>
                                <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-neutral-500">Core</p>
                                    <p className="text-lg font-black mt-2">Multi-Tenant</p>
                                </div>
                                <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-neutral-500">PWA</p>
                                    <p className="text-lg font-black mt-2">Offline First</p>
                                </div>
                                <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-neutral-500">Analytics</p>
                                    <p className="text-lg font-black mt-2">Radar + ACWR</p>
                                </div>
                                <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-neutral-500">Billing</p>
                                    <p className="text-lg font-black mt-2">Dynamic Rule</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="modul" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
                        <div className="flex items-end justify-between gap-4">
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] font-black text-neutral-500">Modul Utama</p>
                                <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">Dirancang untuk alur kerja harian tatami</h2>
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
                            {modules.map((module) => (
                                <article key={module.title} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm hover:-translate-y-1 transition-transform">
                                    <p className="text-base font-black">{module.title}</p>
                                    <p className="text-sm text-neutral-600 mt-2">{module.desc}</p>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section id="pricelist" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
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
                    </section>

                    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
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
                    </section>

                    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 pb-20">
                        <h2 className="text-2xl font-black tracking-tight">Galeri Dojo</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-5">
                            {galleries.map((gallery) => (
                                <figure key={gallery.id} className="rounded-xl overflow-hidden border border-neutral-200 bg-white shadow-sm hover:scale-[1.02] transition-transform">
                                    <img src={resolveMediaUrl(gallery.image_path)} alt={gallery.title} className="w-full h-32 sm:h-40 object-cover" />
                                </figure>
                            ))}
                            {galleries.length === 0 && <p className="text-sm text-neutral-500">Galeri belum tersedia.</p>}
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
}
