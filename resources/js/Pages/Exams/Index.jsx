import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/Components/ui/card';
import { Trophy, Calendar, CheckCircle2, TrendingUp, Medal, Star, ShieldCheck, ClipboardCheck, Users, Banknote } from 'lucide-react';
import React from 'react';
import { Button } from '@/Components/ui/button';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';

export default function Index({ auth, leaderboard, examHistory, pendingExams, totalExams, examPassRate, upcomingExam, flash }) {
    const [activeTab, setActiveTab] = React.useState('leaderboard'); // 'leaderboard', 'history', 'grading'
    const [bulkGrades, setBulkGrades] = React.useState({});
    const selectedCount = Object.keys(bulkGrades).length;

    // Form for Mass Scheduling
    const { data, setData, post, processing, errors, reset } = useForm({
        exam_date: '',
        exam_fee: 50000,
    });

    const handleSchedule = (e) => {
        e.preventDefault();
        post(route('exams.mass-schedule'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                alert('Jadwal Ujian Massal berhasil dibuat.');
            }
        });
    };

    const setBulkStatus = (id, status) => {
        setBulkGrades((prev) => ({
            ...prev,
            [id]: status,
        }));
    };

    const clearBulk = () => setBulkGrades({});

    const handleBulkSave = () => {
        const grades = Object.entries(bulkGrades).map(([id, status]) => ({
            id: Number(id),
            status,
        }));

        if (!grades.length) return;

        if (confirm(`Simpan penilaian untuk ${grades.length} atlet?`)) {
            router.patch(route('exams.bulk-grade'), { grades }, {
                preserveScroll: true,
                onSuccess: () => setBulkGrades({}),
            });
        }
    };

    return (
        <AdminLayout
            user={auth.user}
            header={<h2 className="text-xl font-bold tracking-tight uppercase">Perangkingan & Manajemen Ujian</h2>}
        >
            <Head title="Manajemen Ujian" />

            <div className="py-6 space-y-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Ujian', value: totalExams, icon: Trophy, color: 'text-athlix-red bg-athlix-red/10' },
                            { label: 'Total Lulus', value: examHistory?.filter(e => e.status === 'passed').length || 0, icon: CheckCircle2, color: 'text-green-500 bg-green-500/10' },
                            { label: 'Rasio Kelulusan', value: `${examPassRate}%`, icon: TrendingUp, color: 'text-blue-500 bg-blue-500/10' },
                            { label: 'Antrean Penilaian', value: pendingExams?.length || 0, icon: ClipboardCheck, color: 'text-orange-500 bg-orange-500/10' },
                        ].map((stat, idx) => (
                            <Card key={stat.label} className="border-neutral-200/80 dark:border-neutral-800 card-hover animate-fade-in-up fill-both" style={{ animationDelay: `${idx * 80}ms` }}>
                                <CardContent className="p-5 space-y-3">
                                    <div className={`p-2.5 rounded-xl w-fit ${stat.color} transition-transform duration-300 group-hover:scale-110`}>
                                        <stat.icon size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{stat.label}</p>
                                        <p className="text-xl font-black mt-0.5">{stat.value}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Tabs Navigation */}
                    <div className="flex flex-wrap gap-2 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-2xl w-fit animate-fade-in-up fill-both" style={{ animationDelay: '200ms' }}>
                        <button
                            onClick={() => setActiveTab('leaderboard')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all duration-300 ${
                                activeTab === 'leaderboard' 
                                ? 'bg-white dark:bg-neutral-800 text-athlix-red shadow-sm' 
                                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-white/50 dark:hover:bg-neutral-800/50'
                            }`}
                        >
                            <Medal size={16} /> Klasemen
                        </button>
                        <button
                            onClick={() => setActiveTab('grading')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all duration-300 relative ${
                                activeTab === 'grading' 
                                ? 'bg-white dark:bg-neutral-800 text-athlix-red shadow-sm' 
                                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-white/50 dark:hover:bg-neutral-800/50'
                            }`}
                        >
                            <ClipboardCheck size={16} /> Penilaian Ujian
                            {pendingExams?.length > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-athlix-red opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-athlix-red"></span>
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all duration-300 ${
                                activeTab === 'history' 
                                ? 'bg-white dark:bg-neutral-800 text-athlix-red shadow-sm' 
                                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-white/50 dark:hover:bg-neutral-800/50'
                            }`}
                        >
                            <Trophy size={16} /> Riwayat
                        </button>
                    </div>

                    {/* Tab Content: Leaderboard */}
                    {activeTab === 'leaderboard' && (
                        <Card className="border-neutral-200/80 dark:border-neutral-800 animate-fade-in-up fill-both overflow-hidden" style={{ animationDelay: '300ms' }}>
                            <CardHeader className="border-b border-neutral-100 dark:border-neutral-800 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                                    <Star size={16} className="text-yellow-500" />
                                    Top Performers Dojo
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {leaderboard?.map((athlete, idx) => (
                                        <div key={athlete.id} className="p-4 sm:p-5 flex items-center gap-4 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-all duration-300 group">
                                            {/* Rank Badge */}
                                            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black shadow-sm transition-transform duration-300 group-hover:scale-110
                                                    ${idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white shadow-yellow-500/30' : 
                                                      idx === 1 ? 'bg-gradient-to-br from-neutral-300 to-neutral-400 text-white dark:from-neutral-600 dark:to-neutral-700' : 
                                                      idx === 2 ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-amber-500/30' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}
                                                >
                                                    #{athlete.rank}
                                                </div>
                                            </div>

                                            {/* Athlete Info */}
                                            <div className="flex-1 min-w-0 flex items-center gap-4">
                                                <div className="hidden sm:flex w-10 h-10 rounded-full bg-gradient-to-br from-athlix-red/20 to-athlix-red/5 text-athlix-red items-center justify-center font-bold text-sm">
                                                    {athlete.avatar_letter}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-base sm:text-lg truncate group-hover:text-athlix-red transition-colors">{athlete.name}</h4>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-1">
                                                            <ShieldCheck size={12} className="text-athlix-red" />
                                                            {athlete.belt}
                                                        </span>
                                                        <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700"></span>
                                                        <span className="hidden sm:inline-block text-[10px] uppercase text-neutral-400">
                                                            Pencapaian Ujian: {athlete.passed_exams}x
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Score */}
                                            <div className="flex-shrink-0 text-right">
                                                <div className="text-xl sm:text-2xl font-black text-athlix-red font-mono tracking-tighter">
                                                    {athlete.score}
                                                </div>
                                                <div className="text-[10px] uppercase font-bold text-neutral-400">Poin Prestasi</div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!leaderboard || leaderboard.length === 0) && (
                                        <div className="p-8 text-center text-neutral-500 text-sm italic">Belum ada data atlet aktif untuk dirangking.</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Tab Content: Grading & Schedule */}
                    {activeTab === 'grading' && (
                        <div className="space-y-6 animate-fade-in-up fill-both" style={{ animationDelay: '300ms' }}>
                            {/* Schedule Mass Exam Form */}
                            <Card className="border-neutral-200/80 dark:border-neutral-800 bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-900/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar size={20} className="text-athlix-red" />
                                        Jadwalkan Ujian Massal
                                    </CardTitle>
                                    <CardDescription>
                                        Daftarkan seluruh atlet aktif ke jenjang sabuk berikutnya secara otomatis.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSchedule} className="flex flex-col sm:flex-row gap-4 items-end">
                                        <div className="w-full sm:w-1/3 space-y-2">
                                            <InputLabel htmlFor="exam_date" value="Tanggal Ujian" />
                                            <TextInput 
                                                id="exam_date" 
                                                type="date"
                                                className="w-full"
                                                value={data.exam_date}
                                                onChange={e => setData('exam_date', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="w-full sm:w-1/3 space-y-2">
                                            <InputLabel htmlFor="exam_fee" value="Biaya Ujian (Rp)" className="flex items-center gap-2" />
                                            <TextInput 
                                                id="exam_fee" 
                                                type="number"
                                                className="w-full"
                                                value={data.exam_fee}
                                                onChange={e => setData('exam_fee', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <Button type="submit" disabled={processing} className="w-full sm:w-auto mt-4 sm:mt-0">
                                            <Users size={16} className="mr-2" />
                                            Daftarkan Semua Atlet
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            {/* Pending Grading List */}
                            <Card className="border-neutral-200/80 dark:border-neutral-800 overflow-hidden">
                                <CardHeader className="border-b border-neutral-100 dark:border-neutral-800 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                                        <ClipboardCheck size={16} className="text-athlix-red" />
                                        Antrean Penilaian & Kelulusan
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">
                                            Dipilih: {selectedCount}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={clearBulk}
                                            disabled={selectedCount === 0}
                                        >
                                            Reset
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleBulkSave}
                                            disabled={selectedCount === 0}
                                            className="bg-athlix-red text-white hover:bg-athlix-red/90"
                                        >
                                            Simpan Penilaian
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-[10px] text-neutral-500 uppercase bg-neutral-50/80 dark:bg-neutral-900/80 border-b border-neutral-200/80 dark:border-neutral-800 tracking-widest">
                                                <tr>
                                                    <th className="px-6 py-4">Tanggal Ujian</th>
                                                    <th className="px-6 py-4">Atlet</th>
                                                    <th className="px-6 py-4 text-center">Jenjang Promosi</th>
                                                    <th className="px-6 py-4 text-center">Penilaian</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                                {pendingExams && pendingExams.length > 0 ? (
                                                    pendingExams.map((exam, idx) => (
                                                        <tr key={exam.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-all duration-300">
                                                            <td className="px-6 py-4 font-mono text-xs text-neutral-500">{exam.date}</td>
                                                            <td className="px-6 py-4 font-medium">{exam.athlete_name}</td>
                                                            <td className="px-6 py-4 text-center text-[10px] uppercase font-bold text-neutral-500">
                                                                {exam.current_belt} <span className="mx-2 text-athlix-red font-black">→</span> {exam.target_belt}
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <Button 
                                                                        variant="outline" 
                                                                        size="sm" 
                                                                        onClick={() => setBulkStatus(exam.id, 'passed')}
                                                                        className={`border-green-500/30 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 ${bulkGrades[exam.id] === 'passed' ? 'bg-green-50 dark:bg-green-900/30' : ''}`}
                                                                    >
                                                                        <CheckCircle2 size={16} className="mr-1" /> Lulus
                                                                    </Button>
                                                                    <Button 
                                                                        variant="outline" 
                                                                        size="sm" 
                                                                        onClick={() => setBulkStatus(exam.id, 'failed')}
                                                                        className={`border-red-500/30 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 ${bulkGrades[exam.id] === 'failed' ? 'bg-red-50 dark:bg-red-900/30' : ''}`}
                                                                    >
                                                                        Gagal
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr><td colSpan="4" className="p-8 text-center text-neutral-500 text-sm italic">Tidak ada ujian yang menunggu penilaian.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Tab Content: Exam History */}
                    {activeTab === 'history' && (
                        <Card className="border-neutral-200/80 dark:border-neutral-800 animate-fade-in-up fill-both overflow-hidden" style={{ animationDelay: '300ms' }}>
                            <CardHeader className="border-b border-neutral-100 dark:border-neutral-800">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                                    <Trophy size={16} className="text-athlix-red" />
                                    Riwayat Promosi Sabuk
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {/* Desktop table */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-[10px] text-neutral-500 uppercase bg-neutral-50/80 dark:bg-neutral-900/80 border-b border-neutral-200/80 dark:border-neutral-800 tracking-widest">
                                            <tr>
                                                <th className="px-6 py-4">Tanggal</th>
                                                <th className="px-6 py-4">Atlet</th>
                                                <th className="px-6 py-4">Sabuk Asal</th>
                                                <th className="px-6 py-4">Sabuk Tujuan</th>
                                                <th className="px-6 py-4">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                            {examHistory && examHistory.length > 0 ? (
                                                examHistory.map((exam, idx) => (
                                                    <tr key={exam.id || idx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-all duration-300 animate-fade-in-up fill-both" style={{ animationDelay: `${50 + idx * 40}ms` }}>
                                                        <td className="px-6 py-4 font-mono text-xs text-neutral-500">{exam.date}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-athlix-red/20 to-athlix-red/5 text-athlix-red flex items-center justify-center font-bold text-xs">
                                                                    {exam.athlete_name?.charAt(0)}
                                                                </div>
                                                                <span className="font-medium">{exam.athlete_name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">{exam.from_belt}</td>
                                                        <td className="px-6 py-4 font-bold">{exam.to_belt}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                                                                exam.status === 'passed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                                            }`}>
                                                                <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${exam.status === 'passed' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                                {exam.status === 'passed' ? 'LULUS' : 'GAGAL'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr><td colSpan="5" className="p-8 text-center text-neutral-500 text-sm italic">Belum ada riwayat kelulusan/kegagalan tercatat.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Mobile */}
                                <div className="md:hidden divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {examHistory && examHistory.length > 0 ? (
                                        examHistory.map((exam, idx) => (
                                            <div key={exam.id || idx} className="p-4 flex items-center gap-3 animate-fade-in-up fill-both" style={{ animationDelay: `${idx * 50}ms` }}>
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-athlix-red/20 to-athlix-red/5 text-athlix-red flex items-center justify-center font-bold text-sm">
                                                    {exam.athlete_name?.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm truncate">{exam.athlete_name}</p>
                                                    <p className="text-[10px] text-neutral-500">{exam.from_belt} → {exam.to_belt}</p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <span className={`text-[10px] font-bold uppercase ${exam.status === 'passed' ? 'text-green-600' : 'text-red-500'}`}>
                                                        {exam.status === 'passed' ? 'LULUS' : 'GAGAL'}
                                                    </span>
                                                    <p className="text-[9px] text-neutral-400 font-mono mt-0.5">{exam.date}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-neutral-500 text-sm italic">Belum ada riwayat kelulusan/kegagalan tercatat.</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                </div>
            </div>
        </AdminLayout>
    );
}
