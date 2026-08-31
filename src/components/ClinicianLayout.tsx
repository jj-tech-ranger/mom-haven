import React, { useState } from 'react';
import {
  LayoutDashboard,
  KeyRound,
  Users,
  ClipboardList,
  Building2,
  UserCheck,
  Search,
} from 'lucide-react';
import EmptyState from './EmptyState';

type ClinicianTab = 'dashboard' | 'access' | 'patients' | 'audit';

export const ClinicianLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ClinicianTab>('dashboard');

  const navItems = [
    { id: 'dashboard' as ClinicianTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'access' as ClinicianTab, label: 'Patient Access', icon: KeyRound },
    { id: 'patients' as ClinicianTab, label: 'Patients', icon: Users },
    { id: 'audit' as ClinicianTab, label: 'Audit', icon: ClipboardList },
  ];

  return (
    <div className="w-full flex min-h-[640px] bg-[#FFFFFF] rounded-[24px] border border-border-hairline shadow-card-2 overflow-hidden my-2 sm:my-6">
      {/* 230px Persistent Left Sidebar (White background) */}
      <aside aria-label="Clinician Workspace Sidebar" className="w-[230px] bg-white border-r border-border-hairline flex flex-col justify-between p-4 shrink-0">
        <div>
          {/* Logo & Portal Badge */}
          <div className="flex items-center gap-2.5 px-2 pb-6 border-b border-border-hairline">
            <img src="/logo.svg" alt="MomHaven" className="w-8 h-8 rounded-xl object-contain" />
            <div>
              <h1 className="font-display font-bold text-sm text-ink-900 leading-tight">
                MomHaven
              </h1>
              <span className="font-body text-[11px] text-haven-deep font-semibold">
                Clinician Portal
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav aria-label="Clinician Workspace Navigation" className="space-y-1.5 pt-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-pill font-display text-[14px] font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-lavender-100 text-haven-deep'
                      : 'text-ink-600 hover:text-ink-900 hover:bg-lavender-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-haven-deep' : 'text-ink-600'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Pinned Clinician Name + Facility Name at Bottom */}
        <div className="pt-4 border-t border-border-hairline px-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-lavender-100 flex items-center justify-center text-haven-deep">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <h2 className="font-display font-bold text-xs text-ink-900 truncate">
                Clinical Session
              </h2>
              <div className="flex items-center gap-1 text-[11px] text-ink-600 truncate">
                <Building2 className="w-3 h-3 shrink-0" />
                <span className="truncate">Active Health Facility</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area with Clean Empty States (No Fake Patients) */}
      <main className="flex-1 bg-lavender-50 p-6 sm:p-8 flex flex-col justify-start overflow-y-auto">
        {activeTab === 'dashboard' && (
          <div className="space-y-4 max-w-4xl mx-auto w-full">
            <div className="border-b border-border-hairline pb-3">
              <h2 className="font-display font-bold text-2xl text-ink-900">
                Dashboard
              </h2>
              <p className="font-body text-sm text-ink-600">
                Active clinical session overview and quick actions
              </p>
            </div>
            <EmptyState
              icon={LayoutDashboard}
              title="No active clinical consultations"
              message="Enter a mother's 6-character clinic share code to begin reviewing antenatal records, recording ANC contacts, and signing verifications."
              actionLabel="Enter Patient Share Code"
              onAction={() => setActiveTab('access')}
            />
          </div>
        )}

        {activeTab === 'access' && (
          <div className="space-y-4 max-w-4xl mx-auto w-full">
            <div className="border-b border-border-hairline pb-3">
              <h2 className="font-display font-bold text-2xl text-ink-900">
                Patient Access
              </h2>
              <p className="font-body text-sm text-ink-600">
                Temporary, mother-authorized 15-minute access sessions
              </p>
            </div>
            <EmptyState
              icon={KeyRound}
              title="Patient Access Code Required"
              message="Ask the patient to open their MomHaven app and tap 'Share Code'. Enter the 6-character PIN to unlock temporary, audited clinical read/write access."
              actionLabel="Enter 6-Character Code"
              onAction={() => {}}
            />
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="space-y-4 max-w-4xl mx-auto w-full">
            <div className="border-b border-border-hairline pb-3">
              <h2 className="font-display font-bold text-2xl text-ink-900">
                Patients
              </h2>
              <p className="font-body text-sm text-ink-600">
                MCH registry and verified encounter records
              </p>
            </div>
            <EmptyState
              icon={Users}
              title="No patient records in current session"
              message="Patients will appear here once authenticated via temporary access grants or official facility registration."
              actionLabel="Search KMHFL Registry"
              onAction={() => {}}
            />
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-4 max-w-4xl mx-auto w-full">
            <div className="border-b border-border-hairline pb-3">
              <h2 className="font-display font-bold text-2xl text-ink-900">
                Audit Log
              </h2>
              <p className="font-body text-sm text-ink-600">
                Immutable record of clinical verifications and data access
              </p>
            </div>
            <EmptyState
              icon={ClipboardList}
              title="No audit events recorded yet"
              message="All record access grants, clinical updates, and signature events will be chronologically logged here."
            />
          </div>
        )}
      </main>
    </div>
  );
};
