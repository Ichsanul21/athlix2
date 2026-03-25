import PwaLayout from '@/Layouts/PwaLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { ArrowLeft, Trophy, Star, FileText } from 'lucide-react';
import { Skeleton } from '@/Components/ui/skeleton';

export default function AchievementHistory({ auth, athlete }) {
    if (!athlete) {
        return (
            <PwaLayout user={auth?.user} header="Riwayat Prestasi">
                <Head title="Riwayat Prestasi" />
                <div className="space-y-6">
                    <Skeleton className="h-6 w-44" />
                    <Skeleton className="h-72 w-full" />
                </div>
            </PwaLayout>
        );
    }

    const achievements = athlete.achievements || [];

    return (
        <PwaLayout user={auth?.user} header="Riwayat Prestasi">
            <Head title="Riwayat Prestasi" />

            <div className="space-y-6">
                <div className="flex items-center gap-4 py-2">
                    <Link href={route('profile.pwa')} className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 ">
                        <ArrowLeft size={20} />
                    </Link>
                    <h2 className="text-xl font-black uppercase tracking-tighter">Pencapaian Pertandingan</h2>
                </div>

                <div className="space-y-3">
                    {achievements.length > 0 ? (
                        achievements.map((achievement, i) => (
                            <Card key={achievement.id || i} className="border-none bg-white dark:bg-neutral-900 shadow-sm">
                                <CardContent className="p-4 space-y-2">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-black text-athlix-red uppercase tracking-tight">{achievement.competition_name}</p>
                                            <p className="text-xs text-neutral-500">{achievement.competition_date} | {achievement.competition_level}</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-athlix-red/10 text-athlix-red flex items-center justify-center">
                                            <Trophy size={14} />
                                        </div>
                                    </div>
                                    <p className="text-xs text-neutral-600 ">Jenis: {achievement.competition_type}</p>
                                    <p className="text-xs text-neutral-600 ">Kategori: {achievement.category || '-'}</p>
                                    <p className="text-xs text-neutral-600 ">Hasil: {achievement.result_title || '-'}</p>
                                    <p className="text-xs text-neutral-500">Lokasi: {achievement.location || '-'} | Penyelenggara: {achievement.organizer || '-'}</p>
                                    {(achievement.certificate_url || achievement.certificate_path) && (
                                        <a
                                            href={achievement.certificate_url || `/storage/${achievement.certificate_path}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-xs font-bold text-athlix-red"
                                        >
                                            <FileText size={12} /> Lihat Sertifikat
                                        </a>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-10 opacity-60">
                            <Star size={40} className="mx-auto mb-2 text-neutral-300" />
                            <p className="text-sm font-bold">Belum ada riwayat prestasi.</p>
                        </div>
                    )}
                </div>
            </div>
        </PwaLayout>
    );
}

