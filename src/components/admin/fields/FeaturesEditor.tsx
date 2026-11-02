'use client';

import { useCallback, useMemo } from 'react';
import type { AnySection, FeaturesSection, FeatureMeta } from '@/types/site';
import type { EditorProps } from './types';
import { resolveAssetUrl } from '@/lib/assetUrl';
import { useSite } from '@/context/SiteContext';
import { matchesQuery, slugify } from '@/lib/urlQuery';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';

// tiny immutable helper
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

// ─── Link picker (section / sub-page / external + shop & class queries) ───────

type LinkMode = 'none' | 'internal' | 'sub-page' | 'external';
type ParsedLink = { mode: LinkMode; sectionId: string; slug: string; params: URLSearchParams; external: string };

// "/about?class=x", "/#shop", "#shop", "/?category=y#shop", "https://…"
function parseLink(href: string): ParsedLink {
  const empty = { sectionId: '', slug: '', params: new URLSearchParams(), external: '' };
  if (!href) return { mode: 'none', ...empty };
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')) return { mode: 'external', ...empty, external: href };
  const [beforeHash, hash = ''] = href.split('#');
  const [path, qs = ''] = beforeHash.split('?');
  const params = new URLSearchParams(qs);
  if (path === '' || path === '/') return { mode: 'internal', ...empty, sectionId: hash, params };
  if (path.startsWith('/')) return { mode: 'sub-page', ...empty, slug: path.replace(/^\/+/, ''), params };
  return { mode: 'external', ...empty, external: href };
}

function buildLink(p: ParsedLink): string {
  const qs = p.params.toString();
  const query = qs ? `?${qs}` : '';
  if (p.mode === 'internal') return `/${query}${p.sectionId ? `#${p.sectionId}` : ''}`;
  if (p.mode === 'sub-page') return p.slug ? `/${p.slug}${query}` : '';
  if (p.mode === 'external') return p.external;
  return '';
}

/**
 * Features item link: pick a home-page section, a sub-page, or an external URL. When the
 * target page has a shop or classes section, offer the ?category / ?search / ?class
 * queries those sections read on load (see src/lib/urlQuery.ts).
 */
function FeatureLinkField({ value, onChange }: { value: string; onChange: (href: string) => void }) {
  const { config } = useSite();
  const link = parseLink(value);

  // Dedupe by id: duplicate section ids (bad data) would crash the dropdown on a duplicate key
  const homeSections = useMemo(() => {
    const seen = new Set<string>();
    return (config?.sections ?? []).filter((s) => s.id && (seen.has(s.id) ? false : (seen.add(s.id), true)));
  }, [config?.sections]);
  const pages = config?.pages ?? [];

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of config?.products?.items ?? []) if (p.category && !p.hideFromShop) set.add(p.category);
    return [...set];
  }, [config?.products?.items]);
  const classItems = (config?.classes?.classItems ?? []).filter((c) => (c.times ?? []).length > 0);

  // Which queries make sense depends on what's on the target page
  const targetSections: AnySection[] =
    link.mode === 'internal'
      ? homeSections
      : link.mode === 'sub-page'
        ? pages.find((pg) => pg.slug.replace(/^\/+/, '') === link.slug)?.sections ?? []
        : [];
  const hasShop = targetSections.some((s) => s.type === 'productShop');
  const hasClasses = targetSections.some((s) => s.type === 'classList' || s.type === 'classDetail');

  const update = (patch: Partial<ParsedLink>) => onChange(buildLink({ ...link, ...patch }));
  const setParam = (key: string, val: string) => {
    const params = new URLSearchParams(link.params);
    if (val) params.set(key, val);
    else params.delete(key);
    update({ params });
  };

  const categoryParam = link.params.get('category') ?? '';
  const selectedCategory = categories.find((c) => matchesQuery(categoryParam, c)) ?? '';
  const classParam = link.params.get('class') ?? '';
  const selectedClass = classItems.find((c) => matchesQuery(classParam, c.id, c.name));

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Link (optional)</label>
      <div className="flex flex-wrap gap-2">
        <select
          className="select w-44"
          value={link.mode}
          onChange={(e) => {
            const mode = e.target.value as LinkMode;
            const fresh = { sectionId: '', slug: '', params: new URLSearchParams(), external: '' };
            if (mode === 'internal') update({ mode, ...fresh, sectionId: homeSections[0]?.id ?? '' });
            else if (mode === 'sub-page') update({ mode, ...fresh, slug: pages[0]?.slug.replace(/^\/+/, '') ?? '' });
            else update({ mode, ...fresh });
          }}
        >
          <option value="none">No link</option>
          <option value="internal">Home page section</option>
          <option value="sub-page">Sub-page</option>
          <option value="external">External URL</option>
        </select>

        {link.mode === 'internal' && (
          <select className="select flex-1 min-w-[12rem]" value={link.sectionId} onChange={(e) => update({ sectionId: e.target.value })}>
            <option value="">Top of page</option>
            {homeSections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.type.charAt(0).toUpperCase() + s.type.slice(1)} • {s.id}
              </option>
            ))}
          </select>
        )}
        {link.mode === 'sub-page' && (
          <select className="select flex-1 min-w-[12rem]" value={link.slug} onChange={(e) => update({ slug: e.target.value, params: new URLSearchParams() })}>
            <option value="">— Select page —</option>
            {pages.map((pg) => {
              const slug = pg.slug.replace(/^\/+/, '');
              return (
                <option key={slug} value={slug}>
                  {pg.title || slug}
                </option>
              );
            })}
          </select>
        )}
        {link.mode === 'external' && (
          <input
            className="input flex-1 min-w-[12rem]"
            value={link.external}
            onChange={(e) => update({ external: e.target.value })}
            placeholder="https://…, mailto:…, tel:…"
          />
        )}
      </div>

      {(hasShop || hasClasses) && (
        <div className="grid md:grid-cols-3 gap-2">
          {hasShop && (
            <>
              <div>
                <label className="block text-xs text-muted">Open shop category</label>
                <select
                  className="select w-full"
                  value={selectedCategory}
                  onChange={(e) => setParam('category', e.target.value ? slugify(e.target.value) : '')}
                >
                  <option value="">All products</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted">Shop search text</label>
                <input
                  className="input w-full"
                  value={link.params.get('search') ?? ''}
                  onChange={(e) => setParam('search', e.target.value)}
                  placeholder="e.g. roses"
                />
              </div>
            </>
          )}
          {hasClasses && (
            <div>
              <label className="block text-xs text-muted">Open class</label>
              <select
                className="select w-full"
                value={selectedClass?.id ?? ''}
                onChange={(e) => {
                  const c = classItems.find((ci) => ci.id === e.target.value);
                  setParam('class', c ? slugify(c.name) : '');
                }}
              >
                <option value="">First class (default)</option>
                {classItems.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {value && (
        <div className="text-xs text-muted truncate" title={value}>
          Link: <code>{value}</code>
        </div>
      )}
    </div>
  );
}

export default function EditFeatures({
  section,
  onChange,
  openMediaPicker,
  siteId, // not required but available if you want to scope picker prefixes
}: EditorProps<FeaturesSection>) {
  const items = section.items ?? [];

  const updateItem = useCallback(
    <K extends keyof FeaturesSection['items'][number]>(
      idx: number,
      key: K,
      value: FeaturesSection['items'][number][K]
    ) => {
      const copy = deepClone(section);
      copy.items[idx] = { ...(copy.items[idx] ?? {}), [key]: value };
      onChange(copy);
    },
    [onChange, section]
  );

  const addItem = useCallback(() => {
    const copy = deepClone(section);
    copy.items = [
      ...(copy.items ?? []),
      {
        title: 'New Feature',
        body: '',
        icon: '',
        link: '',
        imageUrl: '',
        imageSize: 'md',
        meta: [],
      },
    ];
    onChange(copy);
  }, [onChange, section]);

  const removeItem = useCallback(
    (idx: number) => {
      const copy = deepClone(section);
      copy.items = (copy.items ?? []).filter((_, i) => i !== idx);
      onChange(copy);
    },
    [onChange, section]
  );

  const moveItem = useCallback(
    (from: number, to: number) => {
      if (to < 0 || to >= items.length) return;
      const copy = deepClone(section);
      const arr = copy.items ?? [];
      const [spliced] = arr.splice(from, 1);
      arr.splice(to, 0, spliced);
      copy.items = arr;
      onChange(copy);
    },
    [items.length, onChange, section]
  );

  // ---- Meta helpers
  const addMeta = useCallback(
    (idx: number) => {
      const copy = deepClone(section);
      const metas = copy.items[idx].meta ?? [];
      metas.push({ label: '', value: '' });
      copy.items[idx].meta = metas;
      onChange(copy);
    },
    [onChange, section]
  );

  const updateMeta = useCallback(
    (
      itemIdx: number,
      metaIdx: number,
      patch: Partial<FeatureMeta>
    ) => {
      const copy = deepClone(section);
      const metas = copy.items[itemIdx].meta ?? [];
      metas[metaIdx] = { ...(metas[metaIdx] ?? { label: '', value: '' }), ...patch };
      copy.items[itemIdx].meta = metas;
      onChange(copy);
    },
    [onChange, section]
  );

  const removeMeta = useCallback(
    (itemIdx: number, metaIdx: number) => {
      const copy = deepClone(section);
      const metas = (copy.items[itemIdx].meta ?? []).filter((_, i) => i !== metaIdx);
      copy.items[itemIdx].meta = metas;
      onChange(copy);
    },
    [onChange, section]
  );

  return (
    <div className="space-y-5">
      {/* Section title */}
      <div>
        <label className="block text-sm font-medium">Section Title</label>
        <input
          className="input w-full"
          value={section.title ?? ''}
          onChange={(e) => onChange({ ...section, title: e.target.value })}
          placeholder="What we create"
        />
      </div>

      {/* Whole-card links */}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={section.cardLink === true}
          onChange={(e) => onChange({ ...section, cardLink: e.target.checked })}
          className="accent-[var(--admin-primary)]"
        />
        Make the whole card the link (hides the &quot;Learn more&quot; buttons)
      </label>

      {/* Card text position */}
      <div>
        <label className="block text-sm font-medium">Card text position</label>
        <select
          className="select w-full max-w-xs"
          value={section.contentPosition ?? 'below'}
          onChange={(e) => onChange({ ...section, contentPosition: e.target.value as 'below' | 'above' })}
        >
          <option value="below">Title &amp; body below the image</option>
          <option value="above">Title &amp; body above the image</option>
        </select>
      </div>

      {/* Items header */}
      <div className="flex items-center justify-between">
        <div className="font-medium">Items ({items.length})</div>
        <button className="btn btn-inverted" onClick={addItem}>
          <FontAwesomeIcon icon={faPlus} className="text-xs" />Add item
        </button>
      </div>

      {/* Items list */}
      <div className="space-y-4">
        {items.map((it, i) => (
          <div key={`feature-${i}`} className="card admin-card card-solid p-3 space-y-3">
            {/* Move & remove */}
            <div className="flex items-center justify-between">
              <div className="font-semibold">Item {i + 1}</div>
              <div className="flex items-center gap-2">
                <button className="btn btn-ghost" onClick={() => moveItem(i, i - 1)} disabled={i === 0}>
                  ↑
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => moveItem(i, i + 1)}
                  disabled={i === items.length - 1}
                >
                  ↓
                </button>
                <button className="btn btn-ghost" onClick={() => removeItem(i)}>
                  <FontAwesomeIcon icon={faTrash} className="text-sm" />
                </button>
              </div>
            </div>

            {/* Title / Link */}
            <div>
              <label className="block text-sm font-medium">Title</label>
              <input
                className="input w-full"
                value={it.title}
                onChange={(e) => updateItem(i, 'title', e.target.value)}
                placeholder="Agentic AI"
              />
            </div>

            <FeatureLinkField value={it.link ?? ''} onChange={(href) => updateItem(i, 'link', href)} />

            <div>
              <label className="block text-sm font-medium">Body</label>
              <textarea
                className="textarea w-full"
                value={it.body ?? ''}
                onChange={(e) => updateItem(i, 'body', e.target.value)}
                placeholder="Short description"
              />
            </div>

            {/* Icon / Image */}
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium">Icon (optional)</label>
                <input
                  className="input w-full"
                  value={it.icon ?? ''}
                  onChange={(e) => updateItem(i, 'icon', e.target.value)}
                  placeholder="e.g. lucide:flower2"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-medium">Image URL (optional)</label>
                <div className="h-28 w-28 aspect-square overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                  {it.imageUrl ? (
                    <img
                      src={resolveAssetUrl(it.imageUrl) ?? it.imageUrl}
                      alt="Image preview"
                      className="admin-image-preview"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs text-muted">
                      No image selected
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    value={it.imageUrl ?? ''}
                    onChange={(e) => updateItem(i, 'imageUrl', e.target.value)}
                    placeholder="https://… or S3 key"
                  />
                  <button
                    type="button"
                    className="btn btn-inverted"
                    onClick={async () => {
                      const picked = await openMediaPicker(`configs/${siteId}/assets/`);
                      if (picked) updateItem(i, 'imageUrl', picked);
                    }}
                  >
                    Pick…
                  </button>
                </div>
              </div>
            </div>

            {/* Image size */}
            <div>
              <label className="block text-sm font-medium">Image Size</label>
              <select
                className="select w-full md:w-48"
                value={it.imageSize ?? 'md'}
                onChange={(e) =>
                  updateItem(i, 'imageSize', e.target.value as NonNullable<typeof it.imageSize>)
                }
              >
                <option value="sm">sm</option>
                <option value="md">md</option>
                <option value="lg">lg</option>
              </select>
            </div>

            {/* Meta key/values */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Meta (label/value pairs)</div>
                <button className="btn btn-ghost" onClick={() => addMeta(i)}>
                  <FontAwesomeIcon icon={faPlus} className="text-xs" />Add meta
                </button>
              </div>

              <div className="grid gap-2">
                {(it.meta ?? []).map((m, mi) => (
                  <div key={`meta-${i}-${mi}`} className="grid md:grid-cols-[1fr_1fr_auto] gap-2">
                    <input
                      className="input"
                      placeholder="label (e.g. Stem type)"
                      value={m.label}
                      onChange={(e) => updateMeta(i, mi, { label: e.target.value })}
                    />
                    <input
                      className="input"
                      placeholder="value (e.g. Peony)"
                      value={m.value}
                      onChange={(e) => updateMeta(i, mi, { value: e.target.value })}
                    />
                    <button className="btn btn-ghost" onClick={() => removeMeta(i, mi)}>
                      <FontAwesomeIcon icon={faTrash} className="text-sm" />
                    </button>
                  </div>
                ))}
                {(it.meta ?? []).length === 0 && (
                  <div className="text-sm text-muted">No meta yet.</div>
                )}
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-sm text-muted">No items yet. Click “Add item”.</div>
        )}
      </div>
    </div>
  );
}
