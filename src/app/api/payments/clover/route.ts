import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { quoteCheckoutRequest } from '@/lib/checkoutConfig';
import type { CheckoutRequest } from '@/lib/checkoutPricing';
import { confirmRentalsPaid, reholdRentals } from '@/lib/rentalCheckout';

type CloverChargeRequest = {
  source: string;             // Clover card token
  checkout?: CheckoutRequest; // cart choices — priced server-side (see quoteCheckoutRequest)
  // Old request shape from checkout pages loaded before this deploy (monitor mode only):
  amount?: number;
  currency?: string;
};

export async function POST(req: NextRequest) {
  let body: CloverChargeRequest | null = null;
  try {
    body = (await req.json()) as CloverChargeRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body?.source || (!body?.checkout && body?.amount == null)) {
    return NextResponse.json({ error: 'Missing required fields: source, checkout.' }, { status: 400 });
  }

  const privateToken = process.env.CLOVER_PRIVATE_TOKEN;
  const baseUrl = process.env.CLOVER_API_BASE_URL ?? 'https://scl-sandbox.dev.clover.com';

  if (!privateToken) {
    return NextResponse.json(
      { error: 'Server is missing CLOVER_PRIVATE_TOKEN.' },
      { status: 500 },
    );
  }

  const { quote, error } = await quoteCheckoutRequest(body.checkout, { amountCents: body.amount, currency: body.currency });
  if (error) return error;

  // Make sure every rental time in the cart is still ours before charging the card.
  const rentals = await reholdRentals(body.checkout);
  if (rentals.error) return rentals.error;

  const clientIp =
    req.headers.get('x-forwarded-for') ??
    req.headers.get('x-real-ip') ??
    '127.0.0.1';

  const cloverRes = await fetch(`${baseUrl}/v1/charges`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${privateToken}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': crypto.randomUUID(),
      'x-forwarded-for': clientIp,
    },
    body: JSON.stringify({
      amount: quote.amountCents,
      currency: quote.currency.toLowerCase(),
      source: body.source,
    }),
  });

  let data: unknown = null;
  try {
    data = await cloverRes.json();
  } catch {
    // ignore non-json
  }

  if (!cloverRes.ok) {
    const message =
      typeof data === 'object' && data && 'error' in data
        ? (data as { error?: { message?: string } }).error?.message ?? 'Clover charge failed.'
        : 'Clover charge failed.';
    return NextResponse.json({ error: message, details: data }, { status: cloverRes.status });
  }

  const chargeId = typeof data === 'object' && data && 'id' in data ? String((data as { id?: unknown }).id ?? '') : '';
  await confirmRentalsPaid(rentals.holds, { paymentId: chargeId });

  return NextResponse.json({ ok: true, charge: data, amountCents: quote.amountCents });
}
