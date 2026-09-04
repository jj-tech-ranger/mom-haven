import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Heart,
  Lock,
  Sparkles,
  Calendar,
  Zap,
  Info,
  ChevronRight,
  ArrowRight,
  Smile,
  RefreshCw,
} from 'lucide-react';
import MoodEmoji, { MOOD_CONFIG } from '../common/MoodEmoji';
import { MoodType } from '../../types/healthLog';
import {
  getMoodHistory,
  summarizeMoodHistory,
  MoodHistoryItem,
  WellbeingSummary,
} from '../../services/wellbeingTrendService';

export interface WellbeingTrendsProps {
  userId: string;
  onNavigateToday?: () => void;
  language?: 'en' | 'sw';
  className?: string;
}

export const WellbeingTrends: React.FC<WellbeingTrendsProps> = ({
  userId,
  onNavigateToday,
  language = 'en',
  className = '',
}) => {
  const isSw = language === 'sw';
  const [timeframe, setTimeframe] = useState<7 | 30>(7);
  const [history, setHistory] = useState<MoodHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedItem, setSelectedItem] = useState<MoodHistoryItem | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getMoodHistory(userId, timeframe);
      setHistory(data);
    } catch (err) {
      console.warn('Failed to load wellbeing history:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, timeframe]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const summary: WellbeingSummary = useMemo(() => {
    return summarizeMoodHistory(history, timeframe, language);
  }, [history, timeframe, language]);

  // Build calendar days array for the timeframe ending today
  const calendarDays = useMemo(() => {
    const days: { dateStr: string; dateObj: Date; item?: MoodHistoryItem }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const historyByDate = new Map<string, MoodHistoryItem>();
    history.forEach((h) => {
      historyByDate.set(h.date, h);
    });

    for (let i = timeframe - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        dateStr,
        dateObj: d,
        item: historyByDate.get(dateStr),
      });
    }

    return days;
  }, [timeframe, history]);

  return (
    <div
      className={`bg-white rounded-[24px] border border-[var(--border-hairline)] p-4 sm:p-6 shadow-card-1 ${className}`}
      aria-label="Private Wellbeing History"
    >
      {/* 1. Header & Privacy Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-hairline)]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display font-extrabold text-[18px] text-[var(--ink-900)] tracking-tight">
              {isSw ? 'Mwenendo wa Hisia Zako' : 'Your Wellbeing'}
            </h3>
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-display font-semibold bg-rose-50 text-rose-700 border border-rose-200/80"
              title="Never shared with doctors, clinics, or external providers"
            >
              <Lock className="w-3 h-3" />
              <span>{isSw ? 'Binafsi · Haijumuishwi hospitalini' : 'Private · Never shared with clinic'}</span>
            </span>
          </div>
          <p className="text-[12px] text-[var(--ink-500)] font-body mt-0.5">
            {isSw
              ? 'Tazama rekodi ya hisia na nguvu zako za kila siku kwa ajili ya kujitunza'
              : 'Your daily emotional reflections and energy patterns for self-care'}
          </p>
        </div>

        {/* 7-Day vs 30-Day Toggle */}
        <div className="flex items-center self-start sm:self-auto bg-[var(--lavender-50)] p-1 rounded-xl border border-[var(--border-hairline)] shrink-0">
          <button
            type="button"
            onClick={() => setTimeframe(7)}
            className={`px-3 py-1 text-xs font-display font-bold rounded-lg transition-all cursor-pointer ${
              timeframe === 7
                ? 'bg-white text-[var(--haven-deep)] shadow-xs'
                : 'text-[var(--ink-500)] hover:text-[var(--ink-900)]'
            }`}
          >
            {isSw ? 'Siku 7' : '7 Days'}
          </button>
          <button
            type="button"
            onClick={() => setTimeframe(30)}
            className={`px-3 py-1 text-xs font-display font-bold rounded-lg transition-all cursor-pointer ${
              timeframe === 30
                ? 'bg-white text-[var(--haven-deep)] shadow-xs'
                : 'text-[var(--ink-500)] hover:text-[var(--ink-900)]'
            }`}
          >
            {isSw ? 'Siku 30' : '30 Days'}
          </button>
        </div>
      </div>

      {/* 2. Loading State */}
      {loading ? (
        <div className="py-10 flex flex-col items-center justify-center text-[var(--ink-400)] gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-[var(--haven-orchid)]" />
          <span className="text-xs font-body">{isSw ? 'Inapakia rekodi za hisia...' : 'Loading your reflections...'}</span>
        </div>
      ) : history.length === 0 ? (
        /* 3. Empty State */
        <div className="py-8 px-4 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-[var(--lavender-100)] text-[var(--haven-orchid)] flex items-center justify-center mb-3">
            <Smile className="w-6 h-6" />
          </div>
          <h4 className="font-display font-bold text-[15px] text-[var(--ink-900)]">
            {isSw ? 'Hakuna hisia zilizorekodiwa bado' : 'No mood check-ins yet'}
          </h4>
          <p className="font-body text-xs text-[var(--ink-500)] max-w-sm mt-1 mb-4 leading-relaxed">
            {isSw
              ? 'Weka rekodi ya hisia zako kwenye ukurasa wa Leo ili kuanza kuona mwenendo na maarifa hapa.'
              : 'Log a mood check-in on Today to start seeing your patterns and personal insights here.'}
          </p>
          {onNavigateToday && (
            <button
              type="button"
              onClick={onNavigateToday}
              className="px-4 py-2 rounded-full bg-[var(--haven-deep)] text-white font-display font-bold text-xs hover:opacity-90 transition-opacity inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>{isSw ? 'Nenda Leo Ukague' : "Check in on Today"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        /* 4. Content with Data */
        <div className="mt-4 space-y-4">
          {/* Summary One-liner */}
          <div className="bg-gradient-to-r from-[var(--lavender-50)] to-white border border-[var(--border-hairline)] rounded-[16px] p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[var(--lavender-100)] text-[var(--haven-deep)] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-[var(--haven-orchid)]" />
              </div>
              <div className="min-w-0">
                <p className="font-display font-bold text-[13px] text-[var(--ink-900)] truncate">
                  {summary.summaryText}
                </p>
                <p className="text-[11px] text-[var(--ink-500)] font-body">
                  {summary.loggedDaysCount} {isSw ? 'siku zilizorekodiwa kati ya' : 'days logged out of'}{' '}
                  {summary.timeframeDays}
                </p>
              </div>
            </div>

            {summary.mostFrequentMood && (
              <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-[var(--border-hairline)] shadow-xs">
                <MoodEmoji mood={summary.mostFrequentMood} size="sm" />
                <span className="text-[11px] font-display font-bold text-[var(--ink-700)] capitalize">
                  {MOOD_CONFIG[summary.mostFrequentMood]?.label}
                </span>
              </div>
            )}
          </div>

          {/* Calendar Strip / Grid */}
          <div>
            <div className="text-[11px] font-display font-semibold uppercase tracking-wider text-[var(--ink-500)] mb-2 px-1">
              {timeframe === 7
                ? (isSw ? 'Mwenendo wa Siku 7 Zilizopita' : '7-Day Reflection Strip')
                : (isSw ? 'Mwenendo wa Siku 30 Zilizopita' : '30-Day Overview')}
            </div>

            {timeframe === 7 ? (
              /* 7-Day Horizontal Strip */
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {calendarDays.map((day) => {
                  const dayName = day.dateObj.toLocaleDateString(isSw ? 'sw-KE' : 'en-US', { weekday: 'short' });
                  const dayNum = day.dateObj.getDate();
                  const isToday = day.dateObj.toDateString() === new Date().toDateString();
                  const isSelected = selectedItem?.date === day.dateStr;
                  const item = day.item;

                  return (
                    <button
                      key={day.dateStr}
                      type="button"
                      onClick={() => item && setSelectedItem(isSelected ? null : item)}
                      disabled={!item}
                      className={`flex flex-col items-center py-2.5 px-1 rounded-2xl border transition-all text-center ${
                        isSelected
                          ? 'border-[var(--haven-orchid)] ring-2 ring-[var(--haven-orchid)]/30 bg-[var(--lavender-50)]'
                          : item
                          ? 'border-[var(--border-hairline)] bg-white hover:border-[var(--lavender-200)] shadow-xs cursor-pointer'
                          : 'border-dashed border-stone-200 bg-stone-50/50 opacity-60 cursor-default'
                      }`}
                      aria-label={`${dayName} ${dayNum}: ${item ? item.mood : 'Not logged'}`}
                    >
                      <span className="text-[10px] font-display font-semibold text-[var(--ink-400)] uppercase">
                        {dayName.slice(0, 3)}
                      </span>
                      <span
                        className={`text-[12px] font-display font-bold mt-0.5 ${
                          isToday ? 'text-[var(--haven-orchid)] underline' : 'text-[var(--ink-700)]'
                        }`}
                      >
                        {dayNum}
                      </span>

                      <div className="my-1.5 flex items-center justify-center h-7">
                        {item ? (
                          <MoodEmoji mood={item.mood} size="sm" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-stone-300" />
                        )}
                      </div>

                      {item ? (
                        <div className="flex items-center gap-0.5 text-[10px] text-amber-600 font-bold">
                          {item.energyLevel ? (
                            <>
                              <Zap className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                              <span>{item.energyLevel}</span>
                            </>
                          ) : (
                            <span className="text-stone-400">·</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[9px] text-stone-400 font-body">-</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              /* 30-Day Grid */
              <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5 sm:gap-2">
                {calendarDays.map((day) => {
                  const dayNum = day.dateObj.getDate();
                  const isToday = day.dateObj.toDateString() === new Date().toDateString();
                  const isSelected = selectedItem?.date === day.dateStr;
                  const item = day.item;

                  return (
                    <button
                      key={day.dateStr}
                      type="button"
                      onClick={() => item && setSelectedItem(isSelected ? null : item)}
                      disabled={!item}
                      className={`flex flex-col items-center p-1.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-[var(--haven-orchid)] ring-2 ring-[var(--haven-orchid)]/30 bg-[var(--lavender-50)]'
                          : item
                          ? 'border-[var(--border-hairline)] bg-white hover:border-[var(--lavender-200)] shadow-xs cursor-pointer'
                          : 'border-dashed border-stone-200 bg-stone-50/50 opacity-50 cursor-default'
                      }`}
                      title={`${day.dateStr}: ${item ? item.mood : 'No entry'}`}
                    >
                      <span
                        className={`text-[9px] font-display font-semibold ${
                          isToday ? 'text-[var(--haven-orchid)] font-bold' : 'text-[var(--ink-400)]'
                        }`}
                      >
                        {dayNum}
                      </span>
                      <div className="my-1 flex items-center justify-center">
                        {item ? (
                          <MoodEmoji mood={item.mood} size="xs" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-stone-200" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Day Detail Card */}
          {selectedItem && (
            <div className="p-3.5 rounded-2xl bg-[var(--lavender-50)] border border-[var(--lavender-200)] text-xs space-y-1 animate-fadeIn">
              <div className="flex items-center justify-between font-display font-bold text-[var(--ink-900)]">
                <span className="flex items-center gap-1.5">
                  <MoodEmoji mood={selectedItem.mood} size="sm" />
                  <span className="capitalize">{MOOD_CONFIG[selectedItem.mood]?.label}</span>
                </span>
                <span className="text-[11px] text-[var(--ink-500)]">
                  {new Date(selectedItem.timestamp).toLocaleDateString(isSw ? 'sw-KE' : 'en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              {selectedItem.energyLevel && (
                <div className="text-[var(--ink-600)] flex items-center gap-1 pt-0.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>
                    {isSw ? 'Kiwango cha nguvu' : 'Energy level'}: {selectedItem.energyLevel}/5
                  </span>
                </div>
              )}
              {selectedItem.notes && (
                <p className="text-[11px] text-[var(--ink-700)] italic pt-1 border-t border-[var(--border-hairline)] mt-1">
                  "{selectedItem.notes}"
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. Footer Privacy Reassurance */}
      <div className="mt-4 pt-3 border-t border-[var(--border-hairline)] flex items-start gap-2 text-[11px] text-[var(--ink-500)] leading-normal">
        <Info className="w-3.5 h-3.5 text-[var(--haven-orchid)] shrink-0 mt-0.5" />
        <span>
          {isSw
            ? 'Rekodi za hisia, nguvu na shajara ni siri yako 100%. Hazitumwi kwa wahudumu wa afya wala kujumuishwa kwenye ripoti za kliniki.'
            : 'Your mood, energy, and journal check-ins are 100% confidential. They are never sent to clinical teams or included in health passport exports.'}
        </span>
      </div>
    </div>
  );
};

export default WellbeingTrends;
