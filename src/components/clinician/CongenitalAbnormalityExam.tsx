// src/components/clinician/CongenitalAbnormalityExam.tsx
// Early Identification of Congenital Abnormalities Examination Form
// Conforms strictly to Kenya Ministry of Health Mother-Child Health Handbook (MOH 216) p. 17

import React, { useState } from 'react';
import { Stethoscope, AlertTriangle, CheckCircle, ShieldAlert, X, ChevronRight } from 'lucide-react';
import { CongenitalExamRecord } from '../../types';

interface CongenitalAbnormalityExamProps {
  motherId: string;
  childId: string;
  childName?: string;
  clinicianName?: string;
  facilityName?: string;
  initialWindow?: 'within48h' | 'at6weeks';
  onClose?: () => void;
  onSaved?: (exam: CongenitalExamRecord) => void;
}

export const CongenitalAbnormalityExam: React.FC<CongenitalAbnormalityExamProps> = ({
  motherId,
  childId,
  childName = 'Infant',
  clinicianName = '',
  facilityName: defaultFacilityName = '',
  initialWindow = 'within48h',
  onClose,
  onSaved,
}) => {
  const [examWindow, setExamWindow] = useState<'within48h' | 'at6weeks'>(initialWindow);
  const [examDate, setExamDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [examinerName, setExaminerName] = useState(clinicianName);
  const [facilityName, setFacilityName] = useState(defaultFacilityName);

  // Body systems
  const [headSize, setHeadSize] = useState<'normal' | 'microcephalic' | 'hydrocephalic'>('normal');
  const [headSizeDetails, setHeadSizeDetails] = useState('');

  const [mouthGums, setMouthGums] = useState<'normal' | 'cleft_lip' | 'cleft_palate' | 'abnormal'>('normal');
  const [mouthGumsDetails, setMouthGumsDetails] = useState('');

  const [ears, setEars] = useState<'normal' | 'abnormal'>('normal');
  const [earsDetails, setEarsDetails] = useState('');

  const [armsLegs, setArmsLegs] = useState<'normal' | 'abnormal'>('normal');
  const [armsLegsDetails, setArmsLegsDetails] = useState('');

  const [spineNeckBack, setSpineNeckBack] = useState<'normal' | 'abnormal'>('normal');
  const [spineNeckBackDetails, setSpineNeckBackDetails] = useState('');

  const [bodyMovement, setBodyMovement] = useState<'normal' | 'abnormal'>('normal');
  const [bodyMovementDetails, setBodyMovementDetails] = useState('');
  const [cerebralPalsyRisk, setCerebralPalsyRisk] = useState(false);

  const [abdominalWall, setAbdominalWall] = useState<'normal' | 'abnormal'>('normal');
  const [abdominalWallDetails, setAbdominalWallDetails] = useState('');

  const [genitalia, setGenitalia] = useState<'normal' | 'abnormal'>('normal');
  const [genitaliaDetails, setGenitaliaDetails] = useState('');

  const [anus, setAnus] = useState<'perforate' | 'imperforate' | 'abnormal'>('perforate');
  const [anusDetails, setAnusDetails] = useState('');

  const [referralOrActionTaken, setReferralOrActionTaken] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Compute abnormality live
  const hasAbnormalFindings =
    headSize !== 'normal' ||
    mouthGums !== 'normal' ||
    ears !== 'normal' ||
    armsLegs !== 'normal' ||
    spineNeckBack !== 'normal' ||
    bodyMovement !== 'normal' ||
    cerebralPalsyRisk ||
    abdominalWall !== 'normal' ||
    genitalia !== 'normal' ||
    anus !== 'perforate';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    const payload = {
      type: 'congenital',
      motherId,
      childId,
      examWindow,
      date: examDate,
      examinerName,
      facilityName,
      headSize,
      headSizeDetails: headSize !== 'normal' ? headSizeDetails : undefined,
      mouthGums,
      mouthGumsDetails: mouthGums !== 'normal' ? mouthGumsDetails : undefined,
      ears,
      earsDetails: ears !== 'normal' ? earsDetails : undefined,
      armsLegs,
      armsLegsDetails: armsLegs !== 'normal' ? armsLegsDetails : undefined,
      spineNeckBack,
      spineNeckBackDetails: spineNeckBack !== 'normal' ? spineNeckBackDetails : undefined,
      bodyMovement,
      bodyMovementDetails: bodyMovement !== 'normal' ? bodyMovementDetails : undefined,
      cerebralPalsyRisk,
      abdominalWall,
      abdominalWallDetails: abdominalWall !== 'normal' ? abdominalWallDetails : undefined,
      genitalia,
      genitaliaDetails: genitalia !== 'normal' ? genitaliaDetails : undefined,
      anus,
      anusDetails: anus !== 'perforate' ? anusDetails : undefined,
      referralOrActionTaken: hasAbnormalFindings ? referralOrActionTaken : undefined,
      notes,
    };

    try {
      const res = await fetch('/api/v1/clinician/encounters/congenital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Server error: ${res.status}`);
      }

      const result = await res.json();
      const savedRecord: CongenitalExamRecord = {
        id: result.id,
        motherId,
        childId,
        examWindow,
        date: examDate,
        examinerName,
        facilityName,
        headSize,
        headSizeDetails,
        mouthGums,
        mouthGumsDetails,
        ears,
        earsDetails,
        armsLegs,
        armsLegsDetails,
        spineNeckBack,
        spineNeckBackDetails,
        bodyMovement,
        bodyMovementDetails,
        cerebralPalsyRisk,
        abdominalWall,
        abdominalWallDetails,
        genitalia,
        genitaliaDetails,
        anus,
        anusDetails,
        hasAbnormality: result.hasAbnormality,
        abnormalFindingsList: result.abnormalFindingsList,
        referralOrActionTaken,
        notes,
        provenance: {
          status: 'VERIFIED',
          enteredBy: examinerName || clinicianName || 'Clinician',
          enteredAt: new Date().toISOString(),
          verifiedBy: examinerName || clinicianName || 'Clinician',
          verifiedAt: new Date().toISOString(),
        },
      };

      onSaved?.(savedRecord);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit exam');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-white shadow-xs">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Early Congenital Abnormality Exam
              </h2>
              <p className="text-xs text-slate-500">
                Kenya MOH Handbook p.17 • {childName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200 flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Exam Timing & Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Handbook Exam Window *
              </label>
              <select
                value={examWindow}
                onChange={(e) => setExamWindow(e.target.value as 'within48h' | 'at6weeks')}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-500 focus:outline-hidden"
              >
                <option value="within48h">Within 48 Hours of Birth</option>
                <option value="at6weeks">At 6 Weeks Postnatal Check</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Exam Date *
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                required
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-500 focus:outline-hidden"
              >
              </input>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Examiner / Clinician
              </label>
              <input
                type="text"
                placeholder="Dr. / Nurse / Midwife"
                value={examinerName}
                onChange={(e) => setExaminerName(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-500 focus:outline-hidden"
              >
              </input>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
              <span>Body Systems Assessment</span>
              <span className="text-xs font-normal text-slate-500">Check all systems per handbook</span>
            </h3>

            {/* 1. Head Size */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">1. Head Size & Fontanelle</span>
                <div className="flex space-x-2">
                  {(['normal', 'microcephalic', 'hydrocephalic'] as const).map((status) => (
                    <label
                      key={status}
                      className={`cursor-pointer px-2.5 py-1 text-xs rounded-md border transition capitalize ${
                        headSize === status
                          ? status === 'normal'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold'
                            : 'bg-red-100 text-red-800 border-red-300 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="headSize"
                        value={status}
                        checked={headSize === status}
                        onChange={() => setHeadSize(status)}
                        className="sr-only"
                      />
                      {status}
                    </label>
                  ))}
                </div>
              </div>
              {headSize !== 'normal' && (
                <input
                  type="text"
                  placeholder="Specify head circumference or fontanelle abnormality..."
                  value={headSizeDetails}
                  onChange={(e) => setHeadSizeDetails(e.target.value)}
                  className="w-full text-xs rounded-md border border-red-300 bg-red-50/50 px-3 py-1.5 focus:outline-hidden focus:border-red-500"
                />
              )}
            </div>

            {/* 2. Mouth & Gums */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">2. Mouth & Gums</span>
                <div className="flex space-x-2">
                  {[
                    { val: 'normal', label: 'Normal' },
                    { val: 'cleft_lip', label: 'Cleft Lip' },
                    { val: 'cleft_palate', label: 'Cleft Palate' },
                    { val: 'abnormal', label: 'Other' },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      className={`cursor-pointer px-2.5 py-1 text-xs rounded-md border transition ${
                        mouthGums === opt.val
                          ? opt.val === 'normal'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold'
                            : 'bg-red-100 text-red-800 border-red-300 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="mouthGums"
                        value={opt.val}
                        checked={mouthGums === opt.val}
                        onChange={() => setMouthGums(opt.val as any)}
                        className="sr-only"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
              {mouthGums !== 'normal' && (
                <input
                  type="text"
                  placeholder="Specify palate defect, feeding difficulty, or oral anomaly..."
                  value={mouthGumsDetails}
                  onChange={(e) => setMouthGumsDetails(e.target.value)}
                  className="w-full text-xs rounded-md border border-red-300 bg-red-50/50 px-3 py-1.5 focus:outline-hidden focus:border-red-500"
                />
              )}
            </div>

            {/* 3. Ears */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">3. Ears</span>
                <div className="flex space-x-2">
                  {(['normal', 'abnormal'] as const).map((status) => (
                    <label
                      key={status}
                      className={`cursor-pointer px-2.5 py-1 text-xs rounded-md border transition capitalize ${
                        ears === status
                          ? status === 'normal'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold'
                            : 'bg-red-100 text-red-800 border-red-300 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="ears"
                        value={status}
                        checked={ears === status}
                        onChange={() => setEars(status)}
                        className="sr-only"
                      />
                      {status}
                    </label>
                  ))}
                </div>
              </div>
              {ears !== 'normal' && (
                <input
                  type="text"
                  placeholder="Specify ear position, tags, pits, or deformity..."
                  value={earsDetails}
                  onChange={(e) => setEarsDetails(e.target.value)}
                  className="w-full text-xs rounded-md border border-red-300 bg-red-50/50 px-3 py-1.5 focus:outline-hidden focus:border-red-500"
                />
              )}
            </div>

            {/* 4. Arms & Legs */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-slate-800">4. Arms & Legs</span>
                  <p className="text-[11px] text-slate-500">Tone, joints, digits, club foot (talipes), hip dislocation</p>
                </div>
                <div className="flex space-x-2">
                  {(['normal', 'abnormal'] as const).map((status) => (
                    <label
                      key={status}
                      className={`cursor-pointer px-2.5 py-1 text-xs rounded-md border transition capitalize ${
                        armsLegs === status
                          ? status === 'normal'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold'
                            : 'bg-red-100 text-red-800 border-red-300 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="armsLegs"
                        value={status}
                        checked={armsLegs === status}
                        onChange={() => setArmsLegs(status)}
                        className="sr-only"
                      />
                      {status}
                    </label>
                  ))}
                </div>
              </div>
              {armsLegs !== 'normal' && (
                <input
                  type="text"
                  placeholder="Specify club foot, polydactyly, syndactyly, hip click (Ortolani/Barlow)..."
                  value={armsLegsDetails}
                  onChange={(e) => setArmsLegsDetails(e.target.value)}
                  className="w-full text-xs rounded-md border border-red-300 bg-red-50/50 px-3 py-1.5 focus:outline-hidden focus:border-red-500"
                />
              )}
            </div>

            {/* 5. Spine, Neck & Back */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">5. Spine, Neck & Back</span>
                <div className="flex space-x-2">
                  {(['normal', 'abnormal'] as const).map((status) => (
                    <label
                      key={status}
                      className={`cursor-pointer px-2.5 py-1 text-xs rounded-md border transition capitalize ${
                        spineNeckBack === status
                          ? status === 'normal'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold'
                            : 'bg-red-100 text-red-800 border-red-300 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="spineNeckBack"
                        value={status}
                        checked={spineNeckBack === status}
                        onChange={() => setSpineNeckBack(status)}
                        className="sr-only"
                      />
                      {status}
                    </label>
                  ))}
                </div>
              </div>
              {spineNeckBack !== 'normal' && (
                <input
                  type="text"
                  placeholder="Specify spina bifida, sacral dimple, meningomyelocele, or torticollis..."
                  value={spineNeckBackDetails}
                  onChange={(e) => setSpineNeckBackDetails(e.target.value)}
                  className="w-full text-xs rounded-md border border-red-300 bg-red-50/50 px-3 py-1.5 focus:outline-hidden focus:border-red-500"
                />
              )}
            </div>

            {/* 6. Body Movement & Tone */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-slate-800">6. Body Movement & Tone</span>
                  <p className="text-[11px] text-slate-500">Floppiness / hypertonia / asymmetry</p>
                </div>
                <div className="flex space-x-2">
                  {(['normal', 'abnormal'] as const).map((status) => (
                    <label
                      key={status}
                      className={`cursor-pointer px-2.5 py-1 text-xs rounded-md border transition capitalize ${
                        bodyMovement === status
                          ? status === 'normal'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold'
                            : 'bg-red-100 text-red-800 border-red-300 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="bodyMovement"
                        value={status}
                        checked={bodyMovement === status}
                        onChange={() => setBodyMovement(status)}
                        className="sr-only"
                      />
                      {status}
                    </label>
                  ))}
                </div>
              </div>
              {bodyMovement !== 'normal' && (
                <input
                  type="text"
                  placeholder="Describe abnormal posture, asymmetrical Moro reflex, or tremors..."
                  value={bodyMovementDetails}
                  onChange={(e) => setBodyMovementDetails(e.target.value)}
                  className="w-full text-xs rounded-md border border-red-300 bg-red-50/50 px-3 py-1.5 focus:outline-hidden focus:border-red-500"
                />
              )}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="cpFlag"
                  checked={cerebralPalsyRisk}
                  onChange={(e) => setCerebralPalsyRisk(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="cpFlag" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Flag as Cerebral Palsy Risk / Neonatal Encephalopathy / Persistent hypotonia
                </label>
              </div>
            </div>

            {/* 7. Abdominal Wall */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">7. Abdominal Wall & Umbilicus</span>
                <div className="flex space-x-2">
                  {(['normal', 'abnormal'] as const).map((status) => (
                    <label
                      key={status}
                      className={`cursor-pointer px-2.5 py-1 text-xs rounded-md border transition capitalize ${
                        abdominalWall === status
                          ? status === 'normal'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold'
                            : 'bg-red-100 text-red-800 border-red-300 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="abdominalWall"
                        value={status}
                        checked={abdominalWall === status}
                        onChange={() => setAbdominalWall(status)}
                        className="sr-only"
                      />
                      {status}
                    </label>
                  ))}
                </div>
              </div>
              {abdominalWall !== 'normal' && (
                <input
                  type="text"
                  placeholder="Specify omphalocele, gastroschisis, or large hernia..."
                  value={abdominalWallDetails}
                  onChange={(e) => setAbdominalWallDetails(e.target.value)}
                  className="w-full text-xs rounded-md border border-red-300 bg-red-50/50 px-3 py-1.5 focus:outline-hidden focus:border-red-500"
                />
              )}
            </div>

            {/* 8. Genitalia */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">8. Genitalia</span>
                <div className="flex space-x-2">
                  {(['normal', 'abnormal'] as const).map((status) => (
                    <label
                      key={status}
                      className={`cursor-pointer px-2.5 py-1 text-xs rounded-md border transition capitalize ${
                        genitalia === status
                          ? status === 'normal'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold'
                            : 'bg-red-100 text-red-800 border-red-300 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="genitalia"
                        value={status}
                        checked={genitalia === status}
                        onChange={() => setGenitalia(status)}
                        className="sr-only"
                      />
                      {status}
                    </label>
                  ))}
                </div>
              </div>
              {genitalia !== 'normal' && (
                <input
                  type="text"
                  placeholder="Specify ambiguous genitalia, undescended testes, or hypospadias..."
                  value={genitaliaDetails}
                  onChange={(e) => setGenitaliaDetails(e.target.value)}
                  className="w-full text-xs rounded-md border border-red-300 bg-red-50/50 px-3 py-1.5 focus:outline-hidden focus:border-red-500"
                />
              )}
            </div>

            {/* 9. Anus */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">9. Anus</span>
                <div className="flex space-x-2">
                  {[
                    { val: 'perforate', label: 'Perforate (Normal)' },
                    { val: 'imperforate', label: 'Imperforate' },
                    { val: 'abnormal', label: 'Other Defect' },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      className={`cursor-pointer px-2.5 py-1 text-xs rounded-md border transition ${
                        anus === opt.val
                          ? opt.val === 'perforate'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold'
                            : 'bg-red-100 text-red-800 border-red-300 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="anus"
                        value={opt.val}
                        checked={anus === opt.val}
                        onChange={() => setAnus(opt.val as any)}
                        className="sr-only"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
              {anus !== 'perforate' && (
                <input
                  type="text"
                  placeholder="Specify imperforate anus, fistula, or meconium passage delay..."
                  value={anusDetails}
                  onChange={(e) => setAnusDetails(e.target.value)}
                  className="w-full text-xs rounded-md border border-red-300 bg-red-50/50 px-3 py-1.5 focus:outline-hidden focus:border-red-500"
                />
              )}
            </div>
          </div>

          {/* Abnormality / Action Taken Summary Banner */}
          {hasAbnormalFindings && (
            <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4 space-y-3">
              <div className="flex items-center space-x-2 text-red-800 font-bold text-sm">
                <ShieldAlert className="h-5 w-5 text-red-600" />
                <span>Abnormal Findings Identified — Referral / Action Plan Required</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-red-900 mb-1">
                  Referral or Clinical Action Taken (Handbook p.17) *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Document referral facility, pediatric surgical consult, early intervention clinic, or ultrasound ordered..."
                  value={referralOrActionTaken}
                  onChange={(e) => setReferralOrActionTaken(e.target.value)}
                  className="w-full text-xs rounded-md border border-red-300 bg-white p-2 text-slate-900 focus:outline-hidden focus:border-red-500"
                />
              </div>
            </div>
          )}

          {/* General Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              General Clinical Notes & Caregiver Guidance
            </label>
            <textarea
              rows={2}
              placeholder="Additional findings, counseling provided to mother/caregiver..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs rounded-md border border-slate-300 bg-white p-2 text-slate-800 focus:border-teal-500 focus:outline-hidden"
            />
          </div>

          {/* Footer Action */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white shadow-xs transition ${
                hasAbnormalFindings
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-teal-600 hover:bg-teal-700'
              } disabled:opacity-50`}
            >
              {submitting ? (
                <span>Saving Examination...</span>
              ) : (
                <>
                  <span>Save Clinical Exam</span>
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
