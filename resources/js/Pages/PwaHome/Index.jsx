import PwaLayout from '@/Layouts/PwaLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { CalendarDays, Clock, Zap, TrendingUp, CreditCard, AlertCircle, Flame, Award, Activity, MessageSquare, ScanLine } from 'lucide-react';
import { Skeleton } from '@/Components/ui/skeleton';
import { useEffect, useMemo, useState } from 'react';
import {
    getWellnessQueueSize,
    registerWellnessAutoSync,
    submitWellnessPayload,
} from '@/lib/offlineWellnessSync';

function todayDateKey() {
    return new Date().toISOString().slice(0, 10);
}

export default function Index({
    auth,
    athlete,
    todaySession,
    stats,
    upcomingPayment,
    tips,
    agendaThreeDays = [],
    performanceSummary,
    latestAttendanceFeedback,
}) {
    const isLoading =
        athlete === undefined &&
        todaySession === undefined &&
        stats === undefined &&
        upcomingPayment === undefined &&
        tips === undefined &&
        performanceSummary === undefined;

    const [showMorningReview, setShowMorningReview] = useState(false);
    const [sleepHours, setSleepHours] = useState('7');
    const [stressLevel, setStressLevel] = useState(4);
    const [muscleSoreness, setMuscleSoreness] = useState(3);
    const [hrvScore, setHrvScore] = useState('');
    const [readinessNote, setReadinessNote] = useState('');
    const [rpeDuration, setRpeDuration] = useState('90');
    const [rpeScore, setRpeScore] = useState(7);
    const [rpeNote, setRpeNote] = useState('');
    const [wellnessMessage, setWellnessMessage] = useState('');
    const [queuePending, setQueuePending] = useState(0);
    const [submittingReadiness, setSubmittingReadiness] = useState(false);
    const [submittingRpe, setSubmittingRpe] = useState(false);

    const readinessDoneKey = useMemo(
        () => `athlix_readiness_done_${todayDateKey()}`,
        []
    );

    useEffect(() => {
        const hour = new Date().getHours();
        const isMorning = hour >= 5 && hour <= 10;

        const isParent = auth?.user?.role === 'parent';
        if (athlete && isMorning && !isParent && !localStorage.getItem(readinessDoneKey)) {
            setShowMorningReview(true);
        }
    }, [athlete?.id, readinessDoneKey]);

    useEffect(() => {
        let unbind = null;

        const setup = async () => {
            const pending = await getWellnessQueueSize();
            setQueuePending(pending);
            unbind = registerWellnessAutoSync((result) => {
                setQueuePending(result.pending);
                if (result.synced > 0) {
                    setWellnessMessage(`Sinkronisasi offline berhasil (${result.synced} data).`);
                }
            });
        };

        setup();

        return () => {
            if (typeof unbind === 'function') {
                unbind();
            }
        };
    }, []);

    const submitMorningReadiness = async () => {
        if (!athlete) return;

        setSubmittingReadiness(true);
        setWellnessMessage('');

        const payload = {
            recorded_on: todayDateKey(),
            sleep_hours: sleepHours === '' ? null : Number(sleepHours),
            stress_level: Number(stressLevel),
            muscle_soreness: Number(muscleSoreness),
            hrv_score: hrvScore === '' ? null : Number(hrvScore),
            notes: readinessNote || null,
            sync_status: navigator.onLine ? 'synced' : 'pending',
        };

        try {
            const result = await submitWellnessPayload('readiness', payload);
            const pending = await getWellnessQueueSize();
            setQueuePending(pending);

            if (result.synced) {
                setWellnessMessage('Readiness pagi tersimpan ke server.');
            } else if (result.queued) {
                setWellnessMessage('Readiness tersimpan offline dan akan tersinkron otomatis.');
            }

            localStorage.setItem(readinessDoneKey, '1');
            setShowMorningReview(false);
            setReadinessNote('');
        } finally {
            setSubmittingReadiness(false);
        }
    };

    const submitRpeLog = async () => {
        if (!athlete) return;
        const parsedDuration = Number(rpeDuration);
        if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
            setWellnessMessage('Durasi latihan harus lebih dari 0 menit.');
            return;
        }

        setSubmittingRpe(true);
        setWellnessMessage('');

        const payload = {
            session_date: todayDateKey(),
            duration_minutes: parsedDuration,
            rpe_score: Number(rpeScore),
            notes: rpeNote || null,
            sync_status: navigator.onLine ? 'synced' : 'pending',
        };

        try {
            const result = await submitWellnessPayload('rpe', payload);
            const pending = await getWellnessQueueSize();
            setQueuePending(pending);

            if (result.synced) {
                setWellnessMessage('RPE log tersimpan ke server.');
            } else if (result.queued) {
                setWellnessMessage('RPE log disimpan offline dan akan tersinkron otomatis.');
            }

            setRpeNote('');
        } finally {
            setSubmittingRpe(false);
        }
    };

    if (isLoading) {
        return (
            <PwaLayout user={auth?.user} header="ATHLIX">
                <Head title="Home" />
                <div className="space-y-6 pb-24">
                    <Skeleton className="h-12 w-48" />
                    <Skeleton className="h-32 w-full" />
                    <div className="grid grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, idx) => <Skeleton key={idx} className="h-20" />)}</div>
                    <Skeleton className="h-24 w-full" />
                </div>
            </PwaLayout>
        );
    }

    const displayName = athlete?.full_name || 'Atlet';
    const isParent = auth?.user?.role === 'parent';

    return (
        <PwaLayout user={auth?.user} header="ATHLIX">
            <Head title="Home" />

            {showMorningReview && (
                <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 p-5 space-y-3">
                        <h3 className="text-lg font-black">Readiness Pagi</h3>
                        <p className="text-sm text-neutral-500">Isi kondisi fisik harian sebelum latihan.</p>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <p className="text-xs font-bold uppercase text-neutral-500">Jam Tidur</p>
                                <input
                                    type="number"
                                    min="0"
                                    max="24"
                                    step="0.5"
                                    value={sleepHours}
                                    onChange={(e) => setSleepHours(e.target.value)}
                                    className="w-full border rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-neutral-500">HRV (opsional)</p>
                                <input
                                    type="number"
                                    min="10"
                                    max="250"
                                    value={hrvScore}
                                    onChange={(e) => setHrvScore(e.target.value)}
                                    className="w-full border rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase text-neutral-500">Stress Level ({stressLevel}/10)</p>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={stressLevel}
                                onChange={(e) => setStressLevel(Number(e.target.value))}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase text-neutral-500">Muscle Soreness ({muscleSoreness}/10)</p>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={muscleSoreness}
                                onChange={(e) => setMuscleSoreness(Number(e.target.value))}
                                className="w-full"
                            />
                        </div>
                        <textarea
                            className="w-full border rounded-lg px-3 py-2 min-h-20"
                            placeholder="Catatan kondisi (opsional)"
                            value={readinessNote}
                            onChange={(e) => setReadinessNote(e.target.value)}
                        />
                        <button
                            onClick={submitMorningReadiness}
                            disabled={submittingReadiness}
                            className="w-full rounded-xl bg-athlix-red text-white py-2.5 font-bold disabled:opacity-70"
                        >
                            {submittingReadiness ? 'Menyimpan...' : 'Simpan Readiness'}
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-6 pb-24">
                <div>
                    <p className="text-sm text-neutral-500 ">{isParent ? 'Memantau Latihan,' : 'Selamat Berlatih,'}</p>
                    <h2 className="text-2xl font-black uppercase tracking-tighter">{displayName}</h2>
                </div>

                {!isParent && (
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <Link href={route('scan.index')} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-neutral-50 transition-colors">
                            <ScanLine size={24} className="text-athlix-red" />
                            <span className="text-xs font-black uppercase tracking-widest text-neutral-700 text-center">Scan & Absensi</span>
                        </Link>
                        <Link href={route('scan.index')} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-neutral-50 transition-colors">
                            <AlertCircle size={24} className="text-orange-500" />
                            <span className="text-xs font-black uppercase tracking-widest text-neutral-700 text-center">Izin / Sakit</span>
                        </Link>
                    </div>
                )}

                {(wellnessMessage || queuePending > 0) && (
                    <Card className="border-athlix-red/20 bg-athlix-red/5">
                        <CardContent className="p-4 text-sm text-neutral-700 space-y-1">
                            {wellnessMessage && <p>{wellnessMessage}</p>}
                            {queuePending > 0 && <p className="font-semibold">Antrian offline: {queuePending} data belum sync.</p>}
                        </CardContent>
                    </Card>
                )}

                <Card className="border-none bg-gradient-to-r from-athlix-red to-red-600 text-white overflow-hidden relative shadow-xl shadow-athlix-red/20">
                    <CardContent className="p-6 relative z-10">
                        <div className="flex items-center gap-2 mb-3"><div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm"><CalendarDays size={16} /></div><span className="text-xs font-black uppercase tracking-widest">Jadwal Hari Ini</span></div>
                        {todaySession ? (
                            <div className="space-y-2">
                                <h3 className="text-xl font-black tracking-tight">{todaySession.title}</h3>
                                <div className="flex items-center gap-3 text-sm text-white/80"><span className="flex items-center gap-1"><Clock size={14} />{todaySession.time}</span><span>-</span><span>{todaySession.coach}</span></div>
                            </div>
                        ) : (
                            <div className="space-y-1"><h3 className="text-xl font-black tracking-tight">Hari Libur</h3><p className="text-sm text-white/70">Tidak ada jadwal latihan hari ini. Istirahat yang cukup.</p></div>
                        )}
                    </CardContent>
                </Card>



                {agendaThreeDays.length > 0 && (
                    <Card className="border-neutral-200/80 dark:border-neutral-800">
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Agenda 3 Hari Ke Depan</p>
                                <Link href={route('schedule.index')} className="text-[11px] font-black uppercase tracking-widest text-athlix-red">Lihat Seluruh Agenda</Link>
                            </div>
                            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1">
                                {agendaThreeDays.slice(0, 3).map((item, idx) => (
                                    <div key={`${item.title}-${idx}`} className="min-w-[240px] snap-start p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 space-y-1">
                                        <p className="font-bold text-sm">{item.title}</p>
                                        <p className="text-xs text-neutral-500">{item.date} | {item.time}</p>
                                        <p className="text-xs text-neutral-500">Pelatih: {item.coach}</p>
                                        <p className="text-[11px] text-neutral-500">Detail: {(item.agenda_items || []).slice(0, 2).map((agenda) => agenda.title).join(', ') || '-'}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-2 gap-3">
                    {[
                        { label: 'Kehadiran', value: stats?.attendance || '0%', icon: TrendingUp, color: 'text-green-500 bg-green-500/10' },
                        { label: 'Level', value: stats?.level || '-', icon: Award, color: 'text-yellow-500 bg-yellow-500/10' },
                        { label: 'Sisa Bayar', value: stats?.outstanding || 'Rp 0', icon: CreditCard, color: 'text-blue-500 bg-blue-500/10' },
                        { label: 'Latihan Hari Ini', value: stats?.total_sessions || '0', icon: Flame, color: 'text-orange-500 bg-orange-500/10' },
                    ].map((s) => (
                        <Card key={s.label} className="border-neutral-200/80 dark:border-neutral-800"><CardContent className="p-4"><div className="flex items-center gap-3"><div className={`p-2 rounded-xl ${s.color}`}><s.icon size={18} /></div><div><p className="text-xs font-bold uppercase text-neutral-500 tracking-widest">{s.label}</p><p className="text-base font-black">{s.value}</p></div></div></CardContent></Card>
                    ))}
                </div>

                {performanceSummary && (
                    <Card className="border-neutral-200/80 dark:border-neutral-800">
                        <CardContent className="p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Activity size={16} className="text-athlix-red" />
                                    <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Kondisi & Kemampuan</p>
                                </div>
                                <Link href={route('condition.index')} className="text-[11px] font-black uppercase tracking-widest text-athlix-red">Detail</Link>
                            </div>
                            <div className="flex items-end justify-between gap-4">
                                <div>
                                    <p className="text-3xl font-black text-athlix-red">{performanceSummary.condition_percentage}%</p>
                                    <p className="text-xs text-neutral-500">Kondisi fisik saat ini</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black uppercase text-neutral-500">Status Kemampuan</p>
                                    <p className="text-sm font-bold">{performanceSummary.ability_status}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {latestAttendanceFeedback && (
                    <Card className="border-neutral-200/80 dark:border-neutral-800">
                        <CardContent className="p-4 space-y-2">
                            <div className="flex items-center gap-2">
                                <MessageSquare size={16} className="text-athlix-red" />
                                <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Feedback Terbaru</p>
                            </div>
                            <p className="text-xs text-neutral-400">{latestAttendanceFeedback.date}</p>
                            {latestAttendanceFeedback.sensei_feedback && (
                                <p className="text-sm text-neutral-700 "><span className="font-bold">Sensei:</span> {latestAttendanceFeedback.sensei_feedback}</p>
                            )}
                            {latestAttendanceFeedback.sensei_mood_assessment && (
                                <p className="text-sm text-neutral-700 "><span className="font-bold">Penilaian mood:</span> {latestAttendanceFeedback.sensei_mood_assessment}</p>
                            )}
                            {latestAttendanceFeedback.check_in_feedback && (
                                <p className="text-sm text-neutral-700 "><span className="font-bold">Catatan check-in:</span> {latestAttendanceFeedback.check_in_feedback}</p>
                            )}
                            {latestAttendanceFeedback.athlete_feedback && (
                                <p className="text-sm text-neutral-700 "><span className="font-bold">Refleksi check-out:</span> {latestAttendanceFeedback.athlete_feedback}</p>
                            )}
                            {!latestAttendanceFeedback.sensei_feedback && !latestAttendanceFeedback.sensei_mood_assessment && (
                                <p className="text-sm text-neutral-500">Belum ada feedback sensei terbaru. Catatan absensi tetap tampil di sini.</p>
                            )}
                        </CardContent>
                    </Card>
                )}

                {tips && <Card className="border-neutral-200/80 dark:border-neutral-800 bg-gradient-to-r from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-900/70"><CardContent className="p-5 flex gap-4 items-start"><div className="p-2.5 rounded-xl bg-athlix-red/10 text-athlix-red flex-shrink-0"><Zap size={20} /></div><div><p className="text-xs font-black uppercase tracking-widest text-athlix-red mb-1">Tips Sensei</p><p className="text-sm text-neutral-600  leading-relaxed">{tips}</p></div></CardContent></Card>}

                {upcomingPayment && upcomingPayment.amount > 0 && (
                    <Card className="border-athlix-red/20 dark:border-athlix-red/10 bg-athlix-red/5 dark:bg-athlix-red/5"><CardContent className="p-5 flex items-center gap-4"><div className="p-2.5 rounded-xl bg-athlix-red/10 text-athlix-red"><AlertCircle size={20} /></div><div className="flex-1 min-w-0"><p className="text-xs font-black uppercase tracking-widest text-athlix-red">Tagihan Aktif</p><p className="text-sm text-neutral-600 ">Jatuh tempo <span className="font-bold">{upcomingPayment.due_date}</span></p></div><div className="text-right flex-shrink-0"><p className="font-mono font-black text-lg text-athlix-red">{upcomingPayment.formatted_amount}</p></div></CardContent></Card>
                )}
            </div>
        </PwaLayout>
    );
}
