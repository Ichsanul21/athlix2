import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Skeleton } from '@/Components/ui/skeleton';
import Modal from '@/Components/Modal';
import DbSelect from '@/Components/DbSelect';
import { ArrowLeft, Trash2, FileText, FilePlus2, Trophy, Pencil, X, Loader2, User, Phone, Mail, FileCheck, Settings, Plus, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

const COLORS = ['#DC2626', '#404040'];

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
    const [reportError, setReportError] = useState('');
    const [portalRoot, setPortalRoot] = useState(null);

    // ── Universal modal states ──
    const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', variant: 'danger' });
    const [promptModal, setPromptModal] = useState({ open: false, title: '', message: '', defaultValue: '' });
    const [alertModal, setAlertModal] = useState({ open: false, title: '', message: '' });
    const [testFormModal, setTestFormModal] = useState({ open: false, mode: 'add', title: 'Tambah Test Baru' });
    const [testForm, setTestForm] = useState({ name: '', unit: 'repetition', min_threshold: 0, max_threshold: 100, max_duration_seconds: '' });
    const [promptInputValue, setPromptInputValue] = useState('');

    const confirmResolveRef = useRef(null);
    const promptResolveRef = useRef(null);
    const alertResolveRef = useRef(null);
    const testFormResolveRef = useRef(null);
    const promptInputRef = useRef(null);
    const testFormNameRef = useRef(null);

    // Mount portal root to document.body
    useEffect(() => {
        const el = document.createElement('div');
        el.id = 'universal-modal-portal';
        document.body.appendChild(el);
        setPortalRoot(el);
        return () => { document.body.removeChild(el); };
    }, []);

    const anyUniversalOpen = confirmModal.open || promptModal.open || alertModal.open || testFormModal.open;

    useEffect(() => {
        if (anyUniversalOpen) {
            const prev = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = prev; };
        }
    }, [anyUniversalOpen]);

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
            setPromptModal({ open: true, title, message, defaultValue });
        });
    }, []);

    const showAlert = useCallback((title, message) => {
        return new Promise((resolve) => {
            alertResolveRef.current = resolve;
            setAlertModal({ open: true, title, message });
        });
    }, []);

    const showTestForm = useCallback((existingTest = null, title = null) => {
        return new Promise((resolve) => {
            testFormResolveRef.current = resolve;
            if (existingTest) {
                setTestForm({
                    name: existingTest.name || '',
                    unit: existingTest.unit || 'repetition',
                    min_threshold: Number(existingTest.min_threshold) || 0,
                    max_threshold: Number(existingTest.max_threshold) || 100,
                    max_duration_seconds: existingTest.max_duration_seconds || '',
                });
                setTestFormModal({ open: true, mode: 'edit', title: title || 'Edit Test' });
            } else {
                setTestForm({ name: '', unit: 'repetition', min_threshold: 0, max_threshold: 100, max_duration_seconds: '' });
                setTestFormModal({ open: true, mode: 'add', title: title || 'Tambah Test Baru' });
            }
        });
    }, []);

    // Auto-focus inputs
    useEffect(() => {
        if (promptModal.open) {
            setTimeout(() => promptInputRef.current?.focus(), 200);
        }
    }, [promptModal.open]);

    useEffect(() => {
        if (testFormModal.open) {
            setTimeout(() => testFormNameRef.current?.focus(), 200);
        }
    }, [testFormModal.open]);

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
    const handlePromptOk = () => {
        setPromptModal((p) => ({ ...p, open: false }));
        promptResolveRef.current?.(promptInputValue);
        promptResolveRef.current = null;
    };
    const handlePromptCancel = () => {
        setPromptModal((p) => ({ ...p, open: false }));
        promptResolveRef.current?.(null);
        promptResolveRef.current = null;
    };
    const handleAlertOk = () => {
        setAlertModal((p) => ({ ...p, open: false }));
        alertResolveRef.current?.(true);
        alertResolveRef.current = null;
    };
    const handleTestFormSave = () => {
        if (!testForm.name.trim()) {
            testFormNameRef.current?.focus();
            return;
        }
        setTestFormModal({ open: false, mode: 'add', title: '' });
        testFormResolveRef.current?.({ ...testForm });
        testFormResolveRef.current = null;
    };
    const handleTestFormCancel = () => {
        setTestFormModal({ open: false, mode: 'add', title: '' });
        testFormResolveRef.current?.(null);
        testFormResolveRef.current = null;
    };

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

    const deleteCategory = async (catId) => {
        const ok = await showConfirm('Hapus Kategori Test', 'Hapus kategori test ini? Data skor lama yang terkait akan tetap tersimpan.');
        if (!ok) return;
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

    const safeParseDynScores = (raw) => {
        if (!raw) return {};
        if (typeof raw === 'object') return raw;
        if (typeof raw === 'string') {
            try { return JSON.parse(raw) || {}; } catch { return {}; }
        }
        return {};
    };

    const categorySeries = reportCategories.length
        ? reportCategories.map((cat) => {
              const snapshot = safeParseDynScores(activeReport?.dynamic_scores);
              const catSnapshot = snapshot?.categories?.[cat.id];
              return {
                  label: cat.name,
                  score: Number(catSnapshot?.score ?? performance?.categories?.find((item) => item.label === cat.name)?.score ?? 0),
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

    const buildTestValues = () => {
        const vals = {};
        const snapshot = safeParseDynScores(activeReport?.dynamic_scores);
        reportCategories.forEach((cat) => {
            (cat.sub_categories || []).forEach((sub) => {
                (sub.tests || []).forEach((test) => {
                    vals[String(test.id)] = snapshot?.tests?.[test.id]?.raw_value ?? 0;
                });
            });
        });
        return vals;
    };

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

    const reportForm = useForm({
        condition_percentage: activeReport?.condition_percentage ?? 0,
        test_values: buildTestValues(),
        notes: '',
        recorded_at: new Date().toISOString().slice(0, 10),
    });

    const resetReportForm = () => {
        setReportError('');
        reportForm.clearErrors();
        reportForm.setData({
            condition_percentage: activeReport?.condition_percentage ?? 0,
            test_values: buildTestValues(),
            notes: '',
            recorded_at: new Date().toISOString().slice(0, 10),
        });
    };

    const submitReport = (event) => {
        event.preventDefault();
        setReportError('');
        if (!isSensei) {
            setReportError('Anda tidak memiliki izin untuk menambahkan rapor. Hanya Sensei atau Admin yang bisa menambahkan rapor.');
            return;
        }
        if (!athlete?.id) {
            setReportError('Data atlet tidak ditemukan. Silakan refresh halaman.');
            return;
        }
        const formattedTestValues = {};
        Object.entries(reportForm.data.test_values).forEach(([key, value]) => {
            formattedTestValues[String(key)] = Number(value) || 0;
        });
        reportForm.setData('test_values', formattedTestValues);
        reportForm.post(route('athletes.reports.store', athlete.id), {
            preserveScroll: true,
            onSuccess: () => { setReportModalOpen(false); setReportError(''); },
            onError: (errors) => {
                console.error('Report validation errors:', errors);
                const errorMessages = Object.values(errors).join(', ');
                setReportError(errorMessages || 'Terjadi kesalahan validasi. Periksa kembali isian form Anda.');
            },
        });
    };

    const submitAchievement = (event) => {
        event.preventDefault();
        if (!isSensei) {
            showAlert('Akses Ditolak', 'Anda tidak memiliki izin untuk menambahkan prestasi. Hanya Sensei atau Admin yang dapat menambahkan.');
            return;
        }
        achievementForm.post(route('athletes.achievements.store', athlete.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => { achievementForm.reset(); setAchievementModalOpen(false); },
        });
    };

    const deleteAchievement = async (achievementId) => {
        if (!isSensei) {
            await showAlert('Akses Ditolak', 'Anda tidak memiliki izin untuk menghapus prestasi. Hanya Sensei atau Admin yang dapat menghapus.');
            return;
        }
        const ok = await showConfirm('Hapus Prestasi', 'Yakin ingin menghapus data prestasi ini? Tindakan ini tidak dapat dibatalkan.');
        if (!ok) return;
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

    const overlayCls = "fixed inset-0 bg-black/60 backdrop-blur-sm";
    const modalCenterCls = "fixed inset-0 z-[99999] flex items-center justify-center p-4";

    const testInputCls = "w-full rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-athlix-red/30 focus:border-athlix-red transition-colors";

    const universalModals = portalRoot ? createPortal(
        <>
            {/* Confirm */}
            {confirmModal.open && (
                <div className={modalCenterCls} style={{ position: 'fixed' }}>
                    <div className={overlayCls} onClick={handleConfirmNo} />
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
                            <Button type="button" variant="outline" className="font-semibold" onClick={handleConfirmNo}>Batal</Button>
                            <Button type="button" className={`font-semibold ${confirmModal.variant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'}`} onClick={handleConfirmYes}>Ya, Lanjutkan</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Prompt */}
            {promptModal.open && (
                <div className={modalCenterCls} style={{ position: 'fixed' }}>
                    <div className={overlayCls} onClick={handlePromptCancel} />
                    <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 w-full max-w-sm p-6 space-y-4 z-[99999]" style={{ animation: 'fadeInScale 150ms ease-out' }}>
                        <div className="space-y-1">
                            <h3 className="text-base font-black text-neutral-900 dark:text-neutral-100 leading-tight">{promptModal.title}</h3>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">{promptModal.message}</p>
                        </div>
                        <input
                            ref={promptInputRef}
                            type="text"
                            className={testInputCls}
                            value={promptInputValue}
                            onChange={(e) => setPromptInputValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handlePromptOk(); } if (e.key === 'Escape') handlePromptCancel(); }}
                            placeholder="Ketik di sini..."
                        />
                        <div className="flex justify-end gap-2 pt-1">
                            <Button type="button" variant="outline" className="font-semibold" onClick={handlePromptCancel}>Batal</Button>
                            <Button type="button" className="font-semibold" onClick={handlePromptOk}>OK</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Alert */}
            {alertModal.open && (
                <div className={modalCenterCls} style={{ position: 'fixed' }}>
                    <div className={overlayCls} onClick={handleAlertOk} />
                    <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 w-full max-w-sm p-6 space-y-4 z-[99999]" style={{ animation: 'fadeInScale 150ms ease-out' }}>
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

            {/* Test Form (Add / Edit) */}
            {testFormModal.open && (
                <div className={modalCenterCls} style={{ position: 'fixed' }}>
                    <div className={overlayCls} onClick={handleTestFormCancel} />
                    <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 w-full max-w-md z-[99999] max-h-[90vh] flex flex-col" style={{ animation: 'fadeInScale 150ms ease-out' }}>
                        <div className="flex items-center justify-between p-5 pb-0">
                            <h3 className="text-base font-black text-neutral-900 dark:text-neutral-100">{testFormModal.title}</h3>
                            <button type="button" onClick={handleTestFormCancel} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-5 space-y-4 overflow-y-auto flex-1">
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Nama Test *</label>
                                <input
                                    ref={testFormNameRef}
                                    type="text"
                                    className={testInputCls}
                                    value={testForm.name}
                                    onChange={(e) => setTestForm((p) => ({ ...p, name: e.target.value }))}
                                    placeholder="Contoh: Push-up, Sprint 30m"
                                    onKeyDown={(e) => { if (e.key === 'Escape') handleTestFormCancel(); }}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Tipe Pengukuran</label>
                                <select className={testInputCls} value={testForm.unit} onChange={(e) => setTestForm((p) => ({ ...p, unit: e.target.value }))}>
                                    <option value="repetition">Repetisi (kali)</option>
                                    <option value="duration">Durasi (detik)</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Min Threshold</label>
                                    <input type="number" step="0.1" className={testInputCls} value={testForm.min_threshold} onChange={(e) => setTestForm((p) => ({ ...p, min_threshold: parseFloat(e.target.value) || 0 }))} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Max Threshold</label>
                                    <input type="number" step="0.1" className={testInputCls} value={testForm.max_threshold} onChange={(e) => setTestForm((p) => ({ ...p, max_threshold: parseFloat(e.target.value) || 0 }))} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Max Durasi (detik, kosongkan = tidak ada)</label>
                                <input type="number" step="1" className={testInputCls} value={testForm.max_duration_seconds} onChange={(e) => setTestForm((p) => ({ ...p, max_duration_seconds: e.target.value }))} placeholder="Contoh: 60" />
                            </div>
                            <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 p-3">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Info Threshold</p>
                                <p className="text-xs text-neutral-500 leading-relaxed">
                                    {Number(testForm.max_threshold) >= Number(testForm.min_threshold)
                                        ? `Skor 0 = nilai ≤ ${testForm.min_threshold}, Skor 100 = nilai ≥ ${testForm.max_threshold}. Nilai di antaranya dihitung proporsional.`
                                        : `Mode "lebih rendah lebih baik". Skor 0 = nilai ≥ ${testForm.min_threshold}, Skor 100 = nilai ≤ ${testForm.max_threshold}. Contoh: lari 100m, waktu tempuh.`
                                    }
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 p-5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                            <Button type="button" variant="outline" className="font-semibold" onClick={handleTestFormCancel}>Batal</Button>
                            <Button type="button" className="font-semibold" onClick={handleTestFormSave}>
                                {testFormModal.mode === 'add' ? 'Tambah Test' : 'Simpan Perubahan'}
                            </Button>
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
        <AdminLayout user={auth?.user} header={<h2 className="text-xl font-bold tracking-tight uppercase">Monitoring Athlet</h2>}>
            <Head title={`Rapor - ${athlete.full_name}`} />
            {universalModals}
            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
                    <Link href={route('athletes.index')} className="inline-flex items-center text-sm font-bold text-neutral-500 hover:text-athlix-red transition-colors">
                        <ArrowLeft size={16} className="mr-1" /> KEMBALI KE DATABASE
                    </Link>

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
                                {isSensei && (
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button type="button" variant="outline" size="sm" className="gap-1.5 font-bold" onClick={() => setEditModalOpen(true)}>
                                            <Pencil size={13} /> Edit Atlet
                                        </Button>
                                        <Button type="button" variant="outline" size="sm" className="gap-1.5 font-bold text-red-600 border-red-200 hover:bg-red-50" onClick={() => setDeleteConfirmOpen(true)}>
                                            <Trash2 size={13} /> Hapus
                                        </Button>
                                    </div>
                                )}
                            </div>

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
                                {isSensei && (
                                    <Button type="button" className="w-full sm:w-auto gap-2" onClick={() => { resetReportForm(); setReportModalOpen(true); }}>
                                        <FilePlus2 size={14} /> Tambah Rapor
                                    </Button>
                                )}
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
                                <p className="text-sm text-neutral-500">Belum ada data rapor.{isSensei ? ' Tambahkan data pertama melalui tombol tambah rapor.' : ''}</p>
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
                                const dynScores = safeParseDynScores(activeReport?.dynamic_scores);
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
                        {isSensei && (
                            <Card className="border-neutral-200/80 dark:border-neutral-800">
                                <CardHeader><CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500">Tambah Prestasi Atlet</CardTitle></CardHeader>
                                <CardContent>
                                    <Button type="button" className="w-full gap-2" onClick={() => setAchievementModalOpen(true)}>
                                        <Trophy size={14} /> Tambah Prestasi (Popup)
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                        <Card className={`border-neutral-200/80 dark:border-neutral-800 overflow-hidden ${!isSensei ? 'lg:col-span-2' : ''}`}>
                            <CardHeader className="border-b border-neutral-100 dark:border-neutral-800"><CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500">Riwayat Prestasi</CardTitle></CardHeader>
                            <CardContent className="p-0">
                                {achievementHistory.length > 0 ? achievementHistory.map((achievement) => (
                                    <div key={achievement.id} className="px-4 py-3 text-sm space-y-1 border-b border-neutral-100 dark:border-neutral-800">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="font-bold">{achievement.competition_name}</p>
                                                <p className="text-xs text-neutral-500">{achievement.competition_date} | {achievement.competition_level}</p>
                                            </div>
                                            {isSensei && (
                                                <button type="button" className="p-1 rounded text-red-500 hover:bg-red-50" onClick={() => deleteAchievement(achievement.id)}>
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
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
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-100 dark:border-neutral-800">
                    <h3 className="text-base sm:text-lg font-black uppercase tracking-tight">Edit Data Atlet</h3>
                    <button type="button" onClick={() => setEditModalOpen(false)} className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"><X size={20} /></button>
                </div>
                <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
                    <form onSubmit={submitEdit} className="space-y-4 sm:space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="sm:col-span-2 space-y-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Nama Lengkap *</label>
                                <Input value={editForm.data.full_name} onChange={e => editForm.setData('full_name', e.target.value)} placeholder="Nama lengkap" required />
                                {editForm.errors.full_name && <p className="text-xs text-athlix-red">{editForm.errors.full_name}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">No HP Atlet *</label>
                                <Input value={editForm.data.phone_number} onChange={e => editForm.setData('phone_number', e.target.value)} placeholder="08xxxxxxxxxx" required />
                                {editForm.errors.phone_number && <p className="text-xs text-athlix-red">{editForm.errors.phone_number}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Belt *</label>
                                <DbSelect inputId="edit-belt" options={(belts || []).map(b => ({ value: String(b.id), label: b.name }))} value={editForm.data.current_belt_id ? String(editForm.data.current_belt_id) : ''} onChange={v => editForm.setData('current_belt_id', v)} placeholder="Pilih Belt" />
                                {editForm.errors.current_belt_id && <p className="text-xs text-athlix-red">{editForm.errors.current_belt_id}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Tanggal Lahir *</label>
                                <Input type="date" value={editForm.data.dob} onChange={e => editForm.setData('dob', e.target.value)} required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Tempat Lahir</label>
                                <Input value={editForm.data.birth_place} onChange={e => editForm.setData('birth_place', e.target.value)} placeholder="Samarinda" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Gender *</label>
                                <DbSelect inputId="edit-gender" value={editForm.data.gender} options={[{ value: 'M', label: 'Laki-laki' }, { value: 'F', label: 'Perempuan' }]} onChange={v => editForm.setData('gender', v)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Spesialisasi *</label>
                                <DbSelect inputId="edit-spec" value={editForm.data.specialization} options={[{ value: 'kata', label: 'Kata' }, { value: 'kumite', label: 'Kumite' }, { value: 'both', label: 'Kata & Kumite' }]} onChange={v => editForm.setData('specialization', v)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Tinggi (cm)</label>
                                <Input type="number" step="0.1" value={editForm.data.latest_height} onChange={e => editForm.setData('latest_height', e.target.value)} placeholder="170" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Berat (kg)</label>
                                <Input type="number" step="0.1" value={editForm.data.latest_weight} onChange={e => editForm.setData('latest_weight', e.target.value)} placeholder="65" />
                            </div>
                            <div className="sm:col-span-2 space-y-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Keterangan Kelas</label>
                                <Input value={editForm.data.class_note} onChange={e => editForm.setData('class_note', e.target.value)} placeholder="Umum / Senior -67kg" />
                            </div>
                            <div className="sm:col-span-2 space-y-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Ganti Foto (Opsional)</label>
                                <Input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={e => editForm.setData('photo', e.target.files?.[0] || null)} />
                                {editForm.errors.photo && <p className="text-xs text-athlix-red">{editForm.errors.photo}</p>}
                            </div>
                        </div>

                        <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-600 p-3 sm:p-4 space-y-3">
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

                        <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-600 p-3 sm:p-4 space-y-3">
                            <p className="text-sm font-semibold">Data Orang Tua / Wali Utama</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Nama Orang Tua</label>
                                    <Input value={editForm.data.parent_name} onChange={e => editForm.setData('parent_name', e.target.value)} placeholder="Nama orang tua" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">No HP Orang Tua</label>
                                    <Input value={editForm.data.parent_phone_number} onChange={e => editForm.setData('parent_phone_number', e.target.value)} placeholder="08xxxxxxxxxx" />
                                </div>
                                <div className="sm:col-span-2 space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Email Orang Tua</label>
                                    <Input type="email" value={editForm.data.parent_email} onChange={e => editForm.setData('parent_email', e.target.value)} placeholder="email@example.com" />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                            <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)} className="w-full sm:w-auto">Batal</Button>
                            <Button type="submit" disabled={editForm.processing} className="w-full sm:w-auto">
                                {editForm.processing && <Loader2 size={14} className="animate-spin mr-2" />} Simpan Perubahan
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* ── Delete Confirm Modal ── */}
            <Modal show={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="sm">
                <div className="p-4 sm:p-6 space-y-4">
                    <h3 className="text-lg font-black uppercase tracking-tight text-red-600">Hapus Data Atlet</h3>
                    <p className="text-sm text-neutral-600">Yakin ingin menghapus data <strong>{athlete.full_name}</strong>? Semua data terkait (absensi, rapor, prestasi, akun user) juga akan ikut terhapus.</p>
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setDeleteConfirmOpen(false)} className="w-full sm:w-auto">Batal</Button>
                        <Button type="button" className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto" onClick={handleDelete}>
                            <Trash2 size={14} className="mr-1.5" /> Hapus Permanen
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* ── Report Modal ── */}
            <Modal show={reportModalOpen} onClose={() => setReportModalOpen(false)} maxWidth="3xl">
                <form onSubmit={submitReport} className="p-4 sm:p-6 space-y-5 max-h-[85vh] overflow-y-auto">
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-tight">Input Rapor Kemampuan Atlet</h3>
                        <p className="text-xs text-neutral-500 mt-1">Masukkan nilai mentah (raw) per test. Skor 1-100 dihitung otomatis. Sub-kategori & kategori di-average dari test.</p>
                    </div>
                    {reportError && (
                        <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50 p-4 space-y-2">
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                <AlertTriangle size={16} className="shrink-0" />
                                <span className="text-sm font-bold">Gagal Menyimpan Rapor</span>
                            </div>
                            <p className="text-xs text-red-600/80 dark:text-red-400/80 pl-6">{reportError}</p>
                            {reportForm.errors && Object.keys(reportForm.errors).length > 0 && (
                                <ul className="text-xs text-red-600/70 dark:text-red-400/70 pl-6 list-disc space-y-0.5">
                                    {Object.entries(reportForm.errors).map(([field, message]) => (
                                        <li key={field}>{message}</li>
                                    ))}
                                </ul>
                            )}
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
                                                            const unitLabel = test.unit === 'duration' ? 'detik' : 'kali';
                                                            const isLowerBetter = Number(test.max_threshold) < Number(test.min_threshold);
                                                            const scoreColor = previewScore >= 80 ? 'text-emerald-600' : previewScore >= 50 ? 'text-amber-600' : 'text-red-500';
                                                            return (
                                                                <div key={test.id} className="rounded-lg bg-neutral-50/50 dark:bg-neutral-900/30 p-2.5 space-y-1.5">
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                                                            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">{test.name}</span>
                                                                            <span className="text-[9px] font-bold uppercase bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.5 rounded text-neutral-500 shrink-0">{test.unit === 'duration' ? 'DURASI' : 'REP'}</span>
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
                            Kondisi Fisik (%)
                            <input type="number" min="0" max="100" className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm bg-white dark:bg-neutral-900" value={reportForm.data.condition_percentage} onChange={(e) => reportForm.setData('condition_percentage', e.target.value)} required />
                            {reportForm.errors.condition_percentage && <p className="text-xs text-athlix-red normal-case">{reportForm.errors.condition_percentage}</p>}
                        </label>
                        <label className="text-xs font-bold uppercase text-neutral-500 space-y-1">
                            Tanggal Penilaian
                            <input type="date" className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm bg-white dark:bg-neutral-900" value={reportForm.data.recorded_at} onChange={(e) => reportForm.setData('recorded_at', e.target.value)} required />
                            {reportForm.errors.recorded_at && <p className="text-xs text-athlix-red normal-case">{reportForm.errors.recorded_at}</p>}
                        </label>
                    </div>
                    <div className="space-y-1">
                        <textarea className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm min-h-20 bg-white dark:bg-neutral-900" value={reportForm.data.notes} onChange={(e) => reportForm.setData('notes', e.target.value)} placeholder="Catatan rapor dari sensei..." />
                        {reportForm.errors.notes && <p className="text-xs text-athlix-red">{reportForm.errors.notes}</p>}
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                        <Button type="button" variant="outline" onClick={() => setReportModalOpen(false)} className="w-full sm:w-auto">Batal</Button>
                        <Button type="submit" disabled={reportForm.processing} className="w-full sm:w-auto">
                            {reportForm.processing && <Loader2 size={14} className="animate-spin mr-2" />} Simpan Rapor
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* ── Achievement Modal ── */}
            <Modal show={achievementModalOpen} onClose={() => setAchievementModalOpen(false)} maxWidth="4xl">
                <form onSubmit={submitAchievement} className="p-4 sm:p-6 space-y-3">
                    <h3 className="text-lg font-black uppercase tracking-tight">Tambah Prestasi Atlet</h3>
                    <input className="w-full rounded-md border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm bg-white dark:bg-neutral-900" placeholder="Nama pertandingan" value={achievementForm.data.competition_name} onChange={(e) => achievementForm.setData('competition_name', e.target.value)} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input className="w-full rounded-md border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm bg-white dark:bg-neutral-900" placeholder="Tingkat" value={achievementForm.data.competition_level} onChange={(e) => achievementForm.setData('competition_level', e.target.value)} />
                        <input className="w-full rounded-md border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm bg-white dark:bg-neutral-900" placeholder="Jenis pertandingan" value={achievementForm.data.competition_type} onChange={(e) => achievementForm.setData('competition_type', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input className="w-full rounded-md border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm bg-white dark:bg-neutral-900" placeholder="Kategori" value={achievementForm.data.category} onChange={(e) => achievementForm.setData('category', e.target.value)} />
                        <input className="w-full rounded-md border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm bg-white dark:bg-neutral-900" placeholder="Hasil" value={achievementForm.data.result_title} onChange={(e) => achievementForm.setData('result_title', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input type="date" className="w-full rounded-md border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm bg-white dark:bg-neutral-900" value={achievementForm.data.competition_date} onChange={(e) => achievementForm.setData('competition_date', e.target.value)} />
                        <input className="w-full rounded-md border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm bg-white dark:bg-neutral-900" placeholder="Lokasi" value={achievementForm.data.location} onChange={(e) => achievementForm.setData('location', e.target.value)} />
                    </div>
                    <input className="w-full rounded-md border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm bg-white dark:bg-neutral-900" placeholder="Penyelenggara" value={achievementForm.data.organizer} onChange={(e) => achievementForm.setData('organizer', e.target.value)} />
                    <textarea className="w-full rounded-md border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm min-h-20 bg-white dark:bg-neutral-900" placeholder="Catatan" value={achievementForm.data.notes} onChange={(e) => achievementForm.setData('notes', e.target.value)} />
                    <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => achievementForm.setData('certificate', e.target.files?.[0] ?? null)} className="w-full text-sm" />
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setAchievementModalOpen(false)} className="w-full sm:w-auto">Batal</Button>
                        <Button type="submit" disabled={achievementForm.processing} className="w-full sm:w-auto">{achievementForm.processing ? 'Menyimpan...' : 'Simpan Prestasi'}</Button>
                    </div>
                </form>
            </Modal>

            {/* ── 3-Level Hierarchy Management Modal ── */}
            <Modal show={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} maxWidth="3xl">
                <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="min-w-0">
                        <h3 className="text-base sm:text-lg font-black uppercase tracking-tight">Kelola Struktur Test Rapor</h3>
                        <p className="text-xs text-neutral-500 mt-0.5">Kategori › Sub-Kategori › Test. Threshold dan tipe pengukuran ada di level test.</p>
                    </div>
                    <button type="button" onClick={() => setCategoryModalOpen(false)} className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors shrink-0 ml-3">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-4 sm:p-6 space-y-5 max-h-[calc(85vh-73px)] overflow-y-auto">
                    <form onSubmit={submitCategory} className="flex items-end gap-2">
                        <div className="flex-1 space-y-1 min-w-0">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Tambah Kategori Baru</label>
                            <Input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} placeholder="Contoh: Power, Strength, Speed..." required />
                        </div>
                        <Button type="submit" disabled={catFormProcessing} className="shrink-0">
                            {catFormProcessing ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                        </Button>
                    </form>

                    {reportCategories.length > 0 && (
                        <div className="space-y-3">
                            {reportCategories.map((cat) => (
                                <div key={cat.id} className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                                    <div className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-800/50 px-3 sm:px-4 py-2.5">
                                        <span className="text-sm font-black uppercase tracking-wider text-neutral-700 dark:text-neutral-200 truncate">{cat.name}</span>
                                        <div className="flex items-center gap-1 shrink-0 ml-2">
                                            <button type="button" onClick={async () => {
                                                const name = await showPrompt('Tambah Sub-Kategori', 'Nama sub-kategori baru:', '');
                                                if (name) router.post(route('report-sub-categories.store'), { report_category_id: cat.id, name }, { preserveScroll: true });
                                            }} className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 hover:text-emerald-600 transition-colors" title="Tambah Sub-Kategori">
                                                <Plus size={13} />
                                            </button>
                                            <button type="button" onClick={async () => {
                                                const name = await showPrompt('Ubah Kategori', 'Ubah nama kategori:', cat.name);
                                                if (name && name !== cat.name) router.patch(route('report-categories.update', cat.id), { name }, { preserveScroll: true });
                                            }} className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 hover:text-blue-600 transition-colors">
                                                <Pencil size={12} />
                                            </button>
                                            <button type="button" onClick={() => deleteCategory(cat.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-600 transition-colors">
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>

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
                                                        }} className="p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 hover:text-blue-600 transition-colors">
                                                            <Pencil size={10} />
                                                        </button>
                                                        <button type="button" onClick={async () => {
                                                            const ok = await showConfirm('Hapus Sub-Kategori', `Hapus sub-kategori "${sub.name}" beserta semua testnya?`);
                                                            if (!ok) return;
                                                            router.delete(route('report-sub-categories.destroy', sub.id), { preserveScroll: true });
                                                        }} className="p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-600 transition-colors">
                                                            <Trash2 size={10} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {(sub.tests || []).map((test) => (
                                                    <div key={test.id} className="flex items-center justify-between rounded-md bg-neutral-50/70 dark:bg-neutral-900/30 px-2.5 sm:px-3 py-1.5 text-[11px] gap-2">
                                                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                                            <span className="font-bold text-neutral-600 dark:text-neutral-300 truncate">{test.name}</span>
                                                            <span className="shrink-0 bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.5 rounded text-neutral-500 font-bold uppercase text-[9px]">
                                                                {test.unit === 'duration' ? 'DUR' : 'REP'}
                                                            </span>
                                                            <span className="text-neutral-400 shrink-0 hidden sm:inline">{test.min_threshold}→{test.max_threshold}</span>
                                                            {test.max_duration_seconds ? <span className="text-neutral-400 shrink-0 hidden sm:inline">({test.max_duration_seconds}s)</span> : null}
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
                                                            }} className="p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 hover:text-blue-600 transition-colors">
                                                                <Pencil size={10} />
                                                            </button>
                                                            <button type="button" onClick={async () => {
                                                                const ok = await showConfirm('Hapus Test', `Hapus test "${test.name}"?`);
                                                                if (!ok) return;
                                                                router.delete(route('report-tests.destroy', test.id), { preserveScroll: true });
                                                            }} className="p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-600 transition-colors">
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
                        </div>
                    )}
                </div>
            </Modal>
        </AdminLayout>
    );
}
