# Contributing to BDX Bench

Local-first: server `http://127.0.0.1:8765`, GUI + API. Never print or commit secrets (`BDX_AI_API_KEY`).

> **This repo has two halves.** Sections 1–5 below are for the zero-dependency
> harness (`server/`, `tasks/`, `runner/`). The public product is the Next.js
> site in `web/`, which ranks AI models by an audit of the games they built —
> see §6 and [`docs/WEB.md`](docs/WEB.md). Read the half you are actually
> changing.

## 1. Add a prompt to the bank

GUI: `prompts.html` → "New prompt" form → appears in bank list (`GET /api/prompts`).

API:

```powershell
Invoke-RestMethod http://127.0.0.1:8765/api/prompts -Method Post -ContentType 'application/json' `
  -Body '{"title":"Closure check","body":"Explain closures with one example","tags":["js"]}'
```

Shape: `{ title, body, tags? }` → returns `{ id, title, body, tags }` (e.g. `p-001`).
Seed idea: copy any `prompt` field from `tasks/swe-mini/*.json` or `tasks/terminal-mini/*.json`.

## 2. Add a score

GUI: open the prompt → "Add score" (model picker, answer, 0–10 slider, notes).
Slider maps to `score01` (7/10 → `0.7`). Appears in prompt detail + leaderboard `manual` board.

API:

```powershell
Invoke-RestMethod http://127.0.0.1:8765/api/scores -Method Post -ContentType 'application/json' `
  -Body '{"promptId":"p-001","model":"bdx-ai/gpt-5.6-luna","answer":"<paste>","score01":0.8,"notes":"clear example"}'
```

Shape: `{ promptId, model, answer, score01 (0..1), notes? }`.
Guide: 0.9–1.0 insightful, 0.7–0.8 correct, 0.5–0.6 partial, 0.3–0.4 wrong track, 0.0–0.2 nonsense.
Read: `GET /api/scores?prompt=p-001&model=<id>`; `GET /api/leaderboard` → `{ leaderboard, manual }`.

## 3. Run an arena match

GUI: `arena.html` → "New match" (prompt + modelA + modelB + seed) → paste answer A/B → up to 3 votes → verdict card.

API:

```powershell
# create
Invoke-RestMethod http://127.0.0.1:8765/api/matches -Method Post -ContentType 'application/json' `
  -Body '{"promptId":"p-001","modelA":"bdx-ai/gpt-5.6-luna","modelB":"bdx-ai/go-muse-spark-1.3-contributor","seed":42}'
# answers / votes / verdict
Invoke-RestMethod http://127.0.0.1:8765/api/matches/<id>/answers -Method Post -ContentType 'application/json' -Body '{"a":"...","b":"..."}'
Invoke-RestMethod http://127.0.0.1:8765/api/matches/<id>/votes -Method Post -ContentType 'application/json' -Body '{"judge":"alice","pick":"A"}'
Invoke-RestMethod http://127.0.0.1:8765/api/matches/<id>/verdict -Method Post
```

Flow: majority of ≤3 votes wins (2–0/2–1); ties → `draw`; 0 votes → `pending`.
Verdict appends `data/matches.json` (journal first), updates Elo, rebuilds `GET /api/arena-leaderboard`.

## 4. Add a new task JSON

Create `tasks/<suite>/<id>.json` (suite = `swe-mini` | `terminal-mini`):

```json
{
  "id": "swe-01", "suite": "swe-mini", "title": "Fix off-by-one in sum()",
  "kind": "code-fix", "description": "Fix the loop so all elements are summed.",
  "prompt": "Exact model prompt...",
  "setupFiles": [{ "path": "work/swe-01/sum.js", "content": "// buggy...\n" }],
  "checks": [{ "type": "shell", "cmd": "node -e \"...\"", "expectExit": 0 }],
  "timeoutSec": 60, "points": 10
}
```

Check types: `file-contains { path, contains }` | `file-exists { path }` | `shell { cmd, expectExit? }`.
ALL checks must pass (AND). `timeoutSec` default/max 60. `points` weights `avgScore`.
Windows-safe: prefer `node -e "..."` with double quotes escaped, forward slashes, no `cat/grep/curl`.
Verify both directions: buggy `setupFiles` must FAIL checks; your fixed output must PASS.

## 5. Add a new model

Edit `models/models.json` → `models[]` entry (env-name refs only, no secrets in file):

```json
{ "id": "bdx-ai/my-model", "label": "My Model", "effort": "high",
  "baseUrlEnv": "BDX_BASE_URL", "keyEnv": "BDX_AI_API_KEY" }
```

`effort`: `max` (flagship) | `xhigh` | `high` (fast/breadth). Gateway default `https://gpt.bdx.market/v1`
via `defaults.baseUrlEnv`. Shows up in `GET /api/models` + GUI pickers. Set key via env only:
`$env:BDX_AI_API_KEY = "..."`.

## 6. Contribute to the public site (`web/`)

Full guidance: [`docs/WEB.md`](docs/WEB.md). The short version:

```powershell
cd web
npm run lint     # tsc --noEmit — this IS the lint gate (ESLint is not configured)
npm run build    # must end with the static/SSG route table
npm run check    # both
```

Site rules that get PRs rejected:

- **Never patch a build in `web/public/play/`.** Those are model output under
  benchmark. Document the defect in `web/src/lib/audit-data.ts` instead — the
  site surfaces findings as credibility content.
- **A feature counts only if implemented and reachable.** Strings, comments and
  dead code score zero. See `docs/METHODOLOGY.md` A3.
- **Never fake live data.** The audit is one static round; do not animate a
  score "arriving" or use FLIP to simulate a refresh.
- **Motion comes from the tokens.** Durations/easings live in
  `web/src/lib/motion-tokens.ts`. No invented values, and no decorative
  animation (loops, float, parallax, particles, pulse).
- **One stylesheet.** `web/src/styles/globals.css`, wired via
  `web/src/app/layout.tsx`. Do not add a second global CSS file.
- **Adding a multi-file build needs a `redirects()` entry** to the full
  `index.html` path, plus its asset paths in the `deploy/deploy.sh` smoke list.
  A `rewrites()` entry leaves the relative `style.css`/`game.js` 404.
- Dark and light themes must both work; keep body at 13px and all numbers
  `tabular-nums`.

Harness-only changes still need the root gates: `npm test` and `npm run a11y`.

## Scoring & fairness recap

- Identical `prompt` per task/match, temp 0, one attempt, no retries/hints.
- Bench: `avgScore = Σ(p·pass)/Σ(p)` ranks; `passRate` tiebreak (`docs/METHODOLOGY.md`).
- Manual: `score01` 0..1 per score; arena: majority wins, Elo start 1000, K=32.
- Mock (`demo:true`) vs live: never compare directly; filter leaderboard by `mode`.
- Alternate A/B order across matches to kill position bias.

## PR-style checklist

- [ ] Prompt/score/match visible in GUI + API (`/api/prompts`, `/api/scores`, `/api/matches`)?
- [ ] Same prompt, temp 0, one attempt observed?
- [ ] Task: buggy-fails / fixed-passes verified? Windows-safe cmds? `timeoutSec ≤ 60`?
- [ ] Model entry has `id,label,effort,baseUrlEnv,keyEnv`, no secret strings?
- [ ] Methodology version noted if scoring/fairness touched (`run.methodologyVersion`)?
- [ ] No keys, tokens, or `Authorization` headers in files, logs, or pastes?

Details: `docs/METHODOLOGY.md`, `docs/ARENA.md`, `docs/PROMPTS.md`, `docs/API.md`
(harness) and `docs/WEB.md` (site).
