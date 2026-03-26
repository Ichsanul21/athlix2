import PwaLayout from '@/Layouts/PwaLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { useMemo, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';

const statusLabel = {
    present: 'Hadir',
    sick: 'Sakit',
    excused: 'Izin',
    unknown: 'Belum Absen',
};

function conditionTone(score) {
    if (score >= 85) return 'bg-green-100 text-green-700';
    if (score >= 70) return 'bg-blue-100 text-blue-700';
    if (score >= 55) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
}

export default function Athletes({ auth, dojo, athletes = [] }) {
    const [search, setSearch] = useState('');

    const filteredAthletes = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) {
            return athletes;
        }

        return athletes.filter((athlete) => {
            const name = String(athlete.full_name || '').toLowerCase();
            const code = String(athlete.athlete_code || '').toLowerCase();
            return name.includes(keyword) || code.includes(keyword);
        });
    }, [athletes, search]);

    return (
        <PwaLayout user={auth?.user} header="Atlet Sensei">
            <Head title="Atlet Sensei PWA" />

            <div className="space-y-5 pb-24">
                <section className="space-y-1">
                    <p className="text-xs uppercase tracking-widest text-neutral-500 font-black">Dojo</p>
                    <h2 className="text-xl font-black tracking-tight">{dojo?.name || '-'}</h2>
                    <p className="text-sm text-neutral-500">{athletes.length} atlet terdaftar</p>
                </section>

                <section className="rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 flex items-center gap-2">
                    <Search size={16} className="text-neutral-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="w-full border-0 p-0 text-sm focus:ring-0"
                        placeholder="Cari nama / kode atlet"
                    />
                </section>

                <section className="space-y-3">
                    {filteredAthletes.length > 0 ? (
                        filteredAthletes.map((athlete) => (
                            <Card key={athlete.id} className="border-neutral-200">
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="font-black truncate">{athlete.full_name}</p>
                                            <p className="text-xs text-neutral-500">{athlete.athlete_code} | Sabuk {athlete.belt}</p>
                                        </div>
                                        <span className="inline-flex rounded-lg bg-neutral-100 px-2 py-1 text-[11px] font-black uppercase">
                                            {statusLabel[athlete.today_status] || athlete.today_status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="rounded-xl border border-neutral-200 p-2.5">
                                            <p className="text-[11px] uppercase tracking-widest text-neutral-500 font-black">Kondisi</p>
                                            <p className={`mt-1 inline-flex rounded-lg px-2 py-1 text-xs font-black ${conditionTone(athlete.condition_percentage)}`}>
                                                {athlete.condition_percentage}%
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-neutral-200 p-2.5">
                                            <p className="text-[11px] uppercase tracking-widest text-neutral-500 font-black">Status Kemampuan</p>
                                            <p className="mt-1 text-xs font-bold">{athlete.ability_status}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-neutral-500">
                                        <span>Attendance: {athlete.attendance_rate}%</span>
                                        <span>IN {athlete.today_check_in_at || '-'} | OUT {athlete.today_check_out_at || '-'}</span>
                                    </div>

                                    <Link
                                        href={route('athletes.show', athlete.id)}
                                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-athlix-red px-3 py-2 text-xs font-black text-athlix-red"
                                    >
                                        Detail Atlet
                                        <ArrowRight size={14} />
                                    </Link>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card className="border-neutral-200">
                            <CardContent className="p-4 text-sm text-neutral-500">Data atlet tidak ditemukan.</CardContent>
                        </Card>
                    )}
                </section>
            </div>
        </PwaLayout>
    );
}

