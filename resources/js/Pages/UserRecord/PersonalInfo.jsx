import PwaLayout from '@/Layouts/PwaLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar } from 'lucide-react';

export default function PersonalInfo({ auth, athlete }) {
    return (
        <PwaLayout user={auth.user} header="Informasi Pribadi">
            <Head title="Personal Information" />
            
            <div className="space-y-6">
                <div className="flex items-center gap-4 py-2">
                    <Link href={route('profile.pwa')} className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                        <ArrowLeft size={20} />
                    </Link>
                    <h2 className="text-xl font-black uppercase tracking-tighter">Biodataku</h2>
                </div>

                <div className="space-y-4">
                    <Card className="border-none bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
                        <CardContent className="p-0">
                            <div className="p-4 flex items-center gap-4 border-b border-neutral-100 dark:border-neutral-800">
                                <div className="w-10 h-10 rounded-lg bg-athlix-red/10 flex items-center justify-center text-athlix-red">
                                    <User size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Nama Lengkap</p>
                                    <p className="text-sm font-bold">{athlete.full_name}</p>
                                </div>
                            </div>
                            <div className="p-4 flex items-center gap-4 border-b border-neutral-100 dark:border-neutral-800">
                                <div className="w-10 h-10 rounded-lg bg-athlix-red/10 flex items-center justify-center text-athlix-red">
                                    <Calendar size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Tanggal Lahir</p>
                                    <p className="text-sm font-bold">{athlete.birth_date || '12 Maret 2010'}</p>
                                </div>
                            </div>
                            <div className="p-4 flex items-center gap-4 border-b border-neutral-100 dark:border-neutral-800">
                                <div className="w-10 h-10 rounded-lg bg-athlix-red/10 flex items-center justify-center text-athlix-red">
                                    <Phone size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Nomor Telepon</p>
                                    <p className="text-sm font-bold">{athlete.phone_number || '+62 812-3456-7890'}</p>
                                </div>
                            </div>
                            <div className="p-4 flex items-center gap-4 border-b border-neutral-100 dark:border-neutral-800">
                                <div className="w-10 h-10 rounded-lg bg-athlix-red/10 flex items-center justify-center text-athlix-red">
                                    <MapPin size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Dojo</p>
                                    <p className="text-sm font-bold font-mono">{athlete.dojo?.name || 'Dojo Utama'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <p className="px-4 text-[10px] text-neutral-500 text-center leading-relaxed">
                        Data ini disinkronkan langsung dari pusat database dojo. Hubungi admin jika ingin mengubah informasi.
                    </p>
                </div>
            </div>
        </PwaLayout>
    );
}
