-- ============================================================================
-- BDX Bench — Postgres / Supabase schema (demo dataset)
-- Owner: SUB-AGENT 8/10 BACKEND+DATA
--
-- DEMO DATA — every row seeded here is fictional and synthetic, for local
-- development and UI work only. Never present seeded values as live results.
--
-- Compatible with Postgres 14+ / Supabase. Local dev does NOT need a live
-- database: the Next.js app serves the checked-in JSON/TS seed
-- (`web/src/lib/demo-data.ts`, generated from the same source as
-- `web/supabase/seed.sql`) entirely in-memory.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Providers (demo grouping labels, NOT affiliations or endorsements)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS providers (
  slug        TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  note        TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- Models
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS models (
  slug            TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  family          TEXT NOT NULL,
  provider_slug   TEXT NOT NULL REFERENCES providers (slug) ON UPDATE CASCADE,
  context_tokens  INTEGER NOT NULL CHECK (context_tokens > 0),
  released_date   DATE NOT NULL,
  open_weights    BOOLEAN NOT NULL DEFAULT false,
  vision          BOOLEAN NOT NULL DEFAULT false,
  tools           BOOLEAN NOT NULL DEFAULT false,
  audio           BOOLEAN NOT NULL DEFAULT false,
  multimodal      BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_models_provider ON models (provider_slug);
CREATE INDEX IF NOT EXISTS idx_models_family ON models (family);
CREATE INDEX IF NOT EXISTS idx_models_released ON models (released_date DESC);

-- ----------------------------------------------------------------------------
-- Benchmarks (concrete suites; `dimension` maps each suite onto one of the
-- eight BDX Bench Score dimensions defined in web/src/lib/scores.ts)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS benchmarks (
  slug              TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  category          TEXT NOT NULL,
  dimension         TEXT NOT NULL,
  version           TEXT NOT NULL,
  scale_max         NUMERIC NOT NULL DEFAULT 100,
  higher_is_better  BOOLEAN NOT NULL DEFAULT true,
  unit              TEXT NOT NULL DEFAULT 'score 0-100',
  task_count        INTEGER NOT NULL DEFAULT 0 CHECK (task_count >= 0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_benchmarks_dimension ON benchmarks (dimension);
CREATE INDEX IF NOT EXISTS idx_benchmarks_category ON benchmarks (category);

-- ----------------------------------------------------------------------------
-- Sources (provenance for evaluations / prices / speed runs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sources (
  id            TEXT PRIMARY KEY,
  label         TEXT NOT NULL,
  kind          TEXT NOT NULL CHECK (kind IN ('vendor', 'benchmark', 'harness', 'manual')),
  url           TEXT,
  retrieved_at  TIMESTAMPTZ NOT NULL,
  notes         TEXT NOT NULL DEFAULT ''
);

-- ----------------------------------------------------------------------------
-- Evaluations (one row per model x benchmark x benchmark_version x
-- methodology_version; duplicates are an ingestion error — see ingest.ts)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS evaluations (
  id                    SERIAL PRIMARY KEY,
  model_slug            TEXT NOT NULL REFERENCES models (slug) ON UPDATE CASCADE ON DELETE CASCADE,
  benchmark_slug        TEXT NOT NULL REFERENCES benchmarks (slug) ON UPDATE CASCADE ON DELETE CASCADE,
  source_id             TEXT REFERENCES sources (id) ON UPDATE CASCADE,
  score_raw             NUMERIC NOT NULL CHECK (score_raw >= 0 AND score_raw <= 100),
  score_norm            NUMERIC NOT NULL CHECK (score_norm >= 0 AND score_norm <= 100),
  ci_low                NUMERIC NOT NULL,
  ci_high               NUMERIC NOT NULL,
  runs                  INTEGER NOT NULL CHECK (runs > 0),
  variance              NUMERIC NOT NULL DEFAULT 0,
  eval_date             DATE NOT NULL,
  benchmark_version     TEXT NOT NULL,
  methodology_version   TEXT NOT NULL,
  notes                 TEXT NOT NULL DEFAULT '',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_evaluation UNIQUE (model_slug, benchmark_slug, benchmark_version, methodology_version),
  CONSTRAINT ck_evaluation_ci CHECK (ci_low <= score_norm AND score_norm <= ci_high)
);
CREATE INDEX IF NOT EXISTS idx_evaluations_model ON evaluations (model_slug);
CREATE INDEX IF NOT EXISTS idx_evaluations_benchmark ON evaluations (benchmark_slug);
CREATE INDEX IF NOT EXISTS idx_evaluations_date ON evaluations (eval_date DESC);
CREATE INDEX IF NOT EXISTS idx_evaluations_methodology ON evaluations (methodology_version);

-- ----------------------------------------------------------------------------
-- Speed tests (throughput / latency harness runs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS speed_tests (
  id            SERIAL PRIMARY KEY,
  model_slug    TEXT NOT NULL REFERENCES models (slug) ON UPDATE CASCADE ON DELETE CASCADE,
  source_id     TEXT REFERENCES sources (id) ON UPDATE CASCADE,
  tps           NUMERIC NOT NULL CHECK (tps >= 0),
  ttft_ms       NUMERIC NOT NULL CHECK (ttft_ms >= 0),
  runs          INTEGER NOT NULL DEFAULT 1 CHECK (runs > 0),
  measured_at   TIMESTAMPTZ NOT NULL,
  harness       TEXT NOT NULL DEFAULT '',
  CONSTRAINT uq_speed_test UNIQUE (model_slug, measured_at, harness)
);
CREATE INDEX IF NOT EXISTS idx_speed_tests_model ON speed_tests (model_slug);

-- ----------------------------------------------------------------------------
-- Price snapshots (USD per 1M tokens; append-only history)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS price_snapshots (
  id                  SERIAL PRIMARY KEY,
  model_slug          TEXT NOT NULL REFERENCES models (slug) ON UPDATE CASCADE ON DELETE CASCADE,
  source_id           TEXT REFERENCES sources (id) ON UPDATE CASCADE,
  input_per_1m        NUMERIC NOT NULL CHECK (input_per_1m >= 0),
  output_per_1m       NUMERIC NOT NULL CHECK (output_per_1m >= 0),
  cached_input_per_1m NUMERIC,
  currency            TEXT NOT NULL DEFAULT 'USD',
  effective_date      DATE NOT NULL,
  notes               TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_price_snapshots_model_date
  ON price_snapshots (model_slug, effective_date DESC);

-- ----------------------------------------------------------------------------
-- Score snapshots (materialized composite per model + methodology version;
-- rebuilt by the ingest pipeline — see web/src/lib/ingest.ts)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS score_snapshots (
  model_slug          TEXT PRIMARY KEY REFERENCES models (slug) ON UPDATE CASCADE ON DELETE CASCADE,
  evaluated_at        TIMESTAMPTZ NOT NULL,
  benchmark_ref       TEXT NOT NULL DEFAULT '',
  methodology_version TEXT NOT NULL,
  overall             NUMERIC NOT NULL,
  reasoning           NUMERIC NOT NULL,
  coding              NUMERIC NOT NULL,
  knowledge           NUMERIC NOT NULL,
  math                NUMERIC NOT NULL,
  vision              NUMERIC NOT NULL,
  agentic             NUMERIC NOT NULL,
  long_context        NUMERIC NOT NULL,
  efficiency          NUMERIC NOT NULL,
  bdx_score           NUMERIC NOT NULL,
  speed_tps           NUMERIC,
  eval_count          INTEGER NOT NULL DEFAULT 0,
  imputed_dims        TEXT[] NOT NULL DEFAULT '{}',
  computed_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_score_snapshots_bdx_score ON score_snapshots (bdx_score DESC);
