"use client";

/**
 * SpeedBars — median output tok/s per model as horizontal bars.
 * Null-safe: models without a measured speed are omitted from the series
 * and listed as "Not evaluated" in the table. When nothing is measured,
 * callers render <NotEnoughData> instead of this chart.
 */

import React, { useMemo } from "react";
import type { EChartsCoreOption } from "./EChartBase";
import { EChartBase } from "./EChartBase";
import { useChartMode } from "./theme";
import type { AriaTable, ThemeMode } from "./types";
import { NOT_EVALUATED, REAL_PROVENANCE_NOTE } from "./real-data";
import { esc, fmtTps } from "./utils";

export interface SpeedEntry {
  model: string;
  /** Median output tokens/sec. Null = not measured. */
  tps: number | null;
  ttftMs?: number | null;
}

export interface SpeedBarsProps {
  entries: SpeedEntry[];
  height?: number;
  mode?: ThemeMode;
  ariaLabel?: string;
}

export function speedsToTable(entries: SpeedEntry[]): AriaTable {
  return {
    caption: "Output speed by model. Not evaluated means no measured speed.",
    columns: ["Model", "tok/s", "TTFT ms"],
    rows: entries.map((e) => [
      e.model,
      e.tps != null && Number.isFinite(e.tps) ? fmtTps(e.tps) : NOT_EVALUATED,
      e.ttftMs != null && Number.isFinite(e.ttftMs) ? String(Math.round(e.ttftMs)) : NOT_EVALUATED,
    ]),
  };
}

export function SpeedBars({
  entries,
  height = 260,
  mode: modeProp,
  ariaLabel = "Output speed per model bar chart",
}: SpeedBarsProps) {
  const mode = useChartMode(modeProp);
  const dark = mode === "dark";
  const muted = dark ? "#9AA4B2" : "#5B6672";
  const border = dark ? "#232A35" : "#E2E8E4";

  const measured = useMemo(
    () => entries.filter((e) => e.tps != null && Number.isFinite(e.tps)),
    [entries],
  );

  const option = useMemo<EChartsCoreOption>(() => {
    return {
      grid: { left: 8, right: 70, top: 12, bottom: 8, containLabel: true },
      tooltip: {
        trigger: "item",
        confine: true,
        formatter: (p: unknown) => {
          const item = p as { name?: string; value?: number };
          const e = measured.find((x) => x.model === item.name);
          const v = item.value;
          return (
            `<div><b>${esc(item.name ?? "?")}</b><br/>` +
            `Speed: <b>${fmtTps(typeof v === "number" ? v : null)}</b>` +
            (e?.ttftMs != null && Number.isFinite(e.ttftMs)
              ? `<br/>TTFT: ${esc(Math.round(e.ttftMs))} ms`
              : "") +
            `<br/><span style="opacity:.7">${esc(REAL_PROVENANCE_NOTE)}</span></div>`
          );
        },
      },
      xAxis: {
        type: "value",
        axisLabel: { color: muted, formatter: (v: number) => `${v}` },
        splitLine: { lineStyle: { color: border, type: "dashed" as const } },
      },
      yAxis: {
        type: "category",
        data: measured.map((e) => e.model),
        inverse: true,
        axisLabel: { color: muted, fontSize: 12 },
        axisLine: { lineStyle: { color: border } },
      },
      series: [
        {
          type: "bar",
          name: "tok/s",
          data: measured.map((e) => e.tps as number),
          barMaxWidth: 22,
          itemStyle: { borderRadius: [0, 4, 4, 0] },
        },
      ],
    } as EChartsCoreOption;
  }, [border, measured, muted]);

  return (
    <EChartBase
      option={option}
      height={Math.max(height, measured.length * 44 + 60)}
      mode={mode}
      ariaLabel={ariaLabel}
    />
  );
}
