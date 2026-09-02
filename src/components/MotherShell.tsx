import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Milestone, 
  MessageSquare, 
  FileText, 
  User, 
  AlertOctagon, 
  Bell,
  Sparkles,
  ChevronDown,
  Baby,
  Heart
} from 'lucide-react';
import { Pregnancy, AncEncounter, Child, ChildVaccineRecord, GrowthMeasurement, DocumentRecord, Reminder } from '../types';
import { getActivePregnancy, getAncEncounters } from '../services/pregnancyService';
import TodayDashboard from './today/TodayDashboard';
import ContextSelectorModal from './today/ContextSelectorModal';
import NotificationCenter from './today/NotificationCenter';
import ReminderDetailModal from './today/ReminderDetailModal';
import AskHavenLauncherSheet from './today/AskHavenLauncherSheet';

// Journey & Pregnancy
import JourneyOverview from './journey/JourneyOverview';
import PregnancyTimeline from './journey/PregnancyTimeline';
import AncOverview from './journey/AncOverview';
import AddAncVisitModal from './journey/AddAncVisitModal';
import AncVisitDetailModal from './journey/AncVisitDetailModal';
import HealthHistoryModal from './journey/HealthHistoryModal';
import BirthPlanView from './journey/BirthPlanView';
import BirthOutcomeModal from './journey/BirthOutcomeModal';

// Child
import ChildOverview from './child/ChildOverview';
import ImmunizationPassport from './child/ImmunizationPassport';
import AddVaccineModal from './child/AddVaccineModal';
import GrowthTracker from './child/GrowthTracker';
import AddGrowthMeasurementModal from './child/AddGrowthMeasurementModal';
import MilestoneChecklist from './child/MilestoneChecklist';
import IllnessSymptomLog from './child/IllnessSymptomLog';

// Health Vault / Records
import RecordsVault from './records/RecordsVault';
import DocumentUploadModal from './records/DocumentUploadModal';
import RecordDetailModal from './records/RecordDetailModal';
import SharingCodeModal from './records/SharingCodeModal';
import PrintExportModal from './records/PrintExportModal';

// Haven Assistant & Emergency & Profile
import HavenChatView from './haven/HavenChatView';
import EmergencySafetyHub from './emergency/EmergencySafetyHub';
import MotherProfileSettings from './profile/MotherProfileSettings';
import AppLockPinModal from './profile/AppLockPinModal';
import AppLockScreen from './profile/AppLockScreen';
import PartnerSharingModal from './profile/PartnerSharingModal';
import ClinicSharingModal from './profile/ClinicSharingModal';

type MotherTab = 'today' | 'journey' | 'haven' | 'records' | 'profile';

interface MotherShellProps {
  userId?: string;
  userEmail?: string;
  userName?: string;
  onSignOut?: () => void;
}

export default function MotherShell({
  userId = 'default-user-id',
  userEmail = 'jemutaijemimah@gmail.com',
  userName = 'Mama Jemimah',
  onSignOut = () => {},
}: MotherShellProps) {
  const [activeTab, setActiveTab] = useState<MotherTab>('today');
  
  // Active Context State: Pregnancy vs Child
  const [activeContextType, setActiveContextType] = useState<'pregnancy' | 'child'>('pregnancy');
  const [activeContextId, setActiveContextId] = useState<string>('preg-1');
  const [activeContextLabel, setActiveContextLabel] = useState<string>('Pregnancy (Week 24)');

  // Data States
  const [pregnancy, setPregnancy] = useState<Pregnancy>({
    id: 'preg-1',
    motherId: userId,
    lmp: '2025-09-01',
    edd: '2026-06-08',
    gestationalAgeWeeks: 24,
    status: 'active',
    bloodGroup: 'O',
    rhesusFactor: '+',
    chronicConditions: ['None'],
    currentMedications: ['IFAS daily', 'Calcium 500mg'],
    allergies: ['No known drug allergies (NKDA)'],
    createdAt: '2025-09-10',
    updatedAt: '2026-03-01',
  });

  const [ancEncounters, setAncEncounters] = useState<AncEncounter[]>([
    {
      id: 'anc-1',
      pregnancyId: 'preg-1',
      visitNumber: 1,
      date: '2025-10-15',
      facilityName: 'Kariokor Health Centre',
      gestationalAgeWeeks: 8,
      weight: 63.2,
      bloodPressure: '110 / 70',
      systolicBp: 110,
      diastolicBp: 70,
      fundalHeight: 8,
      fetalHeartRate: 152,
      ironFolicGiven: true,
      notes: 'Initial antenatal registration. Dating ultrasound completed.',
      provenance: {
        status: 'VERIFIED',
        enteredBy: userId,
        enteredAt: '2025-10-15T09:00:00Z',
        verifiedBy: 'Nurse A. Wanjiru',
        verifiedAt: '2025-10-15T10:00:00Z',
      },
    },
    {
      id: 'anc-2',
      pregnancyId: 'preg-1',
      visitNumber: 2,
      date: '2025-12-05',
      facilityName: 'Kariokor Health Centre',
      gestationalAgeWeeks: 16,
      weight: 65.5,
      bloodPressure: '114 / 72',
      systolicBp: 114,
      diastolicBp: 72,
      fundalHeight: 16,
      fetalHeartRate: 148,
      ironFolicGiven: true,
      tdBoosterGiven: true,
      notes: 'Td vaccine dose 1 administered. Fetal movements reported.',
      provenance: {
        status: 'VERIFIED',
        enteredBy: userId,
        enteredAt: '2025-12-05T09:00:00Z',
        verifiedBy: 'Nurse A. Wanjiru',
        verifiedAt: '2025-12-05T10:15:00Z',
      },
    },
    {
      id: 'anc-3',
      pregnancyId: 'preg-1',
      visitNumber: 3,
      date: '2026-01-15',
      facilityName: 'Pumwani Maternity Hospital',
      gestationalAgeWeeks: 20,
      weight: 66.8,
      bloodPressure: '116 / 74',
      systolicBp: 116,
      diastolicBp: 74,
      fundalHeight: 20,
      fetalHeartRate: 146,
      ironFolicGiven: true,
      notes: 'Anomaly scan performed. Normal cardiac activity and growth.',
      provenance: {
        status: 'VERIFIED',
        enteredBy: userId,
        enteredAt: '2026-01-15T11:00:00Z',
        verifiedBy: 'Dr. K. Mutua',
        verifiedAt: '2026-01-15T12:00:00Z',
      },
    },
    {
      id: 'anc-4',
      pregnancyId: 'preg-1',
      visitNumber: 4,
      date: '2026-03-02',
      facilityName: 'Kariokor Health Centre',
      gestationalAgeWeeks: 24,
      weight: 68.4,
      bloodPressure: '112 / 74',
      systolicBp: 112,
      diastolicBp: 74,
      fundalHeight: 24,
      fetalHeartRate: 144,
      ironFolicGiven: true,
      iptpGiven: true,
      notes: 'Mild swelling in my ankles by evening, otherwise feeling well.',
      provenance: {
        status: 'REPORTED',
        enteredBy: userId,
        enteredAt: '2026-03-02T14:00:00Z',
      },
    },
  ]);

  const [child, setChild] = useState<Child>({
    id: 'child-1',
    motherId: userId,
    name: 'Baby Zawadi',
    dateOfBirth: '2025-08-10',
    sex: 'female',
    birthWeightKg: 3.3,
    birthLengthCm: 50,
    headCircumferenceCm: 34.5,
    bloodGroup: 'O+',
    deliveryFacility: 'Pumwani Maternity Hospital',
    deliveryType: 'SVD',
    createdAt: '2025-08-10',
    updatedAt: '2026-02-10',
  });

  const [vaccines, setVaccines] = useState<ChildVaccineRecord[]>([
    {
      id: 'v1',
      childId: 'child-1',
      vaccineName: 'BCG',
      recommendedAgeBracket: 'At Birth',
      dateAdministered: '2025-08-10',
      facilityName: 'Pumwani Maternity Hospital',
      status: 'GIVEN',
      provenance: { status: 'VERIFIED', enteredBy: userId, enteredAt: '2025-08-10', verifiedBy: 'Nurse A. Wanjiru', verifiedAt: '2025-08-10' },
    },
    {
      id: 'v2',
      childId: 'child-1',
      vaccineName: 'OPV 0 (Oral Polio)',
      recommendedAgeBracket: 'At Birth',
      dateAdministered: '2025-08-10',
      facilityName: 'Pumwani Maternity Hospital',
      status: 'GIVEN',
      provenance: { status: 'VERIFIED', enteredBy: userId, enteredAt: '2025-08-10', verifiedBy: 'Nurse A. Wanjiru', verifiedAt: '2025-08-10' },
    },
    {
      id: 'v3',
      childId: 'child-1',
      vaccineName: 'Pentavalent 1 (DTP-HepB-Hib)',
      recommendedAgeBracket: '6 Weeks',
      dateAdministered: '2025-09-22',
      facilityName: 'Kariokor Health Centre',
      status: 'GIVEN',
      provenance: { status: 'VERIFIED', enteredBy: userId, enteredAt: '2025-09-22', verifiedBy: 'Nurse A. Wanjiru', verifiedAt: '2025-09-22' },
    },
  ]);

  const [growthRecords, setGrowthRecords] = useState<GrowthMeasurement[]>([
    {
      id: 'g1',
      childId: 'child-1',
      date: '2025-08-10',
      ageMonths: 0,
      weightKg: 3.3,
      heightCm: 50,
      muacCm: 11.0,
      headCircumferenceCm: 34.5,
      provenance: { status: 'VERIFIED', enteredBy: userId, enteredAt: '2025-08-10', verifiedBy: 'Nurse A. Wanjiru' },
    },
    {
      id: 'g2',
      childId: 'child-1',
      date: '2025-10-10',
      ageMonths: 2,
      weightKg: 5.2,
      heightCm: 57,
      muacCm: 12.8,
      headCircumferenceCm: 38.5,
      provenance: { status: 'VERIFIED', enteredBy: userId, enteredAt: '2025-10-10', verifiedBy: 'Nurse A. Wanjiru' },
    },
    {
      id: 'g3',
      childId: 'child-1',
      date: '2026-02-10',
      ageMonths: 6,
      weightKg: 7.4,
      heightCm: 66,
      muacCm: 13.8,
      headCircumferenceCm: 43.0,
      provenance: { status: 'REPORTED', enteredBy: userId, enteredAt: '2026-02-10' },
    },
  ]);

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);

  // Subview / Modal Navigation States
  const [contextSelectorOpen, setContextSelectorOpen] = useState(false);
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [askHavenSheetOpen, setAskHavenSheetOpen] = useState(false);
  const [havenInitialPrompt, setHavenInitialPrompt] = useState<string | undefined>(undefined);
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  // Journey Subviews
  const [journeySubView, setJourneySubView] = useState<'overview' | 'timeline' | 'anc-list' | 'birth-plan' | 'immunization' | 'growth' | 'milestones' | 'illness'>('overview');
  const [addAncOpen, setAddAncOpen] = useState(false);
  const [selectedAncVisit, setSelectedAncVisit] = useState<AncEncounter | null>(null);
  const [healthHistoryOpen, setHealthHistoryOpen] = useState(false);
  const [birthOutcomeOpen, setBirthOutcomeOpen] = useState(false);

  // Child Subviews
  const [addVaccineOpen, setAddVaccineOpen] = useState(false);
  const [selectedVaccineMeta, setSelectedVaccineMeta] = useState<{ name?: string; age?: string }>({});
  const [addGrowthOpen, setAddGrowthOpen] = useState(false);

  // Records Modals
  const [uploadDocOpen, setUploadDocOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const [shareCodeOpen, setShareCodeOpen] = useState(false);
  const [printExportOpen, setPrintExportOpen] = useState(false);

  // Security & Sharing Modals
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [clinicModalOpen, setClinicModalOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Load active pregnancy if any
  useEffect(() => {
    async function loadData() {
      try {
        const p = await getActivePregnancy(userId);
        if (p) {
          setPregnancy(p);
          const encs = await getAncEncounters(p.id);
          if (encs && encs.length > 0) setAncEncounters(encs);
        }
      } catch (err) {
        console.error('Error fetching pregnancy data', err);
      }
    }
    loadData();
  }, [userId]);

  return (
    <div className="min-h-screen bg-[#E5DFF0] flex items-center justify-center p-0 sm:p-4">
      {/* Mobile viewport frame */}
      <div className="w-full max-w-[420px] min-h-screen sm:min-h-[860px] sm:max-h-[900px] bg-[var(--lavender-50)] sm:rounded-[36px] shadow-2xl border sm:border-[var(--border-hairline)] flex flex-col relative overflow-hidden">
        
        {/* ================= TOP HEADER ================= */}
        <header className="px-4 pt-5 pb-3 bg-white border-b border-[var(--border-hairline)] flex items-center justify-between sticky top-0 z-20 shadow-xs">
          {/* Logo & Context Switcher */}
          <div
            onClick={() => setContextSelectorOpen(true)}
            className="flex items-center gap-2.5 p-1.5 rounded-full hover:bg-[var(--lavender-50)] cursor-pointer transition-colors max-w-[240px]"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--lavender-100)] flex items-center justify-center text-[var(--haven-deep)] shrink-0">
              {activeContextType === 'pregnancy' ? (
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              ) : (
                <Baby className="w-4 h-4 text-emerald-700" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-display font-extrabold text-[14px] text-[var(--ink-900)] truncate">
                  {activeContextLabel}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--ink-500)] shrink-0" />
              </div>
              <span className="text-[10px] text-[var(--ink-500)] block truncate">
                {userName}
              </span>
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setNotificationCenterOpen(true)}
              className="w-9 h-9 rounded-full bg-[var(--lavender-50)] text-[var(--ink-700)] flex items-center justify-center hover:text-[var(--ink-900)] relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2 ring-2 ring-white" />
            </button>

            <button
              type="button"
              onClick={() => setAskHavenSheetOpen(true)}
              className="w-9 h-9 rounded-full bg-[var(--lavender-100)] text-[var(--haven-deep)] flex items-center justify-center hover:bg-[var(--lavender-200)] transition-colors cursor-pointer"
              title="Ask Haven"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ================= MAIN CONTENT BODY ================= */}
        <main className="flex-1 overflow-y-auto">
          {/* Notification Center Subview */}
          {notificationCenterOpen ? (
            <NotificationCenter
              onBack={() => setNotificationCenterOpen(false)}
              onSelectReminder={rem => {
                setSelectedReminder(rem);
              }}
            />
          ) : activeTab === 'today' ? (
            /* ================= TAB 1: TODAY ================= */
            <TodayDashboard
              pregnancy={pregnancy}
              ancEncounters={ancEncounters}
              onOpenAncVisit={(visit) => {
                setSelectedAncVisit(visit);
              }}
              onLogAncVisit={() => {
                setAddAncOpen(true);
              }}
              onOpenTimeline={() => {
                setActiveTab('journey');
                setJourneySubView('timeline');
              }}
              onOpenBirthPlan={() => {
                setActiveTab('journey');
                setJourneySubView('birth-plan');
              }}
              onOpenAskHaven={(prompt) => {
                setHavenInitialPrompt(prompt);
                setActiveTab('haven');
              }}
              onOpenEmergency={() => setEmergencyOpen(true)}
            />
          ) : activeTab === 'journey' ? (
            /* ================= TAB 2: JOURNEY ================= */
            activeContextType === 'pregnancy' ? (
              journeySubView === 'timeline' ? (
                <PregnancyTimeline
                  currentWeek={pregnancy.gestationalAgeWeeks || 24}
                  onBack={() => setJourneySubView('overview')}
                  onLogVisitForWeek={() => setAddAncOpen(true)}
                />
              ) : journeySubView === 'anc-list' ? (
                <AncOverview
                  pregnancyId={pregnancy.id}
                  encounters={ancEncounters}
                  onBack={() => setJourneySubView('overview')}
                  onAddNewVisit={() => setAddAncOpen(true)}
                  onSelectVisit={(v) => setSelectedAncVisit(v)}
                />
              ) : journeySubView === 'birth-plan' ? (
                <BirthPlanView
                  pregnancy={pregnancy}
                  onBack={() => setJourneySubView('overview')}
                  onPlanUpdated={() => {}}
                />
              ) : (
                <JourneyOverview
                  pregnancy={pregnancy}
                  ancEncounters={ancEncounters}
                  onOpenTimeline={() => setJourneySubView('timeline')}
                  onOpenAncOverview={() => setJourneySubView('anc-list')}
                  onOpenHealthHistory={() => setHealthHistoryOpen(true)}
                  onOpenBirthPlan={() => setJourneySubView('birth-plan')}
                  onOpenDeliveryTransition={() => setBirthOutcomeOpen(true)}
                />
              )
            ) : (
              /* Child Context Subviews */
              journeySubView === 'immunization' ? (
                <ImmunizationPassport
                  childName={child.name}
                  vaccines={vaccines}
                  onBack={() => setJourneySubView('overview')}
                  onLogVaccine={(name, age) => {
                    setSelectedVaccineMeta({ name, age });
                    setAddVaccineOpen(true);
                  }}
                />
              ) : journeySubView === 'growth' ? (
                <GrowthTracker
                  childName={child.name}
                  childSex={child.sex}
                  measurements={growthRecords}
                  onBack={() => setJourneySubView('overview')}
                  onAddMeasurement={() => setAddGrowthOpen(true)}
                />
              ) : journeySubView === 'milestones' ? (
                <MilestoneChecklist
                  childName={child.name}
                  onBack={() => setJourneySubView('overview')}
                />
              ) : journeySubView === 'illness' ? (
                <IllnessSymptomLog
                  childId={child.id}
                  childName={child.name}
                  userId={userId}
                  onBack={() => setJourneySubView('overview')}
                  onTriggerEmergency={() => setEmergencyOpen(true)}
                />
              ) : (
                <ChildOverview
                  child={child}
                  vaccines={vaccines}
                  growthRecords={growthRecords}
                  onOpenImmunization={() => setJourneySubView('immunization')}
                  onOpenGrowthTracker={() => setJourneySubView('growth')}
                  onOpenMilestones={() => setJourneySubView('milestones')}
                  onOpenIllnessLog={() => setJourneySubView('illness')}
                  onLogGrowthMeasurement={() => setAddGrowthOpen(true)}
                />
              )
            )
          ) : activeTab === 'haven' ? (
            /* ================= TAB 3: HAVEN ================= */
            <HavenChatView
              initialPrompt={havenInitialPrompt}
              onTriggerEmergency={() => setEmergencyOpen(true)}
            />
          ) : activeTab === 'records' ? (
            /* ================= TAB 4: RECORDS VAULT ================= */
            <RecordsVault
              records={documents}
              onOpenUpload={() => setUploadDocOpen(true)}
              onOpenRecordDetail={(rec) => setSelectedDoc(rec)}
              onOpenShareCode={() => setShareCodeOpen(true)}
              onOpenExportReport={() => setPrintExportOpen(true)}
            />
          ) : (
            /* ================= TAB 5: PROFILE & SETTINGS ================= */
            <MotherProfileSettings
              motherName={userName}
              email={userEmail}
              onOpenPinSetup={() => setPinModalOpen(true)}
              onOpenPartnerShare={() => setPartnerModalOpen(true)}
              onOpenExportData={() => setPrintExportOpen(true)}
              onSignOut={onSignOut}
            />
          )}
        </main>

        {/* ================= FLOATING RED EMERGENCY BUTTON ================= */}
        <button
          type="button"
          onClick={() => setEmergencyOpen(true)}
          aria-label="Emergency Care Protocol"
          className="fixed sm:absolute bottom-20 right-4 z-30 w-14 h-14 rounded-full bg-[#E11D3C] text-white flex items-center justify-center shadow-emergency hover:scale-105 active:scale-95 transition-transform cursor-pointer border-2 border-white ring-4 ring-red-200"
        >
          <span className="font-display font-black text-[24px] leading-none">!</span>
        </button>

        {/* ================= 5-ITEM BOTTOM NAVIGATION ================= */}
        <nav className="absolute bottom-0 left-0 right-0 h-18 bg-white border-t border-[var(--border-hairline)] px-2 flex items-center justify-around z-20">
          <button
            type="button"
            onClick={() => {
              setActiveTab('today');
              setNotificationCenterOpen(false);
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
              activeTab === 'today' && !notificationCenterOpen ? 'text-[var(--haven-deep)]' : 'text-[#8A8199]'
            }`}
          >
            <Home className={`w-5 h-5 ${activeTab === 'today' && !notificationCenterOpen ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="font-display font-bold text-[11px] mt-0.5">Today</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('journey');
              setJourneySubView('overview');
              setNotificationCenterOpen(false);
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
              activeTab === 'journey' && !notificationCenterOpen ? 'text-[var(--haven-deep)]' : 'text-[#8A8199]'
            }`}
          >
            <Milestone className={`w-5 h-5 ${activeTab === 'journey' && !notificationCenterOpen ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="font-display font-bold text-[11px] mt-0.5">Journey</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('haven');
              setNotificationCenterOpen(false);
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
              activeTab === 'haven' && !notificationCenterOpen ? 'text-[var(--haven-deep)]' : 'text-[#8A8199]'
            }`}
          >
            <MessageSquare className={`w-5 h-5 ${activeTab === 'haven' && !notificationCenterOpen ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="font-display font-bold text-[11px] mt-0.5">Haven</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('records');
              setNotificationCenterOpen(false);
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
              activeTab === 'records' && !notificationCenterOpen ? 'text-[var(--haven-deep)]' : 'text-[#8A8199]'
            }`}
          >
            <FileText className={`w-5 h-5 ${activeTab === 'records' && !notificationCenterOpen ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="font-display font-bold text-[11px] mt-0.5">Records</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('profile');
              setNotificationCenterOpen(false);
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
              activeTab === 'profile' && !notificationCenterOpen ? 'text-[var(--haven-deep)]' : 'text-[#8A8199]'
            }`}
          >
            <User className={`w-5 h-5 ${activeTab === 'profile' && !notificationCenterOpen ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="font-display font-bold text-[11px] mt-0.5">Profile</span>
          </button>
        </nav>

        {/* ================= MODALS & POPUPS ================= */}

        {/* Context Selector Modal */}
        {contextSelectorOpen && (
          <ContextSelectorModal
            userId={userId}
            activePregnancy={pregnancy}
            activeContextId={activeContextId}
            onSelectContext={(type, id, label) => {
              setActiveContextType(type);
              setActiveContextId(id);
              setActiveContextLabel(label);
              setJourneySubView('overview');
            }}
            onClose={() => setContextSelectorOpen(false)}
            onAddNew={() => {
              setActiveTab('journey');
              setBirthOutcomeOpen(true);
            }}
          />
        )}

        {/* Reminder Detail Modal */}
        {selectedReminder && (
          <ReminderDetailModal
            reminder={selectedReminder}
            onClose={() => setSelectedReminder(null)}
            onLogVisit={() => {
              setSelectedReminder(null);
              setAddAncOpen(true);
            }}
          />
        )}

        {/* Ask Haven Launcher Sheet */}
        {askHavenSheetOpen && (
          <AskHavenLauncherSheet
            onClose={() => setAskHavenSheetOpen(false)}
            onOpenFullChat={(prompt) => {
              setHavenInitialPrompt(prompt);
              setActiveTab('haven');
            }}
          />
        )}

        {/* Add ANC Visit Modal */}
        {addAncOpen && (
          <AddAncVisitModal
            pregnancyId={pregnancy.id}
            userId={userId}
            onClose={() => setAddAncOpen(false)}
            onSaved={() => {
              // Reload or append encounter
            }}
          />
        )}

        {/* ANC Visit Detail Modal */}
        {selectedAncVisit && (
          <div className="fixed inset-0 z-50 bg-white">
            <AncVisitDetailModal
              visit={selectedAncVisit}
              onBack={() => setSelectedAncVisit(null)}
              onShareWithClinician={() => {
                setSelectedAncVisit(null);
                setShareCodeOpen(true);
              }}
            />
          </div>
        )}

        {/* Health History Modal */}
        {healthHistoryOpen && (
          <HealthHistoryModal
            pregnancy={pregnancy}
            onClose={() => setHealthHistoryOpen(false)}
            onUpdated={() => {}}
          />
        )}

        {/* Delivery / Birth Outcome Modal */}
        {birthOutcomeOpen && (
          <BirthOutcomeModal
            pregnancy={pregnancy}
            userId={userId}
            motherDisplayName={userName}
            onClose={() => setBirthOutcomeOpen(false)}
            onTransitionCompleted={(childId) => {
              setBirthOutcomeOpen(false);
              setActiveContextType('child');
              setActiveContextId(childId);
              setActiveContextLabel('Baby Zawadi');
              setJourneySubView('overview');
            }}
          />
        )}

        {/* Child: Add Vaccine Modal */}
        {addVaccineOpen && (
          <AddVaccineModal
            childId={child.id}
            userId={userId}
            initialVaccineName={selectedVaccineMeta.name}
            initialAgeBracket={selectedVaccineMeta.age}
            onClose={() => setAddVaccineOpen(false)}
            onSaved={() => {}}
          />
        )}

        {/* Child: Add Growth Measurement Modal */}
        {addGrowthOpen && (
          <AddGrowthMeasurementModal
            childId={child.id}
            userId={userId}
            onClose={() => setAddGrowthOpen(false)}
            onSaved={() => {}}
          />
        )}

        {/* Records: Document Upload Modal */}
        {uploadDocOpen && (
          <DocumentUploadModal
            userId={userId}
            onClose={() => setUploadDocOpen(false)}
            onUploaded={() => {}}
          />
        )}

        {/* Records: Document Detail Modal */}
        {selectedDoc && (
          <RecordDetailModal
            record={selectedDoc}
            onClose={() => setSelectedDoc(null)}
            onShareWithClinician={() => {
              setSelectedDoc(null);
              setShareCodeOpen(true);
            }}
          />
        )}

        {/* Records: Clinician Sharing Code Modal */}
        {shareCodeOpen && (
          <SharingCodeModal onClose={() => setShareCodeOpen(false)} />
        )}

        {/* Records: Print Export Modal */}
        {printExportOpen && (
          <PrintExportModal
            motherName={userName}
            pregnancySummary={pregnancy}
            onClose={() => setPrintExportOpen(false)}
          />
        )}

        {/* Emergency Safety Hub Protocol */}
        {emergencyOpen && (
          <EmergencySafetyHub
            onClose={() => setEmergencyOpen(false)}
            driverPhone={pregnancy.birthPlan?.driverPhone || '+254 712 345 678'}
            driverName={pregnancy.birthPlan?.driverName || 'John Mwangi (Emergency Driver)'}
            facilityName={pregnancy.birthPlan?.preferredFacility || 'Pumwani Maternity Hospital'}
          />
        )}

        {/* PIN Setup Modal */}
        {pinModalOpen && (
          <AppLockPinModal
            onClose={() => setPinModalOpen(false)}
            onPinConfigured={() => {
              setPinModalOpen(false);
            }}
          />
        )}

        {/* Partner Sharing Modal */}
        {partnerModalOpen && (
          <PartnerSharingModal
            motherId={userId}
            motherName={userName}
            onClose={() => setPartnerModalOpen(false)}
          />
        )}

        {/* Clinic Sharing Modal */}
        {clinicModalOpen && (
          <ClinicSharingModal
            motherId={userId}
            onClose={() => setClinicModalOpen(false)}
          />
        )}

        {/* Lock Screen if active */}
        {isLocked && (
          <AppLockScreen
            userName={userName}
            onUnlock={() => setIsLocked(false)}
          />
        )}
      </div>
    </div>
  );
}

