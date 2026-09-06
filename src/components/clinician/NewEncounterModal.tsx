// src/components/clinician/NewEncounterModal.tsx
import React, { useState } from 'react';
import { Stethoscope, X, CheckCircle2, AlertCircle } from 'lucide-react';
import Button from '../Button';
import { auth } from '../../lib/firebase';

interface NewEncounterModalProps {
  isOpen: boolean;
  onClose: () => void;
  motherId: string;
  pregnancyId?: string;
  childId?: string;
  clinicianName: string;
  facilityName: string;
  onSaved: () => void;
}

export default function NewEncounterModal({
  isOpen,
  onClose,
  motherId,
  pregnancyId,
  childId,
  clinicianName,
  facilityName,
  onSaved,
}: NewEncounterModalProps) {
  const [encounterType, setEncounterType] = useState<'anc' | 'pnc' | 'immunization' | 'growth' | 'congenital' | 'familyPlanning'>('anc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ANC Form Fields - Neutral defaults (MOH216)
  const [visitNumber, setVisitNumber] = useState(1);
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [gestationalWeeks, setGestationalWeeks] = useState<string>('');
  const [systolicBp, setSystolicBp] = useState('');
  const [diastolicBp, setDiastolicBp] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [ancMuacCm, setAncMuacCm] = useState('');
  const [fundalHeight, setFundalHeight] = useState('');
  const [presentation, setPresentation] = useState('Cephalic');
  const [fetalHeartRate, setFetalHeartRate] = useState('');
  const [hbLevel, setHbLevel] = useState('');
  const [nextVisitDate, setNextVisitDate] = useState('');
  const [iptpGiven, setIptpGiven] = useState(false);
  const [ifasGiven, setIfasGiven] = useState(false);
  const [clinicalNotes, setClinicalNotes] = useState('');

  // Vaccine Form Fields - Neutral defaults (MOH216 Antigens)
  const [antigen, setAntigen] = useState('BCG');
  const [vaccineName, setVaccineName] = useState('BCG + OPV Birth Dose (At Birth)');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [givenDate, setGivenDate] = useState(new Date().toISOString().split('T')[0]);
  const [vaccineStatus, setVaccineStatus] = useState<'given' | 'scheduled' | 'missed'>('given');
  const [batchNumber, setBatchNumber] = useState('');

  // Growth Form Fields - Neutral defaults (MOH216)
  const [growthDate, setGrowthDate] = useState(new Date().toISOString().split('T')[0]);
  const [growthAgeMonths, setGrowthAgeMonths] = useState('');
  const [childWeight, setChildWeight] = useState('');
  const [childHeight, setChildHeight] = useState('');
  const [muacCm, setMuacCm] = useState('');

  // PNC Form Fields - Structured Kenya MOH 216 Handbook p.20 Table
  const [pncTiming, setPncTiming] = useState('48h');
  const [pncDate, setPncDate] = useState(new Date().toISOString().split('T')[0]);
  const [pncBpSystolic, setPncBpSystolic] = useState('120');
  const [pncBpDiastolic, setPncBpDiastolic] = useState('80');
  const [pncTemperature, setPncTemperature] = useState('36.8');
  const [pncPulse, setPncPulse] = useState('76');
  const [pncRespiratoryRate, setPncRespiratoryRate] = useState('18');
  const [pncUterineInvolution, setPncUterineInvolution] = useState('Contracted');
  const [pncLochiaAmount, setPncLochiaAmount] = useState('normal');
  const [pncLochiaColour, setPncLochiaColour] = useState('rubra');
  const [pncLochiaSmell, setPncLochiaSmell] = useState('normal');
  const [pncHaemoglobin, setPncHaemoglobin] = useState('');
  const [pncHivRetestDone, setPncHivRetestDone] = useState(false);
  const [pncHivRetestResult, setPncHivRetestResult] = useState('non-reactive');
  const [pncOnHaart, setPncOnHaart] = useState(false);
  const [pncFamilyPlanningCounselled, setPncFamilyPlanningCounselled] = useState(true);
  const [pncFpMethodChoice, setPncFpMethodChoice] = useState('Exclusive Breastfeeding (LAM)');
  const [pncMentalHealthScreenDone, setPncMentalHealthScreenDone] = useState(true);
  const [pncMentalHealthScreenResult, setPncMentalHealthScreenResult] = useState<'no_concerns' | 'concerns_noted' | 'referred'>('no_concerns');
  const [pncNotes, setPncNotes] = useState('');

  // Congenital Exam Fields (Kenya MOH Handbook p.17)
  const [examWindow, setExamWindow] = useState<'within48h' | 'at6weeks'>('within48h');
  const [headSize, setHeadSize] = useState<'normal' | 'microcephalic' | 'hydrocephalic'>('normal');
  const [mouthGums, setMouthGums] = useState<'normal' | 'cleft_lip' | 'cleft_palate' | 'abnormal'>('normal');
  const [ears, setEars] = useState<'normal' | 'abnormal'>('normal');
  const [armsLegs, setArmsLegs] = useState<'normal' | 'abnormal'>('normal');
  const [spineNeckBack, setSpineNeckBack] = useState<'normal' | 'abnormal'>('normal');
  const [bodyMovement, setBodyMovement] = useState<'normal' | 'abnormal'>('normal');
  const [cerebralPalsyRisk, setCerebralPalsyRisk] = useState(false);
  const [abdominalWall, setAbdominalWall] = useState<'normal' | 'abnormal'>('normal');
  const [genitalia, setGenitalia] = useState<'normal' | 'abnormal'>('normal');
  const [anus, setAnus] = useState<'perforate' | 'imperforate' | 'abnormal'>('perforate');
  const [abnormalityDetails, setAbnormalityDetails] = useState('');
  const [referralOrActionTaken, setReferralOrActionTaken] = useState('');

  // Family Planning Fields (Kenya MOH Handbook p.22)
  const [fpMethod, setFpMethod] = useState('Implants');
  const [fpDetails, setFpDetails] = useState('');
  const [fpDateStarted, setFpDateStarted] = useState(new Date().toISOString().split('T')[0]);
  const [fpNextAppt, setFpNextAppt] = useState('');
  const [fpRemovalDate, setFpRemovalDate] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated as a clinician.');
      const token = await user.getIdToken();
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      let endpoint = '/api/v1/clinician/encounters';
      let payload: Record<string, any> = {
        motherId,
        pregnancyId,
        childId,
      };

      if (encounterType === 'anc') {
        endpoint = '/api/v1/clinician/encounters/anc';
        payload = {
          motherId,
          pregnancyId,
          contactNumber: Number(visitNumber) || 1,
          visitNumber: Number(visitNumber) || 1,
          visitDate: visitDate || new Date().toISOString().split('T')[0],
          gestationWeeks: gestationalWeeks.trim() ? Number(gestationalWeeks) : undefined,
          gestationalWeeks: gestationalWeeks.trim() ? Number(gestationalWeeks) : undefined,
          systolicBp: systolicBp.trim() || undefined,
          diastolicBp: diastolicBp.trim() || undefined,
          bp: systolicBp.trim() && diastolicBp.trim() ? `${systolicBp.trim()}/${diastolicBp.trim()}` : undefined,
          weightKg: weightKg.trim() ? Number(weightKg) : undefined,
          fundalHeightCm: fundalHeight.trim() ? Number(fundalHeight) : undefined,
          fundalHeight: fundalHeight.trim() ? Number(fundalHeight) : undefined,
          presentation: presentation || 'Cephalic',
          fetalHeartRate: fetalHeartRate.trim() ? Number(fetalHeartRate) : undefined,
          hb: hbLevel.trim() ? Number(hbLevel) : undefined,
          hbLevel: hbLevel.trim() ? Number(hbLevel) : undefined,
          muacCm: ancMuacCm.trim() ? Number(ancMuacCm) : undefined,
          nextVisitDate: nextVisitDate.trim() || null,
          iptpGiven,
          ifasGiven,
          clinicalNotes: clinicalNotes.trim(),
          summary: clinicalNotes.trim() || `ANC Contact #${visitNumber}`,
        };
      } else if (encounterType === 'pnc') {
        endpoint = '/api/v1/clinician/encounters/pnc';
        payload = {
          motherId,
          pregnancyId,
          childId,
          visit: pncTiming,
          timing: pncTiming,
          date: pncDate || new Date().toISOString().split('T')[0],
          bloodPressure: pncBpSystolic && pncBpDiastolic ? `${pncBpSystolic}/${pncBpDiastolic}` : undefined,
          systolicBp: pncBpSystolic ? Number(pncBpSystolic) : undefined,
          diastolicBp: pncBpDiastolic ? Number(pncBpDiastolic) : undefined,
          temperature: pncTemperature ? Number(pncTemperature) : undefined,
          pulse: pncPulse ? Number(pncPulse) : undefined,
          respiratoryRate: pncRespiratoryRate ? Number(pncRespiratoryRate) : undefined,
          uterineInvolution: pncUterineInvolution,
          lochiaAmount: pncLochiaAmount,
          lochiaColour: pncLochiaColour,
          lochiaSmell: pncLochiaSmell,
          haemoglobin: pncHaemoglobin.trim() ? Number(pncHaemoglobin) : undefined,
          hivRetestDone: pncHivRetestDone,
          hivRetestResult: pncHivRetestDone ? pncHivRetestResult : undefined,
          onHaart: pncOnHaart,
          familyPlanningCounselled: pncFamilyPlanningCounselled,
          fpMethod: pncFamilyPlanningCounselled ? pncFpMethodChoice : undefined,
          mentalHealthScreenDone: pncMentalHealthScreenDone,
          mentalHealthScreenResult: pncMentalHealthScreenResult,
          clinicalNotes: pncNotes.trim(),
          motherFindings: pncNotes.trim(),
          summary: pncNotes.trim() || `PNC Contact (${pncTiming})`,
          facilityName,
        };
      } else if (encounterType === 'immunization') {
        endpoint = '/api/v1/clinician/encounters/immunization';
        payload = {
          motherId,
          childId,
          antigen,
          vaccineName: antigen || vaccineName,
          scheduledDate: scheduledDate || new Date().toISOString().split('T')[0],
          givenDate: vaccineStatus === 'missed' ? null : (givenDate || new Date().toISOString().split('T')[0]),
          status: vaccineStatus,
          batchNumber: batchNumber.trim(),
          facilityName,
          notes: clinicalNotes.trim(),
        };
      } else if (encounterType === 'growth') {
        endpoint = '/api/v1/clinician/encounters/growth';
        if (!childWeight.trim()) {
          throw new Error('Please enter child weight in kg.');
        }
        payload = {
          motherId,
          childId,
          measurementDate: growthDate || new Date().toISOString().split('T')[0],
          ageInMonths: growthAgeMonths.trim() ? Number(growthAgeMonths) : undefined,
          childWeight: Number(childWeight),
          weightKg: Number(childWeight),
          lengthHeightCm: childHeight.trim() ? Number(childHeight) : undefined,
          childHeight: childHeight.trim() ? Number(childHeight) : undefined,
          muacCm: muacCm.trim() ? Number(muacCm) : undefined,
          notes: clinicalNotes.trim(),
        };
      } else if (encounterType === 'congenital') {
        endpoint = '/api/v1/clinician/encounters/congenital';
        payload = {
          motherId,
          childId,
          examWindow,
          examinerName: clinicianName,
          facilityName,
          headSize,
          headSizeDetails: headSize !== 'normal' ? abnormalityDetails : undefined,
          mouthGums,
          mouthGumsDetails: mouthGums !== 'normal' ? abnormalityDetails : undefined,
          ears,
          armsLegs,
          armsLegsDetails: armsLegs !== 'normal' ? abnormalityDetails : undefined,
          spineNeckBack,
          bodyMovement,
          cerebralPalsyRisk,
          abdominalWall,
          genitalia,
          anus,
          anusDetails: anus !== 'perforate' ? abnormalityDetails : undefined,
          referralOrActionTaken: referralOrActionTaken.trim() || undefined,
          notes: clinicalNotes.trim(),
        };
      } else if (encounterType === 'familyPlanning') {
        endpoint = '/api/v1/clinician/encounters/family-planning';
        payload = {
          motherId,
          counselorName: clinicianName,
          facilityName,
          methodChosen: fpMethod,
          methodDetails: fpDetails.trim() || undefined,
          dateStarted: fpDateStarted,
          nextAppointmentDate: fpNextAppt || undefined,
          removalDate: fpRemovalDate || undefined,
          notes: clinicalNotes.trim(),
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to record encounter.');
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record encounter.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-[24px] border border-[var(--border-hairline)] shadow-card-3 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[var(--haven-deep)] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-purple-200" />
            </div>
            <div>
              <h3 className="font-display font-bold text-[16px] leading-tight">
                Log New Clinical Encounter
              </h3>
              <p className="text-[11px] text-purple-200">
                Direct In-Facility Entry · Auto-Verified Stamp
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-[13px]">
          {/* Encounter Type Selector */}
          <div className="bg-[var(--lavender-50)] p-1 rounded-[14px] grid grid-cols-3 sm:grid-cols-6 gap-1">
            {[
              { id: 'anc', label: 'ANC Visit' },
              { id: 'pnc', label: 'PNC Contact' },
              { id: 'immunization', label: 'Vaccine' },
              { id: 'growth', label: 'Growth' },
              { id: 'congenital', label: 'Congenital' },
              { id: 'familyPlanning', label: 'FP (p.22)' },
            ].map(type => (
              <button
                key={type.id}
                type="button"
                onClick={() => setEncounterType(type.id as any)}
                className={`py-2 text-[11px] font-display font-bold rounded-[10px] transition-all cursor-pointer ${
                  encounterType === type.id
                    ? 'bg-white text-[var(--haven-deep)] shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-[12px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {encounterType === 'anc' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">ANC Contact #</label>
                  <select
                    value={visitNumber}
                    onChange={(e) => setVisitNumber(Number(e.target.value))}
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs font-bold"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                      <option key={n} value={n}>Contact {n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Visit Date</label>
                  <input
                    type="date"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Gestation (Weeks)</label>
                  <input
                    type="number"
                    value={gestationalWeeks}
                    onChange={(e) => setGestationalWeeks(e.target.value)}
                    placeholder="e.g. 24"
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs font-bold"
                    min={4}
                    max={42}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">BP (Systolic / Diastolic)</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={systolicBp}
                      onChange={(e) => setSystolicBp(e.target.value)}
                      placeholder="120"
                      className="w-1/2 p-2 border border-gray-200 rounded-[10px] bg-white text-xs text-center font-bold"
                    />
                    <span>/</span>
                    <input
                      type="text"
                      value={diastolicBp}
                      onChange={(e) => setDiastolicBp(e.target.value)}
                      placeholder="80"
                      className="w-1/2 p-2 border border-gray-200 rounded-[10px] bg-white text-xs text-center font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Weight (kg)</label>
                  <input
                    type="text"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="e.g. 64.0"
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">MUAC (cm)</label>
                  <input
                    type="text"
                    value={ancMuacCm}
                    onChange={(e) => setAncMuacCm(e.target.value)}
                    placeholder="e.g. 24.5"
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Fundal Ht (cm)</label>
                  <input
                    type="text"
                    value={fundalHeight}
                    onChange={(e) => setFundalHeight(e.target.value)}
                    placeholder="e.g. 24"
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Presentation</label>
                  <select
                    value={presentation}
                    onChange={(e) => setPresentation(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs font-bold"
                  >
                    <option value="Cephalic">Cephalic</option>
                    <option value="Breech">Breech</option>
                    <option value="Shoulder / Transverse">Shoulder / Transverse</option>
                    <option value="Not assessed">Not assessed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">FHR (bpm)</label>
                  <input
                    type="text"
                    value={fetalHeartRate}
                    onChange={(e) => setFetalHeartRate(e.target.value)}
                    placeholder="e.g. 140"
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Hb Level (g/dL)</label>
                  <input
                    type="text"
                    value={hbLevel}
                    onChange={(e) => setHbLevel(e.target.value)}
                    placeholder="e.g. 12.0"
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Next Visit Date</label>
                  <input
                    type="date"
                    value={nextVisitDate}
                    onChange={(e) => setNextVisitDate(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs font-bold"
                  />
                </div>
                <div className="flex items-center gap-4 pt-4">
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ifasGiven}
                      onChange={(e) => setIfasGiven(e.target.checked)}
                      className="w-4 h-4 accent-[var(--haven-deep)]"
                    />
                    <span>IFAS</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={iptpGiven}
                      onChange={(e) => setIptpGiven(e.target.checked)}
                      className="w-4 h-4 accent-[var(--haven-deep)]"
                    />
                    <span>IPTp-SP</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Clinical Findings &amp; Next Steps</label>
                <textarea
                  rows={2}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Clinical findings, observations, or prescribed regimen..."
                  className="w-full p-2.5 border border-gray-200 rounded-[12px] bg-white text-xs focus:outline-none"
                />
              </div>
            </div>
          )}

          {encounterType === 'immunization' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Antigen (MOH216)</label>
                  <select
                    value={antigen}
                    onChange={(e) => {
                      setAntigen(e.target.value);
                      setVaccineName(e.target.value);
                    }}
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs font-bold"
                  >
                    <option value="BCG">BCG (At Birth)</option>
                    <option value="OPV0">OPV0 (At Birth)</option>
                    <option value="OPV1">OPV1 (6 Weeks)</option>
                    <option value="OPV2">OPV2 (10 Weeks)</option>
                    <option value="OPV3">OPV3 (14 Weeks)</option>
                    <option value="IPV">IPV (14 Weeks)</option>
                    <option value="DPT-HepB-Hib 1">DPT-HepB-Hib 1 (Penta 1, 6w)</option>
                    <option value="DPT-HepB-Hib 2">DPT-HepB-Hib 2 (Penta 2, 10w)</option>
                    <option value="DPT-HepB-Hib 3">DPT-HepB-Hib 3 (Penta 3, 14w)</option>
                    <option value="PCV 1">PCV 1 (6 Weeks)</option>
                    <option value="PCV 2">PCV 2 (10 Weeks)</option>
                    <option value="PCV 3">PCV 3 (14 Weeks)</option>
                    <option value="Rota 1">Rota 1 (6 Weeks)</option>
                    <option value="Rota 2">Rota 2 (10 Weeks)</option>
                    <option value="MR-6mo">MR-6mo (6 Months)</option>
                    <option value="MR-9mo">MR-9mo (9 Months)</option>
                    <option value="MR-18mo">MR-18mo (18 Months)</option>
                    <option value="YellowFever">Yellow Fever (9 Months)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Status</label>
                  <select
                    value={vaccineStatus}
                    onChange={(e) => setVaccineStatus(e.target.value as any)}
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs font-bold"
                  >
                    <option value="given">Given (Administered)</option>
                    <option value="scheduled">Scheduled (Upcoming)</option>
                    <option value="missed">Missed (Defaulter)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Given Date</label>
                  <input
                    type="date"
                    value={givenDate}
                    disabled={vaccineStatus === 'missed'}
                    onChange={(e) => setGivenDate(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs font-bold disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Batch Number</label>
                  <input
                    type="text"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder="e.g. KE-VAC-2025-001"
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Facility Name</label>
                  <input
                    type="text"
                    value={facilityName}
                    disabled
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-gray-50 text-xs font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {encounterType === 'growth' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Measurement Date</label>
                  <input
                    type="date"
                    value={growthDate}
                    onChange={(e) => setGrowthDate(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Age (Months)</label>
                  <input
                    type="number"
                    value={growthAgeMonths}
                    onChange={(e) => setGrowthAgeMonths(e.target.value)}
                    placeholder="e.g. 6"
                    min={0}
                    max={60}
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Weight (kg) *</label>
                  <input
                    type="text"
                    value={childWeight}
                    onChange={(e) => setChildWeight(e.target.value)}
                    placeholder="e.g. 5.5"
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Length / Height (cm)</label>
                  <input
                    type="text"
                    value={childHeight}
                    onChange={(e) => setChildHeight(e.target.value)}
                    placeholder="e.g. 59.5"
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">MUAC (cm)</label>
                  <input
                    type="text"
                    value={muacCm}
                    onChange={(e) => setMuacCm(e.target.value)}
                    placeholder="e.g. 13.8"
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {encounterType === 'pnc' && (
            <div className="space-y-3.5">
              {/* Timing & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">PNC Contact Schedule (p.20)</label>
                  <select
                    value={pncTiming}
                    onChange={(e) => setPncTiming(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs font-bold"
                  >
                    <option value="48h">Contact 1: Within 48 Hours Post-Delivery</option>
                    <option value="1-2w">Contact 2: Day 7 - 14 (1 - 2 Weeks)</option>
                    <option value="4-6w">Contact 3: Week 4 - 6 (Postpartum Check)</option>
                    <option value="4-6mo">Contact 4: Month 4 - 6 (Weaning Evaluation)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Encounter Date</label>
                  <input
                    type="date"
                    value={pncDate}
                    onChange={(e) => setPncDate(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs font-bold"
                  />
                </div>
              </div>

              {/* Maternal Vitals Grid */}
              <div className="bg-[var(--lavender-50)]/60 p-3 rounded-[12px] border border-gray-100 space-y-2">
                <span className="text-[11px] font-display font-bold text-gray-700 block">Maternal Vitals</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-600 mb-0.5">BP (mmHg)</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={pncBpSystolic}
                        onChange={(e) => setPncBpSystolic(e.target.value)}
                        placeholder="120"
                        className="w-1/2 p-1.5 border border-gray-200 rounded-[8px] bg-white text-xs text-center font-bold"
                      />
                      <span>/</span>
                      <input
                        type="text"
                        value={pncBpDiastolic}
                        onChange={(e) => setPncBpDiastolic(e.target.value)}
                        placeholder="80"
                        className="w-1/2 p-1.5 border border-gray-200 rounded-[8px] bg-white text-xs text-center font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Temp (°C)</label>
                    <input
                      type="text"
                      value={pncTemperature}
                      onChange={(e) => setPncTemperature(e.target.value)}
                      placeholder="36.8"
                      className="w-full p-1.5 border border-gray-200 rounded-[8px] bg-white text-xs text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Pulse (bpm)</label>
                    <input
                      type="text"
                      value={pncPulse}
                      onChange={(e) => setPncPulse(e.target.value)}
                      placeholder="76"
                      className="w-full p-1.5 border border-gray-200 rounded-[8px] bg-white text-xs text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Resp Rate (/min)</label>
                    <input
                      type="text"
                      value={pncRespiratoryRate}
                      onChange={(e) => setPncRespiratoryRate(e.target.value)}
                      placeholder="18"
                      className="w-full p-1.5 border border-gray-200 rounded-[8px] bg-white text-xs text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Uterine Involution & Lochia */}
              <div className="bg-white p-3 rounded-[12px] border border-gray-200 space-y-2">
                <span className="text-[11px] font-display font-bold text-gray-700 block">Uterine Involution &amp; Lochia (Handbook p.20)</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Uterine Involution</label>
                    <select
                      value={pncUterineInvolution}
                      onChange={(e) => setPncUterineInvolution(e.target.value)}
                      className="w-full p-1.5 border border-gray-200 rounded-[8px] bg-white text-xs font-semibold"
                    >
                      <option value="Contracted">Contracted (Normal)</option>
                      <option value="Well Involuted">Well Involuted</option>
                      <option value="Subinvoluted">Subinvoluted (Delayed)</option>
                      <option value="Tender">Tender (Infection Risk)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Lochia Amount</label>
                    <select
                      value={pncLochiaAmount}
                      onChange={(e) => setPncLochiaAmount(e.target.value)}
                      className="w-full p-1.5 border border-gray-200 rounded-[8px] bg-white text-xs font-semibold"
                    >
                      <option value="normal">Normal (Moderate)</option>
                      <option value="scant">Scant / Minimal</option>
                      <option value="excessive">Excessive (Heavy)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Lochia Colour</label>
                    <select
                      value={pncLochiaColour}
                      onChange={(e) => setPncLochiaColour(e.target.value)}
                      className="w-full p-1.5 border border-gray-200 rounded-[8px] bg-white text-xs font-semibold"
                    >
                      <option value="rubra">Rubra (Red - Day 1-4)</option>
                      <option value="serosa">Serosa (Pink/Brown - Day 5-10)</option>
                      <option value="alba">Alba (Yellow/White - Day 10+)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Lochia Smell</label>
                    <select
                      value={pncLochiaSmell}
                      onChange={(e) => setPncLochiaSmell(e.target.value)}
                      className="w-full p-1.5 border border-gray-200 rounded-[8px] bg-white text-xs font-semibold"
                    >
                      <option value="normal">Normal (Fleshy/Non-offensive)</option>
                      <option value="foul">Foul-smelling (Sepsis Sign)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Lab, HIV & Family Planning */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-gray-50/70 p-2.5 rounded-[10px] border border-gray-200 space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-700">Haemoglobin (Hb g/dL)</label>
                  <input
                    type="text"
                    value={pncHaemoglobin}
                    onChange={(e) => setPncHaemoglobin(e.target.value)}
                    placeholder="e.g. 11.5"
                    className="w-full p-1.5 border border-gray-200 rounded-[8px] bg-white text-xs font-bold"
                  />
                  <label className="flex items-center gap-1.5 pt-1 text-[11px] text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pncOnHaart}
                      onChange={(e) => setPncOnHaart(e.target.checked)}
                      className="w-3.5 h-3.5 accent-[var(--haven-deep)]"
                    />
                    <span>Mother on HAART</span>
                  </label>
                </div>

                <div className="bg-gray-50/70 p-2.5 rounded-[10px] border border-gray-200 space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pncHivRetestDone}
                      onChange={(e) => setPncHivRetestDone(e.target.checked)}
                      className="w-3.5 h-3.5 accent-[var(--haven-deep)]"
                    />
                    <span>HIV Retest Administered</span>
                  </label>
                  {pncHivRetestDone && (
                    <select
                      value={pncHivRetestResult}
                      onChange={(e) => setPncHivRetestResult(e.target.value)}
                      className="w-full p-1.5 border border-gray-200 rounded-[8px] bg-white text-xs font-semibold"
                    >
                      <option value="non-reactive">Non-Reactive (Negative)</option>
                      <option value="reactive">Reactive (Positive - HAART Linkage)</option>
                    </select>
                  )}
                </div>

                <div className="bg-gray-50/70 p-2.5 rounded-[10px] border border-gray-200 space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pncFamilyPlanningCounselled}
                      onChange={(e) => setPncFamilyPlanningCounselled(e.target.checked)}
                      className="w-3.5 h-3.5 accent-[var(--haven-deep)]"
                    />
                    <span>FP Counselled (p.22)</span>
                  </label>
                  {pncFamilyPlanningCounselled && (
                    <select
                      value={pncFpMethodChoice}
                      onChange={(e) => setPncFpMethodChoice(e.target.value)}
                      className="w-full p-1.5 border border-gray-200 rounded-[8px] bg-white text-xs font-semibold"
                    >
                      <option value="Exclusive Breastfeeding (LAM)">Exclusive Breastfeeding (LAM)</option>
                      <option value="Progestin-only Pills (POPs)">POPs (Microlut)</option>
                      <option value="Implants (Jadelle/Implanon)">Implants (Jadelle/Implanon)</option>
                      <option value="Depo-Provera (DMPA)">Injectable (DMPA)</option>
                      <option value="IUCD (Copper T)">Postpartum IUCD</option>
                      <option value="Barrier / Condoms">Condoms</option>
                      <option value="Bilateral Tubal Ligation (BTL)">BTL (Permanent)</option>
                      <option value="None / Undecided">Undecided / Declined</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Maternal Mental Health Screening (Handbook p.20 Requirement) */}
              <div className="p-3 bg-amber-50/60 rounded-[12px] border border-amber-200/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-display font-bold text-amber-900">Maternal Mental Health Screening (Handbook p.20)</span>
                  </div>
                  <label className="flex items-center gap-1.5 text-[11px] text-amber-900 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pncMentalHealthScreenDone}
                      onChange={(e) => setPncMentalHealthScreenDone(e.target.checked)}
                      className="w-3.5 h-3.5 accent-amber-600"
                    />
                    <span>Screening Completed</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'no_concerns', label: 'No Concerns Noted', desc: 'Positive mood, bonding well' },
                    { id: 'concerns_noted', label: 'Concerns Noted', desc: 'Postpartum distress / anxiety' },
                    { id: 'referred', label: 'Referred for Care', desc: 'Immediate psychological support' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setPncMentalHealthScreenResult(option.id as any)}
                      className={`p-2 rounded-[10px] text-left border transition-all cursor-pointer ${
                        pncMentalHealthScreenResult === option.id
                          ? option.id === 'no_concerns'
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                            : 'bg-red-50 border-red-400 text-red-950 font-bold'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-[11px] leading-tight">{option.label}</div>
                      <div className="text-[9px] text-gray-500 font-normal mt-0.5">{option.desc}</div>
                    </button>
                  ))}
                </div>

                {(pncMentalHealthScreenResult === 'concerns_noted' || pncMentalHealthScreenResult === 'referred') && (
                  <div className="p-2 bg-red-100/70 border border-red-300 rounded-[8px] text-[11px] text-red-900 flex items-start gap-1.5">
                    <span className="font-bold">Urgent Referral Trigger:</span>
                    <span>Saving this encounter will automatically generate an authoritative clinical referral document on the facility roster for mental health counseling and follow-up.</span>
                  </div>
                )}
              </div>

              {/* Preserved Narrative Notes */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Clinical Observations &amp; Management Notes</label>
                <textarea
                  rows={2}
                  value={pncNotes}
                  onChange={(e) => setPncNotes(e.target.value)}
                  placeholder="Wound healing, lochia check, breastfeeding technique, infant progress, and maternal counsel..."
                  className="w-full p-2.5 border border-gray-200 rounded-[12px] bg-white text-xs focus:outline-none"
                />
              </div>
            </div>
          )}

          {encounterType === 'congenital' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Exam Window (Handbook p.17)</label>
                  <select
                    value={examWindow}
                    onChange={(e) => setExamWindow(e.target.value as any)}
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs font-bold"
                  >
                    <option value="within48h">Within 48h of Birth</option>
                    <option value="at6weeks">At 6 Weeks Postnatal Check</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Head Size / Fontanelle</label>
                  <select
                    value={headSize}
                    onChange={(e) => setHeadSize(e.target.value as any)}
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs font-bold"
                  >
                    <option value="normal">Normal</option>
                    <option value="microcephalic">Microcephalic (Small)</option>
                    <option value="hydrocephalic">Hydrocephalic (Enlarged)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Mouth/Palate</label>
                  <select
                    value={mouthGums}
                    onChange={(e) => setMouthGums(e.target.value as any)}
                    className="w-full p-1.5 border border-gray-200 rounded-[8px] bg-white text-[11px]"
                  >
                    <option value="normal">Normal</option>
                    <option value="cleft_lip">Cleft Lip</option>
                    <option value="cleft_palate">Cleft Palate</option>
                    <option value="abnormal">Abnormal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Arms & Legs</label>
                  <select
                    value={armsLegs}
                    onChange={(e) => setArmsLegs(e.target.value as any)}
                    className="w-full p-1.5 border border-gray-200 rounded-[8px] bg-white text-[11px]"
                  >
                    <option value="normal">Normal</option>
                    <option value="abnormal">Club Foot / Dislocation / Digits</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Anus</label>
                  <select
                    value={anus}
                    onChange={(e) => setAnus(e.target.value as any)}
                    className="w-full p-1.5 border border-gray-200 rounded-[8px] bg-white text-[11px]"
                  >
                    <option value="perforate">Perforate (Normal)</option>
                    <option value="imperforate">Imperforate</option>
                    <option value="abnormal">Abnormal</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-[10px] border border-slate-200">
                <input
                  type="checkbox"
                  id="cpRiskCheck"
                  checked={cerebralPalsyRisk}
                  onChange={(e) => setCerebralPalsyRisk(e.target.checked)}
                  className="rounded text-teal-600"
                />
                <label htmlFor="cpRiskCheck" className="text-[11px] font-semibold text-slate-700 cursor-pointer">
                  Flag Floppiness / Cerebral Palsy / Hypotonia Risk
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Abnormality Details (if any identified)</label>
                <input
                  type="text"
                  value={abnormalityDetails}
                  onChange={(e) => setAbnormalityDetails(e.target.value)}
                  placeholder="Specify system defect, deformity, or tone observations..."
                  className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Referral or Action Taken (Handbook p.17)</label>
                <input
                  type="text"
                  value={referralOrActionTaken}
                  onChange={(e) => setReferralOrActionTaken(e.target.value)}
                  placeholder="Pediatric surgical referral, orthopedic clinic, special care nursery..."
                  className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs"
                />
              </div>
            </div>
          )}

          {encounterType === 'familyPlanning' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Method Chosen (Handbook p.22)</label>
                  <select
                    value={fpMethod}
                    onChange={(e) => setFpMethod(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs font-bold"
                  >
                    <option value="Implants">Implants (Jadelle / Implanon)</option>
                    <option value="IUCD">IUCD (Copper T)</option>
                    <option value="Injectables (DMPA)">Injectables (Depo-Provera)</option>
                    <option value="POPs">POPs (Microlut / Progestin-only)</option>
                    <option value="COCs">COCs (Combined Oral)</option>
                    <option value="Condoms">Condoms (Dual Protection)</option>
                    <option value="LAM">LAM (Lactational Amenorrhea)</option>
                    <option value="Natural FP">Natural FP / Fertility Awareness</option>
                    <option value="BTL">BTL (Bilateral Tubal Ligation)</option>
                    <option value="Vasectomy">Vasectomy (Male Sterilization)</option>
                    <option value="None">Counseling Only / Undecided</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Brand / Lot / Site</label>
                  <input
                    type="text"
                    value={fpDetails}
                    onChange={(e) => setFpDetails(e.target.value)}
                    placeholder="e.g. Implanon NXT left arm"
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Date Started</label>
                  <input
                    type="date"
                    value={fpDateStarted}
                    onChange={(e) => setFpDateStarted(e.target.value)}
                    className="w-full p-1.5 border border-gray-200 rounded-[8px] bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Next Review Date</label>
                  <input
                    type="date"
                    value={fpNextAppt}
                    onChange={(e) => setFpNextAppt(e.target.value)}
                    className="w-full p-1.5 border border-gray-200 rounded-[8px] bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Removal / Expiry</label>
                  <input
                    type="date"
                    value={fpRemovalDate}
                    onChange={(e) => setFpRemovalDate(e.target.value)}
                    className="w-full p-1.5 border border-gray-200 rounded-[8px] bg-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Counseling &amp; Side-effects Guidance</label>
                <textarea
                  rows={2}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Dual protection counseling, warning signs, return whenever desired..."
                  className="w-full p-2.5 border border-gray-200 rounded-[12px] bg-white text-xs focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Audit signature info */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-[14px] text-[11px] text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>This entry will be recorded with <strong>Verified by {clinicianName} ({facilityName})</strong>.</span>
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-[var(--border-hairline)]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="py-2.5 px-4 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="py-2.5 px-5 text-xs bg-[var(--haven-deep)]"
            >
              {loading ? 'Saving Record...' : 'Save Verified Encounter'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
