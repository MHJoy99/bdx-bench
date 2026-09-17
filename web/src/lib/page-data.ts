import { z } from "zod";
import {
  BENCHMARK_CATALOGUE,
  DATASET_META,
  FRESHNESS,
  MODELS,
  PROVENANCE,
  SCORE_SNAPSHOTS,
  SOURCES,
  TRENDS,
  UNCERTAINTY,
} from "@/lib/demo-data";
import {
  getBenchmarkDetail,
  getBenchmarkEvaluations,
  getDatasetMeta,
  getLeaderboard,
  getModel,
  getModelEvaluations,
  getTrends,
  type TrendRange,
} from "@/lib/data";
import { BDX_WEIGHTS, blendedPricePer1M, scoreLabel } from "@/lib/scores";

/**
 * Page view-models — Owner: SUB-AGENT 8/10 BACKEND+DATA.
 *
 * DATA NEEDS ONLY for Agents 3/7 UI routes:
 *   /benchmarks, /benchmarks/[slug], /price-performance, /trends, /methodology
 * Pure data builders + Zod schemas. No JSX, no styling — UI agents own that.
 * Every payload is DEMO DATA (see `@/lib/demo-data`).
 */

// ---------------------------------------------------------------------------
// /benchmarks
// ---------------------------------------------------------------------------

export const BenchmarkCardSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  dimension: z.string(),
  version: z.string(),
  taskCount: z.number(),
  modelCount: z.number(),
  fleetAvg: z.number(),
  topScore: z.number(),
  topModelSlug: z.string(),
  evalDate: z.string(),
});
export type BenchmarkCardData = z.infer<typeof BenchmarkCardSchema>;

export function getBenchmarksPageData(): {
  benchmarks: BenchmarkCardData[];
  meta: typeof DATASET_META;
} {
  const benchmarks = BENCHMARK_CATALOGUE.map((b) => {
    const evals = getBenchmarkEvaluations(b.slug);
    const scores = evals.map((e) => e.raw);
    const mean = scores.reduce((a, x) => a + x, 0) / Math.max(1, scores.length);
    const top = evals[0];
    return {
      slug: b.slug,
      name: b.name,
      description: b.description,
      category: b.category,
      dimension: b.dimension,
      version: b.version,
      taskCount: b.taskCount,
      modelCount: evals.length,
      fleetAvg: Math.round(mean * 10) / 10,
      topScore: top?.raw ?? 0,
      topModelSlug: top?.modelSlug ?? "",
      evalDate: FRESHNESS.evalDate,
    };
  });
  return { benchmarks, meta: getDatasetMeta() };
}

// ---------------------------------------------------------------------------
// /benchmarks/[slug]
// ---------------------------------------------------------------------------

export const BenchmarkDetailRowSchema = z.object({
  modelSlug: z.string(),
  modelName: z.string(),
  provider: z.string(),
  raw: z.number(),
  normalized: z.number(),
  ciLow: z.number(),
  ciHigh: z.number(),
  runs: z.number(),
  variance: z.number(),
  evaluatedAt: z.string(),
  sourceId: z.string(),
});
export type BenchmarkDetailRow = z.infer<typeof BenchmarkDetailRowSchema>;

export interface BenchmarkDetailData {
  slug: string;
  name: string;
  description: string;
  category: string;
  dimension: string;
  version: string;
  taskCount: number;
  unit: string;
  rows: BenchmarkDetailRow[];
  fleet: { mean: number; stddev: number; min: number; max: number; n: number };
  meta: typeof DATASET_META;
}

export function getBenchmarkDetailData(slug: string): BenchmarkDetailData | null {
  const bench = getBenchmarkDetail(slug);
  if (!bench) return null;
  const evals = getBenchmarkEvaluations(slug);
  const rows: BenchmarkDetailRow[] = evals.map((e) => {
    const m = getModel(e.modelSlug);
    return {
      modelSlug: e.modelSlug,
      modelName: m?.name ?? e.modelSlug,
      provider: m?.provider ?? "other",
      raw: e.raw,
      normalized: e.normalized ?? e.raw,
      ciLow: e.ciLow,
      ciHigh: e.ciHigh,
      runs: e.runs,
      variance: e.variance,
      evaluatedAt: e.evaluatedAt,
      sourceId: e.sourceId,
    };
  });
  const vals = rows.map((r) => r.raw);
  const mean = vals.reduce((a, x) => a + x, 0) / Math.max(1, vals.length);
  const variance = vals.reduce((a, x) => a + (x - mean) * (x - mean), 0) / Math.max(1, vals.length);
  return {
    slug: bench.slug,
    name: bench.name,
    description: bench.description,
    category: bench.category,
    dimension: bench.dimension,
    version: bench.version,
    taskCount: bench.taskCount,
    unit: bench.unit,
    rows,
    fleet: {
      mean: Math.round(mean * 10) / 10,
      stddev: Math.round(Math.sqrt(variance) * 10) / 10,
      min: vals.length > 0 ? Math.min(...vals) : 0,
      max: vals.length > 0 ? Math.max(...vals) : 0,
      n: vals.length,
    },
    meta: getDatasetMeta(),
  };
}

// ---------------------------------------------------------------------------
// /price-performance
// ---------------------------------------------------------------------------

export const PricePerformancePointSchema = z.object({
  modelSlug: z.string(),
  modelName: z.string(),
  provider: z.string(),
  bdxScore: z.number(),
  label: z.string(),
  blendedPricePer1M: z.number(),
  inputPer1M: z.number(),
  outputPer1M: z.number(),
  tps: z.number().optional(),
  efficiency: z.number(),
  onFrontier: z.boolean(),
});
export type PricePerformancePoint = z.infer<typeof PricePerformancePointSchema>;

export function getPricePerformanceData(): {
  points: PricePerformancePoint[];
  frontier: string[];
  meta: typeof DATASET_META;
} {
  const base = SCORE_SNAPSHOTS.map((s) => {
    const m = getModel(s.modelSlug);
    if (!m) return null;
    return {
      modelSlug: s.modelSlug,
      modelName: m.name,
      provider: m.provider,
      bdxScore: s.snapshot.bdxScore ?? s.snapshot.overall,
      label: m.scores.bdxScore != null ? scoreLabel(m.scores.bdxScore) : scoreLabel(s.snapshot.overall),
      blendedPricePer1M: blendedPricePer1M(m.prices.inputPer1M, m.prices.outputPer1M),
      inputPer1M: m.prices.inputPer1M,
      outputPer1M: m.prices.outputPer1M,
      tps: m.speed?.tps,
      efficiency: s.snapshot.efficiency ?? 50,
    };
  }).filter((p): p is NonNullable<typeof p> => p != null);

  // Pareto frontier: a model is on it when no other model is both cheaper
  // (or equal) AND higher-scoring (or equal) with at least one strict edge.
  const frontier = base
    .filter((p) =>
      !base.some(
        (q) =>
          q.modelSlug !== p.modelSlug &&
          q.blendedPricePer1M <= p.blendedPricePer1M &&
          q.bdxScore >= p.bdxScore &&
          (q.blendedPricePer1M < p.blendedPricePer1M || q.bdxScore > p.bdxScore),
      ),
    )
    .map((p) => p.modelSlug);
  const onFrontier = new Set(frontier);
  return {
    points: base.map((p) => ({ ...p, onFrontier: onFrontier.has(p.modelSlug) })),
    frontier,
    meta: getDatasetMeta(),
  };
}

// ---------------------------------------------------------------------------
// /trends
// ---------------------------------------------------------------------------

export const TrendsPagePointSchema = z.object({
  date: z.string(),
  avgBdxScore: z.number(),
  modelCount: z.number(),
});
export type TrendsPagePoint = z.infer<typeof TrendsPagePointSchema>;

export interface TrendsPageData {
  range: TrendRange;
  points: TrendsPagePoint[];
  delta: number;
  meta: typeof DATASET_META;
}

export function getTrendsPageData(range: TrendRange = "all"): TrendsPageData {
  const points = getTrends(range);
  const first = points[0]?.avgBdxScore ?? 0;
  const last = points.length > 0 ? (points[points.length - 1]?.avgBdxScore ?? 0) : 0;
  return {
    range,
    points,
    delta: Math.round((last - first) * 10) / 10,
    meta: getDatasetMeta(),
  };
}

// ---------------------------------------------------------------------------
// /methodology
// ---------------------------------------------------------------------------

export interface MethodologyPageData {
  version: string;
  frozenAt: string;
  weights: { dimension: string; weight: number; label: string }[];
  formulas: { normalizedScore: string; bdxBenchScore: string; blendedPrice: string };
  duplicatePolicy: { key: string[]; resolution: string[] };
  sourceKinds: string[];
  freshness: typeof FRESHNESS;
  provenance: typeof PROVENANCE;
  uncertainty: typeof UNCERTAINTY;
  sources: typeof SOURCES;
}

const WEIGHT_LABELS: Record<string, string> = {
  reasoning: "Reasoning",
  coding: "Coding",
  knowledge: "Knowledge",
  math: "Math",
  vision: "Vision",
  agentic: "Agentic",
  longContext: "Long context",
  efficiency: "Efficiency",
};

export function getMethodologyData(): MethodologyPageData {
  return {
    version: "v1",
    frozenAt: "2026-09-01",
    weights: (Object.entries(BDX_WEIGHTS) as [string, number][]).map(([dimension, weight]) => ({
      dimension,
      weight,
      label: WEIGHT_LABELS[dimension] ?? dimension,
    })),
    formulas: {
      normalizedScore: "clamp(round1(raw / scaleMax * 100), 0, 100) — all demo suites already report 0-100",
      bdxBenchScore:
        "round1(sum(dimension * weight)); missing longContext/efficiency fall back to the mean of the six core dims",
      blendedPrice: "round2(inputPer1M * 0.75 + outputPer1M * 0.25) — 3:1 input:output weighting",
    },
    duplicatePolicy: {
      key: ["modelSlug", "benchmarkSlug", "benchmarkVersion", "methodologyVersion"],
      resolution: [
        "Latest evaluatedAt wins.",
        "Tie on evaluatedAt: higher runs wins.",
        "Remaining ties: first-seen wins; dropped rows are reported as conflicts, never silently merged.",
      ],
    },
    sourceKinds: ["vendor", "benchmark", "harness", "manual"],
    freshness: FRESHNESS,
    provenance: PROVENANCE,
    uncertainty: UNCERTAINTY,
    sources: SOURCES,
  };
}

// ---------------------------------------------------------------------------
// /models/[slug] detail helper (complements Agent5's model-pages-demo)
// ---------------------------------------------------------------------------

export interface ModelDetailData {
  slug: string;
  evaluations: ReturnType<typeof getModelEvaluations>;
  evalCount: number;
  avgCiHalfWidth: number;
}

export function getModelDetailData(slug: string): ModelDetailData | null {
  const m = getModel(slug);
  if (!m) return null;
  const evaluations = getModelEvaluations(slug);
  const halves = evaluations.map((e) => (e.ciHigh - e.ciLow) / 2);
  return {
    slug,
    evaluations,
    evalCount: evaluations.length,
    avgCiHalfWidth:
      halves.length > 0
        ? Math.round((halves.reduce((a, b) => a + b, 0) / halves.length) * 100) / 100
        : 0,
  };
}

export { MODELS, TRENDS, getLeaderboard };
