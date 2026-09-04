// src/components/clinician/EyeCareAndTeethModal.tsx
// Child Eye Care Assessment (MOH p.25) & Tooth Eruption Chart (MOH p.26)

import React, { useState } from 'react';
import { Eye, Smile, X, AlertTriangle, Check, ShieldCheck, Sparkles } from 'lucide-react';
import { EyeCareAssessment, ToothEruptionRecord, ToothType, ToothStatus } from '../../types';
import Button from '../Button';
import { auth } from '../../lib/firebase';

interface EyeCareAndTeethModalProps {
  isOpen?: boolean;
  motherId: string;
  childId: string;
  childName?: string;
  initialEyeCare?: EyeCareAssessment[];
  initialTeeth?: ToothEruptionRecord | null;
  onClose: () => void;
  onSaved: () => void;
}

const TOOTH_DEFINITIONS: { type: ToothType; label: string; arch: 'upper' | 'lower'; typicalMonths: string }[] = [
  // Upper arch
  { type: 'upper_central_incisor', label: 'Central Incisor', arch: 'upper', typicalMonths: '8–12 mos' },
  { type: 'upper_lateral_incisor', label: 'Lateral Incisor', arch: 'upper', typicalMonths: '9–13 mos' },
  { type: 'upper_canine', label: 'Canine (Cuspid)', arch: 'upper', typicalMonths: '16–22 mos' },
  { type: 'upper_first_molar', label: 'First Molar', arch: 'upper', typicalMonths: '13–19 mos' },
  { type: 'upper_second_molar', label: 'Second Molar', arch: 'upper', typicalMonths: '25–33 mos' },

  // Lower arch
  { type: 'lower_central_incisor', label: 'Central Incisor', arch: 'lower', typicalMonths: '6–10 mos' },
  { type: 'lower_lateral_incisor', label: 'Lateral Incisor', arch: 'lower', typicalMonths: '10–16 mos' },
  { type: 'lower_canine', label: 'Canine (Cuspid)', arch: 'lower', typicalMonths: '17–23 mos' },
  { type: 'lower_first_molar', label: 'First Molar', arch: 'lower', typicalMonths: '14–18 mos' },
  { type: 'lower_second_molar', label: 'Second Molar', arch: 'lower', typicalMonths: '23–31 mos' },
];

export const EyeCareAndTeethModal: React.FC<EyeCareAndTeethModalProps> = ({
  isOpen = true,
  motherId,
  childId,
  childName = 'Child',
  onClose,
  onSaved,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'eyeCare' | 'teeth'>('eyeCare');

  // Eye Care form states (MOH p.25)
  const [ageStage, setAgeStage] = useState<'birth' | '6_weeks' | '6_months' | '1_year' | '2_years'>('birth');
  const [eyeDate, setEyeDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [teoGivenAtBirth, setTeoGivenAtBirth] = useState(true);
  const [pupil, setPupil] = useState<'black' | 'white'>('black');
  const [sightFollowing, setSightFollowing] = useState<'present' | 'absent'>('present');
  const [squint, setSquint] = useState<'absent' | 'present'>('absent');
  const [otherProblems, setOtherProblems] = useState('');
  const [eyeNotes, setEyeNotes] = useState('');

  // Teeth form states (MOH p.26)
  const [teethState, setTeethState] = useState<Record<ToothType, { status: ToothStatus; dateErupted?: string }>>(() => {
    const initial: any = {};
    TOOTH_DEFINITIONS.forEach(t => {
      initial[t.type] = { status: 'not_erupted' };
    });
    return initial;
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isWhitePupil = pupil === 'white';
  const hasEyeAlert = isWhitePupil || sightFollowing === 'absent' || squint === 'present';

  const updateTooth = (type: ToothType, status: ToothStatus) => {
    setTeethState(prev => ({
      ...prev,
      [type]: {
        status,
        dateErupted: status === 'fully_erupted' || status === 'erupting'
          ? (prev[type]?.dateErupted || new Date().toISOString().split('T')[0])
          : undefined,
      }
    }));
  };

  const handleSaveEyeCare = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    const payload = {
      type: 'eyecare',
      motherId,
      childId,
      ageStage,
      date: eyeDate,
      teoGivenAtBirth,
      pupil,
      sightFollowing,
      squint,
      otherProblems: otherProblems.trim() || undefined,
      notes: eyeNotes.trim() || undefined,
    };

    try {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/clinician/encounters/eye-care', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Server error: ${res.status}`);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record Eye Care assessment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveTeeth = async () => {
    setSubmitting(true);
    setErrorMessage(null);

    const teethArray = Object.entries(teethState).map(([toothType, val]) => ({
      toothType: toothType as ToothType,
      status: val.status,
      dateErupted: val.dateErupted,
    }));

    const payload = {
      type: 'tootheruption',
      motherId,
      childId,
      teeth: teethArray,
    };

    try {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/clinician/encounters/tooth-eruption', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Server error: ${res.status}`);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record Tooth Eruption chart.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
      <div className="bg-white rounded-[24px] max-w-2xl w-full p-6 shadow-2xl border border-[var(--border-hairline)] my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center">
              {activeTab === 'eyeCare' ? <Eye className="w-5 h-5" /> : <Smile className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-gray-900">
                {activeTab === 'eyeCare' ? 'Eye Care Assessment' : 'Tooth Eruption & Development Chart'}
              </h3>
              <p className="text-xs text-gray-500">
                Kenya MOH 216 Handbook pp.25, 26 · Patient: <strong>{childName}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-gray-200 mt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('eyeCare')}
            className={`pb-2.5 px-3 text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 ${
              activeTab === 'eyeCare'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Eye Care (p.25)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('teeth')}
            className={`pb-2.5 px-3 text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 ${
              activeTab === 'teeth'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            Teeth Development (p.26)
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            {errorMessage}
          </div>
        )}

        {activeTab === 'eyeCare' ? (
          <form onSubmit={handleSaveEyeCare} className="mt-4 space-y-4">
            {/* White pupil danger warning */}
            {isWhitePupil && (
              <div className="p-3.5 bg-red-50 border-2 border-red-400 rounded-xl text-xs text-red-900 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
                <div>
                  <p className="font-bold">CRITICAL CLINICAL ALERT: White Pupil (Leukocoria)</p>
                  <p className="mt-0.5 text-red-800 leading-relaxed">
                    A white reflex or white pupil is an urgent danger sign for congenital cataract or retinoblastoma. Immediate referral to an ophthalmology specialist is required under MOH clinical guidelines.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Assessment Age Stage</label>
                <select
                  value={ageStage}
                  onChange={(e) => setAgeStage(e.target.value as any)}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="birth">At Birth (within 48h)</option>
                  <option value="6_weeks">6 Weeks</option>
                  <option value="6_months">6 Months</option>
                  <option value="1_year">1 Year</option>
                  <option value="2_years">2 Years</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Date of Assessment</label>
                <input
                  type="date"
                  value={eyeDate}
                  onChange={(e) => setEyeDate(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">TEO at Birth</label>
                <div className="flex items-center h-[38px]">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={teoGivenAtBirth}
                      onChange={(e) => setTeoGivenAtBirth(e.target.checked)}
                      className="rounded text-teal-600"
                    />
                    <span>Tetracycline Eye Ointment Given</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <h4 className="text-xs font-bold text-gray-900">Clinical Eye Examination (MOH Checklist)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Pupil Color</label>
                  <select
                    value={pupil}
                    onChange={(e) => setPupil(e.target.value as any)}
                    className={`w-full text-xs p-2.5 border rounded-lg font-bold ${
                      pupil === 'white' ? 'border-red-400 bg-red-50 text-red-800' : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="black">Black (Normal)</option>
                    <option value="white">White (Abnormal / Urgent!)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Sight Following</label>
                  <select
                    value={sightFollowing}
                    onChange={(e) => setSightFollowing(e.target.value as any)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="present">Present (Normal fix & follow)</option>
                    <option value="absent">Absent (Does not follow light/object)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Squint (Strabismus)</label>
                  <select
                    value={squint}
                    onChange={(e) => setSquint(e.target.value as any)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="absent">Absent (Normal alignment)</option>
                    <option value="present">Present (Inward/outward deviation)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Other Eye Problems / Discharge</label>
                <input
                  type="text"
                  placeholder="e.g. Purulent discharge, excessive tearing, redness"
                  value={otherProblems}
                  onChange={(e) => setOtherProblems(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Clinical Action & Advice</label>
                <input
                  type="text"
                  placeholder="e.g. Cleansing advice given, referral letter provided"
                  value={eyeNotes}
                  onChange={(e) => setEyeNotes(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={onClose} className="text-xs">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
                className="text-xs bg-teal-600 hover:bg-teal-700 text-white"
              >
                {submitting ? 'Saving...' : 'Record Eye Care Assessment'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-start gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-teal-600 mt-0.5" />
              <span>
                Track primary dentition development across the upper and lower arches as documented in Kenya MOH 216 Handbook page 26.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1">
              {/* Upper Arch */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2.5">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider pb-1 border-b border-gray-200">
                  Upper Arch (Maxillary)
                </h4>
                {TOOTH_DEFINITIONS.filter(t => t.arch === 'upper').map(t => {
                  const curr = teethState[t.type];
                  return (
                    <div key={t.type} className="bg-white p-2.5 rounded-lg border border-gray-200 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-gray-900">{t.label}</p>
                        <p className="text-[10px] text-gray-500">Expected: {t.typicalMonths}</p>
                      </div>
                      <select
                        value={curr.status}
                        onChange={(e) => updateTooth(t.type, e.target.value as ToothStatus)}
                        className={`text-xs p-1.5 border rounded-md font-medium ${
                          curr.status === 'fully_erupted'
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                            : curr.status === 'erupting'
                            ? 'bg-amber-50 border-amber-400 text-amber-800'
                            : 'bg-white border-gray-300 text-gray-600'
                        }`}
                      >
                        <option value="not_erupted">Not Erupted</option>
                        <option value="erupting">Erupting</option>
                        <option value="fully_erupted">Fully Erupted</option>
                        <option value="shed_carious">Shed / Treated</option>
                      </select>
                    </div>
                  );
                })}
              </div>

              {/* Lower Arch */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2.5">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider pb-1 border-b border-gray-200">
                  Lower Arch (Mandibular)
                </h4>
                {TOOTH_DEFINITIONS.filter(t => t.arch === 'lower').map(t => {
                  const curr = teethState[t.type];
                  return (
                    <div key={t.type} className="bg-white p-2.5 rounded-lg border border-gray-200 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-gray-900">{t.label}</p>
                        <p className="text-[10px] text-gray-500">Expected: {t.typicalMonths}</p>
                      </div>
                      <select
                        value={curr.status}
                        onChange={(e) => updateTooth(t.type, e.target.value as ToothStatus)}
                        className={`text-xs p-1.5 border rounded-md font-medium ${
                          curr.status === 'fully_erupted'
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                            : curr.status === 'erupting'
                            ? 'bg-amber-50 border-amber-400 text-amber-800'
                            : 'bg-white border-gray-300 text-gray-600'
                        }`}
                      >
                        <option value="not_erupted">Not Erupted</option>
                        <option value="erupting">Erupting</option>
                        <option value="fully_erupted">Fully Erupted</option>
                        <option value="shed_carious">Shed / Treated</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={onClose} className="text-xs">
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSaveTeeth}
                disabled={submitting}
                className="text-xs bg-teal-600 hover:bg-teal-700 text-white"
              >
                {submitting ? 'Saving...' : 'Update Tooth Development Chart'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default EyeCareAndTeethModal;
