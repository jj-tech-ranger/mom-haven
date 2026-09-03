import type { calculateChildAge as calculateChildAgeFn } from './childService';

declare module './childService' {
  export function calculateChildAge(dobString: string, asOf?: Date): ReturnType<typeof calculateChildAgeFn>;
}
