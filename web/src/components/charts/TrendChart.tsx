"use client";

/** TrendChart — time series with 1M/3M/6M/1Y/ALL range + metric switch.
 *  Controlled or uncontrolled: pages may own range/metric via props.
 */

import React, { useMemo, useState } from "react";
import type { EChartsCoreOption } from "./EChartBase";
import { EChartBase } from "./EChartBase";
import { useChartMode } from "./theme";
import type { AriaTable, ThemeMode, TrendRange, TrendSeries } from "./types";
import { esc, filterSeriesByRange, fmtDate } from "./utils";

export const TREND_RANGES: TrendRange[] = ["1M", "3M", "6M", "1Y", "ALL"];

export interface TrendMetric {
  id: string;
  label: string;
}

export interface TrendChartProps {
  series: TrendSeries[];
  range?: TrendRange;
  defaultRange?: TrendRange;
  onRangeChange?: (r: TrendRange) => void;
  metric?: string;
  metrics?: TrendMetric[];
  defaultMetric?: string;
  onMetricChange?: (m: string) => void;
  /** Hide built-in controls when the page renders its own (URL-synced) ones. */
  showControls?: boolean;
  height?: number;
  mode?: ThemeMode;
  ariaLabel?: string;
}

export function trendsToTable(series: TrendSeries[], metricLabel: string): AriaTable {
  const dates = Array.from(new Set(series.flatMap((s) => s.points.map((p) => fmtDate(p.date))))).sort();
  return {
    caption: `${metricLabel} over time by model.`,
    columns: ["Date", ...series.map((s) => s.model)],
    rows: dates.map((d) => [
      d,
      ...series.map((s) => {
        const pt = s.points.find((p) => fmtDate(p.date) === d);
        return pt ? pt.value.toFixed(3) : "—";
      }),
    ]),
  };
}

export function TrendChart({
  series,
  range: rangeProp,
  defaultRange = "ALL",
  onRangeChange,
  metric: metricProp,
  metrics,
  defaultMetric,
  onMetricChange,
  showControls = true,
  height = 320,
  mode: modeProp,
  ariaLabel = "Trend chart",
}: TrendChartProps) {
  const mode = useChartMode(modeProp);
  const dark = mode === "dark";
  const muted = dark ? "#9AA4B2" : "#5B6672";
  const border = dark ? "#232A35" : "#E2E8E4";

  const [innerRange, setInnerRange] = useState<TrendRange>(defaultRange);
  const [innerMetric, setInnerMetric] = useState<string>(defaultMetric ?? metrics?.[0]?.id ?? "score");
  const range = rangeProp ?? innerRange;
  const metric = metricProp ?? innerMetric;

  const filtered = useMemo(() => filterSeriesByRange(series, range), [series, range]);

  const option = useMemo<EChartsCoreOption>(() => {
    return {
      grid: { left: 52, right: 16, top: 32, bottom: 64, containLabel: true },
      legend: { bottom: 0, textStyle: { color: muted, fontSize: 11 }, type: "scroll" },
      tooltip: {
        trigger: "axis",
        confine: true,
        valueFormatter: (v: unknown) => (typeof v === "number" ? v.toFixed(3) : String(v ?? "—")),
      },
      xAxis: {
        type: "time",
        axisLabel: { color: muted, formatter: (v: number) => fmtDate(new Date(v).toISOString()) },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        scale: true,
        axisLabel: { color: muted },
        splitLine: { lineStyle: { color: border, type: "dashed" } },
      },
      series: filtered.map((s) => ({
        type: "line",
        name: s.label ?? s.model,
        data: s.points.map((p) => [p.date, p.value, p.runs ?? "—"]),
        showSymbol: s.points.length <= 40,
        symbolSize: 5,
        smooth: 0.25,
        lineStyle: { width: 2 },
        emphasis: { focus: "series" },
      })),
    } as EChartsCoreOption;
  }, [border, filtered, muted]);

  const setRange = (r: TrendRange) => {
    setInnerRange(r);
    onRangeChange?.(r);
  };
  const setMetric = (m: string) => {
    setInnerMetric(m);
    onMetricChange?.(m);
  };

  return (
    <div>
      {showControls ? (
        <div className="bdx-chip-row" role="group" aria-label="Trend range" style={{ marginBottom: 10 }}>
          {TREND_RANGES.map((r) => (
            <button
              key={r}
              type="button"
              className="bdx-chip"
              aria-pressed={range === r}
              onClick={() => setRange(r)}
            >
              {r}
            </button>
          ))}
          {metrics && metrics.length > 1 ? (
            <select
              className="bdx-select"
              aria-label="Trend metric"
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
            >
              {metrics.map((m) => (
                <option key={m.id} value={m.id}>
                  {esc(m.label)}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      ) : null}
      <EChartBase option={option} height={height} mode={mode} ariaLabel={ariaLabel} />
    </div>
  );
}
