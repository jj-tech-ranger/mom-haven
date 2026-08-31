import { collection, collectionGroup, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from './firebase';

type Row={category:string;title:string;date:string;status:'Reported'|'Verified';detail:string};
const clean=(v:unknown)=>String(v??'').replace(/[\\()\r\n]/g,' ').replace(/\s+/g,' ').trim();
const date=(v:unknown)=>{if(!v)return 'Date not recorded';const d=new Date(String(v));return Number.isNaN(d.getTime())?String(v):d.toLocaleDateString('en-KE',{year:'numeric',month:'short',day:'numeric'});};
const status=(v:any):'Reported'|'Verified'=>v?.provenance?.status==='VERIFIED'?'Verified':'Reported';
const pdfEscape=(v:string)=>v.replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
const wrap=(text:string,max=92)=>{const words=text.split(' ');const lines:string[]=[];let line='';for(const w of words){if((line+' '+w).trim().length>max){if(line)lines.push(line);line=w}else line=(line+' '+w).trim()}if(line)lines.push(line);return lines;};

const buildPdf=(rows:Row[],motherName:string)=>{
 const lines:string[]=['MomHaven','Mother & Child Health Record Extract',`Mother: ${motherName}`,`Generated: ${new Date().toLocaleString('en-KE')}`,''];
 const groups=new Map<string,Row[]>();rows.forEach(r=>{if(!groups.has(r.category))groups.set(r.category,[]);groups.get(r.category)!.push(r)});
 groups.forEach((items,category)=>{lines.push(category);lines.push('—'.repeat(Math.min(70,category.length+8)));items.forEach(r=>{lines.push(`${r.title} · ${r.date} · ${r.status}`);wrap(r.detail,92).forEach(x=>lines.push(`  ${x}`));lines.push('')})});
 if(rows.length===0)lines.push('No records were found in the selected categories.');
 const pages:string[][]=[];let page:string[]=[];lines.forEach(line=>{if(page.length>=46){pages.push(page);page=[]}page.push(line)});if(page.length)pages.push(page);
 const objects:string[]=[];const pageIds:number[]=[];const contentIds:number[]=[];let next=3;
 objects[1]='<< /Type /Catalog /Pages 2 0 R >>';objects[2]='<< /Type /Pages /Kids [';
 pages.forEach((_,i)=>{const pid=next++;const cid=next++;pageIds.push(pid);contentIds.push(cid);objects[2]+=`${pid} 0 R `;});objects[2]+='] /Count '+pages.length+' >>';
 pages.forEach((page,i)=>{const stream=['BT','/F1 10 Tf','50 760 Td','14 TL'];page.forEach((line,idx)=>{if(idx===0){stream.push('/F1 16 Tf');}else if(idx===1){stream.push('/F1 11 Tf')}stream.push(`(${pdfEscape(line.slice(0,105))}) Tj`);stream.push('0 -14 Td');if(idx===0)stream.push('/F1 10 Tf');});stream.push('ET');const body=stream.join('\n');objects[pageIds[i]]= `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${next} 0 R >> >> /Contents ${contentIds[i]} 0 R >>`;objects[contentIds[i]]= `<< /Length ${body.length} >>\nstream\n${body}\nendstream`;});const fontId=next;objects[fontId]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';let pdf='%PDF-1.4\n';const offsets:number[]=[0];for(let i=1;i<objects.length;i++){offsets[i]=pdf.length;pdf+=`${i} 0 obj\n${objects[i]}\nendobj\n`;}const xref=pdf.length;pdf+=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;for(let i=1;i<objects.length;i++)pdf+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;pdf+=`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;return new Blob([pdf],{type:'application/pdf'});
};

export async function generateHealthRecordsPdf(selectedCategories:string[],motherName:string){
 const uid=auth.currentUser?.uid;if(!uid)throw new Error('You must be signed in to export records.');
 const rows:Row[]=[];
 if(selectedCategories.includes('pregnancy')){const snap=await getDocs(query(collection(db,'pregnancies'),where('motherId','==',uid)));snap.docs.forEach(d=>{const x=d.data();rows.push({category:'Pregnancy',title:'Pregnancy record',date:date(x.createdAt||x.lmp||x.edd),status:status(x),detail:`Status: ${clean(x.status)} · LMP: ${clean(x.lmp)} · EDD: ${clean(x.edd)}`});});const anc=await getDocs(collectionGroup(db,'ancEncounters'));anc.docs.filter(d=>d.ref.parent.parent&&snap.docs.some(p=>p.id===d.ref.parent.parent!.id)).forEach(d=>{const x=d.data();rows.push({category:'Pregnancy / ANC',title:`ANC visit ${clean(x.visitNumber||'')}`.trim(),date:date(x.date),status:status(x),detail:`Facility: ${clean(x.facilityName)} · Weight: ${clean(x.weight)} kg · BP: ${clean(x.bloodPressure)} · Notes: ${clean(x.notes)}`});});}
 if(selectedCategories.includes('child')){const snap=await getDocs(query(collection(db,'children'),where('motherId','==',uid)));snap.docs.forEach(d=>{const x=d.data();rows.push({category:'Child',title:clean(x.name)||'Child record',date:date(x.dateOfBirth),status:status(x),detail:`Date of birth: ${date(x.dateOfBirth)} · Sex: ${clean(x.sex)} · Facility: ${clean(x.facilityName)}`});});}
 if(selectedCategories.includes('immunization')){const children=await getDocs(query(collection(db,'children'),where('motherId','==',uid)));const ids=new Set(children.docs.map(d=>d.id));const snap=await getDocs(collectionGroup(db,'immunizationRecords'));snap.docs.filter(d=>ids.has(d.ref.parent.parent?.id||'')).forEach(d=>{const x=d.data();rows.push({category:'Immunization',title:`${clean(x.vaccine)} ${clean(x.dose)}`.trim(),date:date(x.dateGiven||x.scheduledDate),status:status(x),detail:`Status: ${clean(x.status)} · Site: ${clean(x.site)}`});});}
 if(selectedCategories.includes('growth')){const children=await getDocs(query(collection(db,'children'),where('motherId','==',uid)));const ids=new Set(children.docs.map(d=>d.id));const snap=await getDocs(collectionGroup(db,'growthMeasurements'));snap.docs.filter(d=>ids.has(d.ref.parent.parent?.id||'')).forEach(d=>{const x=d.data();rows.push({category:'Growth',title:'Growth measurement',date:date(x.date),status:status(x),detail:`Weight: ${clean(x.weightKg)} kg · Height: ${clean(x.heightCm)} cm · Head circumference: ${clean(x.headCircumferenceCm)} cm`});});}
 rows.sort((a,b)=>a.date.localeCompare(b.date));const blob=buildPdf(rows,motherName);const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`MomHaven-health-records-${new Date().toISOString().slice(0,10)}.pdf`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return rows.length;
}
