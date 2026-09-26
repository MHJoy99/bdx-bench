# AGENTS.md — BDX Bench Operating Manual

> Read this first. Any AI landing in this repo starts here.

## 1. What BDX Bench Is

A public benchmark of AI coding models, ranked by the quality of the **playable
web games** they generate from one shared prompt, plus a zero-dependency Node
harness for task-based suites.

Two distinct halves — know which one you are in:

| Half | What it is | Docs |
|---|---|---|
| **The benchmark + site** | `web/` — Next.js 16 site at <https://bench.bdx.market>. Ranks 8 models across 10 audited builds by **Showdown Score v2**. | `docs/METHODOLOGY.md` Part A, **`docs/WEB.md`** |
| **The harness** | `server/server.js` — single-file zero-dep API + static UI on `:8765`, with `swe-mini` / `terminal-mini` suites and a blind chat arena. | `docs/SPEC.md`, `docs/API.md`, `docs/METHODOLOGY.md` Part B |

**Most work in this repo is the first half.** If you are changing anything under
`web/`, read `docs/WEB.md` before you write code.

## 2. Golden Rules

### Both halves

1. **Never print `BDX_AI_API_KEY`.** Not in chat, logs, responses, or stored
   runs. Redact `Authorization` headers too. Before any commit, grep for key
   material and `Authorization` values.
2. **Crash-safe writes.** Persist JSON via tmp-file + rename. Never
   truncate-then-write.
3. **File ownership.** Check `git log` before editing outside your task scope.
   Each area has one owner — see §4 and `docs/WEB.md` §3.
4. **Commit and deploy are explicit.** Never commit or push unless asked. When
   deploying, the deploy script's smoke checks must stay green.

### The benchmark (most common)

5. **A build is model output. Never patch it.** `web/public/play/*` holds
   verbatim model output under evaluation. Fixing a defect there scores the
   fixer, not the model. Record the defect in
   `web/src/lib/audit-data.ts` instead — the site surfaces findings as
   first-class credibility content.
6. **A feature counts only if implemented and reachable.** On-screen strings,
   comments, and dead code score zero. This rule exists because ignoring it
   inflated the leaderboard by up to 40 points. See `docs/METHODOLOGY.md` A3.
7. **Never fake live data.** The audit is one static round. Count a score up
   once on mount; do not animate a "new score" event, and do not use FLIP to
   simulate a refresh.
8. **Do not re-add a decorative animation.** No infinite loops, floating cards,
   parallax, ambient particles, pulsing badges, confetti. Motion must come from
   computation, evidence, or artifact behaviour. Motion tokens live in
   `web/src/lib/motion-tokens.ts` — never invent a duration inline.
9. **One stylesheet.** `web/src/styles/globals.css` is the only imported global
   CSS. An orphaned duplicate previously drifted and silently broke the site.
10. **Verify with the real gate.** In `web/`, `npm run lint` is `tsc --noEmit`;
    ESLint is not installed and `next lint` was removed in Next 16.

### The harness

11. **Keep it zero-dep.** Node built-ins only. No `npm install`, no
    `node_modules` in the harness half.
12. **Mock-only verification.** No live gateway calls without an explicit user
    ask. Default to `mock` / `?mock=1`.
13. **The live server is on `:8765` — never stop it, never bind it in tests.**
    Test on `:18765`:
    `$env:BDX_BENCH_PORT="18765"; node server/server.js`.

## 3. How to Run

### The web site (the usual case)

```powershell
cd web
npm run dev        # local dev server
npm run lint       # tsc --noEmit  (this is the lint gate)
npm run build      # must end with the static/SSG route table
npm run check      # both of the above
```

Deploy (from the repo root, after a push):

```powershell
ssh racknerd "bash /srv/bot-storage/sites/bench.bdx.market/deploy/deploy.sh"
```

`data/*.json` is gitignored, so journal changes do not travel with `git push`.
After editing the journal, `scp` it to the host, then re-run the deploy script.
See `docs/WEB.md` §6.

### The harness

```powershell
npm start        # node server/server.js -> http://127.0.0.1:8765 (live; don't stop it)
npm run mock     # one mock run, writes results/mock.json (no key needed)
npm run seed     # node scripts/seed-demo.js — demo data for the GUI
npm run aggregate# node scripts/aggregate.js — rebuild leaderboard from results/
npm test         # node --test "tests/**/*.test.js" — 69 harness assertions
npm run a11y     # node tests/a11y-audit.js — static a11y/perf scan of the harness GUI
npm run verify   # scripts/verify.ps1 — conformance check (uses :18765, never :8765)
```

> **Do not run bare `node --test` from the repo root.** It auto-discovers
> *everything*, including `web/src/lib/*.test.ts`, which are **vitest** tests
> that the root runner cannot load (extensionless TS imports). They report two
> spurious failures. `npm test` is scoped to the root `tests/` dir on purpose.
> The `web/` vitest suite is dormant by design — see `web/vitest.config.ts`.

Live CLI run (only when user explicitly asks; needs key, never echo it):
`$env:BDX_AI_API_KEY="..."; node runner/run.js --model <id> --suite <swe-mini|terminal-mini> --mode live --out ./out.json`

## 4. Where Everything Lives

| Dir / file | Purpose | Owner |
|---|---|---|
| `web/` | The public site — Next.js 16. See `docs/WEB.md`. | per `docs/WEB.md` §3 |
| `web/src/lib/audit-data.ts` | The 10 audited builds, dimension scores, verified findings | data agent |
| `web/src/lib/demo-data.ts` | Seeded leaderboard / models / snapshots behind the API | data agent |
| `web/src/lib/motion-tokens.ts` | The motion contract — all durations/easings live here | data agent |
| `web/public/play/<buildId>/` | Verbatim model output under benchmark. **Never patch.** | benchmarks agent |
| `server/server.js` | Harness backend: API + static files | server agent |
| `public/` | Harness GUI: `index.html`, `app.js`, `arena.html`, `style.css` | harness UI agent |
| `tasks/<suite>/*.json`, `suites/` | Harness task definitions (fallback `suites/<suite>`) | tasks agent |
| `models/models.json` | Static model list (offline-safe) | models agent |
| `runner/run.js` | Harness CLI runner | runner agent |
| `scripts/` | `seed-demo.js`, `aggregate.js`, `verify.ps1` | tooling agent |
| `docs/` | `SPEC.md`, `API.md`, `METHODOLOGY.md`, `WEB.md`, `ARENA.md`, … | docs agent |
    | `data/` | Runtime journal: `prompts/scores/matches/ratings.json`. Gitignored. | server only (never hand-edit) |
| `results/` | One JSON per harness run, harness leaderboard source | server/runner only |
| `public/` | Harness GUI: `index.html`, `app.js`, `style.css` (a11y-gated by `npm run a11y`) | harness UI agent |
| `deploy/deploy.sh` | VPS deploy + smoke checks | tooling agent |

## 5. How the Leaderboard Is Built

There are two leaderboards. Do not confuse them.

**The site leaderboard (live, authoritative for the public site).**
`web/src/lib/audit-data.ts` holds 10 audited builds with per-dimension scores.
`demo-data.ts` holds the model-level leaderboard. `GET /api/leaderboard` returns
`{ leaderboard, manual, arena }` where `leaderboard` is derived from the audit
data and `meta.freshness.methodologyVersion` is `v2`.

Current ranking (Showdown Score v2, 8 models / 10 builds):

| Rank | Model | Score | Canonical build |
|:--:|---|---:|---|
| 1 | Space Bunny Free | 91.0 | `ember-dead` |
| 2 | DeepSeek V4.1 Flash | 80.0 | `pyre-burn-horde` (`inferno-dead` 61.0) |
| 3 | GPT Luna 5.6 | 62.0 | `firebreak-night-shift` |
| 4 | GPT 6 Sol | 58.0 | `cinderline` |
| 5 | Muse Spark 1.3 | 52.0 | `pyro-vs-zombies` |
| 6 | GPT Luna 6 | 51.0 | `emberfall` |
| 7 | Gemini 3.8 Flash | 43.0 | `pyroclasm-inferno` |
| 8 | Gemini Pro Agent | 24.0 | `zombie-fire-survival` |

**Two models shipped two builds each.** Never look one up by slug alone —
`AUDIT_BY_SLUG` resolves to the strongest build, `SECONDARY_BUILDS` holds the
alternates by canonical build id.

**The harness boards** (runs → auto, prompts+scores → manual, matches → arena)
are unchanged; see §6 and `docs/API.md`.

## 6. Harness Endpoint Cheat-Sheet

Base `http://127.0.0.1:8765`. Errors are non-2xx `{"error":"msg"}`.

| Method | Path | Notes |
|---|---|---|
| GET | `/api/health` | `{ok, version}` |
| GET | `/api/models` | static list, works offline |
| GET | `/api/tasks?suite=` | omit suite → all; unknown suite → `{tasks:[]}` |
| POST | `/api/runs[?mock=1]` | `{model, suite}` required, else 400 |
| GET | `/api/runs` | summaries, newest first |
| GET | `/api/runs/:id` | full run or 404 |
| GET | `/api/leaderboard` | `{leaderboard, manual, arena}` — only board endpoint |
| GET/POST | `/api/prompts`, `GET /api/prompts/:id` | `{title, body, tags?}` |
| GET/POST | `/api/scores` | GET filters `?prompt=&model=`; POST `{promptId, model, answer, score01}` |
| POST/GET | `/api/matches` | create `{promptId, modelA, modelB, seed}`; list hides answers/models |
| GET | `/api/matches/:id[?reveal=1]` | models hidden until verdict unless `?reveal=1` |
| POST | `/api/matches/:id/answers` | `{side:"A"\|"B", text}`; 409 after verdict |
| POST | `/api/matches/:id/votes` | `{judge, side:"A"\|"B"\|"draw"}`; auto-finalizes, 409 after |

> `docs/ARENA.md` names `POST .../verdict` and `GET /api/arena-leaderboard`; the
> code auto-verdicts on votes and folds arena into `/api/leaderboard.arena`. Code
> wins.

## 7. Adding a New Build

1. Copy the build into `web/public/play/<buildId>/`, verbatim.
2. **Multi-file builds need a `redirects()` entry to the full `index.html`
   path**, not a `rewrites()` entry — a rewrite leaves the browser URL at
   `/play/<buildId>`, so relative `style.css`/`game.js` 404 and the build ships
   dead. Add every asset path to the smoke checks in `deploy/deploy.sh`.
3. Audit it against `docs/METHODOLOGY.md` A4, per dimension, with evidence.
4. Add an `AUDIT_TRAIL` entry in `web/src/lib/audit-data.ts` — dimension points,
   what it implements, and its verified findings.
5. Update the model-level score in `demo-data.ts` only if the new build is the
   strongest for that model.
6. `cd web && npm run check`, then deploy and verify.

## 8. Reset

```powershell
# Keep the live :8765 server running. Reset TEST instance data only:
Remove-Item data\prompts.json, data\scores.json, data\matches.json, data\ratings.json -ErrorAction SilentlyContinue
# Never delete data\.gitkeep. Server recreates missing files on next write.
# To clear auto-board test runs: remove results\*.json test files (keep real runs).
```

The site's leaderboard is **not** reset this way — it is seeded from
`web/src/lib/*.ts`, not from `data/`. Change the source, not the journal.
