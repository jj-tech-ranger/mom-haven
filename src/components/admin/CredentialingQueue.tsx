import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock3, Loader2, UserCheck, XCircle } from 'lucide-react';
import { auth } from '../../lib/firebase';
import EmptyState from '../EmptyState';

interface ClinicianRecord {
  id: string;
  name?: string;
  displayName?: string;
  email?: string;
  cadre?: string;
  licenseNumber?: string;
  facilityName?: string;
  facilityId?: string | null;
  verificationStatus?: 'pending' | 'approved' | 'rejected' | 'suspended';
  rejectionReason?: string;
  createdAt?: unknown;
}

export const CredentialingQueue: React.FC = () => {
  const [items, setItems] = useState<ClinicianRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const token = await user.getIdToken();
      const response = await fetch('/api/v1/admin/clinicians', {
        headers: { authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Unable to load clinician applications.');
      setItems(Array.isArray(payload?.items) ? payload.items : []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load clinician applications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const decide = async (clinicianId: string, action: 'approve' | 'reject') => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      setActionId(clinicianId);
      setError(null);
      const token = await user.getIdToken();
      const response = await fetch(`/api/v1/admin/clinician/${clinicianId}/${action}`, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: action === 'reject' ? JSON.stringify({ reason: 'Verification request was not approved.' }) : undefined,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || `Unable to ${action} clinician.`);
      await load();
    } catch (err: any) {
      setError(err?.message || `Unable to ${action} clinician.`);
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex items-center justify-center gap-2 text-sm text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading clinician applications...</div>;
  }

  if (!items.length && !error) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <EmptyState icon={UserCheck} title="No clinician applications" message="Submitted clinician verification requests will appear here for administrator review." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs">{error}</div>}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div><h3 className="font-bold text-sm text-gray-900">Clinician Verification Queue</h3><p className="text-xs text-gray-500 mt-1">Review submitted credentials before granting clinician portal access.</p></div>
          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold flex items-center gap-1"><Clock3 className="w-3 h-3" /> {items.filter(x => x.verificationStatus === 'pending').length} pending</span>
        </div>
        <div className="divide-y divide-gray-100">
          {items.map(item => {
            const pending = item.verificationStatus === 'pending';
            const busy = actionId === item.id;
            return (
              <div key={item.id} className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div><span className="text-gray-500">Name</span><p className="font-bold text-gray-900 mt-0.5">{item.displayName || item.name || item.id}</p></div>
                  <div><span className="text-gray-500">Email</span><p className="font-semibold text-gray-800 mt-0.5">{item.email || '—'}</p></div>
                  <div><span className="text-gray-500">Professional cadre</span><p className="font-semibold text-gray-800 mt-0.5">{item.cadre || '—'}</p></div>
                  <div><span className="text-gray-500">Council license</span><p className="font-mono font-semibold text-gray-800 mt-0.5">{item.licenseNumber || '—'}</p></div>
                  <div><span className="text-gray-500">Facility</span><p className="font-semibold text-gray-800 mt-0.5">{item.facilityName || '—'}</p></div>
                  <div><span className="text-gray-500">Status</span><p className="font-semibold text-gray-800 mt-0.5 capitalize">{item.verificationStatus || 'unknown'}</p></div>
                </div>
                {pending && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button type="button" disabled={busy} onClick={() => void decide(item.id, 'approve')} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-60 flex items-center gap-2">
                      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Approve clinician
                    </button>
                    <button type="button" disabled={busy} onClick={() => void decide(item.id, 'reject')} className="px-4 py-2 rounded-xl border border-red-200 text-red-700 text-xs font-bold disabled:opacity-60 flex items-center gap-2">
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
