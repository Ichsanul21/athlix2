import PwaLayout from '@/Layouts/PwaLayout';
import { Head, router } from '@inertiajs/react';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { ScanLine, Camera, CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/Components/ui/skeleton';
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function Index({ auth, athlete, flash }) {
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [scanError, setScanError] = useState(null);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [action, setAction] = useState('checkin');
    const [feedback, setFeedback] = useState('');
    const [mood, setMood] = useState('semangat');
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
                            athlete_feedback: action === 'checkout' ? feedback : '',
                            athlete_mood: action === 'checkout' ? mood : '',
                        }, {
                            onSuccess: () => {
                                setScanResult('success');
                                if (action === 'checkout') {
                                    setFeedback('');
                                    setMood('semangat');
                                }
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
        if (flash?.success) {
            setScanResult('success');
        }
    }, [flash]);

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

            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 pb-24">
                {scanResult === 'success' && (
                    <div className="text-center space-y-4">
                        <div className="w-20 h-20 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                            <CheckCircle2 size={40} className="text-green-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tighter">{action === 'checkout' ? 'Check-out Berhasil' : 'Check-in Berhasil'}</h2>
                            <p className="text-sm text-neutral-500 mt-1">{flash?.success || 'Kehadiran kamu sudah tercatat.'}</p>
                        </div>
                        <Button onClick={() => { setScanResult(null); startScanner(); }} variant="outline">Scan Lagi</Button>
                    </div>
                )}

                {scanError && (
                    <div className="text-center space-y-4">
                        <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 flex items-center justify-center"><XCircle size={40} className="text-athlix-red" /></div>
                        <div><h2 className="text-xl font-black uppercase tracking-tighter">Gagal Scan</h2><p className="text-sm text-neutral-500 mt-1">{scanError}</p></div>
                        <Button onClick={() => { setScanError(null); startScanner(); }}>Coba Lagi</Button>
                    </div>
                )}

                {permissionDenied && (
                    <div className="text-center space-y-4">
                        <div className="w-20 h-20 mx-auto rounded-full bg-yellow-500/10 flex items-center justify-center"><AlertTriangle size={40} className="text-yellow-500" /></div>
                        <div><h2 className="text-xl font-black uppercase tracking-tighter">Izin Kamera Ditolak</h2><p className="text-sm text-neutral-500 mt-1">Izinkan akses kamera agar bisa scan QR dojo.</p></div>
                        <Button onClick={() => { setPermissionDenied(false); startScanner(); }} variant="outline">Coba Lagi</Button>
                    </div>
                )}

                {!scanResult && !scanError && !permissionDenied && (
                    <div className="w-full max-w-sm space-y-4">
                        <div className="text-center space-y-1">
                            <h2 className="text-xl font-black uppercase tracking-tighter">Scan QR Dojo</h2>
                            <p className="text-sm text-neutral-500">{athlete.full_name} ({athlete.athlete_code})</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <Button variant={action === 'checkin' ? 'default' : 'outline'} onClick={() => setAction('checkin')}>Check-in</Button>
                            <Button variant={action === 'checkout' ? 'default' : 'outline'} onClick={() => setAction('checkout')}>Check-out</Button>
                        </div>

                        {action === 'checkout' && (
                            <Card className="p-4 space-y-3">
                                <select className="w-full rounded-lg border px-3 py-2 text-sm" value={mood} onChange={(e) => setMood(e.target.value)}>
                                    <option value="semangat">Semangat</option>
                                    <option value="normal">Normal</option>
                                    <option value="lelah">Lelah</option>
                                    <option value="drop">Drop</option>
                                </select>
                                <textarea className="w-full rounded-lg border px-3 py-2 text-sm min-h-20" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Feedback latihan hari ini..." />
                            </Card>
                        )}

                        <Card className="overflow-hidden border-neutral-200/80 dark:border-neutral-800 aspect-square relative shadow-lg">
                            <div id="qr-reader-dojo" className="w-full h-full bg-neutral-900"></div>
                            {!scanning && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-100 dark:bg-neutral-900 space-y-4">
                                    <div className="w-20 h-20 rounded-2xl bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center"><Camera size={32} className="text-neutral-400" /></div>
                                    <p className="text-sm text-neutral-400 font-medium">Arahkan ke QR yang ditampilkan oleh Sensei</p>
                                </div>
                            )}
                        </Card>

                        {!scanning ? (
                            <Button onClick={startScanner} className="w-full h-14 text-sm font-black uppercase tracking-widest gap-3 rounded-2xl"><ScanLine size={20} />Buka Kamera</Button>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center justify-center gap-2 text-sm text-neutral-500"><Loader2 size={16} className="animate-spin text-athlix-red" /><span className="text-sm font-bold uppercase tracking-widest">Memindai QR Dojo...</span></div>
                                <Button onClick={stopScanner} variant="outline" className="w-full h-12 rounded-2xl">Batal</Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </PwaLayout>
    );
}
