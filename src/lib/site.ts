/**
 * Site-wide config helper.
 *
 * NAP fields, hours, social URLs, booking URL, and analytics IDs are loaded
 * at build time from `src/content/settings/clinic.yml` — Decap CMS edits this
 * file via the "Site Settings" panel at /admin. Other constants (brand,
 * parent brand, service area, openingHoursSpec for schema) stay code-local
 * because they rarely change and require explicit type/structure.
 */
import yaml from 'js-yaml';
// Vite ?raw inlines the YAML text at build time — no runtime fs access needed
// and the content gets bundled into the prerender output.
import clinicYamlText from '../content/settings/clinic.yml?raw';

interface ClinicYaml {
  name: string;
  tagline: string;
  addressLine1: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  phoneTel: string;
  email: string;
  hours: { day: string; hours: string }[];
  gbpUrl?: string;
  bookingUrl: string;
  facebookUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  ga4Id?: string;
  metaPixelId?: string;
  gtmId?: string;
}

const settings = yaml.load(clinicYamlText) as ClinicYaml;

/**
 * Convert a time string like "8:00am" or "2:00pm" to 24-hour "HH:MM".
 * Returns null if the input doesn't match the expected pattern.
 */
function to24Hour(t: string): string | null {
  const m = t.trim().toLowerCase().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2];
  const period = m[3];
  if (period === 'am') {
    if (h === 12) h = 0;
  } else {
    if (h !== 12) h += 12;
  }
  return `${String(h).padStart(2, '0')}:${min}`;
}

/**
 * Parse a single day's hours string into one or more `{ opens, closes }` ranges.
 * Skips "Closed" / "By appointment" (returns []).
 *
 * Accepts comma-separated ranges where each range uses the en-dash (U+2013):
 *   "8:00am–12:00pm, 2:00pm–5:00pm" -> 2 ranges
 *   "2:00pm–6:00pm"                  -> 1 range
 *   "Closed" | "By appointment"      -> 0 ranges
 */
function parseDayRanges(hoursStr: string): { opens: string; closes: string }[] {
  const normalized = hoursStr.trim().toLowerCase();
  if (!normalized || normalized === 'closed' || normalized === 'by appointment') {
    return [];
  }
  const ranges: { opens: string; closes: string }[] = [];
  for (const segment of hoursStr.split(',')) {
    const parts = segment.trim().split('–'); // en-dash
    if (parts.length !== 2) continue;
    const opens = to24Hour(parts[0]);
    const closes = to24Hour(parts[1]);
    if (opens && closes) ranges.push({ opens, closes });
  }
  return ranges;
}

/**
 * Auto-derive schema.org OpeningHoursSpecification entries from the
 * human-readable `hours` array in clinic.yml. One entry per range, so days
 * with a lunch split produce two entries.
 */
function deriveOpeningHoursSpec(
  hours: { day: string; hours: string }[]
): { dayOfWeek: string; opens: string; closes: string }[] {
  const out: { dayOfWeek: string; opens: string; closes: string }[] = [];
  for (const { day, hours: hStr } of hours) {
    for (const range of parseDayRanges(hStr)) {
      out.push({ dayOfWeek: day, opens: range.opens, closes: range.closes });
    }
  }
  return out;
}

export const site = {
  url: 'https://www.thewellnesswaymason.com',
  domain: 'thewellnesswaymason.com',
  defaultLocale: 'en-US',
  // TODO Phase 8b: drop a real 1200x630 OG image at public/og/default.jpg
  // (TWW Green background + wordmark + "Common is not normal."). Until then
  // share previews fall back to per-page ogImage props or no image.
  defaultOgImage: '/og/default.jpg',
} as const;

export const clinic = {
  // Static brand identity — code-local, rarely changes
  legalName: 'Wellness Way Mason LLC',
  brandName: settings.name,
  parentBrand: 'The Wellness Way',
  parentBrandUrl: 'https://www.thewellnessway.com/',
  tagline: settings.tagline,
  positioning: 'Do Health Differently.',
  signaturePhrase: 'Common is not normal.',

  // NAP — sourced from clinic.yml, edited via Decap
  address: {
    streetAddress: settings.addressLine1,
    addressLocality: settings.city,
    addressRegion: settings.state,
    postalCode: settings.zip,
    addressCountry: 'US',
  },

  // Lat/long — approximate coordinates for 5382 Cox-Smith Rd, Suite A, Mason, OH 45040.
  // Replace with verified Maps coordinates if precision matters for routing.
  geo: {
    latitude: 39.3596 as number | null,
    longitude: -84.2861 as number | null,
  },

  phone: settings.phone,
  phoneTel: settings.phoneTel,
  email: settings.email,

  // Display hours — sourced from clinic.yml
  hours: settings.hours,

  // OpeningHoursSpecification (schema.org format) — auto-derived from
  // settings.hours via deriveOpeningHoursSpec. Edit clinic.yml to change.
  openingHoursSpec: deriveOpeningHoursSpec(settings.hours),

  bookingUrl: settings.bookingUrl,
  gbpUrl: settings.gbpUrl ?? '',

  social: {
    facebook: settings.facebookUrl ?? '',
    instagram: settings.instagramUrl ?? '',
    linkedin: settings.linkedinUrl ?? '',
  },

  serviceArea: ['Mason', 'West Chester', 'Loveland', 'Lebanon', 'Cincinnati'],

  // Analytics IDs from clinic.yml — populated post-launch via Decap
  analytics: {
    ga4Id: settings.ga4Id ?? '',
    metaPixelId: settings.metaPixelId ?? '',
    gtmId: settings.gtmId ?? '',
  },
};

export const owner = {
  name: 'Dr. Ryan DeNome',
  givenName: 'Ryan',
  familyName: 'DeNome',
  credentials: 'DC',
  honorificPrefix: 'Dr.',
  jobTitle: 'Doctor of Chiropractic',
  worksFor: clinic.brandName,
  alumniOf: 'Life University',
  certifications: ['Webster Technique'],
  email: settings.email,
  url: settings.linkedinUrl ?? '',
} as const;

/**
 * Required byline text per OAC 4734-9-02(E). Use one of these on every
 * patient-facing piece of content (blog posts, condition pages, etc.).
 */
export const bylines = {
  reviewed: 'Reviewed and approved by Dr. Ryan DeNome, DC',
  authored: 'Author: Dr. Ryan DeNome, DC — Clinic Owner, The Wellness Way - Mason',
  short: 'Dr. Ryan DeNome, DC | Doctor of Chiropractic | Mason, Ohio',
} as const;

export type SiteConfig = typeof site;
export type ClinicConfig = typeof clinic;
export type OwnerConfig = typeof owner;
