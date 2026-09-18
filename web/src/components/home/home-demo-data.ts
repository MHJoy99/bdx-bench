// Homepage aggregates — real local evaluation data (Zombie Flamethrower
// Showdown). Home components import the shared dataset first
// (`@/lib/data`) and read these aggregates for section-level rollups.
// Unmeasured fields stay null ("Not evaluated"/"Not measured").

export const DEMO_DATA_LABEL = "SHOWDOWN DATA" as const;

export const DEMO_DATASET_REFRESH_LABEL = "2026-09-18";

export interface HomeModel {
  id: string;
  name: string;
  provider: string;
  score: number;
  delta: number;
  pricePer1M: number | null;
  speedTps: number | null;
  contextK: number | null;
  releasedAt?: string;
  isNew?: boolean;
}

export interface GlobalStats {
  modelsTracked: number;
  benchmarks: number;
  evalRuns: number;
  providers: number;
  datasetRefresh: string;
}

export const DEMO_GLOBAL_STATS: GlobalStats = {
  modelsTracked: 4,
  benchmarks: 1,
  evalRuns: 4,
  providers: 1,
  datasetRefresh: DEMO_DATASET_REFRESH_LABEL,
};

// Only Overall (Showdown Score) is measured; per-dimension tabs intentionally
// have no rows until those dimensions are evaluated.
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
      id: "muse-spark-1-3",
      name: "Muse Spark 1.3",
      provider: "bdx-ai",
      score: 92,
      delta: 2,
      pricePer1M: null,
      speedTps: null,
      contextK: null,
    },
    {
      id: "gpt-5-6-luna",
      name: "GPT Luna 5.6",
      provider: "bdx-ai",
      score: 91,
      delta: 0,
      pricePer1M: null,
      speedTps: null,
      contextK: null,
    },
    {
      id: "gemini-3-8-flash",
      name: "Gemini 3.8 Flash",
      provider: "bdx-ai",
      score: 88,
      delta: -2,
      pricePer1M: null,
      speedTps: null,
      contextK: null,
    },
  ],
};

export const HOME_CATEGORIES = Object.keys(DEMO_TOP_MODELS_BY_CATEGORY);

export interface CategoryLeader {
  category: string;
  model: string;
  provider: string;
  score: number;
}

export const DEMO_CATEGORY_LEADERS: CategoryLeader[] = [
  { category: "Showdown", model: "DeepSeek V4.1 Flash", provider: "bdx-ai", score: 94 },
];

// No verified release dates — empty until publishers confirm.
export const DEMO_LATEST_MODELS: HomeModel[] = [];

export interface PricePoint {
  id: string;
  name: string;
  score: number;
  pricePer1M: number;
}

// No measured prices — empty until price runs land.
export const DEMO_PRICE_POINTS: PricePoint[] = [];

export interface BenchmarkCoverage {
  name: string;
  tasks: number;
  kind: string;
}

export const DEMO_BENCHMARKS: BenchmarkCoverage[] = [
  { name: "Zombie Flamethrower Showdown", tasks: 1, kind: "game-build" },
];

export interface TrendPoint {
  label: string;
  topScore: number;
  medianScore: number;
}

export const DEMO_TREND_SERIES: TrendPoint[] = [
  { label: "Sep 17", topScore: 92, medianScore: 90 },
  { label: "Sep 18", topScore: 94, medianScore: 91.5 },
];
