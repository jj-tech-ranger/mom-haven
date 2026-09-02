import React, { useState } from 'react';
import { X, Upload, FileText, Image, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { DocumentRecord, Provenance } from '../../types';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { KENYA_FACILITIES } from '../../data/kenyaFacilities';
import Button from '../Button';

interface DocumentUploadModalProps {
  userId: string;
  onClose: () => void;
  onUploaded: () => void;
}

export default function DocumentUploadModal({
  userId,
  onClose,
  onUploaded,
}: DocumentUploadModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'Ultrasound' | 'Lab Results' | 'Immunization' | 'Clinical Notes' | 'Prescriptions'>('Lab Results');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [facilityName, setFacilityName] = useState('Kariokor Health Centre');
  const [notes, setNotes] = useState('');
  const [fileSelected, setFileSelected] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileSelected(file.name);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a document title.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const provenance: Provenance = {
        status: 'REPORTED',
        enteredBy: userId,
        enteredAt: new Date().toISOString(),
        verifiedBy: null,
        verifiedAt: null,
      };

      await addDoc(collection(db, 'documents'), {
        userId,
        title: title.trim(),
        category,
        date,
        facilityName: facilityName.trim() || undefined,
        notes: notes.trim(),
        provenance,
        fileType: fileSelected?.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
        createdAt: new Date().toISOString(),
      });

      onUploaded();
      onClose();
    } catch (err: any) {
      console.error('Failed to upload document record', err);
      setError(err?.message || 'Failed to upload document.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-[28px] sm:rounded-[24px] w-full max-w-md p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[var(--lavender-100)] flex items-center justify-center text-[var(--haven-deep)]">
              <Upload className="w-4 h-4" />
            </div>
            <h2 className="font-display font-extrabold text-[18px] text-[var(--ink-900)]">
              Upload Health Document
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

        {/* Provenance Disclaimer */}
        <div className="mt-3 p-3.5 rounded-[16px] bg-[#FBF0DC] border border-[#A15E06]/30 flex items-start gap-2.5 text-[12px] text-[#A15E06]">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#A15E06]" />
          <div>
            <span className="font-bold font-display block">Self-Reported Document</span>
            Uploaded scans and lab test photos remain marked as <strong>Self-Reported</strong> until examined by a registered clinician.
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-[14px] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4 pt-3">
          {/* File Picker Box */}
          <div className="border-2 border-dashed border-[var(--border-hairline)] hover:border-[var(--haven-orchid)] rounded-[18px] p-5 text-center bg-[var(--lavender-50)]/50 transition-colors relative">
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="flex flex-col items-center justify-center">
              <Upload className="w-7 h-7 text-[var(--haven-deep)] mb-2" />
              <p className="font-display font-bold text-[13px] text-[var(--ink-900)]">
                {fileSelected || 'Tap to take photo or choose file'}
              </p>
              <span className="text-[11px] text-[var(--ink-500)] mt-0.5">
                PNG, JPG, PDF up to 10MB
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
              Document Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Ultrasound Scan 20 Weeks, Blood Count Report"
              className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
              >
                <option value="Ultrasound">Ultrasound Scan</option>
                <option value="Lab Results">Lab Results</option>
                <option value="Immunization">Immunization Record</option>
                <option value="Clinical Notes">Clinical Notes</option>
                <option value="Prescriptions">Prescriptions</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
                Document Date
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
              Healthcare Facility
            </label>
            <input
              type="text"
              list="facilities-doc"
              value={facilityName}
              onChange={e => setFacilityName(e.target.value)}
              placeholder="e.g. Pumwani Maternity Hospital"
              className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
            />
            <datalist id="facilities-doc">
              {KENYA_FACILITIES.map(f => (
                <option key={f.id} value={f.name} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
              Summary Findings / Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Normal placenta, Hemoglobin 12.4g/dL..."
              className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
            />
          </div>

          <Button type="submit" variant="primary" disabled={loading} className="w-full py-3.5 mt-2">
            {loading ? 'Saving document...' : 'Save to Health Vault'}
          </Button>
        </form>
      </div>
    </div>
  );
}
