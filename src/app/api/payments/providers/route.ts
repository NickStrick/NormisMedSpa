import { NextResponse } from 'next/server';
import { getPaymentProviderAvailability } from '@/lib/paymentProviders';

// Read env at request time, not build time.
export const dynamic = 'force-dynamic';

// Only booleans + missing env var *names* — safe to expose to the admin UI.
export async function GET() {
  return NextResponse.json(getPaymentProviderAvailability());
}
