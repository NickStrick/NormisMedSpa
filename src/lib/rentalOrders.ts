// src/lib/rentalOrders.ts
// Reads the rental hold carried on an order item (see CartItem.rental).
// Slot keys come from the client but every DynamoDB write is conditioned on the
// hold's random holdId, so they can only ever touch that hold's own rows.
import type { OrderItem } from '@/types/orders';

export type OrderRentalHold = { holdId: string; slotKeys: string[] };

export function orderRentalHolds(items: OrderItem[] | undefined): OrderRentalHold[] {
  const holds: OrderRentalHold[] = [];
  for (const item of items ?? []) {
    const rental = (item as Record<string, unknown>).rental as { holdId?: unknown; slotKeys?: unknown } | undefined;
    if (!rental || typeof rental.holdId !== 'string' || !Array.isArray(rental.slotKeys)) continue;
    const slotKeys = rental.slotKeys.filter((k): k is string => typeof k === 'string').slice(0, 100);
    if (slotKeys.length) holds.push({ holdId: rental.holdId, slotKeys });
  }
  return holds;
}
