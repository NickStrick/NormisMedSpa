'use client';

import { useSite } from '@/context/SiteContext';
import { SectionRenderer } from '@/components/SectionRenderer';
import { getRenderablePageSections } from '@/lib/siteConfigSections';

export default function ClientSlugPage({ slug }: { slug: string }) {
  const { config, isLoading } = useSite();

  if (isLoading || !config) {
    return (
      <main className="bg-app">
        <div className="section">Loading…</div>
      </main>
    );
  }

  // Shared header/footer wrap the page's own sections; null means no page has this slug.
  const sections = getRenderablePageSections(config, slug);

  if (!sections) {
    return (
      <main className="bg-main">
        <div className="section text-center">
          <h1 className="text-4xl font-extrabold mb-4">Page not found</h1>
          <a href="/" className="btn btn-primary">Back to Home</a>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-main">
      {sections.map((s) => <SectionRenderer key={s.id ?? Math.random()} section={s} />)}
    </main>
  );
}
