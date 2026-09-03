import {
  fetchUserContext,
  fetchPersonalizationContext,
  fetchClinicalPregnancyContext,
  fetchClinicalChildrenContext,
  resolvePregnancyContext,
  resolveChildrenContext,
} from './contextSources.js';
import type {
  HavenContext,
  HavenContextFact,
  HavenContextRequest,
  HavenContextProvenance,
} from '../types/havenContext.js';

const fact = <T>(value: T, provenance: HavenContextProvenance, source?: string): HavenContextFact<T> => ({
  value,
  provenance,
  source,
});

/**
 * Builds a deterministic, provenance-labeled Haven context object for a given user.
 * Strictly enforces:
 * 1. Trust Hierarchy: Verified > Authoritative > System-Derived > User-Reported > Anonymous
 * 2. Context Minimization: Strips PII (phone, national ID, email) and clinician private notes
 * 3. Safe Fallback: Returns a valid, minimal context even if database reads fail
 */
export async function buildHavenContext(
  uid: string,
  options: Partial<HavenContextRequest> = {},
): Promise<HavenContext> {
  const isAnonymous = Boolean(options.isAnonymous);

  // Safe fallback base context
  const fallbackContext: HavenContext = {
    userMode: fact(isAnonymous ? 'anonymous' : 'authenticated', isAnonymous ? 'ANONYMOUS' : 'USER_REPORTED'),
    interests: fact([], isAnonymous ? 'ANONYMOUS' : 'USER_REPORTED'),
    children: [],
  };

  if (!uid) {
    return fallbackContext;
  }

  try {
    const [userRes, personalizationRes, pregnancyRes, childrenRes] = await Promise.allSettled([
      fetchUserContext(uid),
      fetchPersonalizationContext(uid),
      fetchClinicalPregnancyContext(uid),
      fetchClinicalChildrenContext(uid),
    ]);

    const user = userRes.status === 'fulfilled' ? userRes.value : null;
    const personalization = personalizationRes.status === 'fulfilled' ? personalizationRes.value : null;
    const clinicalPregnancy = pregnancyRes.status === 'fulfilled' ? pregnancyRes.value : null;
    const clinicalChildren = childrenRes.status === 'fulfilled' ? childrenRes.value : [];

    const defaultProvenance: HavenContextProvenance = isAnonymous ? 'ANONYMOUS' : 'USER_REPORTED';

    const result: HavenContext = {
      userMode: fact(
        isAnonymous ? 'anonymous' : 'authenticated',
        isAnonymous ? 'ANONYMOUS' : 'VERIFIED',
        'auth',
      ),
      interests: fact(
        personalization?.interests && personalization.interests.length > 0 ? personalization.interests : [],
        defaultProvenance,
        'healthContexts.interests',
      ),
      children: resolveChildrenContext(clinicalChildren, personalization),
    };

    // Lifecycle stage
    const lifecycleStage = personalization?.lifecycleStage || (options.contextMode === 'CHILD' ? 'postpartum' : 'pregnancy');
    result.lifecycleStage = fact(lifecycleStage, defaultProvenance, 'healthContexts.lifecycleStage');

    // Preferred name (context minimization: avoid full legal names if preferred name exists)
    const preferredName = personalization?.preferredName || user?.displayName;
    if (preferredName) {
      result.preferredName = fact(preferredName, defaultProvenance, 'healthContexts.preferredName');
    }

    // Language
    const language = personalization?.language || options.language;
    if (language === 'en' || language === 'sw') {
      result.language = fact(language, defaultProvenance, 'healthContexts.language');
    }

    // Location (county / subcounty only, no street or GPS)
    const county = personalization?.county || personalization?.location?.county;
    const subcounty = personalization?.subcounty || personalization?.location?.subcounty;
    if (county || subcounty) {
      result.location = fact({ county, subcounty }, defaultProvenance, 'healthContexts.location');
    }

    // Dietary preferences
    if (personalization?.dietaryPreferences && personalization.dietaryPreferences.length > 0) {
      result.dietaryPreferences = fact(
        personalization.dietaryPreferences,
        defaultProvenance,
        'healthContexts.dietaryPreferences',
      );
    }

    // Haven response style
    if (personalization?.havenResponseStyle) {
      result.havenResponseStyle = fact(
        personalization.havenResponseStyle,
        defaultProvenance,
        'healthContexts.havenResponseStyle',
      );
    }

    // Resolve pregnancy facts and derived timing using trust hierarchy
    const { pregnancyFact, derivedTimingFact } = resolvePregnancyContext(clinicalPregnancy, personalization);
    if (pregnancyFact) {
      result.pregnancy = pregnancyFact;
    }
    if (derivedTimingFact) {
      result.derivedTiming = derivedTimingFact;
    }

    return result;
  } catch (error) {
    console.warn(`[HavenContextBuilder] Failed to build context for ${uid}; returning safe fallback:`, error);
    return fallbackContext;
  }
}

/**
 * Deterministically formats the HavenContext for injection into the Gemini system/user prompt.
 * Strictly labels every single fact with its provenance tag.
 */
export function formatHavenContext(context: HavenContext): string {
  const lines: string[] = [
    'MomHaven context (use only to personalize tone, language, and clinical relevance; never treat personalization as a diagnosis):',
  ];

  if (context.userMode) {
    lines.push(`- User session: ${context.userMode.value === 'anonymous' ? 'Anonymous Guest' : 'Authenticated Mother'} [${context.userMode.provenance}]`);
  }

  if (context.preferredName) {
    lines.push(`- Preferred name: ${context.preferredName.value} [${context.preferredName.provenance}]`);
  }

  if (context.lifecycleStage) {
    lines.push(`- Lifecycle stage: ${context.lifecycleStage.value} [${context.lifecycleStage.provenance}]`);
  }

  if (context.language) {
    lines.push(`- Language preference: ${context.language.value === 'sw' ? 'Kiswahili' : 'English'} [${context.language.provenance}]`);
  }

  if (context.location) {
    const loc = context.location.value;
    const locStr = [loc.county, loc.subcounty].filter(Boolean).join(', ') || 'Kenya';
    lines.push(`- Location: ${locStr} [${context.location.provenance}]`);
  }

  if (context.interests?.value?.length) {
    lines.push(`- Interests: ${context.interests.value.join(', ')} [${context.interests.provenance}]`);
  }

  if (context.dietaryPreferences?.value?.length) {
    lines.push(`- Dietary preferences: ${context.dietaryPreferences.value.join(', ')} [${context.dietaryPreferences.provenance}]`);
  }

  if (context.havenResponseStyle) {
    lines.push(`- Haven response style preference: ${context.havenResponseStyle.value} [${context.havenResponseStyle.provenance}]`);
  }

  if (context.pregnancy) {
    const p = context.pregnancy.value;
    const parts: string[] = [];
    if (p.gestationalAgeWeeks !== undefined) {
      parts.push(`week ${p.gestationalAgeWeeks}`);
    }
    if (p.trimester) {
      parts.push(`trimester ${p.trimester}`);
    }
    if (p.edd) {
      parts.push(`EDD ${p.edd}`);
    }
    if (p.gravida !== undefined) {
      parts.push(`gravida ${p.gravida}`);
    }
    if (p.parity !== undefined) {
      parts.push(`parity ${p.parity}`);
    }
    const details = parts.length > 0 ? parts.join(', ') : `status ${p.status}`;
    lines.push(`- Active pregnancy: ${details} [${context.pregnancy.provenance}]`);

    if (p.multiplePregnancy !== undefined) {
      lines.push(`- Multiple pregnancy preference signal: ${p.multiplePregnancy ? 'yes' : 'no'} [USER_REPORTED]`);
    }
  }

  if (context.derivedTiming?.value) {
    const timing = context.derivedTiming.value;
    const timingParts: string[] = [];
    if (timing.currentGestationalWeeks !== undefined) {
      timingParts.push(`${timing.currentGestationalWeeks} weeks gestational age`);
    }
    if (timing.trimester) {
      timingParts.push(`trimester ${timing.trimester}`);
    }
    if (timing.daysRemainingToEdd !== undefined) {
      timingParts.push(`${timing.daysRemainingToEdd} days remaining to EDD`);
    }
    if (timingParts.length > 0) {
      lines.push(`- Derived gestational timing: ${timingParts.join(', ')} [${context.derivedTiming.provenance}]`);
    }
  }

  if (context.children && context.children.length > 0) {
    lines.push(`- Children on record: ${context.children.length} [VERIFIED]`);
    context.children.slice(0, 5).forEach((child, index) => {
      const c = child.value;
      const descParts: string[] = [];
      if (c.name) descParts.push(c.name);
      if (c.ageFormatted) descParts.push(c.ageFormatted);
      if (c.dateOfBirth) descParts.push(`DOB ${c.dateOfBirth}`);
      if (c.sex) descParts.push(c.sex);
      const desc = descParts.length > 0 ? descParts.join(', ') : 'unnamed child';
      lines.push(`  - Child ${index + 1}: ${desc} [${child.provenance}]`);
    });
  }

  lines.push(
    '- Provenance rules:\n' +
    '  * [VERIFIED]: Authoritative clinical record from healthcare facilities.\n' +
    '  * [AUTHORITATIVE]: Clinical schedule or facility guideline.\n' +
    '  * [SYSTEM_DERIVED]: Computed mathematically by MomHaven from verified dates.\n' +
    '  * [USER_REPORTED]: Self-reported by the mother; never treat as clinical diagnosis or confirmation.\n' +
    '  * [ANONYMOUS]: Ephemeral draft from an unauthenticated session.\n' +
    '  * NEVER invent missing clinical data. Defer clinical diagnosis and medication dosing to healthcare providers.'
  );

  return lines.join('\n');
}
