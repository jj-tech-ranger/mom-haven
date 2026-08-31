import React, { useState } from 'react';
import { X, Heart, Calendar, ArrowRight, Info, ShieldCheck } from 'lucide-react';
import Button from '../Button';

interface AddPregnancyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { lmp?: string; edd: string; method: 'LMP' | 'EDD' }) => Promise<void>;
}

export const AddPregnancyModal: React.FC<AddPregnancyModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [method, setMethod] = useState<'LMP' | 'EDD'>('LMP');
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const calculateEDDandLMP = () => {
    if (!selectedDate) return null;
    const d = new Date(selectedDate);
    if (isNaN(d.getTime())) return null;

    if (method === 'LMP') {
      const edd = new Date(d);
      edd.setDate(edd.getDate() + 280);
      return {
        lmp: d.toISOString().split('T')[0],
        edd: edd.toISOString().split('T')[0],
        formattedEDD: edd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      };
    } else {
      const lmp = new Date(d);
      lmp.setDate(lmp.getDate() - 280);
      return {
        lmp: lmp.toISOString().split('T')[0],
        edd: d.toISOString().split('T')[0],
        formattedEDD: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      };
    }
  };

  const computed = calculateEDDandLMP();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !computed) {
      setError('Please select a valid date');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSave({
        lmp: computed.lmp,
        edd: computed.edd,
        method,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save pregnancy');
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
              <Heart className="w-4 h-4 fill-white/20" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-ink-900 leading-tight">
                Add Pregnancy Record
              </h2>
              <p className="font-body text-xs text-ink-600">
                Kenya MOH 216 Gestational Timeline
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

          {/* Segmented Toggle */}
          <div className="bg-lavender-100 p-1 rounded-pill flex items-center border border-border-hairline">
            <button
              type="button"
              onClick={() => {
                setMethod('LMP');
                setSelectedDate('');
                setError(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-pill text-xs font-display font-bold transition-all cursor-pointer ${
                method === 'LMP'
                  ? 'bg-haven-deep text-white shadow-card-1'
                  : 'text-ink-600 hover:text-haven-deep'
              }`}
            >
              Last Period (LMP)
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod('EDD');
                setSelectedDate('');
                setError(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-pill text-xs font-display font-bold transition-all cursor-pointer ${
                method === 'EDD'
                  ? 'bg-haven-deep text-white shadow-card-1'
                  : 'text-ink-600 hover:text-haven-deep'
              }`}
            >
              Due Date (EDD)
            </button>
          </div>

          <div>
            <label className="block text-xs font-display font-bold text-ink-900 mb-1">
              {method === 'LMP' ? 'Date of Last Period (LMP)' : 'Doctor / Ultrasound EDD'}
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-ink-400" />
              <input
                type="date"
                required
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setError(null);
                }}
                className="w-full pl-9 pr-3.5 py-2.5 bg-lavender-50 rounded-input border border-border-hairline text-sm text-ink-900 focus:outline-none focus:border-haven-orchid focus:bg-white"
              />
            </div>
          </div>

          {computed && (
            <div className="p-3 bg-lavender-100 rounded-card text-xs text-ink-900 flex items-center justify-between">
              <span className="text-ink-600">Calculated Due Date:</span>
              <span className="font-display font-bold text-haven-deep">
                {computed.formattedEDD}
              </span>
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !selectedDate}
              className="w-full flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Saving...' : 'Set as Active Pregnancy'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
