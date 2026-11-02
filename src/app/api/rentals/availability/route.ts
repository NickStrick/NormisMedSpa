import { NextRequest, NextResponse } from 'next/server';
import { loadLiveSiteConfig } from '@/lib/checkoutConfig';
import { isRowTaken, listResourceSlots } from '@/lib/rentalsDb';
import { addDays, businessToday, daySlotStarts, findResource, isStartBookable } from '@/lib/rentalSlots';

const MAX_DAYS = 14;

export type RentalAvailabilityDay = { date: string; slots: { start: string; available: boolean }[] };

// Public endpoint: a resource's slots for a run of days, each marked bookable or not
// (closed hours, past/too-soon times, and taken slots all come back unavailable).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const resourceId = (searchParams.get('resourceId') || '').trim();
  const days = Math.min(MAX_DAYS, Math.max(1, Number(searchParams.get('days')) || 7));

  const businessId = process.env.NEXT_PUBLIC_SITE_ID || '';
  if (!businessId) return NextResponse.json({ error: 'Site is not configured.' }, { status: 500 });

  const config = await loadLiveSiteConfig();
  const rentals = config?.rentals;
  const resource = findResource(rentals, resourceId);
  if (!resource) return NextResponse.json({ error: 'Unknown rental.' }, { status: 404 });

  const today = businessToday(rentals);
  const requested = (searchParams.get('from') || '').trim();
  const from = /^\d{4}-\d{2}-\d{2}$/.test(requested) && requested > today ? requested : today;
  const to = addDays(from, days - 1);

  try {
    const rows = await listResourceSlots(businessId, resource.id, from, to);
    const now = Date.now();
    const taken = new Set(rows.filter((r) => isRowTaken(r, now)).map((r) => `${r.date}#${r.start}`));

    const result: RentalAvailabilityDay[] = [];
    for (let i = 0; i < days; i++) {
      const date = addDays(from, i);
      result.push({
        date,
        slots: daySlotStarts(resource, date).map((start) => ({
          start,
          available: !taken.has(`${date}#${start}`) && isStartBookable(rentals, date, start, now),
        })),
      });
    }
    return NextResponse.json(
      { resourceId: resource.id, today, days: result },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    console.error('[rentals] availability failed', err);
    return NextResponse.json({ error: 'Could not load availability.' }, { status: 500 });
  }
}
