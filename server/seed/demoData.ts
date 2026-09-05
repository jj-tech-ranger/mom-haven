/**
 * Mom Haven Demo Dataset Definitions
 * Dataset Identifier: "defense-demo-v1"
 *
 * Implements 10 distinct demo mothers with realistic clinical and social scenarios,
 * 2 verified clinicians, and 3 partner accounts.
 *
 * All dates are dynamically computed relative to execution time using standard date helpers.
 */

export const DEMO_DATASET_ID = 'defense-demo-v1';
export const DEMO_DOMAIN = '@momhaven-demo.co.ke';
export const DEMO_PASSWORD = 'MomHaven2026!';

// --- Relative Date Helpers ---
export function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function daysAgo(n: number, refDate: Date = new Date()): string {
  const d = new Date(refDate);
  d.setDate(d.getDate() - n);
  return formatDate(d);
}

export function daysFromNow(n: number, refDate: Date = new Date()): string {
  const d = new Date(refDate);
  d.setDate(d.getDate() + n);
  return formatDate(d);
}

export function weeksAgo(n: number, refDate: Date = new Date()): string {
  return daysAgo(n * 7, refDate);
}

export function weeksFromNow(n: number, refDate: Date = new Date()): string {
  return daysFromNow(n * 7, refDate);
}

export function monthsAgo(n: number, refDate: Date = new Date()): string {
  const d = new Date(refDate);
  d.setMonth(d.getMonth() - n);
  return formatDate(d);
}

export function monthsFromNow(n: number, refDate: Date = new Date()): string {
  const d = new Date(refDate);
  d.setMonth(d.getMonth() + n);
  return formatDate(d);
}

export function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + n);
  return formatDate(date);
}

// --- Clinician Definitions ---
export interface DemoClinicianDef {
  email: string;
  name: string;
  cadre: string;
  licenseNumber: string;
  facilityId: string;
  facilityName: string;
  county: string;
  status: 'approved' | 'pending' | 'rejected';
  rejectionReason?: string;
}

export const DEMO_CLINICIANS: DemoClinicianDef[] = [
  {
    email: 'dr.faith.amani@momhaven-demo.co.ke',
    name: 'Dr. Faith Amani',
    cadre: 'Medical Officer (MO)',
    licenseNumber: 'KMPDC/2019/12450',
    facilityId: '13000',
    facilityName: 'Kenyatta National Hospital (KNH)',
    county: 'Nairobi',
    status: 'approved',
  },
  {
    email: 'dr.grace.neema@momhaven-demo.co.ke',
    name: 'Dr. Grace Neema',
    cadre: 'Consultant Obstetrician/Gynaecologist',
    licenseNumber: 'KMPDC/2014/08321',
    facilityId: '13123',
    facilityName: 'Pumwani Maternity Hospital',
    county: 'Nairobi',
    status: 'approved',
  },
  {
    email: 'winnie.baraka@momhaven-demo.co.ke',
    name: 'Winnie Baraka',
    cadre: 'Registered Midwife (KRCHN)',
    licenseNumber: 'NCK/RN/2017/44910',
    facilityId: '11540',
    facilityName: 'Coast General Teaching & Referral Hospital',
    county: 'Mombasa',
    status: 'approved',
  },
  {
    email: 'brian.furaha@momhaven-demo.co.ke',
    name: 'Brian Furaha',
    cadre: 'Clinical Officer (RCO)',
    licenseNumber: 'COC/RCO/2018/1932',
    facilityId: '15400',
    facilityName: 'Jaramogi Oginga Odinga Teaching & Referral Hospital',
    county: 'Kisumu',
    status: 'approved',
  },
  {
    email: 'dr.peter.imani@momhaven-demo.co.ke',
    name: 'Dr. Peter Imani',
    cadre: 'Paediatrician',
    licenseNumber: 'KMPDC/2020/15782',
    facilityId: '14800',
    facilityName: 'Nakuru Level 5 Hospital',
    county: 'Nakuru',
    status: 'pending',
  },
  {
    email: 'joseph.zawadi@momhaven-demo.co.ke',
    name: 'Joseph Zawadi',
    cadre: 'Community Health Officer',
    licenseNumber: 'PHOB/CHO/2021/0411',
    facilityId: '13800',
    facilityName: 'Nyeri County Referral Hospital',
    county: 'Nyeri',
    status: 'rejected',
    rejectionReason: 'Community Health Officer cadre is not eligible for independent clinical prescribing/record verification portal access. Requires institutional sponsorship under a verified medical facility officer.',
  },
];

// --- Partner Definitions ---
export interface DemoPartnerDef {
  email: string;
  name: string;
  motherEmail: string;
  connectionCode: string;
}

export const DEMO_PARTNERS: DemoPartnerDef[] = [
  {
    email: 'partner.grace@momhaven-demo.co.ke',
    name: 'Samuel Neema',
    motherEmail: 'grace.neema@momhaven-demo.co.ke',
    connectionCode: 'MH-GRACE1',
  },
  {
    email: 'partner.brenda@momhaven-demo.co.ke',
    name: 'Brian Imani',
    motherEmail: 'brenda.imani@momhaven-demo.co.ke',
    connectionCode: 'MH-BREND1',
  },
  {
    email: 'partner.christine@momhaven-demo.co.ke',
    name: 'Dennis Amani',
    motherEmail: 'christine.amani@momhaven-demo.co.ke',
    connectionCode: 'MH-CHRIST1',
  },
];

// --- Mother Definitions & Clinical Scenarios ---
export interface DemoMotherDef {
  key: string;
  email: string;
  name: string;
  county: string;
  support: 'partner' | 'family' | 'none';
  primaryHospitalFacilityId?: string;
  primaryHospitalName?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  lifecycleStage: 'pregnancy' | 'postpartum' | 'parenting' | 'planning' | 'exploring';
  scenarioDescription: string;
  buildData: (motherUid: string, partnerUid?: string, clinicianUids?: Record<string, string>) => DemoMotherPayload;
}

export interface DemoMotherPayload {
  user: {
    role: 'MOTHER';
    displayName: string;
    email: string;
    demoDataset: string;
  };
  profile: {
    userId: string;
    county: string;
    primaryHospitalFacilityId?: string;
    primaryHospitalName?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelationship?: string;
    demoDataset: string;
  };
  healthContext: {
    userId: string;
    lifecycleStage: string;
    county: string;
    primaryHospitalFacilityId?: string;
    primaryHospitalName?: string;
    preferredLanguage: 'en' | 'sw';
    interests: string[];
    demoDataset: string;
  };
  pregnancy?: {
    id: string;
    motherId: string;
    status: 'active' | 'completed';
    lmp: string;
    edd: string;
    gestationalAgeWeeks: number;
    gravida: number;
    parity: number;
    bloodGroup?: string;
    rhesus?: string;
    birthPlan?: any;
    outcomeDetails?: any;
    demoDataset: string;
  };
  ancEncounters?: Array<{
    id: string;
    pregnancyId: string;
    date: string;
    visitNumber: number;
    gestationalAgeWeeks: number;
    systolicBp: number;
    diastolicBp: number;
    weightKg: number;
    hbLevelGdl: number;
    fundalHeightCm?: number;
    fetalHeartRateBpm?: number;
    ironFolicGiven: boolean;
    iptpGiven: boolean;
    iptpDose?: number;
    nextAppointmentDate?: string;
    summary: string;
  }>;
  children?: Array<{
    id: string;
    motherId: string;
    name: string;
    dateOfBirth: string;
    sex: 'male' | 'female';
    birthWeightKg: number;
    birthLengthCm: number;
    headCircumferenceCm: number;
    deliveryFacility?: string;
    deliveryType?: 'SVD' | 'CS' | 'assisted';
    demoDataset: string;
    immunizations?: Array<{
      id: string;
      vaccineId: string;
      vaccineName: string;
      dose: string;
      targetAge: string;
      dueDate: string;
      status: 'GIVEN' | 'SCHEDULED' | 'MISSED' | 'OVERDUE';
      dateAdministered?: string;
      batchNumber?: string;
      facility?: string;
      notes?: string;
    }>;
    growthMeasurements?: Array<{
      id: string;
      date: string;
      weightKg: number;
      heightCm: number;
      muacCm?: number;
      headCircumferenceCm?: number;
      notes?: string;
    }>;
    newbornRecord?: any;
    congenitalExam?: any;
    postnatalEncounters?: any[];
    eyeCareAssessment?: any;
    toothEruption?: any;
    illnessRecords?: any[];
    milestoneRecords?: any[];
    aefiReports?: any[];
  }>;
  reminders?: Array<{
    id: string;
    userId: string;
    title: string;
    description?: string;
    dueDate: string;
    category: 'anc' | 'pnc' | 'immunization' | 'custom';
    completed: boolean;
    sharedWithPartner?: boolean;
    childId?: string;
    pregnancyId?: string;
    demoDataset: string;
  }>;
  dailyHealthLogs?: Array<{
    id: string;
    userId: string;
    date: string;
    type: 'symptoms' | 'mood' | 'wellness';
    values: Record<string, any>;
    demoDataset: string;
  }>;
  pmtctRecord?: any;
  cancerScreening?: any;
  antenatalProfile?: any;
  familyPlanning?: any;
  hospitalAdmissions?: any[];
  specialClinicalAttendances?: any[];
  clinicianPrivateNotes?: any[];
  partnerRelationship?: any;
  partnerShare?: any;
}

export const DEMO_MOTHERS: DemoMotherDef[] = [
  // =========================================================================
  // 1. Grace Neema (Nairobi) - 1st-trimester pregnancy + ANC history + upcoming ANC
  // Support: partner
  // =========================================================================
  {
    key: 'grace-neema',
    email: 'grace.neema@momhaven-demo.co.ke',
    name: 'Grace Neema',
    county: 'Nairobi',
    support: 'partner',
    primaryHospitalFacilityId: '13123',
    primaryHospitalName: 'Pumwani Maternity Hospital',
    scenarioDescription: '1st-trimester pregnancy + ANC history + upcoming ANC',
    lifecycleStage: 'pregnancy',
    buildData: (motherUid, partnerUid) => {
      const pregId = `preg-${motherUid}`;
      const lmpDate = weeksAgo(9); // ~9 weeks gestation (1st trimester)
      const eddDate = addDays(lmpDate, 280);

      return {
        user: {
          role: 'MOTHER',
          displayName: 'Grace Neema',
          email: 'grace.neema@momhaven-demo.co.ke',
          demoDataset: DEMO_DATASET_ID,
        },
        profile: {
          userId: motherUid,
          county: 'Nairobi',
          primaryHospitalFacilityId: '13123',
          primaryHospitalName: 'Pumwani Maternity Hospital',
          emergencyContactName: 'Samuel Neema',
          emergencyContactPhone: '+254712000001',
          emergencyContactRelationship: 'Partner',
          demoDataset: DEMO_DATASET_ID,
        },
        healthContext: {
          userId: motherUid,
          lifecycleStage: 'pregnancy',
          county: 'Nairobi',
          primaryHospitalFacilityId: '13123',
          primaryHospitalName: 'Pumwani Maternity Hospital',
          preferredLanguage: 'en',
          interests: ['nutrition', 'birth_plan', 'exercise'],
          demoDataset: DEMO_DATASET_ID,
        },
        pregnancy: {
          id: pregId,
          motherId: motherUid,
          status: 'active',
          lmp: lmpDate,
          edd: eddDate,
          gestationalAgeWeeks: 9,
          gravida: 1,
          parity: 0,
          bloodGroup: 'O',
          rhesus: '+',
          birthPlan: {
            preferredFacility: 'Pumwani Maternity Hospital',
            birthCompanion: 'Samuel Neema (Partner)',
            transportPlan: {
              mode: 'Taxi / Private Car',
              contactName: 'John Mwangi',
              contactPhone: '+254712345678',
            },
          },
          demoDataset: DEMO_DATASET_ID,
        },
        ancEncounters: [
          {
            id: `anc-${pregId}-1`,
            pregnancyId: pregId,
            date: weeksAgo(1),
            visitNumber: 1,
            gestationalAgeWeeks: 8,
            systolicBp: 116,
            diastolicBp: 74,
            weightKg: 64.5,
            hbLevelGdl: 12.8,
            ironFolicGiven: true,
            iptpGiven: false,
            nextAppointmentDate: daysFromNow(14),
            summary: 'ANC Contact 1 (Booking & Baseline Profile): Normal early gestation, started IFAS, scheduled for dating ultrasound scan.',
          },
        ],
        reminders: [
          {
            id: `rem-${motherUid}-anc2`,
            userId: motherUid,
            title: 'ANC Contact 2 (12-Week Review & Dating Ultrasound)',
            description: 'Second antenatal follow-up visit at Pumwani Maternity Hospital.',
            dueDate: daysFromNow(14),
            category: 'anc',
            completed: false,
            sharedWithPartner: true,
            pregnancyId: pregId,
            demoDataset: DEMO_DATASET_ID,
          },
        ],
        dailyHealthLogs: [
          {
            id: `log-${motherUid}-1`,
            userId: motherUid,
            date: daysAgo(2),
            type: 'symptoms',
            values: {
              symptoms: ['Mild morning nausea'],
              hasDangerSigns: false,
              notes: 'Managing morning sickness with small frequent meals and adequate hydration.',
            },
            demoDataset: DEMO_DATASET_ID,
          },
        ],
        partnerRelationship: partnerUid ? {
          id: `${motherUid}_${partnerUid}`,
          motherId: motherUid,
          motherName: 'Grace Neema',
          partnerId: partnerUid,
          partnerName: 'Samuel Neema',
          code: 'MH-GRACE1',
          connectionCode: 'MH-GRACE1',
          status: 'active',
          scope: 'Logistics & Support Only — No Clinical Records Access',
          sharingScopes: {
            appointments: true,
            birthPlan: true,
            emergencyContacts: true,
            moodSignal: true,
          },
          createdAt: weeksAgo(4),
          connectedAt: weeksAgo(3),
        } : undefined,
        partnerShare: {
          motherId: motherUid,
          coarseMood: 'good',
          coarseEnergy: 'normal',
          updatedAt: daysAgo(1),
          demoDataset: DEMO_DATASET_ID,
        },
      };
    },
  },

  // =========================================================================
  // 2. Mercy Faraja (Mombasa) - 3rd-trimester pregnancy + detailed clinical history
  // Support: family
  // =========================================================================
  {
    key: 'mercy-faraja',
    email: 'mercy.faraja@momhaven-demo.co.ke',
    name: 'Mercy Faraja',
    county: 'Mombasa',
    support: 'family',
    primaryHospitalFacilityId: '11540',
    primaryHospitalName: 'Coast General Teaching & Referral Hospital',
    scenarioDescription: '3rd-trimester pregnancy + detailed clinical history',
    lifecycleStage: 'pregnancy',
    emergencyContact: {
      name: 'Amina Faraja',
      phone: '+254722000002',
      relationship: 'Sister',
    },
    buildData: (motherUid) => {
      const pregId = `preg-${motherUid}`;
      const lmpDate = weeksAgo(33); // ~33 weeks gestation (3rd trimester)
      const eddDate = addDays(lmpDate, 280);

      return {
        user: {
          role: 'MOTHER',
          displayName: 'Mercy Faraja',
          email: 'mercy.faraja@momhaven-demo.co.ke',
          demoDataset: DEMO_DATASET_ID,
        },
        profile: {
          userId: motherUid,
          county: 'Mombasa',
          primaryHospitalFacilityId: '11540',
          primaryHospitalName: 'Coast General Teaching & Referral Hospital',
          emergencyContactName: 'Amina Faraja',
          emergencyContactPhone: '+254722000002',
          emergencyContactRelationship: 'Sister',
          demoDataset: DEMO_DATASET_ID,
        },
        healthContext: {
          userId: motherUid,
          lifecycleStage: 'pregnancy',
          county: 'Mombasa',
          primaryHospitalFacilityId: '11540',
          primaryHospitalName: 'Coast General Teaching & Referral Hospital',
          preferredLanguage: 'sw',
          interests: ['nutrition', 'pmtct', 'birth_plan'],
          demoDataset: DEMO_DATASET_ID,
        },
        pregnancy: {
          id: pregId,
          motherId: motherUid,
          status: 'active',
          lmp: lmpDate,
          edd: eddDate,
          gestationalAgeWeeks: 33,
          gravida: 2,
          parity: 1,
          bloodGroup: 'B',
          rhesus: '+',
          birthPlan: {
            preferredFacility: 'Coast General Teaching & Referral Hospital',
            birthCompanion: 'Amina Faraja (Sister)',
            transportPlan: {
              mode: 'Hospital Ambulance / Tuk-tuk Taxi',
              contactName: 'Rashid Omar',
              contactPhone: '+254721444555',
            },
          },
          demoDataset: DEMO_DATASET_ID,
        },
        ancEncounters: [
          {
            id: `anc-${pregId}-1`,
            pregnancyId: pregId,
            date: weeksAgo(21),
            visitNumber: 1,
            gestationalAgeWeeks: 12,
            systolicBp: 118,
            diastolicBp: 76,
            weightKg: 62.0,
            hbLevelGdl: 11.9,
            ironFolicGiven: true,
            iptpGiven: false,
            summary: 'Booking ANC: Baseline evaluation, confirmed ART adherence, routine booking labs.',
          },
          {
            id: `anc-${pregId}-2`,
            pregnancyId: pregId,
            date: weeksAgo(13),
            visitNumber: 2,
            gestationalAgeWeeks: 20,
            systolicBp: 120,
            diastolicBp: 78,
            weightKg: 65.5,
            hbLevelGdl: 12.1,
            fundalHeightCm: 20,
            fetalHeartRateBpm: 142,
            ironFolicGiven: true,
            iptpGiven: true,
            iptpDose: 1,
            summary: 'ANC Contact 2: Anomaly ultrasound reviewed, IPTp-SP Dose 1 administered, fetal heart rate normal.',
          },
          {
            id: `anc-${pregId}-3`,
            pregnancyId: pregId,
            date: weeksAgo(7),
            visitNumber: 3,
            gestationalAgeWeeks: 26,
            systolicBp: 122,
            diastolicBp: 80,
            weightKg: 68.0,
            hbLevelGdl: 11.8,
            fundalHeightCm: 26,
            fetalHeartRateBpm: 138,
            ironFolicGiven: true,
            iptpGiven: true,
            iptpDose: 2,
            summary: 'ANC Contact 3: IPTp-SP Dose 2 given, IFAS replenished, infant feeding options discussed.',
          },
          {
            id: `anc-${pregId}-4`,
            pregnancyId: pregId,
            date: weeksAgo(3),
            visitNumber: 4,
            gestationalAgeWeeks: 30,
            systolicBp: 124,
            diastolicBp: 82,
            weightKg: 70.2,
            hbLevelGdl: 12.0,
            fundalHeightCm: 30,
            fetalHeartRateBpm: 144,
            ironFolicGiven: true,
            iptpGiven: true,
            iptpDose: 3,
            nextAppointmentDate: daysFromNow(18),
            summary: 'ANC Contact 4: 3rd trimester scan reviewed (cephalic presentation), viral load sample taken, IPTp-SP Dose 3 given.',
          },
        ],
        pmtctRecord: {
          id: `pmtct-${motherUid}`,
          motherId: motherUid,
          isHivExposed: true,
          maternalHivStatus: 'reactive',
          maternalArtStartDate: '2021-04-10',
          maternalBaselineRegimen: 'TDF + 3TC + DTG',
          maternalArtVisits: [
            {
              visitNumber: 1,
              date: weeksAgo(20),
              regimen: 'TDF + 3TC + DTG',
              dispensed: true,
              adherenceAssessed: true,
              comments: 'Adherence sustained >95%, no adverse drug reactions reported.',
            },
            {
              visitNumber: 2,
              date: weeksAgo(10),
              regimen: 'TDF + 3TC + DTG',
              dispensed: true,
              adherenceAssessed: true,
              comments: 'Good adherence, routine pill count verified.',
            },
            {
              visitNumber: 3,
              date: weeksAgo(2),
              regimen: 'TDF + 3TC + DTG',
              dispensed: true,
              adherenceAssessed: true,
              comments: 'Prescription renewed, blood drawn for viral load monitoring.',
            },
          ],
          maternalViralLoad: {
            dateSampleTaken: weeksAgo(2),
            resultCopiesMl: '< 50',
            suppressionStatus: 'suppressed',
            dateResultReceived: daysAgo(3),
            nextVlDueDate: monthsFromNow(6),
            comments: 'Target not detected / suppressed (<50 copies/mL). Low MTCT risk, continue standard regimen.',
          },
          carePlanSummary: {
            nextAppointmentDate: daysFromNow(18),
            activeMedications: ['TDF + 3TC + DTG (TLD)', 'IFAS daily'],
            infantFeedingCounseling: 'exclusive_breastfeeding',
            supportGroupReferred: true,
            counselorName: 'Sister Fatuma, MCH Clinic',
          },
          createdAt: weeksAgo(21),
          updatedAt: daysAgo(3),
          demoDataset: DEMO_DATASET_ID,
        },
        antenatalProfile: {
          id: pregId,
          pregnancyId: pregId,
          motherId: motherUid,
          bloodGroup: 'B',
          rhesusFactor: '+',
          hivStatus: 'reactive',
          syphilisStatus: 'non-reactive',
          hepatitisBStatus: 'non-reactive',
          tbIcfScreeningOutcome: 'negative',
          serologyRepeatSchedule: [
            { testType: 'HIV', milestone: 'Booking ANC', dateTested: weeksAgo(21), result: 'reactive', comments: 'Known reactive on ART since 2021' },
            { testType: 'Syphilis', milestone: 'Booking ANC', dateTested: weeksAgo(21), result: 'non-reactive', comments: 'VDRL non-reactive' },
            { testType: 'Hepatitis B', milestone: 'Booking ANC', dateTested: weeksAgo(21), result: 'non-reactive', comments: 'HBsAg negative' },
            { testType: 'Syphilis', milestone: '3rd Trimester (32 wks)', dateTested: weeksAgo(1), result: 'non-reactive', comments: 'Repeat syphilis negative' },
          ],
          ultrasound1: {
            scanNumber: 1,
            windowLabel: 'Ultrasound #1 (<24 weeks)',
            date: weeksAgo(13),
            gestationWeeks: 20,
            placentaLocation: 'Posterior',
            fetalViability: true,
            findings: 'Normal anatomy, single intrauterine fetus, adequate liquor volume.',
          },
          ultrasound2: {
            scanNumber: 2,
            windowLabel: 'Ultrasound #2 (3rd trimester)',
            date: weeksAgo(3),
            gestationWeeks: 30,
            placentaLocation: 'Posterior clear of os',
            fetalViability: true,
            findings: 'Cephalic presentation, estimated fetal weight 1.65kg, normal biophysical parameters.',
          },
          createdAt: weeksAgo(21),
          updatedAt: weeksAgo(1),
          demoDataset: DEMO_DATASET_ID,
        },
        cancerScreening: {
          id: `cs-${motherUid}`,
          motherId: motherUid,
          date: monthsAgo(14),
          cervicalDone: true,
          cervicalTestType: 'VIA',
          cervicalResult: 'negative',
          cervicalTreatment: 'none',
          breastDone: true,
          breastTestType: 'CBE',
          breastResult: 'normal',
          hasPositiveOrSuspicious: false,
          notes: 'Routine pre-pregnancy cervical & clinical breast exam screening clear.',
          createdAt: monthsAgo(14),
          updatedAt: monthsAgo(14),
          demoDataset: DEMO_DATASET_ID,
        },
        reminders: [
          {
            id: `rem-${motherUid}-anc5`,
            userId: motherUid,
            title: 'ANC Contact 5 (36-Week Birth Readiness & Delivery Planning)',
            description: 'Review birth pack, PMTCT infant prophylaxis protocol, and signs of labor at Coast General.',
            dueDate: daysFromNow(18),
            category: 'anc',
            completed: false,
            pregnancyId: pregId,
            demoDataset: DEMO_DATASET_ID,
          },
        ],
      };
    },
  },

  // =========================================================================
  // 3. Joy Baraka (Kisumu) - 6-month-old child + vaccination history
  // Support: none
  // =========================================================================
  {
    key: 'joy-baraka',
    email: 'joy.baraka@momhaven-demo.co.ke',
    name: 'Joy Baraka',
    county: 'Kisumu',
    support: 'none',
    primaryHospitalFacilityId: '15400',
    primaryHospitalName: 'Jaramogi Oginga Odinga Teaching & Referral Hospital',
    scenarioDescription: '6-month-old child + vaccination history',
    lifecycleStage: 'parenting',
    buildData: (motherUid) => {
      const childId = `child-${motherUid}-1`;
      const dob = monthsAgo(6); // 6-month-old child

      return {
        user: {
          role: 'MOTHER',
          displayName: 'Joy Baraka',
          email: 'joy.baraka@momhaven-demo.co.ke',
          demoDataset: DEMO_DATASET_ID,
        },
        profile: {
          userId: motherUid,
          county: 'Kisumu',
          primaryHospitalFacilityId: '15400',
          primaryHospitalName: 'Jaramogi Oginga Odinga Teaching & Referral Hospital',
          demoDataset: DEMO_DATASET_ID,
        },
        healthContext: {
          userId: motherUid,
          lifecycleStage: 'parenting',
          county: 'Kisumu',
          primaryHospitalFacilityId: '15400',
          primaryHospitalName: 'Jaramogi Oginga Odinga Teaching & Referral Hospital',
          preferredLanguage: 'en',
          interests: ['immunization', 'nutrition', 'development'],
          demoDataset: DEMO_DATASET_ID,
        },
        children: [
          {
            id: childId,
            motherId: motherUid,
            name: 'Amani Baraka',
            dateOfBirth: dob,
            sex: 'female',
            birthWeightKg: 3.2,
            birthLengthCm: 49,
            headCircumferenceCm: 34,
            deliveryFacility: 'Jaramogi Oginga Odinga Teaching & Referral Hospital',
            deliveryType: 'SVD',
            demoDataset: DEMO_DATASET_ID,
            immunizations: [
              { id: `imm-${childId}-bcg`, vaccineId: 'bcg', vaccineName: 'BCG', dose: 'Birth', targetAge: 'Birth', dueDate: dob, status: 'GIVEN', dateAdministered: dob, facility: 'JOOTRH' },
              { id: `imm-${childId}-opv0`, vaccineId: 'opv', vaccineName: 'OPV 0', dose: 'Birth', targetAge: 'Birth', dueDate: dob, status: 'GIVEN', dateAdministered: dob, facility: 'JOOTRH' },
              { id: `imm-${childId}-penta1`, vaccineId: 'penta', vaccineName: 'Pentavalent 1', dose: 'Dose 1', targetAge: '6 weeks', dueDate: addDays(dob, 42), status: 'GIVEN', dateAdministered: addDays(dob, 42), facility: 'JOOTRH' },
              { id: `imm-${childId}-opv1`, vaccineId: 'opv', vaccineName: 'OPV 1', dose: 'Dose 1', targetAge: '6 weeks', dueDate: addDays(dob, 42), status: 'GIVEN', dateAdministered: addDays(dob, 42), facility: 'JOOTRH' },
              { id: `imm-${childId}-pcv1`, vaccineId: 'pcv', vaccineName: 'PCV 1', dose: 'Dose 1', targetAge: '6 weeks', dueDate: addDays(dob, 42), status: 'GIVEN', dateAdministered: addDays(dob, 42), facility: 'JOOTRH' },
              { id: `imm-${childId}-rota1`, vaccineId: 'rota', vaccineName: 'Rotavirus 1', dose: 'Dose 1', targetAge: '6 weeks', dueDate: addDays(dob, 42), status: 'GIVEN', dateAdministered: addDays(dob, 42), facility: 'JOOTRH' },
              { id: `imm-${childId}-penta2`, vaccineId: 'penta', vaccineName: 'Pentavalent 2', dose: 'Dose 2', targetAge: '10 weeks', dueDate: addDays(dob, 70), status: 'GIVEN', dateAdministered: addDays(dob, 70), facility: 'JOOTRH' },
              { id: `imm-${childId}-opv2`, vaccineId: 'opv', vaccineName: 'OPV 2', dose: 'Dose 2', targetAge: '10 weeks', dueDate: addDays(dob, 70), status: 'GIVEN', dateAdministered: addDays(dob, 70), facility: 'JOOTRH' },
              { id: `imm-${childId}-pcv2`, vaccineId: 'pcv', vaccineName: 'PCV 2', dose: 'Dose 2', targetAge: '10 weeks', dueDate: addDays(dob, 70), status: 'GIVEN', dateAdministered: addDays(dob, 70), facility: 'JOOTRH' },
              { id: `imm-${childId}-rota2`, vaccineId: 'rota', vaccineName: 'Rotavirus 2', dose: 'Dose 2', targetAge: '10 weeks', dueDate: addDays(dob, 70), status: 'GIVEN', dateAdministered: addDays(dob, 70), facility: 'JOOTRH' },
              { id: `imm-${childId}-penta3`, vaccineId: 'penta', vaccineName: 'Pentavalent 3', dose: 'Dose 3', targetAge: '14 weeks', dueDate: addDays(dob, 98), status: 'GIVEN', dateAdministered: addDays(dob, 98), facility: 'JOOTRH' },
              { id: `imm-${childId}-opv3`, vaccineId: 'opv', vaccineName: 'OPV 3', dose: 'Dose 3', targetAge: '14 weeks', dueDate: addDays(dob, 98), status: 'GIVEN', dateAdministered: addDays(dob, 98), facility: 'JOOTRH' },
              { id: `imm-${childId}-pcv3`, vaccineId: 'pcv', vaccineName: 'PCV 3', dose: 'Dose 3', targetAge: '14 weeks', dueDate: addDays(dob, 98), status: 'GIVEN', dateAdministered: addDays(dob, 98), facility: 'JOOTRH' },
              { id: `imm-${childId}-ipv`, vaccineId: 'ipv', vaccineName: 'IPV', dose: 'Dose 1', targetAge: '14 weeks', dueDate: addDays(dob, 98), status: 'GIVEN', dateAdministered: addDays(dob, 98), facility: 'JOOTRH' },
              { id: `imm-${childId}-vita`, vaccineId: 'vitamin-a', vaccineName: 'Vitamin A (100,000 IU)', dose: 'Dose 1', targetAge: '6 months', dueDate: daysFromNow(5), status: 'SCHEDULED' },
            ],
            growthMeasurements: [
              { id: `growth-${childId}-birth`, date: dob, weightKg: 3.2, heightCm: 49.0, headCircumferenceCm: 34.0, notes: 'Birth weight' },
              { id: `growth-${childId}-6w`, date: addDays(dob, 42), weightKg: 4.4, heightCm: 54.5, muacCm: 12.8, notes: '6-week review' },
              { id: `growth-${childId}-10w`, date: addDays(dob, 70), weightKg: 5.3, heightCm: 58.0, muacCm: 13.4, notes: '10-week review' },
              { id: `growth-${childId}-14w`, date: addDays(dob, 98), weightKg: 6.2, heightCm: 62.0, muacCm: 13.9, notes: '14-week review' },
              { id: `growth-${childId}-6m`, date: daysAgo(5), weightKg: 7.4, heightCm: 66.0, muacCm: 14.3, notes: '6-month growth monitoring - normal green band' },
            ],
          },
        ],
        reminders: [
          {
            id: `rem-${motherUid}-6m-wellchild`,
            userId: motherUid,
            title: '6-Month Well-Child Visit & Vitamin A Supplementation',
            description: 'Administer Vitamin A dose 1, complementary feeding counseling, and growth monitoring.',
            dueDate: daysFromNow(5),
            category: 'immunization',
            completed: false,
            childId,
            demoDataset: DEMO_DATASET_ID,
          },
        ],
      };
    },
  },

  // =========================================================================
  // 4. Faith Upendo (Nakuru) - 2-year-old child + overdue/missed item
  // Support: family
  // =========================================================================
  {
    key: 'faith-upendo',
    email: 'faith.upendo@momhaven-demo.co.ke',
    name: 'Faith Upendo',
    county: 'Nakuru',
    support: 'family',
    primaryHospitalFacilityId: '14800',
    primaryHospitalName: 'Nakuru Level 5 Hospital',
    scenarioDescription: '2-year-old child + overdue/missed item',
    lifecycleStage: 'parenting',
    emergencyContact: {
      name: 'Margaret Upendo',
      phone: '+254733000003',
      relationship: 'Mother',
    },
    buildData: (motherUid) => {
      const childId = `child-${motherUid}-1`;
      const dob = monthsAgo(24); // 2-year-old child

      return {
        user: {
          role: 'MOTHER',
          displayName: 'Faith Upendo',
          email: 'faith.upendo@momhaven-demo.co.ke',
          demoDataset: DEMO_DATASET_ID,
        },
        profile: {
          userId: motherUid,
          county: 'Nakuru',
          primaryHospitalFacilityId: '14800',
          primaryHospitalName: 'Nakuru Level 5 Hospital',
          emergencyContactName: 'Margaret Upendo',
          emergencyContactPhone: '+254733000003',
          emergencyContactRelationship: 'Mother',
          demoDataset: DEMO_DATASET_ID,
        },
        healthContext: {
          userId: motherUid,
          lifecycleStage: 'parenting',
          county: 'Nakuru',
          primaryHospitalFacilityId: '14800',
          primaryHospitalName: 'Nakuru Level 5 Hospital',
          preferredLanguage: 'en',
          interests: ['immunization', 'development', 'nutrition'],
          demoDataset: DEMO_DATASET_ID,
        },
        children: [
          {
            id: childId,
            motherId: motherUid,
            name: 'Ethan Upendo',
            dateOfBirth: dob,
            sex: 'male',
            birthWeightKg: 3.5,
            birthLengthCm: 51,
            headCircumferenceCm: 35,
            deliveryFacility: 'Nakuru Level 5 Hospital',
            deliveryType: 'SVD',
            demoDataset: DEMO_DATASET_ID,
            immunizations: [
              { id: `imm-${childId}-bcg`, vaccineId: 'bcg', vaccineName: 'BCG', dose: 'Birth', targetAge: 'Birth', dueDate: dob, status: 'GIVEN', dateAdministered: dob },
              { id: `imm-${childId}-opv0`, vaccineId: 'opv', vaccineName: 'OPV 0', dose: 'Birth', targetAge: 'Birth', dueDate: dob, status: 'GIVEN', dateAdministered: dob },
              { id: `imm-${childId}-penta1`, vaccineId: 'penta', vaccineName: 'Pentavalent 1', dose: 'Dose 1', targetAge: '6 weeks', dueDate: addDays(dob, 42), status: 'GIVEN', dateAdministered: addDays(dob, 42) },
              { id: `imm-${childId}-penta2`, vaccineId: 'penta', vaccineName: 'Pentavalent 2', dose: 'Dose 2', targetAge: '10 weeks', dueDate: addDays(dob, 70), status: 'GIVEN', dateAdministered: addDays(dob, 70) },
              { id: `imm-${childId}-penta3`, vaccineId: 'penta', vaccineName: 'Pentavalent 3', dose: 'Dose 3', targetAge: '14 weeks', dueDate: addDays(dob, 98), status: 'GIVEN', dateAdministered: addDays(dob, 98) },
              { id: `imm-${childId}-mr1`, vaccineId: 'mr', vaccineName: 'Measles-Rubella 1', dose: 'Dose 1', targetAge: '9 months', dueDate: addDays(dob, 270), status: 'GIVEN', dateAdministered: addDays(dob, 275) },
              // Overdue/missed immunization dose:
              { id: `imm-${childId}-mr2`, vaccineId: 'mr', vaccineName: 'Measles-Rubella 2', dose: 'Dose 2 (18 months)', targetAge: '18 months', dueDate: addDays(dob, 540), status: 'MISSED', notes: 'Missed due to rural travel; needs urgent catch-up vaccination dose.' },
              { id: `imm-${childId}-deworm24m`, vaccineId: 'deworming', vaccineName: 'Deworming (Albendazole 200mg)', dose: '24 months', targetAge: '24 months', dueDate: daysAgo(10), status: 'OVERDUE' },
            ],
            milestoneRecords: [
              { id: `ms-${childId}-1`, childId, milestoneId: 'walk_indep', category: 'gross_motor', title: 'Walking independently without support', achievedDate: monthsAgo(12), status: 'achieved' },
              { id: `ms-${childId}-2`, childId, milestoneId: 'talk_sentences', category: 'speech_language', title: 'Speaking 2-3 word sentences', achievedDate: monthsAgo(4), status: 'achieved' },
              { id: `ms-${childId}-3`, childId, milestoneId: 'spoon_use', category: 'fine_motor', title: 'Uses spoon independently to eat', achievedDate: monthsAgo(2), status: 'achieved' },
            ],
            toothEruption: {
              id: childId,
              childId,
              teethPresentCount: 16,
              eruptedTeeth: ['central_incisors_upper', 'central_incisors_lower', 'lateral_incisors_upper', 'lateral_incisors_lower', 'first_molars_upper', 'first_molars_lower', 'canines_upper', 'canines_lower'],
              dentalCareAdvised: true,
              notes: 'Clean oral cavity, advised fluoride toothpaste brushing twice daily.',
              createdAt: monthsAgo(1),
            },
            illnessRecords: [
              {
                id: `ill-${childId}-1`,
                childId,
                date: monthsAgo(5),
                symptoms: ['High fever', 'Cough', 'Vomiting everything'],
                hasDangerSigns: true,
                dangerSigns: ['Vomiting everything', 'Lethargy'],
                careActionTaken: 'Urgent presentation to Nakuru Level 5 Hospital. Treated for acute febrile illness with oral rehydration and antibiotics. Full recovery.',
                facilityVisited: 'Nakuru Level 5 Hospital',
                createdAt: monthsAgo(5),
              },
            ],
          },
        ],
        reminders: [
          {
            id: `rem-${motherUid}-mr2-overdue`,
            userId: motherUid,
            title: 'Overdue: 18-Month Measles-Rubella 2 Catch-Up Dose',
            description: 'Ethan has missed the 18-month MR2 immunization booster. Visit Nakuru Level 5 Hospital or nearest dispensary for immediate catch-up.',
            dueDate: daysAgo(14),
            category: 'immunization',
            completed: false,
            childId,
            demoDataset: DEMO_DATASET_ID,
          },
          {
            id: `rem-${motherUid}-deworm-overdue`,
            userId: motherUid,
            title: 'Overdue: 24-Month Vitamin A & Deworming Tablet',
            description: 'Scheduled semi-annual deworming (Albendazole) and Vitamin A capsule due.',
            dueDate: daysAgo(7),
            category: 'immunization',
            completed: false,
            childId,
            demoDataset: DEMO_DATASET_ID,
          },
        ],
      };
    },
  },

  // =========================================================================
  // 5. Brenda Imani (Uasin Gishu) - newborn/postpartum + recent PNC + upcoming review
  // Support: partner
  // =========================================================================
  {
    key: 'brenda-imani',
    email: 'brenda.imani@momhaven-demo.co.ke',
    name: 'Brenda Imani',
    county: 'Uasin Gishu',
    support: 'partner',
    primaryHospitalFacilityId: '15900',
    primaryHospitalName: 'Moi Teaching and Referral Hospital (MTRH)',
    scenarioDescription: 'newborn/postpartum + recent PNC + upcoming review',
    lifecycleStage: 'postpartum',
    buildData: (motherUid, partnerUid) => {
      const childId = `child-${motherUid}-1`;
      const deliveryDate = daysAgo(4); // newborn delivered 4 days ago
      const pregId = `preg-${motherUid}-completed`;

      return {
        user: {
          role: 'MOTHER',
          displayName: 'Brenda Imani',
          email: 'brenda.imani@momhaven-demo.co.ke',
          demoDataset: DEMO_DATASET_ID,
        },
        profile: {
          userId: motherUid,
          county: 'Uasin Gishu',
          primaryHospitalFacilityId: '15900',
          primaryHospitalName: 'Moi Teaching and Referral Hospital (MTRH)',
          emergencyContactName: 'Brian Imani',
          emergencyContactPhone: '+254712000004',
          emergencyContactRelationship: 'Partner',
          demoDataset: DEMO_DATASET_ID,
        },
        healthContext: {
          userId: motherUid,
          lifecycleStage: 'postpartum',
          county: 'Uasin Gishu',
          primaryHospitalFacilityId: '15900',
          primaryHospitalName: 'Moi Teaching and Referral Hospital (MTRH)',
          preferredLanguage: 'en',
          interests: ['postpartum_care', 'lactation', 'newborn_care'],
          demoDataset: DEMO_DATASET_ID,
        },
        pregnancy: {
          id: pregId,
          motherId: motherUid,
          status: 'completed',
          lmp: weeksAgo(41),
          edd: addDays(weeksAgo(41), 280),
          gestationalAgeWeeks: 40,
          gravida: 1,
          parity: 1,
          outcomeDetails: {
            deliveryDate,
            deliveryType: 'SVD',
            outcomeType: 'Live Birth',
            facilityName: 'Moi Teaching and Referral Hospital (MTRH)',
          },
          demoDataset: DEMO_DATASET_ID,
        },
        children: [
          {
            id: childId,
            motherId: motherUid,
            name: 'Jabari Imani',
            dateOfBirth: deliveryDate,
            sex: 'male',
            birthWeightKg: 3.4,
            birthLengthCm: 50,
            headCircumferenceCm: 35,
            deliveryFacility: 'Moi Teaching and Referral Hospital (MTRH)',
            deliveryType: 'SVD',
            demoDataset: DEMO_DATASET_ID,
            immunizations: [
              { id: `imm-${childId}-bcg`, vaccineId: 'bcg', vaccineName: 'BCG', dose: 'Birth', targetAge: 'Birth', dueDate: deliveryDate, status: 'GIVEN', dateAdministered: deliveryDate, facility: 'MTRH' },
              { id: `imm-${childId}-opv0`, vaccineId: 'opv', vaccineName: 'OPV 0', dose: 'Birth', targetAge: 'Birth', dueDate: deliveryDate, status: 'GIVEN', dateAdministered: deliveryDate, facility: 'MTRH' },
              { id: `imm-${childId}-penta1`, vaccineId: 'penta', vaccineName: 'Pentavalent 1', dose: 'Dose 1', targetAge: '6 weeks', dueDate: weeksFromNow(5), status: 'SCHEDULED' },
            ],
            newbornRecord: {
              id: childId,
              childId,
              birthWeightKg: 3.4,
              birthLengthCm: 50,
              apgarScore: '9/10',
              deliveryType: 'SVD',
              notes: 'Cried vigorously at birth, skin-to-skin contact immediate, early breastfeeding latch successful.',
              createdAt: deliveryDate,
            },
            congenitalExam: {
              id: childId,
              childId,
              examWindow: 'within48h',
              date: daysAgo(3),
              headSize: 'normal',
              mouthGums: 'normal',
              ears: 'normal',
              armsLegs: 'normal',
              spineNeckBack: 'normal',
              bodyMovement: 'normal',
              abdominalWall: 'normal',
              genitalia: 'normal',
              anus: 'perforate',
              hasAbnormality: false,
              notes: 'Complete MOH congenital assessment normal. No birth injuries or defects detected.',
              createdAt: daysAgo(3),
            },
            postnatalEncounters: [
              {
                id: `pnc-${childId}-48h`,
                childId,
                visit: '48h',
                date: daysAgo(2),
                motherFindings: 'BP 115/72, pulse 76, fundus well contracted at umbilicus, normal lochia rubra, no perineal tear, lactation initiated.',
                babyFindings: 'Weight 3.35kg, warm, active suckling, cord stump clean and dry, no neonatal jaundice, pass meconium and urine.',
                createdAt: daysAgo(2),
              },
            ],
            eyeCareAssessment: {
              id: childId,
              childId,
              ageStage: 'birth',
              date: daysAgo(3),
              teoGivenAtBirth: true,
              pupil: 'black',
              sightFollowing: 'present',
              squint: 'absent',
              isUrgentWhitePupil: false,
              hasAbnormality: false,
              notes: 'Prophylactic 1% Tetracycline Eye Ointment administered at delivery; normal red reflex examined.',
              createdAt: daysAgo(3),
            },
          },
        ],
        reminders: [
          {
            id: `rem-${motherUid}-pnc2`,
            userId: motherUid,
            title: 'PNC Contact 2 (1-2 Weeks Postnatal Clinical Review)',
            description: 'Maternal recovery check (lochia, involution, blood pressure) and newborn cord & feeding assessment at MTRH.',
            dueDate: daysFromNow(6),
            category: 'pnc',
            completed: false,
            sharedWithPartner: true,
            childId,
            demoDataset: DEMO_DATASET_ID,
          },
          {
            id: `rem-${motherUid}-penta1`,
            userId: motherUid,
            title: '6-Week Immunization (Penta 1, PCV 1, Rota 1, OPV 1)',
            description: 'First KEPI routine infant immunizations at MTRH MCH clinic.',
            dueDate: weeksFromNow(5),
            category: 'immunization',
            completed: false,
            sharedWithPartner: true,
            childId,
            demoDataset: DEMO_DATASET_ID,
          },
        ],
        partnerRelationship: partnerUid ? {
          id: `${motherUid}_${partnerUid}`,
          motherId: motherUid,
          motherName: 'Brenda Imani',
          partnerId: partnerUid,
          partnerName: 'Brian Imani',
          code: 'MH-BREND1',
          connectionCode: 'MH-BREND1',
          status: 'active',
          scope: 'Logistics & Support Only — No Clinical Records Access',
          sharingScopes: {
            appointments: true,
            birthPlan: true,
            emergencyContacts: true,
            moodSignal: true,
          },
          createdAt: weeksAgo(8),
          connectedAt: weeksAgo(7),
        } : undefined,
        partnerShare: {
          motherId: motherUid,
          coarseMood: 'ok',
          coarseEnergy: 'low',
          updatedAt: daysAgo(1),
          demoDataset: DEMO_DATASET_ID,
        },
      };
    },
  },

  // =========================================================================
  // 6. Diana Zawadi (Kiambu) - pregnant + toddler/multiple dependents
  // Support: none
  // Primary facility: intentionally none (optional)
  // =========================================================================
  {
    key: 'diana-zawadi',
    email: 'diana.zawadi@momhaven-demo.co.ke',
    name: 'Diana Zawadi',
    county: 'Kiambu',
    support: 'none',
    primaryHospitalFacilityId: undefined,
    primaryHospitalName: undefined,
    scenarioDescription: 'pregnant + toddler/multiple dependents',
    lifecycleStage: 'pregnancy',
    buildData: (motherUid) => {
      const pregId = `preg-${motherUid}`;
      const lmpDate = weeksAgo(22); // ~22 weeks gestation (2nd trimester)
      const eddDate = addDays(lmpDate, 280);
      const child1Id = `child-${motherUid}-1`;
      const child2Id = `child-${motherUid}-2`;

      return {
        user: {
          role: 'MOTHER',
          displayName: 'Diana Zawadi',
          email: 'diana.zawadi@momhaven-demo.co.ke',
          demoDataset: DEMO_DATASET_ID,
        },
        profile: {
          userId: motherUid,
          county: 'Kiambu',
          demoDataset: DEMO_DATASET_ID,
        },
        healthContext: {
          userId: motherUid,
          lifecycleStage: 'pregnancy',
          county: 'Kiambu',
          preferredLanguage: 'en',
          interests: ['nutrition', 'exercise', 'parenting_multiple'],
          demoDataset: DEMO_DATASET_ID,
        },
        pregnancy: {
          id: pregId,
          motherId: motherUid,
          status: 'active',
          lmp: lmpDate,
          edd: eddDate,
          gestationalAgeWeeks: 22,
          gravida: 3,
          parity: 2,
          bloodGroup: 'A',
          rhesus: '+',
          demoDataset: DEMO_DATASET_ID,
        },
        children: [
          {
            id: child1Id,
            motherId: motherUid,
            name: 'Lucas Zawadi',
            dateOfBirth: monthsAgo(28), // 2.3-year-old toddler
            sex: 'male',
            birthWeightKg: 3.3,
            birthLengthCm: 50,
            headCircumferenceCm: 34.5,
            demoDataset: DEMO_DATASET_ID,
          },
          {
            id: child2Id,
            motherId: motherUid,
            name: 'Chloe Zawadi',
            dateOfBirth: monthsAgo(54), // 4.5-year-old child
            sex: 'female',
            birthWeightKg: 3.1,
            birthLengthCm: 49,
            headCircumferenceCm: 34.0,
            demoDataset: DEMO_DATASET_ID,
          },
        ],
        familyPlanning: {
          id: `fp-${motherUid}`,
          motherId: motherUid,
          methodChosen: 'Copper T IUCD',
          counselingDate: monthsAgo(30),
          dateStarted: monthsAgo(30),
          removalDate: weeksAgo(26),
          reasonForSwitch: 'Elective removal to conceive planned third child',
          notes: 'Successful IUCD usage for over 2 years prior to conception.',
          createdAt: monthsAgo(30),
          updatedAt: weeksAgo(26),
          demoDataset: DEMO_DATASET_ID,
        },
        antenatalProfile: {
          id: pregId,
          pregnancyId: pregId,
          motherId: motherUid,
          bloodGroup: 'A',
          rhesusFactor: '+',
          hivStatus: 'non-reactive',
          syphilisStatus: 'non-reactive',
          hepatitisBStatus: 'non-reactive',
          ultrasound1: {
            scanNumber: 1,
            windowLabel: 'Ultrasound #1 (20-week Anomaly Scan)',
            date: weeksAgo(2),
            gestationWeeks: 20,
            placentaLocation: 'Fundal / Anterior',
            fetalViability: true,
            findings: 'Normal fetal anatomy survey. No congenital anomalies detected. Fetal biometry concordant with 20w 2d.',
          },
          createdAt: weeksAgo(12),
          updatedAt: weeksAgo(2),
          demoDataset: DEMO_DATASET_ID,
        },
        reminders: [
          {
            id: `rem-${motherUid}-anc3`,
            userId: motherUid,
            title: 'ANC Contact 3 (26 Weeks Gestation Check)',
            description: 'Third antenatal visit, fundal growth check, blood pressure review, and IPTp dose.',
            dueDate: weeksFromNow(4),
            category: 'anc',
            completed: false,
            pregnancyId: pregId,
            demoDataset: DEMO_DATASET_ID,
          },
        ],
      };
    },
  },

  // =========================================================================
  // 7. Winnie Rehema (Nyeri) - pregnant + infant + overlapping ANC/immunization
  // Support: family
  // =========================================================================
  {
    key: 'winnie-rehema',
    email: 'winnie.rehema@momhaven-demo.co.ke',
    name: 'Winnie Rehema',
    county: 'Nyeri',
    support: 'family',
    primaryHospitalFacilityId: '13800',
    primaryHospitalName: 'Nyeri County Referral Hospital',
    scenarioDescription: 'pregnant + infant + overlapping ANC/immunization',
    lifecycleStage: 'pregnancy',
    emergencyContact: {
      name: 'Pauline Rehema',
      phone: '+254722000007',
      relationship: 'Sister',
    },
    buildData: (motherUid, _, clinicianUids) => {
      const pregId = `preg-${motherUid}`;
      const lmpDate = weeksAgo(14); // ~14 weeks pregnant
      const eddDate = addDays(lmpDate, 280);
      const infantId = `child-${motherUid}-1`;
      const infantDob = weeksAgo(11); // 11-week-old infant

      return {
        user: {
          role: 'MOTHER',
          displayName: 'Winnie Rehema',
          email: 'winnie.rehema@momhaven-demo.co.ke',
          demoDataset: DEMO_DATASET_ID,
        },
        profile: {
          userId: motherUid,
          county: 'Nyeri',
          primaryHospitalFacilityId: '13800',
          primaryHospitalName: 'Nyeri County Referral Hospital',
          emergencyContactName: 'Pauline Rehema',
          emergencyContactPhone: '+254722000007',
          emergencyContactRelationship: 'Sister',
          demoDataset: DEMO_DATASET_ID,
        },
        healthContext: {
          userId: motherUid,
          lifecycleStage: 'pregnancy',
          county: 'Nyeri',
          primaryHospitalFacilityId: '13800',
          primaryHospitalName: 'Nyeri County Referral Hospital',
          preferredLanguage: 'en',
          interests: ['lactation', 'nutrition', 'immunization'],
          demoDataset: DEMO_DATASET_ID,
        },
        pregnancy: {
          id: pregId,
          motherId: motherUid,
          status: 'active',
          lmp: lmpDate,
          edd: eddDate,
          gestationalAgeWeeks: 14,
          gravida: 2,
          parity: 1,
          bloodGroup: 'O',
          rhesus: '+',
          demoDataset: DEMO_DATASET_ID,
        },
        ancEncounters: [
          {
            id: `anc-${pregId}-1`,
            pregnancyId: pregId,
            date: weeksAgo(4),
            visitNumber: 1,
            gestationalAgeWeeks: 10,
            systolicBp: 114,
            diastolicBp: 70,
            weightKg: 59.0,
            hbLevelGdl: 12.4,
            ironFolicGiven: true,
            iptpGiven: false,
            summary: 'ANC Contact 1: Closely spaced pregnancy while nursing 7-week infant. Provided maternal nutrition counseling and started IFAS.',
          },
        ],
        children: [
          {
            id: infantId,
            motherId: motherUid,
            name: 'Baraka Rehema',
            dateOfBirth: infantDob,
            sex: 'male',
            birthWeightKg: 3.3,
            birthLengthCm: 49,
            headCircumferenceCm: 34,
            deliveryFacility: 'Nyeri County Referral Hospital',
            deliveryType: 'SVD',
            demoDataset: DEMO_DATASET_ID,
            immunizations: [
              { id: `imm-${infantId}-bcg`, vaccineId: 'bcg', vaccineName: 'BCG', dose: 'Birth', targetAge: 'Birth', dueDate: infantDob, status: 'GIVEN', dateAdministered: infantDob },
              { id: `imm-${infantId}-opv0`, vaccineId: 'opv', vaccineName: 'OPV 0', dose: 'Birth', targetAge: 'Birth', dueDate: infantDob, status: 'GIVEN', dateAdministered: infantDob },
              { id: `imm-${infantId}-penta1`, vaccineId: 'penta', vaccineName: 'Pentavalent 1', dose: 'Dose 1', targetAge: '6 weeks', dueDate: addDays(infantDob, 42), status: 'GIVEN', dateAdministered: addDays(infantDob, 42) },
              { id: `imm-${infantId}-pcv1`, vaccineId: 'pcv', vaccineName: 'PCV 1', dose: 'Dose 1', targetAge: '6 weeks', dueDate: addDays(infantDob, 42), status: 'GIVEN', dateAdministered: addDays(infantDob, 42) },
              { id: `imm-${infantId}-rota1`, vaccineId: 'rota', vaccineName: 'Rotavirus 1', dose: 'Dose 1', targetAge: '6 weeks', dueDate: addDays(infantDob, 42), status: 'GIVEN', dateAdministered: addDays(infantDob, 42) },
              { id: `imm-${infantId}-penta2`, vaccineId: 'penta', vaccineName: 'Pentavalent 2', dose: 'Dose 2', targetAge: '10 weeks', dueDate: addDays(infantDob, 70), status: 'GIVEN', dateAdministered: addDays(infantDob, 70) },
              { id: `imm-${infantId}-pcv2`, vaccineId: 'pcv', vaccineName: 'PCV 2', dose: 'Dose 2', targetAge: '10 weeks', dueDate: addDays(infantDob, 70), status: 'GIVEN', dateAdministered: addDays(infantDob, 70) },
              { id: `imm-${infantId}-rota2`, vaccineId: 'rota', vaccineName: 'Rotavirus 2', dose: 'Dose 2', targetAge: '10 weeks', dueDate: addDays(infantDob, 70), status: 'GIVEN', dateAdministered: addDays(infantDob, 70) },
              { id: `imm-${infantId}-penta3`, vaccineId: 'penta', vaccineName: 'Pentavalent 3', dose: 'Dose 3', targetAge: '14 weeks', dueDate: weeksFromNow(3), status: 'SCHEDULED' },
            ],
            aefiReports: [
              {
                id: `aefi-${infantId}-1`,
                childId: infantId,
                vaccineOrAntigen: 'Pentavalent 1 + PCV 1',
                date: weeksAgo(5),
                severity: 'mild',
                adverseEventDescription: 'Low-grade fever (38.1 C) and mild localized thigh tenderness 6 hours post-immunization.',
                reportedToFacility: true,
                facilityName: 'Nyeri County Referral Hospital',
                actionTaken: 'Advised paracetamol syrup and cool compress; symptom resolved within 24 hours without complications.',
                createdAt: weeksAgo(5),
              },
            ],
          },
        ],
        clinicianPrivateNotes: [
          {
            id: `note-${motherUid}-1`,
            motherId: motherUid,
            clinicianId: clinicianUids?.['dr.faith.amani@momhaven-demo.co.ke'] || Object.values(clinicianUids || {})[0] || 'clinician-dr-faith',
            text: 'Patient has closely spaced pregnancy with an 11-week-old nursing infant. Discussed high maternal caloric and iron demands, continuous breastfeeding safety, and close fetal growth monitoring.',
            createdAt: weeksAgo(4),
          },
        ],
        reminders: [
          {
            id: `rem-${motherUid}-anc2`,
            userId: motherUid,
            title: 'ANC Contact 2 (20 Weeks Anomaly Scan & Routine Review)',
            description: 'Mid-pregnancy evaluation and ultrasound scan at Nyeri County Referral Hospital.',
            dueDate: weeksFromNow(6),
            category: 'anc',
            completed: false,
            pregnancyId: pregId,
            demoDataset: DEMO_DATASET_ID,
          },
          {
            id: `rem-${motherUid}-infant-penta3`,
            userId: motherUid,
            title: 'Infant 14-Week Immunization (Penta 3, PCV 3, OPV 3, IPV)',
            description: 'Baraka due for 14-week routine immunization doses at Nyeri MCH clinic.',
            dueDate: weeksFromNow(3),
            category: 'immunization',
            completed: false,
            childId: infantId,
            demoDataset: DEMO_DATASET_ID,
          },
        ],
      };
    },
  },

  // =========================================================================
  // 8. Sharon Nuru (Kakamega) - preconception + no dependents
  // Support: none
  // Primary facility: intentionally none (optional)
  // =========================================================================
  {
    key: 'sharon-nuru',
    email: 'sharon.nuru@momhaven-demo.co.ke',
    name: 'Sharon Nuru',
    county: 'Kakamega',
    support: 'none',
    primaryHospitalFacilityId: undefined,
    primaryHospitalName: undefined,
    scenarioDescription: 'preconception + no dependents',
    lifecycleStage: 'planning',
    buildData: (motherUid) => {
      return {
        user: {
          role: 'MOTHER',
          displayName: 'Sharon Nuru',
          email: 'sharon.nuru@momhaven-demo.co.ke',
          demoDataset: DEMO_DATASET_ID,
        },
        profile: {
          userId: motherUid,
          county: 'Kakamega',
          demoDataset: DEMO_DATASET_ID,
        },
        healthContext: {
          userId: motherUid,
          lifecycleStage: 'planning',
          county: 'Kakamega',
          preferredLanguage: 'en',
          interests: ['preconception', 'nutrition', 'wellness'],
          demoDataset: DEMO_DATASET_ID,
        },
        familyPlanning: {
          id: `fp-${motherUid}`,
          motherId: motherUid,
          methodChosen: 'Combined Oral Contraceptives (COCs)',
          counselingDate: monthsAgo(4),
          dateStarted: monthsAgo(4),
          nextAppointmentDate: weeksFromNow(8),
          notes: 'Discussed preconception wellness, periconceptional folic acid supplementation (400 mcg daily), and planning for future pregnancy.',
          createdAt: monthsAgo(4),
          updatedAt: monthsAgo(4),
          demoDataset: DEMO_DATASET_ID,
        },
        reminders: [
          {
            id: `rem-${motherUid}-fp-refill`,
            userId: motherUid,
            title: 'Preconception Health & Folic Acid Follow-up',
            description: 'Routine wellness check and periconceptional nutrition review.',
            dueDate: weeksFromNow(4),
            category: 'custom',
            completed: false,
            demoDataset: DEMO_DATASET_ID,
          },
        ],
      };
    },
  },

  // =========================================================================
  // 9. Christine Amani (Kilifi) - preconception + historical admission/check-in
  // Support: partner
  // Primary facility: intentionally none (optional)
  // =========================================================================
  {
    key: 'christine-amani',
    email: 'christine.amani@momhaven-demo.co.ke',
    name: 'Christine Amani',
    county: 'Kilifi',
    support: 'partner',
    primaryHospitalFacilityId: undefined,
    primaryHospitalName: undefined,
    scenarioDescription: 'preconception + historical admission/check-in',
    lifecycleStage: 'planning',
    buildData: (motherUid, partnerUid) => {
      return {
        user: {
          role: 'MOTHER',
          displayName: 'Christine Amani',
          email: 'christine.amani@momhaven-demo.co.ke',
          demoDataset: DEMO_DATASET_ID,
        },
        profile: {
          userId: motherUid,
          county: 'Kilifi',
          emergencyContactName: 'Dennis Amani',
          emergencyContactPhone: '+254712000009',
          emergencyContactRelationship: 'Partner',
          demoDataset: DEMO_DATASET_ID,
        },
        healthContext: {
          userId: motherUid,
          lifecycleStage: 'planning',
          county: 'Kilifi',
          preferredLanguage: 'sw',
          interests: ['preconception', 'nutrition', 'partner_support'],
          demoDataset: DEMO_DATASET_ID,
        },
        hospitalAdmissions: [
          {
            id: `adm-${motherUid}-1`,
            motherId: motherUid,
            personType: 'mother',
            hospitalName: 'Kilifi County Hospital',
            admissionNumber: 'KCH-ADM-2025-0891',
            admissionDate: monthsAgo(7),
            dischargeDate: addDays(monthsAgo(7), 3),
            dischargeDiagnosis: 'Acute uncomplicated Plasmodium falciparum malaria with dehydration',
            outcome: 'Discharged well',
            notes: 'Completed full IV artesunate followed by oral AL. Electrolytes normalized, full recovery at discharge.',
            createdAt: monthsAgo(7),
            demoDataset: DEMO_DATASET_ID,
          },
        ],
        specialClinicalAttendances: [
          {
            id: `att-${motherUid}-1`,
            motherId: motherUid,
            personType: 'mother',
            hospitalName: 'Kilifi County Hospital',
            clinicName: 'Outpatient Medical Follow-up Clinic',
            date: monthsAgo(6),
            reasonForAttendance: 'Post-admission malaria review and baseline hematology screen',
            dischargeDiagnosis: 'Completely resolved malaria, Hb 12.6 g/dL (normal)',
            drugsGiven: 'Oral Hematinics (iron + folic acid)',
            notes: 'General physical examination unremarkable. Discharged from follow-up in excellent health.',
            createdAt: monthsAgo(6),
            demoDataset: DEMO_DATASET_ID,
          },
        ],
        dailyHealthLogs: [
          {
            id: `log-${motherUid}-1`,
            userId: motherUid,
            date: daysAgo(3),
            type: 'wellness',
            values: {
              hydrationGlasses: 8,
              sleepHours: 8.5,
              energyLevel: 'energetic',
              notes: 'Maintaining daily folic acid supplement and hydration.',
            },
            demoDataset: DEMO_DATASET_ID,
          },
        ],
        partnerRelationship: partnerUid ? {
          id: `${motherUid}_${partnerUid}`,
          motherId: motherUid,
          motherName: 'Christine Amani',
          partnerId: partnerUid,
          partnerName: 'Dennis Amani',
          code: 'MH-CHRIST1',
          connectionCode: 'MH-CHRIST1',
          status: 'active',
          scope: 'Logistics & Support Only — No Clinical Records Access',
          sharingScopes: {
            appointments: true,
            emergencyContacts: true,
            moodSignal: true,
          },
          createdAt: weeksAgo(12),
          connectedAt: weeksAgo(11),
        } : undefined,
        partnerShare: {
          motherId: motherUid,
          coarseMood: 'good',
          coarseEnergy: 'normal',
          updatedAt: daysAgo(2),
          demoDataset: DEMO_DATASET_ID,
        },
      };
    },
  },

  // =========================================================================
  // 10. Esther Furaha (Trans Nzoia) - preconception + minimal/no dependents
  // Support: none
  // Primary facility: intentionally none (optional)
  // =========================================================================
  {
    key: 'esther-furaha',
    email: 'esther.furaha@momhaven-demo.co.ke',
    name: 'Esther Furaha',
    county: 'Trans Nzoia',
    support: 'none',
    primaryHospitalFacilityId: undefined,
    primaryHospitalName: undefined,
    scenarioDescription: 'preconception + minimal/no dependents',
    lifecycleStage: 'exploring',
    buildData: (motherUid) => {
      return {
        user: {
          role: 'MOTHER',
          displayName: 'Esther Furaha',
          email: 'esther.furaha@momhaven-demo.co.ke',
          demoDataset: DEMO_DATASET_ID,
        },
        profile: {
          userId: motherUid,
          county: 'Trans Nzoia',
          demoDataset: DEMO_DATASET_ID,
        },
        healthContext: {
          userId: motherUid,
          lifecycleStage: 'exploring',
          county: 'Trans Nzoia',
          preferredLanguage: 'en',
          interests: ['nutrition', 'wellness', 'reproductive_health'],
          demoDataset: DEMO_DATASET_ID,
        },
        dailyHealthLogs: [
          {
            id: `log-${motherUid}-1`,
            userId: motherUid,
            date: daysAgo(1),
            type: 'mood',
            values: {
              mood: 'calm',
              notes: 'Feeling rested and balanced.',
            },
            demoDataset: DEMO_DATASET_ID,
          },
          {
            id: `log-${motherUid}-2`,
            userId: motherUid,
            date: daysAgo(4),
            type: 'symptoms',
            values: {
              symptoms: ['Mild fatigue after work'],
              hasDangerSigns: false,
              notes: 'Rest and hydration helped.',
            },
            demoDataset: DEMO_DATASET_ID,
          },
          {
            id: `log-${motherUid}-3`,
            userId: motherUid,
            date: daysAgo(7),
            type: 'wellness',
            values: {
              waterGlasses: 8,
              sleepHours: 8,
              exerciseMinutes: 30,
            },
            demoDataset: DEMO_DATASET_ID,
          },
        ],
      };
    },
  },
];
