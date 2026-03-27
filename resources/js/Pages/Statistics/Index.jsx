import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Calendar, Award, ShieldAlert } from 'lucide-react';
import { Skeleton } from '@/Components/ui/skeleton';
import { useEffect, useState } from 'react';

const COLORS = ['#E61E32', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

export default function Index({
    auth,
    growthData,
    attendanceData,
    beltDistribution,
    trainingProgramAnalytics,
    conditionThreshold,
    dojos = [],
    selectedDojoId = null,
    flash,
}) {
    const [dojoId, setDojoId] = useState(selectedDojoId || '');
    const isLoading = growthData === undefined
        || attendanceData === undefined
        || beltDistribution === undefined
        || trainingProgramAnalytics === undefined
        || conditionThreshold === undefined;

    useEffect(() => {
        setDojoId(selectedDojoId || '');
    }, [selectedDojoId]);

    if (isLoading) {
        return (
            <AdminLayout
                user={auth?.user}
                header={<h2 className="text-xl font-bold tracking-tight uppercase">Statistik & Analitik Dojo</h2>}
            >
                <Head title="Statistik" />
                <div className="py-6 space-y-6">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
                        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                            <Skeleton className="h-72 w-full" />
                            <Skeleton className="h-72 w-full" />
                        </div>
                        <Skeleton className="h-72 w-full" />
                        <Skeleton className="h-40 w-full" />
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout
            user={auth?.user}
            header={<h2 className="text-xl font-bold tracking-tight uppercase">Statistik & Analitik Dojo</h2>}
        >
            <Head title="Statistik" />

            <div className="py-6 space-y-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
                    {flash?.success && <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">{flash.success}</div>}
                    {flash?.warning && <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm">{flash.warning}</div>}
                    {flash?.error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{flash.error}</div>}
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-500">Ringkasan Dojo</h3>
                        {dojos.length > 0 && (
                            <select
                                className="h-9 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-bold uppercase tracking-widest text-neutral-600"
                                value={dojoId || ''}
                                onChange={(e) => {
                                    const next = e.target.value;
                                    setDojoId(next);
                                    router.get(route('statistics.index'), next ? { dojo_id: next } : {}, { preserveScroll: true });
                                }}
                            >
                                {dojos.map((dojo) => (
                                    <option key={dojo.id} value={dojo.id}>{dojo.name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-neutral-200/80">
                            <CardContent className="p-4">
                                <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Threshold Target</p>
                                <p className="text-2xl font-black text-athlix-red mt-1">{conditionThreshold.target_threshold}%</p>
                                <p className="text-xs text-neutral-500 mt-1">Atlet di bawah nilai ini masuk monitoring.</p>
                            </CardContent>
                        </Card>
                        <Card className="border-neutral-200/80">
                            <CardContent className="p-4">
                                <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Rata-rata Kondisi</p>
                                <p className="text-2xl font-black mt-1">{conditionThreshold.avg_condition}%</p>
                                <p className="text-xs text-neutral-500 mt-1">Berbasis rapor kondisi terbaru per atlet.</p>
                            </CardContent>
                        </Card>
                        <Card className="border-neutral-200/80">
                            <CardContent className="p-4">
                                <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-1">
                                    <ShieldAlert size={12} className="text-red-500" />
                                    Atlet Perlu Atensi
                                </p>
                                <p className="text-2xl font-black mt-1">{conditionThreshold.below_target_count}</p>
                                <p className="text-xs text-neutral-500 mt-1">
                                    {conditionThreshold.critical_count} atlet berada di bawah batas kritis {conditionThreshold.critical_threshold}%.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                        <Card className="border-neutral-200/80 dark:border-neutral-800 animate-fade-in-up fill-both">
                            <CardHeader>
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                                    <TrendingUp size={16} className="text-athlix-red" />
                                    Pertumbuhan Atlet (Semester)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[250px] sm:h-[300px] min-h-[220px] min-w-0">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                                    <AreaChart data={growthData}>
                                        <defs>
                                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#E61E32" stopOpacity={0.15}/>
                                                <stop offset="95%" stopColor="#E61E32" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888815" />
                                        <XAxis dataKey="month" fontSize={10} axisLine={false} tickLine={false} />
                                        <YAxis fontSize={10} axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#171717', border: 'none', borderRadius: '12px', fontSize: '11px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
                                            itemStyle={{ color: '#E61E32' }}
                                        />
                                        <Area type="monotone" dataKey="total" stroke="#E61E32" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={2.5} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="border-neutral-200/80 dark:border-neutral-800 animate-fade-in-up fill-both" style={{ animationDelay: '100ms' }}>
                            <CardHeader>
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                                    <Award size={16} className="text-yellow-500" />
                                    Komposisi Sabuk
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[250px] sm:h-[300px] min-h-[220px] min-w-0">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                                    <PieChart>
                                        <Pie
                                            data={beltDistribution}
                                            innerRadius={55}
                                            outerRadius={75}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {beltDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#171717', border: 'none', borderRadius: '12px', fontSize: '11px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-xs uppercase font-bold text-neutral-500">
                                    {beltDistribution.map((entry, index) => (
                                        <div key={index} className="flex items-center gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                            {entry.name}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-neutral-200/80 dark:border-neutral-800 animate-fade-in-up fill-both" style={{ animationDelay: '200ms' }}>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                                <Calendar size={16} className="text-blue-500" />
                                Tren Kehadiran (30 Hari Terakhir)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[250px] sm:h-[300px] min-h-[220px] min-w-0">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                                <BarChart data={attendanceData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888815" />
                                    <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} />
                                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#171717', border: 'none', borderRadius: '12px', fontSize: '11px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
                                    />
                                    <Bar dataKey="present" fill="#10b981" radius={[6, 6, 0, 0]} />
                                    <Bar dataKey="absent" fill="#E61E32" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                        <Card className="border-neutral-200/80 animate-fade-in-up fill-both" style={{ animationDelay: '300ms' }}>
                            <CardHeader>
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                                    <Users size={16} className="text-athlix-red" />
                                    Analitik Program Latihan
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="rounded-xl border border-neutral-200 p-3">
                                        <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Total Program</p>
                                        <p className="text-xl font-black">{trainingProgramAnalytics.summary.total_programs}</p>
                                    </div>
                                    <div className="rounded-xl border border-neutral-200 p-3">
                                        <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Hari Aktif</p>
                                        <p className="text-xl font-black">{trainingProgramAnalytics.summary.active_days}</p>
                                    </div>
                                    <div className="rounded-xl border border-neutral-200 p-3">
                                        <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Rata/Hari</p>
                                        <p className="text-xl font-black">{trainingProgramAnalytics.summary.avg_per_day}</p>
                                    </div>
                                </div>
                                <div className="h-[240px] min-h-[220px] min-w-0">
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                                        <BarChart data={trainingProgramAnalytics.by_day}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888815" />
                                            <XAxis dataKey="day" fontSize={10} axisLine={false} tickLine={false} />
                                            <YAxis fontSize={10} axisLine={false} tickLine={false} />
                                            <Tooltip />
                                            <Bar dataKey="total" fill="#E61E32" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-neutral-200/80 animate-fade-in-up fill-both" style={{ animationDelay: '340ms' }}>
                            <CardHeader>
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500">
                                    Distribusi Tipe Program
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-xs text-neutral-500">Blok PPA dinonaktifkan. Statistik fokus penuh pada program latihan.</p>
                                <div className="space-y-2">
                                    {trainingProgramAnalytics.by_type.length > 0 ? (
                                        trainingProgramAnalytics.by_type.map((item, index) => (
                                            <div key={`${item.type}-${index}`} className="rounded-xl border border-neutral-200 p-3 flex items-center justify-between">
                                                <p className="text-sm font-bold capitalize">{item.type || '-'}</p>
                                                <p className="text-sm font-black">{item.total}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-neutral-400">Belum ada data tipe program.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}


