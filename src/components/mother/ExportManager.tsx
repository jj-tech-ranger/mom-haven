import React, { useState } from 'react';
import { ChevronLeft, Download, CheckSquare, Square, FileText, Check, AlertCircle } from 'lucide-react';

interface ExportManagerProps {
  onBack: () => void;
  onProceedToConfirm: (selectedCategories: string[], format: string) => void;
}

export const ExportManager: React.FC<ExportManagerProps> = ({ onBack, onProceedToConfirm }) => {
  const [selectedCats, setSelectedCats] = useState<Record<string, boolean>>({
    pregnancy: true,
    child: true,
    immunization: true,
    growth: true,
  });
  const [format, setFormat] = useState<'pdf' | 'csv'>('pdf');

  const categories = [
    { id: 'pregnancy', label: 'Pregnancy & ANC History', count: '6 encounters' },
    { id: 'child', label: 'Child Health & Newborn Records', count: '14 records' },
    { id: 'immunization', label: 'KEPI Immunization Records & Certificates', count: '8 doses' },
    { id: 'growth', label: 'Growth Curves & MUAC Logs', count: '5 assessments' },
  ];

  const toggleCat = (id: string) => {
    setSelectedCats((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectAll = () => {
    const allSelected = Object.values(selectedCats).every(Boolean);
    const newVal = !allSelected;
    setSelectedCats({
      pregnancy: newVal,
      child: newVal,
      immunization: newVal,
      growth: newVal,
    });
  };

  const selectedList = Object.keys(selectedCats).filter((k) => selectedCats[k]);
  const hasSelection = selectedList.length > 0;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top App Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white border border-border-hairline shadow-sm flex items-center justify-center text-ink-900 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-xl text-ink-900">Export Health Records</h1>
        <div className="w-10" />
      </div>

      {/* Intro info */}
      <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-2">
        <h2 className="font-display font-bold text-base text-ink-900">
          Generate Verified Health Report
        </h2>
        <p className="font-body text-xs text-ink-600 leading-relaxed">
          Create an official digital export containing all clinical and caregiver-entered records formatted in accordance with the Kenya Mother & Child Health handbook.
        </p>
      </div>

      {/* Category Checklist */}
      <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-display font-bold text-xs text-ink-600 uppercase tracking-wider">
            Select Sections to Include
          </span>
          <button
            onClick={handleSelectAll}
            className="text-xs font-display font-bold text-haven-deep hover:underline"
          >
            {Object.values(selectedCats).every(Boolean) ? 'Deselect all' : 'Select all'}
          </button>
        </div>

        <div className="space-y-2.5">
          {categories.map((cat) => (
            <label
              key={cat.id}
              onClick={() => toggleCat(cat.id)}
              className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                selectedCats[cat.id]
                  ? 'bg-lavender-50/70 border-haven-orchid/50'
                  : 'bg-white border-border-hairline hover:bg-lavender-50/30'
              }`}
            >
              <div>
                <p className="font-display font-bold text-sm text-ink-900">{cat.label}</p>
                <p className="font-body text-xs text-ink-600">{cat.count}</p>
              </div>
              <input
                type="checkbox"
                checked={!!selectedCats[cat.id]}
                onChange={() => {}}
                className="w-5 h-5 rounded-md text-haven-deep focus:ring-haven-orchid"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Format Choice */}
      <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-3">
        <span className="font-display font-bold text-xs text-ink-600 uppercase tracking-wider">
          Export Document Format
        </span>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setFormat('pdf')}
            className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
              format === 'pdf'
                ? 'bg-haven-deep text-white border-haven-deep shadow-sm'
                : 'bg-white text-ink-900 border-border-hairline hover:bg-lavender-50'
            }`}
          >
            <FileText className="w-5 h-5" />
            <div>
              <p className="font-display font-bold text-xs">PDF Document</p>
              <p className={`text-[10px] ${format === 'pdf' ? 'text-white/80' : 'text-ink-600'}`}>
                Printable booklet
              </p>
            </div>
          </button>

          <button
            onClick={() => setFormat('csv')}
            className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
              format === 'csv'
                ? 'bg-haven-deep text-white border-haven-deep shadow-sm'
                : 'bg-white text-ink-900 border-border-hairline hover:bg-lavender-50'
            }`}
          >
            <Download className="w-5 h-5" />
            <div>
              <p className="font-display font-bold text-xs">CSV Data</p>
              <p className={`text-[10px] ${format === 'csv' ? 'text-white/80' : 'text-ink-600'}`}>
                Spreadsheet format
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="pt-2">
        <button
          disabled={!hasSelection}
          onClick={() => onProceedToConfirm(selectedList, format)}
          className="w-full py-4 px-6 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-base rounded-pill shadow-button hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <Download className="w-5 h-5" />
          <span>Export selected ({selectedList.length})</span>
        </button>
      </div>
    </div>
  );
};
