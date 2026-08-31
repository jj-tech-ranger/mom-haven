// Single source of truth for MUAC classification across Mother, Clinician and Admin surfaces.
export function classifyMUAC(cm: number) {
  if (cm < 11.5) return { key: 'SAM', label: 'SAM', color: '#C4283C', bg: '#FCE7EA' } as const;
  if (cm < 12.5) return { key: 'MAM', label: 'MAM', color: '#A15E06', bg: '#FBF0DC' } as const;
  if (cm <= 13.5) return { key: 'AT_RISK', label: 'At Risk', color: '#8A5A00', bg: '#F7E6BE' } as const;
  return { key: 'NORMAL', label: 'Normal', color: '#1E8F5F', bg: '#E6F6EE' } as const;
}

export const MUAC_BANDS = [
  { key: 'SAM', label: 'SAM', range: '< 11.5 cm', color: '#C4283C', bg: '#FCE7EA' },
  { key: 'MAM', label: 'MAM', range: '11.5 – 12.4 cm', color: '#A15E06', bg: '#FBF0DC' },
  { key: 'AT_RISK', label: 'At Risk', range: '12.5 – 13.5 cm', color: '#8A5A00', bg: '#F7E6BE' },
  { key: 'NORMAL', label: 'Normal', range: '> 13.5 cm', color: '#1E8F5F', bg: '#E6F6EE' },
] as const;
