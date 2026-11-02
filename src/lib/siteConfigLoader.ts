// src/lib/siteConfigLoader.ts
// The one place the live site config is loaded on the server. Used by the root
// layout (what the storefront renders) AND by the payment routes (what gets
// charged), so both always read the same variant through the same path and
// fall back to the same bundled mock.
import type { SiteConfig } from "@/types/site";
import { mockSiteConfig } from "@/mocks/NormimedspaConfig";

// Moved verbatim from app/layout.tsx — behavior unchanged.
export async function getSiteConfig(): Promise<SiteConfig> {
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK === "1" || process.env.NEXT_PUBLIC_USE_MOCK === "2";
  if (useMock) return mockSiteConfig;

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  const site = process.env.NEXT_PUBLIC_SITE_ID ?? "normis-med-spa";
  const prefer = (process.env.NEXT_PUBLIC_CONFIG_VARIANT ?? "published") as "published" | "published";
  const fallback = prefer === "published" ? "published" : "published";

  async function fetchJSON(url: string) {
    // Network failures (bad/unreachable NEXT_PUBLIC_BASE_URL, DNS, TLS) must fall
    // through to the mock instead of crashing every page render.
    try {
      const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5000) });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.warn(`[config] ${url} -> ${res.status}`, text?.slice(0, 200));
        return null;
      }
      return (await res.json()) as SiteConfig;
    } catch (err) {
      console.warn(`[config] ${url} -> fetch failed`, err);
      return null;
    }
  }

  // try preferred variant for this site id
  const primary = await fetchJSON(`${base}/api/config?variant=${prefer}&site=${encodeURIComponent(site)}`);
  if (primary) return primary;

  // then the other variant
  const secondary = await fetchJSON(`${base}/api/config?variant=${fallback}&site=${encodeURIComponent(site)}`);
  if (secondary) return secondary;

  console.warn("[config] Falling back to mockSiteConfig");
  return mockSiteConfig;
}
