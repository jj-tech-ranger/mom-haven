export interface StandardFacility {
  id: string;
  name: string;
  county: string;
  subcounty: string;
  type: string;
  level?: string;
  code?: string;
}

/**
 * Temporary development facility used to exercise clinician registration and
 * administrator approval end-to-end. This is NOT an official KMHFL facility
 * record and must be removed before production use.
 */
export const MEADOWCARE_DEMO_FACILITY: StandardFacility = {
  id: 'MEADOWCARE-DEMO-001',
  code: 'MEADOWCARE-DEMO-001',
  name: 'Meadowcare Hospital',
  county: 'Nairobi',
  subcounty: 'Westlands',
  type: 'Hospital',
  level: 'Level 4',
};

// Production starts with no seeded facility records. Populate this collection from the authoritative live source.
export const KENYA_FACILITIES: StandardFacility[] = [MEADOWCARE_DEMO_FACILITY];
