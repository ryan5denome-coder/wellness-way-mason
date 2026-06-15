# DESLOP-SITEMAP — The Wellness Way - Mason

Deepest-possible read of the live site for the de-AI-ification ("de-slop") pass.
**Read-only audit. No files were edited.** Compiled 2026-06-15 against `src/` at
current HEAD.

This document is the master map the de-slop swarm fans out over. The two
load-bearing sections are the **Per-file worklist** (§2) and the **Freeze list**
(§3) — those govern every downstream edit. §5 carries forward every still-open
item from `AUDIT-SYNTHESIS.md` + `AUDIT-PRECUTOVER.md`, re-verified against the
current tree (several are now fixed; the ones below are the ones that are NOT).

Headline metrics (current tree):
- **787 em-dashes** in `src/` (matches the brief). Body-copy clusters mapped in §2.
- **~115 banned-generic-word hits** (slightly higher than the 107 in the brief).
- Bold-gloss bullet template (`**Bold** — gloss` / `<strong>X</strong> — gloss`)
  concentrated in the 3 SEO landing pages, the condition markdown, and `our-services`.
- **Lyme testing: NOT present anywhere** (grep clean — good; keep it that way).

---

## 1. Architecture & copy map

**Stack.** Astro 6, prerendered (`build.format: 'file'`), deployed as a
Cloudflare Worker (Static Assets). Decap CMS at `/admin` edits the YAML/markdown
via the GitHub backend. Smooth-scroll via Lenis; scroll-reveal via
IntersectionObserver (both in `BaseLayout`).

**One layout.** Every page renders through `src/layouts/BaseLayout.astro`, which:
owns `<title>` (auto-appends `| The Wellness Way`), `<meta description>`,
canonical (strips `.html`), OG/Twitter tags, favicons, font links
(**Lora + Inter** — see brand note below), sitemap/RSS `<link>`s, and the
always-on JSON-LD (`LocalBusiness` multi-type + `Person` ref). Shared chrome:
`Header.astro` (primary nav + booking CTA), `Footer.astro` (NAP + secondary nav +
social), `PageLoader.astro`.

**Where on-screen copy actually lives — three buckets:**

1. **Inline in the `.astro` page file** (hardcoded JS arrays/JSX prose). This is
   where MOST high-density copy lives: `index.astro` (3 T's, 4-step, two-arms,
   hero), `our-approach`, `our-services`, `find-my-condition`, `contact`,
   `pricing`, `about-us`, `faq`, `dr-ryan-denome`, and the 3 SEO landing pages
   (`functional-medicine-mason-oh`, `dutch-test-mason-oh`, `webster-technique-mason-oh`).
   FAQ Q&A objects are inline arrays here too.

2. **Content-collection markdown/YAML** rendered through a routing template:
   - `conditions/*.md` → `pages/conditions/[...slug].astro` (renders
     `title`/`excerpt`/`imageAlt` + markdown body + frontmatter `tts`,
     `testingPanels`, `faqs`).
   - `posts/*.md` → `pages/post/[...slug].astro` (renders `title`/`excerpt`/
     `imageAlt` + markdown body; byline + CTA are template boilerplate).
   - `locations/*.md` → `pages/locations/[...slug].astro`.
   - `events/*.md` → `pages/event-details/[...slug].astro`; index at `pages/events.astro`.
   - `providers/dr-ryan-denome.md` → **ORPHANED.** No template calls
     `getCollection('providers')`. The bio is hardcoded twice (in `about-us.astro`
     and `dr-ryan-denome.astro`) and the collection entry renders nowhere. Edits
     to it change nothing on the site surface (note for the swarm: don't waste a
     batch slot on it; flag for the owner to wire-or-delete).
   - `settings/clinic.yml` → `src/lib/site.ts` (NAP, hours, booking/social URLs).
   - `testimonials/` and `faqs/` collections exist in schema but have only
     `.gitkeep` — no entries render.

3. **Component UI copy.** Mostly chrome, not body copy. The copy-bearing ones:
   `NewsletterSignup` (MailerLite form heading/lede + success text),
   `NewsletterTeaser` (one strip line), `ContactForm` (labels + PHI note),
   `Footer`/`Header` (nav labels), `HoursTable`/`MapEmbed` (small UI text),
   `TestimonialCard` (renders nothing — empty collection). All other components'
   em-dashes are in JSDoc/CSS comments, not on-screen.

**Schema/SEO helpers** live in `src/lib/schema.ts` (LocalBusiness, Person,
Article/BlogPosting factories) and `src/lib/site.ts` (clinic constants, `owner`,
`bylines`). These are **frozen** (§3).

**Route inventory (copy-bearing → render source):**

| Route | Rendered by | Copy source |
|---|---|---|
| `/` | `pages/index.astro` | inline (very high density) |
| `/about-us` | `pages/about-us.astro` | inline + `personSchema` |
| `/our-approach` | `pages/our-approach.astro` | inline + FAQAccordion |
| `/our-services` | `pages/our-services.astro` | inline + FAQAccordion |
| `/find-my-condition` | `pages/find-my-condition.astro` | inline + condition excerpts |
| `/pricing` | `pages/pricing.astro` | inline (uses HTML entities `&mdash;`) |
| `/contact` | `pages/contact.astro` | inline + ContactForm + FAQAccordion |
| `/faq` | `pages/faq.astro` | inline (6 sections, ~25 Q&A) |
| `/blog` | `pages/blog.astro` | inline + post excerpts + Newsletter |
| `/dr-ryan-denome` | `pages/dr-ryan-denome.astro` | inline (author entity page) |
| `/functional-medicine-mason-oh` | same-named `.astro` | inline (SEO landing, NOT in prior audits) |
| `/dutch-test-mason-oh` | same-named `.astro` | inline (SEO landing, NOT in prior audits) |
| `/webster-technique-mason-oh` | same-named `.astro` | inline (SEO landing, NOT in prior audits) |
| `/conditions/<slug>` (12) | `pages/conditions/[...slug].astro` | `conditions/*.md` |
| `/post/<slug>` (24) | `pages/post/[...slug].astro` | `posts/*.md` |
| `/locations/<slug>` (4) | `pages/locations/[...slug].astro` | `locations/*.md` |
| `/locations` | `pages/locations/index.astro` | inline + location excerpts |
| `/event-details/<slug>` (2) | `pages/event-details/[...slug].astro` | `events/*.md` |
| `/events` | `pages/events.astro` | inline + event excerpts |
| `/privacy-policy` | `pages/privacy-policy.astro` | inline (legal — leave to counsel) |
| `/faq`, `/style-guide`, `/admin`, `/404` | utility | see §2 |

> **Brand note (not a copy task — flag for owner).** The brief's visual ground
> truth says Bebas Neue headlines / Bilo body, "no serifs." The build actually
> ships **Lora (serif) headlines + Inter body** (`global.css` `--font-display`/
> `--font-body`, font `<link>` in BaseLayout), a deliberate documented "calm
> wellness" choice. Colors DO match spec (`#80B741` / `#414444` / `#DCD4C8`).
> This is a typography/brand decision, **out of scope for the de-slop copy swarm**
> — do not "fix" fonts as part of a copy edit.

---

## 2. Per-file worklist table

Priority key: **P0** = worst AI-slop density and/or compliance-sensitive (needs
human sign-off, not blind automation); **P1** = clear slop, automatable with care;
**P2** = light or near-clean. Em-dash counts are raw `—` per file (CSS/JSDoc
comment dashes excluded from the "visible" judgment in the notes). "BG" =
bold-gloss bullet count (markdown `- **X** —` + HTML `<strong>X</strong> —`).

### Core pages (`src/pages/*.astro`)

| File | Route | Copy? | Em‑dash | BG | Other AI tells | Brand/compliance flags | Pri |
|---|---|---|---|---|---|---|---|
| `index.astro` | `/` | Y | 41 | ~0 md / several `<em>` | tricolons ("Bring your story. Bring your questions…"), "smoke alarm" metaphor, heavy `<em>why</em>` | "comprehensive" ×2 (banned); Gandhi quote correctly attributed now; on-brand otherwise | **P1** |
| `our-approach.astro` | `/our-approach` | Y | 21 | 1 | "Whole-Person", "empower"/"importantly" (l.68/68 region), rule-of-three | "empower" banned; 3 T's correct; "we equip you with a tailored plan" ok | **P1** |
| `our-services.astro` | `/our-services` | Y | 25 | 4 | bold-gloss in whole-person list; "Who we **treat**" heading | "treat" in heading (use "see/approach"); "supplement protocols" (→ "plans"); Webster claims calibrated ("may support") | **P1** |
| `functional-medicine-mason-oh.astro` | `/functional-medicine-mason-oh` | Y | 37 | 5 | bold-gloss "What we see most" list; "Final Thoughts"; negation-frame closers ("You don't have to…") | **TITLE = "Functional Medicine in Mason, OH"** + repeated "functional medicine" / "functional-medicine MD"; "protocol" ×2 (→ plan). DC title is preserved in body. Title/positioning is a brand-call (see §5/§6) | **P0** |
| `dutch-test-mason-oh.astro` | `/dutch-test-mason-oh` | Y | 34 | 12 | dense bold-gloss "What it measures"/"Patterns" lists; "Final Thoughts"; fuel-gauge metaphor | **Clinical-risk claims:** 4-OH estrogen metabolite "associated with higher risk patterns," "cancer risk" framing (l.16). Needs clinician sign-off. "individual plan vs generic protocol" wording ok | **P0** |
| `webster-technique-mason-oh.astro` | `/webster-technique-mason-oh` | Y | 17 | ~0 | negation-frame closer; "What it is NOT" section (good) | Compliance-clean: explicit breech disclaimer + OB/midwife collab. Light em-dash trim only | **P2** |
| `find-my-condition.astro` | `/find-my-condition` | Y | 8 | 0 | `<em>why</em>`, "We don't guess — we test" (now standardized to 1) | H1/breadcrumb both "Find My Condition" (fixed); Mason/Cincinnati present (fixed); "functional medicine" used as plan label | **P1** |
| `about-us.astro` | `/about-us` | Y | 10 | 0 | "empower individuals", mission/philosophy/vision tricolon | "empower" banned (l.107); Augustine quote here is genuinely Augustine (ok); DC title correct | **P1** |
| `contact.astro` | `/contact` | Y | 14 | 4 | "What to expect" bold-gloss list | service-area adds "Maineville" (differs from `clinic.serviceArea`); FAQ added (good) | **P1** |
| `pricing.astro` | `/pricing` | Y | 4 raw + many `&mdash;`/`&ndash;` entities | 0 | **uses HTML entities for dashes** — swarm must catch `&mdash;`/`&rsquo;` too | FAQPage rendered via FAQAccordion; dollar specifics are good E-E-A-T; clean | **P2** |
| `faq.astro` | `/faq` | Y | 17 | 0 | many em-dashes inside answers; tricolons | **Newborn answer** ("gentle care may support the nervous system") = pediatric-scope claim → sign-off. Otherwise calibrated | **P0** (one Q) |
| `dr-ryan-denome.astro` | `/dr-ryan-denome` | Y | 12 | 0 | "Most chiropractors adjust. Most functional-medicine providers run labs." negation frame | "functional-medicine providers" phrasing; DC title correct; duplicate of about-us bio | **P1** |
| `blog.astro` | `/blog` | Y | 4 | 0 | "Real answers for real health challenges" | **category pills link to `#${cat}` anchors that don't exist on page** (carryover, §5) | **P2** |
| `events.astro` | `/events` | Y | 3 | 3 | "What you'll find here" bold-gloss list | "get **empowered**" (l.28) + "empower" — banned | **P1** |
| `locations/index.astro` | `/locations` | Y | 2 | 0 | thin | clean | **P2** |
| `privacy-policy.astro` | `/privacy-policy` | Y | (entities) | 0 | legal boilerplate | `noIndex` set (fixed); processor disclosures present. **Leave to counsel — do not de-slop.** | **DO NOT TOUCH** |
| `404.astro` | `/404` | Y | 7 | 0 | small | has chiro term + nav links (CR7 fixed) | **P2** |
| `style-guide.astro` | `/style-guide` | Y (noindex) | 6 | 0 | demo copy; 2 leftover `wixstatic` demo images | noindex; internal only — **skip** | **P2 / skip** |
| `admin/index.astro` | `/admin` | N | 3 | 0 | Decap mount; noindex | **freeze** (CMS) | **DO NOT TOUCH** |

### Condition pages (`src/content/conditions/*.md` → `/conditions/<slug>`)

All are copy-heavy markdown bodies with the `**Bold** — gloss` symptom/cause
lists and a "3 T's" section. The audit's auto-fixes left **inconsistent bullet
bolding** (some bullets bolded, some plain) in several — that itself reads as a
tell to normalize. All end in the template byline + "Test instead of guess" CTA.

| File | Em‑dash | BG (md) | Other tells | Compliance flags | Pri |
|---|---|---|---|---|---|
| `autoimmune.md` | 22 | 1 (mixed bolding through lists) | "fire alarm" metaphor, dense lists, "protocol" | `featured`; says "we don't diagnose/treat… rheumatologist" (good); calibrated "may help" | **P1** |
| `hormone-imbalance.md` | 19 | 0 | dense lists | "protocol"; DUTCH framing; on-brand | **P1** |
| `digestive-issues.md` | 17 | 0 | dense lists | "protocol"; gut claims calibrated | **P1** |
| `thyroid.md` | 16 | 1 | dense lists; pubmed citation present | "protocol"; 3 T's reordered (fixed) | **P1** |
| `acne.md` | 9 | 1 | bold-gloss list | "protocol" | **P1** |
| `diabetes.md` | 9 | 0 | "leverage" was removed (audit); dense | watch "reversible" softening held | **P1** |
| `heart-disease.md` | 8 | 1 | bold-gloss | "protocol"; cardiovascular claims — calibrate | **P1** |
| `mental-health-brain.md` | 8 | 0 | "holistic" in frontmatter `seoTitle`/excerpt | **DSM-style diagnosis list** (PTSD/Bipolar/OCD/Autism) as patterns "we see" — scope risk (§5). "holistic" banned | **P0** |
| `joint-and-muscle-pain.md` | 7 | 2 | bold-gloss ×2 | clean-ish; missing-tagline flag (audit) | **P1** |
| `weight-loss.md` | 6 | 2 | bold-gloss ×2 | tagline inserted (fixed) | **P1** |
| `allergies.md` | 5 | 1 | bold-gloss | "protocol" | **P1** |
| `fatigue.md` | 5 | 0 | dense | "protocol" | **P1** |

### Blog posts (`src/content/posts/*.md` → `/post/<slug>`) — 24 files

Common to ALL 24: `complianceReviewed: false` (none flipped — §5);
related-post body links use **absolute `https://www.thewellnesswaymason.com/post/…`**
(H3, §5); H2 structure now present (H4 fixed). Frontmatter `seoTitle`/`seoDescription`
added on most. The 9 marked **(283)** still contain the **invalid phone in
reader-visible body text** (§5, CR-class).

| File | Em‑dash | BG | Tells / notes | Compliance | Pri |
|---|---|---|---|---|---|
| `why-you-should-get-your-allergies-tested-…` | 22 | 0 | (283) phone; long seoTitle | calibrated | **P1** |
| `the-3-t-s-…` | 21 | 0 | (283) phone | "root cause" scrubbed; 3 T's canonical | **P1** |
| `holistic-adhd-support-for-kids-…` | 21 | 6 | (283) phone; **"holistic" in slug+title+frontmatter ×4**; bold-gloss ×6 | **PEDIATRIC + herb-ADHD claims need 2+ citations or removal** (§5). Disclaimer already inserted | **P0** |
| `giving-your-immune-system-a-level-up-…` | 20 | 0 | **16 H2s** (heading over-fragmented) | seasonal immune claims | **P1** |
| `bloating-your-body-s-alarm-bell.md` | 18 | 0 | (283) phone; alarm metaphor | calibrated | **P1** |
| `natural-sciatica-relief-…` | 17 | 1 | (283) phone; **only post with an internal `/`-link** (H2 partial) | **categories mismatched** (pediatric/gut-health) (§5) | **P1** |
| `how-chiropractic-care-helps-strengthen-your-immune-system.md` | 16 | 0 | (283) phone; pubmed citation | **SIgA/Brennan-1991 claim** — verify/correct (§5) | **P0** |
| `why-am-i-still-in-pain-…` | 15 | 0 | (283) phone; emoji 📞; long seoTitle | "root cause" scrubbed | **P1** |
| `you-need-to-increase-stomach-acid-not-suppress-it.md` | 15 | 0 | slug fixed to "suppress"; title matches | stomach-acid claims — calibrate | **P1** |
| `living-with-pots-a-wellness-way-conversation.md` | 14 | 0 | "in a dys-rhythmic world" | **POTS** — cardiologist/autonomic deferral present; confirm before `complianceReviewed:true` (§5) | **P0** |
| `why-kids-struggle-after-school-…` | 13 | 0 | Keywords-stuffing line removed (CR10 fixed); most-tiled post | pediatric framing | **P1** |
| `rheumatoid-arthritis-…` | 12 | 0 | **em-dash in title**; truncated `…` excerpt | **RA** — rheumatologist deferral present; DMARD/biologic caveat still pending (§5) | **P0** |
| `why-i-chose-not-to-remove-my-gallbladder-…` | 12 | 0 | "importantly" (LLM); first-person | surgical-decision narrative — calibrate | **P1** |
| `statins-and-heart-health-…` | 11 | 0 | (283) phone; "Let's get a different perspective today!" | **STATINS** — "lowering cholesterol ≠ lowering risk"; needs "don't stop meds without prescriber" disclaimer (§5). slug no longer has "root-causes" (fixed) | **P0** |
| `all-salt-is-not-created-equal.md` | 9 | 0 | missing brand markers (audit) | recipe-adjacent | **P2** |
| `pregnant-add-a-chiropractor-to-your-team.md` | 7 | 0 | flagged for ryan-voice (audit) | **Pregnancy** — birth-outcome claims stripped, OB/midwife collab added; confirm `complianceReviewed:true` (§5) | **P0** |
| `chiropractic-care-the-hidden-key-to-treating-round-ligament-pain-in-pregnancy.md` | 4 | 0 | **(283) phone in body (CR14)**; `[283-223-8376](/contact)` | Pregnancy/Webster — calibrate | **P0** |
| `athleteschiropracticcare.md` | 5 | 0 | flagged for full rewrite (audit) | sports claims | **P1** |
| `craniosacral-therapy-…` | 5 | 0 | "healing"; 7 H2s | **CRANIOSACRAL — ORC 4734 efficacy-claim review (HOLD)** (§5) | **P0** |
| `chiropractic-care-for-newborns.md` | (in body) | 0 | "may help ease colic, reflux, nursing" | **NEWBORN/PEDIATRIC scope HOLD** (§5) | **P0** |
| `chaga-mushroom-benefits-…` | 3 | 0 | "holistic" in frontmatter; "ancient healers" cliché removed | herb claims — citations | **P1** |
| `meal-prep-duck-egg-casserole.md` | 3 | 0 | recipe; "goat's milk is dairy" fix check | **recipe byline / OAC 4734-9-02** (§5, M9) | **P2** |
| `sheep-yogurt-parfait.md` | 5 | 0 | "in today's world" ×2 (LLM); recipe | recipe byline; "Nordic Naturals" brand check (§5) | **P2** |
| `sweet-potato-burger-bowls.md` | 1 | 0 | recipe; image-alt-wrong-dish check (§5) | recipe byline | **P2** |

### Location pages (`src/content/locations/*.md` → `/locations/<slug>`)

| File | Em‑dash | Tells | Factual / compliance | Pri |
|---|---|---|---|---|
| `mason-oh.md` | 7 | bold-gloss neighbor list; doorway-pattern H2 spine | **STILL says "I-71 … Exit 25"** — audit says should be Exit 19 (§5). YMCA ref appears removed | **P1** |
| `west-chester-oh.md` | 4 | doorway spine | **"GE Aerospace" still present** (audit: HQ is Evendale) (§5) | **P1** |
| `cincinnati-oh.md` | 5 | doorway spine | "Cleveland Clinic Cincinnati" ref removed (fixed) | **P1** |
| `loveland-oh.md` | 5 | doorway spine | Exit-52 number removed/rewritten (fixed) | **P1** |

### Events (`src/content/events/*.md` → `/event-details/<slug>`)

Only **2 events** now (audit referenced 5; set changed). Both have valid
`date`/`endDate` (CR4 fixed) and normalized address (H9 fixed).

| File | Em‑dash | Notes | Pri |
|---|---|---|---|
| `cincy-crunchy-book-study.md` | 9 | recurring; in-clinic | **P2** |
| `pop-up-at-chasing-cali.md` | 9 | off-site; `rsvpUrl` = Calendly (freeze) | **P2** |

### Copy-bearing components

| File | Em‑dash (visible) | Notes | Pri |
|---|---|---|---|
| `NewsletterSignup.astro` | 0 visible (7 in comments) | heading "Get the *Test, Don't Guess* Newsletter" + success copy editable; **everything else frozen (MailerLite)** | **P2** |
| `NewsletterTeaser.astro` | 1 visible | one strip line; links to `#newsletter` (broken anchor — §4/§5) | **P2** |
| `ContactForm.astro` | 0 visible (4 comments) | labels + PHI note editable; **field `name`s + Formspree action frozen** | **P2** |
| `TestimonialCard.astro` | 2 visible | renders nothing (empty collection) — skip | skip |
| `Footer` / `Header` | 0 visible | nav labels = structural; **freeze the hrefs** | skip |
| all others (`Button`, `Card`, `SectionContainer`, `MapEmbed`, `HoursTable`, `Hero`, `PageLoader`, `BlogPostCard`, `Breadcrumbs`, `FAQAccordion`, `ServiceCard`, `ProviderCard`) | dashes in comments only | no on-screen copy | skip |

---

## 3. FREEZE LIST (do-not-touch inventory)

Anything below must survive every edit byte-for-byte. Representative shapes given
so the swarm recognizes them.

**Internal route hrefs / slugs / anchors (do not rename, retarget, or "tidy"):**
- Nav hrefs in `Header.astro`: `/`, `/about-us`, `/our-services`, `/pricing`,
  `/blog`, `/contact`. Footer hrefs: `/our-approach`, `/pricing`,
  `/find-my-condition`, `/locations`, `/events`, `/faq`, `/privacy-policy`.
- All `/conditions/<slug>`, `/post/<slug>`, `/locations/<slug>`,
  `/event-details/<slug>` link shapes (templates build them from `entry.id`).
- Content-collection **filenames = slugs = URLs**. Do NOT rename any `.md` file,
  including the typo-historical ones now corrected
  (`you-need-to-increase-stomach-acid-not-suppress-it.md`) and the long
  descriptive ones. Renaming breaks the route + any inbound link.
- **In-page anchor IDs** used by jump-links: `#chiropractic`,
  `#health-restoration`, `#webster-technique` (our-services), `#pricing-breakdown`
  (pricing), `#book` (contact + ContactForm PHI note), `#meet-dr-ryan` (about-us),
  `#main` (skip-link), `#newsletter` (teaser target). Condition/post related-list
  links. (Two anchors are already *broken* and listed in §5 as fixes — but do not
  "fix" by retargeting copy; that's a structural ticket.)

**External / booking / EHR / lab / social URLs (frozen; appear inline in bodies too):**
- Booking/EHR: `https://neoplatform.com/dd6a54e3c98/self-registration`
  (in `clinic.yml` AND hard-coded in ~26 markdown bodies + the `[Schedule…](…)`
  links). Event RSVP: `https://calendly.com/rdenome-thewellnessway`.
- GBP: `https://share.google/FKDLtEeW0g7tmvcUC`. Parent brand:
  `https://www.thewellnessway.com/`.
- Social (`clinic.yml`): Facebook `profile.php?id=61574457118997`, Instagram
  `thewellnessway.mason`, YouTube `@TheWellnessWay-Mason`, LinkedIn
  `ryan-denome-687899313`.
- `tel:` links derive from `clinic.phoneTel` (`+12832238376`) — **frozen as a
  binding to the config**, NOT as correct content. (The *displayed* number is a
  known error — see §5; fixing it is a `clinic.yml` change, not a copy edit.)
- `mailto:` = `mason@thewellnessway.com`.
- Lab partner names in prose (Access, Dutch/Precision Analytical, Genova,
  ImmunoLabs/Immuno, Mosaic, Quest) — names are factual NAP-class references;
  keep spelling/branding exact.
- PubMed citation URLs in `thyroid.md` and the immune-system post — keep.
- `/files/lab-pricing.pdf` (pricing page download) — keep path.

**Forms (every attribute frozen):**
- ContactForm: `action="https://formspree.io/f/mojrpepv"`, `method="POST"`,
  hidden `_subject` / `_next` (`/contact?sent=true`) / honeypot `_gotcha`, and
  field `name`s: `name`, `email`, `phone`, `topic` (+ its `<option value>`s
  general/services/event/other), `message`. The `?sent=true` success param read
  in `contact.astro`.
- NewsletterSignup (MailerLite): `action=…/jsonp/2332757/forms/187001870682687123/subscribe`,
  account id `2332757`, form id `187001870682687123`, container id
  `mlb2-41071627`, callback fn `ml_webform_success_41071627`, reCAPTCHA sitekey
  `6Lf1KHQUAAAAAFNKEX1hdSWCS3mRMv4FlFaNslaD`, field name `fields[email]`, hidden
  `ml-submit`/`anticsrf`, the `webforms.min.js` + `recaptcha/api.js` script src.

**Schema / JSON-LD (frozen — `src/lib/schema.ts`, `src/lib/site.ts`, and inline
page blocks):**
- `@id` anchors `${site.url}/#localbusiness` and `${site.url}/#owner` (entity
  graph dedupe — do not change).
- `@type` arrays (`['LocalBusiness','MedicalBusiness','Chiropractor']`,
  `BlogPosting`, `FAQPage`, `Event`, `MedicalCondition`, `MedicalTest`,
  `MedicalProcedure`, `BreadcrumbList`, `Place`).
- All inline page schema objects (faqSchema/procedureSchema/breadcrumbSchema in
  the 3 landing pages, condition/location/event templates). FAQ schema text is
  derived from the visible Q&A objects — editing the visible answer ALSO edits the
  schema, which is fine, but don't desync them or touch the `@type`/structure.
- `jsonLdString()` escaping; `personSchema()` `knowsAbout`/`hasCredential`.

**Meta / SEO / OG (frozen mechanics; prose values are editable — see below):**
- `site.url`, `site.domain`, `site.defaultOgImage` (`/og/default.jpg`), canonical
  builder, `fullTitle` append logic, the `<link rel="sitemap"/"alternate" rss>`,
  favicon/manifest links, `theme-color #80b741`.
- `astro.config.mjs` sitemap filter, `build.format`, `imageService`, redirects.

**Analytics / tracking IDs:** `clinic.analytics` (`ga4Id`/`metaPixelId`/`gtmId` —
currently empty, will populate post-launch) and the reCAPTCHA sitekey above. Keep
the wiring.

**Frontmatter — what's SAFE to edit vs FROZEN:**

| Field | Editable? |
|---|---|
| `title`, `seoTitle`, `seoDescription`, `excerpt`, `imageAlt` (prose) | **Editable** (this IS the de-slop target) |
| markdown **body prose** | **Editable** |
| FAQ `q`/`a` prose (inline arrays + condition `faqs`) | **Editable** (schema regenerates) |
| `slug` / filename | **FROZEN** |
| `date`, `updated`, `endDate` | **FROZEN** (drive schema + sort) |
| `image`, `ogImage`, `sourceUrl`, `rsvpUrl`, paths/URLs | **FROZEN** |
| `categories`, `tags`, `order`, `featured`, `recurring` | **FROZEN** (taxonomy/layout; §5 has separate re-categorization tickets — not copy work) |
| `tts`, `relatedPosts`, `relatedConditions`, `testingPanels` | **FROZEN** (controlled vocab / cross-links) |
| `complianceReviewed`, `complianceNotes` | **FROZEN — owner/clinician only** (do not flip in a copy pass) |
| `author`, `credentials`, `title` (provider) | **FROZEN** ("Dr. Ryan DeNome, DC" / "Doctor of Chiropractic") |
| `clinic.yml` NAP/hours/URLs/IDs | **FROZEN** for the copy swarm (phone fix is a separate owner ticket, §5) |

---

## 4. Cosmetic-only boundary (specific to this codebase)

**ALLOWED (cosmetic / in-scope for de-slop):**
- Rewriting visible prose in page files, markdown bodies, FAQ `a` strings,
  `excerpt`/`seoTitle`/`seoDescription`/`imageAlt` to reduce AI-slop.
- Replacing em-dashes with periods/commas/colons in body copy (and the HTML
  entity equivalents `&mdash;`/`&ndash;` on `pricing.astro`).
- Converting a `**Bold** — gloss` bullet list to prose, or varying its rhythm,
  **as long as the bullet's link target (if any) is preserved** (e.g. the
  `functional-medicine` "What we see most" bullets each wrap a `/conditions/*`
  link — keep the `<a href>`).
- Swapping banned words (leverage/holistic/empower/comprehensive/seamless…) and
  banned care-language (protocol→individual plan, regimen→care plan, wellness
  journey→health restoration, cure/fix/reverse→may help/support).
- De-fragmenting the over-headed immune post (16 H2s) into fewer H2/H3 — text
  only, headings are not anchors here.
- Tweaking a heading word ("Who we **treat**" → "Who we see") — visible text only.

**OUT OF SCOPE (structural / "big UI change" — do NOT do in a copy pass):**
- Changing fonts (Lora/Inter) or the color tokens in `global.css`.
- Adding/removing/reordering `<SectionContainer>` blocks, grids, cards, or the
  two-arms / 4-step / 3-T's section architecture.
- Renaming files/slugs/routes; retargeting any `href`/anchor (including the two
  broken ones in §5 — those are separate structural tickets).
- Touching any component's markup contract (`Button` variants, `Card` slots,
  `FAQAccordion` props), the MailerLite/Formspree DOM, or any JSON-LD object.
- Editing `privacy-policy.astro`, `admin/index.astro`, `style-guide.astro`.
- Flipping `complianceReviewed` or writing `complianceNotes`.
- "Fixing" the displayed phone number in copy (it's wrong, but the fix is a
  `clinic.yml` one-liner owned by the human — §5).

---

## 5. Open items carried from the prior audits (re-verified against current tree)

**Already fixed (do NOT re-do — noted so the swarm doesn't waste effort):** Wix
CDN images rehosted to `/images/...` (CR2 — only 2 demo refs remain, in the
noindexed style-guide); Wix scrape leftovers gone (CR11); `share.google` "Call"
links gone (CR11-adjacent); default OG path wired (CR3 mechanics); canonical
`.html` strip (CR5); `/our-services` `tel:` prefix (CR6); branded 404 (CR7);
`/privacy-policy` `noIndex` (M11); event `startDate`/`endDate` valid (CR4); event
address normalized (H9); "Keywords:" stuffing line removed (CR10); frontmatter
unicode + `\\` artifacts (CR12/CR13); statins `root-causes` slug renamed; "root
cause" scrubbed from bodies (H1); H2/H3 structure restored across all 24 posts
(H4); Cincinnati "Cleveland Clinic" + Loveland "Exit 52" references corrected;
find-my-condition H1/breadcrumb consistency + Mason/Cincinnati mentions (H5);
homepage Gandhi attribution; `seoTitle` added on long-title posts (H16 partial);
privacy processor disclosures.

**STILL OPEN — factual / NAP errors:**
1. **Invalid phone `(283) 223-8376` everywhere (CR1).** `clinic.yml:7-8`
   (`phone` + `phoneTel`) propagates to header/footer/contact/pricing/schema/all
   `tel:` links. **283 is not a valid NANP area code.** Owner must supply the real
   513/937 number; one-line `clinic.yml` fix. *Copy-swarm action: none — flag only.*
2. **Phone in reader-visible body text (CR14 + wider).** The `(283) 223-8376`
   string is visible in **9 post bodies**: bloating l.55, round-ligament l.68,
   holistic-adhd l.74, immune-system l.59, sciatica l.84, 3-t's l.74, statins l.84,
   allergies-tested l.68, why-still-in-pain l.52. Several pair a correct
   `tel:+12832238376` with the wrong *display* number. Must be updated in lockstep
   with the `clinic.yml` fix.
3. **`mason-oh.md:53` still says "I-71 … Exit 25"** — audit says Mason-Montgomery
   Rd is **Exit 19**. UNRESOLVED.
4. **`west-chester-oh.md` still references "GE Aerospace"** (l.5 excerpt, l.24) —
   audit: GE Aerospace HQ is Evendale; recommended softening to "regional
   employers." UNRESOLVED (owner call).
5. **Recipe-post factual checks** still pending: sweet-potato image-alt may
   describe the wrong dish; duck-egg "dairy-free milk or goat's milk" (goat's milk
   IS dairy); sheep-yogurt "Nordic Naturals collagen" brand plausibility. Owner to
   confirm.

**STILL OPEN — SEO / structural:**
6. **All 24 posts use absolute `https://www.thewellnesswaymason.com/post/…`**
   related-links (H3). Should be relative `/post/…`. (Structural find/replace, not
   a copy edit.)
7. **Near-zero blog→commercial internal links (H2).** Only `sciatica` links to a
   `/`-path; the rest pass no equity to `/our-services` / `/find-my-condition` /
   `/pricing`. Structural enhancement.
8. **Blog category-filter pills link to `#${cat}` anchors that don't exist**
   (`blog.astro:63`). Broken in-page nav. Structural.
9. **NewsletterTeaser links to `#newsletter`** but the MailerLite container id is
   `mlb2-41071627`, not `newsletter` — broken jump-link. Structural.
10. **Category mismatches (H8):** sciatica tagged `pediatric, gut-health`;
    immune-system `pediatric, hormones`; chaga `pediatric…`; craniosacral/newborns
    over-tagged. Taxonomy ticket (frozen for copy swarm).
11. **`giving-your-immune-system-…` has 16 H2s** — heading over-fragmentation;
    consolidate (this one IS a copy/heading task).
12. **`providers/dr-ryan-denome.md` is orphaned** (no template renders it); bio is
    duplicated in 2 page files. Owner: wire it or delete it.

**STILL OPEN — compliance HOLDs / clinician sign-off (the §6 "human" set):**
13. `complianceReviewed: false` on **all 24 posts** — none flipped. Per-post owner
    sign-off required (ORC 4734).
14. **`chiropractic-care-for-newborns.md`** — "may help ease colic, reflux,
    difficulty nursing." **Pediatric scope HOLD.**
15. **`craniosacral-therapy-…`** — efficacy claims; **ORC 4734 review HOLD.**
16. **`faq.astro` newborn-adjustment answer** — "may support the nervous system"
    pediatric claim; clinician sign-off.
17. **`holistic-adhd-support-for-kids-…`** — herb-ADHD claims need 2+ citations or
    removal; "holistic" in slug/title/frontmatter (slug frozen; title/excerpt
    editable). Pediatric disclaimer already present.
18. **`statins-and-heart-health-…`** — needs explicit "do not stop medication
    without your prescribing physician" disclaimer.
19. **`rheumatoid-arthritis-…`** — needs DMARD/biologic coordination caveat in the
    diet section (rheumatologist deferral already present).
20. **`how-chiropractic-care-helps-strengthen-your-immune-system.md`** — SIgA /
    Brennan-1991 claim is likely misattributed; correct or remove.
21. **`living-with-pots-…`** and **`pregnant-add-a-chiropractor-…`** — flagged
    CLEAN by prior audit (cardiologist/autonomic and OB/midwife collab in place);
    owner just needs to confirm + flip `complianceReviewed`.
22. **`conditions/mental-health-brain.md`** — DSM-style diagnosis list (PTSD,
    Bipolar, OCD, Autism) as patterns "we see"; reframe to "patients arriving with
    these diagnoses." Owner call. Also "holistic" in frontmatter.
23. **`dutch-test-mason-oh.astro`** — 4-OH estrogen-metabolite "higher risk /
    cancer risk" framing: clinician sign-off before softening/keeping.
24. **`functional-medicine-mason-oh.astro` page title + positioning** — leans on
    "functional medicine" as the page identity. The brand rule is **DC, never
    "functional medicine doctor" as a standalone title.** The body keeps "Doctor of
    Chiropractic"; but the page-level framing is an owner/brand decision (keep the
    SEO slug either way — it's frozen).
25. **Recipe posts (M9)** — sheep-yogurt / sweet-potato / duck-egg carry the
    "Reviewed and approved by Dr. Ryan DeNome, DC" byline but contain no
    chiropractic term. OAC 4734-9-02 — counsel read.

---

## 6. Recommended swarm batching

Group by template/risk so agents don't collide and so the compliance set is
quarantined from automation. **Hard rule: no agent flips `complianceReviewed` or
touches anything in §3.**

**Batch A — Core marketing pages (automatable, P1).** `index`, `our-approach`,
`our-services`, `find-my-condition`, `about-us`, `contact`, `events`,
`locations/index`, `blog`, `dr-ryan-denome`. Em-dash cuts, banned-word swaps
(empower/comprehensive/treat→see, protocol→plan), break bold-gloss lists. Preserve
all anchors/links.

**Batch B — Condition pages (P1, template-uniform).** All 12 `conditions/*.md`.
Normalize the inconsistent bullet bolding, cut em-dash density, vary the 3-T's
list, swap "protocol." **Exception: `mental-health-brain.md` → Batch E** (DSM list).

**Batch C — Non-clinical blog posts (P1/P2).** The recipe + lifestyle + general
posts NOT in Batch E: all-salt, athletes, bloating, chaga, gallbladder,
immune-sugar-holidays, kids-after-school, sciatica*, stomach-acid, 3-t's,
why-still-in-pain, allergies-tested, duck-egg, sheep-yogurt, sweet-potato.
De-slop prose; **leave `complianceReviewed` false**; do the immune-post heading
consolidation (#11). *(sciatica/recipe posts still need the §5 factual + recipe-byline
checks — copy edits ok, factual fixes flagged to owner.)*

**Batch D — Location pages (P1).** 4 `locations/*.md`. De-slop + vary the
doorway-pattern H2 spine. **Flag (don't auto-change) the Exit-25 and GE-Aerospace
factual items to the owner.**

**Batch E — COMPLIANCE / HUMAN SIGN-OFF ONLY (do NOT automate):**
- Pediatric/newborn: `chiropractic-care-for-newborns`, `holistic-adhd-support-for-kids`,
  `faq.astro` newborn answer, `chiropractic-care-…round-ligament…` (pregnancy).
- Pregnancy: `pregnant-add-a-chiropractor`, `webster-technique-mason-oh` (clean,
  but pregnancy claims — light touch + confirm).
- Cardiometabolic/autoimmune: `statins-and-heart-health`, `rheumatoid-arthritis`,
  `how-chiropractic-care-helps-strengthen-your-immune-system` (SIgA),
  `dutch-test-mason-oh` (estrogen-metabolite cancer-risk framing).
- POTS: `living-with-pots`. Mental health: `conditions/mental-health-brain`.
- Craniosacral: `craniosacral-therapy` (ORC 4734 HOLD).
- Brand-positioning call: `functional-medicine-mason-oh` page title.
These get a clinician/owner read; the swarm may *draft* calibrated alternatives
but must not ship without sign-off, and must not flip `complianceReviewed`.

**Batch F — Owner-only structural tickets (not the copy swarm at all):** phone
fix in `clinic.yml` (#1/#2), absolute→relative post links (#6), broken anchors
(#8/#9), internal-linking pass (#7), re-categorization (#10), orphaned providers
collection (#12), recipe factual checks (#5). List these so they aren't
mistaken for copy work and lost.
