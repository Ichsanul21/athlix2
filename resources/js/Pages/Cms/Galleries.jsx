import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { Images, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function Galleries({ auth, galleries = [], flash }) {
    const [editingId, setEditingId] = useState(null);
    const form = useForm({ title: '', caption: '', sort_order: 0, image: null });

    const submit = () => {
        if (editingId) {
            form.post(route('cms.galleries.update', editingId), {
                forceFormData: true,
                _method: 'patch',
                onSuccess: () => {
                    setEditingId(null);
                    form.reset();
                },
            });
            return;
        }

        form.post(route('cms.galleries.store'), {
            forceFormData: true,
            onSuccess: () => form.reset(),
        });
    };

    return (
        <AdminLayout user={auth?.user} header={<h2 className="text-xl font-bold tracking-tight uppercase">CMS Galeri</h2>}>
            <Head title="CMS Galeri" />
            <div className="space-y-6 py-4">
                {flash?.success && <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">{flash.success}</div>}
                {flash?.error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{flash.error}</div>}

                <Card className="border-neutral-200/80 dark:border-neutral-800 bg-gradient-to-r from-blue-500/10 to-transparent">
                    <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-blue-500/15 text-blue-600"><Images size={22} /></div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Media Management</p>
                                <h3 className="text-lg font-black">Galeri Landing Page</h3>
                            </div>
                        </div>
                        <div className="text-sm font-semibold text-neutral-700 ">Total galeri: {galleries.length}</div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <Card className="lg:col-span-5 border-neutral-200/80 dark:border-neutral-800">
                        <CardHeader><CardTitle>{editingId ? 'Edit Galeri' : 'Tambah Galeri'}</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <Input className="text-neutral-900 " placeholder="Judul gambar" value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} />
                            <textarea className="w-full border rounded-lg px-3 py-2 text-sm min-h-24 text-neutral-900  bg-white dark:bg-neutral-900" placeholder="Caption" value={form.data.caption} onChange={(e) => form.setData('caption', e.target.value)} />
                            <input type="file" onChange={(e) => form.setData('image', e.target.files?.[0] ?? null)} className="text-sm text-neutral-700 " />
                            <div className="flex gap-2">
                                <Button onClick={submit}>{editingId ? 'Update Galeri' : 'Simpan Galeri'}</Button>
                                {editingId && <Button variant="outline" onClick={() => { setEditingId(null); form.reset(); }}>Batal</Button>}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-7 border-neutral-200/80 dark:border-neutral-800">
                        <CardHeader><CardTitle>Daftar Galeri</CardTitle></CardHeader>
                        <CardContent className="space-y-3 max-h-[70vh] overflow-y-auto">
                            {galleries.length === 0 && <p className="text-sm text-neutral-500">Belum ada galeri.</p>}
                            {galleries.map((item) => (
                                <div key={item.id} className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3 bg-white dark:bg-neutral-900/40">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <img src={resolveMediaUrl(item.image_path)} alt={item.title} className="w-16 h-16 rounded-lg object-cover border border-neutral-200 dark:border-neutral-800" />
                                            <div className="min-w-0">
                                                <p className="font-bold text-neutral-900  truncate">{item.title}</p>
                                                <p className="text-xs text-neutral-600 ">{item.caption || '-'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                className="inline-flex items-center gap-1 text-blue-600 text-xs font-bold"
                                                onClick={() => {
                                                    setEditingId(item.id);
                                                    form.setData({
                                                        title: item.title || '',
                                                        caption: item.caption || '',
                                                        sort_order: item.sort_order ?? 0,
                                                        image: null,
                                                    });
                                                }}
                                            >
                                                <Pencil size={12} /> Edit
                                            </button>
                                            <button className="inline-flex items-center gap-1 text-red-600 text-xs font-bold" onClick={() => router.delete(route('cms.galleries.destroy', item.id))}>
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
