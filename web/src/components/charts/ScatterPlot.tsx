"use client";

/** ScatterPlot — price/performance: X blended cost (log), Y intelligence score.
 *  Bubble size encodes speed (tok/s) or context (K). Optional Pareto frontier.
 *  Tooltip: Model · Provider · Score · Prices · Speed (per spec).
 */

import React, { useMemo } from "react";
import type { EChartsCoreOption } from "./EChartBase";
import { EChartBase } from "./EChartBase";
import { NOT_EVALUATED, REAL_PROVENANCE_NOTE } from "./real-data";
import { ACCENT, useChartMode } from "./theme";
import type { AriaTable, ScatterPoint, ThemeMode } from "./types";
import { computePareto, esc, fmtCost, fmtPct, fmtTps } from "./utils";

export const PARETO_EXPLANATION =
  "The Pareto frontier joins models no rival beats on BOTH price and score. " +
  "A model is on the frontier when no other model is cheaper AND higher-scoring. " +
  "It needs at least two models with measured price AND score across " +
  "comparable benchmarks — with a single measured benchmark and no measured " +
  "prices, no frontier can be drawn yet.";

export const PARETO_SINGLE_BENCHMARK_NOTE =
  "Only one benchmark is measured so far, and no prices are measured. " +
  "A frontier needs price plus score for at least two models, so this view " +
  "stays a table until more measurements land.";

export type ScatterSizeBy = "speed" | "context" | "runs" | "none";

export interface ScatterPlotProps {
  points: ScatterPoint[];
  /** Show the non-dominated frontier line. Default true. */
  showPareto?: boolean;
  /**
   * Optional explainer copy. When provided, ScatterPlot renders it as a
   * caption under the chart; wrapping ScatterSection instead renders it in
   * the shell footer <details> and leaves this unset.
   */
  explanation?: string;
  sizeBy?: ScatterSizeBy;
  xLog?: boolean;
  height?: number;
  mode?: ThemeMode;
  ariaLabel?: string;
  onPointClick?: (model: string) => void;
}

function bubbleSize(p: ScatterPoint, sizeBy: ScatterSizeBy): number {
  if (sizeBy === "none") return 12;
  const raw =
    sizeBy === "context" ? (p.contextK ?? 0) : sizeBy === "runs" ? (p.runs ?? 0) * 20 : (p.speedTps ?? 0);
  const scaled = Math.sqrt(Math.max(0, raw));
  return Math.min(42, Math.max(8, 6 + scaled * 1.6));
}

export function scatterToTable(points: ScatterPoint[]): AriaTable {
  return {
    caption: "Price versus performance by model. Score 0 to 1, cost USD per 1M tokens.",
    columns: ["Model", "Provider", "Score", "Blended cost", "In price", "Out price", "Speed", "Runs"],
    rows: points.map((p) => [
      p.label ?? p.model,
      p.provider ?? NOT_EVALUATED,
      p.score.toFixed(3),
      fmtCost(p.blendedCost),
      p.inputPrice != null ? fmtCost(p.inputPrice) : NOT_EVALUATED,
      p.outputPrice != null ? fmtCost(p.outputPrice) : NOT_EVALUATED,
      p.speedTps != null ? fmtTps(p.speedTps) : NOT_EVALUATED,
      p.runs ?? NOT_EVALUATED,
    ]),
  };
}

export function ScatterPlot({
  points,
  showPareto = true,
  explanation,
  sizeBy = "speed",
  xLog = true,
  height = 380,
  mode: modeProp,
  ariaLabel = "Price versus performance scatterplot with Pareto frontier",
  onPointClick,
}: ScatterPlotProps) {
  const mode = useChartMode(modeProp);
  const dark = mode === "dark";
  const muted = dark ? "#9AA4B2" : "#5B6672";
  const border = dark ? "#232A35" : "#E2E8E4";

  const pareto = useMemo(() => (showPareto ? computePareto(points) : []), [points, showPareto]);

  const option = useMemo<EChartsCoreOption>(() => {
    const tooltipFormatter = (p: unknown) => {
      const item = p as { data?: ScatterPoint & { value?: [number, number] } };
      const d = item.data;
      if (!d) return "";
      const ci =
        d.ciLow != null && d.ciHigh != null
          ? `<br/>95% CI: ${fmtPct(d.ciLow)} – ${fmtPct(d.ciHigh)}`
          : "";
      return (
        `<div><b>${esc(d.label ?? d.model)}</b><br/>` +
        `<span style="opacity:.7">${esc(d.model)}</span><br/>` +
        `Provider: <b>${esc(d.provider ?? NOT_EVALUATED)}</b><br/>` +
        `Score: <b>${fmtPct(d.score)}</b>${ci}<br/>` +
        `Blended: <b>${fmtCost(d.blendedCost)}</b>/1M` +
        (d.inputPrice != null || d.outputPrice != null
          ? `<br/>In: ${fmtCost(d.inputPrice)} · Out: ${fmtCost(d.outputPrice)}`
          : "") +
        (d.speedTps != null ? `<br/>Speed: <b>${fmtTps(d.speedTps)}</b>` : "") +
        (d.contextK != null ? `<br/>Context: <b>${esc(d.contextK)}K</b>` : "") +
        (d.runs != null ? `<br/>Runs: ${esc(d.runs)}` : "") +
        (d.variance != null ? ` · var ${Number(d.variance).toFixed(4)}` : "") +
        `<br/><span style="opacity:.7">${esc(REAL_PROVENANCE_NOTE)}</span></div>`
      );
    };

    const series: Array<Record<string, unknown>> = [
      {
        type: "scatter",
        name: "models",
        data: points.map((p) => ({
          name: p.label ?? p.model,
          value: [p.blendedCost, Number((p.score * 100).toFixed(2))],
          symbolSize: bubbleSize(p, sizeBy),
          ...p,
        })),
        itemStyle: { opacity: 0.88, borderColor: dark ? "#080A0D" : "#fff", borderWidth: 1.5 },
        emphasis: { scale: 1.25, focus: "self" },
      },
    ];

    if (pareto.length >= 2) {
      series.push({
        type: "line",
        name: "Pareto frontier",
        data: pareto.map((p) => [p.blendedCost, Number((p.score * 100).toFixed(2))]),
        showSymbol: true,
        symbol: "diamond",
        symbolSize: 9,
        lineStyle: { color: ACCENT, width: 2, type: "dashed" },
        itemStyle: { color: ACCENT, borderColor: ACCENT },
        tooltip: { show: false },
      });
    }

    return {
      grid: { left: 56, right: 20, top: 36, bottom: 52, containLabel: true },
      legend: { bottom: 0, textStyle: { color: muted, fontSize: 11 } },
      tooltip: { trigger: "item", confine: true, formatter: tooltipFormatter },
      xAxis: {
        type: xLog ? "log" : "value",
        name: "blended cost $/1M (log)",
        nameLocation: "middle",
        nameGap: 32,
        nameTextStyle: { color: muted, fontSize: 11 },
        axisLabel: { color: muted, formatter: (v: number) => fmtCost(Number(v)) },
        splitLine: { lineStyle: { color: border, type: "dashed" } },
      },
      yAxis: {
        type: "value",
        name: "intelligence score",
        min: 0,
        max: 100,
        axisLabel: { color: muted, formatter: (v: number) => `${v}` },
        splitLine: { lineStyle: { color: border, type: "dashed" } },
      },
      series,
    } as EChartsCoreOption;
  }, [border, dark, muted, pareto, points, sizeBy, xLog]);

  return (
    <div>
      <EChartBase
        option={option}
        height={height}
        mode={mode}
        ariaLabel={ariaLabel}
        onEvents={
          onPointClick
            ? { click: (p: unknown) => {
                const d = (p as { data?: ScatterPoint }).data;
                if (d?.model) onPointClick(d.model);
              } }
            : undefined
        }
      />
      {explanation ? <p className="bdx-chart-foot">{explanation}</p> : null}
    </div>
  );
}
