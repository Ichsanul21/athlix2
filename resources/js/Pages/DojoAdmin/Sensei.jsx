import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import Modal from '@/Components/Modal';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import DbSelect from '@/Components/DbSelect';
import { useEffect, useState } from 'react';
import { Plus, Building2, Users, Shield } from 'lucide-react';

const ROLE_LABELS = {
    sensei: { label: 'Pelatih', color: 'bg-athlix-red/10 text-athlix-red' },
    head_coach: { label: 'Head Coach', color: 'bg-blue-100 text-blue-700' },
    assistant: { label: 'Asisten', color: 'bg-purple-100 text-purple-700' },
};

export default function Sensei({ auth, senseis = [], athletes = [], dojo, dojos = [], selectedDojoId = null, isAllDojos = false }) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
                    setIsAddModalOpen(false);
                },
            });
            return;
        }

        form.post(route('dojo-admin.sensei.store'), {
            forceFormData: true,
            onSuccess: () => {
                form.reset();
                form.setData('dojo_id', dojoId || '');
                setIsAddModalOpen(false);
            },
        });
    };

    const openAddModal = (sensei = null) => {
        if (sensei) {
            setEditingId(sensei.id);
            form.setData({
                name: sensei.name || '',
                email: sensei.email || '',
                phone_number: sensei.phone_number || '',
                password: '',
                profile_photo: null,
                dojo_id: dojoId || '',
            });
        } else {
            setEditingId(null);
            form.reset();
            form.setData('dojo_id', dojoId || '');
        }
        setIsAddModalOpen(true);
    };

    const closeAddModal = () => {
        setIsAddModalOpen(false);
        setEditingId(null);
        form.reset();
        form.setData('dojo_id', dojoId || '');
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

    const totalSensei = senseis.filter(s => s.role === 'sensei').length;
    const totalCoach = senseis.filter(s => s.role === 'head_coach').length;
    const totalAssistant = senseis.filter(s => s.role === 'assistant').length;

    return (
        <AdminLayout user={auth?.user} header={
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight truncate">Database Pelatih</h2>
                    <p className="text-sm text-neutral-500 mt-0.5 truncate">
                        {isAllDojos ? 'Semua Club' : (dojo?.name || 'Club')}
                    </p>
                </div>
                {dojos.length > 0 && (
                    <DbSelect
                        inputId="dojo-sensei-dojo-filter"
                        className="w-full sm:min-w-[200px] sm:w-auto"
                        options={[
                            { value: '', label: '🌐 Semua Club' },
                            ...dojos.map((item) => ({ value: String(item.id), label: item.name }))
                        ]}
                        value={dojoId || ''}
                        placeholder="Pilih Club"
                        onChange={(next) => {
                            setDojoId(next);
                            form.setData('dojo_id', next);
                            router.get(route('dojo-admin.sensei.index'), next ? { dojo_id: next } : {}, { preserveScroll: true });
                        }}
                    />
                )}
            </div>
        }>
            <Head title="Database Pelatih" />
            <div className="space-y-4 sm:space-y-6 py-4">

                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    <Card className="border-neutral-200/80 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <CardContent className="p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            {/* Title: Mobile di atas, Desktop di kanan */}
                            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest text-neutral-500 order-1 sm:order-2 sm:ml-auto">Pelatih</p>

                            {/* Icon & Jumlah: Mobile di bawah, Desktop di kiri */}
                            <div className="flex items-center gap-3 order-2 sm:order-1 sm:mr-auto">
                                <div className="p-2 sm:p-3 rounded-xl bg-athlix-red/10 shrink-0">
                                    <Shield size={20} className="text-athlix-red sm:hidden" />
                                    <Shield size={24} className="text-athlix-red hidden sm:block" />
                                </div>
                                <p className="text-2xl sm:text-3xl font-black leading-tight text-neutral-900">{totalSensei}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-neutral-200/80 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <CardContent className="p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest text-neutral-500 order-1 sm:order-2 sm:ml-auto">Head Coach</p>

                            <div className="flex items-center gap-3 order-2 sm:order-1 sm:mr-auto">
                                <div className="p-2 sm:p-3 rounded-xl bg-blue-100 shrink-0">
                                    <Users size={20} className="text-blue-600 sm:hidden" />
                                    <Users size={24} className="text-blue-600 hidden sm:block" />
                                </div>
                                <p className="text-2xl sm:text-3xl font-black leading-tight text-neutral-900">{totalCoach}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-neutral-200/80 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <CardContent className="p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest text-neutral-500 order-1 sm:order-2 sm:ml-auto">Asisten</p>

                            <div className="flex items-center gap-3 order-2 sm:order-1 sm:mr-auto">
                                <div className="p-2 sm:p-3 rounded-xl bg-purple-100 shrink-0">
                                    <Users size={20} className="text-purple-600 sm:hidden" />
                                    <Users size={24} className="text-purple-600 hidden sm:block" />
                                </div>
                                <p className="text-2xl sm:text-3xl font-black leading-tight text-neutral-900">{totalAssistant}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sensei Table */}
                <Card className="border-neutral-200/80">
                    <CardHeader className="pb-3 px-4 sm:px-6 pt-4 border-b border-neutral-100 dark:border-neutral-800">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <CardTitle className="text-sm sm:text-base font-black uppercase tracking-wider sm:tracking-widest text-neutral-700 dark:text-neutral-300 leading-snug">
                                Daftar Pelatih {isAllDojos ? '— Semua Club' : `— ${dojo?.name || ''}`}
                            </CardTitle>
                            <Button
                                onClick={() => openAddModal()}
                                className="flex items-center justify-center gap-2 bg-athlix-red hover:bg-red-700 text-white shadow-lg shadow-red-900/20 rounded-xl px-4 py-2 font-bold text-xs uppercase tracking-wider transition-all duration-200 shrink-0 w-full sm:w-auto"
                            >
                                <Plus size={14} /> Tambah Pelatih
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {senseis.length === 0 ? (
                            <div className="p-8 text-center text-sm text-neutral-400">
                                Belum ada pelatih terdaftar.
                            </div>
                        ) : (
                            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {senseis.map((sensei) => {
                                    const roleInfo = ROLE_LABELS[sensei.role] || { label: sensei.role, color: 'bg-neutral-100 text-neutral-600' };
                                    return (
                                        <div key={sensei.id} className="px-4 py-3 sm:px-6 sm:py-3.5 flex flex-col gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                                            {/* Info row */}
                                            <div className="flex items-start gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-xl bg-neutral-100 overflow-hidden flex items-center justify-center text-sm font-black shrink-0">
                                                    {sensei.profile_photo_path ? (
                                                        <img src={resolveMediaUrl(sensei.profile_photo_path)} alt={sensei.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        sensei.name?.charAt(0)
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="font-bold text-sm sm:text-base truncate">{sensei.name}</p>
                                                        <span className={`text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-black uppercase tracking-wider shrink-0 ${roleInfo.color}`}>
                                                            {roleInfo.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-neutral-500 truncate mt-0.5">{sensei.email}</p>
                                                    <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
                                                        {sensei.phone_number && (
                                                            <p className="text-xs text-neutral-400">{sensei.phone_number}</p>
                                                        )}
                                                        {isAllDojos && sensei.dojo_name && (
                                                            <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
                                                                <Building2 size={10} /> {sensei.dojo_name}
                                                            </span>
                                                        )}
                                                        <p className="text-xs text-neutral-400">
                                                            {sensei.athletes?.length || 0} atlet
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Action buttons */}
                                            <div className="flex items-center gap-2 pl-[52px] sm:pl-[52px] flex-wrap">
                                                <button
                                                    className="text-xs font-bold text-athlix-red border border-athlix-red/30 rounded-lg px-3 py-1.5 hover:bg-athlix-red hover:!text-white transition-colors"
                                                    onClick={() => openAssignModal(sensei)}
                                                >
                                                    Kelola Atlet
                                                </button>
                                                <button
                                                    className="text-xs font-bold text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-600 hover:text-white transition-colors"
                                                    onClick={() => openAddModal(sensei)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="text-xs font-bold text-red-500 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-500 hover:text-white transition-colors"
                                                    onClick={() => router.delete(route('dojo-admin.sensei.destroy', sensei.id))}
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Add/Edit Modal */}
            <Modal show={isAddModalOpen} onClose={closeAddModal} maxWidth="lg">
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base sm:text-lg font-black uppercase tracking-tight">
                            {editingId ? 'Edit Pelatih' : 'Tambah Pelatih'}
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {dojos.length > 0 && (
                            <div className="sm:col-span-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-1 block">Club</label>
                                <DbSelect
                                    inputId="add-sensei-dojo-select"
                                    options={dojos.map((item) => ({ value: String(item.id), label: item.name }))}
                                    value={form.data.dojo_id || ''}
                                    placeholder="Pilih Club"
                                    onChange={(next) => form.setData('dojo_id', next)}
                                />
                                {form.errors.dojo_id && <p className="text-xs text-red-500 mt-1">{form.errors.dojo_id}</p>}
                            </div>
                        )}
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-1 block">Nama Pelatih</label>
                            <Input className="text-sm" placeholder="Nama lengkap" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                            {form.errors.name && <p className="text-xs text-red-500 mt-1">{form.errors.name}</p>}
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-1 block">Email</label>
                            <Input className="text-sm" type="email" placeholder="Email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} />
                            {form.errors.email && <p className="text-xs text-red-500 mt-1">{form.errors.email}</p>}
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-1 block">No. WhatsApp</label>
                            <Input className="text-sm" placeholder="08xxxxxxxxxx" value={form.data.phone_number} onChange={(e) => form.setData('phone_number', e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-1 block">
                                {editingId ? 'Password Baru (opsional)' : 'Password'}
                            </label>
                            <Input className="text-sm" type="password" placeholder="Minimal 8 karakter" value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} />
                            {form.errors.password && <p className="text-xs text-red-500 mt-1">{form.errors.password}</p>}
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-1 block">Foto Profil</label>
                            <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp"
                                className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-sm"
                                onChange={(e) => form.setData('profile_photo', e.target.files?.[0] ?? null)}
                            />
                            {form.errors.profile_photo && <p className="text-xs text-red-500 mt-1">{form.errors.profile_photo}</p>}
                        </div>
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-neutral-100">
                        <Button type="button" variant="outline" onClick={closeAddModal} className="w-full sm:w-auto">Batal</Button>
                        <Button
                            onClick={submit}
                            disabled={form.processing}
                            className="bg-athlix-red hover:bg-red-700 text-white w-full sm:w-auto"
                        >
                            {form.processing ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Tambah Pelatih')}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Assign Athletes Modal */}
            <Modal show={assignModal.open} onClose={() => setAssignModal({ open: false, sensei: null, athleteIds: [] })} maxWidth="lg">
                <div className="p-4 sm:p-6 space-y-4">
                    <div>
                        <h3 className="text-base sm:text-lg font-black uppercase tracking-tight">Kelola Atlet</h3>
                        <p className="text-sm text-neutral-500 mt-0.5">{assignModal.sensei?.name}</p>
                    </div>
                    <div className="max-h-[50vh] overflow-y-auto space-y-1.5 pr-1">
                        {athletes.map((athlete) => {
                            const athleteId = String(athlete.id);
                            const checked = assignModal.athleteIds.includes(athleteId);
                            return (
                                <label key={athlete.id} className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-colors ${checked ? 'border-athlix-red/40 bg-athlix-red/5' : 'border-neutral-200 hover:border-neutral-300'}`}>
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggleAthlete(athleteId)}
                                        className="accent-athlix-red shrink-0"
                                    />
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold truncate">{athlete.full_name}</p>
                                        <p className="text-xs text-neutral-500">{athlete.athlete_code}</p>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-neutral-100">
                        <Button variant="outline" onClick={() => setAssignModal({ open: false, sensei: null, athleteIds: [] })} className="w-full sm:w-auto">Batal</Button>
                        <Button onClick={saveAssignments} className="bg-athlix-red hover:bg-red-700 text-white w-full sm:w-auto">Simpan Penugasan</Button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
