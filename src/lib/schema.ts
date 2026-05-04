/**
 * JSON-LD schema helpers. Phase 8 will flesh these out with full LocalBusiness,
 * MedicalBusiness, Person, Article, BreadcrumbList, FAQPage, and Event factories.
 * Phase 3 ships the LocalBusiness skeleton + a generic helper so the BaseLayout
 * has something to render in the JSON-LD slot from day one.
 */

import { clinic, owner, site } from './site';

export type JsonLd = Record<string, unknown> | Array<Record<string, unknown>>;

/**
 * LocalBusiness + Chiropractor combined schema (multi-type).
 * Used on home + contact + key landing pages.
 */
export function localBusiness(opts: { url?: string; image?: string } = {}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'MedicalBusiness', 'Chiropractor'],
    '@id': `${site.url}/#localbusiness`,
    name: clinic.brandName,
    legalName: clinic.legalName,
    description: clinic.tagline,
    url: opts.url ?? site.url,
    telephone: clinic.phoneTel,
    email: clinic.email,
    image: opts.image ?? `${site.url}${site.defaultOgImage}`,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: clinic.address.streetAddress,
      addressLocality: clinic.address.addressLocality,
      addressRegion: clinic.address.addressRegion,
      postalCode: clinic.address.postalCode,
      addressCountry: clinic.address.addressCountry,
    },
    ...(clinic.geo.latitude && clinic.geo.longitude
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: clinic.geo.latitude,
            longitude: clinic.geo.longitude,
          },
        }
      : {}),
    openingHoursSpecification: clinic.openingHoursSpec.map((s) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: s.dayOfWeek,
      opens: s.opens,
      closes: s.closes,
    })),
    sameAs: [
      clinic.social.facebook,
      clinic.social.instagram,
      clinic.social.linkedin,
      clinic.gbpUrl,
      clinic.parentBrandUrl,
    ].filter(Boolean),
    areaServed: clinic.serviceArea.map((city) => ({
      '@type': 'City',
      name: city,
    })),
    founder: {
      '@type': 'Person',
      '@id': `${site.url}/#owner`,
      name: owner.name,
      honorificPrefix: owner.honorificPrefix,
      honorificSuffix: owner.credentials,
      jobTitle: owner.jobTitle,
    },
    parentOrganization: {
      '@type': 'Organization',
      name: clinic.parentBrand,
      url: clinic.parentBrandUrl,
    },
  };
}

/**
 * Renderable JSON-LD as a string (HTML-safe). Wrap in <script type="application/ld+json">.
 */
export function jsonLdString(obj: JsonLd): string {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

// Phase 8 status:
// - Article schema:    inline in src/pages/post/[...slug].astro (verified, builds)
// - Person schema:     inline in src/pages/about-us.astro       (verified, builds)
// - BreadcrumbList:    inline in src/components/Breadcrumbs.astro (verified, builds)
// If/when these schemas are reused on more pages, extract them as helpers here.
