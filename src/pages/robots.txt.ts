import type { APIRoute } from 'astro';

// Allow all crawlers and point at the @astrojs/sitemap index. The sitemap URL
// is derived from `site` (astro.config.mjs) so it can't drift from the domain.
export const GET: APIRoute = ({ site }) => {
  const sitemapURL = new URL('sitemap-index.xml', site);
  const body = `User-agent: *
Allow: /

Sitemap: ${sitemapURL.href}
`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
