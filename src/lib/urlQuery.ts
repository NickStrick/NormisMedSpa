// URL query helpers so other pages can link straight into a section, e.g.
//   /shop?category=bouquets&search=roses   (ProductShop)
//   /classes?class=fall-fine-arts-class    (ClassList / ClassDetail)

/** A trimmed query param from the current URL (client only), or null when absent/empty. */
export function getQueryParam(name: string): string | null {
  if (typeof window === 'undefined') return null;
  const value = new URLSearchParams(window.location.search).get(name)?.trim();
  return value ? value : null;
}

/** "Fall Fine Arts Class" → "fall-fine-arts-class" */
export function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** True when the query value matches any candidate (an id or a display name), ignoring case/spaces/punctuation. */
export function matchesQuery(value: string, ...candidates: (string | undefined)[]): boolean {
  const q = slugify(value);
  return !!q && candidates.some((c) => !!c && slugify(c) === q);
}

/** Smooth-scrolls a section into view after the page has settled (images/fonts shifting layout). */
export function scrollToSectionSoon(el: HTMLElement | null, delayMs = 300) {
  if (!el) return;
  window.setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), delayMs);
}
