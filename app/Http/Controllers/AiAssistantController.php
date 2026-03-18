<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class AiAssistantController extends Controller
{
    public function index()
    {
        return Inertia::render('AiAssistant/Index');
    }

    public function chat(Request $request)
    {
        $request->validate(['message' => 'required|string']);
        
        $message = strtolower($request->message);
        $response = "Maaf, Sensei. Saya tidak mengerti pertanyaan itu. Coba tanyakan tentang performa atlet or jadwal latihan.";

        if (str_contains($message, 'performa') || str_contains($message, 'atlet')) {
            $response = "Berdasarkan data terbaru, 3 atlet (Bintang, Syifa, Dimas) menunjukkan konsistensi tinggi dalam kehadiran. Namun, 2 atlet perlu pemantauan lebih karena BB yang menurun signifikan.";
        } elseif (str_contains($message, 'jadwal') || str_contains($message, 'latihan')) {
            $response = "Hari ini ada 3 sesi latihan: Kumite pagi, Teknik siang, dan Fisik sore. Semua pelatih sudah konfirmasi hadir.";
        } elseif (str_contains($message, 'keuangan') || str_contains($message, 'bayar')) {
            $response = "Total tunggakan bulan ini sebesar Rp 2.500.000 dari 5 atlet. Saya sarankan segera kirim reminder WhatsApp.";
        }

        return back()->with('ai_response', [
            'user' => $request->message,
            'bot' => $response
        ]);
    }
}
