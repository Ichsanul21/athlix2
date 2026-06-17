<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Rekap Absensi {{ $monthName }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', Arial, sans-serif; font-size: 9px; color: #1a1a2e; background: #fff; }

        .header {
            background: linear-gradient(135deg, #c0392b 0%, #922b21 100%);
            color: #fff;
            padding: 16px 20px;
            margin-bottom: 16px;
            border-radius: 4px;
        }
        .header h1 { font-size: 16px; font-weight: 700; letter-spacing: 1px; margin-bottom: 3px; }
        .header p  { font-size: 9px; opacity: 0.85; }

        .meta-row {
            display: flex;
            gap: 16px;
            margin-bottom: 14px;
            font-size: 8.5px;
        }
        .meta-box {
            background: #f8f9fa;
            border: 1px solid #e2e6ea;
            border-left: 3px solid #c0392b;
            padding: 6px 10px;
            border-radius: 3px;
            flex: 1;
        }
        .meta-box .label { color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; font-size: 7px; margin-bottom: 2px; }
        .meta-box .value { font-weight: 700; font-size: 10px; color: #1a1a2e; }

        table { width: 100%; border-collapse: collapse; margin-top: 4px; }
        thead tr {
            background: #2c3e50;
            color: #fff;
        }
        thead th {
            padding: 7px 6px;
            text-align: center;
            font-size: 7.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            border: 1px solid #1a252f;
        }
        thead th:first-child { text-align: left; }
        thead th:nth-child(2) { text-align: left; }

        tbody tr:nth-child(even) { background: #f8f9fa; }
        tbody tr:hover { background: #eef2ff; }

        tbody td {
            padding: 6px 6px;
            border: 1px solid #dee2e6;
            vertical-align: middle;
            font-size: 8px;
        }
        td.name { font-weight: 600; }
        td.code { color: #6c757d; font-family: monospace; font-size: 7.5px; }
        td.center { text-align: center; }
        td.number { text-align: center; font-weight: 600; }

        .badge-present { background: #d4edda; color: #155724; padding: 2px 5px; border-radius: 3px; font-weight: 700; }
        .badge-sick    { background: #fff3cd; color: #856404; padding: 2px 5px; border-radius: 3px; font-weight: 700; }
        .badge-excused { background: #cce5ff; color: #004085; padding: 2px 5px; border-radius: 3px; font-weight: 700; }
        .badge-absent  { background: #f8d7da; color: #721c24; padding: 2px 5px; border-radius: 3px; font-weight: 700; }

        .rate-high   { color: #155724; font-weight: 800; }
        .rate-medium { color: #856404; font-weight: 800; }
        .rate-low    { color: #721c24; font-weight: 800; }

        .rate-bar-bg { background: #e9ecef; border-radius: 4px; height: 5px; width: 60px; display: inline-block; vertical-align: middle; margin-right: 4px; }
        .rate-bar-fill { background: #c0392b; height: 5px; border-radius: 4px; display: inline-block; }

        .summary-row {
            background: #2c3e50 !important;
            color: #fff;
            font-weight: 700;
        }
        .summary-row td { border-color: #1a252f; font-weight: 700; }

        .footer {
            margin-top: 14px;
            font-size: 7.5px;
            color: #6c757d;
            border-top: 1px solid #dee2e6;
            padding-top: 6px;
            display: flex;
            justify-content: space-between;
        }
    </style>
</head>
<body>

<div class="header">
    <h1>REKAP ABSENSI ATLET</h1>
    <p>{{ $monthName }} &nbsp;|&nbsp; {{ $dojoName }} &nbsp;|&nbsp; Digenerate: {{ now()->translatedFormat('d F Y H:i') }} WIB</p>
</div>

@php
    $totalPresent = $recap->sum('present');
    $totalSick    = $recap->sum('sick');
    $totalExcused = $recap->sum('excused');
    $totalAbsent  = $recap->sum('absent');
    $totalRecords = $recap->count();
    $avgRate      = $totalRecords > 0 ? round($recap->avg('rate'), 1) : 0;
@endphp

<div class="meta-row">
    <div class="meta-box">
        <div class="label">Total Atlet</div>
        <div class="value">{{ $totalRecords }}</div>
    </div>
    <div class="meta-box">
        <div class="label">Rata-rata Kehadiran</div>
        <div class="value">{{ $avgRate }}%</div>
    </div>
    <div class="meta-box">
        <div class="label">Total Hadir</div>
        <div class="value">{{ $totalPresent }}</div>
    </div>
    <div class="meta-box">
        <div class="label">Total Sakit</div>
        <div class="value">{{ $totalSick }}</div>
    </div>
    <div class="meta-box">
        <div class="label">Total Izin</div>
        <div class="value">{{ $totalExcused }}</div>
    </div>
    <div class="meta-box">
        <div class="label">Total Alpa</div>
        <div class="value">{{ $totalAbsent }}</div>
    </div>
</div>

<table>
    <thead>
        <tr>
            <th style="width:4%">#</th>
            <th style="width:22%">Nama Atlet</th>
            <th style="width:10%">Kode</th>
            <th style="width:14%">Dojo</th>
            <th style="width:9%">Level</th>
            <th style="width:7%">Hadir</th>
            <th style="width:7%">Sakit</th>
            <th style="width:7%">Izin</th>
            <th style="width:7%">Alpa</th>
            <th style="width:13%">% Kehadiran</th>
        </tr>
    </thead>
    <tbody>
        @foreach ($recap as $i => $row)
        <tr>
            <td class="center">{{ $i + 1 }}</td>
            <td class="name">{{ $row['full_name'] }}</td>
            <td class="code">{{ $row['athlete_code'] }}</td>
            <td>{{ $row['dojo_name'] }}</td>
            <td class="center">{{ $row['level_name'] }}</td>
            <td class="center"><span class="badge-present">{{ $row['present'] }}</span></td>
            <td class="center"><span class="badge-sick">{{ $row['sick'] }}</span></td>
            <td class="center"><span class="badge-excused">{{ $row['excused'] }}</span></td>
            <td class="center"><span class="badge-absent">{{ $row['absent'] }}</span></td>
            <td class="center">
                @php
                    $rateClass = $row['rate'] >= 80 ? 'rate-high' : ($row['rate'] >= 60 ? 'rate-medium' : 'rate-low');
                    $barWidth  = min(60, round($row['rate'] * 0.6));
                @endphp
                <span class="{{ $rateClass }}">{{ $row['rate'] }}%</span>
            </td>
        </tr>
        @endforeach

        {{-- Summary row --}}
        <tr class="summary-row">
            <td colspan="5" class="center" style="color:#fff">TOTAL</td>
            <td class="center" style="color:#a8ffb0">{{ $totalPresent }}</td>
            <td class="center" style="color:#ffe5a0">{{ $totalSick }}</td>
            <td class="center" style="color:#a0c8ff">{{ $totalExcused }}</td>
            <td class="center" style="color:#ffaaaa">{{ $totalAbsent }}</td>
            <td class="center" style="color:#fff">{{ $avgRate }}%</td>
        </tr>
    </tbody>
</table>

<div class="footer">
    <span>Athlix — Sistem Manajemen Atlet</span>
    <span>Dokumen ini digenerate otomatis oleh sistem.</span>
</div>

</body>
</html>
