import PwaLayout from '@/Layouts/PwaLayout';
import { Head } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { CalendarDays, Clock, Zap, TrendingUp, CreditCard, AlertCircle, Flame, Award, Medal } from 'lucide-react';

export default function Index({ auth, athlete, todaySession, stats, upcomingPayment, upcomingExam, tips }) {
    return (
        <PwaLayout user={auth.user} header="ATHLIX">
            <Head title="Home" />
            <div className="space-y-6 pb-24">

                {/* Greeting */}
                <div className="animate-fade-in-up fill-both">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Selamat Berlatih,</p>
                    <h2 className="text-2xl font-black uppercase tracking-tighter">{auth.user.name}</h2>
                </div>

                {/* Primary Banner */}
                <Card className="border-none bg-gradient-to-r from-athlix-red to-red-600 text-white overflow-hidden relative animate-fade-in-up fill-both shadow-xl shadow-athlix-red/20" style={{ animationDelay: '80ms' }}>
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4"></div>
                    <CardContent className="p-6 relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                                <CalendarDays size={16} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Jadwal Hari Ini</span>
                        </div>
                        {todaySession ? (
                            <div className="space-y-2">
                                <h3 className="text-xl font-black tracking-tight">{todaySession.title}</h3>
                                <div className="flex items-center gap-3 text-sm text-white/80">
                                    <span className="flex items-center gap-1"><Clock size={14} />{todaySession.time}</span>
                                    <span>•</span>
                                    <span>{todaySession.coach}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <h3 className="text-xl font-black tracking-tight">Hari Libur 🎉</h3>
                                <p className="text-sm text-white/70">Tidak ada jadwal latihan hari ini. Istirahat yang cukup!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3 animate-fade-in-up fill-both" style={{ animationDelay: '160ms' }}>
                    {[
                        { label: 'Kehadiran', value: stats?.attendance || '0%', icon: TrendingUp, color: 'text-green-500 bg-green-500/10' },
                        { label: 'Sabuk', value: stats?.belt || 'Putih', icon: Award, color: 'text-yellow-500 bg-yellow-500/10' },
                        { label: 'Sisa Bayar', value: stats?.outstanding || 'Rp 0', icon: CreditCard, color: 'text-blue-500 bg-blue-500/10' },
                        { label: 'Latihan', value: stats?.total_sessions || '0', icon: Flame, color: 'text-orange-500 bg-orange-500/10' },
                    ].map((s, idx) => (
                        <Card key={s.label} className="border-neutral-200/80 dark:border-neutral-800 card-hover group animate-fade-in-up fill-both" style={{ animationDelay: `${200 + idx * 60}ms` }}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${s.color} transition-transform duration-300 group-hover:scale-110`}>
                                        <s.icon size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase text-neutral-500 tracking-widest">{s.label}</p>
                                        <p className="text-base font-black">{s.value}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Coach Tip */}
                {tips && (
                    <Card className="border-neutral-200/80 dark:border-neutral-800 bg-gradient-to-r from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-900/70 animate-fade-in-up fill-both" style={{ animationDelay: '400ms' }}>
                        <CardContent className="p-5 flex gap-4 items-start">
                            <div className="p-2.5 rounded-xl bg-athlix-red/10 text-athlix-red flex-shrink-0 animate-float">
                                <Zap size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-athlix-red mb-1">Tips Sensei</p>
                                <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">{tips}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Payment Reminder */}
                {upcomingPayment && upcomingPayment.amount > 0 && (
                    <Card className="border-athlix-red/20 dark:border-athlix-red/10 bg-athlix-red/5 dark:bg-athlix-red/5 animate-fade-in-up fill-both" style={{ animationDelay: '480ms' }}>
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="p-2.5 rounded-xl bg-athlix-red/10 text-athlix-red">
                                <AlertCircle size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black uppercase tracking-widest text-athlix-red">Tagihan Aktif</p>
                                <p className="text-sm text-neutral-600 dark:text-neutral-300">Jatuh tempo <span className="font-bold">{upcomingPayment.due_date}</span></p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="font-mono font-black text-lg text-athlix-red">{upcomingPayment.formatted_amount}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Upcoming Exam Notification */}
                {upcomingExam && (
                    <Card className="border-none bg-gradient-to-br from-yellow-500 to-orange-600 text-white animate-fade-in-up fill-both shadow-xl shadow-yellow-500/20" style={{ animationDelay: '560ms' }}>
                        <CardContent className="p-5 flex items-center gap-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                            <div className="relative z-10 p-2.5 rounded-xl bg-white/20 backdrop-blur-sm text-white animate-pulse">
                                <Medal size={24} />
                            </div>
                            <div className="relative z-10 flex-1 min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/80">Ujian Kenaikan Sabuk</p>
                                <h4 className="text-base sm:text-lg font-black tracking-tight">{upcomingExam.target_belt}</h4>
                                <p className="text-xs text-white/90 mt-0.5 flex items-center gap-1">
                                    <CalendarDays size={12}/> {upcomingExam.date}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </PwaLayout>
    );
}
