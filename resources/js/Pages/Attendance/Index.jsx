import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Skeleton } from '@/Components/ui/skeleton';
import DbSelect from '@/Components/DbSelect';
import { QrCode, RefreshCw, CalendarCheck2, CheckCircle2, UserRound, MessageSquare } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useMemo, useState } from 'react';
import Modal from '@/Components/Modal';

export default function Index({ auth, attendances, dojoQr, flash, dojos = [], selectedDojoId = null }) {
    const isLoading = attendances === undefined || dojoQr === undefined;
    const [qrState, setQrState] = useState(dojoQr || null);
    const [refreshing, setRefreshing] = useState(false);
    const [feedbackModal, setFeedbackModal] = useState({ show: false, attendance: null });
    const [senseiFeedback, setSenseiFeedback] = useState('');
    const [senseiMood, setSenseiMood] = useState('normal');
    const [dojoId, setDojoId] = useState(selectedDojoId || '');

    useEffect(() => {
        setQrState(dojoQr || null);
    }, [dojoQr]);

    useEffect(() => {
        setDojoId(selectedDojoId || '');
    }, [selectedDojoId]);

    useEffect(() => {
        if (!qrState?.expires_in) return;

        const timer = setInterval(() => {
            setQrState((prev) => {
                if (!prev) return prev;
                const next = Math.max((prev.expires_in || 0) - 1, 0);
                return { ...prev, expires_in: next };
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [qrState?.generated_at]);

    const refreshDojoQr = async () => {
        setRefreshing(true);
        try {
            const response = await fetch(route('attendance.dojo-qr', dojoId ? { dojo_id: dojoId } : {}));
            const payload = await response.json();
            setQrState(payload);
        } finally {
            setRefreshing(false);
        }
    };

    const summary = useMemo(() => {
        const total = attendances?.length || 0;
        const checkedIn = (attendances || []).filter((item) => item.check_in_at).length;
        const checkedOut = (attendances || []).filter((item) => item.check_out_at).length;
        return { total, checkedIn, checkedOut };
    }, [attendances]);

    const openFeedback = (attendance) => {
        setFeedbackModal({ show: true, attendance });
        setSenseiFeedback(attendance.sensei_feedback || '');
        setSenseiMood(attendance.sensei_mood_assessment || 'normal');
    };

    const submitFeedback = () => {
        if (!feedbackModal.attendance) return;

        router.patch(route('attendance.sensei-feedback', feedbackModal.attendance.id), {
            sensei_feedback: senseiFeedback,
            sensei_mood_assessment: senseiMood,
        }, {
            onSuccess: () => setFeedbackModal({ show: false, attendance: null }),
        });
    };

    if (isLoading) {
        return (
            <AdminLayout user={auth?.user} header={<h2 className="text-xl font-bold leading-tight text-neutral-800 ">Absensi Atlet</h2>}>
                <Head title="Absensi" />
                <div className="py-6"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4"><Skeleton className="h-72 w-full" /></div></div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout user={auth?.user} header={<h2 className="text-xl font-bold leading-tight text-neutral-800 ">Absensi Atlet</h2>}>
            <Head title="Absensi" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-5">
                    {flash?.success && <div className="p-3 rounded-xl border border-green-200 bg-green-50 text-green-700 text-sm">{flash.success}</div>}
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                        <Card><CardContent className="p-4 flex items-center justify-between"><div><p className="text-xs uppercase tracking-widest font-bold text-neutral-500">Check-in</p><p className="text-2xl font-black">{summary.checkedIn}</p></div><CalendarCheck2 className="text-green-600" /></CardContent></Card>
                        <Card><CardContent className="p-4 flex items-center justify-between"><div><p className="text-xs uppercase tracking-widest font-bold text-neutral-500">Check-out</p><p className="text-2xl font-black">{summary.checkedOut}</p></div><CheckCircle2 className="text-athlix-red" /></CardContent></Card>
                        <Card><CardContent className="p-4 flex items-center justify-between"><div><p className="text-xs uppercase tracking-widest font-bold text-neutral-500">Log Hari Ini</p><p className="text-2xl font-black">{summary.total}</p></div><QrCode className="text-blue-600" /></CardContent></Card>
                    </div>

                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500">QR Dojo Aktif</CardTitle>
                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                {dojos.length > 0 && (
                                    <DbSelect
                                        inputId="attendance-dojo-filter"
                                        className="w-full sm:w-[220px]"
                                        options={dojos.map((dojo) => ({ value: String(dojo.id), label: dojo.name }))}
                                        value={dojoId || ''}
                                        placeholder="Pilih Dojo"
                                        onChange={(next) => {
                                            setDojoId(next);
                                            router.get(route('attendance.index'), next ? { dojo_id: next } : {}, { preserveScroll: true });
                                        }}
                                    />
                                )}
                                <Button type="button" variant="outline" className="h-9" onClick={refreshDojoQr} disabled={refreshing}>
                                    <RefreshCw size={14} className={refreshing ? 'animate-spin mr-2' : 'mr-2'} />Refresh QR
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6">
                            {qrState?.payload ? (
                                <div className="grid md:grid-cols-2 gap-6 items-center">
                                    <div className="flex justify-center"><div className="bg-white p-4 rounded-xl border border-neutral-200"><QRCodeSVG value={qrState.payload} size={220} level="Q" /></div></div>
                                    <div className="space-y-2 text-sm">
                                        <p className="font-semibold">Dojo: {qrState.dojo_name || '-'}</p>
                                        <p className="text-neutral-600 ">Atlet scan QR ini untuk check-in/check-out.</p>
                                        {qrState.expires_in !== null && qrState.expires_in !== undefined ? (
                                            <p className="text-neutral-500">Kedaluwarsa dalam <span className="font-black text-athlix-red">{qrState.expires_in ?? 0} detik</span>.</p>
                                        ) : (
                                            <p className="text-neutral-500">QR ini bersifat static untuk dojo terpilih.</p>
                                        )}
                                    </div>
                                </div>
                            ) : <p className="text-sm text-neutral-400">QR dojo belum tersedia.</p>}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500">Log Kehadiran Hari Ini</CardTitle></CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {(attendances || []).map((attendance) => (
                                    <div key={attendance.id} className="px-4 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-9 h-9 rounded-xl bg-athlix-red/10 text-athlix-red flex items-center justify-center"><UserRound size={16} /></div>
                                            <div className="min-w-0"><p className="font-semibold truncate">{attendance.athlete?.full_name || '-'}</p><p className="text-xs text-neutral-500">{attendance.athlete?.athlete_code || '-'}</p></div>
                                        </div>
                                        <div className="text-xs text-neutral-600  sm:min-w-[120px]">
                                            <p>IN: {attendance.check_in_at ? new Date(attendance.check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</p>
                                            <p>OUT: {attendance.check_out_at ? new Date(attendance.check_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            {attendance.status && attendance.status !== 'present' && (
                                                <span className="px-2 py-1 rounded-lg bg-yellow-100 text-yellow-700 text-xs uppercase font-bold">
                                                    {attendance.status === 'sick' ? 'Sakit' : 'Izin'}
                                                </span>
                                            )}
                                            {attendance.check_in_mood && <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs">Check-in: {attendance.check_in_mood}</span>}
                                            {attendance.athlete_mood && <span className="px-2 py-1 rounded-lg bg-neutral-100 text-xs">Mood: {attendance.athlete_mood}</span>}
                                            <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => openFeedback(attendance)}><MessageSquare size={14} className="mr-1" />Feedback Sensei</Button>
                                        </div>
                                    </div>
                                ))}
                                {(attendances || []).length === 0 && <div className="px-4 py-10 text-center text-sm text-neutral-400">Belum ada data absensi hari ini.</div>}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Modal show={feedbackModal.show} onClose={() => setFeedbackModal({ show: false, attendance: null })}>
                <div className="p-6 space-y-3">
                    <h3 className="text-lg font-bold">Feedback Sensei</h3>
                    <DbSelect
                        inputId="attendance-sensei-mood"
                        value={senseiMood}
                        onChange={(value) => setSenseiMood(value)}
                        options={[
                            { value: 'normal', label: 'Normal' },
                            { value: 'semangat', label: 'Semangat' },
                            { value: 'lelah', label: 'Lelah' },
                            { value: 'kurang-fokus', label: 'Kurang Fokus' }
                        ]}
                    />
                    <textarea className="w-full rounded-md border px-3 py-2 min-h-24" value={senseiFeedback} onChange={(e) => setSenseiFeedback(e.target.value)} placeholder="Tulis evaluasi sensei..." />
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setFeedbackModal({ show: false, attendance: null })}>Batal</Button>
                        <Button onClick={submitFeedback}>Simpan</Button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
