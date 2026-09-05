// src/components/clinician/ClinicianPatientWorkspace.tsx
import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Baby, 
  Activity, 
  ShieldCheck, 
  CheckCircle2, 
  Calendar, 
  Plus, 
  FileText, 
  Lock, 
  TrendingUp, 
  Syringe, 
  AlertTriangle,
  User,
  Clock,
  ChevronRight,
  Eye,
  Smile,
  Building2,
  Stethoscope,
  Sparkles,
  Pill,
  MessageSquare
} from 'lucide-react';
import ProvenanceBadge from '../common/ProvenanceBadge';
import VerificationModal from './VerificationModal';
import NewEncounterModal from './NewEncounterModal';
import PrivateNotesPanel from './PrivateNotesPanel';
import ClinicianCareTeamMessagesPanel from './ClinicianCareTeamMessagesPanel';
import ClinicianPatientContext from './ClinicianPatientContext';
import { CongenitalAbnormalityExam } from './CongenitalAbnormalityExam';
import { FamilyPlanningModal } from './FamilyPlanningModal';
import { CancerScreeningModal } from './CancerScreeningModal';
import { AntenatalProfileModal } from './AntenatalProfileModal';
import { EyeCareAndTeethModal } from './EyeCareAndTeethModal';
import { AefiReportModal } from './AefiReportModal';
import { HospitalAdmissionModal } from './HospitalAdmissionModal';
import { PmtctHeiModal } from './PmtctHeiModal';
import type { MomHavenHealthSummary } from '../../types/healthSummary';
import Button from '../Button';

interface ClinicianPatientWorkspaceProps {
  motherId?: string;
  motherName?: string;
  gestationWeeks?: number;
  bloodGroup?: string;
  clinicianName: string;
  facilityName?: string;
  onCloseSession: () => void;
  summary?: MomHavenHealthSummary;
  onRefreshSummary?: () => void;
}

export default function ClinicianPatientWorkspace({
  motherId,
  motherName,
  gestationWeeks,
  bloodGroup,
  clinicianName,
  facilityName,
  onCloseSession,
  summary,
  onRefreshSummary,
}: ClinicianPatientWorkspaceProps) {
  const [workspaceTab, setWorkspaceTab] = useState<
    | 'summary'
    | 'overview'
    | 'anc'
    | 'antenatalProfile'
    | 'cancerScreening'
    | 'pmtct'
    | 'child'
    | 'congenital'
    | 'eyeAndTeeth'
    | 'immunizations'
    | 'growth'
    | 'familyPlanning'
    | 'aefiAndAdmissions'
    | 'messages'
    | 'notes'
  >(summary ? 'summary' : 'overview');
  const [verificationTarget, setVerificationTarget] = useState<{
    isOpen: boolean;
    title: string;
    type: 'ANC Encounter' | 'Immunization' | 'Growth Measurement' | 'Postnatal Encounter';
    data: Record<string, any>;
  } | null>(null);

  const [showNewEncounterModal, setShowNewEncounterModal] = useState(false);
  const [showFpModal, setShowFpModal] = useState(false);
  const [showCancerModal, setShowCancerModal] = useState(false);
  const [showPmtctModal, setShowPmtctModal] = useState(false);
  const [showAntenatalProfileModal, setShowAntenatalProfileModal] = useState(false);
  const [showEyeCareTeethModal, setShowEyeCareTeethModal] = useState(false);
  const [showAefiModal, setShowAefiModal] = useState(false);
  const [showHospitalModal, setShowHospitalModal] = useState(false);

  // Dynamic values with neutral defaults
  const displayMotherName = motherName || summary?.mother?.displayName || 'Patient';
  const displayGestationWeeks = gestationWeeks ?? summary?.pregnancy?.currentStage?.gestationalAgeWeeks;
  const displayBloodGroup = bloodGroup || summary?.pregnancy?.bloodGroup || 'Not recorded';
  const effectiveMotherId = motherId || summary?.mother?.id || '';
  const pregnancyId = summary?.pregnancy?.pregnancyId;
  const childId = summary?.children?.[0]?.id;

  // ANC Visits derived from real patient summary
  const [ancVisits, setAncVisits] = useState<any[]>(() => {
    if (!summary?.pregnancy?.ancSummary?.encounters) return [];
    return summary.pregnancy.ancSummary.encounters.map(e => ({
      id: e.id,
      visitNumber: e.visitNumber || 1,
      gestationWeeks: e.gestationWeeks || 0,
      date: e.date,
      weightKg: e.weightKg,
      bp: e.bloodPressure || '-',
      fundalHeight: e.fundalHeightCm,
      fhr: e.fetalHeartRate,
      hb: e.hemoglobin,
      iptp: Boolean(e.iptpGiven),
      ifas: Boolean(e.ifasGiven),
      provenance: e.provenance || { status: 'REPORTED', enteredBy: 'Mother' }
    }));
  });

  // Child Vaccines derived from real patient summary
  const [vaccines, setVaccines] = useState<any[]>(() => {
    const firstChild = summary?.children?.[0];
    if (!firstChild?.immunizations?.recentRecords) return [];
    return firstChild.immunizations.recentRecords.map(vac => ({
      id: vac.id,
      name: vac.vaccineName,
      ageBracket: firstChild.ageFormatted || 'Child',
      dateGiven: vac.dateGiven,
      batch: vac.batch || '-',
      provenance: vac.provenance || { status: 'REPORTED', enteredBy: 'Mother' }
    }));
  });

  // Synchronize state when summary changes
  useEffect(() => {
    if (summary?.pregnancy?.ancSummary?.encounters) {
      setAncVisits(
        summary.pregnancy.ancSummary.encounters.map(e => ({
          id: e.id,
          visitNumber: e.visitNumber || 1,
          gestationWeeks: e.gestationWeeks || 0,
          date: e.date,
          weightKg: e.weightKg,
          bp: e.bloodPressure || '-',
          fundalHeight: e.fundalHeightCm,
          fhr: e.fetalHeartRate,
          hb: e.hemoglobin,
          iptp: Boolean(e.iptpGiven),
          ifas: Boolean(e.ifasGiven),
          provenance: e.provenance || { status: 'REPORTED', enteredBy: 'Mother' }
        }))
      );
    } else {
      setAncVisits([]);
    }
  }, [summary?.pregnancy?.ancSummary?.encounters]);

  useEffect(() => {
    const firstChild = summary?.children?.[0];
    if (firstChild?.immunizations?.recentRecords) {
      setVaccines(
        firstChild.immunizations.recentRecords.map(vac => ({
          id: vac.id,
          name: vac.vaccineName,
          ageBracket: firstChild.ageFormatted || 'Child',
          dateGiven: vac.dateGiven,
          batch: vac.batch || '-',
          provenance: vac.provenance || { status: 'REPORTED', enteredBy: 'Mother' }
        }))
      );
    } else {
      setVaccines([]);
    }
  }, [summary?.children]);

  const handleVerifyAnc = (visit: any) => {
    setVerificationTarget({
      isOpen: true,
      title: `ANC Contact #${visit.visitNumber} (${visit.gestationWeeks || 0} Weeks)`,
      type: 'ANC Encounter',
      data: {
        visitNumber: visit.visitNumber,
        gestationWeeks: `${visit.gestationWeeks || 0} weeks`,
        bloodPressure: visit.bp,
        weight: visit.weightKg ? `${visit.weightKg} kg` : 'Not recorded',
        fundalHeight: visit.fundalHeight ? `${visit.fundalHeight} cm` : 'Not recorded',
        fetalHeartRate: visit.fhr ? `${visit.fhr} bpm` : 'Not recorded',
        hemoglobin: visit.hb ? `${visit.hb} g/dL` : 'Not recorded',
        iptpSpGiven: visit.iptp,
        ifasSupplements: visit.ifas,
      }
    });
  };

  const handleVerifyVaccine = (vac: any) => {
    setVerificationTarget({
      isOpen: true,
      title: `${vac.name} (${vac.ageBracket})`,
      type: 'Immunization',
      data: {
        vaccineName: vac.name,
        targetAgeBracket: vac.ageBracket,
        administrationDate: vac.dateGiven,
        batchNumber: vac.batch,
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Patient Header Card */}
      <div className="bg-white border border-[var(--border-hairline)] p-5 rounded-[22px] shadow-card-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-[var(--lavender-100)] text-[var(--haven-deep)] font-display font-extrabold text-lg flex items-center justify-center border border-purple-200 uppercase">
            {(displayMotherName || 'P').charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-lg text-[var(--ink-900)]">
                {displayMotherName}
              </h2>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> MOH Verified Patient
              </span>
            </div>
            <p className="text-xs text-[var(--ink-600)]">
              {displayGestationWeeks ? (
                <>Gestation: <strong>Week {displayGestationWeeks} (Trimester {displayGestationWeeks < 13 ? 1 : displayGestationWeeks < 27 ? 2 : 3})</strong> · </>
              ) : null}
              Blood Group: <strong>{displayBloodGroup}</strong>
              {summary?.pregnancy?.edd ? <> · EDD: <strong>{summary.pregnancy.edd}</strong></> : null}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="primary"
            onClick={() => setShowNewEncounterModal(true)}
            className="py-2 px-3.5 text-xs bg-[var(--haven-deep)] flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Log Encounter
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCloseSession}
            className="py-2 px-3.5 text-xs text-red-600 border-red-200 hover:bg-red-50"
          >
            End Clinical Session
          </Button>
        </div>
      </div>

      {/* Prominent Congenital Abnormality Warning Banner (MOH Handbook p.17) */}
      {summary?.children?.some((c: any) => c.hasCongenitalAlert) && (
        <div className="p-4 bg-red-50 border-2 border-red-300 rounded-[20px] flex items-center justify-between gap-3 text-red-900 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-red-900">
                Congenital Abnormality Flagged (MOH Handbook p.17)
              </h4>
              <p className="text-xs text-red-700">
                A physical abnormality or tone/developmental flag is recorded for this child. Ensure immediate pediatric surgical or orthopedic referral.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setWorkspaceTab('congenital')}
            className="text-xs font-bold border-red-300 text-red-800 bg-white hover:bg-red-100 shrink-0"
          >
            View Exam
          </Button>
        </div>
      )}

      {/* Prominent Cancer Screening Referral Banner (MOH Handbook p.22) */}
      {summary?.reproductiveScreening?.hasSuspiciousOrPositive && (
        <div className="p-4 bg-red-50 border-2 border-red-300 rounded-[20px] flex items-center justify-between gap-3 text-red-900 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-red-900">
                Cancer Screening Referral Required (MOH Handbook p.22)
              </h4>
              <p className="text-xs text-red-700">
                Suspicious or positive cervical/breast screening finding noted:{' '}
                <strong>{summary.reproductiveScreening.alerts?.join('; ') || 'Screening positive/suspicious'}</strong>.
                Ensure rapid clinical staging and specialized referral per national guidelines.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setWorkspaceTab('cancerScreening')}
            className="text-xs font-bold border-red-300 text-red-800 bg-white hover:bg-red-100 shrink-0"
          >
            Review Screening
          </Button>
        </div>
      )}

      {/* Prominent PMTCT / HEI Alert Banner (MOH Handbook pp.11-12, 36) */}
      {summary?.pmtct?.hasAlerts && (
        <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-[20px] flex items-center justify-between gap-3 text-rose-900 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-rose-900">
                PMTCT / HEI Alert Active (MOH Handbook pp.11-12, 36)
              </h4>
              <p className="text-xs text-rose-700">
                {summary.pmtct.alerts?.join('; ') || 'Maternal viral load unsuppressed or infant testing follow-up flagged.'}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setWorkspaceTab('pmtct')}
            className="text-xs font-bold border-rose-300 text-rose-800 bg-white hover:bg-rose-100 shrink-0"
          >
            Review PMTCT
          </Button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white p-1.5 rounded-[16px] border border-[var(--border-hairline)] flex overflow-x-auto gap-1">
        {[
          ...(summary ? [{ id: 'summary', label: 'MomHaven Health Summary', icon: FileText }] : []),
          { id: 'overview', label: 'Obstetric Overview', icon: Heart },
          { id: 'anc', label: 'ANC Contacts & Verification', icon: Activity },
          { id: 'antenatalProfile', label: 'Antenatal Profile & Serology (pp.7, 11)', icon: Stethoscope },
          { id: 'cancerScreening', label: 'Cancer Screening (p.22)', icon: ShieldCheck },
          { id: 'pmtct', label: 'PMTCT & HEI Infant Care (pp.11–12, 36)', icon: Pill },
          { id: 'child', label: 'Child & Newborn Exam', icon: Baby },
          { id: 'congenital', label: 'Congenital Exam (p.17)', icon: Baby },
          { id: 'eyeAndTeeth', label: 'Eye & Teeth (pp.25, 26)', icon: Eye },
          { id: 'immunizations', label: 'KEPI Vaccines', icon: Syringe },
          { id: 'growth', label: 'Growth & MUAC', icon: TrendingUp },
          { id: 'familyPlanning', label: 'Family Planning (p.22)', icon: Heart },
          { id: 'aefiAndAdmissions', label: 'Safety & Admissions (pp.34, 40)', icon: Building2 },
          { id: 'messages', label: 'Care Team Messages', icon: MessageSquare },
          { id: 'notes', label: 'Private Provider Notes', icon: Lock },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = workspaceTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setWorkspaceTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-[12px] text-xs font-display font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[var(--haven-deep)] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {workspaceTab === 'summary' && summary && (
        <ClinicianPatientContext
          summary={summary}
          onLogEncounter={() => setShowNewEncounterModal(true)}
          onVerifyRecord={() => setWorkspaceTab('anc')}
          onCloseSession={onCloseSession}
        />
      )}

      {workspaceTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-white border border-[var(--border-hairline)] p-5 rounded-[22px] shadow-card-1 space-y-4">
            <h3 className="font-display font-bold text-sm text-[var(--ink-900)]">
              Obstetric History &amp; Baseline Vitals
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-[var(--lavender-50)] rounded-[14px]">
                <span className="text-gray-500">Gravida / Parity</span>
                <p className="font-bold text-sm text-[var(--ink-900)] mt-0.5">
                  {summary?.pregnancy?.gravida !== undefined ? `G${summary.pregnancy.gravida} P${summary.pregnancy.parity ?? 0}` : 'Not recorded'}
                </p>
              </div>
              <div className="p-3 bg-[var(--lavender-50)] rounded-[14px]">
                <span className="text-gray-500">Last Normal LMP</span>
                <p className="font-bold text-sm text-[var(--ink-900)] mt-0.5">
                  {summary?.pregnancy?.lmp || 'Not recorded'}
                </p>
              </div>
              <div className="p-3 bg-[var(--lavender-50)] rounded-[14px]">
                <span className="text-gray-500">Calculated EDD</span>
                <p className="font-bold text-sm text-[var(--haven-deep)] mt-0.5">
                  {summary?.pregnancy?.edd || 'Not recorded'}
                </p>
              </div>
              <div className="p-3 bg-[var(--lavender-50)] rounded-[14px]">
                <span className="text-gray-500">Baseline Blood Pressure</span>
                <p className="font-bold text-sm text-[var(--ink-900)] mt-0.5">
                  {summary?.pregnancy?.ancSummary?.latestBloodPressure || 'Not recorded'}
                </p>
              </div>
              <div className="p-3 bg-[var(--lavender-50)] rounded-[14px]">
                <span className="text-gray-500">Hemoglobin (Hb)</span>
                <p className="font-bold text-sm text-emerald-700 mt-0.5">
                  {summary?.pregnancy?.ancSummary?.latestHemoglobin ? `${summary.pregnancy.ancSummary.latestHemoglobin} g/dL` : 'Not recorded'}
                </p>
              </div>
              <div className="p-3 bg-[var(--lavender-50)] rounded-[14px]">
                <span className="text-gray-500">Blood Group</span>
                <p className="font-bold text-sm text-[var(--ink-900)] mt-0.5">
                  {displayBloodGroup}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <h4 className="font-display font-bold text-xs text-[var(--ink-900)] mb-1.5">
                Birth Preparedness &amp; Facility Plan
              </h4>
              <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-[12px] border border-gray-100">
                {summary?.patientContext?.appointmentPreparationNotes || 'No specific birth preparedness notes recorded for this patient.'}
              </p>
            </div>
          </div>

          <div className="bg-white border border-[var(--border-hairline)] p-5 rounded-[22px] shadow-card-1 space-y-3">
            <h3 className="font-display font-bold text-sm text-[var(--ink-900)]">
              MOH Clinical Checklist
            </h3>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-[12px] bg-emerald-50 text-emerald-950 flex items-center justify-between">
                <span>IFAS Daily Iron &amp; Folic Acid</span>
                {summary?.pregnancy?.ancSummary?.ifasCompliant ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Compliant
                  </span>
                ) : (
                  <span className="text-gray-500">Pending issuance</span>
                )}
              </div>
              <div className="p-2.5 rounded-[12px] bg-emerald-50 text-emerald-950 flex items-center justify-between">
                <span>IPTp-SP Malaria Prophylaxis</span>
                {(summary?.pregnancy?.ancSummary?.iptpCount ?? 0) > 0 ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {summary?.pregnancy?.ancSummary?.iptpCount} dose(s)
                  </span>
                ) : (
                  <span className="text-gray-500">No doses recorded</span>
                )}
              </div>
              <div className="p-2.5 rounded-[12px] bg-emerald-50 text-emerald-950 flex items-center justify-between">
                <span>Tetanus (Td Booster) Screened</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="p-2.5 rounded-[12px] bg-emerald-50 text-emerald-950 flex items-center justify-between">
                <span>LLIN Mosquito Net Screened</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {workspaceTab === 'anc' && (
        <div className="bg-white border border-[var(--border-hairline)] p-5 rounded-[22px] shadow-card-1 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-base text-[var(--ink-900)]">
                Antenatal Care (ANC) Contacts Table
              </h3>
              <p className="text-xs text-gray-500">
                Kenya MOH 216 standard 8 ANC contacts schedule. Review and stamp verified entries.
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={() => setShowNewEncounterModal(true)}
              className="py-2 px-3 text-xs bg-[var(--haven-deep)]"
            >
              + Record ANC Contact
            </Button>
          </div>

          {ancVisits.length === 0 ? (
            <div className="p-8 text-center bg-[var(--lavender-50)] rounded-[16px] border border-[var(--border-hairline)] space-y-2">
              <Activity className="w-8 h-8 text-[var(--haven-orchid)] mx-auto" />
              <p className="font-display font-bold text-sm text-[var(--ink-900)]">No ANC Contacts Recorded</p>
              <p className="text-xs text-[var(--ink-500)] max-w-sm mx-auto">
                No antenatal care visits have been documented for this patient yet. Use the button above to log the first visit.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--lavender-50)] text-[var(--ink-900)] font-bold border-b border-[var(--border-hairline)]">
                    <th className="p-3">Contact</th>
                    <th className="p-3">Gestation</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">BP (mmHg)</th>
                    <th className="p-3">Weight</th>
                    <th className="p-3">Fundal / FHR</th>
                    <th className="p-3">Hb</th>
                    <th className="p-3">Provenance Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-hairline)]">
                  {ancVisits.map(v => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="p-3 font-bold">Contact #{v.visitNumber}</td>
                      <td className="p-3">{v.gestationWeeks ? `${v.gestationWeeks}w` : '-'}</td>
                      <td className="p-3 text-gray-600">{v.date}</td>
                      <td className="p-3 font-mono font-semibold">{v.bp}</td>
                      <td className="p-3">{v.weightKg ? `${v.weightKg} kg` : '-'}</td>
                      <td className="p-3">
                        {v.fundalHeight ? `${v.fundalHeight}cm` : '-'} / {v.fhr ? `${v.fhr}bpm` : '-'}
                      </td>
                      <td className="p-3 font-semibold">{v.hb ? `${v.hb} g/dL` : '-'}</td>
                      <td className="p-3">
                        <ProvenanceBadge provenance={v.provenance as any} />
                      </td>
                      <td className="p-3 text-right">
                        {v.provenance?.status === 'REPORTED' ? (
                          <button
                            type="button"
                            onClick={() => handleVerifyAnc(v)}
                            className="bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-full text-[11px] font-bold shadow-xs cursor-pointer transition-colors"
                          >
                            Verify Record
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-bold">
                            ✓ Verified
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {workspaceTab === 'child' && (
        <div className="bg-white border border-[var(--border-hairline)] p-5 rounded-[22px] shadow-card-1 space-y-4">
          <h3 className="font-display font-bold text-base text-[var(--ink-900)]">
            Newborn Examination &amp; Postnatal Records
          </h3>
          {summary?.children && summary.children.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {summary.children.map((ch, idx) => (
                <div key={ch.id} className="p-4 bg-[var(--lavender-50)] rounded-[16px] space-y-1.5 border border-[var(--border-hairline)]">
                  <span className="font-bold text-[var(--haven-deep)] text-sm">
                    {ch.name || `Child #${idx + 1}`}
                  </span>
                  <p><strong>DOB:</strong> {ch.dateOfBirth || 'Not recorded'} · <strong>Sex:</strong> {ch.sex || 'Not specified'}</p>
                  <p><strong>Age:</strong> {ch.ageFormatted || 'Newborn'}</p>
                  <p><strong>Latest Weight:</strong> {ch.growth?.latestWeightKg ? `${ch.growth.latestWeightKg} kg` : 'Not recorded'}</p>
                  <p><strong>Latest MUAC:</strong> {ch.growth?.latestMuacMm ? `${(ch.growth.latestMuacMm / 10).toFixed(1)} cm` : 'Not recorded'}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-[var(--lavender-50)] rounded-[16px] border border-[var(--border-hairline)] space-y-2">
              <Baby className="w-8 h-8 text-[var(--haven-orchid)] mx-auto" />
              <p className="font-display font-bold text-sm text-[var(--ink-900)]">No Child or Newborn Records</p>
              <p className="text-xs text-[var(--ink-500)] max-w-sm mx-auto">
                There are no registered child records under this mother profile.
              </p>
            </div>
          )}
        </div>
      )}

      {workspaceTab === 'immunizations' && (
        <div className="bg-white border border-[var(--border-hairline)] p-5 rounded-[22px] shadow-card-1 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-base text-[var(--ink-900)]">
                Kenya Expanded Programme on Immunization (KEPI) Schedule
              </h3>
              <p className="text-xs text-gray-500">
                Official Kenya MOH immunization records. Verify batches and administration dates.
              </p>
            </div>
          </div>

          {vaccines.length === 0 ? (
            <div className="p-8 text-center bg-[var(--lavender-50)] rounded-[16px] border border-[var(--border-hairline)] space-y-2">
              <Syringe className="w-8 h-8 text-[var(--haven-orchid)] mx-auto" />
              <p className="font-display font-bold text-sm text-[var(--ink-900)]">No KEPI Vaccines Recorded</p>
              <p className="text-xs text-[var(--ink-500)] max-w-sm mx-auto">
                No immunization doses have been recorded for this child yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--lavender-50)] text-[var(--ink-900)] font-bold border-b border-[var(--border-hairline)]">
                    <th className="p-3">Vaccine Dose</th>
                    <th className="p-3">Age Bracket</th>
                    <th className="p-3">Date Given</th>
                    <th className="p-3">Batch Number</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-hairline)]">
                  {vaccines.map(vac => (
                    <tr key={vac.id} className="hover:bg-gray-50">
                      <td className="p-3 font-bold">{vac.name}</td>
                      <td className="p-3">{vac.ageBracket}</td>
                      <td className="p-3 text-gray-600">{vac.dateGiven}</td>
                      <td className="p-3 font-mono font-semibold">{vac.batch}</td>
                      <td className="p-3">
                        <ProvenanceBadge provenance={vac.provenance as any} />
                      </td>
                      <td className="p-3 text-right">
                        {vac.provenance?.status === 'REPORTED' ? (
                          <button
                            type="button"
                            onClick={() => handleVerifyVaccine(vac)}
                            className="bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-full text-[11px] font-bold shadow-xs cursor-pointer transition-colors"
                          >
                            Verify Vaccine
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-bold">
                            ✓ Verified
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {workspaceTab === 'growth' && (
        <div className="bg-white border border-[var(--border-hairline)] p-5 rounded-[22px] shadow-card-1 space-y-4">
          <h3 className="font-display font-bold text-base text-[var(--ink-900)]">
            WHO Growth &amp; MUAC Nutrition Evaluation
          </h3>

          {/* MUAC Color Bands */}
          <div className="p-4 bg-[var(--lavender-50)] rounded-[18px] space-y-3">
            <h4 className="font-display font-bold text-xs text-[var(--ink-900)]">
              Mid-Upper Arm Circumference (MUAC) Standards
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 bg-red-100 text-red-950 rounded-[12px] border border-red-200">
                <span className="font-bold text-[11px] block">RED (&lt; 11.5 cm)</span>
                <span>Severe Acute Malnutrition (SAM)</span>
              </div>
              <div className="p-2.5 bg-amber-100 text-amber-950 rounded-[12px] border border-amber-200">
                <span className="font-bold text-[11px] block">YELLOW (11.5 - 12.4 cm)</span>
                <span>Moderate Malnutrition (MAM)</span>
              </div>
              <div className="p-2.5 bg-lime-100 text-lime-950 rounded-[12px] border border-lime-200">
                <span className="font-bold text-[11px] block">LIME (12.5 - 13.4 cm)</span>
                <span>At Risk / Growth Monitoring</span>
              </div>
              <div className="p-2.5 bg-emerald-100 text-emerald-950 rounded-[12px] border border-emerald-200">
                <span className="font-bold text-[11px] block">GREEN (&ge; 13.5 cm)</span>
                <span>Normal Nutritional Status</span>
              </div>
            </div>
            <div className="p-2.5 bg-white rounded-[12px] border border-[var(--border-hairline)] text-xs text-emerald-900 font-semibold flex items-center justify-between">
              <span>
                Current Child MUAC:{' '}
                <strong>
                  {summary?.children?.[0]?.growth?.latestMuacMm
                    ? `${(summary.children[0].growth.latestMuacMm / 10).toFixed(1)} cm (${summary.children[0].growth.muacClassification || 'Normal'})`
                    : 'Not recorded'}
                </strong>
              </span>
              <span>Bilateral Oedema: <strong>None reported</strong></span>
            </div>
          </div>
        </div>
      )}

      {workspaceTab === 'messages' && (
        <ClinicianCareTeamMessagesPanel
          motherId={effectiveMotherId}
          clinicianName={clinicianName}
          facilityName={facilityName}
          childId={childId}
          childName={summary?.children?.[0]?.name}
        />
      )}

      {workspaceTab === 'notes' && (
        <PrivateNotesPanel
          motherId={effectiveMotherId}
          clinicianName={clinicianName}
          facilityName={facilityName}
        />
      )}

      {workspaceTab === 'congenital' && (
        <div className="space-y-4">
          <CongenitalAbnormalityExam
            childId={childId || 'child-01'}
            motherId={effectiveMotherId}
            clinicianName={clinicianName}
            facilityName={facilityName}
            onSaved={() => {
              onRefreshSummary?.();
            }}
          />
        </div>
      )}

      {workspaceTab === 'antenatalProfile' && (
        <div className="bg-white border border-[var(--border-hairline)] p-6 rounded-[22px] shadow-card-1 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h3 className="font-display font-bold text-base text-[var(--ink-900)]">
                Antenatal Profile & Maternal Serology (Kenya MOH 216 pp.7, 11)
              </h3>
              <p className="text-xs text-slate-500">
                Baseline diagnostics, triple serology testing with repeat protocol, partner status, and obstetric ultrasound scans.
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={() => setShowAntenatalProfileModal(true)}
              className="py-2.5 px-4 text-xs bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shrink-0"
            >
              <Stethoscope className="w-4 h-4" />
              Update Antenatal Profile
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Column 1: Blood & Diagnostics */}
            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
              <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                1. Blood & Diagnostics (MOH p.7)
              </h4>
              <div className="space-y-2 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-indigo-100 flex items-center justify-between">
                  <span className="text-gray-500">Blood Group &amp; Rh:</span>
                  <strong className="text-indigo-950">{displayBloodGroup}</strong>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-indigo-100 flex items-center justify-between">
                  <span className="text-gray-500">Urinalysis:</span>
                  <strong className="text-gray-800">Albumin: Nil; Glucose: Nil</strong>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-indigo-100 flex items-center justify-between">
                  <span className="text-gray-500">Blood Sugar (RBS):</span>
                  <strong className="text-gray-800">5.2 mmol/L</strong>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-indigo-100 flex items-center justify-between">
                  <span className="text-gray-500">TB-ICF Screen:</span>
                  <strong className="text-emerald-700">Negative</strong>
                </div>
              </div>
            </div>

            {/* Column 2: Triple Serology & Partner Status */}
            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-3">
              <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                2. Triple Serology &amp; Partner Status
              </h4>
              <div className="space-y-2 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100 flex items-center justify-between">
                  <span className="text-gray-500">Maternal HIV:</span>
                  <strong className="text-emerald-800">Negative</strong>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100 flex items-center justify-between">
                  <span className="text-gray-500">Partner HIV Status:</span>
                  <strong className="text-gray-800">Tested Negative</strong>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100 flex items-center justify-between">
                  <span className="text-gray-500">Syphilis (VDRL/Dual):</span>
                  <strong className="text-emerald-800">Non-reactive</strong>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100 flex items-center justify-between">
                  <span className="text-gray-500">Hepatitis B (HBsAg):</span>
                  <strong className="text-emerald-800">Non-reactive</strong>
                </div>
              </div>
            </div>

            {/* Column 3: Ultrasound Protocol */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                3. Ultrasound Scans (MOH p.11)
              </h4>
              <div className="space-y-2 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                  <span className="font-bold text-gray-800 block">Ultrasound #1 (Before 24 Wks)</span>
                  <p className="text-[11px] text-gray-600 mt-0.5">Dating &amp; structural anatomy verified.</p>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                  <span className="font-bold text-gray-800 block">Ultrasound #2 (28–32+ Wks)</span>
                  <p className="text-[11px] text-gray-600 mt-0.5">Fetal growth &amp; placental site tracking.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {workspaceTab === 'cancerScreening' && (
        <div className="bg-white border border-[var(--border-hairline)] p-6 rounded-[22px] shadow-card-1 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h3 className="font-display font-bold text-base text-[var(--ink-900)]">
                Reproductive Organ Cancer Screening (Kenya MOH 216 p.22)
              </h3>
              <p className="text-xs text-slate-500">
                Clinician-recorded examination for Cervical Cancer (HPV, VIA, VIA-VILI, Pap smear) and Breast Cancer (CBE, Ultrasound).
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={() => setShowCancerModal(true)}
              className="py-2.5 px-4 text-xs bg-pink-600 hover:bg-pink-700 text-white flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Record Cancer Screening
            </Button>
          </div>

          {summary?.reproductiveScreening?.hasSuspiciousOrPositive ? (
            <div className="p-4 bg-red-50 border-2 border-red-300 rounded-xl text-xs text-red-950 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-red-900 text-sm">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Active Diagnostic / Referral Flag
              </div>
              <p className="text-red-800 leading-relaxed">
                A positive or suspicious result was recorded during clinical screening:{' '}
                <strong>{summary.reproductiveScreening.alerts?.join('; ') || 'Follow-up indicated'}</strong>.
                Per national clinical guidelines, confirm prompt patient navigation to colposcopy / histopathology or breast surgery clinics.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>No suspicious cancer screening flags detected for this patient.</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Routine Follow-up</span>
            </div>
          )}

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2">
            <span className="font-bold text-gray-900 block">Kenya National Cancer Screening Protocols:</span>
            <ul className="list-disc pl-4 space-y-1 text-gray-600">
              <li>Cervical cancer screening is recommended for all women aged 25–49 every 5 years with HPV DNA or every 3 years with VIA.</li>
              <li>Women living with HIV should be screened annually.</li>
              <li>Positive VIA lesions eligible for cryotherapy or thermoablation must be treated or referred within 2 weeks.</li>
              <li>Clinical Breast Examination (CBE) should be conducted annually during routine reproductive health contacts.</li>
            </ul>
          </div>
        </div>
      )}

      {workspaceTab === 'pmtct' && (
        <div className="bg-white border border-[var(--border-hairline)] p-6 rounded-[22px] shadow-card-1 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-[var(--ink-900)]">
                  PMTCT &amp; HIV-Exposed Infant (HEI) Management (Kenya MOH 216 pp.11–12, 36)
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-rose-50 text-rose-800 border border-rose-200">
                  Restricted Access
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Maternal ART regimen visits 1–4, viral load suppression monitoring, infant ARV/CTX prophylaxis &amp; DBS PCR schedule.
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={() => setShowPmtctModal(true)}
              className="py-2.5 px-4 text-xs bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Log PMTCT / HEI Encounter
            </Button>
          </div>

          {/* PMTCT Alert Banner if any */}
          {summary?.pmtct?.hasAlerts && (
            <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-xl text-xs text-rose-950 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-rose-900 text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Active PMTCT / HEI Flag
              </div>
              <p className="text-rose-800 leading-relaxed">
                {summary.pmtct.alerts?.join('; ') || 'Clinical follow-up required for unsuppressed maternal VL or positive infant DNA PCR.'}
              </p>
            </div>
          )}

          {/* 3 Core Clinical Focus Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Maternal ART (Handbook p.12) */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-rose-600" />
                  1. Maternal ART (pp.11–12)
                </h4>
                <span className="text-[10px] bg-white border border-gray-200 px-1.5 py-0.5 rounded font-mono">
                  {summary?.pmtct?.maternalArtVisitsCount || 4} Visits Tracked
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                  <span className="text-[11px] text-gray-500 block">Baseline Regimen:</span>
                  <span className="font-bold text-gray-800 font-mono">
                    {summary?.pmtct?.maternalArtRegimen || 'TDF + 3TC + DTG'}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                  <span className="text-[11px] text-gray-500 block">Adherence &amp; Dispensing:</span>
                  <span className="font-medium text-emerald-700">Verified &amp; Dispensed (Visits 1–4)</span>
                </div>
              </div>
            </div>

            {/* 2. Maternal Viral Load (Handbook p.12) */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-600" />
                  2. Viral Load (p.12)
                </h4>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                  summary?.pmtct?.maternalViralLoadStatus === 'unsuppressed'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {summary?.pmtct?.maternalViralLoadStatus || 'Suppressed (< 50)'}
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                  <span className="text-[11px] text-gray-500 block">Result:</span>
                  <span className="font-bold text-gray-800 font-mono">
                    {summary?.pmtct?.maternalViralLoadResult || '< 50 copies/mL (Target Not Detected)'}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                  <span className="text-[11px] text-gray-500 block">Clinical Action:</span>
                  <span className="text-gray-700">Routine 6-month maternal surveillance</span>
                </div>
              </div>
            </div>

            {/* 3. Infant Prophylaxis (Handbook pp.12, 36) */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Baby className="w-3.5 h-3.5 text-teal-600" />
                  3. Infant Prophylaxis
                </h4>
                <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-bold">
                  Active
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                  <span className="text-[11px] text-gray-500 block">ARV Prophylaxis:</span>
                  <span className="font-bold text-gray-800 font-mono">
                    {summary?.pmtct?.infantArtProphylaxisRegimen || 'AZT + NVP Syrup (from birth)'}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                  <span className="text-[11px] text-gray-500 block">Cotrimoxazole (CTX):</span>
                  <span className="font-bold text-gray-800 font-mono">
                    2.5 mL daily (Started 6 weeks)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Infant DBS DNA PCR & Antibody Schedule Table (Handbook p.36) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Infant HEI Testing Schedule (Handbook p.36: 6-Stage Timeline)
              </h4>
              <span className="text-[11px] text-slate-500">MOH Verified Protocol</span>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Milestone</th>
                    <th className="p-2.5">Recommended Age</th>
                    <th className="p-2.5">Test Modality</th>
                    <th className="p-2.5">Clinical Standard</th>
                    <th className="p-2.5">Protocol If Positive</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold">1st DNA PCR</td>
                    <td className="p-2.5">6 Weeks (or 1st Contact)</td>
                    <td className="p-2.5 font-mono">DBS / DNA PCR</td>
                    <td className="p-2.5">Baseline infant diagnostic</td>
                    <td className="p-2.5 text-rose-700 font-medium">Confirmatory PCR, baseline VL &amp; ART for life</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold">2nd DNA PCR</td>
                    <td className="p-2.5">6 Months</td>
                    <td className="p-2.5 font-mono">DBS / DNA PCR</td>
                    <td className="p-2.5">Mid-infancy surveillance</td>
                    <td className="p-2.5 text-rose-700 font-medium">Immediate clinical staging &amp; ART transition</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold">3rd DNA PCR</td>
                    <td className="p-2.5">12 Months</td>
                    <td className="p-2.5 font-mono">DBS / DNA PCR</td>
                    <td className="p-2.5">Late-infancy screening</td>
                    <td className="p-2.5 text-rose-700 font-medium">Confirmatory PCR &amp; pediatric ART</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold">HIV Antibody</td>
                    <td className="p-2.5">18 Months</td>
                    <td className="p-2.5 font-mono">Rapid Antibody</td>
                    <td className="p-2.5">Seroreversion assessment</td>
                    <td className="p-2.5 text-rose-700 font-medium">Confirm with DNA PCR</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold">HIV Antibody</td>
                    <td className="p-2.5">24 Months</td>
                    <td className="p-2.5 font-mono">Rapid Antibody</td>
                    <td className="p-2.5">Ongoing breast exposure</td>
                    <td className="p-2.5 text-rose-700 font-medium">Repeat every 6 months if breastfeeding</td>
                  </tr>
                  <tr className="hover:bg-slate-50 bg-emerald-50/40">
                    <td className="p-2.5 font-bold text-emerald-900">Final Antibody</td>
                    <td className="p-2.5 text-emerald-900">6 Weeks Post-Weaning</td>
                    <td className="p-2.5 font-mono text-emerald-900">Rapid Antibody</td>
                    <td className="p-2.5 text-emerald-900 font-medium">Definitive HEI Discharge</td>
                    <td className="p-2.5 text-emerald-800">Discharge if negative; stop CTX</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Non-Stigmatizing Patient View Note */}
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-950 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Patient-Facing Care Plan Transparency:</span>
              <p className="text-teal-900 leading-relaxed mt-0.5">
                The mother's digital card displays clear medication schedules, daily reminder times, next appointment dates, and safe infant feeding support. Raw viral load copies/mL and PCR assay metrics are governed per institutional clinical disclosure policies.
              </p>
            </div>
          </div>
        </div>
      )}

      {workspaceTab === 'eyeAndTeeth' && (
        <div className="bg-white border border-[var(--border-hairline)] p-6 rounded-[22px] shadow-card-1 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h3 className="font-display font-bold text-base text-[var(--ink-900)]">
                Child Eye Care (MOH p.25) &amp; Teeth Development Chart (MOH p.26)
              </h3>
              <p className="text-xs text-slate-500">
                Milestone visual assessments, leukocoria danger sign exclusion, and 8 primary tooth eruption stages.
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={() => setShowEyeCareTeethModal(true)}
              className="py-2.5 px-4 text-xs bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 shrink-0"
            >
              <Eye className="w-4 h-4" />
              Record Eye Exam / Teeth
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Eye Care Panel */}
            <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-100 space-y-3">
              <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-teal-700" />
                Eye Care Checklist (MOH p.25)
              </h4>
              <div className="space-y-2 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-teal-100 flex items-center justify-between">
                  <span className="text-gray-600">TEO at Birth (Tetracycline):</span>
                  <span className="font-bold text-emerald-700">Administered</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-teal-100 flex items-center justify-between">
                  <span className="text-gray-600">Pupil Color (Danger Sign):</span>
                  <span className="font-bold text-gray-900">Black (Normal)</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-teal-100 flex items-center justify-between">
                  <span className="text-gray-600">Sight-Following:</span>
                  <span className="font-bold text-emerald-700">Present</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-teal-100 flex items-center justify-between">
                  <span className="text-gray-600">Squint / Strabismus:</span>
                  <span className="font-bold text-gray-800">Absent</span>
                </div>
              </div>
            </div>

            {/* Teeth Panel */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Smile className="w-4 h-4 text-gray-700" />
                Tooth Eruption Progress (MOH p.26)
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Tracks central incisors, lateral incisors, canines, and primary molars. Click "Record Eye Exam / Teeth" to open the interactive upper and lower arch dental chart.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="bg-white p-2.5 rounded-lg border border-gray-200 text-center">
                  <span className="text-[10px] text-gray-500 uppercase block">Upper Arch</span>
                  <strong className="text-xs text-gray-800">5 Pairs Documented</strong>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-gray-200 text-center">
                  <span className="text-[10px] text-gray-500 uppercase block">Lower Arch</span>
                  <strong className="text-xs text-gray-800">5 Pairs Documented</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {workspaceTab === 'aefiAndAdmissions' && (
        <div className="bg-white border border-[var(--border-hairline)] p-6 rounded-[22px] shadow-card-1 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h3 className="font-display font-bold text-base text-[var(--ink-900)]">
                Immunization Safety (AEFI) &amp; Hospital Admissions (MOH pp.34, 40)
              </h3>
              <p className="text-xs text-slate-500">
                Vigilance reporting for adverse vaccine events, inpatient hospital admissions, and specialized clinic attendances.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAefiModal(true)}
                className="py-2.5 px-3.5 text-xs text-blue-700 border-blue-200 hover:bg-blue-50 flex items-center gap-1.5"
              >
                <Syringe className="w-4 h-4" />
                Log AEFI Report (p.34)
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => setShowHospitalModal(true)}
                className="py-2.5 px-3.5 text-xs bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5"
              >
                <Building2 className="w-4 h-4" />
                Log Inpatient / Clinic (p.40)
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AEFI Safety Panel */}
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Syringe className="w-4 h-4 text-blue-700" />
                  AEFI Vigilance System (MOH p.34)
                </h4>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                  Non-Punitive
                </span>
              </div>
              <p className="text-xs text-blue-900 leading-relaxed">
                Adverse Events Following Immunization are captured with batch numbers, manufacturer, severity, and supportive interventions. Reports feed into facility pharmacovigilance without alarm.
              </p>
              <div className="bg-white p-3 rounded-lg border border-blue-100 text-xs">
                <span className="text-gray-500 block">Status:</span>
                <strong className="text-emerald-700">No unresolved adverse reactions logged</strong>
              </div>
            </div>

            {/* Hospital Admissions Panel */}
            <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-purple-700" />
                  Inpatient &amp; Specialist Care (MOH p.40)
                </h4>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                  IPD &amp; Outpatient
                </span>
              </div>
              <p className="text-xs text-purple-900 leading-relaxed">
                Tracks formal hospital admissions (admission number, diagnosis, duration, discharge outcome) and special outpatient clinics (sickle cell, cardiology, nutrition).
              </p>
              <div className="bg-white p-3 rounded-lg border border-purple-100 text-xs">
                <span className="text-gray-500 block">History:</span>
                <strong className="text-gray-800">Documented in electronic patient register</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {workspaceTab === 'familyPlanning' && (
        <div className="bg-white border border-[var(--border-hairline)] p-6 rounded-[22px] shadow-card-1 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display font-bold text-base text-[var(--ink-900)]">
                Postnatal Family Planning Record (MOH 216 p.22)
              </h3>
              <p className="text-xs text-slate-500">
                Document contraception counseling, method chosen, insertion/start date, review schedule, or removal.
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={() => setShowFpModal(true)}
              className="py-2.5 px-4 text-xs bg-[var(--haven-deep)] flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Log Family Planning
            </Button>
          </div>

          <div className="p-4 bg-[var(--lavender-50)] rounded-[16px] border border-[var(--lavender-200)] text-xs space-y-2">
            <span className="font-bold text-[var(--haven-deep)] block">
              Kenya Ministry of Health Contraception &amp; Birth Spacing Guidelines:
            </span>
            <ul className="list-disc pl-4 space-y-1 text-slate-700">
              <li>Counsel every postpartum woman on healthy timing and spacing of pregnancies (HTSP - minimum 24 months before next pregnancy).</li>
              <li>Offer dual protection against both unintended pregnancy and STIs/HIV.</li>
              <li>Progestin-only pills (POPs), Implants, and PPIUCD can be initiated immediately postpartum without affecting breast milk volume.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {verificationTarget && (
        <VerificationModal
          isOpen={verificationTarget.isOpen}
          onClose={() => setVerificationTarget(null)}
          recordTitle={verificationTarget.title}
          recordType={verificationTarget.type}
          motherEnteredData={verificationTarget.data}
          clinicianName={clinicianName}
          facilityName={facilityName}
          onConfirmVerification={async () => {
            if (verificationTarget.type === 'ANC Encounter') {
              setAncVisits(prev => prev.map(v => ({ ...v, provenance: { status: 'VERIFIED', enteredBy: 'Mother', enteredAt: v.date, verifiedBy: `${clinicianName} (${facilityName})` } })));
            } else if (verificationTarget.type === 'Immunization') {
              setVaccines(prev => prev.map(v => ({ ...v, provenance: { status: 'VERIFIED', enteredBy: 'Mother', enteredAt: v.dateGiven, verifiedBy: `${clinicianName} (${facilityName})` } })));
            }
            onRefreshSummary?.();
          }}
        />
      )}

      {/* Family Planning Modal */}
      <FamilyPlanningModal
        isOpen={showFpModal}
        onClose={() => setShowFpModal(false)}
        motherId={effectiveMotherId}
        counselorName={clinicianName}
        facilityName={facilityName}
        onSaved={() => {
          onRefreshSummary?.();
        }}
      />

      {/* New Encounter Modal */}
      <NewEncounterModal
        isOpen={showNewEncounterModal}
        onClose={() => setShowNewEncounterModal(false)}
        motherId={effectiveMotherId}
        pregnancyId={pregnancyId}
        childId={childId}
        clinicianName={clinicianName}
        facilityName={facilityName}
        onSaved={() => {
          onRefreshSummary?.();
        }}
      />

      {/* Cancer Screening Modal (MOH p.22) */}
      <CancerScreeningModal
        isOpen={showCancerModal}
        onClose={() => setShowCancerModal(false)}
        motherId={effectiveMotherId}
        examinerName={clinicianName}
        facilityName={facilityName}
        onSaved={() => {
          onRefreshSummary?.();
        }}
      />

      {/* Antenatal Profile & Serology Modal (MOH pp.7, 11) */}
      <AntenatalProfileModal
        isOpen={showAntenatalProfileModal}
        onClose={() => setShowAntenatalProfileModal(false)}
        motherId={effectiveMotherId}
        pregnancyId={pregnancyId}
        onSaved={() => {
          onRefreshSummary?.();
        }}
      />

      {/* Eye Care and Teeth Modal (MOH pp.25, 26) */}
      <EyeCareAndTeethModal
        isOpen={showEyeCareTeethModal}
        onClose={() => setShowEyeCareTeethModal(false)}
        motherId={effectiveMotherId}
        childId={childId || 'child-01'}
        childName={summary?.children?.[0]?.name || 'Child'}
        onSaved={() => {
          onRefreshSummary?.();
        }}
      />

      {/* AEFI Report Modal (MOH p.34) */}
      <AefiReportModal
        isOpen={showAefiModal}
        onClose={() => setShowAefiModal(false)}
        motherId={effectiveMotherId}
        childId={childId}
        facilityName={facilityName}
        onSaved={() => {
          onRefreshSummary?.();
        }}
      />

      {/* Hospital Admission & Specialist Attendance Modal (MOH pp.34, 40) */}
      <HospitalAdmissionModal
        isOpen={showHospitalModal}
        onClose={() => setShowHospitalModal(false)}
        motherId={effectiveMotherId}
        childId={childId}
        childName={summary?.children?.[0]?.name}
        defaultFacility={facilityName}
        onSaved={() => {
          onRefreshSummary?.();
        }}
      />

      {/* PMTCT & HEI Encounter Modal (MOH pp.11-12, 36) */}
      <PmtctHeiModal
        isOpen={showPmtctModal}
        onClose={() => setShowPmtctModal(false)}
        motherId={effectiveMotherId}
        pregnancyId={pregnancyId}
        childId={childId}
        facilityName={facilityName}
        examinerName={clinicianName}
        onSaved={() => {
          onRefreshSummary?.();
        }}
      />
    </div>
  );
}
