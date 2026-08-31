import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { classifyLayerOne } from '../src/lib/safetyPatterns.js';

const app = express();
app.use(express.json({ limit: '20kb' }));

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'mom-haven';
const DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || 'ai-studio-momhaven-f2316da7-8f94-4e5d-9e6f-cc82c1066c72';
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyBz-3qtnWdqcicw9uATEgn1zorB7WUQ98';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents`;
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

const SYSTEM_INSTRUCTION = `You are Haven, MomHaven's supportive companion for Kenyan mothers navigating pregnancy and their child's first five years. You are not a doctor and you do not diagnose. Rules you must always follow: (1) Never state or imply a medical diagnosis. (2) Never state or invent a specific medication dose or prescribing instruction. (3) Keep answers short, warm, and in plain English — avoid medical jargon. (4) If you don't have enough information to answer safely, ask one specific clarifying question rather than guessing. (5) You may explain general, widely-known maternal and child health information, but for anything specific to Kenyan clinical guidance (schedules, thresholds, dosing), defer to what MomHaven's own records and a clinician would say rather than inventing specifics. Always offer 2-3 short, relevant follow-up questions the mother might want to ask next. If the message asks for a specific medication name and dose, or otherwise asks you to prescribe or dose medication, set classification to 'medication_request' and keep responseText brief, directing the mother to a clinician or pharmacist rather than attempting an answer. If the message concerns a sensitive but non-emergency topic (e.g. HIV status, family planning, a difficult relationship or living situation), set classification to 'sensitive_topic' and write a careful, non-judgmental responseText. If you don't have enough information to answer safely or usefully, set classification to 'insufficient_info' and make responseText a single specific clarifying question rather than a guess.`;

const responseSchema = {
  type: 'object',
  properties: {
    classification: { type: 'string', enum: ['safe', 'medication_request', 'sensitive_topic', 'insufficient_info'] },
    responseText: { type: 'string' },
    suggestedFollowups: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 3 },
  },
  required: ['classification', 'responseText', 'suggestedFollowups'],
};

function firestoreValue(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') return { doubleValue: value };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  return { stringValue: String(value) };
}

function fromFirestoreValue(value: any): any {
  if (!value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('booleanValue' in value) return value.booleanValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  if ('mapValue' in value) return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([k, v]) => [k, fromFirestoreValue(v)]));
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(fromFirestoreValue);
  return null;
}

function documentToObject(document: any): any {
  return Object.fromEntries(Object.entries(document.fields || {}).map(([key, value]) => [key, fromFirestoreValue(value)]));
}

async function verifyIdToken(idToken: string) {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(FIREBASE_API_KEY)}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ idToken }),
  });
  if (!response.ok) throw new Error('Invalid Firebase session');
  const data = await response.json();
  const user = data.users?.[0];
  if (!user?.localId) throw new Error('Invalid Firebase session');
  return { uid: user.localId, email: user.email || null };
}

async function runQuery(idToken: string, structuredQuery: any) {
  const response = await fetch(`${FIRESTORE_BASE}:runQuery`, {
    method: 'POST',
    headers: { authorization: `Bearer ${idToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ structuredQuery }),
  });
  if (!response.ok) throw new Error(`Firestore query failed (${response.status})`);
  const rows = await response.json();
  return rows.filter((row: any) => row.document).map((row: any) => ({ id: row.document.name.split('/').pop(), ...documentToObject(row.document) }));
}

async function getDocument(idToken: string, path: string) {
  const response = await fetch(`${FIRESTORE_BASE}/${path}`, { headers: { authorization: `Bearer ${idToken}` } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Firestore read failed (${response.status})`);
  return documentToObject(await response.json());
}

async function writeDocument(idToken: string, path: string, fields: Record<string, unknown>, documentId?: string) {
  const url = documentId ? `${FIRESTORE_BASE}/${path}?documentId=${encodeURIComponent(documentId)}` : `${FIRESTORE_BASE}/${path}`;
  const response = await fetch(url, {
    method: 'POST', headers: { authorization: `Bearer ${idToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ fields: Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, firestoreValue(value)])) }),
  });
  if (!response.ok) throw new Error(`Firestore write failed (${response.status})`);
  return response.json();
}

async function patchDocument(idToken: string, path: string, fields: Record<string, unknown>) {
  const fieldPaths = Object.keys(fields).map((key) => `updateMask.fieldPaths=${encodeURIComponent(key)}`).join('&');
  const response = await fetch(`${FIRESTORE_BASE}/${path}?${fieldPaths}`, {
    method: 'PATCH', headers: { authorization: `Bearer ${idToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ fields: Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, firestoreValue(value)])) }),
  });
  if (!response.ok) throw new Error(`Firestore update failed (${response.status})`);
}

function doseLikeText(text: string) {
  return /\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|mL|milligrams?|micrograms?|grams?)\b(?:\s+(?:once|twice|three times|daily|per day|every|each))?/i.test(text);
}

async function resolveContext(idToken: string, uid: string) {
  const baseFilter = (field: string) => ({ fieldFilter: { field: { fieldPath: field }, op: 'EQUAL', value: { stringValue: uid } } });
  const [pregnancies, children] = await Promise.all([
    runQuery(idToken, { from: [{ collectionId: 'pregnancies' }], where: baseFilter('motherId'), limit: 25 }),
    runQuery(idToken, { from: [{ collectionId: 'children' }], where: baseFilter('motherId'), limit: 25 }),
  ]);
  const activePregnancy = pregnancies.find((p: any) => p.status === 'active');
  const activeChild = children[0];
  if (activePregnancy) {
    const week = Number(activePregnancy.gestationalAgeWeeks ?? activePregnancy.currentWeek ?? 0);
    if (week > 0) return `This mother is ${week} weeks pregnant.`;
    const lmp = activePregnancy.lmp || activePregnancy.lastMenstrualPeriod;
    if (lmp) return `This mother is pregnant; the recorded last menstrual period is ${String(lmp).slice(0, 10)}.`;
    return 'This mother has an active pregnancy on record.';
  }
  if (activeChild) {
    const dob = new Date(activeChild.dateOfBirth);
    const ageMonths = Math.max(0, Math.floor((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 30.4375)));
    const name = activeChild.name || 'the child';
    return `This mother's child, ${name}, is ${ageMonths} months old.`;
  }
  return 'No active pregnancy or child context is currently recorded for this mother.';
}

app.post('/api/v1/chat', async (req, res) => {
  try {
    const authHeader = String(req.headers.authorization || '');
    if (!authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Sign-in required.' });
    const idToken = authHeader.slice(7);
    const { uid } = await verifyIdToken(idToken);
    const { sessionId, message } = req.body || {};
    const text = typeof message === 'string' ? message.trim() : '';
    if (!sessionId || !text || text.length > 4000) return res.status(400).json({ error: 'A valid sessionId and message are required.' });

    const session = await getDocument(idToken, `havenSessions/${encodeURIComponent(sessionId)}`);
    if (!session || session.userId !== uid) return res.status(403).json({ error: 'This chat session is not yours.' });

    const layerOne = classifyLayerOne(text);
    if (layerOne === 'physical_danger') {
      return res.json({ classification: 'emergency', responseText: '', suggestedFollowups: [], handoff: 'physical_danger' });
    }
    if (layerOne === 'self_harm_or_violence') {
      return res.json({ classification: 'emergency', responseText: '', suggestedFollowups: [], handoff: 'self_harm_or_violence' });
    }
    if (!ai) return res.status(503).json({ error: 'Haven is not configured yet. Add GEMINI_API_KEY to the server environment.' });

    const context = await resolveContext(idToken, uid);
    const prompt = `${context}\n\nMother's message:\n${text}`;
    const response = await ai.models.generateContent({ model: GEMINI_MODEL, contents: prompt, config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: 'application/json', responseSchema } });
    let result: any;
    try { result = JSON.parse(response.text || '{}'); } catch { result = null; }
    if (!result?.responseText || !Array.isArray(result.suggestedFollowups) || result.suggestedFollowups.length !== 3) {
      return res.status(502).json({ error: 'Haven returned an invalid response. Please try again.' });
    }
    if (doseLikeText(result.responseText)) {
      result.classification = 'medication_request';
      result.responseText = 'I can help you think about what to ask a clinician or pharmacist, but I cannot provide a medication dose or prescribing instruction.';
      result.suggestedFollowups = ['What should I tell the clinician?', 'What information should I bring?', 'When should I seek urgent help?'];
    }

    const now = new Date().toISOString();
    await writeDocument(idToken, `havenSessions/${encodeURIComponent(sessionId)}/messages`, { role: 'user', text, createdAt: now });
    await writeDocument(idToken, `havenSessions/${encodeURIComponent(sessionId)}/messages`, { role: 'assistant', text: result.responseText, classification: result.classification, suggestedFollowups: result.suggestedFollowups, createdAt: now });
    await patchDocument(idToken, `havenSessions/${encodeURIComponent(sessionId)}`, { updatedAt: now, lastMessagePreview: text.slice(0, 140) });
    return res.json(result);
  } catch (error: any) {
    console.error('Haven chat error', error);
    return res.status(error?.message === 'Invalid Firebase session' ? 401 : 500).json({ error: error?.message || 'Unable to reach Haven.' });
  }
});

const port = Number(process.env.PORT || 8787);
app.listen(port, () => console.log(`MomHaven API listening on ${port}`));
