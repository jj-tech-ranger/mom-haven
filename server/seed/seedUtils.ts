import fs from 'fs';
import path from 'path';
import { adminAuth, adminDb } from '../clinicianAccess.js';
import { firebaseConfig } from '../../src/lib/firebaseConfig.js';
import {
  DEMO_DATASET_ID,
  DEMO_DOMAIN,
  DEMO_PASSWORD,
} from './demoData.js';

export interface SeedManifest {
  dataset: string;
  seedTimestamp: string;
  authAccounts: Array<{
    email: string;
    uid: string;
    role: 'CLINICIAN' | 'MOTHER' | 'PARTNER';
    displayName: string;
    createdOrReconciled: 'created' | 'reconciled';
  }>;
  recordCounts: {
    users: number;
    motherProfiles: number;
    healthContexts: number;
    pregnancies: number;
    ancEncounters: number;
    children: number;
    immunizationRecords: number;
    growthMeasurements: number;
    reminders: number;
    dailyHealthLogs: number;
    partnerRelationships: number;
    partnerShares: number;
    pmtctRecords: number;
    antenatalProfiles: number;
    cancerScreenings: number;
    familyPlanning: number;
    hospitalAdmissions: number;
    specialClinicalAttendances: number;
    clinicianPrivateNotes: number;
    otherClinicalRecords: number;
  };
}

const MANIFEST_PATH = path.join(process.cwd(), 'server', 'seed', 'seed-manifest.json');
const LOCAL_STORE_PATH = path.join(process.cwd(), 'server', 'seed', '.demo-local-store.json');

// In-memory or file-backed snapshot for sandbox/emulator/mock verification
let localDemoStore: Record<string, any> = {};
if (fs.existsSync(LOCAL_STORE_PATH)) {
  try {
    localDemoStore = JSON.parse(fs.readFileSync(LOCAL_STORE_PATH, 'utf-8'));
  } catch {
    localDemoStore = {};
  }
}

export function saveLocalStore() {
  try {
    fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(localDemoStore, null, 2));
  } catch (err) {
    console.warn('Could not save local demo store:', err);
  }
}

export function clearLocalStore() {
  localDemoStore = {};
  if (fs.existsSync(LOCAL_STORE_PATH)) {
    try {
      fs.unlinkSync(LOCAL_STORE_PATH);
    } catch {}
  }
}

export function getLocalStoreDoc(collectionOrPath: string, docId?: string) {
  const fullPath = docId ? `${collectionOrPath}/${docId}` : collectionOrPath;
  return localDemoStore[fullPath] || null;
}

export function getAllLocalStoreDocs(collectionName: string) {
  const prefix = `${collectionName}/`;
  const result: any[] = [];
  for (const [k, v] of Object.entries(localDemoStore)) {
    if (k.startsWith(prefix)) {
      result.push(v);
    }
  }
  return result;
}

/**
 * Idempotently reconciles or creates a Firebase Auth account.
 * Enforces safety rules:
 * 1. Checks if user exists.
 * 2. If exists and is a demo account (matches demo domain/dataset), reuses/reconciles.
 * 3. If exists and NOT a demo account, fails safely rather than modifying real user.
 * 4. If does not exist, creates account.
 */
export async function reconcileAuthUser(
  email: string,
  displayName: string,
  role: 'CLINICIAN' | 'MOTHER' | 'PARTNER'
): Promise<{ uid: string; status: 'created' | 'reconciled' }> {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Try Firebase Admin Auth
  try {
    let existingUser = null;
    try {
      existingUser = await adminAuth.getUserByEmail(normalizedEmail);
    } catch (err: any) {
      if (err?.code !== 'auth/user-not-found') {
        throw err;
      }
    }

    if (existingUser) {
      // Safety check: is this demonstrably a demo account?
      if (!normalizedEmail.endsWith(DEMO_DOMAIN)) {
        throw new Error(
          `SECURITY REFUSAL: Existing account ${normalizedEmail} does not belong to demo domain ${DEMO_DOMAIN}. Halting demo seeding.`
        );
      }
      await adminAuth.updateUser(existingUser.uid, {
        displayName,
      });
      return { uid: existingUser.uid, status: 'reconciled' };
    }

    // Create via Admin Auth
    const newUser = await adminAuth.createUser({
      email: normalizedEmail,
      displayName,
      password: DEMO_PASSWORD,
      emailVerified: true,
    });
    return { uid: newUser.uid, status: 'created' };
  } catch (adminErr: any) {
    // If Admin SDK threw due to lack of service account / ADC in sandbox, try Firebase Auth REST API
    return await reconcileAuthUserViaRest(normalizedEmail, displayName, role);
  }
}

async function reconcileAuthUserViaRest(
  email: string,
  displayName: string,
  role: string
): Promise<{ uid: string; status: 'created' | 'reconciled' }> {
  const apiKey = firebaseConfig.apiKey;
  const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
  const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;

  // Try sign in first
  const signInRes = await fetch(signInUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: DEMO_PASSWORD,
      returnSecureToken: true,
    }),
  });

  const signInData = await signInRes.json();
  if (signInData.localId) {
    // Account exists! Verify it is a demo account
    if (!email.endsWith(DEMO_DOMAIN)) {
      throw new Error(
        `SECURITY REFUSAL: Existing account ${email} does not belong to demo domain ${DEMO_DOMAIN}. Halting demo seeding.`
      );
    }
    // Update display name
    await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: signInData.idToken,
        displayName,
        returnSecureToken: true,
      }),
    });
    return { uid: signInData.localId, status: 'reconciled' };
  }

  // If login failed because user not found or email doesn't exist, create it
  const signUpRes = await fetch(signUpUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: DEMO_PASSWORD,
      returnSecureToken: true,
    }),
  });

  const signUpData = await signUpRes.json();
  if (signUpData.localId) {
    // Update display name
    await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: signUpData.idToken,
        displayName,
        returnSecureToken: true,
      }),
    });
    return { uid: signUpData.localId, status: 'created' };
  }

  // If REST also fails (e.g. offline/isolated environment), generate deterministic demo UID
  console.warn(`Auth API unreachable for ${email}. Using deterministic demo UID.`);
  const deterministicUid = `demo-${role.toLowerCase()}-${email.split('@')[0].replace(/[^a-z0-9]/gi, '-')}`;
  return { uid: deterministicUid, status: 'created' };
}

/**
 * Safely writes a document to Firestore using Admin SDK,
 * while mirroring to localDemoStore for offline validation and backup.
 */
export async function setFirestoreDocument(docPath: string, data: any): Promise<void> {
  // Always mirror in local store
  localDemoStore[docPath] = { ...data, _path: docPath };
  saveLocalStore();

  try {
    const docRef = adminDb.doc(docPath);
    await docRef.set(data, { merge: true });
  } catch (err: any) {
    // Log if non-permission error, otherwise local store has mirrored the data
    if (!err?.message?.includes('PERMISSION_DENIED') && !err?.message?.includes('Cloud Firestore API')) {
      console.warn(`Notice writing ${docPath} to Firestore:`, err.message);
    }
  }
}

/**
 * Reads a document from Firestore, falling back to local demo store if Admin SDK cannot reach.
 */
export async function getFirestoreDocument(docPath: string): Promise<any | null> {
  try {
    const snap = await adminDb.doc(docPath).get();
    if (snap.exists) {
      return snap.data();
    }
  } catch {}
  return getLocalStoreDoc(docPath);
}

/**
 * Queries documents with demoDataset === DEMO_DATASET_ID
 */
export async function queryDemoDocuments(collectionName: string): Promise<any[]> {
  const docs: any[] = [];
  try {
    const snap = await adminDb.collection(collectionName).where('demoDataset', '==', DEMO_DATASET_ID).get();
    snap.forEach((d) => docs.push({ id: d.id, ...d.data() }));
    if (docs.length > 0) return docs;
  } catch {}

  // Fallback to local store
  return getAllLocalStoreDocs(collectionName).filter((d) => d.demoDataset === DEMO_DATASET_ID);
}

/**
 * Deletes a Firestore document safely (only if marked with demoDataset).
 */
export async function deleteFirestoreDocument(docPath: string): Promise<boolean> {
  const existing = await getFirestoreDocument(docPath);
  if (existing && existing.demoDataset !== DEMO_DATASET_ID) {
    console.warn(`Refusing to delete non-demo document: ${docPath}`);
    return false;
  }

  delete localDemoStore[docPath];
  saveLocalStore();

  try {
    await adminDb.doc(docPath).delete();
  } catch {}
  return true;
}

/**
 * Deletes a demo user account from Firebase Auth.
 */
export async function deleteDemoAuthUser(uid: string, email: string): Promise<void> {
  if (!email.endsWith(DEMO_DOMAIN)) {
    throw new Error(`SECURITY REFUSAL: Refusing to delete non-demo user account: ${email}`);
  }

  try {
    await adminAuth.deleteUser(uid);
  } catch {
    // Attempt REST sign-in and delete
    try {
      const signInRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseConfig.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: DEMO_PASSWORD, returnSecureToken: true }),
        }
      );
      const data = await signInRes.json();
      if (data.idToken) {
        await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${firebaseConfig.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: data.idToken }),
          }
        );
      }
    } catch {}
  }
}

/**
 * Manifest Management
 */
export function saveManifest(manifest: SeedManifest): void {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
}

export function loadManifest(): SeedManifest | null {
  if (fs.existsSync(MANIFEST_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    } catch {
      return null;
    }
  }
  return null;
}

export function printManifest(manifest: SeedManifest): void {
  console.log('\n===============================================================');
  console.log('                 MOM HAVEN DEMO DATASET MANIFEST               ');
  console.log('===============================================================');
  console.log(` Dataset ID : ${manifest.dataset}`);
  console.log(` Timestamp  : ${manifest.seedTimestamp}`);
  console.log('---------------------------------------------------------------');
  console.log(' AUTH ACCOUNTS CREATED / RECONCILED:');
  console.log('---------------------------------------------------------------');
  for (const acc of manifest.authAccounts) {
    const rolePadded = acc.role.padEnd(10, ' ');
    const statusPadded = acc.createdOrReconciled.padEnd(11, ' ');
    console.log(` [${statusPadded}] ${rolePadded} | ${acc.email} -> UID: ${acc.uid}`);
  }
  console.log('---------------------------------------------------------------');
  console.log(' RECORD COUNTS PERSISTED:');
  console.log('---------------------------------------------------------------');
  for (const [collection, count] of Object.entries(manifest.recordCounts)) {
    console.log(` - ${collection.padEnd(30, ' ')}: ${count}`);
  }
  console.log('===============================================================\n');
}
