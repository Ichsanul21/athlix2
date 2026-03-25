import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Loader2, Mail, Lock, LogIn } from 'lucide-react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            <div className="space-y-6">
                <div className="text-center space-y-1">
                    <h2 className="text-xl font-black uppercase tracking-tighter text-neutral-900 ">Masuk Akun</h2>
                    <p className="text-sm text-neutral-500">Masukkan kredensial untuk melanjutkan</p>
                </div>

                {status && (
                    <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-sm font-medium text-green-600  border border-green-200/50 dark:border-green-800/30 animate-fade-in">
                        {status}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-5">
                    <div className="space-y-1.5">
                        <InputLabel htmlFor="email" value="Email" className="text-xs font-bold uppercase tracking-widest text-neutral-500" />
                        <div className="relative">
                            <Mail size={16} className="absolute left-3 top-3 text-neutral-400" />
                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="mt-0 block w-full pl-10 h-11 rounded-xl border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:border-athlix-red focus:ring-athlix-red/30"
                                autoComplete="username"
                                isFocused={true}
                                onChange={(e) => setData('email', e.target.value)}
                            />
                        </div>
                        <InputError message={errors.email} className="mt-1" />
                    </div>

                    <div className="space-y-1.5">
                        <InputLabel htmlFor="password" value="Password" className="text-xs font-bold uppercase tracking-widest text-neutral-500" />
                        <div className="relative">
                            <Lock size={16} className="absolute left-3 top-3 text-neutral-400" />
                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="mt-0 block w-full pl-10 h-11 rounded-xl border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:border-athlix-red focus:ring-athlix-red/30"
                                autoComplete="current-password"
                                onChange={(e) => setData('password', e.target.value)}
                            />
                        </div>
                        <InputError message={errors.password} className="mt-1" />
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="flex items-center cursor-pointer group">
                            <input
                                type="checkbox"
                                name="remember"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                                className="rounded-md border-neutral-300 dark:border-neutral-600 text-athlix-red shadow-sm focus:ring-athlix-red/30 dark:bg-neutral-800 transition-colors"
                            />
                            <span className="ms-2 text-xs font-medium text-neutral-600  group-hover:text-neutral-900 dark:group-hover:text-neutral-200 transition-colors">
                                Ingat saya
                            </span>
                        </label>

                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-xs font-medium text-athlix-red hover:text-athlix-red/80 transition-colors"
                            >
                                Lupa kata sandi?
                            </Link>
                        )}
                    </div>

                    <Button className="w-full h-12 text-sm font-bold uppercase tracking-widest gap-2" disabled={processing}>
                        {processing ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Memproses...
                            </>
                        ) : (
                            <>
                                <LogIn size={16} />
                                Masuk
                            </>
                        )}
                    </Button>
                </form>
            </div>
        </GuestLayout>
    );
}
