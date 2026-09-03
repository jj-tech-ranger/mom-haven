import { adminDb } from '../clinicianAccess.js';

export interface ServerHealthContext {
  version?: number;
  lifecycleStage?: string;
  userMode?: string;
  preferredName?: string;
  ageBracket?: string;
  county?: string;
  subcounty?: string;
  language?: 'en' | 'sw';
  pregnancy?: {
    pregnancyWeek?: number;
    dueDate?: string;
    dueDateSource?: string;
    multiplePregnancy?: boolean;
  };
  childAgeBracket?: string;
  interests?: string[];
  dietaryPreferences?: string[];
  supportSystem?: string;
  havenResponseStyle?: string;
  onboardingCompletedAt?: string;
  updatedAt?: string;
}

export async function getHealthContextForUser(uid: string): Promise<ServerHealthContext | null> {
  const snapshot = await adminDb.collection('healthContexts').doc(uid).get();
  if (!snapshot.exists) return null;
  return snapshot.data() as ServerHealthContext;
}
