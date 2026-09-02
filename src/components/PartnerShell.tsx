// src/components/PartnerShell.tsx
import React, { useState, useEffect } from 'react';
import { 
  Home, 
  HeartHandshake, 
  MapPin, 
  ShieldAlert, 
  User, 
  CheckCircle2, 
  PhoneCall, 
  Sparkles, 
  LogOut,
  Calendar,
  Clock,
  Car,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { redeemPartnerConnectionCode, getMotherPartnerRelationship } from '../services/sharingService';
import EmergencySafetyHub from './emergency/EmergencySafetyHub';
import PartnerSupportHub from './partner/PartnerSupportHub';
import PartnerBirthPlanView from './partner/PartnerBirthPlanView';
import Button from './Button';

interface PartnerShellProps {
  partnerId?: string;
  partnerName?: string;
  onSignOut?: () => void;
}

export default function PartnerShell({
  partnerId = 'partner-user',
  partnerName = 'Partner Support',
  onSignOut = () => {},
}: PartnerShellProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'support' | 'birthplan' | 'emergency' | 'profile'>('home');
  const [linkedMother, setLinkedMother] = useState<{ motherId: string; motherName: string } | null>(() => {
    const saved = localStorage.getItem('momhaven_partner_link');
    return saved ? JSON.parse(saved) : null;
  });

  const [connectionCode, setConnectionCode] = useState('');
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectionCode.trim()) return;
    setLoading(true);
    setRedeemError(null);
    setRedeemSuccess(null);

    try {
      const result = await redeemPartnerConnectionCode(partnerId, partnerName, connectionCode);
      if (result.success && result.motherId) {
        const linkData = { motherId: result.motherId, motherName: result.motherName || 'Mama Jemimah' };
        setLinkedMother(linkData);
        localStorage.setItem('momhaven_partner_link', JSON.stringify(linkData));
        setRedeemSuccess(result.message);
      } else {
        setRedeemError(result.message);
      }
    } catch (err) {
      setRedeemError('Error connecting. Please verify code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--lavender-50)] text-[var(--ink-900)] flex flex-col font-body">
      {/* Top Header */}
      <header className="bg-white border-b border-[var(--border-hairline)] px-4 py-3 sticky top-0 z-30 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <img src="/assets/logo.png" alt="MomHaven" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
          <div>
            <h1 className="font-display font-extrabold text-sm text-[var(--ink-900)] leading-none">
              MomHaven Partner
            </h1>
            <span className="text-[10px] font-display font-bold text-[var(--haven-orchid)] uppercase tracking-wider">
              Walk Every Step Together
            </span>
          </div>
        </div>

        {linkedMother && (
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-semibold">
            <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
            <span>Connected: {linkedMother.motherName}</span>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-24 overflow-y-auto">
        {!linkedMother ? (
          /* Redemption Pairing Flow */
          <div className="max-w-md mx-auto p-4 sm:p-6 space-y-5 pt-6">
            <div className="bg-white border border-[var(--border-hairline)] p-6 rounded-[24px] shadow-card-1 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-[var(--lavender-100)] text-[var(--haven-deep)] mx-auto flex items-center justify-center">
                <HeartHandshake className="w-7 h-7" />
              </div>

              <div>
                <h2 className="font-display font-bold text-[20px] text-[var(--ink-900)]">
                  Connect to Mother's Profile
                </h2>
                <p className="font-body text-[12px] text-[var(--ink-600)] mt-1">
                  Enter the 6-character connection code generated from the mother’s MomHaven app.
                </p>
              </div>

              {/* Privacy Boundary Assurance */}
              <div className="p-3 bg-purple-50 rounded-[14px] border border-purple-100 text-left text-[11px] text-purple-950 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[var(--haven-deep)] shrink-0 mt-0.5" />
                <span>
                  <strong>Privacy Protected:</strong> You will only view birth logistics, emergency contacts, and shared appointment dates. Medical clinical charts remain confidential between mother and clinicians.
                </span>
              </div>

              <form onSubmit={handleRedeem} className="space-y-3 pt-1">
                <input
                  type="text"
                  placeholder="HAVEN-XXX"
                  value={connectionCode}
                  onChange={(e) => setConnectionCode(e.target.value.toUpperCase())}
                  className="w-full text-center font-mono font-extrabold text-[22px] tracking-widest py-3 px-4 rounded-[14px] border-2 border-[var(--border-hairline)] focus:border-[var(--haven-deep)] uppercase bg-[var(--lavender-50)] focus:bg-white focus:outline-none"
                  maxLength={10}
                  required
                />

                {redeemError && (
                  <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-[12px] text-left flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {redeemError}
                  </p>
                )}

                {redeemSuccess && (
                  <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-[12px] text-left flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    {redeemSuccess}
                  </p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="w-full py-3 text-xs"
                >
                  {loading ? 'Verifying Code...' : 'Connect to Mother'}
                </Button>
              </form>
            </div>
          </div>
        ) : (
          /* Connected Partner Dashboard */
          <div className="max-w-md mx-auto p-4 space-y-4">
            {activeTab === 'home' && (
              <div className="space-y-4">
                {/* Hero Gestational Progress Card */}
                <div className="bg-gradient-to-br from-[#241451] via-[#4B27A8] to-[#6B3DB8] text-white p-5 rounded-[24px] shadow-card-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-display font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                      Trimester 3 · Week 34
                    </span>
                    <span className="text-xs font-medium text-purple-200">
                      ~6 Weeks to Due Date
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-white">
                      Supporting {linkedMother.motherName}
                    </h3>
                    <p className="font-body text-xs text-purple-100 mt-1 leading-relaxed">
                      Baby is practicing rhythmic breathing movements and storing vital antibodies. Ensure transport logistics and emergency funds are ready!
                    </p>
                  </div>
                </div>

                {/* Shared Appointments Feed */}
                <div className="bg-white border border-[var(--border-hairline)] p-4 sm:p-5 rounded-[22px] shadow-card-1 space-y-3">
                  <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-2.5">
                    <h4 className="font-display font-bold text-[14px] text-[var(--ink-900)] flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[var(--haven-orchid)]" />
                      Shared Clinical Appointments
                    </h4>
                    <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-bold">
                      Upcoming
                    </span>
                  </div>

                  <div className="p-3 bg-[var(--lavender-50)] rounded-[14px] border border-[var(--border-hairline)] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-xs text-[var(--ink-900)]">
                        ANC Visit 7 (34 Weeks Routine Contact)
                      </span>
                      <span className="text-[11px] text-[var(--haven-orchid)] font-bold">Thursday, 9:00 AM</span>
                    </div>
                    <p className="text-[11px] text-[var(--ink-600)]">
                      Pumwani Maternity Clinic · Blood Pressure &amp; Fetal Growth checkup
                    </p>
                  </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('birthplan')}
                    className="p-3.5 bg-white border border-[var(--border-hairline)] rounded-[18px] text-left hover:border-[var(--haven-orchid)] shadow-xs cursor-pointer"
                  >
                    <MapPin className="w-5 h-5 text-[var(--haven-deep)] mb-1.5" />
                    <h5 className="font-display font-bold text-[13px]">Birth Logistics</h5>
                    <p className="text-[11px] text-gray-500">Taxi, hospital &amp; bag checklist</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('support')}
                    className="p-3.5 bg-white border border-[var(--border-hairline)] rounded-[18px] text-left hover:border-[var(--haven-orchid)] shadow-xs cursor-pointer"
                  >
                    <HeartHandshake className="w-5 h-5 text-emerald-600 mb-1.5" />
                    <h5 className="font-display font-bold text-[13px]">Support Guide</h5>
                    <p className="text-[11px] text-gray-500">Massage, foods &amp; mood tips</p>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'support' && (
              <PartnerSupportHub />
            )}

            {activeTab === 'birthplan' && (
              <PartnerBirthPlanView
                motherName={linkedMother.motherName}
                onSaveTransportPlan={() => {}}
              />
            )}

            {activeTab === 'emergency' && (
              <EmergencySafetyHub />
            )}

            {activeTab === 'profile' && (
              <div className="bg-white border border-[var(--border-hairline)] p-5 rounded-[22px] shadow-card-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[var(--lavender-100)] text-[var(--haven-deep)] flex items-center justify-center font-display font-bold text-lg">
                    {partnerName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base">{partnerName}</h3>
                    <p className="text-xs text-emerald-700 font-semibold">Active Partner Link</p>
                  </div>
                </div>

                <div className="p-3 bg-[var(--lavender-50)] rounded-[14px] text-xs text-[var(--ink-700)] space-y-1">
                  <p><strong>Linked Mother:</strong> {linkedMother.motherName}</p>
                  <p><strong>Connection Scope:</strong> Birth Logistics, Emergency Transport, Shared Reminders</p>
                </div>

                <div className="pt-2 border-t border-gray-100 space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      localStorage.removeItem('momhaven_partner_link');
                      setLinkedMother(null);
                    }}
                    className="w-full py-2.5 text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                  >
                    Unlink from Mother Profile
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={onSignOut}
                    className="w-full py-2.5 text-xs text-red-600 border-red-200 hover:bg-red-50 flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Partner Bottom Navigation */}
      {linkedMother && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[var(--border-hairline)] py-2 px-3 z-40">
          <div className="max-w-md mx-auto grid grid-cols-5 gap-1">
            {[
              { id: 'home', label: 'Home', icon: Home },
              { id: 'support', label: 'Support', icon: HeartHandshake },
              { id: 'birthplan', label: 'Birth Plan', icon: MapPin },
              { id: 'emergency', label: 'Emergency', icon: ShieldAlert, urgent: true },
              { id: 'profile', label: 'Profile', icon: User },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex flex-col items-center justify-center py-1.5 rounded-[12px] transition-all cursor-pointer ${
                    isActive
                      ? tab.urgent
                        ? 'text-[#E11D3C] font-bold'
                        : 'text-[var(--haven-orchid)] font-bold'
                      : tab.urgent
                      ? 'text-red-500'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
                  <span className="text-[10px] mt-1">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
