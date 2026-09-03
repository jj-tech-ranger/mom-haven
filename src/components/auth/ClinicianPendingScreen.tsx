import React from 'react';
import { Clock3, LogOut, RefreshCw } from 'lucide-react';
import { Clinician } from '../../types';
import EmptyState from '../EmptyState';

interface ClinicianPendingScreenProps { clinicianName?: string; clinicianData?: Partial<Clinician> | null; onRefresh: () => void; onSignOut: () => void; onInstantApprove?: () => void; }

export default function ClinicianPendingScreen({ clinicianName, clinicianData, onRefresh, onSignOut, onInstantApprove: _onInstantApprove }: ClinicianPendingScreenProps) {
  const status = clinicianData?.verificationStatus || 'pending';
  return <div className="min-h-screen bg-[var(--lavender-50)] p-4 flex items-center justify-center"><div className="w-full max-w-lg"><div className="bg-white rounded-2xl border border-[var(--border-hairline)] shadow-card-1 overflow-hidden"><EmptyState icon={Clock3} title="Credential verification pending" message={clinicianName ? `${clinicianName}, your clinician access remains pending until a live credential review is completed.` : 'Clinician access remains pending until a live credential review is completed.'} /><div className="px-6 pb-6 text-center text-xs text-[var(--ink-500)]">Current verification status: <strong>{status}</strong></div></div><div className="mt-4 flex justify-center gap-2"><button type="button" onClick={onRefresh} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[var(--border-hairline)] text-sm font-semibold cursor-pointer"><RefreshCw className="w-4 h-4" />Refresh status</button><button type="button" onClick={onSignOut} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[var(--border-hairline)] text-sm font-semibold cursor-pointer"><LogOut className="w-4 h-4" />Sign out</button></div></div></div>;
}
