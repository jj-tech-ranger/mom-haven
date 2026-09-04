import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Share2, 
  Edit3, 
  Building2, 
  Car, 
  Users, 
  Droplet, 
  Wallet, 
  Luggage, 
  CheckCircle2, 
  X, 
  Copy, 
  PhoneCall, 
  Send 
} from 'lucide-react';
import { BirthPlan, Pregnancy } from '../../types';
import { updatePregnancy } from '../../services/pregnancyService';
import Button from '../Button';

interface BirthPlanViewProps {
  pregnancy: Pregnancy;
  onBack: () => void;
  onPlanUpdated: () => void;
}

const DEFAULT_BAG_ITEMS = [
  'Mother: Clean nightdresses, maternity pads, warm socks',
  'Mother: ID, NHIF / Insurance card, MOH 216 Handbook',
  'Baby: 3 warm onesies, cotton vests, receiving blankets',
  'Baby: Newborn diapers, baby wipes, warm booties/hat',
  'Toiletries: Toothbrush, soap, slippers, lip balm',
];

export default function BirthPlanView({
  pregnancy,
  onBack,
  onPlanUpdated,
}: BirthPlanViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const plan: BirthPlan = pregnancy.birthPlan || {
    preferredFacility: '',
    backupFacility: '',
    transportMode: '',
    driverName: '',
    driverPhone: '',
    birthCompanion: '',
    companionRelationship: '',
    companionPhone: '',
    bloodDonorName: '',
    bloodDonorGroup: 'O+',
    bloodDonorPhone: '',
    emergencyFundsSaved: 0,
    hospitalBagPacked: [],
  };

  // Calculate readiness meter
  const readinessChecks = [
    Boolean(plan.preferredFacility),
    Boolean(plan.backupFacility),
    Boolean(plan.driverName && plan.driverPhone),
    Boolean(plan.birthCompanion && plan.companionPhone),
    Boolean(plan.bloodDonorName),
    Boolean((plan.emergencyFundsSaved || 0) > 0),
    Boolean(plan.hospitalBagPacked && plan.hospitalBagPacked.length >= 3),
  ];
  const completedScore = readinessChecks.filter(Boolean).length;
  const readinessPercent = Math.round((completedScore / readinessChecks.length) * 100);

  // Edit State
  const [prefFacility, setPrefFacility] = useState(plan.preferredFacility || '');
  const [backupFacility, setBackupFacility] = useState(plan.backupFacility || '');
  const [transportMode, setTransportMode] = useState(plan.transportMode || '');
  const [driverName, setDriverName] = useState(plan.driverName || '');
  const [driverPhone, setDriverPhone] = useState(plan.driverPhone || '');
  const [birthCompanion, setBirthCompanion] = useState(plan.birthCompanion || '');
  const [companionRel, setCompanionRel] = useState(plan.companionRelationship || '');
  const [companionPhone, setCompanionPhone] = useState(plan.companionPhone || '');
  const [donorName, setDonorName] = useState(plan.bloodDonorName || '');
  const [donorGroup, setDonorGroup] = useState(plan.bloodDonorGroup || 'O+');
  const [donorPhone, setDonorPhone] = useState(plan.bloodDonorPhone || '');
  const [emergencyFunds, setEmergencyFunds] = useState(plan.emergencyFundsSaved || 15000);
  const [packedItems, setPackedItems] = useState<string[]>(plan.hospitalBagPacked || []);
  const [saving, setSaving] = useState(false);

  const toggleBagItem = (item: string) => {
    setPackedItems(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updatedPlan: BirthPlan = {
        preferredFacility: prefFacility,
        backupFacility,
        transportMode,
        driverName,
        driverPhone,
        birthCompanion,
        companionRelationship: companionRel,
        companionPhone,
        bloodDonorName: donorName,
        bloodDonorGroup: donorGroup,
        bloodDonorPhone: donorPhone,
        emergencyFundsSaved: Number(emergencyFunds),
        hospitalBagPacked: packedItems,
        updatedAt: new Date().toISOString(),
      };

      await updatePregnancy(pregnancy.id, { birthPlan: updatedPlan });
      onPlanUpdated();
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save birth plan', err);
    } finally {
      setSaving(false);
    }
  };

  const shareSummaryText = `MomHaven Birth Preparedness Plan:
• Primary Facility: ${plan.preferredFacility}
• Backup Facility: ${plan.backupFacility}
• Emergency Driver: ${plan.driverName} (${plan.driverPhone})
• Birth Companion: ${plan.birthCompanion} (${plan.companionPhone})
• Designated Blood Donor: ${plan.bloodDonorName} [Group ${plan.bloodDonorGroup}] (${plan.bloodDonorPhone})
• Emergency Funds: KES ${plan.emergencyFundsSaved?.toLocaleString()} saved
• Bag Readiness: ${plan.hospitalBagPacked?.length || 0} items packed.`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareSummaryText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[var(--lavender-50)] pb-28">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 bg-white border-b border-[var(--border-hairline)] sticky top-0 z-10 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-[var(--lavender-50)] flex items-center justify-center text-[var(--ink-900)] cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h1 className="font-display font-extrabold text-[17px] text-[var(--ink-900)]">
            Individualized Birth Plan
          </h1>
          <span className="text-[11px] font-semibold text-[var(--haven-orchid)]">
            BPCR Readiness
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsSharing(true)}
          className="w-10 h-10 rounded-full bg-[var(--lavender-50)] flex items-center justify-center text-[var(--haven-deep)] cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 sm:p-6 space-y-4 max-w-lg mx-auto">
        {/* Readiness Meter Card */}
        <div className="bg-white rounded-[22px] p-5 border border-[var(--border-hairline)] shadow-card-1 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-display font-bold text-[var(--haven-orchid)] uppercase tracking-wider">
                Readiness Score
              </span>
              <h3 className="font-display font-bold text-[20px] text-[var(--ink-900)]">
                Birth Plan {readinessPercent}% Complete
              </h3>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-[12px] font-display font-bold ${
                readinessPercent >= 80
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {readinessPercent >= 80 ? 'High Readiness' : 'In Progress'}
            </span>
          </div>

          <div className="h-2.5 w-full bg-[var(--lavender-100)] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                readinessPercent >= 80 ? 'bg-emerald-500' : 'bg-[var(--haven-deep)]'
              }`}
              style={{ width: `${readinessPercent}%` }}
            />
          </div>

          <p className="font-body text-[12px] text-[var(--ink-600)]">
            Individualized Birth Preparedness &amp; Complication Readiness (BPCR) prevents delays during labor onset.
          </p>
        </div>

        {/* Logistical Detail Cards */}
        <div className="space-y-3">
          {/* Facility Selection */}
          <div className="bg-white p-4 rounded-[20px] border border-[var(--border-hairline)] shadow-card-1 space-y-2">
            <div className="flex items-center gap-2 text-[var(--haven-deep)] font-display font-bold text-[14px]">
              <Building2 className="w-4 h-4" />
              <span>Target Delivery Facilities</span>
            </div>
            <div className="text-[13px] font-body space-y-1 pl-6">
              <p>
                <strong className="text-[var(--ink-900)] font-semibold">Primary Facility:</strong>{' '}
                <span className="text-[var(--ink-700)]">{plan.preferredFacility || 'Not selected'}</span>
              </p>
              <p>
                <strong className="text-[var(--ink-900)] font-semibold">Emergency Backup:</strong>{' '}
                <span className="text-[var(--ink-700)]">{plan.backupFacility || 'Not selected'}</span>
              </p>
            </div>
          </div>

          {/* Transport Plan */}
          <div className="bg-white p-4 rounded-[20px] border border-[var(--border-hairline)] shadow-card-1 space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 font-display font-bold text-[14px]">
              <Car className="w-4 h-4" />
              <span>Emergency Transport Logistics</span>
            </div>
            <div className="text-[13px] font-body space-y-1 pl-6">
              <p>
                <strong className="text-[var(--ink-900)] font-semibold">Mode:</strong>{' '}
                <span className="text-[var(--ink-700)]">{plan.transportMode || 'Designated Driver'}</span>
              </p>
              <p>
                <strong className="text-[var(--ink-900)] font-semibold">Driver:</strong>{' '}
                <span className="text-[var(--ink-700)]">{plan.driverName} ({plan.driverPhone})</span>
              </p>
            </div>
          </div>

          {/* Birth Companion & Blood Donor */}
          <div className="bg-white p-4 rounded-[20px] border border-[var(--border-hairline)] shadow-card-1 space-y-2">
            <div className="flex items-center gap-2 text-purple-700 font-display font-bold text-[14px]">
              <Users className="w-4 h-4" />
              <span>Companion &amp; Blood Donor</span>
            </div>
            <div className="text-[13px] font-body space-y-1 pl-6">
              <p>
                <strong className="text-[var(--ink-900)] font-semibold">Birth Companion:</strong>{' '}
                <span className="text-[var(--ink-700)]">{plan.birthCompanion} ({plan.companionRelationship}) · {plan.companionPhone}</span>
              </p>
              <p>
                <strong className="text-[var(--ink-900)] font-semibold">Designated Blood Donor:</strong>{' '}
                <span className="text-[var(--ink-700)]">{plan.bloodDonorName} [Group {plan.bloodDonorGroup}] · {plan.bloodDonorPhone}</span>
              </p>
            </div>
          </div>

          {/* Financial Readiness & Emergency Fund */}
          <div className="bg-white p-4 rounded-[20px] border border-[var(--border-hairline)] shadow-card-1 space-y-2">
            <div className="flex items-center gap-2 text-amber-700 font-display font-bold text-[14px]">
              <Wallet className="w-4 h-4" />
              <span>Emergency Financial Readiness</span>
            </div>
            <div className="text-[13px] font-body space-y-1 pl-6">
              <p>
                <strong className="text-[var(--ink-900)] font-semibold">M-PESA / Cash Saved:</strong>{' '}
                <span className="text-emerald-700 font-display font-bold">
                  KES {plan.emergencyFundsSaved?.toLocaleString() || '0'}
                </span>
              </p>
            </div>
          </div>

          {/* Hospital Bag Checklist */}
          <div className="bg-white p-4 rounded-[20px] border border-[var(--border-hairline)] shadow-card-1 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[var(--haven-deep)] font-display font-bold text-[14px]">
                <Luggage className="w-4 h-4" />
                <span>Hospital Bag Essentials</span>
              </div>
              <span className="text-[11px] font-display font-bold text-[var(--haven-orchid)]">
                {plan.hospitalBagPacked?.length || 0} packed
              </span>
            </div>
            <div className="space-y-1.5 pl-2">
              {DEFAULT_BAG_ITEMS.map((item, idx) => {
                const packed = plan.hospitalBagPacked?.includes(item);
                return (
                  <div key={idx} className="flex items-center gap-2 text-[12px] text-[var(--ink-700)]">
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${
                        packed ? 'text-emerald-600' : 'text-[var(--ink-300)]'
                      }`}
                    />
                    <span className={packed ? 'font-medium text-[var(--ink-900)]' : 'text-[var(--ink-500)]'}>
                      {item}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <Button
            variant="primary"
            onClick={() => setIsEditing(true)}
            className="w-full py-3.5 flex items-center justify-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Birth Plan</span>
          </Button>

          <button
            type="button"
            onClick={() => setIsSharing(true)}
            className="w-full py-3 rounded-full border border-[var(--haven-deep)] text-[var(--haven-deep)] font-display font-bold text-[14px] hover:bg-[var(--lavender-100)] transition-colors cursor-pointer"
          >
            Share with Partner / Family
          </button>
        </div>
      </div>

      {/* ================= M-PREG-009: EDIT BIRTH PLAN MODAL ================= */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-[28px] sm:rounded-[24px] w-full max-w-lg p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
              <h2 className="font-display font-extrabold text-[18px] text-[var(--ink-900)]">
                Update Birth Plan (BPCR)
              </h2>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="w-8 h-8 rounded-full bg-[var(--lavender-50)] flex items-center justify-center text-[var(--ink-600)] hover:text-[var(--ink-900)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 pt-4">
              <div>
                <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
                  Primary Delivery Facility
                </label>
                <input
                  type="text"
                  value={prefFacility}
                  onChange={e => setPrefFacility(e.target.value)}
                  placeholder="e.g. Pumwani Maternity Hospital"
                  className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
                  required
                />
              </div>

              <div>
                <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
                  Emergency Backup Facility
                </label>
                <input
                  type="text"
                  value={backupFacility}
                  onChange={e => setBackupFacility(e.target.value)}
                  placeholder="e.g. Kenyatta National Hospital"
                  className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
                    Designated Driver Name
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={e => setDriverName(e.target.value)}
                    placeholder="e.g. John Mwangi"
                    className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
                    Driver Phone #
                  </label>
                  <input
                    type="tel"
                    value={driverPhone}
                    onChange={e => setDriverPhone(e.target.value)}
                    placeholder="+254 712 345 678"
                    className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
                    Birth Companion Name
                  </label>
                  <input
                    type="text"
                    value={birthCompanion}
                    onChange={e => setBirthCompanion(e.target.value)}
                    placeholder="e.g. Grace Achieng"
                    className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
                    Companion Phone #
                  </label>
                  <input
                    type="tel"
                    value={companionPhone}
                    onChange={e => setCompanionPhone(e.target.value)}
                    placeholder="+254 722 987 654"
                    className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
                    Blood Donor
                  </label>
                  <input
                    type="text"
                    value={donorName}
                    onChange={e => setDonorName(e.target.value)}
                    placeholder="Donor name"
                    className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
                    Group
                  </label>
                  <select
                    value={donorGroup}
                    onChange={e => setDonorGroup(e.target.value)}
                    className="w-full px-2 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
                    Donor Phone
                  </label>
                  <input
                    type="tel"
                    value={donorPhone}
                    onChange={e => setDonorPhone(e.target.value)}
                    placeholder="Phone"
                    className="w-full px-2 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
                  Emergency Funds Saved (KES)
                </label>
                <input
                  type="number"
                  value={emergencyFunds}
                  onChange={e => setEmergencyFunds(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-2">
                  Hospital Bag Packed Items
                </label>
                <div className="space-y-1.5">
                  {DEFAULT_BAG_ITEMS.map((item, idx) => {
                    const isPacked = packedItems.includes(item);
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleBagItem(item)}
                        className={`p-2.5 rounded-[12px] border text-[12px] flex items-center gap-2 cursor-pointer transition-colors ${
                          isPacked
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium'
                            : 'bg-white border-[var(--border-hairline)] text-[var(--ink-600)]'
                        }`}
                      >
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 ${
                            isPacked ? 'text-emerald-600' : 'text-[var(--ink-300)]'
                          }`}
                        />
                        <span>{item}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Button type="submit" variant="primary" disabled={saving} className="w-full py-3.5 mt-4">
                {saving ? 'Saving...' : 'Save changes'}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* ================= M-PREG-010: SHARE BIRTH PLAN SHEET ================= */}
      {isSharing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-[28px] sm:rounded-[24px] w-full max-w-md p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
              <h2 className="font-display font-extrabold text-[18px] text-[var(--ink-900)]">
                Share Birth Preparedness Plan
              </h2>
              <button
                type="button"
                onClick={() => setIsSharing(false)}
                className="w-8 h-8 rounded-full bg-[var(--lavender-50)] flex items-center justify-center text-[var(--ink-600)] hover:text-[var(--ink-900)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="p-3.5 rounded-[16px] bg-[var(--lavender-50)] border border-[var(--border-hairline)] text-[12px] text-[var(--ink-800)] font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {shareSummaryText}
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="w-full py-3 px-4 rounded-full bg-[var(--haven-deep)] text-white font-display font-bold text-[14px] flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copySuccess ? 'Copied to clipboard!' : 'Copy Summary'}</span>
                </button>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(shareSummaryText)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 px-4 rounded-full bg-emerald-600 text-white font-display font-bold text-[14px] flex items-center justify-center gap-2 cursor-pointer shadow-xs block text-center"
                >
                  <Send className="w-4 h-4" />
                  <span>Share via WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
