/** Shared chart data contracts for the BDX Bench viz library.
 *
 *  Charts render measured evaluations only. Nullable fields mean
 *  "not measured": series omit the point, tables show "Not evaluated".
 *  See `./real-data` for the current measured snapshot.
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
  /** Deprecated: ignored. Charts render measured evaluations only. */
  demo?: boolean;
}

/** One model polygon on the radar. `values` align to axes order; null = not measured. */
export interface RadarDatum {
  model: string;
  provider?: string;
  values: Array<number | null> | Record<string, number | null | undefined>;
  runs?: number;
  /** Deprecated: ignored. Charts render measured evaluations only. */
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
  /** Deprecated: ignored. Charts render measured evaluations only. */
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
  /** Deprecated: ignored. Charts render measured evaluations only. */
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
