import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { useState } from 'react';

export default function Dojos({ auth, dojos = [], flash }) {
    const [editingId, setEditingId] = useState(null);
    const form = useForm({
        name: '',
        timezone: 'Asia/Makassar',
        is_active: true,
    });

    const submit = () => {
        if (editingId) {
            form.patch(route('super-admin.dojos.update', editingId), {
                onSuccess: () => {
                    setEditingId(null);
                    form.reset('name', 'timezone', 'is_active');
                    form.setData('timezone', 'Asia/Makassar');
                    form.setData('is_active', true);
                },
            });
            return;
        }

        form.post(route('super-admin.dojos.store'), {
            onSuccess: () => {
                form.reset('name', 'timezone', 'is_active');
                form.setData('timezone', 'Asia/Makassar');
                form.setData('is_active', true);
            },
        });
    };

    return (
        <AdminLayout user={auth?.user} header={<h2 className="text-xl font-bold tracking-tight uppercase">Master Dojo</h2>}>
            <Head title="Master Dojo" />
            <div className="space-y-6 py-4">
                {flash?.success && <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">{flash.success}</div>}
                {flash?.error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{flash.error}</div>}

                <Card>
                    <CardHeader><CardTitle>{editingId ? 'Edit Dojo' : 'Tambah Dojo'}</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        <Input className="text-sm" placeholder="Nama Dojo" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                        <Input className="text-sm" placeholder="Timezone (contoh Asia/Makassar)" value={form.data.timezone} onChange={(e) => form.setData('timezone', e.target.value)} />
                        <label className="flex items-center gap-2 text-sm font-semibold">
                            <input type="checkbox" checked={!!form.data.is_active} onChange={(e) => form.setData('is_active', e.target.checked)} />
                            Aktif
                        </label>

                        <div className="md:col-span-2 xl:col-span-3 flex flex-wrap gap-2">
                            <Button onClick={submit}>{editingId ? 'Simpan Perubahan' : 'Simpan Dojo'}</Button>
                            {editingId && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setEditingId(null);
                                        form.reset('name', 'timezone', 'is_active');
                                        form.setData('timezone', 'Asia/Makassar');
                                        form.setData('is_active', true);
                                    }}
                                >
                                    Batal
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Daftar Dojo</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {dojos.map((dojo) => (
                            <div key={dojo.id} className="p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="font-semibold truncate">{dojo.name}</p>
                                    <p className="text-xs text-neutral-500">{dojo.timezone}</p>
                                    <p className="text-xs text-neutral-500">Status: {dojo.is_active ? 'Aktif' : 'Nonaktif'}</p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <button
                                        className="text-blue-600 text-sm"
                                        onClick={() => {
                                            setEditingId(dojo.id);
                                            form.setData({
                                                name: dojo.name || '',
                                                timezone: dojo.timezone || 'Asia/Makassar',
                                                is_active: !!dojo.is_active,
                                            });
                                        }}
                                    >Edit</button>
                                    <button className="text-red-500 text-sm" onClick={() => router.delete(route('super-admin.dojos.destroy', dojo.id))}>Hapus</button>
                                </div>
                            </div>
                        ))}
                        {dojos.length === 0 && <div className="text-sm text-neutral-400">Belum ada data dojo.</div>}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}

