import { z } from "zod";

/**
 * BDX Bench canonical domain types.
 * SINGLE source of truth — all feature agents must import from `@/lib/types`.
 * Brand: BDX Bench (short BDX, symbol B/).
 */

// ---------------------------------------------------------------------------
// Enums / unions
// ---------------------------------------------------------------------------

export const ProviderSchema = z.enum([
  "bdx-ai",
  "openai",
  "anthropic",
  "google",
  "meta",
  "mistral",
  "deepseek",
  "qwen",
  "xai",
  "other",
]);
export type Provider = z.infer<typeof ProviderSchema>;

export const CapabilitySchema = z.object({
  vision: z.boolean(),
  tools: z.boolean(),
  audio: z.boolean(),
  multimodal: z.boolean(),
});
export type Capability = z.infer<typeof CapabilitySchema>;

// ---------------------------------------------------------------------------
// Price snapshot — USD per 1M tokens
// `null` input/output = Not measured (no verified price for this model).
// ---------------------------------------------------------------------------

export const PriceSnapshotSchema = z.object({
  inputPer1M: z.number().nonnegative().nullable(),
  outputPer1M: z.number().nonnegative().nullable(),
  cachedInputPer1M: z.number().nonnegative().optional(),
  currency: z.string().default("USD"),
  effectiveDate: z.string(), // ISO date
  source: z.string().optional(), // Source id or URL label
});
export type PriceSnapshot = z.infer<typeof PriceSnapshotSchema>;

// ---------------------------------------------------------------------------
// Score snapshot — raw 0-100 subscores per dimension
//
// `overall` carries the verified Showdown Score (manual game-build
// evaluation). Every other dimension is `null` until it is measured —
// `null` renders as "Not evaluated", never as zero or an estimate.
// ---------------------------------------------------------------------------

export const ScoreDimensions = [
  "overall",
  "reasoning",
  "coding",
  "math",
  "knowledge",
  "vision",
  "agentic",
  "longContext",
  "efficiency",
] as const;
export type ScoreDimension = (typeof ScoreDimensions)[number];

export const ScoreSnapshotSchema = z.object({
  overall: z.number().min(0).max(100),
  reasoning: z.number().min(0).max(100).nullable(),
  coding: z.number().min(0).max(100).nullable(),
  math: z.number().min(0).max(100).nullable(),
  knowledge: z.number().min(0).max(100).nullable(),
  vision: z.number().min(0).max(100).nullable(),
  agentic: z.number().min(0).max(100).nullable(),
  /** Long-context handling subscore (0-100). Null = Not evaluated. */
  longContext: z.number().min(0).max(100).nullish(),
  /** Cost/latency efficiency subscore (0-100, higher = more efficient). Null = Not evaluated. */
  efficiency: z.number().min(0).max(100).nullish(),
  /** Composite BDX Bench Score (0-100), computed via lib/scores.ts. */
  bdxScore: z.number().min(0).max(100).optional(),
  speed: z.number().min(0).nullish(), // tokens/sec (legacy alias of SpeedTest.tps). Null = Not measured.
  evaluatedAt: z.string(), // ISO date
  benchmark: z.string().optional(), // benchmark slug this snapshot came from
});
export type ScoreSnapshot = z.infer<typeof ScoreSnapshotSchema>;

// ---------------------------------------------------------------------------
// Speed test
// ---------------------------------------------------------------------------

export const SpeedTestSchema = z.object({
  /** Median output tokens/sec. */
  tps: z.number().nonnegative(),
  /** Time to first token, ms. */
  ttftMs: z.number().nonnegative(),
  measuredAt: z.string(),
  harness: z.string().optional(),
});
export type SpeedTest = z.infer<typeof SpeedTestSchema>;

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------

export const ModelSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  family: z.string(),
  provider: ProviderSchema,
  context: z.number().int().nonnegative().nullable(), // context window (tokens). Null = Not measured.
  released: z.string().nullable(), // ISO date. Null = unknown release date.
  openWeights: z.boolean(),
  capabilities: CapabilitySchema,
  prices: PriceSnapshotSchema,
  scores: ScoreSnapshotSchema,
  speed: SpeedTestSchema.optional(),
});
export type Model = z.infer<typeof ModelSchema>;

// ---------------------------------------------------------------------------
// Benchmark + Evaluation
// ---------------------------------------------------------------------------

export const BenchmarkSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum([
    "reasoning",
    "coding",
    "math",
    "knowledge",
    "vision",
    "agentic",
    "speed",
    "overall",
  ]),
  weight: z.number().min(0).max(1), // contribution used by docs only; scoring weights live in scores.ts
  unit: z.string().default("score 0-100"),
  higherIsBetter: z.boolean().default(true),
});
export type Benchmark = z.infer<typeof BenchmarkSchema>;

export const EvaluationSchema = z.object({
  modelSlug: z.string(),
  benchmarkSlug: z.string(),
  raw: z.number().min(0).max(100),
  normalized: z.number().min(0).max(100).optional(),
  evaluatedAt: z.string(),
});
export type Evaluation = z.infer<typeof EvaluationSchema>;

// ---------------------------------------------------------------------------
// Source (provenance for a score/price)
// ---------------------------------------------------------------------------

export const SourceSchema = z.object({
  id: z.string(),
  label: z.string(),
  url: z.string().url().optional(),
  retrievedAt: z.string(),
  kind: z.enum(["vendor", "benchmark", "harness", "manual"]),
  notes: z.string().optional(),
});
export type Source = z.infer<typeof SourceSchema>;

// ---------------------------------------------------------------------------
// API envelopes
// ---------------------------------------------------------------------------

export const LeaderboardRowSchema = z.object({
  rank: z.number().int().positive(),
  modelSlug: z.string(),
  modelName: z.string(),
  provider: ProviderSchema,
  bdxScore: z.number(),
  overall: z.number(),
  /** Blended USD/1M. Null = Not measured (no verified price). */
  pricePer1MBlended: z.number().nullable(),
  tps: z.number().optional(),
});
export type LeaderboardRow = z.infer<typeof LeaderboardRowSchema>;

export const TrendPointSchema = z.object({
  date: z.string(),
  avgBdxScore: z.number(),
  modelCount: z.number().int().nonnegative(),
});
export type TrendPoint = z.infer<typeof TrendPointSchema>;

// ---------------------------------------------------------------------------
// Agent8 (backend+data) additive extension — homepage/demo aggregates.
// These shapes are consumed by home sections via `@/lib/demo-data`
// (canonical values generated by web/scripts/make-seed.cjs).
// All values are DEMO DATA.
// ---------------------------------------------------------------------------

/** One ranked row in a homepage "top models" table. */
export const HomeModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.string(),
  score: z.number(),
  delta: z.number(),
  pricePer1M: z.number().nullable(),
  speedTps: z.number().nullable(),
  contextK: z.number().nullable(),
  releasedAt: z.string().optional(),
  isNew: z.boolean().optional(),
});
export type HomeModel = z.infer<typeof HomeModelSchema>;

/** Homepage "at a glance" counters. */
export const GlobalStatsSchema = z.object({
  modelsTracked: z.number().int().nonnegative(),
  benchmarks: z.number().int().nonnegative(),
  evalRuns: z.number().int().nonnegative(),
  providers: z.number().int().nonnegative(),
  datasetRefresh: z.string(),
});
export type GlobalStats = z.infer<typeof GlobalStatsSchema>;

/** Best demo model per scoring dimension. */
export const CategoryLeaderSchema = z.object({
  category: z.string(),
  model: z.string(),
  provider: z.string(),
  score: z.number(),
});
export type CategoryLeader = z.infer<typeof CategoryLeaderSchema>;

/** Intelligence-vs-price scatter point. */
export const PricePointSchema = z.object({
  id: z.string(),
  name: z.string(),
  score: z.number(),
  pricePer1M: z.number(),
});
export type PricePoint = z.infer<typeof PricePointSchema>;

/** Benchmark suite coverage tile. */
export const BenchmarkCoverageSchema = z.object({
  name: z.string(),
  tasks: z.number().int().nonnegative(),
  kind: z.string(),
});
export type BenchmarkCoverage = z.infer<typeof BenchmarkCoverageSchema>;

/** Homepage capability-trend series point. */
export const HomeTrendPointSchema = z.object({
  label: z.string(),
  topScore: z.number(),
  medianScore: z.number(),
});
export type HomeTrendPoint = z.infer<typeof HomeTrendPointSchema>;

// ---------------------------------------------------------------------------
// Agent8 note (backend+data): the block below landed concurrently with the
// Agent8 extension above and redeclared the same names with different shapes
// (hard TS error). It is preserved verbatim under distinct names so no work
// is lost. Types-owner + home-owner: please converge on ONE shape per name —
// current committed consumers (home/global-stats.tsx, home/top-models.tsx)
// use GlobalStats/HomeModel as defined in the Agent8 block above.
// ---------------------------------------------------------------------------

export const HomepageStatsSchema = z.object({
  modelCount: z.number().int().nonnegative(),
  benchmarkCount: z.number().int().nonnegative(),
  avgBdxScore: z.number(),
  updatedAt: z.string(),
});
export type HomepageStats = z.infer<typeof HomepageStatsSchema>;

export const HomepageModelSchema = z.object({
  slug: z.string(),
  name: z.string(),
  family: z.string(),
  provider: ProviderSchema,
  bdxScore: z.number(),
  overall: z.number(),
  pricePer1MBlended: z.number().nullable(),
  tps: z.number().optional(),
  openWeights: z.boolean(),
  released: z.string().nullable(),
});
export type HomepageModel = z.infer<typeof HomepageModelSchema>;
