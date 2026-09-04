import React from 'react';
import CircularPregnancyTracker from './today/CircularPregnancyTracker';
import { 
  Bell, 
  Syringe, 
  Pill, 
  Baby, 
  Sparkles, 
  Calendar, 
  ArrowRight, 
  Home, 
  Milestone, 
  MessageSquare, 
  FileText, 
  User, 
  Wifi, 
  Signal, 
  Battery,
  ShieldCheck
} from 'lucide-react';

interface MotherViewPhoneMockupProps {
  onExplore?: () => void;
  language?: 'en' | 'sw';
}

export default function MotherViewPhoneMockup({ onExplore, language = 'en' }: MotherViewPhoneMockupProps) {
  const isSw = language === 'sw';

  return (
    <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[360px] group">
      {/* Background Soft Atmosphere Glow */}
      <div className="absolute -inset-4 bg-gradient-to-br from-[var(--haven-orchid)]/15 via-[var(--haven-deep)]/10 to-transparent rounded-[54px] blur-2xl pointer-events-none" />

      {/* Outer Smartphone Frame (Photographic Hardware Chassis) */}
      <div className="relative rounded-[48px] p-3 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border-[3.5px] border-slate-700/80 shadow-[0_25px_60px_-15px_rgba(51,23,138,0.22),0_12px_24px_-8px_rgba(0,0,0,0.35)] ring-1 ring-white/15 ring-inset select-none">
        
        {/* Hardware Side Buttons */}
        <div className="absolute -left-[5.5px] top-24 w-[3.5px] h-7 bg-slate-700 rounded-l-xs" />
        <div className="absolute -left-[5.5px] top-34 w-[3.5px] h-7 bg-slate-700 rounded-l-xs" />
        <div className="absolute -right-[5.5px] top-28 w-[3.5px] h-11 bg-slate-700 rounded-r-xs" />

        {/* Inner Phone Screen - Explicitly Styled in Light Mode */}
        <div className="rounded-[38px] overflow-hidden bg-[#FAF7FD] text-[#1D132D] relative border border-black/10 flex flex-col font-body shadow-inner">
          
          {/* 1. Hardware Status Bar & Dynamic Island */}
          <div className="pt-2 px-5 pb-1 flex items-center justify-between text-[11px] font-bold text-slate-800">
            <span>9:41</span>
            
            {/* Dynamic Island Pill */}
            <div className="w-22 h-4 bg-black rounded-full flex items-center justify-end px-2 gap-1 shadow-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-900 ring-1 ring-slate-800" />
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
            </div>

            <div className="flex items-center gap-1.5 text-slate-700">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* 2. Mother View Header */}
          <div className="px-4 pt-2.5 pb-2 flex items-center justify-between">
            <div className="text-left">
              <span className="font-body text-[9px] font-bold text-[#8A8199] tracking-widest uppercase block">
                {isSw ? 'Habari ya Asubuhi' : 'Good Morning'}
              </span>
              <h4 className="font-display font-extrabold text-[16px] text-[#1D132D] leading-tight">
                Eve Pendo
              </h4>
            </div>

            <div className="flex items-center gap-2">
              {/* Notification Bell */}
              <div className="w-7 h-7 rounded-full bg-white border border-[#E8E2F2] flex items-center justify-center text-[#33178A] relative shadow-2xs">
                <Bell className="w-3.5 h-3.5" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500 ring-1 ring-white" />
              </div>

              {/* User Avatar Pill - EP for Eve Pendo */}
              <div className="w-7 h-7 rounded-full bg-[#33178A] text-white font-display font-bold text-[11px] flex items-center justify-center shadow-xs tracking-tight">
                EP
              </div>
            </div>
          </div>

          {/* 3. Screen Scrollable Body Content */}
          <div className="px-3.5 space-y-3 pb-16 pt-0.5 text-left">
            
            {/* Circular Wheel Pregnancy Progress Tracker */}
            <CircularPregnancyTracker
              variant="compact"
              gestationalWeeks={24}
              trimester={2}
              babySize={{
                size: isSw ? 'bisi/muhindi' : 'an ear of corn',
                emoji: '🌽',
                fact: isSw ? 'Mtoto ana ukubwa wa bisi/muhindi' : 'Baby is about the size of an ear of corn',
              }}
              eddFormatted="14 Nov"
              daysToEdd={112}
              isAuthoritative={true}
              language={language}
              onLogAction={onExplore}
              onNavigate={() => onExplore?.()}
              onOpenAskHaven={() => onExplore?.()}
            />

            {/* Today's Priorities */}
            <div>
              <div className="flex justify-between items-center mb-1.5 px-0.5">
                <h5 className="font-display font-extrabold text-[12px] text-[#1D132D] tracking-tight">
                  {isSw ? 'Mambo ya Leo' : "Today's Priorities"}
                </h5>
                <span className="text-[10px] font-display font-semibold text-[#8C3BE2]">
                  {isSw ? 'Tazama yote' : 'View all'}
                </span>
              </div>

              <div className="space-y-1.5">
                {/* Priority 1: ANC Visit */}
                <div className="bg-white rounded-[13px] border border-[#EAE4F2] p-2.5 flex items-center justify-between shadow-2xs relative overflow-hidden pl-3.5 before:content-[''] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r-full before:bg-rose-500">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <Syringe className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-display font-bold text-[11px] text-[#1D132D] leading-tight">
                        {isSw ? 'Ziara ya ANC 5 — Mwezi huu' : 'ANC visit 5 — due this month'}
                      </div>
                      <div className="font-body text-[9px] text-[#8A8199] truncate max-w-[170px]">
                        IPTp-SP & lab review · Kariokor Clinic
                      </div>
                    </div>
                  </div>
                  <div className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                    5d
                  </div>
                </div>

                {/* Priority 2: IFAS */}
                <div className="bg-white rounded-[13px] border border-[#EAE4F2] p-2.5 flex items-center justify-between shadow-2xs relative overflow-hidden pl-3.5 before:content-[''] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r-full before:bg-emerald-500">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Pill className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-display font-bold text-[11px] text-[#1D132D] leading-tight">
                        {isSw ? 'Kunywa IFAS (Madini ya Chuma)' : 'Take your iron & folic acid (IFAS)'}
                      </div>
                      <div className="font-body text-[9px] text-[#8A8199] truncate max-w-[170px]">
                        {isSw ? 'Kidonge 1 kila siku na maji/matunda' : '1 tablet daily with light meal · 30 left'}
                      </div>
                    </div>
                  </div>
                  <div className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    ✓
                  </div>
                </div>

                {/* Priority 3: Milestone */}
                <div className="bg-white rounded-[13px] border border-[#EAE4F2] p-2.5 flex items-center justify-between shadow-2xs relative overflow-hidden pl-3.5 before:content-[''] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r-full before:bg-[#8C3BE2]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-50 text-[#8C3BE2] flex items-center justify-center shrink-0">
                      <Baby className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-display font-bold text-[11px] text-[#1D132D] leading-tight">
                        {isSw ? 'Wiki hii: mtoto anasikia sauti' : 'This week: baby can hear you'}
                      </div>
                      <div className="font-body text-[9px] text-[#8A8199] truncate max-w-[170px]">
                        {isSw ? 'Zungumza au imba taratibu' : 'Talk or sing gently · Inner ear forming'}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3 h-3 text-[#8A8199]" />
                </div>
              </div>
            </div>

            {/* Quick Action Shortcuts */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <div className="bg-white rounded-[14px] border border-[#EAE4F2] p-2.5 shadow-2xs text-left">
                <div className="w-6 h-6 rounded-lg bg-purple-50 text-[#33178A] flex items-center justify-center mb-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="font-display font-bold text-[10.5px] text-[#1D132D] leading-tight">
                  Ask Haven
                </div>
                <div className="text-[8.5px] text-[#8A8199] leading-tight mt-0.5">
                  AI Companion
                </div>
              </div>

              <div className="bg-white rounded-[14px] border border-[#EAE4F2] p-2.5 shadow-2xs text-left">
                <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <div className="font-display font-bold text-[10.5px] text-[#1D132D] leading-tight">
                  MOH 216
                </div>
                <div className="text-[8.5px] text-[#8A8199] leading-tight mt-0.5">
                  ANC Logbook
                </div>
              </div>
            </div>

          </div>

          {/* Floating SOS Red Emergency Button */}
          <div className="absolute bottom-13 right-3 z-20 w-8 h-8 rounded-full bg-[#E11D3C] text-white flex items-center justify-center shadow-md border-2 border-white ring-2 ring-red-200 cursor-pointer">
            <span className="font-display font-black text-[13px] leading-none">!</span>
          </div>

          {/* 4. Bottom 5-Item Navigation Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-white border-t border-[#ECE6F5] px-2 flex items-center justify-around z-10">
            <div className="flex flex-col items-center justify-center text-[#33178A]">
              <Home className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="font-display font-bold text-[8.5px] mt-0.5">Today</span>
            </div>

            <div className="flex flex-col items-center justify-center text-[#8A8199]">
              <Milestone className="w-3.5 h-3.5" />
              <span className="font-display font-medium text-[8.5px] mt-0.5">Journey</span>
            </div>

            <div className="flex flex-col items-center justify-center text-[#8A8199]">
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="font-display font-medium text-[8.5px] mt-0.5">Haven</span>
            </div>

            <div className="flex flex-col items-center justify-center text-[#8A8199]">
              <FileText className="w-3.5 h-3.5" />
              <span className="font-display font-medium text-[8.5px] mt-0.5">Records</span>
            </div>

            <div className="flex flex-col items-center justify-center text-[#8A8199]">
              <User className="w-3.5 h-3.5" />
              <span className="font-display font-medium text-[8.5px] mt-0.5">Profile</span>
            </div>
          </div>

          {/* Home Indicator bar */}
          <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-20 h-1 bg-slate-300 rounded-full z-20 pointer-events-none" />
        </div>
      </div>

      {/* Interactive Exploration Tag Beneath Mockup */}
      {onExplore && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onExplore}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[var(--surface-1)] hover:bg-[var(--surface-2)] text-[var(--haven-deep)] border border-[var(--border)] text-xs font-display font-bold shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isSw ? 'Jaribu Mtazamo wa Mama Moja kwa Moja' : 'Explore Live Mother View'}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
}
