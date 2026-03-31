import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Skeleton } from '@/Components/ui/skeleton';
import Modal from '@/Components/Modal';
import DbSelect from '@/Components/DbSelect';
import { ArrowLeft, Trash2, FileText, FilePlus2, Trophy, Pencil, X, Loader2, User, Phone, Mail, FileCheck, Settings, Plus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useEffect, useMemo, useState } from 'react';

const COLORS = ['#DC2626', '#404040'];
// SCORE_FIELDS removed as it is now dynamic

const resolveAbilityStatus = (scores) => {
    const average = scores.length ? Math.round(scores.reduce((a, b) => a + Number(b || 0), 0) / scores.length) : 0;
    if (average >= 85) return 'Sangat Baik';
    if (average >= 70) return 'Baik';
    if (average >= 55) return 'Cukup';
    return average > 0 ? 'Perlu Pembinaan' : 'Belum Dinilai';
};

export default function Show({ auth, athlete, performance, achievementHistory = [], latestReport, reportHistory = [], belts = [], reportCategories = [] }) {
    const isLoading = !athlete || !performance;
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [achievementModalOpen, setAchievementModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [catFormProcessing, setCatFormProcessing] = useState(false);
    const [catForm, setCatForm] = useState({ name: '', unit: 'repetition', min_threshold: 0, max_threshold: 100 });

    const isSensei = auth?.user?.role === 'sensei' || auth?.user?.role === 'head_coach' || auth?.user?.role === 'assistant' || auth?.user?.role === 'super_admin' || auth?.user?.role === 'dojo_admin';

    const resetCatForm = () => setCatForm({ name: '', unit: 'repetition', min_threshold: 0, max_threshold: 100 });

    const openAddCategory = () => {
        setEditingCategory(null);
        resetCatForm();
        setCategoryModalOpen(true);
    };

    const openEditCategory = (cat) => {
        setEditingCategory(cat);
        setCatForm({ name: cat.name, unit: cat.unit, min_threshold: Number(cat.min_threshold), max_threshold: Number(cat.max_threshold) });
        setCategoryModalOpen(true);
    };

    const submitCategory = (e) => {
        e.preventDefault();
        setCatFormProcessing(true);
        if (editingCategory) {
            router.patch(route('report-categories.update', editingCategory.id), catForm, {
                preserveScroll: true,
                onSuccess: () => { setCategoryModalOpen(false); resetCatForm(); },
                onFinish: () => setCatFormProcessing(false),
            });
        } else {
            router.post(route('report-categories.store'), { ...catForm, dojo_id: athlete.dojo_id }, {
                preserveScroll: true,
                onSuccess: () => { setCategoryModalOpen(false); resetCatForm(); },
                onFinish: () => setCatFormProcessing(false),
            });
        }
    };

    const deleteCategory = (catId) => {
        if (!confirm('Hapus kategori test ini? Data skor lama yang terkait akan tetap tersimpan.')) return;
        router.delete(route('report-categories.destroy', catId), { preserveScroll: true });
    };
    const [selectedReportId, setSelectedReportId] = useState(reportHistory?.[0]?.id ?? latestReport?.id ?? '');

    const sortedReports = useMemo(
        () => [...reportHistory].sort((a, b) => new Date(b.recorded_at || 0).getTime() - new Date(a.recorded_at || 0).getTime()),
        [reportHistory]
    );
    const activeReport = useMemo(
        () => sortedReports.find((item) => String(item.id) === String(selectedReportId)) || sortedReports[0] || latestReport || null,
        [sortedReports, selectedReportId, latestReport]
    );
    const conditionScore = Number(activeReport?.condition_percentage ?? performance?.condition?.[0]?.value ?? 0);
    const conditionData = [
        { label: 'Kondisi Fisik', value: conditionScore },
        { label: 'Gap', value: Math.max(0, 100 - conditionScore) },
    ];
    const categorySeries = reportCategories.length
        ? reportCategories.map((cat) => {
              const dynScores = isNaN(activeReport?.dynamic_scores) && activeReport?.dynamic_scores !== null
                  ? (typeof activeReport.dynamic_scores === 'string'
                      ? JSON.parse(activeReport.dynamic_scores)
                      : activeReport.dynamic_scores)
                  : {};
              return {
                  label: cat.name,
                  score: Number(dynScores[cat.id]?.scaled_score ?? performance?.categories?.find((item) => item.label === cat.name)?.score ?? 0),
              };
          })
        : performance?.categories?.map((item) => ({ label: item.label, score: Number(item.score) })) || [];
    const averageScore = categorySeries.length ? Math.round(categorySeries.reduce((acc, item) => acc + item.score, 0) / categorySeries.length) : 0;
    const abilityStatus = resolveAbilityStatus(categorySeries.map((item) => item.score));
    const reportOptions = sortedReports.map((item) => ({
        value: String(item.id),
        label: `${item.recorded_label || item.recorded_at || '-'} | Kondisi ${item.condition_percentage}%`,
    }));

    useEffect(() => {
        if (!sortedReports.length) return;
        if (!sortedReports.some((item) => String(item.id) === String(selectedReportId))) {
            setSelectedReportId(sortedReports[0].id);
        }
    }, [sortedReports]);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('edit') === '1') {
            setEditModalOpen(true);
        }
    }, []);

    // Edit form — pre-populated from athlete + primary_guardian
    const primaryGuardian = athlete?.primary_guardian;
    const editForm = useForm({
        full_name: athlete?.full_name || '',
        current_belt_id: athlete?.current_belt_id || athlete?.belt?.id || '',
        dob: athlete?.dob || '',
        birth_place: athlete?.birth_place || '',
        phone_number: athlete?.phone_number || '',
        gender: athlete?.gender || 'M',
        specialization: athlete?.specialization || 'both',
        latest_height: athlete?.latest_height || '',
        latest_weight: athlete?.latest_weight || '',
        class_note: athlete?.class_note || '',
        photo: null,
        doc_kk: null,
        doc_akte: null,
        doc_ktp: null,
        parent_name: primaryGuardian?.name || '',
        parent_phone_number: primaryGuardian?.phone_number || '',
        parent_email: primaryGuardian?.email || '',
        parent_relation_type: primaryGuardian?.pivot?.relation_type || 'parent',
    });

    useEffect(() => {
        if (athlete && editModalOpen) {
            editForm.setData({
                full_name: athlete.full_name || '',
                current_belt_id: athlete.current_belt_id || athlete.belt?.id || '',
                dob: athlete.dob || '',
                birth_place: athlete.birth_place || '',
                phone_number: athlete.phone_number || '',
                gender: athlete.gender || 'M',
                specialization: athlete.specialization || 'both',
                latest_height: athlete.latest_height || '',
                latest_weight: athlete.latest_weight || '',
                class_note: athlete.class_note || '',
                photo: null,
                doc_kk: null,
                doc_akte: null,
                doc_ktp: null,
                parent_name: primaryGuardian?.name || '',
                parent_phone_number: primaryGuardian?.phone_number || '',
                parent_email: primaryGuardian?.email || '',
                parent_relation_type: primaryGuardian?.pivot?.relation_type || 'parent',
            });
        }
    }, [editModalOpen, athlete]);

    const submitEdit = (e) => {
        e.preventDefault();
        editForm.post(route('athletes.update', athlete.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => setEditModalOpen(false),
        });
    };

    const handleDelete = () => {
        router.delete(route('athletes.destroy', athlete.id), {
            onSuccess: () => setDeleteConfirmOpen(false),
        });
    };

    const achievementForm = useForm({
        competition_name: '',
        competition_level: '',
        competition_type: '',
        category: '',
        result_title: '',
        competition_date: '',
        location: '',
        organizer: '',
        notes: '',
        certificate: null,
    });
    const buildDynamicScores = () => {
        const dyn = {};
        reportCategories.forEach((cat) => {
            let activeVal = 0;
            if (activeReport?.dynamic_scores) {
                const activeData = typeof activeReport.dynamic_scores === 'string' ? JSON.parse(activeReport.dynamic_scores) : activeReport.dynamic_scores;
                activeVal = activeData[cat.id]?.raw_value ?? 0;
            }
            dyn[cat.id] = activeVal;
        });
        return dyn;
    };

    const reportForm = useForm({
        condition_percentage: activeReport?.condition_percentage ?? 0,
        dynamic_scores: buildDynamicScores(),
        notes: '',
        recorded_at: new Date().toISOString().slice(0, 10),
    });

    const resetReportForm = () => {
        reportForm.setData({
            condition_percentage: activeReport?.condition_percentage ?? 0,
            dynamic_scores: buildDynamicScores(),
            notes: '',
            recorded_at: new Date().toISOString().slice(0, 10),
        });
    };

    const submitReport = (event) => {
        event.preventDefault();
        reportForm.post(route('athletes.reports.store', athlete.id), {
            preserveScroll: true,
            onSuccess: () => setReportModalOpen(false),
        });
    };

    const submitAchievement = (event) => {
        event.preventDefault();
        achievementForm.post(route('athletes.achievements.store', athlete.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                achievementForm.reset();
                setAchievementModalOpen(false);
            },
        });
    };

    const deleteAchievement = (achievementId) => {
        router.delete(route('athletes.achievements.destroy', [athlete.id, achievementId]));
    };

    if (isLoading) {
        return (
            <AdminLayout user={auth?.user} header={<h2 className="text-xl font-bold tracking-tight uppercase">Monitoring Athlet</h2>}>
                <Head title="Rapor" />
                <div className="py-6">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
                        <Skeleton className="h-4 w-44" />
                        <Skeleton className="h-56 w-full" />
                        <Skeleton className="h-[420px] w-full" />
                    </div>
                </div>
            </AdminLayout>
        );
    }

    const documents = athlete.documents || {};

    return (
        <AdminLayout user={auth?.user} header={<h2 className="text-xl font-bold tracking-tight uppercase">Monitoring Athlet - {athlete.dojo?.name || 'Dojo'}</h2>}>
            <Head title={`Rapor - ${athlete.full_name}`} />
            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
                    <Link href={route('athletes.index')} className="inline-flex items-center text-sm font-bold text-neutral-500 hover:text-athlix-red transition-colors">
                        <ArrowLeft size={16} className="mr-1" /> KEMBALI KE DATABASE
                    </Link>

                    {/* Biodata Card with Edit/Delete actions */}
                    <Card className="border-neutral-200/80 dark:border-neutral-800">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    {athlete.photo_url ? (
                                        <img src={athlete.photo_url} alt={athlete.full_name} className="w-16 h-16 rounded-2xl object-cover border border-athlix-red/20 flex-shrink-0" />
                                    ) : (
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-athlix-red/20 to-athlix-red/5 border border-athlix-red/10 flex items-center justify-center text-2xl font-black text-athlix-red flex-shrink-0">
                                            {athlete.full_name?.charAt(0)}
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Biodata Athlet</p>
                                        <p className="font-black text-lg">{athlete.full_name} <span className="text-sm font-mono text-neutral-500">({athlete.athlete_code})</span></p>
                                        <p className="text-sm text-neutral-500">Dojo: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{athlete.dojo?.name || '-'}</span> | Kelas: <span className="font-semibold">{athlete.class_note || 'UMUM'}</span></p>
                                        <p className="text-sm text-neutral-500">Belt: <span className="font-semibold text-athlix-red">{athlete.belt?.name || '-'}</span> | Gender: {athlete.gender === 'M' ? 'Laki-laki' : 'Perempuan'}</p>
                                        {athlete.phone_number && (
                                            <p className="text-xs text-neutral-400 flex items-center gap-1"><Phone size={11} /> {athlete.phone_number}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5 font-bold"
                                        onClick={() => setEditModalOpen(true)}
                                    >
                                        <Pencil size={13} /> Edit Atlet
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5 font-bold text-red-600 border-red-200 hover:bg-red-50"
                                        onClick={() => setDeleteConfirmOpen(true)}
                                    >
                                        <Trash2 size={13} /> Hapus
                                    </Button>
                                </div>
                            </div>

                            {/* Documents section */}
                            {(documents.kk || documents.akte || documents.ktp) && (
                                <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2 flex items-center gap-1.5"><FileCheck size={12} /> Dokumen Registrasi</p>
                                    <div className="flex flex-wrap gap-2">
                                        {documents.kk && <a href={documents.kk} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-athlix-red/10 text-neutral-600 dark:text-neutral-300 hover:text-athlix-red font-semibold transition-colors"><FileText size={11} /> KK</a>}
                                        {documents.akte && <a href={documents.akte} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-athlix-red/10 text-neutral-600 dark:text-neutral-300 hover:text-athlix-red font-semibold transition-colors"><FileText size={11} /> Akte</a>}
                                        {documents.ktp && <a href={documents.ktp} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-athlix-red/10 text-neutral-600 dark:text-neutral-300 hover:text-athlix-red font-semibold transition-colors"><FileText size={11} /> KTP</a>}
                                    </div>
                                </div>
                            )}

                            {/* Primary guardian */}
                            {athlete.primary_guardian && (
                                <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2 flex items-center gap-1.5"><User size={12} /> Orang Tua / Wali</p>
                                    <div className="text-sm space-y-0.5">
                                        <p className="font-semibold">{athlete.primary_guardian.name} <span className="text-xs font-normal text-neutral-500">({athlete.primary_guardian.pivot?.relation_type || 'parent'})</span></p>
                                        {athlete.primary_guardian.phone_number && <p className="text-neutral-500 text-xs flex items-center gap-1"><Phone size={10} /> {athlete.primary_guardian.phone_number}</p>}
                                        {athlete.primary_guardian.email && <p className="text-neutral-500 text-xs flex items-center gap-1"><Mail size={10} /> {athlete.primary_guardian.email}</p>}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-neutral-200/80 dark:border-neutral-800">
                        <CardHeader className="border-b border-neutral-100 dark:border-neutral-800">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500">Riwayat Rapor Kemampuan Atlet</CardTitle>
                                <Button type="button" className="w-full sm:w-auto gap-2" onClick={() => { resetReportForm(); setReportModalOpen(true); }}>
                                    <FilePlus2 size={14} /> Tambah Rapor
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-4">
                            {reportOptions.length > 0 ? (
                                <>
                                    <DbSelect inputId="report-history-select" options={reportOptions} value={String(selectedReportId || '')} onChange={(next) => setSelectedReportId(next)} placeholder="Pilih data rapor" />
                                    <div className="rounded-xl border border-neutral-200 p-3 text-xs text-neutral-600">
                                        Catatan rapor: {activeReport?.notes || 'Belum ada catatan.'}
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-neutral-500">Belum ada data rapor. Tambahkan data pertama melalui tombol tambah rapor.</p>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="border-neutral-200/80 dark:border-neutral-800">
                            <CardHeader><CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500">Condition Atlet</CardTitle></CardHeader>
                            <CardContent className="h-72 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={conditionData} cx="50%" cy="50%" innerRadius={68} outerRadius={88} dataKey="value" stroke="none">
                                            {conditionData.map((entry, index) => <Cell key={`condition-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                    <div className="text-4xl font-black text-athlix-red">{conditionScore}%</div>
                                </div>
                                <div className="pointer-events-none absolute bottom-5 left-0 w-full flex justify-center">
                                    <div className="rounded-full bg-neutral-100 px-3 py-1 shadow-sm border border-neutral-200">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                                            IMT (BMI): <span className="text-athlix-red">{performance?.bmi || '-'}</span>
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-neutral-200/80 dark:border-neutral-800">
                            <CardHeader><CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500">Skor Kemampuan Atlet (Diagram Jaring)</CardTitle></CardHeader>
                            <CardContent className="h-72 relative flex flex-col items-center justify-center">
                                <div className="absolute inset-0 z-0 opacity-10 flex items-center justify-center pointer-events-none pb-4">
                                    <span className="text-7xl font-black text-athlix-red">{averageScore}</span>
                                </div>
                                <ResponsiveContainer width="100%" height="85%" className="relative z-10">
                                    <RadarChart data={categorySeries}>
                                        <PolarGrid stroke="#88888833" />
                                        <PolarAngleAxis dataKey="label" tick={{ fontSize: 10 }} />
                                        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                                        <Tooltip />
                                        <Radar dataKey="score" stroke="#DC2626" fill="#DC2626" fillOpacity={0.3} />
                                    </RadarChart>
                                </ResponsiveContainer>
                                <p className="text-xs text-center font-bold uppercase tracking-widest text-neutral-500 mt-2">
                                    Rata-rata skor: {averageScore} | Status: {abilityStatus}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-neutral-200/80 dark:border-neutral-800">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500">Detail Kemampuan Atlet</CardTitle>
                            {isSensei && (
                                <Button type="button" variant="outline" size="sm" className="gap-1.5 font-bold text-xs" onClick={openAddCategory}>
                                    <Settings size={13} /> Kelola Kategori Test
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {categorySeries.map((item) => {
                                const catMeta = reportCategories.find(c => c.name === item.label);
                                const dynScores = activeReport?.dynamic_scores
                                    ? (typeof activeReport.dynamic_scores === 'string' ? JSON.parse(activeReport.dynamic_scores) : activeReport.dynamic_scores)
                                    : {};
                                const rawEntry = catMeta ? dynScores[catMeta.id] : null;
                                const rawValue = rawEntry?.raw_value;
                                const unitLabel = catMeta?.unit === 'duration' ? 'detik' : 'kali';
                                const scoreColor = item.score >= 80 ? 'text-emerald-600' : item.score >= 50 ? 'text-amber-600' : 'text-athlix-red';

                                return (
                                    <div key={item.label} className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold uppercase tracking-wider text-neutral-500">{item.label}</span>
                                                {catMeta && (
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                                                        {catMeta.unit === 'duration' ? 'DURASI' : 'REPETISI'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {rawValue !== undefined && rawValue !== null && (
                                                    <span className="text-neutral-400 font-medium">{rawValue} {unitLabel}</span>
                                                )}
                                                <span className={`font-black text-sm ${scoreColor}`}>{item.score}<span className="text-neutral-400 text-[10px] font-bold">/100</span></span>
                                            </div>
                                        </div>
                                        <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-500 ${item.score >= 80 ? 'bg-emerald-500' : item.score >= 50 ? 'bg-amber-500' : 'bg-athlix-red'}`} style={{ width: `${Math.max(0, Math.min(100, item.score))}%` }} />
                                        </div>
                                        {catMeta && (
                                            <div className="flex items-center justify-between text-[10px] text-neutral-400">
                                                <span>Threshold: {catMeta.min_threshold} → {catMeta.max_threshold} {unitLabel}</span>
                                                {isSensei && (
                                                    <div className="flex items-center gap-1">
                                                        <button type="button" onClick={() => openEditCategory(catMeta)} className="p-0.5 hover:text-athlix-red transition-colors"><Pencil size={10} /></button>
                                                        <button type="button" onClick={() => deleteCategory(catMeta.id)} className="p-0.5 hover:text-red-600 transition-colors"><Trash2 size={10} /></button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {categorySeries.length === 0 && (
                                <div className="text-center py-8 space-y-3">
                                    <p className="text-sm text-neutral-400">Belum ada kategori test. Sensei perlu mengkonfigurasi label test terlebih dahulu.</p>
                                    {isSensei && (
                                        <Button type="button" variant="outline" className="gap-1.5" onClick={openAddCategory}>
                                            <Plus size={14} /> Tambah Kategori Test
                                        </Button>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="border-neutral-200/80 dark:border-neutral-800">
                            <CardHeader><CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500">Tambah Prestasi Atlet</CardTitle></CardHeader>
                            <CardContent>
                                <Button type="button" className="w-full gap-2" onClick={() => setAchievementModalOpen(true)}>
                                    <Trophy size={14} /> Tambah Prestasi (Popup)
                                </Button>
                            </CardContent>
                        </Card>
                        <Card className="border-neutral-200/80 dark:border-neutral-800 overflow-hidden">
                            <CardHeader className="border-b border-neutral-100 dark:border-neutral-800"><CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500">Riwayat Prestasi</CardTitle></CardHeader>
                            <CardContent className="p-0">
                                {achievementHistory.length > 0 ? achievementHistory.map((achievement) => (
                                    <div key={achievement.id} className="px-4 py-3 text-sm space-y-1 border-b border-neutral-100 dark:border-neutral-800">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="font-bold">{achievement.competition_name}</p>
                                                <p className="text-xs text-neutral-500">{achievement.competition_date} | {achievement.competition_level}</p>
                                            </div>
                                            <button type="button" className="p-1 rounded text-red-500 hover:bg-red-50" onClick={() => deleteAchievement(achievement.id)}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <p className="text-xs text-neutral-600">Hasil: {achievement.result_title || '-'} | Jenis: {achievement.competition_type}</p>
                                        {achievement.certificate_url && <a href={achievement.certificate_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-athlix-red hover:underline"><FileText size={12} /> Lihat Sertifikat</a>}
                                    </div>
                                )) : <div className="p-6 text-sm text-neutral-400 text-center">Belum ada data prestasi untuk atlet ini.</div>}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* ── Edit Athlete Modal ── */}
            <Modal show={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="2xl">
                <div className="flex items-center justify-between p-4 border-b border-neutral-100">
                    <h3 className="text-lg font-black uppercase tracking-tight">Edit Data Atlet</h3>
                    <button type="button" onClick={() => setEditModalOpen(false)} className="text-neutral-500 hover:text-neutral-700"><X size={20} /></button>
                </div>
                <div className="p-6 max-h-[80vh] overflow-y-auto">
                    <form onSubmit={submitEdit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-1">
                                <label className="text-sm font-medium">Nama Lengkap *</label>
                                <Input value={editForm.data.full_name} onChange={e => editForm.setData('full_name', e.target.value)} placeholder="Nama lengkap" required />
                                {editForm.errors.full_name && <p className="text-xs text-athlix-red">{editForm.errors.full_name}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">No HP Atlet *</label>
                                <Input value={editForm.data.phone_number} onChange={e => editForm.setData('phone_number', e.target.value)} placeholder="08xxxxxxxxxx" required />
                                {editForm.errors.phone_number && <p className="text-xs text-athlix-red">{editForm.errors.phone_number}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Belt *</label>
                                <DbSelect
                                    inputId="edit-belt"
                                    options={(belts || []).map(b => ({ value: String(b.id), label: b.name }))}
                                    value={editForm.data.current_belt_id ? String(editForm.data.current_belt_id) : ''}
                                    onChange={v => editForm.setData('current_belt_id', v)}
                                    placeholder="Pilih Belt"
                                />
                                {editForm.errors.current_belt_id && <p className="text-xs text-athlix-red">{editForm.errors.current_belt_id}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Tanggal Lahir *</label>
                                <Input type="date" value={editForm.data.dob} onChange={e => editForm.setData('dob', e.target.value)} required />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Tempat Lahir</label>
                                <Input value={editForm.data.birth_place} onChange={e => editForm.setData('birth_place', e.target.value)} placeholder="Samarinda" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Gender *</label>
                                <DbSelect inputId="edit-gender" value={editForm.data.gender} options={[{ value: 'M', label: 'Laki-laki' }, { value: 'F', label: 'Perempuan' }]} onChange={v => editForm.setData('gender', v)} />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Spesialisasi *</label>
                                <DbSelect inputId="edit-spec" value={editForm.data.specialization} options={[{ value: 'kata', label: 'Kata' }, { value: 'kumite', label: 'Kumite' }, { value: 'both', label: 'Kata & Kumite' }]} onChange={v => editForm.setData('specialization', v)} />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Tinggi (cm)</label>
                                <Input type="number" step="0.1" value={editForm.data.latest_height} onChange={e => editForm.setData('latest_height', e.target.value)} placeholder="170" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Berat (kg)</label>
                                <Input type="number" step="0.1" value={editForm.data.latest_weight} onChange={e => editForm.setData('latest_weight', e.target.value)} placeholder="65" />
                            </div>

                            <div className="col-span-2 space-y-1">
                                <label className="text-sm font-medium">Keterangan Kelas</label>
                                <Input value={editForm.data.class_note} onChange={e => editForm.setData('class_note', e.target.value)} placeholder="Umum / Senior -67kg" />
                            </div>

                            <div className="col-span-2 space-y-1">
                                <label className="text-sm font-medium">Ganti Foto (Opsional)</label>
                                <Input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={e => editForm.setData('photo', e.target.files?.[0] || null)} />
                                {editForm.errors.photo && <p className="text-xs text-athlix-red">{editForm.errors.photo}</p>}
                            </div>
                        </div>

                        {/* Document replacements */}
                        <div className="rounded-xl border border-dashed border-neutral-300 p-4 space-y-3">
                            <p className="text-sm font-semibold">Perbarui Dokumen (opsional)</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[{ key: 'doc_kk', label: 'KK' }, { key: 'doc_akte', label: 'Akte' }, { key: 'doc_ktp', label: 'KTP' }].map(doc => (
                                    <div key={doc.key} className="space-y-1">
                                        <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">{doc.label}</label>
                                        <Input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => editForm.setData(doc.key, e.target.files?.[0] || null)} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Guardian update */}
                        <div className="rounded-xl border border-dashed border-neutral-300 p-4 space-y-3">
                            <p className="text-sm font-semibold">Data Orang Tua / Wali Utama</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Nama Orang Tua</label>
                                    <Input value={editForm.data.parent_name} onChange={e => editForm.setData('parent_name', e.target.value)} placeholder="Nama orang tua" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">No HP Orang Tua</label>
                                    <Input value={editForm.data.parent_phone_number} onChange={e => editForm.setData('parent_phone_number', e.target.value)} placeholder="08xxxxxxxxxx" />
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <label className="text-sm font-medium">Email Orang Tua</label>
                                    <Input type="email" value={editForm.data.parent_email} onChange={e => editForm.setData('parent_email', e.target.value)} placeholder="email@example.com" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={editForm.processing}>
                                {editForm.processing && <Loader2 size={14} className="animate-spin mr-2" />}
                                Simpan Perubahan
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* ── Delete Confirm Modal ── */}
            <Modal show={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="sm">
                <div className="p-6 space-y-4">
                    <h3 className="text-lg font-black uppercase tracking-tight text-red-600">Hapus Data Atlet</h3>
                    <p className="text-sm text-neutral-600">Yakin ingin menghapus data <strong>{athlete.full_name}</strong>? Semua data terkait (absensi, rapor, prestasi, akun user) juga akan ikut terhapus.</p>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Batal</Button>
                        <Button type="button" className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>
                            <Trash2 size={14} className="mr-1.5" /> Hapus Permanen
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* ── Report Modal — Input Raw Value + Threshold preview ── */}
            <Modal show={reportModalOpen} onClose={() => setReportModalOpen(false)} maxWidth="2xl">
                <form onSubmit={submitReport} className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-tight">Input Rapor Kemampuan Atlet</h3>
                        <p className="text-xs text-neutral-500 mt-1">Masukkan nilai mentah (raw). Skor 1-100 akan dihitung otomatis berdasarkan threshold yang dikonfigurasi.</p>
                    </div>

                    <div className="space-y-3">
                        {reportCategories.map((field) => {
                            const rawVal = reportForm.data.dynamic_scores[field.id] !== undefined ? reportForm.data.dynamic_scores[field.id] : 0;
                            const unitLabel = field.unit === 'duration' ? 'detik' : 'kali';
                            const isLowerBetter = field.max_threshold < field.min_threshold;

                            // Calculate preview score locally
                            let previewScore = 0;
                            const minT = Number(field.min_threshold);
                            const maxT = Number(field.max_threshold);
                            const rv = Number(rawVal);
                            if (minT === maxT) {
                                previewScore = rv >= maxT ? 100 : 0;
                            } else if (maxT > minT) {
                                if (rv <= minT) previewScore = 0;
                                else if (rv >= maxT) previewScore = 100;
                                else previewScore = Math.round(((rv - minT) / (maxT - minT)) * 100);
                            } else {
                                if (rv >= minT) previewScore = 0;
                                else if (rv <= maxT) previewScore = 100;
                                else previewScore = Math.round(((minT - rv) / (minT - maxT)) * 100);
                            }
                            previewScore = Math.max(0, Math.min(100, previewScore));

                            const scoreColor = previewScore >= 80 ? 'text-emerald-600' : previewScore >= 50 ? 'text-amber-600' : 'text-red-600';

                            return (
                                <div key={field.id} className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-sm font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-200">{field.name}</span>
                                            <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">{field.unit === 'duration' ? 'DURASI' : 'REPETISI'}</span>
                                        </div>
                                        <span className={`text-lg font-black ${scoreColor}`}>{previewScore}<span className="text-xs font-bold text-neutral-400">/100</span></span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm"
                                            value={rawVal}
                                            onChange={(e) => {
                                                const curr = { ...reportForm.data.dynamic_scores };
                                                curr[field.id] = parseFloat(e.target.value) || 0;
                                                reportForm.setData('dynamic_scores', curr);
                                            }}
                                            placeholder={`Masukkan ${unitLabel}`}
                                            required
                                        />
                                        <span className="text-xs font-bold text-neutral-500 shrink-0 w-12">{unitLabel}</span>
                                    </div>

                                    <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                                        <span>Threshold: {isLowerBetter ? `${minT} ${unitLabel} (0) → ${maxT} ${unitLabel} (100)` : `${minT} ${unitLabel} (0) → ${maxT} ${unitLabel} (100)`}</span>
                                        {isLowerBetter && <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold">Makin rendah makin bagus</span>}
                                    </div>

                                    {/* Score preview bar */}
                                    <div className="h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-300 ${previewScore >= 80 ? 'bg-emerald-500' : previewScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${previewScore}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="text-xs font-bold uppercase text-neutral-500 space-y-1">
                            Kondisi Fisik (%)
                            <input type="number" min="0" max="100" className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={reportForm.data.condition_percentage} onChange={(e) => reportForm.setData('condition_percentage', e.target.value)} required />
                        </label>
                        <label className="text-xs font-bold uppercase text-neutral-500 space-y-1">
                            Tanggal Penilaian
                            <input type="date" className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={reportForm.data.recorded_at} onChange={(e) => reportForm.setData('recorded_at', e.target.value)} required />
                        </label>
                    </div>

                    <textarea className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm min-h-20" value={reportForm.data.notes} onChange={(e) => reportForm.setData('notes', e.target.value)} placeholder="Catatan rapor dari sensei..." />

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setReportModalOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={reportForm.processing}>{reportForm.processing ? 'Menyimpan...' : 'Simpan Rapor'}</Button>
                    </div>
                </form>
            </Modal>

            {/* ── Achievement Modal ── */}
            <Modal show={achievementModalOpen} onClose={() => setAchievementModalOpen(false)} maxWidth="4xl">
                <form onSubmit={submitAchievement} className="p-6 space-y-3">
                    <h3 className="text-lg font-black uppercase tracking-tight">Tambah Prestasi Atlet</h3>
                    <input className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm" placeholder="Nama pertandingan" value={achievementForm.data.competition_name} onChange={(e) => achievementForm.setData('competition_name', e.target.value)} />
                    <div className="grid grid-cols-2 gap-3">
                        <input className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm" placeholder="Tingkat" value={achievementForm.data.competition_level} onChange={(e) => achievementForm.setData('competition_level', e.target.value)} />
                        <input className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm" placeholder="Jenis pertandingan" value={achievementForm.data.competition_type} onChange={(e) => achievementForm.setData('competition_type', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <input className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm" placeholder="Kategori" value={achievementForm.data.category} onChange={(e) => achievementForm.setData('category', e.target.value)} />
                        <input className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm" placeholder="Hasil" value={achievementForm.data.result_title} onChange={(e) => achievementForm.setData('result_title', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <input type="date" className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm" value={achievementForm.data.competition_date} onChange={(e) => achievementForm.setData('competition_date', e.target.value)} />
                        <input className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm" placeholder="Lokasi" value={achievementForm.data.location} onChange={(e) => achievementForm.setData('location', e.target.value)} />
                    </div>
                    <input className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm" placeholder="Penyelenggara" value={achievementForm.data.organizer} onChange={(e) => achievementForm.setData('organizer', e.target.value)} />
                    <textarea className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm min-h-20" placeholder="Catatan" value={achievementForm.data.notes} onChange={(e) => achievementForm.setData('notes', e.target.value)} />
                    <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => achievementForm.setData('certificate', e.target.files?.[0] ?? null)} className="w-full text-sm" />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setAchievementModalOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={achievementForm.processing}>{achievementForm.processing ? 'Menyimpan...' : 'Simpan Prestasi'}</Button>
                    </div>
                </form>
            </Modal>

            {/* ── Category Management Modal ── */}
            <Modal show={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} maxWidth="lg">
                <div className="p-6 space-y-5">
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-tight">
                            {editingCategory ? 'Edit Kategori Test' : 'Tambah Kategori Test Baru'}
                        </h3>
                        <p className="text-xs text-neutral-500 mt-1">
                            Konfigurasi label test, tipe pengukuran (durasi/repetisi), dan threshold batas bawah-atas untuk menghitung skor 1-100.
                        </p>
                    </div>

                    <form onSubmit={submitCategory} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Nama Label Test *</label>
                            <Input
                                value={catForm.name}
                                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                                placeholder="Contoh: Power, Strength, Speed..."
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Tipe Pengukuran *</label>
                            <DbSelect
                                inputId="cat-unit"
                                options={[
                                    { value: 'repetition', label: 'Repetisi (kali)' },
                                    { value: 'duration', label: 'Durasi (detik)' },
                                ]}
                                value={catForm.unit}
                                onChange={(val) => setCatForm({ ...catForm, unit: val })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                                    Threshold Bawah (Skor 0)
                                </label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={catForm.min_threshold}
                                    onChange={(e) => setCatForm({ ...catForm, min_threshold: parseFloat(e.target.value) || 0 })}
                                    required
                                />
                                <p className="text-[10px] text-neutral-400">Nilai mentah di bawah/sama dengan ini = skor 0</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                                    Threshold Atas (Skor 100)
                                </label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={catForm.max_threshold}
                                    onChange={(e) => setCatForm({ ...catForm, max_threshold: parseFloat(e.target.value) || 0 })}
                                    required
                                />
                                <p className="text-[10px] text-neutral-400">Nilai mentah di atas/sama dengan ini = skor 100</p>
                            </div>
                        </div>

                        {/* Explanation card */}
                        <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 p-3 space-y-2">
                            <p className="text-xs font-bold text-neutral-600 dark:text-neutral-300">Cara Kerja Skor:</p>
                            <div className="text-[11px] text-neutral-500 space-y-1">
                                {catForm.max_threshold > catForm.min_threshold ? (
                                    <>
                                        <p>• <strong>Makin tinggi makin bagus</strong> (cocok untuk repetisi)</p>
                                        <p>• Nilai ≤ {catForm.min_threshold} {catForm.unit === 'duration' ? 'detik' : 'kali'} = Skor <strong className="text-red-600">0</strong></p>
                                        <p>• Nilai ≥ {catForm.max_threshold} {catForm.unit === 'duration' ? 'detik' : 'kali'} = Skor <strong className="text-emerald-600">100</strong></p>
                                    </>
                                ) : catForm.max_threshold < catForm.min_threshold ? (
                                    <>
                                        <p>• <strong>Makin rendah makin bagus</strong> (cocok untuk durasi/speed)</p>
                                        <p>• Nilai ≥ {catForm.min_threshold} {catForm.unit === 'duration' ? 'detik' : 'kali'} = Skor <strong className="text-red-600">0</strong></p>
                                        <p>• Nilai ≤ {catForm.max_threshold} {catForm.unit === 'duration' ? 'detik' : 'kali'} = Skor <strong className="text-emerald-600">100</strong></p>
                                    </>
                                ) : (
                                    <p>• Threshold atas dan bawah sama — setiap nilai mentah ≥ batas = <strong>100</strong>, di bawah = <strong>0</strong>.</p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <Button type="button" variant="outline" onClick={() => setCategoryModalOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={catFormProcessing}>
                                {catFormProcessing ? <Loader2 size={14} className="animate-spin mr-1.5" /> : null}
                                {editingCategory ? 'Simpan Perubahan' : 'Tambah Kategori'}
                            </Button>
                        </div>
                    </form>

                    {/* Existing categories overview */}
                    {reportCategories.length > 0 && (
                        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4">
                            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Kategori Test Saat Ini ({reportCategories.length})</p>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                {reportCategories.map((cat) => (
                                    <div key={cat.id} className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-neutral-700 dark:text-neutral-200">{cat.name}</span>
                                            <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400 font-bold uppercase">{cat.unit === 'duration' ? 'DURASI' : 'REPETISI'}</span>
                                            <span className="text-neutral-400">{cat.min_threshold} → {cat.max_threshold}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button type="button" onClick={() => openEditCategory(cat)} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-athlix-red transition-colors">
                                                <Pencil size={12} />
                                            </button>
                                            <button type="button" onClick={() => deleteCategory(cat.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-600 transition-colors">
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </AdminLayout>
    );
}
