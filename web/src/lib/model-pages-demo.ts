import { z } from "zod";
import {
  getBenchmark,
  getBenchmarkEvaluations,
  getModel,
  getModelEvaluations as getDataModelEvaluations,
} from "@/lib/data";
import { methodologyVersion } from "@/lib/tokens";
import type {
  Benchmark,
  Evaluation,
  Model,
  ScoreSnapshot,
  Source,
} from "@/lib/types";

/**
 * Scoped backing for the /models/[slug] route.
 *
 * Contract mapping:
 * - Types come from `@/lib/types` (canonical).
 * - Scoring uses `@/lib/scores` (bdxBenchScore) — never re-implemented here.
 * - Models/benchmarks/evaluations resolve from `@/lib/data` (single source
 *   of truth: the Zombie Flamethrower Showdown). The API agent should replace
 *   `getModelPageData()` internals with a fetch to `/api/models/[slug]`
 *   keeping the exported shapes stable.
 *
 * Values below are the local manual evaluation (2026-09-17). Unmeasured
 * dimensions are null ("Not evaluated"); prices/speed are unmeasured.
 */

export const METHODOLOGY_VERSION = methodologyVersion;

/** Zod slug param — mirrors the `/api/models/[slug]` route contract. */
export const ModelSlugSchema = z
  .string()
  .min(1, "Model slug required")
  .max(80, "Model slug too long")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must be lowercase alphanumeric with single hyphens",
  );
export type ModelSlug = z.infer<typeof ModelSlugSchema>;

/** History metric switcher (subset of ScoreSnapshot dimensions). */
export const HISTORY_METRICS = [
  "overall",
  "coding",
  "reasoning",
  "math",
  "vision",
  "agentic",
] as const;
export type HistoryMetric = (typeof HISTORY_METRICS)[number];

/** History range switcher. */
export const HISTORY_RANGES = ["1M", "3M", "6M", "1Y", "ALL"] as const;
export type HistoryRange = (typeof HISTORY_RANGES)[number];

/** One point of a history series. */
export interface HistoryPoint {
  date: string; // ISO date
  value: number; // 0-100 showdown score
}

/** Per-benchmark row for the MODEL PERFORMANCE table. */
export interface BenchmarkRow {
  benchmark: Benchmark;
  /** This model's showdown score on the benchmark (0-100). */
  score: number;
  /** Fleet average on the benchmark (0-100). */
  fleetAvg: number;
  /** Share of the fleet this model outscored, exclusive (0-100). */
  percentile: number;
  /** ISO date of the evaluation. */
  updatedAt: string;
}

/**
 * Full view-model for one model page.
 * `model` is the canonical `@/lib/types` Model; the remaining fields are
 * page-level extensions until the API contract grows them.
 */
export interface ModelPageData {
  model: Model;
  /** Drives the "Reasoning" capability badge. */
  reasoningModel: boolean;
  /** Max output tokens (0 = unmeasured). */
  maxOutput: number;
  /** Median end-to-end latency, ms (0 = unmeasured). */
  latencyP50Ms: number;
  /** Number of local runs backing this page. */
  demoRuns: number;
  /** Provenance of the snapshot. */
  source: Source;
  /** Retrieval timestamp. */
  retrievedAt: string;
  /** Per-benchmark evaluations backing the performance table. */
  benchmarkRows: BenchmarkRow[];
}

const RETRIEVED_AT = "2026-09-17";
const SOURCE_ID = "local-manual-eval";

function source(): Source {
  return {
    id: SOURCE_ID,
    label: "Local manual evaluation — Zombie Flamethrower Showdown",
    kind: "manual",
    retrievedAt: RETRIEVED_AT,
  };
}

/** Performance rows for one model, derived from the shared dataset. */
function rowsFor(modelSlug: string): BenchmarkRow[] {
  return getDataModelEvaluations(modelSlug).flatMap((e) => {
    const benchmark = getBenchmark(e.benchmarkSlug);
    if (!benchmark) return [];
    const fleet = getBenchmarkEvaluations(e.benchmarkSlug).map((x) => x.raw);
    const mean =
      fleet.reduce((a, x) => a + x, 0) / Math.max(1, fleet.length);
    const below = fleet.filter((x) => x < e.raw).length;
    const percentile =
      fleet.length > 1
        ? Math.round((below / (fleet.length - 1)) * 100)
        : 100;
    return [
      {
        benchmark,
        score: e.raw,
        fleetAvg: Math.round(mean * 10) / 10,
        percentile,
        updatedAt: e.evaluatedAt,
      },
    ];
  });
}

function page(model: Model): ModelPageData {
  return {
    model,
    reasoningModel: false,
    maxOutput: 0,
    latencyP50Ms: 0,
    demoRuns: 1,
    source: source(),
    retrievedAt: RETRIEVED_AT,
    benchmarkRows: rowsFor(model.slug),
  };
}

function loadPages(): ModelPageData[] {
  const slugs = ["muse-spark-1-3", "deepseek-v4-1-flash", "space-bunny-free", "gpt-6-sol", "gpt-5-6-luna", "gpt-6-luna", "gemini-3-8-flash"];
  const out: ModelPageData[] = [];
  for (const slug of slugs) {
    const model = getModel(slug);
    if (model) out.push(page(model));
  }
  return out;
}

const MODEL_PAGES: ModelPageData[] = loadPages();

/** All model slugs (for generateStaticParams). */
export function getAllModelSlugs(): string[] {
  return MODEL_PAGES.map((p) => p.model.slug);
}

/**
 * Look up one model page by raw slug.
 * Returns `{ ok: false }` for malformed slugs (caller should 404).
 * NOTE: API agent — keep this signature when swapping to the live fetch.
 */
export function getModelPageData(
  rawSlug: string,
): { ok: true; data: ModelPageData } | { ok: false; reason: string } {
  const parsed = ModelSlugSchema.safeParse(rawSlug);
  if (!parsed.success) return { ok: false, reason: "malformed slug" };
  const found = MODEL_PAGES.find((p) => p.model.slug === parsed.data);
  if (!found) return { ok: false, reason: "unknown model" };
  return { ok: true, data: found };
}

export interface RelatedModel {
  slug: string;
  name: string;
  family: string;
  provider: Model["provider"];
  bdxScore: number;
}
/** Related models: same family first, then nearest showdown score. */
export function getRelatedModels(slug: string, limit = 3): RelatedModel[] {
  const current = MODEL_PAGES.find((p) => p.model.slug === slug);
  if (!current) return [];
  const currentScore =
    current.model.scores.bdxScore ?? current.model.scores.overall;
  return MODEL_PAGES.filter((p) => p.model.slug !== slug)
    .map((p) => {
      const bdxScore = p.model.scores.bdxScore ?? p.model.scores.overall;
      const sameFamily = p.model.family === current.model.family ? 0 : 1;
      return {
        slug: p.model.slug,
        name: p.model.name,
        family: p.model.family,
        provider: p.model.provider,
        bdxScore,
        _rank: sameFamily * 1000 + Math.abs(bdxScore - currentScore),
      };
    })
    .sort((a, b) => a._rank - b._rank)
    .slice(0, limit)
    .map(({ _rank, ...rest }) => rest);
}

// ---------------------------------------------------------------------------
// History: single measured snapshot (no backfilled series)
// ---------------------------------------------------------------------------

function metricEndValue(
  model: Model,
  metric: HistoryMetric,
): number | null {
  const snap: ScoreSnapshot = model.scores;
  switch (metric) {
    case "overall":
      return snap.overall;
    case "coding":
      return snap.coding;
    case "reasoning":
      return snap.reasoning;
    case "math":
      return snap.math;
    case "vision":
      return snap.vision;
    case "agentic":
      return snap.agentic;
  }
}

/**
 * History series for one model x metric. Returns the single measured
 * snapshot point, or [] when the metric is Not evaluated (no backfill).
 */
export function getModelHistory(
  slug: string,
  metric: HistoryMetric,
  _range: HistoryRange,
): HistoryPoint[] {
  const entry = MODEL_PAGES.find((p) => p.model.slug === slug);
  if (!entry) return [];
  const end = metricEndValue(entry.model, metric);
  if (end == null) return [];
  return [{ date: entry.model.scores.evaluatedAt, value: end }];
}

/** Narrow a Model's evaluations for provenance text (mirror of API). */
export function getModelEvaluations(slug: string): Evaluation[] {
  const entry = MODEL_PAGES.find((p) => p.model.slug === slug);
  if (!entry) return [];
  return entry.benchmarkRows.map((r) => ({
    modelSlug: slug,
    benchmarkSlug: r.benchmark.slug,
    raw: r.score,
    normalized: r.score,
    evaluatedAt: r.updatedAt,
  }));
}

export const DEMO_BENCHMARKS: Benchmark[] = (() => {
  const found = getBenchmark("zombie-flamethrower-showdown");
  return found ? [found] : [];
})();
export const DEMO_EVAL_AT = "2026-09-17" as const;
export const DEMO_RETRIEVED_AT = "2026-09-17" as const;
