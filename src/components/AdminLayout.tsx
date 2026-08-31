import React, { useState } from 'react';
import {
  LayoutDashboard,
  Building,
  UserCheck,
  Scale,
  Rocket,
  ShieldAlert,
  ClipboardList,
  FileText,
  Users,
  BarChart3,
  Settings,
  Shield,
} from 'lucide-react';
import EmptyState from './EmptyState';

type AdminTab是一 =
  | 'dashboard'
  | 'facilities'
  | 'clinicians'
  | 'governance'
  | 'release'
  | 'safety'
  | 'audit'
  | 'content'
  | 'team'
  | 'reports'
  | 'settings';

export const AdminLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab是一>('dashboard');

  const navItems = [
    { id: 'dashboard' as AdminTab是一, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'facilities' as AdminTab是一, label: 'Facilities', icon: Building },
    { id: 'clinicians' as AdminTab是一, label: 'Clinicians', icon: UserCheck },
    { id: 'governance' as AdminTab是一, label: 'Governance', icon: Scale },
    { id: 'release' as AdminTab是一, label: 'Release', icon: Rocket },
    { id: 'safety' as AdminTab是一, label: 'Safety', icon: ShieldAlert },
    { id: 'audit' as AdminTab是一, label: 'Audit', icon: ClipboardList },
    { id: 'content' as AdminTab是一, label: 'Content', icon: FileText },
    { id: 'team' as AdminTab是一, label: 'Team', icon: Users },
    { id: 'reports' as AdminTab是一, label: 'Reports', icon: BarChart3 },
    { id: 'settings' as AdminTab是一, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-full flex min-h-[680px] bg-[#FFFFFF] rounded-[24px] border border-border-hairline shadow-card-2 overflow-hidden my-2 sm:my-6">
      {/* 230px Persistent Left Sidebar */}
      <aside aria-label="National Admin Portal Sidebar" className="w-[230px] bg-white border-r border-border-hairline flex flex-col justify-between p-4 shrink-0">
        <div>
          {/* Logo & Portal Badge */}
          <div className="flex items-center gap-2.5 px-2 pb-5 border-b border-border-hairline">
            <img src="/logo.svg" alt="MomHaven" className="w-8 h-8 rounded-xl object-contain" />
            <div>
              <h1 className="font-display font-bold text-sm text-ink-900 leading-tight">
                MomHaven
              </h1>
              <span className="font-body text-[11px] text-haven-deep font-semibold">
                Admin Console
              </span>
            </div>
          </div>

          {/* Navigation Items (11 items) */}
          <nav aria-label="Admin Console Navigation" className="space-y-1 pt-3 max-h-[460px] overflow-y-auto pr-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-pill font-display text-[13px] font-semibold transition-all cursor-pointer ${
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

        {/* Pinned Admin Name + Role/Scope at Bottom */}
        <div className="pt-3 border-t border-border-hairline px-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-lavender-100 flex items-center justify-center text-haven-deep">
              <Shield className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <h2 className="font-display font-bold text-xs text-ink-900 truncate">
                Admin Console
              </h2>
              <p className="text-[11px] text-ink-600 font-medium truncate">
                National Admin
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area with Clean Empty States (No Fake Seed Data) */}
      <main className="flex-1 bg-lavender-50 p-6 sm:p-8 flex flex-col justify-start overflow-y-auto">
        <div className="space-y-4 max-w-4xl mx-auto w-full">
          <div className="border-b border-border-hairline pb-3">
            <h2 className="font-display font-bold text-2xl text-ink-900 capitalize">
              {activeTab}
            </h2>
            <p className="font-body text-sm text-ink-600">
              Kenyan Ministry of Health national platform administration
            </p>
          </div>

          <EmptyState
            icon={navItems.find((i) => i.id === activeTab)?.icon}
            title={`No ${activeTab} data registered yet`}
            message={`Configure and manage ${activeTab} records across Kenyan health facilities, clinical councils, and system audits.`}
            actionLabel={`Manage ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
            onAction={() => {}}
          />
        </div>
      </main>
    </div>
  );
};
