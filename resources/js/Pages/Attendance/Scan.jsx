import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { ScanLine, Camera, CheckCircle2, XCircle, Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Link } from '@inertiajs/react';

export default function Scan({ auth, flash }) {
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [scanError, setScanError] = useState(null);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const scannerRef = useRef(null);

    const startScanner = async () => {
        setScanResult(null);
        setScanError(null);
        setPermissionDenied(false);
        setScanning(true);

        try {
            await navigator.mediaDevices.getUserMedia({ video: true });
            
            const html5QrCode = new Html5Qrcode("qr-reader");
            scannerRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: "environment" },
                { fps: 15, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    html5QrCode.stop().then(() => {
                        setScanning(false);
                        router.post(route('attendance.store'), { athlete_code: decodedText }, {
                            onSuccess: () => {
                                setScanResult('success');
                            },
                            onError: (errors) => {
                                setScanError(errors.athlete_code || errors.message || 'QR tidak valid atau absen gagal.');
                            }
                        });
                    });
                },
                () => {}
            );
        } catch (err) {
            setScanning(false);
            if (err.name === 'NotAllowedError') {
                setPermissionDenied(true);
            } else {
                setScanError('Gagal mengakses kamera. Pastikan kamera tersedia.');
            }
        }
    };

    const stopScanner = () => {
        if (scannerRef.current) {
            scannerRef.current.stop().then(() => {
                setScanning(false);
            }).catch(() => setScanning(false));
        } else {
            setScanning(false);
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
        } else if (flash?.error) {
            setScanError(flash.error);
        }
    }, [flash]);

    return (
        <AdminLayout
            user={auth?.user}
            header={
                <div className="flex items-center gap-4 animate-fade-in-up">
                    <Link href={route('attendance.index')} className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600  hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all duration-300">
                        <ArrowLeft size={18} />
                    </Link>
                    <h2 className="text-xl font-bold tracking-tight uppercase">Scan Absensi</h2>
                </div>
            }
        >
            <Head title="Scan Kehadiran" />

            <div className="py-6 flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                
                {/* Result States */}
                {scanResult === 'success' && (
                    <div className="text-center space-y-4 animate-bounce-in">
                        <div className="w-20 h-20 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                            <CheckCircle2 size={40} className="text-green-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tighter">Absen Berhasil!</h2>
                            <p className="text-sm text-neutral-500 mt-1">{flash?.success || 'Kehadiran telah tercatat.'}</p>
                        </div>
                        <Button 
                            onClick={() => { setScanResult(null); startScanner(); }}
                            variant="outline"
                            className="mt-4"
                        >
                            Scan Berikutnya
                        </Button>
                    </div>
                )}

                {scanError && (
                    <div className="text-center space-y-4 animate-bounce-in">
                        <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
                            <XCircle size={40} className="text-athlix-red" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tighter">Gagal Scan</h2>
                            <p className="text-sm text-neutral-500 mt-1">{scanError}</p>
                        </div>
                        <Button 
                            onClick={() => { setScanError(null); startScanner(); }}
                            className="mt-4"
                        >
                            Coba Lagi
                        </Button>
                    </div>
                )}

                {permissionDenied && (
                    <div className="text-center space-y-4 animate-bounce-in">
                        <div className="w-20 h-20 mx-auto rounded-full bg-yellow-500/10 flex items-center justify-center">
                            <AlertTriangle size={40} className="text-yellow-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tighter">Izin Kamera Ditolak</h2>
                            <p className="text-sm text-neutral-500 max-w-xs mx-auto mt-1">Buka pengaturan browser dan izinkan akses kamera untuk melakukan scan.</p>
                        </div>
                        <Button 
                            onClick={() => { setPermissionDenied(false); startScanner(); }}
                            variant="outline"
                            className="mt-4"
                        >
                            Coba Lagi
                        </Button>
                    </div>
                )}

                {/* Scanner Area */}
                {!scanResult && !scanError && !permissionDenied && (
                    <div className="w-full max-w-sm space-y-6 animate-fade-in-up">
                        <div className="text-center space-y-1">
                            <h2 className="text-xl font-black uppercase tracking-tighter">Scan QR Atlet</h2>
                            <p className="text-sm text-neutral-500">Arahkan kamera ke ID Card / QR Atlet</p>
                        </div>

                        <div className="relative">
                            <Card className="overflow-hidden border-neutral-200/80 dark:border-neutral-800 aspect-square relative shadow-lg">
                                <div id="qr-reader" className="w-full h-full bg-neutral-900"></div>
                                
                                {scanning && (
                                    <div className="absolute inset-0 pointer-events-none">
                                        <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-athlix-red rounded-tl-lg"></div>
                                        <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-athlix-red rounded-tr-lg"></div>
                                        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-athlix-red rounded-bl-lg"></div>
                                        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-athlix-red rounded-br-lg"></div>
                                        <div className="absolute left-6 right-6 h-1 bg-gradient-to-r from-transparent via-athlix-red to-transparent shadow-[0_0_10px_2px_rgba(230,30,50,0.5)]" style={{ animation: 'scan 2.5s ease-in-out infinite alternate', top: '20%' }}></div>
                                    </div>
                                )}

                                {!scanning && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-100 dark:bg-neutral-900 space-y-4">
                                        <div className="w-20 h-20 rounded-2xl bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center animate-float">
                                            <Camera size={32} className="text-neutral-400" />
                                        </div>
                                        <p className="text-xs text-neutral-400 font-medium">Tekan mulai untuk membuka kamera</p>
                                    </div>
                                )}
                            </Card>
                        </div>

                        {!scanning ? (
                            <Button 
                                onClick={startScanner}
                                className="w-full h-14 text-sm font-black uppercase tracking-widest gap-3 rounded-2xl animate-fade-in-up"
                                style={{ animationDelay: '100ms' }}
                            >
                                <ScanLine size={20} />
                                BUKA KAMERA
                            </Button>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center justify-center gap-2 text-sm text-neutral-500">
                                    <Loader2 size={16} className="animate-spin text-athlix-red" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Memindai...</span>
                                </div>
                                <Button 
                                    onClick={stopScanner}
                                    variant="outline"
                                    className="w-full h-12 rounded-2xl"
                                >
                                    Batal
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

