# MomHaven

A maternal and child health companion built around the Kenyan MOH 216 Mother & Child Health Handbook.

MomHaven is designed for the reality of care in Kenya: paper records, missed appointments, limited connectivity, movement between facilities, and the need to share the right information with a clinician without handing over everything.

The project brings pregnancy, postnatal care, child health, immunization, growth tracking, reminders, referrals, clinician access, and an AI companion into one system.

> **Important:** MomHaven is a software project and does not replace a qualified healthcare professional or emergency services.

## What it does

### For mothers

- Track pregnancy and antenatal care milestones.
- Keep maternal and child health records in one place.
- Track immunizations against the Kenyan KEPI schedule.
- Record and follow child growth measurements.
- Get reminders for upcoming care and vaccinations.
- Access trusted health resources.
- Use the app when connectivity is unreliable, with local/offline support for key flows.
- Generate health records and reports for use during care.

### For partners

- Connect to a pregnancy with explicitly shared access.
- See the information needed to provide practical support.
- Send support signals and check-ins without getting access to private clinical notes.

### For clinicians

- Access a mother's records through a temporary, mother-generated access session.
- Review pregnancy, postnatal, newborn, immunization, growth, and referral information.
- Verify reported records and preserve their provenance.
- Record clinical encounters through server-authorized routes.
- Work with facility rosters and referrals.

### Haven

Haven is MomHaven's AI health companion. It is deliberately kept behind the clinical system rather than being treated as the source of clinical truth.

The server builds a minimized context for Haven and labels information by provenance. Verified and authoritative clinical information is kept distinct from user-reported information and system-derived calculations. Safety checks run before and after the model call, including a server-side block on dose-like medication advice.

Haven is there to explain, guide, and help users find the next appropriate step—not to diagnose or prescribe.

## Clinical foundation

MomHaven's deterministic clinical logic currently covers:

- **ANC:** pregnancy dating and the 8-contact ANC schedule.
- **Maternal Td:** the Kenyan 5-dose tetanus-diphtheria schedule and protection logic.
- **PNC:** postnatal contact windows and maternal/newborn follow-up.
- **KEPI:** routine childhood immunization scheduling and status calculation.
- **Growth:** WHO growth-standard calculations including WAZ, HAZ, and WHZ, plus MUAC-based nutrition triage.
- **Referrals:** inter-facility referral workflows with explicit status changes.

Clinical calculations live in reusable TypeScript modules rather than being embedded in individual UI screens. Dates can be supplied explicitly to the calculation engines, which keeps the logic deterministic and testable.

## Architecture

At a high level, the application is split into a few clear layers:

```text
┌──────────────────────────────────────────────┐
│ Identity                                     │
│ Firebase Authentication + role-based access │
└──────────────────────┬───────────────────────┘
                       │
┌──────────────────────▼───────────────────────┐
│ User context                                 │
│ Preferences, profile, language, local state  │
└──────────────────────┬───────────────────────┘
                       │
┌──────────────────────▼───────────────────────┐
│ Clinical records                             │
│ MOH 216, immunization, growth, referrals     │
│ Server-authorized writes                     │
└──────────────────────┬───────────────────────┘
                       │
┌──────────────────────▼───────────────────────┐
│ Deterministic engines                        │
│ Pregnancy, immunization, Td, growth, etc.    │
└──────────────────────┬───────────────────────┘
                       │
              ┌────────┴────────┐
              ▼                 ▼
        Mother/Clinician       Haven
        experiences            AI companion
```

### Frontend

React 19 + TypeScript + Vite + Tailwind CSS. The frontend is a mobile-first PWA with role-specific experiences for mothers, partners, clinicians, and administrators.

### Backend

Node.js + Express running on Google Cloud Run. The backend handles authentication checks, clinical writes, clinician access sessions, reports, reminders, synchronization, and the server-side Haven integration.

### Data

Firebase Firestore is used for application and clinical data. Client-side writes to authoritative clinical collections are locked down in Firestore rules; those mutations go through the server where authorization and audit logging can be applied consistently.

### Offline support

The app includes an offline/outbox layer for unreliable connectivity and a separate deterministic emergency path. The emergency flow is intentionally not dependent on the AI service being available.

## Security model

Clinical data is treated differently from ordinary application state.

### Clinician access

A clinician does not get blanket access to every mother in the system. A mother creates a short-lived access session and shares the generated code with the clinician. The backend verifies the clinician's status, validates the session, scopes access to that mother, and records the relevant access events.

### Clinical writes

Important clinical collections are not writable directly from the browser. The server is responsible for validating and recording changes to clinical encounters, immunizations, growth measurements, referrals, and other protected records.

### Provenance

MomHaven keeps track of where important information came from. In practice, that means distinguishing between information a mother reported, information derived by the system, and information that a clinician has verified.

This provenance is also used when building Haven's context.

## Repository layout

```text
.
├── .github/workflows/       # CI and Cloud Run deployment
├── src/
│   ├── components/          # UI grouped by product/clinical domain
│   ├── data/                # KEPI, WHO growth data, resources
│   ├── lib/                 # Firebase client setup and helpers
│   ├── services/            # Client services, sync, Today context
│   ├── types/               # Shared TypeScript types
│   └── utils/               # Clinical calculation engines
├── server.ts                # Express application entry point
├── server/
│   ├── jobs/                # Background jobs
│   ├── routes/              # API routes
│   ├── seed/                # Demo data tooling
│   ├── services/             # Backend services
│   └── clinicianAccess.ts   # Clinician authorization/session logic
├── functions/               # Firebase functions used by the project
├── firestore.rules          # Firestore access rules
├── firestore.indexes.json  # Firestore indexes
├── Dockerfile               # Production container
└── package.json             # Scripts and dependencies
```

## Running locally

### Requirements

- Node.js 20+
- npm 10+
- Firebase project/credentials for features that require the backend
- Docker is optional

### Install

```bash
git clone https://github.com/jj-tech-ranger/mom-haven.git
cd mom-haven
npm install
```

### Environment

Start from the example file:

```bash
cp .env.example .env
```

The exact environment used depends on which parts of the application you are running. Common variables include:

| Variable | Purpose |
|---|---|
| `FIREBASE_API_KEY` | Firebase client configuration |
| `FIREBASE_PROJECT_ID` | Firebase/Google Cloud project |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Server-side Firebase Admin credentials |
| `FIRESTORE_DATABASE_ID` | Firestore database ID when using a non-default database |
| `GEMINI_API_KEY` | Server-side Haven access |
| `GEMINI_MODEL` | Haven model identifier |
| `GOOGLE_CLOUD_LOCATION` | Google Cloud deployment location |
| `INTERNAL_JOB_SECRET` | Protection for internal job endpoints |
| `VITE_FIREBASE_VAPID_KEY` | Web push notifications |

Never commit service-account credentials or other secrets to the repository.

### Development server

```bash
npm run dev
```

The development server runs on port 3000 by default.

### Build

```bash
npm run build
npm run start
```

## Testing

The repository has separate test suites for the clinical engines, security-sensitive services, AI context, reminders, sharing, referrals, demo data, and other core flows.

Run the full suite with:

```bash
npm test
```

Useful targeted suites include:

```bash
npm run test:clinical
npm run test:td
npm run test:today
npm run test:haven-context
npm run test:context
npm run test:summary
npm run test:sharing
npm run test:reminders
npm run test:encounters
npm run test:referrals
```

Before opening a PR, also run:

```bash
npm run lint
npm run build
```

Demo data can be managed with:

```bash
npm run seed:demo
npm run verify:demo
npm run clean:demo
```

## Deployment

The application is containerized and deployed to Google Cloud Run. GitHub Actions handles validation and deployment, with Google Cloud Workload Identity Federation used for keyless authentication.

The CI pipeline runs the test suite and production build before deployment.

## Project status

MomHaven is under active development. The main product areas are implemented, but this is still a software project rather than a finished clinical product or certified medical device.

Some areas—particularly the anonymous/guest experience, offline synchronization, and parts of the background-job architecture—are still being refined.

If you are evaluating the project, the code and tests are the best source of truth for what is currently implemented.

## Contributing

If you're working on MomHaven, keep a few principles in mind:

1. Keep clinical calculations deterministic and centralized.
2. Don't put authoritative clinical writes directly in the client.
3. Preserve provenance when adding or transforming health information.
4. Treat offline and emergency flows as safety-critical paths.
5. Keep Haven grounded in application data and out of diagnosis/prescribing.
6. Prefer small, testable services over duplicating clinical logic in UI components.

## License

See the repository for the current licensing terms.
