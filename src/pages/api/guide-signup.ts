import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { clinic } from '../../lib/site';

/**
 * POST /api/guide-signup
 *
 * Receives a guide request from a landing page, saves the contact in Brevo,
 * and emails the guide out on the spot.
 *
 * This used to hand the contact to Mautic on crm.thewellnesswaymason.com.
 * That instance died and spent an unknown number of days answering 502 while
 * the route reported success, so every signup in that window was thrown away.
 * Brevo is hosted, so there is no instance of ours left to fall over.
 *
 * Why this still goes through our own server route instead of posting straight
 * to Brevo from the browser:
 *   - The Brevo API key would be in page source. It can send mail as us.
 *   - A browser POST to api.brevo.com is cross-origin and Brevo does not open
 *     CORS for the contacts endpoint.
 *   - Almost all of this traffic arrives from an Instagram DM on a phone.
 *     Every navigation is a chance to lose them, so the page keeps the visitor
 *     and renders success inline.
 *
 * Why the guide goes out as a transactional send rather than a Brevo
 * automation: the account is on the free tier, which has no marketing
 * automation. A transactional send is also faster for the visitor, who is
 * sitting on the success screen waiting for the email to land.
 *
 * The route runs on demand rather than at build time, so it opts out of
 * prerendering. Everything else on the site stays static.
 */
export const prerender = false;

const BREVO_API = 'https://api.brevo.com/v3';

/**
 * The one verified sender on the account. The domain is authenticated, so mail
 * from this address is signed. Anything else silently lands in spam.
 */
const SENDER = { name: clinic.brandName, email: 'info@thewellnesswaymason.com' } as const;

/**
 * One entry per guide we accept. The list ids are the Brevo lists that already
 * exist, and `file` is the guide itself, hosted on our own domain so the link
 * keeps working no matter what happens to the email platform.
 *
 * A null `file` means the guide is written but not published yet. We still
 * capture the contact and add them to the list, we just do not send. Mailing a
 * dead link is worse than mailing nothing.
 */
const GUIDES = {
  ebv: {
    listId: 3,
    // Subject wording matches the catch-up batch that already went out to the
    // backlog by hand, so a repeat requester sees the same thing twice rather
    // than two emails that look like they came from two different places.
    subject: 'Your Epstein Barr guide',
    linkLabel: 'Open your Epstein Barr guide',
    file: 'https://thewellnesswaymason.com/files/mono-ebv-guide.pdf',
  },
  pcos: {
    listId: 4,
    subject: 'Your PCOS guide',
    linkLabel: 'Open your PCOS guide',
    file: 'https://thewellnesswaymason.com/files/pcos-guide.pdf',
  },
  ferritin: {
    listId: 5,
    subject: 'Your low ferritin guide',
    linkLabel: 'Open your low ferritin guide',
    // TODO: the low ferritin guide is not hosted yet. Drop the PDF at
    // public/files/ferritin-guide.pdf, then set this to
    // https://thewellnesswaymason.com/files/ferritin-guide.pdf and nothing else
    // needs to change. Until then ferritin signups land in list 5 and get no
    // email, and someone has to mail that list by hand once the guide ships.
    file: null,
  },
} as const;

/** Guides we accept. Anything else is rejected rather than passed through. */
const KNOWN_GUIDES = new Set(Object.keys(GUIDES));

type GuideKey = keyof typeof GUIDES;

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

/**
 * The guide email.
 *
 * House rules for body copy carry over from the landing pages: no em dashes,
 * no semicolons, no colons. Short and plain. Someone who tapped through from a
 * Reel thirty seconds ago wants the guide, not a newsletter.
 *
 * The footer carries the clinic postal address and a plain-language way out.
 * This is a transactional send, so Brevo does not append an unsubscribe link
 * the way it does for a campaign, and we owe people one anyway.
 */
function guideEmailHtml(linkLabel: string, file: string): string {
  const address = `${clinic.address.streetAddress}, ${clinic.address.addressLocality}, ${clinic.address.addressRegion} ${clinic.address.postalCode}`;

  return `<!doctype html>
<html lang="en">
<body style="margin:0;padding:24px;background:#FAFAF9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#414444;line-height:1.6;">
  <div style="max-width:34rem;margin:0 auto;background:#FFFFFF;border:1px solid #e6e6e4;border-radius:12px;padding:32px;">
    <p style="margin:0 0 16px;">Hi,</p>
    <p style="margin:0 0 24px;">Here is the guide you asked for.</p>
    <p style="margin:0 0 24px;">
      <a href="${file}" style="display:inline-block;background:#80b741;color:#ffffff;text-decoration:none;font-weight:600;padding:14px 24px;border-radius:8px;">${linkLabel}</a>
    </p>
    <p style="margin:0 0 24px;">Read it when you have a quiet ten minutes. If something in it raises a question about your own labs or your own symptoms, reply to this email and we will point you somewhere useful.</p>
    <p style="margin:0;">Dr. Ryan DeNome, DC<br />${clinic.brandName}</p>
  </div>
  <div style="max-width:34rem;margin:24px auto 0;font-size:13px;line-height:1.5;color:#5d6060;text-align:center;">
    <p style="margin:0 0 8px;">${clinic.brandName}<br />${address}<br />${clinic.phone}</p>
    <p style="margin:0;">You are getting this because you asked for this guide on our website. If you would rather not hear from us again, reply with the word unsubscribe and we will take you off the list.</p>
  </div>
</body>
</html>`;
}

function guideEmailText(linkLabel: string, file: string): string {
  const address = `${clinic.address.streetAddress}, ${clinic.address.addressLocality}, ${clinic.address.addressRegion} ${clinic.address.postalCode}`;

  return [
    'Hi,',
    '',
    'Here is the guide you asked for.',
    '',
    `${linkLabel}`,
    file,
    '',
    'Read it when you have a quiet ten minutes. If something in it raises a question about your own labs or your own symptoms, reply to this email and we will point you somewhere useful.',
    '',
    'Dr. Ryan DeNome, DC',
    clinic.brandName,
    '',
    '---',
    clinic.brandName,
    address,
    clinic.phone,
    '',
    'You are getting this because you asked for this guide on our website. If you would rather not hear from us again, reply with the word unsubscribe and we will take you off the list.',
  ].join('\n');
}

export const POST: APIRoute = async ({ request }) => {
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

  const config = GUIDES[guide as GuideKey];

  // Astro 6 removed Astro.locals.runtime.env. That property is now a getter
  // that throws, so reading it fails the request outside any try/catch and
  // surfaces as a bare 500 with an empty body. Bindings come from
  // 'cloudflare:workers' instead.
  //
  // Unlike the old Mautic vars this one is a real secret, so it lives in
  // `wrangler secret put BREVO_API_KEY` rather than in wrangler.jsonc.
  const apiKey = String(env.BREVO_API_KEY ?? '');

  if (!apiKey) {
    // Fail loudly in the log and softly to the visitor. A misconfigured email
    // platform is our problem, and telling someone their email was rejected
    // when it was not is worse than asking them to try again.
    console.error('[guide-signup] BREVO_API_KEY is not set');
    return json({ ok: false, error: 'We could not save that just now. Please try again shortly.' }, 502);
  }

  // UTMs ride along from the landing page URL so each Reel can be measured
  // separately. Missing values are simply omitted.
  //
  // Mautic stored these on the contact as attribution_* fields. Brevo rejects
  // a contact write that carries an attribute the account has not defined, and
  // the account only has GUIDE_REQUESTED and SIGNUP_DATE, so for now these ride
  // as transactional tags and go into the Worker log instead.
  // TODO: create ATTRIBUTION_SOURCE, ATTRIBUTION_MEDIUM, ATTRIBUTION_CAMPAIGN
  // and ATTRIBUTION_CONTENT as text attributes in Brevo, then fold them back
  // into the `attributes` object below so attribution lives on the contact
  // again and survives whether or not the email sends.
  const attribution: string[] = [];
  const attributionTags: string[] = [];
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']) {
    const value = String(payload[key] ?? '').trim().slice(0, 200);
    if (!value) continue;
    attribution.push(`${key}=${value}`);
    // The tag copy is shortened and stripped to a safe character set. Brevo
    // comma-separates tags once it stores them, and it rejects a send whose
    // tags it does not like. These values come off the query string, so anyone
    // can put anything in them, and a tracking parameter must never be the
    // reason someone does not get their guide.
    attributionTags.push(`${key}=${value.replace(/[^A-Za-z0-9._-]/g, '-').slice(0, 60)}`);
  }

  // Brevo stores SIGNUP_DATE as text, so send the plain YYYY-MM-DD rather than
  // a full timestamp. Workers run in UTC, which is close enough for a date the
  // clinic reads as "when did this lead come in".
  const signupDate = new Date().toISOString().slice(0, 10);

  // The contact goes first and on its own. Whatever happens to the email after
  // this, the lead is saved and someone can follow up by hand. Losing the
  // contact is the failure that actually costs the clinic money.
  try {
    const contactResponse = await fetch(`${BREVO_API}/contacts`, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        email,
        updateEnabled: true,
        listIds: [config.listId],
        attributes: {
          GUIDE_REQUESTED: guide,
          SIGNUP_DATE: signupDate,
        },
      }),
    });

    // 201 is a new contact, 204 is an existing one updated because
    // updateEnabled is on. Someone asking for a second guide is normal and
    // must not read as an error.
    if (contactResponse.status >= 400) {
      const detail = await contactResponse.text().catch(() => '');
      console.error('[guide-signup] Brevo contact create responded', contactResponse.status, detail.slice(0, 500));
      return json({ ok: false, error: 'We could not save that just now. Please try again shortly.' }, 502);
    }
  } catch (error) {
    console.error('[guide-signup] request to Brevo contacts failed', error);
    return json({ ok: false, error: 'We could not save that just now. Please try again shortly.' }, 502);
  }

  console.log('[guide-signup] contact saved', guide, attribution.join(' '));

  // From here on nothing is allowed to turn into a failure for the visitor.
  // The contact is already safe in Brevo.
  let delivered = false;

  if (config.file) {
    try {
      const sendResponse = await fetch(`${BREVO_API}/smtp/email`, {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          sender: SENDER,
          to: [{ email }],
          replyTo: SENDER,
          subject: config.subject,
          htmlContent: guideEmailHtml(config.linkLabel, config.file),
          textContent: guideEmailText(config.linkLabel, config.file),
          tags: [`guide=${guide}`, ...attributionTags],
        }),
      });

      if (sendResponse.status >= 400) {
        const detail = await sendResponse.text().catch(() => '');
        console.error('[guide-signup] Brevo send responded', sendResponse.status, detail.slice(0, 500));
      } else {
        delivered = true;
      }
    } catch (error) {
      console.error('[guide-signup] request to Brevo send failed', error);
    }
  }

  // `delivered` tells the landing page which success copy is honest. It is
  // additive, so anything reading only `ok` keeps working.
  return json({ ok: true, delivered });
};
