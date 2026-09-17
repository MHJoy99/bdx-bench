-- ============================================================================
-- BDX Bench seed — hand-maintained local evaluation data.
--
-- Real values from the Zombie Flamethrower Showdown (manual game-build
-- evaluation, 2026-09-17): Muse Spark 1.3 -> Showdown Score 92,
-- Gemini 3.8 Flash -> Showdown Score 88. NULL = Not evaluated / Not measured.
-- Apply after web/supabase/schema.sql: psql "$DATABASE_URL" -f schema.sql -f seed.sql
-- The Next.js app does NOT need this database; it serves the equivalent
-- dataset from web/src/lib/demo-data.ts (same values, parity by design).
-- Methodology v1 | evaluated 2026-09-17
--
-- Runtime community state (match m-001 votes) lives in the interactive JSON
-- store (web/data/interactive/), not here. Static showdown record (prompt,
-- answers, seeded tally) lives in web/supabase/seed-data.json.
-- ============================================================================
BEGIN;

-- Providers (gateway grouping labels, not affiliations) -----------------------
INSERT INTO providers (slug, label, note) VALUES
  ('bdx-ai', 'BDX AI', 'Gateway serving both showdown builds.')
ON CONFLICT (slug) DO UPDATE SET label = EXCLUDED.label, note = EXCLUDED.note;

-- Models ---------------------------------------------------------------------
INSERT INTO models (slug, name, family, provider_slug, context_tokens, released_date, open_weights, vision, tools, audio, multimodal) VALUES
  ('muse-spark-1-3', 'Muse Spark 1.3', 'Spark', 'bdx-ai', NULL, NULL, false, false, false, false, false),
  ('gemini-3-8-flash', 'Gemini 3.8 Flash', 'Gemini', 'bdx-ai', NULL, NULL, false, false, false, false, false)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, family = EXCLUDED.family, provider_slug = EXCLUDED.provider_slug, context_tokens = EXCLUDED.context_tokens, released_date = EXCLUDED.released_date, open_weights = EXCLUDED.open_weights, vision = EXCLUDED.vision, tools = EXCLUDED.tools, audio = EXCLUDED.audio, multimodal = EXCLUDED.multimodal;

-- Benchmarks -----------------------------------------------------------------
INSERT INTO benchmarks (slug, name, description, category, dimension, version, scale_max, higher_is_better, unit, task_count, prompt_title, prompt_body, methodology) VALUES
  ('zombie-flamethrower-showdown', 'Zombie Flamethrower Showdown', 'Manual game-build showdown: one shared prompt, binary playability check + feature checklist, community vote open. Scores are Showdown Score (manual game-build evaluation).', 'coding', 'coding', 'v1', 100, true, 'Showdown Score 0-100', 1, 'Zombie flamethrower survival game', 'make me a video game where i am killing zombies with fire and all please? a nice wonderfull game i can play for fun okay?', 'Manual game-build showdown: one shared prompt, binary playability check + feature checklist, community vote open')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, category = EXCLUDED.category, dimension = EXCLUDED.dimension, version = EXCLUDED.version, task_count = EXCLUDED.task_count, prompt_title = EXCLUDED.prompt_title, prompt_body = EXCLUDED.prompt_body, methodology = EXCLUDED.methodology;

-- Sources --------------------------------------------------------------------
INSERT INTO sources (id, label, kind, url, retrieved_at, notes) VALUES
  ('local-manual-eval', 'Local manual evaluation — Zombie Flamethrower Showdown', 'manual', NULL, '2026-09-17', 'Showdown Score (manual game-build evaluation). One shared prompt, binary playability check + feature checklist, community vote open (match m-001). Playable builds: /play/pyro-vs-zombies and /play/pyroclasm-inferno.')
ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, kind = EXCLUDED.kind, url = EXCLUDED.url, retrieved_at = EXCLUDED.retrieved_at, notes = EXCLUDED.notes;

-- Evaluations (2 rows: one manual run per model) ------------------------------
INSERT INTO evaluations (model_slug, benchmark_slug, source_id, score_raw, score_norm, ci_low, ci_high, runs, variance, eval_date, benchmark_version, methodology_version) VALUES
  ('muse-spark-1-3', 'zombie-flamethrower-showdown', 'local-manual-eval', 92, 92, 92, 92, 1, 0, '2026-09-17', 'v1', 'v1'),
  ('gemini-3-8-flash', 'zombie-flamethrower-showdown', 'local-manual-eval', 88, 88, 88, 88, 1, 0, '2026-09-17', 'v1', 'v1')
ON CONFLICT (model_slug, benchmark_slug, benchmark_version, methodology_version) DO UPDATE SET score_raw = EXCLUDED.score_raw, score_norm = EXCLUDED.score_norm, ci_low = EXCLUDED.ci_low, ci_high = EXCLUDED.ci_high, runs = EXCLUDED.runs, variance = EXCLUDED.variance, eval_date = EXCLUDED.eval_date;

-- Speed tests: none measured (no rows) ----------------------------------------

-- Price snapshots (NULL = Not measured) ---------------------------------------
INSERT INTO price_snapshots (model_slug, source_id, input_per_1m, output_per_1m, cached_input_per_1m, currency, effective_date, notes) VALUES
  ('muse-spark-1-3', 'local-manual-eval', NULL, NULL, NULL, 'USD', '2026-09-17', 'Not measured.'),
  ('gemini-3-8-flash', 'local-manual-eval', NULL, NULL, NULL, 'USD', '2026-09-17', 'Not measured.');

-- Score snapshots ------------------------------------------------------------
INSERT INTO score_snapshots (model_slug, evaluated_at, benchmark_ref, methodology_version, overall, reasoning, coding, knowledge, math, vision, agentic, long_context, efficiency, bdx_score, speed_tps, eval_count, imputed_dims) VALUES
  ('muse-spark-1-3', '2026-09-17', 'zombie-flamethrower-showdown', 'v1', 92, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 92, NULL, 1, '{}'),
  ('gemini-3-8-flash', '2026-09-17', 'zombie-flamethrower-showdown', 'v1', 88, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 88, NULL, 1, '{}')
ON CONFLICT (model_slug) DO UPDATE SET evaluated_at = EXCLUDED.evaluated_at, benchmark_ref = EXCLUDED.benchmark_ref, methodology_version = EXCLUDED.methodology_version, overall = EXCLUDED.overall, reasoning = EXCLUDED.reasoning, coding = EXCLUDED.coding, knowledge = EXCLUDED.knowledge, math = EXCLUDED.math, vision = EXCLUDED.vision, agentic = EXCLUDED.agentic, long_context = EXCLUDED.long_context, efficiency = EXCLUDED.efficiency, bdx_score = EXCLUDED.bdx_score, speed_tps = EXCLUDED.speed_tps, eval_count = EXCLUDED.eval_count, imputed_dims = EXCLUDED.imputed_dims, computed_at = now();
COMMIT;
