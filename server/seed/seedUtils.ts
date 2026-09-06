import fs from 'fs';
import path from 'path';
import { adminAuth, adminDb } from '../clinicianAccess.js';
import { DEMO_DATASET_ID, DEMO_DOMAIN, DEMO_PASSWORD } from './demoData.js';

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

// Local state is retained only as a diagnostic snapshot. It is never a substitute
// for live Firebase during seeding or verification.
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
    if (k.startsWith(prefix)) result.push(v);
  }
  return result;
}

/**
 * Idempotently reconciles or creates a Firebase Auth account in the live project.
 * Existing demo users are reset to the deterministic demo password so repeated
 * seed runs produce credentials that actually work.
 */
export async function reconcileAuthUser(
  email: string,
  displayName: string,
  role: 'CLINICIAN' | 'MOTHER' | 'PARTNER'
): Promise<{ uid: string; status: 'created' | 'reconciled' }> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail.endsWith(DEMO_DOMAIN)) {
    throw new Error(
      `SECURITY REFUSAL: Demo seed may only manage accounts in ${DEMO_DOMAIN}; received ${normalizedEmail}.`
    );
  }

  try {
    let existingUser = null;
    try {
      existingUser = await adminAuth.getUserByEmail(normalizedEmail);
    } catch (err: any) {
      if (err?.code !== 'auth/user-not-found') throw err;
    }

    if (existingUser) {
      await adminAuth.updateUser(existingUser.uid, {
        displayName,
        password: DEMO_PASSWORD,
        emailVerified: true,
      });
      return { uid: existingUser.uid, status: 'reconciled' };
    }

    const newUser = await adminAuth.createUser({
      email: normalizedEmail,
      displayName,
      password: DEMO_PASSWORD,
      emailVerified: true,
    });
    return { uid: newUser.uid, status: 'created' };
  } catch (err: any) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(
      `LIVE FIREBASE AUTH REQUIRED: Could not reconcile ${normalizedEmail} as ${role}. ` +
      `Refusing to use a synthetic UID or local fallback. Check Application Default Credentials / ` +
      `FIREBASE_SERVICE_ACCOUNT_JSON and project mom-haven. Original error: ${detail}`
    );
  }
}

function removeUndefined(value: any): any {
  if (Array.isArray(value)) {
    return value.filter((item) => item !== undefined).map(removeUndefined);
  }

  if (value && typeof value === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, item] of Object.entries(value)) {
      if (item !== undefined) cleaned[key] = removeUndefined(item);
    }
    return cleaned;
  }

  return value;
}

/**
 * Writes only to the live named Firestore database. Undefined fields are stripped
 * because Firestore rejects undefined values. Failed live writes are fatal.
 */
export async function setFirestoreDocument(docPath: string, data: any): Promise<void> {
  const cleanedData = removeUndefined(data);

  try {
    await adminDb.doc(docPath).set(cleanedData, { merge: true });
  } catch (err: any) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`LIVE FIRESTORE WRITE FAILED for ${docPath} in database mom-haven: ${detail}`);
  }

  localDemoStore[docPath] = { ...cleanedData, _path: docPath };
  saveLocalStore();
}

/** Reads only from live Firestore. */
export async function getFirestoreDocument(docPath: string): Promise<any | null> {
  try {
    const snap = await adminDb.doc(docPath).get();
    return snap.exists ? snap.data() : null;
  } catch (err: any) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`LIVE FIRESTORE READ FAILED for ${docPath} in database mom-haven: ${detail}`);
  }
}

/** Queries only live Firestore for demo documents. */
export async function queryDemoDocuments(collectionName: string): Promise<any[]> {
  try {
    const snap = await adminDb.collection(collectionName).where('demoDataset', '==', DEMO_DATASET_ID).get();
    const docs: any[] = [];
    snap.forEach((d) => docs.push({ id: d.id, ...d.data() }));
    return docs;
  } catch (err: any) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`LIVE FIRESTORE QUERY FAILED for ${collectionName} in database mom-haven: ${detail}`);
  }
}

/** Deletes a Firestore document safely (only if marked with demoDataset). */
export async function deleteFirestoreDocument(docPath: string): Promise<boolean> {
  const existing = await getFirestoreDocument(docPath);
  if (existing && existing.demoDataset !== DEMO_DATASET_ID) {
    console.warn(`Refusing to delete non-demo document: ${docPath}`);
    return false;
  }

  try {
    await adminDb.doc(docPath).delete();
  } catch (err: any) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`LIVE FIRESTORE DELETE FAILED for ${docPath}: ${detail}`);
  }

  delete localDemoStore[docPath];
  saveLocalStore();
  return true;
}

/** Deletes a demo user account from Firebase Auth. */
export async function deleteDemoAuthUser(uid: string, email: string): Promise<void> {
  if (!email.trim().toLowerCase().endsWith(DEMO_DOMAIN)) {
    throw new Error(`SECURITY REFUSAL: Refusing to delete non-demo user account: ${email}`);
  }

  try {
    await adminAuth.deleteUser(uid);
  } catch (err: any) {
    if (err?.code === 'auth/user-not-found') return;
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`LIVE FIREBASE AUTH DELETE FAILED for ${email} (${uid}): ${detail}`);
  }
}

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
