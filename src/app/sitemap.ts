import type { MetadataRoute } from 'next';
import { SITE_URL, SITEMAP_ROUTES } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  return SITEMAP_ROUTES.map((route) => ({
    url: `${SITE_URL}/${route}`,
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.8,
  }));
}
