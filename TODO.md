# TODO

Open threads — current as of 2026-05-31.

## /now — pending

- [ ] **Vercel cron for daily refresh.** `/now` data refreshes only on git
  push today. Add a Deploy Hook + a Vercel Cron Job that pings it once a
  day so Letterboxd / GitHub / Last.fm stay current without manual
  deploys.
- [ ] **Preview env vars (`LETTERBOXD_USER`, `GITHUB_USER`,
  `LASTFM_USER`, `HARDCOVER_USER`, `HARDCOVER_TOKEN`).** Production
  vars are set; Preview adds via `echo … | vercel env add … preview`
  failed silently (CLI wants the non-prompting form). Branch deploys
  will render the empty-state `/now` until these land. Try
  `vercel env add --force` or paste in the Vercel dashboard.
- [x] ~~**Reading row.**~~ Wired to Hardcover (2026-06-01) via
  `src/lib/sources/hardcover.ts`. Currently-reading + recently-finished
  shelf via GraphQL `me { user_books }` query.
- [ ] **Thinking row.** Manual for now. Consider an Are.na source —
  public API + RSS per channel.
- [ ] **Moving row.** Removed from the Snapshot block; add back when a
  source lands. Strava (OAuth, recent activities) is the natural fit;
  Hevy is the lifting option.
- [ ] **Rotate the Last.fm API key.** Pasted in chat during the wireup
  session; rotation hygiene. Lower risk than a PAT (public read only)
  but worth doing.

## /work — pending

- [ ] **Real `repo_url`s.** Both work entries (`afiche.mdx`,
  `camusean.mdx`) have placeholder `https://github.com/`. Point at the
  actual repos.
- [ ] **Recruiter-facing surface.** `DESIGN.md` describes `/work` as a
  standalone shareable portfolio with skim summaries, CV, and case
  studies. Current page is functional but plain. Pass two: flesh out
  per the design doc.

## System / future

- [ ] **`books` collection (V1.5).** Manual JSON / MDX entries, schema
  already accepts `books` as a `linkRef` target. Becomes the data source
  for the Reading row.
- [ ] **`movies` collection (V2).** Letterboxd RSS auto-pull, separate
  from the live `/now` Watching row. Lets films become first-class
  catalog rows on the home index, with cross-collection links.
- [ ] **R3F memorabilia wall (post-V1).** Per `CLAUDE.md`. Deferred.
- [ ] **`ProseLayout.astro` is orphaned.** Now-only consumer
  (`now.mdx`) is gone. Remove it, or keep it as a general MDX utility
  for future standalone pages.
