import {z} from 'zod';

export const bloodPressureSchema=z.object({
  systolic:z.coerce.number().int().min(40).max(300),
  diastolic:z.coerce.number().int().min(20).max(200),
}).refine(({systolic,diastolic})=>systolic>diastolic,{message:'Systolic pressure must be greater than diastolic pressure'});

export const maternalVitalsSchema=z.object({
  weight:z.coerce.number().positive().max(300),
  systolic:z.coerce.number().int().min(40).max(300),
  diastolic:z.coerce.number().int().min(20).max(200),
  fundalHeight:z.coerce.number().positive().max(60).optional(),
  fetalHeartRate:z.coerce.number().int().min(40).max(240).optional(),
}).refine(({systolic,diastolic})=>systolic>diastolic,{message:'Systolic pressure must be greater than diastolic pressure',path:['systolic']});

export type BloodPressureInput=z.infer<typeof bloodPressureSchema>;
export type MaternalVitalsInput=z.infer<typeof maternalVitalsSchema>;
