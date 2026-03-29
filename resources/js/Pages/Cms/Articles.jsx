import axios from 'axios';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import {
    Bold,
    Code2,
    Eye,
    Heading2,
    ImagePlus,
    Italic,
    Link2,
    List,
    ListOrdered,
    Newspaper,
    Pencil,
    Quote,
    Redo2,
    Search,
    Trash2,
    Underline,
    Undo2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

const INITIAL_FORM = {
    title: '',
    slug: '',
    translation_key: '',
    excerpt: '',
    content: '',
    category: '',
    tags: '',
    locale: 'id-ID',
    author_name: '',
    reading_time: '',
    sort_order: 0,
    status: 'draft',
    publish_at: '',
    is_featured: false,
    thumbnail: null,
    thumbnail_alt: '',
    canonical_url: '',
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    meta_robots: 'index,follow',
    og_title: '',
    og_description: '',
    og_image: null,
    approval_notes: '',
    revision_summary: '',
};

const FALLBACK_STATUS = [
    { value: 'draft', label: 'Draft' },
    { value: 'review', label: 'Review' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
];

const FALLBACK_ROBOTS = [
    { value: 'index,follow', label: 'index,follow' },
    { value: 'noindex,follow', label: 'noindex,follow' },
    { value: 'index,nofollow', label: 'index,nofollow' },
    { value: 'noindex,nofollow', label: 'noindex,nofollow' },
];

const slugify = (value) =>
    String(value || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

const toInputDateTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
};

const formatDateTime = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const toTagString = (tags) => (Array.isArray(tags) ? tags.join(', ') : tags || '');

const editorButtonClass =
    'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 transition-colors hover:border-red-300 hover:text-red-600';

export default function Articles({ auth, articles = [], revisions = [], statusOptions = [], robotOptions = [], flash }) {
    const [editingId, setEditingId] = useState(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [previewInfo, setPreviewInfo] = useState(null);
    const form = useForm({ ...INITIAL_FORM });
    const editorRef = useRef(null);
    const editorUploadInputRef = useRef(null);

    const statuses = statusOptions.length ? statusOptions : FALLBACK_STATUS;
    const robots = robotOptions.length ? robotOptions : FALLBACK_ROBOTS;
    const editingItem = useMemo(() => articles.find((item) => item.id === editingId), [articles, editingId]);

    const filtered = useMemo(() => {
        return articles.filter((item) => {
            const keyword = search.trim().toLowerCase();
            const inKeyword =
                !keyword ||
                item.title?.toLowerCase().includes(keyword) ||
                item.slug?.toLowerCase().includes(keyword) ||
                item.category?.toLowerCase().includes(keyword);
            const inStatus = statusFilter === 'all' || item.status === statusFilter;
            return inKeyword && inStatus;
        });
    }, [articles, search, statusFilter]);

    const visibleRevisions = useMemo(() => {
        const source = Array.isArray(revisions) ? revisions : [];
        if (!editingId) return source.slice(0, 25);
        return source.filter((revision) => revision.revisable_id === editingId).slice(0, 25);
    }, [revisions, editingId]);

    useEffect(() => {
        if (!editorRef.current) return;
        const next = form.data.content || '';
        if (editorRef.current.innerHTML !== next) {
            editorRef.current.innerHTML = next;
        }
    }, [editingId, form.data.content]);

    const reset = () => {
        setEditingId(null);
        setPreviewInfo(null);
        form.setData({ ...INITIAL_FORM });
        form.clearErrors();
        if (editorRef.current) editorRef.current.innerHTML = '';
    };

    const submit = () => {
        const options = {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => reset(),
        };

        if (editingId) {
            form.patch(route('cms.articles.update', editingId), options);
            return;
        }

        form.post(route('cms.articles.store'), options);
    };

    const edit = (item) => {
        setEditingId(item.id);
        setPreviewInfo(null);
        form.setData({
            title: item.title || '',
            slug: item.slug || '',
            translation_key: item.translation_key || item.slug || '',
            excerpt: item.excerpt || '',
            content: item.content || '',
            category: item.category || '',
            tags: toTagString(item.tags),
            locale: item.locale || 'id-ID',
            author_name: item.author_name || '',
            reading_time: item.reading_time || '',
            sort_order: item.sort_order ?? 0,
            status: item.status || 'draft',
            publish_at: toInputDateTime(item.publish_at),
            is_featured: !!item.is_featured,
            thumbnail: null,
            thumbnail_alt: item.thumbnail_alt || '',
            canonical_url: item.canonical_url || '',
            seo_title: item.seo_title || '',
            seo_description: item.seo_description || '',
            seo_keywords: item.seo_keywords || '',
            meta_robots: item.meta_robots || 'index,follow',
            og_title: item.og_title || '',
            og_description: item.og_description || '',
            og_image: null,
            approval_notes: item.approval_notes || '',
            revision_summary: '',
        });
    };

    const remove = (id) => {
        if (!window.confirm('Hapus artikel ini?')) return;
        router.delete(route('cms.articles.destroy', id), { preserveScroll: true });
    };

    const syncEditor = () => {
        form.setData('content', editorRef.current?.innerHTML || '');
    };

    const runCommand = (command, value = null) => {
        editorRef.current?.focus();
        document.execCommand(command, false, value);
        syncEditor();
    };

    const addLink = () => {
        const url = window.prompt('Masukkan URL link:');
        if (!url) return;
        runCommand('createLink', url);
    };

    const insertImageByUrl = () => {
        const url = window.prompt('Masukkan URL gambar:');
        if (!url) return;
        runCommand('insertImage', url);
    };

    const uploadEditorImage = async (file) => {
        if (!file) return;
        const data = new FormData();
        data.append('image', file);

        try {
            const response = await axios.post(route('cms.articles.editor-image'), data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            runCommand('insertImage', response.data?.url);
        } catch (error) {
            window.alert('Upload gambar editor gagal. Coba lagi.');
        }
    };

    const regeneratePreviewToken = async () => {
        if (!editingId) return;
        try {
            const response = await axios.post(route('cms.articles.preview-token', editingId));
            setPreviewInfo(response.data);
        } catch (error) {
            window.alert('Gagal membuat preview token. Coba lagi.');
        }
    };

    const copyPreviewUrl = async () => {
        if (!previewInfo?.preview_url) return;
        try {
            await navigator.clipboard.writeText(previewInfo.preview_url);
            window.alert('Preview URL berhasil disalin.');
        } catch (error) {
            window.alert('Tidak bisa menyalin URL preview di browser ini.');
        }
    };

    return (
        <AdminLayout user={auth?.user} header={<h2 className="text-xl font-bold tracking-tight uppercase">CMS Artikel</h2>}>
            <Head title="CMS Artikel" />
            <div className="space-y-6 py-4">
                {flash?.success && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{flash.success}</div>}
                {flash?.error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{flash.error}</div>}

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                    <Card className="xl:col-span-7">
                        <CardHeader>
                            <CardTitle>{editingId ? 'Edit Artikel' : 'Artikel Baru'}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Input
                                    placeholder="Judul"
                                    value={form.data.title}
                                    onChange={(e) => {
                                        form.setData('title', e.target.value);
                                        if (!editingId && !form.data.slug) {
                                            const generated = slugify(e.target.value);
                                            form.setData('slug', generated);
                                            form.setData('translation_key', generated);
                                        }
                                    }}
                                />
                                <Input placeholder="Slug" value={form.data.slug} onChange={(e) => form.setData('slug', slugify(e.target.value))} />
                                <Input placeholder="Translation Key (untuk hreflang)" value={form.data.translation_key} onChange={(e) => form.setData('translation_key', slugify(e.target.value))} />
                                <Input placeholder="Penulis" value={form.data.author_name} onChange={(e) => form.setData('author_name', e.target.value)} />
                                <Input placeholder="Kategori" value={form.data.category} onChange={(e) => form.setData('category', e.target.value)} />
                                <Input placeholder="Tag (koma)" value={form.data.tags} onChange={(e) => form.setData('tags', e.target.value)} />
                                <Input placeholder="Locale" value={form.data.locale} onChange={(e) => form.setData('locale', e.target.value)} />
                                <Input type="datetime-local" value={form.data.publish_at} onChange={(e) => form.setData('publish_at', e.target.value)} />
                                <Input type="number" min="0" placeholder="Sort order" value={form.data.sort_order} onChange={(e) => form.setData('sort_order', e.target.value)} />
                                <select className="h-10 rounded-xl border border-neutral-200 px-3 text-sm" value={form.data.status} onChange={(e) => form.setData('status', e.target.value)}>
                                    {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                                </select>
                                <label className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 text-sm">
                                    <input type="checkbox" checked={form.data.is_featured} onChange={(e) => form.setData('is_featured', e.target.checked)} />
                                    Featured
                                </label>
                            </div>

                            <textarea className="min-h-20 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm" placeholder="Excerpt" value={form.data.excerpt} onChange={(e) => form.setData('excerpt', e.target.value)} />

                            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                                <div className="mb-3 flex flex-wrap gap-2">
                                    <button type="button" className={editorButtonClass} onClick={() => runCommand('undo')} title="Undo"><Undo2 size={14} /></button>
                                    <button type="button" className={editorButtonClass} onClick={() => runCommand('redo')} title="Redo"><Redo2 size={14} /></button>
                                    <button type="button" className={editorButtonClass} onClick={() => runCommand('bold')} title="Bold"><Bold size={14} /></button>
                                    <button type="button" className={editorButtonClass} onClick={() => runCommand('italic')} title="Italic"><Italic size={14} /></button>
                                    <button type="button" className={editorButtonClass} onClick={() => runCommand('underline')} title="Underline"><Underline size={14} /></button>
                                    <button type="button" className={editorButtonClass} onClick={() => runCommand('formatBlock', 'H2')} title="Heading"><Heading2 size={14} /></button>
                                    <button type="button" className={editorButtonClass} onClick={() => runCommand('insertUnorderedList')} title="Bulleted list"><List size={14} /></button>
                                    <button type="button" className={editorButtonClass} onClick={() => runCommand('insertOrderedList')} title="Numbered list"><ListOrdered size={14} /></button>
                                    <button type="button" className={editorButtonClass} onClick={() => runCommand('formatBlock', 'BLOCKQUOTE')} title="Quote"><Quote size={14} /></button>
                                    <button type="button" className={editorButtonClass} onClick={() => runCommand('formatBlock', 'PRE')} title="Code block"><Code2 size={14} /></button>
                                    <button type="button" className={editorButtonClass} onClick={addLink} title="Insert link"><Link2 size={14} /></button>
                                    <button type="button" className={editorButtonClass} onClick={insertImageByUrl} title="Insert image by URL"><ImagePlus size={14} /></button>
                                    <button type="button" className={editorButtonClass} onClick={() => editorUploadInputRef.current?.click()} title="Upload image"><ImagePlus size={14} /></button>
                                </div>

                                <input
                                    ref={editorUploadInputRef}
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.webp,.avif,.gif"
                                    className="hidden"
                                    onChange={(e) => uploadEditorImage(e.target.files?.[0] ?? null)}
                                />

                                <div
                                    ref={editorRef}
                                    contentEditable
                                    suppressContentEditableWarning
                                    className="min-h-52 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-relaxed text-neutral-900 focus:border-red-400 focus:outline-none"
                                    onInput={syncEditor}
                                    onBlur={syncEditor}
                                />
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <input type="file" accept=".jpg,.jpeg,.png,.webp,.avif" className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm" onChange={(e) => form.setData('thumbnail', e.target.files?.[0] ?? null)} />
                                <Input placeholder="Alt thumbnail" value={form.data.thumbnail_alt} onChange={(e) => form.setData('thumbnail_alt', e.target.value)} />
                                <input type="file" accept=".jpg,.jpeg,.png,.webp,.avif" className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm" onChange={(e) => form.setData('og_image', e.target.files?.[0] ?? null)} />
                                <Input placeholder="Canonical URL" value={form.data.canonical_url} onChange={(e) => form.setData('canonical_url', e.target.value)} />
                                <Input placeholder="SEO Title" value={form.data.seo_title} onChange={(e) => form.setData('seo_title', e.target.value)} />
                                <Input placeholder="SEO Keywords" value={form.data.seo_keywords} onChange={(e) => form.setData('seo_keywords', e.target.value)} />
                                <textarea className="min-h-20 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm sm:col-span-2" placeholder="SEO Description" value={form.data.seo_description} onChange={(e) => form.setData('seo_description', e.target.value)} />
                                <select className="h-10 rounded-xl border border-neutral-200 px-3 text-sm" value={form.data.meta_robots} onChange={(e) => form.setData('meta_robots', e.target.value)}>
                                    {robots.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                                <Input placeholder="OG Title" value={form.data.og_title} onChange={(e) => form.setData('og_title', e.target.value)} />
                                <textarea className="min-h-20 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm sm:col-span-2" placeholder="OG Description" value={form.data.og_description} onChange={(e) => form.setData('og_description', e.target.value)} />
                                <textarea className="min-h-20 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm sm:col-span-2" placeholder="Approval Notes" value={form.data.approval_notes} onChange={(e) => form.setData('approval_notes', e.target.value)} />
                                <Input className="sm:col-span-2" placeholder="Ringkasan revisi (opsional)" value={form.data.revision_summary} onChange={(e) => form.setData('revision_summary', e.target.value)} />
                            </div>

                            {editingItem?.thumbnail_path && (
                                <img src={resolveMediaUrl(editingItem.thumbnail_path)} alt={editingItem.title} className="h-32 w-full rounded-xl object-cover" />
                            )}

                            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm">
                                <p className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-neutral-500"><Eye size={13} /> SEO Preview</p>
                                <p className="font-semibold text-blue-700">{(form.data.seo_title || form.data.title || 'Judul halaman').slice(0, 70)}</p>
                                <p className="text-xs text-emerald-700">{form.data.canonical_url || `https://athlix.app/artikel/${form.data.slug || 'slug-artikel'}`}</p>
                                <p className="text-sm text-neutral-600">{(form.data.seo_description || form.data.excerpt || '').slice(0, 170)}</p>
                            </div>

                            {editingId && (
                                <div className="space-y-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button type="button" variant="outline" onClick={regeneratePreviewToken}>Generate Preview Token</Button>
                                        {previewInfo?.preview_url && (
                                            <Button type="button" variant="outline" onClick={copyPreviewUrl}>Copy Preview URL</Button>
                                        )}
                                    </div>
                                    {previewInfo?.preview_url && (
                                        <>
                                            <a href={previewInfo.preview_url} target="_blank" rel="noreferrer" className="block truncate text-xs font-semibold text-blue-700 underline underline-offset-2">
                                                {previewInfo.preview_url}
                                            </a>
                                            <p className="text-xs text-neutral-500">Expired: {formatDateTime(previewInfo.expires_at)}</p>
                                        </>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button onClick={submit} disabled={form.processing}>{editingId ? 'Update Artikel' : 'Simpan Artikel'}</Button>
                                <Button variant="outline" onClick={reset}>Reset</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="xl:col-span-5">
                        <CardHeader>
                            <CardTitle>Library Artikel</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="relative">
                                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <Input className="pl-9" placeholder="Cari artikel..." value={search} onChange={(e) => setSearch(e.target.value)} />
                            </div>
                            <select className="h-10 w-full rounded-xl border border-neutral-200 px-3 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                <option value="all">Semua status</option>
                                {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>

                            <div className="max-h-[48vh] space-y-3 overflow-y-auto pr-1">
                                {filtered.length === 0 && <div className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">Belum ada artikel.</div>}
                                {filtered.map((item) => (
                                    <article key={item.id} className="rounded-xl border border-neutral-200 p-4">
                                        <div className="flex items-start gap-3">
                                            {item.thumbnail_path ? <img src={resolveMediaUrl(item.thumbnail_path)} alt={item.title} className="h-14 w-14 rounded-lg object-cover" /> : <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-neutral-100 text-neutral-400"><Newspaper size={16} /></div>}
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-black">{item.title}</p>
                                                <p className="truncate text-xs text-neutral-500">{item.slug}</p>
                                                <p className="line-clamp-2 text-xs text-neutral-600">{item.excerpt || '-'}</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-center justify-end gap-2 border-t border-neutral-200 pt-3">
                                            <button className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50" onClick={() => edit(item)}><Pencil size={12} />Edit</button>
                                            <button className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50" onClick={() => remove(item.id)}><Trash2 size={12} />Hapus</button>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                                <p className="mb-2 text-xs font-black uppercase tracking-wider text-neutral-500">Revision History</p>
                                <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                                    {visibleRevisions.length === 0 && (
                                        <p className="text-xs text-neutral-500">Belum ada revision log.</p>
                                    )}
                                    {visibleRevisions.map((revision) => (
                                        <div key={revision.id} className="rounded-lg border border-neutral-200 bg-white p-2">
                                            <p className="text-xs font-bold text-neutral-800">{revision.change_summary || revision.action}</p>
                                            <p className="text-[11px] text-neutral-500">{revision.actor_name || 'System'} • {formatDateTime(revision.created_at)}</p>
                                            {revision.approval_notes && (
                                                <p className="mt-1 line-clamp-2 text-[11px] text-neutral-600">{revision.approval_notes}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
