/**
 * BDX Bench canonical dataset — hand-maintained local evaluation data.
 *
 * Real values from the Zombie Flamethrower Showdown (manual game-build
 * evaluation): seven models, one shared prompt, binary playability
 * check + feature checklist, community vote open (match m-001).
 * Scores surfaced from this file are Showdown Score (manual game-build
 * evaluation). Every other BDX dimension is `null` = "Not evaluated";
 * prices/speed/context are `null` (or omitted) = "Not measured".
 * Scoring weights live in web/src/lib/scores.ts (single authority).
 * No live DB required.
 */
import type {
  Benchmark,
  BenchmarkCoverage,
  CategoryLeader,
  Evaluation,
  GlobalStats,
  HomeModel,
  HomeTrendPoint,
  LeaderboardRow,
  Model,
  PricePoint,
  PriceSnapshot,
  ScoreDimension,
  ScoreSnapshot,
  Source,
  SpeedTest,
  TrendPoint,
} from "@/lib/types";

export const DEMO_DATA_LABEL = "SHOWDOWN DATA" as const;
export const METHODOLOGY_VERSION = "v1" as const;
export const DEMO_RETRIEVED_AT = "2026-09-23" as const;
export const DEMO_DATASET_REFRESH_LABEL = "2026-09-23" as const;
export const DEMO_EVAL_AT = "2026-09-26" as const;

/** Human label for every Showdown Score surfacing. */
export const SHOWDOWN_SCORE_LABEL =
  "Showdown Score v2 (strict code audit)" as const;

/**
 * Static record of the showdown: prompt, builds, answers, and the seeded
 * community tally. Runtime voting lives in the interactive JSON store
 * (match m-001); the counts below mirror its seeded state.
 */
export const SHOWDOWN = {
  benchmarkSlug: "zombie-flamethrower-showdown",
  benchmarkName: "Zombie Flamethrower Showdown",
  matchId: "m-001",
  matchStatus: "open" as const,
  methodology:
    "Showdown Score v2: strict source-code audit, five dimensions x 20 points. Community vote remains open in the interactive store.",
  promptTitle: "Zombie flamethrower survival game",
  promptBody:
    "make me a video game where i am killing zombies with fire and all please? a nice wonderfull game i can play for fun okay?",
  evalDate: "2026-09-26",
  scoreLabel: SHOWDOWN_SCORE_LABEL,
  votes: { A: 1, B: 0 },
  answers: [
    {
      side: "A" as const,
      modelSlug: "muse-spark-1-3",
      playPath: "/play/pyro-vs-zombies",
      text: "PYRO vs ZOMBIES by Muse Spark 1.3. Top-down survival arena: you are the pyro, zombies swarm in waves. Burn them with the flamethrower cone, dodge grabs, survive. Score + combo for chain-burns. Controls: WASD move, mouse aim, hold click to burn, P pause. Features: wave scaling, fire particles, burn damage-over-time, screen shake, HP pickups, high-score in localStorage. Verified playable.",
    },
    {
      side: "B" as const,
      modelSlug: "gemini-3-8-flash",
      playPath: "/play/pyroclasm-inferno",
      text: "PYROCLASM: Zombie Inferno by Gemini 3.8 Flash. Arena survival with flamethrower plus unlockable weapons (Fireball, Napalm Mines), escalating edge-spawned waves, chain ignites, pickups, supernova meter for room-clear blast. Controls: WASD/arrows move, mouse aim, click fire, 1/2/3 switch weapons, SPACE supernova when charged. Features: 3 weapons, particle fire, wave director, kill-score plus accuracy stats, pause/menu overlay. Verified playable.",
    },
  ],
};

/** Provider grouping for the showdown builds (gateway id, not an endorsement). */
export interface ProviderInfo {
  slug: string;
  label: string;
  note: string;
}
export const PROVIDERS: ProviderInfo[] = [
  {
    slug: "bdx-ai",
    label: "BDX AI",
    note: "Gateway serving both showdown builds.",
  },
];

/** Concrete benchmark suite + its BDX Bench Score dimension mapping. */
export interface BenchmarkMeta extends Benchmark {
  dimension: ScoreDimension;
  version: string;
  taskCount: number;
  sourceId: string;
}
export const BENCHMARK_CATALOGUE: BenchmarkMeta[] = [
  {
    slug: "zombie-flamethrower-showdown",
    name: "Zombie Flamethrower Showdown",
    description:
      "One shared prompt, eight models, ten audited game builds. Scores are Showdown Score v2, a strict implementation-level source-code audit. A feature counts only when it is genuinely implemented and reachable.",
    category: "coding",
    weight: 1,
    unit: "Showdown Score 0-100",
    higherIsBetter: true,
    dimension: "coding",
    version: "v2",
    taskCount: 1,
    sourceId: "local-manual-eval",
  },
];

/** Evaluation with uncertainty + provenance (extends shared Evaluation). */
export interface DemoEvaluation extends Evaluation {
  ciLow: number;
  ciHigh: number;
  runs: number;
  variance: number;
  sourceId: string;
  benchmarkVersion: string;
  methodologyVersion: string;
}
export const EVALUATIONS: DemoEvaluation[] = [
  {
    modelSlug: "space-bunny-free",
    benchmarkSlug: "zombie-flamethrower-showdown",
    raw: 91,
    normalized: 91,
    ciLow: 91,
    ciHigh: 91,
    runs: 1,
    variance: 0,
    evaluatedAt: "2026-09-26",
    sourceId: "local-manual-eval",
    benchmarkVersion: "v2",
    methodologyVersion: "v2",
  },
  {
    modelSlug: "deepseek-v4-1-flash",
    benchmarkSlug: "zombie-flamethrower-showdown",
    raw: 80,
    normalized: 80,
    ciLow: 80,
    ciHigh: 80,
    runs: 1,
    variance: 0,
    evaluatedAt: "2026-09-26",
    sourceId: "local-manual-eval",
    benchmarkVersion: "v2",
    methodologyVersion: "v2",
  },
  {
    modelSlug: "gpt-5-6-luna",
    benchmarkSlug: "zombie-flamethrower-showdown",
    raw: 62,
    normalized: 62,
    ciLow: 62,
    ciHigh: 62,
    runs: 1,
    variance: 0,
    evaluatedAt: "2026-09-26",
    sourceId: "local-manual-eval",
    benchmarkVersion: "v2",
    methodologyVersion: "v2",
  },
  {
    modelSlug: "gpt-6-sol",
    benchmarkSlug: "zombie-flamethrower-showdown",
    raw: 58,
    normalized: 58,
    ciLow: 58,
    ciHigh: 58,
    runs: 1,
    variance: 0,
    evaluatedAt: "2026-09-26",
    sourceId: "local-manual-eval",
    benchmarkVersion: "v2",
    methodologyVersion: "v2",
  },
  {
    modelSlug: "muse-spark-1-3",
    benchmarkSlug: "zombie-flamethrower-showdown",
    raw: 52,
    normalized: 52,
    ciLow: 52,
    ciHigh: 52,
    runs: 1,
    variance: 0,
    evaluatedAt: "2026-09-26",
    sourceId: "local-manual-eval",
    benchmarkVersion: "v2",
    methodologyVersion: "v2",
  },
  {
    modelSlug: "gpt-6-luna",
    benchmarkSlug: "zombie-flamethrower-showdown",
    raw: 51,
    normalized: 51,
    ciLow: 51,
    ciHigh: 51,
    runs: 1,
    variance: 0,
    evaluatedAt: "2026-09-26",
    sourceId: "local-manual-eval",
    benchmarkVersion: "v2",
    methodologyVersion: "v2",
  },
  {
    modelSlug: "gemini-3-8-flash",
    benchmarkSlug: "zombie-flamethrower-showdown",
    raw: 43,
    normalized: 43,
    ciLow: 43,
    ciHigh: 43,
    runs: 1,
    variance: 0,
    evaluatedAt: "2026-09-26",
    sourceId: "local-manual-eval",
    benchmarkVersion: "v2",
    methodologyVersion: "v2",
  },
  {
    modelSlug: "gemini-pro-agent",
    benchmarkSlug: "zombie-flamethrower-showdown",
    raw: 24,
    normalized: 24,
    ciLow: 24,
    ciHigh: 24,
    runs: 1,
    variance: 0,
    evaluatedAt: "2026-09-26",
    sourceId: "local-manual-eval",
    benchmarkVersion: "v2",
    methodologyVersion: "v2",
  }
];

export interface SpeedEntry {
  modelSlug: string;
  test: SpeedTest;
  runs: number;
}
/** No speed runs measured yet — empty until a harness reports. */
export const SPEED_TESTS: SpeedEntry[] = [];

export interface PriceEntry {
  modelSlug: string;
  price: PriceSnapshot;
  sourceId: string;
}
/** Prices not measured — nulls render as "Not measured". */
export const PRICE_SNAPSHOTS: PriceEntry[] = [
  {
    modelSlug: "muse-spark-1-3",
    price: {
      inputPer1M: null,
      outputPer1M: null,
      currency: "USD",
      effectiveDate: "2026-09-26",
      source: "local-manual-eval",
    },
    sourceId: "local-manual-eval",
  },
  {
    modelSlug: "gemini-3-8-flash",
    price: {
      inputPer1M: null,
      outputPer1M: null,
      currency: "USD",
      effectiveDate: "2026-09-26",
      source: "local-manual-eval",
    },
    sourceId: "local-manual-eval",
  },
  {
    modelSlug: "deepseek-v4-1-flash",
    price: {
      inputPer1M: null,
      outputPer1M: null,
      currency: "USD",
      effectiveDate: "2026-09-26",
      source: "local-manual-eval",
    },
    sourceId: "local-manual-eval",
  },
  {
    modelSlug: "gpt-5-6-luna",
    price: {
      inputPer1M: null,
      outputPer1M: null,
      currency: "USD",
      effectiveDate: "2026-09-26",
      source: "local-manual-eval",
    },
    sourceId: "local-manual-eval",
  },
  {
    modelSlug: "gpt-6-luna",
    price: {
      inputPer1M: null,
      outputPer1M: null,
      currency: "USD",
      effectiveDate: "2026-09-26",
      source: "local-manual-eval",
    },
    sourceId: "local-manual-eval",
  },
  {
    modelSlug: "gpt-6-sol",
    price: {
      inputPer1M: null,
      outputPer1M: null,
      currency: "USD",
      effectiveDate: "2026-09-26",
      source: "local-manual-eval",
    },
    sourceId: "local-manual-eval",
  },
  {
    modelSlug: "space-bunny-free",
    price: {
      inputPer1M: null,
      outputPer1M: null,
      currency: "USD",
      effectiveDate: "2026-09-26",
      source: "local-manual-eval",
    },
    sourceId: "local-manual-eval",
  },
  {
    modelSlug: "gemini-pro-agent",
    price: {
      inputPer1M: null,
      outputPer1M: null,
      currency: "USD",
      effectiveDate: "2026-09-26",
      source: "local-manual-eval",
    },
    sourceId: "local-manual-eval",
  },
];

export interface SnapshotEntry {
  modelSlug: string;
  snapshot: ScoreSnapshot;
  evalCount: number;
  imputedDims: string[];
  methodologyVersion: string;
}
export const SCORE_SNAPSHOTS: SnapshotEntry[] = [
  {
    modelSlug: "space-bunny-free",
    snapshot: {
      overall: 91,
      reasoning: null,
      coding: null,
      math: null,
      knowledge: null,
      vision: null,
      agentic: null,
      longContext: null,
      efficiency: null,
      bdxScore: 91,
      evaluatedAt: "2026-09-26",
      benchmark: "zombie-flamethrower-showdown",
    },
    evalCount: 1,
    imputedDims: [],
    methodologyVersion: "v2",
  },
  {
    modelSlug: "deepseek-v4-1-flash",
    snapshot: {
      overall: 80,
      reasoning: null,
      coding: null,
      math: null,
      knowledge: null,
      vision: null,
      agentic: null,
      longContext: null,
      efficiency: null,
      bdxScore: 80,
      evaluatedAt: "2026-09-26",
      benchmark: "zombie-flamethrower-showdown",
    },
    evalCount: 1,
    imputedDims: [],
    methodologyVersion: "v2",
  },
  {
    modelSlug: "gpt-5-6-luna",
    snapshot: {
      overall: 62,
      reasoning: null,
      coding: null,
      math: null,
      knowledge: null,
      vision: null,
      agentic: null,
      longContext: null,
      efficiency: null,
      bdxScore: 62,
      evaluatedAt: "2026-09-26",
      benchmark: "zombie-flamethrower-showdown",
    },
    evalCount: 1,
    imputedDims: [],
    methodologyVersion: "v2",
  },
  {
    modelSlug: "gpt-6-sol",
    snapshot: {
      overall: 58,
      reasoning: null,
      coding: null,
      math: null,
      knowledge: null,
      vision: null,
      agentic: null,
      longContext: null,
      efficiency: null,
      bdxScore: 58,
      evaluatedAt: "2026-09-26",
      benchmark: "zombie-flamethrower-showdown",
    },
    evalCount: 1,
    imputedDims: [],
    methodologyVersion: "v2",
  },
  {
    modelSlug: "muse-spark-1-3",
    snapshot: {
      overall: 52,
      reasoning: null,
      coding: null,
      math: null,
      knowledge: null,
      vision: null,
      agentic: null,
      longContext: null,
      efficiency: null,
      bdxScore: 52,
      evaluatedAt: "2026-09-26",
      benchmark: "zombie-flamethrower-showdown",
    },
    evalCount: 1,
    imputedDims: [],
    methodologyVersion: "v2",
  },
  {
    modelSlug: "gpt-6-luna",
    snapshot: {
      overall: 51,
      reasoning: null,
      coding: null,
      math: null,
      knowledge: null,
      vision: null,
      agentic: null,
      longContext: null,
      efficiency: null,
      bdxScore: 51,
      evaluatedAt: "2026-09-26",
      benchmark: "zombie-flamethrower-showdown",
    },
    evalCount: 1,
    imputedDims: [],
    methodologyVersion: "v2",
  },
  {
    modelSlug: "gemini-3-8-flash",
    snapshot: {
      overall: 43,
      reasoning: null,
      coding: null,
      math: null,
      knowledge: null,
      vision: null,
      agentic: null,
      longContext: null,
      efficiency: null,
      bdxScore: 43,
      evaluatedAt: "2026-09-26",
      benchmark: "zombie-flamethrower-showdown",
    },
    evalCount: 1,
    imputedDims: [],
    methodologyVersion: "v2",
  },
  {
    modelSlug: "gemini-pro-agent",
    snapshot: {
      overall: 24,
      reasoning: null,
      coding: null,
      math: null,
      knowledge: null,
      vision: null,
      agentic: null,
      longContext: null,
      efficiency: null,
      bdxScore: 24,
      evaluatedAt: "2026-09-26",
      benchmark: "zombie-flamethrower-showdown",
    },
    evalCount: 1,
    imputedDims: [],
    methodologyVersion: "v2",
  }
];

export const SOURCES: Source[] = [
  {
    id: "local-manual-eval",
    label: "Local manual evaluation — Zombie Flamethrower Showdown",
    kind: "manual",
    retrievedAt: "2026-09-26",
    notes:
      "Showdown Score v2 (strict source-code audit, 5 dimensions x 20 pts: Controls and Mobility, Combat Physics, Content and Enemy Variety, Audio and Sound Design, Visual Polish and Game Feel). Every build was re-audited at implementation level; features present only as on-screen strings, comments, or unreachable code earn zero. Scores: Space Bunny Free 91 (EMBER DEAD, /play/ember-dead); DeepSeek V4.1 Flash 80 (PYRE, /play/pyre-burn-horde; second build INFERNO DEAD /play/inferno-dead scored 61); GPT Luna 5.6 62 (/play/firebreak-night-shift); GPT 6 Sol 58 (/play/cinderline); Muse Spark 1.3 52 (/play/pyro-vs-zombies); GPT Luna 6 51 (/play/emberfall); Gemini 3.8 Flash 43 (/play/pyroclasm-inferno); Gemini Pro Agent 24 (/play/zombie-fire-survival, zero audio verified).",
  },
];

export const MODELS: Model[] = [
  {
    id: "bdx-ai/go-muse-spark-1.3-contributor",
    slug: "muse-spark-1-3",
    name: "Muse Spark 1.3",
    family: "Spark",
    provider: "bdx-ai",
    context: null,
    released: null,
    openWeights: false,
    capabilities: {
      vision: false,
      tools: false,
      audio: false,
      multimodal: false,
    },
    prices: {
      inputPer1M: null,
      outputPer1M: null,
      currency: "USD",
      effectiveDate: "2026-09-26",
      source: "local-manual-eval",
    },
    scores: {
      overall: 52,
      reasoning: null,
      coding: null,
      math: null,
      knowledge: null,
      vision: null,
      agentic: null,
      longContext: null,
      efficiency: null,
      bdxScore: 52,
      evaluatedAt: "2026-09-17",
      benchmark: "zombie-flamethrower-showdown",
    },
  },
  {
    id: "bdx-ai/gemini-3.8-flash-tiered",
    slug: "gemini-3-8-flash",
    name: "Gemini 3.8 Flash",
    family: "Gemini",
    provider: "bdx-ai",
    context: null,
    released: null,
    openWeights: false,
    capabilities: {
      vision: false,
      tools: false,
      audio: false,
      multimodal: false,
    },
    prices: {
      inputPer1M: null,
      outputPer1M: null,
      currency: "USD",
      effectiveDate: "2026-09-26",
      source: "local-manual-eval",
    },
    scores: {
      overall: 43,
      reasoning: null,
      coding: null,
      math: null,
      knowledge: null,
      vision: null,
      agentic: null,
      longContext: null,
      efficiency: null,
      bdxScore: 43,
      evaluatedAt: "2026-09-26",
      benchmark: "zombie-flamethrower-showdown",
    },
  },
  {
    id: "bdx-ai/deepseek-v4.1-flash",
    slug: "deepseek-v4-1-flash",
    name: "DeepSeek V4.1 Flash",
    family: "DeepSeek",
    provider: "bdx-ai",
    context: null,
    released: null,
    openWeights: false,
    capabilities: {
      vision: false,
      tools: false,
      audio: false,
      multimodal: false,
    },
    prices: {
      inputPer1M: null,
      outputPer1M: null,
      currency: "USD",
      effectiveDate: "2026-09-26",
      source: "local-manual-eval",
    },
    scores: {
      overall: 80,
      reasoning: null,
      coding: null,
      math: null,
      knowledge: null,
      vision: null,
      agentic: null,
      longContext: null,
      efficiency: null,
      bdxScore: 80,
      evaluatedAt: "2026-09-26",
      benchmark: "zombie-flamethrower-showdown",
    },
  },
  {
    id: "bdx-ai/gpt-5.6-luna",
    slug: "gpt-5-6-luna",
    name: "GPT Luna 5.6",
    family: "GPT Luna",
    provider: "bdx-ai",
    context: null,
    released: null,
    openWeights: false,
    capabilities: {
      vision: false,
      tools: false,
      audio: false,
      multimodal: false,
    },
    prices: {
      inputPer1M: null,
      outputPer1M: null,
      currency: "USD",
      effectiveDate: "2026-09-26",
      source: "local-manual-eval",
    },
    scores: {
      overall: 62,
      reasoning: null,
      coding: null,
      math: null,
      knowledge: null,
      vision: null,
      agentic: null,
      longContext: null,
      efficiency: null,
      bdxScore: 62,
      evaluatedAt: "2026-09-26",
      benchmark: "zombie-flamethrower-showdown",
    },
  },
  {
    id: "opencode/space-bunny-free",
    slug: "space-bunny-free",
    name: "Space Bunny Free",
    family: "OpenCode",
    provider: "opencode",
    context: null,
    released: null,
    openWeights: false,
    capabilities: {
      vision: false,
      tools: false,
      audio: false,
      multimodal: false,
    },
    prices: {
      inputPer1M: null,
      outputPer1M: null,
      currency: "USD",
      effectiveDate: "2026-09-26",
      source: "local-manual-eval",
    },
    scores: {
      overall: 91,
      reasoning: null,
      coding: null,
      math: null,
      knowledge: null,
      vision: null,
      agentic: null,
      longContext: null,
      efficiency: null,
      bdxScore: 91,
      evaluatedAt: "2026-09-26",
      benchmark: "zombie-flamethrower-showdown",
    },
  },
  {
    id: "bdx-ai/gemini-pro-agent",
    slug: "gemini-pro-agent",
    name: "Gemini Pro Agent",
    family: "Gemini Pro",
    provider: "bdx-ai",
    context: 1048576,
    released: null,
    openWeights: false,
    capabilities: {
      vision: true,
      tools: true,
      audio: false,
      multimodal: true,
    },
    prices: {
      inputPer1M: null,
      outputPer1M: null,
      currency: "USD",
      effectiveDate: "2026-09-26",
      source: "local-manual-eval",
    },
    scores: {
      overall: 24,
      reasoning: null,
      coding: null,
      math: null,
      knowledge: null,
      vision: null,
      agentic: null,
      longContext: null,
      efficiency: null,
      bdxScore: 24,
      evaluatedAt: "2026-09-26",
      benchmark: "zombie-flamethrower-showdown",
    },
  },
  {
    id: "bdx-ai/gpt-6-sol",
    slug: "gpt-6-sol",
    name: "GPT 6 Sol",
    family: "GPT Sol",
    provider: "bdx-ai",
    context: null,
    released: null,
    openWeights: false,
    capabilities: {
      vision: false,
      tools: false,
      audio: false,
      multimodal: false,
    },
    prices: {
      inputPer1M: null,
      outputPer1M: null,
      currency: "USD",
      effectiveDate: "2026-09-26",
      source: "local-manual-eval",
    },
    scores: {
      overall: 58,
      reasoning: null,
      coding: null,
      math: null,
      knowledge: null,
      vision: null,
      agentic: null,
      longContext: null,
      efficiency: null,
      bdxScore: 58,
      evaluatedAt: "2026-09-26",
      benchmark: "zombie-flamethrower-showdown",
    },
  },
  {
    id: "bdx-ai/gpt-6-luna",
    slug: "gpt-6-luna",
    name: "GPT Luna 6",
    family: "GPT Luna",
    provider: "bdx-ai",
    context: null,
    released: null,
    openWeights: false,
    capabilities: {
      vision: false,
      tools: false,
      audio: false,
      multimodal: false,
    },
    prices: {
      inputPer1M: null,
      outputPer1M: null,
      currency: "USD",
      effectiveDate: "2026-09-26",
      source: "local-manual-eval",
    },
    scores: {
      overall: 51,
      reasoning: null,
      coding: null,
      math: null,
      knowledge: null,
      vision: null,
      agentic: null,
      longContext: null,
      efficiency: null,
      bdxScore: 51,
      evaluatedAt: "2026-09-26",
      benchmark: "zombie-flamethrower-showdown",
    },
  },
];

/** Trend snapshots: mean Showdown Score per round. v1 rounds are withdrawn —
 *  the v1 scoring method was found unreliable and replaced by the v2 audit. */
export const TRENDS: TrendPoint[] = [
  {
    date: "2026-09-26",
    avgBdxScore: 57.6,
    modelCount: 8,
  },
];

/** Homepage "top models" — only Overall is measured (Showdown Score). */
export const DEMO_TOP_MODELS_BY_CATEGORY: Record<string, HomeModel[]> = {
  Overall: [
    {
      id: "space-bunny-free",
      name: "Space Bunny Free",
      provider: "opencode",
      score: 91,
      delta: 0,
      pricePer1M: null,
      speedTps: null,
      contextK: null,
    },
    {
      id: "deepseek-v4-1-flash",
      name: "DeepSeek V4.1 Flash",
      provider: "bdx-ai",
      score: 80,
      delta: 0,
      pricePer1M: null,
      speedTps: null,
      contextK: null,
    },
    {
      id: "gpt-5-6-luna",
      name: "GPT Luna 5.6",
      provider: "bdx-ai",
      score: 62,
      delta: 0,
      pricePer1M: null,
      speedTps: null,
      contextK: null,
    },
    {
      id: "gpt-6-sol",
      name: "GPT 6 Sol",
      provider: "bdx-ai",
      score: 58,
      delta: 0,
      pricePer1M: null,
      speedTps: null,
      contextK: null,
    },
    {
      id: "muse-spark-1-3",
      name: "Muse Spark 1.3",
      provider: "bdx-ai",
      score: 52,
      delta: 0,
      pricePer1M: null,
      speedTps: null,
      contextK: null,
    },
    {
      id: "gpt-6-luna",
      name: "GPT Luna 6",
      provider: "bdx-ai",
      score: 51,
      delta: 0,
      pricePer1M: null,
      speedTps: null,
      contextK: null,
    },
    {
      id: "gemini-3-8-flash",
      name: "Gemini 3.8 Flash",
      provider: "bdx-ai",
      score: 43,
      delta: 0,
      pricePer1M: null,
      speedTps: null,
      contextK: null,
    },
    {
      id: "gemini-pro-agent",
      name: "Gemini Pro Agent",
      provider: "bdx-ai",
      score: 24,
      delta: 0,
      pricePer1M: null,
      speedTps: null,
      contextK: null,
    }
  ],
};

export const DEMO_CATEGORY_LEADERS: CategoryLeader[] = [
  {
    category: "Showdown",
    model: "Space Bunny Free",
    provider: "opencode",
    score: 91,
  },
];

/** No verified release dates — empty until publishers confirm. */
export const DEMO_LATEST_MODELS: HomeModel[] = [];

/** No measured prices — empty until price runs land. */
export const DEMO_PRICE_POINTS: PricePoint[] = [];

export const DEMO_BENCHMARKS: BenchmarkCoverage[] = [
  {
    name: "Zombie Flamethrower Showdown",
    tasks: 1,
    kind: "game-build",
  },
];

export const DEMO_TREND_SERIES: HomeTrendPoint[] = [
  {
    label: "Sep 26",
    topScore: 91,
    medianScore: 60,
  },
];

export const DEMO_GLOBAL_STATS: GlobalStats = {
  modelsTracked: 8,
  benchmarks: 1,
  evalRuns: 8,
  providers: 2,
  datasetRefresh: "2026-09-26",
};

/** Canonical leaderboard rows (Showdown Score desc). */
export const demoLeaderboard: LeaderboardRow[] = [
  {
    rank: 1,
    modelSlug: "space-bunny-free",
    modelName: "Space Bunny Free",
    provider: "opencode",
    bdxScore: 91,
    overall: 91,
    pricePer1MBlended: null,
  },
  {
    rank: 2,
    modelSlug: "deepseek-v4-1-flash",
    modelName: "DeepSeek V4.1 Flash",
    provider: "bdx-ai",
    bdxScore: 80,
    overall: 80,
    pricePer1MBlended: null,
  },
  {
    rank: 3,
    modelSlug: "gpt-5-6-luna",
    modelName: "GPT Luna 5.6",
    provider: "bdx-ai",
    bdxScore: 62,
    overall: 62,
    pricePer1MBlended: null,
  },
  {
    rank: 4,
    modelSlug: "gpt-6-sol",
    modelName: "GPT 6 Sol",
    provider: "bdx-ai",
    bdxScore: 58,
    overall: 58,
    pricePer1MBlended: null,
  },
  {
    rank: 5,
    modelSlug: "muse-spark-1-3",
    modelName: "Muse Spark 1.3",
    provider: "bdx-ai",
    bdxScore: 52,
    overall: 52,
    pricePer1MBlended: null,
  },
  {
    rank: 6,
    modelSlug: "gpt-6-luna",
    modelName: "GPT Luna 6",
    provider: "bdx-ai",
    bdxScore: 51,
    overall: 51,
    pricePer1MBlended: null,
  },
  {
    rank: 7,
    modelSlug: "gemini-3-8-flash",
    modelName: "Gemini 3.8 Flash",
    provider: "bdx-ai",
    bdxScore: 43,
    overall: 43,
    pricePer1MBlended: null,
  },
  {
    rank: 8,
    modelSlug: "gemini-pro-agent",
    modelName: "Gemini Pro Agent",
    provider: "bdx-ai",
    bdxScore: 24,
    overall: 24,
    pricePer1MBlended: null,
  }
];

/** Freshness block returned by every API route. */
export interface Freshness {
  evalDate: string;
  benchmarkVersions: Record<string, string>;
  methodologyVersion: string;
  retrievedDate: string;
  refreshLabel: string;
}
export const FRESHNESS: Freshness = {
  evalDate: "2026-09-26",
  benchmarkVersions: {
    "zombie-flamethrower-showdown": "v2",
  },
  methodologyVersion: "v2",
  retrievedDate: "2026-09-26",
  refreshLabel: "2026-09-26",
};

export interface ProvenanceItem {
  sourceId: string;
  label: string;
  kind: "vendor" | "benchmark" | "harness" | "manual";
  url?: string;
  retrievedAt: string;
  notes: string;
}
/** Provenance block returned by every API route. */
export const PROVENANCE: ProvenanceItem[] = [
  {
    sourceId: "local-manual-eval",
    label: "Local manual evaluation — Zombie Flamethrower Showdown",
    kind: "manual",
    retrievedAt: "2026-09-26",
    notes:
      "Showdown Score v2 (strict source-code audit). Five dimensions, 20 points each: Controls and Mobility, Combat Physics and Weapon Mechanics, Content and Enemy Variety, Audio and Sound Design, Visual Polish and Game Feel. A build with no audio scores 0 on audio. A feature earns points only when it is genuinely implemented and reachable; on-screen strings, comments, and dead code score zero. Ten builds audited. Scores: Space Bunny Free 91 (EMBER DEAD, /play/ember-dead); DeepSeek V4.1 Flash 80 (PYRE, /play/pyre-burn-horde; second build INFERNO DEAD /play/inferno-dead scored 61); GPT Luna 5.6 62 (/play/firebreak-night-shift); GPT 6 Sol 58 (/play/cinderline); Muse Spark 1.3 52 (/play/pyro-vs-zombies); GPT Luna 6 51 (/play/emberfall); Gemini 3.8 Flash 43 (/play/pyroclasm-inferno); Gemini Pro Agent 24 (/play/zombie-fire-survival, zero audio verified). The previous v1 method credited claimed features that were absent from the code and reported scores up to 40 points too high; v1 has been withdrawn.",
  },
];

/** Uncertainty block: single manual run per model, zero-width intervals. */
export interface UncertaintySummary {
  methodologyVersion: string;
  evalCount: number;
  avgCiHalfWidth: number;
  minRuns: number;
  maxRuns: number;
}
export const UNCERTAINTY: UncertaintySummary = {
  methodologyVersion: "v2",
  evalCount: 8,
  avgCiHalfWidth: 0,
  minRuns: 1,
  maxRuns: 1,
};

/** Dataset-level meta envelope shared by API routes. */
export interface DatasetMeta {
  isLocalEvaluation: true;
  freshness: Freshness;
  provenance: ProvenanceItem[];
  uncertainty: UncertaintySummary;
}
export const DATASET_META: DatasetMeta = {
  isLocalEvaluation: true,
  freshness: FRESHNESS,
  provenance: PROVENANCE,
  uncertainty: UNCERTAINTY,
};
