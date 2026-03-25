import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { CreditCard, ArrowUpRight, ArrowDownLeft, Search, MessageCircle, Check, HandCoins } from 'lucide-react';
import { Input } from '@/Components/ui/input';
import { Skeleton } from '@/Components/ui/skeleton';
import { Button } from '@/Components/ui/button';
import Modal from '@/Components/Modal';
import { useEffect, useMemo, useState } from 'react';

export default function Index({ auth, records, filters, adminFee = 5000, flash, athletes = [], dojos = [], selectedDojoId = null }) {
    const [search, setSearch] = useState(filters?.search || '');
    const [confirmationModal, setConfirmationModal] = useState({ show: false, action: null, record: null });
    const [customModal, setCustomModal] = useState({ show: false, record: null });
    const [dojoId, setDojoId] = useState(selectedDojoId || '');
    const {
        data: customForm,
        setData: setCustomForm,
        post: postCustomNominal,
        processing: customProcessing,
        errors: customErrors,
        clearErrors: clearCustomErrors,
        reset: resetCustomForm,
    } = useForm({ new_amount: '', reason: '', source_athlete_id: '' });

    const isLoading = !records;
    const sourceRecords = records ?? [];

    useEffect(() => {
        setDojoId(selectedDojoId || '');
    }, [selectedDojoId]);

    const filteredRecords = useMemo(() => {
        const normalized = search.trim().toLowerCase();
        if (!normalized) return sourceRecords;

        return sourceRecords.filter((record) => {
            const candidateValues = [
                record.description,
                record.athlete?.full_name,
                record.athlete?.athlete_code,
                record.athlete_condition,
            ]
                .filter(Boolean)
                .map((value) => value.toString().toLowerCase());

            return candidateValues.some((value) => value.includes(normalized));
        });
    }, [sourceRecords, search]);

    if (isLoading) {
        return (
            <AdminLayout user={auth?.user} header={<h2 className="text-xl font-bold tracking-tight uppercase">Manajemen Keuangan</h2>}>
                <Head title="Finance" />
                <div className="py-6">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                            {Array.from({ length: 3 }).map((_, idx) => (<Skeleton key={idx} className="h-24" />))}
                        </div>
                        <Skeleton className="h-72 w-full" />
                    </div>
                </div>
            </AdminLayout>
        );
    }

    const totalRevenue = filteredRecords.filter((r) => r.status === 'paid').reduce((acc, r) => acc + parseFloat(r.total_amount || r.amount), 0);
    const totalOutstanding = filteredRecords.filter((r) => r.status === 'unpaid').reduce((acc, r) => acc + parseFloat(r.total_amount || r.amount), 0);
    const unpaidCount = filteredRecords.filter((r) => r.status === 'unpaid').length;

    const formatIDR = (amount) => new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(amount || 0);

    const closeModal = () => setConfirmationModal({ show: false, action: null, record: null });

    const confirmAction = () => {
        if (confirmationModal.action === 'generate') {
            router.post(route('finance.generate'), dojoId ? { dojo_id: dojoId } : {}, { onFinish: closeModal });
            return;
        }

        if (confirmationModal.action === 'markPaid' && confirmationModal.record) {
            router.patch(route('finance.update', confirmationModal.record.id), {}, { onFinish: closeModal });
        }
    };

    const openCustomModal = (record) => {
        setCustomModal({ show: true, record });
        clearCustomErrors();
        setCustomForm({
            new_amount: String(record.amount || ''),
            reason: '',
            source_athlete_id: '',
        });
    };

    const submitCustomNominal = () => {
        if (!customModal.record) return;
        postCustomNominal(route('finance.customize', customModal.record.id), {
            preserveScroll: true,
            data: {
                ...customForm,
                source_athlete_id: customForm.source_athlete_id || null,
            },
            onSuccess: () => {
                setCustomModal({ show: false, record: null });
                resetCustomForm();
            },
        });
    };

    return (
        <AdminLayout user={auth?.user} header={<h2 className="text-xl font-bold tracking-tight uppercase">Manajemen Keuangan</h2>}>
            <Head title="Finance" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
                    {flash?.success && (
                        <div className="p-3 text-sm rounded-xl border border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:border-green-900/30 ">
                            {flash.success}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                        <Card className="bg-green-50/80 dark:bg-green-900/10 border-green-200/50 dark:border-green-900/20">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs text-green-600  font-bold uppercase tracking-widest">Total Terbayar</p>
                                        <h3 className="text-xl sm:text-2xl font-black mt-1">{formatIDR(totalRevenue)}</h3>
                                    </div>
                                    <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-xl">
                                        <ArrowUpRight className="text-green-600" size={20} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-red-50/80 dark:bg-athlix-red/5 border-red-200/50 dark:border-athlix-red/10">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs text-athlix-red font-bold uppercase tracking-widest">Total Tunggakan</p>
                                        <h3 className="text-xl sm:text-2xl font-black mt-1">{formatIDR(totalOutstanding)}</h3>
                                    </div>
                                    <div className="p-2.5 bg-athlix-red/10 rounded-xl">
                                        <ArrowDownLeft className="text-athlix-red" size={20} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-neutral-200/80 dark:border-neutral-800">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Tagihan Belum Bayar</p>
                                        <h3 className="text-xl sm:text-2xl font-black mt-1">{unpaidCount} Atlet</h3>
                                    </div>
                                    <div className="p-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                                        <CreditCard size={20} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-neutral-200/80 dark:border-neutral-800">
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500">Daftar Tagihan</CardTitle>
                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                                <div className="relative w-full sm:max-w-xs">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                    <Input
                                        type="text"
                                        placeholder="Cari invoice/atlet..."
                                        className="pl-10 h-9"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                                {dojos.length > 0 && (
                                    <select
                                        className="h-9 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-bold uppercase tracking-widest text-neutral-600"
                                        value={dojoId || ''}
                                        onChange={(e) => {
                                            const next = e.target.value;
                                            setDojoId(next);
                                            router.get(route('finance.index'), next ? { dojo_id: next } : {}, { preserveScroll: true });
                                        }}
                                    >
                                        {dojos.map((dojo) => (
                                            <option key={dojo.id} value={dojo.id}>{dojo.name}</option>
                                        ))}
                                    </select>
                                )}
                                <Button
                                    onClick={() => setConfirmationModal({ show: true, action: 'generate', record: null })}
                                    className="w-full sm:w-auto bg-athlix-black text-white hover:bg-athlix-black/90 text-xs font-bold uppercase tracking-widest whitespace-normal leading-tight"
                                    size="sm"
                                    disabled={dojos.length > 0 && !dojoId}
                                >
                                    Buat Tagihan Bulanan
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-neutral-500 uppercase font-black bg-neutral-50/80 dark:bg-neutral-900/80 border-b border-neutral-200/80 dark:border-neutral-800 tracking-widest">
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
                                        {filteredRecords.map((rec) => (
                                            <tr key={rec.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30">
                                                <td className="px-6 py-4">
                                                    <p className="font-bold">{rec.athlete?.full_name}</p>
                                                    <p className="text-xs uppercase text-neutral-500">{rec.athlete?.athlete_code}</p>
                                                </td>
                                                <td className="px-6 py-4 text-xs">
                                                    <p>{rec.description}</p>
                                                    <p className="text-xs text-neutral-500 mt-1">Kondisi atlet: {rec.athlete_condition || '-'}</p>
                                                </td>
                                                <td className="px-6 py-4 font-mono">
                                                    <p className="font-bold">{formatIDR(rec.total_amount || rec.amount)}</p>
                                                    <p className="text-xs text-neutral-500">Rincian: {formatIDR(rec.amount)} + Admin {formatIDR(rec.admin_fee || adminFee)}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-widest ${
                                                        rec.status === 'paid'
                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 '
                                                            : 'bg-red-100 text-athlix-red dark:bg-athlix-red/10 '
                                                    }`}>
                                                        {rec.status === 'paid' ? 'Lunas' : 'Belum Lunas'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-mono text-neutral-500 whitespace-nowrap">{rec.due_date}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {rec.status === 'unpaid' && (
                                                            <>
                                                                <button
                                                                    onClick={() => setConfirmationModal({ show: true, action: 'markPaid', record: rec })}
                                                                    className="p-2 rounded-lg bg-blue-500/10 text-blue-600"
                                                                    title="Tandai Lunas"
                                                                >
                                                                    <Check size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => openCustomModal(rec)}
                                                                    className="p-2 rounded-lg bg-amber-500/10 text-amber-600"
                                                                    title="Custom Nominal"
                                                                >
                                                                    <HandCoins size={16} />
                                                                </button>
                                                            </>
                                                        )}
                                                        <button
                                                            onClick={() => {
                                                                const message = `Halo ${rec.athlete?.full_name}, ini pengingat pembayaran ${rec.description} sebesar ${formatIDR(rec.total_amount || rec.amount)}. Jatuh tempo: ${rec.due_date}.`;
                                                                window.open(`https://wa.me/${rec.athlete?.phone_number || ''}?text=${encodeURIComponent(message)}`, '_blank');
                                                            }}
                                                            className="p-2 rounded-lg bg-green-500/10 text-green-600"
                                                            title="Kirim Pengingat WA"
                                                        >
                                                            <MessageCircle size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredRecords.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-10 text-center text-sm text-neutral-400">
                                                    Data pembayaran tidak ditemukan.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-neutral-200/80 dark:border-neutral-800">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500">Audit Cross-Subsidi</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            {filteredRecords.flatMap((record) => (record.adjustments || []).map((item) => ({ ...item, athlete: record.athlete?.full_name }))).slice(0, 8).map((item) => (
                                <div key={item.id} className="p-3 rounded-xl border border-neutral-200/80 dark:border-neutral-800">
                                    <p className="font-semibold">{item.athlete}</p>
                                    <p className="text-xs text-neutral-500">{formatIDR(item.old_amount)} {'->'} {formatIDR(item.new_amount)} | Delta: {formatIDR(item.delta_amount)}</p>
                                    <p className="text-xs text-neutral-600 ">Alasan: {item.reason}</p>
                                    {item.source_athlete && <p className="text-xs text-neutral-500">Sumber subsidi: {item.source_athlete}</p>}
                                    <p className="text-xs text-neutral-400">{item.created_at}</p>
                                </div>
                            ))}
                            {filteredRecords.flatMap((record) => record.adjustments || []).length === 0 && (
                                <p className="text-sm text-neutral-400">Belum ada perubahan nominal yang tercatat.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Modal show={confirmationModal.show} onClose={closeModal} maxWidth="md">
                <div className="p-6 space-y-4">
                    <h3 className="text-lg font-black uppercase tracking-tight">
                        {confirmationModal.action === 'generate' ? 'Buat Tagihan Bulanan' : 'Konfirmasi Pembayaran'}
                    </h3>
                    <p className="text-sm text-neutral-600 ">
                        {confirmationModal.action === 'generate'
                            ? 'Terbitkan tagihan iuran bulanan baru untuk semua atlet aktif sekarang?'
                            : `Tandai tagihan ${confirmationModal.record?.description || ''} atas nama ${confirmationModal.record?.athlete?.full_name || ''} sebagai lunas?`}
                    </p>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={closeModal}>Batal</Button>
                        <Button type="button" onClick={confirmAction}>Ya, Lanjutkan</Button>
                    </div>
                </div>
            </Modal>

            <Modal show={customModal.show} onClose={() => setCustomModal({ show: false, record: null })} maxWidth="lg">
                <div className="p-6 space-y-4">
                    <h3 className="text-lg font-black uppercase tracking-tight text-neutral-900">Custom Nominal Per Athlete</h3>
                    <p className="text-sm text-neutral-700">
                        Gunakan form ini untuk skema cross-subsidi. Semua perubahan akan tercatat otomatis pada audit log.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Nominal Baru</label>
                            <Input
                                type="number"
                                min="0"
                                value={customForm.new_amount}
                                onChange={(e) => setCustomForm('new_amount', e.target.value)}
                                placeholder="Contoh: 125000"
                            />
                            {customErrors.new_amount && <p className="text-xs text-athlix-red">{customErrors.new_amount}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Sumber Cross-Subsidi</label>
                            <select
                                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                                value={customForm.source_athlete_id}
                                onChange={(e) => setCustomForm('source_athlete_id', e.target.value)}
                            >
                                <option value="">Tidak ada (manual)</option>
                                {athletes.map((athlete) => (
                                    <option key={athlete.id} value={athlete.id}>{athlete.full_name}</option>
                                ))}
                            </select>
                            {customErrors.source_athlete_id && <p className="text-xs text-athlix-red">{customErrors.source_athlete_id}</p>}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Alasan Penyesuaian</label>
                        <textarea
                            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm min-h-24 text-neutral-900"
                            value={customForm.reason}
                            onChange={(e) => setCustomForm('reason', e.target.value)}
                            placeholder="Contoh: subsidi silang dari atlet sponsor internal dojo"
                        />
                        {customErrors.reason && <p className="text-xs text-athlix-red">{customErrors.reason}</p>}
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setCustomModal({ show: false, record: null })}>Batal</Button>
                        <Button type="button" onClick={submitCustomNominal} disabled={customProcessing}>
                            {customProcessing ? 'Menyimpan...' : 'Simpan Penyesuaian'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}

