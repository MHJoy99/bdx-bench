/** Shared chart data contracts for the BDX Bench viz library (SUB-AGENT 7/10).
 *
 *  All charts accept `demo`-flagged fixtures from `./demo` so pages can render
 *  offline with `?mock=1` / demo props. Real API data (`@/lib/data` when it
 *  lands) maps onto the same shapes — see `demo.ts` for the mapping notes.
 */

export type ThemeMode = "dark" | "light";
export type TrendRange = "1M" | "3M" | "6M" | "1Y" | "ALL";

/** Textual data fallback rendered by ChartShell (screen-reader + sighted). */
export interface AriaTable {
  caption: string;
  columns: string[];
  rows: Array<Array<string | number>>;
}

/** Price/performance scatter point. `score` is 0..1 (normalized). */
export interface ScatterPoint {
  model: string;
  label?: string;
  provider?: string;
  /** Intelligence score, 0..1. */
  score: number;
  /** Blended USD cost per 1M tokens (or per run — keep units consistent). */
  blendedCost: number;
  inputPrice?: number;
  outputPrice?: number;
  /** Tokens/sec — drives bubble size when `sizeBy="speed"`. */
  speedTps?: number;
  /** Context window in K tokens — drives bubble size when `sizeBy="context"`. */
  contextK?: number;
  runs?: number;
  ciLow?: number;
  ciHigh?: number;
  variance?: number;
  /** Open-weights vs closed — used by trends open-vs-closed rollups. */
  open?: boolean;
  demo?: boolean;
}

/** One model polygon on the radar. `values` align to RADAR_AXES order. */
export interface RadarDatum {
  model: string;
  provider?: string;
  values: number[] | Record<string, number>;
  runs?: number;
  demo?: boolean;
}

export interface TrendPoint {
  /** ISO date string. */
  date: string;
  value: number;
  runs?: number;
}

export interface TrendSeries {
  model: string;
  provider?: string;
  label?: string;
  points: TrendPoint[];
  demo?: boolean;
}

export interface BarSeries {
  name: string;
  /** One value per category; `null` = missing run. Values 0..1. */
  data: Array<number | null>;
  runs?: Array<number | undefined>;
  ciLow?: Array<number | undefined>;
  ciHigh?: Array<number | undefined>;
}

export interface HeatmapCell {
  model: string;
  benchmark: string;
  raw: number | null;
  /** 0..1 normalized cell value driving color. */
  normalized: number;
  date?: string;
  runs?: number;
}

export interface DistributionSet {
  model: string;
  provider?: string;
  /** Raw per-run scores 0..1. */
  values: number[];
  runs?: number;
  demo?: boolean;
}

/** The seven capability axes — fixed order everywhere. */
export const RADAR_AXES = [
  "Reasoning",
  "Coding",
  "Math",
  "Knowledge",
  "Vision",
  "Agentic",
  "Efficiency",
] as const;

export type RadarAxis = (typeof RADAR_AXES)[number];
