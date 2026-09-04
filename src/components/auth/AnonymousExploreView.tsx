// src/components/auth/AnonymousExploreView.tsx
import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ShieldAlert, 
  PhoneCall, 
  Sparkles, 
  Baby, 
  Heart, 
  Calendar, 
  Apple, 
  Globe, 
  ChevronRight, 
  CheckCircle2, 
  Ambulance, 
  Info, 
  BookOpen, 
  ShieldCheck 
} from 'lucide-react';
import Button from '../Button';
import EmergencySafetyHub from '../emergency/EmergencySafetyHub';

interface AnonymousExploreViewProps {
  onBack: () => void;
  onCreateAccount: () => void;
}

export default function AnonymousExploreView({ onBack, onCreateAccount }: AnonymousExploreViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'emergency' | 'nutrition' | 'immunization' | 'milestones'>('overview');
  const [lang, setLang] = useState<'EN' | 'SW'>('EN');

  const content = {
    EN: {
      title: 'Explore MomHaven (Guest Mode)',
      subtitle: 'Verified Kenya MOH 216 maternal, neonatal, and child health guidance available 100% offline without creating an account.',
      emergencyTitle: 'Emergency Danger Signs & Hotlines',
      emergencyDesc: 'Immediate help and clinical protocols for severe bleeding, convulsions, or high fever.',
      nutritionTitle: 'Kenyan Maternal Superfoods',
      nutritionDesc: 'Locally available, iron-rich and nutrient-dense foods: Managu, Terere, Kunde, Matoke, and Eggs.',
      immunizationTitle: 'KEPI Vaccination Schedule',
      immunizationDesc: 'Official Kenya Expanded Programme on Immunization from Birth to 5 Years.',
      milestonesTitle: 'Child Growth Milestones',
      milestonesDesc: 'Key motor, social, and language milestones for your baby’s first 5 years.',
      upgradePrompt: 'Ready to save your personal medical records and track your child’s vaccines?',
      upgradeBtn: 'Create My Health Handbook',
      languageLabel: 'Lugha / Language',
    },
    SW: {
      title: 'Chunguza MomHaven (Hali ya Wageni)',
      subtitle: 'Mwongozo uliothibitishwa wa MOH 216 wa afya ya mama, mtoto mchanga na mtoto unaopatikana bila akaunti.',
      emergencyTitle: 'Dalili za Hatari & Nambari za Dharura',
      emergencyDesc: 'Msaada wa haraka kwa kuvuja damu nyingi, degedege au homa kali.',
      nutritionTitle: 'Vyakula Bora vya Kenya kwa Mama',
      nutritionDesc: 'Vyakula vya kienyeji vyenye madini ya chuma na virutubisho: Managu, Terere, Kunde, na Mayai.',
      immunizationTitle: 'Ratiba ya Chanjo ya KEPI',
      immunizationDesc: 'Ratiba rasmi ya Mpango wa Chanjo wa Kenya kuanzia Kuzaliwa hadi Miaka 5.',
      milestonesTitle: 'Hatua za Ukuaji wa Mtoto',
      milestonesDesc: 'Hatua muhimu za kutambaa, kuongea, na kusimama kwa miaka mitano ya kwanza.',
      upgradePrompt: 'Uko tayari kuhifadhi rekodi zako binafsi na kufuatilia chanjo za mtoto wako?',
      upgradeBtn: 'Fungua Kitabu Changu cha Afya',
      languageLabel: 'Language / Lugha',
    }
  };

  const t = content[lang];

  if (activeTab === 'emergency') {
    return (
      <div className="min-h-screen bg-[var(--lavender-50)]">
        <EmergencySafetyHub onClose={() => setActiveTab('overview')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--lavender-50)] flex flex-col font-body pb-16">
      {/* Top Header */}
      <header className="bg-white border-b border-[var(--border-hairline)] px-4 py-3 sticky top-0 z-30 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-[var(--ink-900)] transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/assets/logo.png" alt="MomHaven" className="w-7 h-7 object-contain" referrerPolicy="no-referrer" />
            <span className="font-display font-bold text-sm text-[var(--ink-900)]">MomHaven Explore</span>
          </div>
        </div>

        {/* Language Toggle */}
        <div className="flex items-center gap-1 bg-[var(--lavender-100)] p-1 rounded-full border border-[var(--border-hairline)]">
          <Globe className="w-3.5 h-3.5 text-[var(--haven-deep)] ml-1" />
          <button
            type="button"
            onClick={() => setLang('EN')}
            className={`px-2 py-0.5 text-xs font-display font-bold rounded-full transition-all cursor-pointer ${
              lang === 'EN' ? 'bg-[var(--haven-deep)] text-white shadow-xs' : 'text-[var(--ink-600)]'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLang('SW')}
            className={`px-2 py-0.5 text-xs font-display font-bold rounded-full transition-all cursor-pointer ${
              lang === 'SW' ? 'bg-[var(--haven-deep)] text-white shadow-xs' : 'text-[var(--ink-600)]'
            }`}
          >
            SW
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto p-4 sm:p-5 space-y-4">
        {/* Intro Card */}
        <div className="bg-gradient-to-br from-[#33178A] to-[#6B3DB8] text-white p-5 rounded-[24px] shadow-card-2 space-y-2.5">
          <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-[11px] font-display font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>Guest Explore Mode</span>
          </div>
          <h2 className="font-display font-extrabold text-[22px] leading-tight">
            {t.title}
          </h2>
          <p className="font-body text-xs text-purple-100 leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        {/* Emergency Fast Action Banner */}
        <div className="bg-[#E11D3C] text-white p-4 rounded-[20px] shadow-emergency flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm leading-tight">MOH Emergency Hotline</h4>
              <p className="text-[11px] text-white/90">Free 24/7 Red Cross &amp; Ambulance</p>
            </div>
          </div>
          <a
            href="tel:1199"
            className="px-3.5 py-2 rounded-full bg-white text-[#C4283C] font-display font-bold text-xs shrink-0 flex items-center gap-1 shadow-xs hover:bg-gray-100"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            1199
          </a>
        </div>

        {/* Topic Grid */}
        <div className="space-y-3">
          {/* Danger Signs */}
          <button
            type="button"
            onClick={() => setActiveTab('emergency')}
            className="w-full bg-white border border-[var(--border-hairline)] p-4 rounded-[20px] shadow-xs flex items-center justify-between text-left hover:border-[var(--haven-orchid)] transition-all cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-display font-bold text-[15px] text-[var(--ink-900)] group-hover:text-[var(--haven-deep)]">
                  {t.emergencyTitle}
                </h4>
                <p className="font-body text-xs text-[var(--ink-600)] mt-0.5 leading-relaxed">
                  {t.emergencyDesc}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[var(--ink-400)] shrink-0 ml-2" />
          </button>

          {/* Maternal Nutrition */}
          <div className="bg-white border border-[var(--border-hairline)] p-4 rounded-[20px] shadow-xs space-y-3 text-left">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Apple className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-display font-bold text-[15px] text-[var(--ink-900)]">
                  {t.nutritionTitle}
                </h4>
                <p className="font-body text-xs text-[var(--ink-600)] mt-0.5 leading-relaxed">
                  {t.nutritionDesc}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-[14px] bg-[var(--lavender-50)] border border-[var(--border-hairline)]">
                <span className="text-[11px] font-bold text-[var(--haven-deep)] block">Iron &amp; Folate</span>
                <span className="text-[11px] text-[var(--ink-600)]">Managu, Terere, Liver, Spinach</span>
              </div>
              <div className="p-2.5 rounded-[14px] bg-[var(--lavender-50)] border border-[var(--border-hairline)]">
                <span className="text-[11px] font-bold text-[var(--haven-deep)] block">Calcium &amp; Protein</span>
                <span className="text-[11px] text-[var(--ink-600)]">Maziwa Lala, Omena, Eggs, Kunde</span>
              </div>
            </div>
          </div>

          {/* KEPI Immunization Schedule */}
          <div className="bg-white border border-[var(--border-hairline)] p-4 rounded-[20px] shadow-xs space-y-3 text-left">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-display font-bold text-[15px] text-[var(--ink-900)]">
                  {t.immunizationTitle}
                </h4>
                <p className="font-body text-xs text-[var(--ink-600)] mt-0.5 leading-relaxed">
                  {t.immunizationDesc}
                </p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-[var(--ink-900)] pt-1">
              <div className="flex justify-between p-2 rounded-lg bg-[var(--lavender-50)]">
                <span className="font-bold">Birth</span>
                <span className="text-[var(--ink-600)]">BCG, OPV 0 (Polio birth dose)</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-[var(--lavender-50)]">
                <span className="font-bold">6 Weeks</span>
                <span className="text-[var(--ink-600)]">OPV 1, Pentavalent 1, PCV 1, Rota 1</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-[var(--lavender-50)]">
                <span className="font-bold">10 Weeks</span>
                <span className="text-[var(--ink-600)]">OPV 2, Pentavalent 2, PCV 2, Rota 2</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-[var(--lavender-50)]">
                <span className="font-bold">14 Weeks</span>
                <span className="text-[var(--ink-600)]">OPV 3, IPV, Pentavalent 3, PCV 3</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-[var(--lavender-50)]">
                <span className="font-bold">9 Months</span>
                <span className="text-[var(--ink-600)]">Measles-Rubella 1, Yellow Fever</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-[var(--lavender-50)]">
                <span className="font-bold">18 Months</span>
                <span className="text-[var(--ink-600)]">Measles-Rubella 2</span>
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade Callout Card */}
        <div className="bg-white border-2 border-[var(--haven-orchid)]/30 p-5 rounded-[24px] shadow-card-1 text-center space-y-3 mt-4">
          <div className="w-12 h-12 rounded-full bg-[var(--lavender-100)] text-[var(--haven-deep)] mx-auto flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-bold text-[17px] text-[var(--ink-900)]">
              {t.upgradePrompt}
            </h3>
            <p className="font-body text-xs text-[var(--ink-600)] mt-1">
              Store your MOH 216 card digitally, receive SMS appointment reminders, and connect your support circle.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            onClick={onCreateAccount}
            className="w-full py-3.5 text-sm"
          >
            {t.upgradeBtn}
          </Button>
        </div>
      </main>
    </div>
  );
}
