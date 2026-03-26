import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { useEffect, useState } from 'react';
import { Ruler, Weight, Activity, Search, ChevronRight, Zap, TrendingUp } from 'lucide-react';
import { Input } from '@/Components/ui/input';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/Components/ui/skeleton';

export default function Index({ auth, athletes, dojos = [], selectedDojoId = null }) {
    const [search, setSearch] = useState('');
    const initialAthleteId = athletes?.[0]?.id ?? null;
    const [selectedAthleteId, setSelectedAthleteId] = useState(initialAthleteId);
    const isLoading = !athletes;
    const [dojoId, setDojoId] = useState(selectedDojoId || '');

    useEffect(() => {
        setDojoId(selectedDojoId || '');
    }, [selectedDojoId]);

    useEffect(() => {
        if (athletes && athletes.length > 0) {
            setSelectedAthleteId(athletes[0].id);
        }
    }, [athletes]);

    if (isLoading) {
        return (
            <AdminLayout
                user={auth?.user}
                header={<h2 className="text-xl font-bold tracking-tight uppercase">Monitoring Kondisi Fisik</h2>}
            >
                <Head title="Kondisi Fisik" />
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
        a.full_name.toLowerCase().includes(search.toLowerCase())
    );

    const selectedAthlete = athletes.find(a => a.id === selectedAthleteId);

    const metrics = selectedAthlete && selectedAthlete.latest_metrics ? [
        { label: 'Tinggi Badan', value: `${selectedAthlete.latest_metrics.height} cm`, icon: Ruler, color: 'text-blue-500 bg-blue-500/10', sub: 'Baseline' },
        { label: 'Berat Badan', value: `${selectedAthlete.latest_metrics.weight} kg`, icon: Weight, color: 'text-orange-500 bg-orange-500/10', sub: 'Normal' },
        { label: 'Indeks Massa Tubuh', value: selectedAthlete.latest_metrics.bmi, icon: Activity, color: 'text-green-500 bg-green-500/10', sub: 'Normal' },
    ] : (selectedAthlete ? [
        { label: 'Tinggi Badan', value: 'N/A', icon: Ruler, color: 'text-blue-500 bg-blue-500/10', sub: 'No Data' },
        { label: 'Berat Badan', value: 'N/A', icon: Weight, color: 'text-orange-500 bg-orange-500/10', sub: 'No Data' },
        { label: 'BMI', value: 'N/A', icon: Activity, color: 'text-green-500 bg-green-500/10', sub: 'No Data' },
    ] : []);

    const chartData = selectedAthlete?.physical_metrics?.map(m => ({
        date: new Date(m.recorded_at).toLocaleDateString('id-ID', { month: 'short' }),
        weight: m.weight,
        bmi: m.bmi
    })) || [];

    return (
        <AdminLayout
            user={auth?.user}
            header={<h2 className="text-xl font-bold tracking-tight uppercase">Monitoring Kondisi Fisik</h2>}
        >
            <Head title="Kondisi Fisik" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-500">Ringkasan Kondisi</h3>
                        {dojos.length > 0 && (
                            <select
                                className="h-9 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-bold uppercase tracking-widest text-neutral-600"
                                value={dojoId || ''}
                                onChange={(e) => {
                                    const next = e.target.value;
                                    setDojoId(next);
                                    router.get(route('physical-condition.index'), next ? { dojo_id: next } : {}, { preserveScroll: true });
                                }}
                            >
                                {dojos.map((dojo) => (
                                    <option key={dojo.id} value={dojo.id}>{dojo.name}</option>
                                ))}
                            </select>
                        )}
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
                                <CardContent className="p-0 max-h-[500px] lg:max-h-[600px] overflow-y-auto">
                                    {filteredAthletes.map((a, idx) => (
                                        <button
                                            key={a.id}
                                            onClick={() => setSelectedAthleteId(a.id)}
                                            className={`w-full flex items-center justify-between p-4 transition-all duration-300 text-left border-b border-neutral-50 dark:border-neutral-800/50 animate-fade-in-up fill-both ${
                                                selectedAthleteId === a.id 
                                                ? 'bg-athlix-red/5 dark:bg-athlix-red/10' 
                                                : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/50'
                                            }`}
                                            style={{ animationDelay: `${idx * 30}ms` }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-athlix-red/20 to-athlix-red/5 text-athlix-red flex items-center justify-center font-bold text-xs uppercase transition-transform duration-300 hover:scale-110">
                                                    {a.full_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm tracking-tight">{a.full_name}</p>
                                                    <p className="text-xs text-neutral-500 uppercase font-bold">{a.belt?.name} | {a.age} Thn</p>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className={`transition-all duration-300 ${selectedAthleteId === a.id ? 'text-athlix-red translate-x-0.5' : 'text-neutral-300'}`} />
                                        </button>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Details Side */}
                        <div className="lg:col-span-8 space-y-6 animate-fade-in-up fill-both" style={{ animationDelay: '100ms' }}>
                            {selectedAthlete ? (
                                <>
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

                                    {/* Trend Chart */}
                                    <Card className="border-neutral-200/80 dark:border-neutral-800 animate-fade-in-up fill-both" style={{ animationDelay: '350ms' }}>
                                        <CardHeader className="flex flex-row items-center justify-between">
                                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                                                <TrendingUp size={16} className="text-athlix-red" />
                                                Analisis Tren Fisik
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="h-[250px] sm:h-[300px] min-h-[220px] min-w-0">
                                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                                                <LineChart data={chartData}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888815" />
                                                    <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} />
                                                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                                                    <Tooltip 
                                                        contentStyle={{ backgroundColor: '#171717', border: 'none', borderRadius: '12px', fontSize: '11px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
                                                    />
                                                    <Line type="monotone" dataKey="weight" stroke="#E61E32" strokeWidth={3} dot={{ fill: '#E61E32', strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} />
                                                    <Line type="monotone" dataKey="bmi" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                            <div className="flex justify-center gap-6 mt-4 text-xs font-bold uppercase text-neutral-500">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-[3px] bg-athlix-red rounded-full"></div> BB (kg)
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-[3px] bg-blue-500 rounded-full"></div> IMT
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-neutral-200/80 dark:border-neutral-800 bg-green-500/5 animate-fade-in-up fill-both" style={{ animationDelay: '380ms' }}>
                                        <CardHeader>
                                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500">Detail Kondisi Atlet (IMT)</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <div className="space-y-1">
                                                <p className="text-lg font-black text-green-600">{selectedAthlete.bmi_detail?.label || 'Belum Ada Data'}</p>
                                                <p className="text-sm text-neutral-600 ">{selectedAthlete.bmi_detail?.note || 'Data IMT belum tersedia.'}</p>
                                            </div>
                                        </CardContent>
                                    </Card>

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



