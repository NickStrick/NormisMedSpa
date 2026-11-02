'use client';

import { useSite } from '@/context/SiteContext';
import { SectionRenderer } from '@/components/SectionRenderer';
import { getRenderableSections } from '@/lib/siteConfigSections';

export default function ClientPage() {
  const { config, isLoading } = useSite();

  if (isLoading || !config) {
    return (
      <main className="bg-app">
        <div className="section">Loading…</div>
      </main>
    );
  }
//   if (error) {
//     return (
//       <main className="bg-app">
//         <div className="section text-red-600">Error: {error}</div>
//       </main>
//     );
//   }

  // SiteContext moves header/footer out of `sections`; this adds them back around the body.
  const sections = getRenderableSections(config);

  return (
    <main className="bg-main">
      {sections.length ? (
        sections.map((s) => <SectionRenderer key={s.id ?? Math.random()} section={s} />)
      ) : (
        <div className="section">No sections configured.</div>
      )}
    </main>
  );
}
