import React, { useState } from 'react';
import { Check, Sparkles, Zap, RefreshCw, Heart } from 'lucide-react';
import type { MoodType } from '../../types/healthLog';
import type { LifecycleStage } from '../../types/healthContext';
import {
  saveGuestMoodLog,
  getGuestTodaysMood,
  type GuestMoodEntry,
} from '../../services/anonymousContextService';
import { getMicroInsight } from '../../services/todayContextService';
import MoodEmoji, { ALL_MOOD_TYPES, MOOD_CONFIG } from '../common/MoodEmoji';

export interface GuestDailyCheckInCardProps {
  lifecycleStage: LifecycleStage;
  language?: 'en' | 'sw';
  onLogged?: (entry: GuestMoodEntry) => void;
  onCreateAccount?: () => void;
}

export default function GuestDailyCheckInCard({
  lifecycleStage,
  language = 'en',
  onLogged,
  onCreateAccount,
}: GuestDailyCheckInCardProps) {
  const isSw = language === 'sw';
  const [todaysMood, setTodaysMood] = useState<GuestMoodEntry | null>(() => getGuestTodaysMood());
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEnergy, setSelectedEnergy] = useState<1 | 2 | 3 | 4 | 5 | null>(
    todaysMood?.energyLevel || null,
  );

  const handleSelectMood = (mood: MoodType) => {
    const saved = saveGuestMoodLog(mood, selectedEnergy || undefined);
    const newEntry: GuestMoodEntry = saved?.todaysMood || {
      mood,
      energyLevel: selectedEnergy || undefined,
      timestamp: new Date().toISOString(),
    };
    setTodaysMood(newEntry);
    setIsEditing(false);
    onLogged?.(newEntry);
  };

  const isLogged = Boolean(todaysMood && !isEditing);

  return (
    <div
      id="guest-daily-checkin-card"
      className="bg-white rounded-[22px] border border-[var(--border-hairline)] p-4 sm:p-5 shadow-card-1 transition-all duration-300 relative overflow-hidden"
    >
      {isLogged && todaysMood ? (
        /* ========================================================================= */
        /* LOGGED STATE */
        /* ========================================================================= */
        <div className="space-y-3.5 animate-fadeIn">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-display font-bold">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{isSw ? 'Imerekodiwa leo' : 'Logged today'}</span>
              </span>

              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-display font-bold border ${MOOD_CONFIG[todaysMood.mood].badgeBg} ${MOOD_CONFIG[todaysMood.mood].badgeBorder} ${MOOD_CONFIG[todaysMood.mood].badgeText}`}
              >
                <MoodEmoji mood={todaysMood.mood} size="sm" language={language} showLabel />
              </span>

              {todaysMood.energyLevel && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-display font-medium">
                  <Zap className="w-3 h-3 text-amber-600" />
                  <span>{isSw ? `Nguvu: ${todaysMood.energyLevel}/5` : `Energy: ${todaysMood.energyLevel}/5`}</span>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1 text-xs text-[var(--ink-500)] hover:text-[var(--haven-deep)] font-display font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{isSw ? 'Badilisha' : 'Change'}</span>
            </button>
          </div>

          {/* Warm Micro-Insight */}
          <div className="p-3.5 rounded-xl bg-[var(--lavender-50)] border border-[var(--border-hairline)] flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-[var(--haven-orchid)] shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--ink-700)] leading-relaxed font-body">
              {getMicroInsight(lifecycleStage, todaysMood.mood)}
            </p>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[var(--ink-500)] pt-0.5">
            <span>{isSw ? 'Imehifadhiwa kwenye kifaa hiki' : 'Saved locally on this device'}</span>
            {onCreateAccount && (
              <button
                type="button"
                onClick={onCreateAccount}
                className="text-[var(--haven-deep)] font-semibold hover:underline cursor-pointer"
              >
                {isSw ? 'Hifadhi milele' : 'Save to account'}
              </button>
            )}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* INTERACTIVE LOGGING STATE */
        /* ========================================================================= */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-sm text-[var(--ink-900)] flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>{isSw ? 'Unajisikiaje leo?' : 'How are you feeling today?'}</span>
              </h3>
              <p className="text-xs text-[var(--ink-600)] mt-0.5">
                {isSw
                  ? 'Gusa hisia yako kwa ukaguzi wa kila siku (hukaa kwenye kifaa hiki).'
                  : 'Tap a feeling to record your daily check-in (saved on this device).'}
              </p>
            </div>
            {isEditing && todaysMood && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs text-[var(--ink-500)] hover:text-[var(--ink-800)] cursor-pointer"
              >
                {isSw ? 'Ghairi' : 'Cancel'}
              </button>
            )}
          </div>

          {/* 6 Mood Buttons Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {ALL_MOOD_TYPES.map((moodKey) => {
              const meta = MOOD_CONFIG[moodKey];
              const isCurrent = todaysMood?.mood === moodKey;
              return (
                <button
                  key={moodKey}
                  type="button"
                  onClick={() => handleSelectMood(moodKey)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all cursor-pointer group hover:scale-[1.03] active:scale-[0.98] ${
                    isCurrent
                      ? 'border-[var(--haven-orchid)] bg-[var(--lavender-100)] shadow-xs'
                      : 'border-[var(--border-hairline)] bg-white hover:border-[var(--haven-orchid)]/50 hover:bg-[var(--lavender-50)]'
                  }`}
                  aria-label={isSw ? meta.swLabel : meta.label}
                >
                  <MoodEmoji mood={moodKey} size="md" />
                  <span className="text-xs font-display font-semibold text-[var(--ink-800)] mt-1 group-hover:text-[var(--haven-deep)]">
                    {isSw ? meta.swLabel : meta.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Energy Level Selector (Optional) */}
          <div className="pt-1 flex items-center justify-between gap-3 text-xs border-t border-[var(--border-hairline)] pt-3">
            <span className="text-[var(--ink-600)] flex items-center gap-1 font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>{isSw ? 'Kiwango cha Nguvu:' : 'Energy level:'}</span>
            </span>
            <div className="flex items-center gap-1">
              {([1, 2, 3, 4, 5] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSelectedEnergy(lvl === selectedEnergy ? null : lvl)}
                  className={`w-7 h-7 rounded-lg text-xs font-display font-bold transition-all cursor-pointer ${
                    selectedEnergy === lvl
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'bg-[var(--surface-2)] text-[var(--ink-600)] hover:bg-[var(--lavender-100)]'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
