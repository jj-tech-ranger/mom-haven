// src/components/resources/ResourceFilters.tsx
import React from 'react';
import { Search, X, Sparkles } from 'lucide-react';
import { ResourceCategory } from '../../types/educationalResource';

interface ResourceFiltersProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedCategory: string;
  onCategorySelect: (cat: string) => void;
  language: 'en' | 'sw';
  activeInterests?: string[];
  onToggleInterest?: (interest: string) => void;
  availableInterests?: string[];
  totalResults: number;
}

const CATEGORIES: Array<{ id: string; en: string; sw: string }> = [
  { id: 'ALL', en: 'All Topics', sw: 'Mada Zote' },
  { id: 'NUTRITION_SUPERFOODS', en: 'Traditional Superfoods', sw: 'Vyakula Asilia' },
  { id: 'DANGER_SIGNS', en: 'Danger Signs', sw: 'Dalili za Hatari' },
  { id: 'POSTPARTUM_CARE', en: 'Postpartum Care', sw: 'Baada ya Kujifungua' },
  { id: 'NEWBORN_DEVELOPMENT', en: 'Infant & Vaccines', sw: 'Mtoto na Chanjo' },
  { id: 'CLINICAL_VISITS', en: 'Clinical Visits & ANC', sw: 'Kliniki na ANC' },
  { id: 'PRECONCEPTION', en: 'Preconception', sw: 'Maandalizi ya Mimba' },
  { id: 'PARTNER_GUIDE', en: 'Partner & Supporter', sw: 'Miongozo ya Mwenza' },
  { id: 'RIGHTS_AND_POLICY', en: 'Rights & Linda Mama', sw: 'Haki na Bima' },
];

export const ResourceFilters: React.FC<ResourceFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategorySelect,
  language,
  activeInterests = [],
  onToggleInterest,
  availableInterests = ['nutrition', 'warning_signs', 'birth_prep', 'breastfeeding', 'kepi', 'wellbeing'],
  totalResults,
}) => {
  const isSwahili = language === 'sw';

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={
            isSwahili
              ? 'Tafuta miongozo, vyakula, au dalili za afya...'
              : 'Search guides, superfoods, or clinical signs...'
          }
          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm focus:outline-none focus:border-[var(--haven-orchid)] transition-all shadow-2xs"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-full hover:bg-[var(--surface-2)] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none no-scrollbar">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategorySelect(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-display font-medium whitespace-nowrap transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-[var(--haven-deep)] text-white border-[var(--haven-deep)] shadow-2xs'
                  : 'bg-[var(--surface-1)] hover:bg-[var(--surface-2)] text-[var(--text-secondary)] border-[var(--border)]'
              }`}
            >
              {isSwahili ? cat.sw : cat.en}
            </button>
          );
        })}
      </div>

      {/* Quick Interest Tags */}
      {availableInterests.length > 0 && onToggleInterest && (
        <div className="flex items-center gap-2 flex-wrap pt-0.5">
          <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[var(--haven-orchid)]" />
            {isSwahili ? 'Mada maarufu:' : 'Key interests:'}
          </span>
          {availableInterests.map((interest) => {
            const isActive = activeInterests.includes(interest);
            return (
              <button
                key={interest}
                type="button"
                onClick={() => onToggleInterest(interest)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-display transition-colors cursor-pointer border ${
                  isActive
                    ? 'bg-[var(--haven-orchid)]/15 text-[var(--haven-deep)] dark:text-[var(--haven-orchid)] border-[var(--haven-orchid)] font-semibold'
                    : 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)] border-dashed border-[var(--border)]'
                }`}
              >
                {isActive ? '✓ ' : '+ '}
                {interest}
              </button>
            );
          })}
          <span className="ml-auto text-[11px] text-[var(--text-muted)] font-display">
            {totalResults} {isSwahili ? 'miongozo' : 'guides'}
          </span>
        </div>
      )}
    </div>
  );
};
