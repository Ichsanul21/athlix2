import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Users, Dumbbell, Activity, CreditCard, Sparkles, Trophy, ChevronRight, TrendingUp } from 'lucide-react';

export default function Dashboard({ auth, stats, trainingPrograms, topPerformers, dojoName }) {
    const icons = {
        'users': Users,
        'dumbbell': Dumbbell,
        'activity': Activity,
        'credit-card': CreditCard
    };

    const iconColors = [
        'bg-athlix-red/10 text-athlix-red',
        'bg-blue-500/10 text-blue-500',
        'bg-green-500/10 text-green-500',
        'bg-orange-500/10 text-orange-500',
    ];

    return (
        <AdminLayout
            user={auth.user}
            header={
                <div className="space-y-1 py-2">
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">Overview Dojo</h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Selamat datang kembali, Sensei. Berikut ringkasan hari ini.
                    </p>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="py-6 space-y-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
                    
                    {/* Top Stats Row */}
                    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                        {stats.map((stat, idx) => {
                            const Icon = icons[stat.icon] || Users;
                            return (
                                <Card 
                                    key={stat.title} 
                                    className="bg-white dark:bg-neutral-900/80 border-neutral-200/80 dark:border-neutral-800 card-hover overflow-hidden relative group animate-fade-in-up fill-both"
                                    style={{ animationDelay: `${idx * 80}ms` }}
                                >
                                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-athlix-red/0 via-athlix-red/30 to-athlix-red/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <CardContent className="p-5 sm:p-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-2xl ${iconColors[idx % iconColors.length]} transition-transform duration-300 group-hover:scale-110`}>
                                                <Icon size={22} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{stat.title}</p>
                                                <h3 className="text-2xl font-bold tracking-tight">{stat.value}</h3>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>

                    <div className="grid gap-6 md:grid-cols-12">
                        {/* Training Programs - Spans 8 columns */}
                        <div className="md:col-span-8 space-y-4 animate-fade-in-up fill-both" style={{ animationDelay: '200ms' }}>
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Sparkles className="text-athlix-red" size={20} />
                                    Program Latihan Terdekat
                                </h3>
                                <Link href={route('training-programs.index')} className="text-sm font-medium text-athlix-red hover:underline flex items-center gap-1 group">
                                    Lihat Semua
                                    <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
                                </Link>
                            </div>

                            <div className="space-y-3">
                                {trainingPrograms.map((program, idx) => (
                                    <Link key={idx} href={route('training-programs.index')} className="block">
                                        <Card className="bg-white dark:bg-neutral-900/80 border-neutral-200/80 dark:border-neutral-800 hover:border-athlix-red/30 transition-all duration-300 cursor-pointer card-hover group">
                                            <CardContent className="p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2.5 rounded-xl bg-athlix-red/10 text-athlix-red transition-all duration-300 group-hover:bg-athlix-red group-hover:text-white">
                                                        <Dumbbell size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-base">{program.title}</h4>
                                                        <p className="text-sm text-neutral-500 dark:text-neutral-400">{program.desc}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-mono text-sm font-bold">{program.time}</p>
                                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{program.status}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Top Performers - Spans 4 columns */}
                        <div className="md:col-span-4 space-y-4 animate-fade-in-up fill-both" style={{ animationDelay: '300ms' }}>
                            <h3 className="text-lg font-bold flex items-center gap-2 px-1">
                                <Trophy className="text-yellow-500" size={20} />
                                Top Performa
                            </h3>

                            <Card className="bg-white dark:bg-neutral-900/80 border-neutral-200/80 dark:border-neutral-800">
                                <CardContent className="p-5 space-y-5">
                                    {topPerformers.map((performer, idx) => (
                                        <div key={idx} className="flex items-center justify-between group cursor-pointer animate-fade-in-up fill-both" style={{ animationDelay: `${400 + idx * 60}ms` }}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm transition-all duration-300 group-hover:scale-110
                                                    ${idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white shadow-yellow-500/20' : 
                                                      idx === 1 ? 'bg-gradient-to-br from-neutral-300 to-neutral-400 text-white dark:from-neutral-600 dark:to-neutral-700' : 
                                                      idx === 2 ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-amber-500/20' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}
                                                >
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold group-hover:text-athlix-red transition-colors">{performer.name}</p>
                                                    <p className="text-[10px] uppercase text-neutral-500 tracking-wider">{performer.category}</p>
                                                </div>
                                            </div>
                                            <div className="text-athlix-red font-mono font-bold">{performer.score}</div>
                                        </div>
                                    ))}
                                    
                                    <Link href={route('exams.index')}>
                                        <Button variant="outline" className="w-full mt-2 h-10 border-neutral-200 dark:border-neutral-800">
                                            Lihat Peringkat Lengkap
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                </div>
            </div>
        </AdminLayout>
    );
}
