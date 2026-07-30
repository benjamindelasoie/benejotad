// Per-repo build-time activity for /work: the last N commits (for the log) and
// a binned commit-density sparkline (for the graph). Both come from ONE reliable
// endpoint — GitHub's /commits — because the dedicated /stats/commit_activity
// endpoint returns 202 while GitHub lazily computes it, which is too flaky at
// build time. Unauthenticated works (60/hr); GITHUB_TOKEN lifts it to 5000/hr.
// Fail-soft: any error returns null and the /work entry simply omits the block.

export interface RepoCommit {
  /** First line of the commit message. */
  message: string;
  date: Date;
  url: string;
  sha: string;
}

export interface RepoActivity {
  /** Newest first, up to `fetched`. */
  commits: RepoCommit[];
  /** How many commits we actually got (<= 100). */
  fetched: number;
  /** Date of the most recent commit. */
  lastPush: Date;
  /** Commit counts per equal-time bin from the oldest fetched commit to now. */
  bins: number[];
}

/**
 * Say why the block is being dropped, then drop it. The page degrading in
 * silence is what makes a missing sparkline read as a rendering bug instead of
 * what it usually is: a private repo (GitHub answers 404, not 403) or a spent
 * rate limit. The warning lands in the build log; the page is unaffected.
 */
function warn(slug: string, why: string): null {
  console.warn(`[repo-commits] ${slug}: ${why} — omitting the activity block`);
  return null;
}

/** "https://github.com/owner/repo(.git)" -> "owner/repo". */
function repoSlug(repoUrl: string): string | null {
  const m = repoUrl.match(/github\.com\/([^/]+\/[^/?#]+?)(?:\.git)?\/?$/i);
  return m ? m[1] : null;
}

export async function repoActivity(
  repoUrl: string,
  bins = 24,
): Promise<RepoActivity | null> {
  const slug = repoSlug(repoUrl);
  if (!slug) return warn(repoUrl, 'not a parseable github.com repo URL');

  const token = import.meta.env.GITHUB_TOKEN as string | undefined;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    const res = await fetch(
      `https://api.github.com/repos/${slug}/commits?per_page=100`,
      { headers },
    );
    if (!res.ok) return warn(slug, `HTTP ${res.status}`);
    const list = (await res.json()) as Array<Record<string, any>>;
    if (!Array.isArray(list) || list.length === 0) return warn(slug, 'no commits');

    const commits: RepoCommit[] = list
      .map((c) => ({
        message: String(c.commit?.message ?? '').split('\n')[0],
        date: new Date(c.commit?.author?.date ?? c.commit?.committer?.date),
        url: String(c.html_url ?? ''),
        sha: String(c.sha ?? '').slice(0, 7),
      }))
      .filter((c) => c.message && !Number.isNaN(c.date.getTime()));
    if (commits.length === 0) return warn(slug, 'no usable commits');

    const lastPush = commits[0].date;
    const oldest = commits[commits.length - 1].date;
    // Bin commits into `bins` equal time slices over [oldest, now]. This adapts
    // the time resolution to each project's cadence (a burst-heavy week vs a
    // steady month) and never implies a false zero — the whole axis is inside
    // the data window we fetched.
    const start = oldest.getTime();
    const span = Math.max(Date.now() - start, 1);
    const counts = new Array(bins).fill(0);
    for (const c of commits) {
      let i = Math.floor(((c.date.getTime() - start) / span) * bins);
      if (i < 0) i = 0;
      if (i >= bins) i = bins - 1;
      counts[i]++;
    }

    return { commits, fetched: commits.length, lastPush, bins: counts };
  } catch (err) {
    return warn(slug, err instanceof Error ? err.message : String(err));
  }
}
