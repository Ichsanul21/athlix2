import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Palette, Image as ImageIcon, Save } from 'lucide-react';
import DbSelect from '@/Components/DbSelect';
import { useState, useEffect, useRef, useCallback } from 'react';

export default function Settings({ auth, dojo }) {
    const fileInputRef = useRef(null);
    const [previewLogo, setPreviewLogo] = useState(null);

    // States untuk Wilayah
    const [provinces, setProvinces] = useState([]);
    const [regencies, setRegencies] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [villages, setVillages] = useState([]);

    const [loadingProv, setLoadingProv] = useState(false);
    const [loadingReg, setLoadingReg] = useState(false);
    const [loadingDist, setLoadingDist] = useState(false);
    const [loadingVill, setLoadingVill] = useState(false);

    const form = useForm({
        name: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        accent_color: '#dc2626',
        logo: null,
        province_code: '',
        province_name: '',
        regency_code: '',
        regency_name: '',
        district_code: '',
        district_name: '',
        village_code: '',
        village_name: '',
        address_detail: '',
    });

    // Fetch Wilayah
    useEffect(() => {
        if (dojo && provinces.length === 0) {
            setLoadingProv(true);
            fetch(route('api.regions.provinces'))
                .then(res => res.json())
                .then(data => setProvinces(data || []))
                .catch(() => { })
                .finally(() => setLoadingProv(false));
        }
    }, [dojo]);

    const fetchRegencies = useCallback(async (provinceCode) => {
        if (!provinceCode) { setRegencies([]); return; }
        setLoadingReg(true);
        try {
            const res = await fetch(route('api.regions.regencies', provinceCode));
            const data = await res.json();
            setRegencies(data || []);
        } catch { setRegencies([]); }
        setLoadingReg(false);
    }, []);

    const fetchDistricts = useCallback(async (regencyCode) => {
        if (!regencyCode) { setDistricts([]); return; }
        setLoadingDist(true);
        try {
            const res = await fetch(route('api.regions.districts', regencyCode));
            const data = await res.json();
            setDistricts(data || []);
        } catch { setDistricts([]); }
        setLoadingDist(false);
    }, []);

    const fetchVillages = useCallback(async (districtCode) => {
        if (!districtCode) { setVillages([]); return; }
        setLoadingVill(true);
        try {
            const res = await fetch(route('api.regions.villages', districtCode));
            const data = await res.json();
            setVillages(data || []);
        } catch { setVillages([]); }
        setLoadingVill(false);
    }, []);

    // Mengisi form saat data dojo berhasil di-load
    useEffect(() => {
        if (dojo) {
            form.setData({
                name: dojo.name || '',
                contact_name: dojo.contact_name || '',
                contact_email: dojo.contact_email || '',
                contact_phone: dojo.contact_phone || '',
                accent_color: dojo.accent_color || '#dc2626',
                logo: null,
                province_code: dojo.province_code || '',
                province_name: dojo.province_name || '',
                regency_code: dojo.regency_code || '',
                regency_name: dojo.regency_name || '',
                district_code: dojo.district_code || '',
                district_name: dojo.district_name || '',
                village_code: dojo.village_code || '',
                village_name: dojo.village_name || '',
                address_detail: dojo.address_detail || '',
            });

            // Pre-fetch sub-wilayah jika data sudah ada sebelumnya
            if (dojo.province_code) fetchRegencies(dojo.province_code);
            if (dojo.regency_code) fetchDistricts(dojo.regency_code);
            if (dojo.district_code) fetchVillages(dojo.district_code);

            if (dojo.logo_path) {
                setPreviewLogo(`/storage/${dojo.logo_path}`);
            }
        }
    }, [dojo]);

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
        });
    };

    return (
        <AdminLayout user={auth?.user} header={<h2 className="text-xl font-bold tracking-tight uppercase">Pengaturan Club</h2>}>
            <Head title="Pengaturan Club" />

            <div className="space-y-6 py-4 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header Branding Card */}
                <Card className="border-neutral-200/80 dark:border-neutral-800 bg-gradient-to-r from-athlix-red/10 to-transparent shadow-sm">
                    <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-athlix-red/15 text-athlix-red"><Palette size={22} /></div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Branding Club</p>
                                <h3 className="text-lg font-black">{dojo?.name || 'Club'}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <form onSubmit={submit} className="space-y-6">

                    {/* Basic Info Card */}
                    <Card className="border-neutral-200/80 dark:border-neutral-800 shadow-sm">
                        <CardHeader className="p-5 sm:p-6 pb-0 sm:pb-0">
                            <CardTitle className="text-base font-black uppercase tracking-wider text-neutral-800 dark:text-neutral-200">Informasi & Kontak Club</CardTitle>
                            <CardDescription className="text-sm">Data dasar dan narahubung untuk club Anda.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-5 sm:p-6 space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Nama Club *</label>
                                <Input
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    placeholder="Nama Club"
                                    required
                                />
                                {form.errors.name && <p className="text-xs text-red-500 mt-1">{form.errors.name}</p>}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Nama PIC</label>
                                    <Input
                                        value={form.data.contact_name}
                                        onChange={(e) => form.setData('contact_name', e.target.value)}
                                        placeholder="Nama Penanggung Jawab"
                                    />
                                    {form.errors.contact_name && <p className="text-xs text-red-500 mt-1">{form.errors.contact_name}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Email PIC</label>
                                    <Input
                                        type="email"
                                        value={form.data.contact_email}
                                        onChange={(e) => form.setData('contact_email', e.target.value)}
                                        placeholder="email@example.com"
                                    />
                                    {form.errors.contact_email && <p className="text-xs text-red-500 mt-1">{form.errors.contact_email}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">No. HP PIC</label>
                                    <Input
                                        value={form.data.contact_phone}
                                        onChange={(e) => form.setData('contact_phone', e.target.value)}
                                        placeholder="08xxxxxxxxxx"
                                    />
                                    {form.errors.contact_phone && <p className="text-xs text-red-500 mt-1">{form.errors.contact_phone}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Alamat Mendetail Card */}
                    <Card className="border-neutral-200/80 dark:border-neutral-800 shadow-sm">
                        <CardHeader className="p-5 sm:p-6 pb-0 sm:pb-0">
                            <CardTitle className="text-base font-black uppercase tracking-wider text-neutral-800 dark:text-neutral-200">Alamat Lengkap Club</CardTitle>
                            <CardDescription className="text-sm">Lokasi gedung atau sasana latihan club Anda.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-5 sm:p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Provinsi</label>
                                    <DbSelect
                                        value={form.data.province_code}
                                        isDisabled={loadingProv}
                                        options={provinces.map(p => ({ value: p.code, label: p.name }))}
                                        onChange={(code, option) => {
                                            form.setData(data => ({
                                                ...data,
                                                province_code: code,
                                                province_name: option ? option.label : '',
                                                regency_code: '', regency_name: '',
                                                district_code: '', district_name: '',
                                                village_code: '', village_name: ''
                                            }));
                                            fetchRegencies(code);
                                        }}
                                        placeholder={loadingProv ? "Memuat..." : "Pilih Provinsi"}
                                    />
                                    {form.errors.province_code && <p className="text-xs text-red-500 mt-1">{form.errors.province_code}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Kota / Kabupaten</label>
                                    <DbSelect
                                        value={form.data.regency_code}
                                        isDisabled={!form.data.province_code || loadingReg}
                                        options={regencies.map(r => ({ value: r.code, label: r.name }))}
                                        onChange={(code, option) => {
                                            form.setData(data => ({
                                                ...data,
                                                regency_code: code,
                                                regency_name: option ? option.label : '',
                                                district_code: '', district_name: '',
                                                village_code: '', village_name: ''
                                            }));
                                            fetchDistricts(code);
                                        }}
                                        placeholder={loadingReg ? "Memuat..." : "Pilih Kota/Kab"}
                                    />
                                    {form.errors.regency_code && <p className="text-xs text-red-500 mt-1">{form.errors.regency_code}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Kecamatan</label>
                                    <DbSelect
                                        value={form.data.district_code}
                                        isDisabled={!form.data.regency_code || loadingDist}
                                        options={districts.map(d => ({ value: d.code, label: d.name }))}
                                        onChange={(code, option) => {
                                            form.setData(data => ({
                                                ...data,
                                                district_code: code,
                                                district_name: option ? option.label : '',
                                                village_code: '', village_name: ''
                                            }));
                                            fetchVillages(code);
                                        }}
                                        placeholder={loadingDist ? "Memuat..." : "Pilih Kecamatan"}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Kelurahan / Desa</label>
                                    <DbSelect
                                        value={form.data.village_code}
                                        isDisabled={!form.data.district_code || loadingVill}
                                        options={villages.map(v => ({ value: v.code, label: v.name }))}
                                        onChange={(code, option) => {
                                            form.setData(data => ({
                                                ...data,
                                                village_code: code,
                                                village_name: option ? option.label : ''
                                            }));
                                        }}
                                        placeholder={loadingVill ? "Memuat..." : "Pilih Kelurahan"}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Detail Alamat (Nama Jalan, Gedung, dll)</label>
                                <textarea
                                    value={form.data.address_detail}
                                    onChange={e => form.setData('address_detail', e.target.value)}
                                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:ring-2 focus:ring-athlix-red/30 focus:border-athlix-red/50 min-h-[80px] text-neutral-900 dark:text-neutral-100"
                                    placeholder="Nama jalan, nomor gedung, lantai, dsb..."
                                />
                                {form.errors.address_detail && <p className="text-xs text-red-500 mt-1">{form.errors.address_detail}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Branding & Theme Card */}
                    <Card className="border-neutral-200/80 dark:border-neutral-800 shadow-sm">
                        <CardHeader className="p-5 sm:p-6 pb-0 sm:pb-0">
                            <CardTitle className="text-base font-black uppercase tracking-wider text-neutral-800 dark:text-neutral-200">Branding & Tema</CardTitle>
                            <CardDescription className="text-sm">Sesuaikan warna dan logo yang akan ditampilkan di portal atlet dan wali atlet.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-5 sm:p-6 space-y-6">

                            {/* Accent Color */}
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Warna Aksen Primary (Accent Color)</label>
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
                                {form.errors.accent_color && <p className="text-xs text-red-500">{form.errors.accent_color}</p>}
                            </div>

                            <hr className="border-neutral-100 dark:border-neutral-800" />

                            {/* Logo */}
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Logo Club</label>
                                    <p className="text-xs text-neutral-500">Foto resolusi 1:1 direkomendasikan. Format JPG, PNG, WEBP (Max 5MB).</p>
                                </div>
                                <div className="flex items-center gap-5">
                                    <div className="h-24 w-24 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative group">
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
                                {form.errors.logo && <p className="text-xs text-red-500">{form.errors.logo}</p>}
                            </div>

                            {/* Live Preview Button Effect demo */}
                            <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800">
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

                    {/* Submit Button */}
                    <div className="flex justify-end pt-2">
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
