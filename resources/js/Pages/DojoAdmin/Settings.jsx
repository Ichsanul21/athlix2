import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Palette, Image as ImageIcon, CheckCircle, Save } from 'lucide-react';
import { useState, useRef } from 'react';

export default function Settings({ auth, dojo }) {
    const fileInputRef = useRef(null);
    const [previewLogo, setPreviewLogo] = useState(
        dojo?.logo_path ? `/storage/${dojo.logo_path}` : null
    );

    const form = useForm({
        name: dojo?.name || '',
        address_detail: dojo?.address_detail || '',
        contact_name: dojo?.contact_name || '',
        contact_email: dojo?.contact_email || '',
        contact_phone: dojo?.contact_phone || '',
        accent_color: dojo?.accent_color || '#dc2626',
        logo: null,
    });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            form.setData('logo', file);
            setPreviewLogo(URL.createObjectURL(file));
        }
    };

    const submit = (e) => {
        e.preventDefault();
        form.post(route('dojo-admin.settings.update'), {
            preserveScroll: true,
            onSuccess: () => {
                alert('Pengaturan dojo berhasil disimpan!');
            },
        });
    };

    return (
        <AdminLayout user={auth?.user} header={<h2 className="text-xl font-bold tracking-tight uppercase">Pengaturan Dojo</h2>}>
            <Head title="Pengaturan Dojo" />
            <div className="space-y-6 py-4 max-w-4xl mx-auto">
                <Card className="border-neutral-200/80 dark:border-neutral-800 bg-gradient-to-r from-athlix-red/10 to-transparent">
                    <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-athlix-red/15 text-athlix-red"><Palette size={22} /></div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Branding Dojo</p>
                                <h3 className="text-lg font-black">{dojo?.name || 'Dojo'}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <form onSubmit={submit} className="container max-w-2xl px-0">
                    {/* Basic Info Card */}
                    <Card className="border-neutral-200/80 dark:border-neutral-800 shadow-sm mb-6">
                        <CardHeader>
                            <CardTitle>Informasi & Kontak Dojo</CardTitle>
                            <CardDescription>Data dasar dan narahubung untuk dojo Anda.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-bold text-neutral-700">Nama Dojo</label>
                                <Input 
                                    className="mt-1"
                                    value={form.data.name} 
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    placeholder="Nama Dojo"
                                    required
                                />
                                {form.errors.name && <p className="text-red-500 text-xs mt-1">{form.errors.name}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-bold text-neutral-700">Alamat Detail Dojo</label>
                                <Input 
                                    className="mt-1"
                                    value={form.data.address_detail} 
                                    onChange={(e) => form.setData('address_detail', e.target.value)}
                                    placeholder="Jl. Raya No. 1..."
                                />
                                {form.errors.address_detail && <p className="text-red-500 text-xs mt-1">{form.errors.address_detail}</p>}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-sm font-bold text-neutral-700">Nama PIC</label>
                                    <Input 
                                        className="mt-1"
                                        value={form.data.contact_name} 
                                        onChange={(e) => form.setData('contact_name', e.target.value)}
                                        placeholder="Nama Penanggung Jawab"
                                    />
                                    {form.errors.contact_name && <p className="text-red-500 text-xs mt-1">{form.errors.contact_name}</p>}
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-neutral-700">Email PIC</label>
                                    <Input 
                                        type="email"
                                        className="mt-1"
                                        value={form.data.contact_email} 
                                        onChange={(e) => form.setData('contact_email', e.target.value)}
                                        placeholder="email@example.com"
                                    />
                                    {form.errors.contact_email && <p className="text-red-500 text-xs mt-1">{form.errors.contact_email}</p>}
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-neutral-700">No. HP PIC</label>
                                    <Input 
                                        className="mt-1"
                                        value={form.data.contact_phone} 
                                        onChange={(e) => form.setData('contact_phone', e.target.value)}
                                        placeholder="08xxxxxxxxxx"
                                    />
                                    {form.errors.contact_phone && <p className="text-red-500 text-xs mt-1">{form.errors.contact_phone}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-neutral-200/80 dark:border-neutral-800 shadow-sm">
                        <CardHeader>
                            <CardTitle>Branding & Tema</CardTitle>
                            <CardDescription>Sesuaikan warna dan logo yang akan ditampilkan di portal atlet dan wali atlet.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            
                            {/* Accent Color */}
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-bold text-neutral-700">Warna Aksen Primary (Accent Color)</label>
                                    <p className="text-xs text-neutral-500">Warna utama yang digunakan pada tombol dan aksen aplikasi.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div 
                                        className="h-10 w-10 rounded-xl shadow-inner border border-neutral-200 flex-shrink-0 cursor-pointer overflow-hidden relative"
                                        style={{ backgroundColor: form.data.accent_color }}
                                    >
                                        <input
                                            type="color"
                                            value={form.data.accent_color}
                                            onChange={(e) => form.setData('accent_color', e.target.value)}
                                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                        />
                                    </div>
                                    <Input
                                        className="font-mono text-sm max-w-32 uppercase"
                                        value={form.data.accent_color}
                                        onChange={(e) => form.setData('accent_color', e.target.value)}
                                        placeholder="#FF0000"
                                    />
                                </div>
                                {form.errors.accent_color && <p className="text-red-500 text-xs">{form.errors.accent_color}</p>}
                            </div>

                            <hr className="border-neutral-100" />

                            {/* Logo */}
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-bold text-neutral-700">Logo Dojo</label>
                                    <p className="text-xs text-neutral-500">Foto resolusi 1:1 direkomendasikan. Format JPG, PNG, WEBP (Max 5MB).</p>
                                </div>
                                <div className="flex items-center gap-5">
                                    <div className="h-24 w-24 rounded-2xl bg-neutral-100 border-2 border-dashed border-neutral-300 flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative group">
                                        {previewLogo ? (
                                            <>
                                                <img src={previewLogo} alt="Logo" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                                    <ImageIcon className="text-white w-6 h-6" />
                                                </div>
                                            </>
                                        ) : (
                                            <ImageIcon className="w-8 h-8 text-neutral-400" />
                                        )}
                                        <input 
                                            type="file" 
                                            ref={fileInputRef}
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                            accept="image/jpeg,image/png,image/webp,image/jpg"
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            {previewLogo ? 'Ganti Logo' : 'Upload Logo'}
                                        </Button>
                                    </div>
                                </div>
                                {form.errors.logo && <p className="text-red-500 text-xs">{form.errors.logo}</p>}
                            </div>

                            {/* Live Preview Button Effect demo */}
                            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 mt-6">
                                <p className="text-xs font-bold text-neutral-500 mb-3 uppercase tracking-wider">Preview Tombol Portal Atlet</p>
                                <button
                                    type="button"
                                    onClick={(e) => e.preventDefault()}
                                    className="px-6 py-2.5 rounded-xl font-bold text-white shadow-md transition-all hover:opacity-90 active:scale-95"
                                    style={{ backgroundColor: form.data.accent_color }}
                                >
                                    Login sebagai Atlet
                                </button>
                            </div>

                        </CardContent>
                    </Card>

                    <div className="mt-6 flex justify-end">
                        <Button 
                            type="submit" 
                            disabled={form.processing} 
                            className="bg-athlix-black hover:bg-neutral-800 text-white rounded-xl shadow-lg shadow-neutral-900/10 gap-2 items-center flex uppercase tracking-widest text-xs font-black px-6"
                        >
                            <Save size={16} /> {form.processing ? 'Menyimpan...' : 'Simpan Pengaturan'}
                        </Button>
                    </div>
                </form>

            </div>
        </AdminLayout>
    );
}
