import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Loader2, Mail, Lock, User, UserPlus } from 'lucide-react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <div className="space-y-6">
                <div className="text-center space-y-1">
                    <h2 className="text-xl font-black uppercase tracking-tighter text-neutral-900 dark:text-white">Buat Akun</h2>
                    <p className="text-sm text-neutral-500">Daftarkan akun baru untuk memulai</p>
                </div>

                <form onSubmit={submit} className="space-y-5">
                    <div className="space-y-1.5">
                        <InputLabel htmlFor="name" value="Nama Lengkap" className="text-xs font-bold uppercase tracking-widest text-neutral-500" />
                        <div className="relative">
                            <User size={16} className="absolute left-3 top-3 text-neutral-400" />
                            <TextInput id="name" name="name" value={data.name} className="mt-0 block w-full pl-10 h-11 rounded-xl border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:border-athlix-red focus:ring-athlix-red/30" autoComplete="name" isFocused={true} onChange={(e) => setData('name', e.target.value)} required />
                        </div>
                        <InputError message={errors.name} className="mt-1" />
                    </div>

                    <div className="space-y-1.5">
                        <InputLabel htmlFor="email" value="Email" className="text-xs font-bold uppercase tracking-widest text-neutral-500" />
                        <div className="relative">
                            <Mail size={16} className="absolute left-3 top-3 text-neutral-400" />
                            <TextInput id="email" type="email" name="email" value={data.email} className="mt-0 block w-full pl-10 h-11 rounded-xl border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:border-athlix-red focus:ring-athlix-red/30" autoComplete="username" onChange={(e) => setData('email', e.target.value)} required />
                        </div>
                        <InputError message={errors.email} className="mt-1" />
                    </div>

                    <div className="space-y-1.5">
                        <InputLabel htmlFor="password" value="Password" className="text-xs font-bold uppercase tracking-widest text-neutral-500" />
                        <div className="relative">
                            <Lock size={16} className="absolute left-3 top-3 text-neutral-400" />
                            <TextInput id="password" type="password" name="password" value={data.password} className="mt-0 block w-full pl-10 h-11 rounded-xl border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:border-athlix-red focus:ring-athlix-red/30" autoComplete="new-password" onChange={(e) => setData('password', e.target.value)} required />
                        </div>
                        <InputError message={errors.password} className="mt-1" />
                    </div>

                    <div className="space-y-1.5">
                        <InputLabel htmlFor="password_confirmation" value="Konfirmasi Password" className="text-xs font-bold uppercase tracking-widest text-neutral-500" />
                        <div className="relative">
                            <Lock size={16} className="absolute left-3 top-3 text-neutral-400" />
                            <TextInput id="password_confirmation" type="password" name="password_confirmation" value={data.password_confirmation} className="mt-0 block w-full pl-10 h-11 rounded-xl border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:border-athlix-red focus:ring-athlix-red/30" autoComplete="new-password" onChange={(e) => setData('password_confirmation', e.target.value)} required />
                        </div>
                        <InputError message={errors.password_confirmation} className="mt-1" />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <Link href={route('login')} className="text-xs font-medium text-athlix-red hover:text-athlix-red/80 transition-colors">
                            Sudah punya akun?
                        </Link>
                    </div>

                    <Button className="w-full h-12 text-sm font-bold uppercase tracking-widest gap-2" disabled={processing}>
                        {processing ? (
                            <><Loader2 size={16} className="animate-spin" /> Memproses...</>
                        ) : (
                            <><UserPlus size={16} /> Daftar</>
                        )}
                    </Button>
                </form>
            </div>
        </GuestLayout>
    );
}
