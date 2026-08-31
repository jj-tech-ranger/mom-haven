/**
 * Kenya MOH 216 Maternal & Child Health (MCH) Clinical Schedule & Constants
 * Compliant with Kenya Ministry of Health 8-Contact ANC Model
 */

export interface MohAncContact {
  contactNumber: number;
  recommendedWeek: number;
  windowLabel: string;
  title: string;
  keyActions: string[];
  medications: string[];
  dangerSignsToCheck: string[];
}

export const MOH_ANC_SCHEDULE: MohAncContact[] = [
  {
    contactNumber: 1,
    recommendedWeek: 12,
    windowLabel: 'Up to 12 Weeks',
    title: 'Booking & Comprehensive Assessment',
    keyActions: [
      'Confirm pregnancy & calculate EDD by LMP/Ultrasound',
      'Baseline Maternal Vitals (BP, Weight, Height)',
      'Laboratory Profiling: Blood Group, Rhesus, Hb, Urinalysis',
      'Screening for HIV, Syphilis & Hepatitis B',
    ],
    medications: ['Iron & Folic Acid (IFAS) 30-day supply', 'Tetanus Diphtheria (TD1)'],
    dangerSignsToCheck: ['Severe lower abdominal pain', 'Vaginal bleeding', 'Severe vomiting'],
  },
  {
    contactNumber: 2,
    recommendedWeek: 20,
    windowLabel: '20 Weeks',
    title: 'Anomaly Scan & Maternal Wellbeing',
    keyActions: [
      'Obstetric Ultrasound Anomaly Screening',
      'Fundal height measurement & Fetal Heart Rate check',
      'Blood pressure screening for early pre-eclampsia',
      'Maternal nutrition and dietary counseling',
    ],
    medications: ['IFAS refill', 'Tetanus Diphtheria (TD2 if 4 weeks post TD1)'],
    dangerSignsToCheck: ['Severe headache / visual disturbances', 'Vaginal discharge or bleeding'],
  },
  {
    contactNumber: 3,
    recommendedWeek: 26,
    windowLabel: '26 Weeks',
    title: 'Malaria Prevention & Growth Tracking',
    keyActions: [
      'IPTp-SP Dose 1 (Malaria chemoprevention in endemic zones)',
      'Fundal height and fetal activity tracking',
      'Urinalysis for proteinuria and glucose',
      'Preliminary birth preparedness discussion',
    ],
    medications: ['IPTp-SP Dose 1', 'IFAS refill', 'Deworming (Mebendazole single dose)'],
    dangerSignsToCheck: ['Chills / high fever', 'Swelling of face, hands, or ankles'],
  },
  {
    contactNumber: 4,
    recommendedWeek: 30,
    windowLabel: '30 Weeks',
    title: 'Third Trimester Surveillance',
    keyActions: [
      'IPTp-SP Dose 2',
      'Repeat Hemoglobin (Hb) test for anemia screening',
      'Blood pressure check & Fetal heart rate auscultation',
      'Assessment of fetal movements / kick counts',
    ],
    medications: ['IPTp-SP Dose 2', 'IFAS refill'],
    dangerSignsToCheck: ['Reduced or absent fetal movements', 'Persistent severe epigastric pain'],
  },
  {
    contactNumber: 5,
    recommendedWeek: 34,
    windowLabel: '34 Weeks',
    title: 'Fetal Presentation & Birth Logistics',
    keyActions: [
      'Fetal presentation check (cephalic vs breech)',
      'IPTp-SP Dose 3',
      'Comprehensive Birth Plan review (transport, facility, companion)',
      'Hospital bag readiness confirmation',
    ],
    medications: ['IPTp-SP Dose 3', 'IFAS refill'],
    dangerSignsToCheck: ['Sudden gush of fluid (pre-labor rupture of membranes)', 'Vaginal bleeding'],
  },
  {
    contactNumber: 6,
    recommendedWeek: 36,
    windowLabel: '36 Weeks',
    title: 'Final Birth Preparedness & Danger Signs',
    keyActions: [
      'Delivery facility confirmation (KMHFL accredited)',
      'Emergency transport and financial plan audit',
      'Screening for hypertensive disorders of pregnancy',
      'Infant feeding intention counseling (exclusive breastfeeding)',
    ],
    medications: ['IFAS refill (supply through delivery)'],
    dangerSignsToCheck: ['Contractions before 37 weeks', 'Severe swelling', 'Difficulty breathing'],
  },
  {
    contactNumber: 7,
    recommendedWeek: 38,
    windowLabel: '38 Weeks',
    title: 'Term Surveillance & Labor Signs',
    keyActions: [
      'True vs False labor signs education',
      'Fetal heart rate & maternal vitals monitoring',
      'Confirm 24/7 emergency dispatch and ambulance speed dial (1199)',
      'Partner & birth companion role briefing',
    ],
    medications: ['IFAS refill'],
    dangerSignsToCheck: ['Water breaking with foul odor or greenish tint', 'Continuous severe pain'],
  },
  {
    contactNumber: 8,
    recommendedWeek: 40,
    windowLabel: '40 Weeks (Due Date)',
    title: 'Term Delivery & Post-Date Plan',
    keyActions: [
      'Cervical assessment & fetal wellbeing evaluation',
      'Formulate post-term management plan if not delivered by 41 weeks',
      'Hospital admission readiness',
    ],
    medications: ['Routine IFAS'],
    dangerSignsToCheck: ['Bleeding', 'Absent fetal movement', 'Active labor contractions'],
  },
];

export interface TimelineMilestone {
  id: string;
  week: number;
  title: string;
  description: string;
  category: 'clinical' | 'milestone' | 'logistics';
  isKeyAnc?: boolean;
  ancContactNumber?: number;
}

export const TIMELINE_MILESTONES: TimelineMilestone[] = [
  {
    id: 'm1',
    week: 6,
    title: 'Confirmed pregnancy',
    description: 'Positive pregnancy test & early prenatal journey registration.',
    category: 'milestone',
  },
  {
    id: 'm2',
    week: 12,
    title: '1st trimester complete & ANC Contact 1',
    description: 'Booking visit, baseline laboratory profile & ultrasound dating.',
    category: 'clinical',
    isKeyAnc: true,
    ancContactNumber: 1,
  },
  {
    id: 'm3',
    week: 20,
    title: 'ANC Contact 2 · Anomaly scan',
    description: 'Mid-pregnancy anatomy ultrasound scan & fetal heart check.',
    category: 'clinical',
    isKeyAnc: true,
    ancContactNumber: 2,
  },
  {
    id: 'm4',
    week: 24,
    title: 'Baby can hear voice · ANC Contact 3',
    description: 'Baby listens to mama’s voice. IPTp-SP dose 1 & maternal BP check.',
    category: 'clinical',
    isKeyAnc: true,
    ancContactNumber: 3,
  },
  {
    id: 'm5',
    week: 30,
    title: 'ANC Contact 4 · Hb Recheck',
    description: 'Third-trimester anemia screening & kick-count tracking.',
    category: 'clinical',
    isKeyAnc: true,
    ancContactNumber: 4,
  },
  {
    id: 'm6',
    week: 34,
    title: 'ANC Contact 5 & 6 · Fetal Presentation',
    description: 'Position check (head-down presentation) & hospital bag check.',
    category: 'clinical',
    isKeyAnc: true,
    ancContactNumber: 5,
  },
  {
    id: 'm7',
    week: 36,
    title: 'Birth plan finalized',
    description: 'Transport, identified blood donor, and companion ready.',
    category: 'logistics',
  },
  {
    id: 'm8',
    week: 40,
    title: 'Childbirth & Delivery Day',
    description: 'Safe facility birth, immediate skin-to-skin & newborn BCG/OPV0.',
    category: 'milestone',
  },
];
