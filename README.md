# BDX Bench

[![Live Demo](https://img.shields.io/badge/demo-bench.bdx.market-brightgreen)](https://bench.bdx.market)
[![Repo](https://img.shields.io/badge/github-MHJoy99%2Fbdx--bench-blue?logo=github)](https://github.com/MHJoy99/bdx-bench)
[![Issues](https://img.shields.io/github/issues/MHJoy99/bdx-bench)](https://github.com/MHJoy99/bdx-bench/issues)
[![License](https://img.shields.io/github/license/MHJoy99/bdx-bench)](https://github.com/MHJoy99/bdx-bench/blob/main/LICENSE)

> Independent local benchmark harness, real-time leaderboard, and playable browser-game showcase — testing AI models against identical real-world software briefs.

**Live Production:** [https://bench.bdx.market/](https://bench.bdx.market/)  
**Telemetry & SEO:** Google Analytics 4 (`G-8P7CD6V133`), Microsoft Clarity (`ymfkbzmbcr`), Dynamic Sitemap (`/sitemap.xml`), and Google Search Console verification.

---

## 🎮 The Zombie Flamethrower Showdown (`p-001`)

Every model receives the exact same unprimed user brief:
> *"make me a video game where i am killing zombies with fire and all please? a nice wonderfull game i can play for fun okay?"*

### Verified Leaderboard & Instant Playable Builds:

| Rank | Model | Showdown Score | Playable Build | Description |
|:---:|:---|:---:|:---:|:---|
| **#1** | **DeepSeek V4.1 Flash** | **94.0** | [Play PYRE ↗](https://bench.bdx.market/play/pyre-burn-horde) | Thermodynamic fire contagion, 6 enemy classes, Titan bosses & 19 card upgrades. |
| **#2** | **Space Bunny Free** | **93.5** | [Play Space Bunny ↗](https://bench.bdx.market/play/space-bunny) | Firebound protocol with dynamic heat core, boss encounters, minimap radar tracking & procedural audio. |
| **#3** | **Muse Spark 1.3** | **92.0** | [Play Pyro vs Zombies ↗](https://bench.bdx.market/play/pyro-vs-zombies) | Pure arcade twin-stick shooter with high-contrast particles & rapid pick-up-and-play. |
| **#4** | **GPT 6 Sol** | **91.5** | [Play Cinderline ↗](https://bench.bdx.market/play/cinderline) | Large-arena survivor with WASD twin-stick controls, firebomb mortar lobs, evasive dash, and heat combos. |
| **#5** | **GPT Luna 5.6** | **91.0** | [Play Firebreak ↗](https://bench.bdx.market/play/firebreak-night-shift) | Dark street survival with 4 enemy types, spreading flame, Solar Burst & fire dash. |
| **#6** | **Gemini Pro Agent** | **90.5** | [Play Zombie Fire Survival ↗](https://bench.bdx.market/play/zombie-fire-survival) | Fluid twin-stick survivor with normalized WASD, mouse aim turret, and glowing additive flamethrower cone. |
| **#7** | **GPT Luna 6** | **89.5** | [Play Emberfall ↗](https://bench.bdx.market/play/emberfall) | Atmospheric dark-woods arena with smooth twin-stick controls, fuel pickups & mobile sticks. |
| **#8** | **Gemini 3.8 Flash** | **88.0** | [Play Pyroclasm ↗](https://bench.bdx.market/play/pyroclasm-inferno) | High-particle survivor with secondary fireball unlockables & edge-spawning swarms. |

---

## 🏗️ Architecture & Stack

1. **Production Web Application (`web/`)**:
   - Modern Next.js 16 app with React 19, Tailwind CSS, TypeScript, and standalone output.
   - Comprehensive model pages (`/models/[slug]`), interactive comparison views (`/compare`), full methodology breakdown (`/methodology`), and trend visualization (`/trends`).
   - Integrated with Google Analytics 4 (`G-8P7CD6V133`) and Microsoft Clarity (`ymfkbzmbcr`).
   - Automated dynamic `sitemap.xml` and `robots.txt`.

2. **Harness Backend (`server/server.js`)**:
   - Zero-dependency Node.js HTTP server (`node:http`, `node:fs`, `node:crypto`).
   - Runs on port `8765` for deterministic evaluation, CLI runs, and local-first benchmarking.
   - Manages prompts (`data/prompts.json`), scores (`data/scores.json`), blind arena pairings (`data/matches.json`), and Elo ratings.

3. **Production VPS Deployment (`deploy/`)**:
   - Hosted on RackNerd VPS (`/srv/bot-storage/sites/bench.bdx.market`).
   - Systemd service `bdx-bench` behind Nginx reverse proxy with SSL.
   - Automated build & deployment script (`deploy/deploy.sh`).

---

## 🚀 Quickstart

### 1. Run the Next.js Production Web App:
```bash
cd web
npm install
npm run dev
# Open http://localhost:3000
```

### 2. Run the Zero-Dependency Harness Server:
```bash
npm start
# Open http://127.0.0.1:8765
```

---

## 📜 Methodology Guarantee

- **Zero Cherry-Picking:** All games run from single-shot model generations without per-model prompt tuning.
- **Hands-On Human Review:** Playability, control smoothness, audio synthesis, and performance are judged in real browser environments.
- **Self-Contained Code:** All builds are 100% client-side HTML5/Canvas with zero external tracking scripts injected into the game canvases.

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
