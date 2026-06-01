import { safeRecent, type SourceEntry, type SourceResult } from './types';

// Hardcover GraphQL API. Auth is a Bearer token from the user's account
// settings; the `me` query returns the authenticated user's shelves so we
// don't need a username for the query itself. Status IDs: 2 = currently
// reading, 3 = finished. We pull both, sorted by updated_at, so the most
// recently touched book naturally becomes the Reading snapshot row.

const ENDPOINT = 'https://api.hardcover.app/v1/graphql';

const QUERY = `
  query NowReading($limit: Int!) {
    me {
      user_books(
        limit: $limit
        order_by: { updated_at: desc }
        where: { status_id: { _in: [2, 3] } }
      ) {
        status_id
        last_read_date
        updated_at
        rating
        book {
          title
          slug
          release_year
          cached_contributors
        }
      }
    }
  }
`;

interface HCBook {
  status_id: number;
  last_read_date: string | null;
  updated_at: string;
  rating: number | null;
  book: {
    title: string;
    slug: string;
    release_year: number | null;
    cached_contributors:
      | Array<{ author?: { name?: string } | null } | null>
      | null;
  };
}

interface HCResponse {
  data?: { me?: Array<{ user_books?: HCBook[] }> };
  errors?: Array<{ message: string }>;
}

export async function recent(): Promise<SourceResult> {
  const token = import.meta.env.HARDCOVER_TOKEN as string | undefined;
  if (!token) {
    return { source: 'hardcover', entries: [], error: 'HARDCOVER_TOKEN not set' };
  }
  return safeRecent('hardcover', async () => {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: QUERY, variables: { limit: 10 } }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as HCResponse;
    if (data.errors?.length) {
      throw new Error(data.errors.map((e) => e.message).join('; '));
    }
    return (data.data?.me?.[0]?.user_books ?? []).map(toEntry);
  });
}

function toEntry(b: HCBook): SourceEntry {
  const finished = b.status_id === 3;
  const title = b.book.release_year
    ? `${b.book.title} (${b.book.release_year})`
    : b.book.title;
  const authors = (b.book.cached_contributors ?? [])
    .map((c) => c?.author?.name)
    .filter((n): n is string => !!n)
    .join(', ');
  const stars = b.rating != null ? toStars(b.rating) : '';
  // Currently-reading books get a "reading" tag so they're distinguishable
  // from finished ones in the Wild block — finished books carry their date
  // and rating instead.
  const meta = [
    authors && `by ${authors}`,
    !finished && 'reading',
    finished && stars,
  ]
    .filter(Boolean)
    .join(' · ');
  const when = finished && b.last_read_date
    ? new Date(b.last_read_date)
    : new Date(b.updated_at);
  return {
    source: 'hardcover',
    title,
    meta: meta || undefined,
    url: `https://hardcover.app/books/${b.book.slug}`,
    when,
  };
}

function toStars(rating: number): string {
  // Hardcover ratings are 0.5–5 in 0.5 increments.
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return '★'.repeat(full) + (half ? '½' : '');
}
