import PwaLayout from '@/Layouts/PwaLayout';
import { Head } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { CreditCard, Calendar, Clock, Receipt, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Index({ auth, billing }) {
    const formatIDR = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <PwaLayout user={auth.user} header="Billing">
            <Head title="Billing" />
            
            <div className="space-y-6 pb-24">

                {/* Outstanding Balance Card */}
                <Card className="border-none bg-gradient-to-br from-neutral-900 to-neutral-800 dark:from-neutral-800 dark:to-neutral-900 text-white overflow-hidden relative animate-fade-in-up fill-both shadow-xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-athlix-red/10 rounded-full -translate-y-1/2 translate-x-1/4"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-athlix-red/5 rounded-full translate-y-1/2 -translate-x-1/4"></div>
                    <CardContent className="p-6 relative z-10 space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-athlix-red/20 text-athlix-red">
                                <CreditCard size={18} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Sisa Tagihan</span>
                        </div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tight">
                                {billing?.outstanding ? formatIDR(billing.outstanding) : 'Rp 0'}
                            </h2>
                            {billing?.due_date && (
                                <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1.5">
                                    <Calendar size={12} />
                                    Jatuh tempo: <span className="font-bold text-athlix-red">{billing.due_date}</span>
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Invoice History */}
                <div className="animate-fade-in-up fill-both" style={{ animationDelay: '100ms' }}>
                    <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500 mb-4 px-1">Riwayat Pembayaran</h3>
                    
                    <div className="space-y-3">
                        {billing?.invoices?.map((invoice, idx) => (
                            <Card key={invoice.id || idx} className="border-neutral-200/80 dark:border-neutral-800 card-hover animate-fade-in-up fill-both" style={{ animationDelay: `${150 + idx * 60}ms` }}>
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                                        invoice.status === 'paid' 
                                        ? 'bg-green-500/10 text-green-500' 
                                        : 'bg-athlix-red/10 text-athlix-red'
                                    }`}>
                                        {invoice.status === 'paid' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm truncate">{invoice.description}</p>
                                        <div className="flex items-center gap-2 text-[10px] text-neutral-500 mt-0.5">
                                            <Clock size={10} />
                                            <span>{invoice.date}</span>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="font-mono font-bold text-sm">{formatIDR(invoice.amount)}</p>
                                        <span className={`text-[9px] font-bold uppercase ${
                                            invoice.status === 'paid' ? 'text-green-500' : 'text-athlix-red'
                                        }`}>
                                            {invoice.status === 'paid' ? 'LUNAS' : 'BELUM'}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {(!billing?.invoices || billing.invoices.length === 0) && (
                            <Card className="border-neutral-200/80 dark:border-neutral-800">
                                <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-3">
                                    <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center animate-float">
                                        <Receipt size={24} className="text-neutral-300" />
                                    </div>
                                    <p className="text-sm text-neutral-400">Belum ada riwayat pembayaran.</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </PwaLayout>
    );
}
