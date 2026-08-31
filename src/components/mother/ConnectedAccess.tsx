import React, { useState } from 'react';
import { ChevronLeft, Users, Shield, Trash2, Key, CheckCircle2 } from 'lucide-react';
import { RevokeAccessModal } from './RevokeAccessModal';

interface ConnectedAccessProps {
  onBack: () => void;
}

export const ConnectedAccess: React.FC<ConnectedAccessProps> = ({ onBack }) => {
  const [partnerConnected, setPartnerConnected] = useState(true);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<string>('');

  const handleOpenRevoke = (targetName: string) => {
    setRevokeTarget(targetName);
    setShowRevokeModal(true);
  };

  const handleConfirmRevoke = () => {
    if (revokeTarget.includes('Partner')) {
      setPartnerConnected(false);
    }
    setShowRevokeModal(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top App Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white border border-border-hairline shadow-sm flex items-center justify-center text-ink-900 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-xl text-ink-900">Connected Access</h1>
        <div className="w-10" />
      </div>

      {/* Active Grants List */}
      <div className="space-y-3">
        <span className="font-body text-[11px] font-bold tracking-wider text-ink-600 uppercase px-1">
          ACTIVE DELEGATIONS
        </span>

        {partnerConnected ? (
          <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-ink-900">
                    Connected Partner (Kiprono C.)
                  </h4>
                  <p className="font-body text-xs text-ink-600">
                    Granted 1 Feb 2026 · Active
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleOpenRevoke('Partner (Kiprono C.)')}
                className="text-xs font-display font-bold text-red-600 hover:underline p-1"
              >
                Revoke
              </button>
            </div>
            <p className="font-body text-xs text-ink-600 bg-lavender-50/50 p-2.5 rounded-xl border border-border-hairline/60">
              Access: Birth plan logistics, emergency contacts, baby growth milestones. No clinical records.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-6 text-center text-ink-600 text-xs font-body">
            No active partner or caregiver delegations.
          </div>
        )}
      </div>

      {/* Past Clinical Grants */}
      <div className="space-y-3">
        <span className="font-body text-[11px] font-bold tracking-wider text-ink-600 uppercase px-1">
          RECENT CLINICAL SESSIONS
        </span>

        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-display font-bold text-sm text-ink-900">
                Kariokor Health Centre · Nurse A. Wanjiru
              </h4>
              <p className="font-body text-xs text-ink-600">2 Mar 2026 · Temporary share code</p>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-lavender-100 text-ink-600 text-[10px] font-display font-bold">
              Expired
            </span>
          </div>
        </div>
      </div>

      {/* Revoke Modal */}
      <RevokeAccessModal
        isOpen={showRevokeModal}
        targetName={revokeTarget}
        onClose={() => setShowRevokeModal(false)}
        onConfirm={handleConfirmRevoke}
      />
    </div>
  );
};
