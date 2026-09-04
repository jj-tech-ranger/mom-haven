// src/data/whoGrowthStandards.ts
// Official WHO Child Growth Standards (0 to 60 months)
// Source: World Health Organization (WHO) Child Growth Standards (Weight-for-age, Length/Height-for-age)
// Corresponds directly to Kenya Ministry of Health Mother-Child Health Handbook (MOH 216) pp. 28–35

export interface WhoZScorePoint {
  month: number;
  sd3neg: number; // -3 SD line (Severe acute malnutrition / Severe stunting / Needs urgent intervention)
  sd2neg: number; // -2 SD line (Moderate underweight / Stunting / Intervention)
  sd0: number;    // Median (0 SD / Reference average)
  sd2pos: number; // +2 SD line (Above average / Overweight threshold)
  sd3pos: number; // +3 SD line (Very high / Obese threshold)
}

export type ZScoreBand = 'SEVERELY_LOW' | 'MODERATELY_LOW' | 'NORMAL' | 'ABOVE_NORMAL' | 'VERY_HIGH';

export interface ZScoreInterpretation {
  band: ZScoreBand;
  label: string;
  color: string; // Tailwind class
  hexColor: string;
  badgeBg: string;
  badgeText: string;
  statusText: string;
  isInterventionNeeded: boolean;
}

// Key WHO reference data points for boys weight-for-age (kg)
const WHO_BOYS_WEIGHT_KEYPOINTS: Record<number, [number, number, number, number, number]> = {
  0:  [2.1, 2.5, 3.3, 4.4, 5.0],
  1:  [2.9, 3.4, 4.5, 5.8, 6.6],
  2:  [3.8, 4.3, 5.6, 7.1, 8.0],
  3:  [4.4, 5.0, 6.4, 8.0, 9.0],
  4:  [4.9, 5.6, 7.0, 8.7, 9.7],
  5:  [5.3, 6.0, 7.5, 9.3, 10.4],
  6:  [5.7, 6.4, 7.9, 9.8, 10.9],
  7:  [5.9, 6.7, 8.3, 10.3, 11.4],
  8:  [6.2, 6.9, 8.6, 10.7, 11.9],
  9:  [6.4, 7.1, 8.9, 11.0, 12.3],
  10: [6.6, 7.4, 9.2, 11.4, 12.7],
  11: [6.8, 7.6, 9.4, 11.7, 13.0],
  12: [6.9, 7.7, 9.6, 12.0, 13.3],
  15: [7.4, 8.3, 10.3, 12.8, 14.3],
  18: [7.9, 8.8, 10.9, 13.7, 15.3],
  21: [8.3, 9.2, 11.5, 14.5, 16.2],
  24: [8.6, 9.7, 12.2, 15.3, 17.1],
  27: [9.1, 10.2, 12.7, 16.1, 18.0],
  30: [9.4, 10.6, 13.3, 16.9, 18.9],
  33: [9.8, 11.1, 13.8, 17.6, 19.8],
  36: [10.1, 11.5, 14.3, 18.3, 20.7],
  42: [10.8, 12.3, 15.4, 19.7, 22.4],
  48: [11.4, 13.0, 16.3, 21.2, 24.2],
  54: [12.1, 13.8, 17.3, 22.7, 26.2],
  60: [12.7, 14.5, 18.3, 24.2, 27.9],
};

// Key WHO reference data points for girls weight-for-age (kg)
const WHO_GIRLS_WEIGHT_KEYPOINTS: Record<number, [number, number, number, number, number]> = {
  0:  [2.0, 2.4, 3.2, 4.2, 4.8],
  1:  [2.7, 3.2, 4.2, 5.5, 6.2],
  2:  [3.4, 3.9, 5.1, 6.6, 7.5],
  3:  [4.0, 4.5, 5.8, 7.5, 8.5],
  4:  [4.4, 5.0, 6.4, 8.2, 9.3],
  5:  [4.8, 5.4, 6.9, 8.8, 10.0],
  6:  [5.1, 5.7, 7.3, 9.3, 10.6],
  7:  [5.3, 6.0, 7.6, 9.8, 11.1],
  8:  [5.6, 6.3, 7.9, 10.2, 11.6],
  9:  [5.8, 6.5, 8.2, 10.5, 12.0],
  10: [5.9, 6.7, 8.5, 10.9, 12.4],
  11: [6.1, 6.9, 8.7, 11.2, 12.8],
  12: [6.3, 7.0, 8.9, 11.5, 13.2],
  15: [6.7, 7.6, 9.6, 12.4, 14.2],
  18: [7.2, 8.1, 10.2, 13.2, 15.3],
  21: [7.6, 8.6, 10.9, 14.0, 16.2],
  24: [8.1, 9.0, 11.5, 14.8, 17.3],
  27: [8.5, 9.5, 12.1, 15.7, 18.3],
  30: [8.9, 9.9, 12.7, 16.5, 19.3],
  33: [9.3, 10.4, 13.3, 17.3, 20.3],
  36: [9.6, 10.8, 13.9, 18.1, 21.2],
  42: [10.3, 11.6, 15.0, 19.6, 23.1],
  48: [10.9, 12.4, 16.1, 21.2, 25.0],
  54: [11.5, 13.2, 17.2, 22.8, 27.2],
  60: [12.1, 13.9, 18.2, 24.4, 29.5],
};

// Key WHO reference data points for boys length/height-for-age (cm)
const WHO_BOYS_HEIGHT_KEYPOINTS: Record<number, [number, number, number, number, number]> = {
  0:  [44.2, 46.1, 49.9, 53.7, 55.6],
  1:  [48.9, 50.8, 54.7, 58.6, 60.6],
  2:  [52.4, 54.4, 58.4, 62.4, 64.4],
  3:  [55.3, 57.3, 61.4, 65.5, 67.6],
  4:  [57.6, 59.7, 63.9, 68.0, 70.1],
  5:  [59.6, 61.7, 65.9, 70.1, 72.2],
  6:  [61.2, 63.3, 67.6, 71.9, 74.0],
  7:  [62.7, 64.8, 69.2, 73.5, 75.7],
  8:  [64.0, 66.2, 70.6, 75.0, 77.2],
  9:  [65.2, 67.5, 72.0, 76.5, 78.7],
  10: [66.4, 68.7, 73.3, 77.9, 80.1],
  11: [67.6, 69.9, 74.5, 79.2, 81.5],
  12: [68.6, 71.0, 75.7, 80.5, 82.9],
  15: [71.6, 74.1, 79.1, 84.1, 86.7],
  18: [74.2, 76.9, 82.3, 87.7, 90.4],
  21: [76.5, 79.4, 85.1, 90.9, 93.8],
  24: [78.7, 81.7, 87.8, 93.9, 97.0],
  27: [80.7, 83.8, 90.2, 96.6, 99.8],
  30: [82.5, 85.8, 92.4, 99.1, 102.4],
  33: [84.3, 87.7, 94.4, 101.4, 104.9],
  36: [86.0, 89.4, 96.1, 102.7, 106.1],
  42: [89.4, 93.0, 100.0, 107.0, 110.6],
  48: [92.5, 96.1, 103.3, 110.7, 114.4],
  54: [95.6, 99.4, 106.8, 114.4, 118.3],
  60: [98.7, 102.5, 110.0, 117.9, 121.9],
};

// Key WHO reference data points for girls length/height-for-age (cm)
const WHO_GIRLS_HEIGHT_KEYPOINTS: Record<number, [number, number, number, number, number]> = {
  0:  [43.6, 45.4, 49.1, 52.9, 54.7],
  1:  [47.8, 49.8, 53.7, 57.6, 59.5],
  2:  [51.0, 53.0, 57.1, 61.1, 63.2],
  3:  [53.8, 55.8, 59.8, 63.8, 65.9],
  4:  [56.2, 58.3, 62.4, 66.5, 68.6],
  5:  [58.2, 60.3, 64.5, 68.7, 70.8],
  6:  [59.5, 61.5, 65.7, 69.9, 71.9],
  7:  [60.9, 62.9, 67.3, 71.6, 73.7],
  8:  [62.2, 64.3, 68.7, 73.2, 75.3],
  9:  [63.5, 65.6, 70.1, 74.6, 76.8],
  10: [64.7, 66.8, 71.5, 76.1, 78.3],
  11: [65.9, 68.1, 72.8, 77.5, 79.7],
  12: [67.0, 69.3, 74.0, 78.7, 81.0],
  15: [70.0, 72.4, 77.5, 82.5, 85.0],
  18: [72.8, 75.3, 80.7, 86.1, 88.8],
  21: [75.2, 77.9, 83.7, 89.4, 92.3],
  24: [77.5, 80.3, 86.4, 92.5, 95.5],
  27: [79.6, 82.5, 89.0, 95.4, 98.6],
  30: [81.5, 84.6, 91.3, 98.0, 101.3],
  33: [83.4, 86.5, 93.3, 100.3, 103.8],
  36: [85.1, 88.2, 95.1, 101.9, 105.3],
  42: [88.5, 91.9, 99.0, 106.2, 109.9],
  48: [91.9, 95.3, 102.7, 110.0, 113.7],
  54: [95.2, 98.8, 106.2, 113.8, 117.6],
  60: [98.4, 102.1, 109.4, 117.3, 121.2],
};

function interpolateKeypoints(
  keypoints: Record<number, [number, number, number, number, number]>,
  targetMonth: number
): [number, number, number, number, number] {
  const months = Object.keys(keypoints).map(Number).sort((a, b) => a - b);
  if (keypoints[targetMonth]) return keypoints[targetMonth];

  if (targetMonth <= months[0]) return keypoints[months[0]];
  if (targetMonth >= months[months.length - 1]) return keypoints[months[months.length - 1]];

  // Find surrounding months
  let lowMonth = months[0];
  let highMonth = months[months.length - 1];
  for (let i = 0; i < months.length - 1; i++) {
    if (targetMonth >= months[i] && targetMonth <= months[i + 1]) {
      lowMonth = months[i];
      highMonth = months[i + 1];
      break;
    }
  }

  const fraction = (targetMonth - lowMonth) / (highMonth - lowMonth);
  const lowVals = keypoints[lowMonth];
  const highVals = keypoints[highMonth];

  return [
    +(lowVals[0] + fraction * (highVals[0] - lowVals[0])).toFixed(2),
    +(lowVals[1] + fraction * (highVals[1] - lowVals[1])).toFixed(2),
    +(lowVals[2] + fraction * (highVals[2] - lowVals[2])).toFixed(2),
    +(lowVals[3] + fraction * (highVals[3] - lowVals[3])).toFixed(2),
    +(lowVals[4] + fraction * (highVals[4] - lowVals[4])).toFixed(2),
  ];
}

// Generate complete 0 to 60 month arrays
export function getWhoWeightTable(sex: 'male' | 'female'): WhoZScorePoint[] {
  const keypoints = sex === 'male' ? WHO_BOYS_WEIGHT_KEYPOINTS : WHO_GIRLS_WEIGHT_KEYPOINTS;
  const result: WhoZScorePoint[] = [];
  for (let m = 0; m <= 60; m++) {
    const vals = interpolateKeypoints(keypoints, m);
    result.push({
      month: m,
      sd3neg: vals[0],
      sd2neg: vals[1],
      sd0: vals[2],
      sd2pos: vals[3],
      sd3pos: vals[4],
    });
  }
  return result;
}

export function getWhoHeightTable(sex: 'male' | 'female'): WhoZScorePoint[] {
  const keypoints = sex === 'male' ? WHO_BOYS_HEIGHT_KEYPOINTS : WHO_GIRLS_HEIGHT_KEYPOINTS;
  const result: WhoZScorePoint[] = [];
  for (let m = 0; m <= 60; m++) {
    const vals = interpolateKeypoints(keypoints, m);
    result.push({
      month: m,
      sd3neg: vals[0],
      sd2neg: vals[1],
      sd0: vals[2],
      sd2pos: vals[3],
      sd3pos: vals[4],
    });
  }
  return result;
}

export function generateWhoSeries(
  sex: 'male' | 'female',
  metric: 'weight' | 'height',
  maxMonth: number = 60
): WhoZScorePoint[] {
  const full = metric === 'weight' ? getWhoWeightTable(sex) : getWhoHeightTable(sex);
  return full.filter(p => p.month <= maxMonth);
}

export function interpolateWhoStandard(
  series: WhoZScorePoint[],
  ageMonths: number
): WhoZScorePoint {
  const rounded = Math.round(ageMonths);
  const found = series.find(p => p.month === rounded);
  if (found) return found;
  if (series.length === 0) {
    return { month: ageMonths, sd3neg: 2, sd2neg: 2.5, sd0: 3.3, sd2pos: 4.2, sd3pos: 4.8 };
  }
  return series[Math.min(Math.max(0, rounded), series.length - 1)];
}

export function interpretZScore(
  val: number,
  standards: WhoZScorePoint
): ZScoreInterpretation {
  if (val < standards.sd3neg) {
    return {
      band: 'SEVERELY_LOW',
      label: 'Below -3 SD (Severe)',
      color: 'text-red-700',
      hexColor: '#dc2626',
      badgeBg: 'bg-red-100',
      badgeText: 'text-red-800',
      statusText: 'Severe acute malnutrition / Severe stunting. Needs immediate clinical intervention.',
      isInterventionNeeded: true,
    };
  }
  if (val < standards.sd2neg) {
    return {
      band: 'MODERATELY_LOW',
      label: '-2 to -3 SD (Moderate)',
      color: 'text-amber-700',
      hexColor: '#d97706',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-800',
      statusText: 'Moderate underweight / Stunting risk. Requires supplementary feeding and growth review.',
      isInterventionNeeded: true,
    };
  }
  if (val <= standards.sd2pos) {
    return {
      band: 'NORMAL',
      label: 'Normal Range (-2 to +2 SD)',
      color: 'text-emerald-700',
      hexColor: '#059669',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-800',
      statusText: 'Good growth trajectory. Child is growing well along expected standard curve.',
      isInterventionNeeded: false,
    };
  }
  if (val <= standards.sd3pos) {
    return {
      band: 'ABOVE_NORMAL',
      label: '+2 to +3 SD (High)',
      color: 'text-purple-700',
      hexColor: '#7c3aed',
      badgeBg: 'bg-purple-100',
      badgeText: 'text-purple-800',
      statusText: 'Above average growth curve. Monitor for healthy complementary diet balance.',
      isInterventionNeeded: false,
    };
  }
  return {
    band: 'VERY_HIGH',
    label: 'Above +3 SD (Very High)',
    color: 'text-purple-900',
    hexColor: '#581c87',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-900',
    statusText: 'High growth curve (overweight risk). Pediatric dietary evaluation suggested.',
    isInterventionNeeded: true,
  };
}
