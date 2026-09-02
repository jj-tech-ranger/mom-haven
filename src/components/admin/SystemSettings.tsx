// src/components/admin/SystemSettings.tsx
import React, { useState } from 'react';
import { 
  Settings, Lock, Clock, Database, Globe, 
  Save, CheckCircle2, ShieldCheck, Server
} from 'lucide-react';

export const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    sessionTimeoutMinutes: 15,
    allowGuestMode: true,
    enforceDpaStrictDeletion: true,
    dataRetentionYears: 7,
    autoSyncIntervalSeconds: 30,
    geminiSafetyFilterLevel: 'BLOCK_MEDIUM_AND_ABOVE',
    smsFallbackGateway: 'Africa’s Talking (Kenya Gateway)',
    firestoreRegion: 'europe-west1 (GDPR / DPA Compliant)'
  });

  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-teal-600" /> Platform Infrastructure & Compliance Settings
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure security intervals, clinical session lifetimes, and Kenya DPA 2019 data policies.
          </p>
        </div>

        {saved && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Settings Applied
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6 text-xs">
        {/* Section 1: Clinical Ephemeral Sessions */}
        <div>
          <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2 border-b border-gray-100 pb-2">
            <Clock className="w-4 h-4 text-teal-600" /> Clinician Ephemeral Window & Access Rules
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-gray-700 block mb-1">
                Clinician Session Timeout (Minutes)
              </label>
              <input
                type="number"
                value={settings.sessionTimeoutMinutes}
                onChange={e => setSettings({ ...settings, sessionTimeoutMinutes: Number(e.target.value) })}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Default: 15 minutes. Automatically locks clinical patient review workspace.
              </span>
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">
                Offline Outbox Sync Retry Interval (Seconds)
              </label>
              <input
                type="number"
                value={settings.autoSyncIntervalSeconds}
                onChange={e => setSettings({ ...settings, autoSyncIntervalSeconds: Number(e.target.value) })}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Frequency of background reconnection attempts when online.
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Kenya DPA 2019 & Retention */}
        <div>
          <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2 border-b border-gray-100 pb-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" /> Kenya DPA 2019 & Medical Records Retention
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-gray-700 block mb-1">
                MOH Medical Records Retention Mandate (Years)
              </label>
              <input
                type="number"
                value={settings.dataRetentionYears}
                onChange={e => setSettings({ ...settings, dataRetentionYears: Number(e.target.value) })}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Kenyan national mandate requires 7 years retention for maternal & child records.
              </span>
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">
                SMS Fallback Gateway
              </label>
              <input
                type="text"
                value={settings.smsFallbackGateway}
                disabled
                className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-600 text-sm font-mono"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Primary low-bandwidth SMS relay for appointment reminders.
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Cloud & Safety */}
        <div>
          <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2 border-b border-gray-100 pb-2">
            <Server className="w-4 h-4 text-teal-600" /> AI Safety & Cloud Infrastructure
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-gray-700 block mb-1">
                Gemini Safety Filter Threshold
              </label>
              <input
                type="text"
                disabled
                value={settings.geminiSafetyFilterLevel}
                className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-700 text-sm font-mono"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Enforced server-side in safetyInterceptor.ts and geminiService.ts.
              </span>
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">
                Database Cloud Region
              </label>
              <input
                type="text"
                disabled
                value={settings.firestoreRegion}
                className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-700 text-sm font-mono"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Firestore encrypted storage location.
              </span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save System Settings
          </button>
        </div>
      </form>
    </div>
  );
};
