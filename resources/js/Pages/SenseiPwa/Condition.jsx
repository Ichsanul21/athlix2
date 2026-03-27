import PwaLayout from '@/Layouts/PwaLayout';
import { Head } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { Activity } from 'lucide-react';

function toneClass(value) {
    if (value >= 85) return 'bg-green-100 text-green-700';
    if (value >= 70) return 'bg-blue-100 text-blue-700';
    if (value >= 55) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
}

export default function Condition({ auth, dojo, athletes = [] }) {
    return (
        <PwaLayout user={auth?.user} header="Kondisi Fisik">
            <Head title="Kondisi Fisik Sensei PWA" />

            <div className="space-y-5 pb-24">
                <section className="space-y-1">
                    <p className="text-xs uppercase tracking-widest text-neutral-500 font-black">Dojo</p>
                    <h2 className="text-xl font-black tracking-tight">{dojo?.name || '-'}</h2>
                    <p className="text-sm text-neutral-500">{athletes.length} atlet dipantau</p>
                </section>

                <Card className="border-neutral-200">
                    <CardContent className="p-4 space-y-2">
                        <div className="flex items-center gap-2">
                            <Activity size={16} className="text-athlix-red" />
                            <p className="text-xs uppercase tracking-widest text-neutral-500 font-black">Status Kondisi Atlet</p>
                        </div>
                        <p className="text-xs text-neutral-500">Sumber data dari rapor atlet terbaru.</p>
                    </CardContent>
                </Card>

                <section className="space-y-3">
                    {athletes.length > 0 ? (
                        athletes.map((athlete) => (
                            <Card key={athlete.id} className="border-neutral-200">
                                <CardContent className="p-4 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="font-black truncate">{athlete.full_name}</p>
                                            <p className="text-xs text-neutral-500">{athlete.athlete_code}</p>
                                        </div>
                                        <span className={`rounded-lg px-2 py-1 text-xs font-black ${toneClass(athlete.condition_percentage)}`}>
                                            {athlete.condition_percentage}%
                                        </span>
                                    </div>
                                    <p className="text-xs text-neutral-500">Rata-rata kemampuan: {athlete.ability_average ?? '-'} | Rapor: {athlete.latest_report_date || '-'}</p>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card className="border-neutral-200">
                            <CardContent className="p-4 text-sm text-neutral-500">Belum ada data kondisi atlet.</CardContent>
                        </Card>
                    )}
                </section>
            </div>
        </PwaLayout>
    );
}

