/** Demo fixtures — offline-compatible props for every chart.
 *
 *  Mapping notes (DEMO DATA compatible):
 *  - Scores come from `results/demo-*.json` (avgScore 5/6 luna, 4/6 spark,
 *    3/6 gemini-3.7). Two extra synthetic models round out the viz.
 *  - BDX Bench runs have no price/speed fields (METHODOLOGY §7: cost is
 *    informational/optional), so cost/speed/context/radar axes are synthetic
 *    placeholders clearly flagged `demo: true`. Real API rows map the same
 *    way: score <- avgScore, runs <- run count, prices <- model catalog.
 *  - Trend histories are synthetic weekly walks ending today.
 */

import type {
  BarSeries,
  DistributionSet,
  HeatmapCell,
  RadarDatum,
  ScatterPoint,
  TrendSeries,
} from "./types";
import { ci95 } from "./utils";

function withCI<T extends { score?: number; runs?: number }>(
  p: T,
): T & { ciLow: number; ciHigh: number; variance: number } {
  const n = p.runs ?? 6;
  const [lo, hi] = ci95(p.score ?? 0.5, n);
  return { ...p, ciLow: lo, ciHigh: hi, variance: 0.012 };
}

export const DEMO_SCATTER_POINTS: ScatterPoint[] = [
  withCI({
    model: "bdx-ai/gpt-5.6-luna",
    label: "GPT Luna 5.6",
    provider: "bdx-ai",
    score: 5 / 6,
    blendedCost: 8.4,
    inputPrice: 6.0,
    outputPrice: 18.0,
    speedTps: 42,
    contextK: 200,
    runs: 6,
    open: false,
    demo: true,
  }),
  withCI({
    model: "bdx-ai/go-muse-spark-1.3-contributor",
    label: "Muse Spark 1.3",
    provider: "bdx-ai",
    score: 4 / 6,
    blendedCost: 3.1,
    inputPrice: 2.5,
    outputPrice: 7.5,
    speedTps: 68,
    contextK: 200,
    runs: 6,
    open: false,
    demo: true,
  }),
  withCI({
    model: "bdx-ai/gemini-3.7-flash-tiered",
    label: "Gemini 3.7 Flash",
    provider: "bdx-ai",
    score: 3 / 6,
    blendedCost: 0.9,
    inputPrice: 0.7,
    outputPrice: 2.1,
    speedTps: 145,
    contextK: 1000,
    runs: 6,
    open: false,
    demo: true,
  }),
  withCI({
    model: "bdx-ai/gemini-3.8-flash-tiered",
    label: "Gemini 3.8 Flash",
    provider: "bdx-ai",
    score: 0.58,
    blendedCost: 1.1,
    inputPrice: 0.9,
    outputPrice: 2.6,
    speedTps: 138,
    contextK: 1000,
    runs: 6,
    open: false,
    demo: true,
  }),
  withCI({
    model: "bdx-ai/deepseek-v4.1-flash",
    label: "DeepSeek V4.1 Flash",
    provider: "bdx-ai",
    score: 0.62,
    blendedCost: 0.55,
    inputPrice: 0.4,
    outputPrice: 1.4,
    speedTps: 96,
    contextK: 128,
    runs: 6,
    open: true,
    demo: true,
  }),
];

export const DEMO_RADAR: RadarDatum[] = [
  { model: "GPT Luna 5.6", values: [0.9, 0.83, 0.86, 0.88, 0.74, 0.81, 0.52], runs: 6, demo: true },
  { model: "Muse Spark 1.3", values: [0.72, 0.79, 0.61, 0.7, 0.66, 0.74, 0.68], runs: 6, demo: true },
  { model: "Gemini 3.7 Flash", values: [0.55, 0.5, 0.58, 0.62, 0.6, 0.52, 0.9], runs: 6, demo: true },
  { model: "DeepSeek V4.1 Flash", values: [0.64, 0.66, 0.6, 0.58, 0.5, 0.6, 0.84], runs: 6, demo: true },
];

function walk(model: string, start: number, drift: number, seed: number, weeks = 26): TrendSeries {
  let v = start;
  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648 - 0.5;
  };
  const points = Array.from({ length: weeks }, (_, i) => {
    v = Math.min(0.97, Math.max(0.2, v + drift + rand() * 0.05));
    const d = new Date(Date.now() - (weeks - 1 - i) * 7 * 86_400_000);
    return { date: d.toISOString(), value: Number(v.toFixed(3)), runs: 6 };
  });
  return { model, points, demo: true };
}

export const DEMO_TRENDS_CAPABILITY: TrendSeries[] = [
  walk("GPT Luna 5.6", 0.78, 0.004, 11),
  walk("Muse Spark 1.3", 0.6, 0.003, 22),
  walk("Gemini 3.7 Flash", 0.45, 0.002, 33),
];

export const DEMO_TRENDS_COST: TrendSeries[] = [
  walk("GPT Luna 5.6", 8.9, -0.01, 44),
  walk("Muse Spark 1.3", 3.4, -0.008, 55),
  walk("Gemini 3.7 Flash", 1.0, -0.004, 66),
];

export const DEMO_TRENDS_CONTEXT: TrendSeries[] = [
  walk("GPT Luna 5.6", 200, 0.4, 77),
  walk("Gemini 3.7 Flash", 900, 1.2, 88),
];

export const DEMO_TRENDS_SPEED: TrendSeries[] = [
  walk("Gemini 3.7 Flash", 140, 0.2, 99),
  walk("Muse Spark 1.3", 64, 0.15, 111),
  walk("GPT Luna 5.6", 40, 0.1, 122),
];

export const DEMO_TRENDS_OPEN: TrendSeries[] = [walk("open-weights avg", 0.55, 0.004, 133)];
export const DEMO_TRENDS_CLOSED: TrendSeries[] = [walk("closed avg", 0.68, 0.002, 144)];

export const DEMO_BAR_CATEGORIES = ["swe-mini", "terminal-mini"];

export const DEMO_BARS: BarSeries[] = [
  { name: "GPT Luna 5.6", data: [5 / 6, null], runs: [6, undefined], ciLow: [0.55, undefined], ciHigh: [0.98, undefined] },
  { name: "Muse Spark 1.3", data: [null, 4 / 6], runs: [undefined, 6], ciLow: [undefined, 0.36], ciHigh: [undefined, 0.9] },
  { name: "Gemini 3.7 Flash", data: [3 / 6, null], runs: [6, undefined], ciLow: [0.22, undefined], ciHigh: [0.78, undefined] },
];

export const DEMO_HEATMAP_MODELS = ["GPT Luna 5.6", "Muse Spark 1.3", "Gemini 3.7 Flash", "DeepSeek V4.1 Flash"];
export const DEMO_HEATMAP_BENCHMARKS = ["swe-mini", "terminal-mini", "reasoning", "coding"];

export const DEMO_HEATMAP_CELLS: HeatmapCell[] = [
  { model: "GPT Luna 5.6", benchmark: "swe-mini", raw: 0.833, normalized: 0.92, date: "2026-09-16", runs: 6 },
  { model: "GPT Luna 5.6", benchmark: "reasoning", raw: 0.9, normalized: 1.0, date: "2026-09-16", runs: 6 },
  { model: "GPT Luna 5.6", benchmark: "coding", raw: 0.83, normalized: 0.9, date: "2026-09-16", runs: 6 },
  { model: "GPT Luna 5.6", benchmark: "terminal-mini", raw: null, normalized: 0, date: "2026-09-16", runs: 0 },
  { model: "Muse Spark 1.3", benchmark: "terminal-mini", raw: 0.667, normalized: 0.72, date: "2026-09-16", runs: 6 },
  { model: "Muse Spark 1.3", benchmark: "coding", raw: 0.79, normalized: 0.84, date: "2026-09-16", runs: 6 },
  { model: "Muse Spark 1.3", benchmark: "swe-mini", raw: null, normalized: 0, date: "2026-09-16", runs: 0 },
  { model: "Muse Spark 1.3", benchmark: "reasoning", raw: 0.72, normalized: 0.76, date: "2026-09-16", runs: 6 },
  { model: "Gemini 3.7 Flash", benchmark: "swe-mini", raw: 0.5, normalized: 0.5, date: "2026-09-16", runs: 6 },
  { model: "Gemini 3.7 Flash", benchmark: "coding", raw: 0.5, normalized: 0.5, date: "2026-09-16", runs: 6 },
  { model: "Gemini 3.7 Flash", benchmark: "terminal-mini", raw: null, normalized: 0, date: "2026-09-16", runs: 0 },
  { model: "Gemini 3.7 Flash", benchmark: "reasoning", raw: 0.55, normalized: 0.55, date: "2026-09-16", runs: 6 },
  { model: "DeepSeek V4.1 Flash", benchmark: "swe-mini", raw: 0.62, normalized: 0.64, date: "2026-09-16", runs: 6 },
  { model: "DeepSeek V4.1 Flash", benchmark: "terminal-mini", raw: 0.58, normalized: 0.6, date: "2026-09-16", runs: 6 },
  { model: "DeepSeek V4.1 Flash", benchmark: "coding", raw: 0.66, normalized: 0.68, date: "2026-09-16", runs: 6 },
  { model: "DeepSeek V4.1 Flash", benchmark: "reasoning", raw: 0.64, normalized: 0.66, date: "2026-09-16", runs: 6 },
];

export const DEMO_DISTRIBUTIONS: DistributionSet[] = [
  { model: "GPT Luna 5.6", values: [1, 1, 1, 1, 1, 0], runs: 6, demo: true },
  { model: "Muse Spark 1.3", values: [1, 1, 1, 1, 0, 0], runs: 6, demo: true },
  { model: "Gemini 3.7 Flash", values: [1, 1, 1, 0, 0, 0], runs: 6, demo: true },
];
