import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Skeleton } from '@/Components/ui/skeleton';
import DbSelect from '@/Components/DbSelect';
import Modal from '@/Components/Modal';
import {
    FileDown, FileSpreadsheet, MapPin, Search, X,
    TrendingUp, Users, UserCheck, UserX, AlertCircle, CalendarRange,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';

const MONTHS = [
    { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },   { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },     { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },{ value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },{ value: '12', label: 'Desember' },
];

function RateBadge({ rate }) {
    const cls = rate >= 80
        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
        : rate >= 60
            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-black ${cls}`}>
            {rate}%
        </span>
    );
}

function RateBar({ rate }) {
    const color = rate >= 80 ? 'bg-green-500' : rate >= 60 ? 'bg-yellow-500' : 'bg-red-500';
    return (
        <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-1.5 mt-1">
            <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${Math.min(100, rate)}%` }} />
        </div>
    );
}

export default function Recap({ auth, recap, dojos = [], filters = {} }) {
    const isLoading = recap === undefined;

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    const [month, setMonth] = useState(String(filters.month ?? new Date().getMonth() + 1));
    const [year, setYear]   = useState(String(filters.year  ?? currentYear));
    const [dojoId, setDojoId] = useState(String(filters.dojo_id ?? ''));
    const [search, setSearch] = useState(filters.search ?? '');
    const [exporting, setExporting] = useState(false);
    const [mapModal, setMapModal] = useState({ show: false, lat: null, lng: null, title: '' });

    const monthLabel = MONTHS.find(m => m.value === month)?.label ?? month;

    // Sync state with props when filters change
    useEffect(() => {
        setMonth(String(filters.month ?? new Date().getMonth() + 1));
    }, [filters.month]);

    useEffect(() => {
        setYear(String(filters.year ?? currentYear));
    }, [filters.year]);

    useEffect(() => {
        setDojoId(String(filters.dojo_id ?? ''));
    }, [filters.dojo_id]);

    useEffect(() => {
        setSearch(filters.search ?? '');
    }, [filters.search]);

    // ── Summary stats ────────────────────────────────────────────────────────
    const stats = useMemo(() => {
        if (!recap) return null;
        const totalAthletes = recap.length;
        const totalPresent  = recap.reduce((s, r) => s + r.present, 0);
        const totalSick     = recap.reduce((s, r) => s + r.sick, 0);
        const totalExcused  = recap.reduce((s, r) => s + r.excused, 0);
        const totalAbsent   = recap.reduce((s, r) => s + r.absent, 0);
        const avgRate       = totalAthletes > 0
            ? (recap.reduce((s, r) => s + r.rate, 0) / totalAthletes).toFixed(1)
            : 0;
        const withLocation  = recap.filter(r => r.last_lat).length;
        return { totalAthletes, totalPresent, totalSick, totalExcused, totalAbsent, avgRate, withLocation };
    }, [recap]);

    // ── Navigation & Filter helpers ──────────────────────────────────────────
    const navigateWithFilters = (newMonth = month, newYear = year, newDojoId = dojoId, newSearch = search) => {
        const params = { month: newMonth, year: newYear };
        if (newDojoId) params.dojo_id = newDojoId;
        if (newSearch) params.search = newSearch;
        router.get(route('attendance.recap'), params, { preserveScroll: true });
    };

    const applyFilters = () => {
        navigateWithFilters(month, year, dojoId, search);
    };

    // ── Export Excel (client-side) ────────────────────────────────────────────
    const handleExportExcel = async () => {
        setExporting(true);
        try {
            const params = new URLSearchParams({ month, year });
            if (dojoId) params.append('dojo_id', dojoId);
            if (search) params.append('search', search);

            const res = await fetch(route('attendance.recap.export-excel') + '?' + params.toString());
            const json = await res.json();

            const ws = XLSX.utils.json_to_sheet(json.data);
            const wb = XLSX.utils.book_new();

            // Style header row
            const headerRange = XLSX.utils.decode_range(ws['!ref']);
            ws['!cols'] = [
                { wch: 28 }, { wch: 12 }, { wch: 20 }, { wch: 14 },
                { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
                { wch: 10 }, { wch: 10 }, { wch: 16 }, { wch: 16 },
            ];

            XLSX.utils.book_append_sheet(wb, ws, `Rekap ${monthLabel} ${year}`);
            XLSX.writeFile(wb, `rekap-absensi-${year}-${String(month).padStart(2, '0')}.xlsx`);
        } finally {
            setExporting(false);
        }
    };

    // ── Export PDF (server-side) ──────────────────────────────────────────────
    const handleExportPdf = () => {
        const params = new URLSearchParams({ month, year });
        if (dojoId) params.append('dojo_id', dojoId);
        if (search) params.append('search', search);
        window.open(route('attendance.recap.export-pdf') + '?' + params.toString(), '_blank');
    };

    if (isLoading) {
        return (
            <AdminLayout user={auth?.user} header={<h2 className="text-xl font-bold leading-tight text-neutral-800">Rekap Absensi</h2>}>
                <Head title="Rekap Absensi" />
                <div className="py-6"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4"><Skeleton className="h-80 w-full" /></div></div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout
            user={auth?.user}
            header={
                <div className="flex items-center gap-3">
                    <CalendarRange size={22} className="text-athlix-red" />
                    <h2 className="text-xl font-bold leading-tight text-neutral-800">Rekap Absensi</h2>
                </div>
            }
        >
            <Head title="Rekap Absensi" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-5">

                    {/* ── Filter Bar ── */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex flex-wrap items-end gap-3">
                                {/* Month */}
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Bulan</p>
                                    <select
                                        id="recap-month"
                                        value={month}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setMonth(val);
                                            navigateWithFilters(val, year, dojoId, search);
                                        }}
                                        className="h-9 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 text-sm focus:ring-2 focus:ring-athlix-red outline-none"
                                    >
                                        {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                </div>

                                {/* Year */}
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Tahun</p>
                                    <select
                                        id="recap-year"
                                        value={year}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setYear(val);
                                            navigateWithFilters(month, val, dojoId, search);
                                        }}
                                        className="h-9 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 text-sm focus:ring-2 focus:ring-athlix-red outline-none"
                                    >
                                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>

                                {/* Dojo (super_admin only) */}
                                {dojos.length > 0 && (
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Dojo / Club</p>
                                        <DbSelect
                                            inputId="recap-dojo"
                                            className="w-48"
                                            options={dojos.map(d => ({ value: String(d.id), label: d.name }))}
                                            value={dojoId}
                                            placeholder="Semua Dojo"
                                            isClearable
                                            onChange={v => {
                                                const val = v ?? '';
                                                setDojoId(val);
                                                navigateWithFilters(month, year, val, search);
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Search */}
                                <div className="space-y-1 flex-1 min-w-48">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Cari Atlet</p>
                                    <div className="relative flex items-center">
                                        <Search size={14} className="absolute left-3 text-neutral-400" />
                                        <input
                                            id="recap-search"
                                            type="text"
                                            className="h-9 w-full rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 pl-8 pr-8 text-sm focus:ring-2 focus:ring-athlix-red outline-none"
                                            placeholder="Nama atau kode atlet..."
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && applyFilters()}
                                        />
                                        {search && (
                                            <button onClick={() => { setSearch(''); navigateWithFilters(month, year, dojoId, ''); }} className="absolute right-2 text-neutral-400 hover:text-neutral-600">
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <Button id="recap-search-btn" onClick={applyFilters} className="h-9 shrink-0">
                                    <Search size={14} className="mr-1" /> Cari
                                </Button>

                                {/* Export Buttons */}
                                <div className="flex gap-2 ml-auto shrink-0">
                                    <Button
                                        id="recap-export-excel"
                                        variant="outline"
                                        className="h-9 border-green-600 text-green-700 hover:bg-green-50"
                                        onClick={handleExportExcel}
                                        disabled={exporting || !recap?.length}
                                    >
                                        <FileSpreadsheet size={14} className="mr-1.5" />
                                        {exporting ? 'Mengekspor...' : 'Export Excel'}
                                    </Button>
                                    <Button
                                        id="recap-export-pdf"
                                        variant="outline"
                                        className="h-9 border-red-500 text-red-600 hover:bg-red-50"
                                        onClick={handleExportPdf}
                                        disabled={!recap?.length}
                                    >
                                        <FileDown size={14} className="mr-1.5" />
                                        Export PDF
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Stats Cards ── */}
                    {stats && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            {[
                                { icon: Users, label: 'Total Atlet', value: stats.totalAthletes, color: 'text-neutral-600', bg: 'bg-neutral-100' },
                                { icon: TrendingUp, label: 'Rata-rata Hadir', value: stats.avgRate + '%', color: 'text-blue-600', bg: 'bg-blue-100' },
                                { icon: UserCheck, label: 'Total Hadir', value: stats.totalPresent, color: 'text-green-600', bg: 'bg-green-100' },
                                { icon: AlertCircle, label: 'Total Sakit', value: stats.totalSick, color: 'text-yellow-600', bg: 'bg-yellow-100' },
                                { icon: FileDown, label: 'Total Izin', value: stats.totalExcused, color: 'text-blue-600', bg: 'bg-blue-100' },
                                { icon: UserX, label: 'Total Alpa', value: stats.totalAbsent, color: 'text-red-600', bg: 'bg-red-100' },
                            ].map(({ icon: Icon, label, value, color, bg }) => (
                                <Card key={label}>
                                    <CardContent className="p-3 flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                                            <Icon size={16} className={color} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 truncate">{label}</p>
                                            <p className="text-lg font-black text-neutral-800 dark:text-neutral-100">{value}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* ── Recap Table ── */}
                    <Card>
                        <CardHeader className="border-b px-5 py-3">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500">
                                Rekap Absensi — {monthLabel} {year}
                                {recap?.length > 0 && (
                                    <span className="ml-2 text-xs font-normal text-neutral-400 normal-case">({recap.length} atlet)</span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {recap?.length === 0 ? (
                                <div className="py-16 text-center text-sm text-neutral-400">
                                    Tidak ada data absensi untuk periode ini.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                                                <th className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-neutral-500 w-6">#</th>
                                                <th className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-neutral-500">Atlet</th>
                                                <th className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-neutral-500 hidden sm:table-cell">Dojo</th>
                                                <th className="text-center px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-neutral-500">Hadir</th>
                                                <th className="text-center px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-neutral-500">Sakit</th>
                                                <th className="text-center px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-neutral-500">Izin</th>
                                                <th className="text-center px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-neutral-500">Alpa</th>
                                                <th className="text-center px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-neutral-500">% Hadir</th>
                                                <th className="text-center px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-neutral-500 hidden md:table-cell">Lokasi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                            {(recap || []).map((row, i) => (
                                                <tr
                                                    key={row.id}
                                                    className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
                                                >
                                                    <td className="px-4 py-3 text-neutral-400 text-xs font-medium">{i + 1}</td>
                                                    <td className="px-4 py-3">
                                                        <p className="font-semibold text-neutral-800 dark:text-neutral-100">{row.full_name}</p>
                                                        <p className="text-xs text-neutral-500 font-mono">{row.athlete_code}</p>
                                                        {row.level_name && row.level_name !== '-' && (
                                                            <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium">
                                                                {row.level_name}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 text-xs hidden sm:table-cell">{row.dojo_name}</td>
                                                    <td className="px-3 py-3 text-center">
                                                        <span className="px-2 py-0.5 rounded-md text-xs font-black bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                            {row.present}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        <span className="px-2 py-0.5 rounded-md text-xs font-black bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                            {row.sick}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        <span className="px-2 py-0.5 rounded-md text-xs font-black bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                                            {row.excused}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        <span className="px-2 py-0.5 rounded-md text-xs font-black bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                                            {row.absent}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <RateBadge rate={row.rate} />
                                                            <RateBar rate={row.rate} />
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 text-center hidden md:table-cell">
                                                        {row.last_lat && row.last_lng ? (
                                                            <a
                                                                href={`https://www.google.com/maps?q=${row.last_lat},${row.last_lng}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                title={`Absensi terakhir: ${row.last_checkin ?? '-'}`}
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    setMapModal({
                                                                        show: true,
                                                                        lat: row.last_lat,
                                                                        lng: row.last_lng,
                                                                        title: `Lokasi Absensi: ${row.full_name}`
                                                                    });
                                                                }}
                                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 transition-colors cursor-pointer"
                                                            >
                                                                <MapPin size={10} />
                                                                {row.last_checkin ?? 'Lihat'}
                                                            </a>
                                                        ) : (
                                                            <span className="text-neutral-300 dark:text-neutral-700 text-xs">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>
            </div>

            {/* Map Modal */}
            <Modal
                show={mapModal.show}
                onClose={() => setMapModal(prev => ({ ...prev, show: false }))}
                maxWidth="lg"
                centered
            >
                <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                        <div className="flex items-center gap-2">
                            <MapPin className="text-athlix-red" size={20} />
                            <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-base">{mapModal.title}</h3>
                        </div>
                        <button
                            onClick={() => setMapModal(prev => ({ ...prev, show: false }))}
                            className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    {mapModal.lat && mapModal.lng && (
                        <div className="space-y-4">
                            <div className="w-full aspect-video rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
                                <iframe
                                    title="Location Map"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    allowFullScreen
                                    src={`https://maps.google.com/maps?q=${mapModal.lat},${mapModal.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                />
                            </div>
                            <div className="flex items-center justify-between gap-3 text-xs text-neutral-500">
                                <span>Koordinat: {mapModal.lat}, {mapModal.lng}</span>
                                <a
                                    href={`https://www.google.com/maps?q=${mapModal.lat},${mapModal.lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-athlix-red hover:underline font-bold"
                                >
                                    Buka di Google Maps
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </AdminLayout>
    );
}