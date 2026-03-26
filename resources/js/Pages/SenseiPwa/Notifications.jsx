import PwaLayout from '@/Layouts/PwaLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { useMemo, useState } from 'react';
import { ArrowRight, Megaphone } from 'lucide-react';

export default function Notifications({ auth, dojo, athletes = [], notifications = [] }) {
    const { flash, errors } = usePage().props;
    const [form, setForm] = useState({
        title: '',
        message: '',
        athlete_id: '',
        is_popup: true,
        is_active: true,
    });
    const [submitting, setSubmitting] = useState(false);

    const sortedAthletes = useMemo(
        () => [...athletes].sort((a, b) => String(a.full_name || '').localeCompare(String(b.full_name || ''))),
        [athletes],
    );

    const submitForm = (event) => {
        event.preventDefault();
        setSubmitting(true);

        router.post(
            route('senpai-notifications.store'),
            {
                title: form.title,
                message: form.message,
                athlete_id: form.athlete_id || null,
                is_popup: form.is_popup ? 1 : 0,
                is_active: form.is_active ? 1 : 0,
            },
            {
                preserveScroll: true,
                onFinish: () => setSubmitting(false),
                onSuccess: () => {
                    setForm((prev) => ({
                        ...prev,
                        title: '',
                        message: '',
                        athlete_id: '',
                    }));
                },
            },
        );
    };

    return (
        <PwaLayout user={auth?.user} header="Notifikasi Sensei">
            <Head title="Notifikasi Sensei PWA" />

            <div className="space-y-5 pb-24">
                {flash?.success && (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{flash.success}</div>
                )}
                {flash?.error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{flash.error}</div>
                )}
                {errors && Object.keys(errors).length > 0 && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {Object.values(errors)[0]}
                    </div>
                )}

                <section className="space-y-1">
                    <p className="text-xs uppercase tracking-widest text-neutral-500 font-black">Dojo</p>
                    <h2 className="text-xl font-black tracking-tight">{dojo?.name || '-'}</h2>
                </section>

                <Card className="border-neutral-200">
                    <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <Megaphone size={16} className="text-athlix-red" />
                            <p className="text-xs uppercase tracking-widest text-neutral-500 font-black">Kirim Notifikasi Atlet</p>
                        </div>

                        <form onSubmit={submitForm} className="space-y-3">
                            <input
                                type="text"
                                value={form.title}
                                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                                placeholder="Judul notifikasi"
                                maxLength={150}
                                required
                            />

                            <textarea
                                value={form.message}
                                onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                                className="w-full min-h-24 rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                                placeholder="Isi pesan"
                                maxLength={2000}
                                required
                            />

                            <select
                                value={form.athlete_id}
                                onChange={(event) => setForm((prev) => ({ ...prev, athlete_id: event.target.value }))}
                                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                            >
                                <option value="">Broadcast semua atlet dojo</option>
                                {sortedAthletes.map((athlete) => (
                                    <option key={athlete.id} value={athlete.id}>
                                        {athlete.full_name} ({athlete.athlete_code})
                                    </option>
                                ))}
                            </select>

                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={form.is_popup}
                                    onChange={(event) => setForm((prev) => ({ ...prev, is_popup: event.target.checked }))}
                                />
                                Tampilkan sebagai popup
                            </label>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full rounded-xl bg-athlix-red px-4 py-2.5 text-sm font-black text-white disabled:opacity-70"
                            >
                                {submitting ? 'Mengirim...' : 'Kirim Notifikasi'}
                            </button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="border-neutral-200">
                    <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-xs uppercase tracking-widest text-neutral-500 font-black">Riwayat Notifikasi</p>
                            <span className="text-xs text-neutral-500">{notifications.length} data</span>
                        </div>

                        {notifications.length > 0 ? (
                            <div className="space-y-2">
                                {notifications.map((notification) => (
                                    <div key={notification.id} className="rounded-xl border border-neutral-200 p-3 space-y-1">
                                        <div className="flex items-start justify-between gap-3">
                                            <p className="font-semibold">{notification.title}</p>
                                            <span className="rounded-lg bg-neutral-100 px-2 py-1 text-[11px] font-black uppercase">
                                                {notification.is_popup ? 'Popup' : 'Info'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-neutral-600">{notification.message}</p>
                                        <p className="text-xs text-neutral-500">
                                            Target: {notification.athlete_name || 'Semua atlet dojo'}
                                        </p>
                                        <p className="text-xs text-neutral-400">
                                            Publish: {notification.published_at} | Sender: {notification.sender_name}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-neutral-500">Belum ada notifikasi.</p>
                        )}
                    </CardContent>
                </Card>

                <Link
                    href={route('senpai-notifications.index')}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-athlix-red px-4 py-3 text-sm font-black text-athlix-red"
                >
                    Buka Notifikasi Dashboard
                    <ArrowRight size={16} />
                </Link>
            </div>
        </PwaLayout>
    );
}

