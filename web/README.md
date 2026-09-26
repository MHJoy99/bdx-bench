# BDX Bench — web

Next.js 16 App Router site for the public benchmark. Lives only in `web/`. The
zero-dependency root harness (`server/`, `data/`, `tasks/`) is untouched.

> **Full documentation lives in [`../docs/WEB.md`](../docs/WEB.md)** — routes,
> data flow, the design and motion doctrine, the build registry, the real lint
> gate, and deploy. Read that before changing anything here. This file is a
> short pointer, not a second source of truth.

## Stack

Next.js 16 App Router + React 19 + TypeScript strict + Tailwind 3.4 +
next-themes + Zod + Motion 13 + TanStack Table/Query + ECharts 6 + Lucide +
nuqs. `shadcn/ui` component sources are in `src/components/ui`.

## Quick start

```powershell
npm install
npm run dev      # dev server
npm run lint     # tsc --noEmit — this IS the lint gate (ESLint is not configured)
npm run build    # must end with the static/SSG route table
npm run check    # lint + build
```

## Contracts

- Types: `src/lib/types.ts`
- Scoring: `src/lib/scores.ts`
- Formatting: `src/lib/format.ts`
- Seeded data behind the API routes: `src/lib/demo-data.ts`
- **Audit data (canonical leaderboard source): `src/lib/audit-data.ts`**
- **Motion contract: `src/lib/motion-tokens.ts`**
- URL filter schemas: `src/lib/filters.ts`
- Path alias: `@/*` → `src/*`

## Routes

| Route | File |
|---|---|
| `/` | `src/app/page.tsx` |
| `/leaderboard` | `src/app/leaderboard/page.tsx` |
| `/models`, `/models/[slug]` | `src/app/models/**` |
| `/benchmarks`, `/benchmarks/[slug]` | `src/app/benchmarks/**` |
| `/compare` | `src/app/compare/page.tsx` |
| `/price-performance` | `src/app/price-performance/page.tsx` |
| `/trends` | `src/app/trends/page.tsx` |
| `/methodology` | `src/app/methodology/page.tsx` |
| `/eval` | `src/app/eval/page.tsx` |
| `/play/<buildId>` | verbatim model output in `public/play/` — **never patch** |

API routes: `/api/models`, `/api/models/[slug]`, `/api/leaderboard`,
`/api/benchmarks`, `/api/benchmarks/[slug]`, `/api/compare`, `/api/trends`,
`/api/eval`, `/api/eval/stream`, plus the interactive `likes`, `votes`,
`ratings`, and `comments` endpoints.

## Notes

- `src/styles/globals.css` is the **only** imported global stylesheet, wired via
  `src/app/layout.tsx`. Do not add a second one — an orphaned duplicate is what
  previously broke the site.
- `web/src/components/charts/charts.css` is imported per-component by
  `ChartShell.tsx` and is fine.
- `web/POLISH_NOTES.md` and `web/PALETTE_WIRING.md` were scratch handoff notes
  for an abandoned `CommandPaletteHost` integration and have been removed. The
  live ⌘K path is `src/components/search-command.tsx` → `CommandPalette`.
