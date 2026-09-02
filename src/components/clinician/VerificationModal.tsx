// src/components/clinician/VerificationModal.tsx
import React, { useState } from 'react';
import { ShieldCheck, X, CheckCircle2, AlertCircle, Sparkles, Building2, UserCheck } from 'lucide-react';
import Button from '../Button';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordTitle: string;
  recordType: 'ANC Encounter' | 'Immunization' | 'Growth Measurement' | 'Postnatal Encounter';
  motherEnteredData: Record<string, any>;
  clinicianName: string;
  facilityName: string;
  onConfirmVerification: (adjustments?: Record<string, any>) => Promise<void>;
}

export default function VerificationModal({
  isOpen,
  onClose,
  recordTitle,
  recordType,
  motherEnteredData,
  clinicianName,
  facilityName,
  onConfirmVerification,
}: VerificationModalProps) {
  const [loading, setLoading] = useState(false);
  const [adjustedValues, setAdjustedValues] = useState<Record<string, any>>({});
  const [hasEdits, setHasEdits] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFieldChange = (key: string, val: any) => {
    setAdjustedValues(prev => ({ ...prev, [key]: val }));
    setHasEdits(true);
  };

  const handleVerify = async () => {
    try {
      setLoading(true);
      setError(null);
      await onConfirmVerification(hasEdits ? adjustedValues : undefined);
      onClose();
    } catch (err: any) {
      console.error('Verification stamp failed', err);
      setError(err?.message || 'Failed to stamp verification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-[24px] border border-[var(--border-hairline)] shadow-card-3 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[var(--haven-deep)] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-display font-bold text-[16px] leading-tight">
                Verify Clinical Record
              </h3>
              <p className="text-[11px] text-purple-200">
                MOH 216 Official Electronic Provenance Stamp
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-[13px]">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--haven-orchid)] bg-[var(--lavender-100)] px-2 py-0.5 rounded-md">
              {recordType}
            </span>
            <h4 className="font-display font-bold text-[16px] text-[var(--ink-900)] mt-1">
              {recordTitle}
            </h4>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-[12px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Comparison Table */}
          <div className="border border-[var(--border-hairline)] rounded-[16px] overflow-hidden">
            <div className="bg-[var(--lavender-50)] px-4 py-2.5 border-b border-[var(--border-hairline)] flex justify-between font-display font-bold text-[12px] text-[var(--ink-900)]">
              <span>Clinical Parameter</span>
              <span>Patient Reported Value</span>
            </div>
            <div className="divide-y divide-[var(--border-hairline)]">
              {Object.entries(motherEnteredData).map(([key, val]) => (
                <div key={key} className="px-4 py-2.5 flex items-center justify-between text-xs">
                  <span className="text-gray-600 font-medium capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="font-bold text-[var(--ink-900)] bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                    {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : (val?.toString() || '—')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Clinician Stamp Details */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-[16px] space-y-1 text-xs text-emerald-900">
            <div className="flex items-center gap-1.5 font-bold text-emerald-950">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Electronic Audit Signature Details:</span>
            </div>
            <p><strong>Clinician:</strong> {clinicianName}</p>
            <p><strong>Facility:</strong> {facilityName}</p>
            <p><strong>Stamp Timestamp:</strong> {new Date().toLocaleString()}</p>
            <p className="text-[11px] text-emerald-700 pt-1">
              Applying this stamp promotes the record to verified status in the Kenyan MOH 216 e-handbook registry.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[var(--lavender-50)] border-t border-[var(--border-hairline)] flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="py-2.5 px-4 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleVerify}
            disabled={loading}
            className="py-2.5 px-5 text-xs bg-emerald-700 hover:bg-emerald-800 flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            {loading ? 'Stamping...' : 'Confirm & Stamp Verified'}
          </Button>
        </div>
      </div>
    </div>
  );
}
