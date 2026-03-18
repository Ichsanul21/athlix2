import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { ArrowLeft, MapPin, Calendar, User, Award, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function Show({ auth, athlete, performance }) {
    const COLORS = ['#DC2626', '#404040'];

    return (
        <AdminLayout
            user={auth.user}
            header={
                <div className="space-y-1">
                    <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 uppercase">
                        Monitoring Athlet - {athlete.dojo?.name || 'Zero Squad Indonesia'}
                    </h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-widest">
                        Kalimantan Timur - Samarinda | Maret 2026
                    </p>
                </div>
            }
        >
            <Head title={`Rapor - ${athlete.full_name}`} />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
                    <Link href={route('athletes.index')} className="inline-flex items-center text-sm font-bold text-neutral-500 hover:text-athlix-red transition-colors">
                        <ArrowLeft size={16} className="mr-1" /> KEMBALI KE DATABASE
                    </Link>

                    {/* Biodata Section */}
                    <Card className="border-none shadow-sm overflow-hidden">
                        <div className="bg-sky-500 text-white p-2 px-6 text-center font-bold text-sm tracking-widest uppercase">
                            Biodata Athlet {athlete.dojo?.name || 'Zero Squad'}
                        </div>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 text-sm">
                                <div className="border-b md:border-b-0 md:border-r border-neutral-100 dark:border-neutral-800">
                                    <div className="flex border-b border-neutral-100 dark:border-neutral-800">
                                        <div className="w-1/3 bg-neutral-50 dark:bg-neutral-950 p-3 font-bold uppercase text-[10px] text-neutral-500">Nama</div>
                                        <div className="w-2/3 p-3 font-bold uppercase">{athlete.full_name}</div>
                                    </div>
                                    <div className="flex border-b border-neutral-100 dark:border-neutral-800">
                                        <div className="w-1/3 bg-neutral-50 dark:bg-neutral-950 p-3 font-bold uppercase text-[10px] text-neutral-500">Jenis Kelamin</div>
                                        <div className="w-2/3 p-3 font-bold uppercase">{athlete.gender === 'M' ? 'Laki-laki' : 'Perempuan'}</div>
                                    </div>
                                    <div className="flex border-b border-neutral-100 dark:border-neutral-800">
                                        <div className="w-1/3 bg-neutral-50 dark:bg-neutral-950 p-3 font-bold uppercase text-[10px] text-neutral-500">Tanggal Lahir</div>
                                        <div className="w-2/3 p-3 font-bold">{athlete.dob}</div>
                                    </div>
                                    <div className="flex">
                                        <div className="w-1/3 bg-neutral-50 dark:bg-neutral-950 p-3 font-bold uppercase text-[10px] text-neutral-500">Tinggi/Berat</div>
                                        <div className="w-2/3 p-3 font-bold uppercase">170 CM / {athlete.latest_weight} KG</div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex border-b border-neutral-100 dark:border-neutral-800">
                                        <div className="w-1/3 bg-neutral-50 dark:bg-neutral-950 p-3 font-bold uppercase text-[10px] text-neutral-500">Cabang Olahraga</div>
                                        <div className="w-2/3 p-3 font-bold uppercase">Karate</div>
                                    </div>
                                    <div className="flex border-b border-neutral-100 dark:border-neutral-800">
                                        <div className="w-1/3 bg-neutral-50 dark:bg-neutral-950 p-3 font-bold uppercase text-[10px] text-neutral-500">Nomor Tanding</div>
                                        <div className="w-2/3 p-3 font-bold uppercase">{athlete.specialization}</div>
                                    </div>
                                    <div className="flex border-b border-neutral-100 dark:border-neutral-800">
                                        <div className="w-1/3 bg-neutral-50 dark:bg-neutral-950 p-3 font-bold uppercase text-[10px] text-neutral-500">Tanggal Tes</div>
                                        <div className="w-2/3 p-3 font-bold">17 Maret 2026</div>
                                    </div>
                                    <div className="flex">
                                        <div className="w-1/3 bg-neutral-50 dark:bg-neutral-950 p-3 font-bold uppercase text-[10px] text-neutral-500">Tempat Tes</div>
                                        <div className="w-2/3 p-3 font-bold uppercase">GOR PERJUANGAN</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Condition Pie Chart */}
                        <Card className="bg-neutral-50/50 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800">
                            <CardHeader className="text-center pb-0">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500">Condition Athlet</CardTitle>
                            </CardHeader>
                            <CardContent className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={performance.condition}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {performance.condition.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Category Bar Chart */}
                        <Card className="bg-neutral-50/50 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800">
                            <CardHeader className="text-center pb-0">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500">Presentase Kategori Athlet</CardTitle>
                            </CardHeader>
                            <CardContent className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={performance.categories}>
                                        <XAxis dataKey="subject" fontSize={10} tick={{fill: '#888'}} axisLine={false} tickLine={false} />
                                        <YAxis fontSize={10} tick={{fill: '#888'}} domain={[0, 120]} />
                                        <Tooltip cursor={{fill: 'transparent'}} />
                                        <Bar dataKey="A" fill="#DC2626" radius={[4, 4, 0, 0]} barSize={20} />
                                        <Bar dataKey="fullMark" fill="#404040" radius={[4, 4, 0, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Detailed Horizontal Bar Chart */}
                    <Card className="bg-neutral-50/50 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800 overflow-hidden">
                        <CardHeader className="bg-neutral-900 text-white py-2 text-center">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest">Presentase Athlet Perkategori</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={performance.detailed} margin={{ left: 100 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#333" />
                                    <XAxis type="number" domain={[0, 120]} fontSize={10} tick={{fill: '#888'}} />
                                    <YAxis dataKey="name" type="category" fontSize={9} fontBold tick={{fill: '#888'}} width={120} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="presentase" name="Presentase Athlet" fill="#3B82F6" barSize={12} />
                                    <Bar dataKey="target" name="Kekurangan Athlet" fill="#F97316" barSize={12} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Digital ID Link */}
                    <div className="flex justify-center">
                        <Card className="max-w-xs w-full bg-athlix-black text-white p-4 border-none text-center space-y-3">
                            <div className="flex items-center justify-center gap-2">
                                <Award className="text-athlix-red" size={20} />
                                <span className="text-xs font-bold uppercase tracking-widest">Digital ID Available</span>
                            </div>
                            <p className="text-[10px] text-neutral-500">Athlete can use this code for PWA scans</p>
                            <Button variant="secondary" className="w-full h-8 text-xs font-bold uppercase">
                                View QR Digital ID
                            </Button>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
