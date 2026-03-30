import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { useEffect } from 'react';
import DbSelect from '@/Components/DbSelect';

export default function SystemSettings({ auth, settings = {}, flash }) {
    const form = useForm({
        billing_invoice_day: 1,
        billing_invoice_time: '00:10',
        billing_schedule_timezone: 'Asia/Makassar',
        saas_enforcement_time: '00:30',
        saas_schedule_timezone: 'Asia/Makassar',
        allow_public_registration: false,
        whatsapp_enabled: false,
        whatsapp_provider: 'fonnte',
        whatsapp_base_url: 'https://api.fonnte.com/send',
        whatsapp_auth_header: 'Authorization',
        whatsapp_timeout: 10,
        whatsapp_country_code: '62',
        whatsapp_token: '',
    });

    useEffect(() => {
        if (!settings || Object.keys(settings).length === 0) return;

        form.setData({
            billing_invoice_day: settings.BILLING_INVOICE_DAY ?? 1,
            billing_invoice_time: settings.BILLING_INVOICE_TIME ?? '00:10',
            billing_schedule_timezone: settings.BILLING_SCHEDULE_TIMEZONE ?? 'Asia/Makassar',
            saas_enforcement_time: settings.SAAS_ENFORCEMENT_TIME ?? '00:30',
            saas_schedule_timezone: settings.SAAS_SCHEDULE_TIMEZONE ?? 'Asia/Makassar',
            allow_public_registration: !!settings.ALLOW_PUBLIC_REGISTRATION,
            whatsapp_enabled: !!settings.WHATSAPP_ENABLED,
            whatsapp_provider: settings.WHATSAPP_PROVIDER ?? 'fonnte',
            whatsapp_base_url: settings.WHATSAPP_BASE_URL ?? 'https://api.fonnte.com/send',
            whatsapp_auth_header: settings.WHATSAPP_AUTH_HEADER ?? 'Authorization',
            whatsapp_timeout: settings.WHATSAPP_TIMEOUT ?? 10,
            whatsapp_country_code: settings.WHATSAPP_COUNTRY_CODE ?? '62',
            whatsapp_token: '',
        });
    }, [settings]);

    const submit = (event) => {
        event.preventDefault();
        form.patch(route('super-admin.system-settings.update'), {
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout user={auth?.user} header={<h2 className="text-xl font-bold tracking-tight uppercase">System Settings</h2>}>
            <Head title="System Settings" />

            <div className="space-y-6 py-4">

                <form onSubmit={submit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Billing Scheduler</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <label className="space-y-1 text-sm font-semibold">
                                <span>Invoice Day</span>
                                <Input type="number" min="1" max="28" value={form.data.billing_invoice_day} onChange={(e) => form.setData('billing_invoice_day', e.target.value)} />
                                {form.errors.billing_invoice_day && <p className="text-xs text-red-600">{form.errors.billing_invoice_day}</p>}
                            </label>
                            <label className="space-y-1 text-sm font-semibold">
                                <span>Invoice Time</span>
                                <Input type="time" value={form.data.billing_invoice_time} onChange={(e) => form.setData('billing_invoice_time', e.target.value)} />
                                {form.errors.billing_invoice_time && <p className="text-xs text-red-600">{form.errors.billing_invoice_time}</p>}
                            </label>
                            <label className="space-y-1 text-sm font-semibold">
                                <span>Invoice Timezone</span>
                                <Input value={form.data.billing_schedule_timezone} onChange={(e) => form.setData('billing_schedule_timezone', e.target.value)} />
                                {form.errors.billing_schedule_timezone && <p className="text-xs text-red-600">{form.errors.billing_schedule_timezone}</p>}
                            </label>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>SaaS Enforcement Scheduler</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <label className="space-y-1 text-sm font-semibold">
                                <span>Enforcement Time</span>
                                <Input type="time" value={form.data.saas_enforcement_time} onChange={(e) => form.setData('saas_enforcement_time', e.target.value)} />
                                {form.errors.saas_enforcement_time && <p className="text-xs text-red-600">{form.errors.saas_enforcement_time}</p>}
                            </label>
                            <label className="space-y-1 text-sm font-semibold">
                                <span>Enforcement Timezone</span>
                                <Input value={form.data.saas_schedule_timezone} onChange={(e) => form.setData('saas_schedule_timezone', e.target.value)} />
                                {form.errors.saas_schedule_timezone && <p className="text-xs text-red-600">{form.errors.saas_schedule_timezone}</p>}
                            </label>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>WhatsApp Gateway</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <label className="flex items-center gap-2 text-sm font-semibold md:col-span-2">
                                <input type="checkbox" checked={!!form.data.allow_public_registration} onChange={(e) => form.setData('allow_public_registration', e.target.checked)} />
                                Aktifkan Registrasi Publik Siswa
                            </label>
                            {form.errors.allow_public_registration && <p className="text-xs text-red-600 md:col-span-2">{form.errors.allow_public_registration}</p>}

                            <label className="flex items-center gap-2 text-sm font-semibold md:col-span-2">
                                <input type="checkbox" checked={!!form.data.whatsapp_enabled} onChange={(e) => form.setData('whatsapp_enabled', e.target.checked)} />
                                Aktifkan WhatsApp Notifikasi
                            </label>

                            <label className="space-y-1 text-sm font-semibold">
                                <span>Provider</span>
                                <DbSelect 
                                    options={[
                                        { value: 'fonnte', label: 'Fonnte' },
                                        { value: 'generic', label: 'Generic Webhook' },
                                    ]}
                                    value={form.data.whatsapp_provider} 
                                    onChange={(val) => form.setData('whatsapp_provider', val)} 
                                    placeholder="Pilih Provider" 
                                />
                                {form.errors.whatsapp_provider && <p className="text-xs text-red-600">{form.errors.whatsapp_provider}</p>}
                            </label>

                            <label className="space-y-1 text-sm font-semibold">
                                <span>Base URL</span>
                                <Input value={form.data.whatsapp_base_url} onChange={(e) => form.setData('whatsapp_base_url', e.target.value)} />
                                {form.errors.whatsapp_base_url && <p className="text-xs text-red-600">{form.errors.whatsapp_base_url}</p>}
                            </label>

                            <label className="space-y-1 text-sm font-semibold">
                                <span>Auth Header</span>
                                <Input value={form.data.whatsapp_auth_header} onChange={(e) => form.setData('whatsapp_auth_header', e.target.value)} />
                                {form.errors.whatsapp_auth_header && <p className="text-xs text-red-600">{form.errors.whatsapp_auth_header}</p>}
                            </label>

                            <label className="space-y-1 text-sm font-semibold">
                                <span>Timeout (detik)</span>
                                <Input type="number" min="3" max="60" value={form.data.whatsapp_timeout} onChange={(e) => form.setData('whatsapp_timeout', e.target.value)} />
                                {form.errors.whatsapp_timeout && <p className="text-xs text-red-600">{form.errors.whatsapp_timeout}</p>}
                            </label>

                            <label className="space-y-1 text-sm font-semibold">
                                <span>Country Code</span>
                                <Input value={form.data.whatsapp_country_code} onChange={(e) => form.setData('whatsapp_country_code', e.target.value)} />
                                {form.errors.whatsapp_country_code && <p className="text-xs text-red-600">{form.errors.whatsapp_country_code}</p>}
                            </label>

                            <label className="space-y-1 text-sm font-semibold">
                                <span>Token (kosongkan jika tidak diubah)</span>
                                <Input type="password" value={form.data.whatsapp_token} onChange={(e) => form.setData('whatsapp_token', e.target.value)} placeholder={settings.WHATSAPP_TOKEN_SET ? 'Token tersimpan' : 'Isi token gateway'} />
                                {form.errors.whatsapp_token && <p className="text-xs text-red-600">{form.errors.whatsapp_token}</p>}
                            </label>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Menyimpan...' : 'Simpan System Settings'}
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
