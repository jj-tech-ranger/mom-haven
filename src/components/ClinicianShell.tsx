import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  KeyRound,
  Stethoscope,
  ClipboardList,
  LogOut,
  ShieldCheck,
  Clock,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Plus,
  type LucideIcon,
} from 'lucide-react';
import EmptyState from './EmptyState';
import ClinicianPatientWorkspace from './clinician/ClinicianPatientWorkspace';
import type { MomHavenHealthSummary } from '../types/healthSummary';
import { auth } from '../lib/firebase';
import Button from './Button';

type ClinicianTab = 'dashboard' | 'access' | 'workspace' | 'audit';

interface ClinicianShellProps {
  clinicianId?: string;
  clinicianName?: string;
  facilityName?: string;
  onSignOut?: () => void;
}

interface ActiveSessionItem {
  sessionId: string;
  motherId: string;
  motherName: string;
  expiresAt: string;
}

const tabs: { id: ClinicianTab; label: string; icon: LucideIcon; description: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Clinical overview' },
  { id: 'access', label: 'Patient Access', icon: KeyRound, description: 'Authorized patient connections' },
  { id: 'workspace', label: 'Workspace', icon: Stethoscope, description: 'Clinical workspace' },
  { id: 'audit', label: 'Audit', icon: ClipboardList, description: 'Access and activity audit' },
];

export default function ClinicianShell({
  clinicianId,
  clinicianName,
  facilityName,
  onSignOut,
}: ClinicianShellProps) {
  const [activeTab, setActiveTab] = useState<ClinicianTab>('dashboard');
  const [shareCode, setShareCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const [activeSession, setActiveSession] = useState<ActiveSessionItem | null>(null);
  const [activeSessionsList, setActiveSessionsList] = useState<ActiveSessionItem[]>([]);
  const [patientSummary, setPatientSummary] = useState<MomHavenHealthSummary | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const current = tabs.find(t => t.id === activeTab) || tabs[0];
  const Icon = current.icon;

  const getAuthHeader = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated.');
    const token = await user.getIdToken();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }, []);

  // Fetch Patient Summary
  const fetchPatientSummary = useCallback(async (motherId: string) => {
    try {
      setLoading(true);
      const headers = await getAuthHeader();
      const res = await fetch(`/api/v1/clinician/patients/${motherId}/summary`, { headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to load patient summary.');
      }
      const data = await res.json();
      if (data.healthSummary) {
        setPatientSummary(data.healthSummary);
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error loading clinical records.' });
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  // Enter Fast-Share Code
  const handleClaimCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = shareCode.replace(/\D/g, '').slice(0, 6);
    if (clean.length !== 6) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid 6-digit PIN.' });
      return;
    }

    try {
      setLoading(true);
      setStatusMessage(null);
      const headers = await getAuthHeader();

      // Step 1: Validate code
      const checkRes = await fetch('/api/v1/clinician/enter-code', {
        method: 'POST',
        headers,
        body: JSON.stringify({ shareCode: clean }),
      });
      const checkData = await checkRes.json();
      if (!checkRes.ok) throw new Error(checkData.error || 'Code invalid or expired.');

      // Step 2: Claim session
      const claimRes = await fetch(`/api/v1/clinician/sessions/${checkData.sessionId}/claim`, {
        method: 'POST',
        headers,
      });
      const claimData = await claimRes.json();
      if (!claimRes.ok) throw new Error(claimData.error || 'Could not claim session.');

      const sessionObj: ActiveSessionItem = {
        sessionId: claimData.sessionId,
        motherId: claimData.motherId,
        motherName: claimData.motherName || 'Patient',
        expiresAt: claimData.expiresAt,
      };

      setActiveSession(sessionObj);
      setActiveSessionsList(prev => [sessionObj, ...prev.filter(s => s.sessionId !== sessionObj.sessionId)]);
      setShareCode('');
      setStatusMessage({ type: 'success', text: `Authorized session established with ${sessionObj.motherName}!` });

      // Fetch summary and open workspace
      await fetchPatientSummary(sessionObj.motherId);
      setActiveTab('workspace');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Could not connect to patient.' });
    } finally {
      setLoading(false);
    }
  };

  // End Session
  const handleEndSession = async (sessionId?: string) => {
    const targetId = sessionId || activeSession?.sessionId;
    if (!targetId) return;

    try {
      setLoading(true);
      const headers = await getAuthHeader();
      await fetch(`/api/v1/clinician/sessions/${targetId}/end`, {
        method: 'POST',
        headers,
      });

      setActiveSessionsList(prev => prev.filter(s => s.sessionId !== targetId));
      if (activeSession?.sessionId === targetId) {
        setActiveSession(null);
        setPatientSummary(null);
      }
      setStatusMessage({ type: 'success', text: 'Clinical access session ended securely.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Could not end session.' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Audit Trail
  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeader();
      const res = await fetch('/api/v1/clinician/audit', { headers });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.items || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    if (activeTab === 'audit') {
      void fetchAuditLogs();
    }
  }, [activeTab, fetchAuditLogs]);

  return (
    <div className="min-h-screen bg-[var(--lavender-50)] text-[var(--ink-900)]">
      <div className="min-h-screen flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-72 shrink-0 bg-white border-r border-[var(--border-hairline)] flex-col sticky top-0 h-screen">
          <div className="px-6 py-6 border-b border-[var(--border-hairline)]">
            <p className="text-[11px] uppercase tracking-[0.18em] font-display font-bold text-[var(--haven-orchid)]">
              MomHaven Clinical
            </p>
            <h1 className="mt-2 font-display font-extrabold text-xl">Clinician Portal</h1>
            <p className="mt-1 text-xs text-[var(--ink-500)] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Verified clinical workspace
            </p>
          </div>

          <nav className="p-4 space-y-1 flex-1" aria-label="Clinician navigation">
            {tabs.map(tab => {
              const TabIcon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left cursor-pointer transition-colors ${
                    active
                      ? 'bg-[var(--lavender-50)] text-[var(--haven-deep)] font-bold'
                      : 'text-[var(--ink-600)] hover:bg-[var(--lavender-50)]'
                  }`}
                >
                  <TabIcon className="w-5 h-5 shrink-0" />
                  <span>
                    <span className="block text-sm font-display">{tab.label}</span>
                    <span className="block text-[11px] text-[var(--ink-400)]">{tab.description}</span>
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-[var(--border-hairline)]">
            <div className="px-3 py-3 mb-3 rounded-xl bg-[var(--lavender-50)]">
              <p className="text-sm font-display font-bold truncate">
                {clinicianName || 'Verified Clinician'}
              </p>
              <p className="text-[11px] text-[var(--ink-500)] truncate mt-0.5">
                {facilityName || 'MOH Registered Facility'}
              </p>
            </div>
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-display font-bold text-[var(--ink-500)] hover:bg-[var(--lavender-50)] cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 flex flex-col">
          <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-[var(--border-hairline)] px-5 md:px-8 py-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-display font-bold text-[var(--haven-orchid)]">
                {current.description}
              </p>
              <h2 className="font-display font-extrabold text-lg md:text-xl">{current.label}</h2>
            </div>
            <div className="flex items-center gap-3">
              {facilityName && (
                <span className="hidden sm:inline text-xs text-[var(--ink-500)] bg-[var(--lavender-50)] px-2.5 py-1 rounded-full border border-purple-100">
                  {facilityName}
                </span>
              )}
              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  aria-label="Sign out"
                  className="w-9 h-9 rounded-full bg-[var(--lavender-50)] flex items-center justify-center cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </header>

          <main className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8 flex-1 w-full space-y-5">
            {/* Status alerts */}
            {statusMessage && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-3 ${
                  statusMessage.type === 'error'
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                <span>{statusMessage.text}</span>
                <button
                  type="button"
                  onClick={() => setStatusMessage(null)}
                  className="text-xs font-bold underline cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* TAB 1: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-[22px] border border-[var(--border-hairline)] shadow-card-1 space-y-3">
                    <span className="text-[11px] font-bold text-[var(--ink-500)] uppercase">
                      Active Patient Sessions
                    </span>
                    <p className="text-3xl font-extrabold text-[var(--haven-deep)]">
                      {activeSessionsList.length}
                    </p>
                    <p className="text-xs text-[var(--ink-500)]">
                      Patient-mediated temporary clinical sessions
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-[22px] border border-[var(--border-hairline)] shadow-card-1 space-y-3">
                    <span className="text-[11px] font-bold text-[var(--ink-500)] uppercase">
                      Clinical Credential
                    </span>
                    <p className="text-sm font-bold text-[var(--ink-900)] flex items-center gap-1.5 mt-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      MOH Approved Practitioner
                    </p>
                    <p className="text-xs text-[var(--ink-500)]">
                      Facility: {facilityName || 'Registered Health Center'}
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-[22px] border border-[var(--border-hairline)] shadow-card-1 space-y-3">
                    <span className="text-[11px] font-bold text-[var(--ink-500)] uppercase">
                      Fast Patient Connect
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('access')}
                      className="w-full py-2.5 px-3 rounded-xl bg-[var(--haven-deep)] text-white text-xs font-display font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:bg-[var(--haven-orchid)]"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Enter 6-Digit Share PIN
                    </button>
                  </div>
                </div>

                {/* Active Session Quick-Link */}
                {activeSession && (
                  <div className="bg-white p-5 rounded-[22px] border-2 border-[var(--haven-deep)] shadow-card-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-[var(--haven-orchid)] uppercase tracking-wider">
                        Current Connected Patient
                      </span>
                      <h3 className="font-display font-bold text-lg text-[var(--ink-900)]">
                        {activeSession.motherName}
                      </h3>
                      <p className="text-xs text-[var(--ink-500)] mt-0.5">
                        Session expires at {new Date(activeSession.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab('workspace')}
                        className="py-2.5 px-4 rounded-xl bg-[var(--haven-deep)] text-white text-xs font-display font-bold flex items-center gap-2 cursor-pointer shadow-xs"
                      >
                        <Stethoscope className="w-4 h-4" />
                        Open Patient Workspace
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEndSession()}
                        className="py-2.5 px-3 rounded-xl border border-red-200 text-red-600 text-xs font-display font-bold hover:bg-red-50 cursor-pointer"
                      >
                        End Session
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PATIENT ACCESS */}
            {activeTab === 'access' && (
              <div className="space-y-6">
                {/* 6-Digit Fast Share Form */}
                <div className="bg-white p-6 rounded-[24px] border border-[var(--border-hairline)] shadow-card-1 max-w-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <KeyRound className="w-5 h-5 text-[var(--haven-deep)]" />
                    <h3 className="font-display font-bold text-base text-[var(--ink-900)]">
                      Connect via Bedside Fast-Share PIN
                    </h3>
                  </div>
                  <p className="text-xs text-[var(--ink-600)] leading-relaxed mb-4">
                    Ask the mother to open her MomHaven app, navigate to Records, and tap &ldquo;Bedside Fast Share PIN&rdquo;. Enter the 6-digit number below to establish a temporary 15-minute authorized clinical session.
                  </p>

                  <form onSubmit={handleClaimCode} className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={shareCode}
                        onChange={e => setShareCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 842195"
                        className="w-48 text-center tracking-[0.3em] font-mono text-xl font-bold py-2.5 px-3 rounded-xl bg-[var(--lavender-50)] border border-[var(--border-hairline)] focus:ring-2 focus:ring-[var(--haven-deep)] focus:outline-none"
                      />
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={loading || shareCode.length !== 6}
                        className="py-2.5 px-4 text-xs font-display font-bold flex items-center gap-1.5"
                      >
                        Connect to Patient
                      </Button>
                    </div>
                  </form>
                </div>

                {/* Active Sessions List */}
                <div className="bg-white p-6 rounded-[24px] border border-[var(--border-hairline)] shadow-card-1 space-y-3">
                  <h3 className="font-display font-bold text-base text-[var(--ink-900)]">
                    Active Patient Sessions
                  </h3>
                  {activeSessionsList.length > 0 ? (
                    <div className="divide-y divide-[var(--border-hairline)] border border-[var(--border-hairline)] rounded-xl overflow-hidden">
                      {activeSessionsList.map(session => (
                        <div
                          key={session.sessionId}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-white hover:bg-[var(--lavender-50)]/50 transition-colors"
                        >
                          <div>
                            <strong className="text-sm font-display text-[var(--ink-900)] block">
                              {session.motherName}
                            </strong>
                            <p className="text-[11px] text-[var(--ink-500)] mt-0.5">
                              ID: {session.motherId} · Session: {session.sessionId}
                            </p>
                            <span className="text-[11px] text-amber-700 font-semibold flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              Expires at {new Date(session.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                setActiveSession(session);
                                await fetchPatientSummary(session.motherId);
                                setActiveTab('workspace');
                              }}
                              className="py-2 px-3.5 rounded-xl bg-[var(--haven-deep)] text-white text-xs font-display font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Stethoscope className="w-3.5 h-3.5" />
                              Open Workspace
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEndSession(session.sessionId)}
                              className="py-2 px-3 rounded-xl border border-red-200 text-red-600 text-xs font-display font-bold hover:bg-red-50 cursor-pointer"
                            >
                              End
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--ink-400)] italic p-4 bg-[var(--lavender-50)] rounded-xl">
                      No active patient sessions. Enter a 6-digit share PIN above to begin.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: WORKSPACE */}
            {activeTab === 'workspace' && (
              <div>
                {activeSession ? (
                  <ClinicianPatientWorkspace
                    motherName={patientSummary?.mother?.displayName || activeSession.motherName}
                    gestationWeeks={patientSummary?.pregnancy?.currentStage?.gestationalAgeWeeks || 28}
                    clinicianName={clinicianName || 'Verified Clinician'}
                    facilityName={facilityName || 'Kenya MOH Facility'}
                    summary={patientSummary || undefined}
                    onCloseSession={() => handleEndSession(activeSession.sessionId)}
                  />
                ) : (
                  <div className="bg-white rounded-2xl border border-[var(--border-hairline)] p-8 text-center space-y-4 max-w-md mx-auto shadow-card-1">
                    <div className="w-12 h-12 rounded-full bg-[var(--lavender-50)] text-[var(--haven-deep)] flex items-center justify-center mx-auto">
                      <KeyRound className="w-6 h-6" />
                    </div>
                    <h3 className="font-display font-extrabold text-lg text-[var(--ink-900)]">
                      No Patient Session Selected
                    </h3>
                    <p className="text-xs text-[var(--ink-500)] leading-relaxed">
                      Connect to a mother using her 6-digit Fast-Share PIN to review her MomHaven Health Summary and clinical records.
                    </p>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => setActiveTab('access')}
                      className="text-xs font-display font-bold py-2.5 px-4"
                    >
                      Go to Patient Access
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: AUDIT */}
            {activeTab === 'audit' && (
              <div className="bg-white p-6 rounded-[24px] border border-[var(--border-hairline)] shadow-card-1 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
                  <div>
                    <h3 className="font-display font-bold text-base text-[var(--ink-900)]">
                      Zero-Trust Clinical Access Audit Trail
                    </h3>
                    <p className="text-xs text-[var(--ink-500)]">
                      Immutable record of patient data accessed, encounters logged, and records verified.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchAuditLogs()}
                    className="flex items-center gap-1 text-xs text-[var(--haven-deep)] font-bold cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh
                  </button>
                </div>

                {auditLogs.length > 0 ? (
                  <div className="divide-y divide-[var(--border-hairline)] border border-[var(--border-hairline)] rounded-xl overflow-hidden text-xs">
                    {auditLogs.map(log => (
                      <div key={log.id} className="p-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <span className="font-bold text-[var(--ink-900)]">{log.action}</span>
                          <span className="text-[var(--ink-500)] ml-2">Target: {log.targetType}</span>
                          {log.patientId && <span className="text-[var(--ink-400)] ml-2">Patient: {log.patientId}</span>}
                        </div>
                        <span className="text-[11px] text-[var(--ink-400)]">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Just now'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--ink-400)] italic p-4 bg-[var(--lavender-50)] rounded-xl">
                    No clinical audit entries recorded yet for this session.
                  </p>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
