import React, { useState, useEffect } from 'react';
import {
  Home,
  Compass,
  MessageCircle,
  FileText,
  User,
  AlertCircle,
  Calendar,
  Sparkles,
  ShieldCheck,
  FolderOpen,
  Plus,
} from 'lucide-react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  setDoc,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import {
  UserDoc,
  MotherProfileDoc,
  PregnancyDoc,
  ChildDoc,
  ReminderDoc,
  NotificationDoc,
  AncEncounterDoc,
  BirthPlanDoc,
  NewbornRecordDoc,
  PostnatalEncounterDoc,
  ImmunizationRecordDoc,
  GrowthMeasurementDoc,
  MuacAssessmentDoc,
  NutritionRecordDoc,
  DevelopmentRecordDoc,
  PartnerRelationshipDoc,
} from '../types';

import { TodayDashboard } from './mother/TodayDashboard';
import { ActiveContextSelector, ActiveContext } from './mother/ActiveContextSelector';
import { NotificationCenter } from './mother/NotificationCenter';
import { ReminderDetail } from './mother/ReminderDetail';
import { AskHavenSheet } from './mother/AskHavenSheet';
import { EmergencyEntry } from './mother/EmergencyEntry';
import { AddChildModal } from './mother/AddChildModal';
import { AddPregnancyModal } from './mother/AddPregnancyModal';

// Pregnancy Suite Components (M-PREG-001 to M-PREG-011)
import { JourneyOverview } from './mother/JourneyOverview';
import { PregnancyOverview } from './mother/PregnancyOverview';
import { PregnancyTimeline } from './mother/PregnancyTimeline';
import { AncOverview } from './mother/AncOverview';
import { AddAncVisit } from './mother/AddAncVisit';
import { AncVisitDetail } from './mother/AncVisitDetail';
import { PregnancyHealthHistory } from './mother/PregnancyHealthHistory';
import { BirthPlan } from './mother/BirthPlan';
import { EditBirthPlan } from './mother/EditBirthPlan';
import { BirthPlanShareSheet } from './mother/BirthPlanShareSheet';
import { BirthOutcomeModal } from './mother/BirthOutcomeModal';

// Child, Newborn & PNC Suite Components (M-CHILD-001 to M-PNC-003)
import { ChildDashboard } from './mother/ChildDashboard';
import { AddChild } from './mother/AddChild';
import { ChildTimeline } from './mother/ChildTimeline';
import { NewbornOverview } from './mother/NewbornOverview';
import { NewbornRecord } from './mother/NewbornRecord';
import { NewbornDangerSigns } from './mother/NewbornDangerSigns';
import { PncOverview } from './mother/PncOverview';
import { AddPncEncounter } from './mother/AddPncEncounter';
import { PncEncounterDetail } from './mother/PncEncounterDetail';

// Immunization, Growth & Nutrition Suite Components (M-IMM-001 to M-GRO-007)
import { ImmunizationOverview } from './mother/ImmunizationOverview';
import { AddVaccine } from './mother/AddVaccine';
import { VaccineDetail } from './mother/VaccineDetail';
import { CatchUpGuidance } from './mother/CatchUpGuidance';
import { GrowthOverview } from './mother/GrowthOverview';
import { GrowthChart } from './mother/GrowthChart';
import { AddGrowthMeasurement } from './mother/AddGrowthMeasurement';
import { MuacAssessment } from './mother/MuacAssessment';
import { NutritionOverview } from './mother/NutritionOverview';
import { DevelopmentOverview } from './mother/DevelopmentOverview';
import { DevelopmentRecord } from './mother/DevelopmentRecord';

// Records Suite Components (M-REC-001 to M-REC-010)
import { RecordsHome } from './mother/RecordsHome';
import { PregnancyRecords } from './mother/PregnancyRecords';
import { PregnancyRecordDetail } from './mother/PregnancyRecordDetail';
import { ChildRecords } from './mother/ChildRecords';
import { ChildRecordDetail } from './mother/ChildRecordDetail';
import { ImmunizationRecordDetail } from './mother/ImmunizationRecordDetail';
import { GrowthRecordDetail } from './mother/GrowthRecordDetail';
import { ExportManager } from './mother/ExportManager';
import { ExportConfirmationModal } from './mother/ExportConfirmationModal';

// Profile, Security & Sharing Suite (M-PRO-001 to M-PRO-018)
import { ProfileHome } from './mother/ProfileHome';
import { PersonalInfo } from './mother/PersonalInfo';
import { ProfilePregnancies } from './mother/ProfilePregnancies';
import { ProfilePregnancyDetail } from './mother/ProfilePregnancyDetail';
import { ProfileChildren } from './mother/ProfileChildren';
import { ProfileChildDetail } from './mother/ProfileChildDetail';
import { PartnerManagement } from './mother/PartnerManagement';
import { PartnerConnectionCodeSheet } from './mother/PartnerConnectionCodeSheet';
import { ClinicianSharing } from './mother/ClinicianSharing';
import { ClinicShareCodeSheet } from './mother/ClinicShareCodeSheet';
import { NotificationSettings } from './mother/NotificationSettings';
import { PrivacySettings } from './mother/PrivacySettings';
import { SecuritySettings } from './mother/SecuritySettings';
import { AboutPage } from './mother/AboutPage';
import { AppLockPinSetup } from './mother/AppLockPinSetup';
import { AppLockPinChange } from './mother/AppLockPinChange';
import { ConnectedAccess } from './mother/ConnectedAccess';

import EmptyState from './EmptyState';

interface MotherLayoutProps {
  user: UserDoc | { uid: string; displayName: string; email: string };
  motherProfile?: MotherProfileDoc | null;
  onOpenEmergency: () => void;
  onOpenClinicShare?: () => void;
}

type MotherTab = 'today' | 'journey' | 'haven' | 'records' | 'profile';
type TodaySubView = 'dashboard' | 'notifications' | 'reminder_detail';
type JourneySubView =
  | 'overview'
  | 'pregnancy_overview'
  | 'timeline'
  | 'anc_overview'
  | 'add_anc'
  | 'anc_detail'
  | 'health_history'
  | 'birth_plan'
  | 'edit_birth_plan'
  | 'child_dashboard'
  | 'add_child'
  | 'child_timeline'
  | 'newborn_overview'
  | 'newborn_record'
  | 'newborn_danger_signs'
  | 'pnc_overview'
  | 'add_pnc'
  | 'pnc_detail'
  | 'immunization_overview'
  | 'add_vaccine'
  | 'vaccine_detail'
  | 'catch_up'
  | 'growth_overview'
  | 'growth_chart'
  | 'add_growth'
  | 'muac_assessment'
  | 'nutrition_overview'
  | 'development_overview'
  | 'development_record';

type RecordsSubView =
  | 'home'
  | 'pregnancy_records'
  | 'pregnancy_detail'
  | 'child_records'
  | 'child_detail'
  | 'immunization_detail'
  | 'growth_detail'
  | 'export_manager';

type ProfileSubView =
  | 'home'
  | 'personal_info'
  | 'pregnancies'
  | 'pregnancy_detail'
  | 'children'
  | 'child_detail'
  | 'partner_mgmt'
  | 'clinician_sharing'
  | 'notifications'
  | 'privacy'
  | 'security'
  | 'about'
  | 'pin_setup'
  | 'pin_change'
  | 'connected_access';

export const MotherLayout: React.FC<MotherLayoutProps> = ({
  user,
  motherProfile,
  onOpenEmergency,
}) => {
  const [activeTab, setActiveTab] = useState<MotherTab>('today');
  const [todaySubView, setTodaySubView] = useState<TodaySubView>('dashboard');
  const [journeySubView, setJourneySubView] = useState<JourneySubView>('overview');
  const [recordsSubView, setRecordsSubView] = useState<RecordsSubView>('home');
  const [profileSubView, setProfileSubView] = useState<ProfileSubView>('home');

  // Firestore Real-Time Data States
  const [pregnancies, setPregnancies] = useState<PregnancyDoc[]>([]);
  const [activePregnancy, setActivePregnancy] = useState<PregnancyDoc | null>(null);
  const [childrenList, setChildrenList] = useState<ChildDoc[]>([]);
  const [reminders, setReminders] = useState<ReminderDoc[] | null>(null);
  const [notifications, setNotifications] = useState<NotificationDoc[]>([]);
  const [ancEncounters, setAncEncounters] = useState<AncEncounterDoc[]>([]);
  const [birthPlan, setBirthPlan] = useState<BirthPlanDoc | null>(null);
  const [partnerRel, setPartnerRel] = useState<PartnerRelationshipDoc | null>({
    id: 'partner_1',
    motherId: user.uid,
    partnerId: 'p_user_1',
    partnerName: 'Brian Kipchoge',
    partnerPhone: '+254 722 000 111',
    status: 'active',
    sharedSections: ['birth_plan', 'milestones', 'appointments'],
    createdAt: '2026-02-01',
  });

  // Selected items for detail view
  const [selectedReminder, setSelectedReminder] = useState<ReminderDoc | null>(null);
  const [selectedAncVisit, setSelectedAncVisit] = useState<AncEncounterDoc | null>(null);
  const [activeChild, setActiveChild] = useState<ChildDoc | null>(null);
  const [selectedPncEncounter, setSelectedPncEncounter] = useState<PostnatalEncounterDoc | null>(null);
  const [childNewbornRecord, setChildNewbornRecord] = useState<NewbornRecordDoc | null>(null);
  const [childPncEncounters, setChildPncEncounters] = useState<PostnatalEncounterDoc[]>([]);
  const [selectedVaccine, setSelectedVaccine] = useState<any>(null);
  const [selectedRecordItem, setSelectedRecordItem] = useState<any>(null);

  // Sheets & Modals state
  const [isContextSelectorOpen, setIsContextSelectorOpen] = useState(false);
  const [isAskHavenOpen, setIsAskHavenOpen] = useState(false);
  const [isEmergencyEntryOpen, setIsEmergencyEntryOpen] = useState(false);
  const [isAddPregnancyOpen, setIsAddPregnancyOpen] = useState(false);
  const [isAddChildOpen, setIsAddChildOpen] = useState(false);
  const [isBirthPlanShareOpen, setIsBirthPlanShareOpen] = useState(false);
  const [isBirthOutcomeOpen, setIsBirthOutcomeOpen] = useState(false);
  const [isPartnerCodeOpen, setIsPartnerCodeOpen] = useState(false);
  const [isClinicShareOpen, setIsClinicShareOpen] = useState(false);
  const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
  const [exportCategories, setExportCategories] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<string>('pdf');
  const [havenInitialQuery, setHavenInitialQuery] = useState<string>('');

  // Auto-select active child when children list changes
  useEffect(() => {
    if (childrenList.length > 0 && !activeChild) {
      setActiveChild(childrenList[0]);
    }
  }, [childrenList, activeChild]);

  // 1. Listen to Pregnancies for current user
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, 'pregnancies'), where('motherId', '==', user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: PregnancyDoc[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as Omit<PregnancyDoc, 'id'>) });
        });
        setPregnancies(list);
        const active = list.find((p) => p.status === 'active') || list[0] || null;
        setActivePregnancy(active);
      },
      (error) => {
        console.error('Error fetching pregnancies:', error);
      }
    );
    return () => unsubscribe();
  }, [user?.uid]);

  // 2. Listen to Children for current user
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, 'children'), where('motherId', '==', user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: ChildDoc[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as Omit<ChildDoc, 'id'>) });
        });
        setChildrenList(list);
        if (list.length > 0 && !activeChild) {
          setActiveChild(list[0]);
        }
      },
      (error) => {
        console.error('Error fetching children:', error);
      }
    );
    return () => unsubscribe();
  }, [user?.uid]);

  // 3. Listen to Reminders for current user
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, 'reminders'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: ReminderDoc[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          list.push({ id: d.id, ...(data as Omit<ReminderDoc, 'id'>) });
        });
        setReminders(list.filter((r) => !r.completed));
      },
      (error) => {
        console.error('Error fetching reminders:', error);
        setReminders([]);
      }
    );
    return () => unsubscribe();
  }, [user?.uid]);

  // 4. Listen to Notifications for current user
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, 'notifications'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: NotificationDoc[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as Omit<NotificationDoc, 'id'>) });
        });
        setNotifications(list);
      },
      (error) => {
        console.error('Error fetching notifications:', error);
      }
    );
    return () => unsubscribe();
  }, [user?.uid]);

  // 5. Listen to ANC Encounters for active pregnancy
  useEffect(() => {
    if (!activePregnancy?.id) return;
    const q = collection(db, 'pregnancies', activePregnancy.id, 'ancEncounters');
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: AncEncounterDoc[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as Omit<AncEncounterDoc, 'id'>) });
        });
        if (list.length > 0) {
          setAncEncounters(list.sort((a, b) => (a.visitNumber || 0) - (b.visitNumber || 0)));
        }
      },
      (error) => {
        console.error('Error fetching ANC encounters:', error);
      }
    );
    return () => unsubscribe();
  }, [activePregnancy?.id]);

  // 6. Listen to Birth Plan for current user
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, 'birthPlans'), where('motherId', '==', user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const docData = snapshot.docs[0];
          setBirthPlan({ id: docData.id, ...(docData.data() as Omit<BirthPlanDoc, 'id'>) });
        }
      },
      (error) => {
        console.error('Error fetching birth plan:', error);
      }
    );
    return () => unsubscribe();
  }, [user?.uid]);

  // Handlers for Pregnancy Suite
  const handleSaveAncVisit = async (visitData: Omit<AncEncounterDoc, 'id'>) => {
    if (!user?.uid) return;
    if (activePregnancy?.id) {
      await addDoc(collection(db, 'pregnancies', activePregnancy.id, 'ancEncounters'), visitData);
    }
  };

  const handleSaveBirthPlan = async (planData: Partial<BirthPlanDoc>) => {
    if (!user?.uid) return;
    const planRef = birthPlan?.id
      ? doc(db, 'birthPlans', birthPlan.id)
      : doc(collection(db, 'birthPlans'));

    const payload = {
      motherId: user.uid,
      pregnancyId: activePregnancy?.id || null,
      ...planData,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(planRef, payload, { merge: true });
    setBirthPlan({ id: planRef.id, ...(payload as Omit<BirthPlanDoc, 'id'>) });
  };

  const handleSaveProfile = async (updated: Partial<MotherProfileDoc>) => {
    if (!user?.uid) return;
    const profileRef = doc(db, 'motherProfiles', user.uid);
    await updateDoc(profileRef, updated);
  };

  const handleCompletePregnancyWithChild = async (childData: {
    name: string;
    dateOfBirth: string;
    sex: 'boy' | 'girl';
    birthWeightGrams?: number;
    facilityName?: string;
  }) => {
    if (!user?.uid) return;

    if (activePregnancy?.id) {
      await updateDoc(doc(db, 'pregnancies', activePregnancy.id), {
        status: 'completed',
        completedAt: new Date().toISOString(),
      });
    }

    const docRef = await addDoc(collection(db, 'children'), {
      motherId: user.uid,
      name: childData.name,
      dateOfBirth: childData.dateOfBirth,
      sex: childData.sex,
      birthWeightGrams: childData.birthWeightGrams || null,
      facilityName: childData.facilityName || null,
      createdAt: new Date().toISOString(),
    });

    const newChild: ChildDoc = {
      id: docRef.id,
      motherId: user.uid,
      name: childData.name,
      dateOfBirth: childData.dateOfBirth,
      sex: childData.sex,
      birthWeightGrams: childData.birthWeightGrams,
      facilityName: childData.facilityName,
      createdAt: new Date().toISOString(),
    };

    setActiveChild(newChild);
    setActiveTab('journey');
    setJourneySubView('child_dashboard');
  };

  const handleMarkReminderDone = async (reminderId: string) => {
    try {
      const ref = doc(db, 'reminders', reminderId);
      await updateDoc(ref, { completed: true });
    } catch (err) {
      console.error('Error completing reminder:', err);
    }
  };

  const handleSnoozeReminder = async (reminderId: string) => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const ref = doc(db, 'reminders', reminderId);
      await updateDoc(ref, { dueDate: tomorrow.toISOString() });
      setTodaySubView('dashboard');
    } catch (err) {
      console.error('Error snoozing reminder:', err);
    }
  };

  const handleDismissReminder = async (reminderId: string) => {
    try {
      const ref = doc(db, 'reminders', reminderId);
      await deleteDoc(ref);
      setTodaySubView('dashboard');
    } catch (err) {
      console.error('Error dismissing reminder:', err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.read);
      await Promise.all(
        unread.map((n) => updateDoc(doc(db, 'notifications', n.id), { read: true }))
      );
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const handleSavePregnancy = async (data: { lmp?: string; edd: string; method: 'LMP' | 'EDD' }) => {
    if (!user?.uid) return;
    const ref = collection(db, 'pregnancies');
    await addDoc(ref, {
      motherId: user.uid,
      lmp: data.lmp || null,
      edd: data.edd,
      status: 'active',
      createdAt: new Date().toISOString(),
    });
  };

  const handleSaveChild = async (data: {
    name: string;
    dateOfBirth: string;
    sex: 'boy' | 'girl';
    birthWeightGrams?: number;
    birthLengthCm?: number;
    headCircumferenceCm?: number;
    cwcNumber?: string;
    facilityName?: string;
  }) => {
    if (!user?.uid) return;
    const ref = collection(db, 'children');
    const docRef = await addDoc(ref, {
      motherId: user.uid,
      name: data.name,
      dateOfBirth: data.dateOfBirth,
      sex: data.sex,
      birthWeightGrams: data.birthWeightGrams || null,
      birthLengthCm: data.birthLengthCm || null,
      headCircumferenceCm: data.headCircumferenceCm || null,
      cwcNumber: data.cwcNumber || null,
      facilityName: data.facilityName || 'Kariokor Health Centre',
      createdAt: new Date().toISOString(),
    });

    const newChild: ChildDoc = {
      id: docRef.id,
      motherId: user.uid,
      name: data.name,
      dateOfBirth: data.dateOfBirth,
      sex: data.sex,
      birthWeightGrams: data.birthWeightGrams,
      birthLengthCm: data.birthLengthCm,
      cwcNumber: data.cwcNumber,
      facilityName: data.facilityName,
      createdAt: new Date().toISOString(),
    };
    setActiveChild(newChild);
  };

  const handleSaveNewbornRecord = async (record: Omit<NewbornRecordDoc, 'id'>) => {
    const targetChildId = activeChild?.id || 'child_default';
    const ref = collection(db, 'children', targetChildId, 'newbornRecords');
    await addDoc(ref, record);
    setChildNewbornRecord({ id: 'saved_nb', ...record });
  };

  const handleSavePncEncounter = async (encounter: Omit<PostnatalEncounterDoc, 'id'>) => {
    const targetChildId = activeChild?.id || 'child_default';
    const ref = collection(db, 'children', targetChildId, 'postnatalEncounters');
    const docRef = await addDoc(ref, encounter);
    const newEnc: PostnatalEncounterDoc = { id: docRef.id, ...encounter };
    setChildPncEncounters((prev) => [newEnc, ...prev]);
    setSelectedPncEncounter(newEnc);
  };

  return (
    <div className="w-full flex justify-center py-1 sm:py-4 px-2 selection:bg-haven-orchid/20">
      {/* Mobile Shell Container */}
      <div className="w-full max-w-[420px] bg-white rounded-[32px] border border-border-hairline shadow-card-2 overflow-hidden flex flex-col min-h-[760px] relative">
        {/* Scrollable View Area */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-20">
          {/* TAB 1: TODAY */}
          {activeTab === 'today' && (
            <>
              {todaySubView === 'dashboard' && (
                <TodayDashboard
                  mother={user}
                  motherProfile={motherProfile}
                  pregnancy={activePregnancy}
                  reminders={reminders}
                  notifications={notifications}
                  onOpenNotifications={() => setTodaySubView('notifications')}
                  onOpenContextSelector={() => setIsContextSelectorOpen(true)}
                  onOpenReminderDetail={(r) => {
                    setSelectedReminder(r);
                    setTodaySubView('reminder_detail');
                  }}
                  onOpenAskHaven={(q) => {
                    setHavenInitialQuery(q || '');
                    setIsAskHavenOpen(true);
                  }}
                  onOpenAddPregnancy={() => setIsAddPregnancyOpen(true)}
                />
              )}

              {todaySubView === 'notifications' && (
                <NotificationCenter
                  notifications={notifications}
                  onBack={() => setTodaySubView('dashboard')}
                  onSelectNotification={(notif) => {
                    if (notif.reminderId && reminders) {
                      const matched = reminders.find((r) => r.id === notif.reminderId);
                      if (matched) {
                        setSelectedReminder(matched);
                        setTodaySubView('reminder_detail');
                        return;
                      }
                    }
                    setSelectedReminder({
                      id: notif.id,
                      userId: user.uid,
                      title: notif.title,
                      detail: notif.message,
                      dueDate: notif.timestamp,
                      urgency: notif.urgency || 'normal',
                      category: (notif.category as any) || 'ANC',
                      completed: notif.read,
                      createdAt: notif.timestamp,
                    });
                    setTodaySubView('reminder_detail');
                  }}
                  onMarkAllAsRead={handleMarkAllNotificationsRead}
                />
              )}

              {todaySubView === 'reminder_detail' && selectedReminder && (
                <ReminderDetail
                  reminder={selectedReminder}
                  onBack={() => setTodaySubView('dashboard')}
                  onMarkDone={handleMarkReminderDone}
                  onSnooze={handleSnoozeReminder}
                  onDismiss={handleDismissReminder}
                />
              )}
            </>
          )}

          {/* TAB 2: JOURNEY */}
          {activeTab === 'journey' && (
            <>
              {journeySubView === 'overview' && (
                <JourneyOverview
                  pregnancy={activePregnancy}
                  childrenList={childrenList}
                  motherProfile={motherProfile}
                  encounters={ancEncounters}
                  onOpenContextSelector={() => setIsContextSelectorOpen(true)}
                  onOpenPregnancyOverview={() => setJourneySubView('pregnancy_overview')}
                  onOpenTimeline={() => setJourneySubView('timeline')}
                  onOpenAncOverview={() => setJourneySubView('anc_overview')}
                  onOpenHealthHistory={() => setJourneySubView('health_history')}
                  onOpenBirthPlan={() => setJourneySubView('birth_plan')}
                  onOpenBirthOutcome={() => setIsBirthOutcomeOpen(true)}
                  onOpenAddChild={() => setJourneySubView('add_child')}
                  onOpenChildDashboard={() => setJourneySubView('child_dashboard')}
                  onOpenNewbornRecord={() => setJourneySubView('newborn_overview')}
                  onOpenPncOverview={() => setJourneySubView('pnc_overview')}
                  onOpenChildTimeline={() => setJourneySubView('child_timeline')}
                />
              )}

              {journeySubView === 'pregnancy_overview' && (
                <PregnancyOverview
                  pregnancy={activePregnancy}
                  motherProfile={motherProfile}
                  encounters={ancEncounters}
                  onBack={() => setJourneySubView('overview')}
                  onOpenAddVisit={() => setJourneySubView('add_anc')}
                  onOpenTimeline={() => setJourneySubView('timeline')}
                  onOpenAncOverview={() => setJourneySubView('anc_overview')}
                  onOpenHealthHistory={() => setJourneySubView('health_history')}
                  onOpenBirthPlan={() => setJourneySubView('birth_plan')}
                  onOpenBirthOutcome={() => setIsBirthOutcomeOpen(true)}
                />
              )}

              {journeySubView === 'timeline' && (
                <PregnancyTimeline
                  currentWeek={activePregnancy?.gestationalAgeWeeks || 24}
                  onBack={() => setJourneySubView('overview')}
                  onSelectMilestone={() => setJourneySubView('anc_overview')}
                />
              )}

              {journeySubView === 'anc_overview' && (
                <AncOverview
                  encounters={ancEncounters}
                  onBack={() => setJourneySubView('overview')}
                  onAddVisit={() => setJourneySubView('add_anc')}
                  onSelectVisit={(visit) => {
                    setSelectedAncVisit(visit);
                    setJourneySubView('anc_detail');
                  }}
                />
              )}

              {journeySubView === 'add_anc' && (
                <AddAncVisit
                  pregnancyId={activePregnancy?.id || 'default_preg'}
                  onBack={() => setJourneySubView('anc_overview')}
                  onSave={async (visit) => {
                    await handleSaveAncVisit(visit);
                    setJourneySubView('anc_overview');
                  }}
                  onSaveDraft={() => setJourneySubView('anc_overview')}
                />
              )}

              {journeySubView === 'anc_detail' && selectedAncVisit && (
                <AncVisitDetail
                  visit={selectedAncVisit}
                  onBack={() => setJourneySubView('anc_overview')}
                />
              )}

              {journeySubView === 'health_history' && (
                <PregnancyHealthHistory
                  profile={motherProfile}
                  onBack={() => setJourneySubView('overview')}
                  onSaveProfile={handleSaveProfile}
                />
              )}

              {journeySubView === 'birth_plan' && (
                <BirthPlan
                  birthPlan={birthPlan}
                  onBack={() => setJourneySubView('overview')}
                  onEditBirthPlan={() => setJourneySubView('edit_birth_plan')}
                  onOpenShareSheet={() => setIsBirthPlanShareOpen(true)}
                />
              )}

              {journeySubView === 'edit_birth_plan' && (
                <EditBirthPlan
                  initialPlan={birthPlan}
                  onBack={() => setJourneySubView('birth_plan')}
                  onSave={async (updated) => {
                    await handleSaveBirthPlan(updated);
                    setJourneySubView('birth_plan');
                  }}
                />
              )}

              {/* CHILD SUITE */}
              {journeySubView === 'child_dashboard' && (
                <ChildDashboard
                  child={activeChild}
                  childrenList={childrenList}
                  onSwitchChild={() => setIsContextSelectorOpen(true)}
                  onOpenTimeline={() => setJourneySubView('child_timeline')}
                  onOpenNewbornRecord={() => setJourneySubView('newborn_overview')}
                  onOpenPncOverview={() => setJourneySubView('pnc_overview')}
                  onOpenImmunization={() => setJourneySubView('immunization_overview')}
                  onOpenGrowth={() => setJourneySubView('growth_overview')}
                  onOpenDevelopment={() => setJourneySubView('development_overview')}
                />
              )}

              {journeySubView === 'add_child' && (
                <AddChild
                  onBack={() => setJourneySubView('overview')}
                  onSave={async (data) => {
                    await handleSaveChild(data);
                    setJourneySubView('child_dashboard');
                  }}
                />
              )}

              {journeySubView === 'child_timeline' && (
                <ChildTimeline
                  child={activeChild}
                  onBack={() => setJourneySubView('child_dashboard')}
                />
              )}

              {journeySubView === 'newborn_overview' && (
                <NewbornOverview
                  child={activeChild}
                  newbornRecord={childNewbornRecord}
                  onBack={() => setJourneySubView('child_dashboard')}
                  onOpenNewbornRecord={() => setJourneySubView('newborn_record')}
                  onOpenDangerSigns={() => setJourneySubView('newborn_danger_signs')}
                />
              )}

              {journeySubView === 'newborn_record' && (
                <NewbornRecord
                  child={activeChild}
                  initialRecord={childNewbornRecord}
                  onBack={() => setJourneySubView('newborn_overview')}
                  onSave={async (rec) => {
                    await handleSaveNewbornRecord(rec);
                    setJourneySubView('newborn_overview');
                  }}
                />
              )}

              {journeySubView === 'newborn_danger_signs' && (
                <NewbornDangerSigns
                  onBack={() => setJourneySubView('newborn_overview')}
                  onOpenEmergency={onOpenEmergency}
                />
              )}

              {journeySubView === 'pnc_overview' && (
                <PncOverview
                  child={activeChild}
                  encounters={childPncEncounters}
                  onBack={() => setJourneySubView('child_dashboard')}
                  onAddEncounter={() => setJourneySubView('add_pnc')}
                  onSelectEncounter={(enc) => {
                    setSelectedPncEncounter(enc);
                    setJourneySubView('pnc_detail');
                  }}
                />
              )}

              {journeySubView === 'add_pnc' && (
                <AddPncEncounter
                  childId={activeChild?.id || 'default_child'}
                  onBack={() => setJourneySubView('pnc_overview')}
                  onSave={async (enc) => {
                    await handleSavePncEncounter(enc);
                    setJourneySubView('pnc_overview');
                  }}
                  onSaveDraft={() => setJourneySubView('pnc_overview')}
                />
              )}

              {journeySubView === 'pnc_detail' && selectedPncEncounter && (
                <PncEncounterDetail
                  encounter={selectedPncEncounter}
                  onBack={() => setJourneySubView('pnc_overview')}
                />
              )}

              {/* IMMUNIZATION SUITE */}
              {journeySubView === 'immunization_overview' && (
                <ImmunizationOverview
                  child={activeChild}
                  onBack={() => setJourneySubView('child_dashboard')}
                  onAddVaccine={() => setJourneySubView('add_vaccine')}
                  onSelectVaccine={(v) => {
                    setSelectedVaccine(v);
                    setJourneySubView('vaccine_detail');
                  }}
                  onOpenCatchUp={() => setJourneySubView('catch_up')}
                />
              )}

              {journeySubView === 'add_vaccine' && (
                <AddVaccine
                  childId={activeChild?.id || 'default_child'}
                  onBack={() => setJourneySubView('immunization_overview')}
                  onSave={async (v) => {
                    setJourneySubView('immunization_overview');
                  }}
                />
              )}

              {journeySubView === 'vaccine_detail' && (
                <VaccineDetail
                  record={selectedVaccine}
                  onBack={() => setJourneySubView('immunization_overview')}
                  onShareWithClinician={() => setIsClinicShareOpen(true)}
                />
              )}

              {journeySubView === 'catch_up' && (
                <CatchUpGuidance
                  onBack={() => setJourneySubView('immunization_overview')}
                  onOpenScheduleVisit={() => setJourneySubView('add_vaccine')}
                />
              )}

              {/* GROWTH & NUTRITION SUITE */}
              {journeySubView === 'growth_overview' && (
                <GrowthOverview
                  child={activeChild}
                  onBack={() => setJourneySubView('child_dashboard')}
                  onOpenChart={() => setJourneySubView('growth_chart')}
                  onAddMeasurement={() => setJourneySubView('add_growth')}
                  onOpenMuacAssessment={() => setJourneySubView('muac_assessment')}
                  onOpenNutrition={() => setJourneySubView('nutrition_overview')}
                  onOpenDevelopment={() => setJourneySubView('development_overview')}
                />
              )}

              {journeySubView === 'growth_chart' && (
                <GrowthChart
                  child={activeChild}
                  onBack={() => setJourneySubView('growth_overview')}
                  onAddMeasurement={() => setJourneySubView('add_growth')}
                />
              )}

              {journeySubView === 'add_growth' && (
                <AddGrowthMeasurement
                  childId={activeChild?.id || 'default_child'}
                  onBack={() => setJourneySubView('growth_overview')}
                  onSave={async () => {
                    setJourneySubView('growth_overview');
                  }}
                />
              )}

              {journeySubView === 'muac_assessment' && (
                <MuacAssessment
                  childId={activeChild?.id || 'default_child'}
                  onBack={() => setJourneySubView('growth_overview')}
                  onSave={async () => {
                    setJourneySubView('growth_overview');
                  }}
                  onOpenEmergency={onOpenEmergency}
                />
              )}

              {journeySubView === 'nutrition_overview' && (
                <NutritionOverview
                  child={activeChild}
                  onBack={() => setJourneySubView('growth_overview')}
                />
              )}

              {journeySubView === 'development_overview' && (
                <DevelopmentOverview
                  child={activeChild}
                  onBack={() => setJourneySubView('growth_overview')}
                  onRecordMilestone={() => setJourneySubView('development_record')}
                />
              )}

              {journeySubView === 'development_record' && (
                <DevelopmentRecord
                  childId={activeChild?.id || 'default_child'}
                  onBack={() => setJourneySubView('development_overview')}
                  onSave={async () => {
                    setJourneySubView('development_overview');
                  }}
                />
              )}
            </>
          )}

          {/* TAB 3: HAVEN GUIDE (AI Q&A Chat Assistant) */}
          {activeTab === 'haven' && (
            <div className="space-y-5 pb-12 animate-fade-in">
              <div className="bg-gradient-to-r from-haven-deep to-haven-orchid p-6 rounded-[20px] text-white shadow-card-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-white" />
                  <span className="font-display font-bold text-xs uppercase tracking-wider text-white/80">
                    Care Companion
                  </span>
                </div>
                <h2 className="font-display font-bold text-2xl text-white">Ask Haven</h2>
                <p className="font-body text-xs text-white/85 leading-relaxed">
                  Supportive answers and clinical guidance aligned with the Kenya MOH 216 Handbook.
                </p>
              </div>

              <div className="space-y-3">
                <span className="font-body text-[11px] font-bold tracking-wider text-ink-600 uppercase px-1">
                  POPULAR QUESTIONS & TOPICS
                </span>

                <div className="space-y-2.5">
                  {[
                    'Is mild lower back pain normal at 24 weeks?',
                    'When should baby receive the 6-week pentavalent vaccine?',
                    'How do I manage morning sickness and nutrition safely?',
                    'What are the critical danger signs in a newborn baby?',
                    'What items should I pack in my maternity delivery bag?',
                  ].map((q, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setHavenInitialQuery(q);
                        setIsAskHavenOpen(true);
                      }}
                      className="p-4 bg-white rounded-[20px] border border-border-hairline shadow-card-1 cursor-pointer hover:border-haven-orchid/40 transition-all flex items-center justify-between"
                    >
                      <p className="font-display font-bold text-sm text-ink-900">{q}</p>
                      <Sparkles className="w-4 h-4 text-haven-orchid flex-shrink-0 ml-2" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setHavenInitialQuery('');
                    setIsAskHavenOpen(true);
                  }}
                  className="w-full py-4 px-6 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-base rounded-pill shadow-button hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Start a conversation</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: RECORDS */}
          {activeTab === 'records' && (
            <>
              {recordsSubView === 'home' && (
                <RecordsHome
                  pregnancyCount={pregnancies.length || 6}
                  childCount={14}
                  immunizationCount={8}
                  growthCount={5}
                  onOpenPregnancyRecords={() => setRecordsSubView('pregnancy_records')}
                  onOpenChildRecords={() => setRecordsSubView('child_records')}
                  onOpenImmunizationRecords={() => setRecordsSubView('child_records')}
                  onOpenGrowthRecords={() => setRecordsSubView('child_records')}
                  onOpenExportManager={() => setRecordsSubView('export_manager')}
                />
              )}

              {recordsSubView === 'pregnancy_records' && (
                <PregnancyRecords
                  pregnancy={activePregnancy}
                  onBack={() => setRecordsSubView('home')}
                  onSelectRecord={(rec) => {
                    setSelectedRecordItem(rec);
                    setRecordsSubView('pregnancy_detail');
                  }}
                />
              )}

              {recordsSubView === 'pregnancy_detail' && (
                <PregnancyRecordDetail
                  record={selectedRecordItem}
                  onBack={() => setRecordsSubView('pregnancy_records')}
                  onShareWithClinician={() => setIsClinicShareOpen(true)}
                />
              )}

              {recordsSubView === 'child_records' && (
                <ChildRecords
                  child={activeChild}
                  onBack={() => setRecordsSubView('home')}
                  onSelectCategory={(cat) => {}}
                  onOpenRecordDetail={(rec) => {
                    setSelectedRecordItem(rec);
                    setRecordsSubView('child_detail');
                  }}
                />
              )}

              {recordsSubView === 'child_detail' && (
                <ChildRecordDetail
                  record={selectedRecordItem}
                  onBack={() => setRecordsSubView('child_records')}
                  onShareWithClinician={() => setIsClinicShareOpen(true)}
                />
              )}

              {recordsSubView === 'immunization_detail' && (
                <ImmunizationRecordDetail
                  record={selectedRecordItem}
                  onBack={() => setRecordsSubView('child_records')}
                  onShareWithClinician={() => setIsClinicShareOpen(true)}
                />
              )}

              {recordsSubView === 'growth_detail' && (
                <GrowthRecordDetail
                  record={selectedRecordItem}
                  onBack={() => setRecordsSubView('child_records')}
                  onShareWithClinician={() => setIsClinicShareOpen(true)}
                />
              )}

              {recordsSubView === 'export_manager' && (
                <ExportManager
                  onBack={() => setRecordsSubView('home')}
                  onProceedToConfirm={(cats, fmt) => {
                    setExportCategories(cats);
                    setExportFormat(fmt);
                    setIsExportConfirmOpen(true);
                  }}
                />
              )}
            </>
          )}

          {/* TAB 5: PROFILE */}
          {activeTab === 'profile' && (
            <>
              {profileSubView === 'home' && (
                <ProfileHome
                  user={user}
                  motherProfile={motherProfile}
                  onNavigate={(sec) => setProfileSubView(sec as ProfileSubView)}
                  onSignOut={() => auth.signOut()}
                />
              )}

              {profileSubView === 'personal_info' && (
                <PersonalInfo
                  motherProfile={motherProfile}
                  onBack={() => setProfileSubView('home')}
                  onSave={handleSaveProfile}
                />
              )}

              {profileSubView === 'pregnancies' && (
                <ProfilePregnancies
                  pregnancies={pregnancies}
                  onBack={() => setProfileSubView('home')}
                  onSelectPregnancy={(p) => {
                    setActivePregnancy(p);
                    setProfileSubView('pregnancy_detail');
                  }}
                  onAddPregnancy={() => setIsAddPregnancyOpen(true)}
                />
              )}

              {profileSubView === 'pregnancy_detail' && activePregnancy && (
                <ProfilePregnancyDetail
                  pregnancy={activePregnancy}
                  onBack={() => setProfileSubView('pregnancies')}
                  onUpdate={async (updated) => {
                    if (activePregnancy?.id) {
                      await updateDoc(doc(db, 'pregnancies', activePregnancy.id), updated);
                    }
                  }}
                />
              )}

              {profileSubView === 'children' && (
                <ProfileChildren
                  childrenList={childrenList}
                  onBack={() => setProfileSubView('home')}
                  onSelectChild={(c) => {
                    setActiveChild(c);
                    setProfileSubView('child_detail');
                  }}
                  onAddChild={() => setIsAddChildOpen(true)}
                />
              )}

              {profileSubView === 'child_detail' && activeChild && (
                <ProfileChildDetail
                  child={activeChild}
                  onBack={() => setProfileSubView('children')}
                  onUpdate={async (updated) => {
                    if (activeChild?.id) {
                      await updateDoc(doc(db, 'children', activeChild.id), updated);
                    }
                  }}
                />
              )}

              {profileSubView === 'partner_mgmt' && (
                <PartnerManagement
                  partner={partnerRel}
                  onBack={() => setProfileSubView('home')}
                  onOpenGenerateCode={() => setIsPartnerCodeOpen(true)}
                  onRevokePartner={() => setPartnerRel(null)}
                />
              )}

              {profileSubView === 'clinician_sharing' && (
                <ClinicianSharing
                  onBack={() => setProfileSubView('home')}
                  onGenerateClinicShareCode={() => setIsClinicShareOpen(true)}
                />
              )}

              {profileSubView === 'connected_access' && (
                <ConnectedAccess onBack={() => setProfileSubView('home')} />
              )}

              {profileSubView === 'notifications' && (
                <NotificationSettings onBack={() => setProfileSubView('home')} />
              )}

              {profileSubView === 'privacy' && (
                <PrivacySettings onBack={() => setProfileSubView('home')} />
              )}

              {profileSubView === 'security' && (
                <SecuritySettings
                  onBack={() => setProfileSubView('home')}
                  onOpenPinSetup={() => setProfileSubView('pin_setup')}
                  onOpenPinChange={() => setProfileSubView('pin_change')}
                />
              )}

              {profileSubView === 'about' && (
                <AboutPage onBack={() => setProfileSubView('home')} />
              )}

              {profileSubView === 'pin_setup' && (
                <AppLockPinSetup
                  onBack={() => setProfileSubView('security')}
                  onPinSetSuccess={() => setProfileSubView('security')}
                />
              )}

              {profileSubView === 'pin_change' && (
                <AppLockPinChange
                  onBack={() => setProfileSubView('security')}
                  onPinChangeSuccess={() => setProfileSubView('security')}
                />
              )}
            </>
          )}
        </div>

        {/* Floating Red Circular Emergency Button (56px, white "!") */}
        <div className="absolute bottom-16 right-4 z-40">
          <button
            onClick={() => setIsEmergencyEntryOpen(true)}
            className="w-14 h-14 rounded-full bg-[#E11D3C] text-white flex items-center justify-center font-display font-black text-2xl shadow-emergency cursor-pointer hover:scale-105 active:scale-95 transition-transform"
            title="Emergency Danger Signs & Speed Dial"
            aria-label="Emergency"
          >
            !
          </button>
        </div>

        {/* Global 5-Item Bottom Navigation: Today, Journey, Haven, Records, Profile */}
        <nav
          aria-label="Mother Navigation"
          className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-border-hairline px-2 py-2 z-30 flex items-center justify-around"
        >
          <button
            onClick={() => {
              setActiveTab('today');
              setTodaySubView('dashboard');
            }}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-pill transition-colors cursor-pointer ${
              activeTab === 'today'
                ? 'text-haven-deep font-display font-bold'
                : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            <Home className={`w-5 h-5 ${activeTab === 'today' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
            <span className="text-[11px] font-display">Today</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('journey');
              setJourneySubView('overview');
            }}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-pill transition-colors cursor-pointer ${
              activeTab === 'journey'
                ? 'text-haven-deep font-display font-bold'
                : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            <Compass className={`w-5 h-5 ${activeTab === 'journey' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
            <span className="text-[11px] font-display">Journey</span>
          </button>

          <button
            onClick={() => setActiveTab('haven')}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-pill transition-colors cursor-pointer ${
              activeTab === 'haven'
                ? 'text-haven-deep font-display font-bold'
                : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            <MessageCircle className={`w-5 h-5 ${activeTab === 'haven' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
            <span className="text-[11px] font-display">Haven</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('records');
              setRecordsSubView('home');
            }}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-pill transition-colors cursor-pointer ${
              activeTab === 'records'
                ? 'text-haven-deep font-display font-bold'
                : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            <FileText className={`w-5 h-5 ${activeTab === 'records' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
            <span className="text-[11px] font-display">Records</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('profile');
              setProfileSubView('home');
            }}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-pill transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'text-haven-deep font-display font-bold'
                : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            <User className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
            <span className="text-[11px] font-display">Profile</span>
          </button>
        </nav>
      </div>

      {/* Sheets and Modals */}
      {/* 1. Active Context Selector (M-TODAY-002) */}
      <ActiveContextSelector
        isOpen={isContextSelectorOpen}
        onClose={() => setIsContextSelectorOpen(false)}
        pregnancies={pregnancies}
        children={childrenList}
        selectedContextId={activePregnancy?.id || null}
        onSelectContext={(ctx: ActiveContext) => {
          if (ctx.type === 'pregnancy') {
            const found = pregnancies.find((p) => p.id === ctx.id);
            if (found) {
              setActivePregnancy(found);
              setActiveTab('journey');
              setJourneySubView('pregnancy_overview');
            }
          } else if (ctx.type === 'child') {
            const found = childrenList.find((c) => c.id === ctx.id);
            if (found) {
              setActiveChild(found);
              setActiveTab('journey');
              setJourneySubView('child_dashboard');
            }
          }
        }}
        onAddPregnancy={() => setIsAddPregnancyOpen(true)}
        onAddChild={() => setIsAddChildOpen(true)}
      />

      {/* 2. Ask Haven Bottom Sheet (M-TODAY-005) */}
      <AskHavenSheet
        isOpen={isAskHavenOpen}
        onClose={() => setIsAskHavenOpen(false)}
        onSendToChat={(q) => {
          setActiveTab('haven');
        }}
      />

      {/* 3. Emergency Entry (M-TODAY-006) */}
      <EmergencyEntry
        isOpen={isEmergencyEntryOpen}
        onClose={() => setIsEmergencyEntryOpen(false)}
        savedFacilityName={motherProfile?.facilityName || 'Kariokor Health Centre / Pumwani Hospital'}
        nextOfKinName={motherProfile?.nextOfKinName || 'Partner / Next of Kin'}
        nextOfKinPhone={motherProfile?.nextOfKinPhone || '+254 712 345 678'}
      />

      {/* 4. Add Pregnancy Modal */}
      <AddPregnancyModal
        isOpen={isAddPregnancyOpen}
        onClose={() => setIsAddPregnancyOpen(false)}
        onSave={handleSavePregnancy}
      />

      {/* 5. Add Child Modal */}
      <AddChildModal
        isOpen={isAddChildOpen}
        onClose={() => setIsAddChildOpen(false)}
        onSave={handleSaveChild}
      />

      {/* 6. Birth Plan Share Sheet (M-PREG-010) */}
      <BirthPlanShareSheet
        isOpen={isBirthPlanShareOpen}
        onClose={() => setIsBirthPlanShareOpen(false)}
        partnerName={motherProfile?.nextOfKinName || 'Brian Kipchoge'}
        isPartnerConnected={true}
        birthPlan={birthPlan}
        onShareConfirmed={() => setIsBirthPlanShareOpen(false)}
      />

      {/* 7. Birth Outcome Modal (M-PREG-011) */}
      <BirthOutcomeModal
        isOpen={isBirthOutcomeOpen}
        onClose={() => setIsBirthOutcomeOpen(false)}
        pregnancy={activePregnancy}
        onCompleteWithChild={handleCompletePregnancyWithChild}
        onCompleteWithoutChild={async () => {
          if (activePregnancy?.id) {
            await updateDoc(doc(db, 'pregnancies', activePregnancy.id), {
              status: 'completed',
              completedAt: new Date().toISOString(),
            });
          }
          setJourneySubView('overview');
        }}
      />

      {/* 8. Partner Connection Code Sheet (M-PRO-008) */}
      <PartnerConnectionCodeSheet
        isOpen={isPartnerCodeOpen}
        onClose={() => setIsPartnerCodeOpen(false)}
      />

      {/* 9. Clinic Share Code Sheet (M-PRO-010) */}
      <ClinicShareCodeSheet
        isOpen={isClinicShareOpen}
        onClose={() => setIsClinicShareOpen(false)}
      />

      {/* 10. Export Confirmation Modal (M-REC-009) */}
      <ExportConfirmationModal
        isOpen={isExportConfirmOpen}
        selectedCategories={exportCategories}
        format={exportFormat}
        onClose={() => setIsExportConfirmOpen(false)}
        onConfirm={() => setIsExportConfirmOpen(false)}
      />
    </div>
  );
};
