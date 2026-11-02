// src/lib/paymentProviders.ts
// Server-only: which card processors are configured in this environment.
// Reports env var *names* that are missing — never their values.
// (Browser code that needs Square's environment uses src/lib/squareEnv.ts instead.)

export type CardProvider = 'converge' | 'clover' | 'square';

export type ProviderStatus = { available: boolean; missing: string[] };
export type ProviderAvailability = Record<CardProvider, ProviderStatus>;

// Static references on purpose: Next.js only inlines NEXT_PUBLIC_* values at build time
// when accessed as `process.env.NAME` — a dynamic `process.env[name]` lookup can miss
// them on hosts that only provide env vars at build time. Read them the same way the
// payment code does, so this check sees exactly what checkout sees.
const ENV: Record<string, string | undefined> = {
  CONVERGE_ACCOUNT_ID: process.env.CONVERGE_ACCOUNT_ID,
  CONVERGE_MERCHANT_ID: process.env.CONVERGE_MERCHANT_ID,
  CONVERGE_USER_ID: process.env.CONVERGE_USER_ID,
  CONVERGE_PIN: process.env.CONVERGE_PIN,
  NEXT_PUBLIC_CONVERGE_IFRAME_URL: process.env.NEXT_PUBLIC_CONVERGE_IFRAME_URL,
  CLOVER_PRIVATE_TOKEN: process.env.CLOVER_PRIVATE_TOKEN,
  NEXT_PUBLIC_CLOVER_TOKEN: process.env.NEXT_PUBLIC_CLOVER_TOKEN,
  NEXT_PUBLIC_CLOVER_IFRAME_URL: process.env.NEXT_PUBLIC_CLOVER_IFRAME_URL,
  SQUARE_ACCESS_TOKEN: process.env.SQUARE_ACCESS_TOKEN,
  NEXT_PUBLIC_SQUARE_APPLICATION_ID: process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID,
  NEXT_PUBLIC_SQUARE_LOCATION_ID: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
};

function has(name: string) {
  return Boolean(ENV[name]?.trim());
}

function check(required: (string | string[])[]): ProviderStatus {
  // A nested array means "any one of these" (e.g. CONVERGE_ACCOUNT_ID or CONVERGE_MERCHANT_ID).
  const missing = required
    .filter((r) => (Array.isArray(r) ? !r.some(has) : !has(r)))
    .map((r) => (Array.isArray(r) ? r.join(' or ') : r));
  return { available: missing.length === 0, missing };
}

export function getPaymentProviderAvailability(): ProviderAvailability {
  return {
    converge: check([
      ['CONVERGE_ACCOUNT_ID', 'CONVERGE_MERCHANT_ID'],
      'CONVERGE_USER_ID',
      'CONVERGE_PIN',
      'NEXT_PUBLIC_CONVERGE_IFRAME_URL',
    ]),
    clover: check(['CLOVER_PRIVATE_TOKEN', 'NEXT_PUBLIC_CLOVER_TOKEN', 'NEXT_PUBLIC_CLOVER_IFRAME_URL']),
    square: check(['SQUARE_ACCESS_TOKEN', 'NEXT_PUBLIC_SQUARE_APPLICATION_ID', 'NEXT_PUBLIC_SQUARE_LOCATION_ID']),
  };
}

