import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { CreditCard, ArrowUpRight, ArrowDownLeft, Search, MessageCircle, Check } from 'lucide-react';
import { Input } from '@/Components/ui/input';

export default function Index({ auth, records }) {
    const totalRevenue = records.filter(r => r.status === 'paid').reduce((acc, r) => acc + parseFloat(r.amount), 0);
    const totalOutstanding = records.filter(r => r.status === 'unpaid').reduce((acc, r) => acc + parseFloat(r.amount), 0);
    const pendingCount = records.filter(r => r.status === 'unpaid').length;

    const formatIDR = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <AdminLayout
            user={auth.user}
            header={<h2 className="text-xl font-bold tracking-tight uppercase">Manajemen Keuangan</h2>}
        >
            <Head title="Finance" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                        <Card className="bg-green-50/80 dark:bg-green-900/10 border-green-200/50 dark:border-green-900/20 card-hover animate-fade-in-up fill-both group">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs text-green-600 dark:text-green-400 font-bold uppercase tracking-widest">Total Terbayar</p>
                                        <h3 className="text-xl sm:text-2xl font-black mt-1">{formatIDR(totalRevenue)}</h3>
                                    </div>
                                    <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-xl transition-transform duration-300 group-hover:scale-110">
                                        <ArrowUpRight className="text-green-600" size={20} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-red-50/80 dark:bg-athlix-red/5 border-red-200/50 dark:border-athlix-red/10 card-hover animate-fade-in-up fill-both group" style={{ animationDelay: '80ms' }}>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs text-athlix-red font-bold uppercase tracking-widest">Total Tunggakan</p>
                                        <h3 className="text-xl sm:text-2xl font-black mt-1">{formatIDR(totalOutstanding)}</h3>
                                    </div>
                                    <div className="p-2.5 bg-athlix-red/10 rounded-xl transition-transform duration-300 group-hover:scale-110">
                                        <ArrowDownLeft className="text-athlix-red" size={20} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-neutral-200/80 dark:border-neutral-800 card-hover animate-fade-in-up fill-both group" style={{ animationDelay: '160ms' }}>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Invoice Belum Bayar</p>
                                        <h3 className="text-xl sm:text-2xl font-black mt-1">{pendingCount} Atlet</h3>
                                    </div>
                                    <div className="p-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl transition-transform duration-300 group-hover:scale-110">
                                        <CreditCard size={20} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-neutral-200/80 dark:border-neutral-800 animate-fade-in-up fill-both" style={{ animationDelay: '200ms' }}>
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500">Daftar Tagihan Terbaru</CardTitle>
                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                                <div className="relative w-full sm:max-w-xs">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                    <Input type="text" placeholder="Cari invoice/atlet..." className="pl-10 h-9 border-none bg-neutral-50 dark:bg-neutral-950 text-xs" />
                                </div>
                                <button 
                                    onClick={() => {
                                        if(confirm('Terbitkan tagihan iuran bulanan baru untuk semua atlet aktif?')) {
                                            router.post(route('finance.generate'));
                                        }
                                    }}
                                    className="w-full sm:w-auto h-9 px-4 rounded-xl font-bold text-xs uppercase tracking-widest bg-athlix-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-all active:scale-95 whitespace-nowrap"
                                >
                                    Buat Tagihan Bulanan
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {/* Desktop table */}
                            <div className="overflow-x-auto hidden md:block">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-[10px] text-neutral-500 uppercase font-black bg-neutral-50/80 dark:bg-neutral-900/80 border-b border-neutral-200/80 dark:border-neutral-800 tracking-tighter">
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
                                        {records.map((rec, idx) => (
                                            <tr key={rec.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-all duration-300 animate-fade-in-up fill-both" style={{ animationDelay: `${250 + idx * 40}ms` }}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-athlix-red/20 to-athlix-red/5 text-athlix-red flex items-center justify-center font-bold text-xs uppercase">
                                                            {rec.athlete.full_name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-neutral-900 dark:text-neutral-100">{rec.athlete.full_name}</p>
                                                            <p className="text-[10px] uppercase text-neutral-500">{rec.athlete.belt?.name}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-medium">{rec.description}</td>
                                                <td className="px-6 py-4 font-mono font-bold">{formatIDR(rec.amount)}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                                                        rec.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-athlix-red dark:bg-athlix-red/10 dark:text-athlix-red'
                                                    }`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${rec.status === 'paid' ? 'bg-green-500' : 'bg-athlix-red animate-pulse'}`}></div>
                                                        {rec.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-mono text-neutral-500 whitespace-nowrap">{rec.due_date}</td>
                                                <td className="px-6 py-4 text-right">
                                                    {rec.status === 'unpaid' && (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button 
                                                                onClick={() => {
                                                                    if (confirm(`Tandai tagihan ${rec.description} atas nama ${rec.athlete.full_name} sebagai lunas?`)) {
                                                                        router.patch(route('finance.update', rec.id));
                                                                    }
                                                                }}
                                                                className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-all duration-300 hover:shadow-md hover:shadow-blue-500/20 active:scale-95"
                                                                title="Tandai Lunas"
                                                            >
                                                                <Check size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => {
                                                                    const message = `Halo ${rec.athlete.full_name}, ini pengingat dari Dojo ATHLIX mengenai pembayaran ${rec.description} sebesar ${formatIDR(rec.amount)} yang jatuh tempo pada ${rec.due_date}. Silakan lakukan pembayaran segera. Terima kasih!`;
                                                                    window.open(`https://wa.me/${rec.athlete.phone_number}?text=${encodeURIComponent(message)}`, '_blank');
                                                                }}
                                                                className="p-2.5 rounded-xl bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white transition-all duration-300 hover:shadow-md hover:shadow-green-500/20 active:scale-95"
                                                                title="Kirim Pengingat WA"
                                                            >
                                                                <MessageCircle size={16} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {/* Mobile cards */}
                            <div className="md:hidden divide-y divide-neutral-100 dark:divide-neutral-800">
                                {records.map((rec, idx) => (
                                    <div key={rec.id} className="p-4 flex items-center gap-3 animate-fade-in-up fill-both" style={{ animationDelay: `${idx * 50}ms` }}>
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-athlix-red/20 to-athlix-red/5 text-athlix-red flex items-center justify-center font-bold text-xs">
                                            {rec.athlete.full_name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm truncate">{rec.athlete.full_name}</p>
                                            <p className="text-[10px] text-neutral-500 truncate">{rec.description}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                                            <p className="font-mono font-bold text-sm">{formatIDR(rec.amount)}</p>
                                            <span className={`text-[9px] font-bold uppercase ${rec.status === 'paid' ? 'text-green-600' : 'text-athlix-red'}`}>{rec.status}</span>
                                            {rec.status === 'unpaid' && (
                                                <div className="flex items-center justify-end gap-1 mt-1">
                                                    <button 
                                                        onClick={() => {
                                                            if (confirm(`Tandai lunas?`)) {
                                                                router.patch(route('finance.update', rec.id));
                                                            }
                                                        }}
                                                        className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-all duration-300 active:scale-95"
                                                        title="Tandai Lunas"
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            const message = `Halo ${rec.athlete.full_name}...`;
                                                            window.open(`https://wa.me/${rec.athlete.phone_number}?text=${encodeURIComponent(message)}`, '_blank');
                                                        }}
                                                        className="p-1.5 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white transition-all duration-300 active:scale-95"
                                                    >
                                                        <MessageCircle size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
