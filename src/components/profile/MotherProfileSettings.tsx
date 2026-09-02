import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  Share2, 
  Download, 
  LogOut, 
  ShieldCheck, 
  CheckCircle2, 
  KeyRound, 
  Smartphone, 
  Copy,
  ChevronRight
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import Button from '../Button';

interface MotherProfileSettingsProps {
  motherName: string;
  email: string;
  phone?: string;
  county?: string;
  onOpenPinSetup: () => void;
  onOpenPartnerShare: () => void;
  onOpenExportData: () => void;
  onSignOut: () => void;
}

export default function MotherProfileSettings({
  motherName = 'Mama Jemimah',
  email = 'jemutaijemimah@gmail.com',
  phone = '+254 712 345 678',
  county = 'Nairobi',
  onOpenPinSetup,
  onOpenPartnerShare,
  onOpenExportData,
  onSignOut,
}: MotherProfileSettingsProps) {
  const [partnerInviteCode] = useState('HAVEN-7892');
  const [copied, setCopied] = useState(false);

  const copyInvite = () => {
    navigator.clipboard.writeText(`Join my MomHaven pregnancy support circle with invite code: ${partnerInviteCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onSignOut();
    } catch (err) {
      console.error('Logout error', err);
      onSignOut();
    }
  };

  return (
    <div className="space-y-5 p-4 sm:p-6 pb-28 max-w-lg mx-auto">
      {/* Profile Header */}
      <div className="bg-white rounded-[26px] p-6 border border-[var(--border-hairline)] shadow-card-1 text-center space-y-3">
        <div className="w-18 h-18 rounded-full bg-[var(--lavender-100)] border-2 border-[var(--haven-orchid)]/30 mx-auto flex items-center justify-center text-[var(--haven-deep)] font-display font-extrabold text-[24px]">
          {motherName.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <h2 className="font-display font-black text-[20px] text-[var(--ink-900)]">
            {motherName}
          </h2>
          <p className="text-[13px] text-[var(--ink-600)] font-body">
            {email}
          </p>
          <span className="inline-block px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-display font-bold mt-1.5">
            County: {county} · Active Profile
          </span>
        </div>
      </div>

      {/* Security & Access Section */}
      <div className="bg-white rounded-[24px] p-4 border border-[var(--border-hairline)] shadow-card-1 space-y-1">
        <h3 className="font-display font-bold text-[14px] text-[var(--ink-900)] px-2 py-1">
          Security &amp; Privacy
        </h3>

        {/* App Lock PIN */}
        <div
          onClick={onOpenPinSetup}
          className="flex items-center justify-between p-3 rounded-[16px] hover:bg-[var(--lavender-50)] cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-[var(--haven-deep)] flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-display font-bold text-[14px] text-[var(--ink-900)]">
                App Lock PIN
              </h4>
              <p className="text-[12px] text-[var(--ink-600)]">4-digit confidential lock</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--ink-400)]" />
        </div>

        {/* Partner Connection Code */}
        <div
          onClick={onOpenPartnerShare}
          className="flex items-center justify-between p-3 rounded-[16px] hover:bg-[var(--lavender-50)] cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-display font-bold text-[14px] text-[var(--ink-900)]">
                Partner / Family Access
              </h4>
              <p className="text-[12px] text-[var(--ink-600)]">Pair support circle: {partnerInviteCode}</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--ink-400)]" />
        </div>

        {/* Export Data */}
        <div
          onClick={onOpenExportData}
          className="flex items-center justify-between p-3 rounded-[16px] hover:bg-[var(--lavender-50)] cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-display font-bold text-[14px] text-[var(--ink-900)]">
                Download Health Passport Data
              </h4>
              <p className="text-[12px] text-[var(--ink-600)]">MOH 216 JSON / PDF backup</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--ink-400)]" />
        </div>
      </div>

      {/* Sign Out Button */}
      <button
        type="button"
        onClick={handleLogout}
        className="w-full py-3.5 rounded-full border border-rose-200 text-rose-700 bg-rose-50/50 font-display font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        <span>Sign Out of MomHaven</span>
      </button>
    </div>
  );
}
