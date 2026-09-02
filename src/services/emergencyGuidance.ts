// src/services/emergencyGuidance.ts
// Offline-first Emergency Guidance Engine

export interface EmergencyFacility {
  id: string;
  name: string;
  phone: string;
  level: string;
  is24HourMaternity: boolean;
  source: 'NATIONAL_BASELINE' | 'COUNTY_DEFAULT' | 'USER_SAVED';
  location?: string;
}

// Hardcoded National Baseline — ALWAYS available unconditionally even with zero network
export const NATIONAL_BASELINE_CONTACTS: EmergencyFacility[] = [
  {
    id: 'base_redcross',
    name: 'Kenya Red Cross Emergency Ambulance',
    phone: '1199',
    level: 'National Ambulance Service',
    is24HourMaternity: true,
    source: 'NATIONAL_BASELINE',
    location: 'Toll-Free Nationwide (24/7 Dispatch)'
  },
  {
    id: 'base_police',
    name: 'National Police & Medical Emergency Dispatch',
    phone: '999',
    level: 'National Emergency Line',
    is24HourMaternity: true,
    source: 'NATIONAL_BASELINE',
    location: 'Nationwide (999 / 112)'
  },
  {
    id: 'base_childline',
    name: 'Childline Kenya (Child Protection & Crisis)',
    phone: '116',
    level: 'National Toll-Free Helpline',
    is24HourMaternity: true,
    source: 'NATIONAL_BASELINE',
    location: 'Toll-Free Nationwide'
  },
  {
    id: 'base_gbv',
    name: 'National Gender-Based Violence Helpline',
    phone: '1195',
    level: 'National Toll-Free Helpline',
    is24HourMaternity: true,
    source: 'NATIONAL_BASELINE',
    location: 'Toll-Free 24/7 Support'
  }
];

export const REGIONAL_REFERRAL_FACILITIES: EmergencyFacility[] = [
  {
    id: 'fac_knh',
    name: 'Kenyatta National Hospital (Maternity Wing)',
    phone: '+254202726300',
    level: 'Level 6 National Referral Hospital',
    is24HourMaternity: true,
    source: 'COUNTY_DEFAULT',
    location: 'Upper Hill, Nairobi'
  },
  {
    id: 'fac_pumwani',
    name: 'Pumwani Maternity Hospital',
    phone: '+254722880199',
    level: 'Specialized National Maternity Referral',
    is24HourMaternity: true,
    source: 'COUNTY_DEFAULT',
    location: 'Majengo / Eastleigh, Nairobi'
  },
  {
    id: 'fac_mtrh',
    name: 'Moi Teaching and Referral Hospital (MTRH)',
    phone: '+254532033471',
    level: 'Level 6 National Referral Hospital',
    is24HourMaternity: true,
    source: 'COUNTY_DEFAULT',
    location: 'Eldoret, Uasin Gishu'
  },
  {
    id: 'fac_coast_gen',
    name: 'Coast General Teaching & Referral Hospital',
    phone: '+254412314204',
    level: 'Level 5 County Referral Hospital',
    is24HourMaternity: true,
    source: 'COUNTY_DEFAULT',
    location: 'Mombasa Island'
  }
];

export async function resolveEmergencyFacilities(motherBirthPlanFacilities: EmergencyFacility[] = []): Promise<EmergencyFacility[]> {
  // Always returns user configured facilities + national baselines + regional reference hospitals
  return [
    ...motherBirthPlanFacilities,
    ...NATIONAL_BASELINE_CONTACTS,
    ...REGIONAL_REFERRAL_FACILITIES
  ];
}
