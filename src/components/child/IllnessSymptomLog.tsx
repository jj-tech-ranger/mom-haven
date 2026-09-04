import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  AlertOctagon, 
  Thermometer, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  PhoneCall, 
  X,
  Info
} from 'lucide-react';
import { IllnessRecord, Provenance } from '../../types';
import { getIllnessRecords, addIllnessRecord } from '../../services/childService';
import ProvenanceBadge from '../common/ProvenanceBadge';
import Button from '../Button';

interface IllnessSymptomLogProps {
  childId: string;
  childName: string;
  userId: string;
  onBack: () => void;
  onTriggerEmergency: () => void;
}

const IMCI_DANGER_SIGNS = [
  'Inability to breastfeed or drink liquids',
  'Vomiting everything consumed',
  'Convulsions / Fits during current illness',
  'Lethargy, unconsciousness, or unusually difficult to wake',
  'Chest indrawing or stridor while calm (Difficulty breathing)',
  'High fever > 38.5°C persisting for > 2 days',
];

export default function IllnessSymptomLog({
  childId,
  childName,
  userId,
  onBack,
  onTriggerEmergency,
}: IllnessSymptomLogProps) {
  const [logs, setLogs] = useState<IllnessRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [symptomFever, setSymptomFever] = useState(false);
  const [symptomCough, setSymptomCough] = useState(false);
  const [symptomDiarrhea, setSymptomDiarrhea] = useState(false);
  const [symptomVomiting, setSymptomVomiting] = useState(false);
  const [temperature, setTemperature] = useState('');
  const [durationDays, setDurationDays] = useState(1);
  const [selectedDangerSigns, setSelectedDangerSigns] = useState<string[]>([]);
  const [careAction, setCareAction] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const records = await getIllnessRecords(childId);
      setLogs(records);
    } catch (err) {
      console.warn('Could not fetch illness records', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [childId]);

  const toggleDangerSign = (sign: string) => {
    setSelectedDangerSigns(prev =>
      prev.includes(sign) ? prev.filter(s => s !== sign) : [...prev, sign]
    );
  };

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const symptoms: string[] = [];
    if (symptomFever) symptoms.push(`Fever (${temperature ? `${temperature}°C` : 'Elevated'})`);
    if (symptomCough) symptoms.push('Cough / Fast breathing');
    if (symptomDiarrhea) symptoms.push('Diarrhea / Loose stools');
    if (symptomVomiting) symptoms.push('Vomiting');

    const newRecord: Omit<IllnessRecord, 'id'> = {
      childId,
      date: new Date().toISOString().split('T')[0],
      symptoms: symptoms.length ? symptoms : ['General malaise'],
      temperatureCelsius: symptomFever && temperature ? parseFloat(temperature) : undefined,
      durationDays: Number(durationDays),
      hasDangerSigns: selectedDangerSigns.length > 0,
      dangerSigns: selectedDangerSigns,
      careActionTaken: careAction.trim() || undefined,
      provenance: {
        status: 'REPORTED',
        enteredBy: userId,
        enteredAt: new Date().toISOString(),
      },
    };

    try {
      await addIllnessRecord(childId, newRecord);
      await loadLogs();
      setIsAdding(false);

      if (selectedDangerSigns.length > 0) {
        onTriggerEmergency();
      }
    } catch (err) {
      console.error('Failed to save illness log', err);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--lavender-50)] pb-28">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 bg-white border-b border-[var(--border-hairline)] sticky top-0 z-10 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-[var(--lavender-50)] flex items-center justify-center text-[var(--ink-900)] cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h1 className="font-display font-extrabold text-[17px] text-[var(--ink-900)]">
            Illness &amp; IMCI Log
          </h1>
          <span className="text-[11px] font-semibold text-[var(--haven-orchid)]">
            {childName} · Child Health
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="w-10 h-10 rounded-full bg-[var(--haven-deep)] text-white flex items-center justify-center shadow-xs cursor-pointer hover:opacity-90"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 sm:p-6 space-y-4 max-w-lg mx-auto">
        {/* IMCI Danger Sign Alert Banner */}
        <div className="p-4 rounded-[22px] bg-red-50 border border-red-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-[#E11D3C] font-display font-bold text-[14px]">
            <AlertOctagon className="w-5 h-5 shrink-0" />
            <span>General IMCI Danger Signs (Seek Care Now)</span>
          </div>
          <p className="text-[12px] text-red-800 font-body leading-relaxed">
            If your child cannot feed, vomits everything, has convulsions, or appears abnormally sleepy/lethargic, take them to the nearest health facility immediately.
          </p>
          <button
            type="button"
            onClick={onTriggerEmergency}
            className="px-3.5 py-1.5 rounded-full bg-[#E11D3C] text-white font-display font-bold text-[12px] flex items-center gap-1.5 cursor-pointer shadow-xs hover:bg-red-700"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Emergency Action Protocol</span>
          </button>
        </div>

        {/* Logs List */}
        <div className="space-y-3">
          <h3 className="font-display font-bold text-[16px] text-[var(--ink-900)] px-1">
            Recorded Episodes
          </h3>

          {logs.map(item => (
            <div
              key={item.id}
              className={`p-4 rounded-[20px] border shadow-card-1 space-y-2.5 bg-white ${
                item.hasDangerSigns ? 'border-red-300 ring-2 ring-red-100' : 'border-[var(--border-hairline)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-[14px] text-[var(--ink-900)] flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[var(--haven-orchid)]" />
                  {new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <ProvenanceBadge provenance={item.provenance} />
              </div>

              {/* Symptoms Pills */}
              <div className="flex flex-wrap gap-1.5">
                {item.symptoms.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-full bg-[var(--lavender-100)] text-[var(--haven-deep)] text-[11px] font-semibold"
                  >
                    {s}
                  </span>
                ))}
                {item.durationDays && (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px]">
                    {item.durationDays} day(s) duration
                  </span>
                )}
              </div>

              {item.dangerSigns && item.dangerSigns.length > 0 && (
                <div className="p-2.5 rounded-[12px] bg-red-50 text-red-800 text-[12px] font-medium border border-red-200">
                  ⚠️ Danger sign reported: {item.dangerSigns.join(', ')}
                </div>
              )}

              {item.careActionTaken && (
                <p className="text-[12px] text-[var(--ink-700)] bg-[var(--lavender-50)] p-2.5 rounded-[12px] font-body">
                  <strong>Action:</strong> {item.careActionTaken}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="pt-2">
          <Button
            variant="primary"
            onClick={() => setIsAdding(true)}
            className="w-full py-3.5 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>+ Log New Illness or Symptom</span>
          </Button>
        </div>
      </div>

      {/* ================= ADD ILLNESS MODAL ================= */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-[28px] sm:rounded-[24px] w-full max-w-md p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
              <h2 className="font-display font-extrabold text-[18px] text-[var(--ink-900)]">
                Log Illness / Symptoms
              </h2>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="w-8 h-8 rounded-full bg-[var(--lavender-50)] flex items-center justify-center text-[var(--ink-600)] hover:text-[var(--ink-900)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-4 pt-4">
              <div>
                <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-2">
                  Select Observed Symptoms
                </label>
                <div className="grid grid-cols-2 gap-2 text-[12px]">
                  <label className="flex items-center gap-2 p-2.5 rounded-[12px] border border-[var(--border-hairline)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={symptomFever}
                      onChange={e => setSymptomFever(e.target.checked)}
                      className="rounded text-[var(--haven-deep)]"
                    />
                    <span>Fever / Hot body</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-[12px] border border-[var(--border-hairline)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={symptomCough}
                      onChange={e => setSymptomCough(e.target.checked)}
                      className="rounded text-[var(--haven-deep)]"
                    />
                    <span>Cough / Breathing fast</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-[12px] border border-[var(--border-hairline)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={symptomDiarrhea}
                      onChange={e => setSymptomDiarrhea(e.target.checked)}
                      className="rounded text-[var(--haven-deep)]"
                    />
                    <span>Diarrhea / Loose stool</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-[12px] border border-[var(--border-hairline)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={symptomVomiting}
                      onChange={e => setSymptomVomiting(e.target.checked)}
                      className="rounded text-[var(--haven-deep)]"
                    />
                    <span>Vomiting</span>
                  </label>
                </div>
              </div>

              {symptomFever && (
                <div>
                  <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
                    Recorded Body Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={temperature}
                    onChange={e => setTemperature(e.target.value)}
                    placeholder="38.0"
                    className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
                  />
                </div>
              )}

              <div>
                <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
                  Duration (Days)
                </label>
                <input
                  type="number"
                  value={durationDays}
                  onChange={e => setDurationDays(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
                />
              </div>

              {/* IMCI Danger Signs Checkbox Block */}
              <div className="p-3 bg-red-50 rounded-[16px] border border-red-200 space-y-2">
                <h4 className="font-display font-bold text-[12px] text-red-800 flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4" />
                  <span>Check any IMCI Danger Signs present:</span>
                </h4>
                <div className="space-y-1.5">
                  {IMCI_DANGER_SIGNS.map((sign, i) => (
                    <label key={i} className="flex items-start gap-2 text-[11px] text-red-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedDangerSigns.includes(sign)}
                        onChange={() => toggleDangerSign(sign)}
                        className="rounded text-red-600 mt-0.5"
                      />
                      <span>{sign}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
                  Home Care Action / Clinic Visit Notes
                </label>
                <textarea
                  rows={2}
                  value={careAction}
                  onChange={e => setCareAction(e.target.value)}
                  placeholder="e.g. Visited dispensary, prescribed Amoxicillin and Zinc..."
                  className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
                />
              </div>

              <Button type="submit" variant="primary" className="w-full py-3.5">
                Save Illness Record
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
