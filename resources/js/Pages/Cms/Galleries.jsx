import axios from 'axios';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { Eye, Images, Pencil, Search, Trash2, Plus, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import Modal from '@/Components/Modal';
import DbSelect from '@/Components/DbSelect';
import FileInput from '@/Components/FileInput';

const INITIAL_FORM = {
    title: '',
    slug: '',
    translation_key: '',
    media_type: 'image',
    caption: '',
    description: '',
    category: '',
    tags: '',
    locale: 'id-ID',
    photographer_name: '',
    location: '',
    captured_at: '',
    sort_order: 0,
    status: 'draft',
    publish_at: '',
    is_featured: false,
    image: null,
    video_url: '',
    image_alt: '',
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

export default function Galleries({ auth, galleries = [], revisions = [], statusOptions = [], robotOptions = [], flash }) {
    const [editingId, setEditingId] = useState(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [previewInfo, setPreviewInfo] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const form = useForm({ ...INITIAL_FORM });

    const statuses = statusOptions.length ? statusOptions : FALLBACK_STATUS;
    const robots = robotOptions.length ? robotOptions : FALLBACK_ROBOTS;
    const editingItem = useMemo(() => galleries.find((item) => item.id === editingId), [galleries, editingId]);

    const filtered = useMemo(() => {
        return galleries.filter((item) => {
            const keyword = search.trim().toLowerCase();
            const inKeyword =
                !keyword ||
                item.title?.toLowerCase().includes(keyword) ||
                item.slug?.toLowerCase().includes(keyword) ||
                item.category?.toLowerCase().includes(keyword) ||
                item.location?.toLowerCase().includes(keyword);
            const inStatus = statusFilter === 'all' || item.status === statusFilter;
            return inKeyword && inStatus;
        });
    }, [galleries, search, statusFilter]);

    const visibleRevisions = useMemo(() => {
        const source = Array.isArray(revisions) ? revisions : [];
        if (!editingId) return source.slice(0, 25);
        return source.filter((revision) => revision.revisable_id === editingId).slice(0, 25);
    }, [revisions, editingId]);

    const reset = () => {
        setEditingId(null);
        setPreviewInfo(null);
        form.setData({ ...INITIAL_FORM });
        form.clearErrors();
        setIsModalOpen(false);
    };

    const submit = () => {
        const options = { preserveScroll: true, forceFormData: true, onSuccess: () => reset() };
        if (editingId) {
            form.patch(route('cms.galleries.update', editingId), options);
            return;
        }
        form.post(route('cms.galleries.store'), options);
    };

    const edit = (item) => {
        setEditingId(item.id);
        setPreviewInfo(null);
        form.setData({
            title: item.title || '',
            slug: item.slug || '',
            translation_key: item.translation_key || item.slug || '',
            media_type: item.media_type || 'image',
            caption: item.caption || '',
            description: item.description || '',
            category: item.category || '',
            tags: toTagString(item.tags),
            locale: item.locale || 'id-ID',
            photographer_name: item.photographer_name || '',
            location: item.location || '',
            captured_at: toInputDateTime(item.captured_at),
            sort_order: item.sort_order ?? 0,
            status: item.status || 'draft',
            publish_at: toInputDateTime(item.publish_at),
            is_featured: !!item.is_featured,
            image: null,
            video_url: item.video_url || '',
            image_alt: item.image_alt || '',
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
        setIsModalOpen(true);
    };

    const remove = (id) => {
        if (!window.confirm('Hapus item galeri ini?')) return;
        router.delete(route('cms.galleries.destroy', id), { preserveScroll: true });
    };

    const regeneratePreviewToken = async () => {
        if (!editingId) return;
        try {
            const response = await axios.post(route('cms.galleries.preview-token', editingId));
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
        <AdminLayout
            user={auth?.user}
            header={<h2 className="text-xl font-bold tracking-tight uppercase">CMS Galeri</h2>}
        >
            <Head title="CMS Galeri" />
            <div className="space-y-6 py-4">

                <Modal show={isModalOpen} onClose={reset} maxWidth="4xl">
                    <div className="bg-white">
                        <div className="flex items-center justify-between p-4 mb-2 border-b border-neutral-100">
                            <h3 className="text-lg font-black uppercase tracking-tight">
                                {editingId ? 'Edit Galeri' : 'Tambah Galeri Baru'}
                            </h3>
                            <button onClick={reset} className="text-neutral-500 hover:text-neutral-700">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
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
                                <Input placeholder="Kategori" value={form.data.category} onChange={(e) => form.setData('category', e.target.value)} />
                                <DbSelect 
                                    className="min-w-[150px]"
                                    inputId="gallery-media-type"
                                    value={form.data.media_type} 
                                    options={[
                                        { value: 'image', label: 'Foto' },
                                        { value: 'video', label: 'Video' }
                                    ]}
                                    onChange={(value) => form.setData('media_type', value)}
                                    placeholder="Tipe Media"
                                />
                                <Input placeholder="Tag (koma)" value={form.data.tags} onChange={(e) => form.setData('tags', e.target.value)} />
                                <Input placeholder="Photographer" value={form.data.photographer_name} onChange={(e) => form.setData('photographer_name', e.target.value)} />
                                <Input placeholder="Lokasi" value={form.data.location} onChange={(e) => form.setData('location', e.target.value)} />
                                <Input placeholder="Locale" value={form.data.locale} onChange={(e) => form.setData('locale', e.target.value)} />
                                <Input type="datetime-local" value={form.data.captured_at} onChange={(e) => form.setData('captured_at', e.target.value)} />
                                <Input type="datetime-local" value={form.data.publish_at} onChange={(e) => form.setData('publish_at', e.target.value)} />
                                <Input type="number" min="0" placeholder="Sort order" value={form.data.sort_order} onChange={(e) => form.setData('sort_order', e.target.value)} />
                                <DbSelect 
                                    className="min-w-[150px]"
                                    inputId="gallery-status"
                                    value={form.data.status} 
                                    options={statuses}
                                    onChange={(value) => form.setData('status', value)}
                                    placeholder="Status"
                                />
                                <label className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 text-sm">
                                    <input type="checkbox" checked={form.data.is_featured} onChange={(e) => form.setData('is_featured', e.target.checked)} />
                                    Featured
                                </label>
                            </div>

                            <textarea className="min-h-20 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm" placeholder="Caption" value={form.data.caption} onChange={(e) => form.setData('caption', e.target.value)} />
                            <textarea className="min-h-28 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm" placeholder="Description" value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} />

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 flex justify-between items-center">
                                        <span>Image / File Media</span>
                                        <span className="text-[10px] text-neutral-400 normal-case font-medium">Format: JPG, PNG, WEBP. Max: 5MB</span>
                                    </label>
                                    <FileInput 
                                        accept=".jpg,.jpeg,.png,.webp,.avif" 
                                        onChange={(file) => form.setData('image', file)} 
                                        error={form.errors.image}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Video URL (Opsional)</label>
                                    <Input placeholder="URL Video (untuk tipe video)" value={form.data.video_url} onChange={(e) => form.setData('video_url', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Alt Image</label>
                                    <Input placeholder="Alt image" value={form.data.image_alt} onChange={(e) => form.setData('image_alt', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 flex justify-between items-center">
                                        <span>OG Image</span>
                                        <span className="text-[10px] text-neutral-400 normal-case font-medium">Format: JPG, PNG. Max: 5MB</span>
                                    </label>
                                    <FileInput 
                                        accept=".jpg,.jpeg,.png,.webp,.avif" 
                                        onChange={(file) => form.setData('og_image', file)} 
                                        error={form.errors.og_image}
                                    />
                                </div>
                                <Input placeholder="Canonical URL" value={form.data.canonical_url} onChange={(e) => form.setData('canonical_url', e.target.value)} />
                                <Input placeholder="SEO Title" value={form.data.seo_title} onChange={(e) => form.setData('seo_title', e.target.value)} />
                                <Input placeholder="SEO Keywords" value={form.data.seo_keywords} onChange={(e) => form.setData('seo_keywords', e.target.value)} />
                                <textarea className="min-h-20 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm sm:col-span-2" placeholder="SEO Description" value={form.data.seo_description} onChange={(e) => form.setData('seo_description', e.target.value)} />
                                <DbSelect 
                                    className="min-w-[150px]"
                                    inputId="gallery-meta-robots"
                                    value={form.data.meta_robots} 
                                    options={robots}
                                    onChange={(value) => form.setData('meta_robots', value)}
                                    placeholder="Meta Robots"
                                />
                                <Input placeholder="OG Title" value={form.data.og_title} onChange={(e) => form.setData('og_title', e.target.value)} />
                                <textarea className="min-h-20 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm sm:col-span-2" placeholder="OG Description" value={form.data.og_description} onChange={(e) => form.setData('og_description', e.target.value)} />
                                <textarea className="min-h-20 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm sm:col-span-2" placeholder="Approval Notes" value={form.data.approval_notes} onChange={(e) => form.setData('approval_notes', e.target.value)} />
                                <Input className="sm:col-span-2" placeholder="Ringkasan revisi (opsional)" value={form.data.revision_summary} onChange={(e) => form.setData('revision_summary', e.target.value)} />
                            </div>

                            {editingItem?.image_path && (
                                <img src={resolveMediaUrl(editingItem.image_path)} alt={editingItem.title} className="h-36 w-full rounded-xl object-cover" />
                            )}

                            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm">
                                <p className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-neutral-500"><Eye size={13} /> SEO Preview</p>
                                <p className="font-semibold text-blue-700">{(form.data.seo_title || form.data.title || 'Judul galeri').slice(0, 70)}</p>
                                <p className="text-xs text-emerald-700">{form.data.canonical_url || `https://athlix.app/galeri/${form.data.slug || 'slug-galeri'}`}</p>
                                <p className="text-sm text-neutral-600">{(form.data.seo_description || form.data.caption || '').slice(0, 170)}</p>
                                <p className="mt-1 text-xs text-neutral-500">Tipe media: {form.data.media_type === 'video' ? 'Video' : 'Foto'}</p>
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
                        </div>

                        <div className="flex justify-end gap-2 p-6 pt-4 border-t border-neutral-100">
                            <Button type="button" variant="outline" onClick={reset}>Batal</Button>
                            <Button onClick={submit} disabled={form.processing}>{editingId ? 'Simpan Perubahan' : 'Buat Galeri'}</Button>
                        </div>
                    </div>
                </Modal>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <Card className="xl:col-span-2">
                        <CardHeader>
                            <div className="flex items-center justify-between gap-4">
                                <CardTitle>Library Galeri</CardTitle>
                                <Button
                                    onClick={() => { reset(); setIsModalOpen(true); }}
                                    className="flex items-center gap-2 bg-athlix-red hover:bg-red-700 text-white shadow-lg shadow-red-900/20 rounded-xl px-4 py-2 font-bold text-xs uppercase tracking-wider transition-all duration-200 shrink-0"
                                >
                                    <Plus size={14} /> Tambah Galeri
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="relative">
                                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <Input className="pl-9" placeholder="Cari galeri..." value={search} onChange={(e) => setSearch(e.target.value)} />
                            </div>
                            <DbSelect 
                                inputId="gallery-filter-status"
                                value={statusFilter} 
                                options={[{ value: 'all', label: 'Semua status' }, ...statuses]}
                                onChange={(value) => setStatusFilter(value || 'all')}
                                placeholder="Pilih Filter Status"
                            />

                            <div className="max-h-[48vh] space-y-3 overflow-y-auto pr-1">
                                {filtered.length === 0 && <div className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">Belum ada item galeri.</div>}
                                {filtered.map((item) => (
                                    <article key={item.id} className="rounded-xl border border-neutral-200 p-4">
                                        <div className="flex items-start gap-3">
                                            {item.image_path ? <img src={resolveMediaUrl(item.image_path)} alt={item.title} className="h-14 w-14 rounded-lg object-cover" /> : <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-neutral-100 text-neutral-400"><Images size={16} /></div>}
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-black">{item.title}</p>
                                                <p className="text-[11px] font-bold uppercase tracking-wider text-athlix-red">{item.media_type === 'video' ? 'VIDEO' : 'FOTO'}</p>
                                                <p className="truncate text-xs text-neutral-500">{item.slug}</p>
                                                <p className="line-clamp-2 text-xs text-neutral-600">{item.caption || '-'}</p>
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
                                            <p className="text-[11px] text-neutral-500">{revision.actor_name || 'System'} | {formatDateTime(revision.created_at)}</p>
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

