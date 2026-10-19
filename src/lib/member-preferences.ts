import { z } from 'zod';
export const accessibilitySchema = z.object({ reduce_motion: z.boolean(), large_text: z.boolean() });
export function readPreferences(value: unknown) {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return { email_notifications: raw.email_notifications === true, accessibility: accessibilitySchema.catch({ reduce_motion: false, large_text: false }).parse(raw.accessibility) };
}

