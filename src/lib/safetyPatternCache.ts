import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { classifyLayerOne, type LayerOneResult } from './safetyPatterns';

type CachedPattern={category:string;matchPatterns:string[];enabled?:boolean;version?:number};
const KEY='momhaven.safetyPatterns.v1';

function compile(patterns:string[]){return patterns.map(p=>new RegExp(`\\b${p.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&').replace(/\\s+/g,'\\s+')}\\b`,'i'));}
function classifyCached(message:string,items:CachedPattern[]):LayerOneResult{
 const text=message.replace(/\\s+/g,' ').trim();
 const physical=compile(items.filter(x=>x.enabled!==false&&x.category!=='selfharm').flatMap(x=>x.matchPatterns||[]));
 const self=compile(items.filter(x=>x.enabled!==false&&x.category==='selfharm').flatMap(x=>x.matchPatterns||[]));
 if(self.some(p=>p.test(text)))return 'self_harm_or_violence';
 if(physical.some(p=>p.test(text)))return 'physical_danger';
 return null;
}
export async function refreshSafetyPatternCache(){
 const snap=await getDocs(collection(db,'safetyPatterns'));
 const items=snap.docs.map(d=>d.data() as CachedPattern);
 if(!items.length)throw new Error('Safety pattern register is empty');
 localStorage.setItem(KEY,JSON.stringify({updatedAt:new Date().toISOString(),items}));
 return items;
}
export function classifyLayerOneOffline(message:string):LayerOneResult{
 try{const raw=localStorage.getItem(KEY);if(raw){const parsed=JSON.parse(raw);if(Array.isArray(parsed.items)){const result=classifyCached(message,parsed.items);if(result)return result;}}
 }catch{}
 return classifyLayerOne(message);
}
