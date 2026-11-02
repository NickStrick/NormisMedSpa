import { NextRequest, NextResponse } from 'next/server';
import { guardAdmin } from '@/lib/adminGuard';
import { loadLiveSiteConfig } from '@/lib/checkoutConfig';
import {
  confirmPendingBooking,
  isRowTaken,
  listResourceSlots,
  releaseBooking,
  type RentalSlotStatus,
} from '@/lib/rentalsDb';
import { addDays, businessToday, formatBookingLabel, fromMinutes, toMinutes } from '@/lib/rentalSlots';

export type AdminRentalBooking = {
  holdId: string;
  resourceId: string;
  resourceName: string;
  date: string;
  start: string;
  end: string;
  label: string;
  status: RentalSlotStatus;
  slotKeys: string[];
  orderId?: string;
  paymentId?: string;
  customerName?: string;
  customerEmail?: string;
};

// Admin: bookings (grouped from slot rows) between ?from and ?to, across every resource.
export async function GET(req: NextRequest) {
  const denied = guardAdmin(req);
  if (denied) return denied;

  const businessId = process.env.NEXT_PUBLIC_SITE_ID || '';
  const config = await loadLiveSiteConfig();
  const rentals = config?.rentals;
  const today = businessToday(rentals);
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from') || today;
  const to = searchParams.get('to') || addDays(from, 13);

  try {
    const now = Date.now();
    const bookings = new Map<string, AdminRentalBooking>();
    for (const resource of rentals?.resources ?? []) {
      const rows = await listResourceSlots(businessId, resource.id, from, to);
      for (const row of rows) {
        if (!isRowTaken(row, now)) continue; // expired holds
        const end = fromMinutes(toMinutes(row.start) + resource.slotMinutes);
        const existing = bookings.get(row.holdId);
        if (!existing) {
          bookings.set(row.holdId, {
            holdId: row.holdId,
            resourceId: resource.id,
            resourceName: resource.name,
            date: row.date,
            start: row.start,
            end,
            label: '',
            status: row.status,
            slotKeys: [row.slotKey],
            orderId: row.orderId || undefined,
            paymentId: row.paymentId || undefined,
            customerName: row.customerName || undefined,
            customerEmail: row.customerEmail || undefined,
          });
        } else {
          existing.slotKeys.push(row.slotKey);
          if (row.start < existing.start) existing.start = row.start;
          if (end > existing.end) existing.end = end;
        }
      }
    }
    const list = [...bookings.values()]
      .map((b) => ({ ...b, label: formatBookingLabel(b.date, b.start, b.end) }))
      .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
    return NextResponse.json({ from, to, bookings: list });
  } catch (err) {
    console.error('[admin/rentals] list failed', err);
    return NextResponse.json({ error: 'Failed to load bookings.' }, { status: 500 });
  }
}

// Admin: confirm a pending booking as paid, or release a booking's slots.
export async function PATCH(req: NextRequest) {
  const denied = guardAdmin(req);
  if (denied) return denied;

  type PatchBody = { action?: string; holdId?: string; slotKeys?: unknown };
  let body: PatchBody | null = null;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const businessId = process.env.NEXT_PUBLIC_SITE_ID || '';
  const holdId = String(body?.holdId ?? '');
  const slotKeys = Array.isArray(body?.slotKeys)
    ? body.slotKeys.filter((k): k is string => typeof k === 'string').slice(0, 100)
    : [];
  if (!holdId || slotKeys.length === 0) {
    return NextResponse.json({ error: 'holdId and slotKeys are required.' }, { status: 400 });
  }

  try {
    if (body?.action === 'confirm') await confirmPendingBooking(businessId, holdId, slotKeys);
    else if (body?.action === 'release') await releaseBooking(businessId, holdId, slotKeys);
    else return NextResponse.json({ error: 'action must be "confirm" or "release".' }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/rentals] update failed', err);
    return NextResponse.json({ error: 'Failed to update booking.' }, { status: 500 });
  }
}
