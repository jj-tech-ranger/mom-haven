import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  signInAnonymously as fbSignInAnonymously,
  sendSignInLinkToEmail as fbSendSignInLinkToEmail,
  isSignInWithEmailLink as fbIsSignInWithEmailLink,
  signInWithEmailLink as fbSignInWithEmailLink,
  signInWithEmailAndPassword as fbSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as fbCreateUserWithEmailAndPassword,
  sendEmailVerification as fbSendEmailVerification,
  sendPasswordResetEmail as fbSendPasswordResetEmail,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  getDocFromServer,
  runTransaction,
  type Firestore,
} from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const FIRESTORE_DATABASE_ID = 'mom-haven';

let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  }, FIRESTORE_DATABASE_ID);
} catch {
  firestoreDb = getFirestore(app, FIRESTORE_DATABASE_ID);
}
export const db = firestoreDb;
export const auth = getAuth(app);

export enum OperationType {
  GET = 'GET',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  WRITE = 'WRITE',
  DELETE = 'DELETE',
}

export function handleFirestoreError(err: unknown, operation: OperationType, path: string): never {
  console.error('Firestore operation failed', { operation, path, error: err });
  throw new Error('We could not save your information. Please try again.');
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function signInWithEmail(email: string, pass: string) { return fbSignInWithEmailAndPassword(auth, email, pass); }

export async function createAccountWithEmail(email: string, pass: string, displayName?: string) {
  const cred = await fbCreateUserWithEmailAndPassword(auth, email, pass);
  if (displayName && cred.user) await updateProfile(cred.user, { displayName });
  if (cred.user && !cred.user.emailVerified) {
    await fbSendEmailVerification(cred.user, {
      url: window.location.origin,
      handleCodeInApp: false,
    });
  }
  return cred;
}

export async function resendEmailVerification(user: User) {
  if (!user.email) throw new Error('No email address is associated with this account.');
  await fbSendEmailVerification(user, {
    url: window.location.origin,
    handleCodeInApp: false,
  });
}

export async function resetPassword(email: string) { return fbSendPasswordResetEmail(auth, email); }
export async function logoutUser() { return fbSignOut(auth); }

/**
 * Create the default user profile only when the document is still absent.
 * A transaction prevents the anonymous-partner auth flow from racing this
 * initializer and accidentally changing a PARTNER profile back to MOTHER.
 */
export async function ensureUserProfile(user: User) {
  if (!user || !user.uid) return;
  const userRef = doc(db, 'users', user.uid);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(userRef);
    if (!snap.exists()) {
      transaction.set(userRef, {
        uid: user.uid,
        email: user.email || null,
        displayName: user.displayName || 'Mama',
        role: 'MOTHER',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
  });
}

export async function signInAsGuest() {
  return fbSignInAnonymously(auth);
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, '__system', 'health'));
    return true;
  } catch {
    return false;
  }
}
