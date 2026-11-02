'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, X } from 'lucide-react';
import type { RentalDayHours, RentalResource, SiteConfig, SiteRentalsConfig } from '@/types/site';
import { useSite } from '@/context/SiteContext';
import { getSiteId } from '@/lib/siteId';
import MediaPicker from './MediaPicker';
import CurrencyInput from './fields/CurrencyInput';
import { saveAdminConfig, useAdminAutoSave } from '@/lib/adminAutoSave';
import { addDays, businessToday, formatDateLabel, FREE_PAYMENT_ID, RENTAL_DEFAULTS } from '@/lib/rentalSlots';
import type { AdminRentalBooking } from '@/app/api/admin/rentals/route';

// ─── Utilities ────────────────────────────────────────────────────────────────

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

function rid() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SLOT_PRESETS = [15, 30, 45, 60, 90, 120];

function blankResource(): RentalResource {
  return {
    id: `rental-${rid().slice(0, 8)}`,
    name: 'New Rental',
    description: '',
    imageUrl: '',
    pricePerHour: 0,
    currency: 'USD',
    slotMinutes: 30,
    minSlots: 1,
    maxSlots: 8,
    weeklyHours: [null, { open: '15:00', close: '21:00' }, { open: '15:00', close: '21:00' }, { open: '15:00', close: '21:00' }, { open: '15:00', close: '21:00' }, { open: '15:00', close: '21:00' }, { open: '09:00', close: '17:00' }],
    blackoutDates: [],
  };
}

const STATUS_STYLES: Record<string, string> = {
  booked: 'bg-emerald-100 text-emerald-800',
  pending: 'bg-amber-100 text-amber-800',
  held: 'bg-gray-100 text-gray-700',
  blocked: 'bg-gray-200 text-gray-800',
};

const STATUS_LABELS: Record<string, string> = {
  booked: 'Paid',
  pending: 'Awaiting payment',
  held: 'In checkout',
  blocked: 'Blocked',
};

// ─── Resource editor card ─────────────────────────────────────────────────────

function ResourceCard({
  resource,
  expanded,
  onToggle,
  onChange,
  onRemove,
  onPickImage,
}: {
  resource: RentalResource;
  expanded: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<RentalResource>) => void;
  onRemove: () => void;
  onPickImage: () => void;
}) {
  const [blackoutInput, setBlackoutInput] = useState('');
  const customSlot = !SLOT_PRESETS.includes(resource.slotMinutes);

  const setDay = (index: number, hours: RentalDayHours | null) => {
    const weeklyHours = Array.from({ length: 7 }, (_, i) => resource.weeklyHours?.[i] ?? null);
    weeklyHours[index] = hours;
    onChange({ weeklyHours });
  };

  return (
    <div className="card admin-card card-solid p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <button type="button" className="flex items-center gap-2 font-semibold text-left" onClick={onToggle}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {resource.name || 'Untitled rental'}
          {resource.hidden && <span className="text-xs text-muted font-normal">(hidden)</span>}
        </button>
        <button type="button" className="btn btn-ghost text-red-600" onClick={onRemove} title="Delete rental">
          <Trash2 size={16} />
        </button>
      </div>

      {expanded && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Name</label>
              <input className="input w-full" value={resource.name} onChange={(e) => onChange({ name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Price per hour</label>
              <CurrencyInput cents={resource.pricePerHour} onChange={(cents) => onChange({ pricePerHour: cents })} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Description</label>
            <input
              className="input w-full"
              value={resource.description ?? ''}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="e.g. 70ft tunnel with pitching machine"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Image (shown in the cart)</label>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                value={resource.imageUrl ?? ''}
                onChange={(e) => onChange({ imageUrl: e.target.value })}
              />
              <button type="button" className="btn btn-inverted" onClick={onPickImage}>Pick…</button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Booking increment</label>
              <select
                className="input w-full"
                value={customSlot ? 'custom' : String(resource.slotMinutes)}
                onChange={(e) => {
                  if (e.target.value !== 'custom') onChange({ slotMinutes: Number(e.target.value) });
                  else onChange({ slotMinutes: 20 });
                }}
              >
                {SLOT_PRESETS.map((m) => (
                  <option key={m} value={m}>{m} minutes</option>
                ))}
                <option value="custom">Custom…</option>
              </select>
              {customSlot && (
                <input
                  type="number"
                  min={5}
                  step={5}
                  className="input w-full mt-1"
                  value={resource.slotMinutes}
                  onChange={(e) => onChange({ slotMinutes: Math.max(5, Number(e.target.value) || 5) })}
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Shortest booking (slots)</label>
              <input
                type="number"
                min={1}
                className="input w-full"
                value={resource.minSlots ?? 1}
                onChange={(e) => onChange({ minSlots: Math.max(1, Number(e.target.value) || 1) })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Longest booking (slots)</label>
              <input
                type="number"
                min={1}
                max={48}
                className="input w-full"
                value={resource.maxSlots ?? 8}
                onChange={(e) => onChange({ maxSlots: Math.min(48, Math.max(1, Number(e.target.value) || 1)) })}
              />
            </div>
          </div>
          <p className="text-xs text-muted -mt-2">
            Customers book in {resource.slotMinutes}-minute steps, from{' '}
            {(resource.minSlots ?? 1) * resource.slotMinutes} to {(resource.maxSlots ?? 8) * resource.slotMinutes} minutes.
          </p>

          <div>
            <div className="text-xs font-medium mb-1">Weekly hours</div>
            <div className="space-y-1">
              {WEEKDAYS.map((name, i) => {
                const hours = resource.weeklyHours?.[i] ?? null;
                return (
                  <div key={name} className="grid grid-cols-[110px_auto_1fr_1fr] gap-2 items-center text-sm">
                    <span>{name}</span>
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={!!hours}
                        onChange={(e) => setDay(i, e.target.checked ? { open: '15:00', close: '21:00' } : null)}
                      />
                      Open
                    </label>
                    {hours ? (
                      <>
                        <input
                          type="time"
                          className="input"
                          value={hours.open}
                          onChange={(e) => setDay(i, { ...hours, open: e.target.value })}
                        />
                        <input
                          type="time"
                          className="input"
                          value={hours.close}
                          onChange={(e) => setDay(i, { ...hours, close: e.target.value })}
                        />
                      </>
                    ) : (
                      <span className="text-xs text-muted col-span-2">Closed</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium mb-1">Closed dates (holidays, events)</div>
            <div className="flex gap-2">
              <input type="date" className="input" value={blackoutInput} onChange={(e) => setBlackoutInput(e.target.value)} />
              <button
                type="button"
                className="btn btn-inverted"
                disabled={!blackoutInput}
                onClick={() => {
                  const dates = Array.from(new Set([...(resource.blackoutDates ?? []), blackoutInput])).sort();
                  onChange({ blackoutDates: dates });
                  setBlackoutInput('');
                }}
              >
                Add
              </button>
            </div>
            {(resource.blackoutDates ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {(resource.blackoutDates ?? []).map((d) => (
                  <span key={d} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs">
                    {formatDateLabel(d)}
                    <button
                      type="button"
                      aria-label={`Remove ${d}`}
                      onClick={() => onChange({ blackoutDates: (resource.blackoutDates ?? []).filter((x) => x !== d) })}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="checkbox"
              checked={resource.hidden === true}
              onChange={(e) => onChange({ hidden: e.target.checked })}
            />
            Hide from customers (stop online booking for this rental)
          </label>
        </div>
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export type RentalsModalProps = { onClose: () => void };

export default function RentalsModal({ onClose }: RentalsModalProps) {
  const { config, setConfig } = useSite();
  const siteId = getSiteId();

  const [draft, setDraft] = useState<SiteConfig | null>(null);
  const originalRef = useRef<SiteConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'bookings' | 'rentals' | 'settings'>('bookings');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Media picker ──────────────────────────────────────────────────────────
  const [pickingFor, setPickingFor] = useState<string | null>(null);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (config && !draft) {
      const copy = deepClone(config);
      copy.rentals = copy.rentals ?? { resources: [] };
      setDraft(copy);
      originalRef.current = deepClone(copy);
    }
  }, [config, draft]);

  const rentals: SiteRentalsConfig = draft?.rentals ?? { resources: [] };

  const updateRentals = useCallback((patch: Partial<SiteRentalsConfig>) => {
    setDraft((prev) => (prev ? { ...prev, rentals: { ...(prev.rentals ?? { resources: [] }), ...patch } } : prev));
  }, []);

  const updateResource = useCallback(
    (id: string, patch: Partial<RentalResource>) =>
      updateRentals({ resources: rentals.resources.map((r) => (r.id === id ? { ...r, ...patch } : r)) }),
    [rentals.resources, updateRentals]
  );

  const isDirty = useMemo(() => {
    if (!draft || !originalRef.current) return false;
    return JSON.stringify(draft) !== JSON.stringify(originalRef.current);
  }, [draft]);

  // ── Save / Restore ────────────────────────────────────────────────────────
  const onSave = useCallback(async (): Promise<boolean> => {
    if (!draft) return false;
    setSaving(true);
    setError(null);
    try {
      const saved = await saveAdminConfig(siteId, draft, originalRef.current ?? draft);
      setConfig(saved);
      originalRef.current = deepClone(saved);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [draft, setConfig, siteId]);

  // Auto-save when the admin bar is hidden (ctrl + alt + a)
  useAdminAutoSave(isDirty, onSave);

  const onRestore = useCallback(() => {
    if (originalRef.current) setDraft(deepClone(originalRef.current));
  }, []);

  // ── Bookings ──────────────────────────────────────────────────────────────
  const today = businessToday(rentals);
  const [rangeFrom, setRangeFrom] = useState(today);
  const [bookings, setBookings] = useState<AdminRentalBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [busyHoldId, setBusyHoldId] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    setBookingsLoading(true);
    setBookingsError(null);
    try {
      const params = new URLSearchParams({ from: rangeFrom, to: addDays(rangeFrom, 13) });
      const res = await fetch(`/api/admin/rentals?${params}`, { headers: { 'x-local-admin': '1' }, cache: 'no-store' });
      const data = (await res.json().catch(() => null)) as { bookings?: AdminRentalBooking[]; error?: string } | null;
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setBookings(data?.bookings ?? []);
    } catch (e) {
      setBookingsError(e instanceof Error ? e.message : 'Failed to load bookings.');
    } finally {
      setBookingsLoading(false);
    }
  }, [rangeFrom]);

  useEffect(() => {
    if (tab === 'bookings') loadBookings();
  }, [tab, loadBookings]);

  const updateBooking = async (b: AdminRentalBooking, action: 'confirm' | 'release') => {
    if (action === 'release' && !window.confirm(`Release ${b.resourceName}, ${b.label}? The time becomes bookable again. Refunds are not issued automatically.`)) return;
    setBusyHoldId(b.holdId);
    try {
      const res = await fetch('/api/admin/rentals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-local-admin': '1' },
        body: JSON.stringify({ action, holdId: b.holdId, slotKeys: b.slotKeys }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await loadBookings();
    } catch (e) {
      setBookingsError(e instanceof Error ? e.message : 'Failed to update booking.');
    } finally {
      setBusyHoldId(null);
    }
  };

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, AdminRentalBooking[]>();
    for (const b of bookings) map.set(b.date, [...(map.get(b.date) ?? []), b]);
    return [...map.entries()];
  }, [bookings]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (!draft) {
    return (
      <div className="fixed inset-0 z-[12000] bg-black/50 flex items-center justify-center p-4">
        <div className="card admin-card p-6 text-sm text-muted">
          Loading...
          <div className="mt-4 text-right">
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed edit-modal inset-0 z-[12000] bg-black/50 flex items-center justify-center p-4">
        <div className="card admin-card card-solid p-4 relative w-full max-w-full overflow-hidden card-screen-height flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
            <div className="font-semibold text-lg">Rentals</div>
            <div className="flex items-center gap-2">
              {error && <div className="text-red-500 text-sm mr-2">{error}</div>}
              {isDirty && <button className="btn btn-ghost" onClick={onRestore}>Restore</button>}
              <button className="btn btn-ghost" onClick={onClose}>Close</button>
              <button className={`btn btn-primary${isDirty ? ' btn-save-dirty' : ''}`} onClick={onSave} disabled={!isDirty || saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-4 pt-4 flex-shrink-0">
            <div className="flex gap-4 border-b">
              {([
                ['bookings', 'Bookings'],
                ['rentals', 'Rentals & Hours'],
                ['settings', 'Booking Rules'],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`pb-2 text-sm font-medium border-b-2 ${tab === key ? 'border-[var(--primary)]' : 'border-transparent opacity-60'}`}
                  onClick={() => setTab(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {tab === 'bookings' && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" className="btn btn-ghost" onClick={() => setRangeFrom((d) => addDays(d, -14))}>← Earlier</button>
                  <input type="date" className="input" value={rangeFrom} onChange={(e) => e.target.value && setRangeFrom(e.target.value)} />
                  <span className="text-sm text-muted">to {formatDateLabel(addDays(rangeFrom, 13))}</span>
                  <button type="button" className="btn btn-ghost" onClick={() => setRangeFrom((d) => addDays(d, 14))}>Later →</button>
                  <button type="button" className="btn btn-inverted ml-auto" onClick={loadBookings} disabled={bookingsLoading}>
                    {bookingsLoading ? 'Loading…' : 'Refresh'}
                  </button>
                </div>
                <p className="text-xs text-muted">
                  <strong>Paid</strong> bookings were charged by card. <strong>Awaiting payment</strong> bookings
                  (external link / Venmo) stay reserved until you confirm the payment or release the time.
                  Releasing a paid booking does not refund the card — refund it in your payment dashboard.
                </p>
                {bookingsError && <div className="text-sm text-red-600">{bookingsError}</div>}
                {!bookingsLoading && bookings.length === 0 && !bookingsError && (
                  <div className="text-sm text-muted">No bookings in this range.</div>
                )}
                {bookingsByDate.map(([date, list]) => (
                  <div key={date} className="space-y-2">
                    <div className="text-sm font-semibold pt-2">
                      {formatDateLabel(date, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </div>
                    {list.map((b) => (
                      <div key={b.holdId} className="card admin-card card-solid p-3 flex flex-wrap items-center gap-3 text-sm">
                        <div className="min-w-[180px]">
                          <div className="font-medium">{b.resourceName}</div>
                          <div className="text-muted">{b.label.split(' · ')[1]}</div>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[b.status] ?? ''}`}>
                          {b.status === 'booked' && b.paymentId === FREE_PAYMENT_ID
                            ? 'Booked (no charge)'
                            : STATUS_LABELS[b.status] ?? b.status}
                        </span>
                        <div className="flex-1 min-w-[160px]">
                          {b.customerName || b.customerEmail ? (
                            <>
                              <div>{b.customerName || '—'}</div>
                              {b.customerEmail && (
                                <a className="text-xs underline" href={`mailto:${b.customerEmail}`}>{b.customerEmail}</a>
                              )}
                            </>
                          ) : (
                            <span className="text-muted text-xs">No customer details yet</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {b.status === 'pending' && (
                            <button
                              type="button"
                              className="btn btn-primary"
                              disabled={busyHoldId === b.holdId}
                              onClick={() => updateBooking(b, 'confirm')}
                            >
                              Mark paid
                            </button>
                          )}
                          {b.status !== 'held' && (
                            <button
                              type="button"
                              className="btn btn-ghost text-red-600"
                              disabled={busyHoldId === b.holdId}
                              onClick={() => updateBooking(b, 'release')}
                            >
                              Release
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </>
            )}

            {tab === 'rentals' && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted">
                    Each rental is booked by one customer at a time. Add one per cage, court, or space.
                  </p>
                  <button
                    type="button"
                    className="btn btn-inverted flex items-center gap-1"
                    onClick={() => {
                      const r = blankResource();
                      updateRentals({ resources: [...rentals.resources, r] });
                      setExpandedId(r.id);
                    }}
                  >
                    <Plus size={16} /> Add rental
                  </button>
                </div>
                {rentals.resources.length === 0 && <div className="text-sm text-muted">No rentals yet.</div>}
                {rentals.resources.map((r) => (
                  <ResourceCard
                    key={r.id}
                    resource={r}
                    expanded={expandedId === r.id}
                    onToggle={() => setExpandedId((id) => (id === r.id ? null : r.id))}
                    onChange={(patch) => updateResource(r.id, patch)}
                    onRemove={() => {
                      if (!window.confirm(`Delete "${r.name}"? Existing bookings stay in the Bookings list until released.`)) return;
                      updateRentals({ resources: rentals.resources.filter((x) => x.id !== r.id) });
                    }}
                    onPickImage={() => setPickingFor(r.id)}
                  />
                ))}
              </>
            )}

            {tab === 'settings' && (
              <div className="grid md:grid-cols-3 gap-4 max-w-3xl">
                <div>
                  <label className="block text-xs font-medium mb-1">Time zone</label>
                  <input
                    className="input w-full"
                    value={rentals.timezone ?? ''}
                    placeholder={RENTAL_DEFAULTS.timezone}
                    onChange={(e) => updateRentals({ timezone: e.target.value || undefined })}
                  />
                  <p className="text-xs text-muted mt-1">Hours are in this zone, e.g. America/Chicago.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Book up to (days ahead)</label>
                  <input
                    type="number"
                    min={1}
                    className="input w-full"
                    value={rentals.bookingWindowDays ?? RENTAL_DEFAULTS.bookingWindowDays}
                    onChange={(e) => updateRentals({ bookingWindowDays: Math.max(1, Number(e.target.value) || 1) })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Minimum notice (minutes)</label>
                  <input
                    type="number"
                    min={0}
                    className="input w-full"
                    value={rentals.leadTimeMinutes ?? RENTAL_DEFAULTS.leadTimeMinutes}
                    onChange={(e) => updateRentals({ leadTimeMinutes: Math.max(0, Number(e.target.value) || 0) })}
                  />
                  <p className="text-xs text-muted mt-1">Times starting sooner than this can&apos;t be booked online.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Media picker overlay */}
      {pickingFor && (
        <div className="fixed inset-0 z-[13000] bg-black/60 flex items-center justify-center p-4">
          <div className="card admin-card card-solid p-4 w-full max-w-2xl max-h-[80vh] overflow-auto relative">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold">Pick an image</span>
              <button className="btn btn-ghost" onClick={() => setPickingFor(null)}>Cancel</button>
            </div>
            <MediaPicker
              prefix={`configs/${siteId}/assets/`}
              onPick={(key) => {
                updateResource(pickingFor, { imageUrl: key });
                setPickingFor(null);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
