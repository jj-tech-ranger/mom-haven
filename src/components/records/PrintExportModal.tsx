import React, { useState, useEffect } from 'react';
import { X, Printer, ShieldCheck, FileText, AlertCircle } from 'lucide-react';
import Button from '../Button';
import { getActivePregnancy, getAncEncounters } from '../../services/pregnancyService';

interface PrintExportModalProps {
  motherName: string;
  userId?: string;
  pregnancySummary?: any;
  onClose: () => void;
}

export default function PrintExportModal({
  motherName,
  userId,
  pregnancySummary,
  onClose,
}: PrintExportModalProps) {
  const [loading, setLoading] = useState(!pregnancySummary && !!userId);
  const [activePregnancy, setActivePregnancy] = useState<any>(pregnancySummary?.pregnancy || null);
  const [encounters, setEncounters] = useState<any[]>(pregnancySummary?.pregnancy?.ancSummary?.encounters || []);

  useEffect(() => {
    if (pregnancySummary) {
      setActivePregnancy(pregnancySummary.pregnancy);
      setEncounters(pregnancySummary.pregnancy?.ancSummary?.encounters || []);
      return;
    }

    if (!userId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const preg = await getActivePregnancy(userId!);
        if (isMounted && preg) {
          setActivePregnancy(preg);
          if (preg.id) {
            const encs = await getAncEncounters(preg.id);
            if (isMounted) setEncounters(encs);
          }
        }
      } catch (err) {
        console.warn('Could not load clinical export data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [userId, pregnancySummary]);

  const handlePrint = () => {
    window.print();
  };

  const latestEncounter = encounters[0];
  const gestationalAge = activePregnancy?.gestationalAgeWeeks 
    ? `Week ${activePregnancy.gestationalAgeWeeks}${activePregnancy.edd ? ` (EDD: ${new Date(activePregnancy.edd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })})` : ''}`
    : 'Not recorded';
  const bloodGroup = activePregnancy?.bloodGroup || 'Not recorded';
  const latestBp = latestEncounter?.bloodPressure || 
    (latestEncounter?.systolicBp && latestEncounter?.diastolicBp ? `${latestEncounter.systolicBp}/${latestEncounter.diastolicBp} mmHg` : 'Not recorded');

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
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
              <strong>Gestational Age:</strong> {gestationalAge}
            </div>
            <div>
              <strong>Blood Group &amp; Rh:</strong> {bloodGroup}
            </div>
            <div>
              <strong>Latest Blood Pressure:</strong> {latestBp}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-3 space-y-2">
            <h4 className="font-bold text-slate-900">ANC Contact Summary:</h4>
            {loading ? (
              <p className="text-xs text-slate-500 italic py-2">Loading clinical encounter history...</p>
            ) : (
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
                  {encounters.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-3 text-center text-slate-500 italic">
                        No antenatal encounters recorded yet.
                      </td>
                    </tr>
                  ) : (
                    encounters.map((enc: any, idx: number) => {
                      const isVerified = enc.provenance?.status === 'VERIFIED';
                      return (
                        <tr key={enc.id || idx}>
                          <td className="p-1.5 font-medium">Contact {enc.visitNumber || idx + 1}</td>
                          <td className="p-1.5">
                            {enc.date ? new Date(enc.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                          <td className="p-1.5">{enc.facilityName || enc.facility || 'Self-Reported'}</td>
                          <td className="p-1.5">{enc.bloodPressure || (enc.systolicBp && enc.diastolicBp ? `${enc.systolicBp}/${enc.diastolicBp}` : '—')}</td>
                          <td className={`p-1.5 font-bold ${isVerified ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {isVerified ? 'Verified' : 'Reported'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
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
