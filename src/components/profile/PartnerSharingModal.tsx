// src/components/profile/PartnerSharingModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Users, Copy, Check, ShieldCheck, HeartHandshake, AlertCircle } from 'lucide-react';
import Button from '../Button';
import { createPartnerConnectionCode, getMotherPartnerRelationship, PartnerRelationship } from '../../services/sharingService';

interface PartnerSharingModalProps {
  motherId: string;
  motherName?: string;
  onClose: () => void;
}

export default function PartnerSharingModal({ motherId, motherName = 'Mama', onClose }: PartnerSharingModalProps) {
  const [relationship, setRelationship] = useState<PartnerRelationship | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const existing = await getMotherPartnerRelationship(motherId);
        if (existing) {
          setRelationship(existing);
        } else {
          const created = await createPartnerConnectionCode(motherId, motherName);
          setRelationship(created);
        }
      } catch (err) {
        console.error('Error generating partner code', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [motherId, motherName]);

  const handleCopy = () => {
    if (relationship?.connectionCode) {
      navigator.clipboard.writeText(relationship.connectionCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGenerateNew = async () => {
    setLoading(true);
    try {
      const created = await createPartnerConnectionCode(motherId, motherName);
      setRelationship(created);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white w-full max-w-md rounded-[24px] shadow-card-2 border border-[var(--border-hairline)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-hairline)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--lavender-100)] flex items-center justify-center text-[var(--haven-deep)]">
              <HeartHandshake className="w-5 h-5 text-[var(--haven-orchid)]" />
            </div>
            <div>
              <h3 className="font-display font-bold text-[17px] text-[var(--ink-900)]">
                Partner Connection Code
              </h3>
              <p className="font-body text-xs text-[var(--ink-600)]">
                Link your partner for appointment & birth plan support
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-[var(--ink-600)] hover:bg-gray-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-center space-y-5">
          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-3 border-[var(--haven-orchid)] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs text-[var(--ink-600)]">Generating secure partner link...</p>
            </div>
          ) : (
            <>
              {relationship?.status === 'active' ? (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-[18px]">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-2">
                    <Check className="w-5 h-5" />
                  </div>
                  <h4 className="font-display font-bold text-sm text-emerald-900">
                    Connected to {relationship.partnerName || 'Partner'}
                  </h4>
                  <p className="font-body text-xs text-emerald-700 mt-1">
                    Your partner is actively linked to receive appointment updates and manage birth plan transport.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="font-body text-xs text-[var(--ink-600)] leading-relaxed">
                    Share this 6-character code with your partner. They can enter it in the MomHaven Partner app to connect.
                  </p>

                  {/* Code Card */}
                  <div className="bg-[var(--lavender-50)] border-2 border-dashed border-[var(--haven-orchid)]/40 p-5 rounded-[20px] flex flex-col items-center justify-center">
                    <span className="text-[10px] uppercase tracking-widest font-display font-extrabold text-[var(--haven-deep)] mb-1">
                      Connection Code
                    </span>
                    <span className="font-mono font-extrabold text-[28px] tracking-widest text-[var(--haven-deep)] select-all">
                      {relationship?.connectionCode || 'HAVEN-942'}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[var(--border-hairline)] shadow-xs text-xs font-display font-bold text-[var(--ink-900)] hover:bg-[var(--lavender-100)] cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied to Clipboard!' : 'Copy Code'}
                    </button>
                  </div>
                </div>
              )}

              {/* Strict Privacy Notice */}
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-[16px] text-left flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="font-body text-[11px] text-amber-900 leading-relaxed">
                  <strong>Clinical Privacy Guarantee:</strong> Your partner will view birth plan logistics and appointment dates. They will <u>NEVER</u> have access to your private medical records, lab tests, or clinical notes.
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateNew}
                  className="flex-1 py-2.5 text-xs"
                >
                  Generate New Code
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={onClose}
                  className="flex-1 py-2.5 text-xs"
                >
                  Done
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
