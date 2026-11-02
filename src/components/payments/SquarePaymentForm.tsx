// src/components/payments/SquarePaymentForm.tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { isSquareSandbox } from '@/lib/squareEnv';

// Minimal typings for the bits of the Square Web Payments SDK we use.
type SquareTokenResult = { status: string; token?: string; errors?: { message?: string }[] };
type SquareCard = {
  attach: (selector: string) => Promise<void>;
  tokenize: () => Promise<SquareTokenResult>;
  destroy: () => Promise<boolean>;
};
type SquarePayments = { card: (options?: Record<string, unknown>) => Promise<SquareCard> };
declare global {
  interface Window {
    Square?: { payments: (applicationId: string, locationId: string) => SquarePayments };
  }
}

const CARD_CONTAINER_ID = 'square-card-container';

/**
 * Square's single secure card field (number, expiry, CVV, postal code in one iframe).
 * Tokenizes on submit and hands the token to `onToken`, which charges it server-side.
 */
export default function SquarePaymentForm({
  amountLabel,
  disabled,
  onToken,
}: {
  amountLabel?: string;
  disabled?: boolean;
  onToken: (sourceId: string) => Promise<void>;
}) {
  const applicationId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID ?? '';
  const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID ?? '';
  const scriptUrl = isSquareSandbox(applicationId)
    ? 'https://sandbox.web.squarecdn.com/v1/square.js'
    : 'https://web.squarecdn.com/v1/square.js';
  const missingConfig = !applicationId || !locationId;

  const cardRef = useRef<SquareCard | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [cardReady, setCardReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!sdkReady || missingConfig || !window.Square) return;
    let cancelled = false;
    (async () => {
      try {
        const payments = window.Square!.payments(applicationId, locationId);
        let card: SquareCard;
        try {
          card = await payments.card({
            style: {
              '.input-container': { borderColor: '#E5E7EB', borderRadius: '12px' },
              '.input-container.is-focus': { borderColor: '#059669' },
              '.input-container.is-error': { borderColor: '#DC2626' },
              input: { fontSize: '16px', color: '#111827' },
              'input::placeholder': { color: '#9CA3AF' },
            },
          });
        } catch (styleErr) {
          // The SDK throws on any style it doesn't accept — never let cosmetics block payment.
          console.warn('[Square] custom card style rejected, using default style', styleErr);
          card = await payments.card();
        }
        if (cancelled) {
          await card.destroy();
          return;
        }
        await card.attach(`#${CARD_CONTAINER_ID}`);
        cardRef.current = card;
        setCardReady(true);
      } catch (e) {
        console.error('[Square] init failed', e);
        if (!cancelled) setError('Could not load the card form. Please refresh and try again.');
      }
    })();
    return () => {
      cancelled = true;
      cardRef.current?.destroy().catch(() => {});
      cardRef.current = null;
      setCardReady(false);
    };
  }, [sdkReady, missingConfig, applicationId, locationId]);

  const handleSubmit = async () => {
    if (disabled || !cardRef.current || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await cardRef.current.tokenize();
      if (result.status !== 'OK' || !result.token) {
        throw new Error(result.errors?.map((e) => e.message).filter(Boolean).join(' ') || 'Please check your card details.');
      }
      await onToken(result.token);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-5 md:p-8 bg-white rounded-3xl shadow-xl border border-gray-100">
      {!missingConfig && (
        // onReady (not onLoad) also fires when the script is already cached from a previous checkout.
        <Script src={scriptUrl} onReady={() => setSdkReady(true)} onError={() => setError('Could not load Square.')} />
      )}

      {missingConfig && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Payment configuration is missing. Set NEXT_PUBLIC_SQUARE_APPLICATION_ID and NEXT_PUBLIC_SQUARE_LOCATION_ID
          (plus SQUARE_ACCESS_TOKEN on the server).
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
      )}

      <label className="block text-sm font-medium text-gray-700 mb-2">Card details</label>
      <div id={CARD_CONTAINER_ID} className="min-h-[90px]" />
      {!cardReady && !missingConfig && !error && (
        <div className="text-sm text-gray-500 -mt-12 mb-8 text-center">Loading secure card form…</div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={disabled || !cardReady || isSubmitting}
        aria-disabled={disabled || !cardReady || isSubmitting}
        className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-200 transition-all"
      >
        {isSubmitting ? 'Processing…' : amountLabel ? `Pay ${amountLabel}` : 'Place Your Order'}
      </button>
      <p className="mt-3 text-center text-xs text-gray-400">Payments securely processed by Square.</p>
    </div>
  );
}
