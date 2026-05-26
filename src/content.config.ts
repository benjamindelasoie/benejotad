import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
// Astro 6 deprecated re-exporting `z` from `astro:content`; import it from
// `astro/zod` so the zod version always matches Astro's bundled copy.
import { z } from 'astro/zod';

/**
 * The interconnection spine: every content type shares one base shape, so new
 * views are queries over the same tagged, linked collection rather than new
 * templates. See the approved design doc, Premise 4.
 */

// A typed cross-collection link.
//
// The design doc proposed `z.union([reference('posts'), reference('trips'), ...])`,
// but Astro's reference() turns a bare slug into `{ collection, id }` using the
// FIRST branch of the union — it can't tell which collection a plain slug belongs
// to. So we store the collection name explicitly and resolve with getEntry() in
// pages. Same intent (typed cross-collection links), without the silent mis-tag.
const linkRef = z.object({
  collection: z.enum(['posts', 'trips', 'work', 'books', 'movies']),
  slug: z.string(),
});

const baseItem = z.object({
  title: z.string(),
  // Authored as ISO 8601 in frontmatter (e.g. `date: 2026-05-18`), coerced to a
  // Date for sorting/formatting. Keeps the timezone-safe convention from the doc.
  // Constrain the input to string|Date first: bare `z.coerce.date()` would turn
  // an empty `date:` (null) or a stray number into a silent 1970-01-01.
  date: z.union([z.string(), z.date()]).pipe(z.coerce.date()),
  draft: z.boolean().default(false),
  // Dedupe so duplicate tags can't skew tag counts or related-tag scoring.
  tags: z
    .array(z.string())
    .default([])
    .transform((tags) => [...new Set(tags)]),
  cover: z.string().optional(),
  // One-line skim summary (used on the landing rail and /work for recruiters).
  summary: z.string().optional(),
  // Dedupe so a repeated target can't crowd out the related rail with copies.
  links_to: z
    .array(linkRef)
    .default([])
    .transform((links) => {
      const seen = new Set<string>();
      return links.filter(({ collection, slug }) => {
        const key = `${collection}:${slug}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }),
});

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: baseItem.extend({
    kind: z.enum(['food', 'thought', 'update']),
  }),
});

const trips = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/trips' }),
  schema: baseItem.extend({
    location: z.string(),
    days: z.number().int().positive(),
  }),
});

const work = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/work' }),
  schema: baseItem.extend({
    role: z.string(),
    // Restrict to http(s) so a content entry can't smuggle a javascript:/data:
    // scheme into the rendered <a href> on /work. z.url() alone accepts both.
    repo_url: z
      .url()
      .refine((u) => /^https?:\/\//i.test(u), 'repo_url must be an http(s) URL')
      .optional(),
  }),
});

// V1.5 adds `books` (manual JSON), V2 adds `movies` (Letterboxd RSS auto-pull).
// They're already valid `linkRef` targets above so links can point at them early.
export const collections = { posts, trips, work };
