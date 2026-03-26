import PwaLayout from '@/Layouts/PwaLayout';
import { Head } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { Skeleton } from '@/Components/ui/skeleton';
import { Activity, HeartPulse } from 'lucide-react';
import { PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { useEffect, useMemo, useState } from 'react';

export default function PwaCondition({ auth, athlete, performanceSummary, trend = [] }) {
    const isLoading = athlete === undefined || performanceSummary === undefined;
    const [wellnessDashboard, setWellnessDashboard] = useState(null);

    useEffect(() => {
        if (!athlete) return;

        let active = true;

        const loadWellnessDashboard = async () => {
            try {
                const response = await fetch('/api/v1/wellness/dashboard', {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'same-origin',
                });
                if (!response.ok || !active) return;

                const payload = await response.json();
                if (!active) return;

                setWellnessDashboard(payload);
            } catch (error) {
                // noop
            }
        };

        loadWellnessDashboard();

        return () => {
            active = false;
        };
    }, [athlete?.id]);

    if (isLoading) {
        return (
            <PwaLayout user={auth?.user} header="Kondisi Fisik">
                <div className="space-y-4 pb-24">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-72 w-full" />
                </div>
            </PwaLayout>
        );
    }

    if (!athlete || !performanceSummary) {
        return (
            <PwaLayout user={auth?.user} header="Kondisi Fisik">
                <Head title="Kondisi Fisik" />
                <div className="pb-24">
                    <Card className="border-neutral-200/80 dark:border-neutral-800">
                        <CardContent className="p-6 text-sm text-neutral-500">
                            Data kondisi fisik belum tersedia.
                        </CardContent>
                    </Card>
                </div>
            </PwaLayout>
        );
    }

    const radarData = (performanceSummary.categories || []).map((item) => ({
        label: item.label,
        score: item.score,
    }));

    const readinessTrend = useMemo(() => {
        const items = wellnessDashboard?.readiness?.trend_7d || [];
        return items.map((item) => ({
            date: item.date ? item.date.slice(5) : '-',
            readiness_percentage: item.readiness_percentage ?? 0,
        }));
    }, [wellnessDashboard?.readiness?.trend_7d]);

    const workload = wellnessDashboard?.workload;

    return (
        <PwaLayout user={auth?.user} header="Kondisi Fisik">
            <Head title="Kondisi Fisik" />

            <div className="space-y-4 pb-24">
                <Card className="border-none bg-gradient-to-r from-athlix-red to-red-600 text-white">
                    <CardContent className="p-5 space-y-2">
                        <p className="text-xs font-black uppercase tracking-widest">Kondisi Terkini</p>
                        <p className="text-4xl font-black">{performanceSummary.condition_percentage}%</p>
                        <p className="text-sm text-white/80">Status kemampuan: <span className="font-bold">{performanceSummary.ability_status}</span></p>
                    </CardContent>
                </Card>

                <Card className="border-neutral-200/80 dark:border-neutral-800">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity size={16} className="text-athlix-red" />
                            <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Diagram Kemampuan</p>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={radarData}>
                                    <PolarGrid stroke="#88888833" />
                                    <PolarAngleAxis dataKey="label" tick={{ fontSize: 11 }} />
                                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                                    <Radar dataKey="score" stroke="#DC2626" fill="#DC2626" fillOpacity={0.25} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-neutral-200/80 dark:border-neutral-800">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <HeartPulse size={16} className="text-blue-500" />
                            <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Tren Berat & IMT</p>
                        </div>
                        <div className="h-56">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trend}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888822" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <Tooltip />
                                    <Line dataKey="weight" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3 }} />
                                    <Line dataKey="bmi" stroke="#DC2626" strokeWidth={2.5} dot={{ r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {readinessTrend.length > 0 && (
                    <Card className="border-neutral-200/80 dark:border-neutral-800">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <HeartPulse size={16} className="text-athlix-red" />
                                <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Readiness 7 Hari</p>
                            </div>
                            <div className="h-52">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={readinessTrend}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888822" />
                                        <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <Tooltip />
                                        <Line dataKey="readiness_percentage" stroke="#DC2626" strokeWidth={2.5} dot={{ r: 3 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {workload && (
                    <Card className="border-neutral-200/80 dark:border-neutral-800">
                        <CardContent className="p-4">
                            <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Workload (ACWR)</p>
                            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                                <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 p-2">
                                    <p className="text-[11px] text-neutral-500">Acute</p>
                                    <p className="font-black text-sm">{Number(workload.acute_load || 0).toFixed(1)}</p>
                                </div>
                                <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 p-2">
                                    <p className="text-[11px] text-neutral-500">Chronic</p>
                                    <p className="font-black text-sm">{Number(workload.chronic_load || 0).toFixed(1)}</p>
                                </div>
                                <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 p-2">
                                    <p className="text-[11px] text-neutral-500">ACWR</p>
                                    <p className="font-black text-sm">{workload.acwr_ratio ? Number(workload.acwr_ratio).toFixed(2) : '-'}</p>
                                </div>
                            </div>
                            <p className="text-sm mt-3">Risk band: <span className="font-bold uppercase">{workload.risk_band || 'low'}</span></p>
                        </CardContent>
                    </Card>
                )}

                {performanceSummary.latest_report_note && (
                    <Card className="border-neutral-200/80 dark:border-neutral-800">
                        <CardContent className="p-4">
                            <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Catatan Senpai</p>
                            <p className="text-sm text-neutral-600  mt-2">{performanceSummary.latest_report_note}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </PwaLayout>
    );
}
