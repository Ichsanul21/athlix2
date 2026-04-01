import PwaLayout from '@/Layouts/PwaLayout';
import { Head } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { useState } from 'react';
import { CalendarDays, Clock, UserRound, X } from 'lucide-react';
import { createPortal } from 'react-dom';

const typeColors = {
    fisik: 'bg-orange-500',
    'teknik umum': 'bg-emerald-600',
    'teknik khusus': 'bg-blue-500',
    libur: 'bg-neutral-400',
};

export default function Schedule({ auth, dojo, todayPrograms = [], upcomingPrograms = [], allAgenda = [] }) {
    const [detailModal, setDetailModal] = useState(null);

    return (
        <PwaLayout user={auth?.user} header="Jadwal Sensei">
            <Head title="Jadwal Sensei PWA" />

            <div className="space-y-5 pb-24">
                <section className="space-y-1">
                    <p className="text-xs uppercase tracking-widest text-neutral-500 font-black">Club</p>
                    <h2 className="text-xl font-black tracking-tight">{dojo?.name || '-'}</h2>
                </section>

                <section className="space-y-3">
                    <p className="text-xs uppercase tracking-widest text-neutral-500 font-black">Latihan Hari Ini</p>
                    {todayPrograms.length > 0 ? (
                        todayPrograms.map((program) => (
                            <Card
                                key={program.id}
                                className={`border-neutral-200 transition-colors cursor-pointer ${program.type === 'libur' ? 'opacity-60 bg-neutral-50/50 dark:bg-neutral-900/20' : 'hover:border-athlix-red/30 active:scale-[0.98]'}`}
                                onClick={() => setDetailModal(program)}
                            >
                                <CardContent className="p-4 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <p className={`font-black truncate ${program.type === 'libur' ? 'text-neutral-500 italic' : ''}`}>{program.title}</p>
                                            <p className="text-xs text-neutral-500">{program.day}</p>
                                        </div>
                                        <span className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-black uppercase text-white ${typeColors[program.type] || 'bg-blue-500'}`}>
                                            {program.type || 'umum'}
                                        </span>
                                    </div>
                                    {program.type !== 'libur' ? (
                                        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-600">
                                            <span className="inline-flex items-center gap-1"><Clock size={12} />{program.time}</span>
                                            <span className="inline-flex items-center gap-1"><UserRound size={12} />{program.coach || '-'}</span>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-neutral-400">Tidak ada jadwal terstruktur. Gunakan waktu ini untuk pemulihan atau latihan mandiri.</p>
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
                            <Card
                                key={`${program.id}-${program.date}`}
                                className={`border-neutral-200 transition-colors cursor-pointer ${program.type === 'libur' ? 'opacity-60 bg-neutral-50/50 dark:bg-neutral-900/20' : 'hover:border-athlix-red/30 active:scale-[0.98]'}`}
                                onClick={() => setDetailModal(program)}
                            >
                                <CardContent className="p-4 space-y-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className={`font-semibold truncate ${program.type === 'libur' ? 'text-neutral-500 italic' : ''}`}>{program.title}</p>
                                        <span className={`shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-black uppercase text-white ${typeColors[program.type] || 'bg-blue-500'}`}>
                                            {program.type}
                                        </span>
                                    </div>
                                    <p className="text-xs text-neutral-500">{program.date_label}</p>
                                    {program.type !== 'libur' && (
                                        <p className="text-xs text-neutral-500">{program.time} | {program.coach || '-'}</p>
                                    )}
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
                        allAgenda.map((program) => (
                            <Card
                                key={`${program.id}-${program.date}`}
                                className={`border-neutral-200 transition-colors cursor-pointer ${program.type === 'libur' ? 'opacity-60 bg-neutral-50/50 dark:bg-neutral-900/20' : 'hover:border-athlix-red/30 active:scale-[0.98]'}`}
                                onClick={() => setDetailModal(program)}
                            >
                                <CardContent className="p-4 space-y-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className={`font-semibold truncate ${program.type === 'libur' ? 'text-neutral-500 italic' : ''}`}>{program.title}</p>
                                        <span className={`shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-black uppercase text-white ${typeColors[program.type] || 'bg-blue-500'}`}>
                                            {program.type}
                                        </span>
                                    </div>
                                    <p className="text-xs text-neutral-500">{program.date_label} {program.type !== 'libur' ? `| ${program.time}` : ''}</p>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card className="border-neutral-200">
                            <CardContent className="p-4 text-sm text-neutral-500">Belum ada data agenda.</CardContent>
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
