import React, { useState } from 'react';
import { ChevronLeft, Utensils, Pill, Sparkles, Plus, CheckCircle2, ChevronRight, Apple, Info } from 'lucide-react';
import { ChildDoc, NutritionRecordDoc } from '../../types';

interface NutritionOverviewProps {
  child?: ChildDoc | null;
  onBack: () => void;
  onLogFeeding: () => void;
  onViewGuidance: () => void;
  onAskHaven: (query: string) => void;
}

export const NutritionOverview: React.FC<NutritionOverviewProps> = ({
  child,
  onBack,
  onLogFeeding,
  onViewGuidance,
  onAskHaven,
}) => {
  const [showLogSheet, setShowLogSheet] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [feedingType, setFeedingType] = useState('Complementary feeding + Breastfeeding');

  const handleSaveNote = () => {
    setShowLogSheet(false);
    setNoteText('');
  };

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
        <h1 className="font-display font-bold text-xl text-ink-900">Nutrition & Feeding</h1>
        <div className="w-10" />
      </div>

      {/* Feeding Stage Card */}
      <div className="bg-gradient-to-r from-haven-deep to-haven-orchid p-5 rounded-[20px] text-white shadow-card-1 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-display font-bold text-xs uppercase tracking-wider text-white/80">
            Age Stage: 6–23 Months
          </span>
          <span className="px-2.5 py-1 rounded-pill bg-emerald-500/25 border border-emerald-400/40 text-emerald-100 text-xs font-display font-bold">
            Active Stage
          </span>
        </div>
        <h2 className="font-display font-bold text-xl text-white">
          Complementary Feeding & Breastfeeding
        </h2>
        <p className="font-body text-xs text-white/85 leading-relaxed">
          At 6+ months, breastmilk continues to provide vital nutrients while introducing thick porridge, enriched vegetables, mashed fruits, and protein 2–3 times daily.
        </p>
      </div>

      {/* MNP, Vitamin A & Deworming Chips */}
      <div className="space-y-3">
        <span className="font-body text-[11px] font-bold tracking-wider text-ink-600 uppercase px-1">
          MICRONUTRIENT & SUPPLEMENTATION STATUS
        </span>

        <div className="grid grid-cols-3 gap-2.5">
          {/* MNP (Micro-Nutrient Powders) */}
          <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-3.5 text-center space-y-1">
            <div className="w-8 h-8 rounded-full bg-lavender-100 text-haven-orchid flex items-center justify-center mx-auto mb-1">
              <Apple className="w-4 h-4" />
            </div>
            <p className="font-display font-bold text-xs text-ink-900">MNP Packets</p>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold inline-block">
              Daily
            </span>
          </div>

          {/* Vitamin A */}
          <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-3.5 text-center space-y-1">
            <div className="w-8 h-8 rounded-full bg-lavender-100 text-haven-orchid flex items-center justify-center mx-auto mb-1">
              <Pill className="w-4 h-4" />
            </div>
            <p className="font-display font-bold text-xs text-ink-900">Vitamin A</p>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold inline-block">
              6m Given
            </span>
          </div>

          {/* Deworming */}
          <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-3.5 text-center space-y-1">
            <div className="w-8 h-8 rounded-full bg-lavender-100 text-haven-orchid flex items-center justify-center mx-auto mb-1">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="font-display font-bold text-xs text-ink-900">Deworming</p>
            <span className="px-2 py-0.5 rounded-full bg-lavender-200 text-haven-deep text-[10px] font-bold inline-block">
              Due at 12m
            </span>
          </div>
        </div>
      </div>

      {/* Feeding Guidance Link Card */}
      <div
        onClick={onViewGuidance}
        className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 flex items-center justify-between cursor-pointer hover:border-haven-orchid/40 transition-all"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-lavender-100 flex items-center justify-center text-haven-orchid flex-shrink-0">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-display font-bold text-sm text-ink-900">
              Kenya Ministry of Health Feeding Guide
            </h4>
            <p className="font-body text-xs text-ink-600">
              Age-based recipes, 4-star diet recommendations & hygiene
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-ink-600" />
      </div>

      {/* Actions */}
      <div className="space-y-3 pt-2">
        <button
          onClick={() => setShowLogSheet(true)}
          className="w-full py-4 px-6 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-base rounded-pill shadow-button hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Log feeding note</span>
        </button>

        <button
          onClick={() => onAskHaven('What are healthy 4-star complementary foods in Kenya for a 7-month-old infant?')}
          className="w-full py-3.5 px-6 bg-white border border-haven-deep text-haven-deep font-display font-bold text-sm rounded-pill hover:bg-lavender-50 transition-colors flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-haven-orchid" />
          <span>Ask Haven about nutrition</span>
        </button>
      </div>

      {/* Simple Log Feeding Bottom Sheet / Modal */}
      {showLogSheet && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-md p-6 space-y-4 shadow-2xl animate-slide-up">
            <h3 className="font-display font-bold text-lg text-ink-900">Log Nutrition Note</h3>

            <div className="space-y-2">
              <label className="font-display font-bold text-xs text-ink-600 uppercase">
                Feeding Category
              </label>
              <select
                value={feedingType}
                onChange={(e) => setFeedingType(e.target.value)}
                className="w-full p-3 bg-lavender-50 rounded-2xl border border-border-hairline text-sm text-ink-900"
              >
                <option>Complementary feeding + Breastfeeding</option>
                <option>Exclusive Breastfeeding</option>
                <option>Micro-nutrient Powder (MNP) added</option>
                <option>Special Dietary Note</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="font-display font-bold text-xs text-ink-600 uppercase">
                Notes & Observed Tolerance
              </label>
              <textarea
                rows={3}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="e.g. Tolerated mashed butternut and avocado well, breastfed twice."
                className="w-full p-3 bg-lavender-50 rounded-2xl border border-border-hairline text-sm text-ink-900 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSaveNote}
                className="flex-1 py-3.5 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold rounded-pill text-sm"
              >
                Save note
              </button>
              <button
                onClick={() => setShowLogSheet(false)}
                className="flex-1 py-3.5 bg-white border border-haven-deep text-haven-deep font-display font-bold rounded-pill text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
