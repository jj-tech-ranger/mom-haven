import { adminDb } from '../clinicianAccess.js';
import { getHealthContextForUser } from './healthContextService.js';
import type { HavenContext, HavenContextFact } from '../types/havenContext.js';

const reported = <T>(value: T): HavenContextFact<T> => ({ value, provenance: 'USER_REPORTED' });
const verified = <T>(value: T): HavenContextFact<T> => ({ value, provenance: 'VERIFIED' });

export async function buildHavenContext(uid: string): Promise<HavenContext> {
  const [context, pregnancySnapshot, childrenSnapshot] = await Promise.all([
    getHealthContextForUser(uid),
    adminDb.collection('pregnancies').where('motherId', '==', uid).where('status', '==', 'active').limit(1).get(),
    adminDb.collection('children').where('motherId', '==', uid).limit(10).get(),
  ]);

  const activePregnancy = pregnancySnapshot.empty ? null : pregnancySnapshot.docs[0];
  const pregnancyData = activePregnancy?.data();

  const result: HavenContext = {
    interests: reported(context?.interests || []),
    children: childrenSnapshot.docs.map((doc) => verified({
      id: doc.id,
      name: typeof doc.data().name === 'string' ? doc.data().name : undefined,
      dateOfBirth: typeof doc.data().dateOfBirth === 'string' ? doc.data().dateOfBirth : undefined,
      sex: typeof doc.data().sex === 'string' ? doc.data().sex : undefined,
    })),
  };

  if (context?.lifecycleStage) result.lifecycleStage = reported(context.lifecycleStage);
  if (context?.preferredName) result.preferredName = reported(context.preferredName);
  if (context?.language) result.language = reported(context.language);
  if (context?.county || context?.subcounty) result.location = reported({ county: context.county, subcounty: context.subcounty });
  if (context?.havenResponseStyle) result.havenResponseStyle = reported(context.havenResponseStyle);

  if (activePregnancy) {
    result.pregnancy = verified({
      id: activePregnancy.id,
      lmp: typeof pregnancyData?.lmp === 'string' ? pregnancyData.lmp : undefined,
      edd: typeof pregnancyData?.edd === 'string' ? pregnancyData.edd : undefined,
      gestationalAgeWeeks: typeof pregnancyData?.gestationalAgeWeeks === 'number' ? pregnancyData.gestationalAgeWeeks : undefined,
      status: typeof pregnancyData?.status === 'string' ? pregnancyData.status : 'active',
      gravida: typeof pregnancyData?.gravida === 'number' ? pregnancyData.gravida : undefined,
      parity: typeof pregnancyData?.parity === 'number' ? pregnancyData.parity : undefined,
      multiplePregnancy: context?.pregnancy?.multiplePregnancy,
    });
  }

  return result;
}

export function formatHavenContext(context: HavenContext): string {
  const lines: string[] = ['MomHaven context (use only to personalize; never treat personalization as a diagnosis):'];

  if (context.preferredName) lines.push(`- Preferred name: ${context.preferredName.value} [${context.preferredName.provenance}]`);
  if (context.lifecycleStage) lines.push(`- Lifecycle stage: ${context.lifecycleStage.value} [${context.lifecycleStage.provenance}]`);
  if (context.language) lines.push(`- Language: ${context.language.value} [${context.language.provenance}]`);
  if (context.location) lines.push(`- Location: ${context.location.value.county || 'unknown county'}${context.location.value.subcounty ? `, ${context.location.value.subcounty}` : ''} [${context.location.provenance}]`);
  if (context.interests.value.length) lines.push(`- Interests: ${context.interests.value.join(', ')} [${context.interests.provenance}]`);
  if (context.havenResponseStyle) lines.push(`- Haven response preference: ${context.havenResponseStyle.value} [${context.havenResponseStyle.provenance}]`);

  if (context.pregnancy) {
    const pregnancy = context.pregnancy.value;
    lines.push(`- Active pregnancy: week ${pregnancy.gestationalAgeWeeks ?? 'unknown'}, EDD ${pregnancy.edd ?? 'unknown'}, gravida ${pregnancy.gravida ?? 'unknown'}, parity ${pregnancy.parity ?? 'unknown'} [${context.pregnancy.provenance}]`);
    if (pregnancy.multiplePregnancy !== undefined) lines.push(`- Multiple pregnancy preference signal: ${pregnancy.multiplePregnancy ? 'yes' : 'no'} [USER_REPORTED]`);
  }

  if (context.children.length) {
    lines.push(`- Children on record: ${context.children.length} [VERIFIED]`);
    context.children.slice(0, 5).forEach((child, index) => {
      const value = child.value;
      lines.push(`  - Child ${index + 1}: ${value.name || 'unnamed'}, DOB ${value.dateOfBirth || 'unknown'} [${child.provenance}]`);
    });
  }

  lines.push('- Provenance rule: USER_REPORTED is what the mother told MomHaven; VERIFIED comes from clinical records. Do not imply a user-reported fact was clinically confirmed.');
  return lines.join('\n');
}
