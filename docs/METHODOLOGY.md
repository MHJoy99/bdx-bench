# BDX Bench — Methodology v1

> Own methodology for BDX Bench. Zero-dependency Node.js (built-ins only).
> Server: `http://127.0.0.1:8765`. Gateway: env `BDX_BASE_URL`
> (default `https://gpt.bdx.market/v1`) + `BDX_AI_API_KEY` (never print secrets).

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
