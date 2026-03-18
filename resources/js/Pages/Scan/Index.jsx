import PwaLayout from '@/Layouts/PwaLayout';
import { Head } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { QrCode, ShieldCheck, Info } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function Index({ auth, athlete }) {
    if (!athlete) return <PwaLayout user={auth.user} header="ID Card">Loading...</PwaLayout>;

    return (
        <PwaLayout user={auth.user} header="ID Card Kehadiran">
            <Head title="ID Card" />

            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 pb-24">
                
                <div className="text-center space-y-1 animate-fade-in-up">
                    <h2 className="text-xl font-black uppercase tracking-tighter">Kartu Identitas</h2>
                    <p className="text-sm text-neutral-500 max-w-xs mx-auto">Tunjukkan QR Code ini kepada Sensei untuk mencatat kehadiran latihan Anda.</p>
                </div>

                {/* ID Card Wrapper */}
                <div className="w-full max-w-sm px-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    <Card className="overflow-hidden border-none shadow-2xl bg-gradient-to-br from-neutral-900 to-neutral-800 dark:from-neutral-800 dark:to-neutral-900 text-white relative group">
                        {/* Decorative background elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-athlix-red/10 rounded-full -translate-y-1/2 translate-x-1/4"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-athlix-red/5 rounded-full translate-y-1/2 -translate-x-1/4"></div>
                        
                        <CardContent className="p-0 relative z-10">
                            {/* Header Stripe */}
                            <div className="bg-athlix-red px-6 py-3 flex items-center justify-between">
                                <span className="font-black tracking-widest text-xs uppercase text-white/90">Dojo ATHLIX</span>
                                <ShieldCheck size={18} className="text-white/90" />
                            </div>

                            {/* Info Section */}
                            <div className="p-6 text-center space-y-4">
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight">{athlete.full_name}</h3>
                                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mt-1">{athlete.athlete_code}</p>
                                </div>
                                
                                {/* QR Code Container */}
                                <div className="bg-white p-4 rounded-2xl inline-block shadow-lg transition-transform duration-500 group-hover:scale-105">
                                    <QRCodeSVG 
                                        value={athlete.athlete_code} 
                                        size={200}
                                        bgColor={"#ffffff"}
                                        fgColor={"#000000"}
                                        level={"Q"}
                                    />
                                </div>

                                {/* Status */}
                                <div className="pt-2">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold uppercase tracking-widest border border-green-500/20">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                                        Member Aktif
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex items-center gap-2 text-xs text-neutral-500 px-8 text-center animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    <Info size={14} className="text-athlix-red flex-shrink-0" />
                    <p>Pastikan tingkat kecerahan layar Anda cukup tinggi agar QR mudah dipindai.</p>
                </div>

            </div>
        </PwaLayout>
    );
}
