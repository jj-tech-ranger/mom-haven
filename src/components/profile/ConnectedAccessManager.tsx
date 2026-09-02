// src/components/profile/ConnectedAccessManager.tsx
import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, HeartHandshake, Stethoscope, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';
import { 
  getConnectedAccessList, 
  revokePartnerAccess, 
  revokeClinicianSession, 
  PartnerRelationship, 
  ClinicianAccessSession 
} from '../../services/sharingService';

interface ConnectedAccessManagerProps {
  motherId: string;
}

export default function ConnectedAccessManager({ motherId }: ConnectedAccessManagerProps) {
  const [partners, setPartners] = useState<PartnerRelationship[]>([]);
  const [clinicians, setClinicians] = useState<ClinicianAccessSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadAccessList = async () => {
    try {
      setLoading(true);
      const data = await getConnectedAccessList(motherId);
      setPartners(data.partners);
      setClinicians(data.clinicians);
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

  const activePartners = partners.filter(p => p.status === 'connected');
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
    </div>
  );
}
