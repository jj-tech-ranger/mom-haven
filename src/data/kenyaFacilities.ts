export interface StandardFacility {
  id: string;
  name: string;
  county: string;
  subcounty: string;
  type: string;
}

// Production starts with no seeded facility records. Populate this collection from the authoritative live source.
export const KENYA_FACILITIES: StandardFacility[] = [];
