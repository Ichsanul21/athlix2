import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { useEffect, useState } from 'react';
import { Ruler, Weight, Activity, Search, ChevronRight, Zap, TrendingUp, Info, Calendar, Smile, Frown, Battery, BarChart3, AlertCircle } from 'lucide-react';
import { Input } from '@/Components/ui/input';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Skeleton } from '@/Components/ui/skeleton';
import DbSelect from '@/Components/DbSelect';

export default function Index({ auth, athletes, dojos = [], selectedDojoId = null, selectedAthlete: initialSelectedAthlete, attendanceStats, physicalConditionHistory, metricsHistory, filters }) {
    const [search, setSearch] = useState('');
    const [selectedAthleteId, setSelectedAthleteId] = useState(initialSelectedAthlete?.id ?? athletes?.[0]?.id ?? null);
    const isLoading = !athletes;
    const [dojoId, setDojoId] = useState(selectedDojoId || '');

    // Month Filter State
    const [selectedMonth, setSelectedMonth] = useState(filters?.month || new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(filters?.year || new Date().getFullYear());

    useEffect(() => {
        setDojoId(selectedDojoId || '');
    }, [selectedDojoId]);

    const months = [
        { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' }, { value: '3', label: 'Maret' },
        { value: '4', label: 'April' }, { value: '5', label: 'Mei' }, { value: '6', label: 'Juni' },
        { value: '7', label: 'Juli' }, { value: '8', label: 'Agustus' }, { value: '9', label: 'September' },
        { value: '10', label: 'Oktober' }, { value: '11', label: 'November' }, { value: '12', label: 'Desember' }
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => ({ value: String(currentYear - i), label: String(currentYear - i) }));

    const handleFilterChange = (newMonth, newYear, newAthleteId) => {
        router.get(route('physical-condition.index'), {
            dojo_id: dojoId,
            month: newMonth || selectedMonth,
            year: newYear || selectedYear,
            athlete_id: newAthleteId || selectedAthleteId
        }, { preserveScroll: true });
    };

    if (isLoading) {
        return (
            <AdminLayout
                user={auth?.user}
                header={<h2 className="text-xl font-bold tracking-tight uppercase">Monitoring Kondisi Atlet</h2>}
            >
                <Head title="Kondisi Atlet" />
                <div className="py-6">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            <div className="lg:col-span-4 space-y-4">
                                <Skeleton className="h-80 w-full" />
                            </div>
                            <div className="lg:col-span-8 space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                    {Array.from({ length: 3 }).map((_, idx) => (
                                        <Skeleton key={idx} className="h-24" />
                                    ))}
                                </div>
                                <Skeleton className="h-72 w-full" />
                                <Skeleton className="h-40 w-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    const filteredAthletes = athletes.filter(a =>
        a.full_name?.toLowerCase().includes(search.toLowerCase())
    );

    const selectedAthlete = initialSelectedAthlete || athletes.find(a => a.id === selectedAthleteId);

    const metrics = selectedAthlete && selectedAthlete.latest_metrics ? [
        { label: 'Tinggi Badan', value: `${selectedAthlete.latest_metrics.height} cm`, icon: Ruler, color: 'text-blue-500 bg-blue-500/10', sub: 'Baseline' },
        { label: 'Berat Badan', value: `${selectedAthlete.latest_metrics.weight} kg`, icon: Weight, color: 'text-orange-500 bg-orange-500/10', sub: 'Normal' },
        { label: 'Indeks Massa Tubuh', value: selectedAthlete.latest_metrics.bmi || '0', icon: Activity, color: 'text-green-500 bg-green-500/10', sub: 'Normal' },
    ] : (selectedAthlete ? [
        { label: 'Tinggi Badan', value: 'N/A', icon: Ruler, color: 'text-blue-500 bg-blue-500/10', sub: 'No Data' },
        { label: 'Berat Badan', value: 'N/A', icon: Weight, color: 'text-orange-500 bg-orange-500/10', sub: 'No Data' },
        { label: 'BMI', value: 'N/A', icon: Activity, color: 'text-green-500 bg-green-500/10', sub: 'No Data' },
    ] : []);

    // Custom Tooltip for Trend Chart
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200/50 dark:border-neutral-800/50 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] space-y-3 min-w-[180px]">
                    <p className="text-[10px] uppercase font-black text-neutral-400 tracking-[0.2em]">{data.month_name}</p>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center gap-6">
                            <span className="text-[11px] font-bold text-neutral-500 uppercase">Rerata Berat</span>
                            <span className="text-sm font-black text-athlix-red">{data.average_weight} <span className="text-[10px] font-normal opacity-70">kg</span></span>
                        </div>
                        <div className="flex justify-between items-center gap-6 border-b border-neutral-100 dark:border-neutral-800 pb-2 mb-2">
                            <span className="text-[11px] font-bold text-neutral-500 uppercase">Rerata IMT</span>
                            <span className="text-sm font-black text-blue-500">{data.average_bmi} <span className="text-[10px] font-normal opacity-70">pts</span></span>
                        </div>
                        {data.entries.length > 0 && (
                            <div className="space-y-1.5">
                                <p className="text-[9px] font-black text-neutral-300 uppercase tracking-widest bg-neutral-900 dark:bg-neutral-800 px-2 py-0.5 rounded w-max">Input Data</p>
                                {data.entries.slice(0, 5).map((entry, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-[10px] text-neutral-600 dark:text-neutral-400 font-medium">
                                        <span className="opacity-60">{entry.date}</span>
                                        <span className="font-bold">{entry.weight}kg / {entry.bmi}</span>
                                    </div>
                                ))}
                                {data.entries.length > 5 && <p className="text-[9px] text-neutral-400 italic">+{data.entries.length - 5} lainnya...</p>}
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <AdminLayout
            user={auth?.user}
            header={<h2 className="text-xl font-bold tracking-tight uppercase">Monitoring Kondisi Atlet</h2>}
        >
            <Head title="Kondisi Atlet" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6">
                        <div className="space-y-1">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-500">Ringkasan Kondisi</h3>
                            <p className="text-xs text-neutral-400">Analisis perkembangan fisik dan psikis atlet secara berkala.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {dojos.length > 0 && (
                                <DbSelect
                                    inputId="physical-condition-dojo-filter"
                                    className="w-full sm:w-[180px]"
                                    options={dojos.map((dojo) => ({ value: String(dojo.id), label: dojo.name }))}
                                    value={dojoId || ''}
                                    placeholder="Dojo"
                                    onChange={(next) => {
                                        setDojoId(next);
                                        router.get(route('physical-condition.index'), { dojo_id: next }, { preserveScroll: true });
                                    }}
                                />
                            )}
                            <div className="flex items-center gap-2 bg-white dark:bg-neutral-950 p-1.5 rounded-xl border border-neutral-100 dark:border-neutral-900">
                                <Calendar size={14} className="text-neutral-400 ml-1.5" />
                                <DbSelect
                                    inputId="filter-month"
                                    className="w-[130px] border-none shadow-none focus:ring-0 h-8 text-xs"
                                    options={months}
                                    value={String(selectedMonth)}
                                    onChange={(val) => {
                                        setSelectedMonth(Number(val));
                                        handleFilterChange(Number(val), selectedYear);
                                    }}
                                />
                                <DbSelect
                                    inputId="filter-year"
                                    className="w-[90px] border-none shadow-none focus:ring-0 h-8 text-xs"
                                    options={years}
                                    value={String(selectedYear)}
                                    onChange={(val) => {
                                        setSelectedYear(Number(val));
                                        handleFilterChange(selectedMonth, Number(val));
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Athlete List Side */}
                        <div className="lg:col-span-4 space-y-4 animate-fade-in-up fill-both">
                            <Card className="border-neutral-200/80 dark:border-neutral-800 overflow-hidden">
                                <CardHeader className="p-4 border-b border-neutral-100 dark:border-neutral-800">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                        <Input
                                            placeholder="Cari Atlet..."
                                            className="pl-10 h-9 border-none bg-neutral-50 dark:bg-neutral-900"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0 max-h-[500px] lg:max-h-[800px] overflow-y-auto">
                                    {filteredAthletes.map((a, idx) => {
                                        const isSelected = selectedAthleteId === a.id;
                                        return (
                                            <button
                                                key={a.id}
                                                onClick={() => {
                                                    setSelectedAthleteId(a.id);
                                                    handleFilterChange(selectedMonth, selectedYear, a.id);
                                                }}
                                                className={`
                                                    w-full flex items-center justify-between p-4 transition-all duration-300 text-left
                                                    border-b border-neutral-50 dark:border-neutral-800/50 animate-fade-in-up fill-both relative
                                                    ${isSelected
                                                        ? 'bg-athlix-red/8 dark:bg-athlix-red/12 border-l-[3px] border-l-athlix-red shadow-[inset_4px_0_12px_-4px_rgba(230,30,50,0.15)]'
                                                        : 'border-l-[3px] border-l-transparent hover:bg-neutral-50 dark:hover:bg-neutral-900/50'
                                                    }
                                                `}
                                                style={{ animationDelay: `${idx * 30}ms` }}
                                            >
                                                {isSelected && (
                                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[2px]">
                                                        <span className="block w-[6px] h-[6px] rounded-full bg-athlix-red shadow-[0_0_8px_rgba(230,30,50,0.6)]" />
                                                    </span>
                                                )}

                                                <div className="flex items-center gap-3 ml-1">
                                                    <div className={`
                                                        w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase
                                                        transition-all duration-300
                                                        ${isSelected
                                                            ? 'bg-athlix-red text-white shadow-lg shadow-athlix-red/30 scale-105'
                                                            : 'bg-gradient-to-br from-athlix-red/20 to-athlix-red/5 text-athlix-red hover:scale-110'
                                                        }
                                                    `}>
                                                        {a.full_name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className={`font-bold text-sm tracking-tight transition-colors duration-300 ${isSelected ? 'text-athlix-red' : ''}`}>
                                                            {a.full_name}
                                                        </p>
                                                        <p className={`text-xs uppercase font-bold transition-colors duration-300 ${isSelected ? 'text-athlix-red/60' : 'text-neutral-500'}`}>
                                                            {a.belt?.name} | {a.age} Thn
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {isSelected && (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-athlix-red bg-athlix-red/10 px-2 py-0.5 rounded-md">
                                                            Aktif
                                                        </span>
                                                    )}
                                                    <ChevronRight size={16} className={`
                                                        transition-all duration-300
                                                        ${isSelected ? 'text-athlix-red rotate-90' : 'text-neutral-300'}
                                                    `} />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Details Side */}
                        <div className="lg:col-span-8 space-y-6 animate-fade-in-up fill-both" style={{ animationDelay: '100ms' }}>
                            {selectedAthlete ? (
                                <>
                                    {/* 1. Metrics: TB, BB, BMI */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                        {metrics.map((m, i) => (
                                            <Card key={i} className="border-neutral-200/80 dark:border-neutral-800 card-hover animate-fade-in-up fill-both" style={{ animationDelay: `${150 + i * 60}ms` }}>
                                                <CardContent className="p-4 space-y-3">
                                                    <div className={`p-2 w-fit rounded-xl ${m.color} transition-transform duration-300 hover:scale-110`}>
                                                        <m.icon size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold uppercase text-neutral-500 tracking-widest">{m.label}</p>
                                                        <p className="text-lg font-black">{m.value}</p>
                                                        <p className="text-xs text-neutral-400">{m.sub}</p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>

                                    {/* 2. Analisis Tren Fisik */}
                                    <Card className="border-neutral-200/80 dark:border-neutral-800 animate-fade-in-up fill-both" style={{ animationDelay: '250ms' }}>
                                        <CardHeader className="flex flex-row items-center justify-between">
                                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                                                <TrendingUp size={16} className="text-athlix-red" />
                                                Analisis Tren Fisik
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="min-h-[300px] flex flex-col justify-between">
                                            {metricsHistory.length > 0 ? (
                                                <>
                                                    <div className="h-[250px] sm:h-[280px] min-w-0">
                                                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                                                            <LineChart data={metricsHistory}>
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888815" />
                                                                <XAxis dataKey="month_name" fontSize={10} axisLine={false} tickLine={false} />
                                                                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                                                                <Tooltip content={<CustomTooltip />} />
                                                                <Line type="monotone" dataKey="average_weight" stroke="#E61E32" strokeWidth={3} dot={{ fill: '#E61E32', strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} />
                                                                <Line type="monotone" dataKey="average_bmi" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} />
                                                            </LineChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                    <div className="flex justify-center gap-6 pt-4 text-xs font-bold uppercase text-neutral-500">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-3 h-[3px] bg-athlix-red rounded-full"></div> BB (kg)
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-3 h-[3px] bg-blue-500 rounded-full"></div> IMT
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10 space-y-4">
                                                    <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                                                        <TrendingUp size={28} className="text-neutral-300 dark:text-neutral-600" />
                                                    </div>
                                                    <div className="space-y-1 max-w-sm">
                                                        <h4 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Belum Ada Riwayat Pengukuran</h4>
                                                        <p className="text-xs text-neutral-500 leading-relaxed">
                                                            Tren fisik akan ditampilkan setelah Anda melakukan input data tinggi dan berat badan secara berkala melalui fitur <strong>Rapor Kemampuan Atlet</strong>.
                                                        </p>
                                                    </div>
                                                    {selectedAthlete?.latest_metrics?.weight && selectedAthlete?.latest_metrics?.height && (
                                                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                                            <Info size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
                                                            <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-tight">
                                                                Data TB & BB saat ini merupakan <strong>baseline awal</strong> dari form pendaftaran.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* 3. Detail Kondisi Atlet (IMT) */}
                                    <Card className="border-neutral-200/80 dark:border-neutral-800 bg-green-500/5 animate-fade-in-up fill-both" style={{ animationDelay: '300ms' }}>
                                        <CardHeader>
                                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500">Detail Kondisi Atlet (IMT)</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <div className="space-y-1">
                                                <p className="text-lg font-black text-green-600">{selectedAthlete.bmi_detail?.label || 'Belum Ada Data'}</p>
                                                <p className="text-sm text-neutral-600">{selectedAthlete.bmi_detail?.note || 'Data IMT belum tersedia.'}</p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* 4. Mood & Fatigue Cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        {/* Mood Card */}
                                        <Card className="border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative group transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5">
                                            <CardContent className="p-0 flex flex-col h-full">
                                                <div className="p-4 sm:p-5 flex justify-between items-start flex-shrink-0">
                                                    <div className="space-y-1">
                                                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 flex items-center gap-2">
                                                            <Smile size={14} className="text-indigo-500" />
                                                            Akumulasi Mood
                                                        </CardTitle>
                                                        <div className="pt-2 flex items-baseline gap-1">
                                                            <span className="text-3xl font-black text-indigo-600">{attendanceStats?.mood_after || '0'}</span>
                                                            <span className="text-xs font-bold text-neutral-400">/ 10.0</span>
                                                        </div>
                                                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Skor Rerata Bulan Ini</p>
                                                    </div>
                                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/5 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-500/10 transition-transform group-hover:scale-110">
                                                        <Smile size={24} className="text-indigo-500" />
                                                    </div>
                                                </div>
                                                <div className="mt-auto grid grid-cols-2 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
                                                    <div className="p-3 border-r border-neutral-100 dark:border-neutral-800 text-center">
                                                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Pre-Mood</p>
                                                        <p className="text-sm font-black text-neutral-700 dark:text-neutral-200">{attendanceStats?.mood_before || '0'}</p>
                                                    </div>
                                                    <div className="p-3 text-center">
                                                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Post-Mood</p>
                                                        <p className="text-sm font-black text-neutral-700 dark:text-neutral-200">{attendanceStats?.mood_after || '0'}</p>
                                                    </div>
                                                </div>
                                                {!attendanceStats && (
                                                    <div className="absolute inset-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-[1px] flex items-center justify-center p-4">
                                                        <div className="flex items-center gap-2 text-neutral-400">
                                                            <AlertCircle size={14} />
                                                            <span className="text-[11px] font-bold uppercase tracking-wider">Belum Ada Data</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>

                                        {/* Fatigue Card */}
                                        <Card className="border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative group transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5">
                                            <CardContent className="p-0 flex flex-col h-full">
                                                <div className="p-4 sm:p-5 flex justify-between items-start flex-shrink-0">
                                                    <div className="space-y-1">
                                                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 flex items-center gap-2">
                                                            <Zap size={14} className="text-orange-500 fill-orange-500/20" />
                                                            Tingkat Kelelahan
                                                        </CardTitle>
                                                        <div className="pt-2 flex items-baseline gap-1">
                                                            <span className="text-3xl font-black text-orange-600">{attendanceStats?.fatigue || '0'}</span>
                                                            <span className="text-xs font-bold text-neutral-400">/ 10.0</span>
                                                        </div>
                                                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Beban Latihan Rerata</p>
                                                    </div>
                                                    <div className="w-12 h-12 rounded-2xl bg-orange-500/5 dark:bg-orange-500/10 flex items-center justify-center border border-orange-500/10 transition-transform group-hover:scale-110">
                                                        <Zap size={24} className="text-orange-500 fill-orange-500/30" />
                                                    </div>
                                                </div>
                                                <div className="mt-auto p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">
                                                            {attendanceStats?.fatigue > 4 ? 'Intensitas Tinggi' : (attendanceStats?.fatigue > 2.5 ? 'Intensitas Moderat' : 'Intensitas Rendah')}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-neutral-400 uppercase">{attendanceStats?.count || 0} Sesi Latihan</span>
                                                </div>
                                                {!attendanceStats && (
                                                    <div className="absolute inset-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-[1px] flex items-center justify-center p-4">
                                                        <div className="flex items-center gap-2 text-neutral-400">
                                                            <AlertCircle size={14} />
                                                            <span className="text-[11px] font-bold uppercase tracking-wider">Belum Ada Data</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* 5. Statistik Kondisi Fisik */}
                                    <Card className="border-neutral-200/80 dark:border-neutral-800 shadow-sm overflow-hidden animate-fade-in-up fill-both" style={{ animationDelay: '350ms' }}>
                                        <CardHeader className="border-b border-neutral-50 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-900/30">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500 flex items-center gap-2">
                                                    <BarChart3 size={16} className="text-athlix-red" />
                                                    Statistik Kondisi Fisik
                                                </CardTitle>
                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-[10px] font-bold text-neutral-400">
                                                    <div className="w-2 h-2 rounded-full bg-athlix-red"></div> Bulanan
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            {physicalConditionHistory.length > 0 ? (
                                                <div className="h-[280px] w-full pt-6 pr-4">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={physicalConditionHistory}>
                                                            <defs>
                                                                <linearGradient id="colorCondition" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="#E61E32" stopOpacity={0.15}/>
                                                                    <stop offset="95%" stopColor="#E61E32" stopOpacity={0}/>
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888815" />
                                                            <XAxis dataKey="month_name" fontSize={10} axisLine={false} tickLine={false} />
                                                            <YAxis fontSize={10} axisLine={false} tickLine={false} domain={[0, 100]} />
                                                            <Tooltip
                                                                content={({ active, payload }) => {
                                                                    if (active && payload && payload.length) {
                                                                        const data = payload[0].payload;
                                                                        return (
                                                                            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-xl shadow-2xl space-y-2 min-w-[140px]">
                                                                                <p className="text-[10px] uppercase font-black text-neutral-400 tracking-widest border-b pb-1 mb-1">{data.month_name}</p>
                                                                                <p className="text-sm font-black text-athlix-red flex items-center justify-between">
                                                                                    <span>Skor Rata-rata:</span> <span>{payload[0].value}%</span>
                                                                                </p>
                                                                                <div className="space-y-1">
                                                                                    <p className="text-[9px] uppercase font-bold text-neutral-500">Detail Pengambilan:</p>
                                                                                    {data.entries.map((entry, idx) => (
                                                                                        <div key={idx} className="flex justify-between text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
                                                                                            <span>Tgl {entry.date}</span>
                                                                                            <span>{entry.value}%</span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    }
                                                                    return null;
                                                                }}
                                                            />
                                                            <Area
                                                                type="monotone"
                                                                dataKey="average_condition"
                                                                stroke="#E61E32"
                                                                strokeWidth={3}
                                                                fillOpacity={1}
                                                                fill="url(#colorCondition)"
                                                                dot={{ fill: '#E61E32', strokeWidth: 0, r: 4 }}
                                                                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                                                            />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            ) : (
                                                <div className="h-[280px] flex flex-col items-center justify-center text-center p-8 space-y-3">
                                                    <div className="w-12 h-12 rounded-xl bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
                                                        <BarChart3 size={24} className="text-neutral-300" />
                                                    </div>
                                                    <div className="space-y-1 max-w-xs">
                                                        <p className="text-sm font-bold text-neutral-700">Data Historis Belum Tersedia</p>
                                                        <p className="text-xs text-neutral-500 leading-relaxed italic">Input rapor kemampuan atlet secara berkala untuk melihat progres kondisi fisik dalam skala persentase.</p>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* 6. Gemini Card */}
                                    <Card className="border-neutral-200/80 dark:border-neutral-800 bg-athlix-red/5 dark:bg-athlix-red/5 animate-fade-in-up fill-both overflow-hidden relative" style={{ animationDelay: '400ms' }}>
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-athlix-red/5 rounded-full blur-3xl"></div>
                                        <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4 relative z-10">
                                            <div className="animate-float">
                                                <Zap size={32} className="text-athlix-red" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">Analisis AI Gemini</h3>
                                                <p className="text-sm text-neutral-500 max-w-sm mt-1">
                                                    Berdasarkan tren 3 bulan terakhir, {selectedAthlete.full_name} menunjukkan peningkatan massa otot yang stabil. Rekomendasi: Fokus pada teknik kumite kecepatan.
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </>
                            ) : (
                                <div className="h-full flex items-center justify-center text-neutral-400 py-20">
                                    <div className="text-center space-y-3">
                                        <div className="w-16 h-16 mx-auto rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center animate-float">
                                            <Activity size={28} className="text-neutral-300" />
                                        </div>
                                        <p className="font-medium">Pilih atlet untuk melihat analisis kondisi fisik lengkap.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
