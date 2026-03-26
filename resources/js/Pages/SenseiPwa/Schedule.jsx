import PwaLayout from '@/Layouts/PwaLayout';
import { Head } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { useState } from 'react';
import { CalendarDays, ChevronDown, ChevronUp, Clock, UserRound } from 'lucide-react';

const typeColorClass = {
    fisik: 'bg-orange-100 text-orange-700',
    teknik: 'bg-blue-100 text-blue-700',
    kata: 'bg-purple-100 text-purple-700',
    kumite: 'bg-red-100 text-red-700',
};

export default function Schedule({ auth, dojo, todayPrograms = [], upcomingPrograms = [], allAgenda = [] }) {
    const [expandedId, setExpandedId] = useState(null);

    return (
        <PwaLayout user={auth?.user} header="Jadwal Sensei">
            <Head title="Jadwal Sensei PWA" />

            <div className="space-y-5 pb-24">
                <section className="space-y-1">
                    <p className="text-xs uppercase tracking-widest text-neutral-500 font-black">Dojo</p>
                    <h2 className="text-xl font-black tracking-tight">{dojo?.name || '-'}</h2>
                </section>

                <section className="space-y-3">
                    <p className="text-xs uppercase tracking-widest text-neutral-500 font-black">Latihan Hari Ini</p>
                    {todayPrograms.length > 0 ? (
                        todayPrograms.map((program) => (
                            <Card key={program.id} className="border-neutral-200">
                                <CardContent className="p-4 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-black">{program.title}</p>
                                            <p className="text-xs text-neutral-500">{program.day}</p>
                                        </div>
                                        <span className={`rounded-lg px-2 py-1 text-[11px] font-black uppercase ${typeColorClass[program.type] || 'bg-neutral-100 text-neutral-700'}`}>
                                            {program.type || 'umum'}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-600">
                                        <span className="inline-flex items-center gap-1"><Clock size={12} />{program.time}</span>
                                        <span className="inline-flex items-center gap-1"><UserRound size={12} />{program.coach || '-'}</span>
                                    </div>
                                    {(program.agenda_items || []).length > 0 && (
                                        <div className="rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 space-y-1">
                                            {program.agenda_items.map((item, idx) => (
                                                <p key={`${program.id}-today-${idx}`} className="text-xs text-neutral-600">
                                                    {item.start_time || '--:--'} - {item.end_time || '--:--'} | {item.title}
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card className="border-neutral-200">
                            <CardContent className="p-4 text-sm text-neutral-500">Tidak ada jadwal latihan hari ini.</CardContent>
                        </Card>
                    )}
                </section>

                <section className="space-y-3">
                    <p className="text-xs uppercase tracking-widest text-neutral-500 font-black">Mendatang (7 Agenda)</p>
                    {upcomingPrograms.length > 0 ? (
                        upcomingPrograms.map((program) => (
                            <Card key={`${program.id}-${program.date}`} className="border-neutral-200">
                                <CardContent className="p-4 space-y-1">
                                    <p className="font-semibold">{program.title}</p>
                                    <p className="text-xs text-neutral-500">{program.date_label}</p>
                                    <p className="text-xs text-neutral-500">{program.time} | {program.coach || '-'}</p>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card className="border-neutral-200">
                            <CardContent className="p-4 text-sm text-neutral-500">Belum ada agenda mendatang.</CardContent>
                        </Card>
                    )}
                </section>

                <section className="space-y-3">
                    <p className="text-xs uppercase tracking-widest text-neutral-500 font-black">Semua Agenda</p>
                    {allAgenda.length > 0 ? (
                        allAgenda.map((program) => {
                            const isOpen = expandedId === `${program.id}-${program.date}`;
                            const key = `${program.id}-${program.date}`;
                            return (
                                <Card key={key} className="border-neutral-200">
                                    <CardContent className="p-4 space-y-2">
                                        <button
                                            type="button"
                                            className="w-full flex items-start justify-between gap-3 text-left"
                                            onClick={() => setExpandedId(isOpen ? null : key)}
                                        >
                                            <div className="min-w-0">
                                                <p className="font-semibold truncate">{program.title}</p>
                                                <p className="text-xs text-neutral-500">{program.date_label} | {program.time}</p>
                                            </div>
                                            {isOpen ? <ChevronUp size={16} className="text-neutral-400" /> : <ChevronDown size={16} className="text-neutral-400" />}
                                        </button>

                                        {isOpen && (
                                            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 space-y-2">
                                                <div className="text-xs text-neutral-600 inline-flex items-center gap-1">
                                                    <CalendarDays size={12} />
                                                    Pelatih: {program.coach || '-'}
                                                </div>
                                                {(program.agenda_items || []).length > 0 ? (
                                                    program.agenda_items.map((item, idx) => (
                                                        <div key={`${key}-agenda-${idx}`} className="text-xs">
                                                            <p className="font-semibold">
                                                                {item.start_time || '--:--'} - {item.end_time || '--:--'} | {item.title}
                                                            </p>
                                                            {item.description && <p className="text-neutral-500">{item.description}</p>}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-xs text-neutral-500">Belum ada detail agenda.</p>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })
                    ) : (
                        <Card className="border-neutral-200">
                            <CardContent className="p-4 text-sm text-neutral-500">Belum ada data agenda.</CardContent>
                        </Card>
                    )}
                </section>
            </div>
        </PwaLayout>
    );
}

