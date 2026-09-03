// src/services/resourceRecommendationService.test.ts
import {
  scoreResource,
  recommendResources,
  filterPublishedResources,
  filterResourcesByQuery,
} from './resourceRecommendationService';
import { EducationalResource, UserRecommendationContext } from '../types/educationalResource';
import { EDUCATIONAL_RESOURCES } from '../data/educationalResources';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${message}`);
    throw new Error(message);
  }
}

console.log('--- Phase 5: Deterministic Personalized Resource Ranking Tests ---');

// Test 1: Content Safety - Exclude Unpublished Resources
(() => {
  const published = filterPublishedResources(EDUCATIONAL_RESOURCES);
  const hasDraft = published.some((r) => r.reviewStatus === 'DRAFT');
  const hasNeedsReview = published.some((r) => r.reviewStatus === 'NEEDS_CLINICAL_REVIEW');

  assert(!hasDraft, 'Draft resources must be strictly filtered out');
  assert(!hasNeedsReview, 'Unreviewed clinical resources must be strictly filtered out');
  assert(published.length > 0, 'Published resources must be available');
  console.log('✓ content safety: filters out draft and unreviewed clinical content');
})();

// Test 2: Master Scenario from Instructions:
// Context: Pregnancy, Week 28, Kiswahili, Nutrition interest, Nairobi
// Must rank:
// - pregnancy week 28 Kiswahili nutrition resource highest
// - generic English resource lower
// - unrelated postpartum article lowest
(() => {
  const context: UserRecommendationContext = {
    lifecycleStage: 'pregnancy',
    pregnancyWeek: 28,
    language: 'sw',
    interests: ['nutrition'],
    county: 'Nairobi',
    limit: 6,
  };

  const recommendations = recommendResources(context);

  assert(recommendations.length > 0, 'Should return recommendations');
  const top = recommendations[0];

  assert(
    top.resource.id === 'art_preg_w28_nutrition',
    `Top resource must be week 28 nutrition article, got ${top.resource.id}`,
  );
  assert(
    top.resource.pregnancyWeeks?.includes(28) === true,
    'Top resource must match week 28',
  );
  assert(
    top.matchBreakdown.lifecycle === 100,
    'Top resource must have 100 lifecycle score',
  );
  assert(
    top.matchBreakdown.weekOrStage === 80,
    'Top resource must have 80 week score',
  );
  assert(
    top.matchBreakdown.interests === 45,
    'Top resource must have 45 nutrition interest score',
  );
  assert(
    top.matchBreakdown.language >= 50,
    'Top resource must have language match score',
  );
  assert(
    top.matchBreakdown.location === 35,
    'Top resource must have location match for Nairobi',
  );
  assert(
    top.primaryReason.includes('wiki ya 28') || top.primaryReason.includes('week 28'),
    `Primary reason should explain week 28 relevance, got: ${top.primaryReason}`,
  );

  // Check that unrelated postpartum article ranks lower or is excluded
  const postpartumIdx = recommendations.findIndex((r) => r.resource.id === 'art_003');
  if (postpartumIdx !== -1) {
    assert(
      postpartumIdx > 0,
      'Postpartum article must rank significantly lower than pregnancy week 28 nutrition',
    );
    assert(
      recommendations[postpartumIdx].score < top.score,
      'Postpartum article score must be lower than week 28 article',
    );
  }

  console.log('✓ master scenario: accurately ranks week 28 Kiswahili nutrition resource at the top');
})();

// Test 3: Language Matching
(() => {
  const enContext: UserRecommendationContext = {
    lifecycleStage: 'planning',
    language: 'en',
  };
  const swContext: UserRecommendationContext = {
    lifecycleStage: 'planning',
    language: 'sw',
  };

  const enRecs = recommendResources(enContext);
  const swRecs = recommendResources(swContext);

  assert(enRecs.length > 0 && swRecs.length > 0, 'Both languages return recommendations');
  // Check Swahili reasons
  const swItem = swRecs.find((r) => r.resource.id === 'art_008');
  assert(!!swItem, 'Preconception article found for planning stage');
  assert(
    swItem!.relevanceReasons.some((r) => r.includes('Inapatikana kwa Kiswahili')),
    'Swahili reasons must acknowledge Kiswahili availability',
  );
  console.log('✓ language matching: properly scores and explains English and Kiswahili options');
})();

// Test 4: Lifecycle Stage Separation (Parenting vs Pregnancy)
(() => {
  const parentingContext: UserRecommendationContext = {
    lifecycleStage: 'parenting',
    childAgeMonths: 8,
    language: 'en',
    interests: ['nutrition', 'development'],
  };

  const recs = recommendResources(parentingContext);
  assert(recs.length > 0, 'Parenting context returns recommendations');
  const topRec = recs[0];

  assert(
    topRec.resource.lifecycleStages.includes('parenting'),
    `Top result must match parenting lifecycle, got: ${topRec.resource.id}`,
  );
  assert(
    topRec.resource.id === 'art_004',
    `Top result for 8 month old with nutrition interest should be Wimbi porridge (art_004), got: ${topRec.resource.id}`,
  );
  assert(
    topRec.matchBreakdown.weekOrStage === 80,
    'Should award 80 points for matching child age range (6-24m)',
  );
  console.log('✓ lifecycle and child age matching: tailors recommendations for parenting and infant age');
})();

// Test 5: Postpartum Week Matching
(() => {
  const postpartumContext: UserRecommendationContext = {
    lifecycleStage: 'postpartum',
    postpartumWeeks: 2,
    language: 'en',
    interests: ['breastfeeding', 'nutrition'],
  };

  const recs = recommendResources(postpartumContext);
  assert(recs.length > 0, 'Postpartum context returns recommendations');
  const top = recs[0];

  assert(
    top.resource.id === 'art_003',
    `Top result for 2-week postpartum breastfeeding should be Kunde lactation (art_003), got ${top.resource.id}`,
  );
  assert(
    top.matchBreakdown.weekOrStage === 80,
    'Should award 80 points for matching postpartum week 2',
  );
  console.log('✓ postpartum matching: accurately targets early postpartum weeks and lactation interests');
})();

// Test 6: Location Targeting (Specific County vs Nationwide)
(() => {
  const resourceWithCounty: EducationalResource = {
    id: 'test_county_res',
    title: 'Mombasa Maternal Clinic Network',
    summary: 'Mombasa county health centers guide',
    category: 'CLINICAL_VISITS',
    lifecycleStages: ['pregnancy'],
    languages: ['en'],
    topics: ['anc'],
    counties: ['mombasa'],
    reviewedBy: 'Dr. Test',
    reviewStatus: 'PUBLISHED',
    lastUpdated: '2026-08-01',
    priority: 50,
  };

  const mombasaContext: UserRecommendationContext = {
    lifecycleStage: 'pregnancy',
    language: 'en',
    county: 'Mombasa',
  };

  const kisumuContext: UserRecommendationContext = {
    lifecycleStage: 'pregnancy',
    language: 'en',
    county: 'Kisumu',
  };

  const scoredMombasa = scoreResource(resourceWithCounty, mombasaContext);
  const scoredKisumu = scoreResource(resourceWithCounty, kisumuContext);

  assert(
    scoredMombasa.matchBreakdown.location === 35,
    'Mombasa context should receive 35 location match points',
  );
  assert(
    scoredKisumu.matchBreakdown.location === 0,
    'Kisumu context should receive 0 location points for Mombasa resource',
  );
  console.log('✓ location matching: scores county-specific resources appropriately');
})();

// Test 7: Empty State & Graceful Fallback (Never leave users blank)
(() => {
  // Ultra-niche query with no direct topic match
  const oddContext: UserRecommendationContext = {
    lifecycleStage: 'supporter',
    language: 'sw',
    interests: ['nonexistent_topic_xyz'],
    county: 'Marsabit',
    limit: 4,
  };

  const recs = recommendResources(oddContext);
  assert(recs.length === 4, `Should gracefully fall back to 4 bounded results, got ${recs.length}`);
  assert(
    recs.every((r) => r.resource.reviewStatus === 'PUBLISHED'),
    'All returned fallback resources must still be PUBLISHED',
  );
  console.log('✓ fallback handling: never returns blank screen and always bounds recommendations');
})();

// Test 8: Missing Metadata / Resilience
(() => {
  const minimalResource: EducationalResource = {
    id: 'min_res',
    title: 'Minimal Resource',
    summary: 'Minimal summary',
    category: 'NUTRITION_SUPERFOODS',
    lifecycleStages: ['pregnancy'],
    languages: ['en'],
    topics: [],
    reviewedBy: 'Dr. Test',
    reviewStatus: 'PUBLISHED',
    lastUpdated: '2026-08-01',
  };

  // Missing all optional context fields
  const emptyContext: UserRecommendationContext = {
    lifecycleStage: 'pregnancy',
    language: 'en',
  };

  const scored = scoreResource(minimalResource, emptyContext);
  assert(scored.score > 0, 'Score should compute without errors');
  assert(scored.relevanceReasons.length > 0, 'Should have at least one explanation');
  console.log('✓ resilience: handles sparse or missing metadata cleanly without throwing');
})();

// Test 9: Strict Determinism
(() => {
  const context: UserRecommendationContext = {
    lifecycleStage: 'pregnancy',
    pregnancyWeek: 28,
    language: 'sw',
    interests: ['nutrition'],
    county: 'Nairobi',
    limit: 5,
  };

  const run1 = recommendResources(context);
  const run2 = recommendResources(context);
  const run3 = recommendResources(context);

  const ids1 = run1.map((r) => r.resource.id).join(',');
  const ids2 = run2.map((r) => r.resource.id).join(',');
  const ids3 = run3.map((r) => r.resource.id).join(',');

  assert(ids1 === ids2 && ids2 === ids3, 'Recommendation rankings must be 100% deterministic across multiple runs');
  const scores1 = run1.map((r) => r.score).join(',');
  const scores2 = run2.map((r) => r.score).join(',');
  assert(scores1 === scores2, 'Scores must be identical across runs');
  console.log('✓ strict determinism: yields identical rankings and scores across runs');
})();

// Test 10: Client-Side Filter Helper
(() => {
  const results = filterResourcesByQuery(EDUCATIONAL_RESOURCES, 'managu');
  assert(results.length >= 1, 'Should find managu articles');
  assert(
    results.some((r) => r.title.toLowerCase().includes('managu')),
    'Matching article found',
  );

  const catFiltered = filterResourcesByQuery(EDUCATIONAL_RESOURCES, '', 'DANGER_SIGNS');
  assert(
    catFiltered.every((r) => r.category === 'DANGER_SIGNS'),
    'Category filter isolates DANGER_SIGNS articles',
  );
  console.log('✓ filter helper: reliably filters by search text and categories');
})();

console.log('All Phase 5 Deterministic Resource Recommendation tests passed successfully!');
