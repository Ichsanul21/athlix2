import PwaLayout from '@/Layouts/PwaLayout';
import { Head } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { Clock3, User, CalendarDays } from 'lucide-react';
import { Skeleton } from '@/Components/ui/skeleton';
import { useEffect, useMemo, useState } from 'react';

const typeColors = {
    fisik: 'bg-orange-500',
    kumite: 'bg-athlix-red',
    kata: 'bg-blue-500',
    teknik: 'bg-emerald-600',
};

export default function Index({ auth, todaySessions, allAgenda = [] }) {
    const isLoading = todaySessions === undefined && allAgenda === undefined;

    const dayChips = useMemo(() => {
        const grouped = new Map();
        (allAgenda || []).forEach((agenda) => {
            if (!grouped.has(agenda.date)) {
                grouped.set(agenda.date, {
                    date: agenda.date,
                    dateLabel: agenda.date_label,
                });
            }
        });

        return Array.from(grouped.values());
    }, [allAgenda]);

    const [selectedDay, setSelectedDay] = useState(dayChips?.[0]?.date || null);

    useEffect(() => {
        if (!selectedDay && dayChips.length > 0) {
            setSelectedDay(dayChips[0].date);
        }
    }, [selectedDay, dayChips]);

    const selectedTimeline = useMemo(() => {
        if (!selectedDay) return [];
        return (allAgenda || []).filter((agenda) => agenda.date === selectedDay);
    }, [allAgenda, selectedDay]);

    if (isLoading) {
        return (
            <PwaLayout user={auth?.user} header="Jadwal">
                <Head title="Schedule" />
                <div className="space-y-6 pb-24">
                    <Skeleton className="h-4 w-24" />
                    {Array.from({ length: 3 }).map((_, idx) => (
                        <Skeleton key={idx} className="h-20" />
                    ))}
                </div>
            </PwaLayout>
        );
    }

    return (
        <PwaLayout user={auth?.user} header="Jadwal">
            <Head title="Schedule" />

            <div className="space-y-6 pb-24">
                <section className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500">Latihan Hari Ini</h3>
                    {(todaySessions || []).length > 0 ? (
                        <div className="space-y-2">
                            {todaySessions.map((session) => (
                                <Card key={session.id} className="border-neutral-200/80">
                                    <CardContent className="p-4 space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <h4 className="font-bold text-sm">{session.title}</h4>
                                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-black uppercase text-white ${typeColors[session.type] || 'bg-blue-500'}`}>
                                                {session.type}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-3 text-xs text-neutral-500">
                                            <span className="inline-flex items-center gap-1"><Clock3 size={12} />{session.time}</span>
                                            <span className="inline-flex items-center gap-1"><User size={12} />{session.coach}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="border-neutral-200/80">
                            <CardContent className="p-4 text-sm text-neutral-500">Tidak ada jadwal latihan hari ini.</CardContent>
                        </Card>
                    )}
                </section>

                <section className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500">Timeline Jadwal</h3>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {dayChips.map((chip) => (
                            <button
                                key={chip.date}
                                type="button"
                                onClick={() => setSelectedDay(chip.date)}
                                className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-bold ${selectedDay === chip.date ? 'border-athlix-red bg-athlix-red text-white' : 'border-neutral-200 bg-white text-neutral-600'}`}
                            >
                                {chip.dateLabel}
                            </button>
                        ))}
                    </div>

                    {selectedTimeline.length > 0 ? (
                        <div className="space-y-3">
                            {selectedTimeline.map((agenda, index) => (
                                <div key={`${agenda.id}-${index}`} className="relative pl-6">
                                    <div className="absolute left-2 top-0 bottom-0 w-px bg-neutral-200" />
                                    <div className="absolute left-[5px] top-6 w-2.5 h-2.5 rounded-full bg-athlix-red" />
                                    <Card className="border-neutral-200/80">
                                        <CardContent className="p-4 space-y-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <h4 className="text-sm font-bold">{agenda.title}</h4>
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase text-white ${typeColors[agenda.type] || 'bg-blue-500'}`}>
                                                    {agenda.type}
                                                </span>
                                            </div>
                                            <p className="text-xs text-neutral-500 inline-flex items-center gap-1"><CalendarDays size={12} />{agenda.date_label}</p>
                                            <p className="text-xs text-neutral-500 inline-flex items-center gap-1"><Clock3 size={12} />{agenda.time}</p>
                                            <p className="text-xs text-neutral-500 inline-flex items-center gap-1"><User size={12} />{agenda.coach || '-'}</p>

                                            {(agenda.agenda_items || []).length > 0 && (
                                                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-2 space-y-1">
                                                    {(agenda.agenda_items || []).map((item, itemIdx) => (
                                                        <p key={`${agenda.id}-item-${itemIdx}`} className="text-[11px] text-neutral-600">
                                                            {(item.start_time || '--:--')} - {(item.end_time || '--:--')} | {item.title}
                                                        </p>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <Card className="border-neutral-200/80">
                            <CardContent className="p-4 text-sm text-neutral-500">Belum ada agenda pada hari ini.</CardContent>
                        </Card>
                    )}
                </section>
            </div>
        </PwaLayout>
    );
}
