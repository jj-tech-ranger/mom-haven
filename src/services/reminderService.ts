import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  doc 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Reminder } from '../types';

export async function getUpcomingReminders(userId: string): Promise<Reminder[]> {
  try {
    const remRef = collection(db, 'reminders');
    const q = query(
      remRef, 
      where('userId', '==', userId), 
      where('completed', '==', false)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      ...d.data(),
      id: d.id,
    } as Reminder));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'reminders');
    return [];
  }
}

export async function createReminder(reminder: Omit<Reminder, 'id' | 'createdAt'>): Promise<string> {
  try {
    const remRef = collection(db, 'reminders');
    const docRef = await addDoc(remRef, {
      ...reminder,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'reminders');
    throw err;
  }
}

export async function toggleReminderComplete(reminderId: string, completed: boolean): Promise<void> {
  try {
    const remRef = doc(db, 'reminders', reminderId);
    await updateDoc(remRef, { completed });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `reminders/${reminderId}`);
    throw err;
  }
}
