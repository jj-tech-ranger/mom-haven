import React from 'react';
import { X, Printer, Download, CheckCircle2, ShieldCheck, FileText } from 'lucide-react';
import Button from '../Button';

interface PrintExportModalProps {
  motherName: string;
  pregnancySummary: any;
  onClose: () => void;
}

export default function PrintExportModal({
  motherName,
  pregnancySummary,
  onClose,
}: PrintExportModalProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-[28px] sm:rounded-[24px] w-full max-w-lg p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-[var(--haven-deep)]" />
            <h2 className="font-display font-extrabold text-[18px] text-[var(--ink-900)]">
              Consolidated Clinical Export
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--lavender-50)] flex items-center justify-center text-[var(--ink-600)] hover:text-[var(--ink-900)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable preview document */}
        <div className="my-4 p-5 bg-white border border-slate-300 rounded-[16px] text-left text-[12px] space-y-4 shadow-xs">
          <div className="flex justify-between items-start border-b border-slate-200 pb-3">
            <div>
              <h3 className="font-display font-black text-[16px] text-slate-900">
                MomHaven Maternal Health Record
              </h3>
              <p className="text-slate-600">Standard MOH 216 Clinical Summary Export</p>
            </div>
            <div className="text-right">
              <span className="font-mono text-[11px] text-slate-500">Date: {new Date().toLocaleDateString('en-GB')}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-slate-800">
            <div>
              <strong>Patient:</strong> {motherName}
            </div>
            <div>
              <strong>Gestational Age:</strong> Week 24 (EDD: 15 Nov 2026)
            </div>
            <div>
              <strong>Blood Group &amp; Rh:</strong> O Positive (Rh+)
            </div>
            <div>
              <strong>Latest Blood Pressure:</strong> 118 / 76 mmHg
            </div>
          </div>

          <div className="border-t border-slate-200 pt-3 space-y-2">
            <h4 className="font-bold text-slate-900">ANC Contact Summary:</h4>
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="p-1.5">Visit</th>
                  <th className="p-1.5">Date</th>
                  <th className="p-1.5">Facility</th>
                  <th className="p-1.5">BP</th>
                  <th className="p-1.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-1.5">Contact 1</td>
                  <td className="p-1.5">10 Jan 2026</td>
                  <td className="p-1.5">Kariokor HC</td>
                  <td className="p-1.5">110/70</td>
                  <td className="p-1.5 text-emerald-700 font-bold">Verified</td>
                </tr>
                <tr>
                  <td className="p-1.5">Contact 2</td>
                  <td className="p-1.5">14 Feb 2026</td>
                  <td className="p-1.5">Kariokor HC</td>
                  <td className="p-1.5">114/72</td>
                  <td className="p-1.5 text-emerald-700 font-bold">Verified</td>
                </tr>
                <tr>
                  <td className="p-1.5">Contact 3</td>
                  <td className="p-1.5">28 Feb 2026</td>
                  <td className="p-1.5">Kariokor HC</td>
                  <td className="p-1.5">118/76</td>
                  <td className="p-1.5 text-amber-700 font-bold">Reported</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <Button
            variant="primary"
            onClick={handlePrint}
            className="w-full py-3.5 flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print or Save as PDF</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
