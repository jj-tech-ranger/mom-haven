import React, { useState, useEffect } from 'react';
import {
  X,
  Activity,
  Scale,
  Baby,
  AlertTriangle,
  Moon,
  Smile,
  Apple,
  Footprints,
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  PhoneCall,
  ShieldAlert,
  Info,
} from 'lucide-react';
import {
  DailyHealthLog,
  HealthLogType,
  BloodPressureValues,
  WeightValues,
  SymptomsValues,
  BabyMovementValues,
  SleepValues,
  MoodValues,
  NutritionValues,
  ActivityValues,
  GeneralNotesValues,
} from '../../types/healthLog';
import {
  MATERNAL_DANGER_SYMPTOMS,
  evaluateClinicalSafety,
  validateHealthLogValues,
  HealthLogValidationError,
} from '../../services/healthLogValidationService';
import { createHealthLog, updateHealthLog } from '../../services/healthLogService';

interface HealthLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  initialType?: HealthLogType;
  editingLog?: DailyHealthLog | null;
  onLogSaved?: (log: DailyHealthLog) => void;
  onTriggerEmergency?: () => void;
}

const LOG_TYPES_CONFIG: {
  id: HealthLogType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isClinical: boolean;
  desc: string;
}[] = [
  { id: 'blood_pressure', label: 'Blood Pressure', icon: Activity, isClinical: true, desc: 'Systolic & diastolic readings' },
  { id: 'weight', label: 'Weight', icon: Scale, isClinical: true, desc: 'Weight in kilograms' },
  { id: 'baby_movement', label: 'Baby Movement', icon: Baby, isClinical: true, desc: 'Fetal kicks & movement pattern' },
  { id: 'symptoms', label: 'Symptoms', icon: AlertTriangle, isClinical: true, desc: 'Check symptoms & warning signs' },
  { id: 'sleep', label: 'Sleep', icon: Moon, isClinical: false, desc: 'Rest & sleep quality' },
  { id: 'mood', label: 'Mood', icon: Smile, isClinical: false, desc: 'Emotional wellness' },
  { id: 'nutrition', label: 'Nutrition', icon: Apple, isClinical: false, desc: 'Hydration & meals' },
  { id: 'activity', label: 'Activity', icon: Footprints, isClinical: false, desc: 'Gentle exercise & walking' },
  { id: 'notes', label: 'Personal Note', icon: FileText, isClinical: false, desc: 'Journal entry or reflection' },
];

export const HealthLogModal: React.FC<HealthLogModalProps> = ({
  isOpen,
  onClose,
  userId,
  initialType = 'blood_pressure',
  editingLog,
  onLogSaved,
  onTriggerEmergency,
}) => {
  const [selectedType, setSelectedType] = useState<HealthLogType>(initialType);

  // Form states
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState<string>(() => new Date().toTimeString().slice(0, 5));
  const [notes, setNotes] = useState<string>('');
  const [sharedWithClinician, setSharedWithClinician] = useState<boolean>(false);

  // Specific value states
  // BP
  const [systolic, setSystolic] = useState<string>('120');
  const [diastolic, setDiastolic] = useState<string>('80');
  const [pulse, setPulse] = useState<string>('');
  const [arm, setArm] = useState<'left' | 'right'>('left');

  // Weight
  const [weightKg, setWeightKg] = useState<string>('65.0');

  // Baby movement
  const [movementPattern, setMovementPattern] = useState<'normal' | 'active' | 'decreased' | 'none_felt'>('normal');
  const [movementCount, setMovementCount] = useState<string>('10');
  const [movementDuration, setMovementDuration] = useState<string>('60');

  // Symptoms
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [symptomSeverity, setSymptomSeverity] = useState<'mild' | 'moderate' | 'severe'>('mild');

  // Sleep
  const [sleepHours, setSleepHours] = useState<string>('8.0');
  const [sleepQuality, setSleepQuality] = useState<'rested' | 'interrupted' | 'poor'>('rested');

  // Mood
  const [mood, setMood] = useState<'calm' | 'happy' | 'tired' | 'anxious' | 'sad' | 'overwhelmed'>('calm');
  const [energyLevel, setEnergyLevel] = useState<number>(3);

  // Nutrition
  const [hydrationGlasses, setHydrationGlasses] = useState<string>('8');
  const [appetite, setAppetite] = useState<'good' | 'fair' | 'poor'>('good');
  const [tookIfas, setTookIfas] = useState<boolean>(true);

  // Activity
  const [activeMinutes, setActiveMinutes] = useState<string>('20');
  const [activityType, setActivityType] = useState<'walking' | 'gentle_stretch' | 'daily_chores' | 'rest' | 'other'>('walking');

  // Notes
  const [noteText, setNoteText] = useState<string>('');

  // Status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Hydrate editing log or reset
  useEffect(() => {
    if (editingLog) {
      setSelectedType(editingLog.type);
      const d = new Date(editingLog.timestamp);
      setDate(d.toISOString().slice(0, 10));
      setTime(d.toTimeString().slice(0, 5));
      setNotes(editingLog.notes || '');
      setSharedWithClinician(Boolean(editingLog.sharedWithClinician));

      if (editingLog.type === 'blood_pressure') {
        const v = editingLog.values as BloodPressureValues;
        setSystolic(String(v.systolic));
        setDiastolic(String(v.diastolic));
        setPulse(v.pulse ? String(v.pulse) : '');
        setArm(v.arm || 'left');
      } else if (editingLog.type === 'weight') {
        const v = editingLog.values as WeightValues;
        setWeightKg(String(v.weightKg));
      } else if (editingLog.type === 'baby_movement') {
        const v = editingLog.values as BabyMovementValues;
        setMovementPattern(v.pattern);
        setMovementCount(v.movementCount !== undefined ? String(v.movementCount) : '');
        setMovementDuration(v.durationMinutes !== undefined ? String(v.durationMinutes) : '');
      } else if (editingLog.type === 'symptoms') {
        const v = editingLog.values as SymptomsValues;
        setSelectedSymptoms(v.symptoms || []);
        setSymptomSeverity(v.severity);
      } else if (editingLog.type === 'sleep') {
        const v = editingLog.values as SleepValues;
        setSleepHours(String(v.hours));
        setSleepQuality(v.quality);
      } else if (editingLog.type === 'mood') {
        const v = editingLog.values as MoodValues;
        setMood(v.mood);
        if (v.energyLevel) setEnergyLevel(v.energyLevel);
      } else if (editingLog.type === 'nutrition') {
        const v = editingLog.values as NutritionValues;
        setHydrationGlasses(v.hydrationGlasses !== undefined ? String(v.hydrationGlasses) : '');
        setAppetite(v.appetite);
        setTookIfas(v.tookIfas ?? true);
      } else if (editingLog.type === 'activity') {
        const v = editingLog.values as ActivityValues;
        setActiveMinutes(v.activeMinutes !== undefined ? String(v.activeMinutes) : '');
        setActivityType(v.activityType || 'walking');
      } else if (editingLog.type === 'notes') {
        const v = editingLog.values as GeneralNotesValues;
        setNoteText(v.text);
      }
    } else {
      setSelectedType(initialType);
    }
  }, [editingLog, initialType, isOpen]);

  if (!isOpen) return null;

  // Build current values object for live evaluation
  const buildCurrentValues = () => {
    switch (selectedType) {
      case 'blood_pressure':
        return {
          systolic: Number(systolic),
          diastolic: Number(diastolic),
          pulse: pulse ? Number(pulse) : undefined,
          arm,
        };
      case 'weight':
        return { weightKg: Number(weightKg) };
      case 'baby_movement':
        return {
          pattern: movementPattern,
          movementCount: movementCount ? Number(movementCount) : undefined,
          durationMinutes: movementDuration ? Number(movementDuration) : undefined,
        };
      case 'symptoms':
        return {
          symptoms: selectedSymptoms,
          severity: symptomSeverity,
          dangerSigns: selectedSymptoms.filter((s) => MATERNAL_DANGER_SYMPTOMS.some((m) => m.id === s)),
          hasDangerSigns: selectedSymptoms.some((s) => MATERNAL_DANGER_SYMPTOMS.some((m) => m.id === s)),
        };
      case 'sleep':
        return { hours: Number(sleepHours), quality: sleepQuality };
      case 'mood':
        return { mood, energyLevel };
      case 'nutrition':
        return {
          hydrationGlasses: hydrationGlasses ? Number(hydrationGlasses) : undefined,
          appetite,
          tookIfas,
        };
      case 'activity':
        return {
          activeMinutes: activeMinutes ? Number(activeMinutes) : undefined,
          activityType,
        };
      case 'notes':
        return { text: noteText };
    }
  };

  const safetyAlert = evaluateClinicalSafety(selectedType, buildCurrentValues() as any);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setIsSubmitting(true);

    try {
      const combinedDateTime = new Date(`${date}T${time}:00`).toISOString();
      const currentValues = buildCurrentValues();

      let savedLog: DailyHealthLog;
      if (editingLog) {
        savedLog = await updateHealthLog(userId, editingLog.id, {
          timestamp: combinedDateTime,
          values: currentValues,
          notes,
          sharedWithClinician,
        });
      } else {
        savedLog = await createHealthLog(userId, {
          timestamp: combinedDateTime,
          type: selectedType,
          values: currentValues,
          notes,
          sharedWithClinician,
        });
      }

      setSuccessToast('Health entry recorded successfully.');
      if (onLogSaved) onLogSaved(savedLog);

      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 600);
    } catch (err: any) {
      setIsSubmitting(false);
      if (err instanceof HealthLogValidationError) {
        setValidationError(err.message);
      } else {
        setValidationError(err?.message || 'Could not save health entry. Please check your values.');
      }
    }
  };

  const isClinicalType = LOG_TYPES_CONFIG.find((c) => c.id === selectedType)?.isClinical;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-lg max-h-[92vh] flex flex-col bg-white rounded-[24px] border border-[var(--border-hairline)] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[var(--border-hairline)] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--lavender-100)] flex items-center justify-center text-[var(--haven-deep)]">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-[17px] text-[var(--ink-900)]">
                {editingLog ? 'Edit Health Entry' : 'Log Health Check-in'}
              </h2>
              <p className="text-[11px] text-[var(--ink-500)] font-body">
                {isClinicalType ? 'Self-recorded clinical measurement' : 'Personal wellness reflection'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--ink-400)] hover:bg-[var(--lavender-100)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Toast / Success */}
          {successToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {/* Validation Error Banner */}
          {validationError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Log Type Selector (if not editing) */}
          {!editingLog && (
            <div>
              <label className="text-[12px] font-display font-bold text-[var(--ink-700)] block mb-2">
                Select Health Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                {LOG_TYPES_CONFIG.map((cfg) => {
                  const Icon = cfg.icon;
                  const isSelected = selectedType === cfg.id;
                  return (
                    <button
                      key={cfg.id}
                      type="button"
                      onClick={() => {
                        setSelectedType(cfg.id);
                        setValidationError(null);
                      }}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--lavender-50)] border-[var(--haven-orchid)] ring-2 ring-[var(--haven-orchid)]/20 text-[var(--haven-deep)]'
                          : 'bg-white border-[var(--border-hairline)] text-[var(--ink-700)] hover:bg-[var(--surface-2)]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-[var(--haven-deep)]' : 'text-[var(--ink-500)]'}`} />
                        {cfg.isClinical && (
                          <span className="text-[9px] font-semibold px-1 rounded bg-purple-100 text-purple-700">
                            Clinical
                          </span>
                        )}
                      </div>
                      <span className="font-display font-bold text-[12px] mt-1.5 truncate">{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Date and Time Selector */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-[var(--surface-2)] rounded-2xl border border-[var(--border-hairline)]">
            <div>
              <label className="text-[11px] font-display font-bold text-[var(--ink-600)] flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-[var(--haven-orchid)]" /> Date
              </label>
              <input
                type="date"
                value={date}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs font-body p-2 rounded-xl bg-white border border-[var(--border-hairline)] text-[var(--ink-900)] focus:ring-2 focus:ring-[var(--haven-orchid)] outline-hidden"
              />
            </div>
            <div>
              <label className="text-[11px] font-display font-bold text-[var(--ink-600)] flex items-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5 text-[var(--haven-orchid)]" /> Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-xs font-body p-2 rounded-xl bg-white border border-[var(--border-hairline)] text-[var(--ink-900)] focus:ring-2 focus:ring-[var(--haven-orchid)] outline-hidden"
              />
            </div>
          </div>

          {/* Dynamic Form Content by Type */}
          <div className="p-4 bg-white rounded-2xl border border-[var(--border-hairline)] space-y-4">
            {/* 1. BLOOD PRESSURE */}
            {selectedType === 'blood_pressure' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[13px] font-display font-bold text-[var(--ink-900)]">
                    Blood Pressure Measurement
                  </h3>
                  <span className="text-[11px] text-[var(--ink-500)] font-medium">Unit: mmHg</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[var(--ink-600)] font-semibold block mb-1">
                      Systolic (Upper)
                    </label>
                    <input
                      type="number"
                      min="70"
                      max="240"
                      value={systolic}
                      onChange={(e) => setSystolic(e.target.value)}
                      placeholder="e.g. 118"
                      className="w-full text-sm font-display font-bold p-2.5 rounded-xl border border-[var(--border-hairline)] text-[var(--ink-900)]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[var(--ink-600)] font-semibold block mb-1">
                      Diastolic (Lower)
                    </label>
                    <input
                      type="number"
                      min="40"
                      max="150"
                      value={diastolic}
                      onChange={(e) => setDiastolic(e.target.value)}
                      placeholder="e.g. 76"
                      className="w-full text-sm font-display font-bold p-2.5 rounded-xl border border-[var(--border-hairline)] text-[var(--ink-900)]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] text-[var(--ink-600)] font-semibold block mb-1">
                      Pulse (bpm, optional)
                    </label>
                    <input
                      type="number"
                      min="40"
                      max="220"
                      value={pulse}
                      onChange={(e) => setPulse(e.target.value)}
                      placeholder="e.g. 78"
                      className="w-full text-xs p-2 rounded-xl border border-[var(--border-hairline)] text-[var(--ink-900)]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[var(--ink-600)] font-semibold block mb-1">Arm</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setArm('left')}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold border ${
                          arm === 'left' ? 'bg-[var(--lavender-100)] border-[var(--haven-orchid)] text-[var(--haven-deep)]' : 'border-[var(--border-hairline)]'
                        }`}
                      >
                        Left
                      </button>
                      <button
                        type="button"
                        onClick={() => setArm('right')}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold border ${
                          arm === 'right' ? 'bg-[var(--lavender-100)] border-[var(--haven-orchid)] text-[var(--haven-deep)]' : 'border-[var(--border-hairline)]'
                        }`}
                      >
                        Right
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. WEIGHT */}
            {selectedType === 'weight' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[13px] font-display font-bold text-[var(--ink-900)]">Body Weight</h3>
                  <span className="text-[11px] text-[var(--ink-500)] font-medium">Unit: kg</span>
                </div>
                <div>
                  <label className="text-[11px] text-[var(--ink-600)] font-semibold block mb-1">
                    Weight in Kilograms (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="30"
                    max="200"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="e.g. 68.5"
                    className="w-full text-sm font-display font-bold p-2.5 rounded-xl border border-[var(--border-hairline)] text-[var(--ink-900)]"
                    required
                  />
                  <p className="text-[11px] text-[var(--ink-500)] mt-1">
                    Consistent morning weigh-ins provide the cleanest comparison across pregnancy.
                  </p>
                </div>
              </div>
            )}

            {/* 3. BABY MOVEMENT */}
            {selectedType === 'baby_movement' && (
              <div className="space-y-3">
                <h3 className="text-[13px] font-display font-bold text-[var(--ink-900)]">
                  Fetal Movement Check
                </h3>
                <div>
                  <label className="text-[11px] text-[var(--ink-600)] font-semibold block mb-1.5">
                    Movement Pattern Observed
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'normal', label: 'Normal / Regular', color: 'border-emerald-300' },
                      { id: 'active', label: 'Very Active', color: 'border-blue-300' },
                      { id: 'decreased', label: 'Decreased / Slower', color: 'border-amber-300' },
                      { id: 'none_felt', label: 'No Movements Felt', color: 'border-rose-300' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setMovementPattern(opt.id as any)}
                        className={`p-2.5 rounded-xl text-left border text-xs font-semibold transition-all ${
                          movementPattern === opt.id
                            ? 'bg-[var(--lavender-100)] border-[var(--haven-orchid)] text-[var(--haven-deep)] ring-2 ring-[var(--haven-orchid)]/20'
                            : 'bg-white border-[var(--border-hairline)] text-[var(--ink-700)]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] text-[var(--ink-600)] font-semibold block mb-1">
                      Kicks / Movements Count
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="200"
                      value={movementCount}
                      onChange={(e) => setMovementCount(e.target.value)}
                      placeholder="e.g. 10"
                      className="w-full text-xs p-2 rounded-xl border border-[var(--border-hairline)]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[var(--ink-600)] font-semibold block mb-1">
                      Session Minutes
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="360"
                      value={movementDuration}
                      onChange={(e) => setMovementDuration(e.target.value)}
                      placeholder="e.g. 60"
                      className="w-full text-xs p-2 rounded-xl border border-[var(--border-hairline)]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4. SYMPTOMS */}
            {selectedType === 'symptoms' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[13px] font-display font-bold text-[var(--ink-900)]">
                    Symptoms &amp; Warning Signs
                  </h3>
                  <span className="text-[11px] text-[var(--ink-500)]">Kenya MOH 216 Checklist</span>
                </div>
                <p className="text-[11px] text-[var(--ink-600)]">
                  Select any symptoms you are currently experiencing:
                </p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {MATERNAL_DANGER_SYMPTOMS.map((d) => {
                    const isChecked = selectedSymptoms.includes(d.id);
                    return (
                      <label
                        key={d.id}
                        className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-rose-50 border-rose-300 text-rose-900'
                            : 'bg-white border-[var(--border-hairline)] text-[var(--ink-800)] hover:bg-[var(--surface-2)]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSymptoms([...selectedSymptoms, d.id]);
                            } else {
                              setSelectedSymptoms(selectedSymptoms.filter((s) => s !== d.id));
                            }
                          }}
                          className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                        />
                        <div>
                          <p className="font-semibold leading-tight">{d.label}</p>
                          <p className="text-[10px] text-[var(--ink-500)] italic">{d.sw}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div>
                  <label className="text-[11px] text-[var(--ink-600)] font-semibold block mb-1">
                    Overall Severity
                  </label>
                  <div className="flex gap-2">
                    {(['mild', 'moderate', 'severe'] as const).map((sev) => (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setSymptomSeverity(sev)}
                        className={`flex-1 py-1.5 rounded-xl text-xs capitalize font-semibold border ${
                          symptomSeverity === sev
                            ? 'bg-[var(--lavender-100)] border-[var(--haven-orchid)] text-[var(--haven-deep)]'
                            : 'border-[var(--border-hairline)] text-[var(--ink-700)]'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 5. SLEEP */}
            {selectedType === 'sleep' && (
              <div className="space-y-3">
                <h3 className="text-[13px] font-display font-bold text-[var(--ink-900)]">Sleep &amp; Rest</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[var(--ink-600)] font-semibold block mb-1">
                      Hours Slept
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="24"
                      value={sleepHours}
                      onChange={(e) => setSleepHours(e.target.value)}
                      placeholder="e.g. 7.5"
                      className="w-full text-xs p-2 rounded-xl border border-[var(--border-hairline)]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[var(--ink-600)] font-semibold block mb-1">
                      Quality
                    </label>
                    <select
                      value={sleepQuality}
                      onChange={(e) => setSleepQuality(e.target.value as any)}
                      className="w-full text-xs p-2 rounded-xl border border-[var(--border-hairline)] bg-white"
                    >
                      <option value="rested">Rested &amp; Peaceful</option>
                      <option value="interrupted">Interrupted / Woke Often</option>
                      <option value="poor">Poor / Restless</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 6. MOOD */}
            {selectedType === 'mood' && (
              <div className="space-y-3">
                <h3 className="text-[13px] font-display font-bold text-[var(--ink-900)]">Emotional Wellness</h3>
                <div>
                  <label className="text-[11px] text-[var(--ink-600)] font-semibold block mb-1.5">
                    How are you feeling today?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'calm', label: 'Calm', emoji: '😌' },
                      { id: 'happy', label: 'Happy', emoji: '😊' },
                      { id: 'tired', label: 'Tired', emoji: '🥱' },
                      { id: 'anxious', label: 'Anxious', emoji: '😟' },
                      { id: 'sad', label: 'Sad', emoji: '😢' },
                      { id: 'overwhelmed', label: 'Overwhelmed', emoji: '🫂' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMood(m.id as any)}
                        className={`p-2 rounded-xl border text-center text-xs font-semibold transition-all ${
                          mood === m.id
                            ? 'bg-[var(--lavender-100)] border-[var(--haven-orchid)] text-[var(--haven-deep)] ring-2 ring-[var(--haven-orchid)]/20'
                            : 'bg-white border-[var(--border-hairline)] text-[var(--ink-700)]'
                        }`}
                      >
                        <span className="text-base block">{m.emoji}</span>
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 7. NUTRITION */}
            {selectedType === 'nutrition' && (
              <div className="space-y-3">
                <h3 className="text-[13px] font-display font-bold text-[var(--ink-900)]">Nutrition &amp; Hydration</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[var(--ink-600)] font-semibold block mb-1">
                      Water / Liquids (Glasses)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={hydrationGlasses}
                      onChange={(e) => setHydrationGlasses(e.target.value)}
                      placeholder="e.g. 8"
                      className="w-full text-xs p-2 rounded-xl border border-[var(--border-hairline)]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[var(--ink-600)] font-semibold block mb-1">Appetite</label>
                    <select
                      value={appetite}
                      onChange={(e) => setAppetite(e.target.value as any)}
                      className="w-full text-xs p-2 rounded-xl border border-[var(--border-hairline)] bg-white"
                    >
                      <option value="good">Good / Normal</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor / Nauseous</option>
                    </select>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs font-medium text-[var(--ink-800)] cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={tookIfas}
                    onChange={(e) => setTookIfas(e.target.checked)}
                    className="rounded text-[var(--haven-deep)]"
                  />
                  <span>Took daily Iron &amp; Folic Acid Supplement (IFAS) today</span>
                </label>
              </div>
            )}

            {/* 8. ACTIVITY */}
            {selectedType === 'activity' && (
              <div className="space-y-3">
                <h3 className="text-[13px] font-display font-bold text-[var(--ink-900)]">Daily Activity</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[var(--ink-600)] font-semibold block mb-1">
                      Active Minutes
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="720"
                      value={activeMinutes}
                      onChange={(e) => setActiveMinutes(e.target.value)}
                      placeholder="e.g. 20"
                      className="w-full text-xs p-2 rounded-xl border border-[var(--border-hairline)]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[var(--ink-600)] font-semibold block mb-1">Activity</label>
                    <select
                      value={activityType}
                      onChange={(e) => setActivityType(e.target.value as any)}
                      className="w-full text-xs p-2 rounded-xl border border-[var(--border-hairline)] bg-white"
                    >
                      <option value="walking">Brisk / Gentle Walking</option>
                      <option value="gentle_stretch">Pelvic floor / Stretches</option>
                      <option value="daily_chores">Home &amp; Daily Routine</option>
                      <option value="rest">Complete Rest</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 9. NOTES */}
            {selectedType === 'notes' && (
              <div className="space-y-2">
                <h3 className="text-[13px] font-display font-bold text-[var(--ink-900)]">Personal Reflection</h3>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Write your thoughts, questions for the nurse, or daily feelings..."
                  rows={4}
                  className="w-full text-xs p-2.5 rounded-xl border border-[var(--border-hairline)] text-[var(--ink-900)] outline-hidden focus:ring-2 focus:ring-[var(--haven-orchid)]"
                  required
                />
              </div>
            )}

            {/* Common Notes field for any category */}
            {selectedType !== 'notes' && (
              <div>
                <label className="text-[11px] text-[var(--ink-600)] font-semibold block mb-1">
                  Additional Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Felt dizzy after walking, resting now..."
                  className="w-full text-xs p-2 rounded-xl border border-[var(--border-hairline)] text-[var(--ink-800)]"
                />
              </div>
            )}

            {/* Clinician Sharing Toggle for Clinical measurements */}
            {isClinicalType && (
              <div className="pt-2 border-t border-[var(--border-hairline)]">
                <label className="flex items-start gap-2 text-xs text-[var(--ink-700)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sharedWithClinician}
                    onChange={(e) => setSharedWithClinician(e.target.checked)}
                    className="mt-0.5 rounded text-[var(--haven-deep)]"
                  />
                  <div>
                    <span className="font-semibold block">Include in clinician clinic summary</span>
                    <span className="text-[10px] text-[var(--ink-500)] block leading-tight">
                      This entry will be marked as self-reported home monitoring when sharing with your doctor or midwife.
                    </span>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Real-time Safety Advisory / Emergency Alert */}
          {safetyAlert.level === 'URGENT_DANGER' && (
            <div className="p-4 bg-rose-50 border-2 border-rose-400 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-rose-800 font-display font-bold text-xs">
                <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse shrink-0" />
                <span>{safetyAlert.title}</span>
              </div>
              <p className="text-xs text-rose-900 leading-relaxed">{safetyAlert.message}</p>
              <p className="text-xs font-semibold text-rose-950 bg-rose-100/70 p-2 rounded-lg">
                {safetyAlert.actionRecommendation}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href="tel:1199"
                  className="px-3.5 py-1.5 rounded-full bg-[#E11D3C] text-white text-xs font-display font-bold flex items-center gap-1.5 hover:bg-rose-700 shadow-xs"
                >
                  <PhoneCall className="w-3.5 h-3.5" /> Call 1199 Ambulance
                </a>
                {onTriggerEmergency && (
                  <button
                    type="button"
                    onClick={onTriggerEmergency}
                    className="px-3 py-1.5 rounded-full bg-white border border-rose-300 text-rose-800 text-xs font-semibold hover:bg-rose-50"
                  >
                    Emergency Guide
                  </button>
                )}
              </div>
            </div>
          )}

          {safetyAlert.level === 'ADVISORY' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-amber-800 font-display font-bold text-xs">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{safetyAlert.title}</span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">{safetyAlert.message}</p>
              <p className="text-[11px] text-amber-800 font-medium">{safetyAlert.actionRecommendation}</p>
            </div>
          )}

          {/* Provenance Notice */}
          <div className="p-2.5 bg-[var(--surface-2)] rounded-xl text-[10px] text-[var(--ink-500)] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0 text-[var(--haven-orchid)]" />
            <span>
              Self-recorded entries are stored as user-reported data for your personal health tracking and are not automatic clinical diagnoses.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-display font-bold text-[var(--ink-600)] hover:bg-[var(--surface-2)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[var(--haven-deep)] hover:bg-[var(--haven-deep)]/90 text-white text-xs font-display font-bold shadow-xs transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <span>{editingLog ? 'Update Entry' : 'Save Entry'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
