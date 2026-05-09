# Cutover Readiness — TWW Mason

Status snapshot for Ryan. Last updated 2026-05-09.

## What's been shipped

### Cutover blockers (14 of 14) ✅

| # | Issue | Status |
|---|---|---|
| CR1 / CR14 | Phone `(283) 223-8376` (Ryan confirmed real) | ✓ |
| CR2 | Wix CDN images replaced — 33 stock images sourced from Unsplash + headshot from Ryan | ✓ |
| CR3 | OG default image (`/og/default.jpg`) — programmatically generated, brand-aligned | ✓ |
| CR4 | Event schema `startDate` — added to remaining event (4 past events deleted) | ✓ |
| CR5 | Canonical URLs no longer emit `.html` extensions | ✓ |
| CR6 | /our-services click-to-call now uses `tel:` prefix | ✓ |
| CR7 | Branded 404 page with recovery links | ✓ |
| CR8 | Sitemap filter excludes `/admin` and `/style-guide` | ✓ |
| CR9 | RSS feed at `/rss.xml` rendering all 24 posts | ✓ |
| CR10 | Visible "Keywords:" stuffing line removed from flagship post | ✓ |
| CR11 | Wix scrape leftovers (`## Comments`, `Loading…`, `Write a comment...`) stripped from 22 posts | ✓ |
| CR12 | Literal `\uXXXX` escape sequences resolved in 8 posts | ✓ |
| CR13 | Body `\\` artifacts cleaned in 3 posts | ✓ |

### High-confidence SEO wins (18 of 18) ✅

- **H1** "Root cause" branding swept (14 instances across 11 posts)
- **H2** Contextual links from all 24 posts to `/conditions/<slug>` pages
- **H3** Absolute Wix URLs converted to relative (92 internal links + thumbnail tiles rewritten)
- **H4** All 24 posts now have proper H2/H3 heading structure (zero before — flat walls of `<p>`)
- **H5** /find-my-condition rebuilt as data-driven hub with Mason + Cincinnati geo signals throughout
- **H6** Geo keywords added to titles on /about-us, /our-approach, /find-my-condition, /blog, /contact, /events, /pricing, /
- **H7** Meta descriptions tightened to 140-155 chars across all key pages and 6 posts
- **H8** 7 posts re-categorized using clean taxonomy; Decap CMS config updated
- **H9** Address normalization in events (only 1 event remains, address is canonical)
- **H10** Brand string sweep: 52 instances of "The Wellness Way Mason" → "The Wellness Way - Mason" (matches GBP)
- **H11** Reusable `personSchema()` helper with `@id` for entity disambiguation across LocalBusiness, Article, About
- **H12** Lab partner `mentions` schema (Access, DUTCH, Genova, ImmunoLabs, Mosaic) on every page
- **H13** Sitemap now includes `lastmod`, `changefreq`, `priority`
- **H14** FAQ section + FAQPage schema added to /contact (7 questions covering insurance, referrals, parking, kids, virtual, etc.)
- **H15** Article schema gained `publisher.logo` + Person `@id` reference
- **H16** 11 long SEO titles trimmed to <60 chars
- **H17** 23 duplicate body hero images deleted from posts
- **H18** /privacy-policy now `noindex`

### New content pages

- 3 top-3 condition pages (~1000-1200 words each, parent-brand voice locked):
  - `/conditions/thyroid`
  - `/conditions/hormone-imbalance`
  - `/conditions/autoimmune`
- 4 standard condition pages (in flight or complete by agent):
  - `/conditions/allergies`
  - `/conditions/acne`
  - `/conditions/digestive-issues`
  - `/conditions/fatigue`
- 5 condition pages still drafting via agent (heart-disease, diabetes, joint-and-muscle-pain, weight-loss, mental-health-brain)
- 3 locale pages (mason-oh, west-chester-oh, loveland-oh) drafted; cincinnati-oh still drafting
- `/locations` index with all locale cards
- `/find-my-condition` rebuilt as data-driven hub linking out to per-condition pages

### Schema upgrades

- LocalBusiness multi-type (LocalBusiness + MedicalBusiness + Chiropractor) with `mentions` for lab partners
- Reusable `personSchema()` and `articleSchema()` helpers
- Article schema with `publisher.logo` ImageObject + Person `@id`
- MedicalCondition schema on each /conditions/* page
- Place schema on each /locations/* page
- FAQPage schema on /contact, /pricing, /our-services, /about-us, /our-approach
- BreadcrumbList sitewide
- Event schema fixed (startDate present)

### Other improvements

- 12 new 301 redirects in `_redirects`:
  - Slug renames: `statins-...-root-causes` → `statins-...-cardiovascular-risk`
  - Slug renames: `you-need-...-supress` → `you-need-...-suppress`
  - 4 deleted past-event URLs → /events
  - 6 Cincy Crunchy monthly-instance variants → canonical /event-details/cincy-crunchy-book-study
- Newsletter signup component (placeholder action URL — needs MailerLite signup to wire)
- New `conditions` and `locations` content collections with Decap CMS forms
- "Service Area" link added to footer

## What still needs Ryan's input

1. **MailerLite developer signup** (free, 2 min, no credit card):
   1. Go to [unsplash.com/developers](https://unsplash.com/developers) — wait, that's for images. **For MailerLite:**
   1. Sign up at [mailerlite.com](https://www.mailerlite.com)
   2. Create a Group named "TWW Mason — Website Signups"
   3. Create an Embedded form for that group
   4. Copy the form action URL (looks like `https://assets.mailerlite.com/jsonp/<account_id>/forms/<form_id>/subscribe`)
   5. Send it to me and I'll wire it into `src/components/NewsletterSignup.astro`
2. **Write a real welcome sequence** for new newsletter subscribers (3-email education sequence is the recommended starting point)
3. **GBP brand confirmation** — did I match the GBP exactly? "The Wellness Way - Mason" with hyphen + spaces — confirm vs. your actual GBP listing

## Cutover sequence (Phase 10)

Do this only when ready:

1. Re-verify domain whois
2. Wix → Domains → ⋯ on `thewellnesswaymason.com` → "Transfer away from Wix" → get EPP/Auth code
3. Cloudflare → Domain Registration → Transfer → paste EPP → pay ~$9
4. **WAIT 5–7 days.** Site stays UP on Wix the whole time as long as DNS records aren't touched
5. Once Cloudflare emails "Transfer complete":
   - Cloudflare Pages → wellness-way-mason → Custom domains → add `thewellnesswaymason.com` AND `www.thewellnesswaymason.com`
   - Cloudflare auto-creates DNS records in the now-active zone
   - SSL provisions in ~5 min
6. Post-cutover verification:
   - Both apex + www load the new site over HTTPS
   - Email continues working (test send to clinic mailbox)
   - GA fires real-time
   - Neo Platform booking link still loads from CTAs
   - Every Phase 7 redirect resolves to correct new URL

## Phase 11 (post-launch)

- Submit `/sitemap-index.xml` to Google Search Console (DNS TXT verification)
- Submit to Bing Webmaster Tools
- UptimeRobot free tier for uptime alerts
- Verify GBP listing still points at the domain
- Walk Ryan through publishing a post via /admin
- AggregateRating schema once signed-consent testimonials accumulate
- More service-area pages if performance data justifies

## Build health

- 49+ HTML pages building
- 0 Wix CDN references in src/content (only in style-guide, which is internal/noindex)
- 18 KB sitewide JS bundle
- All images width/height attributed
- All canonicals correct (no .html extension)
- Sitemap-index emits with lastmod/changefreq/priority
- Lab partner Organization mentions in JSON-LD on every page
- Article + Person + LocalBusiness all share `@id` for entity disambiguation
