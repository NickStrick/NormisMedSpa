'use client';

import { useCallback } from 'react';
import type { ContactSection } from '@/types/site';
import type { EditorProps } from './types';
import { resolveAssetUrl } from '@/lib/assetUrl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown, faTrash, faPlus, faCircleQuestion } from '@fortawesome/free-solid-svg-icons';
import { useSite } from '@/context/SiteContext';
import { SOCIAL_LINKS_HELP, getUsableGlobalSocialLinks } from '@/lib/socialLinks';
import { PHONE_NUMBERS_HELP, getUsableGlobalPhones, phoneHref } from '@/lib/phoneNumbers';

const CUSTOM = '__custom';

// tiny immutable helper (kept consistent with your other editors)
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

export default function EditContact({
  section,
  onChange,
  openMediaPicker,
  siteId,
}: EditorProps<ContactSection>) {
  const socials = section.socials ?? [];
  // Settings → General → Social Media links offered in each row's dropdown
  const { config } = useSite();
  const globalLinks = getUsableGlobalSocialLinks(config);
  // Settings → General → Phone Numbers offered in the phone dropdown
  const globalPhones = getUsableGlobalPhones(config);
  const linkedPhone = section.phone?.phoneId ? globalPhones.find((p) => p.id === section.phone?.phoneId) : undefined;

  const setField = useCallback(
    <K extends keyof ContactSection>(key: K, value: ContactSection[K]) => {
      onChange({ ...section, [key]: value });
    },
    [onChange, section]
  );

  const updateSocial = useCallback(
    (idx: number, patch: Partial<NonNullable<ContactSection['socials']>[number]>) => {
      const copy = deepClone(section);
      const arr = copy.socials ?? [];
      arr[idx] = { ...(arr[idx] ?? { label: '', href: '' }), ...patch };
      copy.socials = arr;
      onChange(copy);
    },
    [onChange, section]
  );

  const addSocial = useCallback(() => {
    const copy = deepClone(section);
    // Default new rows to the first Settings link when there is one
    const first = globalLinks[0];
    copy.socials = [
      ...(copy.socials ?? []),
      first ? { label: first.name, href: first.href, globalId: first.id } : { label: '', href: '' },
    ];
    onChange(copy);
  }, [onChange, section, globalLinks]);

  const removeSocial = useCallback(
    (idx: number) => {
      const copy = deepClone(section);
      copy.socials = (copy.socials ?? []).filter((_, i) => i !== idx);
      onChange(copy);
    },
    [onChange, section]
  );

  const moveSocial = useCallback(
    (from: number, to: number) => {
      const arr = [...(section.socials ?? [])];
      if (to < 0 || to >= arr.length) return;
      const [spliced] = arr.splice(from, 1);
      arr.splice(to, 0, spliced);
      onChange({ ...section, socials: arr });
    },
    [onChange, section]
  );

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium">Title</label>
        <input
          className="input w-full"
          value={section.title ?? ''}
          onChange={(e) => setField('title', e.target.value)}
          placeholder="How to Find Us"
        />
      </div>

      {/* Email / Address */}
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            className="input w-full"
            value={section.email ?? ''}
            onChange={(e) => setField('email', e.target.value)}
            placeholder="hello@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Address</label>
          <input
            className="input w-full"
            value={section.address ?? ''}
            onChange={(e) => setField('address', e.target.value)}
            placeholder="123 Main St, City, ST"
          />
        </div>
      </div>

      {/* Phone: a Settings number, or Custom (label + href) */}
      <div>
        <label className="text-sm font-medium flex items-center gap-2">
          Phone
          <span className="cursor-help text-muted" title={PHONE_NUMBERS_HELP} aria-label={PHONE_NUMBERS_HELP}>
            <FontAwesomeIcon icon={faCircleQuestion} className="text-sm" />
          </span>
        </label>
        <div className="flex items-center gap-3">
          <select
            className="select max-w-xs"
            value={section.phone?.phoneId ?? CUSTOM}
            onChange={(e) => {
              const v = e.target.value;
              if (v === CUSTOM) {
                setField('phone', { label: section.phone?.label ?? '', href: section.phone?.href ?? '' });
                return;
              }
              const phone = globalPhones.find((p) => p.id === v);
              if (phone) setField('phone', { label: phone.number, href: phoneHref(phone.number), phoneId: phone.id });
            }}
          >
            {globalPhones.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name ? `${p.name} — ${p.number}` : p.number}
              </option>
            ))}
            {section.phone?.phoneId && !linkedPhone && (
              <option value={section.phone.phoneId}>Missing number — pick another</option>
            )}
            <option value={CUSTOM}>Custom</option>
          </select>
          {section.phone?.phoneId && !linkedPhone && (
            <span className="text-sm text-muted">Not set in Settings — the phone is hidden on the site.</span>
          )}
        </div>
      </div>

      {!section.phone?.phoneId && (
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Phone Label</label>
          <input
            className="input w-full"
            value={section.phone?.label ?? ''}
            onChange={(e) =>
              setField('phone', { label: e.target.value, href: section.phone?.href ?? '' })
            }
            placeholder="(773) 209-4805"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Phone Href</label>
          <input
            className="input w-full"
            value={section.phone?.href ?? ''}
            onChange={(e) =>
              setField('phone', { label: section.phone?.label ?? '', href: e.target.value })
            }
            placeholder="tel:17732094805"
          />
        </div>
      </div>
      )}

      {/* Background image + Map embed */}
      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Background URL (optional)</label>
          <div className="h-28 w-28 aspect-square overflow-hidden rounded-md border border-gray-200 bg-gray-50">
            {section.backgroundUrl ? (
              <img
                src={resolveAssetUrl(section.backgroundUrl) ?? section.backgroundUrl}
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
              value={section.backgroundUrl ?? ''}
              onChange={(e) => setField('backgroundUrl', e.target.value)}
              placeholder="https://… or S3 key"
            />
            <button
              type="button"
              className="btn btn-inverted"
              onClick={async () => {
                const picked = await openMediaPicker(`configs/${siteId}/assets/`);
                if (picked) setField('backgroundUrl', picked);
              }}
            >
              Pick…
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Google Map Embed URL (optional)</label>
          <input
            className="input w-full"
            value={section.mapEmbedUrl ?? ''}
            onChange={(e) => setField('mapEmbedUrl', e.target.value)}
            placeholder="https://www.google.com/maps/embed?pb=..."
          />
        </div>
      </div>

      {/* Social links */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium flex items-center gap-2">
            Social Links
            <span className="cursor-help text-muted" title={SOCIAL_LINKS_HELP} aria-label={SOCIAL_LINKS_HELP}>
              <FontAwesomeIcon icon={faCircleQuestion} className="text-sm" />
            </span>
          </div>
          <button className="btn btn-ghost" onClick={addSocial}>
            <FontAwesomeIcon icon={faPlus} className="text-xs" />Add social
          </button>
        </div>

        <div className="space-y-2">
          {socials.map((s, i) => {
            const linked = s.globalId ? globalLinks.find((l) => l.id === s.globalId) : undefined;
            return (
            <div key={`social-${i}`} className="grid md:grid-cols-[1fr_1fr_1fr_auto_auto_auto] gap-2">
              <select
                className="select"
                value={s.globalId ?? CUSTOM}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === CUSTOM) {
                    updateSocial(i, { globalId: undefined });
                    return;
                  }
                  const link = globalLinks.find((l) => l.id === v);
                  if (link) updateSocial(i, { globalId: link.id, label: link.name, href: link.href });
                }}
                title="Pick a link from Settings → General → Social Media, or Custom"
              >
                {globalLinks.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name || 'Untitled link'}
                  </option>
                ))}
                {s.globalId && !linked && <option value={s.globalId}>Missing link — pick another</option>}
                <option value={CUSTOM}>Custom</option>
              </select>
              {s.globalId ? (
                <div className="md:col-span-2 text-sm text-muted self-center truncate" title={linked?.href}>
                  {linked ? `${linked.name} — ${linked.href}` : 'Not set in Settings — this link is hidden on the site.'}
                </div>
              ) : (
                <>
                  <input
                    className="input"
                    placeholder="Label"
                    value={s.label}
                    onChange={(e) => updateSocial(i, { label: e.target.value })}
                  />
                  <input
                    className="input"
                    placeholder="Href (mailto:, https://, /path)"
                    value={s.href}
                    onChange={(e) => updateSocial(i, { href: e.target.value })}
                  />
                </>
              )}
              <button
                className="btn btn-ghost"
                onClick={() => moveSocial(i, i - 1)}
                disabled={i === 0}
                title="Move up"
              >
                 <FontAwesomeIcon icon={faChevronUp} className="text-sm" />
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => moveSocial(i, i + 1)}
                disabled={i === socials.length - 1}
                title="Move down"
              >
                <FontAwesomeIcon icon={faChevronDown} className="text-sm" />
              </button>
              <button className="btn btn-ghost" onClick={() => removeSocial(i)} title="Remove">
                <FontAwesomeIcon icon={faTrash} className="text-sm" />
              </button>
            </div>
            );
          })}
          {socials.length === 0 && (
            <div className="text-sm text-muted">No socials yet. Click “Add social”.</div>
          )}
        </div>
      </div>
    </div>
  );
}
