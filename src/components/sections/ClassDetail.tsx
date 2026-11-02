'use client';

import { useEffect, useMemo, useRef } from 'react';
import { getQueryParam, matchesQuery, scrollToSectionSoon } from '@/lib/urlQuery';
import type { ClassDetailSection } from '@/types/site';
import { useSite } from '@/context/SiteContext';
import ClassDetailBody from './ClassDetailBody';
import { SeperatorWave } from '@/components/SeperatorWave';

export default function ClassDetail({
  id,
  classItemId,
  buyCtaFallback = 'Book Now',
  topWaveType,
  bottomWaveType,
}: ClassDetailSection) {
  const { config } = useSite();

  const classItem = useMemo(
    () => (config?.classes?.classItems ?? []).find((c) => c.id === classItemId) ?? null,
    [config?.classes?.classItems, classItemId]
  );

  // ?class=<class id or name> pointing at this class scrolls here on load
  const sectionRef = useRef<HTMLElement>(null);
  const queryAppliedRef = useRef(false);
  useEffect(() => {
    if (queryAppliedRef.current || !classItem) return;
    queryAppliedRef.current = true;
    const q = getQueryParam('class');
    if (q && matchesQuery(q, classItem.id, classItem.name)) scrollToSectionSoon(sectionRef.current);
  }, [classItem]);

  if (!classItem) return null;

  return (
    <>
    <SeperatorWave type={topWaveType} flip={false} color={'var(--bg)'} />
    <section id={id} ref={sectionRef} className="section">
      <div className="mx-auto max-w-5xl xl:max-w-7xl px-4">
        <ClassDetailBody key={classItem.id} classItem={classItem} buyCtaFallback={buyCtaFallback} />
      </div>
    </section>
    <SeperatorWave type={bottomWaveType} flip={true} color={'var(--bg)'} />
    </>
  );
}
