import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  ChevronRight, 
  Calendar, 
  BookOpen, 
  Activity, 
  Heart, 
  MessageSquare, 
  FileText,
  Clock
} from 'lucide-react';
import { DailyPlanItem, TopResourceRecommendation } from '../../types/advancedPersonalization';

interface PersonalizedDailyPlanViewProps {
  items: DailyPlanItem[];
  topResource?: TopResourceRecommendation;
  onAction: (item: DailyPlanItem) => void;
  onOpenResource?: (resourceId: string) => void;
  onOpenAppointmentPrep?: () => void;
}

export default function PersonalizedDailyPlanView({
  items,
  topResource,
  onAction,
  onOpenResource,
  onOpenAppointmentPrep,
}: PersonalizedDailyPlanViewProps) {
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({});

  if (!items || items.length === 0) return null;

  const toggleCompleted = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompletedMap(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const completedCount = items.filter(i => completedMap[i.id]).length;

  const getCategoryIcon = (category: DailyPlanItem['category']) => {
    switch (category) {
      case 'milestone':
        return <Heart className="w-4 h-4 text-rose-500" />;
      case 'nutrition':
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
      case 'reminder':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'preparation':
        return <FileText className="w-4 h-4 text-[var(--haven-orchid)]" />;
      case 'learning':
        return <BookOpen className="w-4 h-4 text-blue-500" />;
      case 'check_in':
      default:
        return <Activity className="w-4 h-4 text-[var(--haven-deep)]" />;
    }
  };

  return (
    <section aria-labelledby="daily-plan-heading" className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[var(--haven-orchid)]" />
            <h3 
              id="daily-plan-heading" 
              className="font-display font-extrabold text-[17px] text-[var(--ink-900)] tracking-tight"
            >
              Today's Personalized Plan
            </h3>
          </div>
          <p className="text-[11px] text-[var(--ink-500)] font-body mt-0.5">
            Tailored actions grounded in your clinical milestone & preferences
          </p>
        </div>

        <span className="text-[11px] font-display font-bold px-2.5 py-1 rounded-full bg-[var(--lavender-100)] text-[var(--haven-deep)]">
          {completedCount} of {items.length} done
        </span>
      </div>

      <div className="space-y-2.5">
        {items.map((item) => {
          const isDone = Boolean(completedMap[item.id]);

          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                if (item.action.type === 'appointment_prep' && onOpenAppointmentPrep) {
                  onOpenAppointmentPrep();
                } else {
                  onAction(item);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (item.action.type === 'appointment_prep' && onOpenAppointmentPrep) {
                    onOpenAppointmentPrep();
                  } else {
                    onAction(item);
                  }
                }
              }}
              className={`group bg-white rounded-[20px] border border-[var(--border-hairline)] p-4 transition-all duration-200 shadow-card-1 hover:shadow-card-2 cursor-pointer relative overflow-hidden ${
                isDone ? 'opacity-70 bg-stone-50/80' : ''
              }`}
            >
              <div className="flex items-start gap-3.5">
                {/* Completion Toggle */}
                <button
                  type="button"
                  aria-label={isDone ? `Mark ${item.title} as incomplete` : `Mark ${item.title} as completed`}
                  onClick={(e) => toggleCompleted(item.id, e)}
                  className="mt-0.5 shrink-0 text-[var(--ink-400)] hover:text-[var(--haven-deep)] transition-colors cursor-pointer"
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[11px] font-display font-semibold text-[var(--ink-600)]">
                      {getCategoryIcon(item.category)}
                      <span className="capitalize">{item.category.replace('_', ' ')}</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--lavender-50)] text-[var(--haven-deep)] font-medium">
                      {item.reason}
                    </span>
                  </div>

                  <h4 className={`font-display font-bold text-[14px] sm:text-[15px] text-[var(--ink-900)] mt-1 ${isDone ? 'line-through text-[var(--ink-500)]' : ''}`}>
                    {item.title}
                  </h4>

                  <p className="font-body text-[12px] text-[var(--ink-600)] mt-0.5 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-[var(--border-hairline)]">
                    <span className="text-[10px] text-[var(--ink-400)] uppercase font-semibold tracking-wider">
                      Source: {item.provenance.replace('_', ' ')}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.action.type === 'appointment_prep' && onOpenAppointmentPrep) {
                          onOpenAppointmentPrep();
                        } else {
                          onAction(item);
                        }
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-display font-bold text-[var(--haven-orchid)] hover:underline cursor-pointer"
                    >
                      <span>{item.action.label}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Top Resource Recommendation Highlight */}
        {topResource && (
          <div 
            role="button"
            tabIndex={0}
            onClick={() => {
              if (onOpenResource) onOpenResource(topResource.id);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (onOpenResource) onOpenResource(topResource.id);
              }
            }}
            className="rounded-[20px] p-4 bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 border border-purple-200/80 shadow-xs hover:border-[var(--haven-orchid)] transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between text-[11px] font-display font-bold text-[var(--haven-deep)] mb-1">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[var(--haven-orchid)]" />
                <span>Today's Recommended Guide</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/80 text-[var(--haven-deep)] font-medium">
                {topResource.reason}
              </span>
            </div>
            <h4 className="font-display font-bold text-[14px] text-[var(--ink-900)]">
              {topResource.title}
            </h4>
            <p className="font-body text-[12px] text-[var(--ink-700)] mt-0.5 line-clamp-2">
              {topResource.summary}
            </p>
            <div className="mt-2 text-right">
              <span className="text-[11px] font-display font-bold text-[var(--haven-orchid)] inline-flex items-center gap-1">
                <span>Read guide</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
