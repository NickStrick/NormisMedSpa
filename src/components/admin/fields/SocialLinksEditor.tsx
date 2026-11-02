'use client';

import { useCallback } from 'react';
import type { GlobalSocialLink, SocialItem } from '@/types/site';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown, faTrash, faPlus, faCircleQuestion } from '@fortawesome/free-solid-svg-icons';
import { useSite } from '@/context/SiteContext';
import { SOCIAL_LINKS_HELP, SOCIAL_PLATFORMS, getUsableGlobalSocialLinks } from '@/lib/socialLinks';

const ALL_TYPES = SOCIAL_PLATFORMS;
const CUSTOM = '__custom';

// optional light normalization for email type
export const normalizeHref = (t: SocialItem['type'], href: string) => {
  if (t === 'email') {
    // if plain email, prepend mailto:
    if (href && !href.startsWith('mailto:') && !href.includes('://')) {
      return `mailto:${href}`;
    }
  }
  return href;
};

// Shared list editor for social links — used by the Socials section editor
// and Settings → General → Site Availability. Each row either points at a
// Settings → General → Social Media link (globalId) or is a custom link.
export default function SocialLinksEditor({
  items,
  onChange,
  globalLinks: globalLinksProp,
}: {
  items: SocialItem[];
  onChange: (items: SocialItem[]) => void;
  /** Settings links to offer; defaults to the live site config's (SettingsModal passes its draft's). */
  globalLinks?: GlobalSocialLink[];
}) {
  const { config } = useSite();
  const globalLinks = globalLinksProp ?? getUsableGlobalSocialLinks(config);

  const addItem = useCallback(() => {
    // Default new rows to the first Settings link when there is one
    const first = globalLinks[0];
    onChange([
      ...items,
      first
        ? { type: first.type, href: first.href, label: '', globalId: first.id }
        : { type: 'instagram', href: '', label: '' },
    ]);
  }, [onChange, items, globalLinks]);

  const removeItem = useCallback(
    (idx: number) => {
      onChange(items.filter((_, i) => i !== idx));
    },
    [onChange, items]
  );

  const moveItem = useCallback(
    (from: number, to: number) => {
      if (to < 0 || to >= items.length) return;
      const arr = [...items];
      const [spliced] = arr.splice(from, 1);
      arr.splice(to, 0, spliced);
      onChange(arr);
    },
    [onChange, items]
  );

  const updateItem = useCallback(
    (idx: number, patch: Partial<SocialItem>) => {
      onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
    },
    [onChange, items]
  );

  return (
    <div className="space-y-3">
      {/* Items header */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium flex items-center gap-2">
          Links ({items.length})
          <span className="cursor-help text-muted" title={SOCIAL_LINKS_HELP} aria-label={SOCIAL_LINKS_HELP}>
            <FontAwesomeIcon icon={faCircleQuestion} className="text-sm" />
          </span>
        </div>
        <button className="btn btn-ghost" onClick={addItem}>
          <FontAwesomeIcon icon={faPlus} className="text-xs" />
          Add link
        </button>
      </div>

      {/* Items list */}
      <div className="space-y-3">
        {items.map((it, i) => {
          const hrefPlaceholder =
            it.type === 'email'
              ? 'name@example.com or mailto:name@example.com'
              : it.type === 'website'
              ? 'https://example.com'
              : `https://...`;

          const linked = it.globalId ? globalLinks.find((l) => l.id === it.globalId) : undefined;

        return (
          <div key={`social-${i}`} className="card admin-card card-solid p-3 space-y-3">
            <div className="grid md:grid-cols-[1fr_1fr_2fr_1fr_auto_auto_auto] gap-2">
              <select
                className="select"
                value={it.globalId ?? CUSTOM}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === CUSTOM) {
                    updateItem(i, { globalId: undefined });
                    return;
                  }
                  const link = globalLinks.find((l) => l.id === v);
                  if (link) updateItem(i, { globalId: link.id, type: link.type, href: link.href });
                }}
                title="Pick a link from Settings → General → Social Media, or Custom"
              >
                {globalLinks.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name || 'Untitled link'}
                  </option>
                ))}
                {it.globalId && !linked && (
                  <option value={it.globalId}>Missing link — pick another</option>
                )}
                <option value={CUSTOM}>Custom</option>
              </select>

              {it.globalId ? (
                <div className="md:col-span-2 text-sm text-muted self-center truncate" title={linked?.href}>
                  {linked ? linked.href : 'Not set in Settings — this link is hidden on the site.'}
                </div>
              ) : (
                <>
                  <select
                    className="select"
                    value={it.type}
                    onChange={(e) => updateItem(i, { type: e.target.value as SocialItem['type'] })}
                    title="Platform"
                  >
                    {ALL_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>

                  <input
                    className="input"
                    placeholder={hrefPlaceholder}
                    value={it.href}
                    onChange={(e) => updateItem(i, { href: normalizeHref(it.type, e.target.value) })}
                  />
                </>
              )}

              <input
                className="input"
                placeholder="Optional label"
                value={it.label ?? ''}
                onChange={(e) => updateItem(i, { label: e.target.value })}
              />

              <button
                className="btn btn-ghost"
                onClick={() => moveItem(i, i - 1)}
                disabled={i === 0}
                title="Move up"
              >
                 <FontAwesomeIcon icon={faChevronUp} className="text-sm" />
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => moveItem(i, i + 1)}
                disabled={i === items.length - 1}
                title="Move down"
              >
                <FontAwesomeIcon icon={faChevronDown} className="text-sm" />
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => removeItem(i)}
                title="Remove"
              >
                <FontAwesomeIcon icon={faTrash} className="text-sm" />
              </button>
            </div>
          </div>
        );})}

        {items.length === 0 && (
          <div className="text-sm text-muted">No links yet. Click “Add link”.</div>
        )}
      </div>
    </div>
  );
}
