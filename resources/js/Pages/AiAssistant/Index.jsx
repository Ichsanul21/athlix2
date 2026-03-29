import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { Sparkles, Clock3 } from 'lucide-react';

export default function Index({ auth }) {
    return (
        <AdminLayout
            user={auth?.user}
            header={
                <div className="flex items-center gap-2">
                    <Sparkles size={20} className="text-athlix-red" />
                    <h2 className="text-xl font-bold tracking-tight uppercase">Asisten Gemini AI</h2>
                </div>
            }
        >
            <Head title="Gemini AI" />

            <div className="py-6">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <Card className="border-neutral-200/80 dark:border-neutral-800">
                        <CardContent className="p-8 text-center space-y-4">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-athlix-red/10 text-athlix-red">
                                <Clock3 size={24} />
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tight">Coming Soon</h3>
                            <p className="text-sm text-neutral-600">
                                Modul AI Assistant sedang dipersiapkan ulang. Fitur akan diaktifkan kembali setelah tahap stabilisasi selesai.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}

