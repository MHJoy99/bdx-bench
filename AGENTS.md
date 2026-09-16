# AGENTS.md — BDX Bench Operating Manual

> Read this first. Any AI landing in this repo starts here.

## 1. What BDX Bench Is

Local zero-dependency benchmark harness + leaderboard GUI for testing models via the BDX AI gateway.
Two mini suites (`swe-mini` code-fix, `terminal-mini` shell) plus a blind chat arena (A/B matches, Elo).
Single-file server (`server/server.js`, Node built-ins only) serves the API + static UI; no DB, no cloud.

## 2. Golden Rules

1. **Read `docs/SPEC.md` before writing code.** If code and docs disagree, code wins — file an issue.
2. **Keep zero-dep.** Node built-ins only (`node:http/fs/path/url/crypto/child_process`). No `npm install`, no `node_modules`.
3. **Never print `BDX_AI_API_KEY`.** Not in chat, logs, responses, or stored runs. Redact auth headers too.
4. **Mock-only verification.** NO live gateway calls without an explicit user ask. Default to `mock` / `?mock=1`.
5. **Live server is on `:8765` — never stop it, never bind `:8765` in tests.** Test API on `:18765`:
   ` $env:BDX_BENCH_PORT="18765"; node server/server.js`.
6. **Crash-safe writes.** Persist JSON via tmp-file + rename. Never truncate-then-write.
7. **File ownership.** Check `git log` / `ls` before editing outside your task scope; each area has one owner (see §4).

## 3. How to Run

```powershell
npm start        # node server/server.js -> http://127.0.0.1:8765 (live; don't stop it)
npm run mock     # one mock run, writes results/mock.json (no key needed)
npm run seed     # node scripts/seed-demo.js — demo data for the GUI
npm run aggregate# node scripts/aggregate.js — rebuild leaderboard from results/
npm run verify   # scripts/verify.ps1 — conformance check (uses :18765, never :8765)
```

Live CLI run (only when user explicitly asks; needs key, never echo it):
`$env:BDX_AI_API_KEY="..."; node runner/run.js --model <id> --suite <swe-mini|terminal-mini> --mode live --out ./out.json`

## 4. Where Everything Lives

| Dir / file | Purpose | Owner agent |
|---|---|---|
| `server/server.js` | Entire backend: API + static files | server agent (only this file) |
| `public/` | GUI: `index.html`, `app.js`, `arena.html`, `style.css` | UI agent |
| `tasks/<suite>/*.json`, `suites/` | Task definitions (fallback `suites/<suite>`) | tasks agent |
| `models/models.json` | Static model list (offline-safe) | models agent |
| `runner/run.js` | CLI runner (`--model --suite --mode --out`) | runner agent |
| `scripts/` | `seed-demo.js`, `aggregate.js`, `verify.ps1` | tooling agent |
| `docs/` | `SPEC.md` (contract), `ARENA.md`, `METHODOLOGY.md`, `API.md` | docs agent |
| `data/` | Runtime journal: `prompts/scores/matches/ratings.json` | server only (never hand-edit) |
| `results/` | One JSON per run (`<runId>.json`), leaderboard source | server/runner only |

## 5. How Contributions Reach the Leaderboard

`GET /api/leaderboard` returns `{ leaderboard, manual, arena }` — three boards, one call.

- **Runs → auto board:** `POST /api/runs {model, suite}` → `results/*.json` → `leaderboard` (avg per model).
- **Prompts → scores → manual board:** `POST /api/prompts {title, body}` → `POST /api/scores {promptId, model, answer, score01}` → `manual`.
- **Matches → verdict → arena board:** `POST /api/matches {promptId, modelA, modelB, seed}` → `POST /:id/answers {side, text}` → `POST /:id/votes {judge, side}` → auto-verdict at 2-vote majority or 3 votes (Elo K=32, start 1000) → `arena`.

Journal-first: every verdict persists to `data/matches.json` before any board rebuilds.

## 6. Endpoint Cheat-Sheet

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

> `docs/ARENA.md` names `POST .../verdict` and `GET /api/arena-leaderboard`; the code auto-verdicts on votes and folds arena into `/api/leaderboard.arena`. Code wins.

## 7. Reset

```powershell
# Keep the live :8765 server running. Reset TEST instance data only:
Remove-Item data\prompts.json, data\scores.json, data\matches.json, data\ratings.json -ErrorAction SilentlyContinue
# Never delete data\.gitkeep. Server recreates missing files on next write.
# To clear auto-board test runs: remove results\*.json test files (keep real runs).
```

## 8. Secrets Checklist

- Key arrives via `BDX_AI_API_KEY` env only; gateway base via `BDX_BASE_URL` (default `https://gpt.bdx.market/v1`).
- Absent key → `mock` mode. Never gate mock paths on the key's value.
- Before any commit/log/persist: grep for key material and `Authorization` values.
