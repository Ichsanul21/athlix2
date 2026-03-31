import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { CreditCard, ArrowUpRight, ArrowDownLeft, Search, MessageCircle, Check, HandCoins, Settings2 } from 'lucide-react';
import { Input } from '@/Components/ui/input';
import { Skeleton } from '@/Components/ui/skeleton';
import { Button } from '@/Components/ui/button';
import Modal from '@/Components/Modal';
import DbSelect from '@/Components/DbSelect';
import { useEffect, useMemo, useState } from 'react';

const DYNAMIC_BILLING_BASE = '/finance-api/billing/dynamic';

export default function Index({
    auth,
    records,
    filters,
    adminFee = 5000,
    flash,
    athletes = [],
    dojos = [],
    selectedDojoId = null,
    billingDefaults = [],
    billingOverrides = [],
    overrideRequests = [],
    canManageDynamicBilling = false,
    canRequestDynamicBilling = false,
    canDirectSenseiNominal = false,
}) {
    const [search, setSearch] = useState(filters?.search || '');
    const [confirmationModal, setConfirmationModal] = useState({ show: false, action: null, record: null });
    const [customModal, setCustomModal] = useState({ show: false, record: null });
    const [dojoId, setDojoId] = useState(selectedDojoId || '');
    const [dynamicDefaults, setDynamicDefaults] = useState(billingDefaults || []);
    const [dynamicOverrides, setDynamicOverrides] = useState(billingOverrides || []);
    const [dynamicLoading, setDynamicLoading] = useState(false);
    const [dynamicError, setDynamicError] = useState('');
    const [dynamicSuccess, setDynamicSuccess] = useState('');
    const [defaultForm, setDefaultForm] = useState({
        monthly_fee: '',
        class_note: '',
        effective_from: '',
        effective_to: '',
    });
    const [overrideForm, setOverrideForm] = useState({
        athlete_id: '',
        override_mode: 'discount_amount',
        override_value: '',
        reason: '',
        valid_from: '',
        valid_to: '',
    });
    const canAdjustNominalDirectly = canManageDynamicBilling || canDirectSenseiNominal;
    const {
        data: customForm,
        setData: setCustomForm,
        post: postCustomNominal,
        processing: customProcessing,
        errors: customErrors,
        clearErrors: clearCustomErrors,
        reset: resetCustomForm,
    } = useForm({ new_amount: '', reason: '' });

    const isLoading = !records;
    const sourceRecords = records ?? [];

    useEffect(() => {
        setDojoId(selectedDojoId || '');
    }, [selectedDojoId]);

    useEffect(() => {
        setDynamicDefaults(billingDefaults || []);
        setDynamicOverrides(billingOverrides || []);
    }, [billingDefaults, billingOverrides]);

    const filteredRecords = useMemo(() => {
        const normalized = search.trim().toLowerCase();
        if (!normalized) return sourceRecords;

        return sourceRecords.filter((record) => {
            const candidateValues = [
                record.description,
                record.athlete?.full_name,
                record.athlete?.athlete_code,
                record.athlete_condition,
            ]
                .filter(Boolean)
                .map((value) => value.toString().toLowerCase());

            return candidateValues.some((value) => value.includes(normalized));
        });
    }, [sourceRecords, search]);

    const resolveTenantId = () => {
        const fromSelect = Number(dojoId || 0);
        if (fromSelect > 0) return fromSelect;

        const fromInitial = Number(selectedDojoId || 0);
        if (fromInitial > 0) return fromInitial;

        const fromUser = Number(auth?.user?.dojo_id || 0);
        return fromUser > 0 ? fromUser : 0;
    };

    const parseApiError = async (response, fallbackMessage) => {
        const payload = await response.json().catch(() => ({}));
        if (payload?.errors) {
            const firstErrorKey = Object.keys(payload.errors)[0];
            if (firstErrorKey && payload.errors[firstErrorKey]?.[0]) {
                return payload.errors[firstErrorKey][0];
            }
        }

        return payload?.message || fallbackMessage;
    };

    const csrfToken = typeof document !== 'undefined'
        ? document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
        : null;

    const jsonHeaders = (includeBody = false) => ({
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(includeBody ? { 'Content-Type': 'application/json' } : {}),
        ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
    });

    const fetchDynamicBillingData = async () => {
        if (!canManageDynamicBilling) return;
        const tenantId = resolveTenantId();
        if (tenantId <= 0) return;

        setDynamicLoading(true);
        setDynamicError('');
        try {
            const [defaultsResponse, overridesResponse] = await Promise.all([
                fetch(`${DYNAMIC_BILLING_BASE}/defaults?tenant_id=${tenantId}`, {
                    headers: jsonHeaders(),
                    credentials: 'same-origin',
                }),
                fetch(`${DYNAMIC_BILLING_BASE}/overrides?tenant_id=${tenantId}`, {
                    headers: jsonHeaders(),
                    credentials: 'same-origin',
                }),
            ]);

            if (!defaultsResponse.ok || !overridesResponse.ok) {
                setDynamicError('Gagal memuat data dynamic billing.');
                return;
            }

            const defaultsPayload = await defaultsResponse.json();
            const overridesPayload = await overridesResponse.json();

            setDynamicDefaults(defaultsPayload?.items || []);
            setDynamicOverrides(overridesPayload?.items || []);
        } catch (error) {
            setDynamicError('Terjadi gangguan saat mengambil data dynamic billing.');
        } finally {
            setDynamicLoading(false);
        }
    };

    useEffect(() => {
        if (!canManageDynamicBilling) return;
        fetchDynamicBillingData();
    }, [dojoId, selectedDojoId, canManageDynamicBilling]);

    const submitDefaultRule = async (event) => {
        event.preventDefault();
        const tenantId = resolveTenantId();
        if (tenantId <= 0) {
            setDynamicError('Tenant dojo belum dipilih.');
            return;
        }

        setDynamicLoading(true);
        setDynamicError('');
        setDynamicSuccess('');

        try {
            const response = await fetch(`${DYNAMIC_BILLING_BASE}/defaults`, {
                method: 'POST',
                headers: jsonHeaders(true),
                credentials: 'same-origin',
                body: JSON.stringify({
                    tenant_id: tenantId,
                    monthly_fee: Number(defaultForm.monthly_fee),
                    class_note: defaultForm.class_note || null,
                    effective_from: defaultForm.effective_from || null,
                    effective_to: defaultForm.effective_to || null,
                }),
            });

            if (!response.ok) {
                const message = await parseApiError(response, 'Gagal menyimpan default billing.');
                setDynamicError(message);
                return;
            }

            setDynamicSuccess('Default billing berhasil disimpan.');
            setDefaultForm({
                monthly_fee: '',
                class_note: '',
                effective_from: '',
                effective_to: '',
            });
            await fetchDynamicBillingData();
        } catch (error) {
            setDynamicError('Terjadi gangguan saat menyimpan default billing.');
        } finally {
            setDynamicLoading(false);
        }
    };

    const submitOverrideRule = async (event) => {
        event.preventDefault();
        const tenantId = resolveTenantId();
        if (tenantId <= 0) {
            setDynamicError('Tenant dojo belum dipilih.');
            return;
        }

        if (!overrideForm.athlete_id) {
            setDynamicError('Pilih atlet terlebih dahulu untuk override.');
            return;
        }

        setDynamicLoading(true);
        setDynamicError('');
        setDynamicSuccess('');

        try {
            const response = await fetch(`${DYNAMIC_BILLING_BASE}/overrides`, {
                method: 'POST',
                headers: jsonHeaders(true),
                credentials: 'same-origin',
                body: JSON.stringify({
                    tenant_id: tenantId,
                    athlete_id: Number(overrideForm.athlete_id),
                    override_mode: overrideForm.override_mode,
                    override_value: Number(overrideForm.override_value),
                    reason: overrideForm.reason || null,
                    valid_from: overrideForm.valid_from || null,
                    valid_to: overrideForm.valid_to || null,
                }),
            });

            if (!response.ok) {
                const message = await parseApiError(response, 'Gagal menyimpan athlete override.');
                setDynamicError(message);
                return;
            }

            setDynamicSuccess('Override billing atlet berhasil disimpan.');
            setOverrideForm({
                athlete_id: '',
                override_mode: 'discount_amount',
                override_value: '',
                reason: '',
                valid_from: '',
                valid_to: '',
            });
            await fetchDynamicBillingData();
        } catch (error) {
            setDynamicError('Terjadi gangguan saat menyimpan override billing.');
        } finally {
            setDynamicLoading(false);
        }
    };

    if (isLoading) {
        return (
            <AdminLayout user={auth?.user} header={<h2 className="text-xl font-bold tracking-tight uppercase">Manajemen Keuangan</h2>}>
                <Head title="Finance" />
                <div className="py-6">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                            {Array.from({ length: 3 }).map((_, idx) => (<Skeleton key={idx} className="h-24" />))}
                        </div>
                        <Skeleton className="h-72 w-full" />
                    </div>
                </div>
            </AdminLayout>
        );
    }

    const totalRevenue = filteredRecords.filter((r) => r.status === 'paid').reduce((acc, r) => acc + parseFloat(r.total_amount || r.amount), 0);
    const totalOutstanding = filteredRecords.filter((r) => r.status !== 'paid').reduce((acc, r) => acc + parseFloat(r.total_amount || r.amount), 0);
    const unpaidAthleteCount = new Set(
        filteredRecords
            .filter((r) => r.status !== 'paid')
            .map((r) => r.athlete?.id)
            .filter(Boolean)
    ).size;
    const paidAthletes = new Set(
        filteredRecords
            .filter((r) => r.status === 'paid')
            .map((r) => r.athlete?.id)
            .filter(Boolean)
    ).size;
    const primaAthletes = new Set(
        filteredRecords
            .filter((r) => r.athlete_condition?.toLowerCase() === 'prima')
            .map((r) => r.athlete?.id)
            .filter(Boolean)
    ).size;
    const nonPrimaAthletes = new Set(
        filteredRecords
            .filter((r) => r.athlete_condition && r.athlete_condition?.toLowerCase() !== 'prima')
            .map((r) => r.athlete?.id)
            .filter(Boolean)
    ).size;

    const formatIDR = (amount) => new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(amount || 0);
    const statusBadgeClass = (status) => {
        if (status === 'approved') {
            return 'bg-green-100 text-green-700';
        }
        if (status === 'rejected') {
            return 'bg-red-100 text-red-700';
        }
        return 'bg-amber-100 text-amber-700';
    };

    const closeModal = () => setConfirmationModal({ show: false, action: null, record: null });

    const confirmAction = () => {
        if (confirmationModal.action === 'generate') {
            if (!canManageDynamicBilling) {
                closeModal();
                return;
            }
            router.post(route('finance.generate'), dojoId ? { dojo_id: dojoId } : {}, { onFinish: closeModal });
            return;
        }

        if (confirmationModal.action === 'markPaid' && confirmationModal.record) {
            if (!canManageDynamicBilling) {
                closeModal();
                return;
            }
            router.patch(route('finance.update', confirmationModal.record.id), {}, { onFinish: closeModal });
        }
    };

    const openCustomModal = (record) => {
        if (!canAdjustNominalDirectly) {
            return;
        }
        setCustomModal({ show: true, record });
        clearCustomErrors();
        setCustomForm({
            new_amount: String(record.amount || ''),
            reason: '',
        });
    };

    const submitCustomNominal = () => {
        if (!customModal.record || !canAdjustNominalDirectly) return;
        postCustomNominal(route('finance.customize', customModal.record.id), {
            preserveScroll: true,
            data: {
                ...customForm,
            },
            onSuccess: () => {
                setCustomModal({ show: false, record: null });
                resetCustomForm();
            },
        });
    };

    return (
        <AdminLayout user={auth?.user} header={<h2 className="text-xl font-bold tracking-tight uppercase">Manajemen Keuangan</h2>}>
            <Head title="Finance" />


            {/* Dynamic Billing Local Feedback Modal */}
            {(dynamicError || dynamicSuccess) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => { setDynamicError(''); setDynamicSuccess(''); }}>
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 text-center space-y-3" onClick={(e) => e.stopPropagation()}>
                        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${dynamicError ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                            <Check size={24} />
                        </div>
                        <p className={`text-sm font-bold ${dynamicError ? 'text-red-600' : 'text-emerald-600'}`}>{dynamicError || dynamicSuccess}</p>
                        <button type="button" onClick={() => { setDynamicError(''); setDynamicSuccess(''); }} className="w-full rounded-xl bg-neutral-900 text-white py-2.5 text-sm font-bold hover:bg-neutral-800 transition">Tutup</button>
                    </div>
                </div>
            )}


            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                        <Card className="bg-green-50/80 dark:bg-green-900/10 border-green-200/50 dark:border-green-900/20">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs text-green-600  font-bold uppercase tracking-widest">Total Terbayar</p>
                                        <h3 className="text-xl sm:text-2xl font-black mt-1">{formatIDR(totalRevenue)}</h3>
                                    </div>
                                    <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-xl">
                                        <ArrowUpRight className="text-green-600" size={20} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-red-50/80 dark:bg-athlix-red/5 border-red-200/50 dark:border-athlix-red/10">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs text-athlix-red font-bold uppercase tracking-widest">Total Tunggakan</p>
                                        <h3 className="text-xl sm:text-2xl font-black mt-1">{formatIDR(totalOutstanding)}</h3>
                                    </div>
                                    <div className="p-2.5 bg-athlix-red/10 rounded-xl">
                                        <ArrowDownLeft className="text-athlix-red" size={20} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-neutral-200/80 dark:border-neutral-800">
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start w-full">
                                    <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Statistik Atlet</p>
                                    <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                                        <CreditCard size={18} />
                                    </div>
                                </div>
                                <div className="mt-2 grid grid-cols-2 gap-2 text-sm pt-1">
                                    <div className="bg-neutral-50 dark:bg-neutral-900/50 p-2 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                        <p className="text-[10px] text-neutral-500 uppercase font-bold text-center">SPP (Lunas/Blm)</p>
                                        <p className="font-black text-center mt-1 text-base">{paidAthletes} <span className="text-neutral-300 mx-1">/</span> <span className="text-athlix-red">{unpaidAthleteCount}</span></p>
                                    </div>
                                    <div className="bg-neutral-50 dark:bg-neutral-900/50 p-2 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                        <p className="text-[10px] text-neutral-500 uppercase font-bold text-center">Fisik (Prima/Tdk)</p>
                                        <p className="font-black text-center mt-1 text-base">{primaAthletes} <span className="text-neutral-300 mx-1">/</span> <span className="text-amber-500">{nonPrimaAthletes}</span></p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {canManageDynamicBilling && (
                        <Card className="border-neutral-200/80 dark:border-neutral-800">
                            <CardHeader className="border-b border-neutral-100 dark:border-neutral-800">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                                    <Settings2 size={14} className="text-athlix-red" />
                                    Dynamic Billing Rules
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6 space-y-5">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <form onSubmit={submitDefaultRule} className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 p-4 space-y-3">
                                        <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Default Bulanan</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input
                                                type="number"
                                                min="0"
                                                placeholder="Nominal (IDR)"
                                                value={defaultForm.monthly_fee}
                                                onChange={(e) => setDefaultForm((prev) => ({ ...prev, monthly_fee: e.target.value }))}
                                                required
                                            />
                                            <Input
                                                type="text"
                                                placeholder="Class note (opsional)"
                                                value={defaultForm.class_note}
                                                onChange={(e) => setDefaultForm((prev) => ({ ...prev, class_note: e.target.value }))}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input
                                                type="date"
                                                value={defaultForm.effective_from}
                                                onChange={(e) => setDefaultForm((prev) => ({ ...prev, effective_from: e.target.value }))}
                                            />
                                            <Input
                                                type="date"
                                                value={defaultForm.effective_to}
                                                onChange={(e) => setDefaultForm((prev) => ({ ...prev, effective_to: e.target.value }))}
                                            />
                                        </div>
                                        <Button type="submit" size="sm" disabled={dynamicLoading}>
                                            {dynamicLoading ? 'Menyimpan...' : 'Simpan Default'}
                                        </Button>
                                    </form>

                                    <form onSubmit={submitOverrideRule} className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 p-4 space-y-3">
                                        <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Override Atlet</p>
                                        <DbSelect
                                            inputId="finance-override-athlete"
                                            options={athletes.map((athlete) => ({ value: String(athlete.id), label: athlete.full_name }))}
                                            value={overrideForm.athlete_id}
                                            placeholder="Pilih Atlet"
                                            onChange={(next) => setOverrideForm((prev) => ({ ...prev, athlete_id: next }))}
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <DbSelect
                                                inputId="finance-override-mode"
                                                value={overrideForm.override_mode}
                                                options={[
                                                    { value: 'fixed', label: 'Fixed' },
                                                    { value: 'discount_amount', label: 'Diskon Nominal' },
                                                    { value: 'discount_percent', label: 'Diskon Persen' }
                                                ]}
                                                onChange={(val) => setOverrideForm((prev) => ({ ...prev, override_mode: val }))}
                                                placeholder="Mode Override"
                                            />
                                            <Input
                                                type="number"
                                                min="0"
                                                placeholder="Nilai override"
                                                value={overrideForm.override_value}
                                                onChange={(e) => setOverrideForm((prev) => ({ ...prev, override_value: e.target.value }))}
                                                required
                                            />
                                        </div>
                                        <Input
                                            type="text"
                                            placeholder="Alasan override"
                                            value={overrideForm.reason}
                                            onChange={(e) => setOverrideForm((prev) => ({ ...prev, reason: e.target.value }))}
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input
                                                type="date"
                                                value={overrideForm.valid_from}
                                                onChange={(e) => setOverrideForm((prev) => ({ ...prev, valid_from: e.target.value }))}
                                            />
                                            <Input
                                                type="date"
                                                value={overrideForm.valid_to}
                                                onChange={(e) => setOverrideForm((prev) => ({ ...prev, valid_to: e.target.value }))}
                                            />
                                        </div>
                                        <Button type="submit" size="sm" disabled={dynamicLoading}>
                                            {dynamicLoading ? 'Menyimpan...' : 'Simpan Override'}
                                        </Button>
                                    </form>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 p-4 space-y-3">
                                        <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Default Aktif</p>
                                        {dynamicDefaults.length > 0 ? dynamicDefaults.slice(0, 8).map((item) => (
                                            <div key={item.id} className="rounded-xl border border-neutral-100 dark:border-neutral-800 px-3 py-2 text-xs">
                                                <p className="font-bold">Rp {Number(item.monthly_fee || 0).toLocaleString('id-ID')}</p>
                                                <p className="text-neutral-500">Class: {item.class_note || '-'}</p>
                                                <p className="text-neutral-500">Periode: {item.effective_from || '-'} s/d {item.effective_to || '-'}</p>
                                            </div>
                                        )) : (
                                            <p className="text-sm text-neutral-400">Belum ada default billing.</p>
                                        )}
                                    </div>

                                    <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 p-4 space-y-3">
                                        <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Override Terbaru</p>
                                        {dynamicOverrides.length > 0 ? dynamicOverrides.slice(0, 8).map((item) => (
                                            <div key={item.id} className="rounded-xl border border-neutral-100 dark:border-neutral-800 px-3 py-2 text-xs">
                                                <p className="font-bold">{item.athlete?.full_name || '-'}</p>
                                                <p className="text-neutral-500">Mode: {item.override_mode} | Nilai: {Number(item.override_value || 0).toLocaleString('id-ID')}</p>
                                                <p className="text-neutral-500">Periode: {item.valid_from || '-'} s/d {item.valid_to || '-'}</p>
                                            </div>
                                        )) : (
                                            <p className="text-sm text-neutral-400">Belum ada override billing.</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="border-neutral-200/80 dark:border-neutral-800">
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500">Daftar Tagihan</CardTitle>
                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                                <div className="relative w-full sm:max-w-xs">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                    <Input
                                        type="text"
                                        placeholder="Cari invoice/atlet..."
                                        className="pl-10 h-9"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                                {dojos.length > 0 && (
                                    <DbSelect
                                        inputId="finance-dojo-filter"
                                        className="w-full sm:w-[220px]"
                                        options={dojos.map((dojo) => ({ value: String(dojo.id), label: dojo.name }))}
                                        value={dojoId || ''}
                                        placeholder="Pilih Dojo"
                                        onChange={(next) => {
                                            setDojoId(next);
                                            router.get(route('finance.index'), next ? { dojo_id: next } : {}, { preserveScroll: true });
                                        }}
                                    />
                                )}
                                {canManageDynamicBilling && (
                                    <Button
                                        onClick={() => setConfirmationModal({ show: true, action: 'generate', record: null })}
                                        className="w-full sm:w-auto bg-athlix-black text-white hover:bg-athlix-black/90 text-xs font-bold uppercase tracking-widest whitespace-normal leading-tight"
                                        size="sm"
                                        disabled={dojos.length > 0 && !dojoId}
                                    >
                                        Buat Tagihan Bulanan
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-neutral-500 uppercase font-black bg-neutral-50/80 dark:bg-neutral-900/80 border-b border-neutral-200/80 dark:border-neutral-800 tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4">Atlet</th>
                                            <th className="px-6 py-4">Keterangan</th>
                                            <th className="px-6 py-4">Jumlah</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Jatuh Tempo</th>
                                            <th className="px-6 py-4 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {filteredRecords.map((rec) => (
                                            <tr key={rec.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30">
                                                <td className="px-6 py-4">
                                                    <p className="font-bold">{rec.athlete?.full_name}</p>
                                                    <p className="text-xs uppercase text-neutral-500">{rec.athlete?.athlete_code}</p>
                                                </td>
                                                <td className="px-6 py-4 text-xs">
                                                    <p>{rec.description}</p>
                                                    <p className="text-xs text-neutral-500 mt-1">Kondisi atlet: {rec.athlete_condition || '-'}</p>
                                                </td>
                                                <td className="px-6 py-4 font-mono">
                                                    <p className="font-bold">{formatIDR(rec.total_amount || rec.amount)}</p>
                                                    <p className="text-xs text-neutral-500">Rincian: {formatIDR(rec.amount)} + Admin {formatIDR(rec.admin_fee || adminFee)}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-widest ${
                                                        rec.status === 'paid'
                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 '
                                                            : 'bg-red-100 text-athlix-red dark:bg-athlix-red/10 '
                                                    }`}>
                                                        {rec.status === 'paid' ? 'Lunas' : 'Belum Lunas'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-mono text-neutral-500 whitespace-nowrap">{rec.due_date}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {canAdjustNominalDirectly && rec.status === 'unpaid' && (
                                                            <>
                                                                {canManageDynamicBilling && (
                                                                    <button
                                                                        onClick={() => setConfirmationModal({ show: true, action: 'markPaid', record: rec })}
                                                                        className="p-2 rounded-lg bg-blue-500/10 text-blue-600"
                                                                        title="Tandai Lunas"
                                                                    >
                                                                        <Check size={16} />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => openCustomModal(rec)}
                                                                    className="p-2 rounded-lg bg-amber-500/10 text-amber-600"
                                                                    title="Custom Nominal"
                                                                >
                                                                    <HandCoins size={16} />
                                                                </button>
                                                            </>
                                                        )}
                                                        <button
                                                            onClick={() => {
                                                                const message = `Halo ${rec.athlete?.full_name}, ini pengingat pembayaran ${rec.description} sebesar ${formatIDR(rec.total_amount || rec.amount)}. Jatuh tempo: ${rec.due_date}.`;
                                                                window.open(`https://wa.me/${rec.athlete?.phone_number || ''}?text=${encodeURIComponent(message)}`, '_blank');
                                                            }}
                                                            className="p-2 rounded-lg bg-green-500/10 text-green-600"
                                                            title="Kirim Pengingat WA"
                                                        >
                                                            <MessageCircle size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredRecords.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-10 text-center text-sm text-neutral-400">
                                                    Data pembayaran tidak ditemukan.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-neutral-200/80 dark:border-neutral-800">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500">Audit Penyesuaian Tarif</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            {filteredRecords.flatMap((record) => (record.adjustments || []).map((item) => ({ ...item, athlete: record.athlete?.full_name }))).slice(0, 8).map((item) => (
                                <div key={item.id} className="p-3 rounded-xl border border-neutral-200/80 dark:border-neutral-800">
                                    <p className="font-semibold">{item.athlete}</p>
                                    <p className="text-xs text-neutral-500">{formatIDR(item.old_amount)} {'->'} {formatIDR(item.new_amount)} | Delta: {formatIDR(item.delta_amount)}</p>
                                    <p className="text-xs text-neutral-600 ">Alasan: {item.reason}</p>
                                    <p className="text-xs text-neutral-400">{item.created_at}</p>
                                </div>
                            ))}
                            {filteredRecords.flatMap((record) => record.adjustments || []).length === 0 && (
                                <p className="text-sm text-neutral-400">Belum ada perubahan nominal yang tercatat.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Modal show={confirmationModal.show} onClose={closeModal} maxWidth="md">
                <div className="p-6 space-y-4">
                    <h3 className="text-lg font-black uppercase tracking-tight">
                        {confirmationModal.action === 'generate' ? 'Buat Tagihan Bulanan' : 'Konfirmasi Pembayaran'}
                    </h3>
                    <p className="text-sm text-neutral-600 ">
                        {confirmationModal.action === 'generate'
                            ? 'Terbitkan tagihan iuran bulanan baru untuk semua atlet aktif sekarang?'
                            : `Tandai tagihan ${confirmationModal.record?.description || ''} atas nama ${confirmationModal.record?.athlete?.full_name || ''} sebagai lunas?`}
                    </p>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={closeModal}>Batal</Button>
                        <Button type="button" onClick={confirmAction}>Ya, Lanjutkan</Button>
                    </div>
                </div>
            </Modal>

            <Modal show={customModal.show} onClose={() => setCustomModal({ show: false, record: null })} maxWidth="lg">
                <div className="p-6 space-y-4">
                    <h3 className="text-lg font-black uppercase tracking-tight text-neutral-900">
                        Penyesuaian Nominal SPP
                    </h3>
                    <p className="text-sm text-neutral-700">
                        Perubahan nominal langsung diterapkan ke tagihan atlet dan tercatat pada audit log.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Nominal Baru</label>
                            <Input
                                type="number"
                                min="0"
                                value={customForm.new_amount}
                                onChange={(e) => setCustomForm('new_amount', e.target.value)}
                                placeholder="Contoh: 125000"
                            />
                            {customErrors.new_amount && <p className="text-xs text-athlix-red">{customErrors.new_amount}</p>}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Alasan Penyesuaian</label>
                        <textarea
                            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm min-h-24 text-neutral-900"
                            value={customForm.reason}
                            onChange={(e) => setCustomForm('reason', e.target.value)}
                            placeholder="Contoh: penyesuaian khusus dari manajemen dojo"
                        />
                        {customErrors.reason && <p className="text-xs text-athlix-red">{customErrors.reason}</p>}
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setCustomModal({ show: false, record: null })}>Batal</Button>
                        <Button type="button" onClick={submitCustomNominal} disabled={customProcessing}>
                            {customProcessing ? 'Menyimpan...' : 'Simpan Penyesuaian'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}

