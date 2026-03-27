import PwaLayout from '@/Layouts/PwaLayout';
import { Head, router } from '@inertiajs/react';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { ScanLine, Camera, Loader2, AlertTriangle, Upload } from 'lucide-react';
import { Skeleton } from '@/Components/ui/skeleton';
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function Index({ auth, athlete, attendanceLog = [], todayAttendance = null, flash }) {
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [scanError, setScanError] = useState(null);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [action, setAction] = useState('checkin');
    const [checkInMood, setCheckInMood] = useState('semangat');
    const [checkInNote, setCheckInNote] = useState('');
    const [absenceReason, setAbsenceReason] = useState('');
    const [absenceDocument, setAbsenceDocument] = useState(null);
    const [statusResult, setStatusResult] = useState(null);
    const [statusSubmitting, setStatusSubmitting] = useState(false);
    const [showPostTrainingForm, setShowPostTrainingForm] = useState(false);
    const [postTrainingMoodRating, setPostTrainingMoodRating] = useState(7);
    const [postTrainingLoadRating, setPostTrainingLoadRating] = useState(7);
    const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

    const scannerRef = useRef(null);

    const stopScanner = () => {
        if (scannerRef.current) {
            scannerRef.current.stop().catch(() => {}).finally(() => setScanning(false));
            return;
        }

        setScanning(false);
    };

    const startScanner = async () => {
        setScanResult(null);
        setScanError(null);
        setStatusResult(null);
        setPermissionDenied(false);
        setScanning(true);

        try {
            await navigator.mediaDevices.getUserMedia({ video: true });

            const html5QrCode = new Html5Qrcode('qr-reader-dojo');
            scannerRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: 'environment' },
                { fps: 15, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    html5QrCode.stop().then(() => {
                        setScanning(false);
                        router.post(route('attendance.scan-dojo'), {
                            athlete_code: athlete?.athlete_code,
                            dojo_payload: decodedText,
                            action,
                            check_in_feedback: action === 'checkin' ? checkInNote : '',
                            check_in_mood: action === 'checkin' ? checkInMood : '',
                            athlete_feedback: '',
                            athlete_mood: '',
                        }, {
                            preserveScroll: true,
                            onSuccess: () => {
                                if (action === 'checkout') {
                                    setScanResult('checkout');
                                    setShowPostTrainingForm(true);
                                } else {
                                    setScanResult('checkin');
                                }
                                setCheckInNote('');
                                setCheckInMood('semangat');
                            },
                            onError: (errors) => {
                                setScanError(errors.dojo_payload || errors.athlete_code || 'QR dojo tidak valid atau absensi gagal.');
                            },
                        });
                    });
                },
                () => {}
            );
        } catch (err) {
            setScanning(false);
            if (err.name === 'NotAllowedError') {
                setPermissionDenied(true);
                return;
            }

            setScanError('Gagal mengakses kamera. Pastikan kamera tersedia.');
        }
    };

    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => {});
            }
        };
    }, []);

    useEffect(() => {
        const feedbackPending = Boolean(
            todayAttendance?.check_out_at
            && (!todayAttendance?.post_training_mood_rating || !todayAttendance?.post_training_load_rating)
        );
        setShowPostTrainingForm(feedbackPending);
    }, [todayAttendance?.id, todayAttendance?.check_out_at, todayAttendance?.post_training_mood_rating, todayAttendance?.post_training_load_rating]);

    useEffect(() => {
        if (flash?.success && (flash.success.toLowerCase().includes('check-in') || flash.success.toLowerCase().includes('check-out'))) {
            setScanResult(action === 'checkout' ? 'checkout' : 'checkin');
        }
    }, [flash]);

    const submitAbsence = (status) => {
        if (!absenceDocument) {
            setScanError('Status izin atau sakit wajib upload dokumen pendukung.');
            return;
        }

        setStatusSubmitting(true);
        router.post(route('attendance.mark-status'), {
            athlete_code: athlete?.athlete_code,
            status,
            absence_reason: absenceReason,
            absence_document: absenceDocument,
        }, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setStatusResult(status === 'sick' ? 'Status sakit berhasil dikirim.' : 'Status izin berhasil dikirim.');
                setAbsenceReason('');
                setAbsenceDocument(null);
            },
            onError: (errors) => {
                setScanError(errors.status || errors.athlete_code || errors.absence_document || 'Gagal mengirim status absensi.');
            },
            onFinish: () => setStatusSubmitting(false),
        });
    };

    const submitPostTrainingFeedback = (event) => {
        event.preventDefault();
        setFeedbackSubmitting(true);
        router.post(route('attendance.post-training-feedback'), {
            athlete_code: athlete?.athlete_code,
            mood_rating: Number(postTrainingMoodRating),
            load_rating: Number(postTrainingLoadRating),
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setShowPostTrainingForm(false);
                setScanResult('feedback');
            },
            onError: (errors) => {
                setScanError(errors.mood_rating || errors.load_rating || 'Gagal mengirim feedback pasca latihan.');
            },
            onFinish: () => setFeedbackSubmitting(false),
        });
    };

    if (!athlete) {
        return (
            <PwaLayout user={auth?.user} header="Scan Absensi">
                <div className="space-y-6 pb-24">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-80 w-full" />
                </div>
            </PwaLayout>
        );
    }

    return (
        <PwaLayout user={auth?.user} header="Scan Absensi">
            <Head title="Scan Absensi" />

            <div className="space-y-5 pb-24">
                {scanResult === 'feedback' && (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                        Feedback pasca latihan berhasil dikirim.
                    </div>
                )}

                {scanError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{scanError}</div>
                )}

                {statusResult && (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                        {statusResult}
                    </div>
                )}

                <div className="w-full max-w-md mx-auto space-y-4">
                    <div className="text-center space-y-1">
                        <h2 className="text-xl font-black uppercase tracking-tighter">Scan QR Dojo</h2>
                        <p className="text-sm text-neutral-500">{athlete.full_name} ({athlete.athlete_code})</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <Button variant={action === 'checkin' ? 'default' : 'outline'} onClick={() => setAction('checkin')}>Check-in</Button>
                        <Button variant={action === 'checkout' ? 'default' : 'outline'} onClick={() => setAction('checkout')}>Check-out</Button>
                    </div>

                    {action === 'checkin' && (
                        <Card className="p-4 space-y-3">
                            <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Form Check-in</p>
                            <select className="w-full rounded-lg border px-3 py-2 text-sm" value={checkInMood} onChange={(e) => setCheckInMood(e.target.value)}>
                                <option value="semangat">Semangat</option>
                                <option value="normal">Normal</option>
                                <option value="lelah">Lelah</option>
                                <option value="drop">Drop</option>
                            </select>
                            <textarea
                                className="w-full rounded-lg border px-3 py-2 text-sm min-h-20"
                                value={checkInNote}
                                onChange={(e) => setCheckInNote(e.target.value)}
                                placeholder="Catatan kondisi awal sebelum latihan..."
                            />
                        </Card>
                    )}

                    <Card className="p-4 space-y-3">
                        <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Tidak Hadir (Izin / Sakit)</p>
                        <textarea
                            className="w-full rounded-lg border px-3 py-2 text-sm min-h-16"
                            placeholder="Alasan izin/sakit"
                            value={absenceReason}
                            onChange={(e) => setAbsenceReason(e.target.value)}
                        />
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-1">
                                <Upload size={12} /> Dokumen Pendukung (wajib untuk izin/sakit)
                            </label>
                            <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.pdf"
                                onChange={(event) => setAbsenceDocument(event.target.files?.[0] || null)}
                                className="w-full text-xs"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Button type="button" variant="outline" disabled={statusSubmitting} onClick={() => submitAbsence('excused')}>Izin</Button>
                            <Button type="button" variant="outline" disabled={statusSubmitting} onClick={() => submitAbsence('sick')}>Sakit</Button>
                        </div>
                    </Card>

                    {showPostTrainingForm && (
                        <Card className="p-4 space-y-3 border-athlix-red/30 bg-athlix-red/5">
                            <p className="text-xs font-black uppercase tracking-widest text-athlix-red">Feedback Pasca Latihan (Wajib)</p>
                            <form onSubmit={submitPostTrainingFeedback} className="space-y-3">
                                <label className="block text-xs font-bold uppercase tracking-widest text-neutral-600 space-y-1">
                                    Kondisi Mood (1-10)
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={postTrainingMoodRating}
                                        onChange={(event) => setPostTrainingMoodRating(event.target.value)}
                                        className="w-full rounded-lg border px-3 py-2 text-sm"
                                        required
                                    />
                                </label>
                                <label className="block text-xs font-bold uppercase tracking-widest text-neutral-600 space-y-1">
                                    Latihan Terasa Berat/Tidak (1-10)
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={postTrainingLoadRating}
                                        onChange={(event) => setPostTrainingLoadRating(event.target.value)}
                                        className="w-full rounded-lg border px-3 py-2 text-sm"
                                        required
                                    />
                                </label>
                                <Button type="submit" disabled={feedbackSubmitting} className="w-full">
                                    {feedbackSubmitting ? 'Mengirim...' : 'Kirim Feedback'}
                                </Button>
                            </form>
                        </Card>
                    )}

                    <Card className="overflow-hidden border-neutral-200/80 aspect-square relative shadow-lg">
                        <div id="qr-reader-dojo" className="w-full h-full bg-neutral-900"></div>
                        {!scanning && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-100 space-y-4">
                                <div className="w-20 h-20 rounded-2xl bg-neutral-200 flex items-center justify-center"><Camera size={32} className="text-neutral-400" /></div>
                                <p className="text-sm text-neutral-400 font-medium">Arahkan ke QR yang ditampilkan oleh Sensei</p>
                            </div>
                        )}
                    </Card>

                    {!scanning ? (
                        <Button onClick={startScanner} className="w-full h-14 text-sm font-black uppercase tracking-widest gap-3 rounded-2xl">
                            <ScanLine size={20} />Buka Kamera
                        </Button>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center justify-center gap-2 text-sm text-neutral-500"><Loader2 size={16} className="animate-spin text-athlix-red" /><span className="text-sm font-bold uppercase tracking-widest">Memindai QR Dojo...</span></div>
                            <Button onClick={stopScanner} variant="outline" className="w-full h-12 rounded-2xl">Batal</Button>
                        </div>
                    )}

                    {permissionDenied && (
                        <div className="text-center space-y-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                            <div className="w-12 h-12 mx-auto rounded-full bg-yellow-100 flex items-center justify-center"><AlertTriangle size={24} className="text-yellow-600" /></div>
                            <p className="text-sm text-yellow-700">Izin kamera ditolak. Izinkan kamera agar bisa scan QR dojo.</p>
                            <Button onClick={() => { setPermissionDenied(false); startScanner(); }} variant="outline">Coba Lagi</Button>
                        </div>
                    )}
                </div>

                <Card className="p-4 space-y-3">
                    <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Log Absensi Terbaru</p>
                    {(attendanceLog || []).length > 0 ? (
                        <div className="space-y-2">
                            {attendanceLog.map((log) => (
                                <div key={log.id} className="rounded-xl border border-neutral-200 px-3 py-2 text-xs space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold">{log.date}</span>
                                        <span className="uppercase font-black text-athlix-red">{log.status}</span>
                                    </div>
                                    <p className="text-neutral-500">Check-in: {log.check_in_at || '-'} | Check-out: {log.check_out_at || '-'}</p>
                                    {(log.post_training_mood_rating || log.post_training_load_rating) && (
                                        <p className="text-neutral-500">Mood: {log.post_training_mood_rating || '-'} /10 | Beban: {log.post_training_load_rating || '-'} /10</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-neutral-400">Belum ada riwayat absensi.</p>
                    )}
                </Card>
            </div>
        </PwaLayout>
    );
}
