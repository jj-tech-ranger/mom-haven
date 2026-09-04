# MomHaven — Real Anonymous Mode Technical Scoping Plan (P11.1)

**Document Reference:** `docs/anonymous-mode-plan.md`  
**Status:** Scoping & Architectural Plan (No implementation code)  
**Related Audits:** §10.6, §13.9

---

## 1. Defining "Real" Anonymous Mode for MomHaven

In consumer maternal health applications, "Anonymous Mode" frequently implies complete de-identification or zero-knowledge data isolation. In MomHaven's current codebase:
- **Current State:** The user-facing experience has been designated as **"Guest mode" / "Explore mode"** (`AnonymousMotherShell.tsx`, `GuestDailyCheckInCard.tsx`). It relies on `localStorage` (`momhaven_anon_context_v1`) via `anonymousContextService.ts` for transient preferences (stage, week, language, haven style, mood).
- **"Real" Anonymous Mode Definition:** A durable, **fully local-first architecture** where a mother can use the application indefinitely—logging daily moods, symptom trends, kick counts, and offline checklists—without ever establishing a Firebase Authentication credential or sending identifiable records to a cloud database.

### Inventory: Local-Only vs. Firestore-Dependent Capabilities Today

| Domain / Feature | Current Implementation | Local-Only Today? | Silently Requires Firestore? |
| :--- | :--- | :--- | :--- |
| **Personalization Context** | `anonymousContextService.ts` (`localStorage`) | **Yes** (saved in browser `localStorage`) | No |
| **Daily Mood & Energy** | `GuestDailyCheckInCard.tsx` / `anonymousContextService.ts` | **Yes** (via `AnonymousContextDraft.moodHistory`) | No |
| **General Health Logs (BP, Weight, Symptoms)** | `healthLogService.ts` (`logHealthEntry`) | **Partial** (`memoryLogsMap` in RAM fallback) | **Yes** — if unauthenticated, entries live in in-memory map and vanish on page refresh unless authenticated with `users/{uid}/health_logs` |
| **Pregnancy ANC Records** | `pregnancyService.ts` | **No** | **Yes** — calls `doc(db, 'users', userId)` directly |
| **Child & Immunization Passport** | `childService.ts` | **No** | **Yes** — queries Firestore collections `children` and `immunizations` |
| **Document Vault** | `documentVaultService.ts` | **No** | **Yes** — writes to Firebase Storage and Firestore document metadata |
| **Partner Sharing** | `sharingService.ts` | **No** | **Yes** — requires shared access tokens, Firestore documents, and bidirectional permissions |
| **Clinician Integration** | `clinicianService.ts` | **No** | **Yes** — requires authenticated session and Firestore RBAC |

---

## 2. Safe Local-Forever Data vs. Benefits of Cloud Sync

### Safe to Keep Local Forever (High Privacy / Ephemeral Utility)
1. **Daily Moods & Emotional Reflections:** Highly personal self-reflection data. If lost, it does not jeopardize immediate clinical safety. Keeping this local provides absolute peace of mind against data breaches or stigma.
2. **Personalization & Haven Guidance Style:** Preferences such as response conciseness, language (`en`/`sw`), and general interests.
3. **Draft Kick Counts & Contraction Timers:** Single-session operational utilities that serve immediate clinical decision-making (e.g. going to triage) rather than longitudinal tracking.
4. **Temporary Symptom Scratchpads:** Quick notes before an upcoming clinic appointment.

### Genuinely Benefits from Cloud Sync (Clinical Continuity & Safety)
1. **MOH 216 ANC Visit Records:** Essential for continuity of care if a mother changes facilities or presents to an emergency triage hospital in Kenya.
2. **Childhood Immunization Passport (KEPI Schedule):** A lost phone should never erase a child's BCG, Pentavalent, or Measles-Rubella vaccine history. School admissions and clinical assessments depend on verified immunization records.
3. **High-Risk Maternal Flags (Pre-eclampsia history, gestational diabetes, surgical history):** Crucial during labor and delivery when maternal memory may be impaired by distress or emergency complications.
4. **Multi-device Protection:** Kenya has high smartphone replacement and repair rates; a purely local storage model results in complete data loss when a phone is reset, lost, or water-damaged.

---

## 3. "Upgrade to Synced Account" Migration Flow

MomHaven already possesses a preliminary migration bridge via `syncAnonymousContext()` (`src/services/anonymousContextService.ts`) and the backend endpoint `POST /api/v1/sync/context` (`server/routes/contextSync.ts`).

### Step-by-Step Upgrade Flow
1. **Trigger:** Guest taps *"Save your journey with an account"* from the banner or header.
2. **Account Creation:** User completes email/phone registration via Firebase Auth (`createUserWithEmailAndPassword` or OAuth).
3. **Staging the Local Draft:**
   - Retrieve full local state: `AnonymousContextDraft` (including `moodHistory`, `interests`, `lifecycleStage`, and local symptom entries).
4. **Secure Server Payload Submission:**
   - Client calls `POST /api/v1/sync/context` with the authenticated `Authorization: Bearer <token>` header.
   - **Schema Extension Needed in `contextSync.ts`:**
     Currently, `contextSync.ts` validates `draft` using a strict Zod schema that only includes:
     ```ts
     lifecycleStage, dueDate, pregnancyWeek, language, interests, havenResponseStyle, county
     ```
     **Missing fields required for complete migration:**
     - `moodHistory`: Array of `{ date: string, mood: MoodType, energyLevel?: number, note?: string }` (added in P8.1).
     - `localHealthLogs`: Array of client-validated health logs (BP, symptoms, kick counts).
5. **Server Processing & Atomic Batch Commit:**
   - Server validates each entry against strict clinical bounds (stripping any client-supplied document IDs or arbitrary roles).
   - Writes `users/{uid}` context metadata.
   - Batch-inserts mood entries into `users/{uid}/health_logs` with `provenance: "guest_migration"`.
6. **Local Cleansing:**
   - Upon confirmed HTTP 200 response from `/api/v1/sync/context`, execute `clearAnonymousContextDraft()` and flush local scratchpads.

---

## 4. Explicit Tradeoffs to Flag for Stakeholder Review

1. **Catastrophic Device-Loss Data Recovery:**
   - In pure local-first anonymous mode, clearing browser cookies/cache or losing the device results in 100% unrecoverable data loss. No customer support or clinician can restore it. This must be prominently disclosed.
2. **Push Notifications for Daily Check-ins:**
   - Web Push (FCM / VAPID) requires a device token stored on a server to trigger scheduled push notifications. In a real anonymous mode, storing an FCM push token on a backend server without a user identity creates a pseudonymous tracking vector. To remain truly local, reminders must use local Web Notification APIs / Service Worker alarms when the PWA is running, which are less reliable when the browser is closed on mobile OSs.
3. **Complete Incompatibility with Partner Sharing:**
   - **Confirmed:** A guest in anonymous mode **CANNOT** be linked to a partner. Partner sharing requires asymmetric access control, sharing codes, and Firestore security rules to prevent unauthorized eavesdropping. An unauthenticated guest possesses no cryptographic identity or verifiable authorization scope. This must be clearly surfaced if an anonymous user attempts to open the Partner tab.
