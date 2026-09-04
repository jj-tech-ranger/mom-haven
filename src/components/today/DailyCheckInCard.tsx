import React, { useState } from 'react';
import { Sparkles, Check, Heart, Flame, ArrowRight, RefreshCw, Zap } from 'lucide-react';
import { DailyHealthLog, MoodType, MoodValues } from '../../types/healthLog';
import { LifecycleStage } from '../../types/healthContext';
import { createHealthLog } from '../../services/healthLogService';
import { getMotherPartnerRelationship } from '../../services/sharingService';
import { updatePartnerShare, moodToSignal, energyToSignal } from '../../services/partnerContextService';
import MoodEmoji, { MOOD_CONFIG, ALL_MOOD_TYPES } from '../common/MoodEmoji';

export interface DailyCheckInCardProps {
  userId?: string;
  lifecycleStage: LifecycleStage;
  todaysMoodLog: DailyHealthLog | null;
  streak: number;
  consecutiveNegativeDays?: number;
  microInsight?: string;
  language?: 'en' | 'sw';
  onLogged: (log: DailyHealthLog) => void;
  onNavigate?: (tab: 'today' | 'journey' | 'haven' | 'records' | 'profile' | string) => void;
  onOpenAskHaven?: (prompt?: string) => void;
}

export default function DailyCheckInCard({
  userId,
  lifecycleStage,
  todaysMoodLog,
  streak,
  consecutiveNegativeDays = 0,
  microInsight,
  language = 'en',
  onLogged,
  onNavigate,
  onOpenAskHaven,
}: DailyCheckInCardProps) {
  const isSw = language === 'sw';
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [selectedEnergy, setSelectedEnergy] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTalkToHaven = () => {
    const gentlePrompt = isSw
      ? "Nimekuwa nikijisikia vibaya na hisia nzito katika siku chache zilizopita. Je, unaweza kunipa mwongozo mpole na njia za kujitunza?"
      : "I've been feeling low and carrying some tender feelings over the last couple of days. Could you share some gentle guidance and self-care support?";
    if (onOpenAskHaven) {
      onOpenAskHaven(gentlePrompt);
    } else if (onNavigate) {
      onNavigate('haven');
    }
  };

  const activeMood = todaysMoodLog && (todaysMoodLog.values as MoodValues)?.mood
    ? (todaysMoodLog.values as MoodValues).mood
    : null;
  const activeEnergy = todaysMoodLog && (todaysMoodLog.values as MoodValues)?.energyLevel
    ? (todaysMoodLog.values as MoodValues).energyLevel
    : null;

  const handleSelectMood = (mood: MoodType) => {
    setSelectedMood(mood);
    setError(null);
  };

  const handleSubmit = async (overrideMood?: MoodType) => {
    const moodToLog = overrideMood || selectedMood;
    if (!moodToLog) {
      setError(isSw ? 'Tafadhali chagua hisia yako kwanza' : 'Please select how you are feeling first');
      return;
    }
    if (!userId) {
      setError(isSw ? 'Tafadhali ingia ili kurekodi' : 'Please sign in to log your check-in');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const created = await createHealthLog(userId, {
        type: 'mood',
        values: {
          mood: moodToLog,
          ...(selectedEnergy ? { energyLevel: selectedEnergy } : {}),
        },
      });

      onLogged(created);
      setIsEditing(false);

      // P7.1: Mood-signal sharing via partnerShares
      // Check active relationship sharingScopes.moodSignal dynamically before updating partner share
      try {
        const activeRel = await getMotherPartnerRelationship(userId);
        if (activeRel && activeRel.status === 'active' && activeRel.sharingScopes?.moodSignal === true) {
          const moodSignal = moodToSignal(moodToLog);
          const energySignal = energyToSignal(selectedEnergy || undefined);
          await updatePartnerShare(userId, {
            moodSignal,
            energySignal,
            sharedAt: new Date().toISOString(),
          });
        }
      } catch (shareErr) {
        console.warn('Could not sync partner share signal', shareErr);
      }
    } catch (err: any) {
      console.error('Failed to save daily mood check-in', err);
      setError(isSw ? 'Haikuweza kuhifadhiwa sasa' : 'Unable to save check-in right now');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = () => {
    if (activeMood) setSelectedMood(activeMood);
    if (activeEnergy) setSelectedEnergy(activeEnergy);
    setIsEditing(true);
  };

  const isLoggedState = todaysMoodLog !== null && !isEditing;

  return (
    <div
      className="bg-white rounded-[20px] border border-[var(--border-hairline)] p-4 sm:p-5 shadow-card-1 transition-all duration-700 relative overflow-hidden"
    >
      {isLoggedState ? (
        /* ========================================================================= */
        /* LOGGED STATE */
        /* ========================================================================= */
        <div className="space-y-3 transition-all duration-700 animate-fadeIn">
          {/* Top Header Row */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-xs font-display font-bold">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{isSw ? 'Imerekodiwa leo' : 'Logged today'}</span>
              </span>

              {activeMood && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-display font-bold border ${MOOD_CONFIG[activeMood].badgeBg} ${MOOD_CONFIG[activeMood].badgeBorder} ${MOOD_CONFIG[activeMood].badgeText}`}>
                  <MoodEmoji mood={activeMood} size="sm" language={language} showLabel />
                </span>
              )}

              {activeEnergy && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-display font-medium">
                  <Zap className="w-3 h-3 text-amber-600" />
                  <span>{isSw ? `Nguvu: ${activeEnergy}/5` : `Energy: ${activeEnergy}/5`}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {streak >= 2 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-display font-semibold text-[var(--haven-orchid)] bg-[var(--lavender-100)] px-2.5 py-0.5 rounded-full">
                  <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>{isSw ? `${streak}-siku mfululizo` : `${streak}-day check-in streak`}</span>
                </span>
              )}

              <button
                type="button"
                onClick={handleStartEdit}
                className="text-[11px] font-display font-semibold text-[var(--ink-500)] hover:text-[var(--haven-deep)] hover:underline cursor-pointer"
              >
                {isSw ? 'Badilisha' : 'Change'}
              </button>
            </div>
          </div>

          {/* Micro-insight quote */}
          {microInsight && (
            <div className="p-3.5 rounded-2xl bg-[var(--lavender-50)]/70 border border-[var(--lavender-200)]/60 text-left flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[var(--haven-orchid)] shrink-0 mt-0.5" />
              <p className="font-body text-xs sm:text-sm text-[var(--ink-800)] leading-relaxed italic">
                "{microInsight}"
              </p>
            </div>
          )}

          {/* Haven nudge for 2+ consecutive negative days */}
          {consecutiveNegativeDays >= 2 && (
            <div className="mt-2 p-3.5 rounded-2xl bg-purple-50/90 border border-purple-200/70 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
              <div className="space-y-0.5 max-w-md">
                <div className="flex items-center gap-1.5 text-xs font-display font-bold text-purple-900">
                  <Heart className="w-3.5 h-3.5 text-[var(--haven-orchid)] fill-purple-100" />
                  <span>{isSw ? 'Tuko hapa nawe' : 'We are here with you'}</span>
                </div>
                <p className="text-[11px] sm:text-xs text-purple-800/90 leading-relaxed font-body">
                  {isSw
                    ? 'Umepitia hisia nzito siku za hivi karibuni. Je, ungependa kuongea na Haven kuhusu unachopitia?'
                    : 'You have been carrying some tender feelings recently. Would you like to talk or reflect with Haven?'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleTalkToHaven}
                className="shrink-0 px-4 py-2 rounded-full bg-[var(--haven-deep)] hover:opacity-90 text-white font-display font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>{isSw ? 'Ongea na Haven' : 'Talk to Haven'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* PROMPT / LOGGING STATE */
        /* ========================================================================= */
        <div className="space-y-3.5 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[var(--lavender-100)] flex items-center justify-center text-[var(--haven-orchid)]">
                <Heart className="w-3.5 h-3.5 fill-[var(--lavender-200)]" />
              </div>
              <h4 className="font-display font-extrabold text-sm sm:text-base text-[var(--ink-900)] tracking-tight">
                {isSw ? 'Unajisikiaje leo?' : 'How are you feeling today?'}
              </h4>
            </div>

            {streak >= 2 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-display font-semibold text-[var(--haven-orchid)] bg-[var(--lavender-100)] px-2.5 py-0.5 rounded-full">
                <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>{isSw ? `${streak}-siku mfululizo` : `${streak}-day check-in streak`}</span>
              </span>
            )}
          </div>

          {/* Horizontal Row of Mood Options */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
            {ALL_MOOD_TYPES.map((mood) => {
              const meta = MOOD_CONFIG[mood];
              const isSelected = selectedMood === mood;
              const label = isSw ? meta.swLabel : meta.label;

              return (
                <button
                  key={mood}
                  type="button"
                  onClick={() => handleSelectMood(mood)}
                  className={`p-2.5 sm:p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 text-center ${
                    isSelected
                      ? `${meta.badgeBorder} ${meta.badgeBg} ring-2 ring-[var(--haven-deep)] shadow-xs scale-102`
                      : 'border-[var(--border-hairline)] bg-slate-50/50 hover:bg-slate-50 text-[var(--ink-700)]'
                  }`}
                >
                  <span className="text-2xl select-none" role="img" aria-hidden="true">
                    {meta.emoji}
                  </span>
                  <span className="font-display font-bold text-xs tracking-tight truncate max-w-full">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Secondary Row: 1-5 Energy Level Chips (Revealed on selection) */}
          {selectedMood && (
            <div className="pt-2 border-t border-[var(--border-hairline)] space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between text-xs">
                <span className="font-display font-semibold text-[var(--ink-600)] flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isSw ? 'Kiwango cha nguvu (si lazima):' : 'Energy level (optional):'}</span>
                </span>
                <span className="text-[11px] text-[var(--ink-400)]">
                  {selectedEnergy === 1 && (isSw ? 'Chini sana' : 'Very low')}
                  {selectedEnergy === 2 && (isSw ? 'Chini' : 'Low')}
                  {selectedEnergy === 3 && (isSw ? 'Wastani' : 'Moderate')}
                  {selectedEnergy === 4 && (isSw ? 'Nzuri' : 'Good')}
                  {selectedEnergy === 5 && (isSw ? 'Juu sana' : 'High')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {([1, 2, 3, 4, 5] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSelectedEnergy(lvl === selectedEnergy ? null : lvl)}
                    className={`flex-1 py-1.5 rounded-xl border font-display font-bold text-xs transition-all cursor-pointer ${
                      selectedEnergy === lvl
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-white border-[var(--border-hairline)] text-[var(--ink-700)] hover:bg-amber-50/50'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-full text-xs font-display font-bold text-[var(--ink-600)] hover:bg-slate-100 cursor-pointer"
                  >
                    {isSw ? 'Ghairi' : 'Cancel'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-full bg-[var(--haven-deep)] hover:opacity-90 disabled:opacity-50 text-white font-display font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{isSw ? 'Inahifadhi...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <span>
                      {isSw
                        ? `Hifadhi hisia (${MOOD_CONFIG[selectedMood].swLabel})`
                        : `Save check-in (${MOOD_CONFIG[selectedMood].label})`}
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs font-display text-rose-600 font-semibold pt-1">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
