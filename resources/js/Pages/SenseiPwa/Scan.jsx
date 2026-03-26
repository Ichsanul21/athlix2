import PwaLayout from '@/Layouts/PwaLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { QRCodeSVG } from 'qrcode.react';
import { useMemo, useState } from 'react';
import { CalendarCheck2, ArrowRight } from 'lucide-react';

const statusLabel = {
    present: 'Hadir',
    sick: 'Sakit',
    excused: 'Izin',
};

export default function Scan({ auth, dojo, dojoQr, athletes = [], todayAttendances = [] }) {
    const { flash, errors } = usePage().props;
    const [scanForm, setScanForm] = useState({
        athlete_code: '',
        action: 'checkin',
        check_in_mood: 'normal',
        check_in_feedback: '',
        athlete_mood: 'normal',
        athlete_feedback: '',
    });
    const [statusForm, setStatusForm] = useState({
        athlete_code: '',
        status: 'excused',
        absence_reason: '',
    });
    const [submittingScan, setSubmittingScan] = useState(false);
    const [submittingStatus, setSubmittingStatus] = useState(false);

    const sortedAthletes = useMemo(
        () => [...athletes].sort((a, b) => String(a.full_name || '').localeCompare(String(b.full_name || ''))),
        [athletes],
    );

    const submitScan = (event) => {
        event.preventDefault();
        if (!dojoQr?.payload) {
            return;
        }

        setSubmittingScan(true);
        router.post(
            route('attendance.scan-dojo'),
            {
                athlete_code: scanForm.athlete_code,
                dojo_payload: dojoQr.payload,
                action: scanForm.action,
                check_in_mood: scanForm.action === 'checkin' ? scanForm.check_in_mood : null,
                check_in_feedback: scanForm.action === 'checkin' ? scanForm.check_in_feedback : null,
                athlete_mood: scanForm.action === 'checkout' ? scanForm.athlete_mood : null,
                athlete_feedback: scanForm.action === 'checkout' ? scanForm.athlete_feedback : null,
            },
            {
                preserveScroll: true,
                onFinish: () => setSubmittingScan(false),
                onSuccess: () => {
                    setScanForm((prev) => ({
                        ...prev,
                        check_in_feedback: '',
                        athlete_feedback: '',
                    }));
                },
            },
        );
    };

    const submitStatus = (event) => {
        event.preventDefault();

        setSubmittingStatus(true);
        router.post(route('attendance.mark-status'), statusForm, {
            preserveScroll: true,
            onFinish: () => setSubmittingStatus(false),
            onSuccess: () => {
                setStatusForm((prev) => ({
                    ...prev,
                    absence_reason: '',
                }));
            },
        });
    };

    return (
        <PwaLayout user={auth?.user} header="Absensi Sensei">
            <Head title="Absensi Sensei PWA" />

            <div className="space-y-5 pb-24">
                {flash?.success && (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{flash.success}</div>
                )}
                {flash?.error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{flash.error}</div>
                )}
                {errors && Object.keys(errors).length > 0 && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {Object.values(errors)[0]}
                    </div>
                )}

                <Card className="border-neutral-200">
                    <CardContent className="p-4 space-y-3">
                        <p className="text-xs uppercase tracking-widest text-neutral-500 font-black">QR Dojo Aktif</p>
                        {dojoQr?.payload ? (
                            <div className="space-y-3">
                                <div className="mx-auto w-fit rounded-xl border border-neutral-200 bg-white p-3">
                                    <QRCodeSVG value={dojoQr.payload} size={180} />
                                </div>
                                <p className="text-sm text-neutral-600 text-center">
                                    {dojo?.name || dojoQr?.dojo_name || '-'}
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-neutral-500">QR dojo belum tersedia.</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-neutral-200">
                    <CardContent className="p-4 space-y-3">
                        <p className="text-xs uppercase tracking-widest text-neutral-500 font-black">Check-in / Check-out</p>
                        <form onSubmit={submitScan} className="space-y-3">
                            <select
                                value={scanForm.athlete_code}
                                onChange={(event) => setScanForm((prev) => ({ ...prev, athlete_code: event.target.value }))}
                                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                                required
                            >
                                <option value="">Pilih atlet</option>
                                {sortedAthletes.map((athlete) => (
                                    <option key={athlete.id} value={athlete.athlete_code}>
                                        {athlete.full_name} ({athlete.athlete_code})
                                    </option>
                                ))}
                            </select>

                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setScanForm((prev) => ({ ...prev, action: 'checkin' }))}
                                    className={`rounded-xl border px-3 py-2 text-sm font-black ${
                                        scanForm.action === 'checkin' ? 'border-athlix-red bg-athlix-red text-white' : 'border-neutral-200'
                                    }`}
                                >
                                    Check-in
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setScanForm((prev) => ({ ...prev, action: 'checkout' }))}
                                    className={`rounded-xl border px-3 py-2 text-sm font-black ${
                                        scanForm.action === 'checkout' ? 'border-athlix-red bg-athlix-red text-white' : 'border-neutral-200'
                                    }`}
                                >
                                    Check-out
                                </button>
                            </div>

                            {scanForm.action === 'checkin' ? (
                                <>
                                    <select
                                        value={scanForm.check_in_mood}
                                        onChange={(event) => setScanForm((prev) => ({ ...prev, check_in_mood: event.target.value }))}
                                        className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                                    >
                                        <option value="semangat">Semangat</option>
                                        <option value="normal">Normal</option>
                                        <option value="lelah">Lelah</option>
                                        <option value="kurang-fokus">Kurang Fokus</option>
                                    </select>
                                    <textarea
                                        value={scanForm.check_in_feedback}
                                        onChange={(event) => setScanForm((prev) => ({ ...prev, check_in_feedback: event.target.value }))}
                                        className="w-full min-h-20 rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                                        placeholder="Catatan check-in (opsional)"
                                    />
                                </>
                            ) : (
                                <>
                                    <select
                                        value={scanForm.athlete_mood}
                                        onChange={(event) => setScanForm((prev) => ({ ...prev, athlete_mood: event.target.value }))}
                                        className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                                    >
                                        <option value="semangat">Semangat</option>
                                        <option value="normal">Normal</option>
                                        <option value="lelah">Lelah</option>
                                        <option value="kurang-fokus">Kurang Fokus</option>
                                    </select>
                                    <textarea
                                        value={scanForm.athlete_feedback}
                                        onChange={(event) => setScanForm((prev) => ({ ...prev, athlete_feedback: event.target.value }))}
                                        className="w-full min-h-20 rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                                        placeholder="Catatan check-out (opsional)"
                                    />
                                </>
                            )}

                            <button
                                type="submit"
                                disabled={submittingScan}
                                className="w-full rounded-xl bg-athlix-red px-4 py-2.5 text-sm font-black text-white disabled:opacity-70"
                            >
                                {submittingScan ? 'Menyimpan...' : 'Simpan Absensi'}
                            </button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="border-neutral-200">
                    <CardContent className="p-4 space-y-3">
                        <p className="text-xs uppercase tracking-widest text-neutral-500 font-black">Input Izin / Sakit</p>
                        <form onSubmit={submitStatus} className="space-y-3">
                            <select
                                value={statusForm.athlete_code}
                                onChange={(event) => setStatusForm((prev) => ({ ...prev, athlete_code: event.target.value }))}
                                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                                required
                            >
                                <option value="">Pilih atlet</option>
                                {sortedAthletes.map((athlete) => (
                                    <option key={athlete.id} value={athlete.athlete_code}>
                                        {athlete.full_name} ({athlete.athlete_code})
                                    </option>
                                ))}
                            </select>

                            <select
                                value={statusForm.status}
                                onChange={(event) => setStatusForm((prev) => ({ ...prev, status: event.target.value }))}
                                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                            >
                                <option value="excused">Izin</option>
                                <option value="sick">Sakit</option>
                            </select>

                            <textarea
                                value={statusForm.absence_reason}
                                onChange={(event) => setStatusForm((prev) => ({ ...prev, absence_reason: event.target.value }))}
                                className="w-full min-h-20 rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                                placeholder="Alasan (opsional)"
                            />

                            <button
                                type="submit"
                                disabled={submittingStatus}
                                className="w-full rounded-xl border border-athlix-red px-4 py-2.5 text-sm font-black text-athlix-red disabled:opacity-70"
                            >
                                {submittingStatus ? 'Mengirim...' : 'Kirim Status'}
                            </button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="border-neutral-200">
                    <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-xs uppercase tracking-widest text-neutral-500 font-black">Log Hari Ini</p>
                            <span className="text-xs text-neutral-500">{todayAttendances.length} data</span>
                        </div>
                        {todayAttendances.length > 0 ? (
                            <div className="space-y-2">
                                {todayAttendances.map((item) => (
                                    <div key={item.id} className="rounded-xl border border-neutral-200 px-3 py-2">
                                        <p className="text-sm font-semibold">{item.athlete_name}</p>
                                        <p className="text-xs text-neutral-500">{item.athlete_code}</p>
                                        <p className="text-xs text-neutral-500 mt-1">
                                            {statusLabel[item.status] || item.status} | IN {item.check_in_at || '-'} | OUT {item.check_out_at || '-'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-neutral-500">Belum ada absensi hari ini.</p>
                        )}
                    </CardContent>
                </Card>

                <Link
                    href={route('attendance.index')}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-athlix-red px-4 py-3 text-sm font-black text-white"
                >
                    <CalendarCheck2 size={16} />
                    Buka Absensi Dashboard
                    <ArrowRight size={16} />
                </Link>
            </div>
        </PwaLayout>
    );
}

