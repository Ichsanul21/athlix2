import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Loader2, Lock, ShieldCheck } from 'lucide-react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Confirm Password" />

            <div className="space-y-6">
                <div className="text-center space-y-1">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-athlix-red/10 flex items-center justify-center text-athlix-red mb-4">
                        <ShieldCheck size={28} />
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-tighter text-neutral-900 dark:text-white">Konfirmasi Password</h2>
                    <p className="text-sm text-neutral-500 max-w-xs mx-auto">Area ini aman. Silakan konfirmasi password Anda sebelum melanjutkan.</p>
                </div>

                <form onSubmit={submit} className="space-y-5">
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
                                isFocused={true}
                                onChange={(e) => setData('password', e.target.value)}
                            />
                        </div>
                        <InputError message={errors.password} className="mt-1" />
                    </div>

                    <Button className="w-full h-12 text-sm font-bold uppercase tracking-widest gap-2" disabled={processing}>
                        {processing ? (
                            <><Loader2 size={16} className="animate-spin" /> Memproses...</>
                        ) : (
                            'Konfirmasi'
                        )}
                    </Button>
                </form>
            </div>
        </GuestLayout>
    );
}
