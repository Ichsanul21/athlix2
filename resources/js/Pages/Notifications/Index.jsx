import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { useEffect, useState } from 'react';

export default function Index({ auth, notifications = [], athletes = [], dojos = [], selectedDojoId = null, flash }) {
    const [editingNotification, setEditingNotification] = useState(null);
    const [dojoId, setDojoId] = useState(selectedDojoId || '');
    const form = useForm({
        title: '',
        message: '',
        athlete_id: '',
        is_popup: true,
        is_active: true,
        dojo_id: selectedDojoId || '',
    });

    useEffect(() => {
        setDojoId(selectedDojoId || '');
        form.setData('dojo_id', selectedDojoId || '');
    }, [selectedDojoId]);

    const submit = (event) => {
        event.preventDefault();
        if (editingNotification) {
            form.patch(route('senpai-notifications.update', editingNotification.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setEditingNotification(null);
                    form.reset();
                    form.setData('is_popup', true);
                    form.setData('is_active', true);
                    form.setData('dojo_id', dojoId || '');
                },
            });
            return;
        }

        form.post(route('senpai-notifications.store'), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                form.setData('is_popup', true);
                form.setData('is_active', true);
                form.setData('dojo_id', dojoId || '');
            },
        });
    };

    const startEdit = (notification) => {
        setEditingNotification(notification);
        form.setData({
            title: notification.title || '',
            message: notification.message || '',
            athlete_id: notification.athlete_id || '',
            is_popup: Boolean(notification.is_popup),
            is_active: Boolean(notification.is_active),
            dojo_id: dojoId || '',
        });
    };

    const resetForm = () => {
        setEditingNotification(null);
        form.reset();
        form.setData('is_popup', true);
        form.setData('is_active', true);
        form.setData('dojo_id', dojoId || '');
    };

    return (
        <AdminLayout user={auth?.user} header={<h2 className="text-xl font-bold tracking-tight uppercase">Notifikasi Atlet</h2>}>
            <Head title="Notifikasi Atlet" />

            <div className="space-y-6 py-4">
                {flash?.success && <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">{flash.success}</div>}
                {flash?.warning && <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm">{flash.warning}</div>}
                {flash?.error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{flash.error}</div>}

                <Card>
                    <CardHeader>
                        <CardTitle>{editingNotification ? 'Edit Notifikasi Senpai' : 'Kirim Notifikasi Senpai ke Atlet'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-3">
                            {dojos.length > 0 && (
                                <select
                                    className="w-full rounded-lg border px-3 py-2 text-sm"
                                    value={dojoId || ''}
                                    onChange={(event) => {
                                        const next = event.target.value;
                                        setDojoId(next);
                                        form.setData('dojo_id', next);
                                        router.get(route('senpai-notifications.index'), next ? { dojo_id: next } : {}, { preserveScroll: true });
                                    }}
                                >
                                    {dojos.map((dojo) => (
                                        <option key={dojo.id} value={dojo.id}>{dojo.name}</option>
                                    ))}
                                </select>
                            )}
                            <input
                                className="w-full rounded-lg border px-3 py-2 text-sm"
                                placeholder="Judul notifikasi"
                                value={form.data.title}
                                onChange={(event) => form.setData('title', event.target.value)}
                                required
                            />
                            <textarea
                                className="w-full rounded-lg border px-3 py-2 text-sm min-h-24"
                                placeholder="Isi notifikasi untuk atlet..."
                                value={form.data.message}
                                onChange={(event) => form.setData('message', event.target.value)}
                                required
                            />
                            <select
                                className="w-full rounded-lg border px-3 py-2 text-sm"
                                value={form.data.athlete_id || ''}
                                onChange={(event) => form.setData('athlete_id', event.target.value)}
                            >
                                <option value="">Semua Atlet Dojo</option>
                                {athletes.map((athlete) => (
                                    <option key={athlete.id} value={athlete.id}>{athlete.full_name} ({athlete.athlete_code})</option>
                                ))}
                            </select>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={Boolean(form.data.is_popup)} onChange={(event) => form.setData('is_popup', event.target.checked)} />
                                    Tampilkan popup
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={Boolean(form.data.is_active)} onChange={(event) => form.setData('is_active', event.target.checked)} />
                                    Notifikasi aktif
                                </label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button type="submit" disabled={form.processing}>
                                    {form.processing ? 'Menyimpan...' : editingNotification ? 'Simpan Perubahan' : 'Kirim Notifikasi'}
                                </Button>
                                {editingNotification && (
                                    <Button type="button" variant="outline" onClick={resetForm}>
                                        Batal
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Riwayat Notifikasi</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {notifications.length > 0 ? notifications.map((notification) => (
                            <div key={notification.id} className="rounded-xl border p-3 space-y-2">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-bold">{notification.title}</p>
                                        <p className="text-xs text-neutral-500">{notification.published_at} | Sender: {notification.sender_name}</p>
                                        <p className="text-xs text-neutral-500">
                                            Target: {notification.athlete_name ? notification.athlete_name : 'Semua Atlet Dojo'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button type="button" className="text-xs font-bold text-blue-600" onClick={() => startEdit(notification)}>Edit</button>
                                        <button type="button" className="text-xs font-bold text-red-600" onClick={() => router.delete(route('senpai-notifications.destroy', notification.id), { preserveScroll: true })}>Hapus</button>
                                    </div>
                                </div>
                                <p className="text-sm text-neutral-700 ">{notification.message}</p>
                                <div className="flex flex-wrap gap-2">
                                    <span className={`px-2 py-1 text-[11px] rounded-lg ${notification.is_active ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>
                                        {notification.is_active ? 'Aktif' : 'Nonaktif'}
                                    </span>
                                    <span className={`px-2 py-1 text-[11px] rounded-lg ${notification.is_popup ? 'bg-athlix-red/10 text-athlix-red' : 'bg-neutral-100 text-neutral-500'}`}>
                                        {notification.is_popup ? 'Popup' : 'Tanpa Popup'}
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <p className="text-sm text-neutral-400">Belum ada notifikasi yang dikirim.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}

