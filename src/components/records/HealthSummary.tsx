import React from 'react';
import {
  Heart,
  Baby,
  Activity,
  ShieldCheck,
  Calendar,
  Syringe,
  TrendingUp,
  AlertTriangle,
  User,
  CheckCircle2,
  FileQuestion,
  Printer,
  Sparkles,
  MapPin,
  Utensils,
  Languages,
  Clock,
} from 'lucide-react';
import type { MomHavenHealthSummary } from '../../types/healthSummary';
import ProvenanceBadge from '../common/ProvenanceBadge';
import Button from '../Button';

interface HealthSummaryProps {
  summary: MomHavenHealthSummary;
  onPrint?: () => void;
  onRefresh?: () => void;
  isClinicianView?: boolean;
}

export default function HealthSummary({
  summary,
  onPrint,
  onRefresh,
  isClinicianView = false,
}: HealthSummaryProps) {
  const {
    mother,
    patientContext,
    pregnancy,
    children,
    recentHealthLogs,
    verifiedHighlights,
    questionsForClinician,
    sessionContext,
    reproductiveScreening,
    pmtct,
  } = summary;

  return (
    <div id="momhaven-health-summary-container" className="space-y-5">
      {/* Reproductive Health / Screening Sensitive Alert Banner */}
      {reproductiveScreening?.hasSuspiciousOrPositive && (
        <div className="p-4 bg-pink-50/90 border border-pink-200 rounded-[20px] text-xs text-pink-950 flex items-start gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center shrink-0 mt-0.5">
            <Heart className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-sm text-pink-950">
              {isClinicianView
                ? 'Clinical Referral Flag: Reproductive Screening Finding (MOH p.22)'
                : 'Healthcare Provider Follow-up Recommendation'}
            </h3>
            <p className="mt-1 text-pink-900 leading-relaxed">
              {isClinicianView ? (
                <span>
                  The patient's clinical screening record indicates an abnormal or suspicious examination result.
                  {reproductiveScreening.alerts.length > 0 && ` Flags: ${reproductiveScreening.alerts.join('; ')}.`}
                  {' '}Ensure timely referral for colposcopy/biopsy or surgical breast review per national guidelines.
                </span>
              ) : (
                <span>
                  Your healthcare provider noted an observation during your recent screening that deserves a specialized follow-up visit. Remember that many findings turn out to be easily treatable when checked early. Please visit your clinic or referral facility so your team can care for you with complete peace of mind.
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* PMTCT Sensitive Alert Banner */}
      {pmtct?.hasAlerts && (
        <div className="p-4 bg-rose-50/90 border border-rose-200 rounded-[20px] text-xs text-rose-950 flex items-start gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-sm text-rose-950">
              {isClinicianView
                ? 'Clinical Alert: PMTCT / HEI Follow-up Indicated (MOH pp.11–12, 36)'
                : 'Specialized Appointment Recommended'}
            </h3>
            <p className="mt-1 text-rose-900 leading-relaxed">
              {isClinicianView ? (
                <span>
                  Active PMTCT / HEI flag: {pmtct.alerts.join('; ') || 'Follow-up indicated'}.
                  Ensure immediate clinical review, adherence counseling, or pediatric ART initiation if positive.
                </span>
              ) : (
                <span>
                  Your healthcare team has highlighted a priority follow-up milestone for your care plan. Please visit your clinic at your earliest convenience so your nurse or doctor can review your routine medications and support you.
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Action Header / Banner */}
      <div className="bg-white border border-[var(--border-hairline)] p-5 rounded-[22px] shadow-card-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider font-display font-bold text-[var(--haven-orchid)]">
                {isClinicianView ? 'Clinician Consultation Context' : 'MomHaven Health Summary'}
              </span>
              {verifiedHighlights.hasVerifiedPregnancy && (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Clinically Verified
                </span>
              )}
            </div>
            <h1 className="font-display font-extrabold text-2xl text-[var(--ink-900)] mt-0.5">
              {mother.displayName}
            </h1>
            <p className="text-xs text-[var(--ink-500)] mt-1 flex items-center gap-3 flex-wrap">
              <span>Lifecycle: <strong className="capitalize text-[var(--ink-700)]">{patientContext.lifecycleStage}</strong></span>
              {patientContext.location?.county && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {patientContext.location.county} County
                  {patientContext.location.primaryHospitalName ? ` · ${patientContext.location.primaryHospitalName}` : ''}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Languages className="w-3 h-3" />
                {patientContext.language === 'sw' ? 'Kiswahili' : 'English'}
              </span>
              {sessionContext?.expiresAt && (
                <span className="text-amber-700 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Session active until {new Date(sessionContext.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onPrint && (
              <Button
                type="button"
                variant="outline"
                onClick={onPrint}
                className="py-2 px-3.5 text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Export
              </Button>
            )}
            {onRefresh && (
              <Button
                type="button"
                variant="outline"
                onClick={onRefresh}
                className="py-2 px-3.5 text-xs"
              >
                Refresh
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Section 1: Questions for Clinician / Visit Preparation */}
      <section className="bg-amber-50/70 border border-amber-200/80 rounded-[20px] p-4.5 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
            <FileQuestion className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="font-display font-bold text-sm text-amber-950">
                {isClinicianView ? "Mother's Questions for This Visit" : 'My Questions for the Doctor / Nurse'}
              </h2>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md uppercase tracking-wider">
                Mother Reported
              </span>
            </div>
            {questionsForClinician.length > 0 ? (
              <ul className="mt-2.5 space-y-1.5">
                {questionsForClinician.map((q, idx) => (
                  <li key={idx} className="text-xs text-amber-900 flex items-start gap-2 bg-white p-2.5 rounded-md border border-amber-200 shadow-xs">
                    <span className="font-bold text-amber-600 shrink-0">Q{idx + 1}:</span>
                    <span className="leading-relaxed">{q}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-amber-800/80 mt-1.5 leading-relaxed italic">
                No specific visit questions recorded yet. The mother can add discussion points in MomHaven prior to her appointment.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Section 2: Authoritative Obstetric / Pregnancy Summary */}
      {pregnancy.hasActivePregnancy ? (
        <section className="bg-white border border-[var(--border-hairline)] rounded-[22px] p-5 shadow-card-1 space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--border-hairline)] flex-wrap">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-[var(--haven-deep)]" />
              <h2 className="font-display font-bold text-base text-[var(--ink-900)]">
                Authoritative Obstetric Record
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                pregnancy.provenance === 'VERIFIED'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {pregnancy.provenance === 'VERIFIED' ? 'Clinically Verified' : 'Mother Reported'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-[var(--lavender-50)] rounded-xl border border-purple-100">
              <p className="text-[11px] font-bold text-[var(--ink-500)] uppercase">Current Stage</p>
              <p className="text-base font-extrabold text-[var(--haven-deep)] mt-0.5">
                Week {pregnancy.currentStage?.gestationalAgeWeeks ?? '—'}
              </p>
              <p className="text-[11px] text-[var(--ink-600)]">
                Trimester {pregnancy.currentStage?.trimester ?? '—'}
              </p>
            </div>

            <div className="p-3 bg-[var(--lavender-50)] rounded-xl border border-purple-100">
              <p className="text-[11px] font-bold text-[var(--ink-500)] uppercase">Expected Delivery (EDD)</p>
              <p className="text-sm font-bold text-[var(--ink-900)] mt-0.5">
                {pregnancy.edd ? new Date(pregnancy.edd).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending LMP'}
              </p>
              <p className="text-[11px] text-[var(--ink-500)]">
                {pregnancy.currentStage?.daysRemaining ? `${pregnancy.currentStage.daysRemaining} days remaining` : 'LMP basis'}
              </p>
            </div>

            <div className="p-3 bg-[var(--lavender-50)] rounded-xl border border-purple-100">
              <p className="text-[11px] font-bold text-[var(--ink-500)] uppercase">Obstetric History</p>
              <p className="text-sm font-bold text-[var(--ink-900)] mt-0.5">
                Gravida {pregnancy.gravida ?? 1} · Para {pregnancy.parity ?? 0}
              </p>
              <p className="text-[11px] text-[var(--ink-500)]">
                LMP: {pregnancy.lmp || 'Not specified'}
              </p>
            </div>

            <div className="p-3 bg-[var(--lavender-50)] rounded-xl border border-purple-100">
              <p className="text-[11px] font-bold text-[var(--ink-500)] uppercase">ANC Contacts</p>
              <p className="text-sm font-bold text-[var(--ink-900)] mt-0.5">
                {pregnancy.ancSummary.totalEncounters} visits logged
              </p>
              <p className="text-[11px] text-emerald-700 font-semibold">
                {pregnancy.ancSummary.verifiedCount} verified by clinician
              </p>
            </div>
          </div>

          {/* Clinical Conditions */}
          {pregnancy.clinicalConditions.length > 0 && (
            <div className="p-3 rounded-xl bg-red-50/70 border border-red-200/80 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-red-900 block">Noted Clinical Conditions / Risk Factors:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {pregnancy.clinicalConditions.map((cond, i) => (
                    <span key={i} className="text-[11px] font-semibold bg-white text-red-700 px-2 py-0.5 rounded-md border border-red-200">
                      {cond}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recent ANC Encounters List */}
          {pregnancy.ancSummary.encounters.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-bold text-[var(--ink-700)] uppercase tracking-wider">
                Antenatal Contacts Timeline
              </p>
              <div className="divide-y divide-[var(--border-hairline)] border border-[var(--border-hairline)] rounded-xl overflow-hidden">
                {pregnancy.ancSummary.encounters.slice(0, 4).map((enc) => (
                  <div key={enc.id} className="p-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-[var(--ink-900)] font-display">
                          ANC Contact #{enc.visitNumber || '—'}
                        </strong>
                        <span className="text-[var(--ink-500)]">({enc.date})</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          enc.provenance.status === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {enc.provenance.status === 'VERIFIED' ? 'Verified by Clinician' : 'Mother Reported'}
                        </span>
                      </div>
                      <div className="text-[var(--ink-600)] mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                        {enc.bloodPressure && <span>BP: <strong>{enc.bloodPressure}</strong></span>}
                        {enc.fundalHeightCm && <span>Fundal Height: <strong>{enc.fundalHeightCm} cm</strong></span>}
                        {enc.fetalHeartRate && <span>FHR: <strong>{enc.fetalHeartRate} bpm</strong></span>}
                        {enc.hemoglobin && <span>Hb: <strong>{enc.hemoglobin} g/dL</strong></span>}
                        {enc.iptpGiven && <span className="text-emerald-700 font-semibold">IPTp Given</span>}
                        {enc.ifasGiven && <span className="text-emerald-700 font-semibold">IFAS Given</span>}
                      </div>
                    </div>
                    {enc.provenance.verifiedBy && (
                      <span className="text-[11px] text-[var(--ink-400)] shrink-0">
                        Signed: {enc.provenance.verifiedBy}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      ) : null}

      {/* Section 2.5: PMTCT & Infant Protection Protocol (MOH pp.11–12, 36) */}
      {pmtct && (
        <section className="bg-white border border-[var(--border-hairline)] rounded-[22px] p-5 shadow-card-1 space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--border-hairline)]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-rose-600" />
              <h2 className="font-display font-bold text-base text-[var(--ink-900)]">
                {isClinicianView
                  ? 'PMTCT & HEI Clinical Care Protocol (MOH pp.11–12, 36)'
                  : 'Maternal & Baby Wellness Care Plan'}
              </h2>
            </div>
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
              {isClinicianView ? 'Clinical Protocol' : 'Care Plan'}
            </span>
          </div>

          {isClinicianView ? (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-slate-500 font-medium block">Maternal ART Regimen:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {pmtct.maternalArtRegimen || 'Standard First-Line (TDF+3TC+DTG)'}
                  </span>
                  <span className="text-[11px] text-slate-600 block mt-1">
                    {pmtct.maternalArtVisitsCount} ART visits recorded
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-slate-500 font-medium block">Viral Load Status:</span>
                  <span className={`font-bold font-mono ${
                    pmtct.maternalViralLoadStatus === 'unsuppressed' ? 'text-rose-700' : 'text-emerald-700'
                  }`}>
                    {pmtct.maternalViralLoadStatus || 'Suppressed (< 50 copies/mL)'}
                  </span>
                  {pmtct.maternalViralLoadResult && (
                    <span className="text-[11px] text-slate-600 block">
                      Result: {pmtct.maternalViralLoadResult}
                    </span>
                  )}
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-slate-500 font-medium block">Infant Prophylaxis:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {pmtct.infantArtProphylaxisRegimen || 'AZT + NVP Syrup'}
                  </span>
                  <span className="text-[11px] text-slate-600 block mt-1">
                    CTX: {pmtct.infantCtxProphylaxisStatus || 'Active daily'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Your personalized preventive care plan helps protect you and your baby during pregnancy, childbirth, and breastfeeding.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-rose-50/50 border border-rose-100 rounded-xl space-y-1.5">
                  <span className="font-bold text-rose-950 block">Daily Protection & Routine Care</span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-700">
                    <li>Take prescribed maternal wellness medicines daily at the same time.</li>
                    <li>Give baby daily protective drops as instructed by your healthcare provider.</li>
                    <li>Continue balanced nutrition and plenty of clean water.</li>
                  </ul>
                </div>
                <div className="p-3.5 bg-teal-50/50 border border-teal-100 rounded-xl space-y-1.5">
                  <span className="font-bold text-teal-950 block">Appointments & Next Steps</span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-700">
                    <li>Keep your scheduled antenatal and infant check-ups.</li>
                    <li>Milestone infant check-up scheduled at 6 weeks of age.</li>
                    <li>Ask your healthcare provider any questions about safe feeding at every visit.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Section 3: Children & Pediatric Health (Layer 3) */}
      {children.length > 0 && (
        <section className="bg-white border border-[var(--border-hairline)] rounded-[22px] p-5 shadow-card-1 space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--border-hairline)]">
            <div className="flex items-center gap-2">
              <Baby className="w-4 h-4 text-[var(--haven-deep)]" />
              <h2 className="font-display font-bold text-base text-[var(--ink-900)]">
                Children & Pediatric Health Record
              </h2>
            </div>
            <span className="text-xs text-[var(--ink-500)]">
              {children.length} {children.length === 1 ? 'child' : 'children'} linked
            </span>
          </div>

          <div className="space-y-3">
            {children.map(child => (
              <div key={child.id} className="p-4 rounded-xl bg-[var(--lavender-50)] border border-purple-100 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <h3 className="font-display font-bold text-sm text-[var(--ink-900)]">
                      {child.name}
                    </h3>
                    <p className="text-xs text-[var(--ink-600)]">
                      Age: <strong>{child.ageFormatted}</strong> · Born: {child.dateOfBirth || 'Unknown'} {child.sex ? `· ${child.sex}` : ''}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    child.provenance === 'VERIFIED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {child.provenance === 'VERIFIED' ? 'Clinically Verified Child' : 'Mother Reported'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Immunizations */}
                  <div className="bg-white p-3 rounded-lg border border-[var(--border-hairline)]">
                    <div className="flex items-center gap-1.5 text-[var(--haven-deep)] font-bold mb-1">
                      <Syringe className="w-3.5 h-3.5" />
                      KEPI Immunizations
                    </div>
                    <p className="text-[var(--ink-600)]">
                      {child.immunizations.totalAdministered} vaccines documented ({child.immunizations.verifiedCount} verified)
                    </p>
                    {child.immunizations.recentRecords.length > 0 && (
                      <div className="mt-1.5 space-y-1">
                        {child.immunizations.recentRecords.slice(0, 3).map(rec => (
                          <div key={rec.id} className="text-[11px] flex items-center justify-between text-[var(--ink-500)]">
                            <span>{rec.vaccineName} ({rec.dateGiven})</span>
                            <span className={rec.provenance.status === 'VERIFIED' ? 'text-emerald-600 font-semibold' : 'text-amber-600'}>
                              {rec.provenance.status === 'VERIFIED' ? 'Verified' : 'Reported'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Growth & Nutrition */}
                  <div className="bg-white p-3 rounded-lg border border-[var(--border-hairline)]">
                    <div className="flex items-center gap-1.5 text-[var(--haven-deep)] font-bold mb-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Growth & Nutrition
                    </div>
                    {child.growth.latestWeightKg || child.growth.latestMuacMm ? (
                      <div className="text-[var(--ink-600)] space-y-0.5">
                        {child.growth.latestWeightKg && <div>Weight: <strong>{child.growth.latestWeightKg} kg</strong></div>}
                        {child.growth.latestHeightCm && <div>Height: <strong>{child.growth.latestHeightCm} cm</strong></div>}
                        {child.growth.latestMuacMm && (
                          <div className="flex items-center gap-1.5">
                            <span>MUAC: <strong>{child.growth.latestMuacMm} mm</strong></span>
                            {child.growth.muacClassification && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                child.growth.muacClassification === 'NORMAL'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {child.growth.muacClassification}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[var(--ink-400)] italic">No growth measurements recorded yet.</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 4: Recent Home Monitoring & Danger Signs (Layer 2/3) */}
      <section id="recent-health-logs" className="bg-white border border-[var(--border-hairline)] rounded-[22px] p-5 shadow-card-1 space-y-3">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[var(--haven-deep)]" />
            <h2 className="font-display font-bold text-base text-[var(--ink-900)]">
              Home Health Logs (Recent 30 Days)
            </h2>
          </div>
          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Mother Reported
          </span>
        </div>

        <p className="text-xs text-[var(--ink-500)] leading-relaxed">
          Clinically relevant self-monitoring entries (blood pressure, weight, baby movements, and symptoms). Private personal journal entries are omitted.
        </p>

        {recentHealthLogs.length > 0 ? (
          <div className="divide-y divide-[var(--border-hairline)] border border-[var(--border-hairline)] rounded-xl overflow-hidden">
            {recentHealthLogs.slice(0, 6).map(log => (
              <div key={log.id} className="p-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[var(--ink-900)] uppercase tracking-wide text-[11px]">
                      {log.type.replace('_', ' ')}
                    </span>
                    <span className="text-[var(--ink-400)]">·</span>
                    <span className="text-[var(--ink-500)]">
                      {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {log.hasDangerSigns && (
                      <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Danger Sign Flagged
                      </span>
                    )}
                  </div>
                  <div className="text-[var(--ink-700)] mt-0.5">
                    {log.type === 'blood_pressure' && (
                      <span>Reading: <strong>{log.values.systolic}/{log.values.diastolic} mmHg</strong> (Pulse: {log.values.pulse || '—'})</span>
                    )}
                    {log.type === 'weight' && (
                      <span>Weight: <strong>{log.values.weightKg} kg</strong></span>
                    )}
                    {log.type === 'baby_movement' && (
                      <span>Movement: <strong>{log.values.movementCount} kicks</strong> in {log.values.durationMinutes || 60} mins</span>
                    )}
                    {log.type === 'symptoms' && (
                      <span>Reported: <strong>{Array.isArray(log.values.symptoms) ? log.values.symptoms.join(', ') : 'None'}</strong> (Severity: {log.values.severity || 'mild'})</span>
                    )}
                  </div>
                  {log.dangerSignsList && log.dangerSignsList.length > 0 && (
                    <p className="text-red-700 text-[11px] font-semibold mt-1">
                      Flags: {log.dangerSignsList.join(' · ')}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 self-start sm:self-auto shrink-0">
                  Mother Reported
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--ink-400)] italic p-3 bg-[var(--lavender-50)] rounded-xl">
            No home vital measurements or symptom alerts recorded in the past 30 days.
          </p>
        )}
      </section>

      {/* Section 5: Personalization & Social Support Context (Layer 2) */}
      <section className="bg-white border border-[var(--border-hairline)] rounded-[22px] p-5 shadow-card-1 space-y-3">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[var(--haven-deep)]" />
            <h2 className="font-display font-bold text-base text-[var(--ink-900)]">
              Personalization & Social Context
            </h2>
          </div>
          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Mother Reported
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-[var(--lavender-50)] rounded-xl border border-purple-100">
            <span className="text-[11px] font-bold text-[var(--ink-500)] uppercase block mb-1">
              Support System
            </span>
            <p className="font-bold text-[var(--ink-800)] capitalize">
              {patientContext.supportSystem || 'Not disclosed'}
            </p>
          </div>

          <div className="p-3 bg-[var(--lavender-50)] rounded-xl border border-purple-100">
            <span className="text-[11px] font-bold text-[var(--ink-500)] uppercase block mb-1">
              Dietary Preferences
            </span>
            <p className="font-bold text-[var(--ink-800)]">
              {patientContext.dietaryPreferences.length > 0
                ? patientContext.dietaryPreferences.join(', ')
                : 'Standard maternal diet'}
            </p>
          </div>

          <div className="p-3 bg-[var(--lavender-50)] rounded-xl border border-purple-100">
            <span className="text-[11px] font-bold text-[var(--ink-500)] uppercase block mb-1">
              Communication Preference
            </span>
            <p className="font-bold text-[var(--ink-800)]">
              {patientContext.language === 'sw' ? 'Kiswahili' : 'English'} · {patientContext.havenResponseStyle || 'concise'} guidance
            </p>
          </div>
        </div>
      </section>

      {/* Section 6: Verified Clinical Highlights Summary */}
      <section className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <div className="flex items-center gap-2 text-emerald-950 font-display font-bold text-sm mb-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          Verified Clinical Records Summary
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-white p-2.5 rounded-md border border-emerald-200 shadow-xs">
            <span className="text-[11px] text-emerald-800 block">Verified Contacts</span>
            <strong className="text-base text-emerald-900">{verifiedHighlights.verifiedAncContactsCount}</strong>
          </div>
          <div className="bg-white p-2.5 rounded-md border border-emerald-200 shadow-xs">
            <span className="text-[11px] text-emerald-800 block">Verified Vaccines</span>
            <strong className="text-base text-emerald-900">{verifiedHighlights.verifiedVaccinesCount}</strong>
          </div>
          <div className="bg-white p-2.5 rounded-md border border-emerald-200 shadow-xs">
            <span className="text-[11px] text-emerald-800 block">Verified Labs</span>
            <strong className="text-base text-emerald-900">{verifiedHighlights.verifiedLabReportsCount}</strong>
          </div>
          <div className="bg-white p-2.5 rounded-md border border-emerald-200 shadow-xs">
            <span className="text-[11px] text-emerald-800 block">Verified Ultrasounds</span>
            <strong className="text-base text-emerald-900">{verifiedHighlights.verifiedUltrasoundCount}</strong>
          </div>
        </div>
        {verifiedHighlights.lastClinicalVerificationDate && (
          <p className="text-[11px] text-emerald-800 mt-2">
            Latest verification: {new Date(verifiedHighlights.lastClinicalVerificationDate).toLocaleDateString()}
            {verifiedHighlights.verifiedBy ? ` by ${verifiedHighlights.verifiedBy}` : ''}
          </p>
        )}
      </section>
    </div>
  );
}
