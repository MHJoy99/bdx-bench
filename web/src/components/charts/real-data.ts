"use client";

/**
 * Measured evaluations backing every Agent E chart.
 *
 * Four models, one benchmark (single snapshot each, except the Sep 17 pair).
 * Everything else is unmeasured and must render as "Not evaluated" — never invented.
 */

import type {
  BarSeries,
  HeatmapCell,
  RadarDatum,
  TrendSeries,
} from "./types";

export const REAL_BENCHMARK_SLUG = "zombie-flamethrower-showdown";
export const REAL_BENCHMARK_LABEL = "Zombie Flamethrower Showdown";
export const REAL_EVAL_DATE = "2026-09-17";
export const REAL_MATCH_ID = "m-001";
export const REAL_PROVENANCE_KIND = "manual game-build evaluation";
export const REAL_PROVENANCE_NOTE =
  "Manual game-build evaluation · 2026-09-17 · match m-001 (open)";

export const REAL_MODEL_SPARK = {
  slug: "muse-spark-1-3",
  name: "Muse Spark 1.3",
  id: "bdx-ai/go-muse-spark-1.3-contributor",
  /** 0–100 showdown score. */
  raw: 92,
} as const;

export const REAL_MODEL_FLASH = {
  slug: "gemini-3-8-flash",
  name: "Gemini 3.8 Flash",
  id: "bdx-ai/gemini-3.8-flash-tiered",
  /** 0–100 showdown score. */
  raw: 88,
} as const;

export const REAL_MODEL_PYRE = {
  slug: "deepseek-v4-1-flash",
  name: "DeepSeek V4.1 Flash",
  id: "bdx-ai/deepseek-v4.1-flash",
  /** 0–100 showdown score. */
  raw: 94,
} as const;

export const REAL_MODEL_LUNA = {
  slug: "gpt-5-6-luna",
  name: "GPT Luna 5.6",
  id: "bdx-ai/gpt-5.6-luna",
  /** 0–100 showdown score. */
  raw: 91,
} as const;

export const REAL_SLUGS: readonly string[] = [
  REAL_MODEL_SPARK.slug,
  REAL_MODEL_PYRE.slug,
  REAL_MODEL_LUNA.slug,
  REAL_MODEL_FLASH.slug,
];

export const REAL_MODEL_NAMES: readonly string[] = [
  REAL_MODEL_SPARK.name,
  REAL_MODEL_PYRE.name,
  REAL_MODEL_LUNA.name,
  REAL_MODEL_FLASH.name,
];

/** 0–1 normalized showdown scores, aligned to REAL_MODEL_NAMES order. */
export const REAL_SCORES_01: readonly number[] = [
  REAL_MODEL_SPARK.raw / 100,
  REAL_MODEL_PYRE.raw / 100,
  REAL_MODEL_LUNA.raw / 100,
  REAL_MODEL_FLASH.raw / 100,
];

export function isRealModelSlug(slug: string): boolean {
  return slug === REAL_MODEL_SPARK.slug || slug === REAL_MODEL_PYRE.slug || slug === REAL_MODEL_LUNA.slug || slug === REAL_MODEL_FLASH.slug;
}

export function isRealModelName(name: string): boolean {
  return name === REAL_MODEL_SPARK.name || name === REAL_MODEL_PYRE.name || name === REAL_MODEL_LUNA.name || name === REAL_MODEL_FLASH.name;
}

function norm(raw100: number): number {
  return Math.min(1, Math.max(0, raw100 / 100));
}

/* ---------- Bar (grouped showdown) ---------- */

export const REAL_BAR_CATEGORIES: readonly string[] = [REAL_BENCHMARK_SLUG];

export const REAL_BAR_SERIES: BarSeries[] = [
  {
    name: REAL_MODEL_SPARK.name,
    data: [norm(REAL_MODEL_SPARK.raw)],
    runs: [1],
  },
  {
    name: REAL_MODEL_PYRE.name,
    data: [norm(REAL_MODEL_PYRE.raw)],
    runs: [1],
  },
  {
    name: REAL_MODEL_LUNA.name,
    data: [norm(REAL_MODEL_LUNA.raw)],
    runs: [1],
  },
  {
    name: REAL_MODEL_FLASH.name,
    data: [norm(REAL_MODEL_FLASH.raw)],
    runs: [1],
  },
];

/* ---------- Radar (evaluated dims only: single showdown axis) ---------- */

export const REAL_RADAR_AXES: readonly string[] = [REAL_BENCHMARK_LABEL];

export const REAL_RADAR: RadarDatum[] = [
  {
    model: REAL_MODEL_SPARK.name,
    values: [norm(REAL_MODEL_SPARK.raw)],
    runs: 1,
  },
  {
    model: REAL_MODEL_PYRE.name,
    values: [norm(REAL_MODEL_PYRE.raw)],
    runs: 1,
  },
  {
    model: REAL_MODEL_LUNA.name,
    values: [norm(REAL_MODEL_LUNA.raw)],
    runs: 1,
  },
  {
    model: REAL_MODEL_FLASH.name,
    values: [norm(REAL_MODEL_FLASH.raw)],
    runs: 1,
  },
];

/* ---------- Heatmap (1 benchmark x 4 models) ---------- */

export const REAL_HEATMAP_MODELS: readonly string[] = [...REAL_MODEL_NAMES];
export const REAL_HEATMAP_BENCHMARKS: readonly string[] = [REAL_BENCHMARK_SLUG];

export const REAL_HEATMAP_CELLS: HeatmapCell[] = [
  {
    model: REAL_MODEL_SPARK.name,
    benchmark: REAL_BENCHMARK_SLUG,
    raw: norm(REAL_MODEL_SPARK.raw),
    normalized: norm(REAL_MODEL_SPARK.raw),
    date: REAL_EVAL_DATE,
    runs: 1,
  },
  {
    model: REAL_MODEL_PYRE.name,
    benchmark: REAL_BENCHMARK_SLUG,
    raw: norm(REAL_MODEL_PYRE.raw),
    normalized: norm(REAL_MODEL_PYRE.raw),
    date: "2026-09-18",
    runs: 1,
  },
  {
    model: REAL_MODEL_LUNA.name,
    benchmark: REAL_BENCHMARK_SLUG,
    raw: norm(REAL_MODEL_LUNA.raw),
    normalized: norm(REAL_MODEL_LUNA.raw),
    date: "2026-09-18",
    runs: 1,
  },
  {
    model: REAL_MODEL_FLASH.name,
    benchmark: REAL_BENCHMARK_SLUG,
    raw: norm(REAL_MODEL_FLASH.raw),
    normalized: norm(REAL_MODEL_FLASH.raw),
    date: REAL_EVAL_DATE,
    runs: 1,
  },
];

/* ---------- Trends (single snapshot — one point per model) ---------- */

export const REAL_TRENDS: TrendSeries[] = [
  {
    model: REAL_MODEL_SPARK.name,
    points: [{ date: REAL_EVAL_DATE, value: norm(REAL_MODEL_SPARK.raw), runs: 1 }],
  },
  {
    model: REAL_MODEL_PYRE.name,
    points: [{ date: "2026-09-18", value: norm(REAL_MODEL_PYRE.raw), runs: 1 }],
  },
  {
    model: REAL_MODEL_LUNA.name,
    points: [{ date: "2026-09-18", value: norm(REAL_MODEL_LUNA.raw), runs: 1 }],
  },
  {
    model: REAL_MODEL_FLASH.name,
    points: [{ date: REAL_EVAL_DATE, value: norm(REAL_MODEL_FLASH.raw), runs: 1 }],
  },
];

/* ---------- Honest fallbacks ---------- */

export const NOT_EVALUATED = "Not evaluated";
export const NOT_ENOUGH_DATA = "Not enough measured data yet";

/**
 * Cell text for a nullable 0–1 score. Null stays null in series data
 * (ECharts renders a gap); tables and lists show the honest label.
 */
export function scoreCell(v: number | null | undefined, digits = 3): string {
  if (v == null || !Number.isFinite(v)) return NOT_EVALUATED;
  return Number(v).toFixed(digits);
}
