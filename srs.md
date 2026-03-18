System Requirements Specification (SRS)

Product Name: ATHLIX
Document Version: 1.3 (Global B2B Enterprise Standard)
Date: 16 Maret 2026
Target Audience: Software Architects, Backend/Frontend Developers, DevOps, QA/Security Engineers

1. Introduction

1.1 Purpose

Dokumen SRS ini mendefinisikan spesifikasi teknis tingkat lanjut untuk pengembangan platform ATHLIX. Dokumen ini dirancang untuk memenuhi standar B2B SaaS Internasional, mencakup kepatuhan privasi global (GDPR/SOC 2), keamanan tingkat Enterprise, skalabilitas, dan keandalan operasional.

1.2 System Scope

ATHLIX adalah sistem B2B SaaS Multi-Tenant global yang mengelola operasional Dojo Karate. Sistem dibangun dengan arsitektur hibrida menggunakan Laravel + Inertia.js + React (Fase 1 Web/PWA), serta infrastruktur REST API untuk aplikasi Native Expo/React Native (Fase 2).

2. System Architecture & Operating Environment

2.1 Multi-Tenancy Architecture

Sistem menggunakan pendekatan Single Database, Shared Schema dengan Row-Level Isolation.

Setiap tabel transaksional WAJIB memiliki kolom tenant_id (merujuk ke tabel dojos).

Technical Constraint: Isolasi data harus ditegakkan di level ORM menggunakan Global Scopes di Laravel Eloquent.

2.2 Technology Stack

Backend Framework: Laravel 12.x (PHP 8.2+)

Frontend Web & PWA: React 19.x + Inertia.js (v2.x) + Tailwind CSS (v4.x)

Mobile App (Fase 2): React Native (Expo SDK 52+)

Database: PostgreSQL 16+ (Sangat direkomendasikan untuk Row-Level Security tingkat lanjut dibanding MySQL).

Authentication: Laravel Sanctum + Autentikasi 2 Faktor (2FA/MFA).

3. Functional Requirements (FR)

3.1 FR-AUTH: Authentication & Access Control

FR-AUTH-01: Login multi-peran (Dojo Cho, Admin, Sensei, Athlete) menggunakan Email dan Password terenkripsi (Argon2id).

FR-AUTH-02 (Enterprise Auth): Akun level Manajer dan Admin ada opsi untuk mengaktifkan Multi-Factor Authentication (MFA) via Authenticator App (Google/Microsoft Authenticator) berbasis TOTP.

FR-AUTH-03: Role-Based Access Control (RBAC) di tingkat API (Middleware) dan Frontend.

3.2 FR-ATH: Karateka (Athlete) Management

FR-ATH-01: CRUD profil atlet dengan parameter wajib (Nama, TTL, Kelas Berat, Spesialisasi).

FR-ATH-02: Data Export/Portability (Kepatuhan GDPR): Admin Dojo dapat mengunduh seluruh data atlet mereka dalam format CSV atau JSON kapan saja.

3.3 FR-ATT: Attendance Module

FR-ATT-01: Sensei dapat membuat jadwal dan menandai kehadiran.

FR-ATT-02: Pemindaian QR Code dari ID Card Atlet untuk absensi cepat.

FR-ATT-03: Kalkulasi otomatis persentase kehadiran via Cron Job bulanan.

3.4 FR-FIN: Financial & Payment Gateway (Global)

FR-FIN-01: Auto-generate Invoice bulanan via Task Scheduler.

FR-FIN-02 (Multi-Currency & Gateways): Sistem mendukung integrasi Stripe (untuk pemrosesan Kartu Kredit Global & Multi-Mata Uang) dan Midtrans/Xendit (lokalisasi Asia Tenggara / QRIS / VA).

FR-FIN-03: Pembaruan status via Webhook asinkron dan pemicu notifikasi otomatis.

3.5 FR-UKT: Belt Examination (UKT) Logic

FR-UKT-01: Manajemen Event UKT dengan Eligibility Engine (Absensi >= 70% & Iuran Lunas).

FR-UKT-02: Form Scoring digital untuk Sensei (Kihon, Kata, Kumite).

3.6 FR-LOC: Localization & Timezones (GLOBAL STANDARD)

FR-LOC-01 (Timezone Master Rule): SELURUH data timestamp (jadwal latihan, transaksi, absen) WAJIB disimpan dalam format UTC (Universal Time Coordinated) di database. Konversi ke zona waktu lokal (misal: JST untuk Jepang, WIB untuk Indonesia) HANYA dilakukan di sisi Frontend (React) berdasarkan pengaturan Tenant (Dojo).

FR-LOC-02 (i18n): Aplikasi mendukung fitur lokalisasi Multi-language (Awal: English & Indonesian, siap diperluas ke bahasa lain).

4. Non-Functional Requirements (NFR)

4.1 NFR-SEC: Security, Privacy & Global Compliance

NFR-SEC-01 (Encryption in Transit & At Rest): Transmisi data via HTTPS (TLS 1.3). Data sensitif di database (seperti data rekam medis/cedera atlet) WAJIB dienkripsi pada level storage (AES-256 Encryption at Rest).

NFR-SEC-02 (GDPR Compliance): Implementasi Right to be Forgotten. Jika atlet atau Dojo meminta penghapusan akun, sistem harus melakukan Hard Delete atau anonimisasi data permanen dalam waktu 30 hari, menghapus semua jejak Personally Identifiable Information (PII).

NFR-SEC-03 (Rate Limiting & WAF): Perlindungan endpoint menggunakan Web Application Firewall (WAF) dan Rate Limiter ketat.

4.2 NFR-PER: Performance & Scalability

NFR-PER-01: Respons API < 300 ms (Latensi P95).

NFR-PER-02: Distribusi aset statis dan media akan dilayani langsung secara lokal melalui VPS (menggunakan sistem local storage Laravel yang di-symlink ke public folder), dioptimalkan dengan caching bawaan Web Server (Nginx).

4.3 NFR-REL: Reliability & Enterprise SLA

NFR-REL-01 (SLA & Uptime): Jaminan Service Level Agreement (SLA) sebesar 99.9% Uptime. Downtime di atas ambang batas mewajibkan platform memberikan Service Credit (Kompensasi tagihan) kepada Tenant B2B.

5. System Standards & DevOps Guidelines (ENTERPRISE PROTOCOL)

5.1 API Design & Standards

Versioning: API untuk Mobile App wajib menggunakan versioning (contoh: /api/v1/athletes).

Pagination: Cursor Pagination atau Offset Pagination (Maksimal 100 baris/halaman) untuk semua response berbasis daftar.

5.2 Deployment & CI/CD Strategy

CI/CD via GitHub Actions / GitLab CI menuju Virtual Private Server (VPS) standar. Deployment diotomatisasi secara langsung menggunakan koneksi SSH (Zero-downtime deployment menggunakan Laravel Deployer/Envoy atau script bash lokal).

5.3 Disaster Recovery, Backups & Exit Strategy

RPO (Recovery Point Objective): 12 Jam (Backup inkremental otomatis 2x sehari).

RTO (Recovery Time Objective): 4 Jam pemulihan ke instance VPS baru saat critical failure. Catatan: File backup database wajib dipindahkan secara otomatis ke remote server lain atau layanan pihak ketiga yang murah (seperti Google Drive / Backblaze B2) untuk mencegah kehilangan data jika VPS utama rusak fisik.

Tenant Exit Strategy: Jika Dojo membatalkan langganan B2B, sistem akan otomatis melakukan pengemasan data (Data Export) ke ZIP (CSV profil atlet & PDF transaksi), lalu memberikan link download yang berlaku 7 hari, sebelum data di-wipe bersih (Otomatisasi GDPR).

5.4 Error Logging & Audit Trail

Error Tracking: Sentry SDK terintegrasi penuh untuk alerting otomatis ke Slack/PagerDuty jika terjadi Fatal Error.

Immutable Audit Trail: Modul finansial dan pengaturan sistem menggunakan log append-only (Data yang masuk tidak bisa diubah). Mencatat rinci Aktor, Aksi, Timestamp UTC, dan Alamat IP.