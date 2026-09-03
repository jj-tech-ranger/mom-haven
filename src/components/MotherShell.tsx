import React, { useState } from 'react';
import { Home, Milestone, MessageSquare, FileText, User, LogOut } from 'lucide-react';
import EmptyState from './EmptyState';

type MotherTab = 'today' | 'journey' | 'haven' | 'records' | 'profile';
interface MotherShellProps { userId?: string; userEmail?: string; userName?: string; onSignOut?: () => void; }

const tabs: { id: MotherTab; label: string; icon: React.ElementType }[] = [
  { id: 'today', label: 'Today', icon: Home }, { id: 'journey', label: 'Journey', icon: Milestone }, { id: 'haven', label: 'Haven', icon: MessageSquare }, { id: 'records', label: 'Records', icon: FileText }, { id: 'profile', label: 'Profile', icon: User },
];

export default function MotherShell({ userName, userEmail, onSignOut }: MotherShellProps) {
  const [activeTab, setActiveTab] = useState<MotherTab>('today');
  const current = tabs.find(t => t.id === activeTab) || tabs[0];
  const Icon = current.icon;
  return <div className="min-h-screen bg-[var(--lavender-50)] text-[var(--ink-900)] pb-20"><header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-[var(--border-hairline)] px-4 py-3 flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-wider font-display font-bold text-[var(--haven-orchid)]">MomHaven</p><h1 className="font-display font-extrabold text-lg">{userName || 'Mother View'}</h1>{userEmail && <p className="text-[11px] text-[var(--ink-500)]">{userEmail}</p>}</div>{onSignOut && <button type="button" onClick={onSignOut} aria-label="Sign out" className="w-9 h-9 rounded-full bg-[var(--lavender-50)] flex items-center justify-center cursor-pointer"><LogOut className="w-4 h-4" /></button>}</header><main className="max-w-lg mx-auto p-4"><div className="bg-white rounded-2xl border border-[var(--border-hairline)] shadow-card-1 overflow-hidden"><EmptyState icon={Icon} title={activeTab === 'today' ? 'No health data yet' : `No ${current.label.toLowerCase()} data yet`} message="This account has no seeded pregnancy, child, appointment, clinical, or personal records. Live data will appear here after it is created or connected." /></div></main><nav className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-[var(--border-hairline)]"><div className="max-w-lg mx-auto h-16 flex items-center justify-around">{tabs.map(tab => { const TabIcon = tab.icon; return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl cursor-pointer ${activeTab === tab.id ? 'text-[var(--haven-deep)]' : 'text-[var(--ink-400)]'}`}><TabIcon className="w-5 h-5" /><span className="text-[10px] font-display font-bold">{tab.label}</span></button>; })}</div></nav></div>;
}
