"use client";

/**
 * Deprecated aliases — kept so older imports still resolve.
 * Charts render measured evaluations from `./real-data`; these aliases
 * contain no invented values. Do not use in UI.
 */

import type {
  BarSeries,
  DistributionSet,
  HeatmapCell,
  RadarDatum,
  ScatterPoint,
  TrendSeries,
} from "./types";
import {
  REAL_BAR_CATEGORIES,
  REAL_BAR_SERIES,
  REAL_HEATMAP_BENCHMARKS,
  REAL_HEATMAP_CELLS,
  REAL_HEATMAP_MODELS,
  REAL_RADAR,
  REAL_TRENDS,
} from "./real-data";

/** No measured price/performance yet — empty until price + score land. */
export const DEMO_SCATTER_POINTS: ScatterPoint[] = [];

export const DEMO_RADAR: RadarDatum[] = REAL_RADAR.map((d) => ({ ...d }));

export const DEMO_TRENDS_CAPABILITY: TrendSeries[] = REAL_TRENDS.map((s) => ({
  ...s,
  points: s.points.map((p) => ({ ...p })),
}));

/** No measured cost history yet. */
export const DEMO_TRENDS_COST: TrendSeries[] = [];
/** No measured context history yet. */
export const DEMO_TRENDS_CONTEXT: TrendSeries[] = [];
/** No measured speed history yet. */
export const DEMO_TRENDS_SPEED: TrendSeries[] = [];
/** No measured open-weights aggregate yet. */
export const DEMO_TRENDS_OPEN: TrendSeries[] = [];
/** No measured closed aggregate yet. */
export const DEMO_TRENDS_CLOSED: TrendSeries[] = [];

export const DEMO_BAR_CATEGORIES: readonly string[] = REAL_BAR_CATEGORIES;

export const DEMO_BARS: BarSeries[] = REAL_BAR_SERIES.map((s) => ({
  ...s,
  data: [...s.data],
  runs: s.runs ? [...s.runs] : undefined,
}));

export const DEMO_HEATMAP_MODELS: readonly string[] = REAL_HEATMAP_MODELS;
export const DEMO_HEATMAP_BENCHMARKS: readonly string[] = REAL_HEATMAP_BENCHMARKS;

export const DEMO_HEATMAP_CELLS: HeatmapCell[] = REAL_HEATMAP_CELLS.map((c) => ({
  ...c,
}));

/** Single-snapshot reality has no spread — empty until per-run data lands. */
export const DEMO_DISTRIBUTIONS: DistributionSet[] = [];
