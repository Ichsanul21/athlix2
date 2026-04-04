import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Skeleton } from '@/Components/ui/skeleton';
import { Search, Plus, ChevronRight, Loader2, X, Pencil, Trash2, AlertCircle } from 'lucide-react';
import DbSelect from '@/Components/DbSelect';
import Modal from '@/Components/Modal';
import { useState, useEffect, useCallback } from 'react';

export default function Index({ auth, athletes, flash, filters, belts, suggestedAthleteCode, dojos = [] }) {
    const [search, setSearch] = useState(filters?.search || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [provinces, setProvinces] = useState([]);
    const [regencies, setRegencies] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [villages, setVillages] = useState([]);

    const [loadingProv, setLoadingProv] = useState(false);
    const [loadingReg, setLoadingReg] = useState(false);
    const [loadingDist, setLoadingDist] = useState(false);
    const [loadingVill, setLoadingVill] = useState(false);
    const [guardianPhoneInfo, setGuardianPhoneInfo] = useState(null);
    const [isCheckingPhone, setIsCheckingPhone] = useState(false);
    const [athletePhoneError, setAthletePhoneError] = useState('');
    const [isCheckingPhoneAthlete, setIsCheckingPhoneAthlete] = useState(false);

    useEffect(() => {
        if (isCreateOpen && provinces.length === 0) {
            setLoadingProv(true);
            fetch(route('api.regions.provinces'))
                .then(res => res.json())
                .then(data => setProvinces(data || []))
                .catch(() => { })
                .finally(() => setLoadingProv(false));
        }
    }, [isCreateOpen]);

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

    const initialBeltId = belts?.[0]?.id ?? '';
    const initialDojoId = dojos?.[0]?.id ?? '';
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        full_name: '',
        athlete_code: suggestedAthleteCode || '',
        current_belt_id: initialBeltId,
        dojo_id: initialDojoId,
        birth_place: '',
        phone_number: '',
        dob: '',
        gender: 'M',
        specialization: 'both',
        parent_name: '',
        parent_phone_number: '',
        parent_email: '',
        parent_relation_type: 'parent',
        latest_height: '',
        latest_weight: '',
        class_note: '',
        photo: null,
        doc_kk: null,
        doc_akte: null,
        doc_ktp: null,
        province_code: '',
        province_name: '',
        regency_code: '',
        regency_name: '',
        district_code: '',
        district_name: '',
        village_code: '',
        village_name: '',
        address_detail: '',
        parent_address_detail: '',
        parent_address_same_as_athlete: true,
    });

    useEffect(() => {
        if (!isCreateOpen) {
            setGuardianPhoneInfo(null);
            setIsCheckingPhone(false);
            setAthletePhoneError('');
            setIsCheckingPhoneAthlete(false);
        }
    }, [isCreateOpen]);

    useEffect(() => {
        if (data.parent_address_same_as_athlete) {
            setData('parent_address_detail', data.address_detail);
        }
    }, [data.address_detail, data.parent_address_same_as_athlete, setData]);

    useEffect(() => {
        const checkPhone = async () => {
            const phone = data.parent_phone_number;
            if (phone?.length >= 10) {
                setIsCheckingPhone(true);
                try {
                    const response = await fetch(route('athletes.check-guardian-phone', { phone }));
                    const result = await response.json();
                    setGuardianPhoneInfo(result.found ? result : null);
                } catch (e) { } finally { setIsCheckingPhone(false); }
            } else {
                setGuardianPhoneInfo(null);
            }
        };

        const timeout = setTimeout(checkPhone, 600);
        return () => clearTimeout(timeout);
    }, [data.parent_phone_number]);

    useEffect(() => {
        const checkAthletePhone = async () => {
            if (data.phone_number?.length >= 8) {
                setIsCheckingPhoneAthlete(true);
                try {
                    const response = await fetch(route('api.athletes.check-phone', { phone: data.phone_number }));
                    const result = await response.json();
                    if (!result.available) {
                         setAthletePhoneError(result.message || 'Nomor HP sudah terdaftar.');
                    } else {
                         setAthletePhoneError('');
                    }
                } catch (e) { } finally { setIsCheckingPhoneAthlete(false); }
            } else {
                setAthletePhoneError('');
            }
        };

        const timeout = setTimeout(checkAthletePhone, 600);
        return () => clearTimeout(timeout);
    }, [data.phone_number]);

    // Auto-fill nama dan email jika nomor HP orang tua ditemukan
    useEffect(() => {
        if (guardianPhoneInfo?.found) {
            setData('parent_name', guardianPhoneInfo.name || '');
            setData('parent_email', guardianPhoneInfo.email || '');
        }
    }, [guardianPhoneInfo, setData]);

    useEffect(() => {
        if (belts?.length > 0 && !data.current_belt_id) setData('current_belt_id', belts[0].id);
    }, [belts, data.current_belt_id, setData]);

    useEffect(() => {
        if (dojos?.length > 0 && !data.dojo_id) setData('dojo_id', dojos[0].id);
    }, [dojos, data.dojo_id, setData]);

    useEffect(() => {
        if (suggestedAthleteCode && !data.athlete_code) setData('athlete_code', suggestedAthleteCode);
    }, [suggestedAthleteCode, data.athlete_code, setData]);

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        post(route('athletes.store'), {
            forceFormData: true,
            onSuccess: () => {
                reset();
                clearErrors();
                setIsCreateOpen(false);
            }
        });
    };

    const getConditionTone = (percentage = 0) => {
        if (percentage >= 85) return 'text-green-600';
        if (percentage >= 70) return 'text-blue-600';
        if (percentage >= 55) return 'text-yellow-600';
        return 'text-red-600';
    };

    const isLoading = !athletes;
    const filteredAthletes = isLoading ? [] : athletes;

    const applyFilter = () => {
        const keyword = search.trim();
        router.get(
            route('athletes.index'),
            keyword ? { search: keyword } : {},
            { preserveScroll: true, preserveState: true }
        );
    };

    const resetFilter = () => {
        setSearch('');
        router.get(route('athletes.index'), {}, { preserveScroll: true, preserveState: true });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    if (isLoading) {
        return (
            <AdminLayout
                user={auth?.user}
                header={<h2 className="text-xl font-bold leading-tight text-neutral-800 ">Database Atlet Club</h2>}
            >
                <Head title="Database Atlet" />
                <div className="py-6">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <Skeleton className="h-10 w-full sm:max-w-xs" />
                            <Skeleton className="h-10 w-44" />
                        </div>
                        <div className="hidden md:block">
                            <Skeleton className="h-64 w-full" />
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:hidden">
                            {Array.from({ length: 3 }).map((_, idx) => (
                                <Skeleton key={idx} className="h-28" />
                            ))}
                        </div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout
            user={auth?.user}
            header={<h2 className="text-xl font-bold leading-tight text-neutral-800 ">Database Atlet Club</h2>}
        >
            <Head title="Database Atlet" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* Search & Filter bar */}
                    <div className="flex items-center gap-2 animate-fade-in-up">
                        <div className="relative flex-1 sm:max-w-xl">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                            <Input
                                type="text"
                                placeholder="Filter nama atlet..."
                                className="pl-10 bg-white dark:bg-neutral-900/50"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') applyFilter();
                                }}
                            />
                        </div>
                        <Button type="button" variant="outline" onClick={applyFilter}>Apply</Button>
                        <Button type="button" variant="ghost" onClick={resetFilter}>Reset</Button>
                    </div>

                    {/* Desktop Table View */}
                    <Card className="hidden md:block overflow-hidden border-neutral-200/80 dark:border-neutral-800 animate-fade-in-up fill-both" style={{ animationDelay: '100ms' }}>
                        <CardHeader className="pb-3 px-6 pt-4 border-b border-neutral-100 dark:border-neutral-800">
                            <div className="flex items-center justify-between gap-4">
                                <CardTitle className="text-base font-black uppercase tracking-widest text-neutral-700 dark:text-neutral-300">
                                    Daftar Atlet Club
                                </CardTitle>
                                <Button
                                    onClick={() => setIsCreateOpen(true)}
                                    className="flex items-center gap-2 bg-athlix-red hover:bg-red-700 text-white shadow-lg shadow-red-900/20 rounded-xl px-4 py-2 font-bold text-xs uppercase tracking-wider transition-all duration-200 shrink-0"
                                >
                                    <Plus className="h-4 w-4" /> Registrasi Atlet
                                </Button>
                            </div>
                        </CardHeader>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-neutral-500 uppercase bg-neutral-50/80 dark:bg-neutral-900/80 border-b border-neutral-200/80 dark:border-neutral-800 tracking-widest">
                                    <tr>
                                        <th className="px-4 py-4">Foto</th>
                                        <th className="px-6 py-4">Nama Atlet</th>
                                        <th className="px-6 py-4">Nomor Tanding</th>
                                        <th className="px-6 py-4">Keterangan Kelas</th>
                                        <th className="px-6 py-4">Tanggal Lahir</th>
                                        <th className="px-6 py-4">Kondisi Fisik</th>
                                        <th className="px-6 py-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {filteredAthletes.map((athlete, idx) => (
                                        <tr key={athlete.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-all duration-300 animate-fade-in-up fill-both" style={{ animationDelay: `${150 + idx * 40}ms` }}>
                                            <td className="px-4 py-4">
                                                {athlete.photo_url ? (
                                                    <img
                                                        src={athlete.photo_url}
                                                        alt={athlete.full_name}
                                                        className="w-10 h-10 rounded-xl object-cover border border-athlix-red/20"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-athlix-red/20 to-athlix-red/5 dark:from-athlix-red/30 dark:to-athlix-red/10 border border-athlix-red/10 flex items-center justify-center text-sm font-bold text-athlix-red">
                                                        {athlete.full_name?.charAt(0)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-neutral-900 truncate">
                                                    {athlete.full_name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-neutral-500">
                                                {athlete.category || 'Belum Ditentukan'}
                                            </td>
                                            <td className="px-6 py-4 text-neutral-500">
                                                {athlete.class_note || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-neutral-500">
                                                {formatDate(athlete.dob)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="min-w-[120px]">
                                                    <p className={`text-xs font-black ${getConditionTone(athlete.physical_condition_percentage)}`}>
                                                        {athlete.physical_condition_percentage ?? 0}%
                                                    </p>
                                                    <div className="h-1.5 rounded-full bg-neutral-100 mt-1 overflow-hidden">
                                                        <div className="h-full bg-athlix-red rounded-full" style={{ width: `${Math.max(0, Math.min(100, athlete.physical_condition_percentage ?? 0))}%` }} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end items-center gap-2">
                                                    <Link href={route('athletes.show', athlete.id)}>
                                                        <Button variant="outline" size="sm" className="h-8 text-xs font-bold border-neutral-200 dark:border-neutral-800 hover:bg-athlix-red hover:text-white hover:border-athlix-red transition-all group">
                                                            Rapor
                                                        </Button>
                                                    </Link>
                                                    <Link href={`${route('athletes.show', athlete.id)}?edit=1`}>
                                                        <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-blue-600 border-blue-200 hover:bg-blue-50">
                                                            <Pencil size={13} />
                                                        </Button>
                                                    </Link>
                                                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-600 border-red-200 hover:bg-red-50" onClick={() => router.delete(route('athletes.destroy', athlete.id))}>
                                                        <Trash2 size={13} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredAthletes.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-10 text-center text-sm text-neutral-400">
                                                Data atlet tidak ditemukan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Mobile Card View */}
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                        <div className="flex items-center justify-between gap-4 py-1 px-1">
                            <h3 className="text-sm font-black uppercase tracking-widest text-neutral-700 dark:text-neutral-300">Daftar Atlet</h3>
                            <Button
                                onClick={() => setIsCreateOpen(true)}
                                className="flex items-center gap-2 bg-athlix-red hover:bg-red-700 text-white shadow-lg shadow-red-900/20 rounded-xl px-4 py-2 font-bold text-xs uppercase tracking-wider transition-all duration-200"
                            >
                                <Plus className="h-4 w-4" /> Tambah
                            </Button>
                        </div>
                        {filteredAthletes.map((athlete, idx) => (
                            <Card key={athlete.id} className="border-neutral-200/80 dark:border-neutral-800 card-hover animate-fade-in-up fill-both" style={{ animationDelay: `${idx * 60}ms` }}>
                                <CardContent className="p-4 flex flex-col gap-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            {athlete.photo_url ? (
                                                <img
                                                    src={athlete.photo_url}
                                                    alt={athlete.full_name}
                                                    className="w-11 h-11 rounded-xl object-cover border border-athlix-red/20"
                                                />
                                            ) : (
                                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-athlix-red/20 to-athlix-red/5 flex items-center justify-center text-athlix-red font-bold">
                                                    {athlete.full_name?.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="font-bold text-base">{athlete.full_name}</h3>
                                                <p className="text-xs text-neutral-500">{athlete.category} | {athlete.class_note || '-'}</p>
                                                <p className="text-[11px] text-neutral-400">Status kemampuan: {athlete.ability_status || 'Belum Dinilai'}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold uppercase border border-athlix-red/20 bg-athlix-red/5 ${getConditionTone(athlete.physical_condition_percentage)}`}>
                                            {athlete.physical_condition_percentage ?? 0}%
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
                                        <div className="text-xs text-neutral-500 leading-relaxed">
                                            Tanggal Lahir: <span className="font-bold text-neutral-900">{formatDate(athlete.dob)}</span>
                                        </div>
                                        <Link href={route('athletes.show', athlete.id)}>
                                            <Button variant="outline" size="sm" className="h-8 text-xs font-bold">Lihat Rapor</Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {filteredAthletes.length === 0 && (
                            <div className="py-12 text-center text-sm text-neutral-400">Data atlet tidak ditemukan.</div>
                        )}
                    </div>

                </div>
            </div>

            {/* ── Create Athlete Modal ── */}
            <Modal show={isCreateOpen} onClose={() => setIsCreateOpen(false)} maxWidth="2xl">
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-100 dark:border-neutral-800">
                    <h3 className="text-base sm:text-lg font-black uppercase tracking-tight">Registrasi Atlet Baru</h3>
                    <button type="button" onClick={() => setIsCreateOpen(false)} className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 sm:p-6 max-h-[85vh] overflow-y-auto">
                    <form onSubmit={handleCreateSubmit} className="space-y-4 sm:space-y-5">

                        {/* Data Pribadi */}
                        <div className="space-y-3 sm:space-y-4">
                            <p className="text-xs font-black uppercase tracking-widest text-neutral-400">Data Pribadi Atlet</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div className="sm:col-span-2 space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Nama Lengkap *</label>
                                    <Input
                                        value={data.full_name}
                                        onChange={e => setData('full_name', e.target.value)}
                                        placeholder="Masukkan nama lengkap"
                                        required
                                    />
                                    {errors.full_name && <p className="text-xs text-athlix-red">{errors.full_name}</p>}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">No HP Atlet</label>
                                    <Input
                                        value={data.phone_number}
                                        onChange={e => setData('phone_number', e.target.value)}
                                        placeholder="08xxxxxxxxxx"
                                        required
                                    />
                                    {isCheckingPhoneAthlete && <p className="text-[10px] text-neutral-400 mt-1 animate-pulse italic">Mengecek nomor HP...</p>}
                                    {athletePhoneError && (
                                        <div className="mt-1.5 p-2.5 bg-athlix-red/5 border border-athlix-red/10 rounded-xl animate-in fade-in slide-in-from-top-1">
                                            <p className="text-[11px] font-black uppercase tracking-tight text-athlix-red flex items-center gap-1.5">
                                                <AlertCircle size={13} /> Nomor HP Duplikat
                                            </p>
                                            <p className="text-[10px] text-neutral-600 mt-1 leading-relaxed">
                                                {athletePhoneError}
                                            </p>
                                        </div>
                                    )}
                                    {errors.phone_number && <p className="text-xs text-athlix-red">{errors.phone_number}</p>}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Kode Atlet</label>
                                    <Input
                                        value={data.athlete_code}
                                        onChange={e => setData('athlete_code', e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())}
                                        placeholder="ATH0001"
                                        disabled
                                        className="bg-neutral-100 dark:bg-neutral-800 cursor-not-allowed"
                                        required
                                    />
                                    <p className="text-[10px] text-neutral-400">Kode otomatis, hanya huruf & angka.</p>
                                    {errors.athlete_code && <p className="text-xs text-athlix-red">{errors.athlete_code}</p>}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Tanggal Lahir *</label>
                                    <Input
                                        type="date"
                                        value={data.dob}
                                        onChange={e => setData('dob', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Tempat Lahir</label>
                                    <Input
                                        value={data.birth_place}
                                        onChange={e => setData('birth_place', e.target.value)}
                                        placeholder="Contoh: Samarinda"
                                    />
                                    {errors.birth_place && <p className="text-xs text-athlix-red">{errors.birth_place}</p>}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Gender *</label>
                                    <DbSelect
                                        inputId="athlete-gender"
                                        value={data.gender}
                                        options={[
                                            { value: 'M', label: 'Laki-laki' },
                                            { value: 'F', label: 'Perempuan' }
                                        ]}
                                        onChange={(val) => setData('gender', val)}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Tinggi Badan (cm)</label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={data.latest_height}
                                        onChange={e => setData('latest_height', e.target.value)}
                                        placeholder="170"
                                    />
                                    {errors.latest_height && <p className="text-xs text-athlix-red">{errors.latest_height}</p>}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Berat Badan (kg)</label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={data.latest_weight}
                                        onChange={e => setData('latest_weight', e.target.value)}
                                        placeholder="65.5"
                                    />
                                    {errors.latest_weight && <p className="text-xs text-athlix-red">{errors.latest_weight}</p>}
                                </div>

                                {dojos.length > 0 && (
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Dojo *</label>
                                        <DbSelect
                                            inputId="athlete-create-dojo"
                                            options={dojos.map((dojo) => ({ value: String(dojo.id), label: dojo.name }))}
                                            value={data.dojo_id}
                                            placeholder="Pilih Dojo"
                                            onChange={(next) => setData('dojo_id', next)}
                                        />
                                        {errors.dojo_id && <p className="text-xs text-athlix-red">{errors.dojo_id}</p>}
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Belt Level</label>
                                    <DbSelect
                                        inputId="athlete-create-belt"
                                        options={belts.map((belt) => ({ value: String(belt.id), label: belt.name }))}
                                        value={data.current_belt_id}
                                        placeholder="Pilih Belt"
                                        onChange={(next) => setData('current_belt_id', next)}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Spesialisasi</label>
                                    <DbSelect
                                        inputId="athlete-specialization"
                                        value={data.specialization}
                                        options={[
                                            { value: 'kata', label: 'Kata' },
                                            { value: 'kumite', label: 'Kumite' },
                                            { value: 'both', label: 'Kata & Kumite' }
                                        ]}
                                        onChange={(val) => setData('specialization', val)}
                                    />
                                </div>

                                <div className="sm:col-span-2 space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Keterangan Kelas</label>
                                    <Input
                                        value={data.class_note}
                                        onChange={e => setData('class_note', e.target.value)}
                                        placeholder="Contoh: Senior -67kg"
                                    />
                                    {errors.class_note && <p className="text-xs text-athlix-red">{errors.class_note}</p>}
                                </div>

                                <div className="sm:col-span-2 space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 flex justify-between items-center">
                                        <span>Foto Atlet (Opsional)</span>
                                        <span className="text-[10px] text-neutral-400 normal-case font-medium">Format: JPG, PNG, WEBP. Max: 5MB</span>
                                    </label>
                                    <Input
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp"
                                        onChange={(event) => setData('photo', event.target.files?.[0] || null)}
                                    />
                                    {errors.photo && <p className="text-xs text-athlix-red">{errors.photo}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-600 p-3 sm:p-4 space-y-3">
                            <p className="text-xs font-black uppercase tracking-widest text-neutral-400">Informasi Alamat Tinggal</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Provinsi *</label>
                                    <DbSelect
                                        inputId="athlete-province"
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
                                    {errors.province_code && <p className="text-xs text-athlix-red">{errors.province_code}</p>}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Kota / Kabupaten *</label>
                                    <DbSelect
                                        inputId="athlete-regency"
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
                                    {errors.regency_code && <p className="text-xs text-athlix-red">{errors.regency_code}</p>}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Kecamatan *</label>
                                    <DbSelect
                                        inputId="athlete-district"
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

                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Kelurahan / Desa *</label>
                                    <DbSelect
                                        inputId="athlete-village"
                                        value={data.village_code}
                                        isDisabled={!data.district_code || loadingVill}
                                        options={villages.map(v => ({ value: v.code, label: v.name }))}
                                        onChange={(code, option) => {
                                            setData(data => ({
                                                ...data,
                                                village_code: code,
                                                village_name: option ? option.label : ''
                                            }));
                                        }}
                                        placeholder={loadingVill ? "Memuat..." : "Pilih Kelurahan"}
                                    />
                                </div>

                                <div className="sm:col-span-2 space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Detail Alamat Lengkap *</label>
                                    <textarea
                                        required
                                        value={data.address_detail}
                                        onChange={e => setData('address_detail', e.target.value)}
                                        className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:ring-2 focus:ring-athlix-red/30 focus:border-athlix-red/50 min-h-[80px] text-neutral-900 dark:text-neutral-100"
                                        placeholder="Nama jalan, nomor gedung, dsb..."
                                    />
                                    {errors.address_detail && <p className="text-xs text-athlix-red">{errors.address_detail}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Data Orang Tua */}
                        <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-600 p-3 sm:p-4 space-y-3">
                            <p className="text-xs font-black uppercase tracking-widest text-neutral-400">Data Orang Tua / Wali</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Nama Orang Tua *</label>
                                    <Input
                                        value={data.parent_name}
                                        onChange={e => setData('parent_name', e.target.value)}
                                        placeholder="Nama orang tua"
                                        required
                                    />
                                    {errors.parent_name && <p className="text-xs text-athlix-red">{errors.parent_name}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">No HP Orang Tua *</label>
                                    <Input
                                        value={data.parent_phone_number}
                                        onChange={e => setData('parent_phone_number', e.target.value)}
                                        placeholder="08xxxxxxxxxx"
                                        required
                                    />
                                    {errors.parent_phone_number && <p className="text-xs text-athlix-red">{errors.parent_phone_number}</p>}

                                    {isCheckingPhone && <p className="text-[10px] text-neutral-400 mt-1 animate-pulse italic">Mengecek data nomor HP...</p>}

                                    {guardianPhoneInfo && (
                                        <div className="mt-1.5 p-2.5 bg-athlix-red/5 border border-athlix-red/10 rounded-xl text-xs space-y-1 animate-in fade-in slide-in-from-top-1">
                                            <p className="font-bold text-athlix-red flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                                                Data Nomor HP Ditemukan
                                            </p>
                                            <div className="text-neutral-700 space-y-0.5">
                                                <p>Terdaftar atas nama: <span className="font-bold text-neutral-900">{guardianPhoneInfo.name}</span></p>
                                                <p>Role Akun: <span className="font-bold text-neutral-900">{guardianPhoneInfo.role_label}</span></p>
                                                {guardianPhoneInfo.children?.length > 0 && (
                                                    <p>Atlet ditautkan: <span className="font-bold text-neutral-900">{guardianPhoneInfo.children.join(', ')}</span></p>
                                                )}
                                            </div>
                                            <p className="mt-1 text-[10px] text-neutral-500 leading-tight">
                                                * Jika ini adalah orang tua yang sama, lanjutkan pendaftaran. Nama & Email telah diisi otomatis, sistem akan menautkan atlet baru ke akun yang sudah ada.
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="sm:col-span-2 space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Email Orang Tua</label>
                                    <Input
                                        type="email"
                                        value={data.parent_email}
                                        onChange={e => setData('parent_email', e.target.value)}
                                        placeholder="orangtua@example.com"
                                    />
                                    {errors.parent_email && <p className="text-xs text-athlix-red">{errors.parent_email}</p>}
                                </div>

                                <div className="sm:col-span-2 space-y-3 pt-2">
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800">
                                        <input 
                                            type="checkbox" 
                                            id="parent_address_same" 
                                            checked={data.parent_address_same_as_athlete}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setData('parent_address_same_as_athlete', checked);
                                                if (checked) {
                                                    setData('parent_address_detail', data.address_detail);
                                                }
                                            }}
                                            className="w-4 h-4 rounded text-athlix-red focus:ring-athlix-red border-neutral-300"
                                        />
                                        <label htmlFor="parent_address_same" className="text-xs font-bold uppercase tracking-tight text-neutral-600 cursor-pointer">
                                            Alamat orang tua sama dengan alamat atlet
                                        </label>
                                    </div>

                                    {!data.parent_address_same_as_athlete && (
                                        <div className="space-y-1 animate-in fade-in slide-in-from-top-1">
                                            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Detail Alamat Orang Tua *</label>
                                            <textarea
                                                required
                                                value={data.parent_address_detail}
                                                onChange={e => setData('parent_address_detail', e.target.value)}
                                                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:ring-2 focus:ring-athlix-red/30 focus:border-athlix-red/50 min-h-[80px] text-neutral-900 dark:text-neutral-100"
                                                placeholder="Masukkan alamat lengkap orang tua..."
                                            />
                                            {errors.parent_address_detail && <p className="text-xs text-athlix-red">{errors.parent_address_detail}</p>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-600 p-3 sm:p-4 space-y-3">
                            <p className="text-xs font-black uppercase tracking-widest text-neutral-400 flex justify-between items-center">
                                <span>Dokumen Registrasi <span className="text-athlix-red normal-case tracking-normal">(Minimal 1 wajib)</span></span>
                                <span className="text-[10px] text-neutral-400 normal-case font-medium">Format: JPG, PNG, PDF. Max: 5MB</span>
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">KK</label>
                                    <Input
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.pdf"
                                        onChange={(event) => setData('doc_kk', event.target.files?.[0] || null)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Akte</label>
                                    <Input
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.pdf"
                                        onChange={(event) => setData('doc_akte', event.target.files?.[0] || null)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">KTP</label>
                                    <Input
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.pdf"
                                        onChange={(event) => setData('doc_ktp', event.target.files?.[0] || null)}
                                    />
                                </div>
                            </div>
                            {(errors.doc_kk || errors.doc_akte || errors.doc_ktp) && (
                                <p className="text-xs text-athlix-red">{errors.doc_kk || errors.doc_akte || errors.doc_ktp}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
                            <Button type="submit" className="w-full h-12 text-base font-bold" disabled={processing}>
                                {processing && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                                Daftarkan Atlet
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </AdminLayout>
    );
}
