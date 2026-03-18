import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm } from '@inertiajs/react';
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
    X 
} from 'lucide-react';
import { useState } from 'react';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';

export default function Index({ auth, weeklySchedule }) {
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProgram, setEditingProgram] = useState(null);

    const { data, setData, post, patch, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        title: '',
        day: 'Senin',
        start_time: '08:00',
        end_time: '10:00',
        coach_name: '',
        type: 'teknik',
        description: '',
    });

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
            });
        } else {
            setEditingProgram(null);
            reset();
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

    return (
        <AdminLayout
            user={auth.user}
            header={<h2 className="text-xl font-bold tracking-tight uppercase">Jadwal Latihan Dojo</h2>}
        >
            <Head title="Program Latihan" />

            <div className="py-6 space-y-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
                    
                    {/* Action Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
                        <div>
                            <p className="text-sm font-bold uppercase tracking-widest text-neutral-500">Program Mingguan</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button 
                                onClick={() => openModal()}
                                className="h-10 px-6 rounded-xl font-black uppercase tracking-widest gap-2 bg-athlix-red hover:bg-red-700 text-white shadow-lg shadow-athlix-red/20 transition-all active:scale-95"
                            >
                                <Plus size={16} /> 
                                <span className="hidden sm:inline">Tambah Program</span>
                                <span className="sm:hidden">Tambah</span>
                            </Button>
                        </div>
                    </div>

                    {/* Desktop: 7 columns, Mobile: vertical stack + horizontal scroll */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 pt-2">
                        {days.map((day, dayIdx) => (
                            <div key={day} className="space-y-3 animate-fade-in-up fill-both" style={{ animationDelay: `${dayIdx * 60}ms` }}>
                                <div className="flex items-center gap-2 px-2">
                                    <div className="w-2 h-2 rounded-full bg-athlix-red animate-pulse"></div>
                                    <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500">{day}</h3>
                                </div>
                                
                                <div className="space-y-3">
                                    {weeklySchedule[day] && weeklySchedule[day].length > 0 ? (
                                        weeklySchedule[day].map((p, i) => (
                                            <Card key={p.id} className="border-neutral-200/80 dark:border-neutral-800 group hover:border-athlix-red/30 transition-all duration-300 overflow-hidden relative card-hover">
                                                <div className={`h-1 w-full ${typeColors[p.type] || 'bg-blue-500'} transition-all duration-300 group-hover:h-1.5`}></div>
                                                
                                                {/* Action Buttons Overlay */}
                                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
                                                    <button 
                                                        onClick={() => openModal(p)}
                                                        className="p-1.5 rounded-lg bg-white/90 dark:bg-neutral-900/90 text-neutral-500 hover:text-athlix-red shadow-sm border border-neutral-100 dark:border-neutral-800 transition-colors active:scale-95"
                                                    >
                                                        <Pencil size={12} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(p.id)}
                                                        className="p-1.5 rounded-lg bg-white/90 dark:bg-neutral-900/90 text-neutral-500 hover:text-red-600 shadow-sm border border-neutral-100 dark:border-neutral-800 transition-colors active:scale-95"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>

                                                <CardContent className="p-3 sm:p-4 space-y-3">
                                                    <div>
                                                        <h4 className="text-xs font-bold leading-tight group-hover:text-athlix-red transition-colors pr-10">{p.title}</h4>
                                                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-neutral-500 font-mono">
                                                            <Clock size={12} />
                                                            {p.time}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="space-y-1.5 pt-2 border-t border-neutral-50 dark:border-neutral-800">
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-700 dark:text-neutral-300">
                                                            <User size={12} className="text-athlix-red" />
                                                            {p.coach}
                                                        </div>
                                                        <span className={`inline-block px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter text-white ${typeColors[p.type] || 'bg-blue-500'}`}>
                                                            {p.type}
                                                        </span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    ) : (
                                        <div className="p-4 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 text-[10px] text-neutral-400 italic text-center bg-neutral-50/50 dark:bg-neutral-900/30">
                                            Libur / Mandiri
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Bottom CTA Card */}
                    <Card className="mt-8 sm:mt-12 border-none bg-athlix-red text-white overflow-hidden relative animate-fade-in-up fill-both" style={{ animationDelay: '400ms' }}>
                        <div className="absolute top-0 right-0 p-8 sm:p-12 opacity-10 rotate-12">
                            <Dumbbell size={120} className="sm:w-[160px] sm:h-[160px]" />
                        </div>
                        <CardContent className="p-8 sm:p-12 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
                            <div className="space-y-2 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                                    <div className="p-2 rounded-xl bg-white/20">
                                        <CalendarDays size={20} />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest">Agenda Dojo</span>
                                </div>
                                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter">Sinkronisasi Jadwal</h3>
                                <p className="text-sm text-white/70 max-w-md">Jadwal latihan ini disinkronkan langsung dengan aplikasi PWA atlet untuk notifikasi kehadiran otomatis.</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 min-w-[180px] text-center shimmer">
                                <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60">Status Dojo</p>
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></div>
                                    <span className="text-xl font-black">AKTIF</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* CRUD Modal */}
            <Modal show={isModalOpen} onClose={closeModal} maxWidth="md">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black uppercase tracking-tighter">
                            {editingProgram ? 'Edit Program Latihan' : 'Tambah Program Baru'}
                        </h3>
                        <button onClick={closeModal} className="text-neutral-400 hover:text-neutral-600 p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="col-span-1 sm:col-span-2">
                                <InputLabel htmlFor="title" value="Nama Program" />
                                <TextInput id="title" type="text" className="mt-1 block w-full" value={data.title} onChange={(e) => setData('title', e.target.value)} required />
                                <InputError message={errors.title} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="day" value="Hari" />
                                <select id="day" className="mt-1 block w-full border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 focus:border-athlix-red focus:ring-athlix-red rounded-xl shadow-sm text-sm" value={data.day} onChange={(e) => setData('day', e.target.value)} required>
                                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <InputError message={errors.day} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="type" value="Tipe Latihan" />
                                <select id="type" className="mt-1 block w-full border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 focus:border-athlix-red focus:ring-athlix-red rounded-xl shadow-sm text-sm" value={data.type} onChange={(e) => setData('type', e.target.value)} required>
                                    <option value="teknik">Teknik (Kihon)</option>
                                    <option value="kata">Kata</option>
                                    <option value="kumite">Kumite</option>
                                    <option value="fisik">Fisik</option>
                                </select>
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
                                <InputLabel htmlFor="coach_name" value="Nama Pelatih / Sensei" />
                                <TextInput id="coach_name" type="text" className="mt-1 block w-full" value={data.coach_name} onChange={(e) => setData('coach_name', e.target.value)} required />
                                <InputError message={errors.coach_name} className="mt-2" />
                            </div>

                            <div className="col-span-1 sm:col-span-2">
                                <InputLabel htmlFor="description" value="Keterangan (Opsional)" />
                                <textarea id="description" className="mt-1 block w-full border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 focus:border-athlix-red focus:ring-athlix-red rounded-xl shadow-sm text-sm" rows="3" value={data.description} onChange={(e) => setData('description', e.target.value)}></textarea>
                                <InputError message={errors.description} className="mt-2" />
                            </div>
                        </div>

                        <div className="flex items-center justify-end mt-6 gap-3">
                            <Button type="button" variant="outline" onClick={closeModal} className="text-[10px] font-bold uppercase tracking-widest">
                                Batal
                            </Button>
                            <Button type="submit" className="text-[10px] font-black uppercase tracking-widest" disabled={processing}>
                                {processing ? 'Menyimpan...' : 'Simpan Program'}
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </AdminLayout>
    );
}
