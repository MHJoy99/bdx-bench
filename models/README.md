# BDX Bench — Models

Single source of truth for which models the runner/server may call: `models/models.json`.

## File shape

```json
{
  "defaults": {
    "baseUrl": "https://gpt.bdx.market/v1",
    "baseUrlEnv": "BDX_BASE_URL",
    "keyEnv": "BDX_AI_API_KEY"
  },
  "models": [
    {
      "id": "bdx-ai/gpt-5.6-luna",
      "label": "GPT Luna 5.6",
      "effort": "max",
      "notes": "...",
      "baseUrlEnv": "BDX_BASE_URL",
      "keyEnv": "BDX_AI_API_KEY"
    }
  ]
}
```

- `id` — model identifier sent to the gateway (required, unique).
- `label` — human-readable display name (required).
- `effort` — reasoning-effort tier, lowest → highest (required; see scale below).
- `notes` — free-text role/usage note (optional but recommended).
- `baseUrlEnv` / `keyEnv` — env-var names only (required, values shown above).
  **Never store URLs with credentials or API keys in this file.**

## Gateway

All models face the same OpenAI-compatible gateway:

- Base URL: read from env `BDX_BASE_URL`, default `https://gpt.bdx.market/v1`.
- API key: read from env `BDX_AI_API_KEY` (no default; never committed).

## Effort scale

Ordered lowest → highest:

`low` < `medium` < `high` < `xhigh` < `max`

- `high` — fast/cheap tier (e.g. both Gemini Flash models).
- `xhigh` — extra-high reasoning (e.g. Muse Spark 1.3 worker).
- `max` — maximum reasoning (e.g. GPT Luna 5.6 reference).

Pass the entry's `effort` string through to the gateway request unchanged.
If the gateway rejects an effort value, fail that run loudly — do not
silently remap it.

## How to add a model

1. Append one object to the `models` array in `models/models.json`:
   `id` (unique), `label`, `effort` (one of the scale above), `notes`,
   plus `"baseUrlEnv": "BDX_BASE_URL"` and `"keyEnv": "BDX_AI_API_KEY"`.
2. Validate the file parses: `Get-Content models/models.json -Raw | ConvertFrom-Json`.
3. Do not add secrets — only env-var **names**.
4. Keep entries sorted or grouped deliberately; keep `id`s stable
   (runners log results keyed by `id`).
