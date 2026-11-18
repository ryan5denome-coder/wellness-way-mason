/**
 * Build-time publish gate for blog posts.
 *
 * A post's `date` is a calendar day. The post is included in the build on that
 * day in America/New_York, and left out before that day, so it is not a page,
 * not on /blog, not in the sitemap, and not in the RSS feed.
 *
 * Production builds use the real Eastern calendar date. Set PUBLISH_AS_OF to
 * YYYY-MM-DD only when you need to preview the site as of another day.
 * Do not set PUBLISH_AS_OF on the Cloudflare production build.
 */

const EASTERN = 'America/New_York';

export function easternCalendarDate(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: EASTERN,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

function readOverride(): string | undefined {
  const meta = import.meta.env.PUBLISH_AS_OF;
  const raw =
    typeof meta === 'string' && meta.length > 0
      ? meta
      : typeof process !== 'undefined'
        ? process.env.PUBLISH_AS_OF
        : undefined;
  if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return undefined;
}

/** The Eastern calendar day this build should treat as "today". */
export function publishAsOf(now = new Date()): string {
  return readOverride() ?? easternCalendarDate(now);
}

/**
 * Date-only frontmatter lands at UTC midnight. Read the UTC calendar day so
 * `2026-11-19` stays November 19 in every build timezone.
 */
export function postCalendarDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Undated legacy posts stay public. A dated post is public on its date, Eastern Time. */
export function isPublished(date: Date | undefined | null, now = new Date()): boolean {
  if (!date) return true;
  return postCalendarDate(date) <= publishAsOf(now);
}
