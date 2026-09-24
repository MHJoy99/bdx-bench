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
export const DEMO_EVAL_AT = "2026-09-23" as const;

/** Human label for every Showdown Score surfacing. */
export const SHOWDOWN_SCORE_LABEL =
  "Showdown Score (manual game-build evaluation)" as const;

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
    "Manual game-build showdown: one shared prompt, binary playability check + feature checklist, community vote open",
  promptTitle: "Zombie flamethrower survival game",
  promptBody:
    "make me a video game where i am killing zombies with fire and all please? a nice wonderfull game i can play for fun okay?",
  evalDate: "2026-09-17",
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
      "Manual game-build showdown: one shared prompt, binary playability check + feature checklist, community vote open. Scores are Showdown Score (manual game-build evaluation).",
    category: "coding",
    weight: 1,
    unit: "Showdown Score 0-100",
    higherIsBetter: true,
    dimension: "coding",
    version: "v1",
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
    modelSlug: "deepseek-v4-1-flash",
    benchmarkSlug: "zombie-flamethrower-showdown",
    raw: 94,
    normalized: 94,
    ciLow: 94,
    ciHigh: 94,
    runs: 1,
    variance: 0,
    evaluatedAt: "2026-09-18",
    sourceId: "local-manual-eval",
    benchmarkVersion: "v1",
    methodologyVersion: "v1",
  },
  {
    modelSlug: "space-bunny-free",
    benchmarkSlug: "zombie-flamethrower-showdown",
    raw: 93,
    normalized: 93,
    ciLow: 93,
    ciHigh: 93,
    runs: 1,
    variance: 0,
    evaluatedAt: "2026-09-23",
    sourceId: "local-manual-eval",
    benchmarkVersion: "v1",
    methodologyVersion: "v1",
  },
  {
    modelSlug: "gpt-6-sol",
    benchmarkSlug: "zombie-flamethrower-showdown",
    raw: 91,
    normalized: 91,
    ciLow: 91,
    ciHigh: 91,
    runs: 1,
    variance: 0,
    evaluatedAt: "2026-09-22",
    sourceId: "local-manual-eval",
    benchmarkVersion: "v1",
    methodologyVersion: "v1",
  },
  {
    modelSlug: "gpt-5-6-luna",
    benchmarkSlug: "zombie-flamethrower-showdown",
    raw: 88,
    normalized: 88,
    ciLow: 88,
    ciHigh: 88,
    runs: 1,
    variance: 0,
    evaluatedAt: "2026-09-18",
    sourceId: "local-manual-eval",
    benchmarkVersion: "v1",
    methodologyVersion: "v1",
  },
  {
    modelSlug: "gemini-3-8-flash",
    benchmarkSlug: "zombie-flamethrower-showdown",
    raw: 86,
    normalized: 86,
    ciLow: 86,
    ciHigh: 86,
    runs: 1,
    variance: 0,
    evaluatedAt: "2026-09-17",
    sourceId: "local-manual-eval",
    benchmarkVersion: "v1",
    methodologyVersion: "v1",
  },
  {
    modelSlug: "muse-spark-1-3",
    benchmarkSlug: "zombie-flamethrower-showdown",
    raw: 82,
    normalized: 82,
    ciLow: 82,
    ciHigh: 82,
    runs: 1,
    variance: 0,
    evaluatedAt: "2026-09-17",
    sourceId: "local-manual-eval",
    benchmarkVersion: "v1",
    methodologyVersion: "v1",
  },
  {
    modelSlug: "gpt-6-luna",
    benchmarkSlug: "zombie-flamethrower-showdown",
    raw: 79,
    normalized: 79,
    ciLow: 79,
    ciHigh: 79,
    runs: 1,
    variance: 0,
    evaluatedAt: "2026-09-22",
    sourceId: "local-manual-eval",
    benchmarkVersion: "v1",
    methodologyVersion: "v1",
  },
  {
    modelSlug: "gemini-pro-agent",
    benchmarkSlug: "zombie-flamethrower-showdown",
    raw: 55,
    normalized: 55,
    ciLow: 55,
    ciHigh: 55,
    runs: 1,
    variance: 0,
    evaluatedAt: "2026-09-25",
    sourceId: "local-manual-eval",
    benchmarkVersion: "v1",
    methodologyVersion: "v1",
  },
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
      effectiveDate: "2026-09-17",
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
      effectiveDate: "2026-09-17",
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
      effectiveDate: "2026-09-18",
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
      effectiveDate: "2026-09-18",
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
      effectiveDate: "2026-09-22",
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
      effectiveDate: "2026-09-22",
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
      effectiveDate: "2026-09-23",
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
      effectiveDate: "2026-09-25",
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
    modelSlug: "deepseek-v4-1-flash",
    snapshot: {
      overall: 94,
      reasoning: null,
      coding: null,
      math: null,
      knowledge: null,
      vision: null,
      agentic: null,
      longContext: null,
      efficiency: null,
      bdxScore: 94,
      evaluatedAt: "2026-09-18",
      benchmark: "zombie-flamethrower-showdown",
    },
    evalCount: 1,
    imputedDims: [],
    methodologyVersion: "v1",
  },
  {
    modelSlug: "space-bunny-free",
    snapshot: {
      overall: 93,
      reasoning: null,
      coding: null,
      math: null,
      knowledge: null,
      vision: null,
      agentic: null,
      longContext: null,
      efficiency: null,
      bdxScore: 93,
      evaluatedAt: "2026-09-23",
      benchmark: "zombie-flamethrower-showdown",
    },
    evalCount: 1,
    imputedDims: [],
    methodologyVersion: "v1",
  },
  {
    modelSlug: "gpt-6-sol",
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
      evaluatedAt: "2026-09-22",
      benchmark: "zombie-flamethrower-showdown",
    },
    evalCount: 1,
    imputedDims: [],
    methodologyVersion: "v1",
  },
  {
    modelSlug: "gpt-5-6-luna",
    snapshot: {
      overall: 88,
      reasoning: null,
      coding: null,
      math: null,
      knowledge: null,
      vision: null,
      agentic: null,
      longContext: null,
      efficiency: null,
      bdxScore: 88,
      evaluatedAt: "2026-09-18",
      benchmark: "zombie-flamethrower-showdown",
    },
    evalCount: 1,
    imputedDims: [],
    methodologyVersion: "v1",
  },
  {
    modelSlug: "gemini-3-8-flash",
    snapshot: {
      overall: 86,
      reasoning: null,
      coding: null,
      math: null,
      knowledge: null,
      vision: null,
      agentic: null,
      longContext: null,
      efficiency: null,
      bdxScore: 86,
      evaluatedAt: "2026-09-17",
      benchmark: "zombie-flamethrower-showdown",
    },
    evalCount: 1,
    imputedDims: [],
    methodologyVersion: "v1",
  },
  {
    modelSlug: "muse-spark-1-3",
    snapshot: {
      overall: 82,
      reasoning: null,
      coding: null,
      math: null,
      knowledge: null,
      vision: null,
      agentic: null,
      longContext: null,
      efficiency: null,
      bdxScore: 82,
      evaluatedAt: "2026-09-17",
      benchmark: "zombie-flamethrower-showdown",
    },
    evalCount: 1,
    imputedDims: [],
    methodologyVersion: "v1",
  },
  {
    modelSlug: "gpt-6-luna",
    snapshot: {
      overall: 79,
      reasoning: null,
      coding: null,
      math: null,
      knowledge: null,
      vision: null,
      agentic: null,
      longContext: null,
      efficiency: null,
      bdxScore: 79,
      evaluatedAt: "2026-09-22",
      benchmark: "zombie-flamethrower-showdown",
    },
    evalCount: 1,
    imputedDims: [],
    methodologyVersion: "v1",
  },
  {
    modelSlug: "gemini-pro-agent",
    snapshot: {
      overall: 55,
      reasoning: null,
      coding: null,
      math: null,
      knowledge: null,
      vision: null,
      agentic: null,
      longContext: null,
      efficiency: null,
      bdxScore: 55,
      evaluatedAt: "2026-09-25",
      benchmark: "zombie-flamethrower-showdown",
    },
    evalCount: 1,
    imputedDims: [],
    methodologyVersion: "v1",
  },
];

export const SOURCES: Source[] = [
  {
    id: "local-manual-eval",
    label: "Local manual evaluation — Zombie Flamethrower Showdown",
    kind: "manual",
    retrievedAt: "2026-09-25",
    notes:
      "Showdown Score (manual game-build evaluation). One shared prompt, binary playability check + feature checklist. Playable builds: /play/pyre-burn-horde, /play/space-bunny, /play/cinderline, /play/firebreak-night-shift, /play/pyroclasm-inferno, /play/pyro-vs-zombies, /play/emberfall, and /play/zombie-fire-survival. DeepSeek V4.1 Flash scored 94.0; Space Bunny Free scored 93.0; GPT 6 Sol scored 91.0; GPT Luna 5.6 scored 88.0; Gemini 3.8 Flash scored 86.0; Muse Spark 1.3 scored 82.0; GPT Luna 6 scored 79.0; Gemini Pro Agent scored 55.0.",
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
      effectiveDate: "2026-09-17",
      source: "local-manual-eval",
    },
    scores: {
      overall: 82,
      reasoning: null,
      coding: null,
      math: null,
      knowledge: null,
      vision: null,
      agentic: null,
      longContext: null,
      efficiency: null,
      bdxScore: 82,
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
      effectiveDate: "2026-09-17",
      source: "local-manual-eval",
    },
    scores: {
      overall: 86,
      reasoning: null,
      coding: null,
      math: null,
      knowledge: null,
      vision: null,
      agentic: null,
      longContext: null,
      efficiency: null,
      bdxScore: 86,
      evaluatedAt: "2026-09-17",
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
      effectiveDate: "2026-09-18",
      source: "local-manual-eval",
    },
    scores: {
      overall: 94,
      reasoning: null,
      coding: null,
      math: null,
      knowledge: null,
      vision: null,
      agentic: null,
      longContext: null,
      efficiency: null,
      bdxScore: 94,
      evaluatedAt: "2026-09-18",
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
      effectiveDate: "2026-09-18",
      source: "local-manual-eval",
    },
    scores: {
      overall: 88,
      reasoning: null,
      coding: null,
      math: null,
      knowledge: null,
      vision: null,
      agentic: null,
      longContext: null,
      efficiency: null,
      bdxScore: 88,
      evaluatedAt: "2026-09-18",
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
      effectiveDate: "2026-09-23",
      source: "local-manual-eval",
    },
    scores: {
      overall: 93,
      reasoning: null,
      coding: null,
      math: null,
      knowledge: null,
      vision: null,
      agentic: null,
      longContext: null,
      efficiency: null,
      bdxScore: 93,
      evaluatedAt: "2026-09-23",
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
      effectiveDate: "2026-09-25",
      source: "local-manual-eval",
    },
    scores: {
      overall: 55,
      reasoning: null,
      coding: null,
      math: null,
      knowledge: null,
      vision: null,
      agentic: null,
      longContext: null,
      efficiency: null,
      bdxScore: 55,
      evaluatedAt: "2026-09-25",
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
      effectiveDate: "2026-09-22",
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
      evaluatedAt: "2026-09-22",
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
      effectiveDate: "2026-09-22",
      source: "local-manual-eval",
    },
    scores: {
      overall: 79,
      reasoning: null,
      coding: null,
      math: null,
      knowledge: null,
      vision: null,
      agentic: null,
      longContext: null,
      efficiency: null,
      bdxScore: 79,
      evaluatedAt: "2026-09-22",
      benchmark: "zombie-flamethrower-showdown",
    },
  },
];

/** Trend snapshots: mean Showdown Score per round. */
export const TRENDS: TrendPoint[] = [
  {
    date: "2026-09-17",
    avgBdxScore: 90,
    modelCount: 2,
  },
  {
    date: "2026-09-18",
    avgBdxScore: 91.25,
    modelCount: 4,
  },
  {
    date: "2026-09-22",
    avgBdxScore: 91.0,
    modelCount: 6,
  },
  {
    date: "2026-09-23",
    avgBdxScore: 91.36,
    modelCount: 7,
  },
  {
    date: "2026-09-25",
    avgBdxScore: 91.25,
    modelCount: 8,
  },
];

/** Homepage "top models" — only Overall is measured (Showdown Score). */
export const DEMO_TOP_MODELS_BY_CATEGORY: Record<string, HomeModel[]> = {
  Overall: [
    {
      id: "deepseek-v4-1-flash",
      name: "DeepSeek V4.1 Flash",
      provider: "bdx-ai",
      score: 94,
      delta: 0,
      pricePer1M: null,
      speedTps: null,
      contextK: null,
    },
    {
      id: "space-bunny-free",
      name: "Space Bunny Free",
      provider: "opencode",
      score: 93,
      delta: 0,
      pricePer1M: null,
      speedTps: null,
      contextK: null,
    },
    {
      id: "gpt-6-sol",
      name: "GPT 6 Sol",
      provider: "bdx-ai",
      score: 91,
      delta: 0,
      pricePer1M: null,
      speedTps: null,
      contextK: null,
    },
    {
      id: "gpt-5-6-luna",
      name: "GPT Luna 5.6",
      provider: "bdx-ai",
      score: 88,
      delta: 0,
      pricePer1M: null,
      speedTps: null,
      contextK: null,
    },
    {
      id: "gemini-3-8-flash",
      name: "Gemini 3.8 Flash",
      provider: "bdx-ai",
      score: 86,
      delta: 0,
      pricePer1M: null,
      speedTps: null,
      contextK: null,
    },
    {
      id: "muse-spark-1-3",
      name: "Muse Spark 1.3",
      provider: "bdx-ai",
      score: 82,
      delta: 0,
      pricePer1M: null,
      speedTps: null,
      contextK: null,
    },
    {
      id: "gpt-6-luna",
      name: "GPT Luna 6",
      provider: "bdx-ai",
      score: 79,
      delta: 0,
      pricePer1M: null,
      speedTps: null,
      contextK: null,
    },
    {
      id: "gemini-pro-agent",
      name: "Gemini Pro Agent",
      provider: "bdx-ai",
      score: 55,
      delta: 0,
      pricePer1M: null,
      speedTps: null,
      contextK: null,
    },
  ],
};

export const DEMO_CATEGORY_LEADERS: CategoryLeader[] = [
  {
    category: "Showdown",
    model: "DeepSeek V4.1 Flash",
    provider: "bdx-ai",
    score: 94,
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
    label: "Sep 17",
    topScore: 92,
    medianScore: 90,
  },
  {
    label: "Sep 18",
    topScore: 94,
    medianScore: 91.5,
  },
  {
    label: "Sep 22",
    topScore: 94,
    medianScore: 91,
  },
  {
    label: "Sep 23",
    topScore: 94,
    medianScore: 91.5,
  },
  {
    label: "Sep 25",
    topScore: 94,
    medianScore: 91.25,
  },
];

export const DEMO_GLOBAL_STATS: GlobalStats = {
  modelsTracked: 8,
  benchmarks: 1,
  evalRuns: 8,
  providers: 2,
  datasetRefresh: "2026-09-25",
};

/** Canonical leaderboard rows (Showdown Score desc). */
export const demoLeaderboard: LeaderboardRow[] = [
  {
    rank: 1,
    modelSlug: "deepseek-v4-1-flash",
    modelName: "DeepSeek V4.1 Flash",
    provider: "bdx-ai",
    bdxScore: 94,
    overall: 94,
    pricePer1MBlended: null,
  },
  {
    rank: 2,
    modelSlug: "space-bunny-free",
    modelName: "Space Bunny Free",
    provider: "opencode",
    bdxScore: 93,
    overall: 93,
    pricePer1MBlended: null,
  },
  {
    rank: 3,
    modelSlug: "gpt-6-sol",
    modelName: "GPT 6 Sol",
    provider: "bdx-ai",
    bdxScore: 91,
    overall: 91,
    pricePer1MBlended: null,
  },
  {
    rank: 4,
    modelSlug: "gpt-5-6-luna",
    modelName: "GPT Luna 5.6",
    provider: "bdx-ai",
    bdxScore: 88,
    overall: 88,
    pricePer1MBlended: null,
  },
  {
    rank: 5,
    modelSlug: "gemini-3-8-flash",
    modelName: "Gemini 3.8 Flash",
    provider: "bdx-ai",
    bdxScore: 86,
    overall: 86,
    pricePer1MBlended: null,
  },
  {
    rank: 6,
    modelSlug: "muse-spark-1-3",
    modelName: "Muse Spark 1.3",
    provider: "bdx-ai",
    bdxScore: 82,
    overall: 82,
    pricePer1MBlended: null,
  },
  {
    rank: 7,
    modelSlug: "gpt-6-luna",
    modelName: "GPT Luna 6",
    provider: "bdx-ai",
    bdxScore: 79,
    overall: 79,
    pricePer1MBlended: null,
  },
  {
    rank: 8,
    modelSlug: "gemini-pro-agent",
    modelName: "Gemini Pro Agent",
    provider: "bdx-ai",
    bdxScore: 55,
    overall: 55,
    pricePer1MBlended: null,
  },
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
  evalDate: "2026-09-25",
  benchmarkVersions: {
    "zombie-flamethrower-showdown": "v1",
  },
  methodologyVersion: "v1",
  retrievedDate: "2026-09-25",
  refreshLabel: "2026-09-25",
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
    retrievedAt: "2026-09-25",
    notes:
      "Showdown Score (manual game-build evaluation). One shared prompt, binary playability check + feature checklist. Playable builds: /play/pyro-vs-zombies, /play/pyroclasm-inferno, /play/pyre-burn-horde, /play/space-bunny, /play/cinderline, /play/firebreak-night-shift, /play/zombie-fire-survival, and /play/emberfall. DeepSeek V4.1 Flash scored 94; Space Bunny Free scored 93.5; Muse Spark 1.3 scored 92; GPT 6 Sol scored 91.5; GPT Luna 5.6 scored 91; Gemini Pro Agent scored 90.5; GPT Luna 6 scored 89.5; Gemini 3.8 Flash scored 88.",
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
  methodologyVersion: "v1",
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
