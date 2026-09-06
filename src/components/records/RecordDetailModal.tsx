import React from 'react';
import { 
  X, 
  FileText, 
  Calendar, 
  Building2, 
  Download, 
  Share2, 
  ShieldCheck, 
  Lock, 
  Printer,
  AlertTriangle,
  Activity,
  Heart,
  Baby,
  ArrowUpRight,
  CheckCircle2
} from 'lucide-react';
import { DocumentRecord } from '../../types';
import ProvenanceBadge, { ReferralBadge } from '../common/ProvenanceBadge';
import ProvenanceCaption from '../common/ProvenanceCaption';
import Button from '../Button';
import { usePreferences } from '../../context/PreferencesContext';

interface RecordDetailModalProps {
  record: DocumentRecord;
  onClose: () => void;
  onShareWithClinician: () => void;
}

export default function RecordDetailModal({
  record,
  onClose,
  onShareWithClinician,
}: RecordDetailModalProps) {
  const { t } = usePreferences();
  const isVerified = record.provenance?.status === 'VERIFIED';
  const data = record.structuredData || record.pncData || (record as any);

  const hasOpenReferral = Boolean(
    record.hasOpenReferral ||
    record.referralStatus === 'open' ||
    record.referralStatus === 'acknowledged' ||
    data?.referralStatus === 'open' ||
    data?.mentalHealthScreenResult === 'referred'
  );

  const isMentalHealthReferred = data?.mentalHealthScreenResult === 'referred';
  const isMentalHealthConcerns = data?.mentalHealthScreenResult === 'concerns_noted';
  const isLochiaFoul = data?.lochiaSmell === 'foul' || data?.lochia === 'foul';
  const isInvolutionTender = data?.uterineInvolution === 'Tender';
  const isCordInfected = data?.cordCondition === 'infected' || data?.umbilicalCordCondition === 'infected_discharge';

  const hasUrgentClinicalFlag = isMentalHealthReferred || isLochiaFoul || isInvolutionTender || isCordInfected;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-[28px] sm:rounded-[24px] w-full max-w-lg p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)] flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--lavender-100)] text-[var(--haven-deep)] text-[11px] font-display font-bold uppercase tracking-wider">
              {record.category}
            </span>
            <ProvenanceBadge provenance={record.provenance} />
            {hasOpenReferral && (
              <ReferralBadge
                label={t('modules.referrals.referredBadge', 'Referred — awaiting follow-up')}
                status="open"
              />
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--lavender-50)] flex items-center justify-center text-[var(--ink-600)] hover:text-[var(--ink-900)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-4">
          <div>
            <h2 className="font-display font-black text-[22px] text-[var(--ink-900)] leading-tight">
              {record.title}
            </h2>
            <div className="flex items-center gap-2 text-[12px] text-[var(--ink-600)] mt-1.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[var(--haven-orchid)]" />
                {new Date(record.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              {record.facilityName && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-[var(--haven-orchid)]" />
                  {record.facilityName}
                </span>
              )}
            </div>
          </div>

          <ProvenanceCaption provenance={record.provenance} />

          {/* Urgent Clinical Flag / Danger Sign banner */}
          {hasUrgentClinicalFlag && (
            <div className="bg-red-50 border border-red-200 rounded-[18px] p-4 text-red-900 flex items-start gap-3 shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4 text-red-700" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-display font-bold text-xs uppercase tracking-wider text-red-800">
                    Clinical Care Alert
                  </h4>
                  <ReferralBadge label="Immediate Follow-up" />
                </div>
                <p className="text-xs text-red-950 leading-relaxed">
                  {isMentalHealthReferred && 'Maternal emotional wellbeing evaluation recommended priority counseling and specialized care.'}
                  {isLochiaFoul && 'Foul-smelling lochia noted (possible postpartum infection). Prompt antibiotic evaluation advised.'}
                  {isInvolutionTender && 'Uterine tenderness noted on palpation. Clinical re-assessment required.'}
                  {isCordInfected && 'Infant umbilical cord redness/discharge noted. Urgent local care required.'}
                </p>
              </div>
            </div>
          )}

          {/* Open Referral Notice Banner */}
          {hasOpenReferral && !hasUrgentClinicalFlag && (
            <div className="bg-amber-50 border border-amber-300 rounded-[18px] p-4 text-amber-950 flex items-start gap-3 shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                <ArrowUpRight className="w-4 h-4 text-amber-800" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-display font-bold text-xs uppercase tracking-wider text-amber-800">
                    {t('modules.referrals.openReferralTitle', 'Active Clinical Referral')}
                  </h4>
                  <ReferralBadge label={t('modules.referrals.referredBadge', 'Referred — awaiting follow-up')} />
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">
                  {record.referralReason || data?.referralReason || t('modules.referrals.motherGuidance', 'Your clinician recorded a need for follow-up or specialized care. Please attend your scheduled review.')}
                </p>
              </div>
            </div>
          )}

          {/* Structured Clinical Observations (Plain-language mapped) */}
          {(data?.bloodPressure || data?.temperature || data?.uterineInvolution || data?.hivRetestResult || data?.infantFeedingMethod || data?.babyWeight || data?.babyWeightKg) && (
            <div className="bg-white p-4 rounded-[18px] border border-[var(--border-hairline)] shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Activity className="w-4 h-4 text-[var(--haven-deep)]" />
                <h4 className="font-display font-bold text-xs text-[var(--ink-900)]">
                  {t('modules.pnc.title', 'Postnatal Clinical Observations (MOH 216)')}
                </h4>
              </div>

              {/* Mother Section */}
              <div className="space-y-2">
                <span className="text-[10px] font-display font-bold text-gray-500 uppercase tracking-wider block">
                  {t('modules.pnc.motherSection', 'Part A: Mother Examination')}
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {data?.bloodPressure && (
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <span className="text-[10px] text-gray-500 block">{t('modules.pnc.fields.bloodPressure', 'Blood Pressure')}</span>
                      <strong className="font-bold text-gray-900">{data.bloodPressure} mmHg</strong>
                    </div>
                  )}
                  {data?.temperature && (
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <span className="text-[10px] text-gray-500 block">{t('modules.pnc.fields.temperature', 'Body Temperature')}</span>
                      <strong className="font-bold text-gray-900">{data.temperature} °C</strong>
                    </div>
                  )}
                  {data?.uterineInvolution && (
                    <div className={`p-2 rounded-lg ${isInvolutionTender ? 'bg-red-50 text-red-900' : 'bg-gray-50'}`}>
                      <span className="text-[10px] text-gray-500 block">{t('modules.pnc.fields.uterineInvolution', 'Womb Healing (Involution)')}</span>
                      <strong className="font-bold">{data.uterineInvolution}</strong>
                    </div>
                  )}
                  {(data?.lochiaAmount || data?.lochiaColour || data?.lochiaSmell) && (
                    <div className={`p-2 rounded-lg ${isLochiaFoul ? 'bg-red-50 text-red-900' : 'bg-gray-50'}`}>
                      <span className="text-[10px] text-gray-500 block">{t('modules.pnc.fields.lochia', 'Lochia Discharge')}</span>
                      <strong className="font-bold">
                        {[data.lochiaAmount, data.lochiaColour, data.lochiaSmell].filter(Boolean).join(' · ')}
                      </strong>
                    </div>
                  )}
                  {data?.haemoglobin && (
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <span className="text-[10px] text-gray-500 block">{t('modules.pnc.fields.haemoglobin', 'Haemoglobin (Hb)')}</span>
                      <strong className="font-bold text-gray-900">{data.haemoglobin} g/dL</strong>
                    </div>
                  )}
                  {data?.hivRetestResult && (
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <span className="text-[10px] text-gray-500 block">{t('modules.pnc.fields.hivRetest', 'Postpartum HIV Wellness Check')}</span>
                      <strong className="font-bold text-gray-900">
                        {data.hivRetestResult === 'non-reactive' ? 'Non-Reactive (Negative)' : data.hivRetestResult}
                      </strong>
                    </div>
                  )}
                  {data?.fpMethodChoice && (
                    <div className="p-2 bg-gray-50 rounded-lg col-span-2">
                      <span className="text-[10px] text-gray-500 block">{t('modules.pnc.fields.familyPlanning', 'Postpartum Family Planning Choice')}</span>
                      <strong className="font-bold text-gray-900">{data.fpMethodChoice}</strong>
                    </div>
                  )}
                  {data?.mentalHealthScreenResult && (
                    <div className={`p-2.5 rounded-lg col-span-2 ${
                      isMentalHealthReferred
                        ? 'bg-red-50 text-red-950 border border-red-200'
                        : isMentalHealthConcerns
                        ? 'bg-amber-50 text-amber-950 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-950'
                    }`}>
                      <span className="text-[10px] text-gray-500 block">{t('modules.pnc.fields.mentalHealth', 'Maternal Emotional Wellbeing')}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        {isMentalHealthReferred || isMentalHealthConcerns ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        )}
                        <strong className="font-bold text-xs">
                          {data.mentalHealthScreenResult === 'no_concerns'
                            ? 'Healthy Wellbeing & Emotional Bonding'
                            : data.mentalHealthScreenResult === 'referred'
                            ? 'Specialized Support Recommended (Referred)'
                            : 'Mild Postpartum Fatigue / Concerns Noted'}
                        </strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Baby Section */}
              {(data?.babyWeight || data?.babyWeightKg || data?.babyTemp || data?.infantFeedingMethod || data?.cordCondition || data?.umbilicalCordCondition) && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <span className="text-[10px] font-display font-bold text-gray-500 uppercase tracking-wider block">
                    {t('modules.pnc.babySection', 'Part B: Baby Examination')}
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {(data?.babyWeight || data?.babyWeightKg) && (
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <span className="text-[10px] text-gray-500 block">{t('modules.pnc.fields.babyWeight', 'Baby Weight')}</span>
                        <strong className="font-bold text-gray-900">{data.babyWeight || data.babyWeightKg} kg</strong>
                      </div>
                    )}
                    {data?.babyTemp && (
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <span className="text-[10px] text-gray-500 block">{t('modules.pnc.fields.babyTemp', 'Baby Temperature')}</span>
                        <strong className="font-bold text-gray-900">{data.babyTemp} °C</strong>
                      </div>
                    )}
                    {data?.infantFeedingMethod && (
                      <div className="p-2 bg-gray-50 rounded-lg col-span-2">
                        <span className="text-[10px] text-gray-500 block">{t('modules.pnc.fields.feedingMethod', 'Feeding Method')}</span>
                        <strong className="font-bold text-gray-900">{data.infantFeedingMethod}</strong>
                      </div>
                    )}
                    {(data?.cordCondition || data?.umbilicalCordCondition) && (
                      <div className={`p-2 rounded-lg col-span-2 ${isCordInfected ? 'bg-red-50 text-red-900' : 'bg-gray-50'}`}>
                        <span className="text-[10px] text-gray-500 block">{t('modules.pnc.fields.cordCondition', 'Umbilical Cord Healing')}</span>
                        <strong className="font-bold">
                          {data.cordCondition === 'clean_dry' || data.umbilicalCordCondition === 'clean_dry'
                            ? 'Clean & Dry (Normal Healing)'
                            : (data.cordCondition || data.umbilicalCordCondition)}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Document Preview Image / File Container */}
          {record.fileUrl ? (
            <div className="rounded-[18px] overflow-hidden border border-[var(--border-hairline)] bg-slate-950/5">
              <img
                src={record.fileUrl}
                alt={record.title}
                className="w-full h-48 object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : !data?.bloodPressure && (
            <div className="p-8 rounded-[18px] bg-[var(--lavender-50)] border border-[var(--border-hairline)] flex flex-col items-center justify-center text-center">
              <FileText className="w-12 h-12 text-[var(--haven-deep)] mb-2 opacity-80" />
              <span className="font-display font-bold text-[14px] text-[var(--ink-900)]">
                Structured Clinical Record
              </span>
              <span className="text-[12px] text-[var(--ink-500)]">
                Stored in MomHaven Health Vault
              </span>
            </div>
          )}

          {/* Notes & Clinical Summary */}
          {record.notes && (
            <div className="bg-white p-4 rounded-[18px] border border-[var(--border-hairline)] shadow-xs space-y-1.5">
              <h4 className="font-display font-bold text-[13px] text-[var(--ink-900)]">
                Clinical Notes &amp; Findings
              </h4>
              <p className="font-body text-[13px] text-[var(--ink-700)] leading-relaxed">
                {record.notes}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <Button
            variant="primary"
            onClick={() => {
              onClose();
              onShareWithClinician();
            }}
            className="w-full py-3.5 flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            <span>Generate Clinician Fast-Share Code</span>
          </Button>

          <button
            type="button"
            onClick={() => window.print()}
            className="w-full py-2.5 rounded-full border border-[var(--border-hairline)] text-[13px] font-display font-semibold text-[var(--ink-700)] hover:bg-[var(--lavender-50)] transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[var(--ink-500)]" />
            <span>Print or Export PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
