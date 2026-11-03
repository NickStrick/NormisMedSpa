'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { RentalSchedulerSection } from '@/types/site';
import { useSite } from '@/context/SiteContext';
import { useCart } from '@/context/CartContext';
import AnimatedSection from '@/components/AnimatedSection';
import Dropdown, { FIELD_CONTROL_CLASS } from '@/components/Dropdown';
import { SeperatorWave } from '@/components/SeperatorWave';
import { resolveAssetUrl } from '@/lib/assetUrl';
import {
  addDays,
  bookingPriceCents,
  formatBookingLabel,
  formatDateLabel,
  formatTime12,
  fromMinutes,
  RENTAL_DEFAULTS,
  resourceLimits,
  toMinutes,
} from '@/lib/rentalSlots';
import type { RentalAvailabilityDay } from '@/app/api/rentals/availability/route';
import type { RentalHoldResponse } from '@/app/api/rentals/hold/route';

const DAYS_PER_PAGE = 7;

function formatPrice(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} hr${hours === 1 ? '' : 's'}`;
}

export default function RentalScheduler({
  id,
  title,
  subtitle,
  resourceIds,
  buyCtaFallback = 'Book Now',
  requirePayment,
  backgroundClass,
  topWaveType,
  bottomWaveType,
}: RentalSchedulerSection) {
  const { config } = useSite();
  const { addItem, openCheckout } = useCart();
  const rentals = config?.rentals;
  // "Require payment" off = book with just name/email, no checkout.
  const freeBooking = requirePayment === false;
  const cartActive = config?.settings?.payments?.cartActive === true;

  const resources = useMemo(
    () =>
      (rentals?.resources ?? []).filter(
        (r) => !r.hidden && (!resourceIds?.length || resourceIds.includes(r.id))
      ),
    [rentals?.resources, resourceIds]
  );

  const [resourceId, setResourceId] = useState<string | null>(null);
  const resource = resources.find((r) => r.id === resourceId) ?? resources[0];

  const [weekStart, setWeekStart] = useState<string | null>(null); // null = let the server pick "today"
  const [today, setToday] = useState<string | null>(null);
  const [days, setDays] = useState<RentalAvailabilityDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [slotCount, setSlotCount] = useState(1);
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [contact, setContact] = useState({ name: '', email: '', phone: '' });
  const [confirmation, setConfirmation] = useState<string | null>(null);

  // ── Load the visible week ─────────────────────────────────────────────────
  useEffect(() => {
    if (!resource) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    const params = new URLSearchParams({ resourceId: resource.id, days: String(DAYS_PER_PAGE) });
    if (weekStart) params.set('from', weekStart);
    fetch(`/api/rentals/availability?${params}`, { cache: 'no-store' })
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as
          | { today?: string; days?: RentalAvailabilityDay[]; error?: string }
          | null;
        if (cancelled) return;
        if (!res.ok || !data?.days) {
          setLoadError(data?.error || 'Could not load availability.');
          setDays([]);
          return;
        }
        setDays(data.days);
        setToday(data.today ?? null);
        setSelectedDate((prev) =>
          prev && data.days!.some((d) => d.date === prev)
            ? prev
            : data.days!.find((d) => d.slots.some((s) => s.available))?.date ?? data.days![0]?.date ?? null
        );
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not load availability.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [resource, weekStart, reloadKey]);

  // A different resource or day invalidates the picked time
  useEffect(() => {
    setStartTime(null);
    setBookError(null);
    setShowDetails(false);
  }, [resource?.id, selectedDate]);

  const limits = resource ? resourceLimits(resource) : { minSlots: 1, maxSlots: 1 };
  const day = days.find((d) => d.date === selectedDate) ?? null;

  // Longest run of open, back-to-back slots starting at the picked time
  const maxRun = useMemo(() => {
    if (!day || !startTime || !resource) return 0;
    const idx = day.slots.findIndex((s) => s.start === startTime);
    let run = 0;
    for (let i = idx; i >= 0 && i < day.slots.length && run < limits.maxSlots; i++) {
      if (!day.slots[i].available) break;
      if (i > idx && toMinutes(day.slots[i].start) !== toMinutes(day.slots[i - 1].start) + resource.slotMinutes) break;
      run++;
    }
    return run;
  }, [day, startTime, resource, limits.maxSlots]);

  useEffect(() => {
    setSlotCount((n) => Math.min(Math.max(n, limits.minSlots), Math.max(limits.minSlots, maxRun)));
  }, [maxRun, limits.minSlots]);

  const windowEnd = today ? addDays(today, rentals?.bookingWindowDays ?? RENTAL_DEFAULTS.bookingWindowDays) : null;
  const firstDay = days[0]?.date ?? null;
  const canGoBack = !!firstDay && !!today && firstDay > today;
  const canGoForward = !!firstDay && !!windowEnd && addDays(firstDay, DAYS_PER_PAGE) <= windowEnd;

  const onBook = useCallback(async () => {
    if (!resource || !selectedDate || !startTime) return;
    setBooking(true);
    setBookError(null);
    try {
      const res = await fetch('/api/rentals/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId: resource.id, date: selectedDate, start: startTime, slots: slotCount }),
      });
      const data = (await res.json().catch(() => null)) as (RentalHoldResponse & { error?: string }) | null;
      if (!res.ok || !data?.hold) {
        setBookError(data?.error || 'Could not reserve that time.');
        setReloadKey((k) => k + 1); // show what's actually free now
        return;
      }
      addItem({
        id: `rental::${data.hold.holdId}`,
        name: data.resourceName,
        price: data.priceCents,
        currency: data.currency,
        imageUrl: resolveAssetUrl(resource.imageUrl),
        classTimeLabel: data.label,
        rental: data.hold,
      });
      setStartTime(null);
      setReloadKey((k) => k + 1);
      openCheckout();
    } catch {
      setBookError('Could not reserve that time.');
    } finally {
      setBooking(false);
    }
  }, [resource, selectedDate, startTime, slotCount, addItem, openCheckout]);

  const onBookFree = async () => {
    if (!resource || !selectedDate || !startTime) return;
    setBooking(true);
    setBookError(null);
    try {
      const res = await fetch('/api/rentals/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId: resource.id,
          date: selectedDate,
          start: startTime,
          slots: slotCount,
          customerName: contact.name,
          customerEmail: contact.email,
          customerPhone: contact.phone,
        }),
      });
      const data = (await res.json().catch(() => null)) as { label?: string; resourceName?: string; error?: string } | null;
      if (!res.ok) {
        setBookError(data?.error || 'Could not book that time.');
        if (res.status === 409) setReloadKey((k) => k + 1);
        return;
      }
      setConfirmation(`${data?.resourceName ?? resource.name} · ${data?.label ?? ''}`);
      setStartTime(null);
      setShowDetails(false);
      setReloadKey((k) => k + 1);
    } catch {
      setBookError('Could not book that time.');
    } finally {
      setBooking(false);
    }
  };

  if (!resource) return null;

  const endTime = startTime ? fromMinutes(toMinutes(startTime) + resource.slotMinutes * slotCount) : null;
  const priceCents = bookingPriceCents(resource, slotCount);
  const currency = resource.currency || 'USD';
  // pricePerHour 0 = no online price (e.g. free consults, treatments quoted in person)
  const showPrices = resource.pricePerHour > 0;
  const durationOptions = Array.from(
    { length: Math.max(0, maxRun - limits.minSlots + 1) },
    (_, i) => limits.minSlots + i
  );

  return (
    <div className="relative">
      <SeperatorWave type={topWaveType} flip={false} color={'var(--bg)'} />
      <section id={id} className={`section ${backgroundClass ?? ''}`}>
        <div className="mx-auto max-w-5xl px-2 sm:px-4">
          {title ? (
            <AnimatedSection>
              <h2 className="text-4xl md:text-5xl font-extrabold text-center mb-3">{title}</h2>
            </AnimatedSection>
          ) : null}
          {subtitle ? <p className="text-center text-muted mb-8">{subtitle}</p> : null}

          {/* Resource tabs */}
          {resources.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {resources.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setResourceId(r.id)}
                  className={`px-4 py-2 product-select text-sm ${
                    r.id === resource.id ? 'bg-gradient-colored' : 'border-2 border-black/40 hover:border-black/60'
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          )}

          {/* .card defaults to --text-2 (inverted), which is unreadable on light card backgrounds */}
          <div className="card p-4 md:p-6 !max-w-full space-y-5 !text-[var(--text-1)]">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <div className="text-xl font-bold">{resource.name}</div>
                {resource.description && <div className="text-sm text-muted">{resource.description}</div>}
              </div>
              <div className="text-sm font-semibold">
                {showPrices && `${formatPrice(resource.pricePerHour, currency)}/hr · `}{formatDuration(resource.slotMinutes)} increments
              </div>
            </div>

            {/* Week navigation */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="btn btn-ghost p-1"
                aria-label="Previous week"
                disabled={!canGoBack || loading}
                onClick={() => firstDay && setWeekStart(addDays(firstDay, -DAYS_PER_PAGE))}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-semibold">
                {firstDay
                  ? `${formatDateLabel(firstDay, { month: 'short', day: 'numeric' })} – ${formatDateLabel(
                      addDays(firstDay, DAYS_PER_PAGE - 1),
                      { month: 'short', day: 'numeric' }
                    )}`
                  : 'Loading…'}
              </span>
              <button
                type="button"
                className="btn btn-ghost p-1"
                aria-label="Next week"
                disabled={!canGoForward || loading}
                onClick={() => firstDay && setWeekStart(addDays(firstDay, DAYS_PER_PAGE))}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {loadError && <p className="text-sm text-red-600">{loadError}</p>}

            {/* Week overview: open slots per day */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {days.map((d) => {
                const open = d.slots.filter((s) => s.available).length;
                const active = d.date === selectedDate;
                return (
                  <button
                    key={d.date}
                    type="button"
                    onClick={() => setSelectedDate(d.date)}
                    className={`rounded-lg py-2 px-1 text-center transition-colors border ${
                      active
                        ? 'bg-[var(--primary)] border-[var(--primary)] text-white'
                        : 'bg-[var(--bg)] border-[color-mix(in_srgb,var(--fg)_15%,transparent)] hover:border-[var(--primary)]'
                    } ${open === 0 && !active ? 'opacity-50' : ''}`}
                  >
                    <div className="text-[10px] sm:text-xs uppercase opacity-80">
                      {formatDateLabel(d.date, { weekday: 'short' })}
                    </div>
                    <div className="text-base sm:text-lg font-bold">{formatDateLabel(d.date, { day: 'numeric' })}</div>
                    <div className="text-[10px] sm:text-xs">
                      {d.slots.length === 0 ? 'Closed' : open === 0 ? 'Full' : `${open} open`}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Slots for the selected day */}
            {day && (
              <div className="space-y-2 border-t pt-4">
                <div className="text-sm font-medium">
                  {formatDateLabel(day.date, { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
                {day.slots.length === 0 ? (
                  <p className="text-sm text-muted">Closed this day.</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {day.slots.map((s) => {
                      const inSelection =
                        !!startTime &&
                        toMinutes(s.start) >= toMinutes(startTime) &&
                        toMinutes(s.start) < toMinutes(startTime) + resource.slotMinutes * slotCount;
                      return (
                        <button
                          key={s.start}
                          type="button"
                          disabled={!s.available}
                          onClick={() => setStartTime(s.start)}
                          className={`px-2 py-2 product-select text-sm ${
                            inSelection
                              ? 'bg-gradient-colored'
                              : s.available
                                ? 'border-2 border-black/40 hover:border-black/60'
                                : 'opacity-35 line-through cursor-not-allowed border border-black/20'
                          }`}
                        >
                          {formatTime12(s.start)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Duration + book */}
            {startTime && day && (
              <div className="border-t pt-4 flex flex-col md:flex-row md:items-end gap-4">
                <div>
                  <span id={`${id}-duration-label`} className="block text-sm font-medium mb-1">How long?</span>
                  <Dropdown
                    labelId={`${id}-duration-label`}
                    name="duration"
                    className="md:min-w-[11rem]"
                    value={String(slotCount)}
                    onChange={(v) => setSlotCount(Number(v))}
                    options={durationOptions.map((n) => ({
                      value: String(n),
                      label: `${formatDuration(n * resource.slotMinutes)}${showPrices ? ` — ${formatPrice(bookingPriceCents(resource, n), currency)}` : ''}`,
                    }))}
                  />
                </div>
                <div className="flex-1 text-sm">
                  <div className="font-semibold">{resource.name}</div>
                  <div className="text-muted">{endTime && formatBookingLabel(day.date, startTime, endTime)}</div>
                </div>
                <div className="flex flex-col items-stretch md:items-end gap-1">
                  {showPrices && <div className="text-lg font-bold">{formatPrice(priceCents, currency)}</div>}
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={freeBooking ? () => setShowDetails(true) : onBook}
                    disabled={booking || (!freeBooking && !cartActive) || durationOptions.length === 0}
                  >
                    {booking ? 'Reserving…' : buyCtaFallback}
                  </button>
                </div>
              </div>
            )}
            {startTime && durationOptions.length === 0 && (
              <p className="text-sm text-muted">
                Bookings need at least {formatDuration(limits.minSlots * resource.slotMinutes)} — pick an earlier start time.
              </p>
            )}
            {/* No-payment booking: collect contact details, then confirm */}
            {freeBooking && showDetails && startTime && (
              <form
                className="border-t pt-4 grid gap-3 md:grid-cols-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  onBookFree();
                }}
              >
                <label className="block">
                  <span className="block text-sm font-medium mb-1">Name *</span>
                  <input
                    className={FIELD_CONTROL_CLASS}
                    required
                    autoComplete="name"
                    value={contact.name}
                    onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className="block text-sm font-medium mb-1">Email *</span>
                  <input
                    type="email"
                    className={FIELD_CONTROL_CLASS}
                    required
                    autoComplete="email"
                    value={contact.email}
                    onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className="block text-sm font-medium mb-1">Phone</span>
                  <input
                    type="tel"
                    className={FIELD_CONTROL_CLASS}
                    autoComplete="tel"
                    value={contact.phone}
                    onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                  />
                </label>
                <div className="md:col-span-3 flex justify-end">
                  <button type="submit" className="btn btn-primary" disabled={booking}>
                    {booking ? 'Booking…' : 'Confirm Booking'}
                  </button>
                </div>
              </form>
            )}
            {confirmation && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-900">
                <strong>You&apos;re booked!</strong> {confirmation}
                <button type="button" className="ml-3 underline" onClick={() => setConfirmation(null)}>
                  Book another
                </button>
              </div>
            )}
            {bookError && <p className="text-sm text-red-600">{bookError}</p>}
            {!freeBooking && !cartActive && (
              <p className="text-sm text-muted">Online booking isn&apos;t available right now — please contact us to book.</p>
            )}
          </div>
        </div>
      </section>
      <SeperatorWave type={bottomWaveType} flip={true} color={'var(--bg)'} />
    </div>
  );
}
