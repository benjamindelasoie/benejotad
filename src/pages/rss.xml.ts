import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getAllItems } from '../lib/content';

export const GET: APIRoute = async (context) => {
  const items = await getAllItems();
  return rss({
    title: 'benejotad',
    // RSS 2.0 requires a channel <description>, so this one can't simply be
    // dropped the way the page-level meta default was. Kept plain on purpose.
    description: "Benja's personal site.",
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
