import express from 'express';
import helmet from 'helmet';
import { GoogleGenAI } from '@google/genai';
import { clinicianRouter } from './routes/clinician.js';
import { adminRouter } from './routes/admin.js';
import { classifyLayerOneRemote } from './safetyConfig.js';

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://firebasestorage.googleapis.com'],
      connectSrc: ["'self'", 'https://*.googleapis.com', 'https://*.firebaseio.com', 'https://identitytoolkit.googleapis.com'],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
}));

app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  next();
});

app.use(express.json({ limit: '20kb' }));
app.use('/api/v1/clinician', clinicianRouter);
app.use('/api/v1/admin', adminRouter);

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'mom-haven';
const DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || 'ai-studio-momhaven-f2316da7-8f94-4e5d-9e6f-cc82c1066c72';
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents`;
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;
const SYSTEM_INSTRUCTION = `You are Haven, MomHaven's supportive companion for Kenyan mothers navigating pregnancy and their child's first five years. You are not a doctor and you do not diagnose. Never provide a diagnosis, medication dose, or prescribing instruction. Keep answers short, warm, and plain English. Defer Kenyan clinical schedules, thresholds and dosing to MomHaven records and clinicians.`;
const responseSchema = { type:'object', properties:{ classification:{type:'string',enum:['safe','medication_request','sensitive_topic','insufficient_info']}, responseText:{type:'string'}, suggestedFollowups:{type:'array',items:{type:'string'},minItems:3,maxItems:3}}, required:['classification','responseText','suggestedFollowups'] };
function firestoreValue(value: unknown): Record<string, unknown> { if(value===null||value===undefined)return{nullValue:null}; if(typeof value==='string')return{stringValue:value}; if(typeof value==='boolean')return{booleanValue:value}; if(typeof value==='number')return{doubleValue:value}; if(value instanceof Date)return{timestampValue:value.toISOString()}; return{stringValue:String(value)}; }
function fromFirestoreValue(value:any):any{if(!value)return null;if('stringValue'in value)return value.stringValue;if('integerValue'in value)return Number(value.integerValue);if('doubleValue'in value)return Number(value.doubleValue);if('booleanValue'in value)return value.booleanValue;if('timestampValue'in value)return value.timestampValue;if('nullValue'in value)return null;if('mapValue'in value)return Object.fromEntries(Object.entries(value.mapValue.fields||{}).map(([k,v])=>[k,fromFirestoreValue(v)]));if('arrayValue'in value)return(value.arrayValue.values||[]).map(fromFirestoreValue);return null;}
function documentToObject(document:any){return Object.fromEntries(Object.entries(document.fields||{}).map(([key,value])=>[key,fromFirestoreValue(value)]));}
async function verifyIdToken(idToken:string){if(!FIREBASE_API_KEY)throw new Error('Firebase API is not configured');const r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(FIREBASE_API_KEY)}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({idToken})});if(!r.ok)throw new Error('Invalid Firebase session');const d=await r.json();const u=d.users?.[0];if(!u?.localId)throw new Error('Invalid Firebase session');return{uid:u.localId,email:u.email||null};}
async function runQuery(idToken:string,structuredQuery:any){const r=await fetch(`${FIRESTORE_BASE}:runQuery`,{method:'POST',headers:{authorization:`Bearer ${idToken}`,'content-type':'application/json'},body:JSON.stringify({structuredQuery})});if(!r.ok)throw new Error(`Firestore query failed (${r.status})`);const rows=await r.json();return rows.filter((x:any)=>x.document).map((x:any)=>({id:x.document.name.split('/').pop(),...documentToObject(x.document)}));}
async function getDocument(idToken:string,path:string){const r=await fetch(`${FIRESTORE_BASE}/${path}`,{headers:{authorization:`Bearer ${idToken}`}});if(r.status===404)return null;if(!r.ok)throw new Error(`Firestore read failed (${r.status})`);return documentToObject(await r.json());}
async function writeDocument(idToken:string,path:string,fields:Record<string,unknown>){const r=await fetch(`${FIRESTORE_BASE}/${path}`,{method:'POST',headers:{authorization:`Bearer ${idToken}`,'content-type':'application/json'},body:JSON.stringify({fields:Object.fromEntries(Object.entries(fields).map(([k,v])=>[k,firestoreValue(v)]))})});if(!r.ok)throw new Error(`Firestore write failed (${r.status})`);return r.json();}
async function patchDocument(idToken:string,path:string,fields:Record<string,unknown>){const masks=Object.keys(fields).map(k=>`updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');const r=await fetch(`${FIRESTORE_BASE}/${path}?${masks}`,{method:'PATCH',headers:{authorization:`Bearer ${idToken}`,'content-type':'application/json'},body:JSON.stringify({fields:Object.fromEntries(Object.entries(fields).map(([k,v])=>[k,firestoreValue(v)]))})});if(!r.ok)throw new Error(`Firestore update failed (${r.status})`);}
function doseLikeText(text:string){return /\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|mL|milligrams?|micrograms?|grams?)\b/i.test(text);}
async function resolveContext(idToken:string,uid:string){const eq=(field:string)=>({fieldFilter:{field:{fieldPath:field},op:'EQUAL',value:{stringValue:uid}}});const[pregnancies,children]=await Promise.all([runQuery(idToken,{from:[{collectionId:'pregnancies'}],where:eq('motherId'),limit:25}),runQuery(idToken,{from:[{collectionId:'children'}],where:eq('motherId'),limit:25})]);const p=pregnancies.find((x:any)=>x.status==='active');if(p)return`This mother has an active pregnancy on record.`;if(children[0])return`This mother has a child on record.`;return'No active pregnancy or child context is currently recorded.';}

app.post('/api/v1/chat',async(req,res)=>{try{const h=String(req.headers.authorization||'');if(!h.startsWith('Bearer '))return res.status(401).json({error:'Sign-in required.'});const idToken=h.slice(7);const{uid}=await verifyIdToken(idToken);const{sessionId,message}=req.body||{};const text=typeof message==='string'?message.trim():'';if(!sessionId||!text||text.length>4000)return res.status(400).json({error:'A valid sessionId and message are required.'});const session=await getDocument(idToken,`havenSessions/${encodeURIComponent(sessionId)}`);if(!session||session.userId!==uid)return res.status(403).json({error:'This chat session is not yours.'});const layer=await classifyLayerOneRemote(text);if(layer==='physical_danger')return res.json({classification:'emergency',responseText:'',suggestedFollowups:[],handoff:'physical_danger'});if(layer==='self_harm_or_violence')return res.json({classification:'emergency',responseText:'',suggestedFollowups:[],handoff:'self_harm_or_violence'});if(!ai)return res.status(503).json({error:'Haven is not configured yet.'});const context=await resolveContext(idToken,uid);const response=await ai.models.generateContent({model:GEMINI_MODEL,contents:`${context}\n\nMother's message:\n${text}`,config:{systemInstruction:SYSTEM_INSTRUCTION,responseMimeType:'application/json',responseSchema}});let result:any;try{result=JSON.parse(response.text||'{}')}catch{result=null}if(!result?.responseText||!Array.isArray(result.suggestedFollowups)||result.suggestedFollowups.length!==3)return res.status(502).json({error:'Haven returned an invalid response.'});if(doseLikeText(result.responseText)){result.classification='medication_request';result.responseText='I can help you think about what to ask a clinician or pharmacist, but I cannot provide a medication dose or prescribing instruction.';result.suggestedFollowups=['What should I tell the clinician?','What information should I bring?','When should I seek urgent help?'];}const now=new Date().toISOString();await writeDocument(idToken,`havenSessions/${encodeURIComponent(sessionId)}/messages`,{role:'user',text,createdAt:now});await writeDocument(idToken,`havenSessions/${encodeURIComponent(sessionId)}/messages`,{role:'assistant',text:result.responseText,classification:result.classification,suggestedFollowups:result.suggestedFollowups,createdAt:now});await patchDocument(idToken,`havenSessions/${encodeURIComponent(sessionId)}`,{updatedAt:now,lastMessagePreview:text.slice(0,140)});res.json(result);}catch(e:any){console.error('Haven chat error',e);res.status(e?.message==='Invalid Firebase session'?401:500).json({error:e?.message||'Unable to reach Haven.'});}});
const port=Number(process.env.PORT||8787);app.listen(port,()=>console.log(`MomHaven API listening on ${port}`));
