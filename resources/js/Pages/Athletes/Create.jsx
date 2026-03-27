import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Skeleton } from '@/Components/ui/skeleton';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useEffect } from 'react';

export default function Create({ auth, belts, suggestedAthleteCode, dojos = [] }) {
    const isLoading = !belts;
    const initialBeltId = belts?.[0]?.id ?? '';
    const initialDojoId = dojos?.[0]?.id ?? '';
    const { data, setData, post, processing, errors } = useForm({
        full_name: '',
        athlete_code: suggestedAthleteCode || '',
        current_belt_id: initialBeltId,
        dojo_id: initialDojoId,
        birth_place: '',
        dob: '',
        gender: 'M',
        specialization: 'both',
        latest_height: '',
        latest_weight: '',
        class_note: '',
        photo: null,
        doc_kk: null,
        doc_akte: null,
        doc_ktp: null,
    });

    useEffect(() => {
        if (belts?.length > 0 && !data.current_belt_id) {
            setData('current_belt_id', belts[0].id);
        }
    }, [belts, data.current_belt_id, setData]);

    useEffect(() => {
        if (dojos?.length > 0 && !data.dojo_id) {
            setData('dojo_id', dojos[0].id);
        }
    }, [dojos, data.dojo_id, setData]);

    useEffect(() => {
        if (suggestedAthleteCode && !data.athlete_code) {
            setData('athlete_code', suggestedAthleteCode);
        }
    }, [suggestedAthleteCode, data.athlete_code, setData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('athletes.store'), { forceFormData: true });
    };

    if (isLoading) {
        return (
            <AdminLayout
                user={auth?.user}
                header={<h2 className="text-xl font-semibold leading-tight text-neutral-800 ">Register New Athlete</h2>}
            >
                <Head title="Add Athlete" />
                <div className="py-6">
                    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 space-y-6">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-96 w-full" />
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout
            user={auth?.user}
            header={<h2 className="text-xl font-semibold leading-tight text-neutral-800 ">Register New Athlete</h2>}
        >
            <Head title="Add Athlete" />

            <div className="py-6">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 space-y-6">
                    <Link href={route('athletes.index')} className="inline-flex items-center text-sm text-neutral-500 hover:text-athlix-red transition-colors">
                        <ArrowLeft size={16} className="mr-1" /> Back to Directory
                    </Link>

                    <Card>
                        <CardHeader>
                            <CardTitle>Athlete Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
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

                                    {dojos.length > 0 && (
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium">Dojo</label>
                                            <select
                                                className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-athlix-red"
                                                value={data.dojo_id}
                                                onChange={e => setData('dojo_id', e.target.value)}
                                            >
                                                {dojos.map((dojo) => (
                                                    <option key={dojo.id} value={dojo.id}>{dojo.name}</option>
                                                ))}
                                            </select>
                                            {errors.dojo_id && <p className="text-xs text-athlix-red">{errors.dojo_id}</p>}
                                        </div>
                                    )}

                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Belt Level</label>
                                        <select 
                                            className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-athlix-red"
                                            value={data.current_belt_id}
                                            onChange={e => setData('current_belt_id', e.target.value)}
                                        >
                                            {belts.map(belt => (
                                                <option key={belt.id} value={belt.id}>{belt.name}</option>
                                            ))}
                                        </select>
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
                                        <select 
                                            className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-athlix-red"
                                            value={data.gender}
                                            onChange={e => setData('gender', e.target.value)}
                                        >
                                            <option value="M">Male</option>
                                            <option value="F">Female</option>
                                        </select>
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
                                        <select 
                                            className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-athlix-red"
                                            value={data.specialization}
                                            onChange={e => setData('specialization', e.target.value)}
                                        >
                                            <option value="kata">Kata</option>
                                            <option value="kumite">Kumite</option>
                                            <option value="both">Both</option>
                                        </select>
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
                                        Create Athlete Profile
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}


