import { z } from "zod";
import { bdxBenchScore } from "@/lib/scores";
import { methodologyVersion } from "@/lib/tokens";
import type {
  Benchmark,
  Evaluation,
  Model,
  ScoreSnapshot,
  Source,
} from "@/lib/types";

/**
 * Scoped demo backing for the /models/[slug] route.
 * Owner: SUB-AGENT 5/10 MODEL PAGES.
 *
 * Contract mapping:
 * - Types come from `@/lib/types` (canonical, owned by types agent).
 * - Scoring uses `@/lib/scores` (bdxBenchScore) — never re-implemented here.
 * - This file stands in for `@/lib/demo-data` / `src/lib/data.ts` and
 *   `GET /api/models/[slug]` until those land. The API agent should replace
 *   `getModelPageData()` internals with a fetch to `/api/models/[slug]`
 *   keeping the exported shapes stable.
 *
 * ALL values below are SYNTHETIC DEMO PLACEHOLDERS for UI development.
 * They are not real evaluations, prices, or vendor claims. Every consumer
 * must render them with a visible "Demo" label (see page banner).
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

/** One point of a synthetic history series. */
export interface HistoryPoint {
  date: string; // ISO date
  value: number; // 0-100 demo score
}

/** Per-benchmark row for the MODEL PERFORMANCE table. */
export interface BenchmarkRow {
  benchmark: Benchmark;
  /** This model's demo score on the benchmark (0-100). */
  score: number;
  /** Demo fleet average on the benchmark (0-100). */
  fleetAvg: number;
  /** Demo percentile rank of this model (0-100). */
  percentile: number;
  /** ISO date of the demo evaluation. */
  updatedAt: string;
}

/**
 * Full view-model for one model page.
 * `model` is the canonical `@/lib/types` Model; the remaining fields are
 * demo-only extensions (clearly marked) until the API contract grows them.
 */
export interface ModelPageData {
  model: Model;
  /** Demo-only: drives the "Reasoning" capability badge. */
  reasoningModel: boolean;
  /** Demo-only: max output tokens (placeholder). */
  maxOutput: number;
  /** Demo-only: median end-to-end latency, ms (placeholder). */
  latencyP50Ms: number;
  /** Demo-only: number of demo runs backing this page. */
  demoRuns: number;
  /** Provenance of the demo snapshot. */
  source: Source;
  /** Fixed demo retrieval timestamp (static to avoid hydration drift). */
  retrievedAt: string;
  /** Per-benchmark demo evaluations backing the performance table. */
  benchmarkRows: BenchmarkRow[];
}

const DEMO_RETRIEVED_AT = "2026-09-17T07:00:00.000Z";
const DEMO_EVAL_AT = "2026-09-10T12:00:00.000Z";

function scores(
  overall: number,
  reasoning: number,
  coding: number,
  math: number,
  knowledge: number,
  vision: number,
  agentic: number,
  longContext: number,
  efficiency: number,
  tps: number,
): ScoreSnapshot {
  const snap: ScoreSnapshot = {
    overall,
    reasoning,
    coding,
    math,
    knowledge,
    vision,
    agentic,
    longContext,
    efficiency,
    evaluatedAt: DEMO_EVAL_AT,
    benchmark: "bdx-bench-demo-v1",
  };
  return {
    ...snap,
    bdxScore: bdxBenchScore({
      reasoning,
      coding,
      knowledge,
      math,
      vision,
      agentic,
      longContext,
      efficiency,
    }),
    speed: tps,
  };
}

function benchmark(
  slug: string,
  name: string,
  description: string,
  category: Benchmark["category"],
  weight: number,
): Benchmark {
  return { slug, name, description, category, weight, unit: "score 0-100", higherIsBetter: true };
}

const DEMO_BENCHMARKS: Benchmark[] = [
  benchmark(
    "bdx-reasoning-mini",
    "BDX Reasoning Mini",
    "Multi-step reasoning puzzles (demo set).",
    "reasoning",
    0.2,
  ),
  benchmark(
    "bdx-coding-mini",
    "BDX Coding Mini",
    "Code-fix tasks in isolated workdirs (demo set).",
    "coding",
    0.2,
  ),
  benchmark(
    "bdx-math-mini",
    "BDX Math Mini",
    "Numeric and symbolic problem solving (demo set).",
    "math",
    0.15,
  ),
  benchmark(
    "bdx-knowledge-mini",
    "BDX Knowledge Mini",
    "Factual recall and reading comprehension (demo set).",
    "knowledge",
    0.15,
  ),
  benchmark(
    "bdx-vision-mini",
    "BDX Vision Mini",
    "Chart and screenshot understanding (demo set).",
    "vision",
    0.1,
  ),
  benchmark(
    "bdx-agentic-mini",
    "BDX Agentic Mini",
    "Tool-use shell tasks (demo set).",
    "agentic",
    0.1,
  ),
  benchmark(
    "bdx-swe-mini",
    "swe-mini",
    "Repository code-fix suite from the local harness (demo results).",
    "coding",
    0.05,
  ),
  benchmark(
    "bdx-terminal-mini",
    "terminal-mini",
    "Shell-task suite from the local harness (demo results).",
    "agentic",
    0.05,
  ),
];

function rows(
  values: Array<{
    slug: string;
    score: number;
    fleetAvg: number;
    percentile: number;
    daysAgo?: number;
  }>,
): BenchmarkRow[] {
  return values.map((v) => {
    const b = DEMO_BENCHMARKS.find((d) => d.slug === v.slug);
    if (!b) throw new Error(`Unknown demo benchmark: ${v.slug}`);
    const updatedAt = new Date(
      new Date(DEMO_EVAL_AT).getTime() -
        (v.daysAgo ?? 0) * 24 * 60 * 60 * 1000,
    ).toISOString();
    return {
      benchmark: b,
      score: v.score,
      fleetAvg: v.fleetAvg,
      percentile: v.percentile,
      updatedAt,
    };
  });
}

function source(id: string): Source {
  return {
    id,
    label: "BDX Bench demo harness (synthetic)",
    kind: "manual",
    retrievedAt: DEMO_RETRIEVED_AT,
  };
}

function page(
  model: Model,
  extra: Pick<
    ModelPageData,
    | "reasoningModel"
    | "maxOutput"
    | "latencyP50Ms"
    | "demoRuns"
    | "benchmarkRows"
  > & { sourceId: string },
): ModelPageData {
  return {
    model,
    reasoningModel: extra.reasoningModel,
    maxOutput: extra.maxOutput,
    latencyP50Ms: extra.latencyP50Ms,
    demoRuns: extra.demoRuns,
    source: source(extra.sourceId),
    retrievedAt: DEMO_RETRIEVED_AT,
    benchmarkRows: extra.benchmarkRows,
  };
}

const MODEL_PAGES: ModelPageData[] = [
  page(
    {
      id: "bdx-ai/gpt-5.6-luna",
      slug: "gpt-5-6-luna",
      name: "GPT Luna 5.6",
      family: "Luna",
      provider: "other",
      context: 200000,
      released: "2026-06-01",
      openWeights: false,
      capabilities: { vision: true, tools: true, audio: false, multimodal: true },
      prices: {
        inputPer1M: 3.0,
        outputPer1M: 12.0,
        cachedInputPer1M: 1.5,
        currency: "USD",
        effectiveDate: "2026-09-01",
        source: "demo-vendor-sheet",
      },
      scores: scores(88.4, 92.0, 87.5, 85.0, 89.0, 78.0, 86.5, 84.0, 62.0, 48.5),
      speed: {
        tps: 48.5,
        ttftMs: 620,
        measuredAt: DEMO_EVAL_AT,
        harness: "bdx-bench-demo",
      },
    },
    {
      reasoningModel: true,
      maxOutput: 32000,
      latencyP50Ms: 2400,
      demoRuns: 14,
      sourceId: "demo-luna-5-6",
      benchmarkRows: rows([
        { slug: "bdx-reasoning-mini", score: 92.0, fleetAvg: 74.2, percentile: 96 },
        { slug: "bdx-coding-mini", score: 87.5, fleetAvg: 71.8, percentile: 90, daysAgo: 2 },
        { slug: "bdx-math-mini", score: 85.0, fleetAvg: 68.4, percentile: 88 },
        { slug: "bdx-knowledge-mini", score: 89.0, fleetAvg: 75.1, percentile: 91, daysAgo: 5 },
        { slug: "bdx-vision-mini", score: 78.0, fleetAvg: 66.9, percentile: 79 },
        { slug: "bdx-agentic-mini", score: 86.5, fleetAvg: 69.3, percentile: 89, daysAgo: 1 },
        { slug: "bdx-swe-mini", score: 84.0, fleetAvg: 62.5, percentile: 87 },
        { slug: "bdx-terminal-mini", score: 81.0, fleetAvg: 60.2, percentile: 85, daysAgo: 3 },
      ]),
    },
  ),
  page(
    {
      id: "bdx-ai/go-muse-spark-1.3-contributor",
      slug: "go-muse-spark-1-3-contributor",
      name: "Muse Spark 1.3",
      family: "Muse Spark",
      provider: "other",
      context: 200000,
      released: "2026-05-12",
      openWeights: false,
      capabilities: { vision: true, tools: true, audio: false, multimodal: true },
      prices: {
        inputPer1M: 2.0,
        outputPer1M: 8.0,
        cachedInputPer1M: 1.0,
        currency: "USD",
        effectiveDate: "2026-09-01",
        source: "demo-vendor-sheet",
      },
      scores: scores(86.1, 88.5, 90.0, 80.5, 85.5, 76.0, 84.0, 82.0, 68.0, 62.3),
      speed: {
        tps: 62.3,
        ttftMs: 480,
        measuredAt: DEMO_EVAL_AT,
        harness: "bdx-bench-demo",
      },
    },
    {
      reasoningModel: true,
      maxOutput: 32000,
      latencyP50Ms: 1950,
      demoRuns: 18,
      sourceId: "demo-muse-spark-1-3",
      benchmarkRows: rows([
        { slug: "bdx-reasoning-mini", score: 88.5, fleetAvg: 74.2, percentile: 90 },
        { slug: "bdx-coding-mini", score: 90.0, fleetAvg: 71.8, percentile: 94, daysAgo: 1 },
        { slug: "bdx-math-mini", score: 80.5, fleetAvg: 68.4, percentile: 80 },
        { slug: "bdx-knowledge-mini", score: 85.5, fleetAvg: 75.1, percentile: 84, daysAgo: 4 },
        { slug: "bdx-vision-mini", score: 76.0, fleetAvg: 66.9, percentile: 74 },
        { slug: "bdx-agentic-mini", score: 84.0, fleetAvg: 69.3, percentile: 86 },
        { slug: "bdx-swe-mini", score: 88.0, fleetAvg: 62.5, percentile: 92, daysAgo: 2 },
        { slug: "bdx-terminal-mini", score: 83.5, fleetAvg: 60.2, percentile: 88 },
      ]),
    },
  ),
  page(
    {
      id: "bdx-ai/gemini-3.7-flash-tiered",
      slug: "gemini-3-7-flash-tiered",
      name: "Gemini 3.7 Flash",
      family: "Gemini Flash",
      provider: "google",
      context: 1000000,
      released: "2026-03-20",
      openWeights: false,
      capabilities: { vision: true, tools: true, audio: true, multimodal: true },
      prices: {
        inputPer1M: 0.5,
        outputPer1M: 1.5,
        cachedInputPer1M: 0.125,
        currency: "USD",
        effectiveDate: "2026-09-01",
        source: "demo-vendor-sheet",
      },
      scores: scores(79.8, 80.0, 78.5, 76.0, 82.0, 81.5, 74.0, 88.0, 92.0, 142.7),
      speed: {
        tps: 142.7,
        ttftMs: 310,
        measuredAt: DEMO_EVAL_AT,
        harness: "bdx-bench-demo",
      },
    },
    {
      reasoningModel: false,
      maxOutput: 64000,
      latencyP50Ms: 980,
      demoRuns: 22,
      sourceId: "demo-gemini-3-7-flash",
      benchmarkRows: rows([
        { slug: "bdx-reasoning-mini", score: 80.0, fleetAvg: 74.2, percentile: 66 },
        { slug: "bdx-coding-mini", score: 78.5, fleetAvg: 71.8, percentile: 64, daysAgo: 2 },
        { slug: "bdx-math-mini", score: 76.0, fleetAvg: 68.4, percentile: 62 },
        { slug: "bdx-knowledge-mini", score: 82.0, fleetAvg: 75.1, percentile: 70 },
        { slug: "bdx-vision-mini", score: 81.5, fleetAvg: 66.9, percentile: 82, daysAgo: 1 },
        { slug: "bdx-agentic-mini", score: 74.0, fleetAvg: 69.3, percentile: 58 },
        { slug: "bdx-swe-mini", score: 72.5, fleetAvg: 62.5, percentile: 60, daysAgo: 6 },
        { slug: "bdx-terminal-mini", score: 70.0, fleetAvg: 60.2, percentile: 57 },
      ]),
    },
  ),
  page(
    {
      id: "bdx-ai/gemini-3.8-flash-tiered",
      slug: "gemini-3-8-flash-tiered",
      name: "Gemini 3.8 Flash",
      family: "Gemini Flash",
      provider: "google",
      context: 1000000,
      released: "2026-08-04",
      openWeights: false,
      capabilities: { vision: true, tools: true, audio: true, multimodal: true },
      prices: {
        inputPer1M: 0.75,
        outputPer1M: 2.0,
        cachedInputPer1M: 0.2,
        currency: "USD",
        effectiveDate: "2026-09-01",
        source: "demo-vendor-sheet",
      },
      scores: scores(82.3, 84.0, 81.0, 79.5, 83.5, 83.0, 77.5, 87.0, 88.0, 128.4),
      speed: {
        tps: 128.4,
        ttftMs: 340,
        measuredAt: DEMO_EVAL_AT,
        harness: "bdx-bench-demo",
      },
    },
    {
      reasoningModel: true,
      maxOutput: 64000,
      latencyP50Ms: 1120,
      demoRuns: 11,
      sourceId: "demo-gemini-3-8-flash",
      benchmarkRows: rows([
        { slug: "bdx-reasoning-mini", score: 84.0, fleetAvg: 74.2, percentile: 76 },
        { slug: "bdx-coding-mini", score: 81.0, fleetAvg: 71.8, percentile: 71, daysAgo: 3 },
        { slug: "bdx-math-mini", score: 79.5, fleetAvg: 68.4, percentile: 72 },
        { slug: "bdx-knowledge-mini", score: 83.5, fleetAvg: 75.1, percentile: 73 },
        { slug: "bdx-vision-mini", score: 83.0, fleetAvg: 66.9, percentile: 85, daysAgo: 1 },
        { slug: "bdx-agentic-mini", score: 77.5, fleetAvg: 69.3, percentile: 66 },
        { slug: "bdx-swe-mini", score: 76.0, fleetAvg: 62.5, percentile: 64 },
        { slug: "bdx-terminal-mini", score: 74.5, fleetAvg: 60.2, percentile: 63, daysAgo: 2 },
      ]),
    },
  ),
  page(
    {
      id: "bdx-ai/deepseek-v4.1-flash",
      slug: "deepseek-v4-1-flash",
      name: "DeepSeek V4.1 Flash",
      family: "DeepSeek Flash",
      provider: "deepseek",
      context: 128000,
      released: "2026-07-15",
      openWeights: true,
      capabilities: { vision: false, tools: true, audio: false, multimodal: false },
      prices: {
        inputPer1M: 0.4,
        outputPer1M: 1.6,
        cachedInputPer1M: 0.1,
        currency: "USD",
        effectiveDate: "2026-09-01",
        source: "demo-vendor-sheet",
      },
      scores: scores(81.5, 85.5, 83.0, 82.0, 79.0, 55.0, 78.5, 80.0, 90.0, 118.9),
      speed: {
        tps: 118.9,
        ttftMs: 390,
        measuredAt: DEMO_EVAL_AT,
        harness: "bdx-bench-demo",
      },
    },
    {
      reasoningModel: true,
      maxOutput: 16000,
      latencyP50Ms: 1240,
      demoRuns: 16,
      sourceId: "demo-deepseek-v4-1-flash",
      benchmarkRows: rows([
        { slug: "bdx-reasoning-mini", score: 85.5, fleetAvg: 74.2, percentile: 80 },
        { slug: "bdx-coding-mini", score: 83.0, fleetAvg: 71.8, percentile: 76, daysAgo: 2 },
        { slug: "bdx-math-mini", score: 82.0, fleetAvg: 68.4, percentile: 78 },
        { slug: "bdx-knowledge-mini", score: 79.0, fleetAvg: 75.1, percentile: 60 },
        { slug: "bdx-vision-mini", score: 55.0, fleetAvg: 66.9, percentile: 22, daysAgo: 7 },
        { slug: "bdx-agentic-mini", score: 78.5, fleetAvg: 69.3, percentile: 68 },
        { slug: "bdx-swe-mini", score: 80.0, fleetAvg: 62.5, percentile: 72, daysAgo: 1 },
        { slug: "bdx-terminal-mini", score: 79.5, fleetAvg: 60.2, percentile: 71 },
      ]),
    },
  ),
];

/** All demo slugs (for generateStaticParams). */
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
/** Related models: same family first, then nearest composite score. */
export function getRelatedModels(slug: string, limit = 3): RelatedModel[] {
  const current = MODEL_PAGES.find((p) => p.model.slug === slug);
  if (!current) return [];
  const currentScore = current.model.scores.bdxScore ?? current.model.scores.overall;
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
// Deterministic synthetic history (demo only)
// ---------------------------------------------------------------------------

/** Simple string hash → uint32 seed (stable across server/client renders). */
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32 PRNG — deterministic per seed. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RANGE_POINTS: Record<HistoryRange, { count: number; stepDays: number }> = {
  "1M": { count: 30, stepDays: 1 },
  "3M": { count: 13, stepDays: 7 },
  "6M": { count: 26, stepDays: 7 },
  "1Y": { count: 52, stepDays: 7 },
  ALL: { count: 48, stepDays: 30 },
};

function metricEndValue(model: Model, metric: HistoryMetric): number {
  switch (metric) {
    case "overall":
      return model.scores.overall;
    case "coding":
      return model.scores.coding;
    case "reasoning":
      return model.scores.reasoning;
    case "math":
      return model.scores.math;
    case "vision":
      return model.scores.vision;
    case "agentic":
      return model.scores.agentic;
  }
}

/**
 * Generate a deterministic demo history series ending at the model's current
 * subscore. Random-walk backwards from the end value so the latest point
 * always matches the metrics grid (no fake drift at the head).
 */
export function getModelHistory(
  slug: string,
  metric: HistoryMetric,
  range: HistoryRange,
): HistoryPoint[] {
  const entry = MODEL_PAGES.find((p) => p.model.slug === slug);
  if (!entry) return [];
  const { count, stepDays } = RANGE_POINTS[range];
  const rand = mulberry32(hashSeed(`${slug}:${metric}:${range}`));
  const end = metricEndValue(entry.model, metric);
  const endTime = new Date(DEMO_EVAL_AT).getTime();

  // Walk backwards: older points drift lower with noise (demo "improvement").
  const values: number[] = new Array<number>(count).fill(end);
  let v = end;
  for (let i = count - 1; i >= 0; i--) {
    values[i] = v;
    const drift = rand() * 1.6; // demo upward trend toward present
    const noise = (rand() - 0.5) * 3.2;
    v = Math.min(99, Math.max(20, v - drift + noise * 0.4));
  }
  // Pin the head exactly to the current subscore.
  values[count - 1] = end;

  return values.map((value, i) => {
    const t = endTime - (count - 1 - i) * stepDays * 24 * 60 * 60 * 1000;
    return {
      date: new Date(t).toISOString().slice(0, 10),
      value: Math.round(value * 10) / 10,
    };
  });
}

/** Narrow a Model's evaluations for provenance text (demo mirror of API). */
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

export { DEMO_BENCHMARKS, DEMO_EVAL_AT, DEMO_RETRIEVED_AT };
