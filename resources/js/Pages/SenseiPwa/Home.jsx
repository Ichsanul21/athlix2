import PwaLayout from '@/Layouts/PwaLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import {
    AlertCircle,
    ArrowRight,
    BookOpenText,
    CalendarCheck2,
    CheckCircle2,
    LayoutDashboard,
    UserRound,
} from 'lucide-react';

const statusLabel = {
    present: 'Hadir',
    sick: 'Sakit',
    excused: 'Izin',
    unknown: 'Belum Absen',
};

export default function Home({ auth, dojo, stats, todayPrograms = [], recentAttendances = [] }) {
    return (
        <PwaLayout user={auth?.user} header="Sensei PWA">
            <Head title="Sensei PWA" />

            <div className="space-y-5 pb-24">
                <section className="space-y-1">
                    <p className="text-xs uppercase tracking-widest text-neutral-500 font-black">Dojo</p>
                    <h2 className="text-xl font-black tracking-tight">{dojo?.name || '-'}</h2>
                </section>

                <section className="grid grid-cols-2 gap-3">
                    <Card className="border-neutral-200">
                        <CardContent className="p-4">
                            <p className="text-xs uppercase tracking-widest text-neutral-500 font-black">Atlet</p>
                            <p className="text-2xl font-black mt-1">{stats?.athletes_count || 0}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-neutral-200">
                        <CardContent className="p-4">
                            <p className="text-xs uppercase tracking-widest text-neutral-500 font-black">Check-in</p>
                            <p className="text-2xl font-black mt-1">{stats?.checked_in_count || 0}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-neutral-200">
                        <CardContent className="p-4">
                            <p className="text-xs uppercase tracking-widest text-neutral-500 font-black">Check-out</p>
                            <p className="text-2xl font-black mt-1">{stats?.checked_out_count || 0}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-neutral-200">
                        <CardContent className="p-4">
                            <p className="text-xs uppercase tracking-widest text-neutral-500 font-black">Perlu Feedback</p>
                            <p className="text-2xl font-black mt-1">{stats?.pending_feedback_count || 0}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-neutral-200">
                        <CardContent className="p-4">
                            <p className="text-xs uppercase tracking-widest text-neutral-500 font-black">Sakit</p>
                            <p className="text-2xl font-black mt-1">{stats?.sick_count || 0}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-neutral-200">
                        <CardContent className="p-4">
                            <p className="text-xs uppercase tracking-widest text-neutral-500 font-black">Izin</p>
                            <p className="text-2xl font-black mt-1">{stats?.excused_count || 0}</p>
                        </CardContent>
                    </Card>
                </section>

                <section className="grid grid-cols-2 gap-3">
                    <Link
                        href={route('sensei-pwa.scan')}
                        className="rounded-2xl border border-neutral-200 bg-white p-4 flex flex-col gap-2"
                    >
                        <CalendarCheck2 size={18} className="text-athlix-red" />
                        <p className="text-sm font-black">Absensi Cepat</p>
                    </Link>
                    <Link
                        href={route('sensei-pwa.athletes')}
                        className="rounded-2xl border border-neutral-200 bg-white p-4 flex flex-col gap-2"
                    >
                        <UserRound size={18} className="text-athlix-red" />
                        <p className="text-sm font-black">Data Atlet</p>
                    </Link>
                    <Link
                        href={route('sensei-pwa.notifications')}
                        className="rounded-2xl border border-neutral-200 bg-white p-4 flex flex-col gap-2"
                    >
                        <AlertCircle size={18} className="text-athlix-red" />
                        <p className="text-sm font-black">Notifikasi Atlet</p>
                    </Link>
                    <Link
                        href={route('dashboard')}
                        className="rounded-2xl border border-neutral-200 bg-white p-4 flex flex-col gap-2"
                    >
                        <LayoutDashboard size={18} className="text-athlix-red" />
                        <p className="text-sm font-black">Dashboard Web</p>
                    </Link>
                </section>

                <section className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-xs uppercase tracking-widest text-neutral-500 font-black">Program Hari Ini</p>
                        <Link href={route('sensei-pwa.schedule')} className="text-xs font-black text-athlix-red uppercase tracking-widest">
                            Lihat Semua
                        </Link>
                    </div>
                    {todayPrograms.length > 0 ? (
                        todayPrograms.map((program) => (
                            <Card key={program.id} className="border-neutral-200">
                                <CardContent className="p-4 space-y-1">
                                    <p className="font-black">{program.title}</p>
                                    <p className="text-xs text-neutral-500">{program.time} | {program.coach || '-'}</p>
                                    <div className="flex items-center gap-2">
                                        <BookOpenText size={14} className="text-athlix-red" />
                                        <p className="text-xs text-neutral-600">
                                            {(program.agenda_items || []).slice(0, 2).map((item) => item.title).join(', ') || 'Belum ada detail agenda'}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card className="border-neutral-200">
                            <CardContent className="p-4 text-sm text-neutral-500">Belum ada program latihan hari ini.</CardContent>
                        </Card>
                    )}
                </section>

                <section className="space-y-3">
                    <p className="text-xs uppercase tracking-widest text-neutral-500 font-black">Log Absensi Terbaru</p>
                    {recentAttendances.length > 0 ? (
                        recentAttendances.map((item) => (
                            <Card key={item.id} className="border-neutral-200">
                                <CardContent className="p-4 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-semibold truncate">{item.athlete_name}</p>
                                        <p className="text-xs text-neutral-500">{item.athlete_code}</p>
                                        <p className="text-xs text-neutral-500 mt-1">
                                            IN {item.check_in_at || '-'} | OUT {item.check_out_at || '-'}
                                        </p>
                                    </div>
                                    <div className="shrink-0 text-right space-y-1">
                                        <span className="inline-flex items-center rounded-lg bg-neutral-100 px-2 py-1 text-[11px] font-black uppercase">
                                            {statusLabel[item.status] || item.status}
                                        </span>
                                        {item.needs_feedback && (
                                            <div className="flex items-center justify-end gap-1 text-[11px] text-athlix-red font-bold">
                                                <CheckCircle2 size={12} />
                                                Tindak lanjut
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card className="border-neutral-200">
                            <CardContent className="p-4 text-sm text-neutral-500">Belum ada log absensi hari ini.</CardContent>
                        </Card>
                    )}
                </section>

                <Link
                    href={route('attendance.index')}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-athlix-red px-4 py-3 text-sm font-black text-white"
                >
                    Buka Absensi Dashboard
                    <ArrowRight size={16} />
                </Link>
            </div>
        </PwaLayout>
    );
}

