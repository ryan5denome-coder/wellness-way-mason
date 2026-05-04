# The Wellness Way — Mason

Marketing + content website for [The Wellness Way - Mason](https://www.thewellnesswaymason.com),
a chiropractic clinic in Mason, Ohio operated by Dr. Ryan DeNome, DC.

This is a migration from Wix to Astro + Tailwind v4 + Decap CMS, hosted on
Cloudflare Pages. Replaces the prior Wix-hosted site at the same domain.

## Tech stack

| Layer | Tool |
|---|---|
| Framework | [Astro 6](https://astro.build) (static, multi-page) |
| Styling | [Tailwind v4](https://tailwindcss.com) via `@tailwindcss/vite` (`@theme` block in `src/styles/global.css`) |
| Type safety | TypeScript (strict) |
| Content | Astro Content Collections + Markdown frontmatter (Zod-validated schemas) |
| CMS | [Decap CMS](https://decapcms.org) at `/admin` (GitHub backend in production via Cloudflare Worker) |
| Smooth scroll | [Lenis](https://github.com/darkroomengineering/lenis) |
| Hosting | Cloudflare Pages (Node 22 via `.nvmrc`) |
| OAuth proxy | Cloudflare Worker at `worker/decap-oauth.js` (deployed as `decap-oauth-tww`) |
| Image optimization | Astro Image (`astro:assets`) — WebP + responsive srcset |

## Local development

Prereqs: Node 22+ (`.nvmrc` pinned), npm.

```bash
# Install deps
npm install

# Astro dev server (no CMS)
npm run dev
# → http://localhost:4321

# Astro dev + Decap CMS local proxy (lets you edit /admin without GitHub auth)
npm run dev:cms
# → http://localhost:4321/admin

# Production build (also catches type errors)
npm run build
# → dist/

# Preview the production build locally
npm run preview
```

## Project structure

```
public/
  admin/config.yml       Decap CMS configuration (collections, fields, backend)
  files/lab-pricing.pdf  Wix-rehosted lab pricing PDF
  images/partners/       Lab partner logos (Access, Dutch, Genova, ImmunoLabs, Mosaic)
  _redirects             Cloudflare Pages 301 + 410 redirect rules

src/
  assets/clinic/         Clinic photos that flow through Astro Image (WebP + srcset)
  components/            Reusable Astro components (Header, Footer, Card, FAQAccordion, etc.)
  content/               Astro Content Collections (Decap writes here)
    posts/               Blog posts (24 migrated from Wix, real publication dates)
    events/              Events (5)
    providers/           Provider bios (Dr. Ryan)
    settings/clinic.yml  Site settings singleton (NAP, hours, social, analytics)
    testimonials/        Patient testimonials (composite or signed-consent)
    faqs/                Standalone FAQ entries (FAQ collections live page-side)
  content.config.ts      Zod schemas for content collections
  layouts/               BaseLayout (SEO meta, JSON-LD slot, header/footer)
  lib/
    site.ts              Centralized site config (loads clinic.yml at build time)
    schema.ts            JSON-LD helpers (LocalBusiness + MedicalBusiness + Chiropractor)
  pages/                 Routes (one .astro file per page)
  styles/global.css      Brand tokens (@theme), base layer, scroll-reveal, hover polish

worker/
  decap-oauth.js         Cloudflare Worker for Decap GitHub OAuth proxy
  wrangler.toml          Worker deployment config
```

## Brand standards (binding)

- **Voice**: empathic before clinical, "we test, don't guess", no "root cause" branding (use "ask why," "underlying drivers," "the patterns").
- **Compliance**: Ohio chiropractic scope (ORC 4734) — no cure claims, no infectious-disease treatment claims, signed-consent or composite-only testimonials (OAC 4734-9-02(Q)).
- **Palette**: TWW Green `#80B741` (PMS 368), TWW Dark Grey `#414444` (PMS Black 7), TWW Light Grey `#DDDDDE` (PMS 427), TWW Beige `#DCD4C8` (PMS Warm Grey 1).
- **Type**: Lora (display) + Inter (body) via Google Fonts.
- **Two arms of the practice**: Chiropractic ("We Do Health Differently") + Health Restoration ("Test, Don't Guess"). Both are full-cost-transparent, no hidden upcharges.

## Deployment

### Cloudflare Pages (the marketing site)

1. **GitHub repo**: `ryan5denome-coder/wellness-way-mason` (public).
2. **Cloudflare Pages**:
   - Connect the GitHub repo.
   - Framework preset: **Astro**.
   - Build command: `npm run build`.
   - Build output directory: `dist`.
   - Node version: `22` (read from `.nvmrc` automatically).
3. After first build, the staging URL is `wellness-way-mason.pages.dev`. Custom domain (`thewellnesswaymason.com`) is wired only after staging is approved (Phase 10 of the migration plan).

### Decap OAuth Worker (`decap-oauth-tww`)

```bash
cd worker

# First-time deploy
npx wrangler deploy
# → prints https://decap-oauth-tww.<account>.workers.dev

# Set secrets (one-time)
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
```

Then update `public/admin/config.yml`:

```yaml
backend:
  base_url: https://decap-oauth-tww.<account>.workers.dev
  auth_endpoint: /auth
```

In your GitHub OAuth App, set:
- **Homepage URL**: `https://www.thewellnesswaymason.com`
- **Authorization callback URL**: `https://decap-oauth-tww.<account>.workers.dev/callback`

### Editing content via /admin

After the Worker + OAuth App are live:
- Visit `/admin` on the production site.
- Click "Login with GitHub".
- Decap commits content edits as branches/PRs to the GitHub repo.
- Cloudflare Pages auto-rebuilds on merge.

## Migration history

12-phase migration plan lives in the user's local plan file
(`~/.claude/plans/use-the-following-prompt-cozy-riddle.md`). Phases 0–8 are
complete. Phase 9 (this deploy) and Phase 10 (domain cutover from Wix to
Cloudflare DNS) are the remaining steps.

## License

© Wellness Way Mason LLC. All rights reserved.
