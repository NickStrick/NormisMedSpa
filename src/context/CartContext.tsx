// src/context/CartContext.tsx
'use client';

import { createContext, useContext, useMemo, useState, useCallback, useRef, useEffect } from 'react';
import type { RentalHoldRef } from '@/lib/rentalSlots';

export type CartItem = {
  id: string;
  name: string;
  price: number; // cents
  currency?: string;
  imageUrl?: string;
  options?: Record<string, string>;
  quantity: number;
  taxable?: boolean;
  // Class bookings only — carried through to the order + confirmation email.
  classItemId?: string;
  classTimeId?: string;
  classTimeLabel?: string; // pre-formatted, e.g. "Wed, Mar 4 · 6:00 PM"
  classLocation?: string;
  // Rental bookings only — the server-side hold on these slots (always quantity 1).
  // classTimeLabel/classLocation carry its display label so carts, orders, and emails show it.
  rental?: RentalHoldRef & { slotKeys: string[] };
};

/** Frees a rental hold the customer no longer wants (best-effort; holds also expire on their own). */
function releaseRentalHold(item: CartItem) {
  if (!item.rental) return;
  fetch('/api/rentals/hold', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ holdId: item.rental.holdId, slotKeys: item.rental.slotKeys }),
    keepalive: true,
  }).catch(() => {});
}

type CartCtx = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  totalCents: number;
  currency: string;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  isCheckoutOpen: boolean;
  openCheckout: () => void;
  closeCheckout: () => void;
};

const CartContext = createContext<CartCtx>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  clear: () => {},
  totalCents: 0,
  currency: 'USD',
  isCartOpen: false,
  openCart: () => {},
  closeCart: () => {},
  isCheckoutOpen: false,
  openCheckout: () => {},
  closeCheckout: () => {},
});

export const useCart = () => useContext(CartContext);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.id === item.id);
      if (idx >= 0) {
        if (prev[idx].rental) return prev; // a booked time can't be added twice
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    const removing = itemsRef.current.find((p) => p.id === id);
    if (removing?.rental) releaseRentalHold(removing);
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx < 0) return prev;
      const current = prev[idx];
      if (current.quantity > 1) {
        const next = [...prev];
        next[idx] = { ...current, quantity: current.quantity - 1 };
        return next;
      }
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totalCents = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const currency = items[0]?.currency ?? 'USD';

  const value = useMemo<CartCtx>(
    () => ({
      items,
      addItem,
      removeItem,
      clear,
      totalCents,
      currency,
      isCartOpen,
      openCart: () => setIsCartOpen(true),
      closeCart: () => setIsCartOpen(false),
      isCheckoutOpen,
      openCheckout: () => setIsCheckoutOpen(true),
      closeCheckout: () => setIsCheckoutOpen(false),
    }),
    [items, addItem, removeItem, clear, totalCents, currency, isCartOpen, isCheckoutOpen]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
