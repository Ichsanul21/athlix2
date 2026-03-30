import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Skeleton } from '@/Components/ui/skeleton';
import Modal from '@/Components/Modal';
import DbSelect from '@/Components/DbSelect';
import { ArrowLeft, Trash2, FileText, FilePlus2, Trophy } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useEffect, useMemo, useState } from 'react';

const COLORS = ['#DC2626', '#404040'];
const SCORE_FIELDS = [
    { key: 'stamina', label: 'Stamina' },
    { key: 'balance', label: 'Keseimbangan' },
    { key: 'speed', label: 'Kecepatan' },
    { key: 'strength', label: 'Kekuatan' },
    { key: 'agility', label: 'Kelincahan' },
];

const resolveAbilityStatus = (scores) => {
    const average = scores.length ? Math.round(scores.reduce((a, b) => a + Number(b || 0), 0) / scores.length) : 0;
    if (average >= 85) return 'Sangat Baik';
    if (average >= 70) return 'Baik';
    if (average >= 55) return 'Cukup';
    return average > 0 ? 'Perlu Pembinaan' : 'Belum Dinilai';
};

export default function Show({ auth, athlete, performance, achievementHistory = [], latestReport, reportHistory = [] }) {
    const isLoading = !athlete || !performance;
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [achievementModalOpen, setAchievementModalOpen] = useState(false);
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
    const categorySeries = SCORE_FIELDS.map(({ key, label }) => ({
        label,
        score: Number(activeReport?.[key] ?? performance?.categories?.find((item) => item.label === label)?.score ?? 0),
    }));
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
    const reportForm = useForm({
        condition_percentage: activeReport?.condition_percentage ?? 0,
        stamina: activeReport?.stamina ?? 0,
        balance: activeReport?.balance ?? 0,
        speed: activeReport?.speed ?? 0,
        strength: activeReport?.strength ?? 0,
        agility: activeReport?.agility ?? 0,
        notes: '',
        recorded_at: new Date().toISOString().slice(0, 10),
    });

    const resetReportForm = () => {
        reportForm.setData({
            condition_percentage: activeReport?.condition_percentage ?? 0,
            stamina: activeReport?.stamina ?? 0,
            balance: activeReport?.balance ?? 0,
            speed: activeReport?.speed ?? 0,
            strength: activeReport?.strength ?? 0,
            agility: activeReport?.agility ?? 0,
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

    return (
        <AdminLayout user={auth?.user} header={<h2 className="text-xl font-bold tracking-tight uppercase">Monitoring Athlet - {athlete.dojo?.name || 'Dojo'}</h2>}>
            <Head title={`Rapor - ${athlete.full_name}`} />
            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
                    <Link href={route('athletes.index')} className="inline-flex items-center text-sm font-bold text-neutral-500 hover:text-athlix-red transition-colors">
                        <ArrowLeft size={16} className="mr-1" /> KEMBALI KE DATABASE
                    </Link>

                    <Card className="border-neutral-200/80 dark:border-neutral-800">
                        <CardContent className="p-4 text-sm">
                            <p className="font-black uppercase tracking-widest text-neutral-500 text-xs">Biodata Athlet</p>
                            <p className="mt-2 font-bold">{athlete.full_name} ({athlete.athlete_code})</p>
                            <p className="text-neutral-500">Dojo: {athlete.dojo?.name || '-'} | Kelas: {athlete.class_note || 'UMUM'}</p>
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
                        <CardHeader><CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500">Detail Kemampuan Atlet</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            {categorySeries.map((item) => (
                                <div key={item.label} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold uppercase tracking-wider text-neutral-500">{item.label}</span>
                                        <span className="font-black text-athlix-red">{item.score}</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                                        <div className="h-full rounded-full bg-athlix-red" style={{ width: `${Math.max(0, Math.min(100, item.score))}%` }} />
                                    </div>
                                </div>
                            ))}
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

            <Modal show={reportModalOpen} onClose={() => setReportModalOpen(false)} maxWidth="4xl">
                <form onSubmit={submitReport} className="p-6 space-y-4">
                    <h3 className="text-lg font-black uppercase tracking-tight">Input Rapor Kemampuan Atlet</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {SCORE_FIELDS.map((field) => (
                            <label key={field.key} className="text-xs font-bold uppercase text-neutral-500 space-y-1">
                                {field.label}
                                <input type="number" min="0" max="100" className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm" value={reportForm.data[field.key]} onChange={(e) => reportForm.setData(field.key, e.target.value)} required />
                            </label>
                        ))}
                        <label className="text-xs font-bold uppercase text-neutral-500 space-y-1">
                            Kondisi Fisik (%)
                            <input type="number" min="0" max="100" className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm" value={reportForm.data.condition_percentage} onChange={(e) => reportForm.setData('condition_percentage', e.target.value)} required />
                        </label>
                        <label className="text-xs font-bold uppercase text-neutral-500 space-y-1 md:col-span-2">
                            Tanggal Penilaian
                            <input type="date" className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm" value={reportForm.data.recorded_at} onChange={(e) => reportForm.setData('recorded_at', e.target.value)} required />
                        </label>
                    </div>
                    <textarea className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm min-h-24" value={reportForm.data.notes} onChange={(e) => reportForm.setData('notes', e.target.value)} placeholder="Catatan rapor..." />
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setReportModalOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={reportForm.processing}>{reportForm.processing ? 'Menyimpan...' : 'Simpan Rapor'}</Button>
                    </div>
                </form>
            </Modal>

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
        </AdminLayout>
    );
}

