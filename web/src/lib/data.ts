import { blendedPricePer1M } from "@/lib/scores";
import {
  BENCHMARK_CATALOGUE,
  DATASET_META,
  EVALUATIONS,
  FRESHNESS,
  MODELS as SHOWDOWN_MODELS,
  PRICE_SNAPSHOTS,
  PROVENANCE,
  SCORE_SNAPSHOTS,
  SOURCES,
  SPEED_TESTS,
  TRENDS,
  UNCERTAINTY,
  PROVIDERS,
  demoLeaderboard,
  type BenchmarkMeta,
  type DatasetMeta,
  type DemoEvaluation,
  type Freshness,
  type PriceEntry,
  type ProvenanceItem,
  type ProviderInfo,
  type SnapshotEntry,
  type SpeedEntry,
  type UncertaintySummary,
} from "@/lib/demo-data";
import type {
  Benchmark,
  LeaderboardRow,
  Model,
  Source,
  TrendPoint,
} from "@/lib/types";

/**
 * Canonical server-side dataset accessors.
 *
 * Backs all `/api/*` routes and RSC pages. Values come from
 * `@/lib/demo-data` (hand-maintained local evaluation data: the Zombie
 * Flamethrower Showdown, 2026-09-17). Shape of the original exports (MODELS /
 * BENCHMARKS / getModel / toLeaderboardRow / getLeaderboard / getTrends) is
 * FINAL — API response envelopes must not change without arch approval.
 */

// ---------------------------------------------------------------------------
// Core tables (re-exported from the local seed)
// ---------------------------------------------------------------------------

/** All evaluated models (canonical `Model[]`). */
export const MODELS: Model[] = SHOWDOWN_MODELS;

/** Benchmark catalogue as base `Benchmark[]` (dimension mapping stripped). */
export const BENCHMARKS: Benchmark[] = BENCHMARK_CATALOGUE.map(
  ({ dimension: _dimension, version: _version, taskCount: _taskCount, sourceId: _sourceId, ...base }) => base,
);

/** Full benchmark catalogue with dimension/version/task metadata. */
export const BENCHMARK_DETAILS: BenchmarkMeta[] = BENCHMARK_CATALOGUE;

/** Provider groupings (labels, not affiliations). */
export const PROVIDER_LIST: ProviderInfo[] = PROVIDERS;

/** All evaluations (model x benchmark, with CI + provenance). */
export const ALL_EVALUATIONS: DemoEvaluation[] = EVALUATIONS;

/** Score snapshots keyed by model. */
export const ALL_SNAPSHOTS: SnapshotEntry[] = SCORE_SNAPSHOTS;

/** Speed tests keyed by model (empty until a harness reports). */
export const ALL_SPEED_TESTS: SpeedEntry[] = SPEED_TESTS;

/** Price snapshots keyed by model (nulls = Not measured). */
export const ALL_PRICE_SNAPSHOTS: PriceEntry[] = PRICE_SNAPSHOTS;

/** Provenance sources. */
export const ALL_SOURCES: Source[] = SOURCES;

/** Dataset meta envelope (freshness + provenance + uncertainty). */
export const DATASET: DatasetMeta = DATASET_META;
export const DATASET_FRESHNESS: Freshness = FRESHNESS;
export const DATASET_PROVENANCE: ProvenanceItem[] = PROVENANCE;
export const DATASET_UNCERTAINTY: UncertaintySummary = UNCERTAINTY;

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

export function getModel(slug: string): Model | undefined {
  return MODELS.find((m) => m.slug === slug);
}

export function getBenchmark(slug: string): Benchmark | undefined {
  return BENCHMARKS.find((b) => b.slug === slug);
}

export function getBenchmarkDetail(slug: string): BenchmarkMeta | undefined {
  return BENCHMARK_CATALOGUE.find((b) => b.slug === slug);
}

export function getModelSnapshot(slug: string): SnapshotEntry | undefined {
  return SCORE_SNAPSHOTS.find((s) => s.modelSlug === slug);
}

/** Evaluations for one model (newest eval date first). */
export function getModelEvaluations(slug: string): DemoEvaluation[] {
  return EVALUATIONS.filter((e) => e.modelSlug === slug).sort((a, b) =>
    a.evaluatedAt < b.evaluatedAt ? 1 : -1,
  );
}

/** Evaluations for one benchmark (score desc). */
export function getBenchmarkEvaluations(slug: string): DemoEvaluation[] {
  return EVALUATIONS.filter((e) => e.benchmarkSlug === slug).sort(
    (a, b) => b.raw - a.raw,
  );
}

export function getSource(id: string): Source | undefined {
  return SOURCES.find((s) => s.id === id);
}

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

export function toLeaderboardRow(m: Model, rank: number): LeaderboardRow {
  const input = m.prices.inputPer1M;
  const output = m.prices.outputPer1M;
  return {
    rank,
    modelSlug: m.slug,
    modelName: m.name,
    provider: m.provider,
    // Stored Showdown Score — never recomputed from null dimensions.
    bdxScore: m.scores.bdxScore ?? m.scores.overall,
    overall: m.scores.overall,
    // Null = Not measured (owners render "Not measured", never NaN).
    pricePer1MBlended:
      input != null && output != null
        ? blendedPricePer1M(input, output)
        : null,
    tps: m.speed?.tps,
  };
}

export interface LeaderboardOptions {
  provider?: string;
  openWeights?: boolean;
  limit?: number;
}

export function getLeaderboard(opts: LeaderboardOptions = {}): LeaderboardRow[] {
  const filtered = MODELS.filter(
    (m) =>
      (opts.provider == null || m.provider === opts.provider) &&
      (opts.openWeights == null || m.openWeights === opts.openWeights),
  );
  const rows = [...filtered]
    .sort(
      (a, b) =>
        (b.scores.bdxScore ?? 0) - (a.scores.bdxScore ?? 0) ||
        b.scores.overall - a.scores.overall,
    )
    .map((m, i) => toLeaderboardRow(m, i + 1));
  return opts.limit != null ? rows.slice(0, opts.limit) : rows;
}

/** Precomputed full leaderboard (same order as `getLeaderboard()`). */
export function getFullLeaderboard(): LeaderboardRow[] {
  return demoLeaderboard;
}

// ---------------------------------------------------------------------------
// Trends
// ---------------------------------------------------------------------------

export type TrendRange = "30d" | "90d" | "1y" | "all";

const TREND_RANGE_DAYS: Record<TrendRange, number> = {
  "30d": 30,
  "90d": 90,
  "1y": 365,
  all: Number.POSITIVE_INFINITY,
};

/** Showdown snapshot series (single point until more evals land). */
export function getTrends(range: TrendRange = "all"): TrendPoint[] {
  if (range === "all") return TRENDS;
  const max = TRENDS.reduce((a, b) => (a.date > b.date ? a : b)).date;
  const cutoff = new Date(max).getTime() - TREND_RANGE_DAYS[range] * 86400000;
  return TRENDS.filter((t) => new Date(t.date).getTime() >= cutoff);
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

/** Freshness + provenance + uncertainty envelope for API responses. */
export function getDatasetMeta(): DatasetMeta {
  return DATASET_META;
}
