import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import DbSelect from '@/Components/DbSelect';
import { useEffect, useState } from 'react';

export default function Index({ auth, notifications = [], athletes = [], dojos = [], selectedDojoId = null, flash }) {
    const [dojoId, setDojoId] = useState(selectedDojoId || '');
    const form = useForm({
        title: '',
        message: '',
        athlete_id: '',
        dojo_id: selectedDojoId || '',
    });

    useEffect(() => {
        setDojoId(selectedDojoId || '');
        form.setData('dojo_id', selectedDojoId || '');
    }, [selectedDojoId]);

    const submit = (event) => {
        event.preventDefault();
        form.post(route('senpai-notifications.store'), {
            preserveScroll: true,
            data: {
                ...form.data,
                is_popup: true,
                is_active: true,
            },
            onSuccess: () => {
                form.reset();
                form.setData('dojo_id', dojoId || '');
            },
        });
    };

    return (
        <AdminLayout user={auth?.user} header={<h2 className="text-xl font-bold tracking-tight uppercase">Notifikasi Atlet</h2>}>
            <Head title="Notifikasi Atlet" />

            <div className="space-y-6 py-4">



                <Card>
                    <CardHeader>
                        <CardTitle>Kirim Notifikasi Senpai ke Atlet</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-3">
                            {dojos.length > 0 && (
                                <DbSelect
                                    inputId="notifications-dojo-filter"
                                    options={dojos.map((dojo) => ({ value: String(dojo.id), label: dojo.name }))}
                                    value={dojoId || ''}
                                    placeholder="Pilih Dojo"
                                    onChange={(next) => {
                                        setDojoId(next);
                                        form.setData('dojo_id', next);
                                        router.get(route('senpai-notifications.index'), next ? { dojo_id: next } : {}, { preserveScroll: true });
                                    }}
                                />
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
                            <DbSelect
                                inputId="notifications-athlete-filter"
                                options={[
                                    { value: '', label: 'Semua Atlet Dojo' },
                                    ...athletes.map((athlete) => ({ value: String(athlete.id), label: `${athlete.full_name} (${athlete.athlete_code})` })),
                                ]}
                                value={form.data.athlete_id || ''}
                                placeholder="Pilih Atlet"
                                onChange={(next) => form.setData('athlete_id', next)}
                            />
                            <p className="text-xs text-neutral-500">Notifikasi akan langsung aktif dan tampil sebagai popup di PWA atlet.</p>
                            <div className="flex items-center gap-2">
                                <Button type="submit" disabled={form.processing}>
                                    {form.processing ? 'Menyimpan...' : 'Kirim Notifikasi'}
                                </Button>
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
                                </div>
                                <p className="text-sm text-neutral-700 ">{notification.message}</p>
                                <div className="inline-flex px-2 py-1 text-[11px] rounded-lg bg-athlix-red/10 text-athlix-red">Aktif + Popup</div>
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
