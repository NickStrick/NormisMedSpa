import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { isSquareSandbox } from '@/lib/squareEnv';
import { quoteCheckoutRequest } from '@/lib/checkoutConfig';
import type { CheckoutRequest } from '@/lib/checkoutPricing';
import { confirmRentalsPaid, reholdRentals } from '@/lib/rentalCheckout';

type SquarePaymentRequest = {
  sourceId: string;          // card token from the Web Payments SDK (card.tokenize())
  checkout: CheckoutRequest; // cart choices only — the amount is priced server-side
  orderId?: string;          // our order id — stored on the Square payment as reference_id
  buyerEmail?: string;
  verificationToken?: string; // from payments.verifyBuyer(), when SCA is used
};

type SquareError = { category?: string; code?: string; detail?: string; field?: string };

// Square's raw codes are developer-facing; show customers something readable.
function friendlyError(errors: SquareError[] | undefined) {
  const code = errors?.[0]?.code ?? '';
  const map: Record<string, string> = {
    CARD_DECLINED: 'Your card was declined. Please try another card.',
    GENERIC_DECLINE: 'Your card was declined. Please try another card.',
    INSUFFICIENT_FUNDS: 'Your card was declined for insufficient funds.',
    CVV_FAILURE: 'The security code (CVV) is incorrect.',
    ADDRESS_VERIFICATION_FAILURE: 'The postal code does not match your card.',
    INVALID_EXPIRATION: 'The card expiration date is invalid.',
    EXPIRATION_FAILURE: 'The card is expired.',
    INVALID_CARD: 'The card number is invalid.',
    CARD_NOT_SUPPORTED: 'This card type is not supported.',
    TRANSACTION_LIMIT: 'This charge exceeds your card limit.',
    VERIFY_CVV_FAILURE: 'The security code (CVV) is incorrect.',
    VERIFY_AVS_FAILURE: 'The postal code does not match your card.',
  };
  return map[code] ?? errors?.[0]?.detail ?? 'Square payment failed.';
}

export async function POST(req: NextRequest) {
  let body: SquarePaymentRequest | null = null;
  try {
    body = (await req.json()) as SquarePaymentRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body?.sourceId || !body?.checkout) {
    return NextResponse.json({ error: 'Missing required fields: sourceId, checkout.' }, { status: 400 });
  }

  const accessToken = process.env.SQUARE_ACCESS_TOKEN?.trim();
  const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID?.trim();
  if (!accessToken || !locationId) {
    return NextResponse.json(
      { error: 'Server is missing SQUARE_ACCESS_TOKEN or NEXT_PUBLIC_SQUARE_LOCATION_ID.' },
      { status: 500 },
    );
  }

  const { quote, error } = await quoteCheckoutRequest(body.checkout);
  if (error) return error;
  const amount = quote.amountCents;

  // Make sure every rental time in the cart is still ours before charging the card.
  const rentals = await reholdRentals(body.checkout);
  if (rentals.error) return rentals.error;

  const baseUrl = isSquareSandbox() ? 'https://connect.squareupsandbox.com' : 'https://connect.squareup.com';
  // Optional pin; when unset Square uses the API version configured on the app in the Developer Dashboard.
  const apiVersion = process.env.SQUARE_API_VERSION?.trim();

  const payload: Record<string, unknown> = {
    source_id: body.sourceId,
    idempotency_key: crypto.randomUUID(), // new key per attempt; a retry with another card is a new payment
    amount_money: { amount, currency: quote.currency },
    location_id: locationId,
    autocomplete: true,
  };
  if (body.orderId) payload.reference_id = String(body.orderId).slice(0, 40);
  // Square rejects the whole payment on a malformed email, so only pass a plausible one
  // (the checkout field isn't format-validated; the order record keeps the raw value).
  const buyerEmail = String(body.buyerEmail ?? '').trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) payload.buyer_email_address = buyerEmail;
  payload.note = quote.summary.slice(0, 500);
  if (body.verificationToken) payload.verification_token = body.verificationToken;

  const squareRes = await fetch(`${baseUrl}/v2/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(apiVersion ? { 'Square-Version': apiVersion } : {}),
    },
    body: JSON.stringify(payload),
  });

  let data: { payment?: { id?: string; status?: string; receipt_url?: string }; errors?: SquareError[] } | null = null;
  try {
    data = await squareRes.json();
  } catch {
    // ignore non-json
  }

  const failedStatus = data?.payment?.status === 'FAILED' || data?.payment?.status === 'CANCELED';
  if (!squareRes.ok || !data?.payment || failedStatus) {
    console.error('[square] payment failed', squareRes.status, data?.errors);
    return NextResponse.json(
      { error: friendlyError(data?.errors), code: data?.errors?.[0]?.code },
      { status: squareRes.ok ? 502 : squareRes.status },
    );
  }

  await confirmRentalsPaid(rentals.holds, { orderId: body.orderId, paymentId: data.payment.id });

  return NextResponse.json({
    ok: true,
    paymentId: data.payment.id,
    status: data.payment.status,
    receiptUrl: data.payment.receipt_url,
    amountCents: amount,
  });
}
