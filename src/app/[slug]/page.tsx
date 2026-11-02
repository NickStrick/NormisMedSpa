// Server Component by default — no 'use client'
import { Suspense } from 'react';
import type { Metadata } from 'next';
import ClientSlugPage from './ClientSlugPage';
import { PAGE_SEO } from '@/lib/seo';

type Params = { params: Promise<{ slug: string }> };

// Per-page title/description from PAGE_SEO; the layout's title template adds the business name
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const seo = PAGE_SEO[slug];
  if (!seo) return {};
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: `/${slug}` },
    openGraph: { title: seo.title, description: seo.description, url: `/${slug}` },
  };
}

// Custom pages from `config.pages` — each renders at /[slug]
export default async function Page({ params }: Params) {
  const { slug } = await params;
  return (
    <Suspense fallback={<main className="bg-app w-[100vw]"><div className="section w-[100vw]"><span className='loading-span w-[100vw]'>Loading…</span></div></main>}>
      <ClientSlugPage slug={slug} />
    </Suspense>
  );
}
