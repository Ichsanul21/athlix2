import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Search, ChevronRight, FileText, ArrowLeft, Trophy, Activity, Radar, PieChart as PieChartIcon, Trash2, Pencil, Plus, X, Loader2, AlertTriangle, FilePlus2, Users } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar as RadarArea } from 'recharts';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import DbSelect from '@/Components/DbSelect';
import Modal from '@/Components/Modal';

const COLORS = ['#DC2626', '#404040'];

const resolveAbilityStatus = (scores) => {
    const average = scores.length ? Math.round(scores.reduce((a, b) => a + Number(b || 0), 0) / scores.length) : 0;
    if (average >= 85) return 'Sangat Baik';
    if (average >= 70) return 'Baik';
    if (average >= 55) return 'Cukup';
    return average > 0 ? 'Perlu Pembinaan' : 'Belum Dinilai';
};

export default function Index({ auth, athletes = [], dojos = [], selectedDojoId, selectedId, selectedAthlete, performance, reportHistory = [], reportCategories = [], filters }) {
    const [search, setSearch] = useState(filters?.search || '');
    const [dojoId, setDojoId] = useState(selectedDojoId || '');
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportEditModalOpen, setReportEditModalOpen] = useState(false);
    const [reportError, setReportError] = useState('');
    const [portalRoot, setPortalRoot] = useState(null);

    const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', variant: 'danger' });
    const [alertModal, setAlertModal] = useState({ open: false, title: '', message: '' });

    const confirmResolveRef = useRef(null);
    const alertResolveRef = useRef(null);

    useEffect(() => {
        const el = document.createElement('div');
        el.id = 'universal-modal-portal';
        document.body.appendChild(el);
        setPortalRoot(el);
        return () => { if (document.body.contains(el)) document.body.removeChild(el); };
    }, []);

    const showConfirm = useCallback((title, message, variant = 'danger') => {
        return new Promise((resolve) => {
            confirmResolveRef.current = resolve;
            setConfirmModal({ open: true, title, message, variant });
        });
    }, []);

    const showAlert = useCallback((title, message) => {
        return new Promise((resolve) => {
            alertResolveRef.current = resolve;
            setAlertModal({ open: true, title, message });
        });
    }, []);

    const handleConfirmYes = () => {
        setConfirmModal((p) => ({ ...p, open: false }));
        confirmResolveRef.current?.(true);
        confirmResolveRef.current = null;
    };
    const handleConfirmNo = () => {
        setConfirmModal((p) => ({ ...p, open: false }));
        confirmResolveRef.current?.(false);
        confirmResolveRef.current = null;
    };
    const handleAlertOk = () => {
        setAlertModal((p) => ({ ...p, open: false }));
        alertResolveRef.current?.(true);
        alertResolveRef.current = null;
    };

    const isSensei = auth?.user?.role === 'sensei' || auth?.user?.role === 'head_coach' || auth?.user?.role === 'assistant' || auth?.user?.role === 'super_admin' || auth?.user?.role === 'dojo_admin';

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

    useEffect(() => {
        if (reportHistory.length > 0 && !selectedReportId) {
            setSelectedReportId(String(reportHistory[0].id));
        }
    }, [reportHistory]);

    const activeReport = useMemo(() => {
        return reportHistory.find(r => String(r.id) === String(selectedReportId)) || reportHistory[0] || null;
    }, [reportHistory, selectedReportId]);

    function safeParseDynScores(raw) {
        if (!raw) return {};
        if (typeof raw === 'object') return raw;
        if (typeof raw === 'string') {
            try { return JSON.parse(raw) || {}; } catch { return {}; }
        }
        return {};
    }

    const snapshot = useMemo(() => safeParseDynScores(activeReport?.dynamic_scores), [activeReport]);

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
    const abilityStatus = resolveAbilityStatus(categorySeries.map((item) => item.score));

    const calcTestScore = (test, rawValue) => {
        const raw = Number(rawValue) || 0;
        const min = Number(test.min_threshold);
        const max = Number(test.max_threshold);
        if (min === max) return raw >= max ? 100 : 0;
        if (max > min) {
            if (raw <= min) return 0;
            if (raw >= max) return 100;
            return Math.round(((raw - min) / (max - min)) * 100);
        } else {
            if (raw >= min) return 0;
            if (raw <= max) return 100;
            return Math.round(((min - raw) / (min - max)) * 100);
        }
    };

    const buildTestValues = () => {
        const vals = {};
        const snap = safeParseDynScores(activeReport?.dynamic_scores);
        reportCategories.forEach((cat) => {
            (cat?.sub_categories || []).forEach((sub) => {
                (sub?.tests || []).forEach((test) => {
                    vals[String(test?.id)] = snap?.tests?.[test?.id]?.raw_value ?? 0;
                });
            });
        });
        return vals;
    };

    const reportForm = useForm({
        condition_percentage: activeReport?.condition_percentage ?? 0,
        name: '',
        test_values: buildTestValues(),
        notes: '',
        recorded_at: new Date().toISOString().slice(0, 10),
        latest_height: selectedAthlete?.latest_height || '',
        latest_weight: selectedAthlete?.latest_weight || '',
    });

    const reportEditForm = useForm({
        id: '',
        name: '',
        condition_percentage: 0,
        test_values: {},
        notes: '',
        recorded_at: '',
        latest_height: '',
        latest_weight: '',
    });

    const openEditReport = (report) => {
        const snap = safeParseDynScores(report?.dynamic_scores);
        const vals = {};
        reportCategories.forEach((cat) => {
            (cat.sub_categories || []).forEach((sub) => {
                (sub.tests || []).forEach((test) => {
                    vals[String(test.id)] = snap?.tests?.[test.id]?.raw_value ?? 0;
                });
            });
        });

        reportEditForm.setData({
            id: report?.id,
            name: report?.name || '',
            condition_percentage: report?.condition_percentage,
            test_values: vals,
            notes: report?.notes || '',
            recorded_at: report?.recorded_at,
            latest_height: snap?.anthropometry?.height ?? selectedAthlete?.latest_height ?? '',
            latest_weight: snap?.anthropometry?.weight ?? selectedAthlete?.latest_weight ?? '',
        });
        setReportEditModalOpen(true);
    };

    const resetReportForm = () => {
        setReportError('');
        reportForm.clearErrors();
        reportForm.setData({
            condition_percentage: activeReport?.condition_percentage ?? 0,
            name: '',
            test_values: buildTestValues(),
            notes: '',
            recorded_at: new Date().toISOString().slice(0, 10),
            latest_height: selectedAthlete?.latest_height || '',
            latest_weight: selectedAthlete?.latest_weight || '',
        });
    };

    const submitReport = (event) => {
        event.preventDefault();
        setReportError('');
        if (!selectedAthlete?.id) return;
        const formattedTestValues = {};
        Object.entries(reportForm.data.test_values).forEach(([key, value]) => {
            formattedTestValues[String(key)] = Number(value) || 0;
        });
        reportForm.setData('test_values', formattedTestValues);
        reportForm.post(route('athletes.reports.store', selectedAthlete.id), {
            preserveScroll: true,
            onSuccess: (page) => {
                setReportModalOpen(false);
                setReportError('');
                const newReports = page.props.reportHistory || [];
                if (newReports.length > 0) {
                    setSelectedReportId(String(newReports[0]?.id || ''));
                }
            },
            onError: (errors) => {
                const errorMessages = Object.values(errors).join(', ');
                setReportError(errorMessages || 'Terjadi kesalahan validasi.');
            },
        });
    };

    const submitUpdateReport = (e) => {
        e.preventDefault();
        if (!selectedAthlete?.id) return;
        reportEditForm.post(route('athletes.reports.update', { athlete: selectedAthlete.id, report: reportEditForm.data.id }), {
            preserveScroll: true,
            onSuccess: () => {
                setReportEditModalOpen(false);
            }
        });
    };

    const handleDeleteReport = async () => {
        if (!selectedReportId || !selectedAthlete?.id) return;
        const confirmed = await showConfirm('Hapus Rapor', 'Yakin ingin menghapus data rapor ini?');
        if (confirmed) {
            router.delete(route('athletes.reports.destroy', { athlete: selectedAthlete.id, report: selectedReportId }), {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedReportId('');
                }
            });
        }
    };

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
                                                     {/* Active indicator dot */}
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
                                         })
                                     ) : (
                                         <div className="p-8 text-center text-neutral-400 text-sm italic py-12">
                                             <Users size={32} className="mx-auto mb-2 opacity-20" />
                                             <p>Belum ada atlet terdaftar di club ini.</p>
                                         </div>
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
                                            <Link href={route('athletes.show', selectedAthlete.id)} className="text-xs font-bold uppercase tracking-widest text-athlix-black dark:text-neutral-100 hover:text-athlix-red transition-colors flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                                                <Activity size={14} /> Lihat Profil Lengkap
                                            </Link>
                                        </CardContent>
                                    </Card>

                                    {/* Rapor Selector */}
                                    <Card className="border-neutral-200/80 dark:border-neutral-800 shadow-sm ring-1 ring-athlix-red/5">
                                        <CardHeader className="py-4 border-b border-neutral-100 dark:border-neutral-800">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                <div className="space-y-1">
                                                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500 flex items-center gap-2">
                                                        <FileText size={16} className="text-athlix-red" /> Riwayat Rapor
                                                    </CardTitle>
                                                    {activeReport?.name && (
                                                        <h4 className="text-sm font-black text-athlix-black dark:text-neutral-100 uppercase tracking-tight">{activeReport.name}</h4>
                                                    )}
                                                </div>
                                                {isSensei && (
                                                    <Button type="button" size="sm" className="w-full sm:w-auto gap-2" onClick={() => { resetReportForm(); setReportModalOpen(true); }}>
                                                        <FilePlus2 size={14} /> Tambah Rapor
                                                    </Button>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-4 space-y-3">
                                            {reportHistory.length > 0 ? (
                                                <>
                                                    <div className="flex gap-2">
                                                        <div className="flex-1">
                                                            <DbSelect
                                                                inputId="report-select"
                                                                value={selectedReportId}
                                                                options={reportHistory.map(r => ({ value: String(r.id), label: `${r.name ? r.name + ' | ' : ''}${r.recorded_label} | Kondisi ${r.condition_percentage}%` }))}
                                                                onChange={(val) => setSelectedReportId(val)}
                                                                placeholder="Pilih Tanggal Rapor..."
                                                            />
                                                        </div>
                                                        {isSensei && selectedReportId && (
                                                            <div className="flex gap-2">
                                                                <Button type="button" variant="outline" size="sm" className="border-blue-200 text-blue-600 hover:bg-blue-50" onClick={() => openEditReport(activeReport)}>
                                                                    <Pencil size={14} />
                                                                </Button>
                                                                <Button type="button" variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50" onClick={handleDeleteReport}>
                                                                    <Trash2 size={14} />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
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
                                     {reportHistory.length > 0 ? (
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
                                                     <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-5">
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
                                                 <CardContent className="h-64 relative flex flex-col items-center justify-center">
                                                     <div className="absolute inset-0 z-0 opacity-10 flex items-center justify-center pointer-events-none pb-4">
                                                         <span className="text-7xl font-black text-athlix-red -mt-5">{averageScore}</span>
                                                     </div>
                                                     <ResponsiveContainer width="100%" height="100%" className="relative z-10">
                                                         <RadarChart data={categorySeries}>
                                                             <PolarGrid stroke="#88888833" />
                                                             <PolarAngleAxis dataKey="label" tick={{ fontSize: 10 }} />
                                                             <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                                                             <RadarArea dataKey="score" stroke="#DC2626" fill="#DC2626" fillOpacity={0.3} />
                                                             <Tooltip />
                                                         </RadarChart>
                                                     </ResponsiveContainer>
                                                     <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-2">
                                                         Rata-rata: {averageScore} | Status: {abilityStatus}
                                                     </p>
                                                 </CardContent>
                                             </Card>
                                         </div>
                                     ) : (
                                         <Card className="border-neutral-200/80 dark:border-neutral-800 border-dashed bg-neutral-50/30 dark:bg-neutral-900/10 mb-6 font-medium">
                                             <CardContent className="p-12 text-center text-neutral-400">
                                                 <Activity size={40} className="mx-auto mb-4 text-athlix-red/30 opacity-50" />
                                                 <p className="font-bold uppercase tracking-widest text-xs text-neutral-500">Analisis Grafik Belum Tersedia</p>
                                                 <p className="text-xs mt-1 italic">Grafik analisis kemampuan akan muncul setelah data rapor pertama diinput.</p>
                                             </CardContent>
                                         </Card>
                                     )}

                                    {/* Detail Ability Scores */}
                                    <Card className="border-neutral-200/80 dark:border-neutral-800">
                                        <CardHeader>
                                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500">Detail Kemampuan Atlet</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {reportCategories.map((cat) => {
                                                const catSnapshot = snapshot?.categories?.[cat.id];
                                                const catScore = Number(catSnapshot?.score ?? 0);
                                                const scoreColor = catScore >= 80 ? 'text-emerald-600' : catScore >= 50 ? 'text-amber-600' : 'text-athlix-red';
                                                const subs = cat.sub_categories || [];

                                                return (
                                                    <div key={cat.id} className="space-y-3 border-b border-neutral-100 dark:border-neutral-800 pb-4 last:border-0 last:pb-0">
                                                        <div className="flex items-center justify-between text-xs">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-black uppercase tracking-wider text-neutral-700 dark:text-neutral-200">{cat.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`font-black text-sm ${scoreColor}`}>{catScore}<span className="text-neutral-400 text-[10px] font-bold">/100</span></span>
                                                            </div>
                                                        </div>
                                                        <div className="h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                                                            <div className={`h-full rounded-full transition-all duration-500 ${catScore >= 80 ? 'bg-emerald-500' : catScore >= 50 ? 'bg-amber-500' : 'bg-athlix-red'}`} style={{ width: `${Math.max(0, Math.min(100, catScore))}%` }} />
                                                        </div>

                                                        <div className="space-y-2 mt-2 ml-4 pl-4 border-l-2 border-neutral-100 dark:border-neutral-800">
                                                            {subs.map((sub) => {
                                                                const subSnapshot = snapshot?.sub_categories?.[sub.id];
                                                                const subScore = Number(subSnapshot?.score ?? 0);
                                                                const subColor = subScore >= 80 ? 'text-emerald-600' : subScore >= 50 ? 'text-amber-600' : 'text-red-500';
                                                                const subBg = subScore >= 80 ? 'bg-emerald-500' : subScore >= 50 ? 'bg-amber-500' : 'bg-red-500';

                                                                return (
                                                                    <div key={sub.id} className="p-2 sm:p-2.5 rounded-xl bg-neutral-50/50 dark:bg-neutral-900/30 space-y-1.5 border border-neutral-100 dark:border-neutral-800/50">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-[10px] font-black uppercase tracking-tight text-neutral-500 truncate mr-2">{sub.name}</span>
                                                                            <span className={`text-[11px] font-black ${subColor}`}>{subScore}</span>
                                                                        </div>
                                                                        <div className="h-1 rounded-full bg-neutral-200/50 dark:bg-neutral-800/50 overflow-hidden">
                                                                            <div className={`h-full rounded-full transition-all duration-700 ${subBg}`} style={{ width: `${Math.max(0, Math.min(100, subScore))}%` }} />
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {reportCategories.length === 0 && (
                                                <div className="text-center py-12 px-6">
                                                    <div className="w-16 h-16 mx-auto rounded-3xl bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center text-neutral-300 mb-4">
                                                        <FileText size={32} />
                                                    </div>
                                                    <p className="text-neutral-500 font-bold">Belum ada data rapor tersedia untuk club ini.</p>
                                                    <p className="text-xs text-neutral-400 mt-1 italic">Silakan hubungi Sensei atau Admin Club untuk menyusun kategori test Rapor.</p>
                                                </div>
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

            {/* ── Edit Report Modal ── */}
            <Modal show={reportEditModalOpen} onClose={() => setReportEditModalOpen(false)} maxWidth="3xl">
                <form onSubmit={submitUpdateReport} className="p-4 sm:p-6 space-y-5 max-h-[85vh] overflow-y-auto">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-black uppercase tracking-tight">Edit Rapor Kemampuan Atlet</h3>
                            <p className="text-xs text-neutral-500 mt-1">Perbarui nilai mentah (raw) per test.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {reportCategories.map((cat) => {
                            const subs = cat.sub_categories || [];
                            const subScores = subs.map((sub) => {
                                const tests = sub.tests || [];
                                const tScores = tests.map((t) => calcTestScore(t, reportEditForm.data.test_values[String(t.id)] ?? 0));
                                return tScores.length ? Math.round(tScores.reduce((a, b) => a + b, 0) / tScores.length) : 0;
                            });
                            const catScore = subScores.length ? Math.round(subScores.reduce((a, b) => a + b, 0) / subScores.length) : 0;
                            const catColor = catScore >= 80 ? 'text-emerald-600' : catScore >= 50 ? 'text-amber-600' : 'text-red-600';
                            return (
                                <div key={cat.id} className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                                    <div className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-800/50 px-3 sm:px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
                                        <span className="text-sm font-black uppercase tracking-wider text-neutral-700 dark:text-neutral-200">{cat.name}</span>
                                        <span className={`text-lg font-black ${catColor}`}>{catScore}<span className="text-xs font-bold text-neutral-400">/100</span></span>
                                    </div>
                                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {subs.map((sub) => {
                                            const tests = sub.tests || [];
                                            const tScores = tests.map((t) => calcTestScore(t, reportEditForm.data.test_values[String(t.id)] ?? 0));
                                            const subScore = tScores.length ? Math.round(tScores.reduce((a, b) => a + b, 0) / tScores.length) : 0;
                                            const subColor = subScore >= 80 ? 'text-emerald-600' : subScore >= 50 ? 'text-amber-600' : 'text-red-500';
                                            return (
                                                <div key={sub.id} className="px-3 sm:px-4 py-3 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">↳ {sub.name}</span>
                                                        <span className={`text-sm font-bold ${subColor}`}>{subScore}<span className="text-[10px] text-neutral-400">/100</span></span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {tests.map((test) => {
                                                            const rawVal = reportEditForm.data.test_values[String(test.id)] ?? 0;
                                                            const previewScore = calcTestScore(test, rawVal);
                                                            const unitLabel = test.unit === 'duration' ? 'detik' : test.unit === 'distance' ? 'cm' : 'kali';
                                                            const isLowerBetter = Number(test.max_threshold) < Number(test.min_threshold);
                                                            const scoreColor = previewScore >= 80 ? 'text-emerald-600' : previewScore >= 50 ? 'text-amber-600' : 'text-red-500';
                                                            const unitBadge = test.unit === 'duration' ? 'DURASI' : test.unit === 'distance' ? 'JARAK' : 'REP';

                                                            return (
                                                                <div key={test.id} className="rounded-lg bg-neutral-50/50 dark:bg-neutral-900/30 p-2.5 space-y-1.5">
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                                                            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">{test.name}</span>
                                                                            <span className="text-[9px] font-bold uppercase bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.5 rounded text-neutral-500 shrink-0">{unitBadge}</span>
                                                                            {test.max_duration_seconds ? <span className="text-[9px] text-neutral-400">maks {test.max_duration_seconds}s</span> : null}
                                                                        </div>
                                                                        <span className={`text-sm font-black ${scoreColor} shrink-0`}>{previewScore}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <input
                                                                            type="number"
                                                                            step="0.1"
                                                                            min="0"
                                                                            className="flex-1 rounded-md border border-neutral-200 dark:border-neutral-700 px-2.5 py-1.5 text-sm bg-white dark:bg-neutral-900 min-w-0"
                                                                            value={rawVal}
                                                                            onChange={(e) => {
                                                                                const curr = { ...reportEditForm.data.test_values };
                                                                                curr[String(test.id)] = parseFloat(e.target.value) || 0;
                                                                                reportEditForm.setData('test_values', curr);
                                                                            }}
                                                                        />
                                                                        <span className="text-[10px] text-neutral-400 shrink-0 w-8">{unitLabel}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex-1 h-1 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                                                                            <div className={`h-full rounded-full transition-all duration-300 ${previewScore >= 80 ? 'bg-emerald-500' : previewScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${previewScore}%` }} />
                                                                        </div>
                                                                        <span className="text-[9px] text-neutral-400 shrink-0">{test.min_threshold}→{test.max_threshold}</span>
                                                                        {isLowerBetter && <span className="text-[8px] bg-blue-50 text-blue-600 px-1 py-0.5 rounded font-bold shrink-0">↓</span>}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="text-xs font-bold uppercase text-neutral-500 space-y-1">
                            Nama Rapor
                            <input type="text" className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm bg-white dark:bg-neutral-900" value={reportEditForm.data.name} onChange={(e) => reportEditForm.setData('name', e.target.value)} placeholder="" />
                        </label>
                        <label className="text-xs font-bold uppercase text-neutral-500 space-y-1">
                            Tanggal Penilaian
                            <input type="date" className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm bg-white dark:bg-neutral-900" value={reportEditForm.data.recorded_at} onChange={(e) => reportEditForm.setData('recorded_at', e.target.value)} required />
                        </label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="text-xs font-bold uppercase text-neutral-500 space-y-1">
                            Tinggi (cm)
                            <input type="number" step="0.1" className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm bg-white dark:bg-neutral-900" value={reportEditForm.data.latest_height} onChange={(e) => reportEditForm.setData('latest_height', e.target.value)} />
                        </label>
                        <label className="text-xs font-bold uppercase text-neutral-500 space-y-1">
                            Berat (kg)
                            <input type="number" step="0.1" className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm bg-white dark:bg-neutral-900" value={reportEditForm.data.latest_weight} onChange={(e) => reportEditForm.setData('latest_weight', e.target.value)} />
                        </label>
                    </div>
                    <div className="space-y-1">
                        <textarea className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm min-h-20 bg-white dark:bg-neutral-900" value={reportEditForm.data.notes} onChange={(e) => reportEditForm.setData('notes', e.target.value)} placeholder="Catatan rapor..." />
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                        <Button type="button" variant="outline" onClick={() => setReportEditModalOpen(false)} className="w-full sm:w-auto">Batal</Button>
                        <Button type="submit" disabled={reportEditForm.processing} className="w-full sm:w-auto">
                            {reportEditForm.processing && <Loader2 size={14} className="animate-spin mr-2" />} Simpan Perubahan
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* ── Report Modal ── */}
            <Modal show={reportModalOpen} onClose={() => setReportModalOpen(false)} maxWidth="3xl">
                <form onSubmit={submitReport} className="p-4 sm:p-6 space-y-5 max-h-[85vh] overflow-y-auto">
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-tight">Input Rapor Kemampuan Atlet</h3>
                        <p className="text-xs text-neutral-500 mt-1">Masukkan nilai mentah (raw) per test. Skor 1-100 dihitung otomatis.</p>
                    </div>
                    {reportError && (
                        <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50 p-4 space-y-2">
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                <AlertTriangle size={16} className="shrink-0" />
                                <span className="text-sm font-bold">Gagal Menyimpan Rapor</span>
                            </div>
                            <p className="text-xs text-red-600/80 dark:text-red-400/80">{reportError}</p>
                        </div>
                    )}
                    <div className="space-y-4">
                        {reportCategories.map((cat) => {
                            const subs = cat.sub_categories || [];
                            const subScores = subs.map((sub) => {
                                const tests = sub.tests || [];
                                const tScores = tests.map((t) => calcTestScore(t, reportForm.data.test_values[String(t.id)] ?? 0));
                                return tScores.length ? Math.round(tScores.reduce((a, b) => a + b, 0) / tScores.length) : 0;
                            });
                            const catScore = subScores.length ? Math.round(subScores.reduce((a, b) => a + b, 0) / subScores.length) : 0;
                            const catColor = catScore >= 80 ? 'text-emerald-600' : catScore >= 50 ? 'text-amber-600' : 'text-red-600';
                            return (
                                <div key={cat.id} className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                                    <div className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-800/50 px-3 sm:px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
                                        <span className="text-sm font-black uppercase tracking-wider text-neutral-700 dark:text-neutral-200">{cat.name}</span>
                                        <span className={`text-lg font-black ${catColor}`}>{catScore}<span className="text-xs font-bold text-neutral-400">/100</span></span>
                                    </div>
                                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {subs.map((sub) => {
                                            const tests = sub.tests || [];
                                            const tScores = tests.map((t) => calcTestScore(t, reportForm.data.test_values[String(t.id)] ?? 0));
                                            const subScore = tScores.length ? Math.round(tScores.reduce((a, b) => a + b, 0) / tScores.length) : 0;
                                            const subColor = subScore >= 80 ? 'text-emerald-600' : subScore >= 50 ? 'text-amber-600' : 'text-red-500';
                                            return (
                                                <div key={sub.id} className="px-3 sm:px-4 py-3 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">↳ {sub.name}</span>
                                                        <span className={`text-sm font-bold ${subColor}`}>{subScore}<span className="text-[10px] text-neutral-400">/100</span></span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {tests.map((test) => {
                                                            const rawVal = reportForm.data.test_values[String(test.id)] ?? 0;
                                                            const previewScore = calcTestScore(test, rawVal);
                                                            const unitLabel = test.unit === 'duration' ? 'detik' : test.unit === 'distance' ? 'cm' : 'kali';
                                                            const isLowerBetter = Number(test.max_threshold) < Number(test.min_threshold);
                                                            const scoreColor = previewScore >= 80 ? 'text-emerald-600' : previewScore >= 50 ? 'text-amber-600' : 'text-red-500';
                                                            const unitBadge = test.unit === 'duration' ? 'DURASI' : test.unit === 'distance' ? 'JARAK' : 'REP';

                                                            return (
                                                                <div key={test.id} className="rounded-lg bg-neutral-50/50 dark:bg-neutral-900/30 p-2.5 space-y-1.5">
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                                                            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">{test.name}</span>
                                                                            <span className="text-[9px] font-bold uppercase bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.5 rounded text-neutral-500 shrink-0">{unitBadge}</span>
                                                                            {test.max_duration_seconds ? <span className="text-[9px] text-neutral-400">maks {test.max_duration_seconds}s</span> : null}
                                                                        </div>
                                                                        <span className={`text-sm font-black ${scoreColor} shrink-0`}>{previewScore}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <input type="number" step="0.1" min="0" className="flex-1 rounded-md border border-neutral-200 dark:border-neutral-700 px-2.5 py-1.5 text-sm bg-white dark:bg-neutral-900 min-w-0" value={rawVal} onChange={(e) => { const curr = { ...reportForm.data.test_values }; curr[String(test.id)] = parseFloat(e.target.value) || 0; reportForm.setData('test_values', curr); }} placeholder={`Masukkan ${unitLabel}`} />
                                                                        <span className="text-[10px] text-neutral-400 shrink-0 w-8">{unitLabel}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex-1 h-1 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                                                                            <div className={`h-full rounded-full transition-all duration-300 ${previewScore >= 80 ? 'bg-emerald-500' : previewScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${previewScore}%` }} />
                                                                        </div>
                                                                        <span className="text-[9px] text-neutral-400 shrink-0">{test.min_threshold}→{test.max_threshold}</span>
                                                                        {isLowerBetter && <span className="text-[8px] bg-blue-50 text-blue-600 px-1 py-0.5 rounded font-bold shrink-0">↓</span>}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="text-xs font-bold uppercase text-neutral-500 space-y-1">
                            Nama Rapor
                            <input type="text" className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm bg-white dark:bg-neutral-900" value={reportForm.data.name} onChange={(e) => reportForm.setData('name', e.target.value)} placeholder="" />
                        </label>
                        <label className="text-xs font-bold uppercase text-neutral-500 space-y-1">
                            Tanggal Penilaian
                            <input type="date" className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm bg-white dark:bg-neutral-900" value={reportForm.data.recorded_at} onChange={(e) => reportForm.setData('recorded_at', e.target.value)} required />
                        </label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="text-xs font-bold uppercase text-neutral-500 space-y-1">
                            Tinggi (cm)
                            <input type="number" step="0.1" className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm bg-white dark:bg-neutral-900" value={reportForm.data.latest_height} onChange={(e) => reportForm.setData('latest_height', e.target.value)} />
                        </label>
                        <label className="text-xs font-bold uppercase text-neutral-500 space-y-1">
                            Berat (kg)
                            <input type="number" step="0.1" className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm bg-white dark:bg-neutral-900" value={reportForm.data.latest_weight} onChange={(e) => reportForm.setData('latest_weight', e.target.value)} />
                        </label>
                    </div>
                    <div className="space-y-1">
                        <textarea className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm min-h-20 bg-white dark:bg-neutral-900" value={reportForm.data.notes} onChange={(e) => reportForm.setData('notes', e.target.value)} placeholder="Catatan rapor..." />
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                        <Button type="button" variant="outline" onClick={() => setReportModalOpen(false)} className="w-full sm:w-auto">Batal</Button>
                        <Button type="submit" disabled={reportForm.processing} className="w-full sm:w-auto">
                            {reportForm.processing && <Loader2 size={14} className="animate-spin mr-2" />} Simpan Rapor
                        </Button>
                    </div>
                </form>
            </Modal>

            {portalRoot && createPortal(
                <>
                    {confirmModal.open && (
                        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={handleConfirmNo} />
                            <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 w-full max-w-sm p-6 space-y-4 z-[99999]">
                                <div className="flex items-start gap-3">
                                    <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${confirmModal.variant === 'danger' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                                        <AlertTriangle size={20} className={confirmModal.variant === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'} />
                                    </div>
                                    <div className="space-y-1 min-w-0">
                                        <h3 className="text-base font-black text-neutral-900 dark:text-neutral-100 leading-tight">{confirmModal.title}</h3>
                                        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{confirmModal.message}</p>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-1">
                                    <Button type="button" variant="outline" className="font-semibold" onClick={handleConfirmNo}>Batal</Button>
                                    <Button type="button" className={`font-semibold ${confirmModal.variant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'}`} onClick={handleConfirmYes}>Ya, Lanjutkan</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {alertModal.open && (
                        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={handleAlertOk} />
                            <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 w-full max-w-sm p-6 space-y-4 z-[99999]">
                                <div className="flex items-start gap-3">
                                    <div className="shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                        <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div className="space-y-1 min-w-0">
                                        <h3 className="text-base font-black text-neutral-900 dark:text-neutral-100 leading-tight">{alertModal.title}</h3>
                                        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{alertModal.message}</p>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-1">
                                    <Button type="button" className="font-semibold" onClick={handleAlertOk}>Mengerti</Button>
                                </div>
                            </div>
                        </div>
                    )}
                </>,
                portalRoot
            )}
        </AdminLayout>
    );
}
