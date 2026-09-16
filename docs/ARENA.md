# BDX Arena — Blind Match Rules + Workflow (v0.1)

> Chat-driven blind arena on top of BDX Bench. Same server
> (`http://127.0.0.1:8765`), same fairness terms as `docs/METHODOLOGY.md`,
> same prompt bank as `docs/PROMPTS.md`. Never print secrets (`BDX_AI_API_KEY`).

## 1. Rules

### 1.1 Blind matches (A/B)
- Each match asks one prompt to two hidden sides: **A** and **B**.
- Model identities are **hidden until verdict** — judges and viewers see only
  side labels + answers. Reveal (`winner`, `modelA`, `modelB`) happens on verdict.
- GUI: `arena.html` renders A/B columns without names until the verdict card.

### 1.2 Seeded pairing
- Pairing is deterministic: the **same seed reproduces the same schedule**.
- Same `(seed, modelPool, promptIds)` → same `(modelA, modelB, promptId)` order.
- Use a visible seed per tournament (e.g. `seed=42`) so anyone can re-run
  the schedule and audit it.

### 1.3 Judging
- Judges are **any named strings** (people or models), e.g. `alice`, `luna-judge`.
- Up to **3 votes** per match. Each vote: `{ judge, pick: "A" | "B" | "draw" }`.
- **Majority wins**: 2–1 or 2–0 for one side → that side wins ("2-1 style win").
- **2 tied scorecards = draw**: 1–1, 1–1–1 style splits, or equal A/B counts
  with no majority → `verdict: "draw"`. Unvoted / 0-vote matches stay `pending`.

### 1.4 Elo
- Every model starts at **1000**. **K = 32**. Standard formula:
- `E_A = 1 / (1 + 10^((R_B − R_A)/400))`, `R'_A = R_A + K × (S_A − E_A)`,
  `S = 1` win / `0.5` draw / `0` loss (mirror for B).
- Example: both at 1000, A wins 2–1 → **1016 / 984**. Draw → no change.
- `GET /api/arena-leaderboard` ranks by Elo desc, then wins desc, then matches asc.

### 1.5 Journal-first
- **Every verdict is persisted in `data/matches.json` before** any leaderboard rebuild.
- Leaderboard is derived state; the journal is source of truth.
- Each rank entry links back: `{ model, elo, wins, losses, draws, matchIds: [...] }`.

## 2. Chat-driven workflow

1. **User pastes a prompt HERE in chat** — plain text, no setup needed.
2. **Assistant adds it to the bank**: `POST /api/prompts { title, body, tags }`.
3. **User creates a match** on `arena.html` ("New match" form: prompt + modelA +
   modelB + seed) — **or asks the assistant** to call it.
4. **User runs both models** wherever they chat with them (Kilo / Claude / Codex /
   gateway) and pastes each answer into its side (A or B).
5. **Judges vote** (up to 3 scorecards, named judges, blind to identities).
6. **Verdict + Elo**: majority decides, identities reveal, journal appends,
   Elo updates, leaderboard rebuilds.

## 3. Endpoints

| Method + path | Purpose |
|---|---|
| `POST /api/prompts` | Add prompt to bank (step 2) |
| `GET /api/prompts` | List bank |
| `GET /api/matches` | List matches (journal view) |
| `POST /api/matches` | Create match `{ promptId, modelA, modelB, seed }` |
| `GET /api/matches/:id` | Fetch one match (sides hidden until verdict) |
| `POST /api/matches/:id/answers` | Submit answers `{ a, b }`, one per side |
| `POST /api/matches/:id/votes` | Cast vote `{ judge, pick }` (max 3) |
| `POST /api/matches/:id/verdict` | Tally majority → persist journal → update Elo |
| `GET /api/arena-leaderboard` | Elo ranking, each row links `matchIds` |

Errors: non-2xx `{"error":"message"}` (same contract as `docs/API.md`).

## 4. Fairness notes

1. **Identical prompt** — both sides get the exact same `prompt` text.
2. **Temp 0** — deterministic decoding where the gateway supports it.
3. **One attempt** — one answer per side per match; no retries or hinted follow-ups.
4. **Alternate A/B order** — swap which model is A vs B across matches so neither
   side benefits from position bias.
5. **No secrets in logs** — keys and Authorization headers never printed/stored.

## 5. Data files

- `data/prompts.json`, `data/matches.json` (auto-created, crash-safe writes).
- Reset arena: stop server, delete `data/matches.json`, restart.
