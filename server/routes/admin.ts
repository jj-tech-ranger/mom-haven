import { Router, Request, Response } from 'express';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminAuth, adminDb, ApiError, logAudit, serialize } from '../clinicianAccess.js';
import { invalidateSafetyCache } from '../safetyConfig.js';
import * as otplib from 'otplib';

export const adminRouter=Router();
async function requireAdmin(req:Request){const h=String(req.headers.authorization||'');if(!h.startsWith('Bearer '))throw new ApiError(401,'Sign-in required.');let token;try{token=await adminAuth.verifyIdToken(h.slice(7));}catch{throw new ApiError(401,'Sign-in required.');}const user=await adminDb.doc(`users/${token.uid}`).get();if(!user.exists||user.data()?.role!=='ADMIN')throw new ApiError(403,'Admin access required.');return token;}
function sendError(res:Response,e:any){res.status(e instanceof ApiError?e.status:500).json({error:e?.message||'Unable to complete request.'});}
const clean=(x:any)=>serialize(x);
const list=async(name:string,limit=1000)=>{const q=await adminDb.collection(name).limit(limit).get();return q.docs.map(d=>({id:d.id,...clean(d.data())}));};

adminRouter.get('/dashboard',async(req,res)=>{try{const token=await requireAdmin(req);const[facilities,clinicians,governance,gates,audits]=await Promise.all([adminDb.collection('facilities').limit(1000).get(),adminDb.collection('clinicians').limit(1000).get(),adminDb.collection('clinicalDecisionRegister').limit(1000).get(),adminDb.collection('releaseGates').limit(100).get(),adminDb.collection('auditEvents').limit(500).get()]);const weekAgo=Date.now()-7*24*60*60*1000;const safetyAlerts=audits.docs.filter(d=>{const x=d.data();const t=x.timestamp instanceof Timestamp?x.timestamp.toDate().getTime():new Date(x.timestamp||0).getTime();return t>=weekAgo&&String(x.action||'').toUpperCase().includes('SAFETY');}).length;const pending=clinicians.docs.filter(d=>d.data()?.verificationStatus==='pending').length;const openGovernance=governance.docs.filter(d=>!['approved','clinically_reviewed','source_verified','closed','verified'].includes(String(d.data()?.status||'').toLowerCase())).length;const gatesOut=gates.docs.map(d=>({id:d.id,...clean(d.data())}));const assessed=gatesOut.filter(g=>g.status&&!['unassessed','pending'].includes(String(g.status).toLowerCase())).length;const activity=audits.docs.map(d=>d.data()).filter(x=>{const t=String(x.objectType||'').toLowerCase();return!['pregnan','child','patient','haven','clinicalrecord','privatenote'].some(v=>t.includes(v));}).sort((a,b)=>{const at=a.timestamp instanceof Timestamp?a.timestamp.toMillis():new Date(a.timestamp||0).getTime();const bt=b.timestamp instanceof Timestamp?b.timestamp.toMillis():new Date(b.timestamp||0).getTime();return bt-at;}).slice(0,20).map(x=>({time:clean(x.timestamp),actorId:String(x.actorId||''),action:String(x.action||''),detail:`${String(x.objectType||'')} · ${String(x.objectId||'')}`}));res.json({stats:{activeFacilities:facilities.size,pendingClinicianVerification:pending,openGovernanceItems:openGovernance,safetyAlertsThisWeek:safetyAlerts},release:{gates:gatesOut,total:gatesOut.length,assessed},activity,scope:'National'});await logAudit(token.uid,'ADMIN','ADMIN_DASHBOARD_VIEWED','adminDashboard',token.uid);}catch(e){sendError(res,e);}});

adminRouter.get('/facilities',async(req,res)=>{try{await requireAdmin(req);res.json({items:await list('facilities')});}catch(e){sendError(res,e);}});
adminRouter.post('/facilities',async(req,res)=>{try{const token=await requireAdmin(req);const b=req.body||{};const required=['name','kmhflCode','county','subcounty','contactPhone'];if(required.some(k=>!String(b[k]||'').trim()))throw new ApiError(400,'Name, KMHFL code, county, subcounty and contact phone are required.');const ref=adminDb.collection('facilities').doc();await ref.set({name:String(b.name).trim(),kmhflCode:String(b.kmhflCode).trim(),county:String(b.county).trim(),subcounty:String(b.subcounty).trim(),contactPhone:String(b.contactPhone).trim(),level:b.level?String(b.level).trim():null,ambulanceAvailable:b.ambulanceAvailable===true,maternityWardAvailable:b.maternityWardAvailable===true,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});await logAudit(token.uid,'ADMIN','FACILITY_CREATED','facilities',ref.id);res.status(201).json({id:ref.id});}catch(e){sendError(res,e);}});
adminRouter.patch('/facilities/:id',async(req,res)=>{try{const token=await requireAdmin(req);const ref=adminDb.doc(`facilities/${req.params.id}`);if(!(await ref.get()).exists)throw new ApiError(404,'Facility not found.');const allowed=['name','kmhflCode','county','subcounty','contactPhone','level','ambulanceAvailable','maternityWardAvailable'];const patch:any={};for(const k of allowed)if(req.body?.[k]!==undefined)patch[k]=typeof req.body[k]==='string'?req.body[k].trim():req.body[k];patch.updatedAt=FieldValue.serverTimestamp();await ref.update(patch);await logAudit(token.uid,'ADMIN','FACILITY_UPDATED','facilities',ref.id);res.json({success:true});}catch(e){sendError(res,e);}});

adminRouter.get('/clinicians',async(req,res)=>{try{await requireAdmin(req);const q=await adminDb.collection('clinicians').limit(1000).get();const items=await Promise.all(q.docs.map(async d=>{const c=d.data();const u=await adminDb.doc(`users/${d.id}`).get();return{id:d.id,...clean(c),displayName:u.data()?.displayName||u.data()?.email||d.id,email:u.data()?.email||''};}));res.json({items});}catch(e){sendError(res,e);}});
adminRouter.get('/clinicians/:id',async(req,res)=>{try{await requireAdmin(req);const c=await adminDb.doc(`clinicians/${req.params.id}`).get();if(!c.exists)throw new ApiError(404,'Clinician not found.');const u=await adminDb.doc(`users/${req.params.id}`).get();res.json({clinician:{id:c.id,...clean(c.data()),displayName:u.data()?.displayName||u.data()?.email||c.id,email:u.data()?.email||''}});}catch(e){sendError(res,e);}});
async function clinicianStatus(req:Request,res:Response,status:'approved'|'rejected'|'suspended'){try{const token=await requireAdmin(req);const ref=adminDb.doc(`clinicians/${req.params.clinicianId}`);const snap=await ref.get();if(!snap.exists)throw new ApiError(404,'Clinician not found.');const patch:any={verificationStatus:status,updatedAt:FieldValue.serverTimestamp()};if(status==='rejected')patch.rejectionReason=String(req.body?.reason||'').trim()||'Verification request was not approved.';await ref.update(patch);await logAudit(token.uid,'ADMIN',status==='approved'?'CLINICIAN_APPROVED':status==='rejected'?'CLINICIAN_REJECTED':'CLINICIAN_SUSPENDED','clinicians',ref.id,snap.data()?.facilityId||null);res.json({success:true,verificationStatus:status});}catch(e){sendError(res,e);}}
adminRouter.post('/clinician/:clinicianId/approve',(q,s)=>void clinicianStatus(q,s,'approved'));adminRouter.post('/clinician/:clinicianId/reject',(q,s)=>void clinicianStatus(q,s,'rejected'));adminRouter.post('/clinician/:clinicianId/suspend',(q,s)=>void clinicianStatus(q,s,'suspended'));

adminRouter.get('/governance',async(req,res)=>{try{await requireAdmin(req);res.json({items:await list('clinicalDecisionRegister',500)});}catch(e){sendError(res,e);}});
adminRouter.get('/governance/:id',async(req,res)=>{try{await requireAdmin(req);const s=await adminDb.doc(`clinicalDecisionRegister/${req.params.id}`).get();if(!s.exists)throw new ApiError(404,'Clinical rule not found.');res.json({item:{id:s.id,...clean(s.data())}});}catch(e){sendError(res,e);}});
adminRouter.patch('/governance/:id',async(req,res)=>{try{const token=await requireAdmin(req);const status=String(req.body?.status||'');const allowed=['proposed','open','source_verified','needs_clinical_review','citation_not_verified','clinically_reviewed','approved','implemented','tested','blocked','deferred','retired'];if(!allowed.includes(status))throw new ApiError(400,'Invalid governance status.');const ref=adminDb.doc(`clinicalDecisionRegister/${req.params.id}`);const before=await ref.get();if(!before.exists)throw new ApiError(404,'Clinical rule not found.');const now=new Date().toISOString();const history=Array.isArray(before.data()?.reviewHistory)?before.data()?.reviewHistory:[];history.push({from:before.data()?.status||null,to:status,changedAt:now,changedBy:token.uid});await ref.update({status,reviewHistory:history,updatedAt:FieldValue.serverTimestamp()});await logAudit(token.uid,'ADMIN','CLINICAL_DECISION_STATUS_CHANGED','clinicalDecisionRegister',req.params.id);res.json({success:true,status,reviewHistory:history});}catch(e){sendError(res,e);}});

adminRouter.get('/release',async(req,res)=>{try{await requireAdmin(req);res.json({items:await list('releaseGates',100)});}catch(e){sendError(res,e);}});
adminRouter.get('/release/:id',async(req,res)=>{try{await requireAdmin(req);const s=await adminDb.doc(`releaseGates/${req.params.id}`).get();if(!s.exists)throw new ApiError(404,'Release gate not found.');res.json({item:{id:s.id,...clean(s.data())}});}catch(e){sendError(res,e);}});
adminRouter.patch('/release/:id',async(req,res)=>{try{const token=await requireAdmin(req);const status=String(req.body?.status||'unassessed');if(!['unassessed','open','blocked','approved'].includes(status))throw new ApiError(400,'Invalid release status.');const ref=adminDb.doc(`releaseGates/${req.params.id}`);const before=await ref.get();if(!before.exists)throw new ApiError(404,'Release gate not found.');const patch:any={status,updatedAt:FieldValue.serverTimestamp()};if(Array.isArray(req.body?.evidence))patch.evidence=req.body.evidence;const signOffs=Array.isArray(before.data()?.signOffs)?before.data()?.signOffs:[];if(req.body?.signOff)signOffs.push({adminId:token.uid,at:new Date().toISOString(),note:String(req.body.signOff)});patch.signOffs=signOffs;await ref.update(patch);await logAudit(token.uid,'ADMIN','RELEASE_GATE_UPDATED','releaseGates',ref.id);res.json({success:true});}catch(e){sendError(res,e);}});

adminRouter.get('/safety-patterns',async(req,res)=>{try{await requireAdmin(req);res.json({items:await list('safetyPatterns',500)});}catch(e){sendError(res,e);}});
adminRouter.post('/safety-patterns',async(req,res)=>{try{const token=await requireAdmin(req);const b=req.body||{};if(!['mother','newborn','child','selfharm'].includes(b.category)||!String(b.label||'').trim()||!Array.isArray(b.matchPatterns)||!b.matchPatterns.length)throw new ApiError(400,'Category, label and at least one trigger phrase are required.');const ref=adminDb.collection('safetyPatterns').doc();await ref.set({id:ref.id,category:b.category,label:String(b.label).trim(),icon:String(b.icon||'shield-alert'),matchPatterns:b.matchPatterns.map(String),version:1,enabled:b.enabled!==false,updatedAt:FieldValue.serverTimestamp(),updatedBy:token.uid,versionHistory:[{version:1,at:new Date().toISOString(),by:token.uid,matchPatterns:b.matchPatterns.map(String)}]});invalidateSafetyCache();await logAudit(token.uid,'ADMIN','SAFETY_PATTERN_CREATED','safetyPatterns',ref.id);res.status(201).json({id:ref.id});}catch(e){sendError(res,e);}});
adminRouter.patch('/safety-patterns/:id',async(req,res)=>{try{const token=await requireAdmin(req);const ref=adminDb.doc(`safetyPatterns/${req.params.id}`);const before=await ref.get();if(!before.exists)throw new ApiError(404,'Safety pattern not found.');const b=req.body||{};const current=before.data()||{};const patch:any={updatedAt:FieldValue.serverTimestamp(),updatedBy:token.uid};if(b.label!==undefined)patch.label=String(b.label).trim();if(b.icon!==undefined)patch.icon=String(b.icon);if(b.category!==undefined&&['mother','newborn','child','selfharm'].includes(b.category))patch.category=b.category;if(b.enabled!==undefined)patch.enabled=Boolean(b.enabled);if(Array.isArray(b.matchPatterns)){const version=Number(current.version||0)+1;patch.matchPatterns=b.matchPatterns.map(String);patch.version=version;patch.versionHistory=[...(Array.isArray(current.versionHistory)?current.versionHistory:[]),{version,at:new Date().toISOString(),by:token.uid,matchPatterns:patch.matchPatterns}];}await ref.update(patch);invalidateSafetyCache();await logAudit(token.uid,'ADMIN','SAFETY_PATTERN_UPDATED','safetyPatterns',ref.id);res.json({success:true,version:patch.version||current.version});}catch(e){sendError(res,e);}});
adminRouter.post('/safety-patterns/:id/review',async(req,res)=>{try{const token=await requireAdmin(req);const ref=adminDb.collection('safetyReviewEvents').doc();await ref.set({patternId:req.params.id,reviewedBy:token.uid,reviewedAt:FieldValue.serverTimestamp(),action:'reviewed'});await logAudit(token.uid,'ADMIN','SAFETY_PATTERN_REVIEWED','safetyPatterns',req.params.id);res.json({success:true});}catch(e){sendError(res,e);}});
adminRouter.get('/safety-metrics',async(req,res)=>{try{await requireAdmin(req);const audits=await adminDb.collection('auditEvents').limit(2000).get();const events=audits.docs.map(d=>d.data()).filter(x=>String(x.action||'').toUpperCase().includes('SAFETY'));const now=Date.now();const days=Array.from({length:14},(_,i)=>{const start=now-(13-i+1)*86400000;const end=start+86400000;return{date:new Date(start).toISOString().slice(0,10),count:events.filter(x=>{const t=x.timestamp instanceof Timestamp?x.timestamp.toMillis():new Date(x.timestamp||0).getTime();return t>=start&&t<end}).length};});const reviewed=await adminDb.collection('safetyReviewEvents').limit(500).get();res.json({triggerRateThisWeek:events.filter(x=>{const t=x.timestamp instanceof Timestamp?x.timestamp.toMillis():new Date(x.timestamp||0).getTime();return t>=now-7*86400000}).length,escalations:events.filter(x=>String(x.action||'').toUpperCase().includes('ESCALAT')).length,needsReview:Math.max(0,events.length-reviewed.size),trend:days});}catch(e){sendError(res,e);}});
adminRouter.get('/safety-review-queue',async(req,res)=>{try{await requireAdmin(req);const events=await adminDb.collection('safetyReviewQueue').limit(500).get();res.json({items:events.docs.map(d=>({id:d.id,...clean(d.data())}))});}catch(e){sendError(res,e);}});

adminRouter.get('/content',async(req,res)=>{try{await requireAdmin(req);res.json({items:await list('educationalContent',500)});}catch(e){sendError(res,e);}});
adminRouter.post('/content',async(req,res)=>{try{const token=await requireAdmin(req);const b=req.body||{};if(!String(b.title||'').trim()||!String(b.body||'').trim())throw new ApiError(400,'Title and body are required.');const ref=adminDb.collection('educationalContent').doc();await ref.set({title:String(b.title).trim(),body:String(b.body).trim(),language:String(b.language||'English'),status:b.status==='published'?'published':'draft',createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});await logAudit(token.uid,'ADMIN','EDUCATIONAL_CONTENT_CREATED','educationalContent',ref.id);res.status(201).json({id:ref.id});}catch(e){sendError(res,e);}});
adminRouter.patch('/content/:id',async(req,res)=>{try{const token=await requireAdmin(req);const status=req.body?.status;const patch:any={updatedAt:FieldValue.serverTimestamp()};if(status!==undefined){if(!['draft','published','archived'].includes(String(status)))throw new ApiError(400,'Invalid content status.');patch.status=String(status);}if(req.body?.title!==undefined)patch.title=String(req.body.title).trim();if(req.body?.body!==undefined)patch.body=String(req.body.body).trim();if(req.body?.language!==undefined)patch.language=String(req.body.language);await adminDb.doc(`educationalContent/${req.params.id}`).update(patch);await logAudit(token.uid,'ADMIN','EDUCATIONAL_CONTENT_UPDATED','educationalContent',req.params.id);res.json({success:true});}catch(e){sendError(res,e);}});

adminRouter.get('/team',async(req,res)=>{try{await requireAdmin(req);const q=await adminDb.collection('users').where('role','==','ADMIN').limit(200).get();const invites=await adminDb.collection('adminInvitations').where('status','==','pending').limit(200).get();res.json({items:q.docs.map(d=>({id:d.id,...clean(d.data())})),invitations:invites.docs.map(d=>({id:d.id,...clean(d.data())}))});}catch(e){sendError(res,e);}});
adminRouter.post('/team/invitations',async(req,res)=>{try{const token=await requireAdmin(req);const email=String(req.body?.email||'').trim().toLowerCase();const role=String(req.body?.role||'County Admin');const scope=String(req.body?.scope||'National');if(!email||!email.includes('@'))throw new ApiError(400,'A valid email is required.');const ref=adminDb.collection('adminInvitations').doc();await ref.set({email,role,scope,status:'pending',invitedBy:token.uid,createdAt:FieldValue.serverTimestamp()});await logAudit(token.uid,'ADMIN','ADMIN_INVITATION_CREATED','adminInvitations',ref.id);res.status(201).json({id:ref.id,status:'pending'});}catch(e){sendError(res,e);}});
adminRouter.patch('/team/:id',async(req,res)=>{try{const token=await requireAdmin(req);const patch:any={updatedAt:FieldValue.serverTimestamp()};if(req.body?.role!==undefined)patch.role=String(req.body.role);if(req.body?.scopes!==undefined)patch.scopes=Array.isArray(req.body.scopes)?req.body.scopes.map(String):[];if(req.body?.status!==undefined)patch.status=String(req.body.status);await adminDb.doc(`users/${req.params.id}`).update(patch);await logAudit(token.uid,'ADMIN','ADMIN_PERMISSIONS_UPDATED','users',req.params.id);res.json({success:true});}catch(e){sendError(res,e);}});

adminRouter.get('/reports',async(req,res)=>{try{await requireAdmin(req);const collections=['users','pregnancies','children','reminders','muacMeasurements','immunizationRecords'];const counts:any={};for(const n of collections){try{counts[n]=(await adminDb.collection(n).limit(5000).get()).size;}catch{counts[n]=0;}}const users=await adminDb.collection('users').limit(5000).get();const byDay:Record<string,number>={};users.docs.forEach(d=>{const v=d.data().createdAt;const date=v instanceof Timestamp?v.toDate().toISOString().slice(0,10):new Date(v||0).toISOString().slice(0,10);if(date!=='1970-01-01')byDay[date]=(byDay[date]||0)+1;});res.json({counts,adoption:Object.entries(byDay).sort(([a],[b])=>a.localeCompare(b)).map(([date,count])=>({date,count})),ancContactCompletion:null,immunizationCoverage:null,muacAlertVolume:counts.muacMeasurements||0,note:'Metrics are computed from current Firestore data. Null coverage rates mean the underlying denominator is not yet represented safely in the operational aggregate model.'});}catch(e){sendError(res,e);}});

adminRouter.get('/settings',async(req,res)=>{try{await requireAdmin(req);const s=await adminDb.doc('adminSettings/platform').get();res.json({item:s.exists?{id:s.id,...clean(s.data())}:{id:'platform',billingTier:'Not configured',billingTierSource:'manual',featureFlags:[]}});}catch(e){sendError(res,e);}});
adminRouter.patch('/settings',async(req,res)=>{try{const token=await requireAdmin(req);const patch:any={updatedAt:FieldValue.serverTimestamp(),updatedBy:token.uid};if(req.body?.billingTier!==undefined)patch.billingTier=String(req.body.billingTier);if(req.body?.featureFlags!==undefined)patch.featureFlags=Array.isArray(req.body.featureFlags)?req.body.featureFlags:[];await adminDb.doc('adminSettings/platform').set(patch,{merge:true});await logAudit(token.uid,'ADMIN','PLATFORM_SETTINGS_UPDATED','adminSettings','platform');res.json({success:true});}catch(e){sendError(res,e);}});

adminRouter.get('/emergency-defaults',async(req,res)=>{try{await requireAdmin(req);res.json({items:await list('emergencyDefaults',500)});}catch(e){sendError(res,e);}});
adminRouter.post('/emergency-defaults',async(req,res)=>{try{const token=await requireAdmin(req);const b=req.body||{};if(!String(b.county||'').trim()||!String(b.facilityName||'').trim()||!String(b.phone||'').trim())throw new ApiError(400,'County, facility name and phone are required.');const ref=adminDb.collection('emergencyDefaults').doc();await ref.set({county:String(b.county).trim(),facilityName:String(b.facilityName).trim(),phone:String(b.phone).trim(),verified:Boolean(b.verified),verifiedBy:b.verified?token.uid:null,verifiedAt:b.verified?FieldValue.serverTimestamp():null,updatedAt:FieldValue.serverTimestamp()});await logAudit(token.uid,'ADMIN','EMERGENCY_DEFAULT_CREATED','emergencyDefaults',ref.id);res.status(201).json({id:ref.id});}catch(e){sendError(res,e);}});
adminRouter.patch('/emergency-defaults/:id',async(req,res)=>{try{const token=await requireAdmin(req);const patch:any={updatedAt:FieldValue.serverTimestamp()};for(const k of ['county','facilityName','phone'])if(req.body?.[k]!==undefined)patch[k]=String(req.body[k]).trim();if(req.body?.verified!==undefined){patch.verified=Boolean(req.body.verified);patch.verifiedBy=patch.verified?token.uid:null;patch.verifiedAt=patch.verified?FieldValue.serverTimestamp():null;}await adminDb.doc(`emergencyDefaults/${req.params.id}`).update(patch);await logAudit(token.uid,'ADMIN','EMERGENCY_DEFAULT_UPDATED','emergencyDefaults',req.params.id);res.json({success:true});}catch(e){sendError(res,e);}});

adminRouter.get('/audit',async(req,res)=>{try{await requireAdmin(req);const items=(await list('auditEvents',500)).filter((x:any)=>{const t=String(x.objectType||'').toLowerCase();return!['pregnan','child','patient','haven','clinicalrecord','privatenote'].some(v=>t.includes(v));});res.json({items});}catch(e){sendError(res,e);}});

adminRouter.get('/mfa/setup', async (req, res) => {
  try {
    const token = await requireAdmin(req);
    const docRef = adminDb.doc(`adminMfaSecrets/${token.uid}`);
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
    const adminEmail = token.email || 'admin@health.go.ke';
    const uri = `otpauth://totp/MomHaven%20MOH%20Admin:${encodeURIComponent(adminEmail)}?secret=${secret}&issuer=MomHaven%20MOH`;
    res.json({
      success: true,
      enrolled: true,
      secret,
      uri,
      adminEmail,
    });
  } catch (e) {
    sendError(res, e);
  }
});

adminRouter.post('/mfa/verify', async (req, res) => {
  try {
    const token = await requireAdmin(req);
    const code = String(req.body?.code || '').trim();
    if (!code || !/^\d{6}$/.test(code)) {
      throw new ApiError(400, 'Security code must be a 6-digit numeric token.');
    }
    const docRef = adminDb.doc(`adminMfaSecrets/${token.uid}`);
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

    await logAudit(token.uid, 'ADMIN', 'ADMIN_MFA_VERIFIED', 'adminMfaSecrets', token.uid);

    res.json({
      success: true,
      verified: true,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    sendError(res, e);
  }
});
