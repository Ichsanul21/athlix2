import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Skeleton } from '@/Components/ui/skeleton';
import { Search, Plus, ChevronRight, Loader2, X } from 'lucide-react';
import DbSelect from '@/Components/DbSelect';
import Modal from '@/Components/Modal';
import { useState, useEffect } from 'react';

export default function Index({ auth, athletes, flash, filters, belts, suggestedAthleteCode, dojos = [] }) {
    const [search, setSearch] = useState(filters?.search || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);

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
    });

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
                header={<h2 className="text-xl font-bold leading-tight text-neutral-800 ">Database Atlet Dojo</h2>}
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
            header={<h2 className="text-xl font-bold leading-tight text-neutral-800 ">Database Atlet Dojo</h2>}
        >
            <Head title="Database Atlet" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
                    
                    {flash?.success && (
                        <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-xl dark:bg-green-900/30  animate-fade-in-up border border-green-200 dark:border-green-800">
                            {flash.success}
                        </div>
                    )}

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
                                    Daftar Atlet Dojo
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
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    {athlete.photo_url ? (
                                                        <img
                                                            src={athlete.photo_url}
                                                            alt={athlete.full_name}
                                                            className="w-10 h-10 rounded-xl object-cover border border-athlix-red/20"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-athlix-red/20 to-athlix-red/5 dark:from-athlix-red/30 dark:to-athlix-red/10 border border-athlix-red/10 flex items-center justify-center text-sm font-bold text-athlix-red transition-transform duration-300 hover:scale-110">
                                                            {athlete.full_name?.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div className="font-bold text-neutral-900  truncate">
                                                        {athlete.full_name}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-neutral-500 ">
                                                {athlete.category || 'Belum Ditentukan'}
                                            </td>
                                            <td className="px-6 py-4 text-neutral-500 ">
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
                                                <Link href={route('athletes.show', athlete.id)}>
                                                    <Button variant="outline" size="sm" className="h-8 text-xs font-bold border-neutral-200 dark:border-neutral-800 hover:bg-athlix-red hover:text-white hover:border-athlix-red transition-all group">
                                                        Lihat Rapor
                                                        <ChevronRight size={14} className="ml-1 transition-transform group-hover:translate-x-0.5" />
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredAthletes.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-10 text-center text-sm text-neutral-400">
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
                                            Tanggal Lahir: <span className="font-bold text-neutral-900 ">{formatDate(athlete.dob)}</span>
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

            <Modal show={isCreateOpen} onClose={() => setIsCreateOpen(false)} maxWidth="2xl">
                <div className="flex items-center justify-between p-4 mb-2 border-b border-neutral-100">
                    <h3 className="text-lg font-black uppercase tracking-tight">Registrasi Atlet Baru</h3>
                    <button type="button" onClick={() => setIsCreateOpen(false)} className="text-neutral-500 hover:text-neutral-700">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 max-h-[85vh] overflow-y-auto w-full">
                    <form onSubmit={handleCreateSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-1">
                                <label className="text-sm font-medium">Full Name</label>
                                <Input 
                                    value={data.full_name} 
                                    onChange={e => setData('full_name', e.target.value)} 
                                    placeholder="Enter full name"
                                    required
                                />
                                {errors.full_name && <p className="text-xs text-athlix-red">{errors.full_name}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">No HP Atlet</label>
                                <Input
                                    value={data.phone_number}
                                    onChange={e => setData('phone_number', e.target.value)}
                                    placeholder="08xxxxxxxxxx"
                                    required
                                />
                                {errors.phone_number && <p className="text-xs text-athlix-red">{errors.phone_number}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Athlete ID Code</label>
                                <Input 
                                    value={data.athlete_code} 
                                    onChange={e => setData('athlete_code', e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())} 
                                    placeholder="ATH0001"
                                    disabled
                                    className="bg-neutral-100 dark:bg-neutral-800 cursor-not-allowed"
                                    required
                                />
                                <p className="text-xs text-neutral-500">Kode atlet otomatis, hanya huruf dan angka (tanpa simbol).</p>
                                {errors.athlete_code && <p className="text-xs text-athlix-red">{errors.athlete_code}</p>}
                            </div>

                            <div className="col-span-2 mt-2 rounded-xl border border-dashed border-neutral-300 p-4 space-y-3">
                                <p className="text-sm font-semibold">Data Orang Tua / Wali (Akun otomatis dibuat/ditautkan)</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Nama Orang Tua</label>
                                        <Input
                                            value={data.parent_name}
                                            onChange={e => setData('parent_name', e.target.value)}
                                            placeholder="Nama orang tua"
                                            required
                                        />
                                        {errors.parent_name && <p className="text-xs text-athlix-red">{errors.parent_name}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">No HP Orang Tua</label>
                                        <Input
                                            value={data.parent_phone_number}
                                            onChange={e => setData('parent_phone_number', e.target.value)}
                                            placeholder="08xxxxxxxxxx"
                                            required
                                        />
                                        {errors.parent_phone_number && <p className="text-xs text-athlix-red">{errors.parent_phone_number}</p>}
                                    </div>
                                    <div className="space-y-1 sm:col-span-2">
                                        <label className="text-sm font-medium">Email Orang Tua (Opsional)</label>
                                        <Input
                                            type="email"
                                            value={data.parent_email}
                                            onChange={e => setData('parent_email', e.target.value)}
                                            placeholder="orangtua@example.com"
                                        />
                                        {errors.parent_email && <p className="text-xs text-athlix-red">{errors.parent_email}</p>}
                                    </div>
                                </div>
                            </div>

                            {dojos.length > 0 && (
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Dojo</label>
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
                                <label className="text-sm font-medium">Belt Level</label>
                                <DbSelect
                                    inputId="athlete-create-belt"
                                    options={belts.map((belt) => ({ value: String(belt.id), label: belt.name }))}
                                    value={data.current_belt_id}
                                    placeholder="Pilih Belt"
                                    onChange={(next) => setData('current_belt_id', next)}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Tempat Lahir</label>
                                <Input 
                                    value={data.birth_place} 
                                    onChange={e => setData('birth_place', e.target.value)} 
                                    placeholder="Contoh: Samarinda"
                                />
                                {errors.birth_place && <p className="text-xs text-athlix-red">{errors.birth_place}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Date of Birth</label>
                                <Input 
                                    type="date"
                                    value={data.dob} 
                                    onChange={e => setData('dob', e.target.value)} 
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Gender</label>
                                <DbSelect 
                                    inputId="athlete-gender"
                                    value={data.gender}
                                    options={[
                                        { value: 'M', label: 'Male' },
                                        { value: 'F', label: 'Female' }
                                    ]}
                                    onChange={(val) => setData('gender', val)}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Height (cm)</label>
                                <Input 
                                    type="number"
                                    step="0.1"
                                    value={data.latest_height} 
                                    onChange={e => setData('latest_height', e.target.value)} 
                                    placeholder="e.g. 170"
                                />
                                {errors.latest_height && <p className="text-xs text-athlix-red">{errors.latest_height}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Weight (kg)</label>
                                <Input 
                                    type="number"
                                    step="0.1"
                                    value={data.latest_weight} 
                                    onChange={e => setData('latest_weight', e.target.value)} 
                                    placeholder="e.g. 65.5"
                                />
                                {errors.latest_weight && <p className="text-xs text-athlix-red">{errors.latest_weight}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Specialization</label>
                                <DbSelect 
                                    inputId="athlete-specialization"
                                    value={data.specialization}
                                    options={[
                                        { value: 'kata', label: 'Kata' },
                                        { value: 'kumite', label: 'Kumite' },
                                        { value: 'both', label: 'Both' }
                                    ]}
                                    onChange={(val) => setData('specialization', val)}
                                />
                            </div>

                            <div className="col-span-2 space-y-1">
                                <label className="text-sm font-medium">Keterangan Kelas</label>
                                <Input 
                                    value={data.class_note} 
                                    onChange={e => setData('class_note', e.target.value)} 
                                    placeholder="Contoh: Senior -67kg"
                                />
                                {errors.class_note && <p className="text-xs text-athlix-red">{errors.class_note}</p>}
                            </div>

                            <div className="col-span-2 space-y-1">
                                <label className="text-sm font-medium">Foto Atlet (Opsional)</label>
                                <Input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.webp"
                                    onChange={(event) => setData('photo', event.target.files?.[0] || null)}
                                />
                                {errors.photo && <p className="text-xs text-athlix-red">{errors.photo}</p>}
                            </div>

                            <div className="col-span-2 space-y-3 rounded-xl border border-dashed border-neutral-300 p-4">
                                <p className="text-sm font-semibold">Dokumen Registrasi (minimal 1 wajib)</p>
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
                        </div>

                        <div className="pt-4">
                            <Button type="submit" className="w-full h-12 text-lg" disabled={processing}>
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


