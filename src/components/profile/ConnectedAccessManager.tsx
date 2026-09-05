// src/components/profile/ConnectedAccessManager.tsx
import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, HeartHandshake, Stethoscope, Trash2, CheckCircle2, RefreshCw, Clock, ShieldCheck } from 'lucide-react';
import { 
  getConnectedAccessList, 
  getConsentRecords,
  revokePartnerAccess, 
  revokeClinicianSession, 
  PartnerRelationship, 
  ClinicianAccessSession 
} from '../../services/sharingService';
import type { ConsentRecord } from '../../types';

interface ConnectedAccessManagerProps {
  motherId: string;
}

export default function ConnectedAccessManager({ motherId }: ConnectedAccessManagerProps) {
  const [partners, setPartners] = useState<PartnerRelationship[]>([]);
  const [clinicians, setClinicians] = useState<ClinicianAccessSession[]>([]);
  const [consentHistory, setConsentHistory] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadAccessList = async () => {
    try {
      setLoading(true);
      const [data, history] = await Promise.all([
        getConnectedAccessList(motherId),
        getConsentRecords(motherId),
      ]);
      setPartners(data.partners);
      setClinicians(data.clinicians);
      setConsentHistory(history);
    } catch (err) {
      console.error('Error fetching connected access list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccessList();
  }, [motherId]);

  const handleRevokePartner = async (relId: string) => {
    try {
      setRevokingId(relId);
      await revokePartnerAccess(relId);
      await loadAccessList();
    } catch (err) {
      console.error(err);
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeClinician = async (sessId: string) => {
    try {
      setRevokingId(sessId);
      await revokeClinicianSession(sessId);
      await loadAccessList();
    } catch (err) {
      console.error(err);
    } finally {
      setRevokingId(null);
    }
  };

  const activePartners = partners.filter(p => p.status === 'active');
  const pendingPartners = partners.filter(p => p.status === 'pending');
  const activeClinicians = clinicians.filter(c => c.status === 'active' && c.expiresAt > new Date().toISOString());

  return (
    <div className="bg-white border border-[var(--border-hairline)] p-5 rounded-[22px] shadow-card-1 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--lavender-100)] flex items-center justify-center text-[var(--haven-deep)]">
            <Shield className="w-4 h-4 text-[var(--haven-orchid)]" />
          </div>
          <div>
            <h4 className="font-display font-bold text-sm text-[var(--ink-900)]">
              Connected Access & Privacy Manager
            </h4>
            <p className="font-body text-[11px] text-[var(--ink-600)]">
              Manage active partner links and ephemeral clinic session grants
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={loadAccessList}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Active Partner Connections */}
      <div className="space-y-2 pt-1">
        <h5 className="font-display font-semibold text-xs text-[var(--ink-700)] uppercase tracking-wider">
          Linked Partner Accounts
        </h5>

        {activePartners.length === 0 && pendingPartners.length === 0 ? (
          <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-[12px]">
            No partner accounts linked.
          </p>
        ) : (
          <>
            {activePartners.map((p) => (
              <div
                key={p.id}
                className="p-3.5 bg-[var(--lavender-50)] border border-[var(--border-hairline)] rounded-[14px] flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <HeartHandshake className="w-4 h-4 text-[var(--haven-orchid)]" />
                  <div>
                    <span className="font-display font-bold text-xs text-[var(--ink-900)]">
                      {p.partnerName || 'Linked Partner'}
                    </span>
                    <p className="text-[10px] text-[var(--ink-600)]">
                      Scope: Logistics & Support Only · Connected {new Date(p.connectedAt || p.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevokePartner(p.id)}
                  disabled={revokingId === p.id}
                  className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-full text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Revoke
                </button>
              </div>
            ))}

            {pendingPartners.map((p) => (
              <div
                key={p.id}
                className="p-3.5 bg-amber-50 border border-amber-200 rounded-[14px] flex items-center justify-between"
              >
                <div>
                  <span className="font-display font-semibold text-xs text-amber-900">
                    Pending Invite Code: <span className="font-mono font-bold">{p.connectionCode}</span>
                  </span>
                  <p className="text-[10px] text-amber-700">Awaiting partner redemption</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevokePartner(p.id)}
                  disabled={revokingId === p.id}
                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-full text-[11px] font-semibold cursor-pointer"
                >
                  Cancel Code
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Active Clinic Ephemeral Sessions */}
      <div className="space-y-2 pt-2">
        <h5 className="font-display font-semibold text-xs text-[var(--ink-700)] uppercase tracking-wider">
          Active Ephemeral Clinic Sessions
        </h5>

        {activeClinicians.length === 0 ? (
          <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-[12px]">
            No active temporary clinic sessions.
          </p>
        ) : (
          activeClinicians.map((c) => (
            <div
              key={c.id}
              className="p-3.5 bg-blue-50 border border-blue-200 rounded-[14px] flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <Stethoscope className="w-4 h-4 text-blue-600" />
                <div>
                  <span className="font-display font-bold text-xs text-blue-950 font-mono">
                    {c.shareCode}
                  </span>
                  <p className="text-[10px] text-blue-700">
                    Expires at {new Date(c.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRevokeClinician(c.id)}
                disabled={revokingId === c.id}
                className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-full text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                End Session
              </button>
            </div>
          ))
        )}
      </div>

      {/* Sharing & Consent History (Auditable Log) */}
      <div className="space-y-2.5 pt-3 border-t border-[var(--border-hairline)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--haven-orchid)]" />
            <h5 className="font-display font-semibold text-xs text-[var(--ink-700)] uppercase tracking-wider">
              Sharing & Consent History
            </h5>
          </div>
          <span className="text-[11px] text-gray-500 font-medium">
            {consentHistory.length} {consentHistory.length === 1 ? 'event' : 'events'} logged
          </span>
        </div>
        <p className="text-[11px] text-[var(--ink-600)]">
          Auditable record of all partner link activations and clinical record access codes granted from your account.
        </p>

        {consentHistory.length === 0 ? (
          <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-[12px]">
            No consent events recorded yet.
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
            {consentHistory.map((item) => {
              const isRevoked = !!item.revokedAt;
              const isExpired = !isRevoked && !!item.expiresAt && new Date(item.expiresAt).getTime() < Date.now();
              const isPartner = item.consentType === 'partner_access';

              return (
                <div
                  key={item.id}
                  className="p-3 bg-gray-50 border border-gray-200 rounded-[14px] flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isPartner ? (
                        <HeartHandshake className="w-4 h-4 text-[var(--haven-orchid)] shrink-0" />
                      ) : (
                        <Stethoscope className="w-4 h-4 text-blue-600 shrink-0" />
                      )}
                      <span className="font-display font-bold text-xs text-[var(--ink-900)]">
                        {isPartner ? (item.targetName || 'Partner Link') : (item.targetName || 'Clinical Access')}
                      </span>
                      {item.shareCode && (
                        <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-gray-200 text-gray-700">
                          {item.shareCode}
                        </span>
                      )}
                    </div>
                    <div>
                      {isRevoked ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-semibold rounded-full">
                          Revoked
                        </span>
                      ) : isExpired ? (
                        <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-[10px] font-semibold rounded-full">
                          Expired
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-semibold rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Active
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-[10px] text-gray-500 space-y-0.5">
                    <p>
                      Granted: {new Date(item.grantedAt || item.createdAt || '').toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {item.revokedAt && (
                        <span className="ml-2 text-red-600">
                          · Revoked: {new Date(item.revokedAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </p>
                    {item.scopes && item.scopes.length > 0 && (
                      <p className="text-gray-600">
                        Scope: <span className="text-gray-700 font-medium">{item.scopes.join(', ')}</span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
