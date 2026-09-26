# BDX Bench — Spec

> **Scope: the zero-dependency harness only.** For the public benchmark
> site (`web/`, the Showdown Score v2 leaderboard) see `docs/WEB.md`.

> Zero-dependency Node.js (built-ins only). Server: `http://127.0.0.1:8765`.
> Gateway: env `BDX_BASE_URL` (default `https://gpt.bdx.market/v1`) +
> `BDX_AI_API_KEY` (never print secrets).

## 1. File Layout

```text
server.js          # single-file HTTP server (node:http only), serves API + static UI
package.json       # { "scripts": { "start": "node server.js" } }, no dependencies
tasks/
  swe-mini.json    # array of Task JSON (suite "swe-mini")
  terminal-mini.json
public/
  index.html       # dashboard: health, models, tasks, runs, leaderboard
  app.js           # fetch() UI, no framework
  style.css
docs/
  METHODOLOGY.md   # methodology v1 (this spec's companion)
  SPEC.md          # this file
runs/              # JSON files per run, named <runId>.json (created at runtime)
```

Constraints: no `node_modules`, no npm deps. Only Node.js built-ins
(`node:http`, `node:fs`, `node:path`, `node:crypto`, `node:child_process`).

## 2. Config / Env

| Var | Default | Purpose |
|---|---|---|
| `PORT` | `8765` | Listen port; server URL is `http://127.0.0.1:8765` |
| `BDX_BASE_URL` | `https://gpt.bdx.market/v1` | OpenAI-compatible gateway base URL |
| `BDX_AI_API_KEY` | (none) | Gateway key; absent → `mock` mode. NEVER log/print |

Models face the gateway only via these env vars (OpenAI-compatible
`POST {BDX_BASE_URL}/chat/completions`).

## 3. Endpoint Specs

Base: `http://127.0.0.1:8765`. All responses `application/json` (except static UI).

### `GET /api/health`

- `200` → `{ "ok": true, "mode": "mock"|"live", "time": "<ISO>" }`
- `mode`: `live` if `BDX_AI_API_KEY` set, else `mock`.

### `GET /api/models`

- `200` → `{ "models": [{ "id": "<model-id>", "label": "<display>" }] }`
- Static list +/or gateway `/models` passthrough; MUST work offline (mock ids).

### `GET /api/tasks?suite=`

- Query `suite`: `swe-mini` | `terminal-mini` (optional; omit → all tasks).
- `200` → `{ "tasks": [ Task, ... ] }`
- Unknown suite → `200` with `{ "tasks": [] }`.

### `POST /api/runs`

- Body: `{ "model": "<id>", "suite": "<suite>" }` (both required).
- Missing field → `400 { "error": "model and suite required" }`.
- Behavior: executes the suite (mock fixture or live gateway), evaluates checks,
  persists run, returns it.
- `201` → Run JSON (status `done`; async impls MAY return `202` + `status:"running"`
  then pollable via `GET /api/runs/:id`).

### `GET /api/runs`

- `200` → `{ "runs": [ RunSummary, ... ] }` (newest first; summary MAY omit `results`).

### `GET /api/runs/:id`

- Found → `200` Run JSON. Unknown id → `404 { "error": "not found" }`.

### `GET /api/leaderboard`

- `200` → `{ "leaderboard": [{ "runId","model","suite","mode","avgScore","passRate","finishedAt" }] }`
- Sorted: `avgScore` desc, `passRate` desc, `finishedAt` asc. SHOULD annotate `mode`.

## 4. JSON Schemas

### Task

```json
{
  "id": "swe-001",
  "suite": "swe-mini",
  "title": "Fix off-by-one",
  "kind": "code-fix",
  "description": "Human-readable instructions",
  "prompt": "Exact prompt sent to the model",
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

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | Unique within suite |
| `suite` | string | yes | `swe-mini` \| `terminal-mini` |
| `title` | string | yes | Display name |
| `kind` | string | yes | e.g. `code-fix`, `shell` |
| `description` | string | yes | Instructions |
| `prompt` | string | yes | Exact model input |
| `setupFiles` | `{path,content}[]` | yes | Written to isolated workdir (`[]` ok) |
| `checks` | Check[] | yes | ALL must pass; non-empty |
| `timeoutSec` | number | yes | Default 60, max 60 |
| `points` | number | yes | Weight, > 0 |

Check variants:

- `{ "type": "file-contains", "path": "<rel>", "contains": "<substr>" }`
- `{ "type": "file-exists", "path": "<rel>" }`
- `{ "type": "shell", "cmd": "<argv>", "expectExit": 0 }`

### Run

```json
{
  "id": "run-abc123",
  "model": "demo-echo",
  "suite": "swe-mini",
  "mode": "mock",
  "status": "done",
  "results": [
    { "taskId": "swe-001", "pass": true, "score01": 1, "durationMs": 12, "log": "..." }
  ],
  "avgScore": 1.0,
  "passRate": 1.0,
  "startedAt": "2026-09-16T00:00:00.000Z",
  "finishedAt": "2026-09-16T00:00:01.000Z",
  "demo": true
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | string | Unique run id |
| `model` | string | Model id from `/api/models` |
| `suite` | string | Suite executed |
| `mode` | `mock`\|`live` | Honest execution mode |
| `status` | string | `done` (or `running`/`error` if async) |
| `results` | Result[] | One per task: `{taskId, pass, score01, durationMs, log}` |
| `avgScore` | 0..1 | Points-weighted (see METHODOLOGY.md §4) |
| `passRate` | 0..1 | Unweighted fraction passed |
| `startedAt`/`finishedAt` | ISO | Run timestamps |
| `demo` | bool | `true` for mock/demo runs |

Optional cost fields: `usage {promptTokens,completionTokens,totalTokens}`,
`costUsd` / `totalCostUsd` (informational, never affect score).

## 5. Minimal Conformance Checklist

- [ ] `node server.js` (no install) serves UI + API on `http://127.0.0.1:8765`
- [ ] All 7 endpoints behave as §3 (status codes + shapes)
- [ ] Task/Run JSON match §4 schemas exactly (field names, check `type` union)
- [ ] Scoring = METHODOLOGY.md §4; fairness rules §5; `mode`/`demo` honest
- [ ] `BDX_AI_API_KEY` never appears in responses, logs, or stored runs
