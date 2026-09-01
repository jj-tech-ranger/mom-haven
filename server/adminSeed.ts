import { adminDb } from './clinicianAccess.js';

const decisions = [
  ['newborn-danger-sign-matrix','Newborn very severe disease — danger-sign matrix','IMNCI','needs_clinical_review'],
  ['fast-breathing-thresholds','Fast breathing thresholds (2–11mo / 12–59mo)','IMNCI','source_verified'],
  ['muac-bands','MUAC bands (SAM/MAM/At Risk/Normal)','IMNCI','clinically_reviewed'],
  ['anc-td-reset','ANC Td 10-year reset rule','MCH Handbook','needs_clinical_review'],
  ['ifas-gestational-counts','IFAS gestational-week tablet counts','MCH Handbook','approved'],
  ['pnc-schedule','PNC schedule — 48h/1–2w/4–6w/4–6mo','MCH Handbook','approved'],
  ['anc-002-hb-thresholds','ANC-002 Hb thresholds','MCH Handbook','citation_not_verified'],
  ['kepi-immunization-schedule','KEPI immunization schedule','MCH Handbook','source_verified'],
] as const;
const gates=['Product scope locked','Architecture implemented','Database schema migrated','Firebase billing configured','Authentication tested','Permissions tested','Partner privacy tested','Clinician sharing tested','Clinical rules clinically reviewed','Clinical citations verified','HavenChat safety tested','Offline emergency tested','Seed data complete','Real pilot facility agreement','Security review','Privacy/legal review','Production monitoring'];
const articles=[
 ['support-labour','How to support her through labour','Stay calm, listen to what she wants, help with comfort measures she prefers, keep transport arrangements ready, and help her reach the facility promptly when labour or danger signs require care.','English'],
 ['danger-signs','Understanding danger signs','Know the warning signs she has been taught to watch for, including heavy bleeding, convulsions, severe pain, difficulty breathing and reduced movement of an unborn baby. If a danger sign appears, help her seek urgent care rather than waiting.','English'],
 ['pregnancy-expectations','What to expect during pregnancy','Pregnancy involves routine contacts with health workers, preparation for birth and attention to changes in how the mother feels. Encourage scheduled care, practical preparation and respectful communication without making clinical decisions for her.','English'],
 ['birth-together','Preparing for birth together','Agree on the preferred facility, transport plan, who can accompany her and how you will communicate if plans change. Keep important phone numbers accessible and revisit the plan together as the pregnancy progresses.','English'],
] as const;

export async function ensureAdminRegistersSeeded(){
 const batch=adminDb.batch();
 for(const [id,title,source,status] of decisions){const ref=adminDb.doc(`clinicalDecisionRegister/${id}`);if(!(await ref.get()).exists)batch.set(ref,{id,title,source,status,note:'Product governance record. Status must be supported by evidence and review history.',reviewHistory:[],ruleText:`Governance record for ${title}. Review the referenced source before treating this rule as clinically approved.`,sourceCitation:{document:source,section:'Referenced source; exact section/page must be verified'},createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});}
 for(const name of gates){const id=name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');const ref=adminDb.doc(`releaseGates/${id}`);if(!(await ref.get()).exists)batch.set(ref,{id,name,status:'unassessed',evidence:[],signOffs:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});}
 for(const [id,title,body,language] of articles){const ref=adminDb.doc(`educationalContent/${id}`);if(!(await ref.get()).exists)batch.set(ref,{id,title,body,language,status:'published',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});}
 await batch.commit();
}
