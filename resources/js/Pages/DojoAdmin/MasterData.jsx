import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Card, CardHeader, CardTitle, CardContent
} from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import Modal from '@/Components/Modal';
import DbSelect from '@/Components/DbSelect';
import {
    Plus, Pencil, Trash2, X, Loader2, Layers, Target, ChevronRight
} from 'lucide-react';

export default function MasterData({ auth, levels, specializations, dojos = [], selectedDojoId = '' }) {
    const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
    const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
    const [editingLevel, setEditingLevel] = useState(null);
    const [editingSpec, setEditingSpec] = useState(null);
    const [dojoId, setDojoId] = useState(selectedDojoId || '');

    // Confirmation Modal state
    const [confirmModal, setConfirmModal] = useState({
        open: false,
        title: '',
        message: '',
        onConfirm: () => {},
    });

    const levelForm = useForm({
        name: '',
        order_level: 0,
        color_hex: '#ef4444',
        dojo_id: dojoId,
    });

    const specForm = useForm({
        name: '',
        dojo_id: dojoId,
    });

    const openLevelModal = (level = null) => {
        setEditingLevel(level);
        if (level) {
            levelForm.setData({
                name: level.name,
                order_level: level.order_level,
                color_hex: level.color_hex || '#ef4444',
                dojo_id: level.dojo_id,
            });
        } else {
            levelForm.reset();
            levelForm.setData('dojo_id', dojoId);
        }
        setIsLevelModalOpen(true);
    };

    const openSpecModal = (spec = null) => {
        setEditingSpec(spec);
        if (spec) {
            specForm.setData({ 
                name: spec.name,
                dojo_id: spec.dojo_id,
            });
        } else {
            specForm.reset();
            specForm.setData('dojo_id', dojoId);
        }
        setIsSpecModalOpen(true);
    };

    const handleLevelSubmit = (e) => {
        e.preventDefault();
        if (editingLevel) {
            levelForm.patch(route('levels.update', editingLevel.id), {
                onSuccess: () => setIsLevelModalOpen(false),
            });
        } else {
            levelForm.post(route('levels.store'), {
                onSuccess: () => setIsLevelModalOpen(false),
            });
        }
    };

    const handleSpecSubmit = (e) => {
        e.preventDefault();
        if (editingSpec) {
            specForm.patch(route('specializations.update', editingSpec.id), {
                onSuccess: () => setIsSpecModalOpen(false),
            });
        } else {
            specForm.post(route('specializations.store'), {
                onSuccess: () => setIsSpecModalOpen(false),
            });
        }
    };

    const deleteLevel = (id) => {
        setConfirmModal({
            open: true,
            title: 'Hapus Level',
            message: 'Apakah Anda yakin ingin menghapus level ini?',
            onConfirm: () => {
                router.delete(route('levels.destroy', id), {
                    onSuccess: () => setConfirmModal(p => ({ ...p, open: false }))
                });
            }
        });
    };

    const deleteSpec = (id) => {
        setConfirmModal({
            open: true,
            title: 'Hapus Spesialisasi',
            message: 'Apakah Anda yakin ingin menghapus spesialisasi ini?',
            onConfirm: () => {
                router.delete(route('specializations.destroy', id), {
                    onSuccess: () => setConfirmModal(p => ({ ...p, open: false }))
                });
            }
        });
    };

    const handleDojoFilterChange = (next) => {
        setDojoId(next);
        router.get(route('master-data.index'), next ? { dojo_id: next } : {}, { preserveScroll: true });
    };

    return (
        <AdminLayout
            user={auth.user}
            header={<h2 className="text-xl font-bold leading-tight text-neutral-800">Master Data Club</h2>}
        >
            <Head title="Master Data" />

            <div className="py-6 sm:py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">

                    {/* Club Selector for Super Admin */}
                    {dojos.length > 0 && (
                        <Card className="border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden bg-neutral-50/50 dark:bg-neutral-900/50">
                            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest">Filter Club</h3>
                                    <p className="text-xs text-neutral-400 italic">Pilih club untuk mengelola Master Data mereka.</p>
                                </div>
                                <DbSelect
                                    inputId="master-data-dojo-filter"
                                    className="w-full sm:w-[300px]"
                                    options={dojos.map((dojo) => ({ value: String(dojo.id), label: dojo.name }))}
                                    value={dojoId || ''}
                                    placeholder="Pilih Club/Dojo..."
                                    onChange={handleDojoFilterChange}
                                />
                            </CardContent>
                        </Card>
                    )}

                    {!dojoId && auth.user.role === 'super_admin' ? (
                        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-neutral-900 rounded-3xl border border-dashed border-neutral-200 dark:border-neutral-800 space-y-4">
                            <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-full text-neutral-400">
                                <Layers size={48} />
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-bold">Silakan Pilih Club</h3>
                                <p className="text-sm text-neutral-500 max-w-sm mx-auto">Untuk dapat mengelola Master Data seperti Level dan Spesialisasi, silakan pilih club yang diinginkan terlebih dahulu melalui dropdown di atas.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in-up">

                            {/* Levels Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-athlix-red">
                                            <Layers size={20} />
                                        </div>
                                        <h3 className="text-lg font-bold">Daftar Level</h3>
                                    </div>
                                    <Button onClick={() => openLevelModal()} className="bg-athlix-red font-bold">
                                        <Plus className="mr-2 h-4 w-4" /> Tambah Level
                                    </Button>
                                </div>

                                <Card className="border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {levels.map((level) => (
                                            <div key={level.id} className="p-4 flex items-center justify-between hover:bg-neutral-50/50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className="w-4 h-4 rounded-full shadow-inner"
                                                        style={{ backgroundColor: level.color_hex || '#ef4444' }}
                                                    ></div>
                                                    <div>
                                                        <p className="font-bold text-neutral-900">{level.name}</p>
                                                        <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Order: {level.order_level}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="sm" onClick={() => openLevelModal(level)} className="text-blue-600 hover:bg-blue-50">
                                                        <Pencil size={14} />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => deleteLevel(level.id)} className="text-red-500 hover:bg-red-50">
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                        {levels.length === 0 && (
                                            <div className="p-8 text-center text-neutral-400 italic">Belum ada data level.</div>
                                        )}
                                    </div>
                                </Card>
                            </div>

                            {/* Specializations Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                                            <Target size={20} />
                                        </div>
                                        <h3 className="text-lg font-bold">Daftar Spesialisasi</h3>
                                    </div>
                                    <Button onClick={() => openSpecModal()} className="bg-blue-600 hover:bg-blue-700 font-bold">
                                        <Plus className="mr-2 h-4 w-4" /> Tambah Spesialisasi
                                    </Button>
                                </div>

                                <Card className="border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {specializations.map((spec) => (
                                            <div key={spec.id} className="p-4 flex items-center justify-between hover:bg-neutral-50/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                                                        <ChevronRight size={16} />
                                                    </div>
                                                    <p className="font-bold text-neutral-900">{spec.name}</p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="sm" onClick={() => openSpecModal(spec)} className="text-blue-600 hover:bg-blue-50">
                                                        <Pencil size={14} />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => deleteSpec(spec.id)} className="text-red-500 hover:bg-red-50">
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                        {specializations.length === 0 && (
                                            <div className="p-8 text-center text-neutral-400 italic">Belum ada data spesialisasi.</div>
                                        )}
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Level Modal */}
            <Modal show={isLevelModalOpen} onClose={() => setIsLevelModalOpen(false)} maxWidth="md">
                <form onSubmit={handleLevelSubmit} className="p-6 space-y-4">
                    <div className="flex items-center justify-between border-b pb-4">
                        <h3 className="font-bold text-lg">{editingLevel ? 'Edit Level' : 'Tambah Level Baru'}</h3>
                        <button type="button" onClick={() => setIsLevelModalOpen(false)} className="text-neutral-400 hover:text-neutral-600"><X size={20} /></button>
                    </div>

                    <div className="space-y-4 py-2">
                        {auth.user.role === 'super_admin' && !editingLevel && (
                             <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200/50 space-y-1 mb-4">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Mendaftarkan ke Dojo ID</label>
                                <Input disabled value={dojoId} className="h-8 bg-neutral-100" />
                                <p className="text-[9px] text-neutral-400">Master data akan didaftarkan ke Dojo yang sedang difilter.</p>
                             </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Nama Level</label>
                            <Input
                                value={levelForm.data.name}
                                onChange={e => levelForm.setData('name', e.target.value)}
                                placeholder="Contoh: Sabtu Putih, Level 1, dsb"
                                required
                            />
                            {levelForm.errors.name && <p className="text-xs text-red-500">{levelForm.errors.name}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Urutan (Order)</label>
                                <Input
                                    type="number"
                                    value={levelForm.data.order_level}
                                    onChange={e => levelForm.setData('order_level', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Warna (Hex)</label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        className="w-12 h-10 p-1"
                                        value={levelForm.data.color_hex}
                                        onChange={e => levelForm.setData('color_hex', e.target.value)}
                                    />
                                    <Input
                                        value={levelForm.data.color_hex}
                                        onChange={e => levelForm.setData('color_hex', e.target.value)}
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t gap-3">
                        <Button type="button" variant="ghost" onClick={() => setIsLevelModalOpen(false)}>Batal</Button>
                        <Button type="submit" className="bg-athlix-red font-bold" disabled={levelForm.processing}>
                            {levelForm.processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan Level
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Specialization Modal */}
            <Modal show={isSpecModalOpen} onClose={() => setIsSpecModalOpen(false)} maxWidth="md">
                <form onSubmit={handleSpecSubmit} className="p-6 space-y-4">
                    <div className="flex items-center justify-between border-b pb-4">
                        <h3 className="font-bold text-lg">{editingSpec ? 'Edit Spesialisasi' : 'Tambah Spesialisasi'}</h3>
                        <button type="button" onClick={() => setIsSpecModalOpen(false)} className="text-neutral-400 hover:text-neutral-600"><X size={20} /></button>
                    </div>

                    <div className="space-y-4 py-4">
                        {auth.user.role === 'super_admin' && !editingSpec && (
                             <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200/50 space-y-1 mb-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Mendaftarkan ke Dojo ID</label>
                                <Input disabled value={dojoId} className="h-8 bg-neutral-100" />
                             </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Nama Spesialisasi</label>
                            <Input
                                value={specForm.data.name}
                                onChange={e => specForm.setData('name', e.target.value)}
                                placeholder="Contoh: Kata, Kumite, dsb"
                                required
                            />
                            {specForm.errors.name && <p className="text-xs text-red-500">{specForm.errors.name}</p>}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t gap-3">
                        <Button type="button" variant="ghost" onClick={() => setIsSpecModalOpen(false)}>Batal</Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 font-bold" disabled={specForm.processing}>
                            {specForm.processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Confirmation Modal */}
            <Modal show={confirmModal.open} onClose={() => setConfirmModal(p => ({ ...p, open: false }))} maxWidth="sm">
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3 text-red-600">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <Trash2 size={24} />
                        </div>
                        <h3 className="font-black text-lg uppercase tracking-tight">{confirmModal.title}</h3>
                    </div>
                    
                    <p className="text-sm text-neutral-600 leading-relaxed font-medium">
                        {confirmModal.message}
                    </p>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={() => setConfirmModal(p => ({ ...p, open: false }))} className="font-bold">
                            Batal
                        </Button>
                        <Button onClick={confirmModal.onConfirm} className="bg-red-600 hover:bg-red-700 text-white font-bold px-6">
                            Ya, Hapus
                        </Button>
                    </div>
                </div>
            </Modal>

        </AdminLayout>
    );
}
