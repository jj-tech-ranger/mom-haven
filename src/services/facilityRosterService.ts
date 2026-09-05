// src/services/facilityRosterService.ts
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import type { FacilityRosterEntry } from '../types';

export interface FacilityRosterResponse {
  facilityId: string;
  facilityName: string;
  items: FacilityRosterEntry[];
}

async function getAuthHeader() {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign-in required to access facility roster.');
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Fetches facility roster entries for the logged-in clinician's facility.
 * Uses the API endpoint first (which enriches names and recomputes if empty),
 * with fallback to client Firestore if needed.
 */
export async function fetchFacilityRoster(facilityId?: string): Promise<FacilityRosterResponse> {
  try {
    const headers = await getAuthHeader();
    const queryParam = facilityId ? `?facilityId=${encodeURIComponent(facilityId)}` : '';
    let res = await fetch(`/api/v1/clinician/facility-roster${queryParam}`, { headers });
    if (!res.ok) {
      res = await fetch(`/api/clinician/facility-roster${queryParam}`, { headers });
    }
    if (res.ok) {
      const data = await res.json();
      return {
        facilityId: data.facilityId || facilityId || '',
        facilityName: data.facilityName || 'Facility Clinic',
        items: data.items || [],
      };
    }
  } catch (err) {
    console.warn('[FacilityRosterService] API fetch failed, attempting direct Firestore read:', err);
  }

  // Fallback: direct Firestore query
  if (facilityId) {
    try {
      const q = query(collection(db, 'facilityRosters'), where('facilityId', '==', facilityId));
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => ({ ...d.data(), id: d.id } as FacilityRosterEntry));
      items.sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
      return {
        facilityId,
        facilityName: 'Facility Clinic',
        items,
      };
    } catch (err) {
      console.error('[FacilityRosterService] Direct Firestore read error:', err);
    }
  }

  return { facilityId: facilityId || '', facilityName: 'Facility Clinic', items: [] };
}

/**
 * Triggers server-side recomputation of the facility roster
 */
export async function triggerRecomputeRoster(facilityId?: string): Promise<FacilityRosterEntry[]> {
  const headers = await getAuthHeader();
  let res = await fetch('/api/v1/clinician/facility-roster/recompute', {
    method: 'POST',
    headers,
    body: JSON.stringify({ facilityId }),
  });
  if (!res.ok) {
    res = await fetch('/api/clinician/facility-roster/recompute', {
      method: 'POST',
      headers,
      body: JSON.stringify({ facilityId }),
    });
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to recompute facility roster.');
  }
  const data = await res.json();
  return data.items || [];
}

/**
 * Helper: checks if a date string is due "this week" (from start of current week to end of current week + 7 days)
 */
export function isDueThisWeek(dateStr: string, refDate: Date = new Date()): boolean {
  if (!dateStr) return false;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return false;

  // Start of today (00:00:00)
  const todayStart = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
  // 7 days from today (inclusive)
  const weekEnd = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000 + (24 * 60 * 60 * 1000 - 1));

  // Also include overdue items from this week or past 7 days so they aren't missed
  const overdueGrace = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

  return target >= overdueGrace && target <= weekEnd;
}

/**
 * Helper: checks if a date is strictly overdue (before today)
 */
export function isOverdue(dateStr: string, refDate: Date = new Date()): boolean {
  if (!dateStr) return false;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return false;
  const todayStart = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
  return target < todayStart;
}

/**
 * Helper: checks if a date is due today
 */
export function isDueToday(dateStr: string, refDate: Date = new Date()): boolean {
  if (!dateStr) return false;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return false;
  const todayStart = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
  return target >= todayStart && target <= todayEnd;
}
