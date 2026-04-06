import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import Modal from '@/Components/Modal';
import { CreditCard, CheckCircle, XCircle, Clock, Eye, AlertCircle, Info } from 'lucide-react';
import React, { useState } from 'react';

export default function SubscriptionRequests({ auth, requests = [] }) {
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isRejectModal, setIsRejectModal] = useState(false);
    
    const rejectForm = useForm({
        super_admin_notes: '',
    });

    const approve = (id) => {
        if (confirm('Apakah Anda yakin ingin menyetujui perubahan paket ini?')) {
            router.post(route('super-admin.subscription-requests.approve', id));
        }
    };

    const handleReject = (e) => {
        e.preventDefault();
        rejectForm.post(route('super-admin.subscription-requests.reject', selectedRequest.id), {
            onSuccess: () => {
                setIsRejectModal(false);
                setSelectedRequest(null);
                rejectForm.reset();
            }
        });
    };

    const statusBadge = (status) => {
        switch (status) {
            case 'pending':
                return <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit"><Clock size={10} /> PENDING</span>;
            case 'approved':
                return <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit"><CheckCircle size={10} /> APPROVED</span>;
            case 'rejected':
                return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit"><XCircle size={10} /> REJECTED</span>;
            default:
                return status;
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

    return (
        <AdminLayout user={auth?.user} header={<h2 className="text-xl font-bold tracking-tight uppercase">Request Perubahan Paket</h2>}>
            <Head title="Subscription Requests" />

            <div className="space-y-6">
                <Card className="border-neutral-200/80 dark:border-neutral-800 shadow-sm overflow-hidden">
                    <CardHeader className="bg-neutral-50/50 dark:bg-neutral-900/50 border-b border-neutral-200/80 dark:border-neutral-800 p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-black uppercase tracking-wider">Antrian Permintaan</CardTitle>
                                <p className="text-sm text-neutral-500 mt-0.5">Daftar club yang mengajukan perubahan tier subscription.</p>
                            </div>
                            <div className="bg-athlix-red/10 text-athlix-red p-2 rounded-xl">
                                <CreditCard size={20} />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase tracking-widest font-black text-neutral-500 bg-neutral-50/50 dark:bg-neutral-900/50 border-b border-neutral-100 dark:border-neutral-800">
                                    <tr>
                                        <th className="px-6 py-4">Club</th>
                                        <th className="px-6 py-4">Perubahan Paket</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Tanggal</th>
                                        <th className="px-6 py-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {requests.length > 0 ? requests.map((req) => (
                                        <tr key={req.id} className="hover:bg-neutral-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-neutral-900">{req.dojo?.name || 'Unknown Club'}</p>
                                                <p className="text-xs text-neutral-500 italic">{req.dojo?.contact_email}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-neutral-400 line-through">{req.current_plan_name}</span>
                                                    <ChevronRight size={14} className="text-neutral-400" />
                                                    <span className="font-black text-athlix-red underline">{req.requested_plan_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium uppercase text-xs">
                                                {statusBadge(req.status)}
                                            </td>
                                            <td className="px-6 py-4 text-neutral-500 text-xs">
                                                {new Date(req.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => setSelectedRequest(req)}>
                                                        <Eye size={14} /> Detail
                                                    </Button>
                                                    {req.status === 'pending' && (
                                                        <>
                                                            <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => approve(req.id)}>
                                                                Setuju
                                                            </Button>
                                                            <Button size="sm" variant="destructive" className="h-8" onClick={() => { setSelectedRequest(req); setIsRejectModal(true); }}>
                                                                Tolak
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-neutral-400 italic">
                                                Tidak ada permintaan perubahan paket saat ini.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detail Modal */}
            <Modal show={!!selectedRequest && !isRejectModal} onClose={() => setSelectedRequest(null)} maxWidth="md">
                {selectedRequest && (
                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black tracking-tight">Detail Permintaan</h3>
                            {statusBadge(selectedRequest.status)}
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Paket Sekarang</p>
                                    <h4 className="font-black text-neutral-500 line-through">{selectedRequest.current_plan_name}</h4>
                                </div>
                                <div className="p-3 rounded-xl bg-athlix-red/5 border border-athlix-red/20 shadow-sm">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-athlix-red/60 mb-1">Paket Request</p>
                                    <h4 className="font-black text-athlix-red text-lg uppercase">{selectedRequest.requested_plan_name}</h4>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Club Pengaju</p>
                                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center shrink-0">
                                        <CreditCard className="text-athlix-red" size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold">{selectedRequest.dojo?.name}</p>
                                        <p className="text-xs text-neutral-500">{selectedRequest.dojo?.contact_name} ({selectedRequest.dojo?.contact_email})</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Alasan Request</p>
                                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 min-h-[60px] text-sm">
                                    {selectedRequest.reason || <span className="text-neutral-400 italic">Tidak ada alasan yang disertakan.</span>}
                                </div>
                            </div>

                            {selectedRequest.super_admin_notes && (
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Catatan Penolakan</p>
                                    <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
                                        {selectedRequest.super_admin_notes}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="outline" onClick={() => setSelectedRequest(null)}>Tutup</Button>
                            {selectedRequest.status === 'pending' && (
                                <>
                                    <Button variant="destructive" onClick={() => setIsRejectModal(true)}>Tolak</Button>
                                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => approve(selectedRequest.id)}>Setujui</Button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Reject Modal */}
            <Modal show={isRejectModal} onClose={() => setIsRejectModal(false)} maxWidth="sm">
                <div className="p-6 space-y-5">
                    <div>
                        <h3 className="text-xl font-black tracking-tight">Tolak Permintaan</h3>
                        <p className="text-sm text-neutral-500">Berikan alasan mengapa permintaan ini ditolak.</p>
                    </div>

                    <form onSubmit={handleReject} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Catatan Penolakan *</label>
                            <textarea
                                value={rejectForm.data.super_admin_notes}
                                onChange={(e) => rejectForm.setData('super_admin_notes', e.target.value)}
                                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm min-h-[100px]"
                                placeholder="Contoh: Belum saatnya upgrade, ada tunggakan billing, dsb."
                                required
                            ></textarea>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button variant="outline" type="button" onClick={() => setIsRejectModal(false)}>Batal</Button>
                            <Button type="submit" variant="destructive" disabled={rejectForm.processing}>
                                Konfirmasi Tolak
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </AdminLayout>
    );
}

function ChevronRight({ size, className }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m9 18 6-6-6-6" />
        </svg>
    );
}
