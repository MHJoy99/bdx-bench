# BDX Bench — web

New Next.js App Router frontend. Lives ONLY in `web/`. Root harness (`server/`, `data/`, `tasks/`) is untouched.

## Stack

Next.js App Router + TypeScript strict + Tailwind + shadcn/ui + next-themes + Zod + date-fns + Motion + TanStack Table/Query + ECharts + Lucide + nuqs.

## Contracts for other agents

- Types: `src/lib/types.ts`
- Scoring (single weighting config): `src/lib/scores.ts`
- Formatting: `src/lib/format.ts`
- Mock dataset backing the API routes: `src/lib/data.ts`
- URL filter schemas: `src/lib/filters.ts`
- Path alias: `@/*` → `src/*`

## Routes

| Route | File |
|---|---|
| `/` | `src/app/page.tsx` (placeholder — homepage agent owns) |
| `/leaderboard` | `src/app/leaderboard/page.tsx` |
| `/models/[slug]` | `src/app/models/[slug]/page.tsx` |
| `/compare` | `src/app/compare/page.tsx` |
| `/benchmarks` | `src/app/benchmarks/page.tsx` |
| `/benchmarks/[slug]` | `src/app/benchmarks/[slug]/page.tsx` |
| `/price-performance` | `src/app/price-performance/page.tsx` |
| `/trends` | `src/app/trends/page.tsx` |
| `/methodology` | `src/app/methodology/page.tsx` |

API: `/api/models`, `/api/models/[slug]`, `/api/leaderboard`, `/api/benchmarks`, `/api/benchmarks/[slug]`, `/api/compare`, `/api/trends`.

## Dev

```powershell
cd web
npm install
npm run dev
```
