import PwaLayout from '@/Layouts/PwaLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { ArrowLeft, Award, Calendar, CheckCircle2, Star } from 'lucide-react';

export default function GradingHistory({ auth, athlete }) {
    return (
        <PwaLayout user={auth.user} header="Riwayat Ujian">
            <Head title="Grading History" />
            
            <div className="space-y-6">
                <div className="flex items-center gap-4 py-2">
                    <Link href={route('profile.pwa')} className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                        <ArrowLeft size={20} />
                    </Link>
                    <h2 className="text-xl font-black uppercase tracking-tighter">Perjalanan Sabuk</h2>
                </div>

                <div className="relative space-y-4 before:absolute before:left-8 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200 dark:before:bg-neutral-800 pl-4">
                    {athlete.exams && athlete.exams.length > 0 ? (
                        athlete.exams.map((exam, i) => (
                            <div key={i} className="relative pl-12">
                                <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-athlix-red text-white flex items-center justify-center border-4 border-white dark:border-athlix-black z-10 shadow-lg">
                                    <Award size={14} />
                                </div>
                                <Card className="border-none bg-white dark:bg-neutral-900 shadow-sm">
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-black uppercase tracking-tight text-athlix-red">{exam.belt?.name}</h4>
                                                <p className="text-[10px] font-bold text-neutral-400">{exam.exam_date}</p>
                                            </div>
                                            <div className="bg-green-100 dark:bg-green-900/30 text-green-600 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">
                                                LULUS
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] uppercase text-neutral-500 font-bold">Asal</span>
                                                <span className="font-bold">{exam.from_belt?.name || '-'}</span>
                                            </div>
                                            <div className="w-px h-6 bg-neutral-100 dark:bg-neutral-800"></div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] uppercase text-neutral-500 font-bold">Status</span>
                                                <span className="text-neutral-600 dark:text-neutral-400 italic">{exam.status === 'passed' ? 'Lulus' : 'Gagal'}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 opacity-50">
                            <Star size={40} className="mx-auto mb-2 text-neutral-300" />
                            <p className="text-sm font-bold">Belum ada riwayat ujian.</p>
                        </div>
                    )}
                </div>
            </div>
        </PwaLayout>
    );
}
