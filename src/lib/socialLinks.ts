import type {
  AnySection,
  ContactSection,
  GlobalSocialLink,
  SiteConfig,
  SiteDisabledSettings,
  SocialItem,
  SocialsSection,
} from '@/types/site';

// Settings → General → Social Media: one set of links the whole site can reference.
// Sections store a `globalId` instead of a copied URL, so editing a link in
// Settings updates it everywhere it's used.

export const SOCIAL_PLATFORMS: SocialItem['type'][] = [
  'instagram',
  'facebook',
  'linkedin',
  'x',
  'youtube',
  'tiktok',
  'email',
  'website',
];

/** Hover help shown next to the social link dropdowns in the section editors. */
export const SOCIAL_LINKS_HELP =
  'Pick a universal link or "Custom". Add or edit universal links in the admin bar: Settings → General → Social Media. Changes there update every section that uses them.';

export const SOCIAL_PLATFORM_NAMES: Record<SocialItem['type'], string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  x: 'X',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  email: 'Email',
  website: 'Website',
};

/** Reads settings.general.socialLinks defensively — `general` is free-form JSON. */
export function getGlobalSocialLinks(config: SiteConfig | null | undefined): GlobalSocialLink[] {
  const raw = config?.settings?.general?.socialLinks;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (l): l is GlobalSocialLink =>
      !!l && typeof l === 'object' && typeof (l as GlobalSocialLink).id === 'string' && typeof (l as GlobalSocialLink).href === 'string'
  );
}

/** Links that are filled in, i.e. the options offered in section dropdowns. */
export function getUsableGlobalSocialLinks(config: SiteConfig | null | undefined): GlobalSocialLink[] {
  return getGlobalSocialLinks(config).filter((l) => l.href.trim());
}

/** The Settings link an item points at, or null when it's a custom link / the Settings link was cleared. */
export function findGlobalSocialLink(globalId: string | undefined, links: GlobalSocialLink[]): GlobalSocialLink | null {
  if (!globalId) return null;
  const link = links.find((l) => l.id === globalId);
  return link && link.href.trim() ? link : null;
}

const sameHref = (a: string, b: string) =>
  a.trim().replace(/\/+$/, '').toLowerCase() === b.trim().replace(/\/+$/, '').toLowerCase();

/**
 * Connects existing custom social rows (Socials, Contact, footer, Site Unavailable)
 * whose URL exactly matches a Settings link, so they follow Settings from now on.
 * Run on every admin save (see saveAdminConfig); rows already linked are left alone.
 */
export function linkMatchingSocials(config: SiteConfig): SiteConfig {
  const links = getUsableGlobalSocialLinks(config);
  if (!links.length) return config;

  const linkItems = <T extends { href: string; globalId?: string }>(items: T[]): T[] =>
    items.map((it) => {
      if (it.globalId || !it.href) return it;
      const match = links.find((l) => sameHref(l.href, it.href));
      return match ? { ...it, globalId: match.id } : it;
    });

  const linkSection = (s: AnySection): AnySection => {
    if (s.type === 'socials') {
      const ss = s as SocialsSection;
      return ss.items ? { ...ss, items: linkItems(ss.items) } : ss;
    }
    if (s.type === 'contact') {
      const cs = s as ContactSection;
      return cs.socials ? { ...cs, socials: linkItems(cs.socials) } : cs;
    }
    return s;
  };

  const next: SiteConfig = {
    ...config,
    sections: (config.sections ?? []).map(linkSection),
  };
  if (config.pages) {
    next.pages = config.pages.map((p) => ({ ...p, sections: (p.sections ?? []).map(linkSection) }));
  }
  if (config.footer?.columns) {
    next.footer = {
      ...config.footer,
      columns: config.footer.columns.map((c) => ({ ...c, links: linkItems(c.links ?? []) })),
    };
  }
  const general = config.settings?.general;
  const siteDisabled = general?.siteDisabled as SiteDisabledSettings | undefined;
  if (general && siteDisabled?.socials?.length) {
    next.settings = {
      ...config.settings,
      general: { ...general, siteDisabled: { ...siteDisabled, socials: linkItems(siteDisabled.socials) } },
    };
  }
  return next;
}

/**
 * Resolves Settings-linked items to their current type/href. Items pointing at a
 * Settings link that no longer exists (or is empty) are dropped, not shown broken.
 */
export function resolveSocialItems(items: SocialItem[], links: GlobalSocialLink[]): SocialItem[] {
  return items.flatMap((it) => {
    if (!it.globalId) return [it];
    const link = findGlobalSocialLink(it.globalId, links);
    return link ? [{ ...it, type: link.type, href: link.href }] : [];
  });
}
