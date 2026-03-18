import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Search, Plus, ChevronRight } from 'lucide-react';

export default function Index({ auth, athletes, flash }) {
    const getStatusColor = (status) => {
        switch (status) {
            case 'Prima': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'Pemulihan': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'Kelelahan': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'Cedera': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20';
        }
    };

    return (
        <AdminLayout
            user={auth.user}
            header={<h2 className="text-xl font-bold leading-tight text-neutral-800 dark:text-neutral-200">Database Atlet Dojo</h2>}
        >
            <Head title="Database Atlet" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
                    
                    {flash?.success && (
                        <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-xl dark:bg-green-900/30 dark:text-green-400 animate-fade-in-up border border-green-200 dark:border-green-800">
                            {flash.success}
                        </div>
                    )}

                    {/* Header Actions */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in-up">
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                            <Input 
                                type="text" 
                                placeholder="Cari atlet..." 
                                className="pl-10 bg-white dark:bg-neutral-900/50"
                            />
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
                                <thead className="text-[10px] text-neutral-500 uppercase bg-neutral-50/80 dark:bg-neutral-900/80 border-b border-neutral-200/80 dark:border-neutral-800 tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">Nama Atlet</th>
                                        <th className="px-6 py-4">Kategori & Kelas</th>
                                        <th className="px-6 py-4">Umur</th>
                                        <th className="px-6 py-4">Status Kesehatan</th>
                                        <th className="px-6 py-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {athletes.map((athlete, idx) => (
                                        <tr key={athlete.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-all duration-300 animate-fade-in-up fill-both" style={{ animationDelay: `${150 + idx * 40}ms` }}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-athlix-red/20 to-athlix-red/5 dark:from-athlix-red/30 dark:to-athlix-red/10 border border-athlix-red/10 flex items-center justify-center text-sm font-bold text-athlix-red transition-transform duration-300 hover:scale-110">
                                                        {athlete.full_name?.charAt(0)}
                                                    </div>
                                                    <div className="font-bold text-neutral-900 dark:text-neutral-100">
                                                        {athlete.full_name}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-neutral-500 dark:text-neutral-400">
                                                {athlete.category || 'Belum Ditentukan'}
                                            </td>
                                            <td className="px-6 py-4 text-neutral-500">{athlete.age} thn</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${getStatusColor(athlete.health_status)}`}>
                                                    {athlete.health_status}
                                                </span>
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
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Mobile Card View */}
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                        {athletes.map((athlete, idx) => (
                            <Card key={athlete.id} className="border-neutral-200/80 dark:border-neutral-800 card-hover animate-fade-in-up fill-both" style={{ animationDelay: `${idx * 60}ms` }}>
                                <CardContent className="p-4 flex flex-col gap-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-athlix-red/20 to-athlix-red/5 flex items-center justify-center text-athlix-red font-bold">
                                                {athlete.full_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-base">{athlete.full_name}</h3>
                                                <p className="text-xs text-neutral-500">{athlete.category}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border ${getStatusColor(athlete.health_status)}`}>
                                            {athlete.health_status}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
                                        <div className="text-xs text-neutral-500">
                                            Umur: <span className="font-bold text-neutral-900 dark:text-neutral-100">{athlete.age} thn</span>
                                        </div>
                                        <Link href={route('athletes.show', athlete.id)}>
                                            <Button variant="outline" size="sm" className="h-8 text-xs font-bold">Lihat Rapor</Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                </div>
            </div>
        </AdminLayout>
    );
}
