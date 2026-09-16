# BDX Bench

> Blind arena + prompt bank + manual leaderboard for benchmarking our models — zero-dependency Node.js, local-first.

`[status: v0.1]` `[stack: node built-ins only]` `[suites: swe-mini + terminal-mini]` `[modes: mock · live]` `[gui: :8765]`

## What is this?

BDX Bench compares our models on small, deterministic, auto-gradable coding and shell tasks through one OpenAI-compatible gateway — with three ways to evaluate:

- **Blind arena** — A/B matches with hidden model identities, named judges (up to 3 votes), majority verdicts, and Elo rankings.
- **Prompt bank** — a shared library of prompts you run against any model (Kilo, Claude, Codex, gateway) and score manually.
- **Manual leaderboard** — human scores (0–10 → 0.0–1.0) merged with auto-run results, ranked per model.

No cloud account, no database, no `npm install`. Server + static GUI + CLI runner, all local.

## Pages at a glance

```
┌─────────────────────────────────────────────────────────┐
│  BDX Bench  (:8765)                                     │
│  ┌───────────┐  ┌───────────┐  ┌───────────────────┐     │
│  │  /        │  │ arena.html│  │ prompts.html      │     │
│  │ Dashboard │  │ Blind A/B │  │ Prompt bank       │     │
│  │           │  │           │  │                   │     │
│  │ • queue   │  │ • A vs B  │  │ • New prompt form │     │
│  │   runs    │  │   answers │  │ • prompt list     │     │
│  │ • run list│  │ • 3 votes │  │ • Add score       │     │
│  │ • leader- │  │ • verdict │  │   (model+0-10)    │     │
│  │   board   │  │ • Elo     │  │ • manual board    │     │
│  └───────────┘  └───────────┘  └───────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

## Features

- **Two auto-gradable suites** — `swe-mini` (code-fix) and `terminal-mini` (shell tasks) with `file-contains` / `file-exists` / `shell` checks.
- **Fair-by-default methodology** — identical prompt per task, temperature 0, one attempt, 60s timeout, isolated workdir.
- **Mock vs live modes** — offline reproducible mock runs for CI/UI dev; gateway-backed live runs for real benchmarking (never mixed on the leaderboard).
- **Blind arena workflow** — seeded pairings, hidden identities until verdict, majority-wins judging, journal-first persistence, Elo from 1000 (K=32).
- **Manual scoring** — 0.9–1.0 correct + insightful down to 0.0–0.2 nonsense; prompt bank seeds included in `tasks/*/`.
- **Crash-safe JSON storage** — `data/` + `results/` files only; delete to reset.
- **npm scripts** — `start`, `mock`, `aggregate`, `seed`, `verify` (see `package.json`).

## Repo layout

```
BDX BENCH/
├── README.md               <- you are here
├── package.json            <- scripts: start · mock · aggregate · seed · verify
├── server/
│   └── server.js           <- HTTP server + static GUI (:8765)
├── runner/
│   ├── run.js              <- CLI runner (mock|live)
│   └── lib/                <- client · checks · patch helpers
├── tasks/
│   ├── swe-mini/           <- 6 code-fix tasks (*.json)
│   └── terminal-mini/      <- 6 shell tasks (*.json)
├── public/
│   ├── index.html          <- dashboard: runs + leaderboard
│   ├── arena.html          <- blind A/B matches + votes + Elo
│   ├── prompts.html        <- prompt bank + manual scores
│   ├── app.js
│   └── styles.css
├── docs/
│   ├── METHODOLOGY.md
│   ├── ARENA.md
│   ├── PROMPTS.md
│   ├── API.md
│   ├── QUICKSTART.md
│   └── SPEC.md
├── models/
│   └── models.json         <- model ids + effort tiers
├── scripts/                <- aggregate · seed-demo · verify · run-server
├── results/                <- run outputs + leaderboard.json (demo runs marked "demo":true)
├── data/                   <- prompts.json · scores.json · matches.json · ratings.json
└── tests/
    └── smoke.js
```

## 5-minute quickstart

**0. Prereqs** — a working `node`, nothing else. No `npm install`.

```powershell
node --version
```

**1. Start the server** (default port `8765`, override with `$env:BDX_BENCH_PORT`):

```powershell
npm start
# equivalent: node server/server.js
curl http://127.0.0.1:8765/api/health
```

**2. Open the GUI:**

```
http://127.0.0.1:8765
```

**3. Bank a prompt** — GUI: `prompts.html` → "New prompt" form. Or API:

```powershell
Invoke-RestMethod http://127.0.0.1:8765/api/prompts -Method Post `
  -ContentType 'application/json' `
  -Body '{"title":"Closure check","body":"Explain closures with one example","tags":["js"]}'
```

Starter seeds: every file under `tasks/swe-mini/*.json` and `tasks/terminal-mini/*.json` has a `prompt` field — copy any of them into a new bank entry.

**4. Run a blind arena match** — GUI: `arena.html` → "New match" form (prompt + modelA + modelB + seed). Or API:

```powershell
# create (pick a prompt id from GET /api/prompts first)
Invoke-RestMethod http://127.0.0.1:8765/api/matches -Method Post `
  -ContentType 'application/json' `
  -Body '{"promptId":"p-001","modelA":"bdx-ai/gpt-5.6-luna","modelB":"bdx-ai/go-muse-spark-1.3-contributor","seed":42}'
# inspect one match (sides hidden until verdict)
curl http://127.0.0.1:8765/api/matches/<id>
```

Paste each model's answer into its side (A/B), collect up to 3 named-judge votes, then tally the verdict — identities reveal and Elo updates.

**5. Score it** — GUI: open the prompt → "Add score" (model picker, answer box, 0–10 slider; 7/10 → 0.7). Or API:

```powershell
Invoke-RestMethod http://127.0.0.1:8765/api/scores -Method Post `
  -ContentType 'application/json' `
  -Body '{"promptId":"p-001","model":"bdx-ai/gpt-5.6-luna","answer":"<paste>","score01":0.8,"notes":"clear example"}'
```

Score guide: 0.9–1.0 correct + insightful · 0.7–0.8 correct · 0.5–0.6 partial · 0.3–0.4 wrong direction · 0.0–0.2 nonsense.

**6. Read the leaderboard:**

```powershell
curl http://127.0.0.1:8765/api/leaderboard
```

Live gateway runs need a key (mock mode needs none) — set it without ever printing it:

```powershell
$env:BDX_AI_API_KEY = "your-key-here"
# Do NOT run: echo $env:BDX_AI_API_KEY
```

Full walkthrough: [`docs/QUICKSTART.md`](docs/QUICKSTART.md).

## Models

| Model id | Label | Effort | Notes |
|---|---|---|---|
| `bdx-ai/gpt-5.6-luna` | GPT Luna 5.6 | max | Flagship reasoning model; hardest tasks and reference answers. |
| `bdx-ai/go-muse-spark-1.3-contributor` | Muse Spark 1.3 | xhigh | Contributor-tier coding agent; default worker for implementation tasks. |
| `bdx-ai/gemini-3.7-flash-tiered` | Gemini 3.7 Flash | high | Fast tiered Flash; breadth, triage, cost-efficient runs. |
| `bdx-ai/gemini-3.8-flash-tiered` | Gemini 3.8 Flash | high | Newer tiered Flash; compare directly against 3.7 Flash. |

Source of truth: [`models/models.json`](models/models.json). Gateway defaults: `BDX_BASE_URL` (`https://gpt.bdx.market/v1`) + `BDX_AI_API_KEY` — live mode only, never print or commit the key.

## API & pages

**Endpoints (v0.1):**

| Method | Path |
|---|---|
| GET | `/api/health` |
| GET | `/api/models` |
| GET | `/api/tasks` |
| GET / POST | `/api/runs` |
| GET | `/api/runs/:id` |
| GET | `/api/leaderboard` |
| GET / POST | `/api/prompts` |
| GET | `/api/prompts/:id` |
| GET / POST | `/api/scores` |
| GET / POST | `/api/matches` |
| GET | `/api/matches/:id` |

**Static pages:** `/` (dashboard) · `/arena.html` (blind matches) · `/prompts.html` (bank + scores).

CLI equivalent: `node runner/run.js --model <id> --suite <swe-mini|terminal-mini> --mode <mock|live> --out <path>`.

## Docs

- [`docs/QUICKSTART.md`](docs/QUICKSTART.md) — 5-minute walkthrough (mock run in browser, one live CLI task).
- [`docs/METHODOLOGY.md`](docs/METHODOLOGY.md) — suites, task model, scoring (`avgScore` primary, `passRate` tiebreak), fairness rules, mock vs live.
- [`docs/ARENA.md`](docs/ARENA.md) — blind-match rules, seeded pairing, judging (majority wins, ties draw), Elo, chat-driven workflow.
- [`docs/PROMPTS.md`](docs/PROMPTS.md) — manual prompt workflow: add prompt → run models yourself → record scores → read leaderboard.
- [`docs/API.md`](docs/API.md) — endpoint reference with shapes and examples.

## Contributing

- Contributor guide: [`CONTRIBUTING.md`](CONTRIBUTING.md) — PR rules, task/check conventions, how to add suites without breaking methodology versioning.
- Agent workflow: [`AGENTS.md`](AGENTS.md) — file ownership, allowed endpoints, secrets hygiene (never print `BDX_AI_API_KEY` or Authorization headers), code-wins-over-docs rule.

## v0.1 limits (honest)

- **Tiny scale** — 12 curated mini tasks, not thousands of real issues or full VMs; results are indicative, not statistically significant.
- **No Docker per task** — isolated workdirs only; shell checks run on the host Node env.
- **Binary checks** — `file-contains` / `file-exists` / `shell` exit codes only; no hidden FAIL_TO_PASS / PASS_TO_PASS rigor.
- **Single-shot skill only** — one attempt, temperature 0; measures deterministic single-shot output, not agent loops with tool use.
- **Mock ≠ live** — mock returns canned fixtures for plumbing; never compare mock and live rows directly.
- **Local-only** — no auth, no multi-user, no pagination, no persistence guarantees beyond crash-safe JSON files.
- **Gateway-scoped** — only models reachable via the OpenAI-compatible gateway.
- If code and docs disagree, **code wins** (v0.1) — check `server/`, `runner/run.js`, `tasks/` and file an issue.
