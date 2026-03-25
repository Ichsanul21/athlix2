import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { useState } from 'react';

export default function Users({ auth, users = [], dojos = [], athletes = [], flash }) {
    const [editingUserId, setEditingUserId] = useState(null);
    const form = useForm({
        name: '',
        email: '',
        phone_number: '',
        password: '',
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
                },
            });
            return;
        }

        form.post(route('super-admin.users.store'), {
            forceFormData: true,
            onSuccess: () => {
                form.reset('name', 'email', 'phone_number', 'password', 'role', 'dojo_id', 'athlete_id', 'profile_photo');
                form.setData('role', 'sensei');
            },
        });
    };

    return (
        <AdminLayout user={auth?.user} header={<h2 className="text-xl font-bold tracking-tight uppercase">Master Akun</h2>}>
            <Head title="Master Akun" />
            <div className="space-y-6 py-4">
                {flash?.success && <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">{flash.success}</div>}
                {flash?.error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{flash.error}</div>}

                <Card>
                    <CardHeader><CardTitle>{editingUserId ? 'Edit Akun' : 'Buat Akun'}</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        <Input
                            className="text-sm"
                            placeholder="Nama"
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                            disabled={form.data.role === 'murid'}
                        />
                        <Input className="text-sm" placeholder="Email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} />
                        <Input className="text-sm" placeholder="No. WhatsApp" value={form.data.phone_number} onChange={(e) => form.setData('phone_number', e.target.value)} />
                        <Input className="text-sm" type="password" placeholder={editingUserId ? 'Password baru (opsional)' : 'Password'} value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} />
                        <input type="file" accept=".jpg,.jpeg,.png,.webp" className="border rounded-lg px-3 py-2 text-sm" onChange={(e) => form.setData('profile_photo', e.target.files?.[0] ?? null)} />

                        <select className="border rounded-lg px-3 py-2 text-sm" value={form.data.role} onChange={(e) => form.setData('role', e.target.value)}>
                            <option value="super_admin">Super Admin</option>
                            <option value="landing_admin">Landing Admin</option>
                            <option value="sensei">Sensei</option>
                            <option value="murid">Murid (Atlet)</option>
                        </select>

                        <select className="border rounded-lg px-3 py-2 text-sm" value={form.data.dojo_id} onChange={(e) => form.setData('dojo_id', e.target.value)} disabled={form.data.role === 'murid'}>
                            <option value="">Tanpa Dojo</option>
                            {dojos.map((dojo) => <option key={dojo.id} value={dojo.id}>{dojo.name}</option>)}
                        </select>

                        <select
                            className="border rounded-lg px-3 py-2 text-sm"
                            value={form.data.athlete_id}
                            onChange={(e) => {
                                const athleteId = e.target.value;
                                form.setData('athlete_id', athleteId);
                                if (form.data.role === 'murid') {
                                    const selectedAthlete = athletes.find((athlete) => String(athlete.id) === String(athleteId));
                                    if (selectedAthlete) {
                                        form.setData('name', selectedAthlete.full_name);
                                        form.setData('dojo_id', selectedAthlete.dojo_id || '');
                                        if (selectedAthlete.phone_number) {
                                            form.setData('phone_number', selectedAthlete.phone_number);
                                        }
                                    }
                                }
                            }}
                            disabled={form.data.role !== 'murid'}
                        >
                            <option value="">Pilih Atlet (khusus murid)</option>
                            {athletes.map((athlete) => (
                                <option key={athlete.id} value={athlete.id}>
                                    {athlete.full_name} ({athlete.athlete_code})
                                </option>
                            ))}
                        </select>

                        <div className="md:col-span-2 xl:col-span-3 flex flex-wrap gap-2">
                            <Button onClick={submit}>{editingUserId ? 'Simpan Perubahan' : 'Simpan Akun'}</Button>
                            {editingUserId && (
                                <Button type="button" variant="outline" onClick={() => {
                                    setEditingUserId(null);
                                    form.reset('name', 'email', 'phone_number', 'password', 'role', 'dojo_id', 'athlete_id', 'profile_photo');
                                    form.setData('role', 'sensei');
                                }}>
                                    Batal
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Daftar Akun</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {users.map((user) => (
                            <div key={user.id} className="p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="min-w-0 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-neutral-100 overflow-hidden flex items-center justify-center text-xs font-black">
                                        {user.profile_photo_path ? (
                                            <img src={`/storage/${user.profile_photo_path}`} alt={user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            user.name?.charAt(0)
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                    <p className="font-semibold truncate">{user.name}</p>
                                    <p className="text-sm text-neutral-500 break-all">{user.email}</p>
                                    <p className="text-xs text-neutral-500">{user.phone_number || '-'} | Role: {user.role} {user.athlete ? `| Atlet: ${user.athlete.full_name}` : ''}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <button
                                        className="text-blue-600 text-sm"
                                        onClick={() => {
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
                                        }}
                                    >Edit</button>
                                    <button className="text-red-500 text-sm" onClick={() => router.delete(route('super-admin.users.destroy', user.id))}>Hapus</button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
