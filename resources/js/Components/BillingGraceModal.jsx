import React, { useState } from 'react';
import { usePage, Link } from '@inertiajs/react';
import { AlertCircle, CreditCard, Clock, ShieldAlert, ExternalLink, ChevronRight } from 'lucide-react';
import Modal from '@/Components/Modal';

export default function BillingGraceModal() {
    const { billing, auth } = usePage().props;
    const user = auth?.user;
    const [dismissed, setDismissed] = useState(false);

    if (!billing || dismissed) return null;

    const { club, user: userBilling } = billing;

    // Club Billing Modal logic
    const showClubModal = club?.is_grace || club?.is_expired;
    
    // User Billing Modal logic (Athletes & Parents)
    const showUserModal = userBilling?.has_unpaid;

    if (!showClubModal && !showUserModal) return null;

    // Modal Content for Club Billing
    if (showClubModal) {
        return (
            <Modal show={true} maxWidth="md" closeable={false}>
                <div className="p-6 bg-white overflow-hidden rounded-2xl">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 text-red-600 animate-pulse">
                        <ShieldAlert size={32} />
                    </div>
                    
                    <div className="text-center space-y-3">
                        <h3 className="text-2xl font-black text-neutral-900 tracking-tight uppercase">
                            {club.is_expired ? 'Layanan Terhenti!' : 'Masa Tenggang Billing'}
                        </h3>
                        <p className="text-neutral-500 text-sm leading-relaxed">
                            {club.is_expired 
                                ? 'Masa aktif langganan club kamu telah habis lebih dari 7 hari. Silakan lakukan perpanjangan langganan untuk tetap bisa mengakses semua fitur ATHLIX.'
                                : `Masa aktif langganan club kamu telah berakhir pada ${club.expires_at}. Saat ini kamu berada dalam masa tenggang 7 hari sebelum layanan terhenti secara otomatis.`
                            }
                        </p>
                    </div>

                    <div className="mt-8 space-y-4">
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
                            <div className="p-2 bg-white rounded-xl shadow-sm">
                                <Clock className="text-red-500" size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Status Terkini</p>
                                <p className="text-sm font-black text-neutral-800">
                                    {club.is_expired ? 'Expired / Blocked' : `${club.remaining_days * -1} Hari Melewati Batas`}
                                </p>
                            </div>
                        </div>

                        {user?.role === 'manager' || user?.role === 'dojo_admin' || user?.role === 'head_coach' ? (
                            <Link
                                href={route('finance.index')}
                                className="flex items-center justify-center gap-2 w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 transition-all duration-300 shadow-xl shadow-red-200 active:scale-95"
                            >
                                Perpanjang Sekarang
                                <ChevronRight size={18} />
                            </Link>
                        ) : (
                            <div className="p-4 rounded-2xl bg-yellow-50 border border-yellow-100 text-center">
                                <p className="text-xs font-bold text-yellow-800 leading-relaxed">
                                    Mohon segera hubungi Admin Club atau Ketua Club untuk melakukan perpanjangan billing ATHLIX.
                                </p>
                            </div>
                        )}

                        {club.is_grace && (
                            <button 
                                onClick={() => setDismissed(true)} 
                                className="w-full py-3 text-neutral-400 text-xs font-bold uppercase tracking-widest hover:text-neutral-600 transition-colors"
                            >
                                Tutup Sementara
                            </button>
                        )}
                    </div>
                </div>
            </Modal>
        );
    }

    // Modal Content for User (Athlete/Parent) Billing
    if (showUserModal) {
        const primaryInvoice = userBilling.grace_invoices[0];
        
        return (
            <Modal show={true} maxWidth="md" closeable={false}>
                <div className="p-6 bg-white overflow-hidden rounded-2xl">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-orange-100 text-orange-600 animate-bounce">
                        <CreditCard size={32} />
                    </div>
                    
                    <div className="text-center space-y-3">
                        <h3 className="text-2xl font-black text-neutral-900 tracking-tight uppercase">
                            Pembayaran Tertunda
                        </h3>
                        <p className="text-neutral-500 text-sm leading-relaxed">
                            Halo! Kamu memiliki tagihan bulanan yang melewati jatuh tempo. Mohon segera lakukan pembayaran agar proses administrasi dan pencatatan latihan berjalan lancar.
                        </p>
                    </div>

                    <div className="mt-8 space-y-4">
                        <div className="space-y-2">
                            {userBilling.grace_invoices.map((invoice, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm">
                                            <AlertCircle className="text-orange-500" size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-neutral-800 truncate max-w-[150px]">{invoice.title}</p>
                                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Jatuh Tempo: {invoice.due_date}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-neutral-900">
                                            Rp {Number(invoice.total).toLocaleString('id-ID')}
                                        </p>
                                        {!invoice.is_grace && (
                                            <span className="text-[9px] font-black text-white bg-red-500 px-2 py-0.5 rounded-full uppercase tracking-tighter">Overdue</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Link
                            href={route('billing.index')}
                            className="flex items-center justify-center gap-2 w-full py-4 bg-athlix-red text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 transition-all duration-300 shadow-xl shadow-red-200 active:scale-95"
                        >
                            Bayar Sekarang
                            <ExternalLink size={18} className="ms-1" />
                        </Link>
                    </div>
                </div>
            </Modal>
        );
    }

    return null;
}
