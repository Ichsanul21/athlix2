import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Calendar, Award } from 'lucide-react';
import { Skeleton } from '@/Components/ui/skeleton';
import { Button } from '@/Components/ui/button';
import { useState } from 'react';

const COLORS = ['#E61E32', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

export default function Index({ auth, growthData, attendanceData, beltDistribution, athletes }) {
    const [previewScope, setPreviewScope] = useState('dojo');
    const [selectedAthleteId, setSelectedAthleteId] = useState(athletes?.[0]?.id || '');
    const isLoading = growthData === undefined || attendanceData === undefined || beltDistribution === undefined || athletes === undefined;

    const openPpaPreview = (format) => {
        const params = new URLSearchParams({ scope: previewScope, format });
        if (previewScope === 'athlete' && selectedAthleteId) {
            params.set('athlete_id', selectedAthleteId);
        }
        window.open(`${route('statistics.ppa-preview')}?${params.toString()}`, '_blank');
    };

    if (isLoading) {
        return (
            <AdminLayout
                user={auth?.user}
                header={<h2 className="text-xl font-bold tracking-tight uppercase">Statistik & Analitik Dojo</h2>}
            >
                <Head title="Statistik" />
                <div className="py-6 space-y-6">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
                        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                            <Skeleton className="h-72 w-full" />
                            <Skeleton className="h-72 w-full" />
                        </div>
                        <Skeleton className="h-72 w-full" />
                        <Skeleton className="h-40 w-full" />
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout
            user={auth?.user}
            header={<h2 className="text-xl font-bold tracking-tight uppercase">Statistik & Analitik Dojo</h2>}
        >
            <Head title="Statistik" />

            <div className="py-6 space-y-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
                    
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                        <Card className="border-neutral-200/80 dark:border-neutral-800 animate-fade-in-up fill-both">
                            <CardHeader>
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                                    <TrendingUp size={16} className="text-athlix-red" />
                                    Pertumbuhan Atlet (Semester)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[250px] sm:h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={growthData}>
                                        <defs>
                                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#E61E32" stopOpacity={0.15}/>
                                                <stop offset="95%" stopColor="#E61E32" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888815" />
                                        <XAxis dataKey="month" fontSize={10} axisLine={false} tickLine={false} />
                                        <YAxis fontSize={10} axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#171717', border: 'none', borderRadius: '12px', fontSize: '11px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
                                            itemStyle={{ color: '#E61E32' }}
                                        />
                                        <Area type="monotone" dataKey="total" stroke="#E61E32" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={2.5} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="border-neutral-200/80 dark:border-neutral-800 animate-fade-in-up fill-both" style={{ animationDelay: '100ms' }}>
                            <CardHeader>
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                                    <Award size={16} className="text-yellow-500" />
                                    Komposisi Sabuk
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[250px] sm:h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={beltDistribution}
                                            innerRadius={55}
                                            outerRadius={75}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {beltDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#171717', border: 'none', borderRadius: '12px', fontSize: '11px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-xs uppercase font-bold text-neutral-500">
                                    {beltDistribution.map((entry, index) => (
                                        <div key={index} className="flex items-center gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                            {entry.name}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-neutral-200/80 dark:border-neutral-800 animate-fade-in-up fill-both" style={{ animationDelay: '200ms' }}>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                                <Calendar size={16} className="text-blue-500" />
                                Tren Kehadiran (30 Hari Terakhir)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[250px] sm:h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={attendanceData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888815" />
                                    <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} />
                                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#171717', border: 'none', borderRadius: '12px', fontSize: '11px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
                                    />
                                    <Bar dataKey="present" fill="#10b981" radius={[6, 6, 0, 0]} />
                                    <Bar dataKey="absent" fill="#E61E32" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-neutral-900 dark:bg-neutral-900 animate-fade-in-up fill-both overflow-hidden relative" style={{ animationDelay: '300ms' }}>
                        <CardContent className="p-6 sm:p-8 border-b border-neutral-800/70 relative z-10 space-y-4">
                            <h3 className="text-sm font-black uppercase text-white tracking-widest">Preview PPA (PDF / Excel)</h3>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <select
                                    value={previewScope}
                                    onChange={(event) => setPreviewScope(event.target.value)}
                                    className="w-full sm:w-48 rounded-xl border border-neutral-700 bg-neutral-900 text-white text-sm"
                                >
                                    <option value="dojo">Per Dojo</option>
                                    <option value="athlete">Per Atlet</option>
                                </select>
                                {previewScope === 'athlete' && (
                                    <select
                                        value={selectedAthleteId}
                                        onChange={(event) => setSelectedAthleteId(event.target.value)}
                                        className="w-full rounded-xl border border-neutral-700 bg-neutral-900 text-white text-sm"
                                    >
                                        {athletes.map((athlete) => (
                                            <option key={athlete.id} value={athlete.id}>{athlete.full_name}</option>
                                        ))}
                                    </select>
                                )}
                                <div className="flex items-center gap-2">
                                    <Button type="button" variant="outline" className="border-neutral-700 text-white hover:bg-neutral-800" onClick={() => openPpaPreview('pdf')}>
                                        Preview PDF
                                    </Button>
                                    <Button type="button" className="bg-athlix-red hover:bg-red-700 text-white" onClick={() => openPpaPreview('excel')}>
                                        Preview Excel
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                        <div className="absolute inset-0 bg-gradient-to-br from-athlix-red/5 via-transparent to-transparent"></div>
                        <CardContent className="p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-4 relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-athlix-red/10 flex items-center justify-center text-athlix-red animate-float">
                                <Users size={32} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black uppercase text-white tracking-tighter">Laporan Agregat Dojo</h3>
                                <p className="text-xs text-neutral-500 max-w-xs mx-auto mt-2">Data ini diperbarui secara real-time berdasarkan input absensi dan pendaftaran atlet baru di sistem ATHLIX.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}


