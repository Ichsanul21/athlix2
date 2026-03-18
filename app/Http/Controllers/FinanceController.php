<?php

namespace App\Http\Controllers;

use App\Models\FinanceRecord;
use Inertia\Inertia;
use Illuminate\Http\Request;

class FinanceController extends Controller
{
    public function index()
    {
        return Inertia::render('Finance/Index', [
            'records' => FinanceRecord::with('athlete.belt')->latest()->get()
        ]);
    }

    public function update(Request $request, FinanceRecord $finance)
    {
        $finance->update([
            'status' => 'paid'
        ]);

        return back()->with('success', 'Pembayaran berhasil dicatat sebagai lunas.');
    }

    public function generateMonthly()
    {
        $athletes = \App\Models\Athlete::all();
        $monthName = now()->translatedFormat('F Y');
        $dueDate = now()->endOfMonth()->format('Y-m-d');
        
        $count = 0;
        foreach ($athletes as $athlete) {
            // Check if already generated for this month to avoid duplicates
            $exists = FinanceRecord::where('athlete_id', $athlete->id)
                ->where('description', "Iuran Bulanan - {$monthName}")
                ->exists();
                
            if (!$exists) {
                FinanceRecord::create([
                    'athlete_id' => $athlete->id,
                    'amount' => 150000.00, // Hardcode default bulanan for prototype
                    'description' => "Iuran Bulanan - {$monthName}",
                    'status' => 'unpaid',
                    'due_date' => $dueDate
                ]);
                $count++;
            }
        }

        return back()->with('success', "Berhasil menerbitkan {$count} tagihan iuran bulan {$monthName}.");
    }
}
