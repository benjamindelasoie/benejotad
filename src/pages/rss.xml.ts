import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getAllItems } from '../lib/content';

export const GET: APIRoute = async (context) => {
  const items = await getAllItems();
  return rss({
    title: 'benejotad',
    description: 'Benja — voice, work, and life, rendered as one interconnected unit.',
    // `site` comes from astro.config.mjs; required for absolute item links.
    site: context.site!,
    items: items.map((item) => ({
      title: item.title,
      pubDate: item.date,
      description: item.summary,
      link: item.url,
      categories: item.tags,
    })),
  });
};
