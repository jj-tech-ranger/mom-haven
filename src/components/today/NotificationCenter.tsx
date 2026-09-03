import React from 'react';
import { ArrowLeft, Bell } from 'lucide-react';
import { Reminder } from '../../types';
import EmptyState from '../EmptyState';

interface NotificationCenterProps {
  onBack: () => void;
  onSelectReminder: (reminder: Reminder | any) => void;
}

export default function NotificationCenter({ onBack }: NotificationCenterProps) {
  return (
    <div className="min-h-screen bg-[var(--lavender-50)] pb-24">
      <div className="px-5 pt-6 pb-4 bg-white border-b border-[var(--border-hairline)] sticky top-0 z-10 flex items-center justify-between">
        <button type="button" onClick={onBack} aria-label="Back" className="w-10 h-10 rounded-full bg-[var(--lavender-50)] flex items-center justify-center text-[var(--ink-900)] cursor-pointer"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="font-display font-extrabold text-[18px] text-[var(--ink-900)]">Notification Center</h1>
        <span className="w-10" aria-hidden="true" />
      </div>
      <div className="p-4 max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border border-[var(--border-hairline)] shadow-card-1 overflow-hidden">
          <EmptyState icon={Bell} title="No notifications yet" message="Appointments, reminders, and other notifications will appear here when generated from your live account data. No example notifications are preloaded." />
        </div>
      </div>
    </div>
  );
}
