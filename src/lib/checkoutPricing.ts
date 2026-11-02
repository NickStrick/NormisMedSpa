// src/lib/checkoutPricing.ts
// Checkout math shared by the browser (what the customer sees) and the payment
// routes (what actually gets charged). The server never trusts a client price:
// it re-prices every line from the site config with `priceCart`, then totals
// with the same `computeCheckoutTotals` the checkout UI uses.
import type { PaymentsSettings, SiteConfig } from '@/types/site';
import { normalizeClassItems } from '@/lib/siteConfigSections';
import { effectivePriceForSelection, normalizeOptionGroups, type NormOptionGroup } from '@/lib/productOptions';
import { bookingPriceCents, RentalBookingError, resolveBooking, type RentalHoldRef } from '@/lib/rentalSlots';

/** What the browser sends: only the customer's choices, never prices. */
export type CheckoutLineRequest = {
  id: string;                       // cart line id: "<productId>::opts" or "<classId>::t=<timeId>::opts"
  quantity: number;
  options?: Record<string, string>; // group label -> chosen item value/label
  classItemId?: string;
  classTimeId?: string;
  rental?: RentalHoldRef;           // rental booking: priced from config.rentals, always quantity 1
};

export type CheckoutRequest = {
  lines: CheckoutLineRequest[];
  fulfillment?: 'pickup' | 'delivery';
  tipCents?: number;
  promoCode?: string;
  expectedTotalCents?: number;      // the total the customer was shown
  currency?: string;                // the cart currency the customer was shown
};

/** A line with its unit price + taxability (from config on the server, from the cart in the browser). */
export type PricedLine = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;                // cents
  taxable?: boolean;
  currency?: string;
};

export type CheckoutTotals = {
  subtotalCents: number;
  taxCents: number;
  deliveryFeeCents: number;
  tipCents: number;
  discountCents: number;
  totalCents: number;
};

export class CheckoutPricingError extends Error {}

// Sanity bound only (the storefront itself never capped quantities).
const MAX_LINE_QTY = 10000;

/** Same arithmetic the checkout has always used — single source of truth for UI and server. */
export function computeCheckoutTotals(
  lines: PricedLine[],
  payments: PaymentsSettings | undefined,
  opts: { fulfillment?: 'pickup' | 'delivery'; tipCents?: number; promoCode?: string },
): CheckoutTotals {
  const taxes = payments?.taxes;
  const delivery = payments?.delivery;
  const deliveryMode = delivery?.mode ?? 'both';
  const fulfillment =
    deliveryMode === 'pickup' ? 'pickup' : deliveryMode === 'delivery' ? 'delivery' : opts.fulfillment ?? 'pickup';

  const subtotalCents = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const taxableSubtotalCents = lines.reduce((sum, l) => {
    const taxable = typeof l.taxable === 'boolean' ? l.taxable : taxes?.defaultProductTaxable === true;
    return taxable ? sum + l.unitPrice * l.quantity : sum;
  }, 0);

  const deliveryFeeCents =
    delivery?.enabled && deliveryMode !== 'pickup' && fulfillment === 'delivery' && delivery?.type === 'flat'
      ? Math.max(0, Number(delivery.flatFeeCents ?? 0))
      : 0;

  const tipAllowed = delivery?.driverTipEnabled === true && fulfillment === 'delivery';
  const tipCents = tipAllowed ? Math.max(0, Math.round(Number(opts.tipCents) || 0)) : 0;

  const taxRate = Math.max(0, Number(taxes?.ratePercent ?? 0));
  const taxBaseCents = taxableSubtotalCents + (taxes?.taxShipping ? deliveryFeeCents : 0);
  const taxCents = taxes?.enabled ? Math.round(taxBaseCents * (taxRate / 100)) : 0;

  const code = (opts.promoCode ?? '').trim().toLowerCase();
  const promo = code ? (payments?.promoCodes ?? []).find((p) => p.promoId.toLowerCase() === code) : undefined;
  const discountCents = promo
    ? promo.type === 'percentage'
      ? Math.round(subtotalCents * (promo.value / 100))
      : Math.min(Math.round(promo.value * 100), subtotalCents)
    : 0;

  const totalCents = subtotalCents + taxCents + deliveryFeeCents + tipCents - discountCents;
  return { subtotalCents, taxCents, deliveryFeeCents, tipCents, discountCents, totalCents };
}

// Rejects option values that don't exist — otherwise effectivePriceForSelection would
// silently fall back to the first (possibly cheapest) item in the group.
// Selections are keyed by group label, and some configs repeat a label (e.g. two
// "Size" groups), so a value is valid if ANY group with that label offers it — the
// storefront's own normalizeSelection produces exactly that shape.
function validateSelection(groups: NormOptionGroup[], selection: Record<string, string> | undefined, label: string) {
  for (const [groupLabel, key] of Object.entries(selection ?? {})) {
    if (!key) continue;
    const sameLabel = groups.filter((g) => g.label === groupLabel);
    if (sameLabel.length === 0) throw new CheckoutPricingError(`"${label}" has an unknown option "${groupLabel}".`);
    if (!sameLabel.some((g) => g.optionItems.some((it) => (it.value ?? it.label) === key))) {
      throw new CheckoutPricingError(`"${label}" option "${groupLabel}: ${key}" is no longer available.`);
    }
  }
}

/** Server-side: price every requested line from the site config. Throws CheckoutPricingError on anything invalid. */
export function priceCart(config: SiteConfig, lines: CheckoutLineRequest[]): PricedLine[] {
  if (!Array.isArray(lines) || lines.length === 0) throw new CheckoutPricingError('Your cart is empty.');

  const products = config.products?.items ?? [];
  const classes = normalizeClassItems(config.classes);
  const defaultTaxable = config.settings?.payments?.taxes?.defaultProductTaxable === true;

  const priced = lines.map((line): PricedLine => {
    const quantity = Number(line.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_LINE_QTY) {
      throw new CheckoutPricingError('Invalid quantity in cart.');
    }
    const baseId = String(line.id ?? '').split('::')[0];

    if (line.rental) {
      if (quantity !== 1) throw new CheckoutPricingError('Invalid quantity in cart.');
      try {
        const { resource } = resolveBooking(config.rentals, line.rental);
        return {
          id: line.id,
          name: resource.name,
          quantity: 1,
          unitPrice: bookingPriceCents(resource, line.rental.slots),
          taxable: defaultTaxable,
          currency: resource.currency,
        };
      } catch (e) {
        if (e instanceof RentalBookingError) throw new CheckoutPricingError(e.message);
        throw e;
      }
    }

    if (line.classItemId || line.classTimeId) {
      const cls = classes.find((c) => c.id === (line.classItemId || baseId));
      if (!cls) throw new CheckoutPricingError('A class in your cart is no longer available.');
      if (!(cls.times ?? []).some((t) => t.id === line.classTimeId)) {
        throw new CheckoutPricingError(`The selected time for "${cls.name}" is no longer available.`);
      }
      const groups = normalizeOptionGroups(cls.options);
      validateSelection(groups, line.options, cls.name);
      return {
        id: line.id,
        name: cls.name,
        quantity,
        unitPrice: effectivePriceForSelection(cls.price, groups, line.options),
        taxable: defaultTaxable, // class lines carry no taxable flag in the cart
        currency: cls.currency,
      };
    }

    const product = products.find((p) => p.id === baseId);
    if (!product) throw new CheckoutPricingError('An item in your cart is no longer available.');
    if (product.stock === 'out_of_stock') throw new CheckoutPricingError(`"${product.name}" is sold out.`);
    const groups = normalizeOptionGroups(product.options);
    validateSelection(groups, line.options, product.name);
    return {
      id: line.id,
      name: product.name,
      quantity,
      unitPrice: effectivePriceForSelection(product.price, groups, line.options),
      taxable: typeof product.taxable === 'boolean' ? product.taxable : defaultTaxable,
      currency: product.currency,
    };
  });

  const currencies = new Set(priced.map((l) => (l.currency || 'USD').toUpperCase()));
  if (currencies.size > 1) throw new CheckoutPricingError('Items in different currencies cannot be checked out together.');
  return priced;
}

export const PRICE_CHANGED_MESSAGE =
  'Prices have changed since you opened checkout. Please refresh the page and review your cart.';

/**
 * Server-side: full re-price + totals. `chargeCents` is the integer amount to charge
 * (processors require whole cents). `matchesExpected` is false when the customer was
 * shown a different total (stale config or a tampered request) — the caller decides
 * whether to refuse (enforce mode) or just log (monitor mode).
 */
export function quoteCheckout(config: SiteConfig, req: CheckoutRequest) {
  const lines = priceCart(config, req?.lines ?? []);
  const totals = computeCheckoutTotals(lines, config.settings?.payments, {
    fulfillment: req?.fulfillment,
    tipCents: req?.tipCents,
    promoCode: req?.promoCode,
  });
  // Round once, here: configs with fractional-cent option prices still compare/charge cleanly.
  const chargeCents = Math.round(totals.totalCents);
  const matchesExpected =
    typeof req?.expectedTotalCents !== 'number' || Math.round(req.expectedTotalCents) === chargeCents;
  const currency = (lines[0]?.currency || 'USD').toUpperCase();
  return { lines, totals, chargeCents, currency, matchesExpected };
}
