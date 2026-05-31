import { XMLParser } from 'fast-xml-parser';
import { safeRecent, type SourceEntry, type SourceResult } from './types';

// Letterboxd exposes a public per-user diary RSS at /<user>/rss/ with
// Letterboxd-namespaced fields (filmTitle, filmYear, memberRating, rewatch) —
// no auth, no API key, no rate-limit surprises.

const feed = (user: string) => `https://letterboxd.com/${user}/rss/`;

export async function recent(): Promise<SourceResult> {
  const user = import.meta.env.LETTERBOXD_USER as string | undefined;
  if (!user) {
    return { source: 'letterboxd', entries: [], error: 'LETTERBOXD_USER not set' };
  }
  return safeRecent('letterboxd', async () => {
    const res = await fetch(feed(user));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const parsed = new XMLParser({ ignoreAttributes: false }).parse(xml);
    const items = parsed?.rss?.channel?.item ?? [];
    const arr = Array.isArray(items) ? items : [items];
    return arr.slice(0, 10).map(toEntry);
  });
}

function toEntry(it: Record<string, unknown>): SourceEntry {
  const filmTitle = (it['letterboxd:filmTitle'] ?? it.title) as string;
  const filmYear = it['letterboxd:filmYear'] as string | number | undefined;
  const rating = Number(it['letterboxd:memberRating'] ?? NaN);
  const rewatch = String(it['letterboxd:rewatch'] ?? '').toLowerCase() === 'yes';
  const stars = Number.isFinite(rating) ? toStars(rating) : '';
  const meta = [stars, rewatch && '↺ rewatch'].filter(Boolean).join(' · ');
  return {
    source: 'letterboxd',
    title: filmYear ? `${filmTitle} (${filmYear})` : filmTitle,
    meta: meta || undefined,
    url: it.link as string | undefined,
    when: new Date((it.pubDate as string) ?? Date.now()),
  };
}

function toStars(rating: number): string {
  // Letterboxd ratings are 0.5–5 in 0.5 increments.
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return '★'.repeat(full) + (half ? '½' : '');
}
