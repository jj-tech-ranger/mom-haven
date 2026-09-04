import React, { useState } from 'react';
import { Home, Milestone, MessageSquare, FileText, User, LogOut, type LucideIcon } from 'lucide-react';
import EmptyState from './EmptyState';
import PersonalizedToday from './today/PersonalizedToday';
import HealthTrends from './health/HealthTrends';
import WellbeingTrends from './journey/WellbeingTrends';
import MotherRecordsView from './records/MotherRecordsView';
import HavenChatView from './haven/HavenChatView';
import MotherProfileSettings from './profile/MotherProfileSettings';
import AppLockPinModal from './profile/AppLockPinModal';
import PartnerSharingModal from './profile/PartnerSharingModal';
import PrintExportModal from './records/PrintExportModal';
import EmergencySafetyHub from './emergency/EmergencySafetyHub';

type MotherTab = 'today' | 'journey' | 'haven' | 'records' | 'profile';
interface MotherShellProps { userId?: string; userEmail?: string; userName?: string; onSignOut?: () => void; }

const tabs: { id: MotherTab; label: string; icon: LucideIcon }[] = [
  { id: 'today', label: 'Today', icon: Home },
  { id: 'journey', label: 'Journey', icon: Milestone },
  { id: 'haven', label: 'Haven', icon: MessageSquare },
  { id: 'records', label: 'Records', icon: FileText },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function MotherShell({ userId, userName, userEmail, onSignOut }: MotherShellProps) {
  const [activeTab, setActiveTab] = useState<MotherTab>('today');
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showPartnerShare, setShowPartnerShare] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showEmergencyHub, setShowEmergencyHub] = useState(false);
  const [havenInitialPrompt, setHavenInitialPrompt] = useState<string | undefined>();

  const current = tabs.find(t => t.id === activeTab) || tabs[0];
  const Icon = current.icon;
  const navigate = (tab: 'haven' | 'journey' | 'records' | 'profile') => setActiveTab(tab);

  const handleOpenAskHaven = (prompt?: string) => {
    setHavenInitialPrompt(prompt);
    setActiveTab('haven');
  };

  return <div className="min-h-screen bg-[var(--lavender-50)] text-[var(--ink-900)] pb-20">
    <header className="sticky top-0 z-20 border-b border-[var(--border-hairline)] bg-white/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
        <div className="min-w-0"><p className="text-[10px] uppercase tracking-wider font-display font-bold text-[var(--haven-orchid)]">MomHaven</p><h1 className="truncate font-display text-lg font-extrabold">{activeTab === 'today' ? `Hello, ${userName || 'Mama'}` : current.label}</h1>{userEmail && activeTab !== 'today' && <p className="truncate text-[11px] text-[var(--ink-500)]">{userEmail}</p>}</div>
        {onSignOut && <button type="button" onClick={onSignOut} aria-label="Sign out" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--lavender-50)] hover:bg-[var(--lavender-100)]"><LogOut className="h-4 w-4" /></button>}
      </div>
    </header>

    <main className={`mx-auto max-w-lg ${activeTab === 'haven' ? 'p-0' : 'p-4 sm:p-5'}`}>
      {activeTab === 'today' && userId ? (
        <PersonalizedToday 
          userId={userId} 
          userName={userName} 
          onNavigate={navigate} 
          onOpenAskHaven={handleOpenAskHaven}
        />
      ) : activeTab === 'today' ? (
        <EmptyState icon={Icon} title="Sign in to see your journey" message="Your personalized MomHaven home appears after your account is connected." />
      ) : activeTab === 'journey' && userId ? (
        <div className="space-y-6">
          <WellbeingTrends userId={userId} onNavigateToday={() => setActiveTab('today')} />
          <HealthTrends userId={userId} />
        </div>
      ) : activeTab === 'journey' ? (
        <EmptyState icon={Icon} title="Sign in to see your journey" message="Your health trends and journey timeline appear after your account is connected." />
      ) : activeTab === 'haven' && userId ? (
        <HavenChatView
          userId={userId}
          initialPrompt={havenInitialPrompt}
          onOpenEmergencyHub={() => setShowEmergencyHub(true)}
          onTriggerEmergency={() => setShowEmergencyHub(true)}
        />
      ) : activeTab === 'haven' ? (
        <EmptyState icon={Icon} title="Sign in to talk with Haven" message="Your clinical AI companion appears after your account is connected." />
      ) : activeTab === 'records' && userId ? (
        <MotherRecordsView userId={userId} userName={userName} />
      ) : activeTab === 'records' ? (
        <EmptyState icon={Icon} title="Sign in to see your records" message="Your clinical records and health passport appear after your account is connected." />
      ) : activeTab === 'profile' && userId ? (
        <MotherProfileSettings
          userId={userId}
          motherName={userName || 'Mama'}
          email={userEmail || ''}
          onOpenPinSetup={() => setShowPinSetup(true)}
          onOpenPartnerShare={() => setShowPartnerShare(true)}
          onOpenExportData={() => setShowExportModal(true)}
          onSignOut={onSignOut || (() => {})}
        />
      ) : activeTab === 'profile' ? (
        <EmptyState icon={Icon} title="Sign in to see your profile" message="Your profile settings and connected access appear after your account is connected." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border-hairline)] bg-white shadow-card-1">
          <EmptyState icon={Icon} title={`No ${current.label.toLowerCase()} data yet`} message="Your records and connected health information will appear here as you add or connect them." />
        </div>
      )}
    </main>

    {/* Modals triggered from Haven or Profile */}
    {showPinSetup && (
      <AppLockPinModal
        onClose={() => setShowPinSetup(false)}
        onPinConfigured={() => setShowPinSetup(false)}
      />
    )}

    {showPartnerShare && (
      <PartnerSharingModal
        motherId={userId || ''}
        motherName={userName || 'Mama'}
        onClose={() => setShowPartnerShare(false)}
      />
    )}

    {showExportModal && (
      <PrintExportModal
        motherName={userName || 'Mama'}
        pregnancySummary={null}
        onClose={() => setShowExportModal(false)}
      />
    )}

    {showEmergencyHub && (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-[var(--lavender-50)]">
        <EmergencySafetyHub onClose={() => setShowEmergencyHub(false)} />
      </div>
    )}

    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-[var(--border-hairline)] bg-white/95 backdrop-blur" aria-label="Main navigation"><div className="mx-auto flex h-16 max-w-lg items-center justify-around">{tabs.map(tab => { const TabIcon = tab.icon; const active = activeTab === tab.id; return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} aria-current={active ? 'page' : undefined} className={`flex min-w-[56px] flex-col items-center gap-1 rounded-xl px-3 py-2 transition-colors ${active ? 'text-[var(--haven-deep)]' : 'text-[var(--ink-400)] hover:text-[var(--ink-700)]'}`}><TabIcon className="h-5 w-5" /><span className="text-[10px] font-display font-bold">{tab.label}</span></button>; })}</div></nav>
  </div>;
}
