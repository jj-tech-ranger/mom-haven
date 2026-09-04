import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Bell, 
  Calendar, 
  Syringe, 
  Sparkles, 
  Check, 
  Clock, 
  FileText,
  AlertTriangle,
  HeartHandshake
} from 'lucide-react';
import { Reminder } from '../../types';
import { getUpcomingReminders } from '../../services/reminderService';

export interface NotificationCenterItem {
  id: string;
  userId?: string;
  title: string;
  description: string;
  dueDate: string;
  category: 'Appointments' | 'Vaccines' | 'Insights' | 'Danger Signs';
  priority?: 'urgent' | 'high' | 'medium' | 'normal';
  read?: boolean;
  dateString?: string;
  hasDangerSigns?: boolean;
  recordsLink?: boolean;
  deepLink?: string;
  childId?: string;
  pregnancyId?: string;
  sourceReminder?: Reminder;
}

interface NotificationCenterProps {
  userId?: string;
  reminders?: Reminder[];
  onBack: () => void;
  onSelectReminder: (reminder: Reminder | any) => void;
  extraNotifications?: NotificationCenterItem[];
  onNavigateRecords?: (subtab?: string) => void;
  onNavigateTab?: (tab: string, extra?: any) => void;
}

export default function NotificationCenter({
  userId,
  reminders: propReminders,
  onBack,
  onSelectReminder,
  extraNotifications = [],
  onNavigateRecords,
  onNavigateTab,
}: NotificationCenterProps) {
  const [activeTab, setActiveTab] = useState<'All' | 'Appointments' | 'Vaccines' | 'Insights' | 'Danger Signs'>('All');
  const [liveReminders, setLiveReminders] = useState<Reminder[]>(propReminders || []);
  const [loading, setLoading] = useState<boolean>(!propReminders && !!userId);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // If reminders are not passed as prop, fetch from reminderService directly
  useEffect(() => {
    if (propReminders) {
      setLiveReminders(propReminders);
      return;
    }
    if (!userId) return;

    let isMounted = true;
    setLoading(true);
    getUpcomingReminders(userId)
      .then((items) => {
        if (isMounted) {
          setLiveReminders(items);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('[NotificationCenter] Could not fetch reminders:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [userId, propReminders]);

  // Convert Reminder objects into NotificationCenterItems
  const reminderItems: NotificationCenterItem[] = liveReminders.map((r) => {
    let category: NotificationCenterItem['category'] = 'Insights';
    if (r.category === 'anc' || r.category === 'pnc') {
      category = 'Appointments';
    } else if (r.category === 'immunization') {
      category = 'Vaccines';
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const isDueSoon = r.dueDate <= todayStr;

    return {
      id: r.id,
      userId: r.userId,
      title: r.title,
      description: r.description || 'Clinical schedule reminder from your MomHaven care plan.',
      dueDate: r.dueDate ? `Due: ${r.dueDate}` : 'Scheduled',
      category,
      priority: isDueSoon ? 'high' : 'normal',
      read: r.completed || readIds.has(r.id),
      dateString: r.dueDate,
      deepLink: r.deepLink || (category === 'Vaccines' ? 'records' : 'today'),
      childId: r.childId,
      pregnancyId: r.pregnancyId,
      sourceReminder: r,
    };
  });

  // Combine real database reminders with dynamic system events (danger signs, daily check-in)
  const allNotifications: NotificationCenterItem[] = [
    ...extraNotifications.map((ex) => ({
      ...ex,
      read: ex.read || readIds.has(ex.id),
    })),
    ...reminderItems,
  ];

  // Filter based on active tab
  const filtered = allNotifications.filter((n) => {
    if (activeTab === 'All') return true;
    return n.category === activeTab;
  });

  const markAllAsRead = () => {
    const allIds = new Set(allNotifications.map((n) => n.id));
    setReadIds(allIds);
  };

  const handleItemClick = (item: NotificationCenterItem) => {
    // Mark clicked item as read locally
    setReadIds((prev) => new Set([...prev, item.id]));

    if (item.hasDangerSigns || item.recordsLink) {
      if (onNavigateRecords) onNavigateRecords();
      else if (onNavigateTab) onNavigateTab('records');
      return;
    }

    if (item.category === 'Vaccines') {
      if (onNavigateRecords) onNavigateRecords('immunizations');
      else if (onNavigateTab) onNavigateTab('records');
      return;
    }

    if (item.sourceReminder) {
      onSelectReminder(item.sourceReminder);
      return;
    }

    onSelectReminder(item);
  };

  return (
    <div className="min-h-screen bg-[var(--lavender-50)] pb-24">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 bg-white border-b border-[var(--border-hairline)] sticky top-0 z-10 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-[var(--lavender-50)] hover:bg-[var(--lavender-100)] flex items-center justify-center text-[var(--ink-900)] cursor-pointer transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h1 className="font-display font-extrabold text-[18px] text-[var(--ink-900)]">
              Notification Center
            </h1>
            <p className="text-[11px] text-[var(--ink-500)]">
              {allNotifications.filter((n) => !n.read).length} active reminder{allNotifications.filter((n) => !n.read).length === 1 ? '' : 's'}
            </p>
          </div>
          <button
            type="button"
            onClick={markAllAsRead}
            className="text-[12px] font-display font-bold text-[var(--haven-orchid)] hover:underline cursor-pointer"
          >
            Mark read
          </button>
        </div>

        {/* Tab Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {(['All', 'Appointments', 'Vaccines', 'Insights', 'Danger Signs'] as const).map((tab) => {
            const countForTab = tab === 'All' 
              ? allNotifications.filter((n) => !n.read).length
              : allNotifications.filter((n) => n.category === tab && !n.read).length;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-display font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab
                    ? 'bg-[var(--haven-deep)] text-white shadow-xs'
                    : 'bg-[var(--lavender-100)] text-[var(--ink-600)] hover:bg-[var(--lavender-200)]'
                }`}
              >
                <span>{tab}</span>
                {countForTab > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    activeTab === tab ? 'bg-white/30 text-white' : 'bg-rose-500 text-white'
                  }`}>
                    {countForTab}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notification Feed */}
      <div className="p-4 space-y-3 max-w-lg mx-auto">
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block w-6 h-6 border-2 border-[var(--haven-deep)] border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-xs text-[var(--ink-500)]">Loading clinical reminders...</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 px-6 bg-white rounded-[24px] border border-[var(--border-hairline)] shadow-card-1 space-y-3">
            <div className="w-14 h-14 rounded-full bg-[var(--lavender-100)] text-[var(--haven-deep)] flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 text-[var(--haven-deep)]" />
            </div>
            <h3 className="font-display font-extrabold text-[16px] text-[var(--ink-900)]">
              All caught up!
            </h3>
            <p className="font-body text-[13px] text-[var(--ink-600)] max-w-xs mx-auto">
              {activeTab === 'All'
                ? 'You have no pending reminders or alerts right now. Keep up the wonderful care!'
                : `No active ${activeTab.toLowerCase()} items at this moment.`}
            </p>
          </div>
        )}

        {!loading && filtered.map((item) => (
          <div
            key={item.id}
            onClick={() => handleItemClick(item)}
            className={`p-4 rounded-[20px] border bg-white shadow-card-1 hover:shadow-card-2 transition-all cursor-pointer relative overflow-hidden ${
              !item.read 
                ? item.category === 'Danger Signs'
                  ? 'border-rose-300 bg-rose-50/40'
                  : 'border-[var(--haven-orchid)]/40 bg-[var(--lavender-50)]/30' 
                : 'border-[var(--border-hairline)]'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  item.category === 'Danger Signs'
                    ? 'bg-rose-100 text-rose-700'
                    : item.category === 'Appointments'
                    ? 'bg-amber-100 text-amber-800'
                    : item.category === 'Vaccines'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-[var(--lavender-100)] text-[var(--haven-deep)]'
                }`}
              >
                {item.category === 'Danger Signs' ? (
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                ) : item.category === 'Appointments' ? (
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
                <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--haven-deep)] bg-[var(--lavender-100)] px-2.5 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" />
                      {item.dueDate}
                    </span>
                    {!item.read && (
                      <span className={`w-2 h-2 rounded-full ${item.category === 'Danger Signs' ? 'bg-rose-600' : 'bg-[var(--haven-orchid)]'}`} />
                    )}
                  </div>

                  {(item.hasDangerSigns || item.recordsLink || item.category === 'Vaccines') && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.category === 'Vaccines') {
                          onNavigateRecords?.('immunizations');
                        } else {
                          onNavigateRecords?.();
                        }
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-display font-bold transition-colors cursor-pointer ${
                        item.category === 'Danger Signs'
                          ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300'
                          : 'bg-[var(--lavender-100)] hover:bg-[var(--lavender-200)] text-[var(--haven-deep)]'
                      }`}
                    >
                      <FileText className="w-3 h-3" />
                      <span>{item.category === 'Vaccines' ? 'View Vaccine Card' : 'View Clinical Records'}</span>
                    </button>
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
