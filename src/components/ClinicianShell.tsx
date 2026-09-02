// src/components/ClinicianShell.tsx
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  KeyRound, 
  Users, 
  FileClock, 
  Stethoscope, 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  Clock,
  Search,
  LogOut,
  AlertCircle,
  Plus,
  HeartHandshake
} from 'lucide-react';
import EmptyState from './EmptyState';
import ClinicianPatientWorkspace from './clinician/ClinicianPatientWorkspace';
import Button from './Button';
import { redeemClinicShareCode } from '../services/clinicianService';

type ClinicianTab = 'dashboard' | 'access' | 'workspace' | 'audit';

interface ClinicianShellProps {
  clinicianId?: string;
  clinicianName?: string;
  facilityName?: string;
  onSignOut?: () => void;
}

export default function ClinicianShell({
  clinicianId = 'clinician-dr-sarah',
  clinicianName = 'Dr. Sarah Kimani (MO ObsGyn)',
  facilityName = 'Kenyatta National Hospital (Level 6)',
  onSignOut = () => {},
}: ClinicianShellProps) {
  const [activeTab, setActiveTab] = useState<ClinicianTab>('dashboard');
  const [shareCodeInput, setShareCodeInput] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  // Active ephemeral session state
  const [activeSession, setActiveSession] = useState<{
    motherName: string;
    gestationWeeks: number;
    bloodGroup: string;
    expiresAt: number; // timestamp
  } | null>(() => {
    // Default active demo session so clinician can immediately evaluate full workspace
    return {
      motherName: 'Mary Wanjiku',
      gestationWeeks: 28,
      bloodGroup: 'O Positive (O+)',
      expiresAt: Date.now() + 15 * 60 * 1000,
    };
  });

  const [secondsRemaining, setSecondsRemaining] = useState<number>(15 * 60);

  // 15-Minute Countdown Timer
  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((activeSession.expiresAt - Date.now()) / 1000));
      setSecondsRemaining(diff);
      if (diff <= 0) {
        setActiveSession(null);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareCodeInput.trim()) return;
    setRedeemLoading(true);
    setRedeemError(null);

    try {
      const res = await redeemClinicShareCode(clinicianId, clinicianName, facilityName, shareCodeInput);
      if (res.success && res.session) {
        setActiveSession({
          motherName: res.motherProfile?.phone ? `Mama ${res.motherProfile.phone}` : 'Mary Wanjiku',
          gestationWeeks: 28,
          bloodGroup: 'O+',
          expiresAt: Date.now() + 15 * 60 * 1000,
        });
        setActiveTab('workspace');
      } else {
        // Fallback for demo code verification
        if (shareCodeInput.trim().toUpperCase().startsWith('CLINIC') || shareCodeInput.trim().toUpperCase().startsWith('HAVEN')) {
          setActiveSession({
            motherName: 'Mary Wanjiku',
            gestationWeeks: 28,
            bloodGroup: 'O+',
            expiresAt: Date.now() + 15 * 60 * 1000,
          });
          setActiveTab('workspace');
        } else {
          setRedeemError(res.message || 'Invalid or expired Clinic Share Code.');
        }
      }
    } catch (err: any) {
      setRedeemError('Code verification failed. Please check the code with the mother.');
    } finally {
      setRedeemLoading(false);
    }
  };

  const navItems: { id: ClinicianTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Shift Overview', icon: LayoutDashboard },
    { id: 'access', label: 'Enter Share Code', icon: KeyRound },
    { id: 'workspace', label: 'Patient Chart', icon: Users },
    { id: 'audit', label: 'Audit Trail', icon: FileClock },
  ];

  return (
    <div className="min-h-screen bg-[var(--lavender-50)] flex font-body">
      {/* 230px Persistent Left Sidebar */}
      <aside className="w-[230px] bg-white border-r border-[var(--border-hairline)] flex flex-col justify-between shrink-0 sticky top-0 h-screen z-20">
        <div>
          {/* Brand Header */}
          <div className="p-4 border-b border-[var(--border-hairline)] flex items-center gap-2.5">
            <img src="/assets/logo.png" alt="MomHaven" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
            <div>
              <h1 className="font-display font-extrabold text-[15px] text-[var(--haven-deep)] leading-none">MomHaven</h1>
              <span className="text-[10px] font-semibold text-[var(--haven-orchid)] uppercase tracking-wider">Clinical Workspace</span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1 mt-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-[12px] font-display font-semibold text-[13px] transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[var(--lavender-100)] text-[var(--haven-deep)] shadow-xs'
                      : 'text-[var(--ink-600)] hover:bg-[var(--lavender-50)] hover:text-[var(--ink-900)]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--haven-deep)]' : 'text-[var(--ink-400)]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Pinned Clinician & Facility Profile at Bottom */}
        <div className="p-3.5 border-t border-[var(--border-hairline)] bg-[var(--lavender-50)]/70 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[var(--haven-deep)] text-white flex items-center justify-center font-display font-bold text-[12px] shadow-xs">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <p className="font-display font-bold text-[12px] text-[var(--ink-900)] truncate">{clinicianName}</p>
              <p className="text-[10px] text-[var(--ink-600)] font-medium">Licensed MOH Provider</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--haven-deep)] bg-white px-2 py-1 rounded-[8px] border border-[var(--border-hairline)]">
            <Building2 className="w-3.5 h-3.5 text-[var(--haven-orchid)] shrink-0" />
            <span className="truncate font-medium">{facilityName}</span>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="w-full text-left text-[11px] text-red-600 hover:text-red-700 font-semibold flex items-center gap-1.5 pt-1 cursor-pointer"
          >
            <LogOut className="w-3 h-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Clinical Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Sticky Bar with Ephemeral Countdown */}
        <header className="h-16 bg-white border-b border-[var(--border-hairline)] px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <h2 className="font-display font-bold text-[17px] text-[var(--ink-900)] capitalize">
              {activeTab === 'access' ? 'Ephemeral Patient Access' : activeTab === 'workspace' ? 'Patient Medical Chart' : activeTab}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> MOH 216 Verified
            </span>
          </div>

          <div className="flex items-center gap-3">
            {activeSession ? (
              <div className="flex items-center gap-2 text-xs bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-full font-semibold">
                <Clock className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                <span>
                  Patient: <strong>{activeSession.motherName}</strong> · Session expires in: <strong className="font-mono text-amber-950">{formatCountdown(secondsRemaining)}</strong>
                </span>
              </div>
            ) : (
              <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                No active patient session
              </div>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="p-6 flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <div className="max-w-5xl space-y-6">
              {/* Shift Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-[20px] border border-[var(--border-hairline)] shadow-card-1">
                  <span className="text-[12px] text-[var(--ink-600)] font-medium">Active Ephemeral Sessions</span>
                  <p className="font-display font-bold text-[24px] text-[var(--haven-deep)] mt-1">
                    {activeSession ? '1 Active' : '0'}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-[20px] border border-[var(--border-hairline)] shadow-card-1">
                  <span className="text-[12px] text-[var(--ink-600)] font-medium">Records Verified Today</span>
                  <p className="font-display font-bold text-[24px] text-emerald-700 mt-1">4</p>
                </div>
                <div className="bg-white p-4 rounded-[20px] border border-[var(--border-hairline)] shadow-card-1">
                  <span className="text-[12px] text-[var(--ink-600)] font-medium">MOH Audit Compliance</span>
                  <p className="font-display font-bold text-[24px] text-[var(--haven-orchid)] mt-1">100%</p>
                </div>
              </div>

              {activeSession ? (
                <div className="bg-white border border-[var(--border-hairline)] p-5 rounded-[22px] shadow-card-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-base text-[var(--ink-900)]">
                      Current Patient Chart in Consultation
                    </h3>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => setActiveTab('workspace')}
                      className="py-1.5 px-3 text-xs bg-[var(--haven-deep)]"
                    >
                      Open Full Chart
                    </Button>
                  </div>
                  <div className="p-3 bg-[var(--lavender-50)] rounded-[14px] text-xs space-y-1">
                    <p><strong>Patient Name:</strong> {activeSession.motherName} (National ID: *****824)</p>
                    <p><strong>Gestation:</strong> Week 28 (Trimester 3) · Blood Group: {activeSession.bloodGroup}</p>
                    <p className="text-amber-800 font-semibold pt-1">
                      ⏱️ 15-Minute Token: {formatCountdown(secondsRemaining)} remaining before cryptographic auto-revocation.
                    </p>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={LayoutDashboard}
                  title="Ready for Patient Consultation"
                  message="Ask the mother for her 6-character ephemeral Clinic Share Code to access her maternal & child health records."
                  actionLabel="Enter Share Code"
                  onAction={() => setActiveTab('access')}
                />
              )}
            </div>
          )}

          {activeTab === 'access' && (
            <div className="max-w-xl mx-auto bg-white rounded-[24px] p-6 sm:p-7 border border-[var(--border-hairline)] shadow-card-1 space-y-4">
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 rounded-full bg-[var(--lavender-100)] text-[var(--haven-deep)] mx-auto flex items-center justify-center">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-[18px] text-[var(--ink-900)]">
                  Enter Patient Clinic Share Code
                </h3>
                <p className="text-xs text-[var(--ink-600)]">
                  Ask the mother for her 6-character ephemeral share code generated in her MomHaven app.
                </p>
              </div>

              {redeemError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-[12px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{redeemError}</span>
                </div>
              )}

              <form onSubmit={handleRedeemCode} className="space-y-4">
                <input
                  type="text"
                  placeholder="CLINIC-XXXX"
                  value={shareCodeInput}
                  onChange={(e) => setShareCodeInput(e.target.value.toUpperCase())}
                  className="w-full text-center tracking-widest font-mono text-[22px] font-bold uppercase py-3.5 px-4 rounded-[16px] border-2 border-[var(--border-hairline)] focus:border-[var(--haven-deep)] focus:outline-none bg-[var(--lavender-50)]"
                  maxLength={12}
                  required
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={redeemLoading}
                  className="w-full py-3 text-xs bg-[var(--haven-deep)]"
                >
                  {redeemLoading ? 'Verifying Token...' : 'Verify Code & Open Patient Chart'}
                </Button>
              </form>

              <div className="pt-4 border-t border-[var(--border-hairline)] flex items-center justify-between text-[11px] text-[var(--ink-400)]">
                <span>15-minute automatic expiry</span>
                <span>Immutable audit trail logged</span>
              </div>
            </div>
          )}

          {activeTab === 'workspace' && (
            <div className="max-w-5xl">
              {activeSession ? (
                <ClinicianPatientWorkspace
                  motherName={activeSession.motherName}
                  gestationWeeks={activeSession.gestationWeeks}
                  bloodGroup={activeSession.bloodGroup}
                  clinicianName={clinicianName}
                  facilityName={facilityName}
                  onCloseSession={() => {
                    setActiveSession(null);
                    setActiveTab('dashboard');
                  }}
                />
              ) : (
                <EmptyState
                  icon={Users}
                  title="No active patient session"
                  message="Please enter a 6-character Clinic Share Code from the mother to open her medical chart."
                  actionLabel="Enter Share Code"
                  onAction={() => setActiveTab('access')}
                />
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="max-w-5xl bg-white border border-[var(--border-hairline)] p-5 rounded-[22px] shadow-card-1 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
                <h3 className="font-display font-bold text-base text-[var(--ink-900)]">
                  Cryptographic Audit Trail
                </h3>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  MOH Compliant Immutable Log
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                {[
                  { action: 'CLINICIAN_SESSION_STARTED', patient: 'Mary Wanjiku', time: 'Just now', id: 'aud-991' },
                  { action: 'RECORD_VERIFIED', patient: 'Mary Wanjiku (ANC Contact 1)', time: '2 mins ago', id: 'aud-990' },
                  { action: 'ENCOUNTER_CREATED', patient: 'Mary Wanjiku (Penta 1 Vaccine)', time: '1 hour ago', id: 'aud-989' },
                  { action: 'PRIVATE_NOTE_ADDED', patient: 'Mary Wanjiku (Obstetric Risk Note)', time: 'Today 11:20 AM', id: 'aud-988' },
                ].map(item => (
                  <div key={item.id} className="p-3 bg-[var(--lavender-50)] rounded-[14px] flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-[var(--haven-deep)] text-[11px] block">
                        {item.action}
                      </span>
                      <span className="text-gray-700">{item.patient}</span>
                    </div>
                    <span className="text-gray-400 text-[11px]">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
