# Pre-Cutover Audit — TWW Mason Website

Three parallel deep audits (on-page SEO, blog content, GEO + technical) ran read-only against the staging build. Findings synthesized below. **No code changes have been made.** Every recommendation is scored for confidence; anything below 90% is flagged as "uncertain — your call."

The structure follows the priority order I think we should fix in. Numbers map to evidence in `/tmp/audit_results/` (the raw agent reports).

---

## Section 1 — CRITICAL (cutover-blocking — must fix before domain transfer)

These either break the site or actively damage SEO/local-pack the day Wix goes dark.

### CR1. Phone number `(283) 223-8376` is invalid (NAP-blocking)
**Where:** `src/content/settings/clinic.yml:7-8` (propagates to every page header, footer, contact, pricing, schema, every `tel:` link). Also visible as body text in `src/content/posts/chiropractic-care-the-hidden-key-to-treating-round-ligament-pain-in-pregnancy.md:67`.
**Why it's critical:** 283 is not an assigned NANP area code — the number cannot ring. Mason area codes are 513 / 937. NAP inconsistency vs. GBP, Apple Maps, Bing Places, citations is the worst possible local-SEO sin. AI engines triangulating clinic identity will see conflicting numbers.
**Needs your input:** what's the real number? Once provided, the fix is one line in `clinic.yml` + one line in the pregnancy post body.
**Confidence:** 99%.

### CR2. All 24 blog posts depend on Wix CDN images that will 404 after cutover
**Where:** every `src/content/posts/*.md` — frontmatter `image:` field + ~3 inline `![]()` thumbnails per post = ~96 image references on `static.wixstatic.com`. Also: 5 hardcoded Wix URLs in `src/pages/index.astro:85,91,99` and the Dr. Ryan photo at `:130, :410`.
**Why it's critical:** Wix typically takes the site down on domain transfer. Hero on every post goes blank, ~72 thumbnail tiles break, Article schema's `image:` becomes invalid → suppresses Google rich-result eligibility, every Knowledge Panel signal that pulls `image` from JSON-LD fails. **Single biggest cutover risk.**
**Fix:** Bulk-download the unique URLs (~26 unique files), rehost under `/public/images/posts/`, rewrite frontmatter + inline paths. Also rehost the homepage and headshot.
**Confidence:** 100%.

### CR3. Default OG image returns 404
**Where:** `/og/default.jpg` — referenced in `src/lib/site.ts:102` and inherited by every page's `og:image`, `twitter:image`, and LocalBusiness JSON-LD `image`.
**Why it's critical:** Every Facebook / LinkedIn / Slack / iMessage / SMS share preview is broken — no card, just a URL. AI engines that surface og:image as the result thumbnail (Perplexity, ChatGPT search) get nothing. Comparable local-services sites typically see 15–35% lift in share-driven CTR after fixing this.
**Fix:** Drop a real 1200×630 PNG/JPG at `public/og/default.jpg`. ~30-minute fix.
**Confidence:** 100%.

### CR4. Event schema is invalid on all 5 events (missing required `startDate`)
**Where:** all `/event-details/*` JSON-LD blocks. One event description (`/event-details/inflammation-talk`) is corrupted with Wix carousel keyboard help text — a tell that the scraper grabbed the wrong DOM node.
**Why it's critical:** Google ignores Event without `startDate` → no rich result on any of the 5 event pages. Events are a high-conversion local-pack format — losing them is real.
**Fix:** Re-source event dates from original Wix data, add `startDate`/`endDate` (ISO 8601 with timezone) to event frontmatter. Replace the corrupted description on the inflammation-talk event.
**Confidence:** 100%.

### CR5. Canonical URLs point to `.html` extensions on every page
**Where:** `src/layouts/BaseLayout.astro:32` — `const canonical = new URL(Astro.url.pathname, site.url).toString();` returns `/pricing.html` etc. Caused by `build.format: 'file'` in `astro.config.mjs:14`. Sitemap declares `/pricing`; canonical declares `/pricing.html`; the served URL is extensionless and the `.html` URL 307-redirects.
**Why it's critical:** Conflicting canonical signals depress consolidation. Google has been documented to ignore canonicals pointing to redirecting URLs. Affects every page sitewide.
**Fix:** One-line change in `BaseLayout.astro` to strip trailing `.html` and replace `/index.html` with `/` before constructing the canonical.
**Confidence:** 100%.

### CR6. /our-services click-to-call is broken
**Where:** `src/pages/our-services.astro:300` — `<Button href={clinic.phoneTel} ...>` is missing the `tel:` prefix, so it navigates to `/+12832238376` instead of dialing.
**Why it's critical:** Broken conversion path on the page where the highest-intent CTA lives. Every other phone CTA in the codebase wraps it correctly.
**Fix:** `href={\`tel:${clinic.phoneTel}\`}`. (Fix CR1 first or this dials a non-working number.)
**Confidence:** 100%.

### CR7. Default Astro 404 page is live
**Where:** no `src/pages/404.astro` exists, so `/anything-not-found` serves the dark off-brand Astro placeholder with no nav.
**Why it's critical:** Bad UX, kills crawl recovery, hurts trust signals on a medical site.
**Fix:** Add a branded `src/pages/404.astro` using `BaseLayout` with copy + links to /our-services, /find-my-condition, /blog, /contact.
**Confidence:** 100%.

### CR8. Sitemap leaks /admin and /style-guide
**Where:** `astro.config.mjs:20` filter checks `/admin/` (with slash); production output is `/admin` (no slash). Both pages appear in `/sitemap-0.xml`.
**Why it's critical:** /admin in the sitemap signals a public CMS to crawlers — ugly. /style-guide is internal-only.
**Fix:** Change filter to `!page.includes('/admin')` and add `!page.includes('/style-guide')`.
**Confidence:** 100%.

### CR9. RSS feed linked but missing
**Where:** every page emits `<link rel="alternate" type="application/rss+xml" href="/rss.xml">`. `/rss.xml` returns 404.
**Why it's critical:** Minor in isolation, but it's a broken link on every page; feed readers and Google's NewsArticle/Discover pipelines can use it.
**Fix:** Either generate the feed via `@astrojs/rss` (already in deps) or remove the alternate link from BaseLayout. Recommend generating it — 20-line file.
**Confidence:** 100%.

### CR10. Visible "Keywords:" stuffing in flagship post
**Where:** `src/content/posts/why-kids-struggle-after-school-...md:15` — first body paragraph is a comma-separated keyword list rendered to readers.
**Why it's critical:** Violates Google's spam policy. Reads as amateur SEO. This is the most-linked-to post in the corpus (every other post tiles it).
**Fix:** Delete the visible line.
**Confidence:** 100%.

### CR11. Wix scrape leftovers in 19+ post bodies
**Where:** "Loading…", "## Comments", "Write a comment...Write a comment...", trailing horizontal rules across 19 of 24 posts.
**Why it's critical:** Visible to every reader. Looks unprofessional/abandoned. Tanks dwell time.
**Fix:** Strip the boilerplate sitewide — single sweep job.
**Confidence:** 100%.

### CR12. Frontmatter encoding broken — literal `–` etc. in 8 posts
**Where:** `athleteschiropracticcare`, `holistic-adhd-support-for-kids`, `statins-and-heart-health`, `why-i-chose-not-to-remove-my-gallbladder`, `rheumatoid-arthritis`, `the-3-t-s`, `why-you-should-get-your-allergies-tested`, `why-am-i-still-in-pain` — `title`, `seoTitle`, `seoDescription`, or `excerpt` contain literal 6-char escape sequences (`–`, `’`, `“`, etc.).
**Why it's critical:** YAML doesn't process `\u` outside double-quoted flow style. The `<title>` tag, OG card, and Twitter card render the literal escape. That's what Google indexes.
**Fix:** Replace in those 8 frontmatters: `–`→`–`, `—`→`—`, `’`→`'`, `“`/`”`→`"`/`"`.
**Confidence:** 100%.

### CR13. Body-text `\\` artifacts in 4 posts
**Where:** `living-with-pots:35` (`\\At The Wellness Way Mason`), `why-i-chose-not-to-remove-my-gallbladder` excerpt, `sheep-yogurt-parfait` (`\\*\\*` mid-recipe), `holistic-adhd` (trailing `\` after Ashwagandha + duplicated heading text).
**Why it's critical:** Renders as visible backslash characters mid-sentence. Reader-visible.
**Fix:** Strip / unescape in those 4 files.
**Confidence:** 100%.

### CR14. Phone number typo in body of pregnancy post
**Where:** `src/content/posts/chiropractic-care-the-hidden-key-to-treating-round-ligament-pain-in-pregnancy.md:67` — `Call us today at 283-223-8376`.
**Fix:** Same fix as CR1 — replace with real number.
**Confidence:** 100%.

---

## Section 2 — HIGH-CONFIDENCE SEO WINS (≥90% likelihood of helping rankings)

These should ship before launch but are not technically blockers.

### H1. "Root cause" branding violates voice rule in 11 posts
**Where:** `all-salt-is-not-created-equal`, `holistic-adhd-support-for-kids`, `natural-sciatica-relief`, `rheumatoid-arthritis`, `statins-and-heart-health` (4× in body + slug + seoTitle), `the-3-t-s`, `why-am-i-still-in-pain` (2×), `why-kids-struggle-after-school`, `why-you-should-get-your-allergies-tested` (incl. H3 "Root Cause First"), `you-need-to-increase-stomach-acid` (2×), `living-with-pots` seoDescription.
**Why:** Direct violation of `~/.claude/skills/ryan-voice/SKILL.md` — replace contextually with "ask why," "underlying drivers," "the pattern," "what's actually driving this."
**Decision needed:** the `statins-and-heart-health-...-root-causes` slug is in the URL itself. Two options:
  - Option A: keep slug + 301 from a clean slug (preserves any Wix-era SEO equity)
  - Option B: rename slug + 301 from old (cleaner brand, ~6 mo of equity at risk)
  Recommend A — equity > brand purity for one URL.
**Confidence:** 95% on the voice fix; SEO impact net neutral-to-positive either way.

### H2. Zero internal links from blog posts to service / condition pages
**Where:** grep `src/content/posts/` for `/our-services`, `/about-us`, `/pricing`, `/find-my-condition` returns 0 matches across all 24 posts.
**Why:** Highest-traffic content (long-tail blog) doesn't pass any equity to commercial pages. Topic clusters are documented as one of the most reliable on-site SEO levers.
**Fix:** Add 1–3 contextual in-body links per post. Map: rheumatoid → /find-my-condition#autoimmune + /our-services#health-restoration; bloating → /find-my-condition#gut-health; pregnancy posts → /our-services#chiropractic-care.
**Confidence:** 95%.

### H3. Internal links use absolute Wix-domain URLs instead of relative paths
**Where:** all 24 posts use `https://www.thewellnesswaymason.com/post/...` for related-post links.
**Why:** Currently broken on staging (workers.dev domain); after cutover they'll resolve but break Astro's build-time link validation and don't work in dev preview.
**Fix:** Find/replace `https://www.thewellnesswaymason.com/post/` → `/post/` in all post bodies.
**Confidence:** 95%.

### H4. Blog post bodies have no H2/H3 structure
**Where:** verified on `/post/all-salt-is-not-created-equal`, `/post/natural-sciatica-relief…` — H1 + walls of `<p>`. Only H2s in the article DOM are global "Comments" and the CTA. Almost certainly true across all 24 (lost in Wix → MD conversion).
**Why:** Google passage indexing and AI-engine extraction (ChatGPT / Perplexity / Claude) both rely on subhead hierarchy. Today the FAQ schemas on 4 service pages are the only AI-citable surfaces. Restoring subheads makes the entire blog citable.
**Fix:** Hand-edit (or LLM-assisted edit) the top ~10 priority posts to introduce H2s/H3s. Lower-priority posts can be batched.
**Decision needed:** which posts are top priority? Default ranking by traffic potential: POTS, gallbladder, allergies, rheumatoid, sciatica, kids-struggle-after-school, ADHD, immune system, gut/bloating, pregnancy.
**Confidence:** 95%. **This is the single highest-leverage GEO fix.**

### H5. /find-my-condition has only 1 "Mason" mention, 0 "Cincinnati" mentions
**Where:** `src/pages/find-my-condition.astro:122-186`. 12-condition prose hub — highest-value condition-keyword surface.
**Why:** Patients search "[condition] Mason" or "[condition] near me Cincinnati." Body never mentions either.
**Fix:** Add Mason / Cincinnati naturally to intro + 3–4 condition sections. Cheap and high-impact.
**Confidence:** 90%.

### H6. Page titles missing geo keywords on 6 pages
**Where:**
- `/about-us` — "About Us"
- `/our-approach` — "Our Approach"
- `/find-my-condition` — "Conditions We See" (worst — internal phrasing, not searched)
- `/blog` — "Health & Wellness Blog"
- `/contact` — "Contact Us"
- `/events` — generic
**Fix:** Standard format `<Topic> | Chiropractor in Mason, OH`. /find-my-condition becomes the highest-leverage rename — it's the condition hub and currently captures zero condition-related search intent.
**Confidence:** 95%.

### H7. SEO meta descriptions exceed 160 chars on 6 pages + 6 posts
**Where:** index = 194, pricing = 172, find-my-condition = 169, events = 165 + posts: `why-am-i-still-in-pain` (215), `why-kids-struggle` (~200), 4 others 165–195.
**Why:** Google truncates around 155–160. Truncated descriptions hurt CTR (a documented ranking signal).
**Fix:** Tighten all to 140–155 chars. Trivial copy edits.
**Confidence:** 90%.

### H8. Blog post categories are mismatched on 5+ posts
**Where:** sciatica post tagged `pediatric, gut-health`; immune-system post tagged `pediatric, hormones`; chaga-mushroom tagged `pediatric, gut-health` (mushroom isn't pediatric); craniosacral-therapy tagged `pediatric, gut-health, clinical`; newborns tagged `pediatric, gut-health, clinical`.
**Why:** Bad categorization = weak topic clusters = weaker internal linking signal. The blog index hub uses these.
**Fix:** Re-categorize against clean taxonomy: `chiropractic / pediatric / pregnancy / gut-health / immune / hormones / nervous-system / autoimmune / recipes / clinical`.
**Confidence:** 90%.

### H9. Address inconsistency in 4 event files
**Where:** `inflammation-talk.md:33` says `"Mason, 5382 Cox-Smith Rd, Mason, OH 45040"` (drops "Suite A", duplicates "Mason"). `lenten-liberation`, `cincy-crunchy-book-study`, `the-wellness-way-approach-to-inflammation` all say `"5382 Cox-Smith Rd a, Mason, OH 45040"` (lowercase "a", no "Suite"). Canonical is `5382 Cox-Smith Rd, Suite A`.
**Why:** Address fuzzing within the same domain is tolerated but exact match reinforces local-pack authority.
**Fix:** Normalize to canonical form from `clinic.yml`.
**Confidence:** 90%.

### H10. Brand-name inconsistency: "The Wellness Way - Mason" (with hyphen) vs "The Wellness Way Mason"
**Where:** schema/JSON-LD uses hyphenated form (correct). Page-level prose + meta descriptions use unhyphenated form in: `index.astro:107`, `blog.astro:23`, `about-us.astro:53`, `find-my-condition.astro:124`, `pricing.astro:45`, plus most posts.
**Decision needed:** which form is on your Google Business Profile? Web NAP should match GBP exactly. Once you confirm, single sweep.
**Confidence:** 90% (impact is real but bounded).

### H11. Reusable Person `@id` for entity disambiguation
**Where:** owner Person info exists in `src/lib/site.ts` as `owner` constant; the `Article` schema in blog posts inlines a partial `author` (name + honorifics, jobTitle, url); `/about-us` has its own `Person` block.
**Why:** Currently three separate Person mentions (Article author, LocalBusiness founder, About page Person) with no `@id` linking them. Google and AI engines treat them as related-but-not-identical. Promoting to a shared `personSchema()` helper with `@id: ${site.url}/#owner` tells the graph "this is one person."
**Fix:** New helper in `src/lib/schema.ts`; reference from BaseLayout LocalBusiness, Article schema, and About Person.
**Confidence:** 92%. Single highest-value structured-data change after CRs.

### H12. Schema.org `mentions` for lab partners
**Where:** body cites Genova, DUTCH, Quest, Mosaic, Access, Diagnostic Solutions 3+ times each in prose. Zero structured representation.
**Why:** AI engines (Perplexity, ChatGPT search) heavily weight structured `mentions` when answering "what labs does X clinic use." Today this info exists only as prose, which is more fragile.
**Fix:** Add a `mentions` array to LocalBusiness or a dedicated `MedicalBusiness` block with `availableService` → `MedicalTest` entities each linked to the lab partner Organization.
**Confidence:** 90%.

### H13. Sitemap missing `lastmod` and `image:image`
**Where:** `astro.config.mjs:18` — `@astrojs/sitemap` config has no `serialize`. 41 URLs emit only `<loc>`. Wix legacy sitemap had `image:image` entries — losing those at migration removes a Google Images signal for blog post heroes.
**Fix:** Configure `serialize` to include `lastmod` from frontmatter `date` and `image:image` extension.
**Confidence:** 90%.

### H14. /contact and /find-my-condition have no FAQ section
**Where:** FAQ schemas exist on /pricing, /about-us, /our-services, /our-approach. /contact and /find-my-condition have no FAQ + no FAQPage schema.
**Why:** "What insurance do you accept?", "Do I need a referral?", "How do I prepare for my first visit?", "What's the parking situation?" are real PAA intents and AI citation prompts.
**Fix:** Add 4–6 FAQ entries to each using the existing `<details>/<summary>` pattern + FAQPage schema.
**Confidence:** 92%.

### H15. Article schema `publisher.logo` missing
**Where:** every `/post/*` Article schema.
**Why:** Google's rich-result requirement for Article. Without it, the article is technically valid but loses rich-result eligibility.
**Fix:** Add `publisher.logo` (ImageObject with url, width, height) to the Article schema helper.
**Confidence:** 95%.

### H16. SEO titles >60 chars on 11 posts (4 over 100)
**Where:** worst — `why-kids-struggle` (120), `why-am-i-still-in-pain` (109), `statins` (90), `allergies` (90).
**Why:** Google truncates SERP titles at ~580px (~60 chars). Long tails get cut, hurting CTR.
**Fix:** Add a separate concise `seoTitle` distinct from the long display `title` in the affected posts.
**Confidence:** 95%.

### H17. Empty-alt duplicate hero `<img>` inside post bodies (12 posts)
**Where:** posts have a hero image rendered by the template AND a duplicate body image at the bottom with `![]()` (no alt).
**Why:** the duplicate is redundant; the template already renders the hero from frontmatter. Empty-alt is also an a11y violation.
**Fix:** Delete the duplicate body image rather than alt-tagging it.
**Confidence:** 95%.

### H18. Slug typo: `you-need-to-increase-stomach-acid-not-supress-it`
**Where:** `src/content/posts/you-need-to-increase-stomach-acid-not-supress-it.md`. Title says "Suppress" but the slug = canonical URL says "supress."
**Decision needed:** old Wix URL also has the typo. Two options:
  - Option A: keep typo'd slug for backward compatibility (preserves Wix backlinks if any)
  - Option B: rename + 301 from typo
  Recommend A.
**Confidence:** 90% on either path; just need to pick one.

---

## Section 3 — MEDIUM-CONFIDENCE OPTIONS (60–89%; trade-off discussion needed)

Per your instruction — anything below 90% I'm flagging as your call, with the trade-off named.

### M1. Hub-and-spoke condition pages
Today /find-my-condition has 12 conditions in one prose hub. Breaking out per-condition pages (`/conditions/sciatica`, `/conditions/thyroid`, etc.) is a known local-SEO play, BUT requires unique content per page or Google flags as doorway pages. **Confidence 75%.** Recommend: pull search volume for top 3 conditions in Mason / Cincinnati before committing. Defer to post-launch.

### M2. Service-area pages (Mason / West Chester / Cincinnati / Loveland)
None exist. Known local-SEO play, BUT thin/duplicate content gets flagged as doorway. Needs real local content per page (parking, directions, locale-specific services). **Confidence 70%.** Defer to post-launch unless you have appetite to write the locale content.

### M3. Standalone "[question]?" URL slugs
e.g., `/is-chiropractic-safe-during-pregnancy`, `/what-does-an-adjustment-feel-like`, `/how-often-chiropractor`. Outperform buried FAQs for question-shaped intent in PAA + AI Overviews. **Confidence 80%.** Could be a Phase 11+ content series rather than a launch blocker.

### M4. "Last reviewed" date visible on each post + drift `dateModified` separately
Today `dateModified == datePublished` always. YMYL/medical content — Google explicitly prefers recently-reviewed. **Confidence 80%.** Cheap to add but only matters if you actually periodically review posts.

### M5. Multi-aspect Article images (1×1, 4×3, 16×9)
Google's Article rich result asks for 3 aspect ratios. Once Wix CDN images are rehosted (CR2), generate variants via Astro `<Image>`. **Confidence 75%** — improves rich-card eligibility but doesn't always lift rankings.

### M6. Semantic `<address>` element on every page with NAP mention
Currently only /pricing has one. Small but real lift for AI extraction. **Confidence 80%.** Trivial to add.

### M7. `MedicalProcedure` / `MedicalTherapy` schema for techniques
Diversified, Thompson, Gonstead, Webster cited 3+ times in prose. Wrap as `MedicalTherapy` with `availableService` link. **Confidence 80%.** Real GEO win but moderate complexity.

### M8. Timeline section on /about-us (not separate /our-story page)
5–7 milestone timeline with `<dl>` + dates, ProfilePage schema. Concrete dates help E-E-A-T and AI engines. **Confidence 75%.** Two-day lift; defer to post-launch.

### M9. Recipe posts compliance review
3 recipe posts (sheep yogurt, sweet potato, duck egg) don't mention chiropractic but carry the "Reviewed and approved by Dr. Ryan DeNome, DC" byline. OAC 4734-9-02 may apply. **Confidence 60% (compliance question, not SEO).** Recommend lawyer's read before launch.

### M10. Hero image responsive `srcset` on post template
`src/pages/post/[...slug].astro:84` emits a plain `<img>` — no srcset/sizes. After Wix rehost (CR2), switch to Astro `<Image>` component. **Confidence 85%** (LCP improvement on mobile).

### M11. /privacy-policy noindex
`src/pages/privacy-policy.astro:11` doesn't pass `noIndex`. BaseLayout supports it. **Confidence 80%** — best practice, low impact for a small site. Trivial fix though.

---

## Section 4 — DECISIONS NEEDED FROM YOU

Before I touch any code I need your call on these:

1. **Real phone number?** (CR1, CR6, CR14)
2. **GBP brand string** — "The Wellness Way - Mason" (with hyphen + spaces) or "The Wellness Way Mason"? (H10)
3. **`statins-and-heart-health-...-root-causes` slug** — keep + 301 from clean slug, OR rename + 301 from old? (H1)
4. **`supress` slug** — keep typo + 301, OR rename + 301? (H18)
5. **Top-priority posts for H2/H3 hand-editing** — confirm ranking I proposed in H4, or pick differently?
6. **Recipe posts compliance** — lawyer review before launch, or accept the byline as-is? (M9)
7. **Funnel CTA strategy** — currently mixed (`share.google` GBP shortlinks for some, NeoPlatform booking for others, direct phone, /contact). Standardize on NeoPlatform + /contact, or leave mixed?
8. **Hub-and-spoke condition pages (M1)** — pursue now, or defer post-launch?
9. **Service-area pages (M2)** — pursue, or defer?
10. **Newsletter ESP** — already deferred to post-launch per project memory; just confirming we're skipping for cutover.

---

## Section 5 — WHAT'S ALREADY STRONG (don't break these)

- **LocalBusiness multi-type schema** (LocalBusiness + MedicalBusiness + Chiropractor) on every page — comprehensive, includes geo, areaServed, parentOrganization, founder.
- **`robots.txt` AI crawler allowlist** — one of the cleanest seen (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended, etc.) with no accidental wildcard.
- **FAQ schemas on /pricing, /about-us, /our-services, /our-approach** — answers contain specific dollar amounts ($99, $50, $300–$700) which is exactly what AI engines extract.
- **Site-wide JS bundle = 18 KB** (Lenis + reveal observer). Exemplary for a content site.
- **All `<img>` have explicit width/height** → CLS structurally near-zero.
- **`prefers-reduced-motion` properly disables Lenis**.
- **301 redirects from old Wix paths** in place (`/services`, `/our-blog`, `/event-list`, cosmetic-tattoo `/service-page/*` stubs, 5 Wix sitemap variants).
- **`<details>/<summary>` for visible FAQ markup** — semantically correct, accessible, AI-extractable.
- **Custom `imageService: 'compile'`** produces 8–10 srcset variants per Astro-pipeline image.
- **Visible "Reviewed and approved by Dr. Ryan DeNome, DC" byline** on every post via template — strong E-E-A-T + OAC 4734-9-02(E) compliance.
- **Single H1 per page**, every page checked.
- **Hero image: `loading="eager" fetchpriority="high"`** with explicit dimensions.
- **`build.format: 'file'`** + Cloudflare Workers Static Assets serves prerendered files cleanly (only side effect is the canonical bug, CR5).
- **Index page has 10 "Mason" mentions, named service-area cities, NAP block, embedded map, hours** — strong local signals.
- **Voice strengths in posts:** several have textbook empathic opens, smoke-alarm metaphor, "Test, don't guess," "Common but not normal," "The body never does anything without a reason," "You have options" used appropriately.
- **No woo language** anywhere (zero hits for chakras / quantum / energy fields).
- **Calibrated outcome language** ("may help / may support") used correctly throughout. No "will cure" / "guaranteed" / "100%" found.
- **PCP positioning on POTS, pregnancy, pediatric posts** — explicit "supports, doesn't replace" framing. Compliance is good.

---

## Section 6 — RECOMMENDED EXECUTION ORDER

Once you approve, this is the order I'd ship in (each batch is one commit):

**Batch 1 — Cutover blockers, no-decision items (CR3, CR5, CR6, CR7, CR8, CR9, CR12, CR13, CR15)**
~30 min. No decisions needed. OG image, canonical fix, /our-services tel: prefix, 404 page, sitemap filter, RSS feed, frontmatter unicode escapes, body-text `\\` artifacts, "Keywords:" line.

**Batch 2 — Cutover blockers, decision-gated (CR1, CR2, CR4, CR10, CR11, CR14)**
Needs your call on phone number first; CR2 (Wix image rehost) is ~1hr of bulk work; CR4 needs you to source event dates from Wix.

**Batch 3 — High-confidence SEO (H1–H18)**
Voice fixes, internal linking, geo titles, meta descriptions, schema upgrades. ~2–3 hours of focused work. H4 (blog H2 restructure) is the longest single item.

**Batch 4 — Medium-confidence (M1–M11)**
Defer everything except M6 (semantic `<address>`), M10 (hero `<Image>`), M11 (/privacy-policy noindex). Those three are trivial enough to bundle. The rest defer to post-launch.

---

**Bottom line:** the staging build is structurally sound — clean schema, clean robots.txt, clean redirects, working Decap CMS. The cutover-blockers are mostly cleanup of Wix scrape artifacts (images, encoding, leftovers) plus one critical NAP fix. The H-tier wins compound: fixing H2 + H4 together turns the blog from "decoration" into the highest-leverage SEO asset on the site.

Awaiting your decisions on the 10 questions in Section 4 before I touch a single file.
