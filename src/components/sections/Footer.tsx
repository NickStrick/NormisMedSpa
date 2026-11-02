'use client';
import type { FooterSection } from '@/types/site';
import Link from 'next/link';
import AnimatedSection from '@/components/AnimatedSection';
import { useSite } from '@/context/SiteContext';
import { findGlobalSocialLink, getGlobalSocialLinks } from '@/lib/socialLinks';
import { findGlobalPhone, getGlobalPhones, phoneHref } from '@/lib/phoneNumbers';

function normalizeNavHref(href: string) {
  if (!href || href === '' || href === '/') {
    return { linkHref: '/', hashHref: '#top' };
  }
  if (href.startsWith('#')) {
    return { linkHref: `/${href}`, hashHref: href };
  }
  if (href.startsWith('/#')) {
    return { linkHref: href, hashHref: href.slice(1) };
  }
  return { linkHref: href, hashHref: href };
}


export function Footer({ columns = [], legal }: FooterSection) {
  // "Social" links point at Settings → General → Social Media; hidden if that link was cleared.
  const { config } = useSite();
  const globalLinks = getGlobalSocialLinks(config);
  // "Phone" links point at Settings → General → Phone Numbers; hidden if that number was removed.
  const globalPhones = getGlobalPhones(config);

  return (
    <AnimatedSection className="section bg-gradient-2">
      <div className="mx-auto max-w-6xl grid md:grid-cols-4 gap-8">
        {columns.map((c, i) => (
          <div key={i}>
            {c.title ? <div className="font-semibold mb-3">{c.title}</div> : null}
            <ul className="space-y-2 text-muted">
              {c.links.map((l,i) => {
                if (l.phoneId) {
                  const phone = findGlobalPhone(l.phoneId, globalPhones);
                  if (!phone) return null;
                  return (
                    <li key={l.label+i}>
                      <a className="hover:text-fg transition-colors" href={phoneHref(phone.number)}>
                        {l.label || phone.number}
                      </a>
                    </li>
                  );
                }
                if (l.globalId) {
                  const social = findGlobalSocialLink(l.globalId, globalLinks);
                  if (!social) return null;
                  const isEmail = social.type === 'email';
                  return (
                    <li key={l.label+i}>
                      <a
                        className="hover:text-fg transition-colors"
                        href={social.href}
                        target={isEmail ? undefined : '_blank'}
                        rel={isEmail ? undefined : 'noreferrer'}
                      >
                        {l.label || social.name}
                      </a>
                    </li>
                  );
                }
                return (
                <li key={l.label+i}>
                  <Link className="hover:text-fg transition-colors" href={normalizeNavHref(l.href).linkHref}>{l.label}</Link>
                </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      {legal ? <p className="text-center text-sm text-muted mt-8">{legal}</p> : null}
    </AnimatedSection>
  );
}
