import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type { HealthContext, HealthContextVersion } from '../types/healthContext';

const CONTEXT_VERSION = 1;

export async function getHealthContext(userId: string): Promise<HealthContext | null> {
  try {
    const snapshot = await getDoc(doc(db, 'healthContexts', userId));
    if (!snapshot.exists()) return null;
    return snapshot.data() as HealthContext;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `healthContexts/${userId}`);
    return null;
  }
}

export async function saveHealthContext(
  userId: string,
  context: Omit<HealthContext, 'version' | 'updatedAt'>,
  reason: HealthContextVersion['reasonForChange'] = 'initial_onboarding',
): Promise<void> {
  try {
    const now = new Date().toISOString();
    const persisted: HealthContext = {
      ...context,
      version: CONTEXT_VERSION,
      updatedAt: now,
    };

    await setDoc(doc(db, 'healthContexts', userId), persisted, { merge: true });

    const versionRef = collection(db, `healthContextVersions/${userId}/versions`);
    await addDoc(versionRef, {
      ...persisted,
      reasonForChange: reason,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `healthContexts/${userId}`);
    throw error;
  }
}
