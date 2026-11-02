import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { loadLiveSiteConfig } from '@/lib/checkoutConfig';
import { freeBookingAllowed } from '@/lib/rentalCheckout';
import { createOrder } from '@/lib/ordersDb';
import {
  attachOrderToHold,
  confirmHoldPaid,
  holdSlotKeys,
  holdSlots,
  releaseBooking,
  SlotTakenError,
} from '@/lib/rentalsDb';
import {
  formatBookingLabel,
  FREE_PAYMENT_ID,
  RentalBookingError,
  resolveBooking,
  type RentalBookingRequest,
  type RentalHoldRef,
} from '@/lib/rentalSlots';

type FreeBookingBody = Partial<RentalBookingRequest> & {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
};

// Book a rental without payment — only for resources offered by a booking calendar
// with "Require payment" turned off. Locks the slots as booked and saves an order.
export async function POST(req: NextRequest) {
  let body: FreeBookingBody | null = null;
  try {
    body = (await req.json()) as FreeBookingBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const businessId = process.env.NEXT_PUBLIC_SITE_ID || '';
  if (!businessId) return NextResponse.json({ error: 'Site is not configured.' }, { status: 500 });

  const customerName = String(body?.customerName ?? '').trim().slice(0, 200);
  const customerEmail = String(body?.customerEmail ?? '').trim().slice(0, 200);
  const customerPhone = String(body?.customerPhone ?? '').trim().slice(0, 50);
  if (!customerName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    return NextResponse.json({ error: 'Please enter your name and a valid email.' }, { status: 400 });
  }

  const request: RentalBookingRequest = {
    resourceId: String(body?.resourceId ?? ''),
    date: String(body?.date ?? ''),
    start: String(body?.start ?? ''),
    slots: Number(body?.slots),
  };

  const config = await loadLiveSiteConfig();
  if (!freeBookingAllowed(config, request.resourceId)) {
    return NextResponse.json({ error: 'This rental must be paid for online.' }, { status: 403 });
  }

  let resolved: ReturnType<typeof resolveBooking>;
  try {
    resolved = resolveBooking(config?.rentals, request);
  } catch (err) {
    if (err instanceof RentalBookingError) return NextResponse.json({ error: err.message }, { status: 400 });
    throw err;
  }

  const hold: RentalHoldRef = { ...request, holdId: crypto.randomUUID() };
  const slotKeys = holdSlotKeys(hold, resolved.starts);
  const label = formatBookingLabel(request.date, request.start, resolved.end);

  try {
    await holdSlots(businessId, hold, resolved.starts);
    await confirmHoldPaid(businessId, hold.holdId, slotKeys, { paymentId: FREE_PAYMENT_ID });
  } catch (err) {
    if (err instanceof SlotTakenError) {
      return NextResponse.json({ error: 'That time was just booked — please pick another.' }, { status: 409 });
    }
    console.error('[rentals] free booking failed', err);
    return NextResponse.json({ error: 'Could not book that time.' }, { status: 500 });
  }

  const general = (config?.settings?.general ?? {}) as Record<string, unknown>;
  const currency = resolved.resource.currency || 'USD';
  try {
    // Same shape as checkout orders, so it shows in Admin → Orders and triggers the confirmation email.
    const order = await createOrder({
      businessId,
      customerEmail,
      customerName,
      status: 'BOOKED',
      total: 0,
      currency,
      items: [
        {
          id: `rental::${hold.holdId}`,
          name: resolved.resource.name,
          quantity: 1,
          price: 0,
          total: 0,
          classTimeLabel: label,
          rental: { ...hold, slotKeys },
        },
      ],
      customer: { name: customerName, email: customerEmail, phone: customerPhone || undefined },
      payment: { type: 'none' },
      businessDisplayName: typeof general.businessDisplayName === 'string' ? general.businessDisplayName : undefined,
      businessNotificationEmail:
        typeof general.businessNotificationEmail === 'string' ? general.businessNotificationEmail : undefined,
    });
    await attachOrderToHold(businessId, hold.holdId, slotKeys, { orderId: order.orderId, customerName, customerEmail });
    return NextResponse.json({ ok: true, orderId: order.orderId, label, resourceName: resolved.resource.name }, { status: 201 });
  } catch (err) {
    console.error('[rentals] free booking order failed — releasing slots', err);
    await releaseBooking(businessId, hold.holdId, slotKeys).catch(() => {});
    return NextResponse.json({ error: 'Could not save your booking. Please try again.' }, { status: 500 });
  }
}
