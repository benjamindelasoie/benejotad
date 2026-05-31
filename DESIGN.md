# Design System — benejotad

> Source of truth for all visual and UI decisions. Read this before touching
> typography, color, spacing, layout, or motion. Do not deviate without explicit
> approval. Created by /design-consultation, 2026-05-25.

## Product Context
- **What this is:** Benja's personal hub — one person's writing, work, trips, food, films (and later a 3D memorabilia wall) filed as a single record. Thesis: "everything is interconnected."
- **Who it's for:** Benja first (self-expression); `/work` doubles as a recruiter-facing portfolio.
- **Space:** indie-web / personal site. Not a SaaS, dashboard, or marketing site.
- **Memorable thing:** **one voice, many angles.** Every decision serves this.

## Aesthetic Direction
- **Direction:** modern brutalist-minimalist — refined Swiss/structural, *not* "neubrutalism" (no thick candy borders, hard drop-shadows, or bright block colors).
- **Decoration level:** minimal. Type and grid do the work. No imagery-as-decoration, no texture, no ornament.
- **Mood:** stark, structural, honest, contemporary. The container does **not** cosplay the writing — the prose is literary, so the design is cold and systematic by contrast.
- **First-3-seconds target:** "this is one specific mind, presented as a system."

## Typography
All faces are free and self-hostable. Kept deliberately distinct from Benja's other projects (Geist is used elsewhere — do not use it here).
- **Display + Body + UI:** **Cabinet Grotesk** — one family across all sizes; hierarchy via weight + size. Characterful grotesque, blunt at large sizes.
  - Source: Fontshare — `https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,700,800,900&display=swap` (self-host for production).
- **Mono (the spine):** **JetBrains Mono** — carries *all* metadata: catalog numbers, dates, type tags, cross-reference markers, nav/filter labels. The mono is the connective tissue and the engineer×writer signal.
  - Source: Bunny Fonts — `https://fonts.bunny.net/css?family=jetbrains-mono:400,500` (privacy-friendly; self-host for production).
- **Sans-as-a-separate-role:** none. (Supersedes the V1 `global.css` which used system sans for eyebrows — those move to mono.)
- **Scale (rem):** 0.72 · 0.875 · 1 · 1.06(body) · 1.45 · 1.75 · 2.25 · 3 · 4.25 · 8(display, clamped).
- **Body:** ~1.06rem, line-height 1.4–1.5, measure ~64rem max container (prose blocks narrower).
- **Metadata:** mono, 0.72rem, uppercase, letter-spacing 0.08–0.1em.

## Color
**Monochrome — no accent color.** Hierarchy rides on weight, hard rules, and opacity. Color never enters; this is the most severe, most minimal read and the chosen one.

**Light (baseline):**
- `--bg #fafafa` · `--ink #0a0a0a` · `--muted #737373`
- `--line #e5e5e5` (hairline) · `--rule #0a0a0a` (hard structural rule)

**Dark (hard invert):**
- `--bg #0a0a0a` · `--ink #fafafa` · `--muted #8a8a8a`
- `--line #262626` · `--rule #fafafa`

- **Default:** follow `prefers-color-scheme`; light as fallback. Manual toggle available.
- **No gradients, no shadows, no warm cream.** (Supersedes the V1 warm-paper/brick palette.)
- Links / active states / "signal" elements use ink (often via underline, weight, or a filled block), never a hue.

## Spacing
- **Base unit:** 8px. Editorial rhythm may override rigid component spacing.
- **Density:** prose breathes; index/catalog rows are dense.
- **Scale (px):** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128.

## Layout
- **Approach:** exposed grid, strictly **left-aligned**, never centered. Structure stays visible via thin hairlines and hard rules.
- **Border radius:** `0` everywhere. Hard corners.
- **Shadows:** none. Depth is expressed with rules, not blur.
- **Max content width:** ~64rem container; `--gutter: clamp(1.25rem, 4vw, 3rem)`.

### Information architecture
- **Home = the catalog.** A single filterable index of personal content (writing, trips, food, film). Every item is a hard-ruled row: `mono catalog-no. / mono date / mono type-tag / Cabinet Grotesk title / mono refs`. The "angles" are **filters that dim non-matching rows in place** — you always see a facet in the context of the whole. This *is* "one voice, many angles" as an interaction, not a tagline.
- **/work = standalone shareable portfolio.** Recruiter-facing: project case studies, CV, one-line skim summaries up top. Same system, but a self-contained surface that stands on its own when shared, separate from the personal catalog.
- **Detail routes:** `/trips/[slug]`, `/posts/[slug]`, `/now` persist as deep-link pages.
- **Progressive:** start with the catalog; split more dedicated paths out of it over time as warranted.

### Interconnection
- **Mono spine:** catalog numbers, dates, and `↗N` cross-reference markers in mono run through everything.
- **REFS block** replaces the soft "related posts" card: a hard-ruled, mono-labelled block ("Also appears in") listing linked items across collections. Hard edges, no card, no shadow.

## Motion
- **Approach:** minimal-functional only. Brutalism is anti-fuss.
- **Duration:** 50–150ms. Hard, quick. No parallax, no decorative animation, no entrance fades on everything.
- **Easing:** linear or a tight ease-out for state changes.
- Respect `prefers-reduced-motion`.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-25 | Modern brutalist-minimalist over the warm-literary-serif direction | The prose is already literary; the design shouldn't validate that. Cold/structural container by contrast. (User redirect during /design-consultation.) |
| 2026-05-25 | Cabinet Grotesk (not Geist, not serif) | Wanted sans + distinct from his Geist project; Cabinet is characterful but brutalist-friendly, free, self-hostable. |
| 2026-05-25 | JetBrains Mono as the metadata spine | Both outside voices (Codex + subagent) independently proposed mono-as-connective-tissue; it encodes the eng×lit duality and survives the aesthetic pivot. |
| 2026-05-25 | Monochrome, no accent color | Chosen live in preview over brick/cobalt; purest, most severe minimal read. |
| 2026-05-25 | Catalog-first home + standalone /work | "One voice, many angles" as a filterable index; /work split out as a shareable recruiter portfolio. Add more paths over time. |
| 2026-05-25 | Theme follows prefers-color-scheme, light baseline | Modern default; avoids a forced binary. |

## Implementation note
Migration complete (2026-05-30). `src/styles/global.css` now encodes only the monochrome brutalist tokens; the V1 warm/serif variables and the legacy compatibility aliases (`--color-accent`, `--color-muted`, `--font-sans`, etc.) have been removed. All components and pages reference the real tokens directly. Note: Cabinet Grotesk is loaded at weights `400,500,700,800` only — do not use `600` (it falls back to a substituted weight); titles are `700`.
