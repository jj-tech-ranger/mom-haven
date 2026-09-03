import type { createReminder as createReminderFn } from './reminderService';

declare module './reminderService' {
  export function createReminder(
    input: Omit<Parameters<typeof createReminderFn>[0], 'category'> & { category: string },
  ): ReturnType<typeof createReminderFn>;
}
