// src/services/partnerContextService.ts
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { MoodType } from '../types/healthLog';

export interface PartnerShareData {
  moodSignal?: 'low' | 'ok' | 'good';
  energySignal?: 'low' | 'ok' | 'good';
  sharedAt: string;
  updatedAt?: string;
}

/**
 * Maps granular, confidential maternal mood into a coarse 3-level partner signal.
 * 
 * Clinical / Privacy Rule:
 * We intentionally NEVER expose the raw MoodType (e.g. 'anxious', 'sad', 'overwhelmed'),
 * journal notes, or detailed symptom logs to the partner.
 * 
 * - sad / overwhelmed / anxious -> 'low' (actionable for support)
 * - tired -> 'ok' (rest needed)
 * - calm / happy -> 'good' (thriving)
 */
export function moodToSignal(mood: MoodType): 'low' | 'ok' | 'good' {
  switch (mood) {
    case 'sad':
    case 'overwhelmed':
    case 'anxious':
      return 'low';
    case 'tired':
      return 'ok';
    case 'calm':
    case 'happy':
    default:
      return 'good';
  }
}

/**
 * Maps 1-5 energy rating to coarse signal
 */
export function energyToSignal(energy?: number): 'low' | 'ok' | 'good' | undefined {
  if (typeof energy !== 'number') return undefined;
  if (energy <= 2) return 'low';
  if (energy === 3) return 'ok';
  return 'good';
}

/**
 * Shared support guidance and tips for the partner, aligned with Kenyan maternal support guidelines.
 */
export const PARTNER_MOOD_TIPS: Record<'low' | 'ok' | 'good', {
  headline: string;
  headlineSw: string;
  description: string;
  descriptionSw: string;
  actionTips: { en: string; sw: string }[];
}> = {
  low: {
    headline: "She might be feeling a bit low today — here's how you can help",
    headlineSw: "Anaweza kuwa anajihisi mzito au amechoka leo — hivi ndivyo unavyoweza kumsaidia",
    description: "Pregnancy hormones, fatigue, and physical strain can cause emotional lows. Calm presence and practical support mean the world right now.",
    descriptionSw: "Homoni za ujauzito, uchovu na mzigo wa mwili unaweza kusababisha hisia za uzito. Uwepo wako tulivu na vitendo vidogo ni msaada mkubwa.",
    actionTips: [
      {
        en: "Take over household chores, cooking, or grocery runs without asking so she can rest.",
        sw: "Chukua majukumu ya nyumbani, mapishi au sokoni bila kuuliza ili apumzike."
      },
      {
        en: "Offer a warm cup of herbal tea or a gentle lower back / shoulder massage.",
        sw: "Mpatie kikombe cha chai ya tangawizi/maji ya uvuguvugu au mkande mgongo taratibu."
      },
      {
        en: "Listen patiently without trying to immediately fix everything — your reassuring presence is comfort.",
        sw: "Msikilize kwa subira bila kujaribu kurekebisha kila kitu mara moja — uwepo wako ni faraja tosha."
      }
    ]
  },
  ok: {
    headline: "She’s taking things one step at a time today",
    headlineSw: "Anaenda hatua kwa hatua kwa utulivu leo",
    description: "Energy may be moderate. Gentle check-ins and steady companionship keep her balanced.",
    descriptionSw: "Nguvu zake ni za wastani. Mazungumzo ya upole na usaidizi wa kawaida yatamfariji.",
    actionTips: [
      {
        en: "Ensure she has plenty of drinking water and nourishing snacks nearby.",
        sw: "Hakikisha ana maji safi ya kunywa na vitafunio vyenye lishe karibu naye."
      },
      {
        en: "Remind her gently to put her feet up and take a brief afternoon rest.",
        sw: "Mkumbushe kuinua miguu juu na kupumzika kidogo mchana."
      }
    ]
  },
  good: {
    headline: "She is feeling bright and grounded today!",
    headlineSw: "Anajihisi mwenye furaha na nguvu nzuri leo!",
    description: "A great day to celebrate progress, go for a relaxed evening walk, or plan upcoming milestones together.",
    descriptionSw: "Siku nzuri ya kufurahia maendeleo, kutembea kidogo jioni, au kupanga hatua zinazofuata pamoja.",
    actionTips: [
      {
        en: "Celebrate baby's weekly growth and affirm how strong she is doing.",
        sw: "Mpongeze kwa ukuaji wa mtoto na uthabiti wake katika safari hii."
      },
      {
        en: "Go for a peaceful 15-minute stroll together or prepare a favorite healthy meal.",
        sw: "Tembeeni pamoja kwa dakika 15 kwa amani au mwandalie chakula anachopenda."
      }
    ]
  }
};

/**
 * Writes/merges coarse mood & energy signals to partnerShares/{motherId}.
 * 
 * Strict Privacy Rule:
 * Payload is intentionally coarse. NEVER store raw MoodType, free-text notes,
 * or full daily health logs here.
 */
export async function updatePartnerShare(
  motherId: string,
  data: {
    moodSignal?: 'low' | 'ok' | 'good';
    energySignal?: 'low' | 'ok' | 'good';
    sharedAt: string;
  }
): Promise<void> {
  if (!motherId) return;
  try {
    const shareRef = doc(db, 'partnerShares', motherId);
    const payload: PartnerShareData = {
      sharedAt: data.sharedAt,
      updatedAt: new Date().toISOString(),
    };
    if (data.moodSignal) payload.moodSignal = data.moodSignal;
    if (data.energySignal) payload.energySignal = data.energySignal;

    await setDoc(shareRef, payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `partnerShares/${motherId}`);
    throw err;
  }
}

/**
 * Clears partnerShares/{motherId}.
 * Called when mother toggles moodSignal sharing off to provide immediate privacy assurance.
 */
export async function clearPartnerShare(motherId: string): Promise<void> {
  if (!motherId) return;
  try {
    const shareRef = doc(db, 'partnerShares', motherId);
    await deleteDoc(shareRef);
  } catch (err) {
    // If doc didn't exist or couldn't delete, ignore silently
    console.warn(`Could not delete partnerShares/${motherId}`, err);
  }
}

/**
 * Reads partnerShares/{motherId} for partner display.
 * Permitted by firestore.rules line 25:
 * match /partnerShares/{motherId}{allow read:if owner(motherId)||activePartner(motherId); ...}
 */
export async function getPartnerShare(motherId: string): Promise<PartnerShareData | null> {
  if (!motherId) return null;
  try {
    const shareRef = doc(db, 'partnerShares', motherId);
    const snap = await getDoc(shareRef);
    if (snap.exists()) {
      return snap.data() as PartnerShareData;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `partnerShares/${motherId}`);
    return null;
  }
}
