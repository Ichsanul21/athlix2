import PwaLayout from '@/Layouts/PwaLayout';
import { Head } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { Clock, User, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { Skeleton } from '@/Components/ui/skeleton';
import { useState } from 'react';

export default function Index({ auth, todaySessions, upcomingSessions, allAgenda = [] }) {
    const typeColors = {
        fisik: 'bg-orange-500',
        kumite: 'bg-athlix-red',
        kata: 'bg-purple-500',
        teknik: 'bg-blue-500',
    };
    const [expandedId, setExpandedId] = useState(null);

    const isLoading = todaySessions === undefined && upcomingSessions === undefined && allAgenda === undefined;

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
                
                {/* Today Hero */}
                <div className="animate-fade-in-up fill-both">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-athlix-red animate-pulse"></div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500">Hari Ini</h3>
                    </div>

                    {todaySessions && todaySessions.length > 0 ? (
                        <div className="space-y-3">
                            {todaySessions.map((session, idx) => (
                                <Card key={idx} className="border-neutral-200/80 dark:border-neutral-800 card-hover overflow-hidden relative animate-fade-in-up fill-both" style={{ animationDelay: `${idx * 80}ms` }}>
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${typeColors[session.type] || 'bg-blue-500'}`}></div>
                                    <CardContent className="p-4 pl-5">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-2">
                                                <div>
                                                    <h4 className="font-bold text-base">{session.title}</h4>
                                                    <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-tighter text-white mt-1 ${typeColors[session.type] || 'bg-blue-500'}`}>
                                                        {session.type}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-3 text-xs text-neutral-500">
                                                    <span className="flex items-center gap-1"><Clock size={12} />{session.time}</span>
                                                    <span className="flex items-center gap-1"><User size={12} />{session.coach}</span>
                                                </div>
                                                {(session.agenda_items || []).length > 0 && (
                                                    <div className="rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 px-2.5 py-2">
                                                        {(session.agenda_items || []).slice(0, 2).map((item, childIdx) => (
                                                            <p key={`${idx}-child-${childIdx}`} className="text-[11px] text-neutral-500">
                                                                {(item.start_time || '--:--')} - {(item.end_time || '--:--')} | {item.title}
                                                            </p>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 animate-fade-in-up fill-both">
                            <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-3">
                                <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center animate-float">
                                    <Calendar size={24} className="text-neutral-300" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Tidak Ada Latihan Hari Ini</p>
                                    <p className="text-xs text-neutral-400 mt-0.5">Nikmati waktu istirahat atau latihan mandiri!</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Upcoming Sessions */}
                {upcomingSessions && upcomingSessions.length > 0 && (
                    <div className="animate-fade-in-up fill-both" style={{ animationDelay: '200ms' }}>
                        <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500 mb-4">Jadwal Mendatang</h3>
                        <div className="space-y-3">
                            {upcomingSessions.map((session, idx) => (
                                <Card key={idx} className="border-neutral-200/80 dark:border-neutral-800 animate-fade-in-up fill-both" style={{ animationDelay: `${250 + idx * 60}ms` }}>
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 flex-shrink-0">
                                            <Calendar size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-sm truncate">{session.title}</h4>
                                            <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                                                <span>{session.day}</span>
                                                <span>|</span>
                                                <span>{session.time}</span>
                                                <span>|</span>
                                                <span>{session.coach}</span>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-black uppercase text-white flex-shrink-0 ${typeColors[session.type] || 'bg-blue-500'}`}>
                                            {session.type}
                                        </span>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {allAgenda.length > 0 && (
                    <div className="animate-fade-in-up fill-both" style={{ animationDelay: '260ms' }}>
                        <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500 mb-4">Seluruh Agenda Latihan</h3>
                        <div className="space-y-3">
                            {allAgenda.map((agenda, idx) => {
                                const isOpen = expandedId === agenda.id;
                                return (
                                    <Card key={`${agenda.id}-${idx}`} className="border-neutral-200/80 dark:border-neutral-800">
                                        <CardContent className="p-4 space-y-3">
                                            <button
                                                type="button"
                                                className="w-full flex items-start justify-between gap-3 text-left"
                                                onClick={() => setExpandedId(isOpen ? null : agenda.id)}
                                            >
                                                <div className="space-y-1 min-w-0">
                                                    <p className="font-bold text-sm truncate">{agenda.title}</p>
                                                    <p className="text-xs text-neutral-500">{agenda.date_label} | {agenda.time}</p>
                                                    <p className="text-xs text-neutral-500">Pelatih: {agenda.coach || '-'}</p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-black uppercase text-white ${typeColors[agenda.type] || 'bg-blue-500'}`}>{agenda.type}</span>
                                                    {isOpen ? <ChevronUp size={16} className="text-neutral-400" /> : <ChevronDown size={16} className="text-neutral-400" />}
                                                </div>
                                            </button>

                                            {isOpen && (
                                                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40 p-3 space-y-2">
                                                    {(agenda.agenda_items || []).length > 0 ? (
                                                        agenda.agenda_items.map((item, itemIdx) => (
                                                            <div key={`${agenda.id}-item-${itemIdx}`} className="text-xs">
                                                                <p className="font-semibold">
                                                                    {(item.start_time || '--:--')} - {(item.end_time || '--:--')} | {item.title}
                                                                </p>
                                                                {item.description && <p className="text-neutral-500 mt-0.5">{item.description}</p>}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-xs text-neutral-500">Belum ada detail child agenda.</p>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </PwaLayout>
    );
}


