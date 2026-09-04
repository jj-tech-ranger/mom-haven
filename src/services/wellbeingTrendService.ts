import { getHealthLogs } from './healthLogService';
import { MoodType, MoodValues } from '../types/healthLog';

export interface MoodHistoryItem {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO string
  mood: MoodType;
  energyLevel?: number;
  notes?: string;
}

export interface WellbeingSummary {
  totalLogs: number;
  loggedDaysCount: number;
  timeframeDays: number;
  mostFrequentMood?: MoodType;
  harderDaysCount: number; // anxious, sad, overwhelmed
  positiveDaysCount: number; // calm, happy
  summaryText: string;
}

/**
 * Fetches private mood history for a mother over a specified number of days.
 * Strictly isolated from clinician-export pipelines.
 */
export async function getMoodHistory(
  userId: string,
  days: number = 30,
): Promise<MoodHistoryItem[]> {
  if (!userId) return [];

  const logs = await getHealthLogs(userId, { type: 'mood', limit: 120 });
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (days - 1));

  const items: MoodHistoryItem[] = [];

  for (const log of logs) {
    const logDate = new Date(log.timestamp);
    if (isNaN(logDate.getTime()) || logDate < cutoff) {
      continue;
    }

    const vals = log.values as MoodValues | undefined;
    if (!vals || !vals.mood) {
      continue;
    }

    items.push({
      id: log.id,
      date: logDate.toISOString().split('T')[0],
      timestamp: log.timestamp,
      mood: vals.mood,
      energyLevel: vals.energyLevel,
      notes: log.notes,
    });
  }

  // Sort ascending by timestamp for chronological calendar strip display
  return items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

/**
 * Derives a descriptive, non-fabricated summary of a mother's logged mood history.
 * Strictly describes what was logged without predictive or diagnostic claims.
 */
export function summarizeMoodHistory(
  history: MoodHistoryItem[],
  timeframeDays: number,
  language: 'en' | 'sw' = 'en',
): WellbeingSummary {
  const isSw = language === 'sw';

  if (!history || history.length === 0) {
    return {
      totalLogs: 0,
      loggedDaysCount: 0,
      timeframeDays,
      harderDaysCount: 0,
      positiveDaysCount: 0,
      summaryText: isSw
        ? 'Bado hakuna rekodi za hisia katika kipindi hiki.'
        : 'No mood logs recorded yet for this period.',
    };
  }

  const uniqueDates = new Set(history.map((h) => h.date));
  const counts: Record<MoodType, number> = {
    calm: 0,
    happy: 0,
    tired: 0,
    anxious: 0,
    sad: 0,
    overwhelmed: 0,
  };

  let harderDays = 0;
  let positiveDays = 0;

  // We consider the latest mood per day to avoid skewing if mother logged twice in one day
  const latestByDate = new Map<string, MoodHistoryItem>();
  history.forEach((item) => {
    latestByDate.set(item.date, item);
  });

  latestByDate.forEach((item) => {
    if (counts[item.mood] !== undefined) {
      counts[item.mood]++;
    }
    if (item.mood === 'anxious' || item.mood === 'sad' || item.mood === 'overwhelmed') {
      harderDays++;
    } else if (item.mood === 'calm' || item.mood === 'happy') {
      positiveDays++;
    }
  });

  // Determine top mood
  let topMood: MoodType = 'calm';
  let topCount = -1;
  (Object.keys(counts) as MoodType[]).forEach((m) => {
    if (counts[m] > topCount) {
      topCount = counts[m];
      topMood = m;
    }
  });

  const moodLabelsEn: Record<MoodType, string> = {
    calm: 'calm',
    happy: 'upbeat',
    tired: 'tired',
    anxious: 'anxious',
    sad: 'low',
    overwhelmed: 'stretched',
  };

  const moodLabelsSw: Record<MoodType, string> = {
    calm: 'utulivu',
    happy: 'furaha',
    tired: 'uchovu',
    anxious: 'wasiwasi',
    sad: 'huzuni',
    overwhelmed: 'kulemewa',
  };

  const timeframeLabelEn = timeframeDays <= 7 ? 'this week' : 'this month';
  const timeframeLabelSw = timeframeDays <= 7 ? 'wiki hii' : 'mwezi huu';

  let summaryText = '';
  if (isSw) {
    summaryText = `Zaidi ya yote ulihisi ${moodLabelsSw[topMood]} ${timeframeLabelSw}`;
    if (harderDays > 0) {
      summaryText += `, siku ${harderDays} zenye hisia nzito`;
    }
  } else {
    summaryText = `Mostly ${moodLabelsEn[topMood]} ${timeframeLabelEn}`;
    if (harderDays > 0) {
      summaryText += `, ${harderDays} harder day${harderDays > 1 ? 's' : ''}`;
    } else if (positiveDays > 0 && topMood !== 'calm' && topMood !== 'happy') {
      summaryText += `, ${positiveDays} uplifting day${positiveDays > 1 ? 's' : ''}`;
    }
  }

  return {
    totalLogs: history.length,
    loggedDaysCount: uniqueDates.size,
    timeframeDays,
    mostFrequentMood: topMood,
    harderDaysCount: harderDays,
    positiveDaysCount: positiveDays,
    summaryText,
  };
}
