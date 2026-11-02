import type { GlobalPhone, SiteConfig } from '@/types/site';

// Settings → General → Phone Numbers: one set of numbers the Contact section and
// footer reference by id, so editing a number in Settings updates it everywhere.

/** Hover help shown next to the phone dropdowns in the section editors. */
export const PHONE_NUMBERS_HELP =
  'Pick a universal phone number or "Custom". Add or edit universal numbers in the admin bar: Settings → General → Phone Numbers. Changes there update every section that uses them.';

/** "(630) 448-0108" → "tel:6304480108" (keeps a leading +). */
export function phoneHref(number: string): string {
  const digits = number.trim().replace(/(?!^\+)[^\d]/g, '');
  return digits ? `tel:${digits}` : '';
}

/** Reads settings.general.phoneNumbers defensively — `general` is free-form JSON. */
export function getGlobalPhones(config: SiteConfig | null | undefined): GlobalPhone[] {
  const raw = config?.settings?.general?.phoneNumbers;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (p): p is GlobalPhone =>
      !!p && typeof p === 'object' && typeof (p as GlobalPhone).id === 'string' && typeof (p as GlobalPhone).number === 'string'
  );
}

/** Numbers that are filled in, i.e. the options offered in section dropdowns. */
export function getUsableGlobalPhones(config: SiteConfig | null | undefined): GlobalPhone[] {
  return getGlobalPhones(config).filter((p) => p.number.trim());
}

/** The Settings number an item points at, or null when it's gone/empty (callers hide it). */
export function findGlobalPhone(phoneId: string | undefined, phones: GlobalPhone[]): GlobalPhone | null {
  if (!phoneId) return null;
  const phone = phones.find((p) => p.id === phoneId);
  return phone && phone.number.trim() ? phone : null;
}
