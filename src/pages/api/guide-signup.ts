import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * POST /api/guide-signup
 *
 * Receives a guide request from a landing page and hands the contact to Mautic.
 *
 * Why this goes through our own server route instead of posting straight to
 * Mautic from the browser:
 *   - Mautic lives on crm.thewellnesswaymason.com. A browser POST there is
 *     cross-origin, so it needs CORS opened on the CRM and it puts the CRM
 *     hostname in page source for anyone scanning for a Mautic instance.
 *   - Mautic's native form endpoint answers with a redirect or an HTML page,
 *     which would navigate the visitor away mid-conversion. Our own route lets
 *     the page keep the visitor and render success inline.
 *   - Almost all of this traffic arrives from an Instagram DM on a phone.
 *     Every navigation is a chance to lose them.
 *
 * The route runs on demand rather than at build time, so it opts out of
 * prerendering. Everything else on the site stays static.
 */
export const prerender = false;

/** Mautic form field aliases. These must match the form built in Mautic exactly. */
const FIELD = {
  email: 'email',
  guide: 'guide_requested',
  // Mautic reserves utm_source and friends as segment-filter keywords and
  // refuses to create contact fields with those aliases, so attribution_* is
  // what the CRM actually stores. The incoming JSON keys stay utm_* because
  // that is what the landing page URL carries.
  utmSource: 'attribution_source',
  utmMedium: 'attribution_medium',
  utmCampaign: 'attribution_campaign',
  utmContent: 'attribution_content',
} as const;

/** Guides we accept. Anything else is rejected rather than passed through. */
const KNOWN_GUIDES = new Set(['ebv', 'pcos']);

/**
 * Deliberately permissive. This only needs to catch obvious typos and junk,
 * because the real proof an address works is whether the guide arrives.
 * Over-strict email patterns reject valid addresses and cost real signups.
 */
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) && value.length <= 254;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let payload: Record<string, unknown>;

  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: 'Could not read that request.' }, 400);
  }

  const email = String(payload.email ?? '').trim().toLowerCase();
  const guide = String(payload.guide ?? '').trim().toLowerCase();
  const honeypot = String(payload.website ?? '').trim();

  // Honeypot. A real person never fills a field they cannot see, so anything
  // here is a bot. Answer 200 so it believes it succeeded and does not retry
  // with a different shape.
  if (honeypot) {
    return json({ ok: true });
  }

  if (!looksLikeEmail(email)) {
    return json({ ok: false, error: 'Please enter a valid email address.' }, 400);
  }

  if (!KNOWN_GUIDES.has(guide)) {
    return json({ ok: false, error: 'Unknown guide requested.' }, 400);
  }

  // Astro 6 removed Astro.locals.runtime.env. That property is now a getter
  // that throws, so reading it fails the request outside any try/catch and
  // surfaces as a bare 500 with an empty body. Bindings come from
  // 'cloudflare:workers' instead.
  const mauticBase = String(env.MAUTIC_BASE_URL ?? '').replace(/\/$/, '');
  const formId = String(env.MAUTIC_GUIDE_FORM_ID ?? '');

  if (!mauticBase || !formId) {
    // Fail loudly in the log and softly to the visitor. A misconfigured CRM is
    // our problem, and telling someone their email was rejected when it was not
    // is worse than asking them to try again.
    console.error('[guide-signup] MAUTIC_BASE_URL or MAUTIC_GUIDE_FORM_ID is not set');
    return json({ ok: false, error: 'We could not save that just now. Please try again shortly.' }, 502);
  }

  const body = new URLSearchParams();
  body.set('mauticform[formId]', String(formId));
  body.set(`mauticform[${FIELD.email}]`, email);
  body.set(`mauticform[${FIELD.guide}]`, guide);
  body.set('mauticform[return]', '');

  // UTMs ride along from the landing page URL so each Reel can be measured
  // separately. Missing values are simply omitted.
  const utmMap: Array<[string, string]> = [
    [FIELD.utmSource, 'utm_source'],
    [FIELD.utmMedium, 'utm_medium'],
    [FIELD.utmCampaign, 'utm_campaign'],
    [FIELD.utmContent, 'utm_content'],
  ];
  for (const [alias, key] of utmMap) {
    const value = String(payload[key] ?? '').trim().slice(0, 200);
    if (value) body.set(`mauticform[${alias}]`, value);
  }

  try {
    const response = await fetch(`${mauticBase}/form/submit?formId=${encodeURIComponent(String(formId))}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        // Without this Mautic attributes every lead to the Cloudflare Worker's
        // IP, which collapses geography and makes dedupe behave oddly.
        'x-forwarded-for': clientAddress ?? '',
        'user-agent': request.headers.get('user-agent') ?? 'tww-guide-signup',
      },
      body,
      redirect: 'manual',
    });

    // Mautic answers a successful submit with 200 or a 3xx to the return URL.
    // Both mean the contact landed. Only 4xx or 5xx is a real failure.
    if (response.status >= 400) {
      console.error('[guide-signup] Mautic responded', response.status);
      return json({ ok: false, error: 'We could not save that just now. Please try again shortly.' }, 502);
    }

    return json({ ok: true });
  } catch (error) {
    console.error('[guide-signup] request to Mautic failed', error);
    return json({ ok: false, error: 'We could not save that just now. Please try again shortly.' }, 502);
  }
};
