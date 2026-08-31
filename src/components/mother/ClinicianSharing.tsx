import React from 'react';
import { ChevronLeft, Share2, Key, History, Shield, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import { ClinicianAccessSessionDoc } from '../../types';

interface ClinicianSharingProps {
  onBack: () => void;
  onGenerateClinicShareCode: () => void;
}

export const ClinicianSharing: React.FC<ClinicianSharingProps> = ({
  onBack,
  onGenerateClinicShareCode,
}) => {
  const pastSessions = [
    {
      id: 'sess_1',
      clinicianName: 'Nurse A. Wanjiru',
      facilityName: 'Kariokor Health Centre',
      date: '2 Mar 2026',
      duration: '15 min consultation',
      status: 'expired',
    },
    {
      id: 'sess_2',
      clinicianName: 'Dr. M. Kimani',
      facilityName: 'Pumwani Maternity Hospital',
      date: '14 Jan 2026',
      duration: 'Childbirth delivery admission',
      status: 'expired',
    },
  ];

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
        <h1 className="font-display font-bold text-xl text-ink-900">Clinician Sharing</h1>
        <div className="w-10" />
      </div>

      {/* Hero Card */}
      <div className="bg-gradient-to-r from-haven-deep to-haven-orchid p-5 rounded-[20px] text-white shadow-card-1 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-white/90" />
          <span className="font-display font-bold text-xs uppercase tracking-wider text-white/80">
            MOH Clinical Portal Sync
          </span>
        </div>
        <h2 className="font-display font-bold text-lg text-white">
          Secure, Mother-Authorized Clinical Sessions
        </h2>
        <p className="font-body text-xs text-white/85 leading-relaxed">
          Generate a temporary 15-minute Clinic Share Code for your doctor or nurse during a clinic visit. You remain in complete control of your data.
        </p>
      </div>

      {/* Primary Action Button */}
      <div>
        <button
          onClick={onGenerateClinicShareCode}
          className="w-full py-4 px-6 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-base rounded-pill shadow-button hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Key className="w-5 h-5" />
          <span>Generate Clinic Share Code</span>
        </button>
      </div>

      {/* Past Clinical Sessions Audit */}
      <div className="space-y-3">
        <span className="font-body text-[11px] font-bold tracking-wider text-ink-600 uppercase px-1">
          PAST ACCESS SESSIONS
        </span>

        <div className="space-y-2.5">
          {pastSessions.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-display font-bold text-sm text-ink-900">{s.clinicianName}</h4>
                  <p className="font-body text-xs text-ink-600">{s.facilityName}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-lavender-100 text-ink-600 text-[10px] font-display font-bold capitalize">
                  {s.status}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-body text-ink-600 border-t border-border-hairline/50 pt-2">
                <span>{s.date}</span>
                <span>•</span>
                <span>{s.duration}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
