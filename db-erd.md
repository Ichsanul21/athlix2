Database Schema & Entity Relationship Diagram (ERD)

Product Name: ATHLIX
Document Version: 2.0 (Full Migration Ready - Enterprise Scale)
Database Engine: PostgreSQL 16+
Date: 16 Maret 2026

1. Database Design Principles

Multi-Tenancy: Kolom dojo_id adalah kunci Multi-Tenant. Secara default, ORM Laravel harus menginjeksi filter WHERE dojo_id = ? ke setiap query melalui GlobalScope.

Primary Keys: Menggunakan ULID (Universally Unique Lexicographically Sortable Identifier) atau UUID v4 pada tabel utama untuk keamanan ekstra dan kemudahan migrasi/eksport data B2B (Mencegah ID Guessing atau Insecure Direct Object Reference / IDOR).

Soft Deletes: Sebagian besar tabel transaksional memiliki kolom deleted_at untuk pemulihan data tidak sengaja.

Timezones & JSON: Semua kolom tanggal menggunakan format TIMESTAMP WITH TIME ZONE (Disimpan dalam format UTC). Kolom data dinamis menggunakan JSONB.

2. Core Tables (Tenant, Identity & SaaS Admin)

2.1 Table: dojos (Tenants)

Column

Type

Attributes

Description

id

UUID/ULID

PK

Unik ID Dojo

name

VARCHAR

NOT NULL

Nama Dojo/Klub

timezone

VARCHAR

NOT NULL

Contoh: 'Asia/Jakarta'

currency

VARCHAR

DEFAULT 'IDR'

Contoh: 'IDR', 'USD'

is_active

BOOLEAN

DEFAULT true

Status Dojo di platform

2.2 Table: tenant_subscriptions (B2B SaaS Billing)

Column

Type

Attributes

Description

id

UUID/ULID

PK

Unik ID Subscription

dojo_id

UUID/ULID

FK, UNIQUE

Relasi ke dojos.id

plan_name

VARCHAR

NOT NULL

'basic', 'pro', 'enterprise'

billing_cycle

ENUM

NOT NULL

'monthly', 'annually'

valid_until

TIMESTAMP

NOT NULL

Tanggal kedaluwarsa langganan (SaaS)

status

VARCHAR

NOT NULL

'active', 'past_due', 'canceled'

2.3 Table: users (IAM / Access Control)

Column

Type

Attributes

Description

id

UUID/ULID

PK

Unik ID User

dojo_id

UUID/ULID

FK, INDEX

Relasi ke dojos.id

name

VARCHAR

NOT NULL

Nama Pengguna

email

VARCHAR

UNIQUE

Email untuk Login

password

VARCHAR

NOT NULL

Argon2id Hash

role

VARCHAR

NOT NULL

'manager', 'admin', 'sensei', 'parent', 'athlete'

is_mfa_enabled

BOOLEAN

DEFAULT false

Status 2FA/MFA

mfa_secret

VARCHAR

NULLABLE

Kunci rahasia TOTP Google Auth

2.4 Table: device_tokens (Mobile Push Notifications)

Column

Type

Attributes

Description

id

UUID/ULID

PK

Unik ID Token

user_id

UUID/ULID

FK, INDEX

Relasi ke users.id

device_type

VARCHAR

NOT NULL

'ios', 'android', 'web'

push_token

VARCHAR

UNIQUE

Contoh: ExponentPushToken[xxxx]

3. Karateka Data & Belt Module

3.1 Table: athletes

Column

Type

Attributes

Description

id

UUID/ULID

PK

Unik ID Atlet

dojo_id

UUID/ULID

FK, INDEX

Relasi ke dojos.id

athlete_code

VARCHAR

UNIQUE

Nomor Induk Karateka (NIK) / Barcode

full_name

VARCHAR

NOT NULL

Nama Lengkap

dob

DATE

NOT NULL

Tanggal Lahir

gender

ENUM

NOT NULL

'M', 'F'

latest_weight

DECIMAL

NULLABLE

Berat badan terakhir (kg)

weight_class

VARCHAR

NULLABLE

Kelas otomatis (Kadet -52kg, dll)

specialization

ENUM

DEFAULT 'both'

'kata', 'kumite', 'both'

current_belt_id

UUID/ULID

FK, NULLABLE

Relasi ke belts.id

3.2 Table: guardian_athlete (Parent-Child Pivot)

Column

Type

Attributes

Description

user_id

UUID/ULID

FK, PK

Relasi ke users.id (Parent/Guardian)

athlete_id

UUID/ULID

FK, PK

Relasi ke athletes.id (Anak/Karateka)

relation_type

VARCHAR

DEFAULT 'parent'

'parent', 'self'

3.3 Table: belts (Master Data)

Column

Type

Attributes

Description

id

UUID/ULID

PK

Unik ID Sabuk

dojo_id

UUID/ULID

FK

Relasi ke dojos.id

name

VARCHAR

NOT NULL

Nama (Contoh: 'Kyu 5', 'Dan 1')

color_hex

VARCHAR

NOT NULL

Kode warna sabuk untuk UI

order_level

INTEGER

NOT NULL

Urutan hirarki (Kyu 10 = 1, Kyu 9 = 2)

3.4 Table: belt_histories & ukt_scores

Column

Type

Attributes

Description

id

UUID/ULID

PK

Unik ID Riwayat/Nilai UKT

athlete_id

UUID/ULID

FK

Relasi ke athletes.id

belt_id

UUID/ULID

FK

Relasi ke belts.id (Sabuk yang didapat)

event_name

VARCHAR

NOT NULL

Nama Acara (Contoh: 'UKT Semester 1')

kihon_score

DECIMAL

NULLABLE

Poin dasar teknik (1-100)

kata_score

DECIMAL

NULLABLE

Poin jurus (1-100)

kumite_score

DECIMAL

NULLABLE

Poin tarung (1-100)

is_passed

BOOLEAN

NOT NULL

Status Kelulusan UKT

exam_date

DATE

NOT NULL

Tanggal lulus ujian

4. Attendance & Condition Module

4.1 Table: training_sessions

Column

Type

Attributes

Description

id

UUID/ULID

PK

Unik ID Sesi Latihan

dojo_id

UUID/ULID

FK

Relasi ke dojos.id

title

VARCHAR

NOT NULL

Nama Sesi (Contoh: 'TC Kumite Junior')

scheduled_at

TIMESTAMP

NOT NULL

Waktu latihan (UTC)

coach_id

UUID/ULID

FK

Relasi ke users.id (Sensei pengajar)

4.2 Table: attendances

Column

Type

Attributes

Description

id

UUID/ULID

PK

Unik ID Absen

training_session_id

UUID/ULID

FK, INDEX

Relasi ke training_sessions.id

athlete_id

UUID/ULID

FK, INDEX

Relasi ke athletes.id

status

ENUM

NOT NULL

'present', 'absent', 'sick', 'excused'

recorded_at

TIMESTAMP

NULLABLE

Waktu absen di-tap/di-scan

4.3 Table: weight_logs

Column

Type

Attributes

Description

id

UUID/ULID

PK

Unik ID Log Berat

athlete_id

UUID/ULID

FK

Relasi ke athletes.id

weight_kg

DECIMAL

NOT NULL

Angka berat badan (Contoh: 61.5)

recorded_at

TIMESTAMP

NOT NULL

Waktu pencatatan

5. Tournament & Match Analytics Module

5.1 Table: tournaments

Column

Type

Attributes

Description

id

UUID/ULID

PK

Unik ID Turnamen

dojo_id

UUID/ULID

FK

Relasi ke dojos.id

name

VARCHAR

NOT NULL

Contoh: 'Kejurda INKAI 2026'

start_date

DATE

NOT NULL

Tanggal mulai turnamen

type

ENUM

NOT NULL

'internal', 'external'

5.2 Table: match_statistics

Column

Type

Attributes

Description

id

UUID/ULID

PK

Unik ID Pertandingan

tournament_id

UUID/ULID

FK

Relasi ke tournaments.id

athlete_id

UUID/ULID

FK

Relasi ke athletes.id

category

VARCHAR

NOT NULL

Contoh: 'Kumite -55kg Junior Putra'

match_result

ENUM

NOT NULL

'win', 'loss', 'draw'

points_scored

INTEGER

DEFAULT 0

Jumlah poin yang dicetak (Kumite)

points_conceded

INTEGER

DEFAULT 0

Jumlah poin kebobolan (Kumite)

foul_count

INTEGER

DEFAULT 0

Jumlah pelanggaran (Chui/Hansoku)

medal_won

VARCHAR

NULLABLE

'gold', 'silver', 'bronze'

6. Financial Module (Dojo -> Athlete)

6.1 Table: invoices

Column

Type

Attributes

Description

id

UUID/ULID

PK

Unik ID Invoice

dojo_id

UUID/ULID

FK

Relasi ke dojos.id

athlete_id

UUID/ULID

FK

Relasi ke athletes.id

amount

DECIMAL

NOT NULL

Jumlah tagihan

title

VARCHAR

NOT NULL

Contoh: 'Iuran Bulanan Maret 2026'

due_date

DATE

NOT NULL

Jatuh tempo pembayaran

status

ENUM

NOT NULL

'draft', 'unpaid', 'paid', 'overdue'

payment_url

VARCHAR

NULLABLE

Link dari Payment Gateway

6.2 Table: payments

Column

Type

Attributes

Description

id

UUID/ULID

PK

Unik ID Pembayaran

invoice_id

UUID/ULID

FK

Relasi ke invoices.id

paid_amount

DECIMAL

NOT NULL

Jumlah yang dibayarkan

payment_method

VARCHAR

NOT NULL

'cash', 'bank_transfer', 'credit_card'

reference_id

VARCHAR

NULLABLE

ID referensi dari Payment Gateway

paid_at

TIMESTAMP

NOT NULL

Waktu transaksi sukses

6.3 Table: payment_webhook_logs (Gateway Debugging)

Column

Type

Attributes

Description

id

UUID/ULID

PK

Unik ID Log

gateway

VARCHAR

NOT NULL

'stripe', 'midtrans'

event_type

VARCHAR

NOT NULL

'charge.succeeded', 'invoice.paid'

payload

JSONB

NOT NULL

Data mentah dari pihak ketiga

is_processed

BOOLEAN

DEFAULT false

Apakah sudah masuk ke tabel payments?

7. Operational & Media Assets

7.1 Table: media_attachments (Polymorphic Storage Links)

Column

Type

Attributes

Description

id

UUID/ULID

PK

Unik ID Media

model_type

VARCHAR

NOT NULL

Contoh: 'App\Models\Athlete'

model_id

UUID/ULID

NOT NULL

ID milik entitas di atas

collection

VARCHAR

NOT NULL

'avatars', 'medical_proofs', 'dojo_logos'

file_url

VARCHAR

NOT NULL

Relatif path di VPS atau URL eksternal

mime_type

VARCHAR

NOT NULL

'image/jpeg', 'application/pdf'

8. Compliance & Enterprise Security

8.1 Table: audit_logs (SOC 2 & GDPR)

Column

Type

Attributes

Description

id

UUID/ULID

PK

Unik ID Log

dojo_id

UUID/ULID

FK

Relasi ke dojos.id

user_id

UUID/ULID

FK

Siapa yang mengubah data

action

VARCHAR

NOT NULL

'created', 'updated', 'deleted'

entity_type

VARCHAR

NOT NULL

Nama Tabel (Contoh: 'athletes')

entity_id

UUID/ULID

NOT NULL

ID baris yang diubah

old_values

JSONB

NULLABLE

Data sebelum diubah

new_values

JSONB

NULLABLE

Data sesudah diubah

ip_address

INET

NULLABLE

Alamat IP pengguna

9. Final Checklist

[x] Multi-Tenancy (dojo_id) diimplementasikan di semua tabel transaksional.

[x] Parent-Child relationship untuk fitur Family Billing (guardian_athlete).

[x] Modul Kumite & Kata Analytics (Tabel tournaments & match_statistics).

[x] Modul Administrasi Dojo (UKT, Attendance, Weight Logs).

[x] Audit Trail dan Webhook Logs untuk keamanan tingkat Enterprise.