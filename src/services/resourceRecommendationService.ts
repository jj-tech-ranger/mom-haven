// src/services/resourceRecommendationService.ts
import { LifecycleStage } from '../types/healthContext';
import {
  EducationalResource,
  UserRecommendationContext,
  RankedResource,
} from '../types/educationalResource';
import { EDUCATIONAL_RESOURCES } from '../data/educationalResources';

const TOPIC_LABELS: Record<string, { en: string; sw: string }> = {
  nutrition: { en: 'Nutrition & Superfoods', sw: 'Lishe Bora' },
  superfoods: { en: 'Traditional Superfoods', sw: 'Vyakula vya Kiasili' },
  iron: { en: 'Iron & Blood Building', sw: 'Madini ya Chuma' },
  calcium: { en: 'Bone Health & Calcium', sw: 'Kalsiamu na Mifupa' },
  warning_signs: { en: 'Danger Signs & Triage', sw: 'Dalili za Hatari' },
  emergency: { en: 'Emergency Protocols', sw: 'Itifaki ya Dharura' },
  anc: { en: 'Antenatal Care (ANC)', sw: 'Kliniki ya Ujauzito (ANC)' },
  birth_prep: { en: 'Birth Preparedness', sw: 'Maandalizi ya Kujifungua' },
  postpartum: { en: 'Postpartum Recovery', sw: 'Afya Baada ya Kujifungua' },
  breastfeeding: { en: 'Lactation & Feeding', sw: 'Unyonyeshaji' },
  development: { en: 'Child Growth & Milestones', sw: 'Ukuaji wa Mtoto' },
  kepi: { en: 'KEPI Immunizations', sw: 'Chanjo za KEPI' },
  weaning: { en: 'Complementary Feeding', sw: 'Kuanzisha Vyakula vya Nyongeza' },
  wellbeing: { en: 'Mental & Physical Wellbeing', sw: 'Ustawi wa Mama' },
  rights: { en: 'Maternal Rights & Insurance', sw: 'Haki za Uzazi na Bima' },
  folic_acid: { en: 'Preconception Folic Acid', sw: 'Asidi ya Folic' },
};

const LIFECYCLE_LABELS: Record<LifecycleStage, { en: string; sw: string }> = {
  pregnancy: { en: 'Pregnancy', sw: 'Ujauzito' },
  postpartum: { en: 'Postpartum Recovery', sw: 'Baada ya Kujifungua' },
  parenting: { en: 'Child Care & Parenting', sw: 'Malezi ya Mtoto' },
  planning: { en: 'Preconception Planning', sw: 'Maandalizi ya Mimba' },
  supporter: { en: 'Partner & Family Support', sw: 'Msaada wa Mwenza' },
  exploring: { en: 'Health Guides & Rights', sw: 'Miongozo ya Afya' },
};

function formatTopicName(topic: string, lang: 'en' | 'sw'): string {
  const norm = topic.toLowerCase().trim();
  if (TOPIC_LABELS[norm]) {
    return TOPIC_LABELS[norm][lang];
  }
  return topic.charAt(0).toUpperCase() + topic.slice(1).replace(/_/g, ' ');
}

function normalize(str?: string): string {
  return (str || '').toLowerCase().trim();
}

/**
 * Filter invalid or unpublished content.
 * Content safety mandate: Never surface drafts or content under clinical review
 * to end users.
 */
export function filterPublishedResources(
  resources: EducationalResource[],
): EducationalResource[] {
  return resources.filter((res) => {
    if (!res || typeof res !== 'object') return false;
    if (!res.id || !res.title || !res.summary || !res.category) return false;
    if (res.reviewStatus !== 'PUBLISHED') return false;
    return true;
  });
}

/**
 * Deterministically ranks educational resources based on explainable factors:
 * 1. Exact lifecycle stage match (+100)
 * 2. Pregnancy week / postpartum week / child age match (+80 exact, +40 near)
 * 3. Matched topics & interests (+45 each, max 135)
 * 4. Language match (+50, +15 for full localized content)
 * 5. Location match (+35 specific county, +10 nationwide)
 * 6. Editorial priority bonus (+0 to 20)
 *
 * Tie-breaker:
 * score desc -> priority desc -> lastUpdated desc -> id asc
 */
export function scoreResource(
  resource: EducationalResource,
  context: UserRecommendationContext,
): RankedResource {
  const isSwahili = context.language === 'sw';
  const reasons: string[] = [];

  let lifecycleScore = 0;
  let weekOrStageScore = 0;
  let interestScore = 0;
  let languageScore = 0;
  let locationScore = 0;
  const priorityScore = Math.round(((resource.priority ?? 50) / 100) * 20);

  // 1. Lifecycle Stage Matching
  const hasExactLifecycle = resource.lifecycleStages.includes(context.lifecycleStage);
  if (hasExactLifecycle) {
    lifecycleScore = 100;
    const stageName = LIFECYCLE_LABELS[context.lifecycleStage]?.[context.language] || context.lifecycleStage;
    reasons.push(
      isSwahili
        ? `Inalingana na hatua yako ya ${stageName}`
        : `Matched your current stage: ${stageName}`,
    );
  } else if (context.lifecycleStage === 'exploring' || resource.lifecycleStages.includes('exploring')) {
    lifecycleScore = 40;
    reasons.push(
      isSwahili
        ? 'Mwongozo wa jumla wa afya ya jamii'
        : 'General maternal health guidance',
    );
  }

  // 2. Week / Stage Timing Matching
  if (context.lifecycleStage === 'pregnancy' && typeof context.pregnancyWeek === 'number') {
    const pw = context.pregnancyWeek;
    if (resource.pregnancyWeeks && resource.pregnancyWeeks.includes(pw)) {
      weekOrStageScore = 80;
      reasons.push(
        isSwahili
          ? `Inapendekezwa kwa wiki ya ${pw}`
          : `Recommended for week ${pw}`,
      );
    } else if (
      resource.pregnancyWeeks &&
      resource.pregnancyWeeks.some((w) => Math.abs(w - pw) <= 2)
    ) {
      weekOrStageScore = 40;
      reasons.push(
        isSwahili
          ? 'Inafaa kwa hatua yako ya sasa ya ujauzito'
          : 'Relevant for your current gestational stage',
      );
    }
  } else if (
    context.lifecycleStage === 'postpartum' &&
    typeof context.postpartumWeeks === 'number'
  ) {
    const ppw = context.postpartumWeeks;
    if (resource.postpartumWeeks && resource.postpartumWeeks.includes(ppw)) {
      weekOrStageScore = 80;
      reasons.push(
        isSwahili
          ? `Inapendekezwa kwa wiki ya ${ppw} baada ya kujifungua`
          : `Recommended for week ${ppw} postpartum`,
      );
    } else if (
      resource.postpartumWeeks &&
      resource.postpartumWeeks.some((w) => Math.abs(w - ppw) <= 2)
    ) {
      weekOrStageScore = 40;
      reasons.push(
        isSwahili
          ? 'Inafaa kwa kipindi cha kwanza baada ya uzazi'
          : 'Relevant for early postpartum recovery',
      );
    }
  } else if (context.lifecycleStage === 'parenting') {
    if (
      typeof context.childAgeMonths === 'number' &&
      resource.childAgeMonthsRange
    ) {
      const age = context.childAgeMonths;
      const { minMonths, maxMonths } = resource.childAgeMonthsRange;
      if (age >= minMonths && age <= maxMonths) {
        weekOrStageScore = 80;
        reasons.push(
          isSwahili
            ? 'Inalingana na umri wa sasa wa mtoto wako'
            : "Tailored for your child's current age",
        );
      }
    }
  }

  // 3. Topic & Interest Matching
  if (context.interests && context.interests.length > 0) {
    let matchedCount = 0;
    const resTopicsNormalized = resource.topics.map(normalize);
    const resCategoryNormalized = normalize(resource.category);

    for (const interest of context.interests) {
      const normInterest = normalize(interest);
      const isMatch =
        resTopicsNormalized.includes(normInterest) ||
        resCategoryNormalized.includes(normInterest) ||
        (normInterest === 'nutrition' &&
          (resCategoryNormalized.includes('nutrition') ||
            resTopicsNormalized.includes('superfoods') ||
            resTopicsNormalized.includes('iron')));

      if (isMatch) {
        matchedCount++;
        const label = formatTopicName(interest, context.language);
        reasons.push(
          isSwahili
            ? `Kulingana na nia yako ya ${label}`
            : `Based on your interest in ${label}`,
        );
      }
    }

    // Up to 3 matches counted (+45 points each, max 135)
    interestScore = Math.min(135, matchedCount * 45);
  }

  // 4. Language Matching
  if (resource.languages.includes(context.language)) {
    languageScore = 50;
    if (context.language === 'sw' && resource.titleSwahili && resource.summarySwahili) {
      languageScore += 15;
      reasons.push('Inapatikana kwa Kiswahili fasaha');
    } else if (context.language === 'en') {
      reasons.push('Available in English');
    }
  }

  // 5. Location Matching
  if (context.county && context.county.trim()) {
    const userCounty = normalize(context.county);
    const countiesNormalized = (resource.counties || []).map(normalize);

    if (countiesNormalized.includes(userCounty)) {
      locationScore = 35;
      const countyDisplay =
        context.county.charAt(0).toUpperCase() + context.county.slice(1);
      reasons.push(
        isSwahili
          ? `Inajumuisha huduma za Kaunti ya ${countyDisplay}`
          : `Specific to ${countyDisplay} County health services`,
      );
    } else if (!resource.counties || resource.counties.length === 0) {
      locationScore = 10;
    }
  } else {
    locationScore = 10;
  }

  const totalScore =
    lifecycleScore +
    weekOrStageScore +
    interestScore +
    languageScore +
    locationScore +
    priorityScore;

  // Derive the single most prominent primary reason for clean badge display
  let primaryReason = '';
  if (weekOrStageScore >= 80) {
    primaryReason = reasons.find(
      (r) =>
        r.includes('Recommended for week') ||
        r.includes('Inapendekezwa kwa wiki') ||
        r.includes("Tailored for your child's") ||
        r.includes('Inalingana na umri'),
    ) || reasons[0];
  } else if (interestScore >= 45) {
    primaryReason = reasons.find(
      (r) => r.includes('Based on your interest') || r.includes('Kulingana na nia'),
    ) || reasons[0];
  } else if (lifecycleScore >= 100) {
    primaryReason = reasons.find(
      (r) => r.includes('Matched your current') || r.includes('Inalingana na hatua'),
    ) || reasons[0];
  } else if (reasons.length > 0) {
    primaryReason = reasons[0];
  } else {
    primaryReason = isSwahili ? 'Mwongozo wa afya' : 'Health guidance';
  }

  return {
    resource,
    score: totalScore,
    matchBreakdown: {
      lifecycle: lifecycleScore,
      weekOrStage: weekOrStageScore,
      interests: interestScore,
      language: languageScore,
      location: locationScore,
      priority: priorityScore,
    },
    relevanceReasons: reasons,
    primaryReason,
  };
}

/**
 * Main recommendation entry point.
 * Retrieves available resources, filters out unpublished content,
 * applies deterministic ranking, ensures graceful fallbacks on edge cases,
 * and returns a bounded list of explainable recommendations.
 */
export function recommendResources(
  context: UserRecommendationContext,
  pool: EducationalResource[] = EDUCATIONAL_RESOURCES,
): RankedResource[] {
  const limit = context.limit && context.limit > 0 ? context.limit : 6;
  const isSwahili = context.language === 'sw';

  // 1. Filter out invalid and unpublished content
  const published = filterPublishedResources(pool);
  if (published.length === 0) {
    return [];
  }

  // 2. Score all published resources deterministically
  const scored = published.map((res) => scoreResource(res, context));

  // 3. Sort deterministically
  // Primary: total score desc
  // Secondary: editorial priority desc
  // Tertiary: lastUpdated desc
  // Quaternary: id asc
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const pB = b.resource.priority ?? 50;
    const pA = a.resource.priority ?? 50;
    if (pB !== pA) return pB - pA;
    if (b.resource.lastUpdated !== a.resource.lastUpdated) {
      return b.resource.lastUpdated.localeCompare(a.resource.lastUpdated);
    }
    return a.resource.id.localeCompare(b.resource.id);
  });

  // 4. Inspect top results.
  // If top candidate has an exact or strong match (score >= 150), take top scored items.
  const highQuality = scored.filter((item) => item.score >= 120);

  if (highQuality.length >= limit) {
    return highQuality.slice(0, limit);
  }

  // 5. Graceful empty state / broadening strategy:
  // If we have fewer than `limit` high quality matches:
  // We include items that match broader lifecycle or general knowledge,
  // clearly flagged so the user never sees an empty screen.
  const results: RankedResource[] = [...highQuality];
  const includedIds = new Set(results.map((r) => r.resource.id));

  for (const candidate of scored) {
    if (results.length >= limit) break;
    if (includedIds.has(candidate.resource.id)) continue;

    // Add candidate with fallback indication if its initial score was lower
    const isFallback = candidate.score < 120;
    results.push({
      ...candidate,
      isFallback,
      primaryReason:
        candidate.primaryReason ||
        (isFallback
          ? isSwahili
            ? 'Mwongozo muhimu wa afya ya uzazi'
            : 'Essential maternal health guidance'
          : candidate.primaryReason),
    });
    includedIds.add(candidate.resource.id);
  }

  return results.slice(0, limit);
}

/**
 * Filter helper for client-side search & category selection
 */
export function filterResourcesByQuery(
  resources: EducationalResource[],
  query: string,
  categoryFilter = 'ALL',
): EducationalResource[] {
  const normQuery = query.toLowerCase().trim();

  return resources.filter((res) => {
    if (categoryFilter !== 'ALL' && res.category !== categoryFilter) {
      return false;
    }

    if (!normQuery) return true;

    const matchTitle = res.title.toLowerCase().includes(normQuery);
    const matchTitleSw = (res.titleSwahili || '').toLowerCase().includes(normQuery);
    const matchSummary = res.summary.toLowerCase().includes(normQuery);
    const matchSummarySw = (res.summarySwahili || '').toLowerCase().includes(normQuery);
    const matchNutrient = (res.keyNutrients || []).some((n) =>
      n.toLowerCase().includes(normQuery),
    );
    const matchTopic = res.topics.some((t) => t.toLowerCase().includes(normQuery));

    return (
      matchTitle ||
      matchTitleSw ||
      matchSummary ||
      matchSummarySw ||
      matchNutrient ||
      matchTopic
    );
  });
}
