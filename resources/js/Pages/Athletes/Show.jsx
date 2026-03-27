import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Skeleton } from '@/Components/ui/skeleton';
import { ArrowLeft, Award, Trash2, FileText, HandCoins } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useEffect } from 'react';

export default function Show({ auth, athlete, performance, achievementHistory, latestReport, canRequestOverride = false, tenantId = null }) {
    const COLORS = ['#DC2626', '#404040'];

    const isLoading = !athlete || !performance || !achievementHistory;
    const conditionScore = performance?.condition?.[0]?.value ?? 0;
    const categorySeries = (performance?.categories || []).map((item) => ({
        label: item.label,
        score: item.score,
    }));
    const averageScore = categorySeries.length > 0
        ? Math.round(categorySeries.reduce((acc, item) => acc + Number(item.score || 0), 0) / categorySeries.length)
        : 0;

    const { data, setData, post, processing, errors, reset } = useForm({
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
        condition_percentage: latestReport?.condition_percentage ?? performance?.condition?.[0]?.value ?? 0,
        stamina: latestReport?.stamina ?? performance?.categories?.find((item) => item.label === 'Stamina')?.score ?? 0,
        balance: latestReport?.balance ?? performance?.categories?.find((item) => item.label === 'Keseimbangan')?.score ?? 0,
        speed: latestReport?.speed ?? performance?.categories?.find((item) => item.label === 'Kecepatan')?.score ?? 0,
        strength: latestReport?.strength ?? performance?.categories?.find((item) => item.label === 'Kekuatan')?.score ?? 0,
        agility: latestReport?.agility ?? performance?.categories?.find((item) => item.label === 'Kelincahan')?.score ?? 0,
        notes: latestReport?.notes ?? '',
        recorded_at: latestReport?.recorded_at ?? new Date().toISOString().slice(0, 10),
    });

    const overrideForm = useForm({
        override_mode: 'discount_amount',
        override_value: '',
        reason: '',
        valid_from: '',
        valid_to: '',
    });

    useEffect(() => {
        reportForm.setData({
            condition_percentage: latestReport?.condition_percentage ?? performance?.condition?.[0]?.value ?? 0,
            stamina: latestReport?.stamina ?? performance?.categories?.find((item) => item.label === 'Stamina')?.score ?? 0,
            balance: latestReport?.balance ?? performance?.categories?.find((item) => item.label === 'Keseimbangan')?.score ?? 0,
            speed: latestReport?.speed ?? performance?.categories?.find((item) => item.label === 'Kecepatan')?.score ?? 0,
            strength: latestReport?.strength ?? performance?.categories?.find((item) => item.label === 'Kekuatan')?.score ?? 0,
            agility: latestReport?.agility ?? performance?.categories?.find((item) => item.label === 'Kelincahan')?.score ?? 0,
            notes: latestReport?.notes ?? '',
            recorded_at: latestReport?.recorded_at ?? new Date().toISOString().slice(0, 10),
        });
    }, [latestReport?.id]);

    const formatBirthDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    };

    const detailedAge = (dateString) => {
        if (!dateString) return '-';

        const birthDate = new Date(dateString);
        const today = new Date();

        if (Number.isNaN(birthDate.getTime())) {
            return '-';
        }

        let years = today.getFullYear() - birthDate.getFullYear();
        let months = today.getMonth() - birthDate.getMonth();
        let days = today.getDate() - birthDate.getDate();

        if (days < 0) {
            const previousMonthLastDate = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
            days += previousMonthLastDate;
            months -= 1;
        }

        if (months < 0) {
            months += 12;
            years -= 1;
        }

        return `${years} tahun ${months} bulan ${days} hari`;
    };

    const submitAchievement = (e) => {
        e.preventDefault();

        post(route('athletes.achievements.store', athlete.id), {
            forceFormData: true,
            onSuccess: () => {
                reset();
            },
        });
    };

    const submitReport = (e) => {
        e.preventDefault();

        reportForm.post(route('athletes.reports.store', athlete.id), {
            preserveScroll: true,
        });
    };

    const deleteAchievement = (achievementId) => {
        router.delete(route('athletes.achievements.destroy', [athlete.id, achievementId]));
    };

    const submitOverrideRequest = (event) => {
        event.preventDefault();
        if (!tenantId || !athlete?.id) {
            return;
        }

        overrideForm.post(route('finance-api.billing.override-requests.store'), {
            preserveScroll: true,
            data: {
                tenant_id: tenantId,
                athlete_id: athlete.id,
                override_mode: overrideForm.data.override_mode,
                override_value: Number(overrideForm.data.override_value),
                reason: overrideForm.data.reason || null,
                valid_from: overrideForm.data.valid_from || null,
                valid_to: overrideForm.data.valid_to || null,
            },
            onSuccess: () => {
                overrideForm.reset('override_value', 'reason', 'valid_from', 'valid_to');
                overrideForm.setData('override_mode', 'discount_amount');
            },
        });
    };

    if (isLoading) {
        return (
            <AdminLayout
                user={auth?.user}
                header={<h2 className="text-xl font-bold tracking-tight text-neutral-900  uppercase">Monitoring Athlet</h2>}
            >
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
        <AdminLayout
            user={auth?.user}
            header={<h2 className="text-xl font-bold tracking-tight text-neutral-900  uppercase">Monitoring Athlet - {athlete.dojo?.name || 'Dojo'}</h2>}
        >
            <Head title={`Rapor - ${athlete.full_name}`} />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
                    <Link href={route('athletes.index')} className="inline-flex items-center text-sm font-bold text-neutral-500 hover:text-athlix-red transition-colors">
                        <ArrowLeft size={16} className="mr-1" /> KEMBALI KE DATABASE
                    </Link>

                    <Card className="border-none shadow-sm overflow-hidden">
                        <div className="bg-sky-500 text-white p-2 px-6 text-center font-bold text-sm tracking-widest uppercase">
                            Biodata Athlet {athlete.dojo?.name || 'Dojo'}
                        </div>
                        <CardContent className="p-0">
                            <div className="border-b border-neutral-100 dark:border-neutral-800 p-4 flex items-center gap-4 bg-white dark:bg-neutral-950">
                                {athlete.photo_url ? (
                                    <img src={athlete.photo_url} alt={athlete.full_name} className="w-16 h-16 rounded-2xl object-cover border border-neutral-200" />
                                ) : (
                                    <div className="w-16 h-16 rounded-2xl bg-athlix-red/10 text-athlix-red font-black text-xl flex items-center justify-center border border-athlix-red/20">
                                        {athlete.full_name?.charAt(0)}
                                    </div>
                                )}
                                <div className="space-y-1 text-xs">
                                    <p className="font-black uppercase tracking-widest text-neutral-500">Dokumen Registrasi</p>
                                    <div className="flex flex-wrap gap-2">
                                        <a href={athlete.documents?.kk || '#'} target={athlete.documents?.kk ? '_blank' : undefined} rel="noreferrer" className={`px-2 py-1 rounded-lg border text-[11px] font-bold ${athlete.documents?.kk ? 'border-green-200 text-green-700 bg-green-50' : 'border-neutral-200 text-neutral-400'}`}>KK</a>
                                        <a href={athlete.documents?.akte || '#'} target={athlete.documents?.akte ? '_blank' : undefined} rel="noreferrer" className={`px-2 py-1 rounded-lg border text-[11px] font-bold ${athlete.documents?.akte ? 'border-green-200 text-green-700 bg-green-50' : 'border-neutral-200 text-neutral-400'}`}>Akte</a>
                                        <a href={athlete.documents?.ktp || '#'} target={athlete.documents?.ktp ? '_blank' : undefined} rel="noreferrer" className={`px-2 py-1 rounded-lg border text-[11px] font-bold ${athlete.documents?.ktp ? 'border-green-200 text-green-700 bg-green-50' : 'border-neutral-200 text-neutral-400'}`}>KTP</a>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 text-sm">
                                <div className="border-b md:border-b-0 md:border-r border-neutral-100 dark:border-neutral-800">
                                    <div className="flex border-b border-neutral-100 dark:border-neutral-800">
                                        <div className="w-1/3 bg-neutral-50 dark:bg-neutral-950 p-3 font-bold uppercase text-xs text-neutral-500">Nama</div>
                                        <div className="w-2/3 p-3 font-bold uppercase">{athlete.full_name}</div>
                                    </div>
                                    <div className="flex border-b border-neutral-100 dark:border-neutral-800">
                                        <div className="w-1/3 bg-neutral-50 dark:bg-neutral-950 p-3 font-bold uppercase text-xs text-neutral-500">Jenis Kelamin</div>
                                        <div className="w-2/3 p-3 font-bold uppercase">{athlete.gender === 'M' ? 'Laki-laki' : 'Perempuan'}</div>
                                    </div>
                                    <div className="flex border-b border-neutral-100 dark:border-neutral-800">
                                        <div className="w-1/3 bg-neutral-50 dark:bg-neutral-950 p-3 font-bold uppercase text-xs text-neutral-500">Tanggal Lahir</div>
                                        <div className="w-2/3 p-3 font-bold">{formatBirthDate(athlete.dob)}</div>
                                    </div>
                                    <div className="flex border-b border-neutral-100 dark:border-neutral-800">
                                        <div className="w-1/3 bg-neutral-50 dark:bg-neutral-950 p-3 font-bold uppercase text-xs text-neutral-500">Umur Berjalan</div>
                                        <div className="w-2/3 p-3 font-bold">{detailedAge(athlete.dob)}</div>
                                    </div>
                                    <div className="flex">
                                        <div className="w-1/3 bg-neutral-50 dark:bg-neutral-950 p-3 font-bold uppercase text-xs text-neutral-500">Tinggi/Berat</div>
                                        <div className="w-2/3 p-3 font-bold uppercase">
                                            {athlete.latest_height ? `${athlete.latest_height} CM` : 'Belum Diisi'} / {athlete.latest_weight ? `${athlete.latest_weight} KG` : 'Belum Diisi'}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex border-b border-neutral-100 dark:border-neutral-800">
                                        <div className="w-1/3 bg-neutral-50 dark:bg-neutral-950 p-3 font-bold uppercase text-xs text-neutral-500">Cabang</div>
                                        <div className="w-2/3 p-3 font-bold uppercase">Karate</div>
                                    </div>
                                    <div className="flex border-b border-neutral-100 dark:border-neutral-800">
                                        <div className="w-1/3 bg-neutral-50 dark:bg-neutral-950 p-3 font-bold uppercase text-xs text-neutral-500">Nomor Tanding</div>
                                        <div className="w-2/3 p-3 font-bold uppercase">{athlete.specialization}</div>
                                    </div>
                                    <div className="flex border-b border-neutral-100 dark:border-neutral-800">
                                        <div className="w-1/3 bg-neutral-50 dark:bg-neutral-950 p-3 font-bold uppercase text-xs text-neutral-500">Kode Atlet</div>
                                        <div className="w-2/3 p-3 font-bold uppercase">{athlete.athlete_code}</div>
                                    </div>
                                    <div className="flex">
                                        <div className="w-1/3 bg-neutral-50 dark:bg-neutral-950 p-3 font-bold uppercase text-xs text-neutral-500">Keterangan Kelas</div>
                                        <div className="w-2/3 p-3 font-bold uppercase">{athlete.class_note || 'UMUM'}</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {canRequestOverride && (
                        <Card className="border-neutral-200/80 dark:border-neutral-800">
                            <CardHeader>
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                                    <HandCoins size={14} />
                                    Form Pengajuan Nominal Atlet
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={submitOverrideRequest} className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                        <label className="text-xs font-bold uppercase text-neutral-500 space-y-1">
                                            Mode
                                            <select className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm" value={overrideForm.data.override_mode} onChange={(e) => overrideForm.setData('override_mode', e.target.value)}>
                                                <option value="discount_amount">Potongan Nominal</option>
                                                <option value="discount_percent">Potongan Persen</option>
                                                <option value="fixed">Nominal Tetap</option>
                                            </select>
                                        </label>
                                        <label className="text-xs font-bold uppercase text-neutral-500 space-y-1">
                                            Nilai
                                            <input type="number" min="0" className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm" value={overrideForm.data.override_value} onChange={(e) => overrideForm.setData('override_value', e.target.value)} required />
                                        </label>
                                        <label className="text-xs font-bold uppercase text-neutral-500 space-y-1">
                                            Berlaku Dari
                                            <input type="date" className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm" value={overrideForm.data.valid_from} onChange={(e) => overrideForm.setData('valid_from', e.target.value)} />
                                        </label>
                                        <label className="text-xs font-bold uppercase text-neutral-500 space-y-1">
                                            Berlaku Sampai
                                            <input type="date" className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm" value={overrideForm.data.valid_to} onChange={(e) => overrideForm.setData('valid_to', e.target.value)} />
                                        </label>
                                    </div>
                                    <label className="block text-xs font-bold uppercase text-neutral-500 space-y-1">
                                        Alasan Pengajuan
                                        <textarea className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm min-h-20" value={overrideForm.data.reason} onChange={(e) => overrideForm.setData('reason', e.target.value)} placeholder="Contoh: beasiswa / diskon keluarga / program elit." />
                                    </label>
                                    {Object.values(overrideForm.errors).length > 0 && (
                                        <p className="text-xs text-athlix-red">{Object.values(overrideForm.errors)[0]}</p>
                                    )}
                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={overrideForm.processing || !tenantId}>
                                            {overrideForm.processing ? 'Mengirim...' : 'Kirim Pengajuan'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="min-w-0 bg-neutral-50/50 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800">
                            <CardHeader className="pb-0">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-600 ">Condition Atlet</CardTitle>
                            </CardHeader>
                            <CardContent className="h-72 relative min-w-0">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                                    <PieChart>
                                        <Pie
                                            data={performance.condition}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={68}
                                            outerRadius={88}
                                            dataKey="value"
                                            stroke="none"
                                            paddingAngle={2}
                                        >
                                            {performance.condition.map((entry, index) => (
                                                <Cell key={`condition-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-4xl font-black text-athlix-red">{conditionScore}%</div>
                                        <div className="text-[11px] uppercase tracking-widest text-neutral-500  font-bold mt-1">Skor Kondisi</div>
                                    </div>
                                </div>
                                <div className="absolute bottom-3 left-0 right-0 px-6 flex flex-wrap justify-center gap-3">
                                    {performance.condition.map((item, index) => (
                                        <span key={`legend-${index}`} className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-600 ">
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                            {item.label}
                                        </span>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="min-w-0 bg-neutral-50/50 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800">
                            <CardHeader className="pb-0">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-600 ">Skor Kemampuan Atlet (Diagram Jaring)</CardTitle>
                            </CardHeader>
                            <CardContent className="h-72 min-w-0">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                                    <RadarChart data={categorySeries}>
                                        <PolarGrid stroke="#88888833" />
                                        <PolarAngleAxis dataKey="label" tick={{ fontSize: 10 }} />
                                        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                                        <Tooltip />
                                        <Radar dataKey="score" stroke="#DC2626" fill="#DC2626" fillOpacity={0.3} />
                                    </RadarChart>
                                </ResponsiveContainer>
                                <p className="text-xs text-center font-bold uppercase tracking-widest text-neutral-500  mt-1">
                                    Rata-rata skor: {averageScore} | Status: {performance?.ability_status || 'Belum Dinilai'}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="border-neutral-200/80 dark:border-neutral-800 lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500">Input Rapor Kemampuan Atlet</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <form onSubmit={submitReport} className="space-y-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <label className="text-xs font-bold uppercase text-neutral-500 space-y-1">
                                            Kondisi Fisik (%)
                                            <input type="number" min="0" max="100" className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 px-3 py-2 text-sm" value={reportForm.data.condition_percentage} onChange={(e) => reportForm.setData('condition_percentage', e.target.value)} required />
                                        </label>
                                        <label className="text-xs font-bold uppercase text-neutral-500 space-y-1">
                                            Stamina
                                            <input type="number" min="0" max="100" className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 px-3 py-2 text-sm" value={reportForm.data.stamina} onChange={(e) => reportForm.setData('stamina', e.target.value)} required />
                                        </label>
                                        <label className="text-xs font-bold uppercase text-neutral-500 space-y-1">
                                            Keseimbangan
                                            <input type="number" min="0" max="100" className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 px-3 py-2 text-sm" value={reportForm.data.balance} onChange={(e) => reportForm.setData('balance', e.target.value)} required />
                                        </label>
                                        <label className="text-xs font-bold uppercase text-neutral-500 space-y-1">
                                            Kecepatan
                                            <input type="number" min="0" max="100" className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 px-3 py-2 text-sm" value={reportForm.data.speed} onChange={(e) => reportForm.setData('speed', e.target.value)} required />
                                        </label>
                                        <label className="text-xs font-bold uppercase text-neutral-500 space-y-1">
                                            Kekuatan
                                            <input type="number" min="0" max="100" className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 px-3 py-2 text-sm" value={reportForm.data.strength} onChange={(e) => reportForm.setData('strength', e.target.value)} required />
                                        </label>
                                        <label className="text-xs font-bold uppercase text-neutral-500 space-y-1">
                                            Kelincahan
                                            <input type="number" min="0" max="100" className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 px-3 py-2 text-sm" value={reportForm.data.agility} onChange={(e) => reportForm.setData('agility', e.target.value)} required />
                                        </label>
                                        <label className="text-xs font-bold uppercase text-neutral-500 space-y-1 md:col-span-2">
                                            Tanggal Penilaian
                                            <input type="date" className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 px-3 py-2 text-sm" value={reportForm.data.recorded_at} onChange={(e) => reportForm.setData('recorded_at', e.target.value)} required />
                                        </label>
                                    </div>
                                    <label className="block text-xs font-bold uppercase text-neutral-500 space-y-1">
                                        Catatan Rapor
                                        <textarea className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 px-3 py-2 text-sm min-h-20" value={reportForm.data.notes} onChange={(e) => reportForm.setData('notes', e.target.value)} placeholder="Catatan evaluasi teknik/mental/target latihan berikutnya..." />
                                    </label>
                                    {Object.values(reportForm.errors).length > 0 && (
                                        <p className="text-xs text-athlix-red">Pastikan nilai rapor berada di rentang 0-100 dan tanggal penilaian valid.</p>
                                    )}
                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={reportForm.processing}>{reportForm.processing ? 'Menyimpan...' : 'Simpan Rapor'}</Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        <Card className="border-neutral-200/80 dark:border-neutral-800 lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500">Detail Kemampuan Atlet</CardTitle>
                            </CardHeader>
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
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="border-neutral-200/80 dark:border-neutral-800">
                            <CardHeader>
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500">Tambah Prestasi Atlet</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={submitAchievement} className="space-y-3">
                                    <input className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm" placeholder="Nama pertandingan" value={data.competition_name} onChange={(e) => setData('competition_name', e.target.value)} />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm" placeholder="Tingkat (kota/provinsi/nasional)" value={data.competition_level} onChange={(e) => setData('competition_level', e.target.value)} />
                                        <input className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm" placeholder="Jenis pertandingan" value={data.competition_type} onChange={(e) => setData('competition_type', e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm" placeholder="Kategori" value={data.category} onChange={(e) => setData('category', e.target.value)} />
                                        <input className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm" placeholder="Hasil (Juara 1, dst)" value={data.result_title} onChange={(e) => setData('result_title', e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input type="date" className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm" value={data.competition_date} onChange={(e) => setData('competition_date', e.target.value)} />
                                        <input className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm" placeholder="Lokasi" value={data.location} onChange={(e) => setData('location', e.target.value)} />
                                    </div>
                                    <input className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm" placeholder="Penyelenggara" value={data.organizer} onChange={(e) => setData('organizer', e.target.value)} />
                                    <textarea className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm min-h-20" placeholder="Catatan" value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                                    <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setData('certificate', e.target.files[0] ?? null)} className="w-full text-sm" />
                                    {Object.values(errors).length > 0 && <p className="text-xs text-athlix-red">Pastikan semua data wajib terisi dengan benar.</p>}
                                    <Button type="submit" disabled={processing} className="w-full">Simpan Prestasi</Button>
                                </form>
                            </CardContent>
                        </Card>

                        <Card className="border-neutral-200/80 dark:border-neutral-800 overflow-hidden">
                            <CardHeader className="border-b border-neutral-100 dark:border-neutral-800">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500">Riwayat Prestasi</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {achievementHistory.length > 0 ? (
                                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {achievementHistory.map((achievement) => (
                                            <div key={achievement.id} className="px-4 py-3 text-sm space-y-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <p className="font-bold">{achievement.competition_name}</p>
                                                        <p className="text-xs text-neutral-500">{achievement.competition_date} | {achievement.competition_level}</p>
                                                    </div>
                                                    <button type="button" className="p-1 rounded text-red-500 hover:bg-red-50" onClick={() => deleteAchievement(achievement.id)}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                                <p className="text-xs text-neutral-600 ">Jenis: {achievement.competition_type} | Kategori: {achievement.category || '-'}</p>
                                                <p className="text-xs text-neutral-600 ">Hasil: {achievement.result_title || '-'}</p>
                                                <p className="text-xs text-neutral-500">Lokasi: {achievement.location || '-'} | Penyelenggara: {achievement.organizer || '-'}</p>
                                                {achievement.certificate_url && (
                                                    <a href={achievement.certificate_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-athlix-red hover:underline">
                                                        <FileText size={12} /> Lihat Sertifikat
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-6 text-sm text-neutral-400 text-center">Belum ada data prestasi untuk atlet ini.</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex justify-center">
                        <Card className="max-w-xs w-full bg-athlix-black text-white p-4 border-none text-center space-y-3">
                            <div className="flex items-center justify-center gap-2">
                                <Award className="text-athlix-red" size={20} />
                                <span className="text-xs font-bold uppercase tracking-widest">Digital ID Available</span>
                            </div>
                            <p className="text-xs text-neutral-400">Athlete dapat gunakan kode ini untuk absensi scan QR dojo.</p>
                            <Button variant="secondary" className="w-full h-8 text-xs font-bold uppercase">
                                View QR Digital ID
                            </Button>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

