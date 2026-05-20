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
      clinic.social.youtube,
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
    // NOTE: a `mentions` array of lab-partner Organizations used to live here.
    // Removed 2026-05-12 because Google's LocalBusiness rich-result parser does
    // not recognize `mentions` on this type — Semrush flagged all pages as
    // invalid structured data. Lab partners are still surfaced via visible prose
    // on the homepage and the lab-strip section, which AI engines can still parse.
  };
}

/**
 * Person schema for Dr. Ryan DeNome. Returns either:
 *  - `full: true` — the canonical Person entity for /about-us (with bio, education, etc.)
 *  - `full: false` (default) — a `@id`-only reference suitable for inline use on Articles, etc.
 *    Search engines dedupe the entity via the shared `@id` URL.
 *
 * Use the same `@id` everywhere: ${site.url}/#owner
 */
export function personSchema(opts: { full?: boolean } = {}): Record<string, unknown> {
  const id = `${site.url}/#owner`;
  if (!opts.full) {
    return {
      '@type': 'Person',
      '@id': id,
      name: owner.name,
      honorificPrefix: owner.honorificPrefix,
      honorificSuffix: owner.credentials,
      jobTitle: owner.jobTitle,
      url: `${site.url}/about-us`,
    };
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': id,
    name: owner.name,
    givenName: owner.givenName,
    familyName: owner.familyName,
    honorificPrefix: owner.honorificPrefix,
    honorificSuffix: owner.credentials,
    jobTitle: owner.jobTitle,
    image: `${site.url}/images/people/dr-ryan-denome.jpg`,
    alumniOf: { '@type': 'CollegeOrUniversity', name: owner.alumniOf },
    worksFor: { '@type': 'Organization', name: clinic.brandName, url: site.url },
    knowsAbout: [
      'Chiropractic Care',
      'Health Restoration',
      'Pediatric Chiropractic',
      'Prenatal Chiropractic (Webster Technique)',
      'Functional Lab Testing',
      'Hormone Health',
      'Thyroid Health',
      'Autoimmune Patterns',
      'Gut Health',
    ],
    hasCredential: [
      { '@type': 'EducationalOccupationalCredential', credentialCategory: 'degree', name: 'Doctor of Chiropractic' },
      { '@type': 'EducationalOccupationalCredential', credentialCategory: 'certification', name: 'Webster Technique' },
    ],
    email: owner.email,
    url: owner.url,
  };
}

/**
 * Article schema helper for blog posts. Reuses Person `@id` and LocalBusiness `@id`
 * so Google's entity graph can dedupe across the site.
 */
export function articleSchema(post: {
  title: string;
  description: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  url: string;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    // BlogPosting is more semantically precise than the generic Article type
    // for clinic blog content (Manus audit 1.6). Google treats it as an Article
    // subtype, so all Article rich-result eligibility carries over.
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: post.image ? [post.image] : undefined,
    datePublished: post.datePublished,
    dateModified: post.dateModified,
    author: personSchema(),
    publisher: {
      '@type': 'Organization',
      '@id': `${site.url}/#localbusiness`,
      name: clinic.brandName,
      url: site.url,
      logo: {
        '@type': 'ImageObject',
        url: `${site.url}/og/default.jpg`,
        width: 1200,
        height: 630,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': post.url,
    },
  };
}

/**
 * Renderable JSON-LD as a string (HTML-safe). Wrap in <script type="application/ld+json">.
 */
export function jsonLdString(obj: JsonLd): string {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}
