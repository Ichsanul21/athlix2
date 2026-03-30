import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { useState } from 'react';
import Modal from '@/Components/Modal';
import { Plus, X } from 'lucide-react';

export default function Dojos({ auth, dojos = [] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const resettableFields = [
        'name',
        'timezone',
        'is_active',
        'saas_plan_name',
        'billing_cycle_months',
        'subscription_started_at',
        'subscription_expires_at',
        'grace_period_ends_at',
        'is_saas_blocked',
        'saas_block_reason',
    ];
    const defaultFormState = {
        name: '',
        timezone: 'Asia/Makassar',
        is_active: true,
        saas_plan_name: 'Basic',
        billing_cycle_months: 1,
        subscription_started_at: '',
        subscription_expires_at: '',
        grace_period_ends_at: '',
        is_saas_blocked: false,
        saas_block_reason: '',
    };
    const form = useForm({
        ...defaultFormState,
    });

    const resetForm = () => {
        form.reset(...resettableFields);
        Object.entries(defaultFormState).forEach(([key, value]) => {
            form.setData(key, value);
        });
    };

    const formatDateInput = (value) => (value ? String(value).slice(0, 10) : '');

    const submit = () => {
        if (editingId) {
            form.patch(route('super-admin.dojos.update', editingId), {
                onSuccess: () => {
                    setEditingId(null);
                    resetForm();
                },
            });
            return;
        }

        form.post(route('super-admin.dojos.store'), {
            onSuccess: () => {
                resetForm();
                setIsModalOpen(false);
            },
        });
    };

    const openModal = (dojo = null) => {
        if (dojo) {
            setEditingId(dojo.id);
            form.setData({
                name: dojo.name || '',
                timezone: dojo.timezone || 'Asia/Makassar',
                is_active: !!dojo.is_active,
                saas_plan_name: dojo.saas_plan_name || 'Basic',
                billing_cycle_months: dojo.billing_cycle_months || 1,
                subscription_started_at: formatDateInput(dojo.subscription_started_at),
                subscription_expires_at: formatDateInput(dojo.subscription_expires_at),
                grace_period_ends_at: formatDateInput(dojo.grace_period_ends_at),
                is_saas_blocked: !!dojo.is_saas_blocked,
                saas_block_reason: dojo.saas_block_reason || '',
            });
        } else {
            setEditingId(null);
            resetForm();
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        resetForm();
    };

    return (
        <AdminLayout
            user={auth?.user}
            header={<h2 className="text-xl font-bold tracking-tight uppercase">Master Dojo</h2>}
        >
            <Head title="Master Dojo" />
            <div className="space-y-6 py-4">

                <Modal show={isModalOpen} onClose={closeModal} maxWidth="2xl">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-black uppercase tracking-tight">
                                {editingId ? 'Edit Dojo' : 'Tambah Dojo'}
                            </h3>
                            <button onClick={closeModal} className="text-neutral-500 hover:text-neutral-700">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            <Input className="text-sm" placeholder="Nama Dojo" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                            <Input className="text-sm" placeholder="Timezone (contoh Asia/Makassar)" value={form.data.timezone} onChange={(e) => form.setData('timezone', e.target.value)} />
                            <Input className="text-sm" placeholder="Nama Paket SaaS (Basic/Pro)" value={form.data.saas_plan_name} onChange={(e) => form.setData('saas_plan_name', e.target.value)} />
                            <label className="text-sm font-semibold space-y-1">
                                <span className="block">Siklus Billing (bulan)</span>
                                <Input type="number" min="1" max="24" value={form.data.billing_cycle_months} onChange={(e) => form.setData('billing_cycle_months', e.target.value)} />
                            </label>
                            <label className="text-sm font-semibold space-y-1">
                                <span className="block">Mulai Langganan</span>
                                <Input type="date" value={form.data.subscription_started_at} onChange={(e) => form.setData('subscription_started_at', e.target.value)} />
                            </label>
                            <label className="text-sm font-semibold space-y-1">
                                <span className="block">Berakhir Langganan</span>
                                <Input type="date" value={form.data.subscription_expires_at} onChange={(e) => form.setData('subscription_expires_at', e.target.value)} />
                            </label>
                            <label className="text-sm font-semibold space-y-1 md:col-span-2 xl:col-span-3">
                                <span className="block">Grace Period Sampai</span>
                                <Input type="date" value={form.data.grace_period_ends_at} onChange={(e) => form.setData('grace_period_ends_at', e.target.value)} className="xl:w-1/3" />
                            </label>
                            <div className="flex flex-col gap-2 justify-center md:col-span-2 xl:col-span-3">
                                <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                                    <input type="checkbox" checked={!!form.data.is_active} onChange={(e) => form.setData('is_active', e.target.checked)} className="rounded text-athlix-red focus:ring-athlix-red" />
                                    Beri Izin Akses Aktif
                                </label>
                                <label className="flex items-center gap-2 text-sm font-semibold text-red-600 cursor-pointer">
                                    <input type="checkbox" checked={!!form.data.is_saas_blocked} onChange={(e) => form.setData('is_saas_blocked', e.target.checked)} className="rounded text-red-600 focus:ring-red-600" />
                                    Blokir Paksa Akses SaaS Server
                                </label>
                            </div>
                            {form.data.is_saas_blocked && (
                                <Input className="text-sm md:col-span-2 xl:col-span-3 border-red-300 focus-visible:ring-red-500" placeholder="Alasan pemblokiran (akan muncul di layar pengguna)..." value={form.data.saas_block_reason} onChange={(e) => form.setData('saas_block_reason', e.target.value)} />
                            )}
                        </div>
                        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-neutral-100">
                            <Button type="button" variant="outline" onClick={closeModal}>Batal</Button>
                            <Button onClick={submit}>{editingId ? 'Simpan Perubahan' : 'Simpan Dojo'}</Button>
                        </div>
                    </div>
                </Modal>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between gap-4">
                            <CardTitle>Daftar Dojo</CardTitle>
                            <Button
                                onClick={() => openModal()}
                                className="flex items-center gap-2 bg-athlix-red hover:bg-red-700 text-white shadow-lg shadow-red-900/20 rounded-xl px-4 py-2 font-bold text-xs uppercase tracking-wider transition-all duration-200 shrink-0"
                            >
                                <Plus size={14} /> Tambah Dojo
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {dojos.map((dojo) => (
                            <div key={dojo.id} className="p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="font-semibold truncate">{dojo.name}</p>
                                    <p className="text-xs text-neutral-500">{dojo.timezone} | Paket: {dojo.saas_plan_name || '-'}</p>
                                    <p className="text-xs text-neutral-500">Status akses: {dojo.access_status || (dojo.is_active ? 'Aktif' : 'Nonaktif')}</p>
                                    <p className="text-xs text-neutral-500">Langganan: {dojo.subscription_started_at ? formatDateInput(dojo.subscription_started_at) : '-'} s/d {dojo.subscription_expires_at ? formatDateInput(dojo.subscription_expires_at) : '-'}</p>
                                    <p className="text-xs text-neutral-500">Grace: {dojo.grace_period_ends_at ? formatDateInput(dojo.grace_period_ends_at) : '-'}</p>
                                    <p className="text-xs text-neutral-500">Akun user: {dojo.users_count ?? 0} | Atlet: {dojo.athletes_count ?? 0}</p>
                                    {dojo.is_saas_blocked && dojo.saas_block_reason && (
                                        <p className="text-xs text-red-600">Alasan blokir: {dojo.saas_block_reason}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <button
                                        className="text-blue-600 text-sm"
                                        onClick={() => openModal(dojo)}
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
