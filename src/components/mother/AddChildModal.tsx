import React, { useState } from 'react';
import { X, Baby, Calendar, User, ArrowRight, ShieldCheck } from 'lucide-react';
import Button from '../Button';
import { ChildDoc } from '../../types';

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; dateOfBirth: string; sex: 'boy' | 'girl'; birthWeightGrams?: number }) => Promise<void>;
}

export const AddChildModal: React.FC<AddChildModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [sex, setSex] = useState<'boy' | 'girl'>('boy');
  const [birthWeight, setBirthWeight] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide baby name or nickname');
      return;
    }
    if (!dateOfBirth) {
      setError('Please provide date of birth');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        dateOfBirth,
        sex,
        birthWeightGrams: birthWeight ? Number(birthWeight) : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save child record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-[#241451]/60 backdrop-blur-xs" onClick={onClose} />

      {/* Sheet / Dialog */}
      <div className="relative w-full max-w-[420px] bg-white rounded-t-[24px] sm:rounded-[24px] shadow-card-3 border border-border-hairline p-5 max-h-[90vh] overflow-y-auto flex flex-col z-10 animate-in slide-in-from-bottom duration-200">
        <div className="w-12 h-1.5 bg-[#E5DFF0] rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between pb-3 border-b border-border-hairline">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white"
              style={{ background: 'var(--grad-haven)' }}
            >
              <Baby className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-ink-900 leading-tight">
                Add Child Profile
              </h2>
              <p className="font-body text-xs text-ink-600">
                Kenya MOH 216 Child Health Record
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-lavender-100 flex items-center justify-center text-ink-600 hover:text-ink-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          {error && (
            <div className="p-3 bg-status-urgent-bg border border-status-urgent/30 rounded-card text-xs text-status-urgent">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-display font-bold text-ink-900 mb-1">
              Child's Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Liam Kibet"
              className="w-full px-3.5 py-2.5 bg-lavender-50 rounded-input border border-border-hairline text-sm text-ink-900 focus:outline-none focus:border-haven-orchid focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-display font-bold text-ink-900 mb-1">
              Date of Birth
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-ink-400" />
              <input
                type="date"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-lavender-50 rounded-input border border-border-hairline text-sm text-ink-900 focus:outline-none focus:border-haven-orchid focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-display font-bold text-ink-900 mb-1.5">
              Sex
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSex('boy')}
                className={`py-2 px-3 rounded-pill text-xs font-display font-bold border transition-all cursor-pointer ${
                  sex === 'boy'
                    ? 'bg-haven-deep text-white border-haven-deep shadow-sm'
                    : 'bg-white text-ink-600 border-border-hairline'
                }`}
              >
                Boy
              </button>
              <button
                type="button"
                onClick={() => setSex('girl')}
                className={`py-2 px-3 rounded-pill text-xs font-display font-bold border transition-all cursor-pointer ${
                  sex === 'girl'
                    ? 'bg-haven-deep text-white border-haven-deep shadow-sm'
                    : 'bg-white text-ink-600 border-border-hairline'
                }`}
              >
                Girl
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-display font-bold text-ink-900 mb-1">
              Birth Weight in grams (optional)
            </label>
            <input
              type="number"
              value={birthWeight}
              onChange={(e) => setBirthWeight(e.target.value)}
              placeholder="e.g. 3200"
              className="w-full px-3.5 py-2.5 bg-lavender-50 rounded-input border border-border-hairline text-sm text-ink-900 focus:outline-none focus:border-haven-orchid focus:bg-white"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Saving child...' : 'Save Child Record'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
