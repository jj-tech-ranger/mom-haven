import React, { useState } from 'react';
import { LayoutDashboard, KeyRound, Stethoscope, ClipboardList, LogOut, type LucideIcon } from 'lucide-react';
import EmptyState from './EmptyState';

type ClinicianTab = 'dashboard' | 'access' | 'workspace' | 'audit';
interface ClinicianShellProps { clinicianId?: string; clinicianName?: string; facilityName?: string; onSignOut?: () => void; }
const tabs: { id: ClinicianTab; label: string; icon: LucideIcon; description: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Clinical overview' },
  { id: 'access', label: 'Patient Access', icon: KeyRound, description: 'Authorized patient connections' },
  { id: 'workspace', label: 'Workspace', icon: Stethoscope, description: 'Clinical workspace' },
  { id: 'audit', label: 'Audit', icon: ClipboardList, description: 'Access and activity audit' },
];

export default function ClinicianShell({ clinicianName, facilityName, onSignOut }: ClinicianShellProps) {
  const [activeTab, setActiveTab] = useState<ClinicianTab>('dashboard');
  const current = tabs.find(t => t.id === activeTab) || tabs[0];
  const Icon = current.icon;
  return <div className="min-h-screen bg-[var(--lavender-50)] text-[var(--ink-900)]">
    <div className="min-h-screen flex">
      <aside className="hidden md:flex w-72 shrink-0 bg-white border-r border-[var(--border-hairline)] flex-col sticky top-0 h-screen">
        <div className="px-6 py-6 border-b border-[var(--border-hairline)]">
          <p className="text-[11px] uppercase tracking-[0.18em] font-display font-bold text-[var(--haven-orchid)]">MomHaven Clinical</p>
          <h1 className="mt-2 font-display font-extrabold text-xl">Clinician Portal</h1>
          <p className="mt-1 text-xs text-[var(--ink-500)]">Verified clinical workspace</p>
        </div>
        <nav className="p-4 space-y-1 flex-1" aria-label="Clinician navigation">
          {tabs.map(tab => { const TabIcon = tab.icon; const active = activeTab === tab.id; return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left cursor-pointer ${active ? 'bg-[var(--lavender-50)] text-[var(--haven-deep)]' : 'text-[var(--ink-600)] hover:bg-[var(--lavender-50)]'}`}><TabIcon className="w-5 h-5 shrink-0" /><span><span className="block text-sm font-display font-bold">{tab.label}</span><span className="block text-[11px] text-[var(--ink-400)]">{tab.description}</span></span></button>; })}
        </nav>
        <div className="p-4 border-t border-[var(--border-hairline)]">
          <div className="px-3 py-3 mb-3 rounded-xl bg-[var(--lavender-50)]"><p className="text-sm font-display font-bold truncate">{clinicianName || 'Verified clinician'}</p>{facilityName && <p className="text-[11px] text-[var(--ink-500)] truncate mt-1">{facilityName}</p>}</div>
          {onSignOut && <button type="button" onClick={onSignOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-display font-bold text-[var(--ink-500)] hover:bg-[var(--lavender-50)] cursor-pointer"><LogOut className="w-4 h-4" />Sign out</button>}
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-[var(--border-hairline)] px-5 md:px-8 py-4 flex items-center justify-between">
          <div><p className="text-[10px] uppercase tracking-wider font-display font-bold text-[var(--haven-orchid)]">{current.description}</p><h2 className="font-display font-extrabold text-lg md:text-xl">{current.label}</h2></div>
          <div className="flex items-center gap-3">{facilityName && <span className="hidden sm:inline text-xs text-[var(--ink-500)]">{facilityName}</span>}{onSignOut && <button type="button" onClick={onSignOut} aria-label="Sign out" className="w-9 h-9 rounded-full bg-[var(--lavender-50)] flex items-center justify-center cursor-pointer"><LogOut className="w-4 h-4" /></button>}</div>
        </header>
        <main className="max-w-6xl mx-auto p-5 md:p-8">
          <div className="bg-white rounded-2xl border border-[var(--border-hairline)] shadow-card-1 overflow-hidden"><EmptyState icon={Icon} title={`No ${current.label.toLowerCase()} data yet`} message="Clinical records, patient connections, encounters, verification events, and audit entries will appear here only when they exist in the live clinical data source. No patient or clinician activity is preloaded." /></div>
        </main>
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-[var(--border-hairline)]"><div className="h-16 flex items-center justify-around">{tabs.map(tab => { const TabIcon = tab.icon; return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl cursor-pointer ${activeTab === tab.id ? 'text-[var(--haven-deep)]' : 'text-[var(--ink-400)]'}`}><TabIcon className="w-5 h-5" /><span className="text-[10px] font-display font-bold">{tab.label}</span></button>; })}</div></nav>
      </div>
    </div>
  </div>;
}
