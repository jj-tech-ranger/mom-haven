import { z } from 'zod';

export const ancVisitSchema = z.object({
  pregnancyId: z.string(),
  date: z.string().min(1, 'Visit date is required.'),
  facilityName: z.string().trim().min(1, 'Health facility is required.'),
  visitNumber: z.number().int().min(1).max(8),
  gestationWeeks: z.number().min(1).max(43),
  weight: z.number().positive(),
  systolic: z.number().positive(),
  diastolic: z.number().positive(),
  fundalHeight: z.number().positive().optional(),
  fetalHeartRate: z.number().positive().optional(),
  nextVisitDate: z.string().optional(),
  notes: z.string().optional(),
});

export type AncVisitInput = z.infer<typeof ancVisitSchema>;

export function formatSchemaError(error: z.ZodError): string {
  return error.issues[0]?.message || 'Please check the information entered.';
}
