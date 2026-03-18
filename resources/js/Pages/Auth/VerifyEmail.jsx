import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Loader2, Mail, LogOut } from 'lucide-react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Email Verification" />

            <div className="space-y-6">
                <div className="text-center space-y-1">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-athlix-red/10 flex items-center justify-center text-athlix-red mb-4 animate-float">
                        <Mail size={28} />
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-tighter text-neutral-900 dark:text-white">Verifikasi Email</h2>
                    <p className="text-sm text-neutral-500 max-w-xs mx-auto">Klik link verifikasi yang kami kirimkan ke email Anda. Jika belum menerima, klik tombol di bawah.</p>
                </div>

                {status === 'verification-link-sent' && (
                    <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-sm font-medium text-green-600 dark:text-green-400 border border-green-200/50 dark:border-green-800/30 animate-fade-in">
                        Link verifikasi baru telah dikirim ke email Anda.
                    </div>
                )}

                <form onSubmit={submit}>
                    <div className="flex flex-col gap-3">
                        <Button className="w-full h-12 text-sm font-bold uppercase tracking-widest gap-2" disabled={processing}>
                            {processing ? (
                                <><Loader2 size={16} className="animate-spin" /> Mengirim...</>
                            ) : (
                                'Kirim Ulang Email Verifikasi'
                            )}
                        </Button>

                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="w-full flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-bold uppercase tracking-widest text-neutral-500 hover:text-athlix-red hover:bg-athlix-red/5 transition-all duration-300"
                        >
                            <LogOut size={14} />
                            Keluar
                        </Link>
                    </div>
                </form>
            </div>
        </GuestLayout>
    );
}
