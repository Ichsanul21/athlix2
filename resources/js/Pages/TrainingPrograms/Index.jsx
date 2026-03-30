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
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import { Skeleton } from '@/Components/ui/skeleton';
import DbSelect from '@/Components/DbSelect';

export default function Index({ auth, weeklySchedule, dojos = [], selectedDojoId = null, senseis = [] }) {
    const isLoading = !weeklySchedule;
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const agendaTitleTemplates = ['Briefing', 'Pemanasan', 'Drill Teknik', 'Kumite Drill', 'Kata Session', 'Sparring', 'Pendinginan', 'Evaluasi'];
    const programTitleTemplatesByType = {
        teknik: ['Fundamental Kihon', 'Teknik Kuda-kuda', 'Teknik Timing & Distance'],
        kata: ['Kata Inti Mingguan', 'Kata Kompetisi', 'Bunkai Kata'],
        kumite: ['Kumite Speed Reaction', 'Kumite Tactical Session', 'Sparring Strategy'],
        fisik: ['Conditioning Atlet', 'Power & Agility', 'Endurance Session'],
    };
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProgram, setEditingProgram] = useState(null);
    const [detailModal, setDetailModal] = useState(null); // program object for detail view
    const [dojoId, setDojoId] = useState(selectedDojoId || '');
    const dojoOptions = useMemo(
        () => dojos.map((dojo) => ({ value: String(dojo.id), label: dojo.name })),
        [dojos]
    );

    const coachOptions = useMemo(() => {
        return senseis.map((s) => ({
            value: s.name,
            label: `${s.name} (${s.role.replace('_', ' ').toUpperCase()})`
        }));
    }, [senseis]);

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

    useEffect(() => {
        setDojoId(selectedDojoId || '');
        setData('dojo_id', selectedDojoId || '');
    }, [selectedDojoId]);

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
            setData('agenda_items', []);
            setData('dojo_id', dojoId || '');
            setData('force_overlap', false);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    const submit = (e) => {
        e.preventDefault();
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
        if (confirm('Apakah Anda yakin ingin menghapus program latihan ini?')) {
            destroy(route('training-programs.destroy', id));
        }
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

    if (isLoading) {
        return (
            <AdminLayout
                user={auth?.user}
                header={<h2 className="text-xl font-bold tracking-tight uppercase">Jadwal Latihan Dojo</h2>}
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
            header={<h2 className="text-xl font-bold tracking-tight uppercase">Jadwal Latihan Dojo</h2>}
        >
            <Head title="Program Latihan" />

            <div className="py-6 space-y-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
                        <div>
                            <p className="text-sm font-bold uppercase tracking-widest text-neutral-500">Program Mingguan</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {dojos.length > 0 && (
                                <DbSelect
                                    inputId="training-programs-dojo-filter"
                                    className="min-w-[220px]"
                                    options={dojoOptions}
                                    value={dojoId || ''}
                                    placeholder="Pilih Dojo"
                                    onChange={(next) => {
                                        setDojoId(next);
                                        setData('dojo_id', next);
                                        router.get(route('training-programs.index'), next ? { dojo_id: next } : {}, { preserveScroll: true });
                                    }}
                                />
                            )}
                            <Button
                                onClick={() => openModal()}
                                className="h-10 px-6 rounded-xl font-black uppercase tracking-widest gap-2 bg-athlix-red hover:bg-red-700 text-white shadow-lg shadow-athlix-red/20 transition-all active:scale-95"
                                disabled={dojos.length > 0 && !dojoId}
                            >
                                <Plus size={16} />
                                <span className="hidden sm:inline">Tambah Program</span>
                                <span className="sm:hidden">Tambah</span>
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 pt-2">
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


                </div>
            </div>

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
                                <DbSelect
                                    inputId="title"
                                    className="mt-1"
                                    options={titleSelectOptions}
                                    value={data.title}
                                    onChange={(next) => setData('title', next)}
                                    placeholder="Pilih template program"
                                />
                                <InputError message={errors.title} className="mt-2" />
                            </div>

                            {dojos.length > 0 && (
                                <div className="col-span-1 sm:col-span-2">
                                    <InputLabel htmlFor="dojo_id" value="Dojo" />
                                    <DbSelect
                                        inputId="training-programs-dojo-form"
                                        className="mt-1"
                                        options={dojoOptions}
                                        value={data.dojo_id || ''}
                                        placeholder="Pilih dojo"
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
                                        { value: 'teknik', label: 'Teknik (Kihon)' },
                                        { value: 'kata', label: 'Kata' },
                                        { value: 'kumite', label: 'Kumite' },
                                        { value: 'fisik', label: 'Fisik' },
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
                                <InputLabel htmlFor="coach_name" value="Pelatih / Sensei" />
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
                                <textarea id="description" className="mt-1 block w-full border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900  focus:border-athlix-red focus:ring-athlix-red rounded-xl shadow-sm text-sm" rows="3" value={data.description} onChange={(e) => setData('description', e.target.value)}></textarea>
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
                                            <DbSelect
                                                inputId={`agenda-title-${idx}`}
                                                className="w-full text-sm min-w-[150px]"
                                                value={item.title}
                                                options={Array.from(new Set([...agendaTitleTemplates, item.title || ''])).filter(Boolean).map((agendaTitle) => (
                                                    { value: agendaTitle, label: agendaTitle }
                                                ))}
                                                onChange={(val) => updateAgendaItem(idx, 'title', val)}
                                                placeholder="Pilih Detail Sesi"
                                            />
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
                                            // Optional: User has to click Save again, or we could trigger it automatically.
                                            // Letting them click generic save is safer so they see the state changed.
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
