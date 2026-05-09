// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.thewellnesswaymason.com',
  trailingSlash: 'never',

  build: {
    format: 'file',
  },

  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/admin') &&
        !page.includes('/style-guide') &&
        !page.includes('/uploads/') &&
        !page.includes('/_'),
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: cloudflare({
    // Skip the Cloudflare Images runtime binding — Astro Image already produces
    // WebP variants at build time via 'compile' mode. Avoids needing the IMAGES
    // binding to be provisioned.
    imageService: 'compile',
  }),
});