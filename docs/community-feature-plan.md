# MomHaven — Peer Community & Group Channels Technical Plan (P11.2)

**Document Reference:** `docs/community-feature-plan.md`  
**Status:** Scoping & Architectural Plan (No implementation code)  
**Related Audits:** §14.3

---

## 1. Proposed Grouping Logic & Rationale

MomHaven already models maternal journey dimensions in `HealthContext`:
- `lifecycleStage`: `'pregnancy' | 'planning' | 'postpartum' | 'parenting' | 'supporter' | 'exploring'`
- `pregnancyWeek`: `1..42`
- `county`: Kenyan county identifier (e.g. Nairobi, Kiambu, Nakuru, Kisumu, Mombasa, etc.)

### Grouping Dimensions
1. **By Lifecycle Stage & Trimester Cohorts (Primary Axis):**
   - *First Trimester Circle (Weeks 1–13):* Focus on nausea, early ultrasound, folic acid, privacy anxieties.
   - *Second Trimester Circle (Weeks 14–27):* Nutrition, anomaly scans, kick counting, energy shifts.
   - *Third Trimester & Birth Prep (Weeks 28–40+):* Birth plans, hospital bag, labor signs, birth partner coordination.
   - *Fourth Trimester / Newborn (0–6 Months):* Postpartum recovery, breastfeeding, KEPI immunizations, maternal mental health.
   - *Toddler Care (6–24+ Months):* Weaning, milestones, growth monitoring.
   *Rationale:* Maternal needs change drastically week by week. Mixing early-pregnancy mothers with mothers discussing traumatic birth outcomes or newborn illnesses creates significant distress.

2. **By Geographic Region / Kenyan County (Secondary Opt-In Axis):**
   - *Local Healthcare Circles (e.g., Nairobi, Coastal, Western, Central, Rift Valley):* Focus on regional hospital experiences (e.g., Pumwani, Kenyatta National Hospital, Aga Khan, Coast General), local clinic hours, NHIF/SHIF insurance processing, and facility-specific referral pathways.
   *Rationale:* Healthcare navigation in Kenya is highly decentralized and localized to county health systems.

---

## 2. Minimum Moderation Model (Trust & Safety Architecture)

> **CRITICAL TRUST & SAFETY NOTICE:**  
> A maternal health community is **NOT a simple CRUD feature**. Peer interactions frequently touch upon medical crises (severe headaches, bleeding, decreased fetal movement), unverified traditional/herbal remedies (e.g., unregulated concoctions during pregnancy), perinatal depression, and infant illness. Launching community features without an integrated clinical moderation architecture poses severe clinical and legal liability.

### A. Pre-Join Community Covenant
- Before entering any peer space, the user must explicitly acknowledge:
  1. *No Medical Prescriptions:* Peers are not medical providers. Specific medications, dosages, and alternative treatments are strictly prohibited.
  2. *Emergency Protocol:* Immediate danger signs require immediate facility care, not forum discussion.
  3. *Zero Commercial Solicitation:* No sale of baby formulas, supplements, or paid services.
  4. *Mutual Dignity:* Strict zero-tolerance policy against shaming regarding feeding choices, delivery methods (C-section vs. vaginal), or marital status.

### B. Content Moderation Flow: Hybrid Pre/Post Model
1. **Automated Pre-Publish Safety Interceptor:**
   - Run posts through an automated regex and safety pipeline (reusing patterns from `shared/safety/dangerSignTriage.ts`):
     - *Emergency Trigger Words (e.g., bleeding, fits, chest pain, baby not breathing):* Immediately intercepts post, blocks submission, and presents an emergency banner with direct Kenyan emergency hotlines (1199, 999) and the nearest hospital locator.
     - *Banned Medical Claims / Toxic Advice:* Automatically holds post in a review queue.
2. **Post-Publish Reporting & Clinician Moderation:**
   - One-tap "Report Post" button with structured reasons: *Medical misinformation, Harmful advice, Harassment/Stigma, Emergency situation, Commercial spam*.
   - Reported content is hidden upon reaching a threshold of 2 unique flags pending human/clinical review in `ClinicalDecisionRegister.tsx`.
   - Verified clinicians and community managers have dedicated moderator tools to pin evidence-based answers and tag threads with official MOH 216 guidance.

---

## 3. Data Isolation: Complete Separation of Private Logs from Community Activity

**Default Security Posture: ZERO leakage of private logs.**

- **No Inferable Mood or Clinical State:**
  - A user's daily check-ins (e.g. logging "overwhelmed", "anxious", low energy, or BP readings) must **NEVER** be displayed, badged, or searchable in community spaces.
  - Profile cards in community threads must show only an opt-in pseudonymous identifier (e.g., *"Mama Wanjiku • 2nd Trimester"*) and joined date.
- **Anonymous/Pseudonymous Handles:**
  - Community handles must be detached from real names, email addresses, phone numbers, or national ID details.
- **Strict Opt-In Exception Policy:**
  - If a user chooses to share a snippet of their journey, it must be an explicit, conscious action typed by the user into the comment text box, never automated background syncing.

---

## 4. Phased Build Order

```
[Phase 1: Curated Q&A & Expert Guides]
          │
          ▼
[Phase 2: Asynchronous Moderated Topic Boards]
          │
          ▼
[Phase 3: Real-Time Peer Chat Circles]
```

1. **Phase 1: Read-Only Curated Peer Stories & Expert Q&A (Low Risk)**
   - Clinician-approved maternal stories and answers to common trimester questions.
   - User engagement is restricted to saving/bookmarking or reacting (e.g. helpful / supportive).
   - Validates user interest without opening user-generated safety surfaces.

2. **Phase 2: Asynchronous Moderated Topic Threads (Controlled Risk)**
   - Weekly structured prompt threads (e.g., *"Trimester 2: What was your experience with the anatomy scan?"*).
   - Pre-publish emergency keyword blocking + human post-moderation review queue.
   - Community reporting tools enabled.

3. **Phase 3: Real-Time Peer Group Chats (High Complexity & Risk)**
   - Live ephemeral group chats segmented by cohort or county.
   - Requires live on-call moderation, rate-limiting, and automated 24/7 crisis monitoring.
   - Only to be considered after Phase 2 moderation metrics demonstrate safety and compliance.
