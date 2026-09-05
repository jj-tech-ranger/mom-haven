import { Router, Request, Response } from 'express';
import * as otplib from 'otplib';
import { adminAuth, adminDb, ApiError, document, logAudit, requireActiveSession, requireClinician, serialize } from '../clinicianAccess.js';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { CLINICAL_RECORD_GROUPS, getPatientRecords } from '../services/patientRecordService.js';
import { getAuthorizedHealthSummary } from '../services/healthSummaryService.js';
import { getFacilityRoster, recomputeFacilityRoster } from '../services/facilityRosterService.js';

export const clinicianRouter = Router();

export const VERIFIABLE_RECORD_TYPES = [
  'ancEncounters',
  'newbornRecords',
  'postnatalEncounters',
  'immunizationRecords',
  'growthMeasurements',
  'muacMeasurements',
  'nutritionRecords',
  'developmentRecords',
] as const;

async function auth(req: Request) {
  const header = String(req.headers.authorization || '');
  if (!header.startsWith('Bearer ')) throw new ApiError(401, 'Sign-in required.');
  try { return await adminAuth.verifyIdToken(header.slice(7)); } catch { throw new ApiError(401, 'Sign-in required.'); }
}
function sendError(res: Response, e: any) { const status = e instanceof ApiError ? e.status : 500; res.status(status).json({ error: e?.message || 'Unable to complete request.' }); }
async function clinician(req: Request) { const token = await auth(req); await requireClinician(token.uid); return token; }
async function motherName(motherId: string) {
  const p = await adminDb.doc(`motherProfiles/${motherId}`).get();
  if (p.exists && p.data()?.fullName) return String(p.data()!.fullName);
  const u = await adminDb.doc(`users/${motherId}`).get();
  return String(u.data()?.displayName || u.data()?.email || 'Mother');
}

clinicianRouter.get('/me', async (req,res)=>{ try { const token=await auth(req); const c=await requireClinician(token.uid); res.json({uid:token.uid,clinician:serialize(c.clinician)}); } catch(e){sendError(res,e);} });
clinicianRouter.post('/verification', async (req,res)=>{ try { const token=await auth(req); if (!token.uid) throw new ApiError(401,'Sign-in required.'); const {licenseNumber,cadre,facilityId,facilityName,name,email}=req.body||{}; if(!String(licenseNumber||'').trim()||!String(cadre||'').trim()) throw new ApiError(400,'License number and cadre are required.'); const userUpdate: any = { role:'CLINICIAN' }; if(String(name||'').trim()) userUpdate.displayName = String(name).trim(); if(String(email||'').trim()) userUpdate.email = String(email).trim().toLowerCase(); await adminDb.doc(`users/${token.uid}`).set(userUpdate, {merge:true}); await adminDb.doc(`clinicians/${token.uid}`).set({uid:token.uid,name:String(name||'').trim()||token.name||null,email:String(email||'').trim().toLowerCase()||token.email||null,licenseNumber:String(licenseNumber).trim(),cadre:String(cadre).trim(),facilityId:facilityId||null,facilityName:facilityName||null,verificationStatus:'pending',createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()},{merge:true}); res.json({success:true,status:'pending'}); }catch(e){sendError(res,e);} });

clinicianRouter.get('/dashboard', async (req, res) => {
  try {
    const token = await clinician(req);
    const sessions = await adminDb.collection('clinicianAccessSessions').where('clinicianId', '==', token.uid).limit(100).get();
    const active = sessions.docs.filter(d => d.data().status === 'active' && d.data().expiresAt?.toDate?.() > new Date()).length;
    const expiring = sessions.docs.filter(d => d.data().status === 'active' && d.data().expiresAt?.toDate?.() <= new Date(Date.now() + 120000)).length;
    const audits = await adminDb.collection('auditEvents').where('actorId', '==', token.uid).orderBy('timestamp', 'desc').limit(20).get().catch(() => null);

    const recordSnaps = await Promise.all(
      VERIFIABLE_RECORD_TYPES.map(coll => adminDb.collectionGroup(coll).limit(1000).get().catch(() => ({ docs: [] })))
    );

    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    let pendingVerificationItems = 0;
    let encountersToday = 0;

    for (const snap of recordSnaps) {
      for (const doc of snap.docs) {
        const data = doc.data();
        const prov = data?.provenance;
        const enteredBy = prov?.enteredBy || data?.enteredBy;
        if (enteredBy !== token.uid) continue;

        if (prov?.status === 'REPORTED') {
          pendingVerificationItems++;
        }

        const c = data?.createdAt || prov?.enteredAt;
        const createdMs = c?.toDate ? c.toDate().getTime() : c instanceof Timestamp ? c.toMillis() : new Date(c || 0).getTime();
        if (createdMs >= oneDayAgo) {
          encountersToday++;
        }
      }
    }

    res.json({
      stats: {
        activeAccessSessions: active,
        pendingVerificationItems,
        encountersToday,
        alerts: expiring
      },
      activity: (audits?.docs || []).map(d => document(d.id, d.data()))
    });
  } catch (e) {
    sendError(res, e);
  }
});
clinicianRouter.get('/access-sessions', async(req,res)=>{try{const token=await clinician(req); const s=await adminDb.collection('clinicianAccessSessions').where('clinicianId','==',token.uid).limit(100).get(); res.json({items:await Promise.all(s.docs.map(async d=>document(d.id,{...d.data(),motherName:await motherName(String(d.data().motherId))})))});}catch(e){sendError(res,e);}});

clinicianRouter.post('/enter-code', async(req,res)=>{try{const token=await clinician(req); const code=String(req.body?.shareCode||'').replace(/\D/g,'').slice(0,6); if(code.length!==6) throw new ApiError(400,'Enter the 6-digit clinic share code.'); const snap=await adminDb.collection('clinicianAccessSessions').where('shareCode','==',code).where('status','==','active').limit(5).get(); if(snap.empty) throw new ApiError(404,'That code is invalid or has already been used.'); const d=snap.docs.find(x=>!x.data().clinicianId); if(!d) throw new ApiError(409,'That code has already been used.'); const s=d.data(); const expires=s.expiresAt?.toDate?.()||new Date(s.expiresAt); if(expires<=new Date()){await d.ref.update({status:'expired'}); throw new ApiError(410,'That code has expired. Ask the mother to generate a new one.');} res.json({sessionId:d.id,motherId:s.motherId,motherName:await motherName(String(s.motherId)),expiresAt:expires.toISOString(),scope:'Temporary clinical access to the records explicitly covered by this session.'});}catch(e){sendError(res,e);}});
clinicianRouter.post('/sessions/:id/claim', async(req,res)=>{try{const token=await clinician(req); const ref=adminDb.doc(`clinicianAccessSessions/${req.params.id}`); const d=await ref.get(); if(!d.exists) throw new ApiError(404,'Access session not found.'); const s=d.data()!; if(s.clinicianId&&s.clinicianId!==token.uid) throw new ApiError(409,'That code has already been used.'); const expires=s.expiresAt?.toDate?.()||new Date(s.expiresAt); if(s.status!=='active'||expires<=new Date()) throw new ApiError(410,'That code has expired. Ask the mother to generate a new one.'); await ref.update({clinicianId:token.uid}); await logAudit(token.uid,'CLINICIAN','ACCESS_SESSION_STARTED','clinicianAccessSessions',ref.id,s.facilityId||null,s.motherId); res.json({sessionId:ref.id,motherId:s.motherId,motherName:await motherName(String(s.motherId)),expiresAt:expires.toISOString()});}catch(e){sendError(res,e);}});
clinicianRouter.post('/sessions/:id/end', async(req,res)=>{try{const token=await clinician(req); const ref=adminDb.doc(`clinicianAccessSessions/${req.params.id}`); const d=await ref.get(); if(!d.exists||d.data()?.clinicianId!==token.uid) throw new ApiError(403,'Access session not found.'); await ref.update({status:'revoked'}); await logAudit(token.uid,'CLINICIAN','ACCESS_SESSION_ENDED','clinicianAccessSessions',ref.id,null,d.data()?.motherId||null); res.json({success:true});}catch(e){sendError(res,e);}});

clinicianRouter.get('/patients/:motherId/summary', async(req,res)=>{try{const token=await clinician(req); const motherId=req.params.motherId; const session=await requireActiveSession(token.uid,motherId); const healthSummary=await getAuthorizedHealthSummary(token.uid,motherId); const records=await getPatientRecords(motherId); await logAudit(token.uid,'CLINICIAN','VIEWED','patientSummary',motherId,session.facilityId||null,motherId); res.json({mother:{id:motherId,displayName:healthSummary.patientContext.preferredName||await motherName(motherId)},session:serialize(session),healthSummary:serialize(healthSummary),records});}catch(e){sendError(res,e);}});
clinicianRouter.get('/patients/:motherId/health-summary', async(req,res)=>{try{const token=await clinician(req); const motherId=req.params.motherId; const summary=await getAuthorizedHealthSummary(token.uid,motherId); res.json(serialize(summary));}catch(e){sendError(res,e);}});
clinicianRouter.get('/patients/:motherId/records/:type', async(req,res)=>{try{const token=await clinician(req); const motherId=req.params.motherId; await requireActiveSession(token.uid,motherId); if(!(CLINICAL_RECORD_GROUPS as readonly string[]).includes(req.params.type)) throw new ApiError(400,'Unsupported clinical record type.'); const q=await adminDb.collectionGroup(req.params.type).where('motherId','==',motherId).limit(200).get(); await logAudit(token.uid,'CLINICIAN','VIEWED',req.params.type,motherId,null,motherId); res.json({items:q.docs.map(d=>document(d.id,d.data()))});}catch(e){sendError(res,e);}});

clinicianRouter.get('/patients/:motherId/verification',async(req,res)=>{try{const token=await clinician(req);const mid=req.params.motherId;await requireActiveSession(token.uid,mid);const records=await getPatientRecords(mid);const pending:any[]=[];for(const [type,items] of Object.entries(records)){if(!Array.isArray(items))continue;(items as any[]).forEach(x=>{if(x.provenance?.status==='REPORTED')pending.push({type,id:x.id,...x});});}await logAudit(token.uid,'CLINICIAN','VIEWED','verificationQueue',mid,null,mid);res.json({items:pending});}catch(e){sendError(res,e);}});
clinicianRouter.post('/verify',async(req,res)=>{try{const token=await clinician(req);const {motherId,recordPath,recordId}=req.body||{};if(!motherId||!recordPath||!recordId)throw new ApiError(400,'motherId, recordPath and recordId are required.');await requireActiveSession(token.uid,motherId);const recordTypePattern=VERIFIABLE_RECORD_TYPES.join('|');const recordPathRegex=new RegExp(`^(pregnancies|children)\\/[^/]+\\/(${recordTypePattern})$`);if(recordPath.includes('..')||!recordPathRegex.test(recordPath))throw new ApiError(400,'Unsupported clinical record path.');const ref=adminDb.doc(`${recordPath}/${recordId}`);const d=await ref.get();if(!d.exists)throw new ApiError(404,'Record not found.');if(String(d.data()?.motherId||'')!==motherId)throw new ApiError(403,'Record is outside the authorized patient session.');await ref.update({'provenance.status':'VERIFIED','provenance.verifiedBy':token.uid,'provenance.verifiedAt':FieldValue.serverTimestamp()});await logAudit(token.uid,'CLINICIAN','VERIFIED',recordPath,recordId,null,motherId);res.json({success:true});}catch(e){sendError(res,e);}});

async function handleAncEncounter(token: any, body: any, res: any) {
  const { motherId, pregnancyId, date, visitNumber, gestationalWeeks, gestationalAgeWeeks, systolicBp, diastolicBp, bloodPressure, weightKg, weight, fundalHeight, fundalHeightCm, fetalHeartRate, fhr, hbLevel, hb, iptpGiven, iptp, ifasGiven, ifas, ironFolicGiven, clinicalNotes, notes, summary } = body || {};
  if (!motherId) throw new ApiError(400, 'motherId is required.');
  await requireActiveSession(token.uid, motherId);
  let targetPregId = pregnancyId;
  if (!targetPregId) {
    const snap = await adminDb.collection('pregnancies').where('motherId', '==', motherId).where('status', '==', 'active').limit(1).get();
    if (!snap.empty) targetPregId = snap.docs[0].id;
    else {
      const anyPreg = await adminDb.collection('pregnancies').where('motherId', '==', motherId).limit(1).get();
      if (!anyPreg.empty) targetPregId = anyPreg.docs[0].id;
    }
  }
  if (!targetPregId) throw new ApiError(400, 'pregnancyId is required for ANC encounter.');
  const pregnancy = await adminDb.doc(`pregnancies/${targetPregId}`).get();
  if (!pregnancy.exists || String(pregnancy.data()?.motherId || '') !== motherId) throw new ApiError(403, 'Pregnancy is outside the authorized patient session.');
  const now = FieldValue.serverTimestamp();
  const encounterDate = date || new Date().toISOString().split('T')[0];
  const bp = bloodPressure || (systolicBp && diastolicBp ? `${systolicBp}/${diastolicBp}` : undefined);
  const cleanSummary = String(clinicalNotes || summary || notes || '').trim();
  const encDoc: Record<string, any> = {
    motherId,
    pregnancyId: targetPregId,
    date: encounterDate,
    visitNumber: Number(visitNumber) || 1,
    gestationalAgeWeeks: gestationalWeeks != null && gestationalWeeks !== '' ? Number(gestationalWeeks) : (gestationalAgeWeeks != null && gestationalAgeWeeks !== '' ? Number(gestationalAgeWeeks) : undefined),
    gestationalWeeks: gestationalWeeks != null && gestationalWeeks !== '' ? Number(gestationalWeeks) : undefined,
    systolicBp: systolicBp != null && systolicBp !== '' ? Number(systolicBp) : undefined,
    diastolicBp: diastolicBp != null && diastolicBp !== '' ? Number(diastolicBp) : undefined,
    bloodPressure: bp,
    weight: weightKg != null && weightKg !== '' ? Number(weightKg) : (weight != null && weight !== '' ? Number(weight) : undefined),
    weightKg: weightKg != null && weightKg !== '' ? Number(weightKg) : (weight != null && weight !== '' ? Number(weight) : undefined),
    fundalHeight: fundalHeight != null && fundalHeight !== '' ? Number(fundalHeight) : (fundalHeightCm != null && fundalHeightCm !== '' ? Number(fundalHeightCm) : undefined),
    fundalHeightCm: fundalHeightCm != null && fundalHeightCm !== '' ? Number(fundalHeightCm) : (fundalHeight != null && fundalHeight !== '' ? Number(fundalHeight) : undefined),
    fetalHeartRate: fetalHeartRate != null && fetalHeartRate !== '' ? Number(fetalHeartRate) : (fhr != null && fhr !== '' ? Number(fhr) : undefined),
    fhr: fhr != null && fhr !== '' ? Number(fhr) : (fetalHeartRate != null && fetalHeartRate !== '' ? Number(fetalHeartRate) : undefined),
    hbLevel: hbLevel != null && hbLevel !== '' ? Number(hbLevel) : (hb != null && hb !== '' ? Number(hb) : undefined),
    hb: hb != null && hb !== '' ? Number(hb) : (hbLevel != null && hbLevel !== '' ? Number(hbLevel) : undefined),
    iptpGiven: Boolean(iptpGiven || iptp),
    iptp: Boolean(iptpGiven || iptp),
    ifasGiven: Boolean(ifasGiven || ifas || ironFolicGiven),
    ifas: Boolean(ifasGiven || ifas || ironFolicGiven),
    ironFolicGiven: Boolean(ifasGiven || ifas || ironFolicGiven),
    summary: cleanSummary || `ANC Contact #${Number(visitNumber) || 1}`,
    notes: cleanSummary,
    clinicalNotes: cleanSummary,
    provenance: {
      status: 'VERIFIED',
      enteredBy: token.uid,
      verifiedBy: token.uid,
      enteredAt: now,
      verifiedAt: now,
    },
    createdAt: now,
  };
  Object.keys(encDoc).forEach(k => encDoc[k] === undefined && delete encDoc[k]);
  const ref = adminDb.collection(`pregnancies/${targetPregId}/ancEncounters`).doc();
  await ref.set(encDoc);
  await logAudit(token.uid, 'CLINICIAN', 'CREATED', 'ancEncounters', ref.id, null, motherId);
  return res.json({ id: ref.id, type: 'anc' });
}

async function handlePncEncounter(token: any, body: any, res: any) {
  const { motherId, childId, pregnancyId, date, visit, timing, visitTiming, motherFindings, babyFindings, clinicalNotes, notes, summary } = body || {};
  if (!motherId) throw new ApiError(400, 'motherId is required.');
  await requireActiveSession(token.uid, motherId);
  let targetChildId = childId;
  let targetPregId = pregnancyId;
  if (!targetChildId && !targetPregId) {
    const chSnap = await adminDb.collection('children').where('motherId', '==', motherId).limit(1).get();
    if (!chSnap.empty) targetChildId = chSnap.docs[0].id;
    else {
      const prSnap = await adminDb.collection('pregnancies').where('motherId', '==', motherId).limit(1).get();
      if (!prSnap.empty) targetPregId = prSnap.docs[0].id;
    }
  }
  if (targetChildId) {
    const child = await adminDb.doc(`children/${targetChildId}`).get();
    if (!child.exists || String(child.data()?.motherId || '') !== motherId) throw new ApiError(403, 'Child is outside the authorized patient session.');
  } else if (targetPregId) {
    const preg = await adminDb.doc(`pregnancies/${targetPregId}`).get();
    if (!preg.exists || String(preg.data()?.motherId || '') !== motherId) throw new ApiError(403, 'Pregnancy is outside the authorized patient session.');
  } else {
    throw new ApiError(400, 'childId or pregnancyId is required for PNC encounter.');
  }
  const now = FieldValue.serverTimestamp();
  const encounterDate = date || new Date().toISOString().split('T')[0];
  const cleanNotes = String(clinicalNotes || summary || notes || '').trim();
  const pncDoc: Record<string, any> = {
    motherId,
    childId: targetChildId || null,
    pregnancyId: targetPregId || null,
    visit: visit || timing || visitTiming || '48h',
    visitTiming: visit || timing || visitTiming || '48h',
    date: encounterDate,
    visitDate: encounterDate,
    motherFindings: motherFindings || cleanNotes,
    babyFindings: babyFindings || cleanNotes,
    summary: cleanNotes || `PNC Contact (${visit || timing || visitTiming || '48h'})`,
    notes: cleanNotes,
    clinicalNotes: cleanNotes,
    provenance: {
      status: 'VERIFIED',
      enteredBy: token.uid,
      verifiedBy: token.uid,
      enteredAt: now,
      verifiedAt: now,
    },
    createdAt: now,
  };
  Object.keys(pncDoc).forEach(k => pncDoc[k] === undefined && delete pncDoc[k]);
  const subColPath = targetChildId ? `children/${targetChildId}/postnatalEncounters` : `pregnancies/${targetPregId}/postnatalEncounters`;
  const ref = adminDb.collection(subColPath).doc();
  await ref.set(pncDoc);
  await logAudit(token.uid, 'CLINICIAN', 'CREATED', 'postnatalEncounters', ref.id, null, motherId);
  return res.json({ id: ref.id, type: 'pnc' });
}

async function handleImmunizationEncounter(token: any, body: any, res: any) {
  const { motherId, childId, vaccineName, vaccine, recommendedAgeBracket, dose, ageBracket, dateAdministered, date, batchNumber, batch, facilityName, facilityId, notes, clinicalNotes } = body || {};
  if (!motherId) throw new ApiError(400, 'motherId is required.');
  await requireActiveSession(token.uid, motherId);
  let targetChildId = childId;
  if (!targetChildId) {
    const chSnap = await adminDb.collection('children').where('motherId', '==', motherId).limit(1).get();
    if (!chSnap.empty) targetChildId = chSnap.docs[0].id;
  }
  if (!targetChildId) throw new ApiError(400, 'childId is required for immunization records.');
  const child = await adminDb.doc(`children/${targetChildId}`).get();
  if (!child.exists || String(child.data()?.motherId || '') !== motherId) throw new ApiError(403, 'Child is outside the authorized patient session.');
  const vacName = String(vaccineName || vaccine || '').trim();
  if (!vacName) throw new ApiError(400, 'vaccineName is required.');
  const now = FieldValue.serverTimestamp();
  const encounterDate = dateAdministered || date || new Date().toISOString().split('T')[0];
  const vacDoc: Record<string, any> = {
    motherId,
    childId: targetChildId,
    vaccineName: vacName,
    vaccine: vacName,
    recommendedAgeBracket: recommendedAgeBracket || dose || ageBracket || '',
    dose: recommendedAgeBracket || dose || ageBracket || '',
    dateAdministered: encounterDate,
    dateGiven: encounterDate,
    batchNumber: String(batchNumber || batch || '').trim(),
    batch: String(batchNumber || batch || '').trim(),
    facilityName: facilityName || undefined,
    facilityId: facilityId || undefined,
    administeredBy: token.uid,
    status: 'GIVEN',
    notes: String(notes || clinicalNotes || '').trim(),
    provenance: {
      status: 'VERIFIED',
      enteredBy: token.uid,
      verifiedBy: token.uid,
      enteredAt: now,
      verifiedAt: now,
    },
    createdAt: now,
  };
  Object.keys(vacDoc).forEach(k => vacDoc[k] === undefined && delete vacDoc[k]);
  const ref = adminDb.collection(`children/${targetChildId}/immunizationRecords`).doc();
  await ref.set(vacDoc);
  await logAudit(token.uid, 'CLINICIAN', 'CREATED', 'immunizationRecords', ref.id, null, motherId);
  return res.json({ id: ref.id, type: 'immunization' });
}

async function handleGrowthEncounter(token: any, body: any, res: any) {
  const { motherId, childId, date, ageMonths, weightKg, childWeight, weight, heightCm, childHeight, height, muacCm, notes, clinicalNotes } = body || {};
  if (!motherId) throw new ApiError(400, 'motherId is required.');
  await requireActiveSession(token.uid, motherId);
  let targetChildId = childId;
  if (!targetChildId) {
    const chSnap = await adminDb.collection('children').where('motherId', '==', motherId).limit(1).get();
    if (!chSnap.empty) targetChildId = chSnap.docs[0].id;
  }
  if (!targetChildId) throw new ApiError(400, 'childId is required for growth measurements.');
  const child = await adminDb.doc(`children/${targetChildId}`).get();
  if (!child.exists || String(child.data()?.motherId || '') !== motherId) throw new ApiError(403, 'Child is outside the authorized patient session.');
  const w = Number(weightKg ?? childWeight ?? weight);
  if (isNaN(w) || w <= 0) throw new ApiError(400, 'Valid weightKg is required.');
  const h = heightCm != null && heightCm !== '' ? Number(heightCm) : (childHeight != null && childHeight !== '' ? Number(childHeight) : (height != null && height !== '' ? Number(height) : undefined));
  const m = muacCm != null && muacCm !== '' ? Number(muacCm) : undefined;
  const now = FieldValue.serverTimestamp();
  const encounterDate = date || new Date().toISOString().split('T')[0];
  const growthDoc: Record<string, any> = {
    motherId,
    childId: targetChildId,
    date: encounterDate,
    ageMonths: ageMonths != null && ageMonths !== '' ? Number(ageMonths) : undefined,
    weightKg: w,
    weight: w,
    heightCm: h,
    lengthCm: h,
    muacCm: m,
    notes: String(notes || clinicalNotes || '').trim(),
    provenance: {
      status: 'VERIFIED',
      enteredBy: token.uid,
      verifiedBy: token.uid,
      enteredAt: now,
      verifiedAt: now,
    },
    createdAt: now,
  };
  Object.keys(growthDoc).forEach(k => growthDoc[k] === undefined && delete growthDoc[k]);
  const ref = adminDb.collection(`children/${targetChildId}/growthMeasurements`).doc();
  await ref.set(growthDoc);
  if (m != null && !isNaN(m)) {
    let band = 'Normal';
    if (m < 11.5) band = 'SAM';
    else if (m < 12.5) band = 'MAM';
    else if (m < 13.5) band = 'AtRisk';
    const muacRef = adminDb.collection(`children/${targetChildId}/muacMeasurements`).doc();
    await muacRef.set({
      motherId,
      childId: targetChildId,
      date: encounterDate,
      cm: m,
      band,
      provenance: {
        status: 'VERIFIED',
        enteredBy: token.uid,
        verifiedBy: token.uid,
        enteredAt: now,
        verifiedAt: now,
      },
      createdAt: now,
    });
  }
  await logAudit(token.uid, 'CLINICIAN', 'CREATED', 'growthMeasurements', ref.id, null, motherId);
  return res.json({ id: ref.id, type: 'growth' });
}

async function handleCongenitalExam(token: any, body: any, res: any) {
  const {
    motherId,
    childId,
    examWindow,
    date,
    headSize,
    headSizeDetails,
    mouthGums,
    mouthGumsDetails,
    ears,
    earsDetails,
    armsLegs,
    armsLegsDetails,
    spineNeckBack,
    spineNeckBackDetails,
    bodyMovement,
    bodyMovementDetails,
    cerebralPalsyRisk,
    abdominalWall,
    abdominalWallDetails,
    genitalia,
    genitaliaDetails,
    anus,
    anusDetails,
    referralOrActionTaken,
    notes,
    examinerName,
    facilityName,
  } = body || {};

  if (!motherId) throw new ApiError(400, 'motherId is required.');
  await requireActiveSession(token.uid, motherId);

  let targetChildId = childId;
  if (!targetChildId) {
    const chSnap = await adminDb.collection('children').where('motherId', '==', motherId).limit(1).get();
    if (!chSnap.empty) targetChildId = chSnap.docs[0].id;
    else throw new ApiError(400, 'childId is required for congenital abnormality exam.');
  }

  const child = await adminDb.doc(`children/${targetChildId}`).get();
  if (!child.exists || String(child.data()?.motherId || '') !== motherId) {
    throw new ApiError(403, 'Child is outside the authorized patient session.');
  }

  const now = new Date().toISOString();
  const examDate = date || now.split('T')[0];

  const abnormalList: string[] = [];
  if (headSize && headSize !== 'normal') abnormalList.push(`Head size: ${headSize}${headSizeDetails ? ` (${headSizeDetails})` : ''}`);
  if (mouthGums && mouthGums !== 'normal') abnormalList.push(`Mouth/Gums: ${mouthGums}${mouthGumsDetails ? ` (${mouthGumsDetails})` : ''}`);
  if (ears && ears !== 'normal') abnormalList.push(`Ears: abnormal${earsDetails ? ` (${earsDetails})` : ''}`);
  if (armsLegs && armsLegs !== 'normal') abnormalList.push(`Arms/Legs: abnormal${armsLegsDetails ? ` (${armsLegsDetails})` : ''}`);
  if (spineNeckBack && spineNeckBack !== 'normal') abnormalList.push(`Spine/Neck/Back: abnormal${spineNeckBackDetails ? ` (${spineNeckBackDetails})` : ''}`);
  if (bodyMovement && bodyMovement !== 'normal') abnormalList.push(`Body movement: abnormal${bodyMovementDetails ? ` (${bodyMovementDetails})` : ''}`);
  if (cerebralPalsyRisk) abnormalList.push('Cerebral palsy risk / floppiness flagged');
  if (abdominalWall && abdominalWall !== 'normal') abnormalList.push(`Abdominal wall: abnormal${abdominalWallDetails ? ` (${abdominalWallDetails})` : ''}`);
  if (genitalia && genitalia !== 'normal') abnormalList.push(`Genitalia: abnormal${genitaliaDetails ? ` (${genitaliaDetails})` : ''}`);
  if (anus && anus !== 'perforate') abnormalList.push(`Anus: ${anus}${anusDetails ? ` (${anusDetails})` : ''}`);

  const hasAbnormality = abnormalList.length > 0;

  const docData: Record<string, any> = {
    motherId,
    childId: targetChildId,
    examWindow: examWindow === 'at6weeks' ? 'at6weeks' : 'within48h',
    date: examDate,
    examinerName: examinerName || token.email || 'Clinician',
    facilityName: facilityName || undefined,
    headSize: headSize || 'normal',
    headSizeDetails: headSizeDetails || undefined,
    mouthGums: mouthGums || 'normal',
    mouthGumsDetails: mouthGumsDetails || undefined,
    ears: ears || 'normal',
    earsDetails: earsDetails || undefined,
    armsLegs: armsLegs || 'normal',
    armsLegsDetails: armsLegsDetails || undefined,
    spineNeckBack: spineNeckBack || 'normal',
    spineNeckBackDetails: spineNeckBackDetails || undefined,
    bodyMovement: bodyMovement || 'normal',
    bodyMovementDetails: bodyMovementDetails || undefined,
    cerebralPalsyRisk: Boolean(cerebralPalsyRisk),
    abdominalWall: abdominalWall || 'normal',
    abdominalWallDetails: abdominalWallDetails || undefined,
    genitalia: genitalia || 'normal',
    genitaliaDetails: genitaliaDetails || undefined,
    anus: anus || 'perforate',
    anusDetails: anusDetails || undefined,
    hasAbnormality,
    abnormalFindingsList: abnormalList,
    referralOrActionTaken: referralOrActionTaken || undefined,
    notes: notes || undefined,
    provenance: {
      status: 'VERIFIED',
      enteredBy: token.uid,
      verifiedBy: token.uid,
      enteredAt: now,
      verifiedAt: now,
    },
    createdAt: now,
  };
  Object.keys(docData).forEach(k => docData[k] === undefined && delete docData[k]);

  const ref = adminDb.collection(`children/${targetChildId}/congenitalExams`).doc();
  await ref.set(docData);

  if (hasAbnormality) {
    await adminDb.doc(`children/${targetChildId}`).set({
      hasCongenitalAlert: true,
      lastAbnormalExamDate: examDate,
      abnormalFindingsSummary: abnormalList.join('; '),
      updatedAt: now,
    }, { merge: true });
  }

  await logAudit(token.uid, 'CLINICIAN', 'CREATED', 'congenitalExams', ref.id, null, motherId);
  return res.json({ id: ref.id, type: 'congenitalExam', hasAbnormality, abnormalFindingsList: abnormalList });
}

async function handleFamilyPlanning(token: any, body: any, res: any) {
  const {
    motherId,
    counselingDate,
    counselorName,
    facilityName,
    methodChosen,
    methodDetails,
    dateStarted,
    nextAppointmentDate,
    removalDate,
    adverseEffects,
    reasonForSwitch,
    notes,
  } = body || {};

  if (!motherId) throw new ApiError(400, 'motherId is required.');
  await requireActiveSession(token.uid, motherId);

  const now = new Date().toISOString();
  const cDate = counselingDate || now.split('T')[0];

  const docData: Record<string, any> = {
    motherId,
    counselingDate: cDate,
    counselorName: counselorName || token.email || 'Clinician',
    facilityName: facilityName || undefined,
    methodChosen: methodChosen || 'Counseling Only',
    methodDetails: methodDetails || undefined,
    dateStarted: dateStarted || undefined,
    nextAppointmentDate: nextAppointmentDate || undefined,
    removalDate: removalDate || undefined,
    adverseEffects: adverseEffects || undefined,
    reasonForSwitch: reasonForSwitch || undefined,
    notes: notes || undefined,
    provenance: {
      status: 'VERIFIED',
      enteredBy: token.uid,
      verifiedBy: token.uid,
      enteredAt: now,
      verifiedAt: now,
    },
    createdAt: now,
  };
  Object.keys(docData).forEach(k => docData[k] === undefined && delete docData[k]);

  const ref = adminDb.collection('familyPlanning').doc();
  await ref.set(docData);

  await adminDb.collection(`users/${motherId}/familyPlanning`).doc(ref.id).set(docData);

  await adminDb.doc(`motherProfiles/${motherId}`).set({
    activeFamilyPlanningMethod: methodChosen,
    familyPlanningNextAppt: nextAppointmentDate || null,
    updatedAt: now,
  }, { merge: true }).catch(() => {});

  await logAudit(token.uid, 'CLINICIAN', 'CREATED', 'familyPlanning', ref.id, null, motherId);
  return res.json({ id: ref.id, type: 'familyPlanning' });
}

async function handleCancerScreening(token: any, body: any, res: any) {
  const {
    motherId,
    date,
    facilityName,
    examinerName,
    cervicalDone,
    cervicalTestType,
    cervicalResult,
    cervicalTreatment,
    cervicalReferralFacility,
    cervicalNotes,
    breastDone,
    breastTestType,
    breastResult,
    breastTreatmentOrReferral,
    breastNotes,
    notes,
  } = body || {};

  if (!motherId) throw new ApiError(400, 'motherId is required.');
  await requireActiveSession(token.uid, motherId);

  const now = new Date().toISOString();
  const screenDate = date || now.split('T')[0];

  const alerts: string[] = [];
  const isCervicalPositive = cervicalResult === 'positive' || cervicalResult === 'suspicious';
  const isBreastSuspicious = breastResult === 'suspicious lump';

  if (isCervicalPositive) {
    alerts.push(`Cervical screening result flagged: ${cervicalResult} (${cervicalTestType || 'Screening'}). Referral/treatment indicated.`);
  }
  if (isBreastSuspicious) {
    alerts.push(`Breast examination flagged: ${breastResult} (${breastTestType || 'Clinical Breast Exam'}). Urgent referral indicated.`);
  }

  const hasPositiveOrSuspicious = isCervicalPositive || isBreastSuspicious;

  const record: Record<string, any> = {
    motherId,
    date: screenDate,
    facilityName: facilityName || undefined,
    examinerName: examinerName || token.email || 'Clinician',
    cervicalDone: Boolean(cervicalDone || cervicalTestType || cervicalResult),
    cervicalTestType: cervicalTestType || undefined,
    cervicalResult: cervicalResult || undefined,
    cervicalTreatment: cervicalTreatment || undefined,
    cervicalReferralFacility: cervicalReferralFacility || undefined,
    cervicalNotes: cervicalNotes || undefined,
    breastDone: Boolean(breastDone || breastTestType || breastResult),
    breastTestType: breastTestType || undefined,
    breastResult: breastResult || undefined,
    breastTreatmentOrReferral: breastTreatmentOrReferral || undefined,
    breastNotes: breastNotes || undefined,
    hasPositiveOrSuspicious,
    alerts,
    notes: notes || undefined,
    provenance: {
      status: 'VERIFIED',
      enteredBy: token.uid,
      verifiedBy: token.uid,
      enteredAt: now,
      verifiedAt: now,
    },
    createdAt: now,
  };
  Object.keys(record).forEach(k => record[k] === undefined && delete record[k]);

  const ref = adminDb.collection('cancerScreenings').doc();
  await ref.set(record);
  await adminDb.collection(`users/${motherId}/cancerScreenings`).doc(ref.id).set(record);

  if (hasPositiveOrSuspicious) {
    await adminDb.doc(`motherProfiles/${motherId}`).set({
      hasCancerScreeningAlert: true,
      lastCancerScreeningDate: screenDate,
      cancerScreeningAlerts: alerts,
      updatedAt: now,
    }, { merge: true }).catch(() => {});
  }

  await logAudit(token.uid, 'CLINICIAN', 'CREATED', 'cancerScreenings', ref.id, null, motherId);
  return res.json({ id: ref.id, type: 'cancerScreening', hasPositiveOrSuspicious, alerts });
}

async function handleAntenatalProfile(token: any, body: any, res: any) {
  const {
    motherId,
    pregnancyId,
    bloodGroup,
    rhesusFactor,
    urinalysisResult,
    bloodRbs,
    tbIcfScreeningOutcome,
    tbIptDate,
    tbIptNextVisit,
    partnerHivStatus,
    hivStatus,
    syphilisStatus,
    hepatitisBStatus,
    serologyRepeatSchedule,
    ultrasound1,
    ultrasound2,
  } = body || {};

  if (!motherId) throw new ApiError(400, 'motherId is required.');
  await requireActiveSession(token.uid, motherId);

  let targetPregId = pregnancyId;
  if (!targetPregId) {
    const snap = await adminDb.collection('pregnancies').where('motherId', '==', motherId).where('status', '==', 'active').limit(1).get();
    if (!snap.empty) targetPregId = snap.docs[0].id;
    else {
      const anyPreg = await adminDb.collection('pregnancies').where('motherId', '==', motherId).limit(1).get();
      if (!anyPreg.empty) targetPregId = anyPreg.docs[0].id;
    }
  }
  if (!targetPregId) throw new ApiError(400, 'pregnancyId is required for Antenatal Profile.');

  const now = new Date().toISOString();
  const profileDoc: Record<string, any> = {
    pregnancyId: targetPregId,
    motherId,
    bloodGroup: bloodGroup || undefined,
    rhesusFactor: rhesusFactor || undefined,
    urinalysisResult: urinalysisResult || undefined,
    bloodRbs: bloodRbs || undefined,
    tbIcfScreeningOutcome: tbIcfScreeningOutcome || undefined,
    tbIptDate: tbIptDate || undefined,
    tbIptNextVisit: tbIptNextVisit || undefined,
    partnerHivStatus: partnerHivStatus || undefined,
    hivStatus: hivStatus || undefined,
    syphilisStatus: syphilisStatus || undefined,
    hepatitisBStatus: hepatitisBStatus || undefined,
    serologyRepeatSchedule: Array.isArray(serologyRepeatSchedule) ? serologyRepeatSchedule : [],
    ultrasound1: ultrasound1 || undefined,
    ultrasound2: ultrasound2 || undefined,
    provenance: {
      status: 'VERIFIED',
      enteredBy: token.uid,
      verifiedBy: token.uid,
      enteredAt: now,
      verifiedAt: now,
    },
    updatedAt: now,
  };
  Object.keys(profileDoc).forEach(k => profileDoc[k] === undefined && delete profileDoc[k]);

  const ref = adminDb.collection('antenatalProfiles').doc(targetPregId);
  await ref.set(profileDoc, { merge: true });
  await adminDb.collection(`pregnancies/${targetPregId}/antenatalProfiles`).doc('profile').set(profileDoc, { merge: true });

  await logAudit(token.uid, 'CLINICIAN', 'UPDATED', 'antenatalProfiles', targetPregId, null, motherId);
  return res.json({ id: ref.id, type: 'antenatalProfile', success: true });
}

async function handleAefiReport(token: any, body: any, res: any) {
  const {
    motherId,
    childId,
    vaccineRecordId,
    date,
    vaccineOrAntigen,
    batchNumber,
    manufacturer,
    manufactureDate,
    expiryDate,
    adverseEventDescription,
    severity,
    facilityName,
    actionTaken,
  } = body || {};

  if (!motherId) throw new ApiError(400, 'motherId is required.');
  await requireActiveSession(token.uid, motherId);

  const now = new Date().toISOString();
  const reportDoc: Record<string, any> = {
    motherId,
    childId: childId || undefined,
    vaccineRecordId: vaccineRecordId || undefined,
    date: date || now.split('T')[0],
    vaccineOrAntigen: vaccineOrAntigen || 'Immunization',
    batchNumber: batchNumber || undefined,
    manufacturer: manufacturer || undefined,
    manufactureDate: manufactureDate || undefined,
    expiryDate: expiryDate || undefined,
    adverseEventDescription: adverseEventDescription || 'Reported AEFI',
    severity: severity || 'mild',
    reportedToFacility: true,
    facilityName: facilityName || undefined,
    reportedAt: now,
    actionTaken: actionTaken || undefined,
    provenance: {
      status: 'VERIFIED',
      enteredBy: token.uid,
      verifiedBy: token.uid,
      enteredAt: now,
      verifiedAt: now,
    },
    createdAt: now,
  };
  Object.keys(reportDoc).forEach(k => reportDoc[k] === undefined && delete reportDoc[k]);

  const ref = adminDb.collection('aefiReports').doc();
  await ref.set(reportDoc);
  if (childId) {
    await adminDb.collection(`children/${childId}/aefiReports`).doc(ref.id).set(reportDoc);
  }

  await logAudit(token.uid, 'CLINICIAN', 'CREATED', 'aefiReports', ref.id, null, motherId);
  return res.json({ id: ref.id, type: 'aefiReport', success: true });
}

async function handleHospitalAdmission(token: any, body: any, res: any) {
  const {
    motherId,
    childId,
    personType,
    hospitalName,
    admissionNumber,
    admissionDate,
    dischargeDate,
    dischargeDiagnosis,
    outcome,
    notes,
  } = body || {};

  if (!motherId) throw new ApiError(400, 'motherId is required.');
  await requireActiveSession(token.uid, motherId);

  const now = new Date().toISOString();
  const docData: Record<string, any> = {
    motherId,
    childId: childId || undefined,
    personType: personType || (childId ? 'child' : 'mother'),
    hospitalName: hospitalName || 'County Referral Hospital',
    admissionNumber: admissionNumber || 'IPD-001',
    admissionDate: admissionDate || now.split('T')[0],
    dischargeDate: dischargeDate || undefined,
    dischargeDiagnosis: dischargeDiagnosis || 'Clinical management',
    outcome: outcome || 'Discharged well',
    notes: notes || undefined,
    provenance: {
      status: 'VERIFIED',
      enteredBy: token.uid,
      verifiedBy: token.uid,
      enteredAt: now,
      verifiedAt: now,
    },
    createdAt: now,
  };
  Object.keys(docData).forEach(k => docData[k] === undefined && delete docData[k]);

  const ref = adminDb.collection('hospitalAdmissions').doc();
  await ref.set(docData);
  await logAudit(token.uid, 'CLINICIAN', 'CREATED', 'hospitalAdmissions', ref.id, null, motherId);
  return res.json({ id: ref.id, type: 'hospitalAdmission', success: true });
}

async function handleSpecialClinicalAttendance(token: any, body: any, res: any) {
  const {
    motherId,
    childId,
    personType,
    hospitalName,
    clinicName,
    date,
    reasonForAttendance,
    drugsGiven,
    dischargeDiagnosis,
    notes,
  } = body || {};

  if (!motherId) throw new ApiError(400, 'motherId is required.');
  await requireActiveSession(token.uid, motherId);

  const now = new Date().toISOString();
  const docData: Record<string, any> = {
    motherId,
    childId: childId || undefined,
    personType: personType || (childId ? 'child' : 'mother'),
    hospitalName: hospitalName || 'Specialist Clinic',
    clinicName: clinicName || 'Specialized Clinic',
    date: date || now.split('T')[0],
    reasonForAttendance: reasonForAttendance || 'Routine review',
    drugsGiven: drugsGiven || undefined,
    dischargeDiagnosis: dischargeDiagnosis || 'Follow-up completed',
    notes: notes || undefined,
    provenance: {
      status: 'VERIFIED',
      enteredBy: token.uid,
      verifiedBy: token.uid,
      enteredAt: now,
      verifiedAt: now,
    },
    createdAt: now,
  };
  Object.keys(docData).forEach(k => docData[k] === undefined && delete docData[k]);

  const ref = adminDb.collection('specialClinicalAttendances').doc();
  await ref.set(docData);
  await logAudit(token.uid, 'CLINICIAN', 'CREATED', 'specialClinicalAttendances', ref.id, null, motherId);
  return res.json({ id: ref.id, type: 'specialClinicalAttendance', success: true });
}

async function handleEyeCareAssessment(token: any, body: any, res: any) {
  const {
    childId,
    motherId,
    ageStage,
    date,
    teoGivenAtBirth,
    pupil,
    sightFollowing,
    squint,
    otherProblems,
    notes,
    facilityName,
  } = body || {};

  if (!motherId || !childId) throw new ApiError(400, 'motherId and childId are required.');
  await requireActiveSession(token.uid, motherId);

  const now = new Date().toISOString();
  const isUrgentWhitePupil = pupil === 'white';
  const hasAbnormality = isUrgentWhitePupil || sightFollowing === 'absent' || squint === 'present';

  const docData: Record<string, any> = {
    childId,
    motherId,
    ageStage: ageStage || 'birth',
    date: date || now.split('T')[0],
    teoGivenAtBirth: Boolean(teoGivenAtBirth),
    pupil: pupil || 'black',
    sightFollowing: sightFollowing || 'present',
    squint: squint || 'absent',
    otherProblems: otherProblems || undefined,
    isUrgentWhitePupil,
    hasAbnormality,
    notes: notes || undefined,
    facilityName: facilityName || undefined,
    provenance: {
      status: 'VERIFIED',
      enteredBy: token.uid,
      verifiedBy: token.uid,
      enteredAt: now,
      verifiedAt: now,
    },
    createdAt: now,
  };
  Object.keys(docData).forEach(k => docData[k] === undefined && delete docData[k]);

  const ref = adminDb.collection('eyeCareAssessments').doc();
  await ref.set(docData);
  await adminDb.collection(`children/${childId}/eyeCareAssessments`).doc(ref.id).set(docData);

  if (isUrgentWhitePupil) {
    await adminDb.doc(`children/${childId}`).set({
      hasEyeCareUrgentFlag: true,
      lastEyeCareAlert: 'Urgent White Pupil (Cataract / Retinoblastoma risk) detected',
      updatedAt: now,
    }, { merge: true }).catch(() => {});
  }

  await logAudit(token.uid, 'CLINICIAN', 'CREATED', 'eyeCareAssessments', ref.id, null, motherId);
  return res.json({ id: ref.id, type: 'eyeCareAssessment', isUrgentWhitePupil, hasAbnormality });
}

async function handleToothEruption(token: any, body: any, res: any) {
  const { childId, motherId, teeth } = body || {};
  if (!motherId || !childId) throw new ApiError(400, 'motherId and childId are required.');
  await requireActiveSession(token.uid, motherId);

  const now = new Date().toISOString();
  const docData = {
    childId,
    motherId,
    teeth: Array.isArray(teeth) ? teeth : [],
    updatedAt: now,
    provenance: {
      status: 'VERIFIED',
      enteredBy: token.uid,
      verifiedBy: token.uid,
      enteredAt: now,
      verifiedAt: now,
    },
  };

  const ref = adminDb.collection('toothEruptions').doc(childId);
  await ref.set(docData, { merge: true });
  await adminDb.collection(`children/${childId}/toothEruptions`).doc('current').set(docData, { merge: true });

  await logAudit(token.uid, 'CLINICIAN', 'UPDATED', 'toothEruptions', childId, null, motherId);
  return res.json({ id: ref.id, type: 'toothEruption', success: true });
}

async function handlePmtctHeiEncounter(token: any, body: any, res: any) {
  const {
    motherId,
    pregnancyId,
    childId,
    isHivExposed,
    maternalHivStatus,
    maternalArtStartDate,
    maternalBaselineRegimen,
    maternalArtVisits,
    maternalViralLoad,
    infantArtProphylaxis,
    infantCtxProphylaxis,
    infantIptGiven,
    infantIptDate,
    infantDbsTests,
    carePlanSummary,
    facilityName,
    notes,
  } = body || {};

  if (!motherId) throw new ApiError(400, 'motherId is required.');
  await requireActiveSession(token.uid, motherId);

  const now = new Date().toISOString();
  const alerts: string[] = [];

  // Check viral load suppression
  if (maternalViralLoad?.suppressionStatus === 'unsuppressed' || (typeof maternalViralLoad?.resultCopiesMl === 'number' && maternalViralLoad.resultCopiesMl >= 1000)) {
    alerts.push(`Maternal viral load unsuppressed (${maternalViralLoad?.resultCopiesMl || '>= 1,000'} copies/mL). Enhanced Adherence Counselling (EAC) and repeat VL indicated.`);
  }

  // Check any positive infant tests
  const positiveTests = Array.isArray(infantDbsTests) ? infantDbsTests.filter((t: any) => t.result === 'positive') : [];
  if (positiveTests.length > 0) {
    alerts.push(`HEI test positive (${positiveTests.map((t: any) => t.label || t.milestone).join(', ')}). Immediate confirmatory DNA PCR, baseline VL, and switch from prophylaxis to ART for life required.`);
  }

  const docData: Record<string, any> = {
    motherId,
    pregnancyId: pregnancyId || undefined,
    childId: childId || undefined,
    isHivExposed: Boolean(isHivExposed !== false),
    maternalHivStatus: maternalHivStatus || 'reactive',
    maternalArtStartDate: maternalArtStartDate || undefined,
    maternalBaselineRegimen: maternalBaselineRegimen || undefined,
    maternalArtVisits: Array.isArray(maternalArtVisits) ? maternalArtVisits : [],
    maternalViralLoad: maternalViralLoad || undefined,
    infantArtProphylaxis: infantArtProphylaxis || undefined,
    infantCtxProphylaxis: infantCtxProphylaxis || undefined,
    infantIptGiven: Boolean(infantIptGiven),
    infantIptDate: infantIptDate || undefined,
    infantDbsTests: Array.isArray(infantDbsTests) ? infantDbsTests : [],
    carePlanSummary: carePlanSummary || undefined,
    alerts,
    notes: notes || undefined,
    provenance: {
      status: 'VERIFIED',
      verifiedBy: token.uid,
      verifiedAt: now,
      facilityName: facilityName || undefined,
    },
    createdAt: now,
    updatedAt: now,
  };
  Object.keys(docData).forEach(k => docData[k] === undefined && delete docData[k]);

  const ref = adminDb.collection('pmtctRecords').doc();
  await ref.set(docData);
  await adminDb.collection(`users/${motherId}/pmtctRecords`).doc(ref.id).set(docData);

  // Update mother profile flags
  await adminDb.doc(`motherProfiles/${motherId}`).set({
    isHivExposed: true,
    pmtctAlerts: alerts,
    pmtctNextAppt: carePlanSummary?.nextAppointmentDate || null,
    updatedAt: now,
  }, { merge: true }).catch(() => {});

  await logAudit(token.uid, 'CLINICIAN', 'CREATED', 'pmtctRecords', ref.id, null, motherId);
  return res.json({ id: ref.id, type: 'pmtct', alerts, success: true });
}

// Router endpoints for all encounter types
clinicianRouter.post('/encounters/pmtct', async (req, res) => { try { const token = await clinician(req); await handlePmtctHeiEncounter(token, req.body, res); } catch (e) { sendError(res, e); } });
clinicianRouter.post('/pmtct-records', async (req, res) => { try { const token = await clinician(req); await handlePmtctHeiEncounter(token, req.body, res); } catch (e) { sendError(res, e); } });
clinicianRouter.post('/encounters/anc', async (req, res) => { try { const token = await clinician(req); await handleAncEncounter(token, req.body, res); } catch (e) { sendError(res, e); } });
clinicianRouter.post('/encounters/pnc', async (req, res) => { try { const token = await clinician(req); await handlePncEncounter(token, req.body, res); } catch (e) { sendError(res, e); } });
clinicianRouter.post('/encounters/immunization', async (req, res) => { try { const token = await clinician(req); await handleImmunizationEncounter(token, req.body, res); } catch (e) { sendError(res, e); } });
clinicianRouter.post('/encounters/growth', async (req, res) => { try { const token = await clinician(req); await handleGrowthEncounter(token, req.body, res); } catch (e) { sendError(res, e); } });
clinicianRouter.post('/encounters/congenital', async (req, res) => { try { const token = await clinician(req); await handleCongenitalExam(token, req.body, res); } catch (e) { sendError(res, e); } });
clinicianRouter.post('/congenital-exams', async (req, res) => { try { const token = await clinician(req); await handleCongenitalExam(token, req.body, res); } catch (e) { sendError(res, e); } });
clinicianRouter.post('/encounters/family-planning', async (req, res) => { try { const token = await clinician(req); await handleFamilyPlanning(token, req.body, res); } catch (e) { sendError(res, e); } });
clinicianRouter.post('/family-planning', async (req, res) => { try { const token = await clinician(req); await handleFamilyPlanning(token, req.body, res); } catch (e) { sendError(res, e); } });
clinicianRouter.post('/encounters/cancer-screening', async (req, res) => { try { const token = await clinician(req); await handleCancerScreening(token, req.body, res); } catch (e) { sendError(res, e); } });
clinicianRouter.post('/cancer-screenings', async (req, res) => { try { const token = await clinician(req); await handleCancerScreening(token, req.body, res); } catch (e) { sendError(res, e); } });
clinicianRouter.post('/encounters/antenatal-profile', async (req, res) => { try { const token = await clinician(req); await handleAntenatalProfile(token, req.body, res); } catch (e) { sendError(res, e); } });
clinicianRouter.post('/antenatal-profiles', async (req, res) => { try { const token = await clinician(req); await handleAntenatalProfile(token, req.body, res); } catch (e) { sendError(res, e); } });
clinicianRouter.post('/encounters/aefi', async (req, res) => { try { const token = await clinician(req); await handleAefiReport(token, req.body, res); } catch (e) { sendError(res, e); } });
clinicianRouter.post('/aefi-reports', async (req, res) => { try { const token = await clinician(req); await handleAefiReport(token, req.body, res); } catch (e) { sendError(res, e); } });
clinicianRouter.post('/encounters/hospital-admission', async (req, res) => { try { const token = await clinician(req); await handleHospitalAdmission(token, req.body, res); } catch (e) { sendError(res, e); } });
clinicianRouter.post('/hospital-admissions', async (req, res) => { try { const token = await clinician(req); await handleHospitalAdmission(token, req.body, res); } catch (e) { sendError(res, e); } });
clinicianRouter.post('/encounters/special-attendance', async (req, res) => { try { const token = await clinician(req); await handleSpecialClinicalAttendance(token, req.body, res); } catch (e) { sendError(res, e); } });
clinicianRouter.post('/special-attendances', async (req, res) => { try { const token = await clinician(req); await handleSpecialClinicalAttendance(token, req.body, res); } catch (e) { sendError(res, e); } });
clinicianRouter.post('/encounters/eye-care', async (req, res) => { try { const token = await clinician(req); await handleEyeCareAssessment(token, req.body, res); } catch (e) { sendError(res, e); } });
clinicianRouter.post('/eye-care-assessments', async (req, res) => { try { const token = await clinician(req); await handleEyeCareAssessment(token, req.body, res); } catch (e) { sendError(res, e); } });
clinicianRouter.post('/encounters/tooth-eruption', async (req, res) => { try { const token = await clinician(req); await handleToothEruption(token, req.body, res); } catch (e) { sendError(res, e); } });
clinicianRouter.post('/tooth-eruptions', async (req, res) => { try { const token = await clinician(req); await handleToothEruption(token, req.body, res); } catch (e) { sendError(res, e); } });

// Unified POST /encounters endpoint routing by type or properties
clinicianRouter.post('/encounters', async (req, res) => {
  try {
    const token = await clinician(req);
    const body = req.body || {};
    const encType = String(body.type || body.encounterType || '').toLowerCase();
    if (encType === 'cancerscreening' || encType === 'cancer_screening' || body.cervicalTestType || body.breastTestType) {
      return await handleCancerScreening(token, body, res);
    }
    if (encType === 'pmtct' || encType === 'hei' || body.maternalArtVisits || body.infantArtProphylaxis || body.infantDbsTests) {
      return await handlePmtctHeiEncounter(token, body, res);
    }
    if (encType === 'antenatalprofile' || encType === 'antenatal_profile' || body.bloodGroup || body.rhesusFactor || body.serologyRepeatSchedule) {
      return await handleAntenatalProfile(token, body, res);
    }
    if (encType === 'aefi' || encType === 'aefireport' || body.adverseEventDescription) {
      return await handleAefiReport(token, body, res);
    }
    if (encType === 'hospitaladmission' || encType === 'hospital_admission' || body.admissionNumber) {
      return await handleHospitalAdmission(token, body, res);
    }
    if (encType === 'specialattendance' || encType === 'special_attendance' || body.clinicName) {
      return await handleSpecialClinicalAttendance(token, body, res);
    }
    if (encType === 'eyecare' || encType === 'eye_care' || body.ageStage || body.pupil) {
      return await handleEyeCareAssessment(token, body, res);
    }
    if (encType === 'tootheruption' || encType === 'tooth_eruption' || body.teeth) {
      return await handleToothEruption(token, body, res);
    }
    if (encType === 'congenital' || encType === 'congenitalexam' || body.examWindow || body.headSize) {
      return await handleCongenitalExam(token, body, res);
    }
    if (encType === 'familyplanning' || encType === 'family_planning' || (body.methodChosen && !body.visitNumber)) {
      return await handleFamilyPlanning(token, body, res);
    }
    if (encType === 'pnc' || (!encType && body.visit && !body.visitNumber)) {
      return await handlePncEncounter(token, body, res);
    }
    if (encType === 'immunization' || (!encType && (body.vaccineName || body.vaccine || body.batchNumber))) {
      return await handleImmunizationEncounter(token, body, res);
    }
    if (encType === 'growth' || (!encType && (body.childWeight || (body.weightKg && body.childId && !body.pregnancyId)))) {
      return await handleGrowthEncounter(token, body, res);
    }
    return await handleAncEncounter(token, body, res);
  } catch (e) {
    sendError(res, e);
  }
});

clinicianRouter.get('/patients/:motherId/notes',async(req,res)=>{try{const token=await clinician(req);const mid=req.params.motherId;await requireActiveSession(token.uid,mid);const q=await adminDb.collection('clinicianPrivateNotes').where('motherId','==',mid).where('clinicianId','==',token.uid).limit(100).get();await logAudit(token.uid,'CLINICIAN','VIEWED','clinicianPrivateNotes',mid,null,mid);res.json({items:q.docs.map(d=>document(d.id,d.data()))});}catch(e){sendError(res,e);}});
clinicianRouter.post('/patients/:motherId/notes',async(req,res)=>{try{const token=await clinician(req);const mid=req.params.motherId;await requireActiveSession(token.uid,mid);const text=String(req.body?.text||'').trim();if(!text)throw new ApiError(400,'Note cannot be empty.');const ref=await adminDb.collection('clinicianPrivateNotes').add({motherId:mid,clinicianId:token.uid,text,createdAt:FieldValue.serverTimestamp()});await logAudit(token.uid,'CLINICIAN','PRIVATE_NOTE_CREATED','clinicianPrivateNotes',ref.id,null,mid);res.json({id:ref.id});}catch(e){sendError(res,e);}});
clinicianRouter.get('/audit',async(req,res)=>{try{const token=await clinician(req);const q=await adminDb.collection('auditEvents').where('actorId','==',token.uid).limit(200).get();res.json({items:q.docs.map(d=>document(d.id,d.data())).sort((a:any,b:any)=>String(b.timestamp||'').localeCompare(String(a.timestamp||'')))});}catch(e){sendError(res,e);}});

clinicianRouter.get(['/mfa/setup', '/clinician/mfa/setup'], async (req, res) => {
  try {
    const token = await clinician(req);
    const docRef = adminDb.doc(`clinicianMfaSecrets/${token.uid}`);
    const snap = await docRef.get();
    let secret = snap.exists ? snap.data()?.secret : null;
    if (!secret) {
      secret = otplib.generateSecret();
      await docRef.set({
        uid: token.uid,
        email: token.email || null,
        secret,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    const clinicianEmail = token.email || 'clinician@health.go.ke';
    const uri = `otpauth://totp/MomHaven%20MOH%20Clinician:${encodeURIComponent(clinicianEmail)}?secret=${secret}&issuer=MomHaven%20MOH`;
    res.json({
      success: true,
      enrolled: true,
      secret,
      uri,
      clinicianEmail,
    });
  } catch (e) {
    sendError(res, e);
  }
});

clinicianRouter.post(['/mfa/verify', '/clinician/mfa/verify'], async (req, res) => {
  try {
    const token = await clinician(req);
    const code = String(req.body?.code || '').trim();
    if (!code || !/^\d{6}$/.test(code)) {
      throw new ApiError(400, 'Security code must be a 6-digit numeric token.');
    }
    const docRef = adminDb.doc(`clinicianMfaSecrets/${token.uid}`);
    const snap = await docRef.get();
    let secret = snap.exists ? snap.data()?.secret : null;
    if (!secret) {
      secret = otplib.generateSecret();
      await docRef.set({
        uid: token.uid,
        email: token.email || null,
        secret,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    const verification = otplib.verifySync({ token: code, secret });
    if (!verification || !verification.valid) {
      throw new ApiError(401, 'Invalid security token. Please check the code on your authenticator app.');
    }

    await docRef.set({
      lastVerifiedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    await logAudit(token.uid, 'CLINICIAN', 'CLINICIAN_MFA_VERIFIED', 'clinicianMfaSecrets', token.uid);

    res.json({
      success: true,
      verified: true,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    sendError(res, e);
  }
});

clinicianRouter.get(['/caseload', '/clinician/caseload'], async (req, res) => {
  try {
    const token = await clinician(req);
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

    const sessionsSnap = await adminDb
      .collection('clinicianAccessSessions')
      .where('clinicianId', '==', token.uid)
      .limit(300)
      .get();

    const validSessions = sessionsSnap.docs.filter((doc) => {
      const data = doc.data();
      const exp = data.expiresAt?.toDate?.()?.getTime() || (data.expiresAt ? new Date(data.expiresAt).getTime() : 0);
      const crt = data.createdAt?.toDate?.()?.getTime() || (data.createdAt ? new Date(data.createdAt).getTime() : 0);
      const upd = data.updatedAt?.toDate?.()?.getTime() || (data.updatedAt ? new Date(data.updatedAt).getTime() : 0);
      const maxTime = Math.max(exp, crt, upd);
      return maxTime === 0 || maxTime >= ninetyDaysAgo;
    });

    const motherIds = Array.from(
      new Set(validSessions.map((d) => String(d.data().motherId || '').trim()).filter(Boolean))
    );

    if (motherIds.length === 0) {
      return res.json({ items: [], caseload: [] });
    }

    // Build child and pregnancy lookups for these mothers
    const childToMother = new Map<string, string>();
    const pregToMother = new Map<string, string>();

    await Promise.all(
      motherIds.map(async (mid) => {
        const [cSnap, pSnap] = await Promise.all([
          adminDb.collection('children').where('motherId', '==', mid).get().catch(() => ({ docs: [] } as any)),
          adminDb.collection('pregnancies').where('motherId', '==', mid).get().catch(() => ({ docs: [] } as any)),
        ]);
        cSnap.docs?.forEach((d: any) => childToMother.set(d.id, mid));
        pSnap.docs?.forEach((d: any) => pregToMother.set(d.id, mid));
      })
    );

    // CollectionGroup queries for encounters by this clinician
    const [ancCG, growthCG] = await Promise.all([
      adminDb.collectionGroup('ancEncounters').limit(1000).get().catch(() => ({ docs: [] } as any)),
      adminDb.collectionGroup('growthMeasurements').limit(1000).get().catch(() => ({ docs: [] } as any)),
    ]);

    const motherLatestEncounterTime = new Map<string, number>();

    const recordEncounter = (doc: any, isGrowth: boolean) => {
      const d = doc.data();
      const prov = d?.provenance;
      const enteredBy = prov?.enteredBy || d?.enteredBy;
      if (enteredBy !== token.uid) return;

      let mid = d?.motherId;
      if (!mid) {
        if (isGrowth) {
          const childId = d?.childId || doc.ref.parent?.parent?.id;
          if (childId && childToMother.has(childId)) mid = childToMother.get(childId);
        } else {
          const pregId = d?.pregnancyId || doc.ref.parent?.parent?.id;
          if (pregId && pregToMother.has(pregId)) mid = pregToMother.get(pregId);
        }
      }

      if (!mid || !motherIds.includes(mid)) return;

      const dateVal = d?.date || d?.encounterDate || d?.createdAt || prov?.enteredAt;
      let time = 0;
      if (dateVal?.toDate && typeof dateVal.toDate === 'function') {
        time = dateVal.toDate().getTime();
      } else if (dateVal) {
        const parsed = new Date(dateVal).getTime();
        if (!isNaN(parsed)) time = parsed;
      }

      if (time > 0) {
        const currentMax = motherLatestEncounterTime.get(mid) || 0;
        if (time > currentMax) {
          motherLatestEncounterTime.set(mid, time);
        }
      }
    };

    ancCG.docs?.forEach((d: any) => recordEncounter(d, false));
    growthCG.docs?.forEach((d: any) => recordEncounter(d, true));

    // Check danger signs in the last 14 days per mother
    const motherDangerSigns = new Map<string, boolean>();
    await Promise.all(
      motherIds.map(async (mid) => {
        try {
          const logSnap = await adminDb
            .collection('dailyHealthLogs')
            .where('userId', '==', mid)
            .limit(50)
            .get();

          let hasDanger = false;
          for (const doc of logSnap.docs) {
            const d = doc.data();
            const tVal = d.timestamp || d.createdAt || d.firestoreCreatedAt;
            let t = 0;
            if (tVal?.toDate) t = tVal.toDate().getTime();
            else if (tVal) t = new Date(tVal).getTime();

            if (t >= fourteenDaysAgo) {
              if (
                d.values?.hasDangerSigns === true ||
                d.hasDangerSigns === true ||
                (Array.isArray(d.values?.dangerSigns) && d.values.dangerSigns.length > 0) ||
                (Array.isArray(d.dangerSigns) && d.dangerSigns.length > 0)
              ) {
                hasDanger = true;
                break;
              }
            }
          }
          motherDangerSigns.set(mid, hasDanger);
        } catch {
          motherDangerSigns.set(mid, false);
        }
      })
    );

    const caseload = await Promise.all(
      motherIds.map(async (mid) => {
        const name = await motherName(mid);
        const lastTime = motherLatestEncounterTime.get(mid);
        const lastEncounterDate = lastTime ? new Date(lastTime).toISOString().split('T')[0] : null;
        const hasOpenDangerSign = Boolean(motherDangerSigns.get(mid));

        return {
          motherId: mid,
          motherName: name,
          lastEncounterDate,
          hasOpenDangerSign,
        };
      })
    );

    caseload.sort((a, b) => {
      if (a.hasOpenDangerSign && !b.hasOpenDangerSign) return -1;
      if (!a.hasOpenDangerSign && b.hasOpenDangerSign) return 1;
      const at = a.lastEncounterDate ? new Date(a.lastEncounterDate).getTime() : 0;
      const bt = b.lastEncounterDate ? new Date(b.lastEncounterDate).getTime() : 0;
      return bt - at;
    });

    res.json({ items: caseload, caseload });
  } catch (e) {
    sendError(res, e);
  }
});

clinicianRouter.get(['/facility-roster', '/clinician/facility-roster'], async (req, res) => {
  try {
    const token = await auth(req);
    const clinicianData = await requireClinician(token.uid);
    const facilityId = clinicianData.clinician.facilityId || String(req.query.facilityId || '').trim();
    if (!facilityId) {
      return res.json({ facilityId: null, facilityName: null, items: [] });
    }

    const items = await getFacilityRoster(facilityId);

    // Enrich with mother names
    const enriched = await Promise.all(
      items.map(async (entry) => {
        const name = await motherName(entry.motherId).catch(() => 'Mother');
        return {
          ...entry,
          motherName: name,
        };
      })
    );

    res.json({
      facilityId,
      facilityName: clinicianData.clinician.facilityName || `Facility ${facilityId}`,
      items: enriched,
    });
  } catch (e) {
    sendError(res, e);
  }
});

clinicianRouter.post(['/facility-roster/recompute', '/clinician/facility-roster/recompute'], async (req, res) => {
  try {
    const token = await auth(req);
    const clinicianData = await requireClinician(token.uid);
    const facilityId = clinicianData.clinician.facilityId || String(req.body?.facilityId || '').trim();
    if (!facilityId) {
      throw new ApiError(400, 'Clinician has no assigned facility.');
    }

    const items = await recomputeFacilityRoster(facilityId);
    const enriched = await Promise.all(
      items.map(async (entry) => {
        const name = await motherName(entry.motherId).catch(() => 'Mother');
        return {
          ...entry,
          motherName: name,
        };
      })
    );

    res.json({
      success: true,
      facilityId,
      facilityName: clinicianData.clinician.facilityName || `Facility ${facilityId}`,
      items: enriched,
    });
  } catch (e) {
    sendError(res, e);
  }
});
