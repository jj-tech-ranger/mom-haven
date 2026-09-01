import {collection,doc,getDoc,getDocs,query,where} from 'firebase/firestore';
import {auth,db} from './firebase';
import {writeCentralEmergencyFacilities} from './emergencyOffline';
import type {SavedEmergencyFacilityDoc} from '../types';
export async function refreshEmergencyDefaultsCache(){const uid=auth.currentUser?.uid;if(!uid||typeof navigator==='undefined'||!navigator.onLine)return [];const profile=await getDoc(doc(db,'motherProfiles',uid));const county=String(profile.data()?.county||'').trim();if(!county)return [];const snap=await getDocs(query(collection(db,'emergencyDefaults'),where('county','==',county)));const facilities:SavedEmergencyFacilityDoc[]=snap.docs.filter(d=>d.data().verified===true).map(d=>({id:`central-${d.id}`,userId:uid,facilityId:`central-${d.id}`,facilityName:String(d.data().facilityName||''),phone:String(d.data().phone||'')}));await writeCentralEmergencyFacilities(uid,facilities);return facilities;}
