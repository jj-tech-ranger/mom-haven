import { auth, signInAsGuest } from '../lib/firebase';
import { evaluateLayer1Deterministic, validateAiResponse, InterceptorResult } from './safetyInterceptor';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'haven';
  text: string;
  timestamp: string;
  isEscalation?: boolean;
  escalationData?: InterceptorResult;
  provenanceTag?: string;
  suggestedFollowups?: string[];
  sessionId?: string;
}

export interface MaternalContext {
  mode: 'PREGNANCY' | 'CHILD';
  gestationalWeeks?: number;
  edd?: string;
  childName?: string;
  childAgeMonths?: number;
  childAgeFormatted?: string;
  parity?: number;
  language?: 'en' | 'sw';
}

const SESSION_STORAGE_KEY = 'momhaven-haven-session-id';

function getStoredSessionId() {
  try { return window.localStorage.getItem(SESSION_STORAGE_KEY) || undefined; } catch { return undefined; }
}

function storeSessionId(sessionId?: string) {
  if (!sessionId) return;
  try { window.localStorage.setItem(SESSION_STORAGE_KEY, sessionId); } catch { /* storage may be unavailable */ }
}

export async function askHavenChat(userPrompt: string, _history: ChatMessage[], context: MaternalContext): Promise<ChatMessage> {
  const preferredLang = context.language || 'en';
  const safetyCheck = evaluateLayer1Deterministic(userPrompt);
  if (safetyCheck.blocked) {
    return {
      id: `haven-${Date.now()}`,
      sender: 'haven',
      text: safetyCheck.emergencyActionText || (preferredLang === 'sw' ? 'Swali hili linahitaji tathmini ya haraka ya daktari katika kituo cha afya.' : 'This query requires urgent clinical assessment.'),
      timestamp: new Date().toISOString(),
      isEscalation: true,
      escalationData: safetyCheck,
      provenanceTag: preferredLang === 'sw' ? 'Itifaki ya Usalama wa Kitabibu · Miongozo ya MOH Kenya' : 'Clinical Safety Protocol · Kenya MOH Guidelines',
    };
  }

  try {
    if (!auth.currentUser) await signInAsGuest();
    const user = auth.currentUser;
    if (!user) throw new Error('Unable to establish a Firebase session.');

    const idToken = await user.getIdToken();
    const sessionId = getStoredSessionId();
    const response = await fetch('/api/v1/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ sessionId, message: userPrompt, language: preferredLang, contextMode: context.mode }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Unable to reach Haven.');
    storeSessionId(payload.sessionId);

    if (payload.classification === 'emergency') {
      const emergency: InterceptorResult = {
        blocked: true,
        action: 'EMERGENCY_ESCALATION',
        dangerSignCategory: payload.handoff === 'self_harm_or_violence' ? 'SELF_HARM' : 'MOTHER',
        matchedPattern: payload.handoff,
        emergencyTitle: preferredLang === 'sw' ? 'Tahadhari ya Dharura' : 'Emergency Warning',
        emergencyActionText: preferredLang === 'sw'
          ? 'Dalili hizi zinahitaji msaada wa haraka wa ana kwa ana. Tafadhali nenda kituo cha afya au hospitali iliyo karibu sasa.'
          : 'These symptoms require urgent in-person care. Please go to the nearest appropriate health facility now.',
      };
      return { id: `haven-${Date.now()}`, sender: 'haven', text: emergency.emergencyActionText!, timestamp: new Date().toISOString(), isEscalation: true, escalationData: emergency, sessionId: payload.sessionId };
    }

    return {
      id: `haven-${Date.now()}`,
      sender: 'haven',
      text: validateAiResponse(String(payload.responseText || 'I am here with you. Please consult your local health facility for personalized care.')),
      timestamp: new Date().toISOString(),
      suggestedFollowups: Array.isArray(payload.suggestedFollowups) ? payload.suggestedFollowups : [],
      provenanceTag: preferredLang === 'sw' ? 'Miongozo ya Kitabu cha Afya ya Mama na Mtoto · MOH Kenya' : 'Kenya MOH Mother & Child Health Handbook Guidance',
      sessionId: payload.sessionId,
    };
  } catch (error) {
    console.error('Haven backend error:', error);
    return {
      id: `haven-${Date.now()}`,
      sender: 'haven',
      text: preferredLang === 'sw'
        ? 'Samahani, Haven haipatikani kwa sasa. Tafadhali jaribu tena baada ya muda mfupi. Ikiwa una dalili za hatari, nenda kituo cha afya mara moja.'
        : 'Sorry, Haven is temporarily unavailable. Please try again shortly. If you have danger signs, seek in-person care immediately.',
      timestamp: new Date().toISOString(),
      suggestedFollowups: [],
      provenanceTag: 'Kenya MOH Mother & Child Health Handbook Guidance',
    };
  }
}
