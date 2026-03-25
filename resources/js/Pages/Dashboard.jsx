import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { Skeleton } from '@/Components/ui/skeleton';
import { Users, Dumbbell, Activity, CreditCard, Sparkles, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export default function Dashboard({
    auth,
    stats = [],
    trainingPrograms = [],
    nextTrainingReminder,
    attendanceSummary,
    recentAttendances = [],
    dojoName,
}) {
    const [expandedProgramId, setExpandedProgramId] = useState(null);

    const icons = {
        users: Users,
        dumbbell: Dumbbell,
        activity: Activity,
        'credit-card': CreditCard,
    };

    const iconColors = [
        'bg-athlix-red/10 text-athlix-red',
        'bg-blue-500/10 text-blue-500',
        'bg-green-500/10 text-green-500',
        'bg-orange-500/10 text-orange-500',
    ];

    const isLoading =
        stats === undefined ||
        trainingPrograms === undefined ||
        dojoName === undefined ||
        nextTrainingReminder === undefined ||
        attendanceSummary === undefined ||
        recentAttendances === undefined;

    if (isLoading) {
        return (
            <AdminLayout
                user={auth?.user}
                header={
                    <div className="space-y-1 py-2">
                        <h2 className="text-2xl font-bold tracking-tight text-neutral-900 ">Overview Dojo</h2>
                        <p className="text-sm text-neutral-500 ">
                            Selamat datang kembali, Sensei. Berikut ringkasan hari ini.
                        </p>
                    </div>
                }
            >
                <Head title="Dashboard" />
                <div className="py-6 space-y-8">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                            {Array.from({ length: 4 }).map((_, idx) => (
                                <Skeleton key={idx} className="h-24" />
                            ))}
                        </div>
                        <div className="grid gap-6 md:grid-cols-12">
                            <div className="md:col-span-8 space-y-3">
                                {Array.from({ length: 3 }).map((_, idx) => (
                                    <Skeleton key={idx} className="h-16" />
                                ))}
                            </div>
                            <div className="md:col-span-4 space-y-3">
                                <Skeleton className="h-48" />
                                <Skeleton className="h-40" />
                            </div>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout
            user={auth?.user}
            header={
                <div className="space-y-1 py-2">
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-900 ">Overview Dojo</h2>
                    <p className="text-sm text-neutral-500 ">
                        Selamat datang kembali, Sensei. Berikut ringkasan hari ini.
                    </p>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="py-6 space-y-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                        {stats.map((stat, idx) => {
                            const Icon = icons[stat.icon] || Users;
                            return (
                                <Card
                                    key={stat.title}
                                    className="bg-white dark:bg-neutral-900/80 border-neutral-200/80 dark:border-neutral-800 card-hover overflow-hidden relative group animate-fade-in-up fill-both"
                                    style={{ animationDelay: `${idx * 80}ms` }}
                                >
                                    <CardContent className="p-5 sm:p-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-2xl ${iconColors[idx % iconColors.length]}`}>
                                                <Icon size={22} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-neutral-500 ">{stat.title}</p>
                                                <h3 className="text-2xl font-bold tracking-tight">{stat.value}</h3>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    <div className="grid gap-6 md:grid-cols-12">
                        <div className="md:col-span-8 space-y-4 animate-fade-in-up fill-both" style={{ animationDelay: '200ms' }}>
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Sparkles className="text-athlix-red" size={20} />
                                    Program Latihan Hari Ini
                                </h3>
                                <Link href={route('training-programs.index')} className="text-sm font-medium text-athlix-red hover:underline flex items-center gap-1 group">
                                    Lihat Semua
                                    <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
                                </Link>
                            </div>
                            <p className="text-xs text-neutral-500 px-1">{nextTrainingReminder}</p>

                            <div className="space-y-3">
                                {trainingPrograms.length > 0 ? trainingPrograms.map((program, idx) => (
                                    <Card key={program.id ?? idx} className="bg-white dark:bg-neutral-900/80 border-neutral-200/80 dark:border-neutral-800 hover:border-athlix-red/30 transition-all duration-300 cursor-pointer card-hover group">
                                        <button
                                            type="button"
                                            onClick={() => setExpandedProgramId(expandedProgramId === (program.id ?? idx) ? null : (program.id ?? idx))}
                                            className="w-full text-left"
                                        >
                                            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="p-2.5 rounded-xl bg-athlix-red/10 text-athlix-red">
                                                        <Dumbbell size={20} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-bold text-base truncate">{program.title}</h4>
                                                        <p className="text-sm text-neutral-500  truncate">{program.desc}</p>
                                                    </div>
                                                </div>
                                                <div className="text-left sm:text-right">
                                                    <p className="font-mono text-sm font-bold">{program.time}</p>
                                                    <p className="text-xs text-neutral-500 ">{program.status}</p>
                                                </div>
                                            </CardContent>
                                        </button>
                                        {expandedProgramId === (program.id ?? idx) && (
                                            <div className="px-4 pb-4 text-xs text-neutral-500 space-y-1">
                                                <p><span className="font-bold text-neutral-700 ">Hari:</span> {program.day}</p>
                                                <p><span className="font-bold text-neutral-700 ">Tanggal:</span> {program.next_date}</p>
                                                <p><span className="font-bold text-neutral-700 ">Pelatih:</span> {program.coach || '-'}</p>
                                                <p><span className="font-bold text-neutral-700 ">Detail:</span> {program.detail}</p>
                                            </div>
                                        )}
                                    </Card>
                                )) : (
                                    <Card className="border-neutral-200/80 dark:border-neutral-800">
                                        <CardContent className="p-6 text-sm text-neutral-400 text-center">
                                            Belum ada jadwal latihan terdekat.
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>

                        <div className="md:col-span-4 space-y-4 animate-fade-in-up fill-both" style={{ animationDelay: '300ms' }}>
                            <Card className="bg-white dark:bg-neutral-900/80 border-neutral-200/80 dark:border-neutral-800">
                                <CardContent className="p-5 space-y-2">
                                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Ringkasan Absensi Hari Ini</p>
                                    <p className="text-3xl font-black text-athlix-red">{attendanceSummary?.percentage ?? 0}%</p>
                                    <p className="text-sm text-neutral-600 ">
                                        {attendanceSummary?.present ?? 0} dari {attendanceSummary?.total_athletes ?? 0} atlet hadir.
                                    </p>
                                    <Link href={route('attendance.index')} className="inline-flex items-center text-sm font-bold text-athlix-red hover:underline">
                                        Buka detail absensi
                                        <ChevronRight size={14} className="ml-1" />
                                    </Link>
                                </CardContent>
                            </Card>

                            <Card className="bg-white dark:bg-neutral-900/80 border-neutral-200/80 dark:border-neutral-800">
                                <CardContent className="p-5 space-y-3">
                                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Kehadiran Terbaru</p>
                                    {recentAttendances.length > 0 ? recentAttendances.map((item, idx) => (
                                        <div key={`${item.athlete_name}-${idx}`} className="flex items-center justify-between text-sm">
                                            <div>
                                                <p className="font-semibold">{item.athlete_name}</p>
                                                <p className="text-xs text-neutral-500">{item.time}</p>
                                            </div>
                                            <span className="inline-flex items-center gap-1 text-xs uppercase font-bold text-green-600">
                                                <CheckCircle2 size={12} /> {item.status}
                                            </span>
                                        </div>
                                    )) : (
                                        <p className="text-sm text-neutral-400">Belum ada absensi masuk hari ini.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

