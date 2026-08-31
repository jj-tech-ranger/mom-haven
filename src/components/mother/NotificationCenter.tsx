import React from 'react';
import {
  ArrowLeft,
  Bell,
  CheckCheck,
  Calendar,
  Pill,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { NotificationDoc } from '../../types';
import EmptyState from '../EmptyState';

interface NotificationCenterProps {
  notifications: NotificationDoc[];
  onBack: () => void;
  onSelectNotification: (notification: NotificationDoc) => void;
  onMarkAllAsRead: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onBack,
  onSelectNotification,
  onMarkAllAsRead,
}) => {
  const unreadCount = notifications.filter((n) => !n.read).length;

  const todayNotifications = notifications.filter((n) => {
    const d = new Date(n.timestamp);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  });

  const earlierNotifications = notifications.filter((n) => !todayNotifications.includes(n));

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ANC':
        return <Calendar className="w-4 h-4 text-status-urgent" />;
      case 'Medication':
        return <Pill className="w-4 h-4 text-status-normal" />;
      case 'Guidance':
        return <Sparkles className="w-4 h-4 text-haven-orchid" />;
      case 'Immunization':
        return <ShieldAlert className="w-4 h-4 text-haven-deep" />;
      default:
        return <Info className="w-4 h-4 text-haven-deep" />;
    }
  };

  const getCategoryBg = (category: string) => {
    switch (category) {
      case 'ANC':
        return 'bg-status-urgent-bg';
      case 'Medication':
        return 'bg-status-normal-bg';
      case 'Guidance':
        return 'bg-lavender-100';
      case 'Immunization':
        return 'bg-lavender-200';
      default:
        return 'bg-lavender-100';
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
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-lg text-ink-900 leading-tight">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-status-urgent text-white text-[10px] font-display font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-display font-bold text-haven-orchid uppercase">
              M-TODAY-003
            </span>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="flex items-center gap-1 text-xs font-display font-bold text-haven-deep hover:text-haven-orchid transition-colors cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 px-5 pt-4">
        {notifications.length === 0 ? (
          <div className="pt-8">
            <EmptyState
              icon={Bell}
              title="All caught up!"
              message="You have no notifications or pending clinic reminders right now."
              actionLabel="Return to Today"
              onAction={onBack}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Today Group */}
            {todayNotifications.length > 0 && (
              <div>
                <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-ink-600 mb-2.5 px-0.5">
                  Today
                </p>
                <div className="space-y-2.5">
                  {todayNotifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => onSelectNotification(notif)}
                      className={`w-full text-left bg-white rounded-card p-4 shadow-card-1 border transition-all flex items-start gap-3.5 cursor-pointer ${
                        !notif.read ? 'border-haven-orchid/50 ring-1 ring-haven-orchid/30' : 'border-border-hairline'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${getCategoryBg(
                          notif.category
                        )}`}
                      >
                        {getCategoryIcon(notif.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="font-body font-semibold text-sm text-ink-900 truncate">
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-haven-orchid shrink-0" />
                          )}
                        </div>
                        <p className="font-body text-xs text-ink-600 mt-1 line-clamp-2">
                          {notif.message}
                        </p>
                        <span className="font-body text-[10px] text-ink-400 mt-1.5 block">
                          {new Date(notif.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-ink-400 shrink-0 self-center" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Earlier Group */}
            {earlierNotifications.length > 0 && (
              <div>
                <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-ink-600 mb-2.5 px-0.5">
                  Earlier
                </p>
                <div className="space-y-2.5">
                  {earlierNotifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => onSelectNotification(notif)}
                      className={`w-full text-left bg-white rounded-card p-4 shadow-card-1 border transition-all flex items-start gap-3.5 cursor-pointer ${
                        !notif.read ? 'border-haven-orchid/50 ring-1 ring-haven-orchid/30' : 'border-border-hairline opacity-85'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${getCategoryBg(
                          notif.category
                        )}`}
                      >
                        {getCategoryIcon(notif.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="font-body font-semibold text-sm text-ink-900 truncate">
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-haven-orchid shrink-0" />
                          )}
                        </div>
                        <p className="font-body text-xs text-ink-600 mt-1 line-clamp-2">
                          {notif.message}
                        </p>
                        <span className="font-body text-[10px] text-ink-400 mt-1.5 block">
                          {new Date(notif.timestamp).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-ink-400 shrink-0 self-center" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
