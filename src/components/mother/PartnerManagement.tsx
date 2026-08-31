import React, { useState } from 'react';
import { ChevronLeft, Users, Key, Trash2, ShieldCheck, CheckCircle2, QrCode } from 'lucide-react';
import { PartnerRelationshipDoc } from '../../types';

interface PartnerManagementProps {
  partner?: PartnerRelationshipDoc | null;
  onBack: () => void;
  onOpenGenerateCode: () => void;
  onRevokePartner: () => void;
}

export const PartnerManagement: React.FC<PartnerManagementProps> = ({
  partner,
  onBack,
  onOpenGenerateCode,
  onRevokePartner,
}) => {
  const isConnected = !!partner && partner.status === 'active';

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
        <h1 className="font-display font-bold text-xl text-ink-900">Partner Management</h1>
        <div className="w-10" />
      </div>

      {isConnected ? (
        /* Connected Partner Card */
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-ink-900">
                  Connected Partner
                </h3>
                <p className="font-body text-xs text-ink-600 mt-0.5">
                  Connected on {partner?.createdAt || '2026-02-01'}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-pill bg-emerald-100 text-emerald-800 text-xs font-display font-bold">
              Active
            </span>
          </div>

          <div className="space-y-2 pt-2 border-t border-border-hairline/60">
            <h4 className="font-display font-bold text-xs text-ink-600 uppercase tracking-wider">
              Allowed Shared Views
            </h4>
            <ul className="space-y-1.5 text-xs text-ink-900 font-body">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Birth plan logistics & emergency transport contacts</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Child milestone updates & daily nutrition guidance</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Upcoming clinic appointment calendar reminders</span>
              </li>
            </ul>
          </div>
        </div>
      ) : (
        /* Empty State / Not Connected */
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-lavender-100 flex items-center justify-center mx-auto text-haven-orchid">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-[260px] mx-auto">
            <h3 className="font-display font-bold text-lg text-ink-900">No partner connected</h3>
            <p className="font-body text-xs text-ink-600 leading-relaxed">
              Connect your partner to coordinate birth transport, emergency readiness, and child milestones.
            </p>
          </div>
        </div>
      )}

      {/* Primary Action Button */}
      <div className="space-y-3 pt-2">
        <button
          onClick={onOpenGenerateCode}
          className="w-full py-4 px-6 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-base rounded-pill shadow-button hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Key className="w-5 h-5" />
          <span>{isConnected ? 'Generate new partner code' : 'Generate connection code'}</span>
        </button>

        {isConnected && (
          <button
            onClick={onRevokePartner}
            className="w-full py-3.5 px-6 bg-white border border-red-200 text-red-600 font-display font-bold text-sm rounded-pill hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Revoke partner access</span>
          </button>
        )}
      </div>
    </div>
  );
};
