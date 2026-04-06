import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Search, ChevronRight, FileText, ArrowLeft, Trophy, Activity, Radar, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar as RadarArea } from 'recharts';
import { useState, useMemo } from 'react';
import DbSelect from '@/Components/DbSelect';

const COLORS = ['#DC2626', '#404040'];

export default function Index({ auth, athletes = [], dojos = [], selectedDojoId, selectedId, selectedAthlete, performance, reportHistory = [], reportCategories = [], filters }) {
    const [search, setSearch] = useState(filters?.search || '');
    const [dojoId, setDojoId] = useState(selectedDojoId || '');

    const handleAthleteSelect = (id) => {
        router.get(route('reports.index'), { dojo_id: dojoId, athlete_id: id, search: search }, { preserveScroll: true });
    };

    const handleDojoChange = (val) => {
        setDojoId(val);
        router.get(route('reports.index'), { dojo_id: val, search: search }, { preserveScroll: true });
    };

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearch(val);
    };

    const handleSearchSubmit = (e) => {
        if (e.key === 'Enter') {
            router.get(route('reports.index'), { dojo_id: dojoId, search: search }, { preserveScroll: true });
        }
    };

    const [selectedReportId, setSelectedReportId] = useState(() => {
        if (reportHistory.length > 0) return String(reportHistory[0].id);
        return '';
    });

    const activeReport = useMemo(() => {
        return reportHistory.find(r => String(r.id) === String(selectedReportId)) || reportHistory[0] || null;
    }, [reportHistory, selectedReportId]);

    const snapshot = useMemo(() => {
        const raw = activeReport?.dynamic_scores;
        if (!raw) return {};
        if (typeof raw === 'object') return raw;
        try { return JSON.parse(raw) || {}; } catch { return {}; }
    }, [activeReport]);

    const categorySeries = useMemo(() => {
        if (!reportCategories.length) return performance?.categories?.map((item) => ({ label: item?.label, score: Number(item?.score) })) || [];
        return reportCategories.map((cat) => {
            const catSnapshot = snapshot?.categories?.[cat?.id];
            return {
                label: cat?.name,
                score: Number(catSnapshot?.score ?? 0),
            };
        });
    }, [reportCategories, snapshot, performance]);

    const conditionScore = useMemo(() => {
        if (activeReport) {
            if (categorySeries.length > 0 && categorySeries.some(c => c.score > 0)) {
                return Math.round(categorySeries.reduce((acc, item) => acc + item.score, 0) / categorySeries.length);
            }
            return Number(activeReport.condition_percentage || 0);
        }
        return performance?.condition?.[0]?.value ?? 0;
    }, [activeReport, categorySeries, performance]);

    const conditionData = [
        { label: 'Kondisi Fisik', value: conditionScore },
        { label: 'Gap', value: Math.max(0, 100 - conditionScore) },
    ];

    const averageScore = categorySeries.length ? Math.round(categorySeries.reduce((acc, item) => acc + item.score, 0) / categorySeries.length) : 0;

    return (
        <AdminLayout user={auth?.user} header={<h2 className="text-xl font-bold tracking-tight uppercase">Rapor Kemampuan Atlet</h2>}>
            <Head title="Rapor Atlet" />
            
            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* LEFT: Athlete List */}
                        <div className="lg:col-span-4 space-y-4">
                            {auth?.user?.role === 'super_admin' && (
                                <Card className="border-neutral-200/80 dark:border-neutral-800">
                                    <CardContent className="p-4">
                                        <DbSelect
                                            inputId="dojo-select"
                                            value={dojoId}
                                            options={dojos.map(d => ({ value: String(d.id), label: d.name }))}
                                            onChange={handleDojoChange}
                                            placeholder="Pilih Club/Dojo..."
                                        />
                                    </CardContent>
                                </Card>
                            )}

                            <Card className="border-neutral-200/80 dark:border-neutral-800 overflow-hidden">
                                <CardHeader className="p-4 border-b border-neutral-100 dark:border-neutral-800">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                        <Input
                                            placeholder="Cari Atlet..."
                                            className="pl-10 h-9 border-none bg-neutral-50 dark:bg-neutral-900"
                                            value={search}
                                            onChange={handleSearchChange}
                                            onKeyDown={handleSearchSubmit}
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0 max-h-[700px] overflow-y-auto">
                                    {athletes.length > 0 ? (
                                        athletes.map((a, idx) => {
                                            const isSelected = selectedId === a.id;
                                            return (
                                                <button
                                                    key={a.id}
                                                    onClick={() => handleAthleteSelect(a.id)}
                                                    className={`w-full flex items-center justify-between p-4 text-left border-b border-neutral-50 dark:border-neutral-800/50 transition-all ${
                                                        isSelected ? 'bg-athlix-red/10 border-l-[3px] border-l-athlix-red' : 'border-l-[3px] border-l-transparent hover:bg-neutral-50 dark:hover:bg-neutral-900'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase ${isSelected ? 'bg-athlix-red text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}>
                                                            {a.full_name?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className={`font-bold text-sm ${isSelected ? 'text-athlix-red' : ''}`}>{a.full_name}</p>
                                                            <p className="text-xs text-neutral-500 uppercase font-bold">{a.belt?.name} | {a.age} Thn</p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={16} className={isSelected ? 'text-athlix-red' : 'text-neutral-300'} />
                                                </button>
                                            )
                                        })
                                    ) : (
                                        <div className="p-8 text-center text-neutral-400 text-sm italic">Atlet tidak ditemukan.</div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* RIGHT: Rapor Data */}
                        <div className="lg:col-span-8 space-y-6">
                            {selectedAthlete ? (
                                <>
                                    {/* Header Info */}
                                    <Card className="border-neutral-200/80 dark:border-neutral-800 bg-gradient-to-br from-white to-neutral-50/50 dark:from-neutral-900 dark:to-neutral-950/50">
                                        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-athlix-red flex items-center justify-center text-white text-xl font-black shadow-lg shadow-athlix-red/20">
                                                    {selectedAthlete.full_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-xl tracking-tight">{selectedAthlete.full_name}</h3>
                                                    <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest">{selectedAthlete.belt?.name} | {selectedAthlete.athlete_code}</p>
                                                </div>
                                            </div>
                                            <Link href={route('athletes.show', selectedAthlete.id)} className="text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-athlix-red transition-colors flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                                                <Activity size={14} /> Lihat Profil Lengkap
                                            </Link>
                                        </CardContent>
                                    </Card>

                                    {/* Rapor Selector */}
                                    <Card className="border-neutral-200/80 dark:border-neutral-800 shadow-sm ring-1 ring-athlix-red/5">
                                        <CardHeader className="py-4 border-b border-neutral-100 dark:border-neutral-800">
                                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500 flex items-center gap-2">
                                                <FileText size={16} className="text-athlix-red" /> Riwayat Rapor
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-4 space-y-3">
                                            {reportHistory.length > 0 ? (
                                                <>
                                                    <DbSelect
                                                        inputId="report-select"
                                                        value={selectedReportId}
                                                        options={reportHistory.map(r => ({ value: String(r.id), label: `${r.recorded_label} | Kondisi ${r.condition_percentage}%` }))}
                                                        onChange={(val) => setSelectedReportId(val)}
                                                        placeholder="Pilih Tanggal Rapor..."
                                                    />
                                                    <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/50 dark:border-neutral-800/50 text-sm text-neutral-600 italic">
                                                        "{activeReport?.notes || 'Tidak ada catatan.'}"
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="py-6 text-center text-neutral-400 text-sm italic">Belum ada data rapor untuk atlet ini.</div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Charts Section */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Physical Condition Chart */}
                                        <Card className="border-neutral-200/80 dark:border-neutral-800">
                                            <CardHeader>
                                                <CardTitle className="text-xs font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                                                    <PieChartIcon size={14} className="text-athlix-red" /> Kondisi Fisik
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="h-64 relative">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie data={conditionData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" stroke="none">
                                                            {conditionData.map((entry, index) => <Cell key={`report-condition-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                                        </Pie>
                                                        <Tooltip />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                    <span className="text-3xl font-black text-athlix-red">{conditionScore}%</span>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Radar Ability Chart */}
                                        <Card className="border-neutral-200/80 dark:border-neutral-800">
                                            <CardHeader>
                                                <CardTitle className="text-xs font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                                                    <Radar size={14} className="text-athlix-red" /> Skor Kemampuan
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="h-64 relative flex flex-col items-center">
                                                <ResponsiveContainer width="100%" height="85%">
                                                    <RadarChart data={categorySeries}>
                                                        <PolarGrid stroke="#88888833" />
                                                        <PolarAngleAxis dataKey="label" tick={{ fontSize: 10 }} />
                                                        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                                                        <RadarArea dataKey="score" stroke="#DC2626" fill="#DC2626" fillOpacity={0.3} />
                                                        <Tooltip />
                                                    </RadarChart>
                                                </ResponsiveContainer>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-2">Rata-rata: {averageScore}</p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Detail Ability Scores */}
                                    <Card className="border-neutral-200/80 dark:border-neutral-800">
                                        <CardHeader>
                                            <CardTitle className="text-xs font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                                                <Trophy size={14} className="text-athlix-red" /> Detail Kemampuan
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            {reportCategories.map((cat) => {
                                                const catSnapshot = snapshot?.categories?.[cat.id];
                                                const catScore = Number(catSnapshot?.score ?? 0);
                                                const colorCls = catScore >= 80 ? 'bg-emerald-500' : catScore >= 50 ? 'bg-amber-500' : 'bg-athlix-red';
                                                
                                                return (
                                                    <div key={cat.id} className="space-y-3">
                                                        <div className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-900/80 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-sm group">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-2 h-8 rounded-full ${colorCls}`}></div>
                                                                <span className="font-black text-sm uppercase tracking-tight text-neutral-800 dark:text-neutral-200">{cat.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-2 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden hidden sm:block">
                                                                    <div className={`h-full ${colorCls} transition-all duration-1000`} style={{ width: `${catScore}%` }}></div>
                                                                </div>
                                                                <span className={`text-lg font-black ${catScore >= 80 ? 'text-emerald-600' : catScore >= 50 ? 'text-amber-600' : 'text-athlix-red'}`}>{catScore}</span>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-5">
                                                            {(cat.sub_categories || []).map(sub => {
                                                                const subSnap = snapshot?.sub_categories?.[sub.id];
                                                                const subScore = Number(subSnap?.score ?? 0);
                                                                return (
                                                                    <div key={sub.id} className="flex justify-between items-center text-xs p-2 rounded-lg border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-950/50">
                                                                        <span className="font-bold text-neutral-500 uppercase tracking-widest">{sub.name}</span>
                                                                        <span className="font-black text-neutral-700 dark:text-neutral-300">{subScore}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {reportCategories.length === 0 && (
                                                <div className="py-10 text-center text-neutral-400 italic">Kategori rapor belum tersedia.</div>
                                            )}
                                        </CardContent>
                                    </Card>

                                </>
                            ) : (
                                <div className="h-full min-h-[400px] flex items-center justify-center text-neutral-400 bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
                                    <div className="text-center space-y-4">
                                        <div className="w-16 h-16 mx-auto rounded-3xl bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center text-neutral-300">
                                            <Trophy size={32} />
                                        </div>
                                        <p className="font-bold">Silakan pilih atlet dari daftar sebelah kiri.</p>
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
