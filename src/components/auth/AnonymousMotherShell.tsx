// src/components/auth/AnonymousMotherShell.tsx
import React, { useState } from 'react';
import { 
  Home, 
  Milestone, 
  MessageSquare, 
  FileText, 
  User, 
  Sparkles, 
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Lock,
  ArrowRight,
  PhoneCall,
  ShieldAlert,
  Calendar,
  Heart,
  Baby,
  Activity,
  FileCheck,
  HelpCircle,
  PlusCircle,
  ArrowLeft,
  Share2,
  CheckCircle2
} from 'lucide-react';
import Button from '../Button';
import HavenChatView from '../haven/HavenChatView';
import EmergencySafetyHub from '../emergency/EmergencySafetyHub';
import { Pregnancy, AncEncounter, Child, ChildVaccineRecord, GrowthMeasurement } from '../../types';

interface AnonymousMotherShellProps {
  onBackToLanding: () => void;
  onCreateAccount: () => void;
}

type MotherTab = 'today' | 'journey' | 'haven' | 'records' | 'profile';

export default function AnonymousMotherShell({
  onBackToLanding,
  onCreateAccount,
}: AnonymousMotherShellProps) {
  const [activeTab, setActiveTab] = useState<MotherTab>('today');
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [havenInitialPrompt, setHavenInitialPrompt] = useState<string | undefined>(undefined);

  // Sample demonstration data for showcasing features
  const demoPregnancy: Pregnancy = {
    id: 'demo-preg',
    motherId: 'demo-mother',
    lmp: '2025-09-01',
    edd: '2026-06-08',
    gestationalAgeWeeks: 24,
    status: 'active',
    bloodGroup: 'O',
    rhesusFactor: '+',
    chronicConditions: ['None'],
    currentMedications: ['IFAS daily (Iron & Folic Acid)'],
    allergies: ['No known allergies'],
    createdAt: '2025-09-10',
    updatedAt: '2026-03-01',
  };

  const demoEncounters: AncEncounter[] = [
    {
      id: 'enc-1',
      pregnancyId: 'demo-preg',
      visitNumber: 1,
      date: '2025-10-15',
      facilityName: 'Kariokor Health Centre',
      gestationalAgeWeeks: 8,
      weight: 63.2,
      bloodPressure: '110 / 70',
      fundalHeight: 8,
      fetalHeartRate: 152,
      ironFolicGiven: true,
      notes: 'Initial antenatal registration. Dating ultrasound completed.',
      provenance: {
        status: 'VERIFIED',
        enteredBy: 'demo-mother',
        enteredAt: '2025-10-15T09:00:00Z',
        verifiedBy: 'Nurse A. Wanjiru',
        verifiedAt: '2025-10-15T10:00:00Z',
      },
    },
    {
      id: 'enc-2',
      pregnancyId: 'demo-preg',
      visitNumber: 2,
      date: '2025-12-05',
      facilityName: 'Kariokor Health Centre',
      gestationalAgeWeeks: 16,
      weight: 65.5,
      bloodPressure: '114 / 72',
      fundalHeight: 16,
      fetalHeartRate: 148,
      ironFolicGiven: true,
      tdBoosterGiven: true,
      notes: 'Td vaccine dose 1 administered. Fetal movements felt.',
      provenance: {
        status: 'VERIFIED',
        enteredBy: 'demo-mother',
        enteredAt: '2025-12-05T09:00:00Z',
        verifiedBy: 'Nurse A. Wanjiru',
        verifiedAt: '2025-12-05T10:00:00Z',
      },
    },
    {
      id: 'enc-3',
      pregnancyId: 'demo-preg',
      visitNumber: 3,
      date: '2026-01-15',
      facilityName: 'Pumwani Maternity Hospital',
      gestationalAgeWeeks: 20,
      weight: 66.8,
      bloodPressure: '116 / 74',
      fundalHeight: 20,
      fetalHeartRate: 146,
      ironFolicGiven: true,
      notes: 'Anomaly scan performed. Normal cardiac activity and growth.',
      provenance: {
        status: 'VERIFIED',
        enteredBy: 'demo-mother',
        enteredAt: '2026-01-15T11:00:00Z',
        verifiedBy: 'Dr. K. Mutua',
        verifiedAt: '2026-01-15T12:00:00Z',
      },
    },
    {
      id: 'enc-4',
      pregnancyId: 'demo-preg',
      visitNumber: 4,
      date: '2026-03-02',
      facilityName: 'Kariokor Health Centre',
      gestationalAgeWeeks: 24,
      weight: 68.4,
      bloodPressure: '112 / 74',
      fundalHeight: 24,
      fetalHeartRate: 144,
      ironFolicGiven: true,
      iptpGiven: true,
      notes: 'Good fetal movement. IFAS resupplied for 60 days.',
      provenance: {
        status: 'REPORTED',
        enteredBy: 'demo-mother',
        enteredAt: '2026-03-02T14:00:00Z',
      },
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--lavender-50)] text-[var(--ink-900)] flex justify-center font-body">
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col shadow-2xl relative border-x border-[var(--border-hairline)] pb-20">
        
        {/* Top Preview Sticky Announcement Banner */}
        <div className="bg-gradient-to-r from-[var(--haven-deep)] via-[#4F2090] to-[var(--haven-orchid)] text-white px-3.5 py-2.5 flex items-center justify-between shadow-xs sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBackToLanding}
              className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
              title="Return to landing page"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="text-[10px] font-display font-extrabold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full inline-block">
                Anonymous Preview
              </span>
              <p className="text-[11px] text-purple-100 leading-none mt-0.5">
                Haven Chat is fully active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCreateAccount}
              className="px-3 py-1.5 rounded-full bg-white text-[var(--haven-deep)] font-display font-bold text-xs shadow-xs hover:bg-gray-100 flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
            >
              <span>Create Account</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onBackToLanding}
              className="px-2.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-display font-bold text-xs flex items-center gap-1 cursor-pointer"
              title="Return to main landing page"
            >
              <span>Landing</span>
            </button>
          </div>
        </div>

        {/* Standard App Header */}
        <header className="px-4 py-3 border-b border-[var(--border-hairline)] bg-white/95 backdrop-blur-xs flex items-center justify-between z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[var(--lavender-100)] p-1.5 flex items-center justify-center shrink-0">
              <img src="/assets/logo.png" alt="MomHaven" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-[14px] text-[var(--ink-900)]">
                  Pregnancy (Week 24)
                </span>
                <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                  DEMO
                </span>
              </div>
              <span className="text-[10px] text-[var(--ink-500)] block">
                Official Kenya MOH 216 Digital Companion
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setHavenInitialPrompt(undefined);
                setActiveTab('haven');
              }}
              className="w-9 h-9 rounded-full bg-[var(--lavender-100)] text-[var(--haven-deep)] flex items-center justify-center hover:bg-[var(--lavender-200)] transition-colors cursor-pointer"
              title="Chat with Haven"
            >
              <Sparkles className="w-4 h-4 text-[var(--haven-orchid)] animate-pulse" />
            </button>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 overflow-y-auto">
          
          {/* TAB 1: TODAY (Showcase View) */}
          {activeTab === 'today' && (
            <div className="p-4 space-y-4">
              
              {/* Promotional Hero Card */}
              <div className="bg-gradient-to-br from-[#33178A] to-[#6B3DB8] text-white p-5 rounded-[24px] shadow-card-2 relative overflow-hidden space-y-3">
                <div className="inline-flex items-center gap-1 bg-white/20 px-2.5 py-0.5 rounded-full text-[10px] font-display font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Interactive Walkthrough</span>
                </div>
                <div>
                  <h2 className="font-display font-extrabold text-[20px] leading-tight">
                    Week 24: Baby is the size of a Sweet Melon (Papaya)
                  </h2>
                  <p className="font-body text-xs text-purple-100 mt-1 leading-relaxed">
                    Your baby is developing taste buds, rapid eye movements, and responding to your voice.
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setHavenInitialPrompt("What are the key changes and baby movements during week 24 of pregnancy?");
                      setActiveTab('haven');
                    }}
                    className="px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-display font-bold flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Ask Haven about Week 24</span>
                  </button>
                </div>
              </div>

              {/* Emergency Banner */}
              <div className="bg-[#E11D3C] text-white p-4 rounded-[20px] shadow-emergency flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5 text-white animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm leading-tight">MOH 24/7 Danger Protocol</h4>
                    <p className="text-[11px] text-white/90">Severe headache, bleeding, convulsions</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEmergencyOpen(true)}
                  className="px-3.5 py-2 rounded-full bg-white text-[#C4283C] font-display font-bold text-xs shrink-0 flex items-center gap-1 shadow-xs cursor-pointer hover:bg-gray-100"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Protocol</span>
                </button>
              </div>

              {/* Next ANC Visit Feature */}
              <div className="bg-white border border-[var(--border-hairline)] rounded-[20px] p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[var(--lavender-100)] text-[var(--haven-deep)] flex items-center justify-center">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-[14px] text-[var(--ink-900)]">
                        Next Clinic Visit (ANC 5)
                      </h4>
                      <p className="text-[11px] text-[var(--ink-500)]">Targeted 28-Week Visit</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[var(--haven-deep)] bg-[var(--lavender-50)] px-2.5 py-1 rounded-full border border-[var(--border-hairline)]">
                    In 4 Weeks
                  </span>
                </div>

                <p className="text-xs text-[var(--ink-600)] leading-relaxed">
                  Scheduled for Gestational Diabetes screening, second Td vaccine booster, and IFAS iron supplement restock.
                </p>

                {/* Feature highlight */}
                <div className="p-3 bg-[var(--lavender-50)] rounded-[14px] border border-[var(--border-hairline)] flex items-center justify-between text-xs">
                  <span className="text-[var(--ink-700)]">Auto-SMS Reminders enabled on signup</span>
                  <button
                    type="button"
                    onClick={onCreateAccount}
                    className="font-display font-bold text-[var(--haven-deep)] hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Connect</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Feature Preview Cards Grid */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div 
                  onClick={() => setActiveTab('journey')}
                  className="bg-white border border-[var(--border-hairline)] p-4 rounded-[20px] shadow-xs cursor-pointer hover:border-[var(--haven-orchid)] transition-all space-y-2"
                >
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-[var(--haven-deep)] flex items-center justify-center">
                    <Milestone className="w-4 h-4" />
                  </div>
                  <h5 className="font-display font-bold text-xs text-[var(--ink-900)]">8 ANC Visits Tracker</h5>
                  <p className="text-[11px] text-[var(--ink-500)]">Kenya MOH clinical timeline &amp; logs.</p>
                </div>

                <div 
                  onClick={() => setActiveTab('records')}
                  className="bg-white border border-[var(--border-hairline)] p-4 rounded-[20px] shadow-xs cursor-pointer hover:border-[var(--haven-orchid)] transition-all space-y-2"
                >
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <h5 className="font-display font-bold text-xs text-[var(--ink-900)]">MOH 216 Vault</h5>
                  <p className="text-[11px] text-[var(--ink-500)]">Secure digital ultrasound &amp; lab storage.</p>
                </div>
              </div>

              {/* Join CTA */}
              <div className="p-5 rounded-[22px] bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200/70 text-center space-y-2.5 mt-2">
                <h4 className="font-display font-bold text-sm text-[var(--haven-deep)]">
                  Save Your Personalized MOH 216 Handbook
                </h4>
                <p className="text-xs text-[var(--ink-600)]">
                  Create your free account in seconds to log visits, track weight &amp; blood pressure, and invite your partner.
                </p>
                <Button
                  type="button"
                  variant="primary"
                  onClick={onCreateAccount}
                  className="w-full py-3 text-xs font-display font-bold shadow-xs"
                >
                  Create My Free Account
                </Button>
              </div>

            </div>
          )}

          {/* TAB 2: JOURNEY (Showcase 8 ANC Visits & Timeline) */}
          {activeTab === 'journey' && (
            <div className="p-4 space-y-4">
              <div className="bg-[var(--lavender-50)] border border-[var(--border-hairline)] p-4 rounded-[20px] space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-extrabold text-[16px] text-[var(--ink-900)]">
                    Kenyan 8 ANC Encounters Schedule
                  </h3>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    MOH 216
                  </span>
                </div>
                <p className="text-xs text-[var(--ink-600)] leading-relaxed">
                  The Kenya Ministry of Health recommends a minimum of 8 antenatal care contacts to ensure optimal maternal and fetal outcomes.
                </p>
              </div>

              {/* Visit Log Preview List */}
              <div className="space-y-2.5">
                {demoEncounters.map((enc) => (
                  <div
                    key={enc.id}
                    className="bg-white border border-[var(--border-hairline)] rounded-[18px] p-3.5 shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[var(--haven-deep)] text-white text-[11px] font-display font-bold flex items-center justify-center">
                          {enc.visitNumber}
                        </span>
                        <span className="font-display font-bold text-xs text-[var(--ink-900)]">
                          Visit {enc.visitNumber} ({enc.gestationalAgeWeeks} Weeks)
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[var(--ink-500)]">{enc.date}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-[11px] bg-[var(--lavender-50)] p-2 rounded-[12px]">
                      <div>
                        <span className="text-[var(--ink-500)] block">BP</span>
                        <span className="font-bold text-[var(--ink-900)] font-mono">{enc.bloodPressure}</span>
                      </div>
                      <div>
                        <span className="text-[var(--ink-500)] block">Weight</span>
                        <span className="font-bold text-[var(--ink-900)] font-mono">{enc.weight} kg</span>
                      </div>
                      <div>
                        <span className="text-[var(--ink-500)] block">FHR</span>
                        <span className="font-bold text-[var(--ink-900)] font-mono">{enc.fetalHeartRate} bpm</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-[var(--ink-600)] italic pl-1">
                      "{enc.notes}"
                    </p>
                  </div>
                ))}
              </div>

              {/* Locked Add Visit Prompt */}
              <div className="bg-white border-2 border-dashed border-[var(--border-hairline)] p-4 rounded-[20px] text-center space-y-2">
                <Lock className="w-5 h-5 text-[var(--haven-orchid)] mx-auto" />
                <h4 className="font-display font-bold text-xs text-[var(--ink-900)]">Log Your Clinic Visits</h4>
                <p className="text-[11px] text-[var(--ink-600)]">
                  Sign in with your phone or email to save and share your verified medical entries with clinicians.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCreateAccount}
                  className="py-2 px-4 text-xs font-display font-bold"
                >
                  Sign in to Record Visits
                </Button>
              </div>
            </div>
          )}

          {/* TAB 3: HAVEN CHAT (FULLY FUNCTIONAL ANONYMOUS AI) */}
          {activeTab === 'haven' && (
            <div className="h-[calc(100vh-140px)] flex flex-col">
              <HavenChatView
                initialPrompt={havenInitialPrompt}
                onTriggerEmergency={() => setEmergencyOpen(true)}
              />
            </div>
          )}

          {/* TAB 4: RECORDS VAULT (Showcase Vault & Sharing) */}
          {activeTab === 'records' && (
            <div className="p-4 space-y-4">
              <div className="bg-gradient-to-br from-indigo-900 to-purple-900 text-white p-5 rounded-[22px] shadow-card-1 space-y-2">
                <div className="inline-flex items-center gap-1 bg-white/20 px-2.5 py-0.5 rounded-full text-[10px] font-display font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Secure Kenya MOH 216 Vault</span>
                </div>
                <h3 className="font-display font-extrabold text-[18px]">
                  Digital Health Passport
                </h3>
                <p className="text-xs text-purple-100 leading-relaxed">
                  Eliminates lost physical booklet worries. Upload clinic lab reports, ultrasound scans, and hospital discharge notes.
                </p>
              </div>

              {/* Sample Documents in Vault */}
              <div className="space-y-2.5">
                <h4 className="font-display font-bold text-xs text-[var(--ink-900)] uppercase tracking-wider">
                  Sample Medical Documents
                </h4>

                <div className="bg-white border border-[var(--border-hairline)] p-3.5 rounded-[18px] flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-[var(--haven-deep)] flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-display font-bold text-xs text-[var(--ink-900)]">
                        20-Week Anomaly Ultrasound Report
                      </h5>
                      <p className="text-[11px] text-[var(--ink-500)]">Pumwani Hospital • Jan 15, 2026</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Sample
                  </span>
                </div>

                <div className="bg-white border border-[var(--border-hairline)] p-3.5 rounded-[18px] flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-display font-bold text-xs text-[var(--ink-900)]">
                        MOH Complete Blood Count (CBC)
                      </h5>
                      <p className="text-[11px] text-[var(--ink-500)]">Hb 12.1 g/dL • Kariokor Health</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Sample
                  </span>
                </div>
              </div>

              {/* Clinician QR Sharing feature preview */}
              <div className="p-4 rounded-[20px] bg-[var(--lavender-50)] border border-[var(--border-hairline)] space-y-2 text-center">
                <Share2 className="w-6 h-6 text-[var(--haven-deep)] mx-auto" />
                <h4 className="font-display font-bold text-xs text-[var(--ink-900)]">
                  Instant Doctor &amp; Midwife Sharing
                </h4>
                <p className="text-xs text-[var(--ink-600)]">
                  Generate a 6-digit access code for any hospital doctor to view your records without exposing your private phone.
                </p>
                <Button
                  type="button"
                  variant="primary"
                  onClick={onCreateAccount}
                  className="w-full py-2.5 text-xs font-display font-bold"
                >
                  Create Account to Secure Vault
                </Button>
              </div>
            </div>
          )}

          {/* TAB 5: PROFILE / SETTINGS (Preview) */}
          {activeTab === 'profile' && (
            <div className="p-4 space-y-4">
              <div className="bg-white border border-[var(--border-hairline)] rounded-[24px] p-5 shadow-xs text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-[var(--lavender-100)] text-[var(--haven-deep)] mx-auto flex items-center justify-center">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-[18px] text-[var(--ink-900)]">
                    Guest Explorer
                  </h3>
                  <p className="text-xs text-[var(--ink-600)] mt-0.5">
                    Anonymous session • Local Kenya MOH 216 mode
                  </p>
                </div>
              </div>

              <div className="bg-white border border-[var(--border-hairline)] rounded-[20px] p-4 space-y-3 shadow-xs">
                <h4 className="font-display font-bold text-xs text-[var(--ink-900)] uppercase tracking-wider">
                  Why Create a Full Health Account?
                </h4>
                <div className="space-y-2 text-xs text-[var(--ink-700)]">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Continuous cloud backup that syncs across all your devices</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>SMS and WhatsApp reminders for all 8 ANC visits &amp; baby vaccines</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Emergency contacts and birth partner real-time ride coordination</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={onCreateAccount}
                    className="w-full py-3 text-xs font-display font-bold shadow-md"
                  >
                    Create Account with Phone or Google
                  </Button>
                </div>
              </div>

              <button
                type="button"
                onClick={onBackToLanding}
                className="w-full py-3 rounded-full border border-gray-200 text-[var(--ink-600)] hover:text-[var(--ink-900)] font-display font-bold text-xs text-center cursor-pointer"
              >
                Return to Sign-In Screen
              </button>
            </div>
          )}

        </main>

        {/* Floating Emergency Button */}
        <button
          type="button"
          onClick={() => setEmergencyOpen(true)}
          aria-label="Emergency Care Protocol"
          className="fixed sm:absolute bottom-20 right-4 z-30 w-14 h-14 rounded-full bg-[#E11D3C] text-white flex items-center justify-center shadow-emergency hover:scale-105 active:scale-95 transition-transform cursor-pointer border-2 border-white ring-4 ring-red-200"
        >
          <span className="font-display font-black text-[24px] leading-none">!</span>
        </button>

        {/* 5-Item Bottom Navigation */}
        <nav className="absolute bottom-0 left-0 right-0 h-18 bg-white border-t border-[var(--border-hairline)] px-2 flex items-center justify-around z-20">
          <button
            type="button"
            onClick={() => setActiveTab('today')}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
              activeTab === 'today' ? 'text-[var(--haven-deep)]' : 'text-[#8A8199]'
            }`}
          >
            <Home className={`w-5 h-5 ${activeTab === 'today' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="font-display font-bold text-[11px] mt-0.5">Today</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('journey')}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
              activeTab === 'journey' ? 'text-[var(--haven-deep)]' : 'text-[#8A8199]'
            }`}
          >
            <Milestone className={`w-5 h-5 ${activeTab === 'journey' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="font-display font-bold text-[11px] mt-0.5">Journey</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setHavenInitialPrompt(undefined);
              setActiveTab('haven');
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
              activeTab === 'haven' ? 'text-[var(--haven-deep)]' : 'text-[#8A8199]'
            }`}
          >
            <MessageSquare className={`w-5 h-5 ${activeTab === 'haven' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="font-display font-bold text-[11px] mt-0.5">Haven</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('records')}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
              activeTab === 'records' ? 'text-[var(--haven-deep)]' : 'text-[#8A8199]'
            }`}
          >
            <FileText className={`w-5 h-5 ${activeTab === 'records' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="font-display font-bold text-[11px] mt-0.5">Records</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
              activeTab === 'profile' ? 'text-[var(--haven-deep)]' : 'text-[#8A8199]'
            }`}
          >
            <User className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="font-display font-bold text-[11px] mt-0.5">Profile</span>
          </button>
        </nav>

        {/* Emergency Modal */}
        {emergencyOpen && (
          <EmergencySafetyHub
            onClose={() => setEmergencyOpen(false)}
            driverPhone="+254 712 345 678"
            driverName="John Mwangi (Emergency Driver)"
            facilityName="Pumwani Maternity Hospital"
          />
        )}
      </div>
    </div>
  );
}
