import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import {
    Dumbbell,
    Clock,
    User,
    Zap,
    CalendarDays,
    Plus,
    Pencil,
    Trash2,
    X,
    Calendar,
    AlertCircle,
    ChevronRight,
    Tag,
    MapPin,
    FileUp,
    FileText,
    Download,
    Eye,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import { Skeleton } from '@/Components/ui/skeleton';
import DbSelect from '@/Components/DbSelect';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export default function Index({ auth, weeklySchedule, dojos = [], selectedDojoId = null, senseis = [], isAllDojos = false, isSuperAdmin = false, clubPerformanceStats = [] }) {
    const isLoading = !weeklySchedule;
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const agendaTitleTemplates = ['Briefing', 'Pemanasan', 'Sparring', 'Pendinginan', 'Evaluasi', 'Other/Lainnya'];
    const programTitleTemplatesByType = {
        teknik: ['Fundamental Kihon', 'Teknik Kuda-kuda', 'Teknik Timing & Distance'],
        kata: ['Kata Inti Mingguan', 'Kata Kompetisi', 'Bunkai Kata'],
        kumite: ['Kumite Speed Reaction', 'Kumite Tactical Session', 'Sparring Strategy'],
        fisik: ['Conditioning Atlet', 'Power & Agility', 'Endurance Session'],
    };
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProgram, setEditingProgram] = useState(null);
    const [detailModal, setDetailModal] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [dojoId, setDojoId] = useState(selectedDojoId || '');

    const filterDojoOptions = useMemo(
        () => [
            { value: '', label: 'Semua Club' },
            ...dojos.map((dojo) => ({ value: String(dojo.id), label: dojo.name })),
        ],
        [dojos]
    );

    const dojoOptions = useMemo(
        () => dojos.map((dojo) => ({ value: String(dojo.id), label: dojo.name })),
        [dojos]
    );

    const coachOptions = useMemo(() => {
        const currentDojoName = dojos.find(d => String(d.id) === String(dojoId || selectedDojoId))?.name;

        const baseOptions = senseis.map((s) => ({
            value: s.name,
            label: `${s.name} (${s.role.replace('_', ' ').toUpperCase()})`
        }));

        if (currentDojoName) {
            return [
                { value: currentDojoName, label: `${currentDojoName} (Dojo)` },
                ...baseOptions
            ];
        }
        return baseOptions;
    }, [senseis, dojos, dojoId, selectedDojoId]);

    const { data, setData, post, patch, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        title: '',
        day: 'Senin',
        start_time: '08:00',
        end_time: '10:00',
        coach_name: '',
        type: 'teknik',
        description: '',
        agenda_items: [],
        dojo_id: selectedDojoId || '',
        force_overlap: false,
    });

    const { data: ppaData, setData: setPpaData, post: postPpa, processing: ppaProcessing, errors: ppaErrors, reset: ppaReset } = useForm({
        ppa_file: null,
        dojo_id: selectedDojoId || '',
    });

    const [ppaPreview, setPpaPreview] = useState(null);

    useEffect(() => {
        setDojoId(selectedDojoId || '');
        setData('dojo_id', selectedDojoId || '');
        setPpaData('dojo_id', selectedDojoId || '');
    }, [selectedDojoId]);

    useEffect(() => {
        const doc = dojos.find(d => String(d.id) === String(selectedDojoId));
        if (doc?.ppa_file_path && doc.ppa_file_path.endsWith('.pdf')) {
            setPpaPreview(`/storage/${doc.ppa_file_path}`);
        } else {
            setPpaPreview(null);
        }
    }, [selectedDojoId, dojos]);

    const handleFilterDojoChange = (next) => {
        const params = next ? { dojo_id: next } : {};
        router.get(route('training-programs.index'), params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const openModal = (program = null) => {
        clearErrors();
        if (program) {
            setEditingProgram(program);
            setData({
                title: program.title,
                day: program.day,
                start_time: program.start_time,
                end_time: program.end_time,
                coach_name: program.coach,
                type: program.type,
                description: program.desc || '',
                agenda_items: (program.agenda_items || []).map((item) => ({
                    start_time: item.start_time || '',
                    end_time: item.end_time || '',
                    title: item.title || '',
                    description: item.description || '',
                })),
                dojo_id: program.dojo_id || dojoId || '',
                force_overlap: false,
            });
        } else {
            setEditingProgram(null);
            reset();

            const currentDojoName = dojos.find(d => String(d.id) === String(dojoId || selectedDojoId))?.name;

            setData({
                ...data,
                title: '',
                day: 'Senin',
                start_time: '08:00',
                end_time: '10:00',
                coach_name: currentDojoName || '',
                type: 'teknik',
                description: '',
                agenda_items: [],
                dojo_id: dojoId || selectedDojoId || '',
                force_overlap: false,
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    const submit = (e) => {
        e.preventDefault();

        if (!data.coach_name) {
            const currentDojoName = dojos.find(d => String(d.id) === String(data.dojo_id))?.name;
            if (currentDojoName) {
                setData('coach_name', currentDojoName);
            }
        }

        if (editingProgram) {
            patch(route('training-programs.update', editingProgram.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('training-programs.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const addAgendaItem = () => {
        const lastItem = data.agenda_items[data.agenda_items.length - 1];
        const start_time = lastItem?.end_time || data.start_time || '';
        const end_time = start_time ? addMinutesToTime(start_time, 15) : '';

        setData('agenda_items', [
            ...data.agenda_items,
            { start_time, end_time, title: agendaTitleTemplates[0], description: '' },
        ]);
    };

    const updateAgendaItem = (index, field, value) => {
        const next = [...data.agenda_items];
        const previousEnd = next[index]?.end_time;
        next[index] = { ...next[index], [field]: value };

        if (field === 'end_time' && next[index + 1]) {
            if (!next[index + 1].start_time || next[index + 1].start_time === previousEnd) {
                next[index + 1] = { ...next[index + 1], start_time: value };
            }
        }

        setData('agenda_items', next);
    };

    const removeAgendaItem = (index) => {
        const next = data.agenda_items.filter((_, i) => i !== index);
        setData('agenda_items', next);
    };

    const handleDelete = (id) => {
        setDeleteConfirmId(id);
    };

    const confirmDelete = () => {
        if (deleteConfirmId) {
            destroy(route('training-programs.destroy', deleteConfirmId));
            setDeleteConfirmId(null);
        }
    };

    const cancelDelete = () => {
        setDeleteConfirmId(null);
    };

    const typeColors = {
        fisik: 'bg-orange-500',
        kumite: 'bg-athlix-red',
        kata: 'bg-purple-500',
        teknik: 'bg-blue-500',
    };

    const titleOptions = Array.from(new Set([
        ...(programTitleTemplatesByType[data.type] || []),
        data.title || '',
    ].filter(Boolean)));
    const titleSelectOptions = useMemo(
        () => titleOptions.map((option) => ({ value: option, label: option })),
        [titleOptions],
    );
    const coachSelectOptions = coachOptions;

    const handlePpaUpload = (e) => {
        e.preventDefault();
        postPpa(route('training-programs.ppa-upload'), {
            forceFormData: true,
            onSuccess: () => {
                ppaReset('ppa_file');
                setPpaPreview(null);
            },
        });
    };

    if (isLoading) {
        return (
            <AdminLayout
                user={auth?.user}
                header={<h2 className="text-xl font-bold tracking-tight uppercase">Jadwal Latihan Club</h2>}
            >
                <Head title="Program Latihan" />
                <div className="py-6 space-y-6">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <Skeleton className="h-4 w-44" />
                            <Skeleton className="h-10 w-40" />
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
            header={<h2 className="text-xl font-bold tracking-tight uppercase">Jadwal Latihan Club</h2>}
        >
            <Head title="Program Latihan" />

            <div className="py-6 space-y-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
                        <div>
                            <p className="text-sm font-bold uppercase tracking-widest text-neutral-500">
                                Program Mingguan
                                {isAllDojos && (
                                    <span className="text-xs font-normal normal-case tracking-normal text-neutral-400 ml-2">— Semua Club</span>
                                )}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {isSuperAdmin && dojos.length > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <DbSelect
                                        inputId="filter-dojo"
                                        className="min-w-[180px]"
                                        options={filterDojoOptions}
                                        value={selectedDojoId ? String(selectedDojoId) : ''}
                                        placeholder="Semua Club"
                                        onChange={handleFilterDojoChange}
                                    />
                                    {selectedDojoId && (
                                        <button
                                            type="button"
                                            onClick={() => handleFilterDojoChange('')}
                                            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                            title="Tampilkan semua club"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            )}
                            <Button
                                onClick={() => openModal()}
                                className="h-10 px-6 rounded-xl font-black uppercase tracking-widest gap-2 bg-athlix-red hover:bg-red-700 text-white shadow-lg shadow-athlix-red/20 transition-all active:scale-95"
                                disabled={isSuperAdmin && dojos.length > 0 && !dojoId}
                            >
                                <Plus size={16} />
                                <span className="hidden sm:inline">Tambah Program</span>
                                <span className="sm:hidden">Tambah</span>
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-6 sm:gap-4 pt-6 sm:pt-2">
                        {days.map((day, dayIdx) => (
                            <div key={day} className="space-y-3 animate-fade-in-up fill-both" style={{ animationDelay: `${dayIdx * 60}ms` }}>
                                <div className="flex items-center gap-2 px-2">
                                    <div className="w-2 h-2 rounded-full bg-athlix-red animate-pulse"></div>
                                    <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500">{day}</h3>
                                </div>

                                <div className="space-y-3">
                                    {weeklySchedule[day] && weeklySchedule[day].length > 0 ? (
                                        weeklySchedule[day].map((p) => {
                                            return (
                                                <Card key={p.id} className={`border-neutral-200/80 dark:border-neutral-800 group hover:border-athlix-red/40 transition-all duration-300 overflow-hidden relative card-hover`}>
                                                    <div className={`h-1 w-full ${typeColors[p.type] || 'bg-blue-500'} transition-all duration-300 group-hover:h-1.5`}></div>

                                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                openModal(p);
                                                            }}
                                                            className="p-1.5 rounded-lg bg-white/90 dark:bg-neutral-900/90 text-neutral-500 hover:text-athlix-red shadow-sm border border-neutral-100 dark:border-neutral-800 transition-colors active:scale-95"
                                                        >
                                                            <Pencil size={12} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                handleDelete(p.id);
                                                            }}
                                                            className="p-1.5 rounded-lg bg-white/90 dark:bg-neutral-900/90 text-neutral-500 hover:text-red-600 shadow-sm border border-neutral-100 dark:border-neutral-800 transition-colors active:scale-95"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => setDetailModal(p)}
                                                        className="w-full text-left"
                                                    >
                                                        <CardContent className="p-3 sm:p-4 space-y-2.5">
                                                            <div className="flex items-start justify-between gap-2 pr-10">
                                                                <h4 className="text-xs font-bold leading-tight group-hover:text-athlix-red transition-colors">{p.title}</h4>
                                                                <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider text-white shrink-0 ${typeColors[p.type] || 'bg-blue-500'}`}>
                                                                    {p.type}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-mono">
                                                                <Clock size={11} />
                                                                {p.time}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                                                                <User size={11} className="text-athlix-red" />
                                                                <span className="truncate">{p.coach}</span>
                                                            </div>
                                                            {isAllDojos && p.dojo_name && (
                                                                <div className="flex items-center gap-1.5 text-xs text-blue-500">
                                                                    <MapPin size={11} />
                                                                    <span className="truncate">{p.dojo_name}</span>
                                                                </div>
                                                            )}
                                                            {(p.agenda_items || []).length > 0 && (
                                                                <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                                                                    <Tag size={10} />
                                                                    {p.agenda_items.length} sesi agenda
                                                                    <ChevronRight size={10} />
                                                                </div>
                                                            )}
                                                        </CardContent>
                                                    </button>
                                                </Card>
                                            );
                                        })
                                    ) : (
                                        <div className="p-4 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 text-xs text-neutral-400 italic text-center bg-neutral-50/50 dark:bg-neutral-900/30">
                                            Libur / Mandiri
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Chart Performa Club */}
                    {clubPerformanceStats && clubPerformanceStats.length > 0 && (
                        <div className="mt-16 sm:mt-24 animate-fade-in-up fill-both" style={{ animationDelay: '300ms' }}>
                            <div className="flex items-center justify-between mb-4 px-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-athlix-red"></div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500">Rekap Performa Atlet (Club)</h3>
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Data dari seluruh atlet</div>
                            </div>
                            <Card className="border-neutral-200/80 dark:border-neutral-800 p-3 sm:p-6 overflow-hidden">
                                <div className="w-full overflow-x-auto pb-4">
                                    <div className="h-[350px] sm:h-[500px] min-w-[600px] sm:min-w-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={clubPerformanceStats}
                                                margin={{ top: 20, right: 10, left: 0, bottom: 40 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888822" />
                                                <XAxis
                                                    dataKey="label"
                                                    angle={-45}
                                                    textAnchor="end"
                                                    interval={0}
                                                    height={80}
                                                    tick={{ fontSize: 9, fontWeight: 'bold', fill: '#888' }}
                                                    dy={10}
                                                />
                                                <YAxis
                                                    domain={[0, 100]}
                                                    ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
                                                    tick={{ fontSize: 9, fill: '#888' }}
                                                    tickFormatter={(val) => `${val}`}
                                                    width={35}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        borderRadius: '12px',
                                                        border: 'none',
                                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                                                        fontSize: '11px',
                                                        fontWeight: 'bold',
                                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                        backdropFilter: 'blur(4px)'
                                                    }}
                                                    cursor={{ fill: '#f5f5f5' }}
                                                />
                                                <Bar dataKey="min" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={12} fillOpacity={0.8} />
                                                <Bar dataKey="avg" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} fillOpacity={0.8} />
                                                <Bar dataKey="max" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={12} fillOpacity={0.8} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="mt-0 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-neutral-100 dark:border-neutral-800 pt-4">
                                     <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
                                         <div className="flex items-center gap-1.5">
                                             <div className="w-3 h-3 rounded-full bg-ef4444 shadow-sm shadow-red-500/20" style={{ backgroundColor: '#ef4444' }}></div>
                                             <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Skor Terendah</span>
                                         </div>
                                         <div className="flex items-center gap-1.5">
                                             <div className="w-3 h-3 rounded-full bg-3b82f6 shadow-sm shadow-blue-500/20" style={{ backgroundColor: '#3b82f6' }}></div>
                                             <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Rerata Club</span>
                                         </div>
                                         <div className="flex items-center gap-1.5">
                                             <div className="w-3 h-3 rounded-full bg-22c55e shadow-sm shadow-green-500/20" style={{ backgroundColor: '#22c55e' }}></div>
                                             <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Skor Tertinggi</span>
                                         </div>
                                     </div>
                                     <p className="text-[10px] italic text-neutral-400">Value Skor 0-100</p>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* PPA Card Section */}
                    {(!isAllDojos || isSuperAdmin) && (
                        <div className="mt-16 sm:mt-24 animate-fade-in-up fill-both" style={{ animationDelay: '400ms' }}>
                            <div className="flex items-center justify-between mb-4 px-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-athlix-red"></div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500">Program Peningkatan Atlet (PPA)</h3>
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Jadwal & Strategi Performa</div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <Card className="lg:col-span-1 border-neutral-200/80 dark:border-neutral-800 p-6 flex flex-col justify-between overflow-hidden relative">
                                    {dojos.find(d => String(d.id) === String(selectedDojoId))?.ppa_file_path && (
                                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -z-10"></div>
                                    )}

                                    <div className="space-y-6">
                                        {/* Status Header */}
                                        <div className={`p-4 rounded-2xl border transition-all duration-300 flex items-center gap-4 ${
                                            dojos.find(d => String(d.id) === String(selectedDojoId))?.ppa_file_path
                                                ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400'
                                                : 'bg-amber-50/50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/50 text-amber-700 dark:text-amber-400'
                                        }`}>
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                                                dojos.find(d => String(d.id) === String(selectedDojoId))?.ppa_file_path
                                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                                    : 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                                            }`}>
                                                {dojos.find(d => String(d.id) === String(selectedDojoId))?.ppa_file_path ? <Zap size={24} /> : <AlertCircle size={24} />}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Status PPA</p>
                                                <p className="font-bold text-sm tracking-tight">
                                                    {dojos.find(d => String(d.id) === String(selectedDojoId))?.ppa_file_path
                                                        ? 'Sudah Diupload'
                                                        : 'Belum Diupload'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* File Metadata if exists */}
                                        {(() => {
                                            const doc = dojos.find(d => String(d.id) === String(selectedDojoId));
                                            if (!doc?.ppa_file_path) return null;
                                            return (
                                                <div className="space-y-3 animate-fade-in">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Nama File</span>
                                                        <div className="flex items-center gap-2 text-sm font-bold truncate p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
                                                            <FileText size={14} className="text-athlix-red shrink-0" />
                                                            <span className="truncate">{doc.ppa_file_name || doc.ppa_file_path.split('/').pop()}</span>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Ukuran</span>
                                                            <div className="text-xs font-bold px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
                                                                {doc.ppa_file_size ? `${(doc.ppa_file_size / 1024).toFixed(1)} KB` : '-'}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Update</span>
                                                            <div className="text-xs font-bold px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 truncate">
                                                                {doc.ppa_uploaded_at ? new Date(doc.ppa_uploaded_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '-'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        <form onSubmit={handlePpaUpload} className="space-y-4 pt-2 border-t border-dashed border-neutral-200 dark:border-neutral-800">
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <InputLabel htmlFor="ppa_file" value="Unggah Update PPA" className="text-[10px] font-black uppercase tracking-widest text-neutral-400" />
                                                    {ppaData.ppa_file && <span className="text-[10px] font-bold text-athlix-red italic animate-pulse sr-only">File Selected</span>}
                                                </div>
                                                <div className="mt-1 flex items-center justify-center w-full">
                                                    <label htmlFor="ppa_file" className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-neutral-300 rounded-2xl cursor-pointer bg-neutral-50 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 transition-all hover:border-athlix-red group">
                                                        <div className="flex flex-col items-center justify-center">
                                                            <FileUp className="w-5 h-5 mb-2 text-neutral-400 group-hover:text-athlix-red transition-colors" />
                                                            <p className="text-[10px] text-neutral-500 font-bold tracking-tight">Drop atau Klik Update</p>
                                                        </div>
                                                        <input
                                                            id="ppa_file"
                                                            type="file"
                                                            className="hidden"
                                                            accept=".pdf,.xlsx,.xls"
                                                            onChange={(e) => {
                                                                const file = e.target.files[0];
                                                                setPpaData('ppa_file', file);
                                                                if (file && file.type === 'application/pdf') {
                                                                    setPpaPreview(URL.createObjectURL(file));
                                                                } else {
                                                                    setPpaPreview(null);
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                </div>
                                                {ppaData.ppa_file && (
                                                    <div className="mt-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 flex items-center justify-between">
                                                        <span className="text-[10px] font-bold text-blue-600 truncate max-w-[200px]">{ppaData.ppa_file.name}</span>
                                                        <button type="button" onClick={() => { setPpaData('ppa_file', null); setPpaPreview(null); }} className="text-blue-600 hover:text-blue-800"><X size={14}/></button>
                                                    </div>
                                                )}
                                                <InputError message={ppaErrors.ppa_file} className="mt-2" />
                                            </div>

                                            <Button
                                                type="submit"
                                                className={`w-full h-11 transition-all rounded-xl font-black uppercase tracking-widest gap-2 ${
                                                    ppaData.ppa_file ? 'bg-athlix-red text-white shadow-lg shadow-athlix-red/20' : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                                                }`}
                                                disabled={ppaProcessing || !ppaData.ppa_file}
                                            >
                                                <Plus size={16} />
                                                {ppaProcessing ? 'Mengirim...' : 'Submit'}
                                            </Button>
                                        </form>
                                    </div>

                                    {dojos.find(d => String(d.id) === String(selectedDojoId))?.ppa_file_path && (
                                        <div className="pt-6 mt-6 border-t border-neutral-100 dark:border-neutral-800">
                                            <a
                                                href={`/storage/${dojos.find(d => String(d.id) === String(selectedDojoId))?.ppa_file_path}`}
                                                target="_blank"
                                                className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
                                            >
                                                <Download size={14} /> Download PPA
                                            </a>
                                        </div>
                                    )}
                                </Card>

                                <Card className="lg:col-span-2 border-neutral-200/80 dark:border-neutral-800 overflow-hidden relative min-h-[400px]">
                                    <div className="absolute inset-0 flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 -z-10">
                                        <div className="text-center space-y-4 animate-pulse">
                                            <div className="w-20 h-20 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto">
                                                <FileText size={40} className="text-neutral-300 dark:text-neutral-700" />
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Menyusun Pratinjau...</p>
                                        </div>
                                    </div>
                                    {ppaPreview ? (
                                        <div className="w-full h-full min-h-[500px] overflow-auto touch-auto">
                                            <iframe
                                                src={ppaPreview}
                                                className="w-full h-full border-none min-h-[600px] lg:min-h-[500px] animate-fade-in"
                                                title="PPA Preview"
                                                scrolling="auto"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                                            <div className="p-6 rounded-3xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
                                                <AlertCircle size={48} className="mx-auto text-neutral-400 mb-4" />
                                                <p className="text-sm font-bold text-neutral-500 italic max-w-[250px]">PPA belum diunggah atau format tidak mendukung pratinjau langsung.</p>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Modal Tambah / Edit */}
            <Modal show={isModalOpen} onClose={closeModal} maxWidth="2xl">
                <div className="p-6 max-h-[85vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black uppercase tracking-tighter">
                            {editingProgram ? 'Edit Program Latihan' : 'Tambah Program Baru'}
                        </h3>
                        <button onClick={closeModal} className="text-neutral-400 hover:text-neutral-600 p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={submit} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="col-span-1 sm:col-span-2">
                                <InputLabel htmlFor="title" value="Template Program" />
                                <TextInput
                                    id="title"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="Masukkan nama program"
                                    required
                                />

                            </div>

                            {isSuperAdmin && dojos.length > 0 && (
                                <div className="col-span-1 sm:col-span-2">
                                    <InputLabel htmlFor="dojo_id" value="Dojo" />
                                    <DbSelect
                                        inputId="training-programs-dojo-form"
                                        className="mt-1"
                                        options={dojoOptions}
                                        value={data.dojo_id || ''}
                                        placeholder="Pilih Club"
                                        onChange={(next) => setData('dojo_id', next)}
                                    />
                                    <InputError message={errors.dojo_id} className="mt-2" />
                                </div>
                            )}

                            <div>
                                <InputLabel htmlFor="day" value="Hari" />
                                <DbSelect
                                    className="mt-1"
                                    inputId="day"
                                    value={data.day}
                                    options={days.map(d => ({ value: d, label: d }))}
                                    onChange={(value) => setData('day', value)}
                                    placeholder="Pilih Hari"
                                />
                                <InputError message={errors.day} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="type" value="Tipe Latihan" />
                                <DbSelect
                                    className="mt-1"
                                    inputId="type"
                                    value={data.type}
                                    options={[
                                        { value: 'fisik', label: 'Fisik' },
                                        { value: 'teknik umum', label: 'Teknik Umum' },
                                        { value: 'teknik khusus', label: 'Teknik Khusus' },
                                    ]}
                                    onChange={(value) => setData('type', value)}
                                    placeholder="Pilih Tipe Latihan"
                                />
                                <InputError message={errors.type} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="start_time" value="Jam Mulai" />
                                <TextInput id="start_time" type="time" className="mt-1 block w-full" value={data.start_time} onChange={(e) => setData('start_time', e.target.value)} required />
                                <InputError message={errors.start_time} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="end_time" value="Jam Selesai" />
                                <TextInput id="end_time" type="time" className="mt-1 block w-full" value={data.end_time} onChange={(e) => setData('end_time', e.target.value)} required />
                                <InputError message={errors.end_time} className="mt-2" />
                            </div>

                            <div className="col-span-1 sm:col-span-2">
                                <InputLabel htmlFor="coach_name" value="Pelatih" />
                                <DbSelect
                                    inputId="coach_name"
                                    className="mt-1"
                                    options={coachSelectOptions}
                                    value={data.coach_name}
                                    onChange={(next) => setData('coach_name', next)}
                                    placeholder="Pilih pelatih"
                                />
                                <InputError message={errors.coach_name} className="mt-2" />
                            </div>


                            <div className="col-span-1 sm:col-span-2">
                                <InputLabel htmlFor="description" value="Keterangan Umum" />
                                <textarea id="description" className="mt-1 block w-full border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 focus:border-athlix-red focus:ring-athlix-red rounded-xl shadow-sm text-sm" rows="3" value={data.description} onChange={(e) => setData('description', e.target.value)}></textarea>
                                <InputError message={errors.description} className="mt-2" />
                            </div>
                        </div>

                        <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black uppercase tracking-widest text-neutral-500">Child Agenda (Detail Sesi)</h4>
                                <Button type="button" size="sm" variant="outline" onClick={addAgendaItem}>
                                    <Plus size={14} className="mr-1" />Tambah Detail
                                </Button>
                            </div>

                            {data.agenda_items.length === 0 && (
                                <p className="text-xs text-neutral-500">Belum ada detail. Contoh: 08:00-08:15 Briefing, 08:15-08:30 Stretching.</p>
                            )}

                            <div className="space-y-3">
                                {data.agenda_items.map((item, idx) => (
                                    <div key={`agenda-${idx}`} className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3 space-y-2">
                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                            <TextInput type="time" value={item.start_time} onChange={(e) => updateAgendaItem(idx, 'start_time', e.target.value)} />
                                            <TextInput type="time" value={item.end_time} onChange={(e) => updateAgendaItem(idx, 'end_time', e.target.value)} />
                                            {!agendaTitleTemplates.filter(t => t !== 'Other/Lainnya').includes(item.title) && item.title !== '' ? (
                                                <div className="relative group sm:col-span-1">
                                                    <TextInput
                                                        className="w-full text-sm pr-8"
                                                        placeholder="Custom Agenda..."
                                                        value={item.title === 'Other/Lainnya' ? '' : item.title}
                                                        onChange={(e) => updateAgendaItem(idx, 'title', e.target.value)}
                                                        autoFocus={item.title === 'Other/Lainnya'}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => updateAgendaItem(idx, 'title', agendaTitleTemplates[0])}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-athlix-red"
                                                        title="Pilih dari template"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <DbSelect
                                                    inputId={`agenda-title-${idx}`}
                                                    className="w-full text-sm min-w-[150px] sm:col-span-1"
                                                    value={item.title}
                                                    options={agendaTitleTemplates.map((agendaTitle) => (
                                                        { value: agendaTitle, label: agendaTitle }
                                                    ))}
                                                    onChange={(val) => updateAgendaItem(idx, 'title', val)}
                                                    placeholder="Pilih Detail Sesi"
                                                />
                                            )}
                                            <button type="button" onClick={() => removeAgendaItem(idx)} className="rounded-lg border border-red-200 text-red-600 text-xs font-bold">Hapus</button>
                                        </div>
                                        <textarea
                                            className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
                                            rows="2"
                                            placeholder="Catatan detail (opsional)"
                                            value={item.description}
                                            onChange={(e) => updateAgendaItem(idx, 'description', e.target.value)}
                                        />
                                        {(errors[`agenda_items.${idx}.start_time`] || errors[`agenda_items.${idx}.end_time`] || errors[`agenda_items.${idx}.title`]) && (
                                            <p className="text-xs text-red-600">
                                                {errors[`agenda_items.${idx}.start_time`] || errors[`agenda_items.${idx}.end_time`] || errors[`agenda_items.${idx}.title`]}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {errors.confirm_overlap && (
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-xl mb-4 animate-fade-in-up">
                                <p className="text-sm text-amber-800 dark:text-amber-200 font-bold mb-2 flex items-start gap-2">
                                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                    <span>{errors.confirm_overlap}</span>
                                </p>
                                <div className="flex gap-2 pl-6">
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            clearErrors('confirm_overlap');
                                            setData('force_overlap', true);
                                        }}
                                        className="bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white text-xs h-8"
                                    >
                                        Ya, Saya Yakin
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            clearErrors('confirm_overlap');
                                            setData('force_overlap', false);
                                        }}
                                        className="text-xs h-8"
                                    >
                                        Batal
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-end mt-6 gap-3">
                            <Button type="button" variant="outline" onClick={closeModal} className="text-xs font-bold uppercase tracking-widest">
                                Batal
                            </Button>
                            <Button type="submit" className="text-xs font-black uppercase tracking-widest" disabled={processing}>
                                {processing ? 'Menyimpan...' : (data.force_overlap ? 'Simpan dengan Paksa' : 'Simpan Program')}
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Detail Program Modal */}
            <Modal show={!!detailModal} onClose={() => setDetailModal(null)} maxWidth="lg">
                {detailModal && (
                    <div className="p-6 space-y-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider text-white ${typeColors[detailModal.type] || 'bg-blue-500'}`}>
                                        {detailModal.type}
                                    </span>
                                </div>
                                <h3 className="text-xl font-black tracking-tight">{detailModal.title}</h3>
                            </div>
                            <button onClick={() => setDetailModal(null)} className="shrink-0 p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 p-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Hari</p>
                                <p className="font-bold text-sm">{detailModal.day}</p>
                            </div>
                            <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 p-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Tanggal Terdekat</p>
                                <p className="font-bold text-sm">{detailModal.next_date}</p>
                            </div>
                            <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 p-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Jam</p>
                                <p className="font-mono font-bold text-athlix-red text-sm">{detailModal.time}</p>
                            </div>
                            <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 p-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Pelatih</p>
                                <p className="font-bold text-sm">{detailModal.coach || '-'}</p>
                            </div>
                            {isAllDojos && detailModal.dojo_name && (
                                <div className="col-span-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 p-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">Club</p>
                                    <p className="font-bold text-sm text-blue-600 dark:text-blue-300 flex items-center gap-1.5">
                                        <MapPin size={13} />
                                        {detailModal.dojo_name}
                                    </p>
                                </div>
                            )}
                        </div>

                        {detailModal.desc && (
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">{detailModal.desc}</p>
                        )}

                        {(detailModal.agenda_items || []).length > 0 ? (
                            <div className="space-y-2">
                                <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Detail Agenda</p>
                                {detailModal.agenda_items.map((item, idx) => (
                                    <div key={idx} className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3 bg-neutral-50/70 dark:bg-neutral-900/40">
                                        <p className="font-mono font-bold text-athlix-red text-xs">{item.start_time} – {item.end_time}</p>
                                        <p className="font-semibold text-sm mt-0.5">{item.title}</p>
                                        {item.description && <p className="text-xs text-neutral-500 mt-1">{item.description}</p>}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-neutral-400 italic">Belum ada detail agenda untuk sesi ini.</p>
                        )}

                        <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                            <Button variant="outline" onClick={() => setDetailModal(null)}>Tutup</Button>
                            <Button
                                className="bg-athlix-red hover:bg-red-700 text-white"
                                onClick={() => { setDetailModal(null); openModal(detailModal); }}
                            >
                                <Pencil size={14} className="mr-1.5" /> Edit Program
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal Konfirmasi Hapus */}
            <Modal show={!!deleteConfirmId} onClose={cancelDelete} maxWidth="sm">
                <div className="p-6 space-y-5">
                    <div className="flex items-start gap-4">
                        <div className="shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <Trash2 size={22} className="text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-black uppercase tracking-tighter text-neutral-900 dark:text-neutral-100">
                                Hapus Program
                            </h3>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed">
                                Apakah Anda yakin ingin menghapus program latihan ini? Tindakan ini tidak dapat dibatalkan.
                            </p>
                        </div>
                        <button
                            onClick={cancelDelete}
                            className="shrink-0 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={cancelDelete}
                            className="text-xs font-bold uppercase tracking-widest"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={confirmDelete}
                            disabled={processing}
                            className="text-xs font-black uppercase tracking-widest bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 transition-all active:scale-95"
                        >
                            {processing ? 'Menghapus...' : 'Ya, Hapus'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}

function addMinutesToTime(time, minutes) {
    if (!time || !time.includes(':')) return '';

    const [hourRaw, minuteRaw] = time.split(':');
    const hour = Number(hourRaw);
    const minute = Number(minuteRaw);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return '';

    const total = (hour * 60) + minute + minutes;
    const normalized = ((total % (24 * 60)) + (24 * 60)) % (24 * 60);
    const nextHour = String(Math.floor(normalized / 60)).padStart(2, '0');
    const nextMinute = String(normalized % 60).padStart(2, '0');

    return `${nextHour}:${nextMinute}`;
}
