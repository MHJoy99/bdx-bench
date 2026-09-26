# BDX Bench — Methodology

Two methodologies live in this project. They are independent.

| | Method | Status |
|---|---|---|
| **A** | **Showdown Score v2** — game-build audit | **Live.** This is what the site ranks. |
| **B** | Harness suites (`swe-mini`, `terminal-mini`) | Retained, not currently driving the site. |

**Part A is the canonical method for the public leaderboard.** Part B is kept
below because the harness, task definitions, and runner still exist in the repo
and `SPEC.md` depends on them.

---

# Part A — Showdown Score v2 (game-build audit)

> Own methodology for the public leaderboard. Revised 2026-09-26.

## A1. Goal

Rank AI coding models by the quality of the **playable web game each one built
from a single shared prompt**, and make every point of that ranking inspectable.

One prompt, given verbatim to every model:

```
make me a video game where i am killing zombies with fire and all please? a nice wonderfull game i can play for fun okay?
```

The unit of evaluation is the **artifact**, not a text answer. Each model
produced a self-contained browser game; those games are hosted on the site and
playable by anyone. The score exists to summarise the audit, not to replace it.

## A2. Why v1 was withdrawn

v1 scored builds by inspecting on-screen text and feature claims. That method
credited features that were absent from the code, and reported scores up to **40
points too high**. Concrete examples found during the v2 re-audit:

- A build scored 93 whose "flamethrower" appeared **exactly once in the whole
  file: the page title**. There was no cone, no arc, no range code.
- A build scored 86 whose menu said "Move & Dash" — there was no dash.
- A build scored 93 whose "card draft" was 15 CSS `.stat-card` HUD tiles never
  read by any update function.
- Two builds shipped a mobile media query with **zero** touch handlers.

v1 is withdrawn and must not be reinstated. Its numbers are retained only as
`superseded` references.

## A3. The rule that fixes it

> **A feature earns points only when it is genuinely implemented AND reachable.
> On-screen strings, comments, dead code, and unreachable UI score zero.**

Enforce it by reading the implementation, not the claims. Useful probes:

| Question | Probe |
|---|---|
| Is the flamethrower a real cone? | search for arc/angle + range, not just the word "flamethrower" |
| Does touch actually work? | count `touchstart\|touchmove\|pointerdown` — a media query with no handlers is a lie |
| Are enemies really varied? | is the type field read inside the **update/AI** function, or only for stats? |
| Is the card draft real? | count `createElement\|innerHTML\|appendChild` — ~0 means no DOM-built card UI can exist |
| Is there music? | a step sequencer / scheduled notes / loop, not one-shot SFX |
| Is knockback correct? | is impulse **directional**, and is the mass table not inverted? |
| Do the SFX fire? | is every defined sound actually called? |
| Are bars reachable? | is the observed element non-zero-area, and is the document visible? |

## A4. Rubric — 5 dimensions × 20 points = 100

| Dimension | Max | What it measures |
|---|---:|---|
| Controls & Mobility | 20 | movement, aim, dash **i-frames**, pause, touch that works, debug params |
| Combat Physics & Weapons | 20 | cone/arc/range, burn DoT, contagion, lingering pools, cooldown economy, knockback correctness, distinct damage sources |
| Content & Enemy Variety | 20 | enemy archetypes with real behavioural divergence, boss ability count, pickup types, combo, roguelite upgrade layer, meta-progression |
| Audio & Sound Design | 20 | procedural WebAudio, distinct events, **music vs SFX-only**, dead-SFX count, namespace hygiene |
| Visual Polish & Game Feel | 20 | hit-stop, slow-motion, screen shake, floating damage numbers, pooled particles, real lighting, live HUD |

**Hard rules:** no audio at all ⇒ **0/20 audio**. A touch layer that does not
work ⇒ 0 for that capability. A stat-stick enemy is not variety.

## A5. Fairness rules

1. **Identical prompt**, verbatim, for every model.
2. **Builds are hosted verbatim.** Never patch a build to fix a defect — that
   measures the fixer, not the model. Record the defect instead.
3. **One judge, one rubric, applied uniformly.** Re-audit every build when the
   rubric changes; never re-score only the builds you like.
4. **Report the defects.** A benchmark that hides failures is not trustworthy.
   `audit-data.ts` findings are surfaced in the UI as first-class content.
5. **Withdraw, do not silently restate.** When a method is found wrong, version
   it (`v1` → `v2`), mark the old numbers superseded, and explain why.
6. **Every score is reproducible** from the audit record: dimension points plus
   the evidence and findings behind them.

## A6. Known limitations

- **One prompt, one domain.** Results do not generalise to other models,
  prompts, or task types.
- **Ten builds, eight models.** n is small; a 1-point difference is not a
  finding.
- **Judged by code inspection**, not by a large human panel or an automated
  test suite. Subjective where it is subjective, and the evidence is published
  so readers can disagree.
- **Single round, no repeat runs.** No confidence intervals; treat small gaps as
  noise.
- **The audit is static.** The site never implies scores update live.

## A7. Versioning

- `v1` — withdrawn. Claim-based inspection. Over-scored by up to 40 points.
- `v2` — current. Implementation-level audit, five dimensions, evidence
  published, defects disclosed.

---

# Part B — Harness suites (retained, not site-driving)

> Legacy methodology for the zero-dependency Node harness. `SPEC.md`, the task
> definitions, and `runner/run.js` still implement this.

## 1. Goal

Compare models on small, deterministic, auto-gradable coding/shell tasks through one
OpenAI-compatible gateway, with a reproducible mock mode and an auditable live mode.

## 2. Suites

| Suite | Id | Focus | Task kinds |
|---|---|---|---|
| SWE Mini | `swe-mini` | Code-fix tasks: read a file, patch it, satisfy checks | `file-contains`, `file-exists` |
| Terminal Mini | `terminal-mini` | Shell tasks: run commands, produce files/output | `shell`, `file-exists`, `file-contains` |

Each suite ships a fixed task list. A task belongs to exactly one suite.

## 3. Task Model

```json
{
  "id": "swe-001",
  "suite": "swe-mini",
  "title": "Fix off-by-one",
  "kind": "code-fix",
  "description": "Human-readable instructions",
  "prompt": "Exact model prompt (fairness: identical for all models)",
  "setupFiles": [{ "path": "app.js", "content": "let x = 1;\n" }],
  "checks": [
    { "type": "file-contains", "path": "app.js", "contains": "x = 2" },
    { "type": "file-exists", "path": "out.txt" },
    { "type": "shell", "cmd": "node app.js", "expectExit": 0 }
  ],
  "timeoutSec": 60,
  "points": 10
}
```

- `setupFiles`: written fresh into an isolated per-task workdir before the model output is applied.
- `checks`: ALL must pass for the task to pass (AND semantics). No partial task credit;
  partial credit exists only at run level via weighting.
- `timeoutSec`: per-task wall clock, capped at 60s default.
- `points`: weight of the task in `avgScore`.

## 4. Scoring

For a run with N tasks, task `i` has `points p_i` and binary pass `pass_i ∈ {0,1}`:

- `score01_i = pass_i` (0 or 1; `score01` is kept per result for future partial credit).
- **avgScore (0..1)** = `Σ(p_i · pass_i) / Σ(p_i)` — points-weighted mean.
- **passRate (0..1)** = `Σ(pass_i) / N` — unweighted fraction passed.

`avgScore` is the primary ranking metric; `passRate` is the tiebreak/plain-language metric.
`GET /api/leaderboard` ranks runs by `avgScore` desc, then `passRate` desc, then `finishedAt` asc.

## 5. Fairness Rules

1. **Same prompt** — every model receives the identical `prompt` per task.
2. **Temperature 0** — deterministic decoding where the gateway supports it.
3. **1 attempt** — one completion per task per run; no retries, no self-repair loops.
4. **Timeout 60s** — per-task timeout (`timeoutSec`, default/max 60); timeout = fail.
5. **Isolated workdir** — fresh `setupFiles` per task; no cross-task state.
6. **No secrets in logs** — `BDX_AI_API_KEY` and Authorization headers are never printed/stored.

## 6. Modes: mock vs live

| | mock | live |
|---|---|---|
| `mode` in Run JSON | `"mock"` | `"live"` |
| Model call | none (deterministic fixture output) | via `BDX_BASE_URL` + `BDX_AI_API_KEY` |
| Purpose | CI, UI dev, offline reproducibility | Real benchmarking |
| `demo` flag | `true` allowed | `false` for official runs |

`POST /api/runs {model, suite}`: runs with a valid key → `live`; missing key →
server falls back to (or rejects in favor of) `mock` — always reflected honestly in
`mode`. Leaderboard SHOULD be filtered/annotated by `mode`; mock and live rows are
never directly compared.

## 7. Cost Tracking Fields

Run/result records SHOULD carry (optional but recommended):

- `usage`: `{ promptTokens, completionTokens, totalTokens }` per result + summed per run.
- `costUsd`: estimated cost per result + `totalCostUsd` per run.
- `startedAt` / `finishedAt`, `durationMs` per result for latency analysis.

These fields are informational and MUST NOT affect scoring.

## 8. Limitations vs SWE-bench / Terminal-Bench

- **Scale**: tens of curated mini tasks, not thousands of real GitHub issues / full VMs.
- **No Docker per task**: isolated workdirs only; shell checks run on host Node env.
- **Binary checks**: `file-contains` / `file-exists` / `shell` exit codes — no hidden
  test-suite FAIL_TO_PASS/PASS_TO_PASS rigor like SWE-bench.
- **Single attempt, temp 0**: measures determinism-capped single-shot skill, not
  agent loops with tool use like Terminal-Bench.
- **Gateway-scoped**: only models reachable via the OpenAI-compatible gateway; no
  local harness execution of model-generated patches beyond the check list.

## 9. Versioning

This is **methodology v1**. Changes to suites, scoring, or fairness rules require a
version bump and re-running affected runs; old runs keep their recorded methodology
version in `run.methodologyVersion = "v1"`.
