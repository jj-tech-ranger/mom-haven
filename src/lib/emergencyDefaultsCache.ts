import {collection,getDocs,query,where} from 'firebase/firestore';
import {auth,db} from './firebase';
import {writeCentralEmergencyFacilities} from './emergencyOffline';
import type {SavedEmergencyFacilityDoc} from '../types';

export async function refreshEmergencyDefaultsCache(){
 const uid=auth.currentUser?.uid;if(!uid||typeof navigator==='undefined'||!navigator.onLine)return [];
 const profile=await import('firebase/firestore').then(({getDoc,doc})=>getDoc(doc(db,'motherProfiles',uid)));
 const county=String(profile.data()?.county||'').trim();if(!county)return [];
 const snap=await getDocs(query(collection(db,'emergencyDefaults'),where('county','==',county),where('verified','==',true)));
 const facilities:SavedEmergencyFacilityDoc[]=snap.docs.map(d=>({id:`central-${d.id}`,userId:uid,facilityId:`central-${d.id}`,facilityName:String(d.data().facilityName||''),phone:String(d.data().phone||'')}));
 await writeCentralEmergencyFacilities(uid,facilities);return facilities;
}
