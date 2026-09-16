# API Reference — BDX Bench v0.1

Base URL: `http://127.0.0.1:8765` (override port with env `BDX_BENCH_PORT`).

All responses are JSON. Errors return a non-2xx status with `{"error":"message"}`.

> v0.1 note: field names beyond the contracts below are illustrative. If the server returns extra/different fields, the server wins.

## GET /api/health

Liveness check. No auth, no key.

**Request:**
```http
GET /api/health
```

**Example:**
```powershell
curl http://127.0.0.1:8765/api/health
```

**Response `200`:**
```json
{ "ok": true }
```

## GET /api/models

List model ids available to benchmark.

**Request:**
```http
GET /api/models
```

**Example:**
```powershell
curl http://127.0.0.1:8765/api/models
```

**Response `200`:**
```json
{ "models": [{ "id": "demo-model" }] }
```

Use an `id` from this list as `--model` in the CLI and as `model` in `POST /api/runs`.

## GET /api/tasks

List tasks, optionally filtered by suite.

**Request:**
```http
GET /api/tasks?suite=swe-mini
```

| Query | Values | Default |
|---|---|---|
| `suite` | `swe-mini`, `terminal-mini` | all tasks |

**Example:**
```powershell
curl "http://127.0.0.1:8765/api/tasks?suite=swe-mini"
```

**Response `200`:**
```json
{ "tasks": [{ "id": "swe-mini-001", "suite": "swe-mini" }] }
```

## GET /api/runs

List runs (newest first in v0.1).

**Request:**
```http
GET /api/runs
```

**Example:**
```powershell
curl http://127.0.0.1:8765/api/runs
```

**Response `200`:**
```json
{ "runs": [{ "id": "run-1", "model": "demo-model", "suite": "swe-mini", "mode": "mock", "status": "done" }] }
```

## GET /api/runs/:id

Fetch one run by id.

**Request:**
```http
GET /api/runs/run-1
```

**Example:**
```powershell
curl http://127.0.0.1:8765/api/runs/run-1
```

**Response `200`:**
```json
{ "id": "run-1", "model": "demo-model", "suite": "swe-mini", "mode": "mock", "status": "done" }
```

**Response `404`:**
```json
{ "error": "run not found" }
```

## GET /api/leaderboard

Pass-rate ranking over finished runs. Simple ordering in v0.1 — ties and costs not normalized.

**Request:**
```http
GET /api/leaderboard
```

**Example:**
```powershell
curl http://127.0.0.1:8765/api/leaderboard
```

**Response `200`:**
```json
{ "leaderboard": [{ "model": "demo-model", "passRate": 1.0, "runs": 1 }] }
```

## POST /api/runs

Queue a run. `mock` needs no key; `live` calls the gateway (`BDX_BASE_URL` + `BDX_AI_API_KEY`) server-side — never send the key in the body.

**Request:**
```http
POST /api/runs
Content-Type: application/json
```

| Field | Type | Required | Values |
|---|---|---|---|
| `model` | string | yes | id from `GET /api/models` |
| `suite` | string | yes | `swe-mini`, `terminal-mini` |
| `mode` | string | yes | `mock`, `live` |

**Example (mock):**
```powershell
curl -X POST http://127.0.0.1:8765/api/runs `
  -H "Content-Type: application/json" `
  -d '{"model":"demo-model","suite":"swe-mini","mode":"mock"}'
```

**Example (live):**
```powershell
curl -X POST http://127.0.0.1:8765/api/runs `
  -H "Content-Type: application/json" `
  -d '{"model":"<id>","suite":"terminal-mini","mode":"live"}'
```

**Response `201` (or `200` in v0.1 implementations):**
```json
{ "id": "run-2", "model": "demo-model", "suite": "swe-mini", "mode": "mock", "status": "queued" }
```

Poll with `GET /api/runs/:id` until `status` is `done` (or `failed`).

**Response `400`:**
```json
{ "error": "unknown suite" }
```

## CLI equivalent

```powershell
node runner/run.js --model <id> --suite <swe-mini|terminal-mini> --mode <mock|live> --out <path>
```

Writes the run result JSON to `<path>`.

## v0.1 Limits

- No auth, no pagination, no filtering beyond `suite` on `/api/tasks`.
- `mock` results are canned — useful for plumbing, meaningless for ranking.
- Small task sets; leaderboard is indicative only.
