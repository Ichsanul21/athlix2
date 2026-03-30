import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Users, CheckCircle, XCircle, Trash2, Phone, Mail } from 'lucide-react';

export default function DojoRegistrations({ auth, registrations = [] }) {
    const handleApprove = (id) => {
        if (confirm('Apakah Anda yakin ingin menyetujui pendaftaran ini? Akun admin akan otomatis dibuat.')) {
            router.post(route('cms.dojo-registrations.approve', id));
        }
    };

    const handleReject = (id) => {
        if (confirm('Apakah Anda yakin ingin menolak pendaftaran ini?')) {
            router.post(route('cms.dojo-registrations.reject', id));
        }
    };

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus data ini secara permanen?')) {
            router.delete(route('cms.dojo-registrations.destroy', id));
        }
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
        <AdminLayout user={auth?.user} header={<h2 className="text-xl font-bold tracking-tight uppercase">Pendaftaran Dojo</h2>}>
            <Head title="Pendaftaran Dojo" />
            <div className="space-y-6 py-4">
                <Card className="border-neutral-200/80 dark:border-neutral-800 bg-gradient-to-r from-blue-500/10 to-transparent">
                    <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-blue-500/15 text-blue-600"><Users size={22} /></div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Free Trial</p>
                                <h3 className="text-lg font-black">Pendaftaran Dojo Baru</h3>
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
                                <p>Belum ada pendaftaran dojo baru.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-neutral-600 uppercase bg-neutral-100/50 border-b">
                                        <tr>
                                            <th className="px-6 py-4 font-bold">INFO DOJO</th>
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
                                                    <p className="text-xs font-bold text-athlix-red mt-1">Paket: {item.saas_plan_name}</p>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-medium">
                                                    {statusBadge(item.status)}
                                                </td>
                                                <td className="px-6 py-4 items-center justify-end flex gap-2">
                                                    {item.status === 'pending' && (
                                                        <>
                                                            <Button size="sm" variant="outline" className="h-8 gap-1 text-green-700 hover:text-green-800 hover:bg-green-50 border-green-200" onClick={() => handleApprove(item.id)}>
                                                                <CheckCircle size={14} /> <span className="hidden sm:inline">Setujui</span>
                                                            </Button>
                                                            <Button size="sm" variant="outline" className="h-8 gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200" onClick={() => handleReject(item.id)}>
                                                                <XCircle size={14} /> <span className="hidden sm:inline">Tolak</span>
                                                            </Button>
                                                        </>
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
        </AdminLayout>
    );
}
