import PwaLayout from '@/Layouts/PwaLayout';
import { Head } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { Clock3, User, CalendarDays, X } from 'lucide-react';
import { Skeleton } from '@/Components/ui/skeleton';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

const typeColors = {
    fisik: 'bg-orange-500',
    'teknik umum': 'bg-emerald-600',
    'teknik khusus': 'bg-blue-500',
    libur: 'bg-neutral-400',
};

export default function Index({ auth, todaySessions, allAgenda = [] }) {
    const isLoading = todaySessions === undefined && allAgenda === undefined;
    const [detailModal, setDetailModal] = useState(null);

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
                                <Card
                                    key={session.id}
                                    className={`border-neutral-200/80 transition-colors cursor-pointer ${session.type === 'libur' ? 'opacity-60 bg-neutral-50/50 dark:bg-neutral-900/20' : 'hover:border-athlix-red/30 active:scale-[0.98]'}`}
                                    onClick={() => setDetailModal(session)}
                                >
                                    <CardContent className="p-4 space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <h4 className={`font-bold text-sm ${session.type === 'libur' ? 'text-neutral-500 italic' : ''}`}>{session.title}</h4>
                                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-black uppercase text-white ${typeColors[session.type] || 'bg-blue-500'}`}>
                                                {session.type}
                                            </span>
                                        </div>
                                        {session.type !== 'libur' ? (
                                            <div className="flex flex-wrap gap-3 text-xs text-neutral-500">
                                                <span className="inline-flex items-center gap-1"><Clock3 size={12} />{session.time}</span>
                                                <span className="inline-flex items-center gap-1"><User size={12} />{session.coach}</span>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-neutral-400">Tidak ada jadwal terstruktur. Gunakan waktu ini untuk pemulihan atau latihan mandiri.</p>
                                        )}
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
                                className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${selectedDay === chip.date ? 'border-athlix-red bg-athlix-red text-white' : 'border-neutral-200 bg-white text-neutral-600'}`}
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
                                    <div className={`absolute left-[5px] top-6 w-2.5 h-2.5 rounded-full transition-colors ${agenda.type === 'libur' ? 'bg-neutral-400' : 'bg-athlix-red'}`} />
                                    <Card
                                        className={`border-neutral-200/80 transition-colors cursor-pointer ${agenda.type === 'libur' ? 'opacity-60 bg-neutral-50/50 dark:bg-neutral-900/20' : 'hover:border-athlix-red/30 active:scale-[0.98]'}`}
                                        onClick={() => setDetailModal(agenda)}
                                    >
                                        <CardContent className="p-4 space-y-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <h4 className={`text-sm font-bold ${agenda.type === 'libur' ? 'text-neutral-500 italic' : ''}`}>{agenda.title}</h4>
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase text-white ${typeColors[agenda.type] || 'bg-blue-500'}`}>
                                                    {agenda.type}
                                                </span>
                                            </div>
                                            <p className="text-xs text-neutral-500 inline-flex items-center gap-1"><CalendarDays size={12} />{agenda.date_label}</p>

                                            {agenda.type !== 'libur' ? (
                                                <>
                                                    <p className="text-xs text-neutral-500 inline-flex items-center gap-1"><Clock3 size={12} />{agenda.time}</p>
                                                    <p className="text-xs text-neutral-500 inline-flex items-center gap-1"><User size={12} />{agenda.coach || '-'}</p>
                                                </>
                                            ) : (
                                                <p className="text-xs text-neutral-400 mt-1">Tidak ada jadwal terstruktur. Gunakan waktu ini untuk pemulihan atau latihan mandiri.</p>
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

            {/* Modal Detail Agenda */}
            {detailModal && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setDetailModal(null)}
                    />
                    <div className="relative w-full max-w-sm bg-white dark:bg-neutral-950 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
                        <div className="p-5 space-y-4 overflow-y-auto flex-1">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-black uppercase text-white mb-2 ${typeColors[detailModal.type] || 'bg-blue-500'}`}>
                                        {detailModal.type}
                                    </span>
                                    <h3 className={`text-lg font-black leading-tight ${detailModal.type === 'libur' ? 'text-neutral-500 italic' : ''}`}>
                                        {detailModal.title}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setDetailModal(null)}
                                    className="shrink-0 p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 p-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Hari / Tanggal</p>
                                    <p className="text-sm font-bold">{detailModal.date_label || detailModal.day || '-'}</p>
                                </div>
                                <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 p-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Waktu</p>
                                    <p className="text-sm font-bold font-mono text-athlix-red">{detailModal.time || '-'}</p>
                                </div>
                                <div className="col-span-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 p-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Pelatih</p>
                                    <p className="text-sm font-bold">{detailModal.coach || '-'}</p>
                                </div>
                            </div>

                            {detailModal.type === 'libur' ? (
                                <p className="text-xs text-neutral-400 italic">Tidak ada jadwal terstruktur. Gunakan waktu ini untuk pemulihan atau latihan mandiri.</p>
                            ) : (
                                (detailModal.agenda_items || []).length > 0 ? (
                                    <div className="space-y-2">
                                        <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Detail Agenda</p>
                                        <div className="space-y-1.5">
                                            {detailModal.agenda_items.map((item, idx) => (
                                                <div key={idx} className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3 bg-neutral-50/70 dark:bg-neutral-900/40">
                                                    <p className="text-xs font-mono font-bold text-athlix-red">{item.start_time || '--:--'} - {item.end_time || '--:--'}</p>
                                                    <p className="text-sm font-semibold mt-0.5">{item.title}</p>
                                                    {item.description && <p className="text-xs text-neutral-500 mt-1">{item.description}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-neutral-400 italic">Belum ada detail agenda untuk sesi ini.</p>
                                )
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </PwaLayout>
    );
}
