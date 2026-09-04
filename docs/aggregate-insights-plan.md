# MomHaven — Aggregate "You're Not Alone" Social-Proof Insights Technical Plan (P11.3)

**Document Reference:** `docs/aggregate-insights-plan.md`  
**Status:** Scoping & Architectural Plan (No implementation code)  
**Related Audits:** §14.5

---

## 1. Minimum Cohort Size & k-Anonymity Guardrails

To reassure pregnant mothers and reduce isolation, maternal apps sometimes display peer-normative statistics (e.g., *"62% of mothers in Week 22 logged feeling tired this week"*). However, when cohorts are small or sliced thinly across geography, such statistics present serious **re-identification and differential privacy risks**.

### Mathematical Privacy Threshold: $k \ge 50$
- **Mandatory Cohort Floor:** No aggregate statement may be generated or displayed unless the underlying cohort size for the specific slicing interval contains at least **$N \ge 50$ distinct active users** who submitted a check-in within that aggregation window (e.g., trailing 7 days).
- **Behavior Below Threshold ($N < 50$):**
  - **Show Nothing / Silent Fallback:** If a cohort has fewer than 50 participants, the UI **must suppress the aggregate stat completely**.
  - **No Small-Sample Percentages:** Under no circumstances should the app display small-sample claims (e.g., *"2 out of 3 mothers in Garissa felt anxious today"*), which is statistically meaningless and exposes sensitive behavioral data in small communities.
  - **Clinical Baseline Fallback:** If visual reinforcement is needed, surface verified national MOH 216 population guidance instead (e.g., *"According to national guidelines, fatigue is a widely observed symptom during the second trimester"*), without claiming local live peer metrics.

---

## 2. Aggregation Architecture & Data Isolation

### Server-Side Only Aggregation Pipeline
Client devices must **never** receive raw peer log streams or calculate aggregates locally:
1. **Source Data Collection:** `users/{userId}/health_logs` contains private mother health logs. Direct cross-user reads are forbidden by `firestore.rules`.
2. **Scheduled Batch Aggregator (Server-Side Cron/Cloud Function):**
   - Runs once every 24 hours in a secure backend environment (`server/services/aggregateInsightService.ts`).
   - Slices logs into coarse buckets:
     - Gestational Bucket: Trimester 1, Trimester 2, Trimester 3, Newborn 0–3mo, Infant 3–12mo. (Grouping by single week is too sparse until user volume exceeds tens of thousands).
   - Only counts de-identified categorical values.
3. **Public Read-Only Target Collection (`aggregate_insights`):**
   - Writes pre-computed aggregate documents:
     ```json
     {
       "cohortId": "trimester_2",
       "period": "2026-W36",
       "sampleSize": 240,
       "moodDistribution": {
         "good": 0.48,
         "ok": 0.35,
         "low": 0.17
       },
       "topCategoricalSymptoms": ["fatigue", "backache"],
       "updatedAt": "2026-09-04T00:00:00Z"
     }
     ```
   - Client applications read strictly from this materialized aggregate document.

---

## 3. Explicit Non-Goals & Boundaries

1. **Zero Free-Text Aggregation:**
   - Free-text journal entries, notes, or chat queries must never be parsed, tokenized, or aggregated for social proof. Free-text invariably contains names, specific hospital references, or identifiable situations.
2. **Coarse Enums Only:**
   - Only coarse, de-identified-by-design enumerations may be aggregated:
     - `moodSignal`: `'good' | 'ok' | 'low'` (from P7.1)
     - Standard symptom tags from MOH 216 checklist: `'nausea' | 'fatigue' | 'backache' | 'headache'`
3. **Zero Clinical Diagnostic or Dangerous Data Surfacing:**
   - Red-flag symptoms (vaginal bleeding, convulsions, high blood pressure readings) must **NEVER** be socialized with "you're not alone" framing. Normalizing danger signs can dangerously delay emergency triage seeking.

---

## 4. Honest Architectural & Product Recommendation

### Verdict: **DO NOT BUILD AT THIS STAGE (Deprioritize)**

While the product desire for maternal normalization and empathy is understandable, building live aggregate peer insights introduces significant engineering overhead for questionable early-stage value:

| Factor | Assessment |
| :--- | :--- |
| **Privacy Risk** | High. Perinatal mental health and pregnancy complications in Kenya carry acute social stigma. Any accidental leakage or inference poses severe user trust harm. |
| **Cold-Start Failure** | High. For an app with tens or hundreds of early pilot users, slicing by stage and symptom will result in $N < 50$ in almost every cohort, meaning the feature will rarely activate or will require misleadingly broad grouping. |
| **Maintenance Burden** | Requires scheduled backend crons, new database collections, privacy audits, and differential privacy checks. |
| **User Value vs. MOH Norms** | Clinical guidance from the MOH 216 handbook already provides authoritative, comforting reassurance (e.g., *"Fatigue and nausea are expected adaptations in early pregnancy"*). This achieves the psychological benefit without collecting, computing, or exposing peer statistics. |

**Recommended Alternative:**
Rely on **curated clinical normalization messages** authored by healthcare professionals and integrated into `todayContextService.ts` / `getMicroInsight()`. These provide immediate comfort, require zero background crunching, and carry zero privacy or re-identification risk.
