// src/utils/supplementSchedule.ts
// Comprehensive Vitamin A, Deworming, and Micronutrient Powder (MNP) Schedule Engine
// Per Kenya Ministry of Health Mother-Child Health Handbook (MOH 216) pp. 24–27

export interface SupplementDoseItem {
  code: string;
  category: 'VITAMIN_A' | 'DEWORMING' | 'MNP';
  name: string;
  targetAgeMonths: number;
  targetAgeWeeks: number;
  ageBracketLabel: string;
  dosage: string;
  route: string;
  description: string;
}

export const VITAMIN_A_SCHEDULE: SupplementDoseItem[] = [
  {
    code: 'VIT_A_6M',
    category: 'VITAMIN_A',
    name: 'Vitamin A Dose 1 (100,000 IU)',
    targetAgeMonths: 6,
    targetAgeWeeks: 26,
    ageBracketLabel: '6 Months',
    dosage: '100,000 IU (Blue Capsule)',
    route: 'Oral Capsule',
    description: 'First Vitamin A dose at 6 months to enhance gut immunity, cellular repair, and eye health.'
  },
  {
    code: 'VIT_A_12M',
    category: 'VITAMIN_A',
    name: 'Vitamin A Dose 2 (200,000 IU)',
    targetAgeMonths: 12,
    targetAgeWeeks: 52,
    ageBracketLabel: '12 Months (1 Year)',
    dosage: '200,000 IU (Red Capsule)',
    route: 'Oral Capsule',
    description: 'Second Vitamin A dose administered together with first deworming dose at 12 months.'
  },
  {
    code: 'VIT_A_18M',
    category: 'VITAMIN_A',
    name: 'Vitamin A Dose 3 (200,000 IU)',
    targetAgeMonths: 18,
    targetAgeWeeks: 78,
    ageBracketLabel: '18 Months',
    dosage: '200,000 IU (Red Capsule)',
    route: 'Oral Capsule',
    description: 'Third Vitamin A dose administered with Measles-Rubella 2 and Deworming dose 2.'
  },
  {
    code: 'VIT_A_24M',
    category: 'VITAMIN_A',
    name: 'Vitamin A Dose 4 (200,000 IU)',
    targetAgeMonths: 24,
    targetAgeWeeks: 104,
    ageBracketLabel: '24 Months (2 Years)',
    dosage: '200,000 IU (Red Capsule)',
    route: 'Oral Capsule',
    description: 'Biannual Vitamin A booster dose at 2 years of age.'
  },
  {
    code: 'VIT_A_30M',
    category: 'VITAMIN_A',
    name: 'Vitamin A Dose 5 (200,000 IU)',
    targetAgeMonths: 30,
    targetAgeWeeks: 130,
    ageBracketLabel: '30 Months (2.5 Years)',
    dosage: '200,000 IU (Red Capsule)',
    route: 'Oral Capsule',
    description: 'Biannual Vitamin A booster dose at 30 months.'
  },
  {
    code: 'VIT_A_36M',
    category: 'VITAMIN_A',
    name: 'Vitamin A Dose 6 (200,000 IU)',
    targetAgeMonths: 36,
    targetAgeWeeks: 156,
    ageBracketLabel: '36 Months (3 Years)',
    dosage: '200,000 IU (Red Capsule)',
    route: 'Oral Capsule',
    description: 'Biannual Vitamin A booster dose at 3 years.'
  },
  {
    code: 'VIT_A_42M',
    category: 'VITAMIN_A',
    name: 'Vitamin A Dose 7 (200,000 IU)',
    targetAgeMonths: 42,
    targetAgeWeeks: 182,
    ageBracketLabel: '42 Months (3.5 Years)',
    dosage: '200,000 IU (Red Capsule)',
    route: 'Oral Capsule',
    description: 'Biannual Vitamin A booster dose at 42 months.'
  },
  {
    code: 'VIT_A_48M',
    category: 'VITAMIN_A',
    name: 'Vitamin A Dose 8 (200,000 IU)',
    targetAgeMonths: 48,
    targetAgeWeeks: 208,
    ageBracketLabel: '48 Months (4 Years)',
    dosage: '200,000 IU (Red Capsule)',
    route: 'Oral Capsule',
    description: 'Biannual Vitamin A booster dose at 4 years.'
  },
  {
    code: 'VIT_A_54M',
    category: 'VITAMIN_A',
    name: 'Vitamin A Dose 9 (200,000 IU)',
    targetAgeMonths: 54,
    targetAgeWeeks: 234,
    ageBracketLabel: '54 Months (4.5 Years)',
    dosage: '200,000 IU (Red Capsule)',
    route: 'Oral Capsule',
    description: 'Biannual Vitamin A booster dose at 54 months.'
  },
  {
    code: 'VIT_A_59M',
    category: 'VITAMIN_A',
    name: 'Vitamin A Dose 10 (200,000 IU)',
    targetAgeMonths: 59,
    targetAgeWeeks: 256,
    ageBracketLabel: '59 Months (5 Years)',
    dosage: '200,000 IU (Red Capsule)',
    route: 'Oral Capsule',
    description: 'Final under-5 Vitamin A booster dose prior to primary school transition.'
  },
];

export const DEWORMING_SCHEDULE: SupplementDoseItem[] = [
  {
    code: 'DEWORM_12M',
    category: 'DEWORMING',
    name: 'Deworming Dose 1 (Albendazole 200mg)',
    targetAgeMonths: 12,
    targetAgeWeeks: 52,
    ageBracketLabel: '12 Months (1 Year)',
    dosage: 'Albendazole 200mg',
    route: 'Oral suspension or chewable tablet',
    description: 'First deworming dose at 12 months (Albendazole 200mg half-dose) to treat intestinal worms.'
  },
  {
    code: 'DEWORM_18M',
    category: 'DEWORMING',
    name: 'Deworming Dose 2 (Albendazole 400mg)',
    targetAgeMonths: 18,
    targetAgeWeeks: 78,
    ageBracketLabel: '18 Months',
    dosage: 'Albendazole 400mg',
    route: 'Oral chewable tablet',
    description: 'Second deworming dose at 18 months with full pediatric Albendazole 400mg dose.'
  },
  {
    code: 'DEWORM_24M',
    category: 'DEWORMING',
    name: 'Deworming Dose 3 (Albendazole 400mg)',
    targetAgeMonths: 24,
    targetAgeWeeks: 104,
    ageBracketLabel: '24 Months (2 Years)',
    dosage: 'Albendazole 400mg',
    route: 'Oral chewable tablet',
    description: 'Biannual deworming round at 2 years.'
  },
  {
    code: 'DEWORM_30M',
    category: 'DEWORMING',
    name: 'Deworming Dose 4 (Albendazole 400mg)',
    targetAgeMonths: 30,
    targetAgeWeeks: 130,
    ageBracketLabel: '30 Months (2.5 Years)',
    dosage: 'Albendazole 400mg',
    route: 'Oral chewable tablet',
    description: 'Biannual deworming round at 30 months.'
  },
  {
    code: 'DEWORM_36M',
    category: 'DEWORMING',
    name: 'Deworming Dose 5 (Albendazole 400mg)',
    targetAgeMonths: 36,
    targetAgeWeeks: 156,
    ageBracketLabel: '36 Months (3 Years)',
    dosage: 'Albendazole 400mg',
    route: 'Oral chewable tablet',
    description: 'Biannual deworming round at 3 years.'
  },
  {
    code: 'DEWORM_42M',
    category: 'DEWORMING',
    name: 'Deworming Dose 6 (Albendazole 400mg)',
    targetAgeMonths: 42,
    targetAgeWeeks: 182,
    ageBracketLabel: '42 Months (3.5 Years)',
    dosage: 'Albendazole 400mg',
    route: 'Oral chewable tablet',
    description: 'Biannual deworming round at 42 months.'
  },
  {
    code: 'DEWORM_48M',
    category: 'DEWORMING',
    name: 'Deworming Dose 7 (Albendazole 400mg)',
    targetAgeMonths: 48,
    targetAgeWeeks: 208,
    ageBracketLabel: '48 Months (4 Years)',
    dosage: 'Albendazole 400mg',
    route: 'Oral chewable tablet',
    description: 'Biannual deworming round at 4 years.'
  },
  {
    code: 'DEWORM_54M',
    category: 'DEWORMING',
    name: 'Deworming Dose 8 (Albendazole 400mg)',
    targetAgeMonths: 54,
    targetAgeWeeks: 234,
    ageBracketLabel: '54 Months (4.5 Years)',
    dosage: 'Albendazole 400mg',
    route: 'Oral chewable tablet',
    description: 'Biannual deworming round at 54 months.'
  },
  {
    code: 'DEWORM_59M',
    category: 'DEWORMING',
    name: 'Deworming Dose 9 (Albendazole 400mg)',
    targetAgeMonths: 59,
    targetAgeWeeks: 256,
    ageBracketLabel: '59 Months (5 Years)',
    dosage: 'Albendazole 400mg',
    route: 'Oral chewable tablet',
    description: 'Final preschool deworming round at 59 months.'
  },
];

// Generate 18 monthly issuances of Micronutrient Powder (MNP) from 6 to 23 months (10 sachets per issuance)
export const MNP_SCHEDULE: SupplementDoseItem[] = Array.from({ length: 18 }, (_, idx) => {
  const month = 6 + idx;
  return {
    code: `MNP_${month}M`,
    category: 'MNP',
    name: `Micronutrient Powder (MNP) Month ${month}`,
    targetAgeMonths: month,
    targetAgeWeeks: Math.round(month * 4.345),
    ageBracketLabel: `${month} Months`,
    dosage: '10 sachets / month',
    route: 'Mix 1 sachet daily with warm complementary soft food (not hot liquids)',
    description: `Kenya MOH MNP home fortification (15 essential vitamins & minerals) to prevent childhood anemia. Issuance #${idx + 1} of 18.`
  };
});

export function calculateSupplementDueDate(dobString: string, targetAgeMonths: number): string {
  const dob = new Date(dobString);
  const d = new Date(dob);
  d.setMonth(d.getMonth() + targetAgeMonths);
  return d.toISOString().split('T')[0];
}
