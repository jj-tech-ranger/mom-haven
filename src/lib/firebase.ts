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
  sendPasswordResetEmail as fbSendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const FIRESTORE_DATABASE_ID = 'mom-haven';

export const db = getFirestore(app, FIRESTORE_DATABASE_ID);
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
  throw new Error(JSON.stringify(errInfo));
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
  return cred;
}

export async function resetPassword(email: string) { return fbSendPasswordResetEmail(auth, email); }
export async function logoutUser() { return fbSignOut(auth); }
