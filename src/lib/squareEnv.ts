// src/lib/squareEnv.ts
// Browser-safe: only reads a NEXT_PUBLIC_ var. Kept separate from paymentProviders.ts
// so client components never import a module that references server secrets.

/**
 * Square sandbox application IDs start with "sandbox-", so the environment is
 * derived from the app ID rather than needing its own env var.
 */
export function isSquareSandbox(applicationId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID ?? '') {
  return applicationId.trim().startsWith('sandbox-');
}
