import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Loader2, ChevronDown, CheckCircle } from 'lucide-react';
import DbSelect from '@/Components/DbSelect';

const formatCurrency = (amount) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

export default function RegistrationModal({ show, onClose, priceLists = [], initialPlan = null }) {
    // Helper to get prices from priceLists
    const getPlanPricing = () => {
        const pricing = {};
        priceLists.forEach(plan => {
            pricing[plan.title] = plan.price;
        });
        return pricing;
    };

    const getOriginalPricing = () => {
        const pricing = {};
        priceLists.forEach(plan => {
            pricing[plan.title] = plan.original_price;
        });
        return pricing;
    };

    const PLAN_PRICING = getPlanPricing();
    const ORIGINAL_PRICING = getOriginalPricing();

    const planOptions = priceLists.map(plan => ({
        value: plan.title,
        label: `${plan.title} (${formatCurrency(plan.price)}/bln)`
    }));

    const [provinces, setProvinces] = useState([]);
    const [regencies, setRegencies] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [villages, setVillages] = useState([]);

    const [loadingProv, setLoadingProv] = useState(false);
    const [loadingReg, setLoadingReg] = useState(false);
    const [loadingDist, setLoadingDist] = useState(false);
    const [loadingVill, setLoadingVill] = useState(false);

    const [isSuccess, setIsSuccess] = useState(false);

    const { data, setData, post, processing, errors, reset, setError, clearErrors } = useForm({
        dojo_name: '',
        pic_name: '',
        pic_email: '',
        pic_phone: '',
        saas_plan_name: priceLists.length > 0 ? priceLists[0].title : 'Basic',
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
        timezone: 'Asia/Jakarta',
    });

    const [emailChecking, setEmailChecking] = useState(false);

    const checkEmail = async (email) => {
        if (!email || !email.includes('@')) return;
        setEmailChecking(true);
        try {
            const res = await fetch(route('landing.check-email', { email }));
            const result = await res.json();
            if (!result.available) {
                setError('pic_email', 'Email ini sudah terdaftar di sistem kami.');
            } else {
                clearErrors('pic_email');
            }
        } catch (e) {}
        setEmailChecking(false);
    };

    useEffect(() => {
        if (show && initialPlan) {
            setData('saas_plan_name', initialPlan);
        }
    }, [show, initialPlan]);

    useEffect(() => {
        if (show && provinces.length === 0) {
            setLoadingProv(true);
            fetch(route('api.regions.provinces'))
                .then(res => res.json())
                .then(data => setProvinces(data || []))
                .catch(() => { })
                .finally(() => setLoadingProv(false));
        }
    }, [show]);

    const fetchRegencies = useCallback(async (provinceCode) => {
        if (!provinceCode) { setRegencies([]); return; }
        setLoadingReg(true);
        try {
            const res = await fetch(route('api.regions.regencies', provinceCode));
            const data = await res.json();
            setRegencies(data || []);
        } catch { setRegencies([]); }
        setLoadingReg(false);
    }, []);

    const fetchDistricts = useCallback(async (regencyCode) => {
        if (!regencyCode) { setDistricts([]); return; }
        setLoadingDist(true);
        try {
            const res = await fetch(route('api.regions.districts', regencyCode));
            const data = await res.json();
            setDistricts(data || []);
        } catch { setDistricts([]); }
        setLoadingDist(false);
    }, []);

    const fetchVillages = useCallback(async (districtCode) => {
        if (!districtCode) { setVillages([]); return; }
        setLoadingVill(true);
        try {
            const res = await fetch(route('api.regions.villages', districtCode));
            const data = await res.json();
            setVillages(data || []);
        } catch { setVillages([]); }
        setLoadingVill(false);
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route('landing.register-dojo'), {
            preserveScroll: true,
            onSuccess: () => {
                setIsSuccess(true);
                // Biarkan modal terbuka selama beberapa detik lalu tutup
                setTimeout(() => {
                    onClose();
                    reset();
                    setIsSuccess(false);
                }, 4000);
            },
        });
    };

    if (isSuccess) {
        return (
            <Modal show={show} onClose={onClose} maxWidth="md">
                <div className="p-8 text-center space-y-4">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                    <h2 className="text-2xl font-black text-slate-900">Pendaftaran Berhasil!</h2>
                    <p className="text-slate-500 text-sm">
                        Terima kasih telah mendaftar. Tim kami akan segera meninjau permintaan Anda dan menghubungi Anda melalui email atau WhatsApp.
                    </p>
                    <Button onClick={onClose} className="mt-4 w-full bg-slate-900 text-white">
                        Tutup
                    </Button>
                </div>
            </Modal>
        );
    }

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl">
            <div className="p-6 sm:p-8 bg-slate-50 border-b border-slate-200">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Daftar Free Trial 14 Hari</h2>
                <p className="text-sm text-slate-500 mt-1">Lengkapi data Dojo Anda. Bebas biaya tanpa kartu kredit.</p>
            </div>

            <form onSubmit={submit} className="p-6 sm:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Info Dojo & PIC */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b pb-2">Data Registrasi</h3>

                        <div>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">Nama Dojo / Sasana *</label>
                            <Input
                                required
                                value={data.dojo_name}
                                onChange={e => setData('dojo_name', e.target.value)}
                                placeholder="Contoh: Garuda Karate Club"
                                className="h-11 bg-white text-neutral-900"
                            />
                            {errors.dojo_name && <p className="text-red-500 text-xs mt-1">{errors.dojo_name}</p>}
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">Nama Penanggung Jawab (PIC) *</label>
                            <Input
                                required
                                value={data.pic_name}
                                onChange={e => setData('pic_name', e.target.value)}
                                placeholder="Nama Lengkap"
                                className="h-11 bg-white text-neutral-900"
                            />
                            {errors.pic_name && <p className="text-red-500 text-xs mt-1">{errors.pic_name}</p>}
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">Email Valid *</label>
                            <div className="relative">
                                <Input
                                    required
                                    type="email"
                                    value={data.pic_email}
                                    onChange={e => {
                                        setData('pic_email', e.target.value);
                                        clearErrors('pic_email');
                                    }}
                                    onBlur={(e) => checkEmail(e.target.value)}
                                    placeholder="alamat@email.com"
                                    className={`h-11 bg-white text-neutral-900 ${errors.pic_email ? 'border-red-500 focus:ring-red-500' : ''}`}
                                />
                                {emailChecking && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Loader2 size={14} className="animate-spin text-slate-400" />
                                    </div>
                                )}
                            </div>
                            {errors.pic_email && <p className="text-red-500 text-xs mt-1">{errors.pic_email}</p>}
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">No. WhatsApp *</label>
                            <Input
                                required
                                value={data.pic_phone}
                                onChange={e => setData('pic_phone', e.target.value)}
                                placeholder="081234567890"
                                className="h-11 bg-white text-neutral-900"
                            />
                            {errors.pic_phone && <p className="text-red-500 text-xs mt-1">{errors.pic_phone}</p>}
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">Paket Pilihan *</label>
                            <DbSelect
                                value={data.saas_plan_name}
                                onChange={(value) => setData('saas_plan_name', value)}
                                options={planOptions}
                                placeholder="Pilih Paket Langganan"
                            />
                            {errors.saas_plan_name && <p className="text-red-500 text-xs mt-1">{errors.saas_plan_name}</p>}
                        </div>

                        {/* Total Billing Summary */}
                        {data.saas_plan_name && (
                            <div className="rounded-xl bg-slate-100 border border-slate-200 p-4 space-y-1.5 text-sm">
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Ringkasan Biaya</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600">Biaya bulanan</span>
                                    <div className="flex flex-col items-end">
                                        {Number(ORIGINAL_PRICING[data.saas_plan_name]) > Number(PLAN_PRICING[data.saas_plan_name]) && (
                                            <span className="text-xs text-slate-400 line-through">{formatCurrency(ORIGINAL_PRICING[data.saas_plan_name])}</span>
                                        )}
                                        <span className="font-semibold text-slate-800">{formatCurrency(PLAN_PRICING[data.saas_plan_name] ?? 0)}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-green-600 font-semibold">Free Trial (14 hari)</span>
                                    <span className="font-bold text-green-600">GRATIS</span>
                                </div>
                                <div className="border-t border-slate-200 pt-1.5 flex justify-between items-end">
                                    <span className="text-slate-500 text-xs">Tagihan setelah trial berakhir</span>
                                    <div className="flex flex-col items-end">
                                        {Number(ORIGINAL_PRICING[data.saas_plan_name]) > Number(PLAN_PRICING[data.saas_plan_name]) && (
                                            <span className="text-[10px] text-slate-400 line-through leading-none">{formatCurrency(ORIGINAL_PRICING[data.saas_plan_name])}</span>
                                        )}
                                        <span className="font-black text-slate-800">{formatCurrency(PLAN_PRICING[data.saas_plan_name] ?? 0)}<span className="text-xs font-normal">/bln</span></span>
                                    </div>
                                </div>
                                <div className="border-t border-slate-200 pt-1.5 flex justify-between rounded bg-green-50 px-2 py-1 mt-2">
                                    <span className="text-green-700 font-bold text-sm">Total Tagihan Saat Ini</span>
                                    <span className="font-black text-green-700 text-sm">Rp 0</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Regional Selectors */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b pb-2">Informasi Lokasi</h3>

                        <div>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">Provinsi *</label>
                            <DbSelect
                                value={data.province_code}
                                isDisabled={loadingProv}
                                options={provinces.map(p => ({ value: p.code, label: p.name }))}
                                onChange={(code, option) => {
                                    setData(data => ({
                                        ...data,
                                        province_code: code,
                                        province_name: option ? option.label : '',
                                        regency_code: '', regency_name: '',
                                        district_code: '', district_name: '',
                                        village_code: '', village_name: ''
                                    }));
                                    fetchRegencies(code);
                                }}
                                placeholder={loadingProv ? "Memuat..." : "Pilih Provinsi"}
                            />
                            {errors.province_code && <p className="text-red-500 text-xs mt-1">{errors.province_code}</p>}
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">Kota / Kabupaten *</label>
                            <DbSelect
                                value={data.regency_code}
                                isDisabled={!data.province_code || loadingReg}
                                options={regencies.map(r => ({ value: r.code, label: r.name }))}
                                onChange={(code, option) => {
                                    setData(data => ({
                                        ...data,
                                        regency_code: code,
                                        regency_name: option ? option.label : '',
                                        district_code: '', district_name: '',
                                        village_code: '', village_name: ''
                                    }));
                                    fetchDistricts(code);
                                }}
                                placeholder={loadingReg ? "Memuat..." : "Pilih Kota/Kab"}
                            />
                            {errors.regency_code && <p className="text-red-500 text-xs mt-1">{errors.regency_code}</p>}
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">Kecamatan *</label>
                            <DbSelect
                                value={data.district_code}
                                isDisabled={!data.regency_code || loadingDist}
                                options={districts.map(d => ({ value: d.code, label: d.name }))}
                                onChange={(code, option) => {
                                    setData(data => ({
                                        ...data,
                                        district_code: code,
                                        district_name: option ? option.label : '',
                                        village_code: '', village_name: ''
                                    }));
                                    fetchVillages(code);
                                }}
                                placeholder={loadingDist ? "Memuat..." : "Pilih Kecamatan"}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">Kelurahan / Desa *</label>
                            <DbSelect
                                value={data.village_code}
                                isDisabled={!data.district_code || loadingVill}
                                options={villages.map(v => ({ value: v.code, label: v.name }))}
                                onChange={(code, option) => {
                                    setData('village_code', code);
                                    setData('village_name', option ? option.label : '');
                                }}
                                placeholder={loadingVill ? "Memuat..." : "Pilih Kelurahan"}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">Detail Alamat Lengkap *</label>
                            <textarea
                                required
                                value={data.address_detail}
                                onChange={e => setData('address_detail', e.target.value)}
                                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-athlix-red/30 focus:border-athlix-red/50 min-h-[80px] text-neutral-900"
                                placeholder="Nama jalan, nomor gedung, dsb..."
                            />
                            {errors.address_detail && <p className="text-red-500 text-xs mt-1">{errors.address_detail}</p>}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 justify-end pt-6 border-t border-slate-200">
                    <Button type="button" variant="outline" className="border-slate-300 text-slate-700" onClick={onClose}>
                        Batal
                    </Button>
                    <Button type="submit" disabled={processing} className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 font-bold uppercase tracking-wide">
                        {processing ? <Loader2 size={16} className="animate-spin mr-2" /> : 'Kirim Pendaftaran'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
