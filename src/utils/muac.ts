// src/utils/muac.ts
// Canonical 4-Band WHO / Kenya MOH Mid-Upper Arm Circumference (MUAC) Engine

export interface MuacClassification {
  code: 'RED' | 'YELLOW' | 'YELLOW_GREEN' | 'GREEN';
  key: 'SAM' | 'MAM' | 'AT_RISK' | 'NORMAL';
  label: string;
  category: string;
  hex: string;
  bg: string;
  text: string;
  border: string;
  min: number;
  max: number;
  clinicalAction: string;
  urgent: boolean;
}

export const MUAC_BANDS: Record<'SAM' | 'MAM' | 'AT_RISK' | 'NORMAL', MuacClassification> = {
  SAM: {
    key: 'SAM',
    code: 'RED',
    label: 'Severe Acute Malnutrition (SAM)',
    category: 'Severe Acute Malnutrition',
    hex: '#DC2626',
    bg: '#FEE2E2',
    text: '#991B1B',
    border: '#F87171',
    min: 0,
    max: 11.4,
    clinicalAction: 'Critical immediate referral to nearest Inpatient Therapeutic Care / Hospital. Check for bilateral pitting oedema and medical complications.',
    urgent: true,
  },
  MAM: {
    key: 'MAM',
    code: 'YELLOW',
    label: 'Moderate Acute Malnutrition (MAM)',
    category: 'Moderate Acute Malnutrition',
    hex: '#F59E0B',
    bg: '#FEF3C7',
    text: '#92400E',
    border: '#FCD34D',
    min: 11.5,
    max: 12.4,
    clinicalAction: 'Enroll in Supplementary Feeding Programme (SFP / Ready-to-Use Supplementary Food). Schedule 2-week growth monitoring.',
    urgent: false,
  },
  AT_RISK: {
    key: 'AT_RISK',
    code: 'YELLOW_GREEN',
    label: 'At Risk of Malnutrition',
    category: 'At Risk of Malnutrition',
    hex: '#84CC16',
    bg: '#ECFCCB',
    text: '#3F6212',
    border: '#BEF264',
    min: 12.5,
    max: 13.4,
    clinicalAction: 'Provide active Infant & Young Child Feeding (IYCF) counseling, check dietary diversity, and re-assess in 1 month.',
    urgent: false,
  },
  NORMAL: {
    key: 'NORMAL',
    code: 'GREEN',
    label: 'Normal Nutritional Status',
    category: 'Normal Nutritional Status',
    hex: '#10B981',
    bg: '#D1FAE5',
    text: '#065F46',
    border: '#6EE7B7',
    min: 13.5,
    max: 99.0,
    clinicalAction: 'Healthy nutritional status. Continue age-appropriate balanced family foods and routine growth monitoring.',
    urgent: false,
  },
};

export function classifyMUAC(cm: number | string): MuacClassification | null {
  const value = typeof cm === 'string' ? parseFloat(cm) : cm;
  if (isNaN(value) || value <= 0) return null;

  if (value < 11.5) return MUAC_BANDS.SAM;
  if (value <= 12.4) return MUAC_BANDS.MAM;
  if (value <= 13.4) return MUAC_BANDS.AT_RISK;
  return MUAC_BANDS.NORMAL;
}
