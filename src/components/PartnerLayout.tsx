import React, { useState } from 'react';
import {
  Home,
  HeartHandshake,
  CalendarCheck,
  AlertTriangle,
  User,
  ShieldAlert,
} from 'lucide-react';
import EmptyState from './EmptyState';

interface PartnerLayoutProps {
  onOpenEmergency: () => void;
}

type PartnerTab = 'home' | 'support' | 'birthplan' | 'emergency' | 'profile';

export const PartnerLayout: React.FC<PartnerLayoutProps> = ({
  onOpenEmergency,
}) => {
  const [activeTab, setActiveTab] = useState<PartnerTab>('home');

  return (
    <div className="w-full flex justify-center py-2 sm:py-6 px-2">
      {/* Mobile Shell Container */}
      <div className="w-full max-w-[420px] bg-[#FFFFFF] rounded-[32px] border border-border-hairline shadow-card-2 overflow-hidden flex flex-col min-h-[720px] relative">
        {/* Mobile Top Header */}
        <header className="bg-white px-5 pt-4 pb-3 border-b border-border-hairline flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="MomHaven Logo" className="w-8 h-8 rounded-xl object-contain" />
            <div>
              <h1 className="font-display font-bold text-base leading-none text-ink-900">
                Partner Companion
              </h1>
              <span className="font-body text-[11px] text-ink-600">
                Maternal & Family Support
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-lavender-100 px-2.5 py-1 rounded-pill text-[11px] font-display font-semibold text-haven-deep">
            <ShieldAlert className="w-3.5 h-3.5 text-haven-deep" />
            <span>Strict Privacy Wall</span>
          </div>
        </header>

        {/* Scrollable View Area - Genuine Empty States (No Fake Records) */}
        <div className="flex-1 overflow-y-auto pb-24 px-4 pt-4">
          {activeTab === 'home' && (
            <div className="space-y-4">
              <div className="text-center pt-2 pb-1">
                <h2 className="font-display font-bold text-2xl text-ink-900">
                  Home
                </h2>
                <p className="font-body text-xs text-ink-600">
                  Partner dashboard & daily support checklist
                </p>
              </div>
              <EmptyState
                icon={Home}
                title="No active connection"
                message="Connect with your partner using their private connection code to view birth logistics and supportive checklists."
                actionLabel="Enter Connection Code"
                onAction={() => {}}
              />
            </div>
          )}

          {activeTab === 'support' && (
            <div className="space-y-4">
              <div className="text-center pt-2 pb-1">
                <h2 className="font-display font-bold text-2xl text-ink-900">
                  Support
                </h2>
                <p className="font-body text-xs text-ink-600">
                  Care guidance, nutrition tips & emotional support
                </p>
              </div>
              <EmptyState
                icon={HeartHandshake}
                title="Support guide will appear once connected"
                message="Practical ways to support your partner during ANC contacts, labor preparation, and postpartum recovery."
              />
            </div>
          )}

          {activeTab === 'birthplan' && (
            <div className="space-y-4">
              <div className="text-center pt-2 pb-1">
                <h2 className="font-display font-bold text-2xl text-ink-900">
                  Birth Plan
                </h2>
                <p className="font-body text-xs text-ink-600">
                  Hospital logistics, transport & emergency readiness
                </p>
              </div>
              <EmptyState
                icon={CalendarCheck}
                title="No birth plan recorded yet"
                message="Coordinate hospital bag essentials, transport arrangements, and emergency blood donor contacts."
                actionLabel="Create Birth Plan"
                onAction={() => {}}
              />
            </div>
          )}

          {activeTab === 'emergency' && (
            <div className="space-y-4">
              <div className="text-center pt-2 pb-1">
                <h2 className="font-display font-bold text-2xl text-ink-900">
                  Emergency
                </h2>
                <p className="font-body text-xs text-ink-600">
                  Kenyan emergency hotlines & maternal danger signs
                </p>
              </div>
              <EmptyState
                icon={AlertTriangle}
                title="Emergency Protocols"
                message="Access 24/7 national ambulances (1199 / 999) and recognize MOH 216 danger signs instantly."
                actionLabel="Open Emergency Triage"
                onAction={onOpenEmergency}
              />
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="text-center pt-2 pb-1">
                <h2 className="font-display font-bold text-2xl text-ink-900">
                  Profile
                </h2>
                <p className="font-body text-xs text-ink-600">
                  Partner account & contact information
                </p>
              </div>
              <EmptyState
                icon={User}
                title="Partner Profile"
                message="Manage your notification preferences and emergency contact numbers."
                actionLabel="Edit Details"
                onAction={() => {}}
              />
            </div>
          )}
        </div>

        {/* Bottom Navigation (5 items: Home, Support, Birth Plan, Emergency, Profile) */}
        <nav aria-label="Partner Navigation" className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-border-hairline px-2 py-2.5 z-30 flex items-center justify-around">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-pill transition-colors cursor-pointer ${
              activeTab === 'home'
                ? 'text-haven-deep font-display font-bold'
                : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
            <span className="text-[11px] font-display">Home</span>
          </button>

          <button
            onClick={() => setActiveTab('support')}
            className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-pill transition-colors cursor-pointer ${
              activeTab === 'support'
                ? 'text-haven-deep font-display font-bold'
                : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            <HeartHandshake className={`w-5 h-5 ${activeTab === 'support' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
            <span className="text-[11px] font-display">Support</span>
          </button>

          <button
            onClick={() => setActiveTab('birthplan')}
            className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-pill transition-colors cursor-pointer ${
              activeTab === 'birthplan'
                ? 'text-haven-deep font-display font-bold'
                : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            <CalendarCheck className={`w-5 h-5 ${activeTab === 'birthplan' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
            <span className="text-[11px] font-display">Birth Plan</span>
          </button>

          <button
            onClick={() => setActiveTab('emergency')}
            className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-pill transition-colors cursor-pointer ${
              activeTab === 'emergency'
                ? 'text-status-emergency font-display font-bold'
                : 'text-ink-600 hover:text-status-emergency'
            }`}
          >
            <AlertTriangle className={`w-5 h-5 ${activeTab === 'emergency' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
            <span className="text-[11px] font-display">Emergency</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-pill transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'text-haven-deep font-display font-bold'
                : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            <User className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
            <span className="text-[11px] font-display">Profile</span>
          </button>
        </nav>
      </div>
    </div>
  );
};
