import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ChevronLeft, MapPin, Camera } from 'lucide-react';
import { resolveMediaUrl } from '@/lib/mediaUrl';

const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(date);
};

export default function GalleryShow({ gallery, relatedGalleries = [], alternates = [], previewMode = false }) {
    const description = gallery.seo_description || gallery.caption || gallery.description || 'Galeri visual ATHLIX';
    const title = gallery.seo_title || gallery.title;
    const canonical = gallery.canonical_url || route('landing.galleries.show', gallery.slug);
    const ogImage = resolveMediaUrl(gallery.og_image_path || gallery.image_path || '/logo.png');
    const isVideo = gallery.media_type === 'video';
    const schema = {
        '@context': 'https://schema.org',
        '@type': isVideo ? 'VideoObject' : 'ImageObject',
        name: gallery.title,
        description,
        contentUrl: isVideo ? resolveMediaUrl(gallery.video_url) : resolveMediaUrl(gallery.image_path),
        embedUrl: isVideo ? gallery.video_url : undefined,
        uploadDate: gallery.publish_at || gallery.created_at,
        creator: gallery.photographer_name
            ? { '@type': 'Person', name: gallery.photographer_name }
            : undefined,
        inLanguage: gallery.locale || 'id-ID',
    };

    return (
        <>
            <Head title={`${title} | ATHLIX`}>
                <meta name="description" content={description} />
                <meta property="og:title" content={gallery.og_title || title} />
                <meta property="og:description" content={gallery.og_description || description} />
                <meta property="og:image" content={ogImage} />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={gallery.og_title || title} />
                <meta name="twitter:description" content={gallery.og_description || description} />
                <meta name="twitter:image" content={ogImage} />
                <meta name="robots" content={gallery.meta_robots || 'index,follow'} />
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
                            Mode preview aktif. Konten galeri ini mungkin belum dipublikasikan.
                        </div>
                    )}

                    <Link href={route('landing.index')} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white">
                        <ChevronLeft size={16} />
                        Kembali ke landing
                    </Link>

                    <article className="mx-auto max-w-5xl rounded-2xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8">
                        <div className="mb-5 flex flex-wrap items-center gap-3 text-xs uppercase tracking-widest text-slate-400">
                            <span>{gallery.category || 'Gallery'}</span>
                            <span>|</span>
                            <span>{formatDate(gallery.publish_at || gallery.created_at)}</span>
                        </div>

                        <h1 className="text-3xl font-black leading-tight text-white sm:text-5xl">{gallery.title}</h1>

                        <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-slate-300">
                            {gallery.photographer_name && (
                                <span className="inline-flex items-center gap-2">
                                    <Camera size={15} />
                                    {gallery.photographer_name}
                                </span>
                            )}
                            {gallery.location && (
                                <span className="inline-flex items-center gap-2">
                                    <MapPin size={15} />
                                    {gallery.location}
                                </span>
                            )}
                        </div>

                        {isVideo && gallery.video_url ? (
                            <video
                                src={resolveMediaUrl(gallery.video_url)}
                                poster={resolveMediaUrl(gallery.image_path)}
                                className="mt-8 h-auto w-full rounded-xl border border-slate-800 object-cover"
                                controls
                                preload="metadata"
                            />
                        ) : (
                            <img
                                src={resolveMediaUrl(gallery.image_path)}
                                alt={gallery.image_alt || gallery.title}
                                className="mt-8 h-auto w-full rounded-xl border border-slate-800 object-cover"
                            />
                        )}

                        {(gallery.caption || gallery.description) && (
                            <div className="mt-7 space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                                {gallery.caption && <p className="text-base font-semibold text-white">{gallery.caption}</p>}
                                {gallery.description && <p className="text-sm leading-relaxed text-slate-300">{gallery.description}</p>}
                            </div>
                        )}
                    </article>

                    <section className="mx-auto mt-10 max-w-5xl">
                        <h2 className="mb-4 text-2xl font-black text-white">Galeri Terkait</h2>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                            {relatedGalleries.length === 0 && (
                                <div className="col-span-full rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-400">
                                    Belum ada galeri terkait.
                                </div>
                            )}
                            {relatedGalleries.map((item) => {
                                const href = item.slug ? route('landing.galleries.show', item.slug) : route('landing.index');
                                return (
                                    <Link key={item.id} href={href} className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 transition-colors hover:border-red-500/60">
                                        {item.media_type === 'video' && item.video_url ? (
                                            <video src={resolveMediaUrl(item.video_url)} poster={resolveMediaUrl(item.image_path)} className="h-36 w-full object-cover" muted playsInline />
                                        ) : (
                                            <img src={resolveMediaUrl(item.image_path)} alt={item.image_alt || item.title} className="h-36 w-full object-cover" />
                                        )}
                                        <div className="p-3">
                                            <p className="truncate text-sm font-bold text-white">{item.title}</p>
                                        </div>
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
