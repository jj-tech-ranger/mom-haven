// src/components/resources/PersonalizedResources.tsx
import React, { useState, useMemo } from 'react';
import {
  BookOpen, Sparkles, ShieldCheck, ChevronRight, X, Heart,
  ExternalLink, MessageCircle, MapPin, Calendar, Clock,
  CheckCircle2, Info, AlertCircle, Share2
} from 'lucide-react';
import {
  EducationalResource,
  UserRecommendationContext,
  RankedResource,
} from '../../types/educationalResource';
import {
  recommendResources,
  filterResourcesByQuery,
} from '../../services/resourceRecommendationService';
import { ResourceFilters } from './ResourceFilters';
import { usePreferences } from '../../context/PreferencesContext';
import { getAnonymousContextDraft } from '../../services/anonymousContextService';
import type { HealthContext } from '../../types/healthContext';
import type { TodayContext } from '../../services/todayContextService';

export interface PersonalizedResourcesProps {
  healthContext?: HealthContext | null;
  todayContext?: TodayContext | null;
  customContext?: Partial<UserRecommendationContext>;
  onAskHaven?: (prompt: string) => void;
  compact?: boolean;
  onClose?: () => void;
  title?: string;
  limit?: number;
}

export const PersonalizedResources: React.FC<PersonalizedResourcesProps> = ({
  healthContext,
  todayContext,
  customContext,
  onAskHaven,
  compact = false,
  onClose,
  title,
  limit = 8,
}) => {
  let prefLanguage: 'en' | 'sw' = 'en';
  try {
    const prefs = usePreferences();
    if (prefs?.language) prefLanguage = prefs.language;
  } catch {
    // preferences provider fallback
  }

  const anonDraft = useMemo(() => {
    try {
      return getAnonymousContextDraft();
    } catch {
      return null;
    }
  }, []);

  const activeLanguage: 'en' | 'sw' = (customContext?.language || healthContext?.language || prefLanguage || 'en') as 'en' | 'sw';
  const isSwahili = activeLanguage === 'sw';

  const defaultInterests = useMemo(() => {
    if (customContext?.interests && customContext.interests.length > 0) return customContext.interests;
    if (todayContext?.userInterests && todayContext.userInterests.length > 0) return todayContext.userInterests;
    if (healthContext?.interests && healthContext.interests.length > 0) return healthContext.interests;
    if (anonDraft?.interests && anonDraft.interests.length > 0) return anonDraft.interests;
    return ['nutrition'];
  }, [customContext, todayContext, healthContext, anonDraft]);

  const [activeInterests, setActiveInterests] = useState<string[]>(defaultInterests);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedArticle, setSelectedArticle] = useState<EducationalResource | null>(null);

  const recommendationContext: UserRecommendationContext = useMemo(() => {
    const stage = customContext?.lifecycleStage || todayContext?.lifecycleStage || healthContext?.lifecycleStage || anonDraft?.lifecycleStage || 'pregnancy';
    
    // Gestation week
    let pregWeek = customContext?.pregnancyWeek;
    if (pregWeek === undefined && stage === 'pregnancy') {
      if (todayContext?.hero.type === 'pregnancy') {
        pregWeek = todayContext.hero.gestationalWeeks;
      } else if (healthContext?.pregnancy?.pregnancyWeek) {
        pregWeek = healthContext.pregnancy.pregnancyWeek;
      } else if (anonDraft?.pregnancyWeek) {
        pregWeek = anonDraft.pregnancyWeek;
      }
    }

    // Postpartum weeks
    let postWeek = customContext?.postpartumWeeks;
    if (postWeek === undefined && stage === 'postpartum') {
      if (todayContext?.hero.type === 'postpartum') {
        postWeek = todayContext.hero.weeksPostpartum;
      }
    }

    const county = customContext?.county || todayContext?.county || healthContext?.county || anonDraft?.county;
    const subcounty = customContext?.subcounty || healthContext?.subcounty || anonDraft?.subcounty;
    const audience = customContext?.audience || (stage === 'supporter' ? 'supporter' : 'mother');

    return {
      lifecycleStage: stage,
      language: activeLanguage,
      interests: activeInterests,
      pregnancyWeek: pregWeek,
      postpartumWeeks: postWeek,
      childAgeMonths: customContext?.childAgeMonths,
      county,
      subcounty,
      audience,
      limit,
    };
  }, [customContext, todayContext, healthContext, anonDraft, activeLanguage, activeInterests, limit]);

  // 2. Compute Deterministic Recommendations
  const rankedResources = useMemo(() => {
    return recommendResources(recommendationContext);
  }, [recommendationContext]);

  // 3. Filter recommendations by search and category if user applies UI filters
  const displayedResources = useMemo(() => {
    const rawList = rankedResources.map((r) => r.resource);
    const filteredRaw = filterResourcesByQuery(rawList, searchTerm, selectedCategory);
    const filteredIds = new Set(filteredRaw.map((r) => r.id));
    return rankedResources.filter((r) => filteredIds.has(r.resource.id));
  }, [rankedResources, searchTerm, selectedCategory]);

  const handleToggleInterest = (interest: string) => {
    setActiveInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
    );
  };

  const handleAskHavenAboutTopic = (resource: EducationalResource) => {
    if (!onAskHaven) return;
    const prompt = isSwahili
      ? `Habari Haven, ningependa kujua zaidi kuhusu mwongozo huu: "${resource.titleSwahili || resource.title}". Nawezaje kufuata maagizo haya nyumbani?`
      : `Hello Haven, could you tell me more about this guide: "${resource.title}" and practical steps for my daily routine?`;
    onAskHaven(prompt);
  };

  return (
    <div className={`space-y-4 ${compact ? '' : 'p-4 sm:p-6 bg-[var(--surface-1)] rounded-3xl border border-[var(--border)] shadow-xs'}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[var(--haven-orchid)] animate-pulse" />
            <span className="text-xs font-display font-bold uppercase tracking-wider text-[var(--haven-orchid)]">
              {isSwahili ? 'Miongozo Iliyobinafsishwa' : 'Personalized Health Guidance'}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-display font-extrabold text-[var(--text-primary)] tracking-tight">
            {title || (isSwahili ? 'Miongozo ya Afya Inayokufaa' : 'Evidence-Based Resources For You')}
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 max-w-xl">
            {isSwahili
              ? 'Miongozo ya kisayansi iliyochaguliwa kulingana na wiki yako, eneo, na mada unazopenda.'
              : 'Deterministically matched to your current lifecycle stage, timing, and local healthcare context.'}
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Active Personalization Context Chips */}
      <div className="flex items-center gap-1.5 flex-wrap p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs">
        <span className="text-[11px] font-bold text-[var(--text-muted)] font-display uppercase tracking-wider">
          {isSwahili ? 'Muktadha Wako:' : 'Matched Context:'}
        </span>
        <span className="px-2 py-0.5 rounded-md bg-[var(--surface-1)] border border-[var(--border)] text-[var(--text-primary)] font-medium font-display">
          {recommendationContext.lifecycleStage}
        </span>
        {recommendationContext.pregnancyWeek && (
          <span className="px-2 py-0.5 rounded-md bg-[var(--haven-orchid)]/10 text-[var(--haven-deep)] dark:text-[var(--haven-orchid)] border border-[var(--haven-orchid)]/20 font-bold font-display">
            {isSwahili ? `Wiki ya ${recommendationContext.pregnancyWeek}` : `Week ${recommendationContext.pregnancyWeek}`}
          </span>
        )}
        {recommendationContext.postpartumWeeks && (
          <span className="px-2 py-0.5 rounded-md bg-[var(--haven-orchid)]/10 text-[var(--haven-deep)] dark:text-[var(--haven-orchid)] border border-[var(--haven-orchid)]/20 font-bold font-display">
            {isSwahili ? `Wiki ${recommendationContext.postpartumWeeks} Postpartum` : `Week ${recommendationContext.postpartumWeeks} Postpartum`}
          </span>
        )}
        {recommendationContext.county && (
          <span className="px-2 py-0.5 rounded-md bg-[var(--surface-1)] border border-[var(--border)] text-[var(--text-primary)] flex items-center gap-1 font-display">
            <MapPin className="w-3 h-3 text-[var(--haven-orchid)]" />
            {recommendationContext.county}
          </span>
        )}
        <span className="px-2 py-0.5 rounded-md bg-[var(--surface-1)] border border-[var(--border)] text-[var(--text-muted)] font-display">
          {isSwahili ? 'Kiswahili' : 'English'}
        </span>
      </div>

      {/* Filters & Search Component */}
      <ResourceFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
        language={activeLanguage}
        activeInterests={activeInterests}
        onToggleInterest={handleToggleInterest}
        totalResults={displayedResources.length}
      />

      {/* Resource Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
        {displayedResources.map((ranked) => {
          const res = ranked.resource;
          const cardTitle = isSwahili && res.titleSwahili ? res.titleSwahili : res.title;
          const cardSummary = isSwahili && res.summarySwahili ? res.summarySwahili : res.summary;

          return (
            <div
              key={res.id}
              className="p-4 rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] shadow-2xs hover:shadow-card hover:border-[var(--haven-orchid)]/40 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Reason & Category Row */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-display font-bold px-2 py-0.5 rounded-full bg-[var(--haven-deep)]/10 text-[var(--haven-deep)] dark:text-[var(--haven-orchid)] border border-[var(--haven-orchid)]/20 flex items-center gap-1 truncate">
                    <Sparkles className="w-3 h-3 text-[var(--haven-orchid)] shrink-0" />
                    <span className="truncate">{ranked.primaryReason}</span>
                  </span>
                  {res.trimesterStage && (
                    <span className="text-[10px] font-display font-medium px-2 py-0.5 rounded-md bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)] shrink-0">
                      {res.trimesterStage}
                    </span>
                  )}
                </div>

                {/* Article Title */}
                <h3 className="font-display font-bold text-sm sm:text-base text-[var(--text-primary)] group-hover:text-[var(--haven-orchid)] transition-colors leading-snug">
                  {cardTitle}
                </h3>

                {/* Summary */}
                <p className="font-body text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed line-clamp-3">
                  {cardSummary}
                </p>

                {/* Nutrients or Topics */}
                {res.keyNutrients && res.keyNutrients.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-3">
                    {res.keyNutrients.slice(0, 3).map((nutrient, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-display font-medium px-2 py-0.5 rounded-md bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border)]"
                      >
                        {nutrient}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer with Reviewer & Action */}
              <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] truncate">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{res.reviewedBy.split('(')[0]}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onAskHaven && (
                    <button
                      type="button"
                      onClick={() => handleAskHavenAboutTopic(res)}
                      title={isSwahili ? 'Uliza Haven kuhusu mada hii' : 'Ask Haven about this topic'}
                      className="p-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--haven-orchid)]/15 text-[var(--text-secondary)] hover:text-[var(--haven-deep)] dark:hover:text-[var(--haven-orchid)] transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedArticle(res)}
                    className="inline-flex items-center gap-1 text-xs font-display font-bold text-[var(--haven-deep)] dark:text-[var(--haven-orchid)] hover:underline cursor-pointer"
                  >
                    <span>{isSwahili ? 'Soma' : 'Read'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State when filters yield 0 results */}
      {displayedResources.length === 0 && (
        <div className="p-8 text-center rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-3">
          <BookOpen className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
          <h4 className="font-display font-bold text-sm text-[var(--text-primary)]">
            {isSwahili ? 'Hakuna miongozo inayolingana na utafutaji wako' : 'No matching resources found'}
          </h4>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
            {isSwahili
              ? 'Jaribu kubadilisha neno la utafutaji au futa vichujio ili kuona miongozo yote inayopatikana.'
              : 'Try clearing your search query or category filter to view broader maternal guidance.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('ALL');
            }}
            className="px-4 py-2 rounded-xl bg-[var(--surface-1)] hover:bg-[var(--surface-3)] text-[var(--text-primary)] text-xs font-display font-semibold border border-[var(--border)] transition-colors cursor-pointer"
          >
            {isSwahili ? 'Rejesha Miongozo Yote' : 'Reset Filters'}
          </button>
        </div>
      )}

      {/* Clinical Provenance & Governance Note */}
      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-[var(--text-secondary)] flex items-start gap-2 leading-relaxed">
        <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[var(--text-primary)]">
            {isSwahili ? 'Uzingatiaji wa Kitabibu: ' : 'Educational Disclaimer: '}
          </span>
          {isSwahili
            ? 'Miongozo hii inalenga kutoa elimu ya afya na lishe kulingana na miongozo ya Wizara ya Afya ya Kenya (MOH). Haichukui nafasi ya ushauri wa daktari au mkunga hospitalini.'
            : 'These resources provide educational health and nutrition guidance adhering to Kenya Ministry of Health protocols. Recommendations are tailored based on your reported stage and interests, but do not constitute an individualized medical diagnosis.'}
        </div>
      </div>

      {/* Full Article Reading Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[var(--surface-1)] w-full max-w-2xl rounded-3xl border border-[var(--border)] shadow-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-[var(--border)] flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-display font-bold px-2 py-0.5 rounded-full bg-[var(--haven-orchid)]/15 text-[var(--haven-deep)] dark:text-[var(--haven-orchid)] border border-[var(--haven-orchid)]/30">
                    {selectedArticle.category.replace(/_/g, ' ')}
                  </span>
                  {selectedArticle.trimesterStage && (
                    <span className="text-[10px] font-display font-medium px-2 py-0.5 rounded-md bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)]">
                      {selectedArticle.trimesterStage}
                    </span>
                  )}
                </div>
                <h3 className="font-display font-extrabold text-lg sm:text-xl text-[var(--text-primary)] leading-snug">
                  {isSwahili && selectedArticle.titleSwahili
                    ? selectedArticle.titleSwahili
                    : selectedArticle.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="p-1.5 rounded-full hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm">
              {/* Summary Callout */}
              <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] font-body text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed italic">
                "{isSwahili && selectedArticle.summarySwahili ? selectedArticle.summarySwahili : selectedArticle.summary}"
              </div>

              {/* Main Content Body */}
              <div className="font-body text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed space-y-3 whitespace-pre-line">
                {isSwahili && selectedArticle.bodySwahili
                  ? selectedArticle.bodySwahili
                  : selectedArticle.body || selectedArticle.summary}
              </div>

              {/* Key Nutrients / Protocols Pill Box */}
              {selectedArticle.keyNutrients && selectedArticle.keyNutrients.length > 0 && (
                <div className="p-4 rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--border)] space-y-2">
                  <h4 className="font-display font-bold text-xs text-[var(--text-primary)] uppercase tracking-wider">
                    {isSwahili ? 'Virutubisho na Mambo Muhimu:' : 'Key Nutrients & Clinical Protocols:'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedArticle.keyNutrients.map((nutrient, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-[var(--surface-1)] text-[var(--haven-deep)] dark:text-[var(--haven-orchid)] border border-[var(--border)] font-display text-xs font-semibold"
                      >
                        {nutrient}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Clinical Reviewer Credential Box */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-display font-bold text-[var(--text-primary)]">
                      {isSwahili ? 'Imehakikiwa Kitabibu:' : 'Clinically Reviewed by:'}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      {selectedArticle.reviewedBy}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] font-display text-right">
                  {isSwahili ? 'Ilisasishwa:' : 'Updated:'} {selectedArticle.lastUpdated}
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-2)]/50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="px-4 py-2 rounded-xl bg-[var(--surface-1)] hover:bg-[var(--surface-3)] text-[var(--text-secondary)] text-xs font-display font-semibold border border-[var(--border)] transition-colors cursor-pointer"
              >
                {isSwahili ? 'Funga' : 'Close'}
              </button>

              {onAskHaven && (
                <button
                  type="button"
                  onClick={() => {
                    const art = selectedArticle;
                    setSelectedArticle(null);
                    handleAskHavenAboutTopic(art);
                  }}
                  className="px-4 py-2 rounded-xl bg-[var(--haven-deep)] hover:opacity-90 text-white text-xs font-display font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{isSwahili ? 'Uliza Haven Kuhusu Mada Hii' : 'Ask Haven About This'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
