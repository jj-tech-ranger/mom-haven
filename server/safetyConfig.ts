import { adminDb } from './clinicianAccess.js';
import { DANGER_SIGNS, SELF_HARM_OR_VIOLENCE_PATTERNS } from '../src/lib/safetyPatterns.js';

let cache: { at: number; version: number; physical: RegExp[]; selfHarm: RegExp[] } | null = null;
const TTL = 5 * 60 * 1000;
const escape = (s: string) => s.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
const toRegex = (patterns: string[]) => patterns.map(p => new RegExp(`\\b${escape(p).replace(/\\s+/g, '\\s+')}\\b`, 'i'));

export async function ensureSafetyPatternsSeeded() {
  const snap = await adminDb.collection('safetyPatterns').limit(1).get();
  if (!snap.empty) return;
  const batch = adminDb.batch();
  for (const sign of DANGER_SIGNS) {
    batch.set(adminDb.doc(`safetyPatterns/${sign.id}`), { id: sign.id, label: sign.label, icon: sign.icon, category: sign.category, matchPatterns: sign.matchPatterns, version: 1, enabled: true, source: 'momhaven_baseline_migrated', updatedAt: new Date().toISOString(), versionHistory: [{ version: 1, at: new Date().toISOString(), by: 'system', matchPatterns: sign.matchPatterns }] });
  }
  await batch.commit();
}

export async function getSafetyPatternConfig() {
  if (cache && Date.now() - cache.at < TTL) return cache;
  try {
    const snap = await adminDb.collection('safetyPatterns').where('enabled', '==', true).limit(500).get();
    if (snap.empty) throw new Error('Safety pattern register is empty');
    const physical: string[] = []; const selfHarm: string[] = [];
    let version = 1;
    snap.docs.forEach(d => { const x = d.data(); version = Math.max(version, Number(x.version || 1)); const p = Array.isArray(x.matchPatterns) ? x.matchPatterns.map(String) : []; if (x.category === 'selfharm') selfHarm.push(...p); else physical.push(...p); });
    cache = { at: Date.now(), version, physical: toRegex(physical), selfHarm: [...toRegex(selfHarm), ...SELF_HARM_OR_VIOLENCE_PATTERNS.slice(SELF_HARM_OR_VIOLENCE_PATTERNS.length - 7)] };
    return cache;
  } catch {
    cache = { at: Date.now(), version: 0, physical: toRegex(DANGER_SIGNS.filter(x => x.category !== 'selfharm').flatMap(x => x.matchPatterns)), selfHarm: SELF_HARM_OR_VIOLENCE_PATTERNS };
    return cache;
  }
}

export async function classifyLayerOneRemote(message: string) {
  const normalized = message.replace(/\\s+/g, ' ').trim();
  const cfg = await getSafetyPatternConfig();
  if (cfg.selfHarm.some(p => p.test(normalized))) return 'self_harm_or_violence' as const;
  if (cfg.physical.some(p => p.test(normalized))) return 'physical_danger' as const;
  return null;
}

export function invalidateSafetyCache() { cache = null; }
