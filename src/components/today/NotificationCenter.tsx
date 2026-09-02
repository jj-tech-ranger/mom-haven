import React, { useState } from 'react';
import { ArrowLeft, Bell, Calendar, Syringe, Sparkles, Check, Clock } from 'lucide-react';
import { Reminder } from '../../types';

interface NotificationCenterProps {
  onBack: () => void;
  onSelectReminder: (reminder: Reminder | any) => void;
}

const SAMPLE_NOTIFICATIONS = [
  {
    id: 'notif-1',
    userId: 'user',
    title: 'ANC Contact 4 Due Next Week',
    description: 'Scheduled between Week 24 and Week 26. Focus: Gestational diabetes screening and blood pressure review.',
    dueDate: '28 Oct 2026',
    category: 'Appointments',
    priority: 'high',
    read: false,
    dateString: 'Today, 8:00 AM',
  },
  {
    id: 'notif-2',
    userId: 'user',
    title: 'Tetanus Diphtheria (Td) Booster',
    description: 'Ensure your Td immunization is up to date during your second trimester visit.',
    dueDate: 'Next clinic visit',
    category: 'Vaccines',
    priority: 'medium',
    read: false,
    dateString: 'Yesterday',
  },
  {
    id: 'notif-3',
    userId: 'user',
    title: 'Week 24 Milestone: Hearing & Movement',
    description: 'Your baby can now hear familiar voices and music vibrations. Try talking or singing to your bump!',
    dueDate: 'This week',
    category: 'Insights',
    priority: 'normal',
    read: true,
    dateString: '2 days ago',
  },
  {
    id: 'notif-4',
    userId: 'user',
    title: 'Hospital Bag Checklist Reminder',
    description: 'Start preparing essentials for you and your newborn in your individualized birth plan.',
    dueDate: 'Third Trimester prep',
    category: 'Insights',
    priority: 'normal',
    read: true,
    dateString: '4 days ago',
  }
];

export default function NotificationCenter({ onBack, onSelectReminder }: NotificationCenterProps) {
  const [activeTab, setActiveTab] = useState<'All' | 'Appointments' | 'Vaccines' | 'Insights'>('All');
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS);

  const filtered = notifications.filter(n => {
    if (activeTab === 'All') return true;
    return n.category === activeTab;
  });

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="min-h-screen bg-[var(--lavender-50)] pb-24">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 bg-white border-b border-[var(--border-hairline)] sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-[var(--lavender-50)] flex items-center justify-center text-[var(--ink-900)] cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-extrabold text-[18px] text-[var(--ink-900)]">
            Notification Center
          </h1>
          <button
            type="button"
            onClick={markAllAsRead}
            className="text-[12px] font-display font-bold text-[var(--haven-orchid)] hover:underline cursor-pointer"
          >
            Mark read
          </button>
        </div>

        {/* Tab Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {(['All', 'Appointments', 'Vaccines', 'Insights'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-display font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-[var(--haven-deep)] text-white shadow-xs'
                  : 'bg-[var(--lavender-100)] text-[var(--ink-600)] hover:bg-[var(--lavender-200)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Notification Feed */}
      <div className="p-4 space-y-3 max-w-lg mx-auto">
        {filtered.map(item => (
          <div
            key={item.id}
            onClick={() => onSelectReminder(item)}
            className={`p-4 rounded-[18px] border bg-white shadow-card-1 hover:shadow-card-2 transition-all cursor-pointer relative overflow-hidden ${
              !item.read ? 'border-[var(--haven-orchid)]/40 bg-[var(--lavender-50)]/30' : 'border-[var(--border-hairline)]'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  item.category === 'Appointments'
                    ? 'bg-rose-100 text-rose-700'
                    : item.category === 'Vaccines'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-[var(--lavender-100)] text-[var(--haven-deep)]'
                }`}
              >
                {item.category === 'Appointments' ? (
                  <Calendar className="w-5 h-5" />
                ) : item.category === 'Vaccines' ? (
                  <Syringe className="w-5 h-5" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-[14px] text-[var(--ink-900)] truncate">
                    {item.title}
                  </h3>
                  <span className="text-[11px] text-[var(--ink-400)] shrink-0 ml-2">
                    {item.dateString}
                  </span>
                </div>
                <p className="font-body text-[12px] text-[var(--ink-600)] mt-1 line-clamp-2">
                  {item.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--haven-deep)] bg-[var(--lavender-100)] px-2.5 py-0.5 rounded-full">
                    <Clock className="w-3 h-3" />
                    {item.dueDate}
                  </span>
                  {!item.read && (
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
