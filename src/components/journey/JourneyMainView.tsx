// src/components/journey/JourneyMainView.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Milestone, 
  HeartHandshake, 
  Sparkles, 
  Calendar, 
  Plus, 
  RefreshCw, 
  Activity,
  ChevronRight,
  ShieldCheck,
  Baby
} from 'lucide-react';
import { Pregnancy, AncEncounter } from '../../types';
import { 
  getActivePregnancy, 
  getAncEncounters, 
  createActivePregnancy 
} from '../../services/pregnancyService';
import JourneyOverview from './JourneyOverview';
import AncOverview from './AncOverview';
import AddAncVisitModal from './AddAncVisitModal';
import AncVisitDetailModal from './AncVisitDetailModal';
import PregnancyTimeline from './PregnancyTimeline';
import BirthPlanView from './BirthPlanView';
import BirthOutcomeModal from './BirthOutcomeModal';
import HealthHistoryModal from './HealthHistoryModal';
import WellbeingTrends from './WellbeingTrends';
import HealthTrends from '../health/HealthTrends';
import Button from '../Button';

interface JourneyMainViewProps {
  userId: string;
  userName?: string;
  onNavigateToday: () => void;
  onChildCreated?: (childId: string) => void;
  onTriggerEmergency?: () => void;
}

type SubView = 'overview' | 'anc' | 'birth-plan' | 'timeline';
type JourneySection = 'maternal' | 'wellbeing';

export default function JourneyMainView({
  userId,
  userName = 'Mama',
  onNavigateToday,
  onChildCreated,
}: JourneyMainViewProps) {
  const [activeSection, setActiveSection] = useState<JourneySection>('maternal');
  const [subView, setSubView] = useState<SubView>('overview');

  const [pregnancy, setPregnancy] = useState<Pregnancy | null>(null);
  const [ancEncounters, setAncEncounters] = useState<AncEncounter[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddVisit, setShowAddVisit] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<AncEncounter | null>(null);
  const [showHealthHistory, setShowHealthHistory] = useState(false);
  const [showBirthOutcome, setShowBirthOutcome] = useState(false);

  // Quick Pregnancy Setup state (if user has no active pregnancy recorded yet)
  const [isSettingUpPregnancy, setIsSettingUpPregnancy] = useState(false);
  const [lmpInput, setLmpInput] = useState('');
  const [eddInput, setEddInput] = useState('');
  const [creatingPregnancy, setCreatingPregnancy] = useState(false);

  const loadJourneyData = useCallback(async () => {
    try {
      setLoading(true);
      const activePreg = await getActivePregnancy(userId);
      setPregnancy(activePreg);

      if (activePreg?.id) {
        const encounters = await getAncEncounters(activePreg.id);
        setAncEncounters(encounters);
      } else {
        setAncEncounters([]);
      }
    } catch (err) {
      console.error('Error loading journey data', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadJourneyData();
  }, [loadJourneyData]);

  const handleCreatePregnancy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lmpInput && !eddInput) return;
    try {
      setCreatingPregnancy(true);
      let calculatedEdd = eddInput;
      let calculatedLmp = lmpInput;

      if (calculatedLmp && !calculatedEdd) {
        const lmpDate = new Date(calculatedLmp);
        const eddDate = new Date(lmpDate.getTime() + 280 * 24 * 60 * 60 * 1000);
        calculatedEdd = eddDate.toISOString().split('T')[0];
      } else if (calculatedEdd && !calculatedLmp) {
        const eddDate = new Date(calculatedEdd);
        const lmpDate = new Date(eddDate.getTime() - 280 * 24 * 60 * 60 * 1000);
        calculatedLmp = lmpDate.toISOString().split('T')[0];
      }

      await createActivePregnancy(userId, calculatedLmp, calculatedEdd);
      setIsSettingUpPregnancy(false);
      await loadJourneyData();
    } catch (err) {
      console.error('Failed to create pregnancy', err);
    } finally {
      setCreatingPregnancy(false);
    }
  };

  const handleTransitionCompleted = (childId: string) => {
    setShowBirthOutcome(false);
    loadJourneyData();
    if (onChildCreated) {
      onChildCreated(childId);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Segment Controller: Pregnancy Journey vs Wellbeing & Trends */}
      <div className="flex bg-white p-1 rounded-2xl border border-[var(--border-hairline)] shadow-xs">
        <button
          type="button"
          onClick={() => setActiveSection('maternal')}
          className={`flex-1 py-2 px-3 rounded-xl font-display font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSection === 'maternal'
              ? 'bg-[var(--haven-deep)] text-white shadow-xs'
              : 'text-[var(--ink-600)] hover:text-[var(--ink-900)]'
          }`}
        >
          <Milestone className="w-3.5 h-3.5" />
          <span>Pregnancy &amp; ANC</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('wellbeing')}
          className={`flex-1 py-2 px-3 rounded-xl font-display font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSection === 'wellbeing'
              ? 'bg-[var(--haven-deep)] text-white shadow-xs'
              : 'text-[var(--ink-600)] hover:text-[var(--ink-900)]'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Wellbeing &amp; Trends</span>
        </button>
      </div>

      {activeSection === 'wellbeing' ? (
        /* Folded WellbeingTrends and HealthTrends */
        <div className="space-y-6 animate-in fade-in duration-200">
          <WellbeingTrends userId={userId} onNavigateToday={onNavigateToday} />
          <HealthTrends userId={userId} />
        </div>
      ) : loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-[var(--haven-orchid)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="font-body text-xs text-[var(--ink-600)]">Loading your maternal health journey...</p>
        </div>
      ) : !pregnancy ? (
        /* Empty State & Initial Pregnancy Setup Card */
        <div className="bg-white rounded-[24px] p-6 border border-[var(--border-hairline)] shadow-card-1 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-[var(--lavender-100)] flex items-center justify-center text-[var(--haven-deep)] mx-auto">
            <Milestone className="w-7 h-7 text-[var(--haven-orchid)]" />
          </div>
          <div>
            <h3 className="font-display font-extrabold text-[18px] text-[var(--ink-900)]">
              Start Your Pregnancy Journey
            </h3>
            <p className="font-body text-xs text-[var(--ink-600)] max-w-sm mx-auto mt-1 leading-relaxed">
              Track your gestational age, log your 8 WHO Antenatal Care visits, design your Birth Preparedness Plan, and monitor your clinical progress.
            </p>
          </div>

          {!isSettingUpPregnancy ? (
            <Button
              type="button"
              variant="primary"
              onClick={() => setIsSettingUpPregnancy(true)}
              className="py-3 px-6 text-sm mx-auto shadow-xs"
            >
              Add My Due Date / LMP
            </Button>
          ) : (
            <form onSubmit={handleCreatePregnancy} className="text-left space-y-3 max-w-sm mx-auto pt-2">
              <div>
                <label htmlFor="lmp-input" className="block text-xs font-display font-bold text-[var(--ink-800)] mb-1">
                  Last Menstrual Period (LMP)
                </label>
                <input
                  id="lmp-input"
                  type="date"
                  value={lmpInput}
                  onChange={(e) => setLmpInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--lavender-50)] border border-[var(--border-hairline)] focus:outline-none focus:ring-2 focus:ring-[var(--haven-deep)]"
                />
              </div>

              <div className="text-center text-[11px] font-semibold text-[var(--ink-400)]">— OR —</div>

              <div>
                <label htmlFor="edd-input" className="block text-xs font-display font-bold text-[var(--ink-800)] mb-1">
                  Estimated Due Date (EDD)
                </label>
                <input
                  id="edd-input"
                  type="date"
                  value={eddInput}
                  onChange={(e) => setEddInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--lavender-50)] border border-[var(--border-hairline)] focus:outline-none focus:ring-2 focus:ring-[var(--haven-deep)]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSettingUpPregnancy(false)}
                  className="flex-1 py-2 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={creatingPregnancy || (!lmpInput && !eddInput)}
                  className="flex-1 py-2 text-xs"
                >
                  {creatingPregnancy ? 'Saving...' : 'Start Tracking'}
                </Button>
              </div>
            </form>
          )}
        </div>
      ) : (
        /* Active Maternal Health Sub-Views */
        <div className="space-y-4">
          {subView === 'overview' && (
            <JourneyOverview
              pregnancy={pregnancy}
              ancEncounters={ancEncounters}
              onOpenAncOverview={() => setSubView('anc')}
              onOpenBirthPlan={() => setSubView('birth-plan')}
              onOpenTimeline={() => setSubView('timeline')}
              onOpenHealthHistory={() => setShowHealthHistory(true)}
              onOpenDeliveryTransition={() => setShowBirthOutcome(true)}
              onRefresh={loadJourneyData}
            />
          )}

          {subView === 'anc' && (
            <AncOverview
              pregnancyId={pregnancy.id}
              encounters={ancEncounters}
              onBack={() => setSubView('overview')}
              onAddNewVisit={() => setShowAddVisit(true)}
              onSelectVisit={(visit) => setSelectedVisit(visit)}
            />
          )}

          {subView === 'birth-plan' && (
            <BirthPlanView
              pregnancy={pregnancy}
              onBack={() => setSubView('overview')}
              onPlanUpdated={loadJourneyData}
            />
          )}

          {subView === 'timeline' && (
            <PregnancyTimeline
              currentWeek={pregnancy.gestationalAgeWeeks || 16}
              onBack={() => setSubView('overview')}
              onLogVisitForWeek={() => {
                setShowAddVisit(true);
              }}
            />
          )}
        </div>
      )}

      {/* Modals */}
      {showAddVisit && pregnancy && (
        <AddAncVisitModal
          pregnancyId={pregnancy.id}
          userId={userId}
          initialVisitNumber={Math.min(8, ancEncounters.length + 1)}
          onClose={() => setShowAddVisit(false)}
          onSaved={() => {
            loadJourneyData();
            setShowAddVisit(false);
          }}
        />
      )}

      {selectedVisit && (
        <AncVisitDetailModal
          visit={selectedVisit}
          onBack={() => setSelectedVisit(null)}
          onShareWithClinician={() => {}}
        />
      )}

      {showHealthHistory && pregnancy && (
        <HealthHistoryModal
          pregnancy={pregnancy}
          onClose={() => setShowHealthHistory(false)}
          onUpdated={() => {
            loadJourneyData();
            setShowHealthHistory(false);
          }}
        />
      )}

      {showBirthOutcome && pregnancy && (
        <BirthOutcomeModal
          pregnancy={pregnancy}
          userId={userId}
          motherDisplayName={userName}
          onClose={() => setShowBirthOutcome(false)}
          onTransitionCompleted={handleTransitionCompleted}
        />
      )}
    </div>
  );
}
