// src/lib/rentalSlots.ts
// Rental slot math shared by the booking calendar (what customers see) and the
// rental/payment routes (what gets held and charged), so both agree on which
// slots exist, which are bookable, and what a booking costs.
// Slot times are wall-clock times in the business's timezone (rentals.timezone).
import type { RentalResource, SiteRentalsConfig } from '@/types/site';

export const RENTAL_DEFAULTS = {
  timezone: 'America/Chicago',
  bookingWindowDays: 28,
  leadTimeMinutes: 60,
  minSlots: 1,
  maxSlots: 8,
};

/** What the browser asks for: a start slot and how many consecutive slots. */
export type RentalBookingRequest = {
  resourceId: string;
  date: string;   // "2026-12-06" (business-local)
  start: string;  // "16:00" (business-local)
  slots: number;  // consecutive slots, each resource.slotMinutes long
};

/** A held booking, as carried in the cart and checkout request. */
export type RentalHoldRef = RentalBookingRequest & { holdId: string };

export class RentalBookingError extends Error {}

/** paymentId recorded on bookings made with "Require payment" turned off. */
export const FREE_PAYMENT_ID = 'free';

// ─── Time helpers ─────────────────────────────────────────────────────────────

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

export function fromMinutes(total: number): string {
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** Calendar math on ISO dates — done in UTC so it never shifts across DST. */
export function addDays(dateISO: string, days: number): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function weekdayOf(dateISO: string): number {
  const [y, m, d] = dateISO.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function safeTimezone(tz: string | undefined): string {
  const zone = tz || RENTAL_DEFAULTS.timezone;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
    return zone;
  } catch {
    return RENTAL_DEFAULTS.timezone;
  }
}

/** Wall-clock parts of an instant in `tz`. */
function zonedParts(epochMs: number, tz: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(epochMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { y: get('year'), mo: get('month'), d: get('day'), h: get('hour'), mi: get('minute'), s: get('second') };
}

function tzOffsetMs(epochMs: number, tz: string): number {
  const p = zonedParts(epochMs, tz);
  return Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s) - Math.floor(epochMs / 1000) * 1000;
}

/** Epoch ms for a business-local date + "HH:MM" (correct across DST changes). */
export function localToEpochMs(dateISO: string, hhmm: string, tz: string): number {
  const [y, m, d] = dateISO.split('-').map(Number);
  const mins = toMinutes(hhmm);
  const guess = Date.UTC(y, m - 1, d, Math.floor(mins / 60), mins % 60);
  const off1 = tzOffsetMs(guess, tz);
  const t = guess - off1;
  const off2 = tzOffsetMs(t, tz);
  return off2 === off1 ? t : guess - off2;
}

/** Today's business-local ISO date. */
export function businessToday(rentals: SiteRentalsConfig | undefined, nowMs = Date.now()): string {
  const p = zonedParts(nowMs, safeTimezone(rentals?.timezone));
  return `${p.y}-${String(p.mo).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
}

// ─── Slots ────────────────────────────────────────────────────────────────────

// A booking's slots are written in one DynamoDB transaction (100-item limit).
const MAX_SLOTS_PER_BOOKING = 48;

export function resourceLimits(resource: RentalResource) {
  const minSlots = Math.min(MAX_SLOTS_PER_BOOKING, Math.max(1, resource.minSlots ?? RENTAL_DEFAULTS.minSlots));
  const maxSlots = Math.min(MAX_SLOTS_PER_BOOKING, Math.max(minSlots, resource.maxSlots ?? RENTAL_DEFAULTS.maxSlots));
  return { minSlots, maxSlots };
}

/** Every slot start ("HH:MM") the resource offers on `dateISO`, ignoring bookings and the clock. */
export function daySlotStarts(resource: RentalResource, dateISO: string): string[] {
  if (resource.blackoutDates?.includes(dateISO)) return [];
  const hours = resource.weeklyHours?.[weekdayOf(dateISO)];
  const step = Math.max(5, Math.round(resource.slotMinutes || 30));
  if (!hours?.open || !hours?.close) return [];
  const open = toMinutes(hours.open);
  const close = toMinutes(hours.close);
  const starts: string[] = [];
  for (let t = open; t + step <= close; t += step) starts.push(fromMinutes(t));
  return starts;
}

/** Whether a slot start is inside the booking window and far enough in the future. */
export function isStartBookable(
  rentals: SiteRentalsConfig | undefined,
  dateISO: string,
  start: string,
  nowMs = Date.now(),
): boolean {
  const tz = safeTimezone(rentals?.timezone);
  const today = businessToday(rentals, nowMs);
  const windowDays = rentals?.bookingWindowDays ?? RENTAL_DEFAULTS.bookingWindowDays;
  if (dateISO < today || dateISO > addDays(today, windowDays)) return false;
  const leadMs = (rentals?.leadTimeMinutes ?? RENTAL_DEFAULTS.leadTimeMinutes) * 60_000;
  return localToEpochMs(dateISO, start, tz) >= nowMs + leadMs;
}

export function findResource(rentals: SiteRentalsConfig | undefined, resourceId: string) {
  return (rentals?.resources ?? []).find((r) => r.id === resourceId && !r.hidden);
}

/**
 * Validates a booking against the config and returns the slot starts it covers.
 * Throws RentalBookingError with a customer-facing message when invalid.
 * (Whether the slots are already taken is checked separately, in the database.)
 */
export function resolveBooking(
  rentals: SiteRentalsConfig | undefined,
  req: RentalBookingRequest,
  nowMs = Date.now(),
): { resource: RentalResource; starts: string[]; end: string } {
  const resource = findResource(rentals, req.resourceId);
  if (!resource) throw new RentalBookingError('That rental is no longer available.');

  const slots = Number(req.slots);
  const { minSlots, maxSlots } = resourceLimits(resource);
  if (!Number.isInteger(slots) || slots < minSlots || slots > maxSlots) {
    throw new RentalBookingError(`Bookings for ${resource.name} must be ${minSlots}–${maxSlots} slots long.`);
  }

  const dayStarts = daySlotStarts(resource, req.date);
  const first = dayStarts.indexOf(req.start);
  const starts = first >= 0 ? dayStarts.slice(first, first + slots) : [];
  // Consecutive within the day's open hours (indexOf + slice also rules out gaps)
  if (starts.length !== slots) throw new RentalBookingError('That time is outside open hours.');
  if (!isStartBookable(rentals, req.date, req.start, nowMs)) {
    throw new RentalBookingError('That time can no longer be booked online.');
  }

  const end = fromMinutes(toMinutes(starts[starts.length - 1]) + resource.slotMinutes);
  return { resource, starts, end };
}

export function bookingPriceCents(resource: RentalResource, slots: number): number {
  return Math.round((resource.pricePerHour * resource.slotMinutes * slots) / 60);
}

/** DynamoDB sort key for one slot; sorts by resource, then date, then time. */
export function slotKey(resourceId: string, dateISO: string, start: string): string {
  return `${resourceId}#${dateISO}#${start}`;
}

// ─── Labels ───────────────────────────────────────────────────────────────────

export function formatTime12(hhmm: string): string {
  const mins = toMinutes(hhmm);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h >= 12 && h < 24 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatDateLabel(dateISO: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' }): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' });
}

/** e.g. "Sat, Dec 6 · 4:00 PM – 5:30 PM" */
export function formatBookingLabel(dateISO: string, start: string, end: string): string {
  return `${formatDateLabel(dateISO)} · ${formatTime12(start)} – ${formatTime12(end)}`;
}
