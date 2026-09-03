import React, { useState, useEffect } from 'react';
import {
  Activity,
  Scale,
  Baby,
  AlertTriangle,
  Moon,
  Smile,
  Plus,
  Calendar,
  Clock,
  Trash2,
  Edit2,
  Info,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  BarChart2,
} from 'lucide-react';
import { DailyHealthLog, HealthLogType, BloodPressureValues, WeightValues, SleepValues, BabyMovementValues, SymptomsValues } from '../../types/healthLog';
import {
  analyzeBloodPressureTrends,
  analyzeWeightTrends,
  analyzeSleepTrends,
  analyzeBabyMovementTrends,
  analyzeSymptomsTrends,
  filterLogsByTimeframe,
  MIN_DATA_POINTS_FOR_TREND,
} from '../../services/healthTrendService';
import { getHealthLogs, deleteHealthLog } from '../../services/healthLogService';
import { HealthLogModal } from './HealthLogModal';

interface HealthTrendsProps {
  userId: string;
  onTriggerEmergency?: () => void;
  className?: string;
}

export const HealthTrends: React.FC<HealthTrendsProps> = ({
  userId,
  onTriggerEmergency,
  className = '',
}) => {
  const [logs, setLogs] = useState<DailyHealthLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedType, setSelectedType] = useState<HealthLogType>('blood_pressure');
  const [timeframeDays, setTimeframeDays] = useState<number>(14);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingLog, setEditingLog] = useState<DailyHealthLog | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await getHealthLogs(userId, { limit: 200 });
      setLogs(data);
    } catch (err) {
      console.warn('Could not load health logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchLogs();
    }
  }, [userId]);

  const handleDelete = async (logId: string) => {
    if (window.confirm('Delete this health entry?')) {
      try {
        await deleteHealthLog(userId, logId);
        setLogs((prev) => prev.filter((l) => l.id !== logId));
      } catch (err) {
        console.error('Failed to delete log:', err);
      }
    }
  };

  const handleOpenAdd = () => {
    setEditingLog(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (log: DailyHealthLog) => {
    setEditingLog(log);
    setIsModalOpen(true);
  };

  // Filter logs for currently selected type
  const logsForType = logs.filter((l) => l.type === selectedType);
  const logsInWindow = filterLogsByTimeframe(logsForType, timeframeDays);

  // Analyze trends safely
  const bpTrends = analyzeBloodPressureTrends(logs, timeframeDays);
  const weightTrends = analyzeWeightTrends(logs, timeframeDays);
  const sleepTrends = analyzeSleepTrends(logs, timeframeDays);
  const babyTrends = analyzeBabyMovementTrends(logs, timeframeDays);
  const symptomTrends = analyzeSymptomsTrends(logs, timeframeDays);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Category Navigation Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'blood_pressure', label: 'Blood Pressure', icon: Activity },
          { id: 'weight', label: 'Weight', icon: Scale },
          { id: 'baby_movement', label: 'Baby Movements', icon: Baby },
          { id: 'sleep', label: 'Sleep', icon: Moon },
          { id: 'symptoms', label: 'Symptoms', icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedType === tab.id;
          const count = logs.filter((l) => l.type === tab.id).length;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedType(tab.id as any)}
              className={`px-3 py-2 rounded-xl text-xs font-display font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[var(--haven-deep)] text-white shadow-xs'
                  : 'bg-white border border-[var(--border-hairline)] text-[var(--ink-700)] hover:bg-[var(--surface-2)]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[var(--ink-500)]'}`} />
              <span>{tab.label}</span>
              {count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[var(--lavender-100)] text-[var(--haven-deep)]'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Trends Container */}
      <div className="bg-white rounded-2xl border border-[var(--border-hairline)] shadow-card-1 p-4 sm:p-5 space-y-4">
        {/* Header & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-hairline)] pb-3">
          <div>
            <h2 className="font-display font-extrabold text-[16px] text-[var(--ink-900)]">
              {selectedType === 'blood_pressure' && 'Blood Pressure Patterns'}
              {selectedType === 'weight' && 'Weight Progression'}
              {selectedType === 'baby_movement' && 'Baby Movement Records'}
              {selectedType === 'sleep' && 'Rest & Sleep'}
              {selectedType === 'symptoms' && 'Reported Symptoms'}
            </h2>
            <p className="text-[11px] text-[var(--ink-500)] font-body">
              {timeframeDays}-day window &bull; Self-recorded home entries
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Timeframe Selector */}
            <div className="flex bg-[var(--surface-2)] p-0.5 rounded-lg border border-[var(--border-hairline)] text-[11px] font-semibold">
              {[7, 14, 30].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setTimeframeDays(days)}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    timeframeDays === days
                      ? 'bg-white text-[var(--ink-900)] shadow-2xs'
                      : 'text-[var(--ink-500)] hover:text-[var(--ink-800)]'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>

            {/* Quick Log Button */}
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-3 py-1.5 rounded-xl bg-[var(--haven-deep)] hover:bg-[var(--haven-deep)]/90 text-white font-display font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Entry</span>
            </button>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="py-8 text-center text-xs text-[var(--ink-500)]">
            Loading health entries...
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && logsInWindow.length === 0 && (
          <div className="py-8 text-center space-y-3 max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-full bg-[var(--lavender-50)] text-[var(--haven-orchid)] mx-auto flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-[var(--ink-900)]">
                No entries recorded in the last {timeframeDays} days
              </h4>
              <p className="text-xs text-[var(--ink-600)] mt-1 leading-relaxed">
                Occasional logs between clinic checkups help build an understanding of your health patterns over time.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-[var(--lavender-100)] text-[var(--haven-deep)] font-display font-bold text-xs hover:bg-[var(--lavender-200)] transition-colors cursor-pointer"
            >
              Log your first {selectedType.replace('_', ' ')}
            </button>
          </div>
        )}

        {/* SPARSE DATA STATE (< 3 entries) */}
        {!loading && logsInWindow.length > 0 && logsInWindow.length < MIN_DATA_POINTS_FOR_TREND && (
          <div className="space-y-4">
            <div className="p-3.5 bg-[var(--surface-2)] border border-[var(--border-hairline)] rounded-xl flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[var(--haven-orchid)] shrink-0 mt-0.5" />
              <div>
                <h5 className="font-display font-bold text-xs text-[var(--ink-900)]">
                  Sparse Data ({logsInWindow.length} of {MIN_DATA_POINTS_FOR_TREND} readings needed)
                </h5>
                <p className="text-xs text-[var(--ink-600)] mt-0.5 leading-relaxed">
                  To avoid misleading conclusions or premature assumptions, trend calculations require at least{' '}
                  {MIN_DATA_POINTS_FOR_TREND} entries. Individual readings are listed below.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SUFFICIENT DATA STATE (>= 3 entries) */}
        {!loading && logsInWindow.length >= MIN_DATA_POINTS_FOR_TREND && (
          <div className="space-y-4">
            {/* Blood Pressure Analysis */}
            {selectedType === 'blood_pressure' && bpTrends.status === 'sufficient' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 bg-[var(--surface-2)] rounded-xl border border-[var(--border-hairline)]">
                    <span className="text-[10px] uppercase font-bold text-[var(--ink-500)] block">Latest</span>
                    <span className="font-display font-extrabold text-[17px] text-[var(--ink-900)]">
                      {bpTrends.latest?.systolic}/{bpTrends.latest?.diastolic}
                    </span>
                    <span className="text-[10px] text-[var(--ink-500)] block">mmHg</span>
                  </div>

                  <div className="p-3 bg-[var(--surface-2)] rounded-xl border border-[var(--border-hairline)]">
                    <span className="text-[10px] uppercase font-bold text-[var(--ink-500)] block">Average</span>
                    <span className="font-display font-extrabold text-[17px] text-[var(--haven-deep)]">
                      {bpTrends.averageSystolic}/{bpTrends.averageDiastolic}
                    </span>
                    <span className="text-[10px] text-[var(--ink-500)] block">mmHg</span>
                  </div>

                  <div className="p-3 bg-[var(--surface-2)] rounded-xl border border-[var(--border-hairline)]">
                    <span className="text-[10px] uppercase font-bold text-[var(--ink-500)] block">Range</span>
                    <span className="font-display font-bold text-xs text-[var(--ink-800)] mt-1 block">
                      {bpTrends.systolicRange?.[0]}/{bpTrends.diastolicRange?.[0]} to{' '}
                      {bpTrends.systolicRange?.[1]}/{bpTrends.diastolicRange?.[1]}
                    </span>
                    <span className="text-[10px] text-[var(--ink-500)] block">min / max</span>
                  </div>

                  <div className="p-3 bg-[var(--surface-2)] rounded-xl border border-[var(--border-hairline)]">
                    <span className="text-[10px] uppercase font-bold text-[var(--ink-500)] block">Recorded</span>
                    <span className="font-display font-extrabold text-[17px] text-[var(--ink-900)]">
                      {bpTrends.totalEntries}
                    </span>
                    <span className="text-[10px] text-[var(--ink-500)] block">readings</span>
                  </div>
                </div>

                {/* Severe Blood Pressure Danger Callout */}
                {bpTrends.hasSevereElevation && (
                  <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-2.5">
                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <h4 className="font-display font-bold text-xs text-rose-900">
                        Severe Blood Pressure Elevation Detected
                      </h4>
                      <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                        One or more readings reached ≥160/110 mmHg. Kenya Ministry of Health guidelines advise
                        prompt evaluation at a health facility. Please contact your doctor, midwife, or call 1199.
                      </p>
                    </div>
                  </div>
                )}

                {/* Objective Clinical Summary */}
                <div className="p-3 bg-[var(--lavender-50)] rounded-xl border border-[var(--border-hairline)] text-xs text-[var(--ink-800)] leading-relaxed">
                  <span className="font-bold text-[var(--haven-deep)]">Summary: </span>
                  {bpTrends.message}
                </div>

                {/* Mini SVG Trend Line for BP */}
                <div className="p-3 bg-white rounded-xl border border-[var(--border-hairline)] space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-[var(--ink-500)] font-semibold">
                    <span>Readings Timeline</span>
                    <span>Standard upper guideline: 140/90 mmHg</span>
                  </div>
                  <div className="h-20 flex items-end gap-1.5 pt-2">
                    {logsInWindow.map((l, idx) => {
                      const vals = l.values as BloodPressureValues;
                      const isHigh = vals.systolic >= 140 || vals.diastolic >= 90;
                      const isSevere = vals.systolic >= 160 || vals.diastolic >= 110;
                      const heightPercent = Math.min(100, Math.max(20, ((vals.systolic - 70) / 130) * 100));

                      return (
                        <div key={l.id || idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full rounded-t-sm transition-all ${
                              isSevere ? 'bg-rose-500' : isHigh ? 'bg-amber-400' : 'bg-[var(--haven-orchid)]'
                            }`}
                          />
                          <span className="text-[9px] text-[var(--ink-500)] truncate w-full text-center">
                            {vals.systolic}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Weight Analysis */}
            {selectedType === 'weight' && weightTrends.status === 'sufficient' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 bg-[var(--surface-2)] rounded-xl border border-[var(--border-hairline)]">
                    <span className="text-[10px] uppercase font-bold text-[var(--ink-500)] block">Latest</span>
                    <span className="font-display font-extrabold text-[17px] text-[var(--ink-900)]">
                      {weightTrends.latest?.weightKg}
                    </span>
                    <span className="text-[10px] text-[var(--ink-500)] block">kg</span>
                  </div>

                  <div className="p-3 bg-[var(--surface-2)] rounded-xl border border-[var(--border-hairline)]">
                    <span className="text-[10px] uppercase font-bold text-[var(--ink-500)] block">Net Change</span>
                    <span className="font-display font-extrabold text-[17px] text-[var(--haven-deep)]">
                      {weightTrends.deltaKg && weightTrends.deltaKg > 0
                        ? `+${weightTrends.deltaKg}`
                        : weightTrends.deltaKg}{' '}
                      kg
                    </span>
                    <span className="text-[10px] text-[var(--ink-500)] block">in {timeframeDays} days</span>
                  </div>

                  <div className="p-3 bg-[var(--surface-2)] rounded-xl border border-[var(--border-hairline)]">
                    <span className="text-[10px] uppercase font-bold text-[var(--ink-500)] block">Average</span>
                    <span className="font-display font-extrabold text-[17px] text-[var(--ink-900)]">
                      {weightTrends.averageWeight}
                    </span>
                    <span className="text-[10px] text-[var(--ink-500)] block">kg</span>
                  </div>

                  <div className="p-3 bg-[var(--surface-2)] rounded-xl border border-[var(--border-hairline)]">
                    <span className="text-[10px] uppercase font-bold text-[var(--ink-500)] block">Readings</span>
                    <span className="font-display font-extrabold text-[17px] text-[var(--ink-900)]">
                      {weightTrends.totalEntries}
                    </span>
                    <span className="text-[10px] text-[var(--ink-500)] block">entries</span>
                  </div>
                </div>

                <div className="p-3 bg-[var(--lavender-50)] rounded-xl border border-[var(--border-hairline)] text-xs text-[var(--ink-800)]">
                  {weightTrends.message}
                </div>
              </div>
            )}

            {/* Sleep Analysis */}
            {selectedType === 'sleep' && sleepTrends.status === 'sufficient' && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 bg-[var(--surface-2)] rounded-xl border border-[var(--border-hairline)]">
                    <span className="text-[10px] uppercase font-bold text-[var(--ink-500)] block">Avg Sleep</span>
                    <span className="font-display font-extrabold text-[17px] text-[var(--ink-900)]">
                      {sleepTrends.averageHours}
                    </span>
                    <span className="text-[10px] text-[var(--ink-500)] block">hours/night</span>
                  </div>

                  <div className="p-3 bg-[var(--surface-2)] rounded-xl border border-[var(--border-hairline)]">
                    <span className="text-[10px] uppercase font-bold text-[var(--ink-500)] block">Restful</span>
                    <span className="font-display font-extrabold text-[17px] text-emerald-700">
                      {sleepTrends.restedPercentage}%
                    </span>
                    <span className="text-[10px] text-[var(--ink-500)] block">of nights</span>
                  </div>

                  <div className="p-3 bg-[var(--surface-2)] rounded-xl border border-[var(--border-hairline)]">
                    <span className="text-[10px] uppercase font-bold text-[var(--ink-500)] block">Total Logs</span>
                    <span className="font-display font-extrabold text-[17px] text-[var(--ink-900)]">
                      {sleepTrends.totalEntries}
                    </span>
                    <span className="text-[10px] text-[var(--ink-500)] block">entries</span>
                  </div>
                </div>

                <div className="p-3 bg-[var(--lavender-50)] rounded-xl border border-[var(--border-hairline)] text-xs text-[var(--ink-800)]">
                  {sleepTrends.message}
                </div>
              </div>
            )}

            {/* Baby Movements Analysis */}
            {selectedType === 'baby_movement' && (
              <div className="space-y-3">
                <div className="p-3 bg-[var(--lavender-50)] rounded-xl border border-[var(--border-hairline)] text-xs text-[var(--ink-800)]">
                  {babyTrends.message}
                </div>
                {babyTrends.hasDecreasedAlert && (
                  <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-2.5">
                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-display font-bold text-xs text-rose-900">Decreased Fetal Movements</h4>
                      <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                        If fetal movements are noticeably reduced or absent, lie on your left side for an hour. If
                        movements do not resume normally, please seek immediate maternity evaluation.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Symptoms Analysis */}
            {selectedType === 'symptoms' && (
              <div className="space-y-3">
                <div className="p-3 bg-[var(--lavender-50)] rounded-xl border border-[var(--border-hairline)] text-xs text-[var(--ink-800)]">
                  {symptomTrends.message}
                </div>
                {symptomTrends.dangerSignsEncountered && symptomTrends.dangerSignsEncountered.length > 0 && (
                  <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-2.5">
                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-display font-bold text-xs text-rose-900">Warning Signs Noted</h4>
                      <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                        Danger signs were recorded during this period: {symptomTrends.dangerSignsEncountered.join(', ')}.
                        Ensure you report these to your healthcare provider at your next visit or immediately if ongoing.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* LOG ENTRIES LIST */}
        {logsInWindow.length > 0 && (
          <div className="pt-3 border-t border-[var(--border-hairline)] space-y-2">
            <h4 className="font-display font-bold text-xs text-[var(--ink-700)] uppercase tracking-wider">
              Recorded Entries ({logsInWindow.length})
            </h4>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {logsInWindow.map((log) => {
                const dateObj = new Date(log.timestamp);
                const formattedDate = dateObj.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                });
                const formattedTime = dateObj.toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-white border border-[var(--border-hairline)] hover:border-[var(--haven-orchid)]/40 transition-all flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-[var(--ink-900)]">
                          {log.type === 'blood_pressure' &&
                            `${(log.values as BloodPressureValues).systolic}/${(log.values as BloodPressureValues).diastolic} mmHg`}
                          {log.type === 'weight' && `${(log.values as WeightValues).weightKg} kg`}
                          {log.type === 'sleep' &&
                            `${(log.values as SleepValues).hours} hrs (${(log.values as SleepValues).quality})`}
                          {log.type === 'baby_movement' &&
                            `Movement: ${(log.values as BabyMovementValues).pattern.replace('_', ' ')}`}
                          {log.type === 'symptoms' &&
                            ((log.values as SymptomsValues).symptoms?.join(', ') || 'Checked symptoms')}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 font-medium">
                          {log.source}
                        </span>
                        {log.sharedWithClinician && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-medium">
                            Clinician Shared
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-[var(--ink-500)] mt-0.5">
                        <span className="flex items-center gap-0.5">
                          <Calendar className="w-3 h-3 text-[var(--ink-400)]" /> {formattedDate}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3 text-[var(--ink-400)]" /> {formattedTime}
                        </span>
                        {log.notes && (
                          <span className="truncate max-w-[140px] italic text-[var(--ink-600)]">
                            &ldquo;{log.notes}&rdquo;
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(log)}
                        aria-label="Edit entry"
                        className="p-1.5 rounded-lg hover:bg-[var(--lavender-100)] text-[var(--ink-500)] hover:text-[var(--haven-deep)] transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(log.id)}
                        aria-label="Delete entry"
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-[var(--ink-400)] hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Log Modal */}
      <HealthLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={userId}
        initialType={selectedType}
        editingLog={editingLog}
        onLogSaved={() => fetchLogs()}
        onTriggerEmergency={onTriggerEmergency}
      />
    </div>
  );
};
export default HealthTrends;
