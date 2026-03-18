Product Requirements Document (PRD)

Product Name: ATHLIX
Document Version: 3.3 (The Ultimate Final Version - Enterprise Grade)
Date: 16 Maret 2026
Status: Approved / Ready for Engineering

1. Executive Summary

ATHLIX adalah platform Software as a Service (SaaS) komprehensif berbasis cloud yang dirancang untuk mendigitalisasi dan mengintegrasikan manajemen operasional klub bela diri (Dojo Karate). Platform ini memusatkan pengelolaan data karateka, absensi latihan harian, administrasi keuangan otomatis, program latihan, hingga analitik performa turnamen. ATHLIX bertujuan membawa profesionalisme tingkat tinggi ke dalam pengelolaan Dojo melalui ekosistem digital.

2. Platform Strategy & Phased Technology Stack

Untuk mempercepat Time-to-Market (GTM) dan memudahkan onboarding pengguna di awal, pengembangan dibagi menjadi dua fase strategis:

Fase 1: PWA-First (Fokus MVP & Validasi Pasar)

Backend & Database: Laravel (PHP) sebagai core API dan Business Logic. Database menggunakan MySQL dengan arsitektur Multi-Tenant.

Web Portal (Admin/Manager): Dibangun dengan React + Inertia.js.

Mobile Experience (Sensei/Atlet): Dibangun sebagai Progressive Web App (PWA) menggunakan React + Inertia.js dengan desain Mobile-First. Pengguna cukup mengakses via browser HP dan "Add to Homescreen" tanpa perlu download dari App Store.

Fase 2: Native Transition (Fokus Skalabilitas & Fitur Lanjut)

Mobile Application (Expo / React Native): Setelah pasar tervalidasi, pengalaman mobile akan ditingkatkan menjadi aplikasi Native (iOS/Android) menggunakan Expo untuk mendapatkan akses hardware penuh (Kecepatan scan QR, notifikasi native, dan mode offline menggunakan SQLite). Logika backend Laravel tetap dipertahankan tanpa perubahan.

3. System Compatibility & Requirements

Untuk memastikan pengalaman pengguna yang seragam, aplikasi memiliki batas minimum perangkat:

PWA & Web Portal (Fase 1): Mendukung Google Chrome (versi 90+), Safari (iOS 14+), dan Mozilla Firefox. Resolusi layar minimum untuk Web Portal Dashboard adalah 1024x768 (Tablet Landscape).

Native App (Fase 2): Mendukung minimum iOS 15.0 dan Android 10.0 (API Level 29).

4. Target Audience & User Personas

Sistem ini menggunakan arsitektur Multi-Tenant di mana setiap Dojo memiliki workspace masing-masing dengan peran pengguna:

4.1. Dojo Cho / Club Manager (Desktop Web): Memantau cabang/ranting, sirkulasi keuangan, dan prestasi turnamen.

4.2. Club Administrator (Desktop Web): Mengelola pendaftaran, mencatat pembayaran manual, dan administrasi turnamen.

4.3. Sensei / Senpai (Mobile PWA): Mencatat absensi di matras, mengevaluasi progres teknis (Kihon, Kata, Kumite), dan memantau berat badan atlet.

4.4. Karateka / Orang Tua (Mobile PWA): Melihat jadwal, histori sabuk, tagihan iuran, dan rapor turnamen.

5. Core System Features (Complete Scope)

5.1. Karateka Database & Identity

CRUD profil atlet (Biodata & Rekam Medis Dasar).

Tingkatan Sabuk Saat Ini (Kyu 10 hingga Dan) & riwayatnya.

Spesialisasi (Kata/Kumite) & Kelas Berat/Usia (Kadet, Junior, U-21, Senior).

Digital ID Card dengan QR Code.

5.2. Training Attendance & Scheduling

Pembuatan kalender sesi latihan reguler dan TC.

Input kehadiran cepat (Hadir, Izin, Sakit, Alpha) & Scan QR Code (Via API Kamera Browser di Fase 1).

Kalkulasi persentase kehadiran otomatis (Syarat UKT).

5.3. Financial & Payment Gateway Integration

Auto-invoicing untuk iuran bulanan dan tagihan insidental (UKT, Karategi, Turnamen).

Integrasi Payment Gateway (Virtual Account, e-Wallet).

Dashboard rekonsiliasi keuangan real-time.

5.4. Physical & Condition Monitoring

Weight Tracking: Pencatatan berat badan berkala dengan alert batas kelas Kumite.

Log cedera dan Return to Play estimation.

5.5. Karate Performance Analytics & Tournament Module

Kumite Stats: Win/Loss ratio, poin (Ippon, Waza-ari), pelanggaran.

Kata Stats: Nilai rata-rata dan detail eksekusi per turnamen.

Tournament Bracket System: Pembuat bagan drawing internal Dojo.

5.6. Belt Examination (UKT) System

Pembuatan Event UKT terpusat.

Sistem screening kelayakan (Absensi > 70%, Administrasi Lunas, Masa Tunggu Sabuk).

Input nilai digital oleh penguji via tablet/smartphone.

e-Certificate generation.

5.7. Dojo Leaderboard & Gamification

Kalkulasi poin Dojo berdasarkan medali.

Leaderboard atlet terbaik bulanan/tahunan.

Sistem Badges / Pencapaian digital.

6. Roles & Permissions Matrix (High-Level)

Feature

Dojo Cho

Admin

Sensei

Athlete/Parent

Manage Dojo Info/Settings

Full Access

No Access

No Access

No Access

Manage Billing & Payments

Read Only

Full Access

No Access

Pay Own Bills

Manage Athletes & Classes

Read Only

Full Access

View Only

View Own Profile

Input Attendance & Grades

Read Only

Read Only

Full Access

View Own Data

Tournament Bracket Setup

Read Only

Full Access

Full Access

View Only

7. Design & User Experience (UX) Direction

Tema Utama: Discipline, Clean, Bold, Japanese Martial Arts Vibe.

Color Palette:

Black (#000000): Latar belakang utama (Dark Mode), teks solid.

Crimson Red (#E61E32): Aksen utama (Brand Color), CTA, Notifikasi.

Pure White (#FFFFFF): Latar belakang utama (Light Mode), teks terang.

Steel Grey (#B3B3B3): Elemen pendukung, borders, teks sekunder.

Tipografi: Sans-serif (Inter/Roboto) dengan sentuhan brush/ink halus di elemen grafis.

8. Third-Party Integrations & Telemetry

Payment Gateway: Midtrans atau Xendit (Untuk pemrosesan VA, QRIS, e-Wallet).

Cloud Storage: Amazon S3 (AWS) atau Google Cloud Storage (Menyimpan foto profil, bukti transfer manual).

Email & WhatsApp API: SendGrid (Email) & Twilio/Watzap (Notifikasi WA sangat diandalkan di Fase 1 sebagai pengganti Push Notification Native).

App Telemetry & Tracking: Sentry untuk pelacakan bug & error secara real-time (Crashlytics), dan PostHog / Google Analytics untuk merekam interaksi pengguna (User Behavior).

9. Data Privacy, Security & Compliance

Kepatuhan UU PDP (Pelindungan Data Pribadi): Pendaftaran atlet di bawah umur wajib menyertakan Digital Consent (Persetujuan) dari orang tua/wali.

Keamanan Data Medis: Data riwayat cedera dan berat badan dienkripsi dan hanya dapat diakses oleh Sensei/Manajemen yang berwenang.

Data Isolation (Tenant Isolation): Arsitektur database memastikan data Klub A tidak bocor ke Klub B melalui Global Scopes di Laravel Eloquent untuk filtrasi tenant_id secara otomatis.

10. Out of Scope (Pembatasan Lingkup Proyek)

Untuk memastikan jadwal rilis tidak meleset, hal-hal berikut TIDAK akan dimasukkan dalam timeline pengembangan 9 bulan ke depan:

E-commerce / Marketplace internal untuk berjualan alat olahraga antar Dojo.

Fitur analisis video Kata menggunakan Artificial Intelligence (AI).

Modul perpajakan (Tax Reporting) otomatis untuk perusahaan.

11. High-Level Project Timeline

Bulan 1: Riset UX/UI, Desain Sistem, & Pemodelan Database (ERD).

Bulan 2-3: Pengembangan Backend Core (Laravel), Setup IAM (Laravel Sanctum/Breeze), dan struktur SaaS Multi-tenant.

Bulan 4-5: Pengembangan Web Portal Admin & Mobile-Web (React + Inertia.js). Registrasi Service Worker untuk fitur PWA dasar.

Bulan 6: Integrasi Payment Gateway & WhatsApp Notifier.

Bulan 7: QA, UAT, dan Peluncuran Fase 1 (PWA Launch) ke Dojo mitra perdana.

Bulan 8-9 (Fase 2): Ekstraksi logika ke API, pembuatan aplikasi Native menggunakan Expo (React Native), persiapan rilis App Store & Play Store.