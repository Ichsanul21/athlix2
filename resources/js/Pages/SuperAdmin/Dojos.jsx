import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { useState, useEffect, useCallback } from 'react';
import Modal from '@/Components/Modal';
import { Plus, X, MapPin, Building2, Globe, ChevronDown, Loader2 } from 'lucide-react';

const PLAN_OPTIONS = ['Basic', 'Pro', 'Advance'];

import DbSelect from '@/Components/DbSelect';

// Badge component for displaying region info
function RegionBadge({ icon: Icon, label, value }) {
    if (!value) return null;
    return (
        <span className="inline-flex items-center gap-1.5 text-xs bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-100 dark:border-neutral-800 rounded-lg px-2.5 py-1 font-medium">
            <Icon size={11} className="text-athlix-red/70" />
            {label && <span className="text-neutral-400">{label}:</span>}
            {value}
        </span>
    );
}

export default function Dojos({ auth, dojos = [], planPricing = {}, provinceTimezones = {} }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Region cascading state
    const [provinces, setProvinces] = useState([]);
    const [regencies, setRegencies] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [villages, setVillages] = useState([]);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingRegencies, setLoadingRegencies] = useState(false);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [loadingVillages, setLoadingVillages] = useState(false);

    const resettableFields = [
        'name', 'contact_name', 'contact_email', 'contact_phone',
        'country', 'province_code', 'province_name',
        'regency_code', 'regency_name', 'district_code', 'district_name',
        'village_code', 'village_name', 'address_detail',
        'timezone', 'is_active', 'saas_plan_name', 'monthly_saas_fee',
        'billing_cycle_months', 'subscription_started_at',
        'subscription_expires_at', 'grace_period_stage1_ends_at', 'grace_period_ends_at',
        'is_saas_blocked', 'saas_block_reason',
    ];

    const defaultFormState = {
        name: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        country: 'ID',
        province_code: '',
        province_name: '',
        regency_code: '',
        regency_name: '',
        district_code: '',
        district_name: '',
        village_code: '',
        village_name: '',
        address_detail: '',
        timezone: 'Asia/Makassar',
        is_active: true,
        saas_plan_name: 'Basic',
        monthly_saas_fee: planPricing['Basic'] || 300000,
        billing_cycle_months: 1,
        subscription_started_at: new Date().toISOString().slice(0, 10),
        subscription_expires_at: '',
        grace_period_stage1_ends_at: '',
        grace_period_ends_at: '',
        is_saas_blocked: false,
        saas_block_reason: '',
    };

    const form = useForm({ ...defaultFormState });

    // Auto-compute subscription dates from started_at + billing_cycle_months
    const computeSubscriptionDates = (startedAt, cycleMonths) => {
        if (!startedAt || !cycleMonths) return {};
        const start = new Date(startedAt);
        const expires = new Date(start);
        expires.setMonth(expires.getMonth() + Number(cycleMonths));
        expires.setDate(expires.getDate() - 1);
        const stage1 = new Date(expires);
        stage1.setDate(stage1.getDate() + 14);
        const stage2 = new Date(expires);
        stage2.setDate(stage2.getDate() + 28);
        return {
            subscription_expires_at: expires.toISOString().slice(0, 10),
            grace_period_stage1_ends_at: stage1.toISOString().slice(0, 10),
            grace_period_ends_at: stage2.toISOString().slice(0, 10),
        };
    };

    const onBillingCycleChange = (value) => {
        const computed = computeSubscriptionDates(form.data.subscription_started_at, value);
        form.setData({ ...form.data, billing_cycle_months: value, ...computed });
    };

    const onStartedAtChange = (value) => {
        const computed = computeSubscriptionDates(value, form.data.billing_cycle_months);
        form.setData({ ...form.data, subscription_started_at: value, ...computed });
    };

    const resetForm = () => {
        form.reset(...resettableFields);
        Object.entries(defaultFormState).forEach(([key, value]) => {
            form.setData(key, value);
        });
        setRegencies([]);
        setDistricts([]);
        setVillages([]);
    };

    const formatDateInput = (value) => (value ? String(value).slice(0, 10) : '');
    const formatCurrency = (num) => 'Rp ' + Number(num).toLocaleString('id-ID');

    // Fetch provinces on mount
    const fetchProvinces = useCallback(async () => {
        if (provinces.length > 0) return;
        setLoadingProvinces(true);
        try {
            const res = await fetch(route('api.regions.provinces'));
            const data = await res.json();
            setProvinces(data || []);
        } catch { /* silently fail */ }
        setLoadingProvinces(false);
    }, [provinces.length]);

    const fetchRegencies = useCallback(async (provinceCode) => {
        if (!provinceCode) { setRegencies([]); return; }
        setLoadingRegencies(true);
        try {
            const res = await fetch(route('api.regions.regencies', provinceCode));
            const data = await res.json();
            setRegencies(data || []);
        } catch { setRegencies([]); }
        setLoadingRegencies(false);
    }, []);

    const fetchDistricts = useCallback(async (regencyCode) => {
        if (!regencyCode) { setDistricts([]); return; }
        setLoadingDistricts(true);
        try {
            const res = await fetch(route('api.regions.districts', regencyCode));
            const data = await res.json();
            setDistricts(data || []);
        } catch { setDistricts([]); }
        setLoadingDistricts(false);
    }, []);

    const fetchVillages = useCallback(async (districtCode) => {
        if (!districtCode) { setVillages([]); return; }
        setLoadingVillages(true);
        try {
            const res = await fetch(route('api.regions.villages', districtCode));
            const data = await res.json();
            setVillages(data || []);
        } catch { setVillages([]); }
        setLoadingVillages(false);
    }, []);

    // When province changes → auto-set timezone, reset downstream
    const onProvinceChange = (code, option) => {
        const tz = provinceTimezones[code] || 'Asia/Makassar';
        form.setData({
            ...form.data,
            province_code: code,
            province_name: option?.label || '',
            regency_code: '',
            regency_name: '',
            district_code: '',
            district_name: '',
            village_code: '',
            village_name: '',
            timezone: tz,
        });
        setDistricts([]);
        setVillages([]);
        fetchRegencies(code);
    };

    const onRegencyChange = (code, option) => {
        form.setData({
            ...form.data,
            regency_code: code,
            regency_name: option?.label || '',
            district_code: '',
            district_name: '',
            village_code: '',
            village_name: '',
        });
        setVillages([]);
        fetchDistricts(code);
    };

    const onDistrictChange = (code, option) => {
        form.setData({
            ...form.data,
            district_code: code,
            district_name: option?.label || '',
            village_code: '',
            village_name: '',
        });
        fetchVillages(code);
    };

    const onVillageChange = (code, option) => {
        form.setData({
            ...form.data,
            village_code: code,
            village_name: option?.label || '',
        });
    };

    // When SaaS plan changes → auto-set monthly fee
    const onPlanChange = (plan) => {
        const fee = planPricing[plan] || 0;
        form.setData({
            ...form.data,
            saas_plan_name: plan,
            monthly_saas_fee: fee,
        });
    };

    const submit = () => {
        if (editingId) {
            form.patch(route('super-admin.dojos.update', editingId), {
                onSuccess: () => {
                    setEditingId(null);
                    resetForm();
                },
            });
            return;
        }

        form.post(route('super-admin.dojos.store'), {
            onSuccess: () => {
                resetForm();
                setIsModalOpen(false);
            },
        });
    };

    const openModal = async (dojo = null) => {
        await fetchProvinces();

        if (dojo) {
            setEditingId(dojo.id);
            form.setData({
                name: dojo.name || '',
                contact_name: dojo.contact_name || '',
                contact_email: dojo.contact_email || '',
                contact_phone: dojo.contact_phone || '',
                country: dojo.country || 'ID',
                province_code: dojo.province_code || '',
                province_name: dojo.province_name || '',
                regency_code: dojo.regency_code || '',
                regency_name: dojo.regency_name || '',
                district_code: dojo.district_code || '',
                district_name: dojo.district_name || '',
                village_code: dojo.village_code || '',
                village_name: dojo.village_name || '',
                address_detail: dojo.address_detail || '',
                timezone: dojo.timezone || 'Asia/Makassar',
                is_active: !!dojo.is_active,
                saas_plan_name: dojo.saas_plan_name || 'Basic',
                monthly_saas_fee: dojo.monthly_saas_fee ?? planPricing['Basic'] ?? 300000,
                billing_cycle_months: dojo.billing_cycle_months || 1,
                subscription_started_at: formatDateInput(dojo.subscription_started_at),
                subscription_expires_at: formatDateInput(dojo.subscription_expires_at),
                grace_period_stage1_ends_at: formatDateInput(dojo.grace_period_stage1_ends_at),
                grace_period_ends_at: formatDateInput(dojo.grace_period_ends_at),
                is_saas_blocked: !!dojo.is_saas_blocked,
                saas_block_reason: dojo.saas_block_reason || '',
            });

            // Load cascading data for existing dojo
            if (dojo.province_code) {
                fetchRegencies(dojo.province_code);
            }
            if (dojo.regency_code) {
                fetchDistricts(dojo.regency_code);
            }
            if (dojo.district_code) {
                fetchVillages(dojo.district_code);
            }
        } else {
            setEditingId(null);
            resetForm();
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        resetForm();
    };

    // Compute the resolved timezone label
    const resolvedTimezone = form.data.province_code
        ? (provinceTimezones[form.data.province_code] || 'Asia/Makassar')
        : form.data.timezone;

    const timezoneLabel = resolvedTimezone === 'Asia/Jakarta'
        ? 'WIB (UTC+7)'
        : resolvedTimezone === 'Asia/Makassar'
            ? 'WITA (UTC+8)'
            : resolvedTimezone === 'Asia/Jayapura'
                ? 'WIT (UTC+9)'
                : resolvedTimezone;

    return (
        <AdminLayout
            user={auth?.user}
            header={<h2 className="text-xl font-bold tracking-tight uppercase">Master Dojo</h2>}
        >
            <Head title="Master Dojo" />
            <div className="space-y-6 py-4">

                <Modal show={isModalOpen} onClose={closeModal} maxWidth="4xl">
                    <div className="p-6 max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black uppercase tracking-tight">
                                {editingId ? 'Edit Dojo' : 'Tambah Dojo'}
                            </h3>
                            <button onClick={closeModal} className="text-neutral-500 hover:text-neutral-700 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Section: Info Dojo */}
                        <div className="mb-6">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3 flex items-center gap-2">
                                <Building2 size={13} /> Informasi Dojo
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    className="text-sm"
                                    placeholder="Nama Dojo"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                />
                                <div className="flex items-center gap-3 text-sm">
                                    <span className="text-neutral-500 whitespace-nowrap">Timezone:</span>
                                    <span className="font-semibold text-athlix-red">{timezoneLabel}</span>
                                    <span className="text-[11px] text-neutral-400">({resolvedTimezone})</span>
                                </div>
                            </div>

                            {/* Contact / PIC Fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                                <label className="text-sm font-semibold space-y-1.5">
                                    <span className="block text-neutral-500">Nama PIC/Kontak</span>
                                    <Input
                                        className="text-sm"
                                        placeholder="Nama penanggung jawab"
                                        value={form.data.contact_name}
                                        onChange={(e) => form.setData('contact_name', e.target.value)}
                                    />
                                    {form.errors.contact_name && <p className="text-xs text-athlix-red">{form.errors.contact_name}</p>}
                                </label>
                                <label className="text-sm font-semibold space-y-1.5">
                                    <span className="block text-neutral-500">Email PIC</span>
                                    <Input
                                        type="email"
                                        className="text-sm"
                                        placeholder="pic@email.com"
                                        value={form.data.contact_email}
                                        onChange={(e) => form.setData('contact_email', e.target.value)}
                                    />
                                    {form.errors.contact_email && <p className="text-xs text-athlix-red">{form.errors.contact_email}</p>}
                                </label>
                                <label className="text-sm font-semibold space-y-1.5">
                                    <span className="block text-neutral-500">No HP PIC</span>
                                    <Input
                                        className="text-sm"
                                        placeholder="08xxxxxxxxxx"
                                        value={form.data.contact_phone}
                                        onChange={(e) => form.setData('contact_phone', e.target.value)}
                                    />
                                    {form.errors.contact_phone && <p className="text-xs text-athlix-red">{form.errors.contact_phone}</p>}
                                </label>
                            </div>
                        </div>

                        {/* Section: Alamat / Region */}
                        <div className="mb-6 p-4 rounded-2xl bg-neutral-50/80 dark:bg-neutral-900/40 border border-neutral-100 dark:border-neutral-800">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3 flex items-center gap-2">
                                <MapPin size={13} /> Alamat Dojo
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <label className="text-sm font-semibold space-y-1.5">
                                    <span className="block text-neutral-500">Negara</span>
                                    <DbSelect
                                        inputId="dojo-country"
                                        value={form.data.country}
                                        onChange={(val) => form.setData('country', val)}
                                        options={[{ value: 'ID', label: '🇮🇩 Indonesia' }]}
                                        placeholder="Pilih Negara"
                                    />
                                </label>
                                <label className="text-sm font-semibold space-y-1.5">
                                    <span className="block text-neutral-500">Provinsi</span>
                                    <DbSelect
                                        value={form.data.province_code}
                                        onChange={onProvinceChange}
                                        options={provinces.map((p) => ({ value: p.code, label: p.name }))}
                                        placeholder={loadingProvinces ? 'Memuat...' : 'Pilih Provinsi'}
                                        isDisabled={loadingProvinces}
                                    />
                                </label>
                                <label className="text-sm font-semibold space-y-1.5">
                                    <span className="block text-neutral-500">Kab/Kota</span>
                                    <DbSelect
                                        value={form.data.regency_code}
                                        onChange={onRegencyChange}
                                        options={regencies.map((r) => ({ value: r.code, label: r.name }))}
                                        placeholder={loadingRegencies ? 'Memuat...' : 'Pilih Kab/Kota'}
                                        isDisabled={!form.data.province_code || loadingRegencies}
                                    />
                                </label>
                                <label className="text-sm font-semibold space-y-1.5">
                                    <span className="block text-neutral-500">Kecamatan</span>
                                    <DbSelect
                                        value={form.data.district_code}
                                        onChange={onDistrictChange}
                                        options={districts.map((d) => ({ value: d.code, label: d.name }))}
                                        placeholder={loadingDistricts ? 'Memuat...' : 'Pilih Kecamatan'}
                                        isDisabled={!form.data.regency_code || loadingDistricts}
                                    />
                                </label>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                <label className="text-sm font-semibold space-y-1.5">
                                    <span className="block text-neutral-500">Kelurahan/Desa</span>
                                    <DbSelect
                                        value={form.data.village_code}
                                        onChange={onVillageChange}
                                        options={villages.map((v) => ({ value: v.code, label: v.name }))}
                                        placeholder={loadingVillages ? 'Memuat...' : 'Pilih Kelurahan'}
                                        isDisabled={!form.data.district_code || loadingVillages}
                                    />
                                </label>
                                <label className="text-sm font-semibold space-y-1.5">
                                    <span className="block text-neutral-500">Alamat Detail</span>
                                    <Input
                                        className="text-sm"
                                        placeholder="Jl. No. RT/RW, Gedung Lt., dll."
                                        value={form.data.address_detail}
                                        onChange={(e) => form.setData('address_detail', e.target.value)}
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Section: Paket & Billing */}
                        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-neutral-50/80 to-transparent dark:from-neutral-900/40 border border-neutral-100 dark:border-neutral-800">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3 flex items-center gap-2">
                                <Globe size={13} /> Paket SaaS & Billing
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <label className="text-sm font-semibold space-y-1.5">
                                    <span className="block text-neutral-500">Paket SaaS</span>
                                    <DbSelect
                                        value={form.data.saas_plan_name}
                                        onChange={onPlanChange}
                                        options={PLAN_OPTIONS.map((p) => ({
                                            value: p,
                                            label: `${p} — ${formatCurrency(planPricing[p] || 0)}/bln`,
                                        }))}
                                        placeholder="Pilih Paket"
                                    />
                                </label>
                                <label className="text-sm font-semibold space-y-1.5">
                                    <span className="block text-neutral-500">Biaya Bulanan</span>
                                    <div className="flex h-10 w-full items-center rounded-xl border border-neutral-200 bg-neutral-100 dark:bg-neutral-900 px-3 text-sm font-bold text-athlix-red dark:border-neutral-800">
                                        {formatCurrency(form.data.monthly_saas_fee)}
                                    </div>
                                </label>
                                <label className="text-sm font-semibold space-y-1.5">
                                    <span className="block text-neutral-500">Siklus Billing (bulan)</span>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="24"
                                        value={form.data.billing_cycle_months}
                                        onChange={(e) => onBillingCycleChange(e.target.value)}
                                    />
                                </label>
                            </div>

                            {/* Total billing callout */}
                            {form.data.billing_cycle_months > 1 && (
                                <div className="mt-3 rounded-xl bg-athlix-red/5 border border-athlix-red/20 px-4 py-2.5 text-sm">
                                    <span className="text-neutral-600">Total tagihan untuk </span>
                                    <strong className="text-athlix-red">{form.data.billing_cycle_months} bulan</strong>
                                    <span className="text-neutral-600"> = </span>
                                    <strong className="text-athlix-red text-base">{formatCurrency(Number(form.data.monthly_saas_fee) * Number(form.data.billing_cycle_months))}</strong>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
                                <label className="text-sm font-semibold space-y-1.5">
                                    <span className="block text-neutral-500">Mulai Langganan</span>
                                    <Input
                                        type="date"
                                        value={form.data.subscription_started_at}
                                        onChange={(e) => onStartedAtChange(e.target.value)}
                                    />
                                </label>
                                <label className="text-sm font-semibold space-y-1.5">
                                    <span className="block text-neutral-500">Berakhir Langganan</span>
                                    <Input
                                        type="date"
                                        value={form.data.subscription_expires_at}
                                        onChange={(e) => form.setData('subscription_expires_at', e.target.value)}
                                        className="bg-neutral-50 dark:bg-neutral-900"
                                    />
                                    <p className="text-[10px] text-neutral-400">Auto dari mulai + siklus</p>
                                </label>
                                <label className="text-sm font-semibold space-y-1.5">
                                    <span className="block text-neutral-500">Grace Tahap 1 (Peringatan)</span>
                                    <Input
                                        type="date"
                                        value={form.data.grace_period_stage1_ends_at}
                                        onChange={(e) => form.setData('grace_period_stage1_ends_at', e.target.value)}
                                        className="bg-neutral-50 dark:bg-neutral-900"
                                    />
                                    <p className="text-[10px] text-neutral-400">Auto: berakhir + 14 hari</p>
                                </label>
                                <label className="text-sm font-semibold space-y-1.5">
                                    <span className="block text-neutral-500">Grace Tahap 2 (Terbatas)</span>
                                    <Input
                                        type="date"
                                        value={form.data.grace_period_ends_at}
                                        onChange={(e) => form.setData('grace_period_ends_at', e.target.value)}
                                        className="bg-neutral-50 dark:bg-neutral-900"
                                    />
                                    <p className="text-[10px] text-neutral-400">Auto: berakhir + 28 hari</p>
                                </label>
                            </div>
                        </div>

                        {/* Section: Access Control */}
                        <div className="mb-4">
                            <div className="flex flex-col gap-2 justify-center">
                                <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={!!form.data.is_active}
                                        onChange={(e) => form.setData('is_active', e.target.checked)}
                                        className="rounded text-athlix-red focus:ring-athlix-red"
                                    />
                                    Beri Izin Akses Aktif
                                </label>
                                <label className="flex items-center gap-2 text-sm font-semibold text-red-600 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={!!form.data.is_saas_blocked}
                                        onChange={(e) => form.setData('is_saas_blocked', e.target.checked)}
                                        className="rounded text-red-600 focus:ring-red-600"
                                    />
                                    Blokir Paksa Akses SaaS Server
                                </label>
                            </div>
                            {form.data.is_saas_blocked && (
                                <Input
                                    className="text-sm mt-3 border-red-300 focus-visible:ring-red-500"
                                    placeholder="Alasan pemblokiran (akan muncul di layar pengguna)..."
                                    value={form.data.saas_block_reason}
                                    onChange={(e) => form.setData('saas_block_reason', e.target.value)}
                                />
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100">
                            <Button type="button" variant="outline" onClick={closeModal}>Batal</Button>
                            <Button onClick={submit} disabled={form.processing}>
                                {form.processing ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 size={14} className="animate-spin" /> Menyimpan...
                                    </span>
                                ) : editingId ? 'Simpan Perubahan' : 'Simpan Dojo'}
                            </Button>
                        </div>
                    </div>
                </Modal>

                <Card>
                    <CardHeader className="pb-3 px-6 pt-4 border-b border-neutral-100 dark:border-neutral-800">
                        <div className="flex items-center justify-between gap-4">
                            <CardTitle className="text-base font-black uppercase tracking-widest text-neutral-700 dark:text-neutral-300">
                                Daftar Dojo Aktif
                            </CardTitle>
                            <Button
                                onClick={() => openModal()}
                                className="flex items-center gap-2 bg-athlix-red hover:bg-red-700 text-white shadow-lg shadow-red-900/20 rounded-xl px-4 py-2 font-bold text-xs uppercase tracking-wider transition-all duration-200 shrink-0"
                            >
                                <Plus size={14} /> Tambah Dojo
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {dojos.map((dojo) => (
                            <div key={dojo.id} className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors">
                                <div className="min-w-0 space-y-1.5">
                                    <p className="font-semibold truncate text-base">{dojo.name}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {dojo.province_name && (
                                            <RegionBadge icon={MapPin} value={[dojo.village_name, dojo.district_name, dojo.regency_name, dojo.province_name].filter(Boolean).join(', ')} />
                                        )}
                                        <RegionBadge icon={Globe} value={dojo.timezone} />
                                    </div>
                                    {dojo.address_detail && (
                                        <p className="text-xs text-neutral-500 italic">{dojo.address_detail}</p>
                                    )}
                                    <p className="text-xs text-neutral-500">
                                        Paket: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{dojo.saas_plan_name || '-'}</span>
                                        {dojo.monthly_saas_fee ? ` — ${formatCurrency(dojo.monthly_saas_fee)}/bln` : ''}
                                    </p>
                                    {(dojo.contact_name || dojo.contact_email || dojo.contact_phone) && (
                                        <p className="text-xs text-neutral-500">
                                            PIC: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{dojo.contact_name || '-'}</span>
                                            {dojo.contact_phone ? ` · ${dojo.contact_phone}` : ''}
                                            {dojo.contact_email ? ` · ${dojo.contact_email}` : ''}
                                        </p>
                                    )}
                                    <p className="text-xs text-neutral-500">Status akses: {dojo.access_status || (dojo.is_active ? 'Aktif' : 'Nonaktif')}</p>
                                    <p className="text-xs text-neutral-500">Langganan: {dojo.subscription_started_at ? formatDateInput(dojo.subscription_started_at) : '-'} s/d {dojo.subscription_expires_at ? formatDateInput(dojo.subscription_expires_at) : '-'}</p>
                                    <p className="text-xs text-neutral-500">
                                        Grace Tahap 1: {dojo.grace_period_stage1_ends_at ? formatDateInput(dojo.grace_period_stage1_ends_at) : '-'}
                                        {' | '}Grace Tahap 2: {dojo.grace_period_ends_at ? formatDateInput(dojo.grace_period_ends_at) : '-'}
                                    </p>
                                    <p className="text-xs text-neutral-500">Akun user: {dojo.users_count ?? 0} | Atlet: {dojo.athletes_count ?? 0}</p>
                                    {dojo.is_saas_blocked && dojo.saas_block_reason && (
                                        <p className="text-xs text-red-600">Alasan blokir: {dojo.saas_block_reason}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <button
                                        className="text-blue-600 text-sm hover:underline"
                                        onClick={() => openModal(dojo)}
                                    >Edit</button>
                                    <button className="text-red-500 text-sm hover:underline" onClick={() => router.delete(route('super-admin.dojos.destroy', dojo.id))}>Hapus</button>
                                </div>
                            </div>
                        ))}
                        {dojos.length === 0 && <div className="text-sm text-neutral-400 py-6 text-center">Belum ada data dojo.</div>}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
