import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { Skeleton } from '@/Components/ui/skeleton';
import { Button } from '@/Components/ui/button';
import Modal from '@/Components/Modal';
import DbSelect from '@/Components/DbSelect';
import {
    Users, Dumbbell, Activity, CreditCard, Sparkles, ChevronRight,
    CheckCircle2, Clock, User, X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Dashboard({
    auth,
    stats = [],
    trainingPrograms = [],
    nextTrainingReminder,
    attendanceSummary,
    recentAttendances = [],
    dojoName,
    dojos = [],
    selectedDojoId = null,
}) {
    const [dojoId, setDojoId] = useState(selectedDojoId || '');
    const [scheduleModal, setScheduleModal] = useState(null);
    const [attendanceModal, setAttendanceModal] = useState(null);

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
        'bg-emerald-500/10 text-emerald-500',
        'bg-amber-500/10 text-amber-500',
    ];

    const typeColors = {
        fisik: 'bg-orange-500',
        kumite: 'bg-athlix-red',
        kata: 'bg-purple-500',
        teknik: 'bg-blue-500',
    };

    const isLoading =
        stats === undefined ||
        trainingPrograms === undefined ||
        dojoName === undefined ||
        nextTrainingReminder === undefined ||
        attendanceSummary === undefined ||
        recentAttendances === undefined;

    if (isLoading) {
        return (
            <AdminLayout user={auth?.user} header={<Skeleton className="h-8 w-52" />}>
                <Head title="Dashboard" />
                <div className="py-6">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
                        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                            {Array.from({ length: 4 }).map((_, idx) => <Skeleton key={idx} className="h-24" />)}
                        </div>
                        <div className="grid gap-6 lg:grid-cols-3">
                            <div className="lg:col-span-2 space-y-3">
                                {Array.from({ length: 3 }).map((_, idx) => <Skeleton key={idx} className="h-20" />)}
                            </div>
                            <div className="space-y-3">
                                <Skeleton className="h-48" />
                                <Skeleton className="h-40" />
                            </div>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    const isSuperAdmin = auth?.user?.role === 'super_admin';

    return (
        <AdminLayout
            user={auth?.user}
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">Overview Dojo</h2>
                        <p className="text-sm text-neutral-500 mt-0.5">
                            {dojoId ? (dojos.find(d => String(d.id) === String(dojoId))?.name || dojoName) : (isSuperAdmin ? 'Semua Dojo' : dojoName)} — {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    {dojos.length > 0 && (
                        <DbSelect
                            inputId="dashboard-dojo-filter"
                            className="min-w-[220px]"
                            options={[
                                { value: '', label: 'Semua Dojo' },
                                ...dojos.map((dojo) => ({ value: String(dojo.id), label: dojo.name }))
                            ]}
                            value={dojoId || ''}
                            placeholder="Pilih Dojo"
                            onChange={(next) => {
                                setDojoId(next);
                                router.get(route('dashboard'), next ? { dojo_id: next } : {}, { preserveScroll: true });
                            }}
                        />
                    )}
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="py-6 space-y-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* KPI Stats Row */}
                    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                        {stats.map((stat, idx) => {
                            const Icon = icons[stat.icon] || Users;
                            return (
                                <Card
                                    key={stat.title}
                                    className="bg-white dark:bg-neutral-900/80 border-neutral-200/80 dark:border-neutral-800 overflow-hidden relative group animate-fade-in-up fill-both"
                                    style={{ animationDelay: `${idx * 80}ms` }}
                                >
                                    <CardContent className="p-5">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2.5 rounded-2xl ${iconColors[idx % iconColors.length]}`}>
                                                <Icon size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-neutral-500">{stat.title}</p>
                                                <h3 className="text-2xl font-black tracking-tight leading-tight">{stat.value}</h3>
                                            </div>
                                        </div>
                                        {stat.change !== undefined && (
                                            <p className={`text-xs mt-2 font-semibold ${stat.change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                {stat.change >= 0 ? '+' : ''}{stat.change}% dari kemarin
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Main Content */}
                    <div className="grid gap-6 lg:grid-cols-3 animate-fade-in-up fill-both" style={{ animationDelay: '180ms' }}>

                        {/* LEFT: Training Schedule */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-black flex items-center gap-2">
                                    <Sparkles className="text-athlix-red" size={18} />
                                    Latihan Hari Ini
                                </h3>
                                <Link
                                    href={route('training-programs.index')}
                                    className="text-xs font-bold text-athlix-red hover:underline flex items-center gap-1 group"
                                >
                                    Lihat Semua
                                    <ChevronRight size={13} className="transition-transform group-hover:translate-x-1" />
                                </Link>
                            </div>
                            {nextTrainingReminder && (
                                <p className="text-xs text-neutral-500 -mt-2">{nextTrainingReminder}</p>
                            )}

                            <div className="space-y-2">
                                {trainingPrograms.length > 0 ? trainingPrograms.map((program, idx) => (
                                    <button
                                        key={program.id ?? idx}
                                        type="button"
                                        onClick={() => setScheduleModal(program)}
                                        className="w-full text-left"
                                    >
                                        <Card className="bg-white dark:bg-neutral-900/80 border-neutral-200/80 dark:border-neutral-800 hover:border-athlix-red/30 hover:shadow-md transition-all duration-200 cursor-pointer group">
                                            <CardContent className="p-4 flex items-center gap-4">
                                                <div className={`w-1 self-stretch rounded-full ${typeColors[program.type] || 'bg-blue-500'}`} />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-sm truncate group-hover:text-athlix-red transition-colors">{program.title}</h4>
                                                    <p className="text-xs text-neutral-500 truncate">{program.desc}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="font-mono text-sm font-bold">{program.time}</p>
                                                    <p className="text-xs text-neutral-500">{program.coach}</p>
                                                </div>
                                                <ChevronRight size={14} className="text-neutral-300 group-hover:text-athlix-red transition-colors shrink-0" />
                                            </CardContent>
                                        </Card>
                                    </button>
                                )) : (
                                    <Card className="border-neutral-200/80 dark:border-neutral-800">
                                        <CardContent className="p-8 text-sm text-neutral-400 text-center">
                                            Belum ada jadwal latihan hari ini.
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            {/* Absensi Ringkasan */}
                            <Card className="bg-white dark:bg-neutral-900/80 border-neutral-200/80 dark:border-neutral-800 mt-2">
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Absensi Hari Ini</p>
                                        <Link href={route('attendance.index')} className="text-xs font-bold text-athlix-red hover:underline flex items-center gap-1">
                                            Detail <ChevronRight size={12} />
                                        </Link>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <p className="text-4xl font-black text-athlix-red leading-none">{attendanceSummary?.percentage ?? 0}%</p>
                                            <p className="text-xs text-neutral-500 mt-1">
                                                {attendanceSummary?.present ?? 0} / {attendanceSummary?.total_athletes ?? 0} atlet hadir
                                            </p>
                                        </div>
                                        <div className="flex-1 h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-athlix-red rounded-full transition-all duration-500"
                                                style={{ width: `${attendanceSummary?.percentage ?? 0}%` }}
                                            />
                                        </div>
                                    </div>

                                    {recentAttendances.length > 0 && (
                                        <div className="mt-4 space-y-2 border-t border-neutral-100 dark:border-neutral-800 pt-3">
                                            <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Kehadiran Terbaru</p>
                                            {recentAttendances.slice(0, 4).map((item, idx) => (
                                                <button
                                                    key={`${item.athlete_name}-${idx}`}
                                                    type="button"
                                                    onClick={() => setAttendanceModal(item)}
                                                    className="w-full flex items-center justify-between text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900/50 rounded-lg px-2 py-1 transition-colors group"
                                                >
                                                    <div className="text-left">
                                                        <p className="font-semibold text-xs">{item.athlete_name}</p>
                                                        <p className="text-[11px] text-neutral-500">{item.time}</p>
                                                    </div>
                                                    <span className="inline-flex items-center gap-1 text-[11px] uppercase font-bold text-emerald-600">
                                                        <CheckCircle2 size={12} /> {item.status}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* RIGHT: Quick Info */}
                        <div className="space-y-4">
                            <Card className="bg-white dark:bg-neutral-900/80 border-neutral-200/80 dark:border-neutral-800">
                                <CardContent className="p-5 space-y-4">
                                    <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Informasi Cepat</p>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900">
                                            <div className="p-2 rounded-xl bg-athlix-red/10">
                                                <Clock size={16} className="text-athlix-red" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] text-neutral-500">Sesi Latihan Hari Ini</p>
                                                <p className="font-black text-sm">{stats.find(s => s.icon === 'dumbbell')?.value ?? 0} sesi</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900">
                                            <div className="p-2 rounded-xl bg-emerald-500/10">
                                                <CheckCircle2 size={16} className="text-emerald-500" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] text-neutral-500">Kehadiran Hari Ini</p>
                                                <p className="font-black text-sm">{attendanceSummary?.present ?? 0} dari {attendanceSummary?.total_athletes ?? 0} atlet</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900">
                                            <div className="p-2 rounded-xl bg-amber-500/10">
                                                <Activity size={16} className="text-amber-500" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] text-neutral-500">Atlet Pantauan (BMI {'>'} 25)</p>
                                                <p className="font-black text-sm">{stats.find(s => s.icon === 'activity')?.value ?? 0} atlet</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900">
                                            <div className="p-2 rounded-xl bg-blue-500/10">
                                                <CreditCard size={16} className="text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] text-neutral-500">Tunggakan SPP</p>
                                                <p className="font-black text-sm">{stats.find(s => s.icon === 'credit-card')?.value ?? 0} atlet</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            {/* === MODALS === */}

            {/* Schedule Detail Modal */}
            <Modal show={!!scheduleModal} onClose={() => setScheduleModal(null)} maxWidth="lg">
                {scheduleModal && (
                    <div className="p-6 space-y-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider text-white ${typeColors[scheduleModal.type] || 'bg-blue-500'}`}>
                                    {scheduleModal.type}
                                </span>
                                <h3 className="text-xl font-black tracking-tight mt-2">{scheduleModal.title}</h3>
                            </div>
                            <button onClick={() => setScheduleModal(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors shrink-0">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 p-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Hari</p>
                                <p className="font-bold text-sm">{scheduleModal.day}</p>
                            </div>
                            <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 p-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Tanggal</p>
                                <p className="font-bold text-sm">{scheduleModal.next_date}</p>
                            </div>
                            <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 p-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Jam</p>
                                <p className="font-mono font-bold text-athlix-red text-sm">{scheduleModal.time}</p>
                            </div>
                            <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 p-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Pelatih</p>
                                <p className="font-bold text-sm">{scheduleModal.coach || '-'}</p>
                            </div>
                        </div>

                        {scheduleModal.desc && (
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">{scheduleModal.desc}</p>
                        )}

                        {(scheduleModal.agenda_items || []).length > 0 ? (
                            <div className="space-y-2">
                                <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Detail Agenda</p>
                                {scheduleModal.agenda_items.map((item, idx) => (
                                    <div key={idx} className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3 bg-neutral-50/70 dark:bg-neutral-900/40">
                                        <p className="font-mono font-bold text-athlix-red text-xs">{item.start_time} - {item.end_time}</p>
                                        <p className="font-semibold text-sm mt-0.5">{item.title}</p>
                                        {item.description && <p className="text-xs text-neutral-500 mt-1">{item.description}</p>}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-neutral-400 italic">Belum ada detail agenda.</p>
                        )}

                        <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                            <Button variant="outline" onClick={() => setScheduleModal(null)}>Tutup</Button>
                            <Link href={route('training-programs.index')}>
                                <Button className="bg-athlix-red hover:bg-red-700 text-white">Lihat Semua Jadwal</Button>
                            </Link>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Attendance Detail Modal */}
            <Modal show={!!attendanceModal} onClose={() => setAttendanceModal(null)} maxWidth="sm">
                {attendanceModal && (
                    <div className="p-6 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                            <h3 className="text-lg font-black tracking-tight">Detail Kehadiran</h3>
                            <button onClick={() => setAttendanceModal(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors shrink-0">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900">
                                <div className="w-10 h-10 rounded-xl bg-athlix-red/10 flex items-center justify-center">
                                    <User size={18} className="text-athlix-red" />
                                </div>
                                <div>
                                    <p className="font-bold">{attendanceModal.athlete_name}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 p-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Status</p>
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                                        <CheckCircle2 size={12} /> {attendanceModal.status}
                                    </span>
                                </div>
                                <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 p-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Waktu</p>
                                    <p className="font-bold text-sm">{attendanceModal.time}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2 border-t border-neutral-100">
                            <Link href={route('attendance.index')}>
                                <Button className="bg-athlix-red hover:bg-red-700 text-white text-xs">
                                    Buka Halaman Absensi <ChevronRight size={13} className="ml-1" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </Modal>
        </AdminLayout>
    );
}
