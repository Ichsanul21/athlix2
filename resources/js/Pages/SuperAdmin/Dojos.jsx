import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { useState } from 'react';

export default function Dojos({ auth, dojos = [], flash }) {
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
                        <Input className="text-sm" placeholder="Nama Paket SaaS (Basic/Pro)" value={form.data.saas_plan_name} onChange={(e) => form.setData('saas_plan_name', e.target.value)} />
                        <label className="text-sm font-semibold space-y-1">
                            <span>Siklus Billing (bulan)</span>
                            <Input type="number" min="1" max="24" value={form.data.billing_cycle_months} onChange={(e) => form.setData('billing_cycle_months', e.target.value)} />
                        </label>
                        <label className="text-sm font-semibold space-y-1">
                            <span>Mulai Langganan</span>
                            <Input type="date" value={form.data.subscription_started_at} onChange={(e) => form.setData('subscription_started_at', e.target.value)} />
                        </label>
                        <label className="text-sm font-semibold space-y-1">
                            <span>Berakhir Langganan</span>
                            <Input type="date" value={form.data.subscription_expires_at} onChange={(e) => form.setData('subscription_expires_at', e.target.value)} />
                        </label>
                        <label className="text-sm font-semibold space-y-1">
                            <span>Grace Period Sampai</span>
                            <Input type="date" value={form.data.grace_period_ends_at} onChange={(e) => form.setData('grace_period_ends_at', e.target.value)} />
                        </label>
                        <label className="flex items-center gap-2 text-sm font-semibold">
                            <input type="checkbox" checked={!!form.data.is_active} onChange={(e) => form.setData('is_active', e.target.checked)} />
                            Aktif
                        </label>
                        <label className="flex items-center gap-2 text-sm font-semibold">
                            <input type="checkbox" checked={!!form.data.is_saas_blocked} onChange={(e) => form.setData('is_saas_blocked', e.target.checked)} />
                            Blokir Akses SaaS Manual
                        </label>
                        <Input className="text-sm md:col-span-2 xl:col-span-3" placeholder="Alasan blokir (opsional)" value={form.data.saas_block_reason} onChange={(e) => form.setData('saas_block_reason', e.target.value)} />

                        <div className="md:col-span-2 xl:col-span-3 flex flex-wrap gap-2">
                            <Button onClick={submit}>{editingId ? 'Simpan Perubahan' : 'Simpan Dojo'}</Button>
                            {editingId && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setEditingId(null);
                                        resetForm();
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
                                        onClick={() => {
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
