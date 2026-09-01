import { useCallback, useState } from 'react';
import { AncEncounterDoc } from '../types';
import { ancVisitSchema, formatSchemaError, AncVisitInput } from '../schemas/anc';

export function useAncMutation(onSave: (visit: Omit<AncEncounterDoc, 'id'>) => Promise<void>) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = useCallback(async (input: AncVisitInput, provenance: AncEncounterDoc['provenance']) => {
    const parsed = ancVisitSchema.safeParse(input);
    if (!parsed.success) {
      const message = formatSchemaError(parsed.error);
      setError(message);
      return false;
    }

    setSaving(true);
    setError('');
    try {
      const value = parsed.data;
      await onSave({
        pregnancyId: value.pregnancyId,
        date: value.date,
        facilityName: value.facilityName,
        visitNumber: value.visitNumber,
        gestationWeeks: value.gestationWeeks,
        weight: value.weight,
        bloodPressure: `${value.systolic} / ${value.diastolic}`,
        fundalHeight: value.fundalHeight,
        fetalHeartRate: value.fetalHeartRate,
        nextVisitDate: value.nextVisitDate || undefined,
        notes: value.notes?.trim() || undefined,
        provenance,
      });
      return true;
    } catch (err) {
      console.error(err);
      setError('Could not save this ANC visit. Please try again.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [onSave]);

  return { submit, saving, error, setError };
}
