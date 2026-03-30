import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { HandCoins, Pencil, Trash2, Star, Plus, X } from 'lucide-react';
import { useState } from 'react';
import Modal from '@/Components/Modal';

export default function PriceLists({ auth, priceLists = [] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const form = useForm({ title: '', description: '', price: '', currency: 'IDR', sort_order: 0, is_featured: false });

    const submit = () => {
        if (editingId) {
            form.patch(route('cms.pricelists.update', editingId), {
                onSuccess: () => {
                    form.reset();
                    setIsModalOpen(false);
                },
            });
            return;
        }

        form.post(route('cms.pricelists.store'), {
            onSuccess: () => {
                form.reset();
                setIsModalOpen(false);
            },
        });
    };

    const openModal = (item = null) => {
        if (item) {
            setEditingId(item.id);
            form.setData({
                title: item.title || '',
                description: item.description || '',
                price: item.price || '',
                currency: item.currency || 'IDR',
                sort_order: item.sort_order ?? 0,
                is_featured: !!item.is_featured,
            });
        } else {
            setEditingId(null);
            form.reset();
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        form.reset();
    };

    return (
        <AdminLayout user={auth?.user} header={<h2 className="text-xl font-bold tracking-tight uppercase">CMS Pricelist</h2>}>
            <Head title="CMS Pricelist" />
            <div className="space-y-6 py-4">
                <Card className="border-neutral-200/80 dark:border-neutral-800 bg-gradient-to-r from-amber-500/10 to-transparent">
                    <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-600"><HandCoins size={22} /></div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Monetization</p>
                                <h3 className="text-lg font-black">Pricelist Landing Page</h3>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-semibold text-neutral-700 hidden sm:block">Total paket: {priceLists.length}</span>
                            <Button
                                onClick={() => openModal()}
                                className="flex items-center gap-2 bg-athlix-red hover:bg-red-700 text-white shadow-lg shadow-red-900/20 rounded-xl px-5 font-bold text-xs uppercase tracking-wider transition-all duration-200 shrink-0"
                            >
                                <Plus size={16} /> Tambah Paket
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Modal show={isModalOpen} onClose={closeModal} maxWidth="md">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-black uppercase tracking-tight">
                                {editingId ? 'Edit Paket' : 'Tambah Paket Baru'}
                            </h3>
                            <button onClick={closeModal} className="text-neutral-500 hover:text-neutral-700 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <Input className="text-neutral-900" placeholder="Nama paket" value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} />
                            <Input className="text-neutral-900" placeholder="Harga" type="number" value={form.data.price} onChange={(e) => form.setData('price', e.target.value)} />
                            <textarea className="w-full border rounded-lg px-3 py-2 text-sm min-h-24 text-neutral-900 bg-white" placeholder="Deskripsi paket (fitur yang didapat)..." value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} />
                            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 cursor-pointer">
                                <input type="checkbox" className="rounded text-athlix-red focus:ring-athlix-red" checked={form.data.is_featured} onChange={(e) => form.setData('is_featured', e.target.checked)} />
                                Jadikan paket unggulan / Recommended
                            </label>
                        </div>
                        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-neutral-100">
                            <Button type="button" variant="outline" onClick={closeModal}>Batal</Button>
                            <Button onClick={submit}>{editingId ? 'Simpan Perubahan' : 'Buat Paket'}</Button>
                        </div>
                    </div>
                </Modal>

                <div className="grid grid-cols-1 gap-6">

                    <Card className="border-neutral-200/80 dark:border-neutral-800">
                        <CardHeader><CardTitle>Daftar Pricelist</CardTitle></CardHeader>
                        <CardContent className="space-y-3 max-h-[70vh] overflow-y-auto">
                            {priceLists.length === 0 && <p className="text-sm text-neutral-500">Belum ada paket harga.</p>}
                            {priceLists.map((item) => (
                                <div key={item.id} className={`rounded-xl border p-4 ${item.is_featured ? 'border-amber-300 bg-amber-50/70 dark:bg-amber-900/10' : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40'}`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-bold text-neutral-900  flex items-center gap-1">
                                                {item.title}
                                                {item.is_featured && <Star size={13} className="text-amber-500" />}
                                            </p>
                                            <p className="text-xs text-neutral-600  mt-1">{item.description || '-'}</p>
                                            <p className="text-sm font-black text-athlix-red mt-2">Rp {Number(item.price || 0).toLocaleString('id-ID')}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                className="inline-flex items-center gap-1 text-blue-600 text-xs font-bold"
                                                onClick={() => openModal(item)}
                                            >
                                                <Pencil size={12} /> Edit
                                            </button>
                                            <button className="inline-flex items-center gap-1 text-red-600 text-xs font-bold" onClick={() => router.delete(route('cms.pricelists.destroy', item.id))}>
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
