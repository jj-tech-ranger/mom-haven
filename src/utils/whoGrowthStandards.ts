// src/utils/whoGrowthStandards.ts
/**
 * WHO Child Growth Standards (0 to 60 months)
 * LMS Parameters for Weight-for-age and Length/height-for-age.
 * Reference: World Health Organization Child Growth Standards (2006)
 */

export interface LmsCoefficients {
  month: number;
  L: number;
  M: number;
  S: number;
}

// WHO Weight-for-Age LMS (Boys 0-60 months)
export const WHO_WFA_BOYS: LmsCoefficients[] = [
  { month: 0, L: 0.3487, M: 3.3464, S: 0.14602 },
  { month: 1, L: 0.2297, M: 4.4709, S: 0.13395 },
  { month: 2, L: 0.1611, M: 5.5744, S: 0.12427 },
  { month: 3, L: 0.1132, M: 6.4132, S: 0.11978 },
  { month: 4, L: 0.0827, M: 7.0494, S: 0.11762 },
  { month: 5, L: 0.0637, M: 7.5458, S: 0.11676 },
  { month: 6, L: 0.0528, M: 7.9340, S: 0.11718 },
  { month: 7, L: 0.0469, M: 8.2435, S: 0.11756 },
  { month: 8, L: 0.0440, M: 8.5036, S: 0.11786 },
  { month: 9, L: 0.0427, M: 8.7346, S: 0.11797 },
  { month: 10, L: 0.0416, M: 8.9488, S: 0.11786 },
  { month: 11, L: 0.0396, M: 9.1537, S: 0.11754 },
  { month: 12, L: -0.0984, M: 9.6763, S: 0.11181 },
  { month: 14, L: -0.1042, M: 10.0573, S: 0.11132 },
  { month: 16, L: -0.1105, M: 10.4362, S: 0.11090 },
  { month: 18, L: -0.1172, M: 10.8143, S: 0.11054 },
  { month: 20, L: -0.1242, M: 11.1925, S: 0.11022 },
  { month: 22, L: -0.1315, M: 11.5714, S: 0.10996 },
  { month: 24, L: -0.1390, M: 11.9515, S: 0.10976 },
  { month: 30, L: -0.1627, M: 13.1026, S: 0.10952 },
  { month: 36, L: -0.1873, M: 14.2694, S: 0.10986 },
  { month: 48, L: -0.2372, M: 16.6800, S: 0.11186 },
  { month: 60, L: -0.2838, M: 18.2322, S: 0.11475 },
];

// WHO Weight-for-Age LMS (Girls 0-60 months)
export const WHO_WFA_GIRLS: LmsCoefficients[] = [
  { month: 0, L: 0.3809, M: 3.2322, S: 0.14171 },
  { month: 1, L: 0.2872, M: 4.1873, S: 0.13451 },
  { month: 2, L: 0.2312, M: 5.1281, S: 0.12658 },
  { month: 3, L: 0.1916, M: 5.8458, S: 0.12217 },
  { month: 4, L: 0.1652, M: 6.4237, S: 0.12002 },
  { month: 5, L: 0.1495, M: 6.8985, S: 0.11928 },
  { month: 6, L: 0.1443, M: 7.2974, S: 0.11942 },
  { month: 7, L: 0.1481, M: 7.6401, S: 0.11993 },
  { month: 8, L: 0.1588, L2: 0, M: 7.9427, S: 0.12056 } as any,
  { month: 9, L: 0.1741, M: 8.2173, S: 0.12117 },
  { month: 10, L: 0.1923, M: 8.4721, S: 0.12169 },
  { month: 11, L: 0.2119, M: 8.7126, S: 0.12209 },
  { month: 12, L: 0.0039, M: 8.9482, S: 0.11727 },
  { month: 14, L: -0.0041, M: 9.3892, S: 0.11749 },
  { month: 16, L: -0.0125, M: 9.8164, S: 0.11776 },
  { month: 18, L: -0.0210, M: 10.2343, S: 0.11807 },
  { month: 20, L: -0.0298, M: 10.6471, S: 0.11842 },
  { month: 22, L: -0.0387, M: 11.0583, S: 0.11881 },
  { month: 24, L: -0.0478, M: 11.4704, S: 0.11925 },
  { month: 30, L: -0.0763, M: 12.7231, S: 0.12093 },
  { month: 36, L: -0.1065, M: 13.9114, S: 0.12304 },
  { month: 48, L: -0.1704, M: 16.1432, S: 0.12818 },
  { month: 60, L: -0.2349, M: 18.2322, S: 0.13401 },
];

// WHO Length/Height-for-Age LMS (Boys 0-60 months)
export const WHO_LHFA_BOYS: LmsCoefficients[] = [
  { month: 0, L: 1, M: 49.8842, S: 0.03795 },
  { month: 1, L: 1, M: 54.7244, S: 0.03560 },
  { month: 2, L: 1, M: 58.4249, S: 0.03515 },
  { month: 3, L: 1, M: 61.4292, S: 0.03530 },
  { month: 4, L: 1, M: 63.8860, S: 0.03565 },
  { month: 5, L: 1, M: 65.9026, S: 0.03598 },
  { month: 6, L: 1, M: 67.6236, S: 0.03604 },
  { month: 7, L: 1, M: 69.1645, S: 0.03605 },
  { month: 8, L: 1, M: 70.5960, S: 0.03600 },
  { month: 9, L: 1, M: 71.9610, S: 0.03592 },
  { month: 10, L: 1, M: 73.2848, S: 0.03581 },
  { month: 11, L: 1, M: 74.5688, S: 0.03568 },
  { month: 12, L: 1, M: 75.7482, S: 0.03554 },
  { month: 14, L: 1, M: 78.0000, S: 0.03540 },
  { month: 16, L: 1, M: 80.1700, S: 0.03530 },
  { month: 18, L: 1, M: 82.2500, S: 0.03525 },
  { month: 20, L: 1, M: 84.2300, S: 0.03520 },
  { month: 22, L: 1, M: 86.1300, S: 0.03520 },
  { month: 24, L: 1, M: 87.8200, S: 0.03520 },
  { month: 36, L: 1, M: 96.1000, S: 0.03550 },
  { month: 48, L: 1, M: 103.300, S: 0.03610 },
  { month: 60, L: 1, M: 110.000, S: 0.03680 },
];

// WHO Length/Height-for-Age LMS (Girls 0-60 months)
export const WHO_LHFA_GIRLS: LmsCoefficients[] = [
  { month: 0, L: 1, M: 49.1477, S: 0.03790 },
  { month: 1, L: 1, M: 53.6872, S: 0.03572 },
  { month: 2, L: 1, M: 57.0673, S: 0.03525 },
  { month: 3, L: 1, M: 59.8029, S: 0.03538 },
  { month: 4, L: 1, M: 62.0899, S: 0.03571 },
  { month: 5, L: 1, M: 64.0485, S: 0.03603 },
  { month: 6, L: 1, M: 65.7311, S: 0.03649 },
  { month: 7, L: 1, M: 67.2754, S: 0.03650 },
  { month: 8, L: 1, M: 68.7483, S: 0.03645 },
  { month: 9, L: 1, M: 70.1435, S: 0.03635 },
  { month: 10, L: 1, M: 71.4818, S: 0.03623 },
  { month: 11, L: 1, M: 72.8210, S: 0.03610 },
  { month: 12, L: 1, M: 74.0186, S: 0.03603 },
  { month: 14, L: 1, M: 76.4000, S: 0.03590 },
  { month: 16, L: 1, M: 78.6000, S: 0.03580 },
  { month: 18, L: 1, M: 80.7000, S: 0.03570 },
  { month: 20, L: 1, M: 82.7000, S: 0.03560 },
  { month: 22, L: 1, M: 84.6000, S: 0.03550 },
  { month: 24, L: 1, M: 86.4000, S: 0.03540 },
  { month: 36, L: 1, M: 95.1000, S: 0.03580 },
  { month: 48, L: 1, M: 102.700, S: 0.03650 },
  { month: 60, L: 1, M: 109.400, S: 0.03720 },
];

function interpolateLms(table: LmsCoefficients[], ageInMonths: number): LmsCoefficients {
  if (ageInMonths <= table[0].month) return table[0];
  const last = table[table.length - 1];
  if (ageInMonths >= last.month) return last;

  // Linear interpolation between the two surrounding month entries
  for (let i = 0; i < table.length - 1; i++) {
    const a = table[i];
    const b = table[i + 1];
    if (ageInMonths >= a.month && ageInMonths <= b.month) {
      const span = b.month - a.month;
      const t = (ageInMonths - a.month) / (span || 1);
      return {
        month: ageInMonths,
        L: a.L + t * (b.L - a.L),
        M: a.M + t * (b.M - a.M),
        S: a.S + t * (b.S - a.S),
      };
    }
  }
  return last;
}

export function getLmsCoefficients(
  ageInMonths: number,
  sex: 'male' | 'female',
  metric: 'wfa' | 'lhfa'
): LmsCoefficients {
  const table = metric === 'wfa'
    ? (sex === 'male' ? WHO_WFA_BOYS : WHO_WFA_GIRLS)
    : (sex === 'male' ? WHO_LHFA_BOYS : WHO_LHFA_GIRLS);

  return interpolateLms(table, Math.max(0, ageInMonths));
}

/**
 * Calculates WHO standard z-score using LMS methodology:
 * Z = ((y / M)^L - 1) / (L * S) when L != 0
 * Z = ln(y / M) / S when L == 0
 */
export function calculateZScore(
  value: number,
  ageInMonths: number,
  sex: 'male' | 'female',
  metric: 'wfa' | 'lhfa'
): number {
  if (value <= 0 || isNaN(value)) return 0;
  const { L, M, S } = getLmsCoefficients(ageInMonths, sex, metric);

  let z: number;
  if (Math.abs(L) < 0.0001) {
    z = Math.log(value / M) / S;
  } else {
    z = (Math.pow(value / M, L) - 1) / (L * S);
  }

  return Math.round(z * 100) / 100;
}

/**
 * Derives clinical classification and alert flag based on WHO z-score
 */
export interface ZScoreInterpretation {
  zScore: number;
  category: 'severe_undernutrition' | 'moderate_undernutrition' | 'normal' | 'overweight' | 'severe_overweight';
  label: string;
  isFlagged: boolean; // Flagged if < -2 SD (wasting/stunting risk per MOH216)
  alertSeverity: 'none' | 'warning' | 'urgent';
  color: string;
}

export function interpretZScore(
  zScore: number,
  metric: 'wfa' | 'lhfa' = 'wfa'
): ZScoreInterpretation {
  if (zScore < -3) {
    return {
      zScore,
      category: 'severe_undernutrition',
      label: metric === 'wfa' ? 'Severely Underweight (<-3 SD)' : 'Severely Stunted (<-3 SD)',
      isFlagged: true,
      alertSeverity: 'urgent',
      color: '#dc2626', // Red
    };
  }
  if (zScore < -2) {
    return {
      zScore,
      category: 'moderate_undernutrition',
      label: metric === 'wfa' ? 'Moderately Underweight (<-2 SD)' : 'Moderately Stunted (<-2 SD)',
      isFlagged: true,
      alertSeverity: 'warning',
      color: '#f59e0b', // Amber
    };
  }
  if (zScore <= 2) {
    return {
      zScore,
      category: 'normal',
      label: 'Normal Growth (Median / -2 to +2 SD)',
      isFlagged: false,
      alertSeverity: 'none',
      color: '#10b981', // Green
    };
  }
  if (zScore <= 3) {
    return {
      zScore,
      category: 'overweight',
      label: metric === 'wfa' ? 'Overweight (>+2 SD)' : 'Tall for Age (>+2 SD)',
      isFlagged: false,
      alertSeverity: 'none',
      color: '#3b82f6', // Blue
    };
  }
  return {
    zScore,
    category: 'severe_overweight',
    label: metric === 'wfa' ? 'Very High Weight (>+3 SD)' : 'Very Tall (>+3 SD)',
    isFlagged: true,
    alertSeverity: 'warning',
    color: '#8b5cf6', // Purple
  };
}

/**
 * Returns value at a specific Z score for plotting reference curves:
 * X = M * (1 + L * S * Z)^(1/L)
 */
export function calculateValueForZScore(
  z: number,
  ageInMonths: number,
  sex: 'male' | 'female',
  metric: 'wfa' | 'lhfa'
): number {
  const { L, M, S } = getLmsCoefficients(ageInMonths, sex, metric);
  let val: number;
  if (Math.abs(L) < 0.0001) {
    val = M * Math.exp(S * z);
  } else {
    val = M * Math.pow(1 + L * S * z, 1 / L);
  }
  return Math.round(val * 100) / 100;
}

export interface GrowthCurveBandPoint {
  month: number;
  minus3: number;
  minus2: number;
  median: number;
  plus2: number;
  plus3: number;
}

export function generateGrowthCurveBands(
  sex: 'male' | 'female',
  metric: 'wfa' | 'lhfa',
  maxMonths: number = 24
): GrowthCurveBandPoint[] {
  const points: GrowthCurveBandPoint[] = [];
  for (let m = 0; m <= maxMonths; m += 2) {
    points.push({
      month: m,
      minus3: calculateValueForZScore(-3, m, sex, metric),
      minus2: calculateValueForZScore(-2, m, sex, metric),
      median: calculateValueForZScore(0, m, sex, metric),
      plus2: calculateValueForZScore(2, m, sex, metric),
      plus3: calculateValueForZScore(3, m, sex, metric),
    });
  }
  return points;
}
