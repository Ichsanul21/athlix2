import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { useState } from 'react';

export default function Index({ auth, articles = [], galleries = [], priceLists = [], flash }) {
    const [editingArticleId, setEditingArticleId] = useState(null);
    const [editingGalleryId, setEditingGalleryId] = useState(null);
    const [editingPriceId, setEditingPriceId] = useState(null);

    const articleForm = useForm({ title: '', excerpt: '', content: '', sort_order: 0, is_published: true, thumbnail: null });
    const galleryForm = useForm({ title: '', caption: '', sort_order: 0, image: null });
    const priceForm = useForm({ title: '', description: '', price: '', currency: 'IDR', sort_order: 0, is_featured: false });

    const submitArticle = () => {
        if (editingArticleId) {
            articleForm.post(route('cms.articles.update', editingArticleId), {
                forceFormData: true,
                _method: 'patch',
                onSuccess: () => {
                    setEditingArticleId(null);
                    articleForm.reset();
                },
            });
            return;
        }

        articleForm.post(route('cms.articles.store'), {
            forceFormData: true,
            onSuccess: () => articleForm.reset(),
        });
    };

    const submitGallery = () => {
        if (editingGalleryId) {
            galleryForm.post(route('cms.galleries.update', editingGalleryId), {
                forceFormData: true,
                _method: 'patch',
                onSuccess: () => {
                    setEditingGalleryId(null);
                    galleryForm.reset();
                },
            });
            return;
        }

        galleryForm.post(route('cms.galleries.store'), {
            forceFormData: true,
            onSuccess: () => galleryForm.reset(),
        });
    };

    const submitPrice = () => {
        if (editingPriceId) {
            priceForm.patch(route('cms.pricelists.update', editingPriceId), {
                onSuccess: () => {
                    setEditingPriceId(null);
                    priceForm.reset();
                },
            });
            return;
        }

        priceForm.post(route('cms.pricelists.store'), {
            onSuccess: () => priceForm.reset(),
        });
    };

    return (
        <AdminLayout user={auth?.user} header={<h2 className="text-xl font-bold tracking-tight uppercase">CMS Landing Page</h2>}>
            <Head title="CMS Landing" />
            <div className="space-y-6 py-4">



                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader><CardTitle>Artikel</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            <Input placeholder="Judul" value={articleForm.data.title} onChange={(e) => articleForm.setData('title', e.target.value)} />
                            <textarea className="w-full border rounded-lg px-3 py-2 text-sm min-h-20" placeholder="Excerpt" value={articleForm.data.excerpt} onChange={(e) => articleForm.setData('excerpt', e.target.value)} />
                            <textarea className="w-full border rounded-lg px-3 py-2 text-sm min-h-24" placeholder="Konten" value={articleForm.data.content} onChange={(e) => articleForm.setData('content', e.target.value)} />
                            <input type="file" onChange={(e) => articleForm.setData('thumbnail', e.target.files?.[0] ?? null)} className="text-sm" />
                            <div className="flex gap-2">
                                <Button onClick={submitArticle} className="flex-1">{editingArticleId ? 'Update Artikel' : 'Simpan Artikel'}</Button>
                                {editingArticleId && (
                                    <Button type="button" variant="outline" onClick={() => { setEditingArticleId(null); articleForm.reset(); }}>Batal</Button>
                                )}
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {articles.map((item) => (
                                    <div key={item.id} className="p-2 rounded-lg border text-sm flex justify-between items-center gap-2">
                                        <span className="truncate">{item.title}</span>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                className="text-blue-600 text-xs"
                                                onClick={() => {
                                                    setEditingArticleId(item.id);
                                                    articleForm.setData({
                                                        title: item.title || '',
                                                        excerpt: item.excerpt || '',
                                                        content: item.content || '',
                                                        sort_order: item.sort_order ?? 0,
                                                        is_published: !!item.is_published,
                                                        thumbnail: null,
                                                    });
                                                }}
                                            >Edit</button>
                                            <button className="text-red-500 text-xs" onClick={() => router.delete(route('cms.articles.destroy', item.id))}>Hapus</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Galeri</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            <Input placeholder="Judul" value={galleryForm.data.title} onChange={(e) => galleryForm.setData('title', e.target.value)} />
                            <textarea className="w-full border rounded-lg px-3 py-2 text-sm min-h-20" placeholder="Caption" value={galleryForm.data.caption} onChange={(e) => galleryForm.setData('caption', e.target.value)} />
                            <input type="file" onChange={(e) => galleryForm.setData('image', e.target.files?.[0] ?? null)} className="text-sm" />
                            <div className="flex gap-2">
                                <Button onClick={submitGallery} className="flex-1">{editingGalleryId ? 'Update Galeri' : 'Simpan Galeri'}</Button>
                                {editingGalleryId && (
                                    <Button type="button" variant="outline" onClick={() => { setEditingGalleryId(null); galleryForm.reset(); }}>Batal</Button>
                                )}
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {galleries.map((item) => (
                                    <div key={item.id} className="p-2 rounded-lg border text-sm flex justify-between items-center gap-2">
                                        <span className="truncate">{item.title}</span>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                className="text-blue-600 text-xs"
                                                onClick={() => {
                                                    setEditingGalleryId(item.id);
                                                    galleryForm.setData({
                                                        title: item.title || '',
                                                        caption: item.caption || '',
                                                        sort_order: item.sort_order ?? 0,
                                                        image: null,
                                                    });
                                                }}
                                            >Edit</button>
                                            <button className="text-red-500 text-xs" onClick={() => router.delete(route('cms.galleries.destroy', item.id))}>Hapus</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Pricelist</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            <Input placeholder="Nama Paket" value={priceForm.data.title} onChange={(e) => priceForm.setData('title', e.target.value)} />
                            <Input placeholder="Harga" type="number" value={priceForm.data.price} onChange={(e) => priceForm.setData('price', e.target.value)} />
                            <textarea className="w-full border rounded-lg px-3 py-2 text-sm min-h-20" placeholder="Deskripsi" value={priceForm.data.description} onChange={(e) => priceForm.setData('description', e.target.value)} />
                            <div className="flex gap-2">
                                <Button onClick={submitPrice} className="flex-1">{editingPriceId ? 'Update Pricelist' : 'Simpan Pricelist'}</Button>
                                {editingPriceId && (
                                    <Button type="button" variant="outline" onClick={() => { setEditingPriceId(null); priceForm.reset(); }}>Batal</Button>
                                )}
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {priceLists.map((item) => (
                                    <div key={item.id} className="p-2 rounded-lg border text-sm flex justify-between items-center gap-2">
                                        <span className="truncate">{item.title}</span>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                className="text-blue-600 text-xs"
                                                onClick={() => {
                                                    setEditingPriceId(item.id);
                                                    priceForm.setData({
                                                        title: item.title || '',
                                                        description: item.description || '',
                                                        price: item.price || '',
                                                        currency: item.currency || 'IDR',
                                                        sort_order: item.sort_order ?? 0,
                                                        is_featured: !!item.is_featured,
                                                    });
                                                }}
                                            >Edit</button>
                                            <button className="text-red-500 text-xs" onClick={() => router.delete(route('cms.pricelists.destroy', item.id))}>Hapus</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
