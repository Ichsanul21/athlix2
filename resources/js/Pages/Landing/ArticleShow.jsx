import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ChevronLeft, Clock3, UserRound } from 'lucide-react';
import { resolveMediaUrl } from '@/lib/mediaUrl';

const toPlainText = (html) => String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(date);
};

export default function ArticleShow({ article, relatedArticles = [], alternates = [], previewMode = false }) {
    const description = article.seo_description || article.excerpt || toPlainText(article.content).slice(0, 170);
    const title = article.seo_title || article.title;
    const canonical = article.canonical_url || route('landing.articles.show', article.slug);
    const ogImage = resolveMediaUrl(article.og_image_path || article.thumbnail_path || '/logo.png');
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description,
        datePublished: article.publish_at || article.created_at,
        dateModified: article.updated_at || article.publish_at || article.created_at,
        author: {
            '@type': 'Person',
            name: article.author_name || 'Tim ATHLIX',
        },
        image: ogImage,
        mainEntityOfPage: canonical,
        inLanguage: article.locale || 'id-ID',
    };

    return (
        <>
            <Head title={`${title} | ATHLIX`}>
                <meta name="description" content={description} />
                <meta property="og:title" content={article.og_title || title} />
                <meta property="og:description" content={article.og_description || description} />
                <meta property="og:image" content={ogImage} />
                <meta property="og:type" content="article" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={article.og_title || title} />
                <meta name="twitter:description" content={article.og_description || description} />
                <meta name="twitter:image" content={ogImage} />
                <meta name="robots" content={article.meta_robots || 'index,follow'} />
                <link rel="canonical" href={canonical} />
                {alternates.map((alternate) => (
                    <link key={alternate.locale} rel="alternate" hrefLang={alternate.locale} href={alternate.href} />
                ))}
                <script type="application/ld+json">{JSON.stringify(schema)}</script>
            </Head>

            <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
                <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
                    <div className="container mx-auto flex h-16 items-center justify-between px-6 lg:px-12">
                        <Link href={route('landing.index')} className="flex items-center gap-3">
                            <img src="/logo.png" alt="ATHLIX Logo" className="h-10 w-10 rounded-xl object-cover ring-1 ring-white/20" />
                            <span className="text-xl font-black tracking-wide text-white">ATHLIX</span>
                        </Link>
                        <Link href={route('login')} className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold tracking-wider text-white hover:bg-red-700">
                            LOGIN DOJO
                        </Link>
                    </div>
                </header>

                <main className="container mx-auto px-6 pb-20 pt-10 lg:px-12">
                    {previewMode && (
                        <div className="mb-5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                            Mode preview aktif. Halaman ini mungkin belum dipublikasikan.
                        </div>
                    )}

                    <Link href={route('landing.index')} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white">
                        <ChevronLeft size={16} />
                        Kembali ke landing
                    </Link>

                    <article className="mx-auto max-w-4xl rounded-2xl border border-slate-800 bg-slate-900/70 p-6 sm:p-10">
                        <div className="mb-4 flex flex-wrap items-center gap-3 text-xs uppercase tracking-widest text-slate-400">
                            <span>{article.category || 'General'}</span>
                            <span>|</span>
                            <span>{formatDate(article.publish_at || article.created_at)}</span>
                        </div>

                        <h1 className="text-3xl font-black leading-tight text-white sm:text-5xl">{article.title}</h1>

                        <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-slate-300">
                            <span className="inline-flex items-center gap-2">
                                <UserRound size={15} />
                                {article.author_name || 'Tim ATHLIX'}
                            </span>
                            <span className="inline-flex items-center gap-2">
                                <Clock3 size={15} />
                                {article.reading_time || 1} menit baca
                            </span>
                        </div>

                        {article.thumbnail_path && (
                            <img
                                src={resolveMediaUrl(article.thumbnail_path)}
                                alt={article.thumbnail_alt || article.title}
                                className="mt-8 h-auto w-full rounded-xl border border-slate-800 object-cover"
                            />
                        )}

                        {article.excerpt && (
                            <p className="mt-7 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-base leading-relaxed text-slate-300">
                                {article.excerpt}
                            </p>
                        )}

                        <div
                            className="article-content mt-8"
                            dangerouslySetInnerHTML={{ __html: article.content || '' }}
                        />
                    </article>

                    <section className="mx-auto mt-10 max-w-5xl">
                        <h2 className="mb-4 text-2xl font-black text-white">Artikel Terkait</h2>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            {relatedArticles.length === 0 && (
                                <div className="col-span-full rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-400">
                                    Belum ada artikel terkait.
                                </div>
                            )}
                            {relatedArticles.map((item) => {
                                const href = item.slug ? route('landing.articles.show', item.slug) : route('landing.index');
                                return (
                                    <Link key={item.id} href={href} className="rounded-xl border border-slate-800 bg-slate-900 p-4 transition-colors hover:border-red-500/60">
                                        <p className="text-sm font-bold text-white">{item.title}</p>
                                        <p className="mt-2 line-clamp-3 text-xs text-slate-400">{item.excerpt || ''}</p>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
}
