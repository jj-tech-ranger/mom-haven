import React, { useEffect, useState } from 'react';
import { ChevronLeft, Baby, Scale, Check, Info } from 'lucide-react';
import { collection, getDocs, query, updateDoc, where, doc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';

interface AddChildProps {
  onBack: () => void;
  onSave: (childData: { name: string; dateOfBirth: string; sex: 'boy' | 'girl'; birthWeightGrams?: number; birthLengthCm?: number; headCircumferenceCm?: number; cwcNumber?: string; facilityName?: string }) => Promise<void> | void;
  existingChildrenCount?: number;
}

export const AddChild: React.FC<AddChildProps> = ({ onBack, onSave, existingChildrenCount = 0 }) => {
  const [count, setCount] = useState(existingChildrenCount);
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [sex, setSex] = useState<'boy' | 'girl' | ''>('');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [head, setHead] = useState('');
  const [modeOfDelivery, setModeOfDelivery] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [cwc, setCwc] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    let cancelled = false;
    getDocs(query(collection(db, 'children'), where('motherId', '==', uid))).then((snapshot) => {
      if (!cancelled) setCount(snapshot.size);
    }).catch((err) => console.error('Could not read child count:', err));
    return () => { cancelled = true; };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dateOfBirth || !sex || !modeOfDelivery || !placeOfBirth.trim()) {
      setError('Name, date of birth, sex, mode of delivery and place of birth are required.');
      return;
    }
    const uid = auth.currentUser?.uid;
    if (!uid) { setError('You must be signed in to save a child record.'); return; }
    setSaving(true); setError('');
    try {
      await onSave({ name: name.trim(), dateOfBirth, sex, birthWeightGrams: weight ? Math.round(Number(weight) * 1000) : undefined, birthLengthCm: length ? Number(length) : undefined, headCircumferenceCm: head ? Number(head) : undefined, cwcNumber: cwc.trim() || undefined, facilityName: placeOfBirth.trim() });
      const snapshot = await getDocs(query(collection(db, 'children'), where('motherId', '==', uid)));
      const matches = snapshot.docs.filter((d) => { const data = d.data(); return data.name === name.trim() && data.dateOfBirth === dateOfBirth && data.sex === sex; });
      if (matches.length) await updateDoc(doc(db, 'children', matches[matches.length - 1].id), { modeOfDelivery, placeOfBirth });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save child record.');
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-surface-canvas pb-24">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border-light bg-white px-4 py-3.5">
        <button onClick={onBack} className="flex h-12 w-12 min-h-0 items-center justify-center rounded-md border border-border-light bg-white text-brand-primary" aria-label="Back"><ChevronLeft className="h-5 w-5" /></button>
        <div><h1 className="font-consumer text-xl font-bold text-text-primary">Add child</h1><p className="font-clinical text-xs text-text-muted">{count ? `Child ${count + 1} in your household` : 'Start a real child health record'}</p></div>
      </header>

      <form onSubmit={submit} className="mx-auto max-w-lg space-y-4 p-4">
        <section className="rounded-xl border border-border-light bg-brand-surface p-5">
          <Baby className="mb-2 h-6 w-6 text-brand-primary" />
          <h2 className="font-consumer text-lg font-bold text-text-primary">{count ? 'Add another child' : 'Begin the child journey'}</h2>
          <p className="mt-1 font-clinical text-xs text-text-muted">Only information you enter is saved. Nothing is pre-filled as if it were true.</p>
        </section>
        {error && <div className="flex gap-2 rounded-xl border border-clinical-danger/20 bg-clinical-danger-bg p-3 text-xs text-clinical-danger"><Info className="h-4 w-4" />{error}</div>}

        <section className="space-y-4 rounded-xl border border-border-light bg-white p-5 shadow-sm">
          <h2 className="font-consumer text-base font-bold text-text-primary">Child information</h2>
          <label className="block font-clinical text-xs font-semibold text-text-muted">Name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter child's name" className="mt-1 w-full rounded-md border border-border-light bg-surface-canvas p-3 font-clinical text-sm" required /></label>
          <label className="block font-clinical text-xs font-semibold text-text-muted">Date of birth<input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} max={new Date().toISOString().split('T')[0]} className="mt-1 w-full rounded-md border border-border-light bg-surface-canvas p-3 font-clinical text-sm" required /></label>
          <div><p className="mb-2 font-clinical text-xs font-semibold text-text-muted">Sex</p><div className="grid grid-cols-2 gap-3">{(['girl', 'boy'] as const).map((s) => <button key={s} type="button" onClick={() => setSex(s)} className={`flex min-h-[48px] items-center justify-center rounded-md border font-consumer font-bold ${sex === s ? 'border-brand-primary bg-brand-primary text-white' : 'border-border-light bg-white text-text-primary'}`}>{s === 'girl' ? 'Girl' : 'Boy'} {sex === s && <Check className="ml-1 h-4 w-4" />}</button>)}</div></div>
        </section>

        <section className="space-y-4 rounded-xl border border-border-light bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 font-consumer text-base font-bold text-text-primary"><Scale className="h-4 w-4 text-brand-accent" />Birth details</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="font-clinical text-xs font-semibold text-text-muted">Weight (kg)<input type="number" step="0.01" min="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Optional" className="mt-1 w-full rounded-md border border-border-light bg-surface-canvas p-2.5 text-sm" /></label>
            <label className="font-clinical text-xs font-semibold text-text-muted">Length (cm)<input type="number" step="0.1" min="1" value={length} onChange={(e) => setLength(e.target.value)} placeholder="Optional" className="mt-1 w-full rounded-md border border-border-light bg-surface-canvas p-2.5 text-sm" /></label>
          </div>
          <label className="block font-clinical text-xs font-semibold text-text-muted">Head circumference (cm)<input type="number" step="0.1" min="1" value={head} onChange={(e) => setHead(e.target.value)} placeholder="Optional" className="mt-1 w-full rounded-md border border-border-light bg-surface-canvas p-3 text-sm" /></label>
          <label className="block font-clinical text-xs font-semibold text-text-muted">Mode of delivery<select value={modeOfDelivery} onChange={(e) => setModeOfDelivery(e.target.value)} className="mt-1 w-full rounded-md border border-border-light bg-surface-canvas p-3 text-sm" required><option value="">Select mode</option><option value="Vaginal birth">Vaginal birth</option><option value="Caesarean birth">Caesarean birth</option><option value="Assisted vaginal birth">Assisted vaginal birth</option><option value="Other">Other</option></select></label>
          <label className="block font-clinical text-xs font-semibold text-text-muted">Place of birth<input value={placeOfBirth} onChange={(e) => setPlaceOfBirth(e.target.value)} placeholder="Facility name or Home" className="mt-1 w-full rounded-md border border-border-light bg-surface-canvas p-3 text-sm" required /></label>
          <label className="block font-clinical text-xs font-semibold text-text-muted">CWC number<input value={cwc} onChange={(e) => setCwc(e.target.value)} placeholder="Optional" className="mt-1 w-full rounded-md border border-border-light bg-surface-canvas p-3 text-sm" /></label>
        </section>

        <div className="space-y-2.5"><button disabled={saving} className="w-full rounded-md bg-brand-primary py-3.5 font-consumer font-bold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save child record'}</button><button type="button" onClick={onBack} disabled={saving} className="w-full rounded-md border border-brand-primary bg-white py-3 font-consumer font-bold text-brand-primary">Cancel</button></div>
      </form>
    </div>
  );
};
