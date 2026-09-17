#!/usr/bin/env node
/**
 * BDX Bench demo-seed generator — Owner: SUB-AGENT 8/10 BACKEND+DATA.
 *
 * DEMO DATA — everything emitted here is fictional and synthetic, for local
 * development and UI work only. Never present seeded values as live results.
 *
 * Single source of truth for the backend+data seed. Emits three artifacts
 * from one in-memory model (parity by construction):
 *   1. web/supabase/seed-data.json  — machine-readable seed (tooling)
 *   2. web/supabase/seed.sql        — Postgres/Supabase INSERTs (schema.sql)
 *   3. web/src/lib/demo-data.ts     — canonical TS module for the Next app
 *                                      (GENERATED — do not hand-edit)
 *
 * Scoring contract (mirrors web/src/lib/scores.ts — Agent1 owns the formula,
 * this file only re-implements it to precompute snapshots):
 *   weights: Reasoning .20 / Coding .20 / Knowledge .15 / Math .15 /
 *            Vision .10 / Agentic .10 / LongContext .05 / Efficiency .05
 *   bdxScore = round1(weighted sum); missing longContext/efficiency fall back
 *   to the mean of the six core dims; blended price = round2(in*.75+out*.25).
 *
 * Usage:
 *   node web/scripts/make-seed.cjs          # regenerate + write artifacts
 *   node web/scripts/make-seed.cjs --check  # fail if artifacts are stale
 *
 * Zero dependencies (Node built-ins only).
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const OUT_JSON = path.join(ROOT, "supabase", "seed-data.json");
const OUT_SQL = path.join(ROOT, "supabase", "seed.sql");
const OUT_TS = path.join(ROOT, "src", "lib", "demo-data.ts");

const CHECK = process.argv.includes("--check");

// ---------------------------------------------------------------------------
// Fixed dataset metadata
// ---------------------------------------------------------------------------
const METHODOLOGY_VERSION = "v1";
const RETRIEVED_AT = "2026-09-17T07:00:00.000Z";
const REFRESH_LABEL = "2026-09-12 (demo)";
const MAX_EVAL_DATE = "2026-09-12";

const WEIGHTS = {
  reasoning: 0.2,
  coding: 0.2,
  knowledge: 0.15,
  math: 0.15,
  vision: 0.1,
  agentic: 0.1,
  longContext: 0.05,
  efficiency: 0.05,
};

// ---------------------------------------------------------------------------
// Deterministic PRNG (mulberry32) + string hash
// ---------------------------------------------------------------------------
function hashSeed(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const round1 = (n) => Math.round(n * 10) / 10;
const round2 = (n) => Math.round(n * 100) / 100;
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

// ---------------------------------------------------------------------------
// Scoring replicas (must match web/src/lib/scores.ts)
// ---------------------------------------------------------------------------
function bdxBenchScore(s) {
  const present = [s.reasoning, s.coding, s.knowledge, s.math, s.vision, s.agentic];
  const mean = present.reduce((a, b) => a + b, 0) / present.length;
  const lc = s.longContext ?? mean;
  const eff = s.efficiency ?? mean;
  return round1(
    s.reasoning * WEIGHTS.reasoning +
      s.coding * WEIGHTS.coding +
      s.knowledge * WEIGHTS.knowledge +
      s.math * WEIGHTS.math +
      s.vision * WEIGHTS.vision +
      s.agentic * WEIGHTS.agentic +
      lc * WEIGHTS.longContext +
      eff * WEIGHTS.efficiency,
  );
}
function blendedPricePer1M(inputPer1M, outputPer1M) {
  return round2(inputPer1M * 0.75 + outputPer1M * 0.25);
}

// ---------------------------------------------------------------------------
// Providers (demo grouping labels — not affiliations or endorsements)
// ---------------------------------------------------------------------------
const PROVIDERS = [
  { slug: "openai", label: "OpenAI (demo grouping)", note: "Demo grouping label. Not an affiliation, endorsement, or vendor claim." },
  { slug: "anthropic", label: "Anthropic (demo grouping)", note: "Demo grouping label. Not an affiliation, endorsement, or vendor claim." },
  { slug: "google", label: "Google (demo grouping)", note: "Demo grouping label. Not an affiliation, endorsement, or vendor claim." },
  { slug: "meta", label: "Meta (demo grouping)", note: "Demo grouping label. Not an affiliation, endorsement, or vendor claim." },
  { slug: "mistral", label: "Mistral (demo grouping)", note: "Demo grouping label. Not an affiliation, endorsement, or vendor claim." },
  { slug: "deepseek", label: "DeepSeek (demo grouping)", note: "Demo grouping label. Not an affiliation, endorsement, or vendor claim." },
  { slug: "qwen", label: "Qwen (demo grouping)", note: "Demo grouping label. Not an affiliation, endorsement, or vendor claim." },
  { slug: "xai", label: "xAI (demo grouping)", note: "Demo grouping label. Not an affiliation, endorsement, or vendor claim." },
];

// ---------------------------------------------------------------------------
// Models: [slug, name, family, provider, ctx, released, open, vision, tools,
//          skill, inPrice, outPrice, tps, ttftMs] — names are fictional.
// ---------------------------------------------------------------------------
const MODEL_ROWS = [
  ["demo-helios-ultra", "Helios Ultra (demo)", "Helios", "openai", 200000, "2026-08-12", false, true, true, 88, 8.0, 32.0, 52, 610],
  ["demo-helios-mini", "Helios Mini (demo)", "Helios", "openai", 128000, "2026-08-12", false, true, true, 79, 0.6, 2.4, 128, 320],
  ["demo-aurora-opus", "Aurora Opus (demo)", "Aurora", "anthropic", 200000, "2026-07-21", false, true, true, 87, 6.0, 24.0, 48, 640],
  ["demo-aurora-sonnet", "Aurora Sonnet (demo)", "Aurora", "anthropic", 200000, "2026-06-30", false, true, true, 84, 2.0, 8.0, 74, 450],
  ["demo-aurora-haiku", "Aurora Haiku (demo)", "Aurora", "anthropic", 128000, "2026-05-18", false, true, true, 77, 0.4, 1.6, 152, 260],
  ["demo-borealis-pro", "Borealis Pro (demo)", "Borealis", "google", 1000000, "2026-07-02", false, true, true, 85, 1.5, 6.0, 96, 380],
  ["demo-borealis-flash", "Borealis Flash (demo)", "Borealis", "google", 1000000, "2026-06-10", false, true, true, 80, 0.4, 1.2, 168, 240],
  ["demo-borealis-nano", "Borealis Nano (demo)", "Borealis", "google", 64000, "2026-09-03", false, false, true, 71, 0.15, 0.4, 210, 180],
  ["demo-quasar-70b", "Quasar 70B (demo)", "Quasar", "meta", 128000, "2026-04-25", true, false, true, 78, 0.5, 0.7, 88, 410],
  ["demo-quasar-8b", "Quasar 8B (demo)", "Quasar", "meta", 64000, "2026-04-25", true, false, true, 68, 0.15, 0.2, 175, 230],
  ["demo-quasar-vision", "Quasar Vision (demo)", "Quasar", "meta", 128000, "2026-08-29", true, true, true, 76, 0.6, 0.9, 82, 430],
  ["demo-titan-large", "Titan Large (demo)", "Titan", "mistral", 128000, "2026-05-30", false, false, true, 82, 3.0, 9.0, 66, 470],
  ["demo-breeze-small", "Breeze Small (demo)", "Titan", "mistral", 64000, "2026-05-30", false, false, true, 75, 0.5, 1.5, 132, 290],
  ["demo-cyclone-8x7b", "Cyclone 8x7B (demo)", "Cyclone", "mistral", 64000, "2026-03-14", true, false, true, 72, 0.4, 0.6, 104, 350],
  ["demo-abyss-reasoner", "Abyss Reasoner (demo)", "Abyss", "deepseek", 128000, "2026-07-30", true, false, true, 83, 0.7, 2.8, 58, 520],
  ["demo-abyss-chat", "Abyss Chat (demo)", "Abyss", "deepseek", 128000, "2026-06-22", true, false, true, 78, 0.4, 1.0, 92, 390],
  ["demo-abyss-coder", "Abyss Coder (demo)", "Abyss", "deepseek", 64000, "2026-08-17", true, false, true, 81, 0.5, 1.5, 78, 420],
  ["demo-dune-max", "Dune Max (demo)", "Dune", "qwen", 128000, "2026-07-08", true, true, true, 82, 1.0, 3.0, 71, 440],
  ["demo-dune-plus", "Dune Plus (demo)", "Dune", "qwen", 64000, "2026-06-05", true, false, true, 76, 0.4, 1.2, 118, 300],
  ["demo-dune-turbo", "Dune Turbo (demo)", "Dune", "qwen", 32000, "2026-09-09", true, false, true, 70, 0.15, 0.45, 188, 200],
  ["demo-horizon-alpha", "Horizon Alpha (demo)", "Horizon", "xai", 200000, "2026-08-05", false, true, true, 84, 2.5, 10.0, 63, 490],
  ["demo-horizon-beta", "Horizon Beta (demo)", "Horizon", "xai", 128000, "2026-09-11", false, true, true, 79, 1.0, 4.0, 108, 330],
];

// ---------------------------------------------------------------------------
// Benchmarks: [slug, name, dimension, category, version, tasks, difficulty]
// `dimension` maps onto a BDX Bench Score dimension; `category` is the
// closest value of the shared Benchmark category enum.
// ---------------------------------------------------------------------------
const BENCH_ROWS = [
  ["demo-arc-reasoning", "ARC Reasoning (demo)", "reasoning", "reasoning", "v3", 120, -1, "Abstract multi-step reasoning puzzles (demo set)."],
  ["demo-bbhard", "Big-Hard QA (demo)", "reasoning", "reasoning", "v2", 200, -3, "Hard reading-comprehension QA pairs (demo set)."],
  ["demo-swe-fix", "SWE Fix (demo)", "coding", "coding", "v4", 24, -2, "Repository code-fix tasks mirroring swe-mini (demo results)."],
  ["demo-humaneval-plus", "HumanEval+ (demo)", "coding", "coding", "v2", 164, 0, "Function synthesis checks (demo set)."],
  ["demo-mmlu-pro", "MMLU Pro (demo)", "knowledge", "knowledge", "v2", 280, 1, "Multi-domain factual QA (demo set)."],
  ["demo-gpqa-diamond", "GPQA Diamond (demo)", "knowledge", "knowledge", "v1", 198, -6, "Graduate-level science QA (demo set)."],
  ["demo-gsm8k", "GSM8K (demo)", "math", "math", "v1", 1319, 2, "Grade-school word problems (demo set)."],
  ["demo-math500", "MATH-500 (demo)", "math", "math", "v2", 500, -4, "Competition math problems (demo set)."],
  ["demo-mmbench", "MM-Bench (demo)", "vision", "vision", "v2", 150, -2, "Chart and screenshot understanding (demo set)."],
  ["demo-webarena-tasks", "WebArena Tasks (demo)", "agentic", "agentic", "v1", 36, -4, "Tool-use shell/web tasks mirroring terminal-mini (demo results)."],
  ["demo-ruler-128k", "Ruler 128K (demo)", "longContext", "overall", "v1", 130, -1, "Long-context retrieval and reasoning (demo set)."],
  ["demo-efficiency-index", "Efficiency Index (demo)", "efficiency", "speed", "v1", 40, 0, "Cost/latency efficiency composite (demo formula)."],
];

const DIM_OFFSET = {
  reasoning: -2, coding: -1, knowledge: 1, math: -3,
  vision: -4, agentic: -5, longContext: -2, efficiency: 0,
};

// ---------------------------------------------------------------------------
// Sources (provenance; URLs are synthetic demo-data addresses)
// ---------------------------------------------------------------------------
const SOURCES = [
  { id: "demo-methodology-v1", label: "BDX Bench methodology v1 (demo)", kind: "manual", url: "https://demo-data.bdx-bench.local/methodology/v1", retrievedAt: RETRIEVED_AT, notes: "Demo scoring weights, duplicate policy, and freshness rules." },
  { id: "demo-vendor-sheet", label: "Demo vendor pricing sheet", kind: "vendor", url: "https://demo-data.bdx-bench.local/pricing/2026-09", retrievedAt: RETRIEVED_AT, notes: "Fictional list prices for UI layout. Not vendor quotes." },
  { id: "demo-harness-runs", label: "BDX Bench demo harness runs", kind: "harness", url: "https://demo-data.bdx-bench.local/harness/runs", retrievedAt: RETRIEVED_AT, notes: "Synthetic harness output; seeded PRNG, fully reproducible." },
  { id: "demo-provider-cards", label: "Demo provider eval cards", kind: "benchmark", url: "https://demo-data.bdx-bench.local/cards", retrievedAt: RETRIEVED_AT, notes: "Fictional vendor-reported scores for provenance shape." },
  { id: "demo-community-mirror", label: "Demo community mirror", kind: "manual", url: "https://demo-data.bdx-bench.local/mirror", retrievedAt: RETRIEVED_AT, notes: "Placeholder mirror entry so multi-source provenance renders." },
];

// ---------------------------------------------------------------------------
// Trends (illustrative monthly series — demo only, not measured history)
// ---------------------------------------------------------------------------
const TREND_ROWS = [
  ["2026-03-01", "Mar", 68.5, 80.5, 70.1, 8],
  ["2026-04-01", "Apr", 70.2, 82.4, 71.6, 11],
  ["2026-05-01", "May", 71.9, 84.1, 73.2, 14],
  ["2026-06-01", "Jun", 73.4, 85.8, 74.6, 16],
  ["2026-07-01", "Jul", 74.8, 87.2, 75.9, 18],
  ["2026-08-01", "Aug", 76.1, 88.4, 77.2, 20],
  ["2026-09-01", "Sep", 77.3, 89.6, 78.4, 22],
];

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------
function isoDatePlus(baseIso, days) {
  const t = new Date(baseIso + "T00:00:00.000Z").getTime() + days * 86400000;
  return new Date(t).toISOString().slice(0, 10);
}

function build() {
  const models = MODEL_ROWS.map((r) => {
    const [slug, name, family, provider, ctx, released, open, vision, tools, skill, inP, outP, tps, ttft] = r;
    return {
      slug, name, family, provider, context: ctx, released,
      openWeights: open, vision, tools,
      skill, inputPer1M: inP, outputPer1M: outP, tps, ttftMs: ttft,
      blended: blendedPricePer1M(inP, outP),
    };
  });
  const benchmarks = BENCH_ROWS.map((r) => {
    const [slug, name, dimension, category, version, tasks, difficulty, description] = r;
    return { slug, name, dimension, category, version, taskCount: tasks, difficulty, description };
  });

  // -- evaluations ---------------------------------------------------------
  const evaluations = [];
  for (const m of models) {
    for (const b of benchmarks) {
      if (b.dimension === "vision" && !m.vision) continue; // sparse: no vision rig
      if (b.slug === "demo-ruler-128k" && m.context < 64000) continue; // rig limit
      const rand = mulberry32(hashSeed("eval:" + m.slug + ":" + b.slug));
      let raw;
      if (b.dimension === "efficiency") {
        raw = 100 - 18 * Math.log10(m.blended + 1) + (rand() - 0.5) * 4;
      } else {
        raw = m.skill + DIM_OFFSET[b.dimension] + b.difficulty + (rand() - 0.5) * 6;
      }
      raw = round1(clamp(raw, 5, 99.5));
      const half = round1(1 + rand() * 3);
      const runs = 3 + Math.floor(rand() * 7);
      evaluations.push({
        modelSlug: m.slug,
        benchmarkSlug: b.slug,
        raw,
        normalized: raw, // all demo suites already report 0-100
        ciLow: round1(clamp(raw - half, 0, 100)),
        ciHigh: round1(clamp(raw + half, 0, 100)),
        runs,
        variance: round2(half * half * 0.8),
        evaluatedAt: isoDatePlus("2026-07-01", Math.floor(rand() * 73)),
        sourceId: "demo-harness-runs",
        benchmarkVersion: b.version,
        methodologyVersion: METHODOLOGY_VERSION,
      });
    }
  }

  // -- snapshots -----------------------------------------------------------
  const byModelDim = {};
  for (const e of evaluations) {
    const b = benchmarks.find((x) => x.slug === e.benchmarkSlug);
    (byModelDim[e.modelSlug] = byModelDim[e.modelSlug] || {});
    const cell = byModelDim[e.modelSlug];
    (cell[b.dimension] = cell[b.dimension] || []).push(e.raw);
  }
  const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const snapshots = models.map((m) => {
    const cell = byModelDim[m.slug] || {};
    const dims = {};
    const imputedDims = [];
    for (const d of Object.keys(WEIGHTS)) {
      if (cell[d] && cell[d].length > 0) {
        dims[d] = round1(mean(cell[d]));
      } else {
        const peer = Object.values(cell).flat();
        dims[d] = round1(mean(peer));
        imputedDims.push(d);
      }
    }
    const evalCount = Object.values(cell).reduce((a, xs) => a + xs.length, 0);
    const overall = round1(mean(Object.values(dims)));
    return {
      modelSlug: m.slug,
      evaluatedAt: MAX_EVAL_DATE + "T12:00:00.000Z",
      benchmark: "bdx-bench-demo-v1",
      methodologyVersion: METHODOLOGY_VERSION,
      overall,
      dims,
      bdxScore: bdxBenchScore(dims),
      speed: m.tps,
      evalCount,
      imputedDims,
    };
  });

  const leaderboard = snapshots
    .map((s) => {
      const m = models.find((x) => x.slug === s.modelSlug);
      return { modelSlug: s.modelSlug, bdxScore: s.bdxScore, overall: s.overall, blended: m.blended, tps: m.tps };
    })
    .sort((a, b) => b.bdxScore - a.bdxScore || b.overall - a.overall)
    .map((r, i) => ({ rank: i + 1, ...r }));

  return { models, benchmarks, evaluations, snapshots, leaderboard };
}

// ---------------------------------------------------------------------------
// Emit: demo-data.ts (GENERATED)
// ---------------------------------------------------------------------------
function emitTS(ds) {
  const { models, benchmarks, evaluations, snapshots, leaderboard } = ds;
  const J = (v) => JSON.stringify(v, null, 2);
  const L = [];

  L.push(`/**`);
  L.push(` * BDX Bench canonical demo dataset — GENERATED by web/scripts/make-seed.cjs.`);
  L.push(` * DO NOT HAND-EDIT. Regenerate: \`node web/scripts/make-seed.cjs\`.`);
  L.push(` *`);
  L.push(` * DEMO DATA — every value below is fictional and synthetic, for local`);
  L.push(` * development and UI work only. Never present these as live results.`);
  L.push(` * Every consumer must render a visible "DEMO DATA" label.`);
  L.push(` * Scoring: web/src/lib/scores.ts (Agent1 contract). No live DB required.`);
  L.push(` */`);
  L.push(`import type {`);
  L.push(`  Benchmark,`);
  L.push(`  BenchmarkCoverage,`);
  L.push(`  CategoryLeader,`);
  L.push(`  Evaluation,`);
  L.push(`  GlobalStats,`);
  L.push(`  HomeModel,`);
  L.push(`  HomeTrendPoint,`);
  L.push(`  LeaderboardRow,`);
  L.push(`  Model,`);
  L.push(`  PricePoint,`);
  L.push(`  PriceSnapshot,`);
  L.push(`  ScoreDimension,`);
  L.push(`  ScoreSnapshot,`);
  L.push(`  Source,`);
  L.push(`  SpeedTest,`);
  L.push(`  TrendPoint,`);
  L.push(`} from "@/lib/types";`);
  L.push(``);
  L.push(`export const DEMO_DATA_LABEL = "DEMO DATA" as const;`);
  L.push(`export const METHODOLOGY_VERSION = "${METHODOLOGY_VERSION}" as const;`);
  L.push(`export const DEMO_RETRIEVED_AT = "${RETRIEVED_AT}" as const;`);
  L.push(`export const DEMO_DATASET_REFRESH_LABEL = "${REFRESH_LABEL}" as const;`);
  L.push(`export const DEMO_EVAL_AT = "${MAX_EVAL_DATE}T12:00:00.000Z" as const;`);
  L.push(``);
  L.push(`/** Demo provider grouping (NOT an affiliation or endorsement). */`);
  L.push(`export interface ProviderInfo { slug: string; label: string; note: string }`);
  L.push(`export const PROVIDERS: ProviderInfo[] = ${J(PROVIDERS)};`);
  L.push(``);
  L.push(`/** Concrete benchmark suite + its BDX Bench Score dimension mapping. */`);
  L.push(`export interface BenchmarkMeta extends Benchmark {`);
  L.push(`  dimension: ScoreDimension;`);
  L.push(`  version: string;`);
  L.push(`  taskCount: number;`);
  L.push(`  sourceId: string;`);
  L.push(`}`);
  L.push(`export const BENCHMARK_CATALOGUE: BenchmarkMeta[] = ${J(
    benchmarks.map((b) => ({
      slug: b.slug,
      name: b.name,
      description: b.description,
      category: b.category,
      weight: WEIGHTS[b.dimension] ?? 0,
      unit: b.dimension === "efficiency" ? "index 0-100" : "score 0-100",
      higherIsBetter: true,
      dimension: b.dimension,
      version: b.version,
      taskCount: b.taskCount,
      sourceId: "demo-harness-runs",
    })),
  )};`);
  L.push(``);
  L.push(`/** Evaluation with uncertainty + provenance (extends shared Evaluation). */`);
  L.push(`export interface DemoEvaluation extends Evaluation {`);
  L.push(`  ciLow: number;`);
  L.push(`  ciHigh: number;`);
  L.push(`  runs: number;`);
  L.push(`  variance: number;`);
  L.push(`  sourceId: string;`);
  L.push(`  benchmarkVersion: string;`);
  L.push(`  methodologyVersion: string;`);
  L.push(`}`);
  L.push(`export const EVALUATIONS: DemoEvaluation[] = ${J(evaluations)};`);
  L.push(``);
  L.push(`export interface SpeedEntry { modelSlug: string; test: SpeedTest; runs: number }`);
  L.push(`export const SPEED_TESTS: SpeedEntry[] = ${J(
    models.map((m) => ({
      modelSlug: m.slug,
      test: { tps: m.tps, ttftMs: m.ttftMs, measuredAt: MAX_EVAL_DATE + "T12:00:00.000Z", harness: "bdx-bench-demo-harness" },
      runs: 5,
    })),
  )};`);
  L.push(``);
  L.push(`export interface PriceEntry { modelSlug: string; price: PriceSnapshot; sourceId: string }`);
  L.push(`export const PRICE_SNAPSHOTS: PriceEntry[] = ${J(
    models.map((m) => ({
      modelSlug: m.slug,
      price: {
        inputPer1M: m.inputPer1M,
        outputPer1M: m.outputPer1M,
        cachedInputPer1M: round2(m.inputPer1M * 0.4),
        currency: "USD",
        effectiveDate: "2026-09-01",
        source: "demo-vendor-sheet",
      },
      sourceId: "demo-vendor-sheet",
    })),
  )};`);
  L.push(``);
  L.push(`export interface SnapshotEntry {`);
  L.push(`  modelSlug: string;`);
  L.push(`  snapshot: ScoreSnapshot;`);
  L.push(`  evalCount: number;`);
  L.push(`  imputedDims: string[];`);
  L.push(`  methodologyVersion: string;`);
  L.push(`}`);
  L.push(`export const SCORE_SNAPSHOTS: SnapshotEntry[] = ${J(
    snapshots.map((s) => ({
      modelSlug: s.modelSlug,
      snapshot: {
        overall: s.overall,
        reasoning: s.dims.reasoning,
        coding: s.dims.coding,
        math: s.dims.math,
        knowledge: s.dims.knowledge,
        vision: s.dims.vision,
        agentic: s.dims.agentic,
        longContext: s.dims.longContext,
        efficiency: s.dims.efficiency,
        bdxScore: s.bdxScore,
        speed: s.speed,
        evaluatedAt: s.evaluatedAt,
        benchmark: s.benchmark,
      },
      evalCount: s.evalCount,
      imputedDims: s.imputedDims,
      methodologyVersion: s.methodologyVersion,
    })),
  )};`);
  L.push(``);
  L.push(`export const SOURCES: Source[] = ${J(SOURCES)};`);
  L.push(``);

  // -- canonical Model[] ----------------------------------------------------
  const providerLabel = Object.fromEntries(PROVIDERS.map((p) => [p.slug, p.label]));
  L.push(`export const MODELS: Model[] = ${J(
    models.map((m) => {
      const snap = snapshots.find((s) => s.modelSlug === m.slug);
      return {
        id: m.slug,
        slug: m.slug,
        name: m.name,
        family: m.family,
        provider: m.provider,
        context: m.context,
        released: m.released,
        openWeights: m.openWeights,
        capabilities: { vision: m.vision, tools: m.tools, audio: false, multimodal: m.vision },
        prices: {
          inputPer1M: m.inputPer1M,
          outputPer1M: m.outputPer1M,
          cachedInputPer1M: round2(m.inputPer1M * 0.4),
          currency: "USD",
          effectiveDate: "2026-09-01",
          source: "demo-vendor-sheet",
        },
        scores: {
          overall: snap.overall,
          reasoning: snap.dims.reasoning,
          coding: snap.dims.coding,
          math: snap.dims.math,
          knowledge: snap.dims.knowledge,
          vision: snap.dims.vision,
          agentic: snap.dims.agentic,
          longContext: snap.dims.longContext,
          efficiency: snap.dims.efficiency,
          bdxScore: snap.bdxScore,
          speed: m.tps,
          evaluatedAt: snap.evaluatedAt,
          benchmark: snap.benchmark,
        },
        speed: { tps: m.tps, ttftMs: m.ttftMs, measuredAt: snap.evaluatedAt, harness: "bdx-bench-demo-harness" },
      };
    }),
  )};`);
  void providerLabel;
  L.push(``);
  L.push(`export const TRENDS: TrendPoint[] = ${J(
    TREND_ROWS.map((r) => ({ date: r[0], avgBdxScore: r[2], modelCount: r[5] })),
  )};`);
  L.push(``);

  // -- homepage aggregates (same names the home fallback file promised) -----
  const bySlug = Object.fromEntries(models.map((m) => [m.slug, m]));
  const snapBySlug = Object.fromEntries(snapshots.map((s) => [s.modelSlug, s]));
  const shortName = (n) => n.replace(" (demo)", "");
  const provShort = (slug) => PROVIDERS.find((p) => p.slug === bySlug[slug].provider).label.replace(" (demo grouping)", "");
  const toHome = (slug, score) => {
    const m = bySlug[slug];
    return {
      id: slug,
      name: m.name,
      provider: provShort(slug),
      score,
      delta: round1((((hashSeed("delta:" + slug + ":" + score) % 41) - 15) / 10)),
      pricePer1M: m.blended,
      speedTps: m.tps,
      contextK: Math.round(m.context / 1000),
      releasedAt: m.released,
      isNew: m.released >= "2026-08-15",
    };
  };
  const DIMS = ["reasoning", "coding", "math", "knowledge", "vision", "agentic", "longContext", "efficiency"];
  const TAB = { reasoning: "Reasoning", coding: "Coding", math: "Math", knowledge: "Knowledge", vision: "Vision", longContext: "Long Context", agentic: "Agentic", efficiency: "Efficiency" };
  const topBy = (fn, n = 5) =>
    [...snapshots].sort((a, b) => fn(b) - fn(a)).slice(0, n);
  const cats = { Overall: topBy((s) => s.bdxScore).map((s) => toHome(s.modelSlug, s.bdxScore)) };
  for (const d of DIMS) cats[TAB[d]] = topBy((s) => s.dims[d]).map((s) => toHome(s.modelSlug, s.dims[d]));
  L.push(`export const DEMO_TOP_MODELS_BY_CATEGORY: Record<string, HomeModel[]> = ${J(cats)};`);
  L.push(``);
  const leaders = DIMS.map((d) => {
    const s = topBy((x) => x.dims[d], 1)[0];
    return { category: TAB[d], model: shortName(bySlug[s.modelSlug].name), provider: provShort(s.modelSlug), score: s.dims[d] };
  });
  L.push(`export const DEMO_CATEGORY_LEADERS: CategoryLeader[] = ${J(leaders)};`);
  L.push(``);
  const latest = [...models].sort((a, b) => (a.released < b.released ? 1 : -1)).slice(0, 4);
  L.push(`export const DEMO_LATEST_MODELS: HomeModel[] = ${J(
    latest.map((m) => toHome(m.slug, snapBySlug[m.slug].bdxScore)),
  )};`);
  L.push(``);
  L.push(`export const DEMO_PRICE_POINTS: PricePoint[] = ${J(
    topBy((s) => s.bdxScore).map((s) => ({
      id: s.modelSlug,
      name: shortName(bySlug[s.modelSlug].name),
      score: s.bdxScore,
      pricePer1M: bySlug[s.modelSlug].blended,
    })),
  )};`);
  L.push(``);
  L.push(`export const DEMO_BENCHMARKS: BenchmarkCoverage[] = ${J(
    benchmarks.map((b) => ({ name: b.name, tasks: b.taskCount, kind: b.category })),
  )};`);
  L.push(``);
  L.push(`export const DEMO_TREND_SERIES: HomeTrendPoint[] = ${J(
    TREND_ROWS.slice(0, 6).map((r) => ({ label: r[1], topScore: r[3], medianScore: r[4] })),
  )};`);
  L.push(``);
  L.push(`export const DEMO_GLOBAL_STATS: GlobalStats = ${J({
    modelsTracked: models.length,
    benchmarks: benchmarks.length,
    evalRuns: evaluations.length,
    providers: PROVIDERS.length,
    datasetRefresh: REFRESH_LABEL,
  })};`);
  L.push(``);
  const lb = leaderboard.map((r) => {
    const m = bySlug[r.modelSlug];
    return {
      rank: r.rank,
      modelSlug: r.modelSlug,
      modelName: m.name,
      provider: m.provider,
      bdxScore: r.bdxScore,
      overall: r.overall,
      pricePer1MBlended: m.blended,
      tps: m.tps,
    };
  });
  L.push(`/** Canonical leaderboard rows (BDX Bench Score desc). DEMO DATA. */`);
  L.push(`export const demoLeaderboard: LeaderboardRow[] = ${J(lb)};`);
  L.push(``);

  // -- freshness / provenance / uncertainty ----------------------------------
  const benchVersions = {};
  for (const b of benchmarks) benchVersions[b.slug] = b.version;
  L.push(`/** Freshness block returned by every API route. */`);
  L.push(`export interface Freshness {`);
  L.push(`  evalDate: string;`);
  L.push(`  benchmarkVersions: Record<string, string>;`);
  L.push(`  methodologyVersion: string;`);
  L.push(`  retrievedDate: string;`);
  L.push(`  refreshLabel: string;`);
  L.push(`}`);
  L.push(`export const FRESHNESS: Freshness = ${J({
    evalDate: MAX_EVAL_DATE,
    benchmarkVersions: benchVersions,
    methodologyVersion: METHODOLOGY_VERSION,
    retrievedDate: RETRIEVED_AT,
    refreshLabel: REFRESH_LABEL,
  })};`);
  L.push(``);
  L.push(`export interface ProvenanceItem {`);
  L.push(`  sourceId: string;`);
  L.push(`  label: string;`);
  L.push(`  kind: "vendor" | "benchmark" | "harness" | "manual";`);
  L.push(`  url?: string;`);
  L.push(`  retrievedAt: string;`);
  L.push(`  notes: string;`);
  L.push(`}`);
  L.push(`/** Provenance block returned by every API route. All demo sources. */`);
  L.push(`export const PROVENANCE: ProvenanceItem[] = ${J(
    SOURCES.map((s) => ({ sourceId: s.id, label: s.label, kind: s.kind, url: s.url, retrievedAt: s.retrievedAt, notes: s.notes })),
  )};`);
  L.push(``);
  L.push(`/** Uncertainty block: CI coverage across all demo evaluations. */`);
  L.push(`export interface UncertaintySummary {`);
  L.push(`  methodologyVersion: string;`);
  L.push(`  evalCount: number;`);
  L.push(`  avgCiHalfWidth: number;`);
  L.push(`  minRuns: number;`);
  L.push(`  maxRuns: number;`);
  L.push(`}`);
  const halfAvg = round2(mean2(evaluations.map((e) => (e.ciHigh - e.ciLow) / 2)));
  const runVals = evaluations.map((e) => e.runs);
  L.push(`export const UNCERTAINTY: UncertaintySummary = ${J({
    methodologyVersion: METHODOLOGY_VERSION,
    evalCount: evaluations.length,
    avgCiHalfWidth: halfAvg,
    minRuns: Math.min(...runVals),
    maxRuns: Math.max(...runVals),
  })};`);
  L.push(``);
  L.push(`/** Dataset-level meta envelope shared by API routes. */`);
  L.push(`export interface DatasetMeta {`);
  L.push(`  isDemoData: true;`);
  L.push(`  freshness: Freshness;`);
  L.push(`  provenance: ProvenanceItem[];`);
  L.push(`  uncertainty: UncertaintySummary;`);
  L.push(`}`);
  L.push(`export const DATASET_META: DatasetMeta = {`);
  L.push(`  isDemoData: true,`);
  L.push(`  freshness: FRESHNESS,`);
  L.push(`  provenance: PROVENANCE,`);
  L.push(`  uncertainty: UNCERTAINTY,`);
  L.push(`};`);
  L.push(``);
  return L.join("\n");
}

function mean2(xs) {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

// ---------------------------------------------------------------------------
// Emit: seed-data.json / seed.sql
// ---------------------------------------------------------------------------
const esc = (s) => String(s).replace(/'/g, "''");

function emitSQL(ds) {
  const { models, benchmarks, evaluations, snapshots } = ds;
  const L = [];
  L.push(`-- ============================================================================`);
  L.push(`-- BDX Bench demo seed — GENERATED by web/scripts/make-seed.cjs. DO NOT HAND-EDIT.`);
  L.push(`--`);
  L.push(`-- DEMO DATA — every row below is fictional and synthetic, for local`);
  L.push(`-- development and UI work only. Never present these as live results.`);
  L.push(`-- Apply after web/supabase/schema.sql: psql "$DATABASE_URL" -f schema.sql -f seed.sql`);
  L.push(`-- The Next.js app does NOT need this database; it serves the equivalent`);
  L.push(`-- dataset from web/src/lib/demo-data.ts (same generator, parity by design).`);
  L.push(`-- Methodology ${METHODOLOGY_VERSION} | retrieved ${RETRIEVED_AT}`);
  L.push(`-- ============================================================================`);
  L.push(`BEGIN;`);
  L.push(``);
  L.push(`-- Providers (demo grouping labels, not affiliations) --------------------------`);
  L.push(
    `INSERT INTO providers (slug, label, note) VALUES\n` +
      PROVIDERS.map((p) => `  ('${esc(p.slug)}', '${esc(p.label)}', '${esc(p.note)}')`).join(",\n") +
      `\nON CONFLICT (slug) DO UPDATE SET label = EXCLUDED.label, note = EXCLUDED.note;`,
  );
  L.push(``);
  L.push(`-- Models ---------------------------------------------------------------------`);
  L.push(
    `INSERT INTO models (slug, name, family, provider_slug, context_tokens, released_date, open_weights, vision, tools, audio, multimodal) VALUES\n` +
      models
        .map(
          (m) =>
            `  ('${esc(m.slug)}', '${esc(m.name)}', '${esc(m.family)}', '${esc(m.provider)}', ${m.context}, '${m.released}', ${m.openWeights}, ${m.vision}, ${m.tools}, false, ${m.vision})`,
        )
        .join(",\n") +
      `\nON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, family = EXCLUDED.family, provider_slug = EXCLUDED.provider_slug, context_tokens = EXCLUDED.context_tokens, released_date = EXCLUDED.released_date, open_weights = EXCLUDED.open_weights, vision = EXCLUDED.vision, tools = EXCLUDED.tools, multimodal = EXCLUDED.multimodal;`,
  );
  L.push(``);
  L.push(`-- Benchmarks -----------------------------------------------------------------`);
  L.push(
    `INSERT INTO benchmarks (slug, name, description, category, dimension, version, scale_max, higher_is_better, unit, task_count) VALUES\n` +
      benchmarks
        .map(
          (b) =>
            `  ('${esc(b.slug)}', '${esc(b.name)}', '${esc(b.description)}', '${b.category}', '${b.dimension}', '${b.version}', 100, true, '${b.dimension === "efficiency" ? "index 0-100" : "score 0-100"}', ${b.taskCount})`,
        )
        .join(",\n") +
      `\nON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, category = EXCLUDED.category, dimension = EXCLUDED.dimension, version = EXCLUDED.version, task_count = EXCLUDED.task_count;`,
  );
  L.push(``);
  L.push(`-- Sources --------------------------------------------------------------------`);
  L.push(
    `INSERT INTO sources (id, label, kind, url, retrieved_at, notes) VALUES\n` +
      SOURCES.map((s) => `  ('${esc(s.id)}', '${esc(s.label)}', '${s.kind}', '${esc(s.url)}', '${s.retrievedAt}', '${esc(s.notes)}')`).join(",\n") +
      `\nON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, kind = EXCLUDED.kind, url = EXCLUDED.url, retrieved_at = EXCLUDED.retrieved_at, notes = EXCLUDED.notes;`,
  );
  L.push(``);
  L.push(`-- Evaluations (${evaluations.length} rows) -----------------------------------`);
  const rows = evaluations.map(
    (e) =>
      `  ('${e.modelSlug}', '${e.benchmarkSlug}', '${e.sourceId}', ${e.raw}, ${e.normalized}, ${e.ciLow}, ${e.ciHigh}, ${e.runs}, ${e.variance}, '${e.evaluatedAt}', '${e.benchmarkVersion}', '${e.methodologyVersion}')`,
  );
  L.push(
    `INSERT INTO evaluations (model_slug, benchmark_slug, source_id, score_raw, score_norm, ci_low, ci_high, runs, variance, eval_date, benchmark_version, methodology_version) VALUES\n` +
      rows.join(",\n") +
      `\nON CONFLICT (model_slug, benchmark_slug, benchmark_version, methodology_version) DO UPDATE SET score_raw = EXCLUDED.score_raw, score_norm = EXCLUDED.score_norm, ci_low = EXCLUDED.ci_low, ci_high = EXCLUDED.ci_high, runs = EXCLUDED.runs, variance = EXCLUDED.variance, eval_date = EXCLUDED.eval_date;`,
  );
  L.push(``);
  L.push(`-- Speed tests ----------------------------------------------------------------`);
  L.push(
    `INSERT INTO speed_tests (model_slug, source_id, tps, ttft_ms, runs, measured_at, harness) VALUES\n` +
      models
        .map((m) => `  ('${m.slug}', 'demo-harness-runs', ${m.tps}, ${m.ttftMs}, 5, '${MAX_EVAL_DATE}T12:00:00.000Z', 'bdx-bench-demo-harness')`)
        .join(",\n") +
      `\nON CONFLICT (model_slug, measured_at, harness) DO UPDATE SET tps = EXCLUDED.tps, ttft_ms = EXCLUDED.ttft_ms, runs = EXCLUDED.runs;`,
  );
  L.push(``);
  L.push(`-- Price snapshots ------------------------------------------------------------`);
  L.push(
    `INSERT INTO price_snapshots (model_slug, source_id, input_per_1m, output_per_1m, cached_input_per_1m, currency, effective_date, notes) VALUES\n` +
      models
        .map((m) => `  ('${m.slug}', 'demo-vendor-sheet', ${m.inputPer1M}, ${m.outputPer1M}, ${round2(m.inputPer1M * 0.4)}, 'USD', '2026-09-01', 'Fictional demo list price.')`)
        .join(",\n") + `;`,
  );
  L.push(``);
  L.push(`-- Score snapshots ------------------------------------------------------------`);
  L.push(
    `INSERT INTO score_snapshots (model_slug, evaluated_at, benchmark_ref, methodology_version, overall, reasoning, coding, knowledge, math, vision, agentic, long_context, efficiency, bdx_score, speed_tps, eval_count, imputed_dims) VALUES\n` +
      snapshots
        .map(
          (s) =>
            `  ('${s.modelSlug}', '${s.evaluatedAt}', '${s.benchmark}', '${s.methodologyVersion}', ${s.overall}, ${s.dims.reasoning}, ${s.dims.coding}, ${s.dims.knowledge}, ${s.dims.math}, ${s.dims.vision}, ${s.dims.agentic}, ${s.dims.longContext}, ${s.dims.efficiency}, ${s.bdxScore}, ${s.speed}, ${s.evalCount}, '{${s.imputedDims.join(",")}}')`,
        )
        .join(",\n") +
      `\nON CONFLICT (model_slug) DO UPDATE SET evaluated_at = EXCLUDED.evaluated_at, benchmark_ref = EXCLUDED.benchmark_ref, methodology_version = EXCLUDED.methodology_version, overall = EXCLUDED.overall, reasoning = EXCLUDED.reasoning, coding = EXCLUDED.coding, knowledge = EXCLUDED.knowledge, math = EXCLUDED.math, vision = EXCLUDED.vision, agentic = EXCLUDED.agentic, long_context = EXCLUDED.long_context, efficiency = EXCLUDED.efficiency, bdx_score = EXCLUDED.bdx_score, speed_tps = EXCLUDED.speed_tps, eval_count = EXCLUDED.eval_count, imputed_dims = EXCLUDED.imputed_dims, computed_at = now();`,
  );
  L.push(`COMMIT;`);
  L.push(``);
  return L.join("\n");
}

// ---------------------------------------------------------------------------
// Asserts + main
// ---------------------------------------------------------------------------
function assert(cond, msg) {
  if (!cond) {
    console.error("ASSERT FAILED: " + msg);
    process.exitCode = 1;
    throw new Error(msg);
  }
}

function verify(ds) {
  const { models, benchmarks, evaluations, snapshots, leaderboard } = ds;
  assert(PROVIDERS.length >= 7, "need >=7 providers, got " + PROVIDERS.length);
  assert(models.length >= 20, "need >=20 models, got " + models.length);
  assert(benchmarks.length >= 12, "need >=12 benchmarks, got " + benchmarks.length);
  assert(evaluations.length >= 150, "need >=150 evaluations, got " + evaluations.length);
  assert(SOURCES.length >= 1, "need >=1 source");

  const pslugs = new Set(PROVIDERS.map((p) => p.slug));
  const mslugs = new Set(models.map((m) => m.slug));
  const bslugs = new Set(benchmarks.map((b) => b.slug));
  const sids = new Set(SOURCES.map((s) => s.id));
  for (const m of models) assert(pslugs.has(m.provider), "model FK provider: " + m.slug);
  for (const e of evaluations) {
    assert(mslugs.has(e.modelSlug), "eval FK model: " + e.modelSlug);
    assert(bslugs.has(e.benchmarkSlug), "eval FK benchmark: " + e.benchmarkSlug);
    assert(sids.has(e.sourceId), "eval FK source: " + e.sourceId);
    assert(e.ciLow <= e.normalized && e.normalized <= e.ciHigh, "CI bracket: " + e.modelSlug + "/" + e.benchmarkSlug);
    assert(e.evaluatedAt <= MAX_EVAL_DATE, "eval date freshness: " + e.evaluatedAt);
  }
  const keys = new Set(evaluations.map((e) => e.modelSlug + "|" + e.benchmarkSlug + "|" + e.benchmarkVersion + "|" + e.methodologyVersion));
  assert(keys.size === evaluations.length, "duplicate evaluation keys");

  const flat = bdxBenchScore({ reasoning: 80, coding: 80, knowledge: 80, math: 80, vision: 80, agentic: 80, longContext: 80, efficiency: 80 });
  assert(flat === 80, "bdxBenchScore flat-80, got " + flat);
  const wsum = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
  assert(Math.abs(wsum - 1) < 1e-9, "weights sum to 1, got " + wsum);
  assert(blendedPricePer1M(2, 8) === 3.5, "blended price spot check");

  for (const s of snapshots) {
    assert(mslugs.has(s.modelSlug), "snapshot FK model: " + s.modelSlug);
    assert(s.bdxScore === bdxBenchScore(s.dims), "snapshot bdxScore parity: " + s.modelSlug);
  }
  assert(leaderboard.length === models.length, "leaderboard covers all models");
  for (let i = 1; i < leaderboard.length; i++) {
    assert(leaderboard[i - 1].bdxScore >= leaderboard[i].bdxScore, "leaderboard sorted");
  }
}

function main() {
  const ds = build();
  verify(ds);
  const ts = emitTS(ds);
  const sql = emitSQL(ds);
  const json =
    JSON.stringify(
      {
        generatedBy: "web/scripts/make-seed.cjs",
        methodologyVersion: METHODOLOGY_VERSION,
        retrievedAt: RETRIEVED_AT,
        demoData: true,
        note: "DEMO DATA — fictional and synthetic. Never present as live results.",
        providers: PROVIDERS,
        sources: SOURCES,
        counts: {
          providers: PROVIDERS.length,
          models: ds.models.length,
          benchmarks: ds.benchmarks.length,
          evaluations: ds.evaluations.length,
          sources: SOURCES.length,
        },
      },
      null,
      2,
    ) + "\n";

  if (CHECK) {
    let stale = false;
    const targets = [[OUT_TS, ts], [OUT_SQL, sql], [OUT_JSON, json]];
    for (const pair of targets) {
      const file = pair[0];
      const next = pair[1];
      let cur = null;
      try {
        cur = fs.readFileSync(file, "utf8");
      } catch (err) {
        cur = null;
      }
      if (cur !== next) {
        console.error("STALE: " + path.relative(ROOT, file) + " — regenerate with: node scripts/make-seed.cjs");
        stale = true;
      }
    }
    if (stale) process.exit(1);
    console.log("seed check OK — artifacts up to date.");
    return;
  }

  fs.mkdirSync(path.dirname(OUT_SQL), { recursive: true });
  fs.mkdirSync(path.dirname(OUT_TS), { recursive: true });
  fs.writeFileSync(OUT_TS, ts);
  fs.writeFileSync(OUT_SQL, sql);
  fs.writeFileSync(OUT_JSON, json);
  console.log(
    "seed OK: providers=%d models=%d benchmarks=%d evaluations=%d sources=%d snapshots=%d",
    PROVIDERS.length,
    ds.models.length,
    ds.benchmarks.length,
    ds.evaluations.length,
    SOURCES.length,
    ds.snapshots.length,
  );
}

main();

