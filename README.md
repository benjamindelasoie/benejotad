# benejotad

A personal hub where everything is interconnected — voice, work, trips, films,
and the things I build, rendered as one unit seen from different angles.

Built on **Astro 6** + **Content Collections** (the Content Layer API) + **MDX**,
styled with **Astro scoped styles** (plain CSS in per-component `<style>` blocks,
auto-scoped) over a small set of global tokens. **React + React Three Fiber** is
reserved for the post-V1 3D wall. No backend, no database — just typed files in
the repo.

## The idea

Every piece of content shares one base shape (`title`, `date`, `tags`,
`links_to`, …). Pages are *queries* over that shared collection, not bespoke
templates. Adding a section is a new query; adding a content type is a new
collection that already plugs into tags and links. See
`src/content/posts/why-this-site.mdx` for the thesis.

## Project structure

```text
src/
├── content.config.ts        # collection schemas (the data spine)
├── content/
│   ├── posts/<slug>.mdx      # food / thought / update posts
│   ├── trips/<slug>.mdx      # trip posts
│   └── work/<slug>.mdx       # work case studies
├── lib/content.ts           # query layer: getAllItems, getAllTags, getRelated, formatDate
├── layouts/                 # Layout.astro (shell), ProseLayout.astro (MDX pages)
├── components/              # ItemCard, RelatedRail, TagList, EmptyState
├── pages/
│   ├── index.astro          # landing: hero + recent rail
│   ├── now.mdx              # hand-curated /now (V2 will auto-generate it)
│   ├── work.astro           # filtered work view (inline case studies)
│   ├── posts/[slug].astro   # post pages + related rail
│   ├── trips/[slug].astro   # trip pages + related rail
│   ├── tags/index.astro     # all tags
│   ├── tags/[tag].astro     # everything sharing a tag
│   └── rss.xml.ts           # RSS feed (built from the query layer)
└── styles/global.css        # tokens, reset, .eyebrow + .prose (component styles are scoped)
```

## Adding content

Drop a `.mdx` file into the matching `src/content/<collection>/` folder. The
filename (minus extension) is the slug and the URL.

Frontmatter — every type shares the base, plus a few per-type fields:

```yaml
---
title: "A post title"
date: 2026-05-24          # ISO 8601; authored as a date, displayed in UTC
kind: thought             # posts only: food | thought | update
# location/days           # trips only
# role/repo_url           # work only
summary: "One-line skim summary."
tags: ["writing", "indie-web"]
links_to:                 # typed cross-collection links
  - { collection: work, slug: afiche }
draft: false              # true hides it everywhere
---
```

`links_to` plus shared tags drive the **Related** rail at the bottom of each
post and trip — that's the interconnection made visible.

> Dates: write them as plain ISO dates. They're parsed as UTC and formatted in
> UTC (`formatDate` in `src/lib/content.ts`) so the displayed day never drifts
> with the build machine's timezone.

## Commands

| Command           | Action                                      |
| :---------------- | :------------------------------------------ |
| `npm run dev`     | Dev server at `localhost:4321`              |
| `npm run build`   | Production build to `./dist/`               |
| `npm run preview` | Preview the build locally                   |
| `npx astro check` | Type-check `.astro` / `.ts` (run before shipping) |

## Roadmap

- **V1 (this):** landing, `/work`, `/now`, trip + post pages, tags, related rail, RSS, sitemap.
- **V1.5:** `books` collection (manual JSON) + `/books`.
- **V2:** auto-pull — Letterboxd → `movies`, GitHub commits, then Spotify. GitHub Actions cron writes JSON and triggers a rebuild.
- **V3:** the React Three Fiber memorabilia wall at `/wall`.

## Deploy

Vercel, connected to the GitHub repo. Push to `main` → deploy; preview deploys
per PR. **Before launch:** set the real domain in `astro.config.mjs` (`site:`) —
it's currently a placeholder and the sitemap + RSS depend on it.
