// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Public canonical domain (apex). Used by @astrojs/sitemap and the RSS feed
  // to emit absolute URLs; www.benejotad.xyz redirects here.
  site: 'https://benejotad.xyz',

  integrations: [mdx(), react(), sitemap()],
});
