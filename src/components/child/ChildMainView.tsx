// src/components/child/ChildMainView.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Baby, 
  Plus, 
  ArrowLeft, 
  Users, 
  ChevronRight, 
  Sparkles,
  PhoneCall,
  Calendar,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { 
  Child, 
  ChildVaccineRecord, 
  GrowthMeasurement,
  Provenance 
} from '../../types';
import { 
  getChildren, 
  createChild, 
  getImmunizationRecords, 
  getGrowthMeasurements,
  addMuacMeasurement
} from '../../services/childService';
import ChildOverview from './ChildOverview';
import ImmunizationPassport from './ImmunizationPassport';
import GrowthTracker from './GrowthTracker';
import MilestoneChecklist from './MilestoneChecklist';
import IllnessSymptomLog from './IllnessSymptomLog';
import NewbornDangerSigns from './NewbornDangerSigns';
import AddVaccineModal from './AddVaccineModal';
import AddGrowthMeasurementModal from './AddGrowthMeasurementModal';
import MuacAssessmentModal from './MuacAssessmentModal';
import Button from '../Button';

interface ChildMainViewProps {
  userId: string;
  onTriggerEmergency?: () => void;
}

type ChildSubView = 'overview' | 'immunization' | 'growth' | 'milestones' | 'illness' | 'danger-signs';

export default function ChildMainView({
  userId,
  onTriggerEmergency,
}: ChildMainViewProps) {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Subview
  const [subView, setSubView] = useState<ChildSubView>('overview');

  // Child Data
  const [vaccines, setVaccines] = useState<ChildVaccineRecord[]>([]);
  const [growthRecords, setGrowthRecords] = useState<GrowthMeasurement[]>([]);

  // Modals
  const [showAddVaccine, setShowAddVaccine] = useState(false);
  const [preselectedVaccine, setPreselectedVaccine] = useState<{ name?: string; age?: string }>({});
  const [showAddGrowth, setShowAddGrowth] = useState(false);
  const [showMuacModal, setShowMuacModal] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);

  // Add child form state
  const [newChildName, setNewChildName] = useState('');
  const [newChildDob, setNewChildDob] = useState(() => new Date().toISOString().split('T')[0]);
  const [newChildSex, setNewChildSex] = useState<'female' | 'male'>('female');
  const [newChildWeight, setNewChildWeight] = useState('');
  const [newChildLength, setNewChildLength] = useState('');
  const [savingChild, setSavingChild] = useState(false);

  // Fetch children
  const loadAllChildren = useCallback(async () => {
    try {
      setLoading(true);
      const childList = await getChildren(userId);
      setChildren(childList);
      if (childList.length > 0 && !selectedChildId) {
        setSelectedChildId(childList[0].id);
      }
    } catch (err) {
      console.error('Error fetching children', err);
    } finally {
      setLoading(false);
    }
  }, [userId, selectedChildId]);

  useEffect(() => {
    loadAllChildren();
  }, [loadAllChildren]);

  // Fetch data for selected child
  const loadSelectedChildData = useCallback(async (childId: string) => {
    try {
      const [vaxList, growthList] = await Promise.all([
        getImmunizationRecords(childId),
        getGrowthMeasurements(childId),
      ]);
      setVaccines(vaxList);
      setGrowthRecords(growthList);
    } catch (err) {
      console.error('Error loading child records', err);
    }
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      loadSelectedChildData(selectedChildId);
    } else {
      setVaccines([]);
      setGrowthRecords([]);
    }
  }, [selectedChildId, loadSelectedChildData]);

  const activeChild = children.find(c => c.id === selectedChildId) || null;

  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildName.trim() || !newChildDob) return;
    try {
      setSavingChild(true);
      const createdId = await createChild(userId, {
        name: newChildName.trim(),
        dob: newChildDob,
        sex: newChildSex,
        birthWeightKg: newChildWeight ? parseFloat(newChildWeight) : undefined,
        birthLengthCm: newChildLength ? parseFloat(newChildLength) : undefined,
      });

      setShowAddChildModal(false);
      setNewChildName('');
      setNewChildWeight('');
      setNewChildLength('');
      
      const refreshedList = await getChildren(userId);
      setChildren(refreshedList);
      setSelectedChildId(createdId);
      setSubView('overview');
    } catch (err) {
      console.error('Failed to create child', err);
    } finally {
      setSavingChild(false);
    }
  };

  const handleSaveMuac = async (data: { muacCm: number; oedema: string; date: string; notes?: string }) => {
    if (!activeChild) return;
    const provenance: Provenance = {
      status: 'REPORTED',
      enteredBy: userId,
      enteredAt: new Date().toISOString(),
    };
    await addMuacMeasurement(activeChild.id, {
      childId: activeChild.id,
      cm: data.muacCm,
      oedema: data.oedema,
      date: data.date,
      notes: data.notes || '',
      provenance,
    });
    // Also record as a growth measurement
    await loadSelectedChildData(activeChild.id);
  };

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="w-8 h-8 border-3 border-[var(--haven-orchid)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="font-body text-xs text-[var(--ink-600)]">Loading child health passport...</p>
      </div>
    );
  }

  // If no child is registered yet
  if (children.length === 0 && !showAddChildModal) {
    return (
      <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-[var(--border-hairline)] shadow-card-1 text-center space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 mx-auto">
          <Baby className="w-8 h-8" />
        </div>
        <div>
          <h3 className="font-display font-extrabold text-[19px] text-[var(--ink-900)]">
            Child Health Passport (MOH 216)
          </h3>
          <p className="font-body text-xs text-[var(--ink-600)] max-w-sm mx-auto mt-1 leading-relaxed">
            Track your child's KEPI immunization schedule, WHO growth curves, developmental milestones, and IMCI illness records.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          onClick={() => setShowAddChildModal(true)}
          className="py-3 px-6 text-xs mx-auto shadow-xs"
        >
          <Plus className="w-4 h-4 mr-1.5 inline" />
          Add Child Record
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Child Selector / Switcher Bar */}
      <div className="bg-white rounded-2xl p-2.5 border border-[var(--border-hairline)] shadow-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-x-auto py-0.5">
          {children.map(child => (
            <button
              key={child.id}
              type="button"
              onClick={() => {
                setSelectedChildId(child.id);
                setSubView('overview');
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-display font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                selectedChildId === child.id
                  ? 'bg-[var(--haven-deep)] text-white shadow-xs'
                  : 'bg-[var(--lavender-50)] text-[var(--ink-700)] hover:bg-[var(--lavender-100)]'
              }`}
            >
              <Baby className="w-3.5 h-3.5" />
              <span>{child.name}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowAddChildModal(true)}
          className="p-2 rounded-xl text-[var(--haven-deep)] bg-[var(--lavender-50)] hover:bg-[var(--lavender-100)] transition-colors shrink-0 cursor-pointer"
          title="Add another child"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Sub-Views Router */}
      {activeChild && (
        <>
          {subView === 'overview' && (
            <ChildOverview
              child={activeChild}
              vaccines={vaccines}
              growthRecords={growthRecords}
              onOpenImmunization={() => setSubView('immunization')}
              onOpenGrowthTracker={() => setSubView('growth')}
              onOpenMilestones={() => setSubView('milestones')}
              onOpenIllnessLog={() => setSubView('illness')}
              onLogGrowthMeasurement={() => setShowAddGrowth(true)}
              onOpenMuacAssessment={() => setShowMuacModal(true)}
              onOpenNewbornDangerSigns={() => setSubView('danger-signs')}
            />
          )}

          {subView === 'immunization' && (
            <ImmunizationPassport
              childName={activeChild.name}
              vaccines={vaccines}
              onBack={() => setSubView('overview')}
              onLogVaccine={(vaccineName, recommendedAge) => {
                setPreselectedVaccine({ name: vaccineName, age: recommendedAge });
                setShowAddVaccine(true);
              }}
            />
          )}

          {subView === 'growth' && (
            <GrowthTracker
              childName={activeChild.name}
              childSex={activeChild.sex}
              measurements={growthRecords}
              onBack={() => setSubView('overview')}
              onAddMeasurement={() => setShowAddGrowth(true)}
            />
          )}

          {subView === 'milestones' && (
            <MilestoneChecklist
              childId={activeChild.id}
              motherId={userId}
              childName={activeChild.name}
              onBack={() => setSubView('overview')}
            />
          )}

          {subView === 'illness' && (
            <IllnessSymptomLog
              childId={activeChild.id}
              childName={activeChild.name}
              userId={userId}
              onBack={() => setSubView('overview')}
              onTriggerEmergency={() => {
                if (onTriggerEmergency) onTriggerEmergency();
              }}
            />
          )}

          {subView === 'danger-signs' && (
            <div className="bg-white rounded-[24px] p-5 border border-[var(--border-hairline)] shadow-card-1 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
                <button
                  type="button"
                  onClick={() => setSubView('overview')}
                  className="flex items-center gap-1.5 text-xs font-display font-bold text-[var(--ink-700)] cursor-pointer hover:text-[var(--ink-900)]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to {activeChild.name}</span>
                </button>
                <span className="text-[11px] font-display font-bold text-[#C4283C] bg-[#FCE7EA] px-2.5 py-0.5 rounded-full">
                  Clinical Protocol
                </span>
              </div>

              <NewbornDangerSigns onEmergencyTrigger={onTriggerEmergency} />

              <div className="pt-2">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    if (onTriggerEmergency) onTriggerEmergency();
                  }}
                  className="w-full py-3.5 bg-[#C4283C] hover:bg-[#A81E30] text-white flex items-center justify-center gap-2 text-xs font-display font-bold"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Call Emergency Referral Hotline (1199)</span>
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showAddVaccine && activeChild && (
        <AddVaccineModal
          childId={activeChild.id}
          userId={userId}
          initialVaccineName={preselectedVaccine.name}
          initialAgeBracket={preselectedVaccine.age}
          onClose={() => {
            setShowAddVaccine(false);
            setPreselectedVaccine({});
          }}
          onSaved={() => {
            loadSelectedChildData(activeChild.id);
            setShowAddVaccine(false);
            setPreselectedVaccine({});
          }}
        />
      )}

      {showAddGrowth && activeChild && (
        <AddGrowthMeasurementModal
          childId={activeChild.id}
          userId={userId}
          onClose={() => setShowAddGrowth(false)}
          onSaved={() => {
            loadSelectedChildData(activeChild.id);
            setShowAddGrowth(false);
          }}
        />
      )}

      {showMuacModal && activeChild && (
        <MuacAssessmentModal
          childId={activeChild.id}
          childName={activeChild.name}
          onClose={() => setShowMuacModal(false)}
          onSave={handleSaveMuac}
          onEmergencyTrigger={onTriggerEmergency}
        />
      )}

      {/* Add Child Modal */}
      {showAddChildModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-[24px] shadow-card-2 border border-[var(--border-hairline)] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-[var(--border-hairline)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Baby className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-[17px] text-[var(--ink-900)]">
                  Add Child Health Record
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddChildModal(false)}
                className="text-[var(--ink-400)] hover:text-[var(--ink-700)] cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateChild} className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-display font-bold text-[var(--ink-800)] mb-1">
                  Child's Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amani Mwangi"
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--lavender-50)] border border-[var(--border-hairline)] focus:outline-none focus:ring-2 focus:ring-[var(--haven-deep)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-display font-bold text-[var(--ink-800)] mb-1">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    required
                    value={newChildDob}
                    onChange={(e) => setNewChildDob(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--lavender-50)] border border-[var(--border-hairline)] focus:outline-none focus:ring-2 focus:ring-[var(--haven-deep)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-display font-bold text-[var(--ink-800)] mb-1">
                    Sex *
                  </label>
                  <select
                    value={newChildSex}
                    onChange={(e) => setNewChildSex(e.target.value as 'female' | 'male')}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--lavender-50)] border border-[var(--border-hairline)] focus:outline-none focus:ring-2 focus:ring-[var(--haven-deep)]"
                  >
                    <option value="female">Girl</option>
                    <option value="male">Boy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-display font-bold text-[var(--ink-800)] mb-1">
                    Birth Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 3.4"
                    value={newChildWeight}
                    onChange={(e) => setNewChildWeight(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--lavender-50)] border border-[var(--border-hairline)] focus:outline-none focus:ring-2 focus:ring-[var(--haven-deep)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-display font-bold text-[var(--ink-800)] mb-1">
                    Birth Length (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 50"
                    value={newChildLength}
                    onChange={(e) => setNewChildLength(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--lavender-50)] border border-[var(--border-hairline)] focus:outline-none focus:ring-2 focus:ring-[var(--haven-deep)]"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddChildModal(false)}
                  className="flex-1 py-2.5 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={savingChild || !newChildName.trim()}
                  className="flex-1 py-2.5 text-xs"
                >
                  {savingChild ? 'Saving...' : 'Create Record'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
