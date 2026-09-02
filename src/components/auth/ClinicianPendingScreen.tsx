// src/components/auth/ClinicianPendingScreen.tsx
import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Clock, 
  RefreshCw, 
  LogOut, 
  CheckCircle2, 
  Stethoscope, 
  Building2, 
  FileCheck, 
  AlertCircle 
} from 'lucide-react';
import Button from '../Button';
import { Clinician } from '../../types';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface ClinicianPendingScreenProps {
  clinicianId: string;
  clinicianName?: string;
  clinicianData?: Partial<Clinician> | null;
  onRefresh: () => void;
  onSignOut: () => void;
  onInstantApprove?: () => void;
}

export default function ClinicianPendingScreen({
  clinicianId,
  clinicianName = 'Healthcare Professional',
  clinicianData,
  onRefresh,
  onSignOut,
  onInstantApprove,
}: ClinicianPendingScreenProps) {
  const [checking, setChecking] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const handleRefresh = async () => {
    setChecking(true);
    await onRefresh();
    setTimeout(() => setChecking(false), 800);
  };

  const handleDemoApproval = async () => {
    setSimulating(true);
    try {
      if (onInstantApprove) {
        onInstantApprove();
      } else {
        await updateDoc(doc(db, 'clinicians', clinicianId), {
          verificationStatus: 'approved',
          updatedAt: serverTimestamp(),
        });
        await onRefresh();
      }
    } catch (e) {
      console.error('Approval simulation error', e);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--lavender-50)] flex flex-col items-center justify-center p-4 sm:p-6 font-body">
      <div className="w-full max-w-lg bg-white rounded-[28px] border border-[var(--border-hairline)] p-6 sm:p-8 shadow-card-2 text-center space-y-5">
        
        {/* Badge Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 mx-auto flex items-center justify-center shadow-xs">
          <Clock className="w-8 h-8 text-amber-700 animate-pulse" />
        </div>

        {/* Header */}
        <div>
          <span className="text-[11px] font-display font-extrabold uppercase tracking-widest text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            MOH Clinical Credential Review
          </span>
          <h2 className="font-display font-extrabold text-[24px] text-[var(--ink-900)] mt-2.5 leading-tight">
            Medical Verification Pending
          </h2>
          <p className="font-body text-xs text-[var(--ink-600)] mt-1.5 max-w-sm mx-auto leading-relaxed">
            Welcome, <strong>{clinicianName}</strong>. Your medical council credentials (KMPDC / NCK / COC) have been submitted and are under review by MOH Clinical Governance.
          </p>
        </div>

        {/* Strict Security Notice */}
        <div className="bg-amber-50/80 border border-amber-200/80 p-4 rounded-[18px] text-left flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-display font-bold text-xs text-amber-950">
              Access Boundary Enforcement
            </h4>
            <p className="font-body text-[11px] text-amber-900 leading-relaxed">
              Under Kenyan Health Data Governance regulations, no maternal or child patient records can be accessed or modified until your license is verified and authorized by an administrator.
            </p>
          </div>
        </div>

        {/* Submitted Credentials Card */}
        <div className="bg-[var(--lavender-50)] border border-[var(--border-hairline)] rounded-[20px] p-4 text-left space-y-2.5 text-xs">
          <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-2">
            <span className="font-display font-bold text-[var(--ink-600)]">Cadre / Designation</span>
            <span className="font-display font-bold text-[var(--ink-900)]">
              {clinicianData?.cadre || 'Medical Officer (ObsGyn)'}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-2">
            <span className="font-display font-bold text-[var(--ink-600)]">Council License No.</span>
            <span className="font-mono font-bold text-[var(--ink-900)]">
              {clinicianData?.licenseNumber || 'KMPDC A-14920'}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-2">
            <span className="font-display font-bold text-[var(--ink-600)]">Health Facility</span>
            <span className="font-display font-bold text-[var(--ink-900)] text-right">
              {clinicianData?.facilityName || 'Kenyatta National Hospital'}
            </span>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <span className="font-display font-bold text-[var(--ink-600)]">Review Status</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full">
              <Clock className="w-3 h-3" />
              Pending Approval
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-2.5 pt-2">
          <Button
            type="button"
            variant="primary"
            onClick={handleRefresh}
            disabled={checking}
            className="w-full py-3 text-xs flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking Status...' : 'Check Approval Status'}
          </Button>

          {/* Quick Demo Approval for testing */}
          <button
            type="button"
            onClick={handleDemoApproval}
            disabled={simulating}
            className="w-full py-2.5 px-4 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-display font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {simulating ? 'Approving...' : 'Demo Fast-Track: Approve Medical Credentials'}
          </button>

          <button
            type="button"
            onClick={onSignOut}
            className="w-full py-2.5 text-xs font-display font-bold text-[var(--ink-600)] hover:text-red-600 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
