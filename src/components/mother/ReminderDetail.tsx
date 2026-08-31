import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Pill,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  ChevronRight,
  FileCheck,
} from 'lucide-react';
import { ReminderDoc } from '../../types';
import Button from '../Button';

interface ReminderDetailProps {
  reminder: ReminderDoc;
  onBack: () => void;
  onMarkDone: (reminderId: string) => Promise<void>;
  onSnooze: (reminderId: string) => void;
  onDismiss: (reminderId: string) => void;
}

export const ReminderDetail: React.FC<ReminderDetailProps> = ({
  reminder,
  onBack,
  onMarkDone,
  onSnooze,
  onDismiss,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [doneSuccess, setDoneSuccess] = useState(reminder.completed);

  const isOverdue =
    !reminder.completed &&
    new Date(reminder.dueDate).getTime() < new Date().setHours(0, 0, 0, 0);

  const isToday =
    new Date(reminder.dueDate).toDateString() === new Date().toDateString();

  const handleAction = async () => {
    setSubmitting(true);
    try {
      await onMarkDone(reminder.id);
      setDoneSuccess(true);
    } catch (err) {
      console.error('Error completing reminder:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-lavender-50 pb-24 flex flex-col">
      {/* Top App Bar */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-border-hairline px-5 py-3.5 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-lavender-100 flex items-center justify-center text-haven-deep hover:bg-lavender-200 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-display font-bold text-lg text-ink-900 leading-tight">
              Reminder Detail
            </h1>
            <span className="text-[10px] font-display font-bold text-haven-orchid uppercase">
              M-TODAY-004
            </span>
          </div>
        </div>

        <span
          className={`text-[11px] font-display font-bold px-2.5 py-1 rounded-pill ${
            doneSuccess
              ? 'bg-status-normal-bg text-status-normal'
              : isOverdue
              ? 'bg-status-urgent-bg text-status-urgent'
              : isToday
              ? 'bg-status-urgent-bg text-status-urgent'
              : 'bg-lavender-200 text-haven-deep'
          }`}
        >
          {doneSuccess
            ? 'Completed'
            : isOverdue
            ? 'Overdue'
            : isToday
            ? 'Due Today'
            : 'Upcoming'}
        </span>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-5 pt-4 space-y-4">
        {/* Main Explainer Card */}
        <div
          className={`bg-white rounded-card p-5 shadow-card-1 border transition-all ${
            isOverdue
              ? 'border-status-urgent/40 ring-1 ring-status-urgent/20'
              : 'border-border-hairline'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-display font-bold uppercase tracking-wider text-haven-orchid bg-lavender-100 px-2 py-0.5 rounded-pill">
              {reminder.category}
            </span>
            {isOverdue && (
              <span className="flex items-center gap-1 text-[11px] font-display font-bold text-status-urgent bg-status-urgent-bg px-2 py-0.5 rounded-pill">
                <AlertTriangle className="w-3 h-3" />
                <span>Action Needed</span>
              </span>
            )}
          </div>

          <h2 className="font-display font-bold text-xl text-ink-900 leading-snug">
            {reminder.title}
          </h2>

          {reminder.detail && (
            <p className="font-body text-sm text-ink-600 mt-1.5 leading-relaxed">
              {reminder.detail}
            </p>
          )}

          <div className="mt-4 pt-4 border-t border-border-hairline grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 text-ink-600">
              <Calendar className="w-4 h-4 text-haven-orchid shrink-0" />
              <div>
                <p className="text-[10px] text-ink-400 font-semibold uppercase">Due Date</p>
                <p className="font-display font-bold text-ink-900">
                  {new Date(reminder.dueDate).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {reminder.facility ? (
              <div className="flex items-center gap-2 text-ink-600">
                <MapPin className="w-4 h-4 text-haven-orchid shrink-0" />
                <div>
                  <p className="text-[10px] text-ink-400 font-semibold uppercase">Facility</p>
                  <p className="font-display font-bold text-ink-900 truncate">
                    {reminder.facility}
                  </p>
                </div>
              </div>
            ) : reminder.dosage ? (
              <div className="flex items-center gap-2 text-ink-600">
                <Pill className="w-4 h-4 text-status-normal shrink-0" />
                <div>
                  <p className="text-[10px] text-ink-400 font-semibold uppercase">Dosage</p>
                  <p className="font-display font-bold text-ink-900">
                    {reminder.dosage}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* MOH 216 Clinical Guidance Note */}
        <div className="bg-white rounded-card p-4 shadow-card-1 border border-border-hairline space-y-2">
          <div className="flex items-center gap-2 text-haven-deep font-display font-bold text-xs">
            <Info className="w-4 h-4 text-haven-orchid shrink-0" />
            <span>MOH 216 Clinical Rationale</span>
          </div>
          <p className="font-body text-xs text-ink-600 leading-relaxed">
            {reminder.clinicalGuidance ||
              "Attending your scheduled contacts and taking your daily supplements supports vital fetal organ growth, prevents maternal anemia, and safeguards early maternal health."}
          </p>
        </div>

        {/* Provenance and Integrity Card */}
        <div className="bg-lavender-100/60 rounded-card p-3.5 border border-border-hairline flex items-center justify-between text-xs text-ink-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-haven-orchid" />
            <span>MCH Protocol Schedule</span>
          </div>
          <span className="font-display font-semibold text-[11px] text-haven-deep">
            Kenya National Guidelines
          </span>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 space-y-2.5">
          {!doneSuccess ? (
            <>
              <Button
                variant="primary"
                onClick={handleAction}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? 'Updating...' : 'Mark done / Add to records'}</span>
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onSnooze(reminder.id)}
                  className="py-2.5 px-3 rounded-pill bg-white border-1.5 border-haven-deep text-haven-deep font-display font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-lavender-50 transition-colors cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Snooze (1 day)</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDismiss(reminder.id)}
                  className="py-2.5 px-3 rounded-pill bg-white border border-border-hairline text-ink-600 font-display font-bold text-xs flex items-center justify-center hover:bg-lavender-100 transition-colors cursor-pointer"
                >
                  <span>Dismiss</span>
                </button>
              </div>
            </>
          ) : (
            <div className="p-4 rounded-card bg-status-normal-bg border border-status-normal/20 text-center space-y-2">
              <CheckCircle2 className="w-6 h-6 text-status-normal mx-auto" />
              <p className="font-display font-bold text-sm text-status-normal">
                Marked as completed!
              </p>
              <button
                onClick={onBack}
                className="text-xs font-display font-bold text-haven-deep underline cursor-pointer"
              >
                Return to Today Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
