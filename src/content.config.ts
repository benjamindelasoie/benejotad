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
  date: z.coerce.date(),
  draft: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  cover: z.string().optional(),
  // One-line skim summary (used on the landing rail and /work for recruiters).
  summary: z.string().optional(),
  links_to: z.array(linkRef).default([]),
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
    repo_url: z.url().optional(),
  }),
});

// V1.5 adds `books` (manual JSON), V2 adds `movies` (Letterboxd RSS auto-pull).
// They're already valid `linkRef` targets above so links can point at them early.
export const collections = { posts, trips, work };
