import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import Modal from '@/Components/Modal';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { useEffect, useState } from 'react';

export default function Sensei({ auth, senseis = [], athletes = [], dojo, dojos = [], selectedDojoId = null, flash }) {
    const [editingId, setEditingId] = useState(null);
    const [assignModal, setAssignModal] = useState({ open: false, sensei: null, athleteIds: [] });
    const [dojoId, setDojoId] = useState(selectedDojoId || '');

    const form = useForm({
        name: '',
        email: '',
        phone_number: '',
        password: '',
        profile_photo: null,
        dojo_id: selectedDojoId || '',
    });

    useEffect(() => {
        setDojoId(selectedDojoId || '');
        form.setData('dojo_id', selectedDojoId || '');
    }, [selectedDojoId]);

    const submit = () => {
        if (editingId) {
            form.post(route('dojo-admin.sensei.update', editingId), {
                forceFormData: true,
                data: { ...form.data, _method: 'patch' },
                onSuccess: () => {
                    setEditingId(null);
                    form.reset();
                    form.setData('dojo_id', dojoId || '');
                },
            });
            return;
        }

        form.post(route('dojo-admin.sensei.store'), {
            forceFormData: true,
            onSuccess: () => {
                form.reset();
                form.setData('dojo_id', dojoId || '');
            },
        });
    };

    const openAssignModal = (sensei) => {
        setAssignModal({
            open: true,
            sensei,
            athleteIds: (sensei.athlete_ids || []).map((id) => String(id)),
        });
    };

    const toggleAthlete = (athleteId) => {
        setAssignModal((prev) => {
            const nextIds = new Set(prev.athleteIds);
            if (nextIds.has(athleteId)) {
                nextIds.delete(athleteId);
            } else {
                nextIds.add(athleteId);
            }
            return { ...prev, athleteIds: Array.from(nextIds) };
        });
    };

    const saveAssignments = () => {
        if (!assignModal.sensei) return;
        router.patch(route('dojo-admin.sensei.assignments', assignModal.sensei.id), {
            athlete_ids: assignModal.athleteIds,
        }, {
            onSuccess: () => setAssignModal({ open: false, sensei: null, athleteIds: [] }),
        });
    };

    return (
        <AdminLayout user={auth?.user} header={<h2 className="text-xl font-bold tracking-tight uppercase">Database Pelatih</h2>}>
            <Head title="Database Pelatih" />
            <div className="space-y-6 py-4">
                {flash?.success && <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">{flash.success}</div>}
                {flash?.error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{flash.error}</div>}

                <Card>
                    <CardHeader>
                        <CardTitle>{editingId ? 'Edit Pelatih' : `Tambah Pelatih - ${dojo?.name || 'Dojo'}`}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {dojos.length > 0 && (
                            <select
                                className="text-sm border rounded-lg px-3 py-2 md:col-span-2 xl:col-span-3"
                                value={dojoId || ''}
                                onChange={(e) => {
                                    const next = e.target.value;
                                    setDojoId(next);
                                    form.setData('dojo_id', next);
                                    router.get(route('dojo-admin.sensei.index'), next ? { dojo_id: next } : {}, { preserveScroll: true });
                                }}
                            >
                                {dojos.map((item) => (
                                    <option key={item.id} value={item.id}>{item.name}</option>
                                ))}
                            </select>
                        )}

                        <Input className="text-sm" placeholder="Nama Sensei" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                        <Input className="text-sm" placeholder="Email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} />
                        <Input className="text-sm" placeholder="No. WhatsApp" value={form.data.phone_number} onChange={(e) => form.setData('phone_number', e.target.value)} />
                        <Input className="text-sm" type="password" placeholder={editingId ? 'Password baru (opsional)' : 'Password'} value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} />
                        <input type="file" accept=".jpg,.jpeg,.png,.webp" className="border rounded-lg px-3 py-2 text-sm" onChange={(e) => form.setData('profile_photo', e.target.files?.[0] ?? null)} />

                        <div className="md:col-span-2 xl:col-span-3 flex flex-wrap gap-2">
                            <Button onClick={submit}>{editingId ? 'Simpan Perubahan' : 'Simpan Pelatih'}</Button>
                            {editingId && (
                                <Button type="button" variant="outline" onClick={() => {
                                    setEditingId(null);
                                    form.reset();
                                    form.setData('dojo_id', dojoId || '');
                                }}>
                                    Batal
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Daftar Pelatih Dojo</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {senseis.map((sensei) => (
                            <div key={sensei.id} className="p-3 rounded-xl border flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                                <div className="min-w-0 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-neutral-100 overflow-hidden flex items-center justify-center text-xs font-black">
                                        {sensei.profile_photo_path ? (
                                            <img src={resolveMediaUrl(sensei.profile_photo_path)} alt={sensei.name} className="w-full h-full object-cover" />
                                        ) : (
                                            sensei.name?.charAt(0)
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold truncate">{sensei.name}</p>
                                        <p className="text-sm text-neutral-500 break-all">{sensei.email}</p>
                                        <p className="text-xs text-neutral-500">{sensei.phone_number || '-'}</p>
                                        <p className="text-xs text-neutral-500">Murid terhubung: {sensei.athletes?.length || 0}</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 shrink-0">
                                    <button className="text-xs text-athlix-red font-bold" onClick={() => openAssignModal(sensei)}>Kelola Murid</button>
                                    <button
                                        className="text-blue-600 text-sm"
                                        onClick={() => {
                                            setEditingId(sensei.id);
                                            form.setData({
                                                name: sensei.name || '',
                                                email: sensei.email || '',
                                                phone_number: sensei.phone_number || '',
                                                password: '',
                                                profile_photo: null,
                                                dojo_id: dojoId || '',
                                            });
                                        }}
                                    >Edit</button>
                                    <button className="text-red-500 text-sm" onClick={() => router.delete(route('dojo-admin.sensei.destroy', sensei.id))}>Hapus</button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <Modal show={assignModal.open} onClose={() => setAssignModal({ open: false, sensei: null, athleteIds: [] })} maxWidth="2xl">
                <div className="p-6 space-y-4">
                    <h3 className="text-lg font-black uppercase tracking-tight">Kelola Murid - {assignModal.sensei?.name}</h3>
                    <div className="max-h-[50vh] overflow-y-auto space-y-2">
                        {athletes.map((athlete) => {
                            const athleteId = String(athlete.id);
                            const checked = assignModal.athleteIds.includes(athleteId);
                            return (
                                <label key={athlete.id} className="flex items-center gap-3 p-2 rounded-lg border border-neutral-200">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggleAthlete(athleteId)}
                                    />
                                    <div>
                                        <p className="text-sm font-semibold">{athlete.full_name}</p>
                                        <p className="text-xs text-neutral-500">{athlete.athlete_code}</p>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setAssignModal({ open: false, sensei: null, athleteIds: [] })}>Batal</Button>
                        <Button onClick={saveAssignments}>Simpan Penugasan</Button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
