import React, { useEffect, useState } from 'react';
import { ChevronLeft, Baby, Scale, Check, Info } from 'lucide-react';
import { collection, getDocs, query, updateDoc, where, doc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';

interface AddChildProps {
  onBack: () => void;
  onSave: (childData: {
    name: string;
    dateOfBirth: string;
    sex: 'boy' | 'girl';
    birthWeightGrams?: number;
    birthLengthCm?: number;
    headCircumferenceCm?: number;
    cwcNumber?: string;
    facilityName?: string;
  }) => Promise<void> | void;
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
    return onSnapshotChildren(uid);
  }, []);

  const onSnapshotChildren = (uid: string) => {
    // A lightweight live count keeps the form honest when another child is added elsewhere.
    let cancelled = false;
    getDocs(query(collection(db, 'children'), where('motherId', '==', uid))).then((snapshot) => {
      if (!cancelled) setCount(snapshot.size);
    }).catch((err) => console.error('Could not read child count:', err));
    return () => { cancelled = true; };
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dateOfBirth || !sex || !modeOfDelivery || !placeOfBirth.trim()) {
      setError('Name, date of birth, sex, mode of delivery and place of birth are required.');
      return;
    }
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setError('You must be signed in to save a child record.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        name: name.trim(),
        dateOfBirth,
        sex,
        birthWeightGrams: weight ? Math.round(Number(weight) * 1000) : undefined,
        birthLengthCm: length ? Number(length) : undefined,
        headCircumferenceCm: head ? Number(head) : undefined,
        cwcNumber: cwc.trim() || undefined,
        // The existing parent handler stores this field as facilityName. For a home birth,
        // explicitly storing "Home" prevents any fabricated facility from being introduced.
        facilityName: placeOfBirth.trim(),
      });

      // The legacy parent callback predates mode/place fields. Extend the newly-created real
      // child document immediately, without creating a second child or using fake defaults.
      const snapshot = await getDocs(query(collection(db, 'children'), where('motherId', '==', uid)));
      const matches = snapshot.docs.filter((d) => {
        const data = d.data();
        return data.name === name.trim() && data.dateOfBirth === dateOfBirth && data.sex === sex;
      });
      if (matches.length) {
        const target = matches[matches.length - 1];
        await updateDoc(doc(db, 'children', target.id), { modeOfDelivery, placeOfBirth });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save child record.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-lavender-50 pb-24">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-border-hairline px-4 py-3.5 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-lavender-100 border border-border-hairline text-haven-deep flex items-center justify-center" aria-label="Back"><ChevronLeft className="w-5 h-5" /></button>
        <div><h1 className="font-display font-bold text-xl text-ink-900">Add child</h1><p className="font-body text-xs text-ink-600">{count ? `Child ${count + 1} in your household` : 'Start a real child health record'}</p></div>
      </header>

      <form onSubmit={submit} className="p-4 space-y-4 max-w-lg mx-auto">
        <section className="rounded-[20px] p-4 text-white bg-gradient-to-r from-haven-deep to-haven-orchid">
          <Baby className="w-6 h-6 mb-2" />
          <h2 className="font-display font-bold text-lg">{count ? 'Add another child' : 'Begin the child journey'}</h2>
          <p className="font-body text-xs text-white/80 mt-1">Only information you enter is saved. Nothing is pre-filled as if it were true.</p>
        </section>
        {error && <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-xs text-red-700 flex gap-2"><Info className="w-4 h-4" />{error}</div>}

        <section className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-4">
          <h2 className="font-display font-bold text-base text-ink-900">Child information</h2>
          <label className="block text-xs font-display font-semibold text-ink-600">Name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter child's name" className="mt-1 w-full p-3 rounded-xl border border-border-hairline bg-lavender-50 font-body text-sm" required /></label>
          <label className="block text-xs font-display font-semibold text-ink-600">Date of birth<input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} max={new Date().toISOString().split('T')[0]} className="mt-1 w-full p-3 rounded-xl border border-border-hairline bg-lavender-50 font-body text-sm" required /></label>
          <div><p className="text-xs font-display font-semibold text-ink-600 mb-2">Sex</p><div className="grid grid-cols-2 gap-3">{(['girl', 'boy'] as const).map((s) => <button key={s} type="button" onClick={() => setSex(s)} className={`py-3 rounded-pill border font-display font-bold ${sex === s ? 'bg-haven-deep text-white border-haven-deep' : 'bg-white text-ink-700 border-border-hairline'}`}>{s === 'girl' ? 'Girl' : 'Boy'} {sex === s && <Check className="inline w-4 h-4 ml-1" />}</button>)}</div></div>
        </section>

        <section className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-4">
          <h2 className="font-display font-bold text-base text-ink-900 flex items-center gap-2"><Scale className="w-4 h-4 text-haven-orchid" />Birth details</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-display font-semibold text-ink-600">Weight (kg)<input type="number" step="0.01" min="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Optional" className="mt-1 w-full p-2.5 rounded-xl border border-border-hairline bg-lavender-50 text-sm" /></label>
            <label className="text-xs font-display font-semibold text-ink-600">Length (cm)<input type="number" step="0.1" min="1" value={length} onChange={(e) => setLength(e.target.value)} placeholder="Optional" className="mt-1 w-full p-2.5 rounded-xl border border-border-hairline bg-lavender-50 text-sm" /></label>
          </div>
          <label className="block text-xs font-display font-semibold text-ink-600">Head circumference (cm)<input type="number" step="0.1" min="1" value={head} onChange={(e) => setHead(e.target.value)} placeholder="Optional" className="mt-1 w-full p-3 rounded-xl border border-border-hairline bg-lavender-50 text-sm" /></label>
          <label className="block text-xs font-display font-semibold text-ink-600">Mode of delivery<select value={modeOfDelivery} onChange={(e) => setModeOfDelivery(e.target.value)} className="mt-1 w-full p-3 rounded-xl border border-border-hairline bg-lavender-50 text-sm" required><option value="">Select mode</option><option value="Vaginal birth">Vaginal birth</option><option value="Caesarean birth">Caesarean birth</option><option value="Assisted vaginal birth">Assisted vaginal birth</option><option value="Other">Other</option></select></label>
          <label className="block text-xs font-display font-semibold text-ink-600">Place of birth<input value={placeOfBirth} onChange={(e) => setPlaceOfBirth(e.target.value)} placeholder="Facility name or Home" className="mt-1 w-full p-3 rounded-xl border border-border-hairline bg-lavender-50 text-sm" required /></label>
          <label className="block text-xs font-display font-semibold text-ink-600">CWC number<input value={cwc} onChange={(e) => setCwc(e.target.value)} placeholder="Optional" className="mt-1 w-full p-3 rounded-xl border border-border-hairline bg-lavender-50 text-sm" /></label>
        </section>

        <div className="space-y-2.5">
          <button disabled={saving} className="w-full py-3.5 rounded-pill text-white font-display font-bold disabled:opacity-50" style={{ background: 'var(--grad-haven)' }}>{saving ? 'Saving…' : 'Save child'}</button>
          <button type="button" onClick={onBack} disabled={saving} className="w-full py-3 rounded-pill bg-white border-[1.5px] border-haven-deep text-haven-deep font-display font-bold">Cancel</button>
        </div>
      </form>
    </div>
  );
};
