import React, { useState } from 'react';
import { X, Sparkles, Heart, Baby } from 'lucide-react';
import { collection, getDocs, query, updateDoc, doc, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ChildDoc, PregnancyDoc } from '../../types';

interface BirthOutcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  pregnancy?: PregnancyDoc | null;
  onCompleteWithChild: (childData: {
    name: string;
    dateOfBirth: string;
    sex: 'boy' | 'girl';
    birthWeightGrams?: number;
    facilityName?: string;
  }) => Promise<void>;
  onCompleteWithoutChild?: () => Promise<void>;
}

export const BirthOutcomeModal: React.FC<BirthOutcomeModalProps> = ({ isOpen, onClose, pregnancy, onCompleteWithChild, onCompleteWithoutChild }) => {
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [timeOfBirth, setTimeOfBirth] = useState('');
  const [sex, setSex] = useState<'girl' | 'boy' | ''>('');
  const [birthWeightGrams, setBirthWeightGrams] = useState<string>('');
  const [birthLengthCm, setBirthLengthCm] = useState<string>('');
  const [deliveryType, setDeliveryType] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmitWithChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateOfBirth || !sex || !deliveryType || !placeOfBirth.trim()) {
      setError('Enter the date, mode of delivery, sex and place of birth before saving.');
      return;
    }
    if (!pregnancy?.id) {
      setError('No active pregnancy is available for this birth outcome.');
      return;
    }
    setIsSubmitting(true); setError('');
    try {
      await onCompleteWithChild({
        name: null as unknown as string,
        dateOfBirth,
        sex,
        birthWeightGrams: birthWeightGrams ? parseInt(birthWeightGrams, 10) : undefined,
        facilityName: placeOfBirth.trim() || undefined,
      });
      const snapshot = await getDocs(query(collection(db, 'children'), where('motherId', '==', pregnancy.motherId)));
      const candidates = snapshot.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<ChildDoc, 'id'>) }))
        .filter((child) => child.dateOfBirth === dateOfBirth)
        .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
      const createdChild = candidates[0];
      if (createdChild) {
        await updateDoc(doc(db, 'children', createdChild.id), {
          name: null,
          dateOfBirth,
          sex,
          birthWeightGrams: birthWeightGrams ? parseInt(birthWeightGrams, 10) : null,
          birthLengthCm: birthLengthCm ? parseFloat(birthLengthCm) : null,
          modeOfDelivery: deliveryType,
          timeOfBirth: timeOfBirth || null,
          placeOfBirth: placeOfBirth.trim(),
          facilityName: placeOfBirth.trim(),
          birthOutcomeRecordedAt: new Date().toISOString(),
        });
      }
      onClose();
      window.location.reload();
    } catch (err) { console.error('Error saving birth outcome:', err); setError('Could not save the birth outcome. Please try again.'); }
    finally { setIsSubmitting(false); }
  };

  const handleSaveWithoutChild = async () => {
    if (!pregnancy?.id) { setError('No active pregnancy is available for completion.'); return; }
    setIsSubmitting(true); setError('');
    try { if (onCompleteWithoutChild) await onCompleteWithoutChild(); onClose(); window.location.reload(); }
    catch (err) { console.error('Error marking pregnancy complete:', err); setError('Could not complete the pregnancy. Please try again.'); }
    finally { setIsSubmitting(false); }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm overflow-y-auto">
    <div className="relative w-full max-w-[420px] bg-white rounded-[28px] border border-border-hairline shadow-card-2 p-6 animate-in zoom-in-95 duration-200 my-8">
      <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-lavender-100 text-ink-600 hover:text-ink-900 flex items-center justify-center" aria-label="Close"><X className="w-4 h-4" /></button>
      <div className="text-center space-y-2 mb-5">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-haven-deep via-haven-orchid to-lavender-200 text-white flex items-center justify-center mx-auto shadow-md relative"><Baby className="w-8 h-8" /><div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-ink-900 flex items-center justify-center shadow-sm"><Sparkles className="w-3.5 h-3.5" /></div></div>
        <h2 className="font-display font-bold text-2xl text-ink-900 leading-tight">Welcome, little one! 🎉</h2>
        <p className="font-body text-xs text-ink-600 max-w-[290px] mx-auto leading-relaxed">Record this happy milestone. Your baby's name can be added later from the Child Dashboard.</p>
      </div>
      {error && <div className="mb-3 rounded-2xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">{error}</div>}
      <form onSubmit={handleSubmitWithChild} className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-display font-semibold text-ink-600 mb-1">Date of birth *</label><input type="date" value={dateOfBirth} onChange={e=>setDateOfBirth(e.target.value)} className="w-full p-2.5 bg-lavender-50/70 border border-border-hairline rounded-xl font-body text-sm text-ink-900" required /></div><div><label className="block text-xs font-display font-semibold text-ink-600 mb-1">Time of birth <span className="font-body font-normal">(optional)</span></label><input type="time" value={timeOfBirth} onChange={e=>setTimeOfBirth(e.target.value)} className="w-full p-2.5 bg-lavender-50/70 border border-border-hairline rounded-xl font-body text-sm text-ink-900" /></div></div>
        <div><label className="block text-xs font-display font-semibold text-ink-600 mb-1">Mode of delivery *</label><select value={deliveryType} onChange={e=>setDeliveryType(e.target.value)} className="w-full p-2.5 bg-lavender-50/70 border border-border-hairline rounded-xl font-body text-sm text-ink-900" required><option value="">Select mode</option><option value="Spontaneous Vaginal Delivery (SVD)">Vaginal delivery (SVD)</option><option value="Caesarean Section (CS)">Caesarean section (CS)</option><option value="Assisted Vacuum/Forceps">Assisted vacuum / forceps</option></select></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-display font-semibold text-ink-600 mb-1">Birth weight (grams)</label><input type="number" min="0" value={birthWeightGrams} onChange={e=>setBirthWeightGrams(e.target.value)} placeholder="Enter grams" className="w-full p-2.5 bg-lavender-50/70 border border-border-hairline rounded-xl font-body text-sm text-ink-900" /></div><div><label className="block text-xs font-display font-semibold text-ink-600 mb-1">Birth length (cm)</label><input type="number" min="0" step="0.1" value={birthLengthCm} onChange={e=>setBirthLengthCm(e.target.value)} placeholder="Enter cm" className="w-full p-2.5 bg-lavender-50/70 border border-border-hairline rounded-xl font-body text-sm text-ink-900" /></div></div>
        <div><label className="block text-xs font-display font-semibold text-ink-600 mb-1">Sex *</label><div className="grid grid-cols-2 gap-2">{(['girl','boy'] as const).map(value=><button key={value} type="button" onClick={()=>setSex(value)} className={`py-2.5 rounded-xl text-xs font-display font-bold border ${sex===value?'bg-haven-deep text-white border-haven-deep':'bg-lavender-50/70 text-ink-600 border-border-hairline'}`}>{value==='girl'?'Girl 👧':'Boy 👦'}</button>)}</div></div>
        <div><label className="block text-xs font-display font-semibold text-ink-600 mb-1">Place of birth *</label><input type="text" value={placeOfBirth} onChange={e=>setPlaceOfBirth(e.target.value)} placeholder="Facility or home" className="w-full p-2.5 bg-lavender-50/70 border border-border-hairline rounded-xl font-body text-sm text-ink-900" required /></div>
        <div className="space-y-2.5 pt-3"><button type="submit" disabled={isSubmitting} className="w-full py-4 px-6 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-base rounded-pill shadow-button flex items-center justify-center gap-2 disabled:opacity-60"><Heart className="w-5 h-5"/><span>{isSubmitting?'Saving birth outcome…':'Save birth outcome'}</span></button><button type="button" onClick={handleSaveWithoutChild} disabled={isSubmitting} className="w-full py-3 px-5 bg-white border-[1.5px] border-haven-deep text-haven-deep font-display font-bold text-xs rounded-pill disabled:opacity-60">Save without child record yet</button></div>
      </form>
    </div>
  </div>;
};
