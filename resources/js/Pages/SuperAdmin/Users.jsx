import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import DbSelect from '@/Components/DbSelect';
import FileInput from '@/Components/FileInput';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { useState } from 'react';
import Modal from '@/Components/Modal';
import { Plus, X } from 'lucide-react';

const ROLE_LABELS = {
    super_admin: 'Super Admin',
    landing_admin: 'Landing Admin',
    dojo_admin: 'Admin Dojo',
    head_coach: 'Head Coach',
    sensei: 'Sensei',
    assistant: 'Asisten Pelatih',
    medical_staff: 'Staff Medis',
    atlet: 'Atlet',
    parent: 'Orang Tua',
};

export default function Users({ auth, users = [], dojos = [], athletes = [] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);
    const [search, setSearch] = useState('');

    const filteredUsers = users.filter((user) =>
        user.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase())
    );

    const form = useForm({
        name: '',
        email: '',
        phone_number: '',
        role: 'sensei',
        dojo_id: '',
        athlete_id: '',
        profile_photo: null,
    });

    const submit = () => {
        if (editingUserId) {
            form.post(route('super-admin.users.update', editingUserId), {
                forceFormData: true,
                data: { ...form.data, _method: 'patch' },
                onSuccess: () => {
                    setEditingUserId(null);
                    form.reset('name', 'email', 'phone_number', 'password', 'role', 'dojo_id', 'athlete_id', 'profile_photo');
                    form.setData('role', 'sensei');
                    setIsModalOpen(false);
                },
            });
            return;
        }

        form.post(route('super-admin.users.store'), {
            forceFormData: true,
            onSuccess: () => {
                form.reset('name', 'email', 'phone_number', 'password', 'role', 'dojo_id', 'athlete_id', 'profile_photo');
                form.setData('role', 'sensei');
                setIsModalOpen(false);
            },
        });
    };

    const handleResetPassword = () => {
        if (!editingUserId) return;
        if (confirm('Yakin ingin reset password akun ini ke "athlix2026"?')) {
            router.post(route('super-admin.users.reset-password', editingUserId), {}, {
                onSuccess: () => {
                    // Password changed
                }
            });
        }
    };

    const openModal = (user = null) => {
        if (user) {
            setEditingUserId(user.id);
            form.setData({
                name: user.name || '',
                email: user.email || '',
                phone_number: user.phone_number || '',
                password: '',
                role: user.role || 'sensei',
                dojo_id: user.dojo_id || '',
                athlete_id: user.athlete_id || '',
                profile_photo: null,
            });
        } else {
            setEditingUserId(null);
            form.reset('name', 'email', 'phone_number', 'password', 'role', 'dojo_id', 'athlete_id', 'profile_photo');
            form.setData('role', 'sensei');
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUserId(null);
        form.reset();
    };

    return (
        <AdminLayout
            user={auth?.user}
            header={<h2 className="text-xl font-bold tracking-tight uppercase">Master Akun</h2>}
        >
            <Head title="Master Akun" />
            <div className="space-y-6 py-4">

                <Modal show={isModalOpen} onClose={closeModal} maxWidth="2xl">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-black uppercase tracking-tight">
                                {editingUserId ? 'Edit Akun' : 'Buat Akun Baru'}
                            </h3>
                            <button onClick={closeModal} className="text-neutral-500 hover:text-neutral-700">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                className="text-sm"
                                placeholder="Nama"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                disabled={form.data.role === 'atlet'}
                            />
                            <Input className="text-sm" placeholder="Email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} />
                            <Input className="text-sm" placeholder="No. WhatsApp (opsional)" value={form.data.phone_number} onChange={(e) => form.setData('phone_number', e.target.value)} />

                            <div className="col-span-full space-y-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Foto Profil (Max 5MB)</label>
                                <FileInput
                                    accept=".jpg,.jpeg,.png,.webp"
                                    onChange={(file) => form.setData('profile_photo', file)}
                                    error={form.errors.profile_photo}
                                />
                            </div>

                            <DbSelect
                                inputId="super-admin-user-role"
                                options={[
                                    { value: 'super_admin', label: 'Super Admin' },
                                    { value: 'landing_admin', label: 'Landing Admin' },
                                    { value: 'dojo_admin', label: 'Admin Dojo' },
                                    { value: 'head_coach', label: 'Head Coach' },
                                    { value: 'sensei', label: 'Sensei' },
                                    { value: 'assistant', label: 'Asisten Pelatih' },
                                    { value: 'atlet', label: 'Atlet' },
                                    { value: 'parent', label: 'Orang Tua' },
                                ]}
                                value={form.data.role}
                                onChange={(value) => form.setData('role', value)}
                                placeholder="Pilih Role"
                            />

                            <DbSelect
                                inputId="super-admin-user-dojo"
                                options={[
                                    { value: '', label: 'Tanpa Dojo' },
                                    ...dojos.map((dojo) => ({ value: String(dojo.id), label: dojo.name })),
                                ]}
                                value={form.data.dojo_id}
                                onChange={(next) => form.setData('dojo_id', next)}
                                placeholder="Pilih Dojo"
                                isDisabled={form.data.role === 'atlet' || form.data.role === 'parent'}
                            />

                            <DbSelect
                                inputId="super-admin-user-athlete"
                                options={[
                                    { value: '', label: 'Pilih Atlet (khusus atlet & orang tua)' },
                                    ...athletes.map((athlete) => ({ value: String(athlete.id), label: `${athlete.full_name} (${athlete.athlete_code})` })),
                                ]}
                                value={form.data.athlete_id}
                                onChange={(athleteId) => {
                                    form.setData('athlete_id', athleteId);
                                    if (form.data.role === 'atlet' || form.data.role === 'parent') {
                                        const selectedAthlete = athletes.find((athlete) => String(athlete.id) === String(athleteId));
                                        if (selectedAthlete) {
                                            if (form.data.role === 'atlet') {
                                                form.setData('name', selectedAthlete.full_name);
                                            }
                                            form.setData('dojo_id', selectedAthlete.dojo_id || '');
                                        }
                                    }
                                }}
                                placeholder="Pilih Atlet"
                                isDisabled={form.data.role !== 'atlet' && form.data.role !== 'parent'}
                            />
                        </div>

                        <div className="mt-6 pt-4 border-t border-neutral-100 space-y-4">
                            {!editingUserId ? (
                                <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-2.5 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                                    Password default: <span className="font-mono font-bold">athlix2026</span> — user wajib ganti saat login pertama.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Keamanan</label>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="text-xs font-bold text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 gap-2 h-9"
                                            onClick={handleResetPassword}
                                        >
                                            Reset Password ke Default
                                        </Button>
                                        <p className="text-[10px] text-neutral-400 italic leading-tight">
                                            Password akan direset menjadi "athlix2026" dan user wajib menggantinya saat login.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={closeModal}>Batal</Button>
                                <Button onClick={submit}>{editingUserId ? 'Simpan Perubahan' : 'Buat Akun'}</Button>
                            </div>
                        </div>
                    </div>
                </Modal>

                <Card>
                    <CardHeader className="pb-3 px-6 pt-4 border-b border-neutral-100 dark:border-neutral-800">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <CardTitle className="text-base font-black uppercase tracking-widest text-neutral-700 dark:text-neutral-300">
                                Daftar Akun Pengguna
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <Input
                                    className="text-xs h-9 w-full md:w-64"
                                    placeholder="Cari nama atau email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                <Button
                                    onClick={() => openModal()}
                                    className="flex items-center gap-2 bg-athlix-red hover:bg-red-700 text-white shadow-lg shadow-red-900/20 rounded-xl px-4 py-2 font-bold text-xs uppercase tracking-wider transition-all duration-200 shrink-0 h-9"
                                >
                                    <Plus size={14} /> Tambah Akun
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-4">
                        {filteredUsers.map((user) => (
                            <div key={user.id} className="p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="min-w-0 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-neutral-100 overflow-hidden flex items-center justify-center text-xs font-black">
                                        {user.profile_photo_path ? (
                                            <img src={resolveMediaUrl(user.profile_photo_path)} alt={user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            user.name?.charAt(0)
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                    <p className="font-semibold truncate">{user.name}</p>
                                    <p className="text-sm text-neutral-500 break-all">{user.email}</p>
                                    <p className="text-xs text-neutral-500">{user.phone_number || '-'} | Role: {ROLE_LABELS[user.role] || user.role} {user.athlete ? `| Atlet: ${user.athlete.full_name}` : ''}</p>
                                    {user.must_change_password && (
                                        <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 mt-1">
                                            Belum Ganti Password
                                        </span>
                                    )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <button
                                        className="text-blue-600 text-sm font-bold"
                                        onClick={() => openModal(user)}
                                    >Edit</button>
                                    <button className="text-red-500 text-sm font-bold" onClick={() => {
                                        if(confirm('Yakin ingin menghapus akun ini?')) {
                                            router.delete(route('super-admin.users.destroy', user.id));
                                        }
                                    }}>Hapus</button>
                                </div>
                            </div>
                        ))}
                        {filteredUsers.length === 0 && (
                            <div className="py-12 text-center text-sm text-neutral-400 italic">
                                Akun tidak ditemukan.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
