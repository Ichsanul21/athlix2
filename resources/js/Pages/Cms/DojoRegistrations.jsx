import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import Modal from '@/Components/Modal';
import { Users, CheckCircle, XCircle, Trash2, Phone, Mail, Eye, AlertTriangle, ShieldCheck, Info } from 'lucide-react';
import React, { useState, useCallback } from 'react';

const ICON_MAP = {
    danger: Trash2,
    warning: XCircle,
    success: ShieldCheck,
};

const formatCurrency = (amount) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

const STYLE_MAP = {
    danger: {
        iconBg: 'bg-red-100 text-red-600',
        confirmBtn: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20',
        title: 'text-red-900',
        border: 'border-red-200',
    },
    warning: {
        iconBg: 'bg-amber-100 text-amber-600',
        confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20',
        title: 'text-amber-900',
        border: 'border-amber-200',
    },
    success: {
        iconBg: 'bg-green-100 text-green-600',
        confirmBtn: 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20',
        title: 'text-green-900',
        border: 'border-green-200',
    },
};

function ConfirmModal({ data, onClose }) {
    if (!data.isOpen) return null;

    const style = STYLE_MAP[data.variant] || STYLE_MAP.danger;
    const Icon = ICON_MAP[data.variant] || Info;

    return (
        <Modal show={data.isOpen} onClose={onClose} maxWidth="md">
            <div className="p-6 sm:p-8 flex flex-col items-center text-center">
                <div className={`p-3.5 rounded-2xl ${style.iconBg} mb-5`}>
                    <Icon size={28} strokeWidth={2} />
                </div>

                <h3 className={`text-lg sm:text-xl font-black ${style.title} mb-2`}>
                    {data.title}
                </h3>

                <p className="text-sm text-neutral-600 leading-relaxed max-w-sm mb-8">
                    {data.message}
                </p>

                <div className={`w-full flex flex-col sm:flex-row gap-3 ${style.border} border-t pt-5`}>
                    <Button
                        variant="outline"
                        className="w-full sm:w-1/2 h-11 border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 font-semibold"
                        onClick={onClose}
                    >
                        Batal
                    </Button>
                    <Button
                        className={`w-full sm:w-1/2 h-11 font-bold`}
                        onClick={() => {
                            if (data.onConfirm) data.onConfirm();
                            onClose();
                        }}
                    >
                        {data.confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

export default function DojoRegistrations({ auth, registrations = [] }) {
    const [selectedRegistration, setSelectedRegistration] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        variant: 'danger',
        confirmText: 'Ya, Lanjutkan',
        onConfirm: null,
    });

    const openConfirm = useCallback((config) => {
        setConfirmModal({ isOpen: true, ...config });
    }, []);

    const closeConfirm = useCallback(() => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false, onConfirm: null }));
    }, []);

    const handleApprove = (id) => {
        openConfirm({
            title: 'Setujui Pendaftaran?',
            message: 'Akun admin club akan otomatis dibuat dengan username berupa email PIC dan password default. Billing paket akan langsung aktif.',
            variant: 'success',
            confirmText: 'Ya, Setujui',
            onConfirm: () => {
                router.post(route('cms.dojo-registrations.approve', id), {}, {
                    onSuccess: () => setIsDetailsModalOpen(false),
                });
            },
        });
    };

    const handleReject = (id) => {
        openConfirm({
            title: 'Tolak Pendaftaran?',
            message: 'Pendaftaran club ini akan ditolak dan PIC akan diberitahu. Tindakan ini tidak dapat dibatalkan.',
            variant: 'warning',
            confirmText: 'Ya, Tolak',
            onConfirm: () => {
                router.post(route('cms.dojo-registrations.reject', id), {}, {
                    onSuccess: () => setIsDetailsModalOpen(false),
                });
            },
        });
    };

    const openDetails = (registration) => {
        setSelectedRegistration(registration);
        setIsDetailsModalOpen(true);
    };

    const handleDelete = (id) => {
        openConfirm({
            title: 'Hapus Data?',
            message: 'Data pendaftaran ini akan dihapus secara permanen dan tidak dapat dikembalikan.',
            variant: 'danger',
            confirmText: 'Ya, Hapus',
            onConfirm: () => {
                router.delete(route('cms.dojo-registrations.destroy', id));
            },
        });
    };

    const statusBadge = (status) => {
        const baseClass = "px-2.5 py-0.5 rounded-full text-xs font-semibold";
        switch (status) {
            case 'pending':
                return <span className={`${baseClass} bg-amber-100 text-amber-800`}>Pending</span>;
            case 'approved':
                return <span className={`${baseClass} bg-green-100 text-green-800`}>Disetujui</span>;
            case 'rejected':
                return <span className={`${baseClass} bg-red-100 text-red-800`}>Ditolak</span>;
            default:
                return <span className={`${baseClass} bg-neutral-100 text-neutral-800 border bg-transparent`}>{status}</span>;
        }
    };

    return (
        <AdminLayout user={auth?.user} header={<h2 className="text-xl font-bold tracking-tight uppercase">Pendaftaran Club</h2>}>
            <Head title="Pendaftaran Club" />
            <div className="space-y-6 py-4">
                <Card className="border-neutral-200/80 dark:border-neutral-800 bg-gradient-to-r from-blue-500/10 to-transparent">
                    <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-blue-500/15 text-blue-600"><Users size={22} /></div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Free Trial</p>
                                <h3 className="text-lg font-black">Pendaftaran Club Baru</h3>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-semibold text-neutral-700">Total Pendaftar: {registrations.length}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-neutral-200/80 dark:border-neutral-800 overflow-hidden">
                    <CardHeader className="bg-neutral-50/50 border-b border-neutral-100/50">
                        <CardTitle>Daftar Pendaftar (Free Trial)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {registrations.length === 0 ? (
                            <div className="p-8 text-center text-neutral-500">
                                <Users size={48} className="mx-auto mb-4 opacity-20" />
                                <p>Belum ada pendaftaran club baru.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-neutral-600 uppercase bg-neutral-100/50 border-b">
                                        <tr>
                                            <th className="px-6 py-4 font-bold">INFO CLUB</th>
                                            <th className="px-6 py-4 font-bold">INFO PIC</th>
                                            <th className="px-6 py-4 font-bold">LOKASI & PLAN</th>
                                            <th className="px-6 py-4 font-bold">STATUS</th>
                                            <th className="px-6 py-4 font-bold text-right">AKSI</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                        {registrations.map((item) => (
                                            <tr key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-neutral-900">{item.dojo_name}</p>
                                                    <p className="text-xs text-neutral-500 mt-1">Reg: {new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(item.created_at))}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-neutral-900">{item.pic_name}</p>
                                                    <div className="flex flex-col gap-1 mt-1 text-xs text-neutral-600">
                                                        <a href={`mailto:${item.pic_email}`} className="flex items-center gap-1 hover:text-athlix-red transition-colors">
                                                            <Mail size={12} /> {item.pic_email}
                                                        </a>
                                                        <a href={`https://wa.me/${item.pic_phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-green-600 transition-colors">
                                                            <Phone size={12} /> +{item.pic_phone}
                                                        </a>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-medium text-neutral-800">{item.province_name}, {item.regency_name}</p>
                                                    <p className="text-xs font-bold text-athlix-red mt-1">Paket: {item.saas_plan_name} ({formatCurrency(item.nominal || 0)})</p>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-medium">
                                                    {statusBadge(item.status)}
                                                </td>
                                                <td className="px-6 py-4 items-center justify-end flex gap-2">
                                                    {item.status === 'pending' && (
                                                        <Button size="sm" variant="outline" className="h-8 gap-1 border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100" onClick={() => openDetails(item)}>
                                                            <Eye size={14} /> <span className="hidden sm:inline">Detail</span>
                                                        </Button>
                                                    )}
                                                    <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleDelete(item.id)}>
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <ConfirmModal data={confirmModal} onClose={closeConfirm} />

            <Modal show={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} maxWidth="2xl">
                {selectedRegistration && (
                    <div className="flex flex-col h-full max-h-[90vh]">
                        <div className="p-6 border-b border-neutral-100 flex items-center justify-between sticky top-0 bg-white z-10">
                            <div>
                                <h3 className="text-xl font-black text-neutral-900 uppercase tracking-tight">Detail Pendaftaran</h3>
                                <p className="text-xs font-semibold text-neutral-500 mt-1">ID: #{selectedRegistration.id} &bull; Diminta pada: {new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(selectedRegistration.created_at))}</p>
                            </div>
                            <div>{statusBadge(selectedRegistration.status)}</div>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 bg-neutral-50/50">
                            <div className="space-y-8">
                                <div>
                                    <h4 className="text-sm font-bold text-neutral-800 uppercase tracking-wider mb-4 pb-2 border-b border-neutral-200">Informasi Sasana</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-semibold text-neutral-500 mb-1">Nama Club</p>
                                            <p className="font-bold text-neutral-900 text-base">{selectedRegistration.dojo_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-neutral-500 mb-1">Negara / Zona Waktu</p>
                                            <p className="font-bold text-neutral-900">{selectedRegistration.country} / {selectedRegistration.timezone}</p>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <p className="text-xs font-semibold text-neutral-500 mb-1">Alamat Lengkap</p>
                                            <p className="font-bold text-neutral-900 leading-relaxed bg-white p-3 rounded-xl border border-neutral-200 shadow-sm">{selectedRegistration.address_detail}, {selectedRegistration.village_name}, {selectedRegistration.district_name}, {selectedRegistration.regency_name}, {selectedRegistration.province_name}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-neutral-800 uppercase tracking-wider mb-4 pb-2 border-b border-neutral-200">Informasi PIC</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-semibold text-neutral-500 mb-1">Nama Lengkap PIC</p>
                                            <p className="font-bold text-neutral-900">{selectedRegistration.pic_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-neutral-500 mb-1">Email</p>
                                            <a href={`mailto:${selectedRegistration.pic_email}`} className="font-bold text-neutral-900 hover:text-athlix-red transition-colors flex items-center gap-1.5"><Mail size={14}/> {selectedRegistration.pic_email}</a>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-neutral-500 mb-1">Nomor WhatsApp</p>
                                            <a href={`https://wa.me/${selectedRegistration.pic_phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="font-bold text-neutral-900 hover:text-green-600 transition-colors flex items-center gap-1.5"><Phone size={14}/> +{selectedRegistration.pic_phone}</a>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-neutral-800 uppercase tracking-wider mb-4 pb-2 border-b border-neutral-200">Subscription</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-red-50 p-4 rounded-xl border border-red-100">
                                        <div>
                                            <p className="text-xs font-semibold text-red-700 mb-1">Pilihan Paket Awal</p>
                                            <p className="font-black text-red-900 text-lg uppercase tracking-wider">{selectedRegistration.saas_plan_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-red-700 mb-1">Nominal Paket</p>
                                            <p className="font-black text-red-900 text-lg">{formatCurrency(selectedRegistration.nominal || 0)}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-neutral-500 mt-2 bg-neutral-100 p-2 rounded-lg italic font-medium">
                                        Persetujuan registrasi ini akan secara otomatis membuat entry Club dan akun Admin (username = alamat email PIC, password = athlix2026), dan langsung mengaktifkan billing sesuai nominal paket "{selectedRegistration.saas_plan_name}" ({formatCurrency(selectedRegistration.nominal || 0)}).
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-neutral-100 bg-white sticky bottom-0 z-10 flex gap-3 justify-end items-center">
                            <Button variant="ghost" onClick={() => setIsDetailsModalOpen(false)} className="text-neutral-500 hover:text-neutral-700">Tutup</Button>
                            {selectedRegistration.status === 'pending' && (
                                <div className="flex flex-col-reverse sm:flex-row gap-2 ml-auto w-full sm:w-auto">
                                    <Button variant="outline" className="w-full sm:w-auto border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800" onClick={() => handleReject(selectedRegistration.id)}>
                                        <XCircle size={16} className="mr-1.5" /> Tolak Request
                                    </Button>
                                    <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20 font-bold px-6" onClick={() => handleApprove(selectedRegistration.id)}>
                                        <CheckCircle size={16} className="mr-1.5" /> Setujui Pendaftaran
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </AdminLayout>
    );
}
