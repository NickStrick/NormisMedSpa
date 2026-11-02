// src/lib/rentalCheckout.ts
// Server-only glue between checkout/payment routes and rental holds.
// Payment routes call `reholdRentals` right before charging (so a hold that
// expired mid-checkout is re-claimed — or the charge is refused if someone else
// took the time) and `confirmRentalsPaid` right after a successful charge.
import { NextResponse } from 'next/server';
import type { SiteConfig } from '@/types/site';
import type { CheckoutRequest } from '@/lib/checkoutPricing';
import { loadLiveSiteConfig } from '@/lib/checkoutConfig';
import { confirmHoldPaid, holdSlotKeys, holdSlots, SlotTakenError } from '@/lib/rentalsDb';
import { RentalBookingError, resolveBooking, type RentalHoldRef } from '@/lib/rentalSlots';

export type ServerRentalHold = { holdId: string; slotKeys: string[] };

/**
 * True when some booking calendar on the site offers this resource with payment turned off.
 * The free-booking route checks this against the live config, so a client can't skip
 * payment for a rental the business only sells through checkout.
 */
export function freeBookingAllowed(config: SiteConfig | null, resourceId: string): boolean {
  const sections = [...(config?.sections ?? []), ...(config?.pages ?? []).flatMap((p) => p.sections ?? [])];
  return sections.some(
    (s) =>
      s.type === 'rentalScheduler' &&
      s.visible !== false &&
      s.requirePayment === false &&
      (!s.resourceIds?.length || s.resourceIds.includes(resourceId))
  );
}

function rentalRefs(checkout: CheckoutRequest | undefined): RentalHoldRef[] {
  return (checkout?.lines ?? []).map((l) => l.rental).filter((r): r is RentalHoldRef => !!r?.holdId);
}

/** Resolve rental lines to slot keys from the config (never trusts client-sent keys). */
export function resolveRentalHolds(config: SiteConfig | null, refs: RentalHoldRef[]) {
  return refs.map((ref) => {
    const { starts } = resolveBooking(config?.rentals, ref);
    return { ref, starts, slotKeys: holdSlotKeys(ref, starts) };
  });
}

/**
 * Re-claim every rental hold in the checkout. Returns the holds to confirm after
 * charging, or a ready-to-return 409 response when a time is no longer available.
 */
export async function reholdRentals(
  checkout: CheckoutRequest | undefined
): Promise<{ holds: ServerRentalHold[]; error?: undefined } | { holds?: undefined; error: NextResponse }> {
  const refs = rentalRefs(checkout);
  if (refs.length === 0) return { holds: [] };

  const businessId = process.env.NEXT_PUBLIC_SITE_ID || '';
  try {
    const config = await loadLiveSiteConfig();
    const resolved = resolveRentalHolds(config, refs);
    for (const r of resolved) await holdSlots(businessId, r.ref, r.starts);
    return { holds: resolved.map((r) => ({ holdId: r.ref.holdId, slotKeys: r.slotKeys })) };
  } catch (err) {
    if (err instanceof SlotTakenError || err instanceof RentalBookingError) {
      return {
        error: NextResponse.json(
          { error: 'A time in your cart is no longer available. Please remove it and pick another time.', code: 'RENTAL_TAKEN' },
          { status: 409 }
        ),
      };
    }
    console.error('[rentals] re-hold before charge failed', err);
    return { error: NextResponse.json({ error: 'Could not confirm your booking time. Please try again.' }, { status: 500 }) };
  }
}

/** After a successful charge: lock the held slots as booked. Never throws (the card is already charged). */
export async function confirmRentalsPaid(holds: ServerRentalHold[], info: { orderId?: string; paymentId?: string }) {
  const businessId = process.env.NEXT_PUBLIC_SITE_ID || '';
  for (const h of holds) {
    try {
      await confirmHoldPaid(businessId, h.holdId, h.slotKeys, info);
    } catch (err) {
      // Only possible if the hold was lost in the seconds between re-hold and charge.
      console.error('[rentals] PAID BUT NOT CONFIRMED — needs manual review', { ...info, holdId: h.holdId, err });
    }
  }
}
