import PwaLayout from '@/Layouts/PwaLayout';
import { Head, router } from '@inertiajs/react';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { ScanLine, Camera, Loader2, AlertTriangle, Upload, X, FileText, Thermometer } from 'lucide-react';
import { Skeleton } from '@/Components/ui/skeleton';
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { submitWellnessPayload } from '@/lib/offlineWellnessSync';
import { createPortal } from 'react-dom';

export default function Index({ auth, athlete, attendanceLog = [], todayAttendance = null, flash }) {
    const scannerRef = useRef(null);

    const [scanning, setScanning] = useState(false);
    const [scanError, setScanError] = useState(null);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [scanSuccessMsg, setScanSuccessMsg] = useState(null);

    const [selectedAction, setSelectedAction] = useState('checkin');

    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [preMoodRating, setPreMoodRating] = useState(7);
    const [postMoodRating, setPostMoodRating] = useState(7);
    const [fatigueRating, setFatigueRating] = useState(7);
    const [rpeDuration, setRpeDuration] = useState('90');
    const [rpeNote, setRpeNote] = useState('');
    const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

    const [showAbsenceModal, setShowAbsenceModal] = useState(false);
    const [absenceType, setAbsenceType] = useState(null);
    const [absenceReason, setAbsenceReason] = useState('');
    const [absenceDocument, setAbsenceDocument] = useState(null);
    const [absenceSubmitting, setAbsenceSubmitting] = useState(false);

    const [statusResult, setStatusResult] = useState(null);

    const isSessionComplete = Boolean(
        todayAttendance?.check_in_at
        && todayAttendance?.check_out_at
        && todayAttendance?.post_training_mood_rating
        && todayAttendance?.post_training_load_rating
    );

    useEffect(() => {
        if (todayAttendance?.check_in_at && !todayAttendance?.check_out_at) {
            setSelectedAction('checkout');
        } else if (!todayAttendance?.check_in_at) {
            setSelectedAction('checkin');
        }
    }, [todayAttendance]);

    useEffect(() => {
        if (
            todayAttendance?.check_in_at
            && todayAttendance?.check_out_at
            && (!todayAttendance?.post_training_mood_rating || !todayAttendance?.post_training_load_rating)
        ) {
            setShowFeedbackModal(true);
        }
    }, [todayAttendance]);

    useEffect(() => {
        if (flash?.success) {
            setScanSuccessMsg(flash.success);
            setTimeout(() => setScanSuccessMsg(null), 4000);
        }
        if (flash?.error) {
            setScanError(flash.error);
            setTimeout(() => setScanError(null), 4000);
        }
    }, [flash]);

    const killVideoStreams = () => {
        const container = document.getElementById('qr-reader-dojo');
        if (container) {
            container.querySelectorAll('video').forEach((video) => {
                if (video.srcObject) {
                    video.srcObject.getTracks().forEach((track) => track.stop());
                    video.srcObject = null;
                }
            });
            container.innerHTML = '';
        }
    };

    const stopScanner = async () => {
        const currentScanner = scannerRef.current;
        scannerRef.current = null;
        killVideoStreams();
        if (currentScanner) {
            try {
                if (currentScanner.isScanning) {
                    await currentScanner.stop();
                }
            } catch (err) {
                console.error('Gagal menghentikan scanner:', err);
            }
        }
        killVideoStreams();
        setScanning(false);
    };

    const startScanner = async () => {
        setScanError(null);
        setScanSuccessMsg(null);
        setPermissionDenied(false);
        setScanning(true);

        try {
            await navigator.mediaDevices.getUserMedia({ video: true });
            killVideoStreams();
            const html5QrCode = new Html5Qrcode('qr-reader-dojo');
            scannerRef.current = html5QrCode;
            await html5QrCode.start(
                { facingMode: 'environment' },
                { fps: 15, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    stopScanner().then(() => {
                        const action = selectedAction;

                        router.post(route('attendance.scan-dojo'), {
                            athlete_code: athlete?.athlete_code,
                            dojo_payload: decodedText,
                            action,
                            check_in_feedback: '',
                            check_in_mood: '',
                            check_in_document: null,
                            athlete_feedback: '',
                            athlete_mood: '',
                        }, {
                            preserveScroll: true,
                            onSuccess: () => {
                                if (action === 'checkin') {
                                    setScanSuccessMsg('Check-in berhasil!');
                                } else {
                                    setScanSuccessMsg('Check-out berhasil!');
                                    setTimeout(() => setShowFeedbackModal(true), 600);
                                }
                            },
                            onError: (errors) => {
                                setScanError(errors.dojo_payload || errors.athlete_code || 'QR club tidak valid atau absensi gagal.');
                            },
                        });
                    });
                },
                () => {}
            );
        } catch (err) {
            killVideoStreams();
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
            killVideoStreams();
            if (scannerRef.current?.isScanning) {
                scannerRef.current.stop().catch(() => {});
            }
        };
    }, []);

    const submitFeedback = async (e) => {
        e.preventDefault();
        setFeedbackSubmitting(true);

        const parsedDuration = Number(rpeDuration);
        if (parsedDuration > 0) {
            try {
                await submitWellnessPayload('rpe', {
                    session_date: new Date().toISOString().slice(0, 10),
                    duration_minutes: parsedDuration,
                    rpe_score: Number(fatigueRating),
                    notes: rpeNote || null,
                    sync_status: navigator.onLine ? 'synced' : 'pending',
                });
            } catch (err) {
                console.error('Failed to sync ACWR RPE data', err);
            }
        }

        router.post(route('attendance.post-training-feedback'), {
            athlete_code: athlete?.athlete_code,
            mood_rating: Number(postMoodRating),
            load_rating: Number(fatigueRating),
            pre_mood_rating: Number(preMoodRating),
            notes: rpeNote,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setShowFeedbackModal(false);
                setScanSuccessMsg('Feedback pasca latihan berhasil dikirim.');
                setTimeout(() => setScanSuccessMsg(null), 4000);
            },
            onError: (errors) => {
                setScanError(errors.mood_rating || errors.load_rating || 'Gagal mengirim feedback.');
            },
            onFinish: () => setFeedbackSubmitting(false),
        });
    };

    const openAbsenceModal = (type) => {
        setAbsenceType(type);
        setAbsenceReason('');
        setAbsenceDocument(null);
        setShowAbsenceModal(true);
    };

    const submitAbsence = () => {
        if (!absenceReason.trim()) {
            setScanError('Alasan wajib diisi.');
            setTimeout(() => setScanError(null), 3000);
            return;
        }

        setAbsenceSubmitting(true);
        router.post(route('attendance.mark-status'), {
            athlete_code: athlete?.athlete_code,
            status: absenceType,
            absence_reason: absenceReason,
            absence_document: absenceDocument,
        }, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setShowAbsenceModal(false);
                setStatusResult(absenceType === 'sick' ? 'Status sakit berhasil dikirim.' : 'Status izin berhasil dikirim.');
                setTimeout(() => setStatusResult(null), 4000);
            },
            onError: (errors) => {
                setScanError(errors.status || errors.athlete_code || 'Gagal mengirim status absensi.');
            },
            onFinish: () => setAbsenceSubmitting(false),
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

            <div className="space-y-4 pb-24">
                {/* Alerts */}
                {scanError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{scanError}</div>
                )}
                {scanSuccessMsg && (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{scanSuccessMsg}</div>
                )}
                {statusResult && (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{statusResult}</div>
                )}

                {/* Info atlet */}
                <p className="text-xs text-neutral-500 text-center font-medium">{athlete.full_name} — {athlete.athlete_code}</p>

                {/* ===== PILIHAN CHECK-IN / CHECK-OUT DI ATAS ===== */}
                {auth?.user?.role !== 'parent' && (
                    <Card className="p-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Pilih Aksi Absensi</p>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setSelectedAction('checkin')}
                                className={`relative flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-black uppercase tracking-wider transition-all ${
                                    selectedAction === 'checkin'
                                        ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                                        : 'border-neutral-200 bg-white text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-500'
                                }`}
                            >
                                <span className={`w-2.5 h-2.5 rounded-full ${
                                    selectedAction === 'checkin' ? 'bg-green-500' : 'bg-neutral-300 dark:bg-neutral-600'
                                }`} />
                                Check-in
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedAction('checkout')}
                                className={`relative flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-black uppercase tracking-wider transition-all ${
                                    selectedAction === 'checkout'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                                        : 'border-neutral-200 bg-white text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-500'
                                }`}
                            >
                                <span className={`w-2.5 h-2.5 rounded-full ${
                                    selectedAction === 'checkout' ? 'bg-blue-500' : 'bg-neutral-300 dark:bg-neutral-600'
                                }`} />
                                Check-out
                            </button>
                        </div>
                        {todayAttendance?.check_in_at && !todayAttendance?.check_out_at && (
                            <p className="text-[11px] text-neutral-400 mt-2 text-center">
                                Sudah check-in pukul <span className="font-bold text-neutral-600 dark:text-neutral-300">{todayAttendance.check_in_at}</span> — disarankan <span className="font-black text-blue-600 dark:text-blue-400">check-out</span>
                            </p>
                        )}
                        {!todayAttendance?.check_in_at && (
                            <p className="text-[11px] text-neutral-400 mt-2 text-center">
                                Belum ada absensi hari ini — disarankan <span className="font-black text-green-600 dark:text-green-400">check-in</span>
                            </p>
                        )}
                    </Card>
                )}

                {/* ===== CAMERA SCANNER ===== */}
                <Card className="overflow-hidden border-neutral-200/80 shadow-lg">
                    <div className="relative w-full max-h-[50vh] aspect-[4/3] mx-auto">
                        <div id="qr-reader-dojo" className="w-full h-full bg-neutral-900"></div>
                        {!scanning && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-100 space-y-3">
                                <div className="w-20 h-20 rounded-2xl bg-neutral-200 flex items-center justify-center">
                                    <Camera size={32} className="text-neutral-400" />
                                </div>
                                <p className="text-sm text-neutral-400 font-medium px-8 text-center">Arahkan kamera ke QR yang ditampilkan oleh Sensei</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Permission denied */}
                {permissionDenied && (
                    <div className="text-center space-y-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                        <div className="w-12 h-12 mx-auto rounded-full bg-yellow-100 flex items-center justify-center">
                            <AlertTriangle size={24} className="text-yellow-600" />
                        </div>
                        <p className="text-sm text-yellow-700">Izin kamera ditolak. Izinkan kamera untuk scan QR club.</p>
                        <Button onClick={() => { setPermissionDenied(false); startScanner(); }} variant="outline" size="sm">Coba Lagi</Button>
                    </div>
                )}

                {/* Status hari ini */}
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full shrink-0 ${
                            isSessionComplete ? 'bg-green-500' :
                            todayAttendance?.check_in_at ? 'bg-blue-500 animate-pulse' :
                            'bg-neutral-300'
                        }`} />
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold">
                                {isSessionComplete
                                    ? 'Sesi hari ini selesai'
                                    : todayAttendance?.check_in_at
                                        ? `Check-in tercatat pukul ${todayAttendance.check_in_at}`
                                        : 'Belum absensi hari ini'}
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Tombol scan */}
                {auth?.user?.role !== 'parent' && (
                    !scanning ? (
                        <Button
                            onClick={startScanner}
                            disabled={isSessionComplete}
                            className="w-full h-14 text-sm font-black uppercase tracking-widest gap-3 rounded-2xl disabled:opacity-40"
                        >
                            <ScanLine size={20} />
                            {isSessionComplete
                                ? 'Sesi Selesai'
                                : `Buka Kamera — ${selectedAction === 'checkin' ? 'Check-in' : 'Check-out'}`}
                        </Button>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center justify-center gap-2 text-sm text-neutral-500">
                                <Loader2 size={16} className="animate-spin text-athlix-red" />
                                <span className="text-sm font-bold uppercase tracking-widest">Memindai QR Club...</span>
                            </div>
                            <Button onClick={stopScanner} variant="outline" className="w-full h-12 rounded-2xl">Batal</Button>
                        </div>
                    )
                )}

                {/* ===== TOMBOL IZIN & SAKIT DI BAWAH KAMERA ===== */}
                {auth?.user?.role !== 'parent' && !isSessionComplete && (
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-12 gap-2 rounded-2xl text-sm font-bold"
                            onClick={() => openAbsenceModal('sick')}
                        >
                            <Thermometer size={16} />Sakit
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-12 gap-2 rounded-2xl text-sm font-bold"
                            onClick={() => openAbsenceModal('excused')}
                        >
                            <FileText size={16} />Izin
                        </Button>
                    </div>
                )}

                {/* ===== LOG ABSENSI DETAIL ===== */}
                <Card className="p-4 space-y-3">
                    <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Log Absensi Terbaru</p>
                    {(attendanceLog || []).length > 0 ? (
                        <div className="space-y-2">
                            {attendanceLog.map((log) => (
                                <div key={log.id} className="rounded-xl border border-neutral-200 px-3 py-2.5 space-y-1.5">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <span className="font-bold text-sm block">{log.date}</span>
                                            {/* Nama Sesi akan muncul di sini jika sudah ada kolom & datanya di DB */}
                                            {log.session_title && (
                                                <span className="text-xs font-semibold text-athlix-red block mt-0.5 truncate">{log.session_title}</span>
                                            )}
                                        </div>
                                        <span className={`shrink-0 text-[11px] font-black uppercase px-2 py-0.5 rounded-md text-white ${
                                            log.status === 'present' ? 'bg-green-500' :
                                            log.status === 'sick' ? 'bg-orange-500' :
                                            log.status === 'excused' ? 'bg-blue-500' :
                                            'bg-neutral-400'
                                        }`}>{log.status}</span>
                                    </div>

                                    <div className="text-xs text-neutral-500 space-y-0.5">
                                        <p>Check-in: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{log.check_in_at || '-'}</span></p>
                                        <p>Check-out: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{log.check_out_at || '-'}</span></p>
                                    </div>

                                    {(log.post_training_mood_rating || log.post_training_load_rating) && (
                                        <div className="text-xs text-neutral-500 flex gap-4">
                                            <span>Mood: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{log.post_training_mood_rating || '-'}/10</span></span>
                                            <span>Beban: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{log.post_training_load_rating || '-'}/10</span></span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-neutral-400">Belum ada riwayat absensi.</p>
                    )}
                </Card>
            </div>

            {/* ===== MODAL FEEDBACK PASCA LATIHAN ===== */}
            {showFeedbackModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !feedbackSubmitting && setShowFeedbackModal(false)} />
                    <div className="relative w-full max-w-sm bg-white dark:bg-neutral-950 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
                        <div className="p-5 space-y-5 overflow-y-auto flex-1">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-athlix-red">Wajib Diisi</p>
                                    <h3 className="text-lg font-black leading-tight mt-1">Feedback Pasca Latihan</h3>
                                </div>
                                <button
                                    onClick={() => !feedbackSubmitting && setShowFeedbackModal(false)}
                                    className="shrink-0 p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={submitFeedback} className="space-y-4">
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Mood Sebelum Latihan</p>
                                        <span className="text-base font-black text-athlix-red">{preMoodRating}/10</span>
                                    </div>
                                    <input type="range" min="1" max="10" value={preMoodRating} onChange={(e) => setPreMoodRating(Number(e.target.value))} className="w-full accent-athlix-red cursor-pointer" />
                                    <div className="flex justify-between text-[10px] text-neutral-400 font-bold"><span>1 Sangat Rendah</span><span>10 Sangat Tinggi</span></div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Mood Setelah Latihan</p>
                                        <span className="text-base font-black text-athlix-red">{postMoodRating}/10</span>
                                    </div>
                                    <input type="range" min="1" max="10" value={postMoodRating} onChange={(e) => setPostMoodRating(Number(e.target.value))} className="w-full accent-athlix-red cursor-pointer" />
                                    <div className="flex justify-between text-[10px] text-neutral-400 font-bold"><span>1 Sangat Rendah</span><span>10 Sangat Tinggi</span></div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Tingkat Kelelahan</p>
                                        <span className="text-base font-black text-athlix-red">{fatigueRating}/10</span>
                                    </div>
                                    <input type="range" min="1" max="10" value={fatigueRating} onChange={(e) => setFatigueRating(Number(e.target.value))} className="w-full accent-athlix-red cursor-pointer" />
                                    <div className="flex justify-between text-[10px] text-neutral-400 font-bold"><span>1 Tidak Capek</span><span>10 Sangat Capek</span></div>
                                </div>

                                <label className="block space-y-1">
                                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Durasi Latihan (menit)</p>
                                    <input type="number" min="1" max="600" value={rpeDuration} onChange={(e) => setRpeDuration(e.target.value)} className="w-full rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm" required />
                                </label>

                                <label className="block space-y-1">
                                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Catatan (opsional)</p>
                                    <textarea className="w-full border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900 px-3 py-2 min-h-16 text-sm" placeholder="Catatan kelelahan / sesi..." value={rpeNote} onChange={(e) => setRpeNote(e.target.value)} />
                                </label>

                                <Button type="submit" disabled={feedbackSubmitting} className="w-full h-12 font-black uppercase tracking-widest rounded-2xl">
                                    {feedbackSubmitting ? 'Mengirim...' : 'Kirim Feedback'}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ===== MODAL IZIN / SAKIT ===== */}
            {showAbsenceModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !absenceSubmitting && setShowAbsenceModal(false)} />
                    <div className="relative w-full max-w-sm bg-white dark:bg-neutral-950 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
                        <div className="p-5 space-y-4 overflow-y-auto flex-1">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-athlix-red">Wajib Diisi</p>
                                    <h3 className="text-lg font-black leading-tight mt-1">{absenceType === 'sick' ? 'Form Sakit' : 'Form Izin'}</h3>
                                </div>
                                <button onClick={() => !absenceSubmitting && setShowAbsenceModal(false)} className="shrink-0 p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <label className="block space-y-1">
                                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Alasan *</p>
                                    <textarea className="w-full rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm min-h-20" placeholder="Jelaskan alasan Anda..." value={absenceReason} onChange={(e) => setAbsenceReason(e.target.value)} />
                                </label>

                                <label className="block space-y-1">
                                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-1"><Upload size={12} /> Dokumen Pendukung (Opsional)</p>
                                    <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setAbsenceDocument(e.target.files?.[0] || null)} className="w-full text-xs" />
                                </label>

                                <Button type="button" disabled={absenceSubmitting || !absenceReason.trim()} onClick={submitAbsence} className="w-full h-12 font-black uppercase tracking-widest rounded-2xl">
                                    {absenceSubmitting ? 'Mengirim...' : `Kirim ${absenceType === 'sick' ? 'Sakit' : 'Izin'}`}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </PwaLayout>
    );
}
