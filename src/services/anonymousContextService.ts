import type { HealthContext, LifecycleStage } from '../types/healthContext';

export interface AnonymousContextDraft {
  lifecycleStage: LifecycleStage;
  language: 'en' | 'sw';
  pregnancyWeek?: number;
  dueDate?: string;
  interests: string[];
  havenResponseStyle: HealthContext['havenResponseStyle'];
  createdAt: string;
}

const STORAGE_KEY = 'momhaven-anonymous-context-v1';

export function getAnonymousContextDraft(): AnonymousContextDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as AnonymousContextDraft;
    if (!value || !value.lifecycleStage || !Array.isArray(value.interests)) return null;
    return value;
  } catch {
    return null;
  }
}

export function saveAnonymousContextDraft(draft: Omit<AnonymousContextDraft, 'createdAt'>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...draft, createdAt: new Date().toISOString() }));
  } catch {
    // Anonymous personalization is an enhancement; failure must never block exploration.
  }
}

export function clearAnonymousContextDraft(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

export function hasAnonymousContextDraft(): boolean {
  return Boolean(getAnonymousContextDraft());
}
