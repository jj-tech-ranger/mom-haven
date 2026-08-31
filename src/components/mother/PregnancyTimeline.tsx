import React from 'react';
import { ArrowLeft, Check, Sparkles, Calendar, Stethoscope, Heart, Clock } from 'lucide-react';
import { TIMELINE_MILESTONES, TimelineMilestone } from '../../data/kenyaMchData';

interface PregnancyTimelineProps {
  currentWeek?: number;
  onBack?: () => void;
  onSelectMilestone?: (milestone: TimelineMilestone) => void;
}

export const PregnancyTimeline: React.FC<PregnancyTimelineProps> = ({
  currentWeek = 24,
  onBack,
  onSelectMilestone,
}) => {
  // Determine milestone states based on currentWeek
  // We have 8 milestones from week 6 to 40
  const milestonesWithState = TIMELINE_MILESTONES.map((m, index) => {
    const isCompleted = m.week < currentWeek;
    // Current is the closest milestone currently in progress or active
    // If currentWeek is between this milestone and next, this is "current"
    const nextMilestone = TIMELINE_MILESTONES[index + 1];
    const isCurrent =
      (currentWeek >= m.week && (!nextMilestone || currentWeek < nextMilestone.week)) ||
      (index === 0 && currentWeek < m.week);
    const isUpcoming = !isCompleted && !isCurrent;

    return {
      ...m,
      status: isCompleted ? ('completed' as const) : isCurrent ? ('current' as const) : ('upcoming' as const),
    };
  });

  // Calculate percentage of progress along the 8 milestones
  const activeIndex = milestonesWithState.findIndex((m) => m.status === 'current');
  const currentIdx = activeIndex >= 0 ? activeIndex : 3;
  const progressPercent = Math.min(100, Math.max(5, ((currentIdx + 0.5) / milestonesWithState.length) * 100));

  return (
    <div className="min-h-screen bg-lavender-50 flex flex-col pb-24">
      {/* Top App Bar */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-border-hairline px-4 py-3.5 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-full bg-lavender-100 border border-border-hairline flex items-center justify-center text-haven-deep hover:bg-lavender-200 transition-colors cursor-pointer"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
          <div>
            <h1 className="font-display font-bold text-lg text-ink-900 leading-tight">
              Pregnancy Timeline
            </h1>
            <p className="font-body text-[11px] text-ink-600">
              Week {currentWeek} of 40 · Trimester {currentWeek <= 13 ? 1 : currentWeek <= 27 ? 2 : 3}
            </p>
          </div>
        </div>

        <div className="px-2.5 py-1 rounded-pill bg-lavender-100 border border-haven-orchid/30 text-haven-deep text-xs font-display font-bold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-haven-orchid" />
          <span>Week {currentWeek}</span>
        </div>
      </header>

      {/* Main Single Tall Card Container */}
      <div className="p-4 space-y-4">
        {/* Info Hero snippet */}
        <div className="bg-gradient-to-r from-haven-deep to-haven-orchid p-4 rounded-[20px] text-white shadow-card-1 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-lavender-200 font-semibold font-body">
              Signature Haven Ribbon
            </span>
            <h2 className="font-display font-bold text-xl leading-snug">
              Week {currentWeek} Journey
            </h2>
            <p className="font-body text-xs text-lavender-100 mt-0.5">
              {currentWeek < 37 ? `${40 - currentWeek} weeks until estimated due date` : 'Term reached! Ready for birth.'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/15 border border-white/25 flex items-center justify-center flex-shrink-0">
            <Heart className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Single Tall Card containing Vertical Haven Ribbon and Milestone Nodes */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-border-hairline mb-6">
            <div>
              <h3 className="font-display font-bold text-base text-ink-900">
                Milestones & Clinical Contacts
              </h3>
              <p className="font-body text-xs text-ink-600">
                MOH 216 Guidelines · 8 Recommended ANC Contacts
              </p>
            </div>
            <span className="text-[11px] font-display font-semibold text-haven-orchid bg-lavender-100 px-2.5 py-1 rounded-pill">
              {milestonesWithState.filter((m) => m.status === 'completed').length} of {milestonesWithState.length} passed
            </span>
          </div>

          {/* Timeline Body with Vertical Organic S-Curved Haven Ribbon */}
          <div className="relative pl-2">
            {/* SVG Vertical Haven Ribbon running behind the milestone dots */}
            <div className="absolute left-[20px] top-4 bottom-6 w-12 pointer-events-none -translate-x-1/2">
              <svg
                viewBox="0 0 48 720"
                fill="none"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
              >
                <defs>
                  {/* Pale lavender background track */}
                  <linearGradient id="vertTrackGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#E5D9F2" />
                    <stop offset="100%" stopColor="#F0E8F8" />
                  </linearGradient>

                  {/* Active Haven Gradient (#33178A -> #9167C2) */}
                  <linearGradient id="vertActiveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#33178A" />
                    <stop offset="70%" stopColor="#6C3EAC" />
                    <stop offset="100%" stopColor="#9167C2" />
                  </linearGradient>

                  <filter id="ribbonDotGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#33178A" floodOpacity="0.25" />
                  </filter>
                </defs>

                {/* S-Curved background track */}
                <path
                  d="M 24,10 C 38,90 10,180 24,270 C 38,360 10,450 24,540 C 38,620 18,680 24,710"
                  stroke="url(#vertTrackGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                />

                {/* Active gradient-filled portion */}
                <path
                  d="M 24,10 C 38,90 10,180 24,270 C 38,360 10,450 24,540 C 38,620 18,680 24,710"
                  stroke="url(#vertActiveGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="720"
                  strokeDashoffset={720 - (720 * progressPercent) / 100}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
            </div>

            {/* Milestone Nodes List */}
            <div className="space-y-6 relative z-10">
              {milestonesWithState.map((milestone) => {
                const isCurrent = milestone.status === 'current';
                const isCompleted = milestone.status === 'completed';
                const isUpcoming = milestone.status === 'upcoming';

                return (
                  <div
                    key={milestone.id}
                    onClick={() => onSelectMilestone?.(milestone)}
                    className={`flex items-start gap-4 p-2.5 rounded-2xl transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-lavender-50/90 border border-haven-orchid/40 shadow-sm'
                        : 'hover:bg-lavender-50/50'
                    }`}
                  >
                    {/* Node Dot Representation */}
                    <div className="w-10 flex-shrink-0 flex items-center justify-center pt-0.5">
                      {isCompleted && (
                        <div className="w-8 h-8 rounded-full bg-haven-deep text-white flex items-center justify-center shadow-sm">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}

                      {isCurrent && (
                        <div className="relative flex items-center justify-center">
                          {/* Larger orchid-outlined ring with filled center */}
                          <div className="w-9 h-9 rounded-full border-2 border-haven-orchid bg-white flex items-center justify-center shadow-md animate-pulse">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-haven-deep to-haven-orchid" />
                          </div>
                        </div>
                      )}

                      {isUpcoming && (
                        <div className="w-8 h-8 rounded-full border-2 border-[#D8CEE8] bg-white flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-[#E5D9F2]" />
                        </div>
                      )}
                    </div>

                    {/* Milestone Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-display font-bold text-sm ${
                            isCurrent
                              ? 'text-haven-deep'
                              : isCompleted
                              ? 'text-ink-900'
                              : 'text-ink-600'
                          }`}
                        >
                          {milestone.title}
                        </span>

                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-pill bg-haven-orchid text-white font-display font-bold text-[10px] uppercase tracking-wider shadow-sm">
                            Now · Week {currentWeek}
                          </span>
                        )}

                        {milestone.isKeyAnc && (
                          <span className="px-2 py-0.5 rounded-pill bg-lavender-100 text-haven-deep font-body text-[10px] font-medium border border-border-hairline">
                            MOH ANC {milestone.ancContactNumber}
                          </span>
                        )}
                      </div>

                      <p className="font-body text-xs text-ink-600 mt-1 leading-relaxed">
                        {milestone.description}
                      </p>

                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-ink-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-haven-orchid" />
                          Week {milestone.week}
                        </span>
                        {isCompleted && (
                          <span className="text-status-normal font-medium flex items-center gap-1">
                            <Check className="w-3 h-3" /> Completed
                          </span>
                        )}
                        {isUpcoming && (
                          <span className="text-ink-600 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Upcoming
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
