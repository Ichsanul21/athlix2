import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { Skeleton } from '@/Components/ui/skeleton';
import DbSelect from '@/Components/DbSelect';
import { Users, Dumbbell, Activity, CreditCard, Sparkles, ChevronRight, CheckCircle2, HeartPulse, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Dashboard({
    auth,
    stats = [],
    trainingPrograms = [],
    nextTrainingReminder,
    attendanceSummary,
    recentAttendances = [],
    wellnessSummary,
    wellnessAlerts = [],
    wellnessTrend = [],
    dojoName,
    dojos = [],
    selectedDojoId = null,
}) {
    const [expandedProgramId, setExpandedProgramId] = useState(null);
    const [dojoId, setDojoId] = useState(selectedDojoId || '');

    useEffect(() => {
        setDojoId(selectedDojoId || '');
    }, [selectedDojoId]);

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
        recentAttendances === undefined ||
        wellnessSummary === undefined ||
        wellnessAlerts === undefined ||
        wellnessTrend === undefined;

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
                            <Skeleton className="h-40" />
                        </div>
                    </div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    const maxHighRiskCount = Math.max(1, ...wellnessTrend.map((item) => Number(item.high_risk_count || 0)));

    return (
        <AdminLayout
            user={auth?.user}
            header={
                <div className="space-y-1 py-2">
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-900 ">Overview Dojo</h2>
                    <p className="text-sm text-neutral-500 ">
                        Selamat datang kembali, Sensei. Berikut ringkasan hari ini.
                    </p>
                    {dojos.length > 0 && (
                        <div className="pt-2">
                            <DbSelect
                                inputId="dashboard-dojo-filter"
                                className="min-w-[220px]"
                                options={dojos.map((dojo) => ({ value: String(dojo.id), label: dojo.name }))}
                                value={dojoId || ''}
                                placeholder="Pilih Dojo"
                                onChange={(next) => {
                                    setDojoId(next);
                                    router.get(route('dashboard'), next ? { dojo_id: next } : {}, { preserveScroll: true });
                                }}
                            />
                        </div>
                    )}
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
                                    Latihan Hari Ini
                                </h3>
                                <Link href={route('training-programs.index')} className="text-sm font-medium text-athlix-red hover:underline flex items-center gap-1 group">
                                    Lihat Semua
                                    <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
                                </Link>
                            </div>
                            {nextTrainingReminder && (
                                <p className="text-xs text-neutral-500 px-1">{nextTrainingReminder}</p>
                            )}

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
                                <CardContent className="p-5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Tren Wellness 7 Hari</p>
                                        <Activity size={16} className="text-athlix-red" />
                                    </div>
                                    <p className="text-[11px] text-neutral-500">Merah: readiness rata-rata | Kuning: jumlah atlet high/very-high ACWR.</p>

                                    {wellnessTrend.length > 0 ? (
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-7 gap-1">
                                                {wellnessTrend.map((item) => {
                                                    const readinessHeight = Math.max(6, Math.round(Number(item.average_readiness || 0)));
                                                    const riskHeight = Math.max(
                                                        6,
                                                        Math.round((Number(item.high_risk_count || 0) / maxHighRiskCount) * 100)
                                                    );

                                                    return (
                                                        <div key={item.date} className="space-y-1">
                                                            <div className="h-24 rounded-lg bg-neutral-50 dark:bg-neutral-900 px-1 py-1 flex items-end justify-center gap-1">
                                                                <div
                                                                    className="w-2 rounded bg-athlix-red/80"
                                                                    style={{ height: `${readinessHeight}%` }}
                                                                    title={`Readiness ${item.average_readiness}%`}
                                                                />
                                                                <div
                                                                    className="w-2 rounded bg-amber-500/80"
                                                                    style={{ height: `${riskHeight}%` }}
                                                                    title={`High ACWR ${item.high_risk_count}`}
                                                                />
                                                            </div>
                                                            <p className="text-[10px] text-center text-neutral-500">{item.label}</p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="flex items-center justify-between text-[11px] text-neutral-500">
                                                <span>Avg readiness: {wellnessSummary?.average_readiness ?? 0}%</span>
                                                <span>Max high ACWR/day: {maxHighRiskCount}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-neutral-400">Belum ada data tren wellness.</p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="bg-white dark:bg-neutral-900/80 border-neutral-200/80 dark:border-neutral-800">
                                <CardContent className="p-5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Wellness Alert Monitor</p>
                                        <HeartPulse size={16} className="text-athlix-red" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 px-3 py-2">
                                            <p className="text-[11px] text-neutral-500">Avg Readiness</p>
                                            <p className="font-black text-athlix-red">{wellnessSummary?.average_readiness ?? 0}%</p>
                                        </div>
                                        <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 px-3 py-2">
                                            <p className="text-[11px] text-neutral-500">Tracked</p>
                                            <p className="font-black">{wellnessSummary?.tracked_athletes ?? 0}</p>
                                        </div>
                                        <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 px-3 py-2">
                                            <p className="text-[11px] text-neutral-500">Low Readiness</p>
                                            <p className="font-black">{wellnessSummary?.low_readiness_count ?? 0}</p>
                                        </div>
                                        <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 px-3 py-2">
                                            <p className="text-[11px] text-neutral-500">High ACWR</p>
                                            <p className="font-black">{wellnessSummary?.high_workload_count ?? 0}</p>
                                        </div>
                                    </div>

                                    {wellnessAlerts.length > 0 ? (
                                        <div className="space-y-2">
                                            {wellnessAlerts.slice(0, 4).map((alert, idx) => (
                                                <div key={`${alert.athlete_code}-${alert.type}-${idx}`} className="rounded-xl border border-neutral-200/80 dark:border-neutral-800 px-3 py-2">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="text-xs font-bold">{alert.athlete_name}</p>
                                                        <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-black ${
                                                            alert.priority >= 3 ? 'text-athlix-red' : 'text-amber-600'
                                                        }`}>
                                                            <AlertTriangle size={12} />
                                                            {alert.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-neutral-500">{alert.athlete_code} | {alert.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-neutral-400">Belum ada alert readiness/workload.</p>
                                    )}
                                </CardContent>
                            </Card>

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

