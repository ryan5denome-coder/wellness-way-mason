// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

import cloudflare from '@astrojs/cloudflare';
import {
  cleanupPublishedHeroes,
  preparePublishedHeroes,
  rehypeScheduledPostLinks,
} from './src/lib/rehype-scheduled-links.mjs';

// Preview the site as of another Eastern calendar day. Unset in production.
const publishAsOf = process.env.PUBLISH_AS_OF ?? '';

// Hero files live outside public/. Copy only the ones whose posts are live,
// then remove the copies so they are not left in the working tree.
preparePublishedHeroes(publishAsOf);
const cleanHeroCopies = () => cleanupPublishedHeroes();
process.once('exit', cleanHeroCopies);

// https://astro.build/config
export default defineConfig({
  site: 'https://www.thewellnesswaymason.com',
  trailingSlash: 'never',

  build: {
    format: 'file',
  },

  integrations: [
    {
      name: 'scheduled-hero-cleanup',
      hooks: {
        'astro:build:done': () => {
          cleanupPublishedHeroes();
        },
      },
    },
    sitemap({
      filter: (page) =>
        !page.includes('/admin') &&
        !page.includes('/style-guide') &&
        // /links is the link-in-bio hub — noindex, so keep it out of the sitemap too
        !page.includes('/links') &&
        !page.includes('/uploads/') &&
        !page.includes('/_'),
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
  ],

  markdown: {
    rehypePlugins: [[rehypeScheduledPostLinks, { publishAsOf }]],
  },

  vite: {
    define: {
      'import.meta.env.PUBLISH_AS_OF': JSON.stringify(publishAsOf),
    },
    plugins: [tailwindcss()],
  },

  adapter: cloudflare({
    // Skip the Cloudflare Images runtime binding — Astro Image already produces
    // WebP variants at build time via 'compile' mode. Avoids needing the IMAGES
    // binding to be provisioned.
    imageService: 'compile',
  }),
});