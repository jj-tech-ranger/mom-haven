// src/components/admin/PlatformAnalytics.tsx
import React from 'react';
import { 
  TrendingUp, Users, Calendar, Activity, CheckCircle, 
  Baby, HeartPulse, ShieldAlert, ArrowUpRight, BarChart3
} from 'lucide-react';

export const PlatformAnalytics: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Top Level Metric KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">MOH 216 Profiles</span>
            <Users className="w-5 h-5 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-gray-900">14,820</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +18.4%
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Active pregnancies & infants</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">ANC 4+ Visit Retention</span>
            <HeartPulse className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-gray-900">82.4%</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +9.1%
            </span>
          </div>
          <p className="text-xs text-indigo-600 mt-1">Above national baseline (62%)</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">KEPI Immunization Rate</span>
            <Baby className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-gray-900">94.1%</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +4.2%
            </span>
          </div>
          <p className="text-xs text-emerald-600 mt-1">Vaccine reminder adherence</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Triage Escalations</span>
            <ShieldAlert className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-gray-900">312</span>
            <span className="text-xs font-semibold text-amber-600">Avg 4.2m to dispatch</span>
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
                <span className="text-teal-800">24% (3,556)</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full" style={{ width: '24%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-gray-700 mb-1">
                <span>2nd Trimester (Anomaly & Iron Tracking)</span>
                <span className="text-teal-800">36% (5,335)</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-teal-600 rounded-full" style={{ width: '36%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-gray-700 mb-1">
                <span>3rd Trimester (Birth Plan & Bag Prep)</span>
                <span className="text-teal-800">22% (3,260)</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-teal-700 rounded-full" style={{ width: '22%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-gray-700 mb-1">
                <span>Postnatal & Child (0-5 Years KEPI Tracking)</span>
                <span className="text-teal-800">18% (2,669)</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full" style={{ width: '18%' }} />
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
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <span className="font-bold text-gray-900">Nairobi County</span>
                <span className="text-[11px] text-gray-500 block">Pumwani, KNH, Mbagathi hubs</span>
              </div>
              <span className="font-mono font-bold text-teal-800 text-sm">4,810 Active</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <span className="font-bold text-gray-900">Nakuru County</span>
                <span className="text-[11px] text-gray-500 block">Nakuru Level 5 & Sub-County Hubs</span>
              </div>
              <span className="font-mono font-bold text-teal-800 text-sm">3,120 Active</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <span className="font-bold text-gray-900">Kisumu County</span>
                <span className="text-[11px] text-gray-500 block">JOOTRH, Kisumu East</span>
              </div>
              <span className="font-mono font-bold text-teal-800 text-sm">2,740 Active</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <span className="font-bold text-gray-900">Mombasa & Coast</span>
                <span className="text-[11px] text-gray-500 block">Coast General, Port Reitz</span>
              </div>
              <span className="font-mono font-bold text-teal-800 text-sm">2,150 Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
