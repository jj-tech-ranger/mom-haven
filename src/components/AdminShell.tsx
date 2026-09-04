import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  UserCheck, 
  BookOpenCheck, 
  ShieldCheck, 
  AlertTriangle, 
  FileClock, 
  FileText, 
  Users, 
  BarChart3, 
  Settings, 
  ShieldAlert,
  ArrowRight,
  Sparkles,
  HeartPulse,
  Lock,
  PhoneCall,
  ChevronRight,
  ChevronLeft
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

type AdminTab = 
  | 'dashboard'
  | 'facilities'
  | 'clinicians'
  | 'governance'
  | 'release'
  | 'safety'
  | 'audit'
  | 'content'
  | 'emergency'
  | 'team'
  | 'reports'
  | 'settings';

interface AdminShellProps {
  onRoleSwitch?: (role: 'MOTHER' | 'PARTNER' | 'CLINICIAN' | 'ADMIN') => void;
}

export default function AdminShell({ onRoleSwitch }: AdminShellProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  const navItems: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }[] = [
    { id: 'dashboard', label: 'Operations Overview', icon: LayoutDashboard },
    { id: 'clinicians', label: 'Clinician Queue', icon: UserCheck, badge: '2 Review' },
    { id: 'facilities', label: 'KMHFL Directory', icon: Building2 },
    { id: 'governance', label: 'Clinical Decisions', icon: BookOpenCheck, badge: '8 Rules' },
    { id: 'release', label: 'Release Readiness', icon: ShieldCheck, badge: '16/16' },
    { id: 'safety', label: 'Safety Interceptor', icon: AlertTriangle, badge: '100%' },
    { id: 'audit', label: 'Audit Trail', icon: FileClock },
    { id: 'content', label: 'Superfoods & Guides', icon: FileText },
    { id: 'emergency', label: 'Emergency Hotlines', icon: PhoneCall },
    { id: 'team', label: 'Admin Team', icon: Users },
    { id: 'reports', label: 'Health Analytics', icon: BarChart3 },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* 250px Persistent Left Sidebar */}
      <aside className="w-[250px] bg-white border-r border-gray-200 flex flex-col justify-between shrink-0 sticky top-0 h-screen z-20 overflow-y-auto">
        <div>
          {/* Brand Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold text-sm">
                MH
              </div>
              <div>
                <h1 className="font-bold text-sm text-gray-900 leading-none">MomHaven</h1>
                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">MOH Admin Hub</span>
              </div>
            </div>
          </div>

          {/* Role Navigation Switcher (for development testing) */}
          {onRoleSwitch && (
            <div className="p-2.5 bg-gray-50 border-b border-gray-100">
              <span className="text-[10px] uppercase font-bold text-gray-400 block px-2 mb-1">Switch Persona</span>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => onRoleSwitch('MOTHER')}
                  className="px-2 py-1 text-[11px] font-semibold bg-white hover:bg-gray-100 text-gray-700 rounded border border-gray-200 transition-colors"
                >
                  Mother
                </button>
                <button
                  onClick={() => onRoleSwitch('PARTNER')}
                  className="px-2 py-1 text-[11px] font-semibold bg-white hover:bg-gray-100 text-gray-700 rounded border border-gray-200 transition-colors"
                >
                  Partner
                </button>
                <button
                  onClick={() => onRoleSwitch('CLINICIAN')}
                  className="px-2 py-1 text-[11px] font-semibold bg-white hover:bg-gray-100 text-gray-700 rounded border border-gray-200 transition-colors"
                >
                  Clinician
                </button>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="p-2.5 space-y-0.5">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-teal-800 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-teal-700 text-teal-100' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Pinned Admin Profile at Bottom */}
        <div className="p-3 border-t border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-teal-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              AD
            </div>
            <div className="overflow-hidden flex-1">
              <p className="font-bold text-xs text-gray-900 truncate">Dr. Amina Hassan</p>
              <p className="text-[10px] text-gray-500 truncate">MOH Super Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Sticky Bar */}
        <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-10 shadow-2xs">
          <div className="flex items-center gap-3">
            {activeTab !== 'dashboard' && (
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="p-1.5 -ml-1 rounded-lg text-teal-800 hover:bg-gray-100 flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer"
                aria-label="Back to Operations Overview"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Overview</span>
              </button>
            )}
            <h2 className="font-bold text-base text-gray-900 capitalize">
              {navItems.find(n => n.id === activeTab)?.label || activeTab}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-600" /> Least-Privilege Enforced
            </span>
          </div>

          <div className="text-xs text-gray-500">
            DPA 2019 Mode: <span className="font-semibold text-emerald-700">Encrypted & De-identified</span>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-6 flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <div className="max-w-6xl space-y-6">
              {/* Top Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div 
                  onClick={() => setActiveTab('clinicians')}
                  className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-teal-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-semibold uppercase">Pending Credentialing</span>
                    <UserCheck className="w-5 h-5 text-amber-500" />
                  </div>
                  <p className="text-2xl font-bold text-amber-600 mt-2">2 Clinicians</p>
                  <span className="text-xs text-teal-700 font-medium flex items-center gap-1 mt-1 group-hover:underline">
                    Review Queue <ChevronRight className="w-3 h-3" />
                  </span>
                </div>

                <div 
                  onClick={() => setActiveTab('facilities')}
                  className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-teal-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-semibold uppercase">KMHFL Facilities</span>
                    <Building2 className="w-5 h-5 text-teal-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-2">7 Hospitals</p>
                  <span className="text-xs text-teal-700 font-medium flex items-center gap-1 mt-1 group-hover:underline">
                    Manage Directory <ChevronRight className="w-3 h-3" />
                  </span>
                </div>

                <div 
                  onClick={() => setActiveTab('governance')}
                  className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-teal-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-semibold uppercase">Clinical Decision Rules</span>
                    <BookOpenCheck className="w-5 h-5 text-indigo-600" />
                  </div>
                  <p className="text-2xl font-bold text-indigo-600 mt-2">8 MOH 216</p>
                  <span className="text-xs text-teal-700 font-medium flex items-center gap-1 mt-1 group-hover:underline">
                    Inspect Rules <ChevronRight className="w-3 h-3" />
                  </span>
                </div>

                <div 
                  onClick={() => setActiveTab('release')}
                  className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-teal-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-semibold uppercase">Release Readiness</span>
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-bold text-emerald-600 mt-2">16 / 16 Gates (GO)</p>
                  <span className="text-xs text-teal-700 font-medium flex items-center gap-1 mt-1 group-hover:underline">
                    View Verification <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>

              {/* Release Readiness Highlight */}
              <div className="bg-linear-to-r from-teal-900 to-slate-900 text-white p-6 rounded-3xl shadow-md border border-teal-800">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-teal-300 uppercase tracking-wider bg-teal-800/60 px-2.5 py-1 rounded-full">
                      MOH 216 Platform Deployment Status
                    </span>
                    <h3 className="text-xl font-bold mt-2">System Validated for Nationwide Kenya Deployment</h3>
                    <p className="text-xs text-teal-200 mt-1 max-w-2xl leading-relaxed">
                      All clinical decision algorithms, Layer 1 safety interceptors, KMHFL health facility coordinates, and offline syncing mechanisms are fully verified and operational.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('safety')}
                    className="px-4 py-2.5 bg-teal-400 hover:bg-teal-300 text-teal-950 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                  >
                    Run Safety Benchmarks <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Actions and Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-teal-600" /> Clinician Verification Actions
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    2 healthcare professionals currently require regulatory license validation against the KMPDC and NCK registers.
                  </p>
                  <button
                    onClick={() => setActiveTab('clinicians')}
                    className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-teal-800 font-semibold rounded-xl text-xs border border-gray-200 transition-colors"
                  >
                    Open Credentialing Workspace
                  </button>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <FileClock className="w-4 h-4 text-teal-600" /> Cryptographic Audit Trails
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    All clinician verifications, ephemeral sessions, and AI safety escalations are signed with immutable SHA-256 hashes.
                  </p>
                  <button
                    onClick={() => setActiveTab('audit')}
                    className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-teal-800 font-semibold rounded-xl text-xs border border-gray-200 transition-colors"
                  >
                    View Platform Audit Trail
                  </button>
                </div>
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
