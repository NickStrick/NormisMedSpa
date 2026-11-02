// src/lib/seo.ts
// Single source of truth for business identity + search metadata
// (layout metadata, robots, sitemap, LocalBusiness JSON-LD, per-page titles).

// TODO: set NEXT_PUBLIC_SITE_URL (or this default) once the real domain is chosen.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.normismedspa.com').replace(/\/$/, '');

export const BUSINESS = {
  name: "Normi's Med Spa",
  shortName: "Normi's",
  // TODO: fill in before launch — blank fields are left out of the JSON-LD.
  email: '',
  phone: '',
  location: {
    streetAddress: '',
    addressLocality: 'Chicago',
    addressRegion: 'IL',
    postalCode: '',
    addressCountry: 'US',
  },
  languages: ['en', 'es'],
  services: ['Injectables', 'Facial lifting', 'Facials and peels', 'Tattoo removal', 'Medical-grade skincare'],
  sameAs: [
    'https://www.instagram.com/normii06_/',
  ],
  // Bump ?v= when the share image changes so social apps drop their cached preview.
  ogImage: '/NormisMedSpa/normis-og.jpg?v=1',
} as const;

export const DEFAULT_TITLE = "Normi's Med Spa | Nurse-Led Aesthetics in Belmont Cragin, Chicago";
export const DEFAULT_DESCRIPTION =
  "Normi's Med Spa offers injectables, facial lifting, facials, peels, and removals with Norma Ortiz, RN, plus medical-grade skincare. Care in English or Spanish. Book a free consult in Belmont Cragin, Chicago.";

export const KEYWORDS = [
  "Normi's Med Spa",
  'Normis Med Spa',
  'Norma Ortiz RN',
  'med spa Chicago',
  'med spa Belmont Cragin',
  'Belmont Cragin aesthetics',
  'nurse injector Chicago',
  'Latina owned med spa Chicago',
  'Spanish speaking med spa Chicago',
  'med spa se habla español Chicago',
  'Botox Chicago',
  'dermal filler Chicago',
  'facials Chicago',
  'chemical peels Chicago',
  'facial lifting Chicago',
  'tattoo removal Chicago',
  'SkinMedica Chicago',
];

/** Per-route search titles/descriptions. Keys are page slugs ('' = home). */
// Keep in sync with `pages` in src/mocks/NormimedspaConfig.ts.
export const PAGE_SEO: Record<string, { title: string; description: string }> = {
  treatments: {
    title: 'Treatments',
    description: "Injectables, facial lifting, facials, peels, and removals at Normi's Med Spa, with a personal plan from Norma Ortiz, RN.",
  },
  shop: {
    title: 'Shop Skincare',
    description: "Shop medical-grade SkinMedica skincare from Normi's Med Spa. Order online and pick up in Belmont Cragin, Chicago.",
  },
  book: {
    title: 'Book a Free Consult',
    description: "Book a free consultation with Norma Ortiz, RN at Normi's Med Spa in Belmont Cragin, Chicago.",
  },
  'custom-requests': {
    title: 'Custom Requests',
    description: "Request a custom treatment plan, group event, or special product order from Normi's Med Spa.",
  },
  about: {
    title: 'About Norma',
    description: "Meet Norma Ortiz, RN, the first-generation Latina nurse who founded Normi's Med Spa to help her community build confidence.",
  },
  contact: {
    title: 'Contact',
    description: "Contact Normi's Med Spa in Belmont Cragin, Chicago with questions about treatments, orders, or your visit.",
  },
};

/** Routes to list in sitemap.xml. */
export const SITEMAP_ROUTES = ['', ...Object.keys(PAGE_SEO)];
