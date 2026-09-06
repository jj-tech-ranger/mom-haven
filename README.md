# MomHaven (MOH 216 MCH Companion)

> **Production-grade Kenyan Maternal & Child Health Companion Application**  
> Digitizing and extending the **Kenya Ministry of Health (MOH 216) Mother and Child Health Handbook**, the **Kenya Expanded Programme on Immunization (KEPI)** schedule, and WHO clinical protocols for maternal, newborn, and child health (MNCH).

---

## Table of Contents
1. [Overview & Problem Statement](#overview--problem-statement)
2. [Clinical Foundation & MOH 216 Alignment](#clinical-foundation--moh-216-alignment)
3. [System Architecture](#system-architecture)
4. [Tech Stack](#tech-stack)
5. [Security & Access Control Model](#security--access-control-model)
6. [Repository Structure](#repository-structure)
7. [Getting Started (Local Development)](#getting-started-local-development)
8. [Environment Variables](#environment-variables)
9. [Automated Testing & Verification](#automated-testing--verification)
10. [CI/CD & Deployment](#cicd--deployment)
11. [Production Status](#production-status)

---

## Overview & Problem Statement

In Kenya and across Sub-Saharan Africa, maternal and infant health relies heavily on physical paper records—primarily the **MOH 216 Mother and Child Health Handbook (MCH Booklet)**. While physical booklets are standard across clinics, paper-only tracking introduces significant vulnerabilities:

- **Lost or Damaged Booklets**: Mothers traveling between counties or losing physical booklets forfeit historical immunization records and risk-stratified antenatal findings.
- **Missed Immunization & ANC Windows**: Without automated scheduling or proactive notifications, critical milestone contacts (such as BCG at birth, Pentavalent/Rotavirus/PCV at 6, 10, 14 weeks, Measles-Rubella at 9 & 18 months, and 8 WHO-recommended ANC contacts) are frequently missed.
- **Delayed High-Risk Identification**: Dangerous complications (preeclampsia, maternal hypertension, anemia, severe postpartum hemorrhage signs, neonatal jaundice, or faltering growth) often go undetected between clinic visits.
- **Lack of Continuity Between Providers**: When a mother is referred to a higher-level county referral or national hospital (KMHFL Levels 4–6), clinicians lack rapid, verifiable access to primary care encounter history.

**MomHaven** bridges this gap by providing an offline-first, mobile-optimized progressive web application for mothers, partners, and clinicians, paired with a cloud-native backend enforcing zero-trust access controls, clinical determinism, and end-to-end data provenance.

---

## Clinical Foundation & MOH 216 Alignment

MomHaven implements deterministic clinical logic adhering to Kenya Ministry of Health guidelines:

- **Antenatal Care (ANC)**: Computes 8 focused WHO/Kenya ANC contacts from Last Menstrual Period (LMP) or Estimated Delivery Date (EDD). Flags maternal risk categories including hypertension ($\ge 140/90\text{ mmHg}$) and anemia ($\text{Hb} < 11.0\text{ g/dL}$ moderate, $< 8.0\text{ g/dL}$ severe).
- **KEPI Immunization Engine**: Strict tracking of all antigens per national guidelines:
  - *Birth*: BCG, OPV 0
  - *6 Weeks*: OPV 1, Pentavalent 1 (DTP-HepB-Hib), PCV 10 1, Rotavirus 1
  - *10 Weeks*: OPV 2, Pentavalent 2, PCV 10 2, Rotavirus 2
  - *14 Weeks*: OPV 3, Pentavalent 3, PCV 10 3, IPV
  - *6 Months*: Vitamin A (Dose 1)
  - *9 Months*: Measles-Rubella 1, Yellow Fever (endemic counties), Vitamin A (Dose 2)
  - *12 Months*: Deworming (Mebendazole/Albendazole), Vitamin A (Dose 3)
  - *18 Months*: Measles-Rubella 2, Vitamin A (Dose 4)
  - *24–59 Months*: Semi-annual Vitamin A & Deworming
- **Maternal Tetanus-Diphtheria (Td) Engine**: 5-dose schedule with automated calculation of protection duration and gap-restart rules.
- **Postnatal Care (PNC)**: Four standardized MOH contact windows (within 48 hours, 1–2 weeks, 4–6 weeks, 4–6 months) including Edinburgh/PHQ-style maternal mental health triage.
- **Growth & Anthropometrics**: WHO Child Growth Standards (2006) calculating Weight-for-Age (WAZ), Length/Height-for-Age (HAZ), and Weight-for-Length (WHZ) Z-scores alongside Mid-Upper Arm Circumference (MUAC) color-coded nutrition triage.
- **Clinical Referrals**: Direct inter-facility electronic referrals across Kenya Master Health Facility List (KMHFL) facilities with status workflows (`open` $\to$ `acknowledged` $\to$ `completed`/`cancelled`).

---

## System Architecture

MomHaven utilizes a layered, privacy-preserving architecture:

```
┌────────────────────────────────────────────────────────┐
│                   Layer 1: Identity                    │
│      Firebase Authentication (Mother / Clinician /     │
│             Partner / Admin Multi-Role RBAC)           │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│      Layer 2: Personalization & Preferences Context    │
│  User-Reported Preferences, Language (EN/SW), Profile  │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│           Layer 3: Authoritative Clinical Records      │
│  MOH 216 Encounters, KEPI Records, Growth Measures     │
│   (Write-locked to Server API & Authorized Clinicians) │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│      Layer 4: Derived Engine (Today & Summary Context) │
│ Deterministic Stage/Week Math, Milestone Calculations  │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│        Layer 5: AI Companion (Haven Assistant)         │
│ Grounded Server-Side Gemini API with Safety Guardrails │
└────────────────────────────────────────────────────────┘
```

### Components

1. **Frontend (Vite / React 19 / Tailwind CSS)**:
   - Client-side Progressive Web App (PWA) with service worker caching.
   - Offline-capable outbox queue (`syncEngine.ts`) enabling remote rural use with automatic replay upon reconnection.
   - Role-tailored experiences: Mother Dashboard, Partner View, Clinician Portal, and Facility Roster.
2. **Backend (Node.js / Express on Google Cloud Run)**:
   - Server-authoritative REST endpoints for clinical encounters, verifiable records, PDF report generation, and automated cron jobs.
   - Zero-Trust access token validation via `firebase-admin`.
   - Google Cloud Secret Manager integration and non-root execution.
3. **Database & Storage (Firebase Firestore)**:
   - Granular Firestore security rules (`firestore.rules`) forbidding client-side writes to clinical encounters and private notes.
   - Composite indexes supporting multi-attribute queries (e.g., facility referrals, scheduled immunization rosters).

---

## Tech Stack

| Domain | Technologies |
|---|---|
| **Frontend Framework** | React 19, TypeScript 5, Vite 6 |
| **Styling & UI** | Tailwind CSS v4, Motion (Framer Motion), Lucide React |
| **Backend & Runtime** | Node.js (ESM/CJS bundle via esbuild), Express 4, `tsx` |
| **Database & Auth** | Firebase Firestore, Firebase Authentication, Firebase Admin SDK |
| **AI Integration** | Google GenAI SDK (`@google/genai`) with server-side proxying |
| **Clinical Documents** | PDFKit (server-side MOH-compliant immunization & encounter PDFs) |
| **Scheduling & Jobs** | `node-cron` (automated reminder push, weekly facility reports) |
| **Hosting & CI/CD** | Google Cloud Run, Docker (multi-stage build), GitHub Actions |

---

## Security & Access Control Model

### Zero-Trust Clinician Access Sessions
Clinicians cannot arbitrarily view patient data. To inspect records:
1. The mother generates a time-limited 6-digit session code (`clinicianAccessSessions`).
2. The clinician claims the session using their verified credential.
3. The server validates clinician active status, verifies session expiry, and logs immutable audit trails (`auditLogs`).
4. Upon consultation end, the session is revoked immediately.

### Firestore Rules Invariants
- **Client Write Lockdown**: Top-level collections `ancEncounters`, `newbornRecords`, `postnatalEncounters`, `immunizationRecords`, `growthMeasurements`, and subcollections under `pregnancies/{id}/...` and `children/{id}/...` have `allow write: if false;` for client SDKs. All writes must pass through validated server-side routes.
- **Clinician Private Notes**: Kept in a dedicated collection `clinicianPrivateNotes` locked with `allow read, write: if false;` on client, accessible only via authorized clinician backend handlers.
- **Audit Logging**: Every read and mutation of patient clinical records generates an unmodifiable audit log entry containing timestamp, actor UID, role, action, and facility ID.

---

## Repository Structure

```
├── .github/
│   └── workflows/
│       ├── cloud-run-deploy.yml    # Workload Identity Federation Cloud Run CI/CD
│       └── phase-6-checks.yml      # CI lint, full test suite (17 suites), and build
├── firestore.rules                 # Authoritative security rules enforcing zero-trust
├── firestore.indexes.json          # Composite indexes for referrals and rosters
├── Dockerfile                      # Multi-stage production container build
├── server.ts                       # Express server entry point & API route orchestration
├── server/
│   ├── clinicianAccess.ts          # Zero-Trust auth, token verification & audit logger
│   ├── jobs/                       # Background cron jobs (reminders, weekly reports)
│   ├── routes/                     # Express routers (clinician, PDF export, sync, etc.)
│   ├── seed/                       # Demo dataset generators, validators, and CLI utilities
│   └── services/                   # Backend services (health summary, referrals, roster)
├── src/
│   ├── components/                 # UI components modularized by domain:
│   │   ├── auth/                   # Authentication, registration & MFA modal
│   │   ├── child/                  # Growth charts, milestones, immunization cards
│   │   ├── clinician/              # Clinician portal, encounter entry, roster views
│   │   ├── haven/                  # AI health companion interface & prompts
│   │   ├── partner/                # Partner support & encouragement signals
│   │   ├── records/                # Health record vault, sharing codes & export
│   │   ├── resources/              # Verified educational library & filter chips
│   │   └── today/                  # Daily dashboard, pregnancy tracker, action plans
│   ├── data/                       # WHO growth tables, KEPI schedule, educational content
│   ├── lib/                        # Firebase client SDK initialization & helpers
│   ├── services/                   # Client-side service layer (offline sync, today context)
│   ├── types/                      # Canonical TypeScript type definitions
│   └── utils/                      # Pure clinical calculation engines (MOH, KEPI, Z-scores)
└── package.json                    # Dependencies, scripts, and build pipeline
```

---

## Getting Started (Local Development)

### Prerequisites
- Node.js 20+ (LTS recommended)
- npm 10+
- (Optional) Docker for containerized verification

### Installation
```bash
# Clone the repository
git clone https://github.com/your-org/mom-haven.git
cd mom-haven

# Install dependencies
npm install
```

### Starting the Development Server
```bash
# Boots full-stack Vite + Express server on port 3000
npm run dev
```
Visit `http://localhost:3000` in your browser.

---

## Environment Variables

Copy `.env.example` to `.env` and configure credentials:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `FIREBASE_API_KEY` | Yes (Client) | Firebase Web API key |
| `FIREBASE_PROJECT_ID` | Yes (Both) | Google Cloud / Firebase Project ID |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Production | Service account JSON string for Admin SDK on Cloud Run |
| `FIRESTORE_DATABASE_ID` | Optional | Custom database ID (defaults to `(default)`) |
| `GEMINI_API_KEY` | Optional | Google Gemini API key for server-side Haven AI companion |
| `GEMINI_MODEL` | Optional | Gemini model identifier (defaults to `gemini-2.5-flash`) |
| `GOOGLE_CLOUD_LOCATION` | Optional | Cloud Run deployment region (e.g., `europe-west1`) |
| `INTERNAL_JOB_SECRET` | Production | Shared bearer secret for triggering background cron tasks |
| `VITE_FIREBASE_VAPID_KEY` | Optional | VAPID key for web push notifications |

---

## Automated Testing & Verification

MomHaven includes an extensive automated test pipeline covering 17 distinct test suites spanning clinical calculations, security rules, encounter schemas, and demo dataset integrity.

```bash
# Run all 17 test suites
npm test

# Run individual test suites
npm run test:clinical      # WHO growth Z-scores & MOH 216 immunization calculations
npm run test:td            # Kenya MOH Maternal Td 5-dose schedule logic
npm run test:context       # Personalization context sanitization & privacy boundaries
npm run test:anonymous     # Anonymous onboarding session drafting & sync
npm run test:haven-context # AI prompt context preparation & guardrails
npm run test:today         # Gestational milestone math & today action plans
npm run test:resources     # Educational resource ranking & language filtering
npm run test:summary       # Health summary aggregation & provenance enforcement
npm run test:sharing       # Temporary sharing codes & clinician access grants
npm run test:partner-signal# Partner support signals & check-ins
npm run test:child         # Child service security invariants & modal write paths
npm run test:reminders     # Deterministic clinical reminder generation
npm run test:demo          # Demo dataset schema conformance & clinician roster
npm run test:messages      # Care team messaging & private notes isolation
npm run test:roster        # Facility roster queries & overdue risk calculations
npm run test:encounters    # Comprehensive MOH 216 clinical encounters & Firestore rules
npm run test:referrals     # Inter-facility clinical referral lifecycle & status flows

# Run type checker / linter
npm run lint

# Run production build
npm run build
```

### Demo Dataset Management
```bash
# Seed realistic demo dataset (6 clinicians, 3 partners, 6 scenario mothers)
npm run seed:demo

# Verify database seed integrity against 100% of acceptance criteria
npm run verify:demo

# Safely purge demo dataset without affecting real users
npm run clean:demo
```

---

## CI/CD & Deployment

### Automated Workflows
- **Validation Pipeline (`.github/workflows/phase-6-checks.yml`)**: Triggered on every pull request and push to `main`. Executes `npm run lint`, all 17 unit/integration test suites (`npm test`), production frontend and server bundling (`npm run build`), and multi-stage Docker build validation.
- **Continuous Deployment (`.github/workflows/cloud-run-deploy.yml`)**: Deploys the application directly to Google Cloud Run using Workload Identity Federation (keyless OIDC authentication).

### Production Build
The project compiles into a single, optimized container image:
```bash
# Build production bundle
npm run build

# Start production server
npm run start
```

---

## Production Status

| System Attribute | Status | Notes |
|---|---|---|
| **MOH 216 Compliance** | **Verified** | Standardized ANC, PNC, KEPI, and Growth tracking |
| **Security Rules** | **Hardened** | Zero-trust client lockdown, server-only clinical writes |
| **Audit Logging** | **Active** | Non-repudiable logs for clinical access & record mutations |
| **Offline Resilience** | **Operational** | IndexedDB outbox queue with auto-retry and rehydration |
| **Test Coverage** | **17/17 Passing** | 100% green test suites across all core services |
| **Cloud Deployment** | **Ready** | Containerized for Google Cloud Run with Secret Manager |
