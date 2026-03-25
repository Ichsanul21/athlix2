import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Newspaper, Pencil, Trash2, Plus } from 'lucide-react';
import { useState } from 'react';

export default function Articles({ auth, articles = [], flash }) {
    const [editingId, setEditingId] = useState(null);
    const form = useForm({ title: '', excerpt: '', content: '', sort_order: 0, is_published: true, thumbnail: null });

    const submit = () => {
        if (editingId) {
            form.post(route('cms.articles.update', editingId), {
                forceFormData: true,
                _method: 'patch',
                onSuccess: () => {
                    setEditingId(null);
                    form.reset();
                },
            });
            return;
        }

        form.post(route('cms.articles.store'), {
            forceFormData: true,
            onSuccess: () => form.reset(),
        });
    };

    return (
        <AdminLayout user={auth?.user} header={<h2 className="text-xl font-bold tracking-tight uppercase">CMS Artikel</h2>}>
            <Head title="CMS Artikel" />
            <div className="space-y-6 py-4">
                {flash?.success && <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">{flash.success}</div>}
                {flash?.error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{flash.error}</div>}

                <Card className="border-neutral-200/80 dark:border-neutral-800 bg-gradient-to-r from-athlix-red/10 to-transparent">
                    <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-athlix-red/15 text-athlix-red"><Newspaper size={22} /></div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Content Management</p>
                                <h3 className="text-lg font-black">Artikel Landing Page</h3>
                            </div>
                        </div>
                        <div className="text-sm font-semibold text-neutral-700 ">Total artikel: {articles.length}</div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <Card className="lg:col-span-5 border-neutral-200/80 dark:border-neutral-800">
                        <CardHeader><CardTitle>{editingId ? 'Edit Artikel' : 'Tambah Artikel'}</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <Input className="text-neutral-900 " placeholder="Judul" value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} />
                            <textarea className="w-full border rounded-lg px-3 py-2 text-sm min-h-20 text-neutral-900  bg-white dark:bg-neutral-900" placeholder="Excerpt" value={form.data.excerpt} onChange={(e) => form.setData('excerpt', e.target.value)} />
                            <textarea className="w-full border rounded-lg px-3 py-2 text-sm min-h-32 text-neutral-900  bg-white dark:bg-neutral-900" placeholder="Konten lengkap" value={form.data.content} onChange={(e) => form.setData('content', e.target.value)} />
                            <input type="file" onChange={(e) => form.setData('thumbnail', e.target.files?.[0] ?? null)} className="text-sm text-neutral-700 " />
                            <div className="flex gap-2">
                                <Button onClick={submit}>{editingId ? 'Update Artikel' : 'Simpan Artikel'}</Button>
                                {editingId && <Button variant="outline" onClick={() => { setEditingId(null); form.reset(); }}>Batal</Button>}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-7 border-neutral-200/80 dark:border-neutral-800">
                        <CardHeader><CardTitle>Daftar Artikel</CardTitle></CardHeader>
                        <CardContent className="space-y-3 max-h-[70vh] overflow-y-auto">
                            {articles.length === 0 && <p className="text-sm text-neutral-500">Belum ada artikel.</p>}
                            {articles.map((item) => (
                                <div key={item.id} className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 bg-white dark:bg-neutral-900/40">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-bold text-neutral-900  truncate">{item.title}</p>
                                            <p className="text-xs text-neutral-600  mt-1">{item.excerpt || '-'}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                className="inline-flex items-center gap-1 text-blue-600 text-xs font-bold"
                                                onClick={() => {
                                                    setEditingId(item.id);
                                                    form.setData({
                                                        title: item.title || '',
                                                        excerpt: item.excerpt || '',
                                                        content: item.content || '',
                                                        sort_order: item.sort_order ?? 0,
                                                        is_published: !!item.is_published,
                                                        thumbnail: null,
                                                    });
                                                }}
                                            >
                                                <Pencil size={12} /> Edit
                                            </button>
                                            <button className="inline-flex items-center gap-1 text-red-600 text-xs font-bold" onClick={() => router.delete(route('cms.articles.destroy', item.id))}>
                                                <Trash2 size={12} /> Hapus
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
