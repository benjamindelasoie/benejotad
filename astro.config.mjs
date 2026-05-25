// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // TODO: swap for the real domain once chosen (benja.dev? benjadelasoie.com?).
  // Required by @astrojs/sitemap and the RSS feed to emit absolute URLs.
  site: 'https://benejotad.example.com',

  integrations: [mdx(), react(), sitemap()],
});
