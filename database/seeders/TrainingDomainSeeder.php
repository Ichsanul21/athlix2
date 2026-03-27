<?php

namespace Database\Seeders;

use App\Models\Dojo;
use App\Models\TrainingProgram;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class TrainingDomainSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            [
                'title' => 'Fundamental Kihon',
                'day' => 'Senin',
                'start' => '16:00',
                'type' => 'teknik',
                'segments' => [
                    ['title' => 'Briefing', 'duration' => 10],
                    ['title' => 'Pemanasan', 'duration' => 20],
                    ['title' => 'Drill Teknik', 'duration' => 35],
                    ['title' => 'Kumite Drill', 'duration' => 30],
                    ['title' => 'Pendinginan', 'duration' => 15],
                ],
            ],
            [
                'title' => 'Conditioning Atlet',
                'day' => 'Rabu',
                'start' => '16:10',
                'type' => 'fisik',
                'segments' => [
                    ['title' => 'Briefing', 'duration' => 10],
                    ['title' => 'Pemanasan', 'duration' => 15],
                    ['title' => 'Power & Agility', 'duration' => 35],
                    ['title' => 'Circuit Endurance', 'duration' => 30],
                    ['title' => 'Pendinginan', 'duration' => 15],
                ],
            ],
            [
                'title' => 'Kata Kompetisi',
                'day' => 'Jumat',
                'start' => '16:00',
                'type' => 'kata',
                'segments' => [
                    ['title' => 'Briefing', 'duration' => 10],
                    ['title' => 'Pemanasan', 'duration' => 20],
                    ['title' => 'Kata Session', 'duration' => 45],
                    ['title' => 'Evaluasi', 'duration' => 25],
                    ['title' => 'Pendinginan', 'duration' => 10],
                ],
            ],
            [
                'title' => 'Kumite Tactical Session',
                'day' => 'Minggu',
                'start' => '07:00',
                'type' => 'kumite',
                'segments' => [
                    ['title' => 'Briefing', 'duration' => 10],
                    ['title' => 'Pemanasan', 'duration' => 20],
                    ['title' => 'Sparring', 'duration' => 40],
                    ['title' => 'Evaluasi', 'duration' => 20],
                    ['title' => 'Pendinginan', 'duration' => 15],
                ],
            ],
        ];

        $dojos = Dojo::query()->orderBy('id')->get();
        foreach ($dojos as $dojoIndex => $dojo) {
            $coachName = User::query()
                ->where('dojo_id', $dojo->id)
                ->whereIn('role', ['sensei', 'head_coach'])
                ->orderByRaw("CASE WHEN role = 'sensei' THEN 0 WHEN role = 'head_coach' THEN 1 ELSE 2 END")
                ->value('name') ?? "Sensei {$dojo->name}";

            foreach ($templates as $sessionIndex => $template) {
                $start = Carbon::createFromFormat('H:i', $template['start'])->addMinutes($dojoIndex * 5);
                $agendaItems = $this->buildAgendaItems($start, $template['segments']);
                $lastAgendaItem = $agendaItems[count($agendaItems) - 1] ?? null;
                $endTime = $lastAgendaItem['end_time'] ?? null;

                TrainingProgram::query()->create([
                    'dojo_id' => $dojo->id,
                    'title' => $template['title'],
                    'description' => $dojo->name . ' - sesi program #' . ($sessionIndex + 1) . ' dengan fokus ' . $template['type'] . '.',
                    'agenda_items' => $agendaItems,
                    'start_time' => $start->format('H:i:s'),
                    'end_time' => ($endTime ?? $start->copy()->addMinutes(90)->format('H:i')) . ':00',
                    'coach_name' => $coachName,
                    'type' => $template['type'],
                    'day' => $template['day'],
                ]);
            }
        }
    }

    private function buildAgendaItems(Carbon $startTime, array $segments): array
    {
        $cursor = $startTime->copy();
        $items = [];
        foreach ($segments as $segment) {
            $end = $cursor->copy()->addMinutes((int) $segment['duration']);
            $items[] = [
                'title' => $segment['title'],
                'start_time' => $cursor->format('H:i'),
                'end_time' => $end->format('H:i'),
                'description' => 'Agenda seed: ' . $segment['title'],
            ];
            $cursor = $end;
        }

        return $items;
    }
}
