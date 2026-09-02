export interface StandardFacility {
  id: string;
  name: string;
  county: string;
  subcounty: string;
  type: string;
}

export const KENYA_FACILITIES: StandardFacility[] = [
  { id: 'knh', name: 'Kenyatta National Hospital (KNH)', county: 'Nairobi', subcounty: 'Kibra', type: 'National Referral Hospital' },
  { id: 'pumwani', name: 'Pumwani Maternity Hospital', county: 'Nairobi', subcounty: 'Kamukunji', type: 'Level 5 Maternity' },
  { id: 'mbagathi', name: 'Mbagathi County Hospital', county: 'Nairobi', subcounty: 'Langata', type: 'Level 4 Hospital' },
  { id: 'mama-lucy', name: 'Mama Lucy Kibaki Hospital', county: 'Nairobi', subcounty: 'Embakasi Central', type: 'Level 5 Hospital' },
  { id: 'kariokor', name: 'Kariokor Health Centre', county: 'Nairobi', subcounty: 'Kamukunji', type: 'Health Centre' },
  { id: 'coast-gen', name: 'Coast General Teaching & Referral Hospital', county: 'Mombasa', subcounty: 'Mvita', type: 'Level 5 Hospital' },
  { id: 'port-reitz', name: 'Port Reitz Sub-County Hospital', county: 'Mombasa', subcounty: 'Changamwe', type: 'Sub-County Hospital' },
  { id: 'jaramogi', name: 'Jaramogi Oginga Odinga Teaching & Referral (JOOTRH)', county: 'Kisumu', subcounty: 'Kisumu Central', type: 'Level 5 Hospital' },
  { id: 'kisumu-county', name: 'Kisumu County Hospital', county: 'Kisumu', subcounty: 'Kisumu Central', type: 'Level 4 Hospital' },
  { id: 'kiambu-level5', name: 'Kiambu Level 5 Hospital', county: 'Kiambu', subcounty: 'Kiambu', type: 'Level 5 Hospital' },
  { id: 'thika-level5', name: 'Thika Level 5 Hospital', county: 'Kiambu', subcounty: 'Thika', type: 'Level 5 Hospital' },
  { id: 'nakuru-level5', name: 'Nakuru Level 5 Teaching & Referral Hospital', county: 'Nakuru', subcounty: 'Nakuru Town East', type: 'Level 5 Hospital' },
  { id: 'naivasha-level4', name: 'Naivasha Level 4 Hospital', county: 'Nakuru', subcounty: 'Naivasha', type: 'Level 4 Hospital' },
  { id: 'machakos-level5', name: 'Machakos Level 5 Hospital', county: 'Machakos', subcounty: 'Machakos', type: 'Level 5 Hospital' },
  { id: 'moi-referral', name: 'Moi Teaching & Referral Hospital (MTRH)', county: 'Uasin Gishu', subcounty: 'Ainabkoi', type: 'National Referral Hospital' },
  { id: 'huruma-subcounty', name: 'Huruma Sub-County Hospital', county: 'Uasin Gishu', subcounty: 'Turbo', type: 'Sub-County Hospital' },
  { id: 'kakamega-county', name: 'Kakamega County General Teaching & Referral', county: 'Kakamega', subcounty: 'Lurambi', type: 'Level 5 Hospital' },
  { id: 'nyeri-county', name: 'Nyeri County Referral Hospital', county: 'Nyeri', subcounty: 'Nyeri Central', type: 'Level 5 Hospital' },
  { id: 'garissa-county', name: 'Garissa County Referral Hospital', county: 'Garissa', subcounty: 'Garissa', type: 'Level 5 Hospital' },
  { id: 'kilifi-county', name: 'Kilifi County Hospital', county: 'Kilifi', subcounty: 'Kilifi North', type: 'Level 4 Hospital' }
];
