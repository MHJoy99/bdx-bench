/** BDX Bench shared chart library — the ONE viz layer other agents reuse.
 *
 *  Pages import from `@/components/charts` (this barrel) and from the three
 *  route-support sections. Do NOT rebuild chart primitives per page.
 *
 *  @example
 *  import { ChartShell, BarGroup, REAL_BAR_CATEGORIES, REAL_BAR_SERIES } from "@/components/charts";
 *  import { ScatterSection } from "@/components/price-performance/ScatterSection";
 */

export { ChartShell, type ChartShellProps } from "./ChartShell";
export { NotEnoughData, type NotEnoughDataProps } from "./NotEnoughData";
export { RadarChart, evaluatedAxes, radarToTable, radarValues } from "./RadarChart";
export type { RadarChartProps } from "./RadarChart";
export {
  ScatterPlot,
  PARETO_EXPLANATION,
  PARETO_SINGLE_BENCHMARK_NOTE,
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
export { PriceBars, pricesToTable, type PriceBarsProps, type PriceEntry } from "./PriceBars";
export { SpeedBars, speedsToTable, type SpeedBarsProps, type SpeedEntry } from "./SpeedBars";
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
  NOT_ENOUGH_DATA,
  NOT_EVALUATED,
  REAL_BAR_CATEGORIES,
  REAL_BAR_SERIES,
  REAL_BENCHMARK_LABEL,
  REAL_BENCHMARK_SLUG,
  REAL_EVAL_DATE,
  REAL_HEATMAP_BENCHMARKS,
  REAL_HEATMAP_CELLS,
  REAL_HEATMAP_MODELS,
  REAL_MATCH_ID,
  REAL_MODEL_FLASH,
  REAL_MODEL_NAMES,
  REAL_MODEL_SPARK,
  REAL_PROVENANCE_KIND,
  REAL_PROVENANCE_NOTE,
  REAL_RADAR,
  REAL_RADAR_AXES,
  REAL_SCORES_01,
  REAL_SLUGS,
  REAL_TRENDS,
  isRealModelName,
  isRealModelSlug,
  scoreCell,
} from "./real-data";

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
