import React, { useState } from 'react';
import { FileDown, CheckCircle2, X } from 'lucide-react';

interface ExportConfirmationModalProps {
  isOpen: boolean;
  selectedCategories: string[];
  format: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const ExportConfirmationModal: React.FC<ExportConfirmationModalProps> = ({
  isOpen,
  selectedCategories,
  format,
  onClose,
  onConfirm,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setDownloadReady(true);
      onConfirm();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-[24px] w-full max-w-sm p-6 space-y-4 shadow-2xl animate-scale-up border border-border-hairline text-center">
        <div className="w-14 h-14 rounded-2xl bg-lavender-100 text-haven-orchid flex items-center justify-center mx-auto">
          <FileDown className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h3 className="font-display font-bold text-xl text-ink-900">
            {downloadReady ? 'Export Completed!' : 'Confirm Export'}
          </h3>
          <p className="font-body text-xs text-ink-600 leading-relaxed max-w-[260px] mx-auto">
            {downloadReady
              ? 'Your official MomHaven health record booklet has been generated.'
              : `Your ${format.toUpperCase()} export will include ${selectedCategories.length} selected record categories.`}
          </p>
        </div>

        {!downloadReady ? (
          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full py-3.5 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-sm rounded-pill shadow-button hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {isExporting ? 'Generating report...' : 'Confirm export'}
            </button>

            <button
              onClick={onClose}
              disabled={isExporting}
              className="w-full py-3 bg-white border border-border-hairline text-ink-700 font-display font-bold text-sm rounded-pill hover:bg-lavender-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-sm rounded-pill shadow-button hover:opacity-95 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Done</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
