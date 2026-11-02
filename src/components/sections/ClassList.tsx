'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getQueryParam, matchesQuery, scrollToSectionSoon } from '@/lib/urlQuery';
import type { ClassListSection } from '@/types/site';
import { useSite } from '@/context/SiteContext';
import ClassDetailBody from './ClassDetailBody';
import { SeperatorWave } from '@/components/SeperatorWave';

export default function ClassList({
  id,
  title,
  subtitle,
  buyCtaFallback = 'Book Now',
  topWaveType,
  bottomWaveType,
}: ClassListSection) {
  const { config } = useSite();

  // Only classes with at least one scheduled time qualify — mirrors the
  // resolution ClassDetailBody/ClassTimePicker use, so a class never shows a
  // tab and then an empty "no times" picker underneath.
  const classItems = useMemo(() => {
    const items = config?.classes?.classItems ?? [];
    return items.filter((c) => (c.times ?? []).length > 0);
  }, [config?.classes?.classItems]);

  const [activeTab, setActiveTab] = useState<string | null>(null);
  useEffect(() => {
    if (classItems.length === 0) return;
    if (!activeTab || !classItems.some((c) => c.id === activeTab)) {
      setActiveTab(classItems[0].id);
    }
  }, [classItems, activeTab]);

  // ?class=<class id or name> (e.g. ?class=fall-fine-arts-class) opens that class's tab and
  // scrolls here, so other pages can link straight to a class. Applied once on load.
  const sectionRef = useRef<HTMLElement>(null);
  const queryAppliedRef = useRef(false);
  useEffect(() => {
    if (queryAppliedRef.current || classItems.length === 0) return;
    queryAppliedRef.current = true;
    const q = getQueryParam('class');
    const match = q ? classItems.find((c) => matchesQuery(q, c.id, c.name)) : undefined;
    if (!match) return;
    setActiveTab(match.id);
    scrollToSectionSoon(sectionRef.current);
  }, [classItems]);

  const selected = classItems.find((c) => c.id === activeTab) ?? classItems[0] ?? null;

  if (!selected) return null;

  return (
    <>
    <SeperatorWave type={topWaveType} flip={false} color={'var(--bg)'} />
    <section id={id} ref={sectionRef} className="section">
      <div className="mx-auto max-w-5xl xl:max-w-7xl px-4">
        {(title || subtitle) && (
          <div className="mb-10 text-center">
            {title && <h2 className="h-display mt-2">{title}</h2>}
            {subtitle && <p className="mt-4 h-hero-p opacity-80 max-w-2xl mx-auto text-muted">{subtitle}</p>}
          </div>
        )}

        {classItems.length > 1 && (
          <div className="mb-10 flex flex-wrap gap-3 justify-center border-b border-[var(--text-1)]/15 pb-6">
            {classItems.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveTab(c.id)}
                className={
                  c.id === selected.id
                    ? 'rounded-full bg-[var(--primary)] px-6 py-3 text-base font-bold text-[var(--text-2)] shadow-md transition-transform hover:-translate-y-0.5'
                    : 'rounded-full border-2 border-[var(--text-1)] text-[var(--text-1)] px-6 py-3 text-base font-bold transition-colors hover:bg-[var(--accent)] hover:text-white'
                }
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        <ClassDetailBody key={selected.id} classItem={selected} buyCtaFallback={buyCtaFallback} />
      </div>
    </section>
    <SeperatorWave type={bottomWaveType} flip={true} color={'var(--bg)'} />
    </>
  );
}
