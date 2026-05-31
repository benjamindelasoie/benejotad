import { getCollection } from 'astro:content';

/**
 * The query layer over the content collections. Every view (landing rail,
 * /work, tag pages, related rails) renders from the normalized item list here,
 * so adding a section is a query, not a new data path. (Design doc, Premise 4.)
 */

export type Linkable = 'posts' | 'trips' | 'work';

export interface NormalizedItem {
  collection: Linkable;
  slug: string;
  title: string;
  date: Date;
  tags: string[];
  summary?: string;
  /** Human label for the kind of thing this is (e.g. "trip", "food", "work"). */
  kind: string;
  url: string;
}

/** A cross-collection link as stored in `links_to`. */
interface LinkRef {
  collection: string;
  slug: string;
}

/**
 * Format a content date for display. Always renders in UTC — frontmatter dates
 * are authored as ISO 8601 (e.g. `2026-05-24` = UTC midnight), and formatting
 * in the build machine's local timezone would shift the day back. (Design doc:
 * "avoid timezone bugs.")
 */
export function formatDate(date: Date, month: 'short' | 'long' = 'long'): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month,
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * The home catalog's facets ("angles"), in stable display order. The home page
 * filters by these; /now reuses the same labels so an item reads the same
 * wherever it surfaces.
 */
export const ANGLES = ['Writing', 'Work', 'Trips', 'Food'] as const;

const ANGLE_BY_KIND: Record<string, string> = {
  trip: 'Trips',
  work: 'Work',
  food: 'Food',
  thought: 'Writing',
  update: 'Writing',
};

/** Map a raw item `kind` to its display "angle". Unknowns read as Writing. */
export function angleOf(kind: string): string {
  return ANGLE_BY_KIND[kind] ?? 'Writing';
}

function urlFor(collection: Linkable, slug: string): string {
  switch (collection) {
    case 'posts':
      return `/posts/${slug}`;
    case 'trips':
      return `/trips/${slug}`;
    case 'work':
      // /work is a single filtered list page; entries are anchors within it.
      return `/work#${slug}`;
  }
}

/** All published items across collections, newest first. */
export async function getAllItems(): Promise<NormalizedItem[]> {
  const notDraft = ({ data }: { data: { draft: boolean } }) => !data.draft;
  const [posts, trips, work] = await Promise.all([
    getCollection('posts', notDraft),
    getCollection('trips', notDraft),
    getCollection('work', notDraft),
  ]);

  const items: NormalizedItem[] = [
    ...posts.map((e) => ({
      collection: 'posts' as const,
      slug: e.id,
      title: e.data.title,
      date: e.data.date,
      tags: e.data.tags,
      summary: e.data.summary,
      kind: e.data.kind,
      url: urlFor('posts', e.id),
    })),
    ...trips.map((e) => ({
      collection: 'trips' as const,
      slug: e.id,
      title: e.data.title,
      date: e.data.date,
      tags: e.data.tags,
      summary: e.data.summary,
      kind: 'trip',
      url: urlFor('trips', e.id),
    })),
    ...work.map((e) => ({
      collection: 'work' as const,
      slug: e.id,
      title: e.data.title,
      date: e.data.date,
      tags: e.data.tags,
      summary: e.data.summary,
      kind: 'work',
      url: urlFor('work', e.id),
    })),
  ];

  // Newest first; collection+slug as a stable tiebreaker so items sharing a date
  // don't reshuffle the homepage and RSS feed between builds.
  return items.sort(
    (a, b) =>
      b.date.getTime() - a.date.getTime() ||
      a.collection.localeCompare(b.collection) ||
      a.slug.localeCompare(b.slug),
  );
}

/** Distinct tags with their item counts, most-used first. */
export async function getAllTags(): Promise<{ tag: string; count: number }[]> {
  const items = await getAllItems();
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const tag of item.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/**
 * The backlink rail: explicit `links_to` entries first, then items sharing the
 * most tags. This is the interconnection made visible at the bottom of a page.
 */
export async function getRelated(
  current: {
    collection: Linkable;
    slug: string;
    tags: string[];
    links_to: LinkRef[];
  },
  limit = 4,
): Promise<NormalizedItem[]> {
  const all = await getAllItems();
  const isSelf = (i: NormalizedItem) =>
    i.collection === current.collection && i.slug === current.slug;

  // 1) Explicit links (skip targets in not-yet-existing collections like books/movies).
  const linked: NormalizedItem[] = [];
  for (const link of current.links_to) {
    const match = all.find(
      (i) => i.collection === link.collection && i.slug === link.slug,
    );
    if (match && !isSelf(match)) linked.push(match);
  }

  // 2) Then shared-tag items, most overlap first, newest as tiebreaker.
  const linkedUrls = new Set(linked.map((l) => l.url));
  const tagged = all
    .filter((i) => !isSelf(i) && !linkedUrls.has(i.url))
    .map((i) => ({
      item: i,
      overlap: i.tags.filter((t) => current.tags.includes(t)).length,
    }))
    .filter((x) => x.overlap > 0)
    .sort(
      (a, b) => b.overlap - a.overlap || b.item.date.getTime() - a.item.date.getTime(),
    )
    .map((x) => x.item);

  return [...linked, ...tagged].slice(0, limit);
}
