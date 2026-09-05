// src/components/clinician/FacilityRosterView.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CalendarDays,
  CalendarCheck,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Filter,
  Search,
  RefreshCw,
  Stethoscope,
  Baby,
  Activity,
  Building2,
  KeyRound,
  ShieldAlert,
  ChevronRight,
  User,
  Check,
  RotateCw,
} from 'lucide-react';
import type { FacilityRosterEntry } from '../../types';
import {
  fetchFacilityRoster,
  triggerRecomputeRoster,
  isDueThisWeek,
  isOverdue,
  isDueToday,
} from '../../services/facilityRosterService';
import Button from '../Button';

interface FacilityRosterViewProps {
  clinicianId?: string;
  facilityId?: string;
  facilityName?: string;
  onNavigateToAccess?: (prefillMotherId?: string) => void;
}

type TimeFilter = 'this_week' | 'today' | 'overdue' | 'all';
type TypeFilter = 'all' | 'anc' | 'immunization' | 'pnc' | 'growth_check';
type RiskFilter = 'all' | 'urgent' | 'watch' | 'none';

export default function FacilityRosterView({
  clinicianId,
  facilityId: propFacilityId,
  facilityName: propFacilityName,
  onNavigateToAccess,
}: FacilityRosterViewProps) {
  const [loading, setLoading] = useState(true);
  const [recomputing, setRecomputing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<FacilityRosterEntry[]>([]);
  const [facilityInfo, setFacilityInfo] = useState<{ id: string; name: string }>({
    id: propFacilityId || '',
    name: propFacilityName || 'Facility Clinic',
  });

  // Filters
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('this_week');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load roster data
  const loadRoster = useCallback(async (targetFacilityId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchFacilityRoster(targetFacilityId || propFacilityId);
      setEntries(res.items);
      if (res.facilityId) {
        setFacilityInfo({
          id: res.facilityId,
          name: res.facilityName || propFacilityName || `Facility ${res.facilityId}`,
        });
      }
    } catch (err: any) {
      console.error('[FacilityRosterView] Load error:', err);
      setError(err.message || 'Failed to load facility roster.');
    } finally {
      setLoading(false);
    }
  }, [propFacilityId, propFacilityName]);

  useEffect(() => {
    void loadRoster();
  }, [loadRoster]);

  // Handle recompute
  const handleRecompute = async () => {
    try {
      setRecomputing(true);
      setError(null);
      const updated = await triggerRecomputeRoster(facilityInfo.id || propFacilityId);
      setEntries(updated);
    } catch (err: any) {
      console.error('[FacilityRosterView] Recompute error:', err);
      setError(err.message || 'Could not recalculate facility roster.');
    } finally {
      setRecomputing(false);
    }
  };

  // Metric counts
  const metrics = useMemo(() => {
    const totalDueThisWeek = entries.filter((e) => isDueThisWeek(e.nextDueDate)).length;
    const ancDueThisWeek = entries.filter((e) => e.nextDueType === 'anc' && isDueThisWeek(e.nextDueDate)).length;
    const immDueThisWeek = entries.filter((e) => e.nextDueType === 'immunization' && isDueThisWeek(e.nextDueDate)).length;
    const urgentCount = entries.filter((e) => e.riskFlag === 'urgent').length;
    const overdueCount = entries.filter((e) => isOverdue(e.nextDueDate)).length;

    return {
      totalDueThisWeek,
      ancDueThisWeek,
      immDueThisWeek,
      urgentCount,
      overdueCount,
    };
  }, [entries]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    const now = new Date();
    return entries.filter((item) => {
      // Time filter
      if (timeFilter === 'this_week' && !isDueThisWeek(item.nextDueDate, now)) {
        return false;
      }
      if (timeFilter === 'today' && !isDueToday(item.nextDueDate, now)) {
        return false;
      }
      if (timeFilter === 'overdue' && !isOverdue(item.nextDueDate, now)) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'all' && item.nextDueType !== typeFilter) {
        return false;
      }

      // Risk filter
      if (riskFilter !== 'all' && (item.riskFlag || 'none') !== riskFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const motherMatch = item.motherId.toLowerCase().includes(q);
        const childMatch = item.childId ? item.childId.toLowerCase().includes(q) : false;
        const nameMatch = (item as any).motherName ? (item as any).motherName.toLowerCase().includes(q) : false;
        if (!motherMatch && !childMatch && !nameMatch) {
          return false;
        }
      }

      return true;
    });
  }, [entries, timeFilter, typeFilter, riskFilter, searchQuery]);

  // Relative date label helper
  const getRelativeDueLabel = (dateStr: string) => {
    if (!dateStr) return 'Date unspecified';
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const due = new Date(dateStr);
    const diffMs = due.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));

    if (diffDays === 0) return 'Due Today';
    if (diffDays === 1) return 'Due Tomorrow';
    if (diffDays > 1 && diffDays <= 7) return `Due in ${diffDays} days`;
    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)}d`;
    return `Due on ${due.toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const getTypeBadge = (type: FacilityRosterEntry['nextDueType']) => {
    switch (type) {
      case 'anc':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            <Stethoscope className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            Antenatal (ANC)
          </span>
        );
      case 'immunization':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <Baby className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            KEPI Immunization
          </span>
        );
      case 'pnc':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            Postnatal (PNC)
          </span>
        );
      case 'growth_check':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Activity className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            Growth Check
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700">
            Clinical Visit
          </span>
        );
    }
  };

  const getRiskBadge = (risk?: 'none' | 'watch' | 'urgent') => {
    switch (risk) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200 shadow-xs">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
            Urgent Alert
          </span>
        );
      case 'watch':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            Follow-Up
          </span>
        );
      case 'none':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
            <Check className="w-3 h-3 text-emerald-600" />
            Routine
          </span>
        );
    }
  };

  return (
    <div className="space-y-6" id="facility-roster-dashboard">
      {/* Top Banner: Facility Context & Actions */}
      <div className="bg-white rounded-[24px] border border-[var(--border-hairline)] p-6 shadow-card-1">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-10 h-10 rounded-xl bg-[var(--lavender-50)] text-[var(--haven-deep)] flex items-center justify-center border border-purple-100">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-extrabold text-xl text-[var(--ink-900)]">
                  Facility Roster Dashboard
                </h2>
                <div className="flex items-center gap-2 text-xs text-[var(--ink-500)] flex-wrap">
                  <span className="font-semibold text-[var(--haven-deep)]">
                    {facilityInfo.name}
                  </span>
                  {facilityInfo.id && (
                    <>
                      <span>•</span>
                      <span className="font-mono bg-[var(--lavender-50)] px-2 py-0.5 rounded-md text-[var(--ink-600)]">
                        MFL Code: {facilityInfo.id}
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span>MOH Maternal & Child Health Clinic Module</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-[var(--ink-500)] mt-2 max-w-2xl">
              Real-time schedule of mothers and infants due for antenatal contacts, KEPI immunizations, and postnatal checks at this facility.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center">
            <button
              id="refresh-roster-btn"
              type="button"
              onClick={() => void loadRoster()}
              disabled={loading || recomputing}
              className="px-3.5 py-2 rounded-xl border border-[var(--border-hairline)] bg-white text-[var(--ink-700)] text-xs font-display font-semibold hover:bg-[var(--lavender-50)] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[var(--haven-deep)]' : ''}`} />
              Refresh
            </button>

            <button
              id="recompute-roster-btn"
              type="button"
              onClick={() => void handleRecompute()}
              disabled={loading || recomputing}
              className="px-4 py-2 rounded-xl bg-[var(--haven-deep)] text-white text-xs font-display font-bold hover:bg-[var(--haven-orchid)] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${recomputing ? 'animate-spin' : ''}`} />
              {recomputing ? 'Recalculating...' : 'Sync Schedule'}
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 p-3.5 bg-red-50 text-red-800 rounded-xl border border-red-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-xs font-bold underline ml-3"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Metric Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-6 pt-5 border-t border-[var(--border-hairline)]">
          <div className="bg-[var(--lavender-50)]/60 rounded-2xl p-4 border border-purple-100 space-y-1">
            <span className="text-[11px] font-semibold text-[var(--ink-500)] uppercase tracking-wider block">
              Due This Week
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-display font-extrabold text-[var(--haven-deep)]">
                {metrics.totalDueThisWeek}
              </span>
              <span className="text-xs text-[var(--ink-400)]">patients</span>
            </div>
          </div>

          <div className="bg-purple-50/50 rounded-2xl p-4 border border-purple-100 space-y-1">
            <span className="text-[11px] font-semibold text-purple-900 uppercase tracking-wider block">
              ANC Contacts Due
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-display font-extrabold text-purple-900">
                {metrics.ancDueThisWeek}
              </span>
              <span className="text-xs text-purple-700">mothers</span>
            </div>
          </div>

          <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 space-y-1">
            <span className="text-[11px] font-semibold text-blue-900 uppercase tracking-wider block">
              KEPI Vaccines Due
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-display font-extrabold text-blue-900">
                {metrics.immDueThisWeek}
              </span>
              <span className="text-xs text-blue-700">infants</span>
            </div>
          </div>

          <div
            className={`rounded-2xl p-4 border space-y-1 transition-colors ${
              metrics.urgentCount > 0
                ? 'bg-red-50 border-red-200'
                : 'bg-emerald-50/60 border-emerald-200'
            }`}
          >
            <span
              className={`text-[11px] font-semibold uppercase tracking-wider block ${
                metrics.urgentCount > 0 ? 'text-red-900' : 'text-emerald-900'
              }`}
            >
              {metrics.urgentCount > 0 ? 'Urgent Attention' : 'Overdue / Alerts'}
            </span>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl font-display font-extrabold ${
                  metrics.urgentCount > 0 ? 'text-red-700' : 'text-emerald-800'
                }`}
              >
                {metrics.urgentCount > 0 ? metrics.urgentCount : metrics.overdueCount}
              </span>
              <span
                className={`text-xs ${
                  metrics.urgentCount > 0 ? 'text-red-600' : 'text-emerald-700'
                }`}
              >
                {metrics.urgentCount > 0 ? 'urgent flags' : 'overdue'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Time Filters, Care Types, Risk, & Search */}
      <div className="bg-white rounded-2xl border border-[var(--border-hairline)] p-4 shadow-card-1 space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Time Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[var(--lavender-50)] rounded-xl border border-purple-100 overflow-x-auto text-xs font-display font-semibold">
            <button
              type="button"
              onClick={() => setTimeFilter('this_week')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                timeFilter === 'this_week'
                  ? 'bg-[var(--haven-deep)] text-white shadow-xs'
                  : 'text-[var(--ink-600)] hover:text-[var(--ink-900)]'
              }`}
            >
              Due This Week ({metrics.totalDueThisWeek})
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('today')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                timeFilter === 'today'
                  ? 'bg-[var(--haven-deep)] text-white shadow-xs'
                  : 'text-[var(--ink-600)] hover:text-[var(--ink-900)]'
              }`}
            >
              Due Today
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('overdue')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                timeFilter === 'overdue'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'text-[var(--ink-600)] hover:text-red-700'
              }`}
            >
              Overdue ({metrics.overdueCount})
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                timeFilter === 'all'
                  ? 'bg-[var(--haven-deep)] text-white shadow-xs'
                  : 'text-[var(--ink-600)] hover:text-[var(--ink-900)]'
              }`}
            >
              All Scheduled ({entries.length})
            </button>
          </div>

          {/* Search box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-[var(--ink-400)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search mother ID, name or child..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[var(--border-hairline)] bg-white focus:outline-none focus:border-[var(--haven-deep)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--ink-400)] hover:text-[var(--ink-800)]"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Secondary filters: Service Type & Risk */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border-hairline)] text-xs">
          {/* Care Type Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[var(--ink-400)] text-[11px] font-medium mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Service:
            </span>
            {(
              [
                { id: 'all', label: 'All Services' },
                { id: 'anc', label: 'ANC' },
                { id: 'immunization', label: 'Immunizations' },
                { id: 'pnc', label: 'PNC' },
                { id: 'growth_check', label: 'Growth' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTypeFilter(t.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  typeFilter === t.id
                    ? 'bg-[var(--lavender-50)] text-[var(--haven-deep)] border border-purple-200'
                    : 'text-[var(--ink-500)] hover:bg-gray-50 border border-transparent'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Risk Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[var(--ink-400)] text-[11px] font-medium mr-1">Triage:</span>
            {(
              [
                { id: 'all', label: 'All Triage' },
                { id: 'urgent', label: 'Urgent Only' },
                { id: 'watch', label: 'Watch' },
                { id: 'none', label: 'Routine' },
              ] as const
            ).map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRiskFilter(r.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  riskFilter === r.id
                    ? r.id === 'urgent'
                      ? 'bg-red-50 text-red-800 border border-red-200'
                      : 'bg-[var(--lavender-50)] text-[var(--haven-deep)] border border-purple-200'
                    : 'text-[var(--ink-500)] hover:bg-gray-50 border border-transparent'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Roster Table / List */}
      <div className="bg-white rounded-[24px] border border-[var(--border-hairline)] shadow-card-1 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[var(--haven-deep)] animate-spin mx-auto" />
            <p className="text-xs text-[var(--ink-500)] font-medium">
              Loading facility clinical schedule...
            </p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[var(--lavender-50)] text-[var(--haven-deep)] flex items-center justify-center mx-auto">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-base text-[var(--ink-900)]">
              No Patients Due for Selected Filter
            </h3>
            <p className="text-xs text-[var(--ink-500)] max-w-sm mx-auto">
              There are currently no patients due under this criteria. Try changing your filters or click Sync Schedule to recalculate appointments.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setTimeFilter('this_week');
                  setTypeFilter('all');
                  setRiskFilter('all');
                  setSearchQuery('');
                }}
                className="text-xs text-[var(--haven-deep)] font-bold hover:underline cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-hairline)]">
            {/* Header row */}
            <div className="px-6 py-3 bg-[var(--lavender-50)]/50 hidden md:grid md:grid-cols-12 gap-4 text-[11px] font-semibold text-[var(--ink-600)] uppercase tracking-wider">
              <div className="col-span-4">Patient / Mother</div>
              <div className="col-span-3">Service Due</div>
              <div className="col-span-3">Scheduled Date</div>
              <div className="col-span-2 text-right">Triage Priority</div>
            </div>

            {/* List items */}
            {filteredEntries.map((entry) => {
              const overdue = isOverdue(entry.nextDueDate);
              const dueRelative = getRelativeDueLabel(entry.nextDueDate);
              const motherDisplayName = (entry as any).motherName || 'Mother';

              return (
                <div
                  key={entry.id}
                  className={`p-5 transition-colors flex flex-col md:grid md:grid-cols-12 gap-4 items-start md:items-center ${
                    entry.riskFlag === 'urgent'
                      ? 'bg-red-50/30 hover:bg-red-50/60'
                      : overdue
                      ? 'bg-amber-50/20 hover:bg-amber-50/40'
                      : 'hover:bg-[var(--lavender-50)]/40'
                  }`}
                >
                  {/* Patient Info */}
                  <div className="col-span-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-display font-bold text-[var(--ink-900)]">
                        {motherDisplayName}
                      </strong>
                      {entry.childId && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                          Child: {entry.childId.slice(-6)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[var(--ink-500)]">
                      <span>ID:</span>
                      <code className="font-mono text-[var(--ink-700)] select-all">
                        {entry.motherId}
                      </code>
                    </div>
                    {entry.lastVisitDate && (
                      <p className="text-[10px] text-[var(--ink-400)] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[var(--ink-400)]" />
                        Last visit: {entry.lastVisitDate}
                      </p>
                    )}
                  </div>

                  {/* Service Due */}
                  <div className="col-span-3 space-y-1">
                    <div>{getTypeBadge(entry.nextDueType)}</div>
                    <p className="text-[11px] text-[var(--ink-500)]">
                      {entry.nextDueType === 'anc' && 'Focused antenatal contact'}
                      {entry.nextDueType === 'immunization' && 'Routine KEPI child vaccine'}
                      {entry.nextDueType === 'pnc' && 'Postnatal maternal & infant check'}
                      {entry.nextDueType === 'growth_check' && 'Monthly growth & MUAC check'}
                    </p>
                  </div>

                  {/* Due Date */}
                  <div className="col-span-3 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-[var(--haven-deep)] shrink-0" />
                      <span className="text-xs font-display font-bold text-[var(--ink-900)]">
                        {entry.nextDueDate}
                      </span>
                    </div>
                    <span
                      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        overdue
                          ? 'bg-red-100 text-red-800'
                          : isDueToday(entry.nextDueDate)
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-[var(--lavender-50)] text-[var(--haven-deep)]'
                      }`}
                    >
                      {dueRelative}
                    </span>
                  </div>

                  {/* Priority & Connect */}
                  <div className="col-span-2 flex flex-col md:items-end gap-2 w-full md:w-auto">
                    {getRiskBadge(entry.riskFlag)}

                    {onNavigateToAccess && (
                      <button
                        type="button"
                        onClick={() => onNavigateToAccess(entry.motherId)}
                        className="text-[11px] font-display font-bold text-[var(--haven-deep)] hover:underline flex items-center gap-1 mt-1 cursor-pointer"
                        title="Connect with mother via Fast-Share PIN"
                      >
                        <KeyRound className="w-3 h-3" />
                        Connect
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
