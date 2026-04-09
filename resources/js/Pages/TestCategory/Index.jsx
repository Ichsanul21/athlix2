import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import DbSelect from '@/Components/DbSelect';
import { ClipboardList, Plus, Pencil, Trash2, X, Loader2, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

export default function TestCategoryIndex({ auth, dojos = [], selectedDojoId, categories = [], labels = [], selectedLabelId }) {
    const isSuperAdmin = auth?.user?.role === 'super_admin';

    const [catFormProcessing, setCatFormProcessing] = useState(false);
    const [catForm, setCatForm] = useState({ name: '', test_label_id: selectedLabelId });

    const [labelFormProcessing, setLabelFormProcessing] = useState(false);
    const [labelForm, setLabelForm] = useState({ name: '' });

    // ── Portal & universal modal states ──
    const [portalRoot, setPortalRoot] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', variant: 'danger' });
    const [promptModal, setPromptModal] = useState({ open: false, title: '', message: '' });
    const [testFormModal, setTestFormModal] = useState({ open: false, mode: 'add', title: 'Tambah Test Baru' });
    const [testForm, setTestForm] = useState({ name: '', unit: 'repetition', min_threshold: 0, max_threshold: 100, max_duration_seconds: '' });
    const [testFormError, setTestFormError] = useState('');
    const [promptInputValue, setPromptInputValue] = useState('');

    const confirmResolveRef = useRef(null);
    const promptResolveRef = useRef(null);
    const promptInputRef = useRef(null);
    const testFormNameRef = useRef(null);
    const testFormResolveRef = useRef(null);

    useEffect(() => {
        const el = document.createElement('div');
        el.id = 'test-cat-portal';
        document.body.appendChild(el);
        setPortalRoot(el);
        return () => { document.body.removeChild(el); };
    }, []);

    const anyOpen = confirmModal.open || promptModal.open || testFormModal.open;
    useEffect(() => {
        if (anyOpen) {
            const prev = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = prev; };
        }
    }, [anyOpen]);

    // ── Promise-based modal helpers ──
    const showConfirm = useCallback((title, message, variant = 'danger') => {
        return new Promise((resolve) => {
            confirmResolveRef.current = resolve;
            setConfirmModal({ open: true, title, message, variant });
        });
    }, []);

    const showPrompt = useCallback((title, message, defaultValue = '') => {
        return new Promise((resolve) => {
            promptResolveRef.current = resolve;
            setPromptInputValue(defaultValue);
            setPromptModal({ open: true, title, message });
        });
    }, []);

    const showTestForm = useCallback((existing = null, title = null) => {
        return new Promise((resolve) => {
            testFormResolveRef.current = resolve;
            setTestFormError('');
            if (existing) {
                setTestForm({
                    name: existing.name || '',
                    unit: existing.unit || 'repetition',
                    min_threshold: Number(existing.min_threshold) || 0,
                    max_threshold: Number(existing.max_threshold) || 100,
                    max_duration_seconds: existing.max_duration_seconds ?? '',
                });
                setTestFormModal({ open: true, mode: 'edit', title: title || 'Edit Test' });
            } else {
                setTestForm({ name: '', unit: 'repetition', min_threshold: 0, max_threshold: 100, max_duration_seconds: '' });
                setTestFormModal({ open: true, mode: 'add', title: title || 'Tambah Test Baru' });
            }
        });
    }, []);

    // ── Auto-focus ──
    useEffect(() => { if (promptModal.open) setTimeout(() => promptInputRef.current?.focus(), 200); }, [promptModal.open]);
    useEffect(() => { if (testFormModal.open) setTimeout(() => testFormNameRef.current?.focus(), 200); }, [testFormModal.open]);

    // ── Clear error when thresholds or unit change ──
    useEffect(() => { setTestFormError(''); }, [testForm.min_threshold, testForm.max_threshold, testForm.unit]);

    // ── Modal handlers ──
    const closeConfirm = (val) => { setConfirmModal(p => ({ ...p, open: false })); confirmResolveRef.current?.(val); confirmResolveRef.current = null; };
    const closePrompt = (val) => { setPromptModal(p => ({ ...p, open: false })); promptResolveRef.current?.(val); promptResolveRef.current = null; };
    const closeTestForm = (val) => { setTestFormModal({ open: false, mode: 'add', title: '' }); setTestFormError(''); testFormResolveRef.current?.(val); testFormResolveRef.current = null; };

    const handleTestFormSave = () => {
        if (!testForm.name.trim()) { testFormNameRef.current?.focus(); return; }
        if (Number(testForm.min_threshold) >= Number(testForm.max_threshold)) {
            setTestFormError('Batas bawah harus lebih kecil dari batas atas.');
            return;
        }
        closeTestForm({ ...testForm });
    };

    // ── Actions ──
    const handleDojoChange = (dojoId) => {
        router.get(route('report-categories.index'), { dojo_id: dojoId }, { preserveState: false });
    };

    const submitCategory = (e) => {
        e.preventDefault();
        if (!selectedLabelId) {
            alert('Pilih label terlebih dahulu.');
            return;
        }
        setCatFormProcessing(true);
        router.post(route('report-categories.store'), { ...catForm, dojo_id: selectedDojoId, test_label_id: selectedLabelId }, {
            preserveScroll: true,
            onSuccess: () => setCatForm({ name: '', test_label_id: selectedLabelId }),
            onFinish: () => setCatFormProcessing(false),
        });
    };

    const submitLabel = (e) => {
        e.preventDefault();
        setLabelFormProcessing(true);
        router.post(route('report-labels.store'), { ...labelForm, dojo_id: selectedDojoId }, {
            preserveScroll: true,
            onSuccess: () => setLabelForm({ name: '' }),
            onFinish: () => setLabelFormProcessing(false),
        });
    };

    const handleLabelChange = (labelId) => {
        router.get(route('report-categories.index'), { dojo_id: selectedDojoId, label_id: labelId }, { preserveState: false });
    };

    const deleteLabel = async (labelId) => {
        const ok = await showConfirm('Hapus Label', 'Hapus label ini? Semua kategori yang terhubung akan ikut terhapus!');
        if (!ok) return;
        router.delete(route('report-labels.destroy', labelId), { preserveScroll: true });
    };

    const deleteCategory = async (catId) => {
        const ok = await showConfirm('Hapus Kategori Test', 'Hapus kategori test ini? Data skor lama yang terkait akan tetap tersimpan.');
        if (!ok) return;
        router.delete(route('report-categories.destroy', catId), { preserveScroll: true });
    };

    // ── Styles ──
    const inputCls = "w-full rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-athlix-red/30 focus:border-athlix-red transition-colors";
    const overlayCls = "fixed inset-0 bg-black/60 backdrop-blur-sm";
    const centerCls = "fixed inset-0 z-[99999] flex items-center justify-center p-4";

    // ── Threshold config berdasarkan tipe unit ──
    const isRepetition = testForm.unit === 'repetition';
    const thresholdConfig = isRepetition
        ? {
            minLabel: 'Batas Bawah (Min. Pukulan)',
            minHint: 'Minimal pukulan agar dinyatakan lulus',
            maxLabel: 'Batas Atas (Standar Ideal)',
            maxHint: 'Jumlah pukulan untuk skor sempurna',
            durationLabel: 'Durasi Test (detik)',
            durationHint: 'Waktu yang diberikan untuk menghitung pukulan',
            durationPlaceholder: 'Contoh: 60',
            durationDefault: 60,
        }
        : testForm.unit === 'duration'
            ? {
                minLabel: 'Batas Bawah (Waktu Tercepat)',
                minHint: 'Waktu tercepat yang masih dianggap valid',
                maxLabel: 'Batas Atas (Waktu Terlambat)',
                maxHint: 'Batas waktu paling lambat yang ditolerir',
                durationLabel: 'Target Pukulan (kali)',
                durationHint: 'Jumlah pukulan yang harus diselesaikan',
                durationPlaceholder: 'Contoh: 10',
                durationDefault: 10,
            }
            : {
                minLabel: 'Batas Bawah (Jarak Terpendek)',
                minHint: 'Jarak minimal (cm) untuk mulai mendapat skor',
                maxLabel: 'Batas Atas (Jarak Ideal/Terjauh)',
                maxHint: 'Jarak (cm) untuk skor sempurna (100)',
                durationLabel: 'Satuan',
                durationHint: 'Semua input dalam centimeter (cm)',
                durationPlaceholder: 'cm',
                durationDefault: 'cm',
            };

    const isDuration = testForm.unit === 'duration';
    const isDistance = testForm.unit === 'distance';

    const thresholdInvalid = Number(testForm.min_threshold) >= Number(testForm.max_threshold);
    const durationValue = testForm.max_duration_seconds || thresholdConfig.durationDefault;

    // ── Universal modals via portal ──
    const universalModals = portalRoot ? createPortal(
        <>
            {confirmModal.open && (
                <div className={centerCls} style={{ position: 'fixed' }}>
                    <div className={overlayCls} onClick={() => closeConfirm(false)} />
                    <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 w-full max-w-sm p-6 space-y-4 z-[99999]" style={{ animation: 'fadeInScale 150ms ease-out' }}>
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
                            <Button type="button" variant="outline" className="font-semibold" onClick={() => closeConfirm(false)}>Batal</Button>
                            <Button type="button" className={`font-semibold ${confirmModal.variant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'}`} onClick={() => closeConfirm(true)}>Ya, Lanjutkan</Button>
                        </div>
                    </div>
                </div>
            )}

            {promptModal.open && (
                <div className={centerCls} style={{ position: 'fixed' }}>
                    <div className={overlayCls} onClick={() => closePrompt(null)} />
                    <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 w-full max-w-sm p-6 space-y-4 z-[99999]" style={{ animation: 'fadeInScale 150ms ease-out' }}>
                        <div className="space-y-1">
                            <h3 className="text-base font-black text-neutral-900 dark:text-neutral-100 leading-tight">{promptModal.title}</h3>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">{promptModal.message}</p>
                        </div>
                        <input
                            ref={promptInputRef}
                            type="text"
                            className={inputCls}
                            value={promptInputValue}
                            onChange={(e) => setPromptInputValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); closePrompt(promptInputValue); } if (e.key === 'Escape') closePrompt(null); }}
                            placeholder="Ketik di sini..."
                        />
                        <div className="flex justify-end gap-2 pt-1">
                            <Button type="button" variant="outline" className="font-semibold" onClick={() => closePrompt(null)}>Batal</Button>
                            <Button type="button" className="font-semibold" onClick={() => closePrompt(promptInputValue)}>OK</Button>
                        </div>
                    </div>
                </div>
            )}

            {testFormModal.open && (
                <div className={centerCls} style={{ position: 'fixed' }}>
                    <div className={overlayCls} onClick={() => closeTestForm(null)} />
                    <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 w-full max-w-md z-[99999] max-h-[90vh] flex flex-col" style={{ animation: 'fadeInScale 150ms ease-out' }}>
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 pb-0">
                            <h3 className="text-base font-black text-neutral-900 dark:text-neutral-100">{testFormModal.title}</h3>
                            <button type="button" onClick={() => closeTestForm(null)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"><X size={18} /></button>
                        </div>

                        {/* Body */}
                        <div className="p-5 space-y-4 overflow-y-auto flex-1">
                            {/* Nama Test */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Nama Test *</label>
                                <input ref={testFormNameRef} type="text" className={inputCls} value={testForm.name} onChange={(e) => setTestForm(p => ({ ...p, name: e.target.value }))} placeholder="Contoh: Pukulan Tsuki, Sprint 30m" onKeyDown={(e) => { if (e.key === 'Escape') closeTestForm(null); }} />
                            </div>

                            {/* Tipe Pengukuran */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Tipe Pengukuran</label>
                                <select className={inputCls} value={testForm.unit} onChange={(e) => setTestForm(p => ({ ...p, unit: e.target.value }))}>
                                    <option value="repetition">Repetisi (kali)</option>
                                    <option value="duration">Durasi (detik)</option>
                                    <option value="distance">Jarak (cm)</option>
                                </select>
                            </div>

                            {/* Threshold */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
                                    <span>Threshold</span>
                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${isRepetition || isDistance ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                                        {isRepetition || isDistance ? '↑ makin tinggi makin bagus' : '↓ makin rendah makin bagus'}
                                    </span>
                                </label>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">{thresholdConfig.minLabel}</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            className={`${inputCls} ${thresholdInvalid ? '!border-red-400 dark:!border-red-500 !ring-1 !ring-red-200 dark:!ring-red-800' : ''}`}
                                            value={testForm.min_threshold}
                                            onChange={(e) => setTestForm(p => ({ ...p, min_threshold: parseFloat(e.target.value) || 0 }))}
                                        />
                                        <p className="text-[10px] text-neutral-400 leading-snug">{thresholdConfig.minHint}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">{thresholdConfig.maxLabel}</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            className={`${inputCls} ${thresholdInvalid ? '!border-red-400 dark:!border-red-500 !ring-1 !ring-red-200 dark:!ring-red-800' : ''}`}
                                            value={testForm.max_threshold}
                                            onChange={(e) => setTestForm(p => ({ ...p, max_threshold: parseFloat(e.target.value) || 0 }))}
                                        />
                                        <p className="text-[10px] text-neutral-400 leading-snug">{thresholdConfig.maxHint}</p>
                                    </div>
                                </div>

                                {thresholdInvalid && (
                                    <div className="flex items-start gap-1.5 text-[11px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-2.5 py-1.5">
                                        <AlertCircle size={13} className="shrink-0 mt-0.5" />
                                        <span>Batas bawah harus lebih kecil dari batas atas.</span>
                                    </div>
                                )}
                            </div>

                            {/* Durasi / Target Pukulan */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">{thresholdConfig.durationLabel}</label>
                                <input
                                    type="number"
                                    step="1"
                                    min="1"
                                    className={inputCls}
                                    value={testForm.max_duration_seconds}
                                    onChange={(e) => setTestForm(p => ({ ...p, max_duration_seconds: e.target.value }))}
                                    placeholder={thresholdConfig.durationPlaceholder}
                                />
                                <p className="text-[10px] text-neutral-400 leading-snug">{thresholdConfig.durationHint}{!testForm.max_duration_seconds && ` (default: ${thresholdConfig.durationDefault})`}</p>
                            </div>

                            {/* Info Box */}
                            <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 p-3.5 space-y-2">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-1">
                                    <Info size={11} />
                                    Info Threshold
                                </p>

                                {isRepetition ? (
                                    <>
                                        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                            Waktu test <span className="font-bold text-neutral-800 dark:text-neutral-200">{durationValue} detik</span> (fixed). Yang diukur adalah <span className="font-bold text-neutral-800 dark:text-neutral-200">jumlah pukulan</span>. Makin banyak makin bagus.
                                        </p>
                                        <div className="text-xs text-neutral-500 leading-relaxed space-y-0.5 pl-2 border-l-2 border-emerald-300 dark:border-emerald-700">
                                            <p>• Skor <span className="font-bold text-red-500">0</span> jika pukulan <span className="font-bold">&le; {testForm.min_threshold}</span> — tidak lulus</p>
                                            <p>• Skor <span className="font-bold text-emerald-600">100</span> jika pukulan <span className="font-bold">&ge; {testForm.max_threshold}</span> — standar ideal</p>
                                            <p>• Nilai di antaranya dihitung proporsional</p>
                                        </div>
                                    </>
                                ) : isDuration ? (
                                    <>
                                        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                            Target pukulan <span className="font-bold text-neutral-800 dark:text-neutral-200">{durationValue} kali</span> (fixed). Yang diukur adalah <span className="font-bold text-neutral-800 dark:text-neutral-200">waktu penyelesaian</span>. Makin cepat makin bagus.
                                        </p>
                                        <div className="text-xs text-neutral-500 leading-relaxed space-y-0.5 pl-2 border-l-2 border-amber-300 dark:border-amber-700">
                                            <p>• Skor <span className="font-bold text-emerald-600">100</span> jika waktu <span className="font-bold">&le; {testForm.min_threshold} detik</span> — cepat/ideal</p>
                                            <p>• Skor <span className="font-bold text-red-500">0</span> jika waktu <span className="font-bold">&ge; {testForm.max_threshold} detik</span> — terlalu lambat</p>
                                            <p>• Nilai di antaranya dihitung proporsional</p>
                                        </div>
                                        <div className="flex items-start gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-2.5 py-1.5 mt-1">
                                            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                                            <span>Waktu di bawah <span className="font-bold">{testForm.min_threshold} detik</span> akan dicurigai / dianggap tidak valid karena terlalu ekstrem.</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                            Pengukuran <span className="font-bold text-neutral-800 dark:text-neutral-200">Jarak</span> dalam satuan <span className="font-bold text-neutral-800 dark:text-neutral-200">cm</span>. Makin jauh/besar makin bagus.
                                        </p>
                                        <div className="text-xs text-neutral-500 leading-relaxed space-y-0.5 pl-2 border-l-2 border-blue-300 dark:border-blue-700">
                                            <p>• Skor <span className="font-bold text-red-500">0</span> jika jarak <span className="font-bold">&le; {testForm.min_threshold} cm</span> — belum mencapai target</p>
                                            <p>• Skor <span className="font-bold text-emerald-600">100</span> jika jarak <span className="font-bold">&ge; {testForm.max_threshold} cm</span> — target ideal</p>
                                            <p>• Nilai di antaranya dihitung proporsional</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between gap-2 p-5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                            {testFormError ? (
                                <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                                    <AlertCircle size={13} />
                                    {testFormError}
                                </span>
                            ) : <span />}
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" className="font-semibold" onClick={() => closeTestForm(null)}>Batal</Button>
                                <Button type="button" className="font-semibold" onClick={handleTestFormSave}>
                                    {testFormModal.mode === 'add' ? 'Tambah Test' : 'Simpan Perubahan'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeInScale {
                    from { opacity: 0; transform: scale(0.95) translateY(4px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </>,
        portalRoot
    ) : null;

    return (
        <AdminLayout user={auth?.user} header={<h2 className="text-xl font-bold tracking-tight uppercase">Kategori Test</h2>}>
            <Head title="Kategori Test" />
            {universalModals}

            <div className="py-6">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* Header */}
                    <Card className="border-neutral-200/80 dark:border-neutral-800 bg-gradient-to-r from-athlix-red/10 to-transparent">
                        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-athlix-red/15 text-athlix-red"><ClipboardList size={22} /></div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Manajemen</p>
                                    <h3 className="text-lg font-black">Kategori Test Rapor</h3>
                                </div>
                            </div>
                            {isSuperAdmin && (
                                <div className="w-full sm:w-auto sm:min-w-[280px]">
                                    <DbSelect
                                        inputId="dojo-select"
                                        options={dojos.map(d => ({ value: String(d.id), label: d.name }))}
                                        value={String(selectedDojoId || '')}
                                        onChange={handleDojoChange}
                                        placeholder="Pilih Dojo"
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Add Label Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-neutral-200/80 dark:border-neutral-800">
                            <CardHeader className="border-b border-neutral-100 dark:border-neutral-800">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500">Tambah Label Baru</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6">
                                <form onSubmit={submitLabel} className="flex items-end gap-3">
                                    <div className="flex-1 space-y-1">
                                        <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Nama Label</label>
                                        <Input value={labelForm.name} onChange={(e) => setLabelForm({ ...labelForm, name: e.target.value })} placeholder="Contoh: Senior, Junior, Beginner..." required />
                                    </div>
                                    <Button type="submit" disabled={labelFormProcessing} className="shrink-0 gap-1.5">
                                        {labelFormProcessing ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                        <span className="hidden sm:inline">Tambah</span>
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        <Card className="border-neutral-200/80 dark:border-neutral-800">
                            <CardHeader className="border-b border-neutral-100 dark:border-neutral-800">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500">Pilih Label / Kategori Test</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6 space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Pilih Label Untuk Melihat Struktur</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <DbSelect
                                                inputId="label-select"
                                                options={labels.map(l => ({ value: String(l.id), label: l.name }))}
                                                value={String(selectedLabelId || '')}
                                                onChange={handleLabelChange}
                                                placeholder="Pilih Label"
                                            />
                                        </div>
                                        {selectedLabelId > 0 && (
                                            <div className="flex gap-1">
                                                <Button type="button" variant="outline" size="icon" className="h-10 w-10 border-neutral-200 dark:border-neutral-700 hover:text-blue-600" onClick={async () => {
                                                    const current = labels.find(l => l.id === selectedLabelId);
                                                    const name = await showPrompt('Ubah Label', 'Ubah nama label:', current?.name);
                                                    if (name && name !== current?.name) router.patch(route('report-labels.update', selectedLabelId), { name }, { preserveScroll: true });
                                                }}>
                                                    <Pencil size={16} />
                                                </Button>
                                                <Button type="button" variant="outline" size="icon" className="h-10 w-10 border-neutral-200 dark:border-neutral-700 hover:text-red-600" onClick={() => deleteLabel(selectedLabelId)}>
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Add Category */}
                    {labels.length > 0 && selectedLabelId > 0 && (
                        <Card className="border-neutral-200/80 dark:border-neutral-800">
                            <CardHeader className="border-b border-neutral-100 dark:border-neutral-800">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500">
                                    Tambah Kategori Baru untuk Label: <span className="text-neutral-900 dark:text-neutral-100">{labels.find(l => l.id === selectedLabelId)?.name}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6">
                                <form onSubmit={submitCategory} className="flex items-end gap-3">
                                    <div className="flex-1 space-y-1">
                                        <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Nama Kategori</label>
                                        <Input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} placeholder="Contoh: Power, Strength, Speed..." required />
                                    </div>
                                    <Button type="submit" disabled={catFormProcessing} className="shrink-0 gap-1.5">
                                        {catFormProcessing ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                        <span className="hidden sm:inline">Tambah</span>
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {/* Hierarchy */}
                    {labels.length === 0 ? (
                        <Card className="border-neutral-200/80 dark:border-neutral-800">
                            <CardContent className="p-12 text-center text-neutral-500">
                                <AlertCircle size={48} className="mx-auto mb-4 text-athlix-red/50" />
                                <p className="font-bold text-neutral-900 dark:text-neutral-100">Belum ada label test yang dibuat.</p>
                                <p className="text-xs text-neutral-400 mt-1">Anda harus menginput label dulu (contoh: Senior, Junior) sebelum bisa membuat kategori test.</p>
                            </CardContent>
                        </Card>
                    ) : !selectedLabelId ? (
                        <Card className="border-neutral-200/80 dark:border-neutral-800">
                            <CardContent className="p-12 text-center text-neutral-500">
                                <Info size={48} className="mx-auto mb-4 text-blue-400/50" />
                                <p className="font-bold">Silakan pilih label untuk melihat struktur test.</p>
                            </CardContent>
                        </Card>
                    ) : categories.length > 0 ? (
                        <Card className="border-neutral-200/80 dark:border-neutral-800">
                            <CardHeader className="border-b border-neutral-100 dark:border-neutral-800 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500">
                                    Struktur Test Label: {labels.find(l => l.id === selectedLabelId)?.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6 space-y-4">
                                {categories.map((cat) => (
                                    <div key={cat.id} className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                                        {/* Category header */}
                                        <div className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-800/50 px-3 sm:px-4 py-2.5">
                                            <span className="text-sm font-black uppercase tracking-wider text-neutral-700 dark:text-neutral-200 truncate">{cat.name}</span>
                                            <div className="flex items-center gap-1 shrink-0 ml-2">
                                                <button type="button" onClick={async () => {
                                                    const name = await showPrompt('Tambah Sub-Kategori', 'Nama sub-kategori baru:');
                                                    if (name) router.post(route('report-sub-categories.store'), { report_category_id: cat.id, name }, { preserveScroll: true });
                                                }} className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 hover:text-emerald-600 transition-colors" title="Tambah Sub-Kategori">
                                                    <Plus size={13} />
                                                </button>
                                                <button type="button" onClick={async () => {
                                                    const name = await showPrompt('Ubah Kategori', 'Ubah nama kategori:', cat.name);
                                                    if (name && name !== cat.name) router.patch(route('report-categories.update', cat.id), { name }, { preserveScroll: true });
                                                }} className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 hover:text-blue-600 transition-colors" title="Ubah Nama">
                                                    <Pencil size={12} />
                                                </button>
                                                <button type="button" onClick={() => deleteCategory(cat.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-600 transition-colors" title="Hapus Kategori">
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Sub-categories */}
                                        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                            {(cat.sub_categories || []).map((sub) => (
                                                <div key={sub.id} className="px-3 sm:px-4 py-2 space-y-1.5">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 truncate">↳ {sub.name}</span>
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <button type="button" onClick={async () => {
                                                                const result = await showTestForm(null, 'Tambah Test Baru');
                                                                if (!result) return;
                                                                router.post(route('report-tests.store'), {
                                                                    report_sub_category_id: sub.id,
                                                                    name: result.name,
                                                                    unit: result.unit,
                                                                    min_threshold: parseFloat(result.min_threshold) || 0,
                                                                    max_threshold: parseFloat(result.max_threshold) || 100,
                                                                    max_duration_seconds: result.max_duration_seconds ? parseInt(result.max_duration_seconds) : null,
                                                                }, { preserveScroll: true });
                                                            }} className="p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 hover:text-emerald-600 transition-colors" title="Tambah Test">
                                                                <Plus size={11} />
                                                            </button>
                                                            <button type="button" onClick={async () => {
                                                                const name = await showPrompt('Ubah Sub-Kategori', 'Ubah nama sub-kategori:', sub.name);
                                                                if (name && name !== sub.name) router.patch(route('report-sub-categories.update', sub.id), { name }, { preserveScroll: true });
                                                            }} className="p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 hover:text-blue-600 transition-colors" title="Ubah Nama">
                                                                <Pencil size={10} />
                                                            </button>
                                                            <button type="button" onClick={async () => {
                                                                const ok = await showConfirm('Hapus Sub-Kategori', `Hapus sub-kategori "${sub.name}" beserta semua testnya?`);
                                                                if (!ok) return;
                                                                router.delete(route('report-sub-categories.destroy', sub.id), { preserveScroll: true });
                                                            }} className="p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-600 transition-colors" title="Hapus">
                                                                <Trash2 size={10} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Tests */}
                                                    {(sub.tests || []).map((test) => (
                                                        <div key={test.id} className="flex items-center justify-between rounded-md bg-neutral-50/70 dark:bg-neutral-900/30 px-2.5 sm:px-3 py-1.5 text-[11px] gap-2">
                                                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                                                <span className="font-bold text-neutral-600 dark:text-neutral-300 truncate">{test.name}</span>
                                                                <span className={`shrink-0 px-1.5 py-0.5 rounded font-bold uppercase text-[9px] ${test.unit === 'duration' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : test.unit === 'distance' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
                                                                    {test.unit === 'duration' ? 'DUR' : test.unit === 'distance' ? 'JAR' : 'REP'}
                                                                </span>
                                                                <span className="text-neutral-400 shrink-0 hidden sm:inline">
                                                                    {test.unit === 'repetition'
                                                                        ? `≥${test.min_threshold} → ${test.max_threshold} pukulan`
                                                                        : test.unit === 'distance'
                                                                            ? `≥${test.min_threshold} → ${test.max_threshold} cm`
                                                                            : `${test.min_threshold}s → ≤${test.max_threshold}s`
                                                                    }
                                                                </span>
                                                                {test.max_duration_seconds ? (
                                                                    <span className="text-neutral-400 shrink-0 hidden sm:inline">
                                                                        ({test.unit === 'repetition' ? `${test.max_duration_seconds}s` : `${test.max_duration_seconds}x`})
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                            <div className="flex items-center gap-0.5 shrink-0">
                                                                <button type="button" onClick={async () => {
                                                                    const result = await showTestForm(test, 'Edit Test');
                                                                    if (!result) return;
                                                                    router.patch(route('report-tests.update', test.id), {
                                                                        name: result.name,
                                                                        unit: result.unit,
                                                                        min_threshold: parseFloat(result.min_threshold) || 0,
                                                                        max_threshold: parseFloat(result.max_threshold) || 100,
                                                                        max_duration_seconds: result.max_duration_seconds ? parseInt(result.max_duration_seconds) : null,
                                                                    }, { preserveScroll: true });
                                                                }} className="p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 hover:text-blue-600 transition-colors" title="Edit Test">
                                                                    <Pencil size={10} />
                                                                </button>
                                                                <button type="button" onClick={async () => {
                                                                    const ok = await showConfirm('Hapus Test', `Hapus test "${test.name}"?`);
                                                                    if (!ok) return;
                                                                    router.delete(route('report-tests.destroy', test.id), { preserveScroll: true });
                                                                }} className="p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-600 transition-colors" title="Hapus Test">
                                                                    <Trash2 size={10} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {(sub.tests || []).length === 0 && (
                                                        <p className="text-[10px] text-neutral-400 italic pl-3">Belum ada test. Klik + untuk menambah.</p>
                                                    )}
                                                </div>
                                            ))}
                                            {(cat.sub_categories || []).length === 0 && (
                                                <p className="text-xs text-neutral-400 italic px-3 sm:px-4 py-3">Belum ada sub-kategori. Klik + pada header untuk menambah.</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-neutral-200/80 dark:border-neutral-800">
                            <CardContent className="p-12 text-center text-neutral-500">
                                <ClipboardList size={48} className="mx-auto mb-4 text-neutral-300" />
                                <p className="font-bold">Belum ada data kategori test untuk label ini.</p>
                                <p className="text-xs text-neutral-400 mt-1 italic">Silakan mulai dengan menambahkan kategori pertama pada form di atas.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
