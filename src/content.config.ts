import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date().optional(),
    // Optional last-updated date. When set, drives schema dateModified so Google
    // sees a freshness signal distinct from the original publish date (Manus 1.12).
    updated: z.coerce.date().optional(),
    author: z.string().default('Dr. Ryan DeNome, DC'),
    excerpt: z.string().optional(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    categories: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    avatars: z.array(z.string()).default([]),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    ogImage: z.string().optional(),
    complianceReviewed: z.boolean().default(false),
    complianceNotes: z.string().optional(),
    sourceUrl: z.string().optional(),
    readTime: z.string().optional(),
    featured: z.boolean().default(false),
  }),
});

const events = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/events' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    location: z.string().default('The Wellness Way - Mason'),
    recurring: z.boolean().default(false),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    rsvpUrl: z.string().optional(),
    excerpt: z.string().optional(),
    sourceUrl: z.string().optional(),
  }),
});

const testimonials = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/testimonials' }),
  schema: z.object({
    attribution: z.string(),
    source: z.enum(['composite', 'signed-consent']).default('composite'),
    condition: z.string().optional(),
    quote: z.string(),
    featured: z.boolean().default(false),
    date: z.coerce.date().optional(),
  }),
});

const faqs = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/faqs' }),
  schema: z.object({
    question: z.string(),
    answer: z.string(),
    category: z
      .enum(['new-patient', 'insurance', 'services', 'scheduling', 'general'])
      .default('general'),
    order: z.number().int().default(0),
  }),
});

const providers = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/providers' }),
  schema: z.object({
    name: z.string(),
    credentials: z.string().default('DC'),
    title: z.string().default('Doctor of Chiropractic'),
    photo: z.string(),
    photoAlt: z.string().optional(),
    // bio can live in frontmatter (Decap's markdown widget) OR in the markdown body.
    // Optional in schema; consumers fall back to entry body when missing.
    bio: z.string().optional(),
    education: z.array(z.string()).default([]),
    certifications: z.array(z.string()).default([]),
    specialties: z.array(z.string()).default([]),
    linkedinUrl: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
  }),
});

const conditions = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/conditions' }),
  schema: z.object({
    title: z.string(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    excerpt: z.string(),
    image: z.string(),
    imageAlt: z.string(),
    order: z.number().int().default(0),
    featured: z.boolean().default(false),
    tts: z.array(z.enum(['traumas', 'toxins', 'thoughts'])).default([]),
    relatedPosts: z.array(z.string()).default([]),
    relatedConditions: z.array(z.string()).default([]),
    testingPanels: z.array(z.string()).default([]),
  }),
});

const locations = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/locations' }),
  schema: z.object({
    title: z.string(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    excerpt: z.string(),
    locale: z.string(),
    state: z.string().default('OH'),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    order: z.number().int().default(0),
    distanceFromClinic: z.string().optional(),
    drivingTime: z.string().optional(),
  }),
});

// NOTE: Site settings (src/content/settings/clinic.yml) are edited via Decap CMS
// but NOT yet registered as an Astro content collection. Phase 7 will wire the
// YAML through to src/lib/site.ts to replace the hardcoded values. Until then,
// Decap edits the YAML directly via the GitHub backend.

export const collections = {
  posts,
  events,
  testimonials,
  faqs,
  providers,
  conditions,
  locations,
};
