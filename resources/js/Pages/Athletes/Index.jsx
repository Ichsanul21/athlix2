import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Skeleton } from '@/Components/ui/skeleton';
import { Search, Plus, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function Index({ auth, athletes, flash, filters }) {
    const [search, setSearch] = useState(filters?.search || '');

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

                    {/* Header Actions */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in-up">
                        <div className="flex w-full sm:max-w-xl gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                <Input 
                                    type="text" 
                                    placeholder="Filter nama atlet..." 
                                    className="pl-10 bg-white dark:bg-neutral-900/50"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <Button type="button" variant="outline" onClick={applyFilter}>
                                Apply
                            </Button>
                            <Button type="button" variant="ghost" onClick={resetFilter}>
                                Reset
                            </Button>
                        </div>
                        <Link href={route('athletes.create')}>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Registrasi Atlet
                            </Button>
                        </Link>
                    </div>

                    {/* Desktop Table View */}
                    <Card className="hidden md:block overflow-hidden border-neutral-200/80 dark:border-neutral-800 animate-fade-in-up fill-both" style={{ animationDelay: '100ms' }}>
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
        </AdminLayout>
    );
}


