import React from 'react';import {Activity,AlertTriangle,Droplets,Flame,HeartCrack,ThermometerSnowflake,Wind,ShieldAlert} from 'lucide-react';
export const NEWBORN_DANGER_SIGNS=[
 {id:'feeding',title:'Unable to feed or suckle at breast',description:'Baby is completely refusing to feed or too weak to suckle.',icon:HeartCrack},
 {id:'convulsions',title:'Convulsions or fits',description:'Repeated spasms, abnormal eye movements, or rhythmic jerking.',icon:Activity},
 {id:'breathing',title:'Fast or difficult breathing',description:'Very fast breathing, grunting, or deep chest pulling-in.',icon:Wind},
 {id:'fever',title:'Baby feels very hot',description:'Baby feels unusually hot or has a high temperature.',icon:Flame},
 {id:'hypothermia',title:'Baby feels unusually cold',description:'Baby feels cold, especially hands, feet, or body.',icon:ThermometerSnowflake},
 {id:'jaundice',title:'Yellow skin or yellow eyes very early',description:'Yellowing during the first day of life needs urgent assessment.',icon:AlertTriangle},
 {id:'cord',title:'Red, swollen, bleeding or smelly cord',description:'Redness, swelling, pus, bleeding, or a bad smell around the cord.',icon:Droplets},
 {id:'lethargy',title:'Very sleepy, floppy or unconscious',description:'Baby is difficult to wake, very floppy, or not responding normally.',icon:ShieldAlert},
] as const;
interface Props{selectedIds?:string[];onChange?:(ids:string[])=>void;compact?:boolean}
export const NewbornDangerSignsContent:React.FC<Props>=({selectedIds=[],onChange,compact=false})=><div className="space-y-2">{NEWBORN_DANGER_SIGNS.map(sign=>{const selected=selectedIds.includes(sign.id);const Icon=sign.icon;return <button type="button" key={sign.id} onClick={()=>onChange?.(selected?selectedIds.filter(id=>id!==sign.id):[...selectedIds,sign.id])} className={`w-full text-left ${compact?'p-3':'p-4'} rounded-[16px] border ${selected?'bg-red-50 border-red-500':'bg-white border-border-hairline'}`}><div className="flex items-start gap-3"><div className="w-9 h-9 rounded-xl bg-lavender-50 flex items-center justify-center flex-shrink-0"><Icon className="w-4 h-4 text-red-600"/></div><div className="flex-1"><div className="flex items-start justify-between gap-2"><span className="font-display font-bold text-sm text-ink-900">{sign.title}</span><span className={`w-5 h-5 rounded border-2 flex-shrink-0 ${selected?'bg-red-600 border-red-600':'bg-white border-border-hairline'}`}/></div><p className="font-body text-xs text-ink-600 mt-1">{sign.description}</p></div></div></button>})}</div>;
export default NewbornDangerSignsContent;
