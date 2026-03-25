import PwaLayout from '@/Layouts/PwaLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { CalendarDays, Clock, Zap, TrendingUp, CreditCard, AlertCircle, Flame, Award } from 'lucide-react';
import { Skeleton } from '@/Components/ui/skeleton';
import { useEffect, useState } from 'react';

export default function Index({ auth, athlete, todaySession, stats, upcomingPayment, tips, agendaThreeDays = [] }) {
    const isLoading =
        athlete === undefined &&
        todaySession === undefined &&
        stats === undefined &&
        upcomingPayment === undefined &&
        tips === undefined;

    const [showMorningReview, setShowMorningReview] = useState(false);
    const [morningMood, setMorningMood] = useState('normal');
    const [morningNote, setMorningNote] = useState('');

    useEffect(() => {
        const todayKey = new Date().toISOString().slice(0, 10);
        const doneKey = `athlix_morning_review_${todayKey}`;

        if (!localStorage.getItem(doneKey)) {
            setShowMorningReview(true);
        }
    }, []);

    const submitMorningReview = () => {
        const todayKey = new Date().toISOString().slice(0, 10);
        const doneKey = `athlix_morning_review_${todayKey}`;
        localStorage.setItem(doneKey, JSON.stringify({ mood: morningMood, note: morningNote }));
        setShowMorningReview(false);
        setMorningNote('');
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

    return (
        <PwaLayout user={auth?.user} header="ATHLIX">
            <Head title="Home" />

            {showMorningReview && (
                <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 p-5 space-y-3">
                        <h3 className="text-lg font-black">Review Kondisi Pagi</h3>
                        <p className="text-sm text-neutral-500">Isi kondisi kamu tiap pagi sebelum latihan.</p>
                        <select className="w-full border rounded-lg px-3 py-2" value={morningMood} onChange={(e) => setMorningMood(e.target.value)}>
                            <option value="semangat">Semangat</option>
                            <option value="normal">Normal</option>
                            <option value="lelah">Lelah</option>
                            <option value="kurang-fit">Kurang Fit</option>
                        </select>
                        <textarea className="w-full border rounded-lg px-3 py-2 min-h-20" placeholder="Catatan kondisi (opsional)" value={morningNote} onChange={(e) => setMorningNote(e.target.value)} />
                        <button onClick={submitMorningReview} className="w-full rounded-xl bg-athlix-red text-white py-2.5 font-bold">Simpan Review Pagi</button>
                    </div>
                </div>
            )}

            <div className="space-y-6 pb-24">
                <div>
                    <p className="text-sm text-neutral-500 ">Selamat Berlatih,</p>
                    <h2 className="text-2xl font-black uppercase tracking-tighter">{displayName}</h2>
                </div>

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
                        { label: 'Sabuk', value: stats?.belt || 'Putih', icon: Award, color: 'text-yellow-500 bg-yellow-500/10' },
                        { label: 'Sisa Bayar', value: stats?.outstanding || 'Rp 0', icon: CreditCard, color: 'text-blue-500 bg-blue-500/10' },
                        { label: 'Latihan Hari Ini', value: stats?.total_sessions || '0', icon: Flame, color: 'text-orange-500 bg-orange-500/10' },
                    ].map((s) => (
                        <Card key={s.label} className="border-neutral-200/80 dark:border-neutral-800"><CardContent className="p-4"><div className="flex items-center gap-3"><div className={`p-2 rounded-xl ${s.color}`}><s.icon size={18} /></div><div><p className="text-xs font-bold uppercase text-neutral-500 tracking-widest">{s.label}</p><p className="text-base font-black">{s.value}</p></div></div></CardContent></Card>
                    ))}
                </div>

                {tips && <Card className="border-neutral-200/80 dark:border-neutral-800 bg-gradient-to-r from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-900/70"><CardContent className="p-5 flex gap-4 items-start"><div className="p-2.5 rounded-xl bg-athlix-red/10 text-athlix-red flex-shrink-0"><Zap size={20} /></div><div><p className="text-xs font-black uppercase tracking-widest text-athlix-red mb-1">Tips Sensei</p><p className="text-sm text-neutral-600  leading-relaxed">{tips}</p></div></CardContent></Card>}

                {upcomingPayment && upcomingPayment.amount > 0 && (
                    <Card className="border-athlix-red/20 dark:border-athlix-red/10 bg-athlix-red/5 dark:bg-athlix-red/5"><CardContent className="p-5 flex items-center gap-4"><div className="p-2.5 rounded-xl bg-athlix-red/10 text-athlix-red"><AlertCircle size={20} /></div><div className="flex-1 min-w-0"><p className="text-xs font-black uppercase tracking-widest text-athlix-red">Tagihan Aktif</p><p className="text-sm text-neutral-600 ">Jatuh tempo <span className="font-bold">{upcomingPayment.due_date}</span></p></div><div className="text-right flex-shrink-0"><p className="font-mono font-black text-lg text-athlix-red">{upcomingPayment.formatted_amount}</p></div></CardContent></Card>
                )}
            </div>
        </PwaLayout>
    );
}
