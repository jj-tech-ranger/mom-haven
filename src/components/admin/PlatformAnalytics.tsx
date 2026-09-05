// src/components/admin/PlatformAnalytics.tsx
import React, { useState, useEffect } from 'react';
import { 
  Users, Activity, Baby, HeartPulse, ShieldAlert, ArrowUpRight, BarChart3, RefreshCw, FileText, Clock
} from 'lucide-react';
import { auth, db } from '../../lib/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { ReportExportRecord } from '../../types';

interface ReportsResponse {
  counts: {
    users: number;
    pregnancies: number;
    children: number;
    reminders: number;
    muacMeasurements: number;
    immunizationRecords: number;
    growthMeasurements: number;
    ancEncounters: number;
  };
  adoption?: Array<{ date: string; count: number }>;
  ancContactCompletion?: {
    rate: number;
    percentage?: number;
    completedCount: number;
    fourPlusCount?: number;
    totalActive: number;
  } | number;
  immunizationCoverage?: number | {
    rate: number;
    percentage?: number;
  };
  muacAlertVolume?: {
    SAM: number;
    MAM: number;
    AtRisk: number;
    Normal: number;
  };
  pregnancies?: Array<{
    id: string;
    motherId: string;
    status: string;
    gestationalAgeWeeks: number | null;
    lmp: string | null;
    county: string;
  }>;
  motherProfiles?: Array<{
    id: string;
    county: string;
  }>;
  note?: string;
}

const COUNTY_HUBS: Record<string, string> = {
  'Nairobi': 'Pumwani, KNH, Mbagathi hubs',
  'Nakuru': 'Nakuru Level 5 & Sub-County Hubs',
  'Kisumu': 'JOOTRH, Kisumu East',
  'Mombasa': 'Coast General, Port Reitz',
  'Kiambu': 'Thika Level 5, Kiambu Level 4',
  'Machakos': 'Machakos Level 5 Hospital',
  'Uasin Gishu': 'MTRH Eldoret & Sub-County Hubs',
  'Kilifi': 'Kilifi County Hospital',
};

export const PlatformAnalytics: React.FC = () => {
  const [data, setData] = useState<ReportsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [recentReports, setRecentReports] = useState<ReportExportRecord[]>([]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      let user = auth.currentUser;
      if (!user) {
        await new Promise<void>((resolve) => {
          const unsubscribe = onAuthStateChanged(auth, (u) => {
            user = u;
            unsubscribe();
            resolve();
          });
          setTimeout(() => {
            unsubscribe();
            resolve();
          }, 1200);
        });
      }

      const idToken = user ? await user.getIdToken(true).catch(() => '') : '';
      const headers: Record<string, string> = {};
      if (idToken) {
        headers['authorization'] = `Bearer ${idToken}`;
        headers['x-firebase-id-token'] = idToken;
      }

      let res = await fetch('/api/admin/reports', { headers });
      if (!res.ok && res.status === 404) {
        res = await fetch('/api/v1/admin/reports', { headers });
      }

      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || `Failed to fetch reports (${res.status})`);
      }

      // Fetch admin-wide recent report export records
      try {
        const exportsSnap = await getDocs(query(collection(db, 'reportExports'), limit(25)));
        const items = exportsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ReportExportRecord));
        items.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
        setRecentReports(items);
      } catch (e) {
        console.warn('Could not load reportExports collection:', e);
      }
    } catch (err: any) {
      console.error('Failed to load platform analytics:', err);
      setError(err?.message || 'Unable to load platform analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Show loading skeleton while fetching
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Top Level Metric KPIs Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="h-3 w-28 bg-gray-200 rounded" />
                <div className="w-5 h-5 bg-gray-200 rounded-full" />
              </div>
              <div className="h-7 w-20 bg-gray-200 rounded mt-3" />
              <div className="h-3 w-32 bg-gray-100 rounded mt-2" />
            </div>
          ))}
        </div>

        {/* Cohort Breakdown Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="h-4 w-48 bg-gray-200 rounded mb-4" />
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <div className="h-3 w-36 bg-gray-200 rounded" />
                    <div className="h-3 w-12 bg-gray-200 rounded" />
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="h-4 w-48 bg-gray-200 rounded mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="space-y-1">
                    <div className="h-3.5 w-28 bg-gray-200 rounded" />
                    <div className="h-2.5 w-40 bg-gray-200 rounded" />
                  </div>
                  <div className="h-4 w-16 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const counts = data?.counts || {
    users: 0,
    pregnancies: 0,
    children: 0,
    reminders: 0,
    muacMeasurements: 0,
    immunizationRecords: 0,
    growthMeasurements: 0,
    ancEncounters: 0,
  };

  // Derive ANC Contact Completion rate
  const ancRate = typeof data?.ancContactCompletion === 'number'
    ? data.ancContactCompletion
    : (data?.ancContactCompletion?.rate ?? data?.ancContactCompletion?.percentage ?? 0);

  // Derive Immunization Coverage rate
  const immRate = typeof data?.immunizationCoverage === 'number'
    ? data.immunizationCoverage
    : (data?.immunizationCoverage?.rate ?? data?.immunizationCoverage?.percentage ?? 0);

  // Derive Triage Escalations from SAM + MAM totals
  const samAlerts = data?.muacAlertVolume?.SAM || 0;
  const mamAlerts = data?.muacAlertVolume?.MAM || 0;
  const triageEscalations = samAlerts + mamAlerts;

  // Derive Active Mother Lifecycle Distribution client-side from pregnancies & children
  const pregnancies = data?.pregnancies || [];
  const activePregnancies = pregnancies.filter(p => !p.status || p.status.toLowerCase() === 'active');

  let t1Count = 0;
  let t2Count = 0;
  let t3Count = 0;

  for (const p of activePregnancies) {
    let weeks = p.gestationalAgeWeeks;
    if (weeks == null && p.lmp) {
      const ms = Date.now() - new Date(p.lmp).getTime();
      if (!isNaN(ms) && ms > 0) {
        weeks = Math.floor(ms / (7 * 24 * 60 * 60 * 1000));
      }
    }

    if (weeks != null && weeks > 0) {
      if (weeks <= 13) {
        t1Count++;
      } else if (weeks <= 27) {
        t2Count++;
      } else {
        t3Count++;
      }
    } else {
      // Default unassigned active pregnancies to 2nd trimester as median
      t2Count++;
    }
  }

  const childCount = counts.children || 0;
  const totalCohort = t1Count + t2Count + t3Count + childCount;

  const t1Pct = totalCohort > 0 ? Math.round((t1Count / totalCohort) * 100) : 0;
  const t2Pct = totalCohort > 0 ? Math.round((t2Count / totalCohort) * 100) : 0;
  const t3Pct = totalCohort > 0 ? Math.round((t3Count / totalCohort) * 100) : 0;
  const childPct = totalCohort > 0 ? Math.max(0, 100 - (t1Pct + t2Pct + t3Pct)) : 0;

  // Derive County Adoption from active pregnancies grouped by county
  const motherCountyMap = new Map<string, string>();
  (data?.motherProfiles || []).forEach(m => {
    if (m.id && m.county) motherCountyMap.set(m.id, m.county);
  });

  const countyCountMap: Record<string, number> = {};
  for (const p of activePregnancies) {
    const rawCounty = p.county || motherCountyMap.get(p.motherId) || 'Nairobi';
    const cleanCounty = rawCounty.replace(/\s+County$/i, '').trim() || 'Nairobi';
    countyCountMap[cleanCounty] = (countyCountMap[cleanCounty] || 0) + 1;
  }

  // Ensure standard focal counties are prioritized or shown with real counts
  const defaultCounties = ['Nairobi', 'Nakuru', 'Kisumu', 'Mombasa'];
  const allCountyNames = Array.from(new Set([...defaultCounties, ...Object.keys(countyCountMap)]));
  
  const sortedCounties = allCountyNames
    .map(name => ({
      name,
      count: countyCountMap[name] || 0,
      hub: COUNTY_HUBS[name] || 'County Referral & Sub-County Hubs'
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Empty State Banner if counts.users === 0 */}
      {counts.users === 0 && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center">
          <div className="w-12 h-12 bg-teal-50 text-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-900 text-sm mb-1">No Clinical Registry Profiles Yet</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mb-3">
            MOH 216 maternal profiles, antenatal care visits, and KEPI infant records will automatically populate live metrics here once users or demo cases are created.
          </p>
          <button
            onClick={fetchReports}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-800 text-white text-xs font-semibold hover:bg-teal-900 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Analytics
          </button>
        </div>
      )}

      {/* Top Level Metric KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">MOH 216 Profiles</span>
            <Users className="w-5 h-5 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-gray-900">{counts.users.toLocaleString()}</span>
            {counts.users > 0 && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center">
                <ArrowUpRight className="w-3 h-3" /> Live
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {counts.pregnancies + counts.children > 0
              ? `${(counts.pregnancies + counts.children).toLocaleString()} active clinical cases`
              : 'Active pregnancies & infants'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">ANC 4+ Visit Retention</span>
            <HeartPulse className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-gray-900">{ancRate.toFixed(1)}%</span>
            {ancRate >= 62 && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center">
                <ArrowUpRight className="w-3 h-3" /> +{(ancRate - 62).toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-xs text-indigo-600 mt-1">
            {ancRate >= 62 ? 'Above national baseline (62%)' : 'National baseline target: 62%'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">KEPI Immunization Rate</span>
            <Baby className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-gray-900">{immRate.toFixed(1)}%</span>
            {immRate > 0 && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center">
                <ArrowUpRight className="w-3 h-3" /> {counts.immunizationRecords} doses
              </span>
            )}
          </div>
          <p className="text-xs text-emerald-600 mt-1">Vaccine reminder adherence</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Triage Escalations</span>
            <ShieldAlert className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-gray-900">{triageEscalations.toLocaleString()}</span>
            <span className="text-xs font-semibold text-amber-600">
              {samAlerts} SAM · {mamAlerts} MAM
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">High-urgency danger signs intercepted</p>
        </div>
      </div>

      {/* Cohort Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Antenatal Stage Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-600" /> Active Mother Lifecycle Distribution
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-gray-700 mb-1">
                <span>1st Trimester (Booking & Ultrasound)</span>
                <span className="text-teal-800">{t1Pct}% ({t1Count.toLocaleString()})</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full transition-all duration-500" style={{ width: `${t1Pct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-gray-700 mb-1">
                <span>2nd Trimester (Anomaly & Iron Tracking)</span>
                <span className="text-teal-800">{t2Pct}% ({t2Count.toLocaleString()})</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-teal-600 rounded-full transition-all duration-500" style={{ width: `${t2Pct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-gray-700 mb-1">
                <span>3rd Trimester (Birth Plan & Bag Prep)</span>
                <span className="text-teal-800">{t3Pct}% ({t3Count.toLocaleString()})</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-teal-700 rounded-full transition-all duration-500" style={{ width: `${t3Pct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-gray-700 mb-1">
                <span>Postnatal & Child (0-5 Years KEPI Tracking)</span>
                <span className="text-teal-800">{childPct}% ({childCount.toLocaleString()})</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${childPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Regional County Adoption */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600" /> County Health Adoption (MOH 216 Records)
          </h3>

          <div className="space-y-3 text-xs">
            {sortedCounties.map((county) => (
              <div key={county.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <span className="font-bold text-gray-900">{county.name} County</span>
                  <span className="text-[11px] text-gray-500 block">{county.hub}</span>
                </div>
                <span className="font-mono font-bold text-teal-800 text-sm">
                  {county.count.toLocaleString()} Active
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Generated Reports Section */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" /> Recent Generated Reports
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Automated facility cron outputs and clinician/mother certified exports
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full">
            {recentReports.length} {recentReports.length === 1 ? 'Record' : 'Records'}
          </span>
        </div>

        {recentReports.length === 0 ? (
          <p className="text-xs text-gray-400 italic py-3 text-center">
            No report export records found in audit logs.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 text-[11px] uppercase tracking-wider">
                  <th className="pb-2 font-semibold">Report Type</th>
                  <th className="pb-2 font-semibold">Target / Facility</th>
                  <th className="pb-2 font-semibold">Generated By</th>
                  <th className="pb-2 font-semibold">Generated At</th>
                  <th className="pb-2 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50/60">
                    <td className="py-2.5 font-medium text-gray-900 capitalize">
                      {report.reportType === 'weekly_facility'
                        ? 'Weekly Facility Report'
                        : report.reportType === 'monthly_summary'
                        ? 'Maternal Health Summary (PDF)'
                        : report.reportType === 'immunization_certificate'
                        ? 'Immunization Certificate'
                        : report.reportType.replace(/_/g, ' ')}
                    </td>
                    <td className="py-2.5 text-gray-600 font-mono text-[11px]">
                      {report.generatedFor}
                    </td>
                    <td className="py-2.5 text-gray-600">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700">
                        {report.generatedBy}
                      </span>
                    </td>
                    <td className="py-2.5 text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                      {new Date(report.generatedAt).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                        Completed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
