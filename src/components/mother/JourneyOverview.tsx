import React, { useEffect, useState } from 'react';
import { Baby, ChevronDown, ChevronRight, Compass, Heart, ShieldCheck, Sparkles, Stethoscope } from 'lucide-react';
import { PregnancyDoc, ChildDoc, MotherProfileDoc, AncEncounterDoc } from '../../types';
import { HavenRibbon } from '../HavenRibbon';
import { PregnancyOverview } from './PregnancyOverview';
import { PregnancyTimeline } from './PregnancyTimeline';
import EmptyState from '../EmptyState';

interface JourneyOverviewProps {
  pregnancy?: PregnancyDoc | null;
  childrenList?: ChildDoc[];
  motherProfile?: MotherProfileDoc | null;
  encounters?: AncEncounterDoc[];
  onOpenContextSelector: () => void;
  onOpenPregnancyOverview: () => void;
  onOpenTimeline: () => void;
  onOpenAncOverview: () => void;
  onOpenHealthHistory: () => void;
  onOpenBirthPlan: () => void;
  onOpenBirthOutcome: () => void;
  onOpenAddChild: () => void;
  onOpenChildDashboard?: () => void;
  onOpenNewbornRecord?: () => void;
  onOpenPncOverview?: () => void;
  onOpenChildTimeline?: () => void;
}

const weekFrom = (p?: PregnancyDoc | null) =>
  p?.lmp
    ? Math.max(1, Math.floor((Date.now() - new Date(p.lmp).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1)
    : null;

export const JourneyOverview: React.FC<JourneyOverviewProps> = ({
  pregnancy,
  childrenList = [],
  motherProfile,
  encounters = [],
  onOpenContextSelector,
  onOpenPregnancyOverview,
  onOpenTimeline,
  onOpenAncOverview,
  onOpenHealthHistory,
  onOpenBirthPlan,
  onOpenBirthOutcome,
  onOpenAddChild,
  onOpenChildDashboard,
  onOpenChildTimeline,
}) => {
  const [mode, setMode] = useState<'pregnancy' | 'child'>(
    pregnancy?.status === 'active' ? 'pregnancy' : childrenList.length ? 'child' : 'pregnancy',
  );
  const [selectedChildId, setSelectedChildId] = useState<string | null>(childrenList[0]?.id || null);
  const [screen, setScreen] = useState<'overview' | 'pregnancy' | 'timeline'>('overview');
  const week = weekFrom(pregnancy);
  const child = childrenList.find((c) => c.id === selectedChildId) || childrenList[0];
  const birthPlan = pregnancy?.birthPlan;

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ type: 'pregnancy' | 'child'; id: string }>).detail;
      if (detail.type === 'child') {
        setMode('child');
        setSelectedChildId(detail.id);
        setScreen('overview');
      } else {
        setMode('pregnancy');
        setScreen('overview');
      }
    };
    window.addEventListener('mom-haven-context-selected', handler);
    return () => window.removeEventListener('mom-haven-context-selected', handler);
  }, []);

  useEffect(() => {
    if (!selectedChildId && childrenList.length) setSelectedChildId(childrenList[0].id);
  }, [childrenList, selectedChildId]);

  useEffect(() => {
    if (pregnancy?.status === 'active' && mode === 'pregnancy') setScreen('overview');
  }, [pregnancy?.status, mode]);

  if (screen === 'pregnancy' && pregnancy) {
    return (
      <PregnancyOverview
        pregnancy={pregnancy}
        motherProfile={motherProfile}
        encounters={encounters}
        birthPlan={birthPlan ? { id: 'pregnancy-birth-plan' } : null}
        onBack={() => setScreen('overview')}
        onOpenAddVisit={onOpenAncOverview}
        onOpenTimeline={() => setScreen('timeline')}
        onOpenAncOverview={onOpenAncOverview}
        onOpenHealthHistory={onOpenHealthHistory}
        onOpenBirthPlan={onOpenBirthPlan}
        onOpenBirthOutcome={onOpenBirthOutcome}
      />
    );
  }

  if (screen === 'timeline' && pregnancy) {
    return (
      <PregnancyTimeline
        pregnancy={pregnancy}
        onBack={() => setScreen('pregnancy')}
        onSelectMilestone={(milestone) => {
          if (milestone.ancContactNumber) onOpenAncOverview();
        }}
      />
    );
  }

  const pregnancyView = pregnancy && pregnancy.status === 'active' && mode === 'pregnancy';
  const childView = childrenList.length > 0 && mode === 'child';

  return (
    <div className="min-h-screen bg-lavender-50 pb-28">
      <header className="flex items-center justify-between px-5 pb-3 pt-5">
        <div>
          <p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-600">Your journey</p>
          <h1 className="font-display text-[24px] font-bold text-ink-900">Journey</h1>
        </div>
        <button
          onClick={onOpenContextSelector}
          className="flex items-center gap-1.5 rounded-pill border border-border-hairline bg-white px-3 py-2 font-display text-xs font-bold text-haven-deep shadow-card-1"
        >
          <span>{mode === 'pregnancy' ? (week ? `Pregnancy · Week ${week}` : 'Pregnancy') : child?.name || 'Child'}</span>
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </header>

      <main className="space-y-4 px-5">
        {pregnancyView && (
          <>
            <section className="rounded-[20px] p-5 text-white shadow-card-1" style={{ background: 'var(--grad-haven)' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-body text-[11px] uppercase tracking-wider text-white/70">Pregnancy journey</p>
                  <h2 className="mt-1 font-display text-[26px] font-bold">{week ? `Week ${week} of 40` : 'Pregnancy progress'}</h2>
                  <p className="mt-1 font-body text-xs text-white/75">
                    {pregnancy?.edd
                      ? `EDD ${new Date(pregnancy.edd).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      : 'EDD not recorded'}
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
                  <Heart className="h-5 w-5" />
                </div>
              </div>
              {week && <HavenRibbon progress={(week / 40) * 100} currentStep={week} totalSteps={40} showMarkerTooltip={false} className="mt-4" />}
            </section>

            <button onClick={onOpenPregnancyOverview} className="w-full rounded-pill py-3.5 font-display font-bold text-white shadow-button" style={{ background: 'var(--grad-haven)' }}>
              <Compass className="mr-2 inline h-4 w-4" />Continue pregnancy journey
            </button>

            <div className="grid gap-2.5">
              <button onClick={onOpenTimeline} className="flex w-full items-center gap-3 rounded-[20px] border border-border-hairline bg-white p-4 text-left shadow-card-1">
                <Sparkles className="h-5 w-5 text-haven-orchid" />
                <span className="flex-1"><b className="font-display text-sm text-ink-900">Pregnancy timeline</b><span className="block font-body text-xs text-ink-600">Milestones and ANC contacts</span></span>
                <ChevronRight className="h-4 w-4" />
              </button>
              <button onClick={onOpenAncOverview} className="flex w-full items-center gap-3 rounded-[20px] border border-border-hairline bg-white p-4 text-left shadow-card-1">
                <Stethoscope className="h-5 w-5 text-haven-orchid" />
                <span className="flex-1"><b className="font-display text-sm text-ink-900">ANC visits</b><span className="block font-body text-xs text-ink-600">{encounters.length} recorded contact{encounters.length === 1 ? '' : 's'}</span></span>
                <ChevronRight className="h-4 w-4" />
              </button>
              <button onClick={onOpenBirthPlan} className="flex w-full items-center gap-3 rounded-[20px] border border-border-hairline bg-white p-4 text-left shadow-card-1">
                <ShieldCheck className="h-5 w-5 text-haven-orchid" />
                <span className="flex-1"><b className="font-display text-sm text-ink-900">Birth plan</b><span className="block font-body text-xs text-ink-600">{birthPlan ? 'Saved' : 'Not yet recorded'}</span></span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}

        {childView && (
          <>
            <button onClick={onOpenChildDashboard} className="w-full rounded-[20px] p-5 text-left text-white shadow-card-1" style={{ background: 'var(--grad-haven)' }}>
              <p className="font-body text-[11px] uppercase tracking-wider text-white/70">Child journey</p>
              <h2 className="mt-1 font-display text-2xl font-bold">{child?.name || 'Your child'}</h2>
              <p className="mt-1 font-body text-xs text-white/75">
                Born {child?.dateOfBirth ? new Date(`${child.dateOfBirth}T00:00:00`).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date not recorded'}
              </p>
            </button>
            <button onClick={onOpenChildDashboard} className="w-full rounded-pill py-3.5 font-display font-bold text-white" style={{ background: 'var(--grad-haven)' }}>Continue child journey</button>
            <button onClick={onOpenChildTimeline} className="flex w-full items-center gap-3 rounded-[20px] border border-border-hairline bg-white p-4 text-left">
              <Baby className="h-5 w-5 text-haven-orchid" />
              <span className="flex-1"><b className="font-display text-sm text-ink-900">Child timeline</b><span className="block font-body text-xs text-ink-600">Newborn to first five years</span></span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {!pregnancyView && !childView && (
          <EmptyState
            icon={pregnancy ? Baby : Sparkles}
            title={pregnancy ? 'No child journey yet' : 'No pregnancy recorded'}
            message={pregnancy ? 'Add a child record when you are ready to begin the child journey.' : 'Add a pregnancy to begin tracking your maternal journey.'}
            actionLabel={pregnancy ? 'Add child' : 'Add pregnancy'}
            onAction={pregnancy ? onOpenAddChild : onOpenContextSelector}
          />
        )}

        {pregnancy && childrenList.length > 0 && (
          <button onClick={() => setMode(mode === 'pregnancy' ? 'child' : 'pregnancy')} className="w-full rounded-pill border-[1.5px] border-haven-deep bg-white py-3 font-display font-bold text-haven-deep">
            Switch to {mode === 'pregnancy' ? 'child' : 'pregnancy'} journey
          </button>
        )}
      </main>
    </div>
  );
};
