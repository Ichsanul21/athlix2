import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Loader2, Mail, Send } from 'lucide-react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Forgot Password" />

            <div className="space-y-6">
                <div className="text-center space-y-1">
                    <h2 className="text-xl font-black uppercase tracking-tighter text-neutral-900 ">Lupa Password</h2>
                    <p className="text-sm text-neutral-500 max-w-xs mx-auto">Masukkan email Anda dan kami akan mengirimkan link reset password.</p>
                </div>

                {status && (
                    <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-sm font-medium text-green-600  border border-green-200/50 dark:border-green-800/30 animate-fade-in">
                        {status}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-5">
                    <div className="relative">
                        <Mail size={16} className="absolute left-3 top-3 text-neutral-400" />
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="block w-full pl-10 h-11 rounded-xl border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:border-athlix-red focus:ring-athlix-red/30"
                            isFocused={true}
                            onChange={(e) => setData('email', e.target.value)}
                        />
                        <InputError message={errors.email} className="mt-2" />
                    </div>

                    <Button className="w-full h-12 text-sm font-bold uppercase tracking-widest gap-2" disabled={processing}>
                        {processing ? (
                            <><Loader2 size={16} className="animate-spin" /> Mengirim...</>
                        ) : (
                            <><Send size={16} /> Kirim Link Reset</>
                        )}
                    </Button>
                </form>
            </div>
        </GuestLayout>
    );
}
