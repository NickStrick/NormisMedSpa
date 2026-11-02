// src/lib/checkoutConfig.ts
// Server-only: load the same site config the storefront is displaying, so the
// payment routes price carts against exactly what customers see.
import type { SiteConfig } from '@/types/site';
import { getSiteConfig } from '@/lib/siteConfigLoader';
import { NextResponse } from 'next/server';
import { CheckoutPricingError, PRICE_CHANGED_MESSAGE, quoteCheckout, type CheckoutRequest } from '@/lib/checkoutPricing';

// Same loader as app/layout.tsx, so we price against exactly what the storefront shows.
// Any drift (e.g. config edited mid-checkout) is caught by quoteCheckout's
// expectedTotalCents check — refused in enforce mode, logged in monitor mode.
export async function loadLiveSiteConfig(timeoutMs = 5000): Promise<SiteConfig | null> {
  // Never let a slow config fetch leave a customer stuck on "Processing…".
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => {
      console.warn(`[checkout] site config load timed out after ${timeoutMs}ms`);
      resolve(null);
    }, timeoutMs);
  });
  try {
    return await Promise.race([getSiteConfig(), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/** What a payment route should charge. */
export type ChargeQuote = {
  amountCents: number;   // integer cents
  currency: string;      // uppercase ISO, e.g. "USD"
  summary: string;       // "2x Rose Bouquet, 1x Vase" — for processor notes
  enforced: boolean;     // true when the amount came from server-side pricing in enforce mode
};

/**
 * CHECKOUT_PRICE_ENFORCE=true  -> charge the server-computed total; refuse mismatches/invalid carts (409).
 * unset / anything else        -> MONITOR: price server-side and log any disagreement, but charge
 *                                 what the customer was shown (pre-existing behavior). Safe default
 *                                 for rollout — flip to enforce once the logs show no mismatches.
 */
export function isPriceEnforcementOn() {
  return process.env.CHECKOUT_PRICE_ENFORCE?.trim().toLowerCase() === 'true';
}

function pricingError(message: string, status = 409) {
  return NextResponse.json({ error: message, code: 'PRICING' }, { status });
}

/**
 * Decide the amount to charge for a checkout.
 * `legacy` is the amount/currency sent by checkout pages loaded before this deploy
 * (old request shape) — honored only in monitor mode.
 */
export async function quoteCheckoutRequest(
  checkout: CheckoutRequest | undefined,
  legacy?: { amountCents?: number; currency?: string },
): Promise<{ quote: ChargeQuote; error?: undefined } | { quote?: undefined; error: NextResponse }> {
  const enforce = isPriceEnforcementOn();
  const clientAmount =
    typeof checkout?.expectedTotalCents === 'number' ? checkout.expectedTotalCents : legacy?.amountCents;
  const clientCents = Number.isFinite(clientAmount) ? Math.round(clientAmount as number) : NaN;
  // Monitor mode charges in the currency the customer saw, exactly like before.
  const clientCurrency = (checkout?.currency || legacy?.currency || '').trim();

  // Monitor-mode fallback: charge what the customer saw (pre-existing behavior).
  const chargeClientAmount = (
    reason: string,
    extra?: { currency?: string; summary?: string },
  ): { quote: ChargeQuote; error?: undefined } | { quote?: undefined; error: NextResponse } => {
    console.warn(`[checkout:monitor] ${reason} — charging client total ${clientCents}`);
    if (!Number.isFinite(clientCents) || clientCents <= 0) {
      return { error: pricingError('Order total must be greater than zero.', 400) };
    }
    return {
      quote: {
        amountCents: clientCents,
        currency: (clientCurrency || extra?.currency || 'USD').toUpperCase(),
        summary: extra?.summary || 'Online order',
        enforced: false,
      },
    };
  };

  if (!checkout?.lines) {
    // Old request shape from a page loaded before deploy.
    if (enforce) return { error: pricingError(PRICE_CHANGED_MESSAGE) };
    return chargeClientAmount('legacy request without cart lines');
  }

  let config: SiteConfig | null = null;
  try {
    config = await loadLiveSiteConfig();
  } catch (e) {
    console.error('[checkout] failed to load site config', e);
  }
  if (!config) {
    if (enforce) {
      return { error: NextResponse.json({ error: 'Checkout is temporarily unavailable. Please try again shortly.' }, { status: 503 }) };
    }
    return chargeClientAmount('site config unavailable');
  }

  let q: ReturnType<typeof quoteCheckout>;
  try {
    q = quoteCheckout(config, checkout);
  } catch (e) {
    const known = e instanceof CheckoutPricingError;
    if (enforce) {
      if (known) return { error: pricingError(e.message) };
      throw e;
    }
    // Monitor mode must never block a sale — even on an unexpected error.
    const msg = e instanceof Error ? e.message : String(e);
    return chargeClientAmount(`pricing ${known ? 'rejected cart' : 'crashed'}: ${msg} ${JSON.stringify(checkout.lines)}`);
  }

  const summary = q.lines.map((l) => `${l.quantity}x ${l.name}`).join(', ');
  if (!q.matchesExpected) {
    if (enforce) return { error: pricingError(PRICE_CHANGED_MESSAGE) };
    return chargeClientAmount(
      `total mismatch: server ${q.chargeCents} vs client ${clientCents} ${JSON.stringify({ lines: checkout.lines, totals: q.totals })}`,
      { currency: q.currency, summary },
    );
  }
  if (q.chargeCents <= 0) return { error: pricingError('Order total must be greater than zero.', 400) };

  return {
    quote: {
      amountCents: q.chargeCents, // equals the customer's total here (checked above)
      currency: enforce ? q.currency : (clientCurrency || q.currency).toUpperCase(),
      summary,
      enforced: enforce,
    },
  };
}
