import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { loadLiveSiteConfig } from '@/lib/checkoutConfig';
import { holdSlotKeys, holdSlots, releaseHold, SlotTakenError } from '@/lib/rentalsDb';
import {
  bookingPriceCents,
  formatBookingLabel,
  RentalBookingError,
  resolveBooking,
  type RentalBookingRequest,
  type RentalHoldRef,
} from '@/lib/rentalSlots';

export type RentalHoldResponse = {
  hold: RentalHoldRef & { slotKeys: string[] };
  expiresAt: number;
  priceCents: number;
  currency: string;
  resourceName: string;
  label: string;
};

// Customer picked a time: hold its slots for HOLD_MINUTES while they check out.
export async function POST(req: NextRequest) {
  let body: Partial<RentalBookingRequest> | null = null;
  try {
    body = (await req.json()) as Partial<RentalBookingRequest>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const businessId = process.env.NEXT_PUBLIC_SITE_ID || '';
  if (!businessId) return NextResponse.json({ error: 'Site is not configured.' }, { status: 500 });

  const request: RentalBookingRequest = {
    resourceId: String(body?.resourceId ?? ''),
    date: String(body?.date ?? ''),
    start: String(body?.start ?? ''),
    slots: Number(body?.slots),
  };

  const config = await loadLiveSiteConfig();
  let resolved: ReturnType<typeof resolveBooking>;
  try {
    resolved = resolveBooking(config?.rentals, request);
  } catch (err) {
    if (err instanceof RentalBookingError) return NextResponse.json({ error: err.message }, { status: 400 });
    throw err;
  }

  const hold: RentalHoldRef = { ...request, holdId: crypto.randomUUID() };
  try {
    const expiresAt = await holdSlots(businessId, hold, resolved.starts);
    const response: RentalHoldResponse = {
      hold: { ...hold, slotKeys: holdSlotKeys(hold, resolved.starts) },
      expiresAt,
      priceCents: bookingPriceCents(resolved.resource, request.slots),
      currency: resolved.resource.currency || 'USD',
      resourceName: resolved.resource.name,
      label: formatBookingLabel(request.date, request.start, resolved.end),
    };
    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    if (err instanceof SlotTakenError) {
      return NextResponse.json({ error: 'That time was just booked — please pick another.' }, { status: 409 });
    }
    console.error('[rentals] hold failed', err);
    return NextResponse.json({ error: 'Could not reserve that time.' }, { status: 500 });
  }
}

// Customer removed the booking from their cart: free slots still held by this hold.
export async function DELETE(req: NextRequest) {
  let body: { holdId?: string; slotKeys?: unknown } | null = null;
  try {
    body = (await req.json()) as { holdId?: string; slotKeys?: unknown };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const businessId = process.env.NEXT_PUBLIC_SITE_ID || '';
  const holdId = String(body?.holdId ?? '');
  const slotKeys = Array.isArray(body?.slotKeys)
    ? body.slotKeys.filter((k): k is string => typeof k === 'string').slice(0, 100)
    : [];
  if (!businessId || !holdId || slotKeys.length === 0) {
    return NextResponse.json({ error: 'holdId and slotKeys are required.' }, { status: 400 });
  }

  // Only deletes rows still "held" by this exact holdId, so it can't free anyone else's slots.
  await releaseHold(businessId, holdId, slotKeys);
  return NextResponse.json({ ok: true });
}
