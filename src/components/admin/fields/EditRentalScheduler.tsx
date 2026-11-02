'use client';

import { useCallback } from 'react';
import type { RentalSchedulerSection } from '@/types/site';
import type { EditorProps } from './types';
import { useSite } from '@/context/SiteContext';

export default function EditRentalScheduler({ section, onChange }: EditorProps<RentalSchedulerSection>) {
  const { config } = useSite();
  const resources = config?.rentals?.resources ?? [];
  const selected = section.resourceIds ?? [];

  const set = useCallback(
    <K extends keyof RentalSchedulerSection>(key: K, value: RentalSchedulerSection[K]) =>
      onChange({ ...section, [key]: value }),
    [onChange, section]
  );

  const toggleResource = (id: string) =>
    set('resourceIds', selected.includes(id) ? selected.filter((r) => r !== id) : [...selected, id]);

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium">Title</label>
        <input
          className="input w-full"
          value={section.title ?? ''}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Book Online"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Subtitle</label>
        <input
          className="input w-full"
          value={section.subtitle ?? ''}
          onChange={(e) => set('subtitle', e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Button label</label>
        <input
          className="input w-full"
          value={section.buyCtaFallback ?? 'Book Now'}
          onChange={(e) => set('buyCtaFallback', e.target.value)}
          placeholder="Book Now"
        />
      </div>

      <div className="card admin-card card-solid p-3 space-y-1">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            className="checkbox"
            checked={section.requirePayment !== false}
            onChange={(e) => set('requirePayment', e.target.checked)}
          />
          Require payment
        </label>
        <p className="text-xs text-muted">
          When off, customers book with just their name and email — no checkout or charge. The time
          is locked as booked and shows as <strong>Booked (no charge)</strong> in Admin → Rentals.
          Handy for free sessions, collecting payment in person, or testing.
        </p>
      </div>

      <div className="card admin-card card-solid p-3 space-y-2">
        <div className="text-sm font-medium">Rentals shown here</div>
        <p className="text-xs text-muted">
          Leave all unchecked to show every rental. Add and edit rentals (hours, price, slot length)
          via the <strong>Rentals</strong> button in the admin bar.
        </p>
        {resources.length === 0 ? (
          <p className="text-xs text-muted">No rentals set up yet.</p>
        ) : (
          resources.map((r) => (
            <label key={r.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="checkbox"
                checked={selected.includes(r.id)}
                onChange={() => toggleResource(r.id)}
              />
              {r.name}
              {r.hidden && <span className="text-xs text-muted">(hidden)</span>}
            </label>
          ))
        )}
      </div>
    </div>
  );
}
