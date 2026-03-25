import { Head, Link } from '@inertiajs/react';

const formatCurrency = (amount, currency = 'IDR') => {
    if (currency === 'IDR') {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount || 0);
    }

    return `${currency} ${amount || 0}`;
};

export default function Index({ auth, articles = [], galleries = [], priceLists = [] }) {
    return (
        <>
            <Head title="ATHLIX - Dojo Management" />
            <div className="min-h-screen bg-neutral-50 text-neutral-900">
                <header className="sticky top-0 z-30 glass-strong border-gradient">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img src="/logo.png" alt="ATHLIX" className="w-10 h-10 rounded-xl object-cover" />
                            <div>
                                <p className="text-lg font-black tracking-tight text-athlix-red">ATHLIX</p>
                                <p className="text-xs text-neutral-500">Karate Dojo Platform</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href={route('login')} className="px-4 py-2 rounded-xl text-sm font-bold border border-neutral-200 hover:bg-neutral-100">Masuk</Link>
                        </div>
                    </div>
                </header>

                <main>
                    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                        <div className="grid lg:grid-cols-2 gap-8 items-center">
                            <div className="space-y-4">
                                <p className="text-xs uppercase tracking-widest font-bold text-athlix-red">Platform Terintegrasi Dojo</p>
                                <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">Latihan, absensi, pembayaran, dan performa atlet dalam satu ekosistem.</h1>
                                <p className="text-base text-neutral-600">ATHLIX membantu sensei, murid, dan manajemen dojo bekerja lebih cepat dengan pengalaman yang bersih dan modern.</p>
                                <div className="flex flex-wrap gap-3">
                                    <Link href={route('login')} className="px-5 py-3 rounded-2xl bg-athlix-red text-white font-bold text-sm">Mulai Sekarang</Link>
                                </div>
                            </div>
                            <div className="rounded-3xl bg-gradient-to-br from-neutral-900 to-neutral-700 p-6 text-white shadow-xl">
                                <p className="text-sm uppercase tracking-widest text-white/70">Fitur Unggulan</p>
                                <ul className="mt-4 space-y-3 text-sm">
                                    <li>Absensi check-in/check-out + feedback murid</li>
                                    <li>Program latihan dan reminder agenda</li>
                                    <li>Pembayaran dinamis dan audit subsidi</li>
                                    <li>Manajemen prestasi + sertifikat</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
                        <h2 className="text-2xl font-black tracking-tight">Pricelist</h2>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
                            {priceLists.map((item) => (
                                <article key={item.id} className={`rounded-2xl p-5 border ${item.is_featured ? 'border-athlix-red bg-athlix-red/5' : 'border-neutral-200 bg-white'}`}>
                                    <p className="text-sm font-bold text-neutral-500">{item.title}</p>
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
                                <article key={article.id} className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
                                    {article.thumbnail_path && (
                                        <img src={`/storage/${article.thumbnail_path}`} alt={article.title} className="w-full h-40 object-cover" />
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

                    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 pb-16">
                        <h2 className="text-2xl font-black tracking-tight">Galeri Dojo</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-5">
                            {galleries.map((gallery) => (
                                <figure key={gallery.id} className="rounded-xl overflow-hidden border border-neutral-200 bg-white">
                                    <img src={`/storage/${gallery.image_path}`} alt={gallery.title} className="w-full h-32 sm:h-40 object-cover" />
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
