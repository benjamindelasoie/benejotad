/**
 * External sources for /now. Each source module exports `recent()` which
 * returns a `SourceResult`. Fetches run at build time only; failures degrade
 * gracefully (empty entries + an `error` field) so a flaky third party never
 * breaks the page.
 */

export type SourceTag = 'github' | 'letterboxd' | 'lastfm' | 'hardcover';

export interface SourceEntry {
  source: SourceTag;
  /** Display title (film name, track name, commit message). */
  title: string;
  /** Mono-spine metadata line (rating, repo, artist). */
  meta?: string;
  /** External link out. */
  url?: string;
  /** When it happened — used for sorting and display. */
  when: Date;
}

export interface SourceResult {
  source: SourceTag;
  entries: SourceEntry[];
  /** Set when fetch failed or env vars are missing; entries will be []. */
  error?: string;
}

/**
 * Wrap an async fetcher so a single source failure (bad network, rate limit,
 * missing env var, malformed feed) can't fail the build.
 */
export async function safeRecent(
  source: SourceTag,
  fn: () => Promise<SourceEntry[]>,
): Promise<SourceResult> {
  try {
    return { source, entries: await fn() };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[sources/${source}] fetch failed:`, message);
    return { source, entries: [], error: message };
  }
}
