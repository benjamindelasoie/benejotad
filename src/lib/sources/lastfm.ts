import { safeRecent, type SourceEntry, type SourceResult } from './types';

// Last.fm public Web API. The API key is free (instant signup at last.fm/api);
// the username is your public profile name. `getrecenttracks` returns the most
// recent scrobbles plus an "@attr.nowplaying" flag on the currently playing one.

const url = (user: string, key: string) =>
  `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${user}&api_key=${key}&format=json&limit=10`;

export async function recent(): Promise<SourceResult> {
  const user = import.meta.env.LASTFM_USER as string | undefined;
  const key = import.meta.env.LASTFM_KEY as string | undefined;
  if (!user || !key) {
    return {
      source: 'lastfm',
      entries: [],
      error: 'LASTFM_USER or LASTFM_KEY not set',
    };
  }
  return safeRecent('lastfm', async () => {
    const res = await fetch(url(user, key));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as {
      recenttracks?: { track?: unknown };
    };
    const raw = data?.recenttracks?.track ?? [];
    const arr = Array.isArray(raw) ? raw : [raw];
    return arr.slice(0, 10).map(toEntry);
  });
}

function toEntry(t: Record<string, any>): SourceEntry {
  const nowPlaying = t['@attr']?.nowplaying === 'true';
  const when = nowPlaying
    ? new Date()
    : new Date(Number(t.date?.uts ?? 0) * 1000);
  const artist = t.artist?.['#text'] as string | undefined;
  return {
    source: 'lastfm',
    title: t.name as string,
    meta: artist ? `by ${artist}${nowPlaying ? ' · now playing' : ''}` : undefined,
    url: t.url as string | undefined,
    when,
  };
}
