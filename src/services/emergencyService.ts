import { addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SavedEmergencyFacilityDoc } from '../types';

export type SaveEmergencyFacilityInput = Omit<SavedEmergencyFacilityDoc, 'id'>;

export async function saveEmergencyFacility(input: SaveEmergencyFacilityInput): Promise<string> {
  const ref = await addDoc(collection(db, 'savedEmergencyFacilities'), input);
  return ref.id;
}
