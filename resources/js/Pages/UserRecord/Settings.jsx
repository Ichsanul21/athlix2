import PwaLayout from '@/Layouts/PwaLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { ArrowLeft, Bell, Shield, HelpCircle, Info, Languages } from 'lucide-react';
import { useLanguage } from '@/Components/LanguageProvider';
import LanguageSwitch from '@/Components/LanguageSwitch';

export default function Settings({ auth }) {
    const { t } = useLanguage();
    const pageProps = usePage().props;
    const user = pageProps.auth?.user;
    const flash = pageProps.flash || {};
    const form = useForm({
        name: user?.name || '',
        email: user?.email || '',
        phone_number: user?.phone_number || '',
        profile_photo: null,
    });

    const submitAccount = (e) => {
        e.preventDefault();
        form.patch(route('profile.update'), {
            forceFormData: true,
        });
    };

    return (
        <PwaLayout user={auth?.user} header={t('common.settings', 'Pengaturan')}>
            <Head title="Settings" />
            
            <div className="space-y-6 pb-24">
                <div className="flex items-center gap-4 py-2 animate-fade-in-up fill-both">
                    <Link href={route('profile.pwa')} className="p-2.5 rounded-xl bg-neutral-100 text-neutral-600  hover:bg-neutral-200 transition-all duration-300 active:scale-95">
                        <ArrowLeft size={20} />
                    </Link>
                    <h2 className="text-xl font-black uppercase tracking-tighter">{t('settings.app_options', 'Opsi Aplikasi')}</h2>
                </div>

                <div className="space-y-4">
                    {flash.success && (
                        <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
                            {flash.success}
                        </div>
                    )}

                    <Card className="border-none bg-white shadow-sm overflow-hidden animate-fade-in-up fill-both" style={{ animationDelay: '40ms' }}>
                        <CardContent className="p-4 space-y-3">
                            <h3 className="text-sm font-black uppercase tracking-widest">{t('settings.account_data', 'Data Akun')}</h3>
                            <form onSubmit={submitAccount} className="space-y-3">
                                <input className="w-full rounded-lg border px-3 py-2 text-sm" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} placeholder={t('settings.name_placeholder', 'Nama akun')} required />
                                <input className="w-full rounded-lg border px-3 py-2 text-sm" type="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} placeholder="Email" required />
                                <input className="w-full rounded-lg border px-3 py-2 text-sm" value={form.data.phone_number} onChange={(e) => form.setData('phone_number', e.target.value)} placeholder={t('settings.phone_placeholder', 'No. WhatsApp')} required />
                                <input className="w-full rounded-lg border px-3 py-2 text-sm" type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(e) => form.setData('profile_photo', e.target.files?.[0] ?? null)} />
                                {user?.profile_photo_url && <img src={user.profile_photo_url} alt="Profile" className="h-14 w-14 rounded-full object-cover border" />}
                                <button type="submit" className="w-full rounded-xl bg-athlix-red text-white py-2.5 text-sm font-bold" disabled={form.processing}>{form.processing ? t('settings.saving', 'Menyimpan...') : t('settings.save_account', 'Simpan Data Akun')}</button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-white shadow-sm divide-y divide-neutral-100 overflow-hidden animate-fade-in-up fill-both" style={{ animationDelay: '80ms' }}>
                        {/* Language Switch */}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600 transition-colors duration-300">
                                    <Languages size={18} />
                                </div>
                                <div>
                                    <span className="font-bold text-sm">{t('settings.language', 'Bahasa')}</span>
                                    <p className="text-xs text-neutral-400">{t('settings.language_desc', 'Pilih bahasa tampilan aplikasi')}</p>
                                </div>
                            </div>
                            <LanguageSwitch />
                        </div>

                        {/* Notifications Toggle */}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-orange-100 text-orange-600">
                                    <Bell size={18} />
                                </div>
                                <div>
                                    <span className="font-bold text-sm">{t('settings.push_notifications', 'Notifikasi Push')}</span>
                                    <p className="text-xs text-neutral-400">{t('settings.active', 'Aktif')}</p>
                                </div>
                            </div>
                            <div className="relative w-12 h-6 bg-athlix-red rounded-full p-0.5 shadow-glow-red cursor-pointer">
                                <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-md"></div>
                            </div>
                        </div>

                        {/* Privacy */}
                        <div className="p-4 flex items-center justify-between bg-neutral-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-purple-100 text-purple-600">
                                    <Shield size={18} />
                                </div>
                                <div>
                                    <span className="font-bold text-sm">{t('settings.data_privacy', 'Privasi Data')}</span>
                                    <p className="text-xs text-neutral-400">{t('settings.protected', 'Terlindungi')}</p>
                                </div>
                            </div>
                            <Info size={16} className="text-neutral-400" />
                        </div>
                    </Card>

                    <Card className="border-none bg-white shadow-sm overflow-hidden animate-fade-in-up fill-both" style={{ animationDelay: '160ms' }}>
                        <button className="w-full p-4 flex items-center gap-3 hover:bg-neutral-50 transition-all duration-300 active:scale-[0.98]">
                            <HelpCircle size={18} className="text-neutral-400" />
                            <span className="font-bold text-sm">{t('settings.help_faq', 'Bantuan & FAQ')}</span>
                        </button>
                    </Card>

                    <div className="text-center py-4 animate-fade-in fill-both" style={{ animationDelay: '240ms' }}>
                        <p className="text-xs font-black uppercase text-neutral-300  tracking-[0.2em]">ATHLIX. Prototype v1.0.1</p>
                    </div>
                </div>
            </div>
        </PwaLayout>
    );
}


