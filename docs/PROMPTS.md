# BDX Bench — Manual Prompt Workflow (v0.1)

> **Scope: the harness manual-prompt workflow only.** The public site's
> scoring method is `docs/METHODOLOGY.md` Part A (Showdown Score v2).

No live model runs. You bring the prompts, run the models wherever you
like (Kilo Code, Claude, Codex), and record answers + scores here. The
leaderboard merges manual scores with the (demo) auto runs.

## 1. Add a prompt

GUI: open http://127.0.0.1:8765/prompts.html → "New prompt" form.

API:
```powershell
Invoke-RestMethod http://127.0.0.1:8765/api/prompts -Method Post `
  -ContentType 'application/json' `
  -Body '{"title":"Closure check","body":"Explain closures with one example","tags":["js"]}'
```

## 2. Run the models yourself

Paste the prompt body into each model (Kilo / Claude / Codex / gateway).
For fair comparison keep conditions equal: temperature 0, one attempt,
no follow-up hints — same fairness rules as docs/METHODOLOGY.md.

## 3. Record answers + scores

GUI: open the prompt → "Add score" (model picker, answer box, 0–10 slider,
notes). Slider maps to score01 (7/10 → 0.7).

API:
```powershell
Invoke-RestMethod http://127.0.0.1:8765/api/scores -Method Post `
  -ContentType 'application/json' `
  -Body '{"promptId":"p-001","model":"bdx-ai/gpt-5.6-luna","answer":"<paste>","score01":0.8,"notes":"clear example"}'
```

Score guide: 0.9–1.0 correct + insightful, 0.7–0.8 correct,
0.5–0.6 partial, 0.3–0.4 wrong direction, 0.0–0.2 nonsense.

## 4. Read the leaderboard

- Dashboard: http://127.0.0.1:8765/ (auto runs) and `manual` entries
  merged by model.
- API: `GET /api/leaderboard` → `{leaderboard:[...], manual:[...]}`.
- Filter: `GET /api/scores?prompt=p-001&model=bdx-ai/gpt-5.6-luna`.

## 5. Starter prompts

The 12 files under tasks/swe-mini/*.json and tasks/terminal-mini/*.json
each have a `prompt` field — ready-made bank seeds. Copy any `prompt`
text into a new bank entry to start scoring Luna vs Spark today.

## Data files

- data/prompts.json, data/scores.json (auto-created, crash-safe writes).
- Delete both files to reset the bank (server recreates on next write).
- Demo auto runs live in results/demo-*.json and are always marked `"demo":true`.
