import React, { useState } from 'react';
import { X, Calendar, FileText, CheckCircle2, ShieldAlert, Sparkles, ArrowRight, HeartHandshake } from 'lucide-react';
import Button from '../Button';
import { updateReminder } from '../../services/reminderService';

interface ReminderDetailModalProps {
  reminder: any;
  onClose: () => void;
  onLogVisit: () => void;
}

export default function ReminderDetailModal({
  reminder,
  onClose,
  onLogVisit,
}: ReminderDetailModalProps) {
  const [sharedWithPartner, setSharedWithPartner] = useState<boolean>(
    reminder?.sharedWithPartner ?? false
  );
  const [savingShare, setSavingShare] = useState(false);

  if (!reminder) return null;

  const handleToggleShare = async () => {
    if (!reminder?.id) return;
    const nextVal = !sharedWithPartner;
    setSharedWithPartner(nextVal);
    setSavingShare(true);
    try {
      await updateReminder(reminder.id, { sharedWithPartner: nextVal });
      reminder.sharedWithPartner = nextVal;
    } catch (err) {
      console.error('Failed to update shared reminder setting', err);
      setSharedWithPartner(!nextVal);
    } finally {
      setSavingShare(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-[28px] sm:rounded-[24px] w-full max-w-md p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--lavender-100)] text-[var(--haven-deep)] text-[11px] font-display font-bold uppercase tracking-wider">
              Care Reminder
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--lavender-50)] flex items-center justify-center text-[var(--ink-600)] hover:text-[var(--ink-900)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-4">
          <div>
            <h2 className="font-display font-bold text-[22px] text-[var(--ink-900)] leading-tight">
              {reminder.title || 'ANC Contact 4 Due'}
            </h2>
            <div className="flex items-center gap-1.5 text-[13px] text-[var(--haven-orchid)] font-display font-semibold mt-1">
              <Calendar className="w-4 h-4" />
              <span>Recommended between Week 24 and Week 26</span>
            </div>
          </div>

          {/* Clinical Purpose Box */}
          <div className="bg-[var(--lavender-50)] p-4 rounded-[18px] border border-[var(--border-hairline)] space-y-2">
            <h4 className="font-display font-bold text-[14px] text-[var(--haven-deep)] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Clinical Purpose</span>
            </h4>
            <p className="font-body text-[13px] text-[var(--ink-700)] leading-relaxed">
              {reminder.description || "This encounter focuses on maternal blood pressure monitoring, screening for gestational diabetes, reviewing hemoglobin levels, and tracking fundal height growth to ensure baby is thriving."}
            </p>
          </div>

          {/* What to carry */}
          <div className="bg-white p-4 rounded-[18px] border border-[var(--border-hairline)] shadow-xs space-y-2.5">
            <h4 className="font-display font-bold text-[14px] text-[var(--ink-900)] flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[var(--haven-orchid)]" />
              <span>What to Carry to Clinic</span>
            </h4>
            <ul className="space-y-1.5 text-[13px] text-[var(--ink-700)] font-body">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Mother &amp; Child Health Handbook (MOH 216)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Previous ultrasound scans or laboratory results</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Daily IFAS / Calcium supplements for refills</span>
              </li>
            </ul>
          </div>

          {/* Share with Partner Toggle */}
          <div className="bg-[var(--lavender-50)] p-3.5 rounded-[18px] border border-[var(--border-hairline)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-[var(--haven-deep)] flex items-center justify-center shrink-0">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-display font-bold text-[13px] text-[var(--ink-900)]">
                  Share with partner
                </h4>
                <p className="text-[11px] text-[var(--ink-600)]">
                  {sharedWithPartner 
                    ? 'Visible on partner’s shared appointments feed' 
                    : 'Kept private to your personal profile only'}
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={sharedWithPartner}
              disabled={savingShare}
              onClick={handleToggleShare}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                sharedWithPartner ? 'bg-[var(--haven-deep)]' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  sharedWithPartner ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <Button
            variant="primary"
            onClick={() => {
              onClose();
              onLogVisit();
            }}
            className="w-full py-3.5 flex items-center justify-center gap-2 font-display font-bold"
          >
            <span>Log this visit now</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-center text-[13px] font-display font-semibold text-[var(--ink-600)] hover:text-[var(--ink-900)] cursor-pointer"
          >
            Remind me tomorrow
          </button>
        </div>
      </div>
    </div>
  );
}
