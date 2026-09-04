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
  type Firestore,
} from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const FIRESTORE_DATABASE_ID = 'mom-haven';

let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  }, FIRESTORE_DATABASE_ID);
} catch (err) {
  firestoreDb = getFirestore(app, FIRESTORE_DATABASE_ID);
}

export const db = firestoreDb;
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: { providerId?: string | null; email?: string | null }[];
  };
}

/**
 * Log full diagnostics for developers, but never put authentication metadata,
 * document paths, or raw Firestore errors into a user-visible exception.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({ providerId: provider.providerId, email: provider.email })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));

  throw new Error('We could not save your information. Please try again.');
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) console.error('Please check your Firebase configuration.');
  }
}

export async function signInWithGoogle() { return signInWithPopup(auth, googleProvider); }
export async function signInAsGuest() { return fbSignInAnonymously(auth); }

export async function sendMagicLink(email: string) {
  const actionCodeSettings = { url: window.location.origin + window.location.pathname, handleCodeInApp: true };
  await fbSendSignInLinkToEmail(auth, email, actionCodeSettings);
  window.localStorage.setItem('emailForSignIn', email);
}

export function isMagicLink(url: string = window.location.href) { return fbIsSignInWithEmailLink(auth, url); }

export async function completeMagicLinkSignIn(emailParam?: string, url: string = window.location.href) {
  let email = emailParam || window.localStorage.getItem('emailForSignIn');
  if (!email) email = window.prompt('Please provide your email for sign-in confirmation') || '';
  if (!email) throw new Error('Email is required to complete magic link sign in.');
  const result = await fbSignInWithEmailLink(auth, email, url);
  window.localStorage.removeItem('emailForSignIn');
  return result;
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

export async function ensureUserProfile(user: User) {
  if (!user || !user.uid) return;
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email || null,
      displayName: user.displayName || 'Mama',
      role: 'MOTHER',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }
}
