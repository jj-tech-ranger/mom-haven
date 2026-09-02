// src/utils/kepiSchedule.ts
// Master KEPI (Kenya Expanded Programme on Immunization) Schedule Math Engine

export interface VaccineDose {
  code: string;
  name: string;
  targetAgeWeeks: number;
  minIntervalWeeks?: number;
  diseaseTarget: string;
  ageBracketLabel: string;
  routeOfAdministration?: string;
  site?: string;
}

export const KEPI_VACCINES: VaccineDose[] = [
  { 
    code: 'BCG', 
    name: 'BCG (Tuberculosis)', 
    targetAgeWeeks: 0, 
    diseaseTarget: 'Tuberculosis (TB)', 
    ageBracketLabel: 'At Birth',
    routeOfAdministration: 'Intradermal (0.05ml)',
    site: 'Right upper arm'
  },
  { 
    code: 'OPV_0', 
    name: 'Oral Polio Vaccine 0 (Birth dose)', 
    targetAgeWeeks: 0, 
    diseaseTarget: 'Poliomyelitis', 
    ageBracketLabel: 'At Birth',
    routeOfAdministration: 'Oral (2 drops)',
    site: 'Mouth'
  },
  { 
    code: 'OPV_1', 
    name: 'Oral Polio Vaccine 1', 
    targetAgeWeeks: 6, 
    minIntervalWeeks: 4, 
    diseaseTarget: 'Poliomyelitis', 
    ageBracketLabel: '6 Weeks',
    routeOfAdministration: 'Oral (2 drops)'
  },
  { 
    code: 'PENTA_1', 
    name: 'Pentavalent 1 (DPT-HepB-Hib)', 
    targetAgeWeeks: 6, 
    diseaseTarget: 'Diphtheria, Pertussis, Tetanus, Hepatitis B, Hib', 
    ageBracketLabel: '6 Weeks',
    routeOfAdministration: 'Intramuscular (0.5ml)',
    site: 'Left outer mid-thigh'
  },
  { 
    code: 'PCV10_1', 
    name: 'Pneumococcal Conjugate 1 (PCV10)', 
    targetAgeWeeks: 6, 
    diseaseTarget: 'Pneumonia & Meningitis', 
    ageBracketLabel: '6 Weeks',
    routeOfAdministration: 'Intramuscular (0.5ml)',
    site: 'Right outer mid-thigh'
  },
  { 
    code: 'ROTA_1', 
    name: 'Rotavirus Vaccine 1', 
    targetAgeWeeks: 6, 
    diseaseTarget: 'Rotavirus Diarrheal Disease', 
    ageBracketLabel: '6 Weeks',
    routeOfAdministration: 'Oral (1.5ml)'
  },
  { 
    code: 'OPV_2', 
    name: 'Oral Polio Vaccine 2', 
    targetAgeWeeks: 10, 
    minIntervalWeeks: 4, 
    diseaseTarget: 'Poliomyelitis', 
    ageBracketLabel: '10 Weeks',
    routeOfAdministration: 'Oral (2 drops)'
  },
  { 
    code: 'PENTA_2', 
    name: 'Pentavalent 2', 
    targetAgeWeeks: 10, 
    minIntervalWeeks: 4, 
    diseaseTarget: 'Diphtheria, Pertussis, Tetanus, HepB, Hib', 
    ageBracketLabel: '10 Weeks',
    routeOfAdministration: 'Intramuscular (0.5ml)',
    site: 'Left outer mid-thigh'
  },
  { 
    code: 'PCV10_2', 
    name: 'Pneumococcal Conjugate 2 (PCV10)', 
    targetAgeWeeks: 10, 
    minIntervalWeeks: 4, 
    diseaseTarget: 'Pneumonia & Meningitis', 
    ageBracketLabel: '10 Weeks',
    routeOfAdministration: 'Intramuscular (0.5ml)',
    site: 'Right outer mid-thigh'
  },
  { 
    code: 'ROTA_2', 
    name: 'Rotavirus Vaccine 2', 
    targetAgeWeeks: 10, 
    minIntervalWeeks: 4, 
    diseaseTarget: 'Rotavirus Diarrheal Disease', 
    ageBracketLabel: '10 Weeks',
    routeOfAdministration: 'Oral (1.5ml)'
  },
  { 
    code: 'OPV_3', 
    name: 'Oral Polio Vaccine 3', 
    targetAgeWeeks: 14, 
    minIntervalWeeks: 4, 
    diseaseTarget: 'Poliomyelitis', 
    ageBracketLabel: '14 Weeks',
    routeOfAdministration: 'Oral (2 drops)'
  },
  { 
    code: 'PENTA_3', 
    name: 'Pentavalent 3', 
    targetAgeWeeks: 14, 
    minIntervalWeeks: 4, 
    diseaseTarget: 'Diphtheria, Pertussis, Tetanus, HepB, Hib', 
    ageBracketLabel: '14 Weeks',
    routeOfAdministration: 'Intramuscular (0.5ml)',
    site: 'Left outer mid-thigh'
  },
  { 
    code: 'PCV10_3', 
    name: 'Pneumococcal Conjugate 3 (PCV10)', 
    targetAgeWeeks: 14, 
    minIntervalWeeks: 4, 
    diseaseTarget: 'Pneumonia & Meningitis', 
    ageBracketLabel: '14 Weeks',
    routeOfAdministration: 'Intramuscular (0.5ml)',
    site: 'Right outer mid-thigh'
  },
  { 
    code: 'IPV', 
    name: 'Inactivated Polio Vaccine (IPV)', 
    targetAgeWeeks: 14, 
    diseaseTarget: 'Polio (Enhanced Protection)', 
    ageBracketLabel: '14 Weeks',
    routeOfAdministration: 'Intramuscular (0.5ml)',
    site: 'Left outer mid-thigh'
  },
  { 
    code: 'VIT_A_1', 
    name: 'Vitamin A (Blue Capsule - 100,000 IU)', 
    targetAgeWeeks: 26, // 6 months
    diseaseTarget: 'Immunity & Eye Health', 
    ageBracketLabel: '6 Months',
    routeOfAdministration: 'Oral Capsule'
  },
  { 
    code: 'MR_1', 
    name: 'Measles-Rubella 1 (MR 1)', 
    targetAgeWeeks: 39, // 9 months
    diseaseTarget: 'Measles & Rubella', 
    ageBracketLabel: '9 Months',
    routeOfAdministration: 'Subcutaneous (0.5ml)',
    site: 'Right upper arm'
  },
  { 
    code: 'YELLOW_FEVER', 
    name: 'Yellow Fever (Endemic areas)', 
    targetAgeWeeks: 39, 
    diseaseTarget: 'Yellow Fever', 
    ageBracketLabel: '9 Months',
    routeOfAdministration: 'Subcutaneous (0.5ml)'
  },
  { 
    code: 'VIT_A_2', 
    name: 'Vitamin A (Red Capsule - 200,000 IU)', 
    targetAgeWeeks: 52, // 12 months
    diseaseTarget: 'Immunity & Eye Health', 
    ageBracketLabel: '12 Months',
    routeOfAdministration: 'Oral Capsule'
  },
  { 
    code: 'MR_2', 
    name: 'Measles-Rubella 2 (MR 2)', 
    targetAgeWeeks: 78, // 18 months
    minIntervalWeeks: 26, 
    diseaseTarget: 'Measles & Rubella', 
    ageBracketLabel: '18 Months',
    routeOfAdministration: 'Subcutaneous (0.5ml)',
    site: 'Left upper arm'
  },
];

export interface DoseCalculatedDates {
  minimumEligibleDate: string;
  scheduledDate: string;
  recommendedActionDate: string;
  status: 'GIVEN_VERIFIED' | 'GIVEN_REPORTED' | 'DUE_SOON' | 'OVERDUE' | 'UPCOMING';
}

export function calculateDoseDates(dobString: string, vaccine: VaccineDose): {
  minimumEligibleDate: string;
  scheduledDate: string;
  recommendedActionDate: string;
} {
  const dob = new Date(dobString);
  const targetDate = new Date(dob.getTime() + vaccine.targetAgeWeeks * 7 * 24 * 60 * 60 * 1000);

  const minEligibleDate = new Date(targetDate);
  const scheduledDate = new Date(targetDate);
  const recommendedActionDate = new Date(targetDate);

  return {
    minimumEligibleDate: minEligibleDate.toISOString().split('T')[0],
    scheduledDate: scheduledDate.toISOString().split('T')[0],
    recommendedActionDate: recommendedActionDate.toISOString().split('T')[0],
  };
}

export function calculateCatchUpSchedule(dobString: string, lastAdministeredCode: string, lastAdministeredDate: string) {
  const lastDoseIndex = KEPI_VACCINES.findIndex(v => v.code === lastAdministeredCode);
  if (lastDoseIndex === -1 || lastDoseIndex >= KEPI_VACCINES.length - 1) {
    return null;
  }
  const nextDose = KEPI_VACCINES[lastDoseIndex + 1];
  const lastDate = new Date(lastAdministeredDate);
  const minInterval = nextDose.minIntervalWeeks || 4;
  const earliestCatchupDate = new Date(lastDate.getTime() + minInterval * 7 * 24 * 60 * 60 * 1000);

  return {
    nextDose,
    earliestCatchupDate: earliestCatchupDate.toISOString().split('T')[0],
    guidance: `Per Kenya Ministry of Health catch-up protocols, do NOT restart the series. Administer ${nextDose.name} at least ${minInterval} weeks after the last dose received.`
  };
}
