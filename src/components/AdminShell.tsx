import React, { useMemo, useState } from 'react';
import { auth } from '../lib/firebase';
import {
  LayoutDashboard, Building2, UserCheck, BookOpenCheck, ShieldCheck, AlertTriangle,
  FileClock, FileText, Users, BarChart3, Settings, ShieldAlert, PhoneCall, ChevronRight
} from 'lucide-react';
import { CredentialingQueue } from './admin/CredentialingQueue';
import { FacilitiesDirectory } from './admin/FacilitiesDirectory';
import { ClinicalDecisionRegister } from './admin/ClinicalDecisionRegister';
import { ReleaseReadinessDashboard } from './admin/ReleaseReadinessDashboard';
import { SafetyMonitoring } from './admin/SafetyMonitoring';
import { PlatformAuditLog } from './admin/PlatformAuditLog';
import { ContentLibrary } from './admin/ContentLibrary';
import { EmergencyFacilityConfig } from './admin/EmergencyFacilityConfig';
import { AdminTeamMembers } from './admin/AdminTeamMembers';
import { PlatformAnalytics } from './admin/PlatformAnalytics';
import { SystemSettings } from './admin/SystemSettings';

type AdminTab = 'dashboard' | 'facilities' | 'clinicians' | 'governance' | 'release' | 'safety' | 'audit' | 'content' | 'emergency' | 'team' | 'reports' | 'settings';

interface AdminShellProps {
  onRoleSwitch?: (role: 'MOTHER' | 'PARTNER' | 'CLINICIAN' | 'ADMIN') => void;
}

export default function AdminShell({ onRoleSwitch: _onRoleSwitch }: AdminShellProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const user = auth.currentUser;
  const displayName = user?.displayName?.trim() || user?.email?.split('@')[0] || 'Administrator';
  const initials = useMemo(() => displayName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase(), [displayName]);

  const navItems: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Operations Overview', icon: LayoutDashboard },
    { id: 'clinicians', label: 'Clinician Queue', icon: UserCheck },
    { id: 'facilities', label: 'KMHFL Directory', icon: Building2 },
    { id: 'governance', label: 'Clinical Decisions', icon: BookOpenCheck },
    { id: 'release', label: 'Release Readiness', icon: ShieldCheck },
    { id: 'safety', label: 'Safety Interceptor', icon: AlertTriangle },
    { id: 'audit', label: 'Audit Trail', icon: FileClock },
    { id: 'content', label: 'Superfoods & Guides', icon: FileText },
    { id: 'emergency', label: 'Emergency Hotlines', icon: PhoneCall },
    { id: 'team', label: 'Admin Team', icon: Users },
    { id: 'reports', label: 'Health Analytics', icon: BarChart3 },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <aside className="w-[250px] bg-white border-r border-gray-200 flex flex-col shrink-0 sticky top-0 h-screen z-20 overflow-y-auto">
        <div>
          <div className="p-4 border-b border-gray-100 flex items-center gap-2.5">
            <img src="/logo.svg" alt="MomHaven" className="w-8 h-8 rounded-xl object-contain" />
            <div>
              <h1 className="font-bold text-sm text-gray-900 leading-none">MomHaven</h1>
              <span className="text-[10px] font-bold text-[var(--haven-deep)] uppercase tracking-wider">MOH Admin Hub</span>
            </div>
          </div>
          <nav className="p-2.5 space-y-0.5">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button key={item.id} type="button" onClick={() => setActiveTab(item.id)} className={`w-full flex items-center px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-[var(--haven-deep)] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                  <Icon className={`w-4 h-4 mr-2.5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto p-3 border-t border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[var(--haven-deep)] text-white flex items-center justify-center font-bold text-xs">{initials || 'AD'}</div>
            <div className="overflow-hidden flex-1">
              <p className="font-bold text-xs text-gray-900 truncate">{displayName}</p>
              <p className="text-[10px] text-gray-500 truncate">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-10 shadow-2xs">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-base text-gray-900">{navItems.find(n => n.id === activeTab)?.label || activeTab}</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold flex items-center gap-1"><ShieldAlert className="w-3 h-3 text-amber-600" /> Least-Privilege Enforced</span>
          </div>
          <div className="text-xs text-gray-500">DPA 2019 Mode: <span className="font-semibold text-emerald-700">Encrypted & De-identified</span></div>
        </header>

        <main className="p-6 flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <div className="max-w-6xl space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--lavender-100)] flex items-center justify-center"><ShieldCheck className="w-6 h-6 text-[var(--haven-orchid)]" /></div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Welcome, {displayName}</h3>
                    <p className="text-sm text-gray-600 mt-1 max-w-2xl">The Admin Hub is connected to your authenticated MomHaven account. Operational figures appear only when backed by live platform data.</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button type="button" onClick={() => setActiveTab('clinicians')} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-left hover:border-[var(--haven-orchid)] transition-colors">
                  <UserCheck className="w-5 h-5 text-[var(--haven-orchid)]" /><h4 className="font-bold text-gray-900 text-sm mt-3">Clinician verification</h4><p className="text-xs text-gray-600 mt-1">Open the credentialing workspace. Only real submitted records should appear here.</p><ChevronRight className="w-4 h-4 text-gray-400 mt-4" />
                </button>
                <button type="button" onClick={() => setActiveTab('audit')} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-left hover:border-[var(--haven-orchid)] transition-colors">
                  <FileClock className="w-5 h-5 text-[var(--haven-orchid)]" /><h4 className="font-bold text-gray-900 text-sm mt-3">Platform audit trail</h4><p className="text-xs text-gray-600 mt-1">Audit events will be shown from the live audit store, never from seeded demo records.</p><ChevronRight className="w-4 h-4 text-gray-400 mt-4" />
                </button>
              </div>
            </div>
          )}
          {activeTab === 'clinicians' && <CredentialingQueue />}
          {activeTab === 'facilities' && <FacilitiesDirectory />}
          {activeTab === 'governance' && <ClinicalDecisionRegister />}
          {activeTab === 'release' && <ReleaseReadinessDashboard />}
          {activeTab === 'safety' && <SafetyMonitoring />}
          {activeTab === 'audit' && <PlatformAuditLog />}
          {activeTab === 'content' && <ContentLibrary />}
          {activeTab === 'emergency' && <EmergencyFacilityConfig />}
          {activeTab === 'team' && <AdminTeamMembers />}
          {activeTab === 'reports' && <PlatformAnalytics />}
          {activeTab === 'settings' && <SystemSettings />}
        </main>
      </div>
    </div>
  );
}
