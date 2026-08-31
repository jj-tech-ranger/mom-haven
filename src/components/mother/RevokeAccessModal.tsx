import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface RevokeAccessModalProps {
  isOpen: boolean;
  targetName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const RevokeAccessModal: React.FC<RevokeAccessModalProps> = ({
  isOpen,
  targetName,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-[24px] w-full max-w-sm p-6 space-y-4 shadow-2xl animate-scale-up border border-border-hairline text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h3 className="font-display font-bold text-xl text-ink-900">Revoke Access?</h3>
          <p className="font-body text-xs text-ink-600 leading-relaxed max-w-[260px] mx-auto">
            Are you sure you want to remove access for <span className="font-bold text-ink-900">{targetName}</span>? They will no longer be able to view your birth plan or child records.
          </p>
        </div>

        <div className="space-y-2.5 pt-2">
          <button
            onClick={onConfirm}
            className="w-full py-3.5 bg-red-600 text-white font-display font-bold text-sm rounded-pill shadow-button hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Confirm revoke</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 bg-white border border-border-hairline text-ink-700 font-display font-bold text-sm rounded-pill hover:bg-lavender-50 transition-colors"
          >
            Keep access
          </button>
        </div>
      </div>
    </div>
  );
};
