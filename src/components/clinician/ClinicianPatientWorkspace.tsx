// src/components/clinician/ClinicianPatientWorkspace.tsx
import React, { useState } from 'react';
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
  ChevronRight
} from 'lucide-react';
import ProvenanceBadge from '../common/ProvenanceBadge';
import VerificationModal from './VerificationModal';
import NewEncounterModal from './NewEncounterModal';
import PrivateNotesPanel from './PrivateNotesPanel';
import ClinicianPatientContext from './ClinicianPatientContext';
import type { MomHavenHealthSummary } from '../../types/healthSummary';
import Button from '../Button';

interface ClinicianPatientWorkspaceProps {
  motherName?: string;
  gestationWeeks?: number;
  bloodGroup?: string;
  clinicianName: string;
  facilityName: string;
  onCloseSession: () => void;
  summary?: MomHavenHealthSummary;
}

export default function ClinicianPatientWorkspace({
  motherName = 'Mary Wanjiku',
  gestationWeeks = 28,
  bloodGroup = 'O Positive (O+)',
  clinicianName,
  facilityName,
  onCloseSession,
  summary,
}: ClinicianPatientWorkspaceProps) {
  const [workspaceTab, setWorkspaceTab] = useState<'summary' | 'overview' | 'anc' | 'child' | 'immunizations' | 'growth' | 'notes'>(summary ? 'summary' : 'overview');
  const [verificationTarget, setVerificationTarget] = useState<{
    isOpen: boolean;
    title: string;
    type: 'ANC Encounter' | 'Immunization' | 'Growth Measurement' | 'Postnatal Encounter';
    data: Record<string, any>;
  } | null>(null);

  const [showNewEncounterModal, setShowNewEncounterModal] = useState(false);

  // Sample ANC Visits
  const [ancVisits, setAncVisits] = useState([
    {
      id: 'anc-1',
      visitNumber: 1,
      gestationWeeks: 12,
      date: '2024-10-15',
      weightKg: 61.2,
      bp: '110/70',
      fundalHeight: 12,
      fhr: 150,
      hb: 12.1,
      iptp: false,
      ifas: true,
      provenance: { status: 'VERIFIED', enteredBy: 'Nurse Alice', enteredAt: '2024-10-15', verifiedBy: 'Kariokor HC' }
    },
    {
      id: 'anc-2',
      visitNumber: 2,
      gestationWeeks: 20,
      date: '2024-12-10',
      weightKg: 63.8,
      bp: '115/75',
      fundalHeight: 20,
      fhr: 144,
      hb: 11.8,
      iptp: true,
      ifas: true,
      provenance: { status: 'REPORTED', enteredBy: 'Mother', enteredAt: '2024-12-10', verifiedBy: null }
    },
    {
      id: 'anc-3',
      visitNumber: 3,
      gestationWeeks: 26,
      date: '2025-01-22',
      weightKg: 65.5,
      bp: '118/76',
      fundalHeight: 26,
      fhr: 140,
      hb: 12.0,
      iptp: true,
      ifas: true,
      provenance: { status: 'REPORTED', enteredBy: 'Mother', enteredAt: '2025-01-22', verifiedBy: null }
    }
  ]);

  // Sample Child Vaccines
  const [vaccines, setVaccines] = useState([
    {
      id: 'vac-1',
      name: 'BCG + OPV 0 (Birth Dose)',
      ageBracket: 'At Birth',
      dateGiven: '2024-04-12',
      batch: 'BCG-KEN-2024',
      provenance: { status: 'VERIFIED', enteredBy: 'MTRH', enteredAt: '2024-04-12', verifiedBy: 'Dr. Kimani' }
    },
    {
      id: 'vac-2',
      name: 'Penta 1 + OPV 1 + Rota 1 + PCV 10',
      ageBracket: '6 Weeks',
      dateGiven: '2024-05-24',
      batch: 'PNT-8812',
      provenance: { status: 'REPORTED', enteredBy: 'Mother', enteredAt: '2024-05-24', verifiedBy: null }
    },
    {
      id: 'vac-3',
      name: 'Penta 2 + OPV 2 + Rota 2 + PCV 10',
      ageBracket: '10 Weeks',
      dateGiven: '2024-06-28',
      batch: 'PNT-9921',
      provenance: { status: 'REPORTED', enteredBy: 'Mother', enteredAt: '2024-06-28', verifiedBy: null }
    }
  ]);

  const handleVerifyAnc = (visit: any) => {
    setVerificationTarget({
      isOpen: true,
      title: `ANC Contact #${visit.visitNumber} (${visit.gestationWeeks} Weeks)`,
      type: 'ANC Encounter',
      data: {
        visitNumber: visit.visitNumber,
        gestationWeeks: `${visit.gestationWeeks} weeks`,
        bloodPressure: visit.bp,
        weight: `${visit.weightKg} kg`,
        fundalHeight: `${visit.fundalHeight} cm`,
        fetalHeartRate: `${visit.fhr} bpm`,
        hemoglobin: `${visit.hb} g/dL`,
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
          <div className="w-12 h-12 rounded-full bg-[var(--lavender-100)] text-[var(--haven-deep)] font-display font-extrabold text-lg flex items-center justify-center border border-purple-200">
            {motherName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-lg text-[var(--ink-900)]">
                {motherName}
              </h2>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> MOH Verified Patient
              </span>
            </div>
            <p className="text-xs text-[var(--ink-600)]">
              Gestation: <strong>Week {gestationWeeks} (Trimester 3)</strong> · Blood Group: <strong>{bloodGroup}</strong> · National ID: <strong>*****824</strong>
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

      {/* Navigation Tabs */}
      <div className="bg-white p-1.5 rounded-[16px] border border-[var(--border-hairline)] flex overflow-x-auto gap-1">
        {[
          ...(summary ? [{ id: 'summary', label: 'MomHaven Health Summary', icon: FileText }] : []),
          { id: 'overview', label: 'Obstetric Overview', icon: Heart },
          { id: 'anc', label: 'ANC Contacts & Verification', icon: Activity },
          { id: 'child', label: 'Child & Newborn Exam', icon: Baby },
          { id: 'immunizations', label: 'KEPI Vaccines', icon: Syringe },
          { id: 'growth', label: 'Growth & MUAC', icon: TrendingUp },
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
                <p className="font-bold text-sm text-[var(--ink-900)] mt-0.5">G2 P1 + 0</p>
              </div>
              <div className="p-3 bg-[var(--lavender-50)] rounded-[14px]">
                <span className="text-gray-500">Last Normal LMP</span>
                <p className="font-bold text-sm text-[var(--ink-900)] mt-0.5">18 July 2024</p>
              </div>
              <div className="p-3 bg-[var(--lavender-50)] rounded-[14px]">
                <span className="text-gray-500">Calculated EDD</span>
                <p className="font-bold text-sm text-[var(--haven-deep)] mt-0.5">25 April 2025</p>
              </div>
              <div className="p-3 bg-[var(--lavender-50)] rounded-[14px]">
                <span className="text-gray-500">Baseline Blood Pressure</span>
                <p className="font-bold text-sm text-[var(--ink-900)] mt-0.5">110 / 70 mmHg</p>
              </div>
              <div className="p-3 bg-[var(--lavender-50)] rounded-[14px]">
                <span className="text-gray-500">Hemoglobin (Hb)</span>
                <p className="font-bold text-sm text-emerald-700 mt-0.5">12.1 g/dL (Normal)</p>
              </div>
              <div className="p-3 bg-[var(--lavender-50)] rounded-[14px]">
                <span className="text-gray-500">Rhesus Factor</span>
                <p className="font-bold text-sm text-[var(--ink-900)] mt-0.5">Positive (+)</p>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <h4 className="font-display font-bold text-xs text-[var(--ink-900)] mb-1.5">
                Birth Preparedness &amp; Facility Plan
              </h4>
              <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-[12px] border border-gray-100">
                <strong>Preferred Facility:</strong> Pumwani Maternity Hospital · <strong>Transport:</strong> Taxi Driver saved (+254712345678) · <strong>Companion:</strong> Partner James · <strong>Emergency Funds:</strong> M-Pesa reserved.
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
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="p-2.5 rounded-[12px] bg-emerald-50 text-emerald-950 flex items-center justify-between">
                <span>IPTp-SP Malaria Prophylaxis</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="p-2.5 rounded-[12px] bg-emerald-50 text-emerald-950 flex items-center justify-between">
                <span>Tetanus (Td Booster) Up to Date</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="p-2.5 rounded-[12px] bg-emerald-50 text-emerald-950 flex items-center justify-between">
                <span>LLIN Mosquito Net Issued</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
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
                    <td className="p-3">{v.gestationWeeks}w</td>
                    <td className="p-3 text-gray-600">{v.date}</td>
                    <td className="p-3 font-mono font-semibold">{v.bp}</td>
                    <td className="p-3">{v.weightKg} kg</td>
                    <td className="p-3">{v.fundalHeight}cm / {v.fhr}bpm</td>
                    <td className="p-3 font-semibold">{v.hb} g/dL</td>
                    <td className="p-3">
                      <ProvenanceBadge provenance={v.provenance as any} />
                    </td>
                    <td className="p-3 text-right">
                      {v.provenance.status === 'REPORTED' ? (
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
        </div>
      )}

      {workspaceTab === 'child' && (
        <div className="bg-white border border-[var(--border-hairline)] p-5 rounded-[22px] shadow-card-1 space-y-4">
          <h3 className="font-display font-bold text-base text-[var(--ink-900)]">
            Newborn Examination &amp; Postnatal Records
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-4 bg-[var(--lavender-50)] rounded-[16px] space-y-1.5">
              <span className="font-bold text-[var(--haven-deep)] text-sm">Baby Amara (Child #1)</span>
              <p><strong>DOB:</strong> 12 April 2024 · <strong>Sex:</strong> Female</p>
              <p><strong>Birth Weight:</strong> 3.4 kg · <strong>APGAR:</strong> 9/10 at 5 min</p>
              <p><strong>Delivery:</strong> SVD (Spontaneous Vertex Delivery) at Pumwani Maternity</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-[16px] space-y-1 text-emerald-950">
              <span className="font-bold text-emerald-900">Immediate Newborn Prophylaxis</span>
              <p>✓ Vitamin K1 1.0mg administered</p>
              <p>✓ Tetracycline 1% Eye Ointment applied</p>
              <p>✓ Chlorhexidine 7.1% umbilical cord care initiated</p>
              <p>✓ Immediate skin-to-skin and breastfeeding within 1st hour</p>
            </div>
          </div>
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
                      {vac.provenance.status === 'REPORTED' ? (
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
              <span>Current Child MUAC: <strong>14.2 cm (Green · Normal)</strong></span>
              <span>Bilateral Oedema: <strong>None detected (Grade 0)</strong></span>
            </div>
          </div>
        </div>
      )}

      {workspaceTab === 'notes' && (
        <PrivateNotesPanel
          motherId="mother-123"
          clinicianName={clinicianName}
          facilityName={facilityName}
        />
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
            // Update local state to show verified
            if (verificationTarget.type === 'ANC Encounter') {
              setAncVisits(prev => prev.map(v => ({ ...v, provenance: { status: 'VERIFIED', enteredBy: 'Mother', enteredAt: v.date, verifiedBy: `${clinicianName} (${facilityName})` } })));
            } else if (verificationTarget.type === 'Immunization') {
              setVaccines(prev => prev.map(v => ({ ...v, provenance: { status: 'VERIFIED', enteredBy: 'Mother', enteredAt: v.dateGiven, verifiedBy: `${clinicianName} (${facilityName})` } })));
            }
          }}
        />
      )}

      {/* New Encounter Modal */}
      <NewEncounterModal
        isOpen={showNewEncounterModal}
        onClose={() => setShowNewEncounterModal(false)}
        motherId="mother-123"
        clinicianName={clinicianName}
        facilityName={facilityName}
        onSaved={() => {
          // Add local mock encounter
          setAncVisits(prev => [
            ...prev,
            {
              id: `anc-${prev.length + 1}`,
              visitNumber: prev.length + 1,
              gestationWeeks: 28,
              date: new Date().toISOString().split('T')[0],
              weightKg: 66.5,
              bp: '118/74',
              fundalHeight: 28,
              fhr: 142,
              hb: 12.4,
              iptp: true,
              ifas: true,
              provenance: { status: 'VERIFIED', enteredBy: clinicianName, enteredAt: new Date().toISOString(), verifiedBy: facilityName }
            }
          ]);
        }}
      />
    </div>
  );
}
