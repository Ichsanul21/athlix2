import AdminLayout from '@/Layouts/AdminLayout';
import { Head, usePage } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { User, Shield, Building2, Phone, Mail, FileText, Activity } from 'lucide-react';
import { Skeleton } from '@/Components/ui/skeleton';

export default function Edit({ auth, mustVerifyEmail, status, profilePhotoUrl, athleteData, guardianData, dojoData }) {
    const isLoading = false;

    if (isLoading) {
        return (
            <AdminLayout user={auth?.user} header={<h2 className="text-xl font-bold tracking-tight uppercase">Pengaturan Profil</h2>}>
                <div className="py-6 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
                    <Skeleton className="h-44 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </AdminLayout>
        );
    }

    const roleLabel = 
        auth.user.role === 'super_admin' ? 'Super Admin' :
        auth.user.role === 'admin' ? 'Admin Dojo' :
        auth.user.role === 'sensei' ? 'Sensei/Pelatih' :
        auth.user.role === 'murid' ? 'Atlet/Murid' :
        auth.user.role === 'parent' ? 'Orang Tua/Wali' : 'Pengguna';

    return (
        <AdminLayout user={auth?.user} header={<h2 className="text-xl font-bold tracking-tight uppercase">Pengaturan Profil</h2>}>
            <Head title="Profil Akun" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Header Summary Card */}
                    <Card className="border-neutral-200/80 dark:border-neutral-800 bg-gradient-to-br from-white to-neutral-50/50 dark:from-neutral-900 dark:to-neutral-900/50">
                        <CardContent className="p-6">
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                                {profilePhotoUrl ? (
                                    <img src={profilePhotoUrl} alt={auth.user.name} className="w-24 h-24 rounded-2xl object-cover shadow-sm border border-athlix-red/20" />
                                ) : (
                                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-athlix-red/20 to-athlix-red/5 border border-athlix-red/10 flex items-center justify-center text-3xl font-black text-athlix-red shadow-sm">
                                        {auth.user.name.charAt(0)}
                                    </div>
                                )}
                                <div className="text-center sm:text-left space-y-1.5 flex-1">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                        <h3 className="text-2xl font-black uppercase tracking-tight">{auth.user.name}</h3>
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-athlix-red/10 text-athlix-red">
                                            <Shield size={12} /> {roleLabel}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium text-neutral-500 flex items-center justify-center sm:justify-start gap-1.5">
                                        <Mail size={14} /> {auth.user.email}
                                    </p>
                                    {auth.user.phone_number && (
                                        <p className="text-sm font-medium text-neutral-500 flex items-center justify-center sm:justify-start gap-1.5">
                                            <Phone size={14} /> {auth.user.phone_number}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Detail Info Sidebar */}
                        <div className="space-y-6">
                            {(athleteData && auth.user.role === 'murid') && (
                                <Card className="border-neutral-200/80 dark:border-neutral-800">
                                    <CardHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-800">
                                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                                            <Activity size={14} /> Informasi Atlet
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-3">
                                        <div className="text-sm">
                                            <p className="text-neutral-500 text-xs">Dojo</p>
                                            <p className="font-semibold">{athleteData.dojo?.name || '-'}</p>
                                        </div>
                                        <div className="text-sm">
                                            <p className="text-neutral-500 text-xs">Level Saat Ini</p>
                                            <p className="font-semibold text-athlix-red uppercase">{athleteData.level?.name || '-'}</p>
                                        </div>
                                        <div className="text-sm">
                                            <p className="text-neutral-500 text-xs">Nomor Tanding</p>
                                            <p className="font-semibold">{athleteData.athlete_code || '-'}</p>
                                        </div>
                                        {guardianData && (
                                            <div className="text-sm border-t border-neutral-100 pt-3 mt-3">
                                                <p className="text-neutral-500 text-xs">Orang Tua/Wali</p>
                                                <p className="font-semibold">{guardianData.name}</p>
                                                <p className="text-xs text-neutral-400">{guardianData.phone_number}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {(athleteData?.linked_athletes && auth.user.role === 'parent') && (
                                <Card className="border-neutral-200/80 dark:border-neutral-800">
                                    <CardHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-800">
                                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                                            <User size={14} /> Atlet Tertaut
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-3">
                                        {athleteData.linked_athletes.length > 0 ? athleteData.linked_athletes.map(linked => (
                                            <div key={linked.id} className="text-sm border-b border-neutral-100/50 last:border-0 pb-3 last:pb-0">
                                                <p className="font-semibold">{linked.full_name} <span className="font-normal text-xs text-neutral-400">({linked.relation_type})</span></p>
                                                <p className="text-xs text-athlix-red font-semibold">{linked.level || '-'}</p>
                                            </div>
                                        )) : (
                                            <p className="text-xs text-neutral-500">Belum ada atlet yang ditautkan ke akun ini.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {dojoData && (
                                <Card className="border-neutral-200/80 dark:border-neutral-800">
                                    <CardHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-800">
                                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                                            <Building2 size={14} /> Informasi Dojo
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-3 text-sm">
                                        <div>
                                            <p className="text-neutral-500 text-xs">Nama Dojo</p>
                                            <p className="font-semibold">{dojoData.name}</p>
                                        </div>
                                        {dojoData.contact_name && (
                                            <div>
                                                <p className="text-neutral-500 text-xs">Penanggung Jawab (PIC)</p>
                                                <p className="font-semibold">{dojoData.contact_name}</p>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-neutral-500 text-xs">Paket Aktif</p>
                                            <p className="font-semibold">{dojoData.saas_plan_name}</p>
                                        </div>
                                        {dojoData.subscription_expires_at && (
                                            <div>
                                                <p className="text-neutral-500 text-xs">Status Berlangganan</p>
                                                <p className="font-semibold">Berakhir: {new Date(dojoData.subscription_expires_at).toLocaleDateString('id-ID')}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Edit Forms Column */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="border-neutral-200/80 dark:border-neutral-800">
                                <CardHeader className="border-b border-neutral-100 dark:border-neutral-800">
                                    <CardTitle className="text-base font-black uppercase tracking-widest">Informasi Dasar & Kontak</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <UpdateProfileInformationForm
                                        mustVerifyEmail={mustVerifyEmail}
                                        status={status}
                                        className="max-w-xl"
                                    />
                                </CardContent>
                            </Card>

                            <Card className="border-neutral-200/80 dark:border-neutral-800">
                                <CardHeader className="border-b border-neutral-100 dark:border-neutral-800">
                                    <CardTitle className="text-base font-black uppercase tracking-widest">Keamanan Akun</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <UpdatePasswordForm className="max-w-xl" />
                                </CardContent>
                            </Card>

                            <Card className="border-red-200 dark:border-red-900/30">
                                <CardHeader className="border-b border-red-100 dark:border-red-900/20 bg-red-50/50 dark:bg-red-900/10">
                                    <CardTitle className="text-base font-black uppercase tracking-widest text-red-600">Hapus Akun Permanen</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <DeleteUserForm className="max-w-xl" />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
