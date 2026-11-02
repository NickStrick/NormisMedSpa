import { BUSINESS, DEFAULT_DESCRIPTION, SITE_URL } from "@/lib/seo";

export default function SeoLocalBusinessSchema() {
  // Only include address parts that have been filled in
  const address = Object.fromEntries(
    Object.entries(BUSINESS.location).filter(([, v]) => v)
  );
  const hasAddress = Object.keys(address).some((k) => k !== "addressCountry");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    "@id": `${SITE_URL}/#business`,
    "name": BUSINESS.name,
    "alternateName": BUSINESS.shortName,
    "description": DEFAULT_DESCRIPTION,
    "url": SITE_URL,
    "image": `${SITE_URL}${BUSINESS.ogImage}`,
    "logo": `${SITE_URL}${BUSINESS.ogImage}`,
    ...(BUSINESS.email ? { "email": BUSINESS.email } : {}),
    ...(BUSINESS.phone ? { "telephone": BUSINESS.phone } : {}),
    ...(hasAddress ? { "address": { "@type": "PostalAddress", ...address } } : {}),
    "knowsLanguage": BUSINESS.languages,
    "makesOffer": BUSINESS.services.map((name) => ({
      "@type": "Offer",
      "itemOffered": { "@type": "Service", "name": name },
    })),
    "sameAs": BUSINESS.sameAs,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
