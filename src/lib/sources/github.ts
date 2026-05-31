import { safeRecent, type SourceEntry, type SourceResult } from './types';

// GitHub public-events API. Unauthenticated is fine for this use case
// (60/hour per IP); set GITHUB_TOKEN to lift to 5000/hour AND enable per-push
// enrichment (the events feed returns stripped PushEvent payloads — no
// commits[] — so we follow up with /repos/.../compare/before...head to get
// the real commit message and count).
// https://docs.github.com/en/rest/activity/events

const eventsUrl = (user: string) =>
  `https://api.github.com/users/${user}/events/public?per_page=30`;
const compareUrl = (repo: string, before: string, head: string) =>
  `https://api.github.com/repos/${repo}/compare/${before}...${head}`;

// Display cap. We slice early so enrichment fetches are bounded.
const CAP = 10;

interface PushEnrich {
  repo: string;
  before: string;
  head: string;
}

interface RawEntry {
  entry: SourceEntry;
  /** When set, post-process this entry by fetching the compare endpoint. */
  enrich?: PushEnrich;
}

export async function recent(): Promise<SourceResult> {
  const user = import.meta.env.GITHUB_USER as string | undefined;
  if (!user) {
    return { source: 'github', entries: [], error: 'GITHUB_USER not set' };
  }
  const token = import.meta.env.GITHUB_TOKEN as string | undefined;
  return safeRecent('github', async () => {
    const headers = ghHeaders(token);
    const res = await fetch(eventsUrl(user), { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const list = (await res.json()) as Array<Record<string, any>>;
    const raws = list.flatMap(toRawEntries).slice(0, CAP);

    // Enrich PushEvents in parallel. A single failed enrichment falls back
    // silently to the stripped-payload rendering already on the entry.
    await Promise.all(
      raws.map(async (r) => {
        if (!r.enrich) return;
        const rich = await enrichPush(r.enrich, headers);
        if (rich) Object.assign(r.entry, rich);
      }),
    );
    return raws.map((r) => r.entry);
  });
}

function ghHeaders(token?: string): Record<string, string> {
  return {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function toRawEntries(ev: Record<string, any>): RawEntry[] {
  const when = new Date(ev.created_at);
  const repo = ev.repo?.name as string;
  const repoUrl = `https://github.com/${repo}`;
  switch (ev.type) {
    case 'PushEvent': {
      // Without enrichment, render a minimal "pushed to <branch>" — the events
      // feed often arrives with empty commits[] and no distinct_size.
      const ref = (ev.payload?.ref as string | undefined)?.replace(
        /^refs\/heads\//,
        '',
      );
      const before = ev.payload?.before as string | undefined;
      const head = ev.payload?.head as string | undefined;
      const entry: SourceEntry = {
        source: 'github',
        title: ref ? `pushed to ${ref}` : 'pushed',
        meta: repo,
        url: repoUrl,
        when,
      };
      const enrich =
        before && head && before !== '0000000000000000000000000000000000000000'
          ? { repo, before, head }
          : undefined;
      return [{ entry, enrich }];
    }
    case 'PullRequestEvent': {
      const pr = ev.payload?.pull_request;
      if (!pr) return [];
      return [
        {
          entry: {
            source: 'github',
            title: pr.title,
            meta: `${repo} · PR ${ev.payload?.action}`,
            url: pr.html_url,
            when,
          },
        },
      ];
    }
    case 'CreateEvent': {
      const refType = ev.payload?.ref_type;
      if (refType !== 'repository' && refType !== 'branch') return [];
      return [
        {
          entry: {
            source: 'github',
            title:
              refType === 'repository'
                ? `new repo: ${repo}`
                : `new branch: ${ev.payload?.ref}`,
            meta: repo,
            url: repoUrl,
            when,
          },
        },
      ];
    }
    case 'ReleaseEvent': {
      const rel = ev.payload?.release;
      return [
        {
          entry: {
            source: 'github',
            title: `released ${rel?.name ?? rel?.tag_name}`,
            meta: repo,
            url: rel?.html_url ?? repoUrl,
            when,
          },
        },
      ];
    }
    default:
      return [];
  }
}

/** Follow-up fetch: pull the actual commits behind a PushEvent. */
async function enrichPush(
  p: PushEnrich,
  headers: Record<string, string>,
): Promise<Pick<SourceEntry, 'title' | 'meta'> | null> {
  try {
    const res = await fetch(compareUrl(p.repo, p.before, p.head), { headers });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      commits?: Array<{ commit?: { message?: string } }>;
      total_commits?: number;
    };
    const commits = data.commits ?? [];
    if (commits.length === 0) return null;
    const head = commits[commits.length - 1]?.commit?.message?.split('\n')[0];
    if (!head) return null;
    const n = data.total_commits ?? commits.length;
    return {
      title: head,
      meta: n > 1 ? `${p.repo} · ${n} commits` : p.repo,
    };
  } catch {
    return null;
  }
}
