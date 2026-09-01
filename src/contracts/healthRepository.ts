import type { ChildDoc, EmergencyContactDoc, MuacMeasurementDoc, SavedEmergencyFacilityDoc } from '../types';

export interface IMotherRepository {
  getById(motherId: string): Promise<Record<string, unknown> | null>;
}

export interface IChildRecordRepository {
  subscribeMuacMeasurements(childId: string, onChange: (records: MuacMeasurementDoc[]) => void, onError?: (error: Error) => void): () => void;
  addMuacMeasurement(childId: string, record: Omit<MuacMeasurementDoc, 'id'>): Promise<string>;
  getById(childId: string): Promise<ChildDoc | null>;
}

export interface IEmergencyRepository {
  listContacts(userId: string): Promise<EmergencyContactDoc[]>;
  listSavedFacilities(userId: string): Promise<SavedEmergencyFacilityDoc[]>;
  addSavedFacility(userId: string, facility: Omit<SavedEmergencyFacilityDoc, 'id'>): Promise<string>;
}

export interface HealthRepository {
  mother: IMotherRepository;
  childRecords: IChildRecordRepository;
  emergency: IEmergencyRepository;
}
