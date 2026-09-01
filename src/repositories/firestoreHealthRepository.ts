import { addDoc, collection, doc, getDoc, getDocs, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { ChildDoc, EmergencyContactDoc, MuacMeasurementDoc, SavedEmergencyFacilityDoc } from '../types';
import type { HealthRepository } from '../contracts/healthRepository';

const userPath=(userId:string)=>collection(db,'users',userId,'emergencyContacts');

const motherRepository={
  async getById(motherId:string){const snapshot=await getDoc(doc(db,'mothers',motherId));return snapshot.exists()?snapshot.data():null;},
};

const childRecordsRepository={
  subscribeMuacMeasurements(childId:string,onChange:(records:MuacMeasurementDoc[])=>void,onError?:(error:Error)=>void){
    return onSnapshot(collection(db,'children',childId,'muacMeasurements'),snapshot=>onChange(snapshot.docs.map(item=>({id:item.id,...(item.data() as Omit<MuacMeasurementDoc,'id'>)})).sort((a,b)=>a.date.localeCompare(b.date))),error=>onError?.(error));
  },
  async addMuacMeasurement(childId:string,record:Omit<MuacMeasurementDoc,'id'>){const ref=await addDoc(collection(db,'children',childId,'muacMeasurements'),record);return ref.id;},
  async getById(childId:string){const snapshot=await getDoc(doc(db,'children',childId));return snapshot.exists()?({id:snapshot.id,...snapshot.data()} as ChildDoc):null;},
};

const emergencyRepository={
  async listContacts(userId:string){const snapshot=await getDocs(userPath(userId));return snapshot.docs.map(item=>({id:item.id,...item.data()} as EmergencyContactDoc));},
  async listSavedFacilities(userId:string){const snapshot=await getDocs(collection(db,'users',userId,'savedEmergencyFacilities'));return snapshot.docs.map(item=>({id:item.id,...item.data()} as SavedEmergencyFacilityDoc));},
  async addSavedFacility(userId:string,facility:Omit<SavedEmergencyFacilityDoc,'id'>){const ref=await addDoc(collection(db,'users',userId,'savedEmergencyFacilities'),facility);return ref.id;},
};

export const firestoreHealthRepository:HealthRepository={mother:motherRepository,childRecords:childRecordsRepository,emergency:emergencyRepository};
export const getAuthenticatedHealthRepository=()=>auth.currentUser?firestoreHealthRepository:null;
