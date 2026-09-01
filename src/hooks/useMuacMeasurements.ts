import { useHealthRepository } from '../context/HealthRepositoryContext';

export function useMuacMeasurements(childId:string){
  const repository=useHealthRepository();
  return {
    subscribe:(onChange:Parameters<typeof repository.childRecords.subscribeMuacMeasurements>[1],onError?:Parameters<typeof repository.childRecords.subscribeMuacMeasurements>[2])=>repository.childRecords.subscribeMuacMeasurements(childId,onChange,onError),
    add:(record:Parameters<typeof repository.childRecords.addMuacMeasurement>[1])=>repository.childRecords.addMuacMeasurement(childId,record),
  };
}
