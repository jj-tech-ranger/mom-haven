import express from 'express';
import helmet from 'helmet';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { clinicianRouter } from './server/routes/clinician.js';
import { adminRouter } from './server/routes/admin.js';
import { classifyLayerOneRemote } from './server/safetyConfig.js';
import { adminAuth, adminDb } from './server/clinicianAccess.js';
import { buildHavenContext, formatHavenContext } from './server/services/havenContextBuilder.js';

const PORT = Number(process.env.PORT || 8080);
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'mom-haven';
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'europe-west1';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const ai = new GoogleGenAI({ vertexai: true, project: PROJECT_ID, location: GOOGLE_CLOUD_LOCATION });
const SYSTEM_INSTRUCTION = `You are Haven, MomHaven's supportive companion for Kenyan mothers navigating pregnancy and their child's first five years. You are not a doctor and you do not diagnose. Never provide a diagnosis, medication dose, or prescribing instruction. Keep answers short, warm, culturally grounded, and plain language. Defer Kenyan clinical schedules, thresholds and dosing to MomHaven records and clinicians. Use the supplied MomHaven context to make answers relevant, but respect provenance: user-reported personalization is not clinical confirmation. Never invent missing clinical facts.`;
const responseSchema = {
  type: 'object',
  properties: {
    classification: { type: 'string', enum: ['safe', 'medication_request', 'sensitive_topic', 'insufficient_info'] },
    responseText: { type: 'string' },
    suggestedFollowups: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 3 },
  },
  required: ['classification', 'responseText', 'suggestedFollowups'],
};

function doseLikeText(text: string) {
  return /\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|mL|milligrams?|micrograms?|grams?)\b/i.test(text);
}

async function getOrCreateSession(uid: string, requestedSessionId?: string) {
  if (requestedSessionId) {
    const existing = await adminDb.collection('havenSessions').doc(requestedSessionId).get();
    if (!existing.exists || existing.data()?.userId !== uid) throw new Error('This chat session is not yours.');
    return requestedSessionId;
  }
  const ref = adminDb.collection('havenSessions').doc();
  const now = new Date().toISOString();
  await ref.set({ userId: uid, createdAt: now, updatedAt: now });
  return ref.id;
}

async function startServer() {
  const app = express();
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false, crossOriginOpenerPolicy: false, crossOriginResourcePolicy: false }));
  app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
    next();
  });
  app.use(express.json({ limit: '20kb' }));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', project: PROJECT_ID, time: new Date().toISOString() }));
  app.use('/api/v1/clinician', clinicianRouter);
  app.use('/api/v1/admin', adminRouter);

  app.post('/api/v1/chat', async (req, res) => {
    try {
      const header = String(req.headers.authorization || '');
      if (!header.startsWith('Bearer ')) return res.status(401).json({ error: 'Sign-in required.' });
      const decoded = await adminAuth.verifyIdToken(header.slice(7));
      const uid = decoded.uid;
      const { sessionId: requestedSessionId, message, language } = req.body || {};
      const text = typeof message === 'string' ? message.trim() : '';
      if (!text || text.length > 4000) return res.status(400).json({ error: 'A valid message is required.' });

      const sessionId = await getOrCreateSession(uid, typeof requestedSessionId === 'string' ? requestedSessionId : undefined);
      const layer = await classifyLayerOneRemote(text);
      if (layer === 'physical_danger' || layer === 'self_harm_or_violence') {
        return res.json({ sessionId, classification: 'emergency', responseText: '', suggestedFollowups: [], handoff: layer });
      }

      const languageInstruction = language === 'sw'
        ? 'Respond in clear, natural Kenyan Kiswahili.'
        : 'Respond in clear, warm English unless the mother writes in Kiswahili, in which case respond in Kiswahili.';
      let context = 'MomHaven context is temporarily unavailable. Answer without personalized context and do not infer missing clinical facts.';
      try {
        context = formatHavenContext(await buildHavenContext(uid));
      } catch (contextError) {
        console.warn('Haven context unavailable; continuing without personalization', contextError);
      }
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: `${context}\n\nLanguage preference: ${language === 'sw' ? 'Kiswahili' : 'English'}\n${languageInstruction}\n\nMother's message:\n${text}`,
        config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: 'application/json', responseSchema, temperature: 0.4, maxOutputTokens: 600 },
      });
      let result: any;
      try { result = JSON.parse(response.text || '{}'); } catch { result = null; }
      if (!result?.responseText || !Array.isArray(result.suggestedFollowups) || result.suggestedFollowups.length !== 3) {
        return res.status(502).json({ error: 'Haven returned an invalid response.' });
      }
      if (doseLikeText(result.responseText)) {
        result.classification = 'medication_request';
        result.responseText = 'I can help you think about what to ask a clinician or pharmacist, but I cannot provide a medication dose or prescribing instruction.';
        result.suggestedFollowups = ['What should I tell the clinician?', 'What information should I bring?', 'When should I seek urgent help?'];
      }

      const now = new Date().toISOString();
      const sessionRef = adminDb.collection('havenSessions').doc(sessionId);
      const messageCollection = sessionRef.collection('messages');
      await messageCollection.add({ role: 'user', text, createdAt: now });
      await messageCollection.add({ role: 'assistant', text: result.responseText, classification: result.classification, suggestedFollowups: result.suggestedFollowups, createdAt: now });
      await sessionRef.update({ updatedAt: now, lastMessagePreview: text.slice(0, 140) });
      res.json({ sessionId, ...result });
    } catch (error: any) {
      console.error('Haven chat error', error);
      const status = error?.code?.startsWith?.('auth/') ? 401 : error?.message === 'This chat session is not yours.' ? 403 : 500;
      res.status(status).json({ error: error?.message || 'Unable to reach Haven.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => console.log(`MomHaven server running on port ${PORT}`));
}

startServer().catch((error) => {
  console.error('Failed to start MomHaven server', error);
  process.exit(1);
});
