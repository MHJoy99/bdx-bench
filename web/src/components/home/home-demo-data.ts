// TODO(Agent8): Provide canonical `@/lib/demo-data` and this fallback can be deleted.
// Homepage-owned fallback only — NOT source of truth.
//
// Mapping to real modules (all landed):
//   types   -> `@/lib/types` (Model, Benchmark, ScoreSnapshot, ...)
//   scoring -> `@/lib/scores` (bdxBenchScore, blendedPricePer1M, BDX_WEIGHTS)
//   format  -> `@/lib/format` (formatScore, formatPrice, formatTps, ...)
//   dataset -> `@/lib/data`   (MODELS, BENCHMARKS, getLeaderboard, getTrends)
// This file supplies ONLY the extra synthetic rows the homepage needs beyond
// the 2-model placeholder set (9 category tabs x 5 rows, trend history, price
// scatter). Every value below is DEMO DATA — never a live benchmark result.
// Home components import real data first and pad with these rows; everything
// renders under a visible DEMO DATA badge.

export const DEMO_DATA_LABEL = "DEMO DATA" as const;

export const DEMO_DATASET_REFRESH_LABEL = "2026-09-10 (demo)";

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
  modelsTracked: 22,
  benchmarks: 12,
  evalRuns: 252,
  providers: 8,
  datasetRefresh: DEMO_DATASET_REFRESH_LABEL,
};

const m = (
  id: string,
  name: string,
  provider: string,
  score: number,
  delta: number,
  pricePer1M: number | null = null,
  speedTps: number | null = null,
  contextK: number | null = null,
  extra: Partial<HomeModel> = {},
): HomeModel => ({
  id,
  name,
  provider,
  score,
  delta,
  pricePer1M,
  speedTps,
  contextK,
  ...extra,
});

// Clearly synthetic demo rows. Names prefixed "Demo" per contract example.
const OVERALL: HomeModel[] = [
  m("demo-model-x", "Demo Model X", "DemoLab", 92.4, 1.2, 4.2, 118, 200, {
    releasedAt: "2026-08-28",
  }),
  m("demo-model-y", "Demo Model Y", "DemoLab", 91.1, -0.4, 6.8, 96, 128, {
    releasedAt: "2026-08-15",
  }),
  m("demo-model-z", "Demo Model Z", "Acme AI", 89.7, 0.8, 2.1, 142, 64, {
    releasedAt: "2026-09-02",
    isNew: true,
  }),
  m("demo-model-w", "Demo Model W", "Acme AI", 88.3, 0.0, 1.4, 165, 32),
  m("demo-model-v", "Demo Model V", "Northwind", 87.9, 2.1, 0.9, 188, 128, {
    isNew: true,
    releasedAt: "2026-09-05",
  }),
];

function jitter(list: HomeModel[], seed: number): HomeModel[] {
  return list
    .map((row, i) => ({
      ...row,
      score: Math.max(
        60,
        Math.min(99, +(row.score - seed * 0.7 + ((i * 37 + seed * 13) % 5) * 0.4).toFixed(1)),
      ),
      delta: +(((i * 17 + seed * 29) % 7) * 0.4 - 1.2).toFixed(1),
    }))
    .sort((a, b) => b.score - a.score);
}

export const DEMO_TOP_MODELS_BY_CATEGORY: Record<string, HomeModel[]> = {
  Overall: OVERALL,
  Coding: jitter(OVERALL, 1),
  Reasoning: jitter(OVERALL, 2),
  Math: jitter(OVERALL, 3),
  Knowledge: jitter(OVERALL, 4),
  Vision: jitter(OVERALL, 5),
  "Long Context": jitter(OVERALL, 6),
  Agentic: jitter(OVERALL, 7),
  Efficiency: jitter(OVERALL, 8),
};

export const HOME_CATEGORIES = Object.keys(DEMO_TOP_MODELS_BY_CATEGORY);

export interface CategoryLeader {
  category: string;
  model: string;
  provider: string;
  score: number;
}

export const DEMO_CATEGORY_LEADERS: CategoryLeader[] = [
  { category: "Coding", model: "Demo Model X", provider: "DemoLab", score: 93.1 },
  { category: "Reasoning", model: "Demo Model Y", provider: "DemoLab", score: 91.8 },
  { category: "Math", model: "Demo Model Z", provider: "Acme AI", score: 90.2 },
  { category: "Knowledge", model: "Demo Model X", provider: "DemoLab", score: 89.4 },
  { category: "Vision", model: "Demo Model W", provider: "Acme AI", score: 88.8 },
  { category: "Long Context", model: "Demo Model V", provider: "Northwind", score: 87.5 },
  { category: "Agentic", model: "Demo Model Z", provider: "Acme AI", score: 86.9 },
  { category: "Efficiency", model: "Demo Model V", provider: "Northwind", score: 94.0 },
];

export const DEMO_LATEST_MODELS: HomeModel[] = [
  m("demo-model-v", "Demo Model V", "Northwind", 87.9, 2.1, 0.9, 188, 128, {
    releasedAt: "2026-09-05",
    isNew: true,
  }),
  m("demo-model-z", "Demo Model Z", "Acme AI", 89.7, 0.8, 2.1, 142, 64, {
    releasedAt: "2026-09-02",
    isNew: true,
  }),
  m("demo-model-x", "Demo Model X", "DemoLab", 92.4, 1.2, 4.2, 118, 200, {
    releasedAt: "2026-08-28",
  }),
  m("demo-model-y", "Demo Model Y", "DemoLab", 91.1, -0.4, 6.8, 96, 128, {
    releasedAt: "2026-08-15",
  }),
];

export interface PricePoint {
  id: string;
  name: string;
  score: number;
  pricePer1M: number;
}

export const DEMO_PRICE_POINTS: PricePoint[] = [
  { id: "demo-model-x", name: "Demo X", score: 92.4, pricePer1M: 4.2 },
  { id: "demo-model-y", name: "Demo Y", score: 91.1, pricePer1M: 6.8 },
  { id: "demo-model-z", name: "Demo Z", score: 89.7, pricePer1M: 2.1 },
  { id: "demo-model-w", name: "Demo W", score: 88.3, pricePer1M: 1.4 },
  { id: "demo-model-v", name: "Demo V", score: 87.9, pricePer1M: 0.9 },
];

export interface BenchmarkCoverage {
  name: string;
  tasks: number;
  kind: string;
}

export const DEMO_BENCHMARKS: BenchmarkCoverage[] = [
  { name: "SWE-mini (demo)", tasks: 12, kind: "code-fix" },
  { name: "Terminal-mini (demo)", tasks: 12, kind: "shell" },
  { name: "Reasoning (demo)", tasks: 48, kind: "qa" },
  { name: "Math (demo)", tasks: 64, kind: "qa" },
  { name: "Knowledge (demo)", tasks: 80, kind: "qa" },
  { name: "Vision (demo)", tasks: 36, kind: "multimodal" },
];

export interface TrendPoint {
  label: string;
  topScore: number;
  medianScore: number;
}

export const DEMO_TREND_SERIES: TrendPoint[] = [
  { label: "Mar", topScore: 82.1, medianScore: 71.4 },
  { label: "Apr", topScore: 84.6, medianScore: 72.8 },
  { label: "May", topScore: 86.2, medianScore: 74.1 },
  { label: "Jun", topScore: 88.0, medianScore: 75.6 },
  { label: "Jul", topScore: 90.3, medianScore: 77.2 },
  { label: "Aug", topScore: 92.4, medianScore: 78.9 },
];
