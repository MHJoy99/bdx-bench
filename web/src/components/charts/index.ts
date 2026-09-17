/** BDX Bench shared chart library — the ONE viz layer other agents reuse.
 *
 *  Pages import from `@/components/charts` (this barrel) and from the three
 *  route-support sections. Do NOT rebuild chart primitives per page.
 *
 *  @example
 *  import { ChartShell, ScatterPlot, DEMO_SCATTER_POINTS } from "@/components/charts";
 *  import { ScatterSection } from "@/components/price-performance/ScatterSection";
 */

export { ChartShell, type ChartShellProps } from "./ChartShell";
export { RadarChart, radarToTable, radarValues } from "./RadarChart";
export type { RadarChartProps } from "./RadarChart";
export {
  ScatterPlot,
  PARETO_EXPLANATION,
  scatterToTable,
  type ScatterPlotProps,
  type ScatterSizeBy,
} from "./ScatterPlot";
export {
  TrendChart,
  TREND_RANGES,
  trendsToTable,
  type TrendChartProps,
  type TrendMetric,
} from "./TrendChart";
export { BarGroup, barsToTable, type BarGroupProps } from "./BarGroup";
export {
  HeatmapMatrix,
  heatmapToTable,
  type HeatmapMatrixProps,
  type HeatSortBy,
  type HeatSortDir,
} from "./HeatmapMatrix";
export {
  DistributionChart,
  distributionsToTable,
  type DistributionChartProps,
} from "./DistributionChart";

export {
  ACCENT,
  DARK_BG,
  CATEGORY_PALETTE,
  animationFor,
  echartsTheme,
  useChartMode,
  usePrefersReducedMotion,
} from "./theme";

export {
  boxStats,
  ci95,
  computePareto,
  filterByRange,
  filterSeriesByRange,
  fmtCost,
  fmtDate,
  fmtPct,
  fmtScore,
  fmtTps,
  mean,
  variance,
} from "./utils";

export {
  DEMO_BARS,
  DEMO_BAR_CATEGORIES,
  DEMO_DISTRIBUTIONS,
  DEMO_HEATMAP_BENCHMARKS,
  DEMO_HEATMAP_CELLS,
  DEMO_HEATMAP_MODELS,
  DEMO_RADAR,
  DEMO_SCATTER_POINTS,
  DEMO_TRENDS_CAPABILITY,
  DEMO_TRENDS_CLOSED,
  DEMO_TRENDS_CONTEXT,
  DEMO_TRENDS_COST,
  DEMO_TRENDS_OPEN,
  DEMO_TRENDS_SPEED,
} from "./demo";

export { RADAR_AXES, type RadarAxis } from "./types";
export type {
  AriaTable,
  BarSeries,
  DistributionSet,
  HeatmapCell,
  RadarDatum,
  ScatterPoint,
  ThemeMode,
  TrendPoint,
  TrendRange,
  TrendSeries,
} from "./types";
