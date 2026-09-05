// src/services/careTeamMessageService.ts
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { CareTeamMessage } from '../types';

export interface SendClinicianMessageParams {
  motherId: string;
  clinicianId: string;
  text: string;
  category?: 'general' | 'lab_result' | 'appointment' | 'reassurance';
  childId?: string | null;
  relatedRecordId?: string | null;
}

export interface SendMotherMessageParams {
  motherId: string;
  clinicianId?: string;
  text: string;
  category?: 'general' | 'lab_result' | 'appointment' | 'reassurance';
  childId?: string | null;
  relatedRecordId?: string | null;
}

/**
 * Fetch all care team messages for a specific mother.
 * Ordered by createdAt descending (most recent first).
 */
export async function getMessagesForMother(motherId: string): Promise<CareTeamMessage[]> {
  try {
    const colRef = collection(db, 'careTeamMessages');
    let messages: CareTeamMessage[] = [];

    try {
      const q = query(colRef, where('motherId', '==', motherId), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      messages = snap.docs.map((d) => ({ ...d.data(), id: d.id } as CareTeamMessage));
    } catch {
      // Fallback query if compound index is building
      const qFallback = query(colRef, where('motherId', '==', motherId));
      const snap = await getDocs(qFallback);
      messages = snap.docs
        .map((d) => ({ ...d.data(), id: d.id } as CareTeamMessage))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return messages;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'careTeamMessages');
    return [];
  }
}

/**
 * Send a message / feedback from clinician to mother.
 * This is visible to the mother in her MomHaven app.
 */
export async function sendMessageAsClinician(params: SendClinicianMessageParams): Promise<string> {
  const trimmed = params.text?.trim();
  if (!trimmed) {
    throw new Error('Message text cannot be empty.');
  }

  try {
    const colRef = collection(db, 'careTeamMessages');
    const docData: Omit<CareTeamMessage, 'id'> = {
      motherId: params.motherId,
      clinicianId: params.clinicianId,
      childId: params.childId || null,
      sentByRole: 'CLINICIAN',
      text: trimmed,
      category: params.category || 'general',
      relatedRecordId: params.relatedRecordId || null,
      readByMother: false,
      readAt: null,
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(colRef, docData);
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'careTeamMessages');
    throw err;
  }
}

/**
 * Send a message or inquiry from mother to her care team.
 */
export async function sendMessageAsMother(params: SendMotherMessageParams): Promise<string> {
  const trimmed = params.text?.trim();
  if (!trimmed) {
    throw new Error('Message text cannot be empty.');
  }

  try {
    const colRef = collection(db, 'careTeamMessages');
    const docData: Omit<CareTeamMessage, 'id'> = {
      motherId: params.motherId,
      clinicianId: params.clinicianId || 'care-team',
      childId: params.childId || null,
      sentByRole: 'MOTHER',
      text: trimmed,
      category: params.category || 'general',
      relatedRecordId: params.relatedRecordId || null,
      readByMother: true,
      readAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(colRef, docData);
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'careTeamMessages');
    throw err;
  }
}

/**
 * Mark a care team message as read by the mother.
 */
export async function markRead(messageId: string): Promise<void> {
  try {
    const docRef = doc(db, 'careTeamMessages', messageId);
    await updateDoc(docRef, {
      readByMother: true,
      readAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `careTeamMessages/${messageId}`);
    throw err;
  }
}

/**
 * Realtime listener for care team messages.
 */
export function subscribeCareTeamMessages(
  motherId: string,
  onUpdate: (messages: CareTeamMessage[]) => void
): () => void {
  try {
    const colRef = collection(db, 'careTeamMessages');
    const q = query(colRef, where('motherId', '==', motherId));

    return onSnapshot(
      q,
      (snap) => {
        const msgs = snap.docs
          .map((d) => ({ ...d.data(), id: d.id } as CareTeamMessage))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onUpdate(msgs);
      },
      (err) => {
        console.warn('Realtime care team messages snapshot failed, falling back:', err);
      }
    );
  } catch {
    return () => {};
  }
}
