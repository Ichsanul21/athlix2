# ATHLIX - Production-Ready Frontend Development Plan (Phase 1)

## 1. Executive Summary
This document outlines the detailed production-ready frontend architecture and implementation strategy for **Phase 1** of the ATHLIX platform. The focus is on building a highly responsive, Mobile-First Progressive Web App (PWA) for Senseis/Athletes, alongside a robust Desktop Web Portal for Dojo Managers and Admins.

## 2. Core Technology Stack
- **Framework**: React 19.x
- **Integration Layer**: Inertia.js v2.x (Bridge between Laravel backend and React frontend)
- **Styling**: Tailwind CSS v4.x (Utility-first, heavily customized for the brand)
- **Build Tool**: Vite (Lightning-fast HMR and optimized production builds)
- **PWA Capabilities**: `vite-plugin-pwa` (Service workers, offline fallback, web manifest)
- **State Management**: 
  - Server State: Handled natively by Inertia.js shared props.
  - Client State: Zustand (for lightweight, global client-side states like UI toggles).
- **Forms & Validation**: Inertia's built-in `useForm` supplemented by standard HTML5 validation or Zod.
- **UI Components & Icons**: Radix UI / shadcn/ui (for accessible, unstyled primitives), Lucide React (for crisp matching icons).
- **Charts/Analytics**: Recharts (for visualizing Kumite/Kata stats and financial data).

## 3. UI/UX Design System Architecture
### 3.1. Theme & Aesthetics
- **Vibe**: Discipline, Clean, Bold, Japanese Martial Arts.
- **Typography**: Inter (Primary/UI) & Roboto (Data Tables/Numbers).

### 3.2. Color Palette (Tailwind Config)
```css
theme: {
  colors: {
    athlix: {
      black: '#000000',      // Main Background (Dark Mode), Solid Text
      red: '#E61E32',        // Brand Color, Primary CTAs, Alert Notifications
      white: '#FFFFFF',      // Main Background (Light Mode), Bright Text
      grey: '#B3B3B3',       // Secondary Text, Borders, Supporting UI
    }
  }
}
```

## 4. Directory Structure (Inertia Standard under `resources/js/`)
```text
resources/js/
├── Components/         # Reusable atomic UI (Buttons, Cards, Inputs, Modals)
├── Layouts/            # Page wrappers
│   ├── AdminLayout.jsx   # Desktop-focused (Sidebar + Top Navbar)
│   ├── PwaLayout.jsx     # Mobile-focused (Bottom Tab Navigation)
│   └── GuestLayout.jsx   # Auth pages (Login, MFA)
├── Pages/              # Page components (Mapped directly to Laravel routes)
│   ├── Auth/           # Login, MFA, Password Reset
│   ├── Dashboard/      # Role-based landing pages
│   ├── Athletes/       # Athlete CRUD and profiles
│   ├── Attendance/     # QR Scanner, Session lists, Tap-in UI
│   ├── Finance/        # Invoices, Payment tracking
│   └── Exams/          # UKT forms and Belt histories
├── Hooks/              # Custom React Hooks (e.g., useScanner, usePWAInstall)
├── Utils/              # Helper functions (Timezone formatting, Currency)
└── app.jsx             # Inertia bootstrapper and Vite entry point
```

## 5. Development Milestones & Action Plan

### Milestone 1: Environment & PWA Foundation
*Focus: Tooling, routing bridge, and PWA setup.*
- **Step 1**: Install and configure React 19 + Inertia + Tailwind v4 over the Laravel monolith.
- **Step 2**: Configure `vite-plugin-pwa`. Generate `manifest.webmanifest`, define app icons (maskable), and setup service workers caching strategies for static assets.
- **Step 3**: Develop `AdminLayout` (Desktop) and `PwaLayout` (Mobile with Bottom Tabs).
- **Step 4**: Implement the central Theme Provider to toggle effortlessly between Light and Dark mode using Tailwind's `dark:` classes.

### Milestone 2: Authentication & Role-Based UI
*Focus: Secure access and specific user journeys.*
- **Step 1**: Build the Login interface (Clean, minimal, brand-focused).
- **Step 2**: Build the Multi-Factor Authentication (TOTP) input screens for Dojo Cho/Admin.
- **Step 3**: Implement dynamic layout resolution in `app.jsx`. If the authenticated user is an Admin, wrap pages in `AdminLayout`. If Sensei/Athlete, wrap in `PwaLayout`.

### Milestone 3: Administrative Web Portal (Desktop)
*Focus: Complex data grids, management forms, and analytics.*
- **Step 1**: **Dashboard**: Build data cards for Revenue, Active Athletes, and Attendance Rates. Integrate Recharts for visualizing trends over time.
- **Step 2**: **Data Tables**: Build robust, reusable data tables using Inertia's pagination props. Implement server-side searching and sorting.
- **Step 3**: **Financial UI**: Develop interfaces for viewing invoices, marking manual payments, and configuring subscription settings.

### Milestone 4: Mobile-First Operational PWA (Sensei & Athlete)
*Focus: High-speed, responsive, out-in-the-field tools.*
- **Step 1**: **Attendance Module**: Integrate a lightweight HTML5 camera library (e.g., `html5-qrcode`) into a React component to scan Athlete Barcodes/QR Codes swiftly on the Dojo mat.
- **Step 2**: **UKT Grading Forms**: Build mobile-optimized input forms featuring large touch targets for easy input of Kihon, Kata, and Kumite scores on tablets/smartphones.
- **Step 3**: **Athlete Profile & ID**: Generate a responsive Digital ID card view that brightly displays the Athlete's current belt color and QR code.

### Milestone 5: Localization & Performance Polish
*Focus: Global readiness and UX speed.*
- **Step 1**: **Timezone Compliance (FR-LOC-01)**: Create a global utility hook (`useTimezone`) leveraging `date-fns` or `dayjs` that automatically converts all UTC timestamps from Inertia props into the tenant's localized timezone before rendering.
- **Step 2**: **i18n Implementation**: Utilize Laravel's localization files shared to React via Inertia props, enabling seamless English/Indonesian toggles without full page reloads.
- **Step 3**: **Lighthouse Audits**: Aim for 90+ across Performance, Accessibility, Best Practices, and SEO. Ensure touch targets are at least 48x48px.

## 6. Real-time UX Directives
- **Zero-Spinner Philosophy**: Utilize optimistic UI updates via Zustand or React local state where possible before Inertia responds, giving a sense of zero latency (e.g., toggling an attendance status).
- **Inertia Progress Bar**: Customize Inertia's native nprogress loading bar to use the brand's Crimson Red (`#E61E32`) at the top of the viewport during inter-page navigations.
- **Toast Notifications**: Implement a robust toast notification system for success/error alerts triggered by Laravel's Flash Session data shared across Inertia.
