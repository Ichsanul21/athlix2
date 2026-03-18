# ATHLIX - Comprehensive Development Plan

## 1. Executive Summary
This document outlines the detailed technical development plan for **ATHLIX**, a B2B SaaS platform for Dojo Karate management. The plan synthesizes the Product Requirements Document (PRD v3.3), System Requirements Specification (SRS v1.3), and the Database Entity Relationship Diagram (ERD v2.0).

## 2. Technology Stack & Constraints
- **Backend**: Laravel 12.x (PHP 8.2+)
- **Frontend (Phase 1)**: React 19.x + Inertia.js v2.x + Tailwind CSS v4.x (PWA-First)
- **Mobile (Phase 2)**: React Native (Expo SDK 52+)
- **Database**: MySQL 8.0+ (Utilizing Row-Level Security / Global Scopes for Multi-Tenancy)
- **Authentication**: Laravel Sanctum + Argon2id Hash + TOTP MFA
- **Infrastructure**: VPS with Nginx, automated CI/CD via GitHub Actions / GitLab CI. SSL (TLS 1.3), AES-256 for at-rest data.

## 3. Implementation Strategy
The development is strictly divided into two phases to optimize Time-to-Market (GTM) while maintaining enterprise readiness.

---

## 4. Phase 1: PWA-First (Months 1-7)
**Goal:** MVP, Market Validation, Desktop Web Portal for Admin, and Mobile PWA Experience for Senseis and Athletes.

### Milestone 1: Foundation & Architecture Setup (Month 1-2)
*Focus: Environment, Database, and Core API.*
- **Task 1.1**: Initialize Laravel 12.x backend repository and React 19.x frontend repository setup with Inertia.js.
- **Task 1.2**: Configure PostgreSQL 16+ database.
- **Task 1.3**: Implement Database Migrations based on `db-erd.md`.
  - Core Tables: `dojos`, `tenant_subscriptions`, `users`.
  - Karateka Data: `athletes`, `guardian_athlete`, `belts`, `belt_histories`.
  - Operations: `training_sessions`, `attendances`, `weight_logs`, `tournaments`, `match_statistics`.
  - Financial & Security: `invoices`, `payments`, `audit_logs`, `device_tokens`, `media_attachments`.
- **Task 1.4**: Enforce Multi-Tenancy (Row-Level Isolation) using Laravel Eloquent Global Scopes filtering by `dojo_id`.
- **Task 1.5**: Design and build base REST API endpoints and integrate Cursor/Offset Pagination.

### Milestone 2: Identity, Access Management & Security (Month 2-3)
*Focus: Authentication, Role-Based Access Control, and Auditing.*
- **Task 2.1**: Implement Auth via Laravel Sanctum using Argon2id hashing algorithms.
- **Task 2.2**: Integrate TOTP-based Multi-Factor Authentication (MFA) via Authenticator App for Manager and Admin roles.
- **Task 2.3**: Build UI and middleware for RBAC (Role-Based Access Control) mapping out distinct views for Dojo Cho, Admin, Sensei, and Athlete.
- **Task 2.4**: Create immutable `audit_logs` tracking infrastructure (Create/Update/Delete tracking mapped to User ID and IP Address) for SOC 2 and GDPR compliance.

### Milestone 3: Core Dojo Management Modules (Month 4-5)
*Focus: Portals, Club Administration, and Core Karate Functions.*
- **Task 3.1**: Build Dojo Admin Dashboard (Web) covering Tenant Settings and configurations.
- **Task 3.2**: Develop Athlete Management System (CRUD, Belt History, specialized categories, and dynamic digital ID cards presenting QR Codes).
- **Task 3.3**: Develop Attendance & Scheduling module. Include logic for Sensei to scan QR codes seamlessly via the Web API camera and auto-calculate UKT eligibility.
- **Task 3.4**: Develop the continuous Belt Examination (UKT) scoring system module.
- **Task 3.5**: Systematize the Dojo Leaderboard using caching layers for medals and match records.

### Milestone 4: Financial & Third-Party Integrations (Month 6)
*Focus: Billing Algorithms, Payment Pipelines, Setup Extensions.*
- **Task 4.1**: Build automated task schedulers (cron jobs) for recursive monthly invoice generation.
- **Task 4.2**: Complete Stripe, Midtrans, or Xendit integrations incorporating asynchronous Webhook synchronization payload verifications via `payment_webhook_logs`.
- **Task 4.3**: Integrate SendGrid (Emails) and Twilio/Watzap API for outbound event/reminders via WhatsApp.
- **Task 4.4**: Configure polymorphic media attachments directly to a Cloud storage bucket (S3 / GCS).
- **Task 4.5**: Install application telemetry & bug tracking software (Sentry/Crashlytics) for continuous production logging.

### Milestone 5: Localization, QA & Production Launch (Month 7)
*Focus: Standardization protocols, Beta Release, and UAT.*
- **Task 5.1**: Assure compliance for `FR-LOC-01` (ALL persistent timestamps enforced in UTC; conversions strictly applied on the React components using the specific Dojo's configured offset).
- **Task 5.2**: Finalize dual i18n translation assets (English & Indonesian).
- **Task 5.3**: Fortify DevOps workflow with robust CI/CD Pipelines pushing seamlessly to the designated VPS. Automate DB backups routines (RPO 12 Hours) executing offsite storage distribution.
- **Task 5.4**: Penetration checks, Web Application Firewall (WAF) integration, User Acceptance Testing (UAT), and finally proceed to Phase 1 Go-Live iteration.

---

## 5. Phase 2: Native Transition (Months 8-9)
**Goal:** Elevate towards native performance metrics via direct mobile compilation using React Native.

### Milestone 6: Native Mobile Application Construction
*Focus: Platform Transitioning via Expo SDK.*
- **Task 6.1**: Blueprint and launch the Expo SDK 52+ codebase repository.
- **Task 6.2**: Route pre-existing Laravel Core APIs into native contexts ensuring rigid auth persistence loops.
- **Task 6.3**: Augment the QR Scanner implementing Native Camera bindings scaling read latency radically.
- **Task 6.4**: Deploy SQLite storage mechanics fostering an 'Offline-First' experience during network downtime.
- **Task 6.5**: Dispatch real-time iOS/Android Push Notifications natively supplanting WhatsApp limits.

### Milestone 7: Final App Stores Submission
*Focus: Compliance & Launch.*
- **Task 7.1**: Incorporate stringent Mobile Data Policy configurations per store guidelines (Right-to-Delete mechanism natively accessible).
- **Task 7.2**: Publicly beta test deploying candidate builds spanning TestFlight and Google Play Consoles.
- **Task 7.3**: Officially validate production launches across international mobile platforms.

---

## 6. Critical Engineering Directives
1. **Multi-Tenant Isolation Constraints**: Under no circumstance should a developer initiate raw SQL injections. Data operations must traverse eloquently restricted `dojo_id` Global Scopes.
2. **GDPR/PII Data Erasure**: Features demanding profile erasure must orchestrate cascades neutralizing PII references within a rigid 30-day parameter constraint permanently securely logging the anonimization trail.
3. **Firmware Guidelines**: Proceed natively favoring strictly typed PHP 8.2 guidelines, employing React 19 syntactics and custom hooks avoiding ad-hoc styling architectures over standard Tailwind classes.
