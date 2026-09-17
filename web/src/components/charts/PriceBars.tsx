"use client";

/**
 * PriceBars — blended USD/1M per model as horizontal bars.
 * Null-safe: models without a measured price are omitted from the series
 * and listed as "Not evaluated" in the table. When nothing is measured,
 * callers render <NotEnoughData> instead of this chart.
 */

import React, { useMemo } from "react";
import type { EChartsCoreOption } from "./EChartBase";
import { EChartBase } from "./EChartBase";
import { useChartMode } from "./theme";
import type { AriaTable, ThemeMode } from "./types";
import { NOT_EVALUATED, REAL_PROVENANCE_NOTE } from "./real-data";
import { esc, fmtCost } from "./utils";

export interface PriceEntry {
  model: string;
  /** Blended USD per 1M tokens. Null = not measured. */
  blendedPer1M: number | null;
  inputPer1M?: number | null;
  outputPer1M?: number | null;
}

export interface PriceBarsProps {
  entries: PriceEntry[];
  height?: number;
  mode?: ThemeMode;
  ariaLabel?: string;
}

export function pricesToTable(entries: PriceEntry[]): AriaTable {
  return {
    caption: "Blended price per 1M tokens by model. Not evaluated means no measured price.",
    columns: ["Model", "Blended /1M", "Input /1M", "Output /1M"],
    rows: entries.map((e) => [
      e.model,
      e.blendedPer1M != null && Number.isFinite(e.blendedPer1M)
        ? fmtCost(e.blendedPer1M)
        : NOT_EVALUATED,
      e.inputPer1M != null && Number.isFinite(e.inputPer1M) ? fmtCost(e.inputPer1M) : NOT_EVALUATED,
      e.outputPer1M != null && Number.isFinite(e.outputPer1M) ? fmtCost(e.outputPer1M) : NOT_EVALUATED,
    ]),
  };
}

export function PriceBars({
  entries,
  height = 260,
  mode: modeProp,
  ariaLabel = "Blended price per model bar chart",
}: PriceBarsProps) {
  const mode = useChartMode(modeProp);
  const dark = mode === "dark";
  const muted = dark ? "#9AA4B2" : "#5B6672";
  const border = dark ? "#232A35" : "#E2E8E4";

  const measured = useMemo(
    () => entries.filter((e) => e.blendedPer1M != null && Number.isFinite(e.blendedPer1M)),
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
            `Blended: <b>${fmtCost(typeof v === "number" ? v : null)}/1M</b>` +
            (e?.inputPer1M != null || e?.outputPer1M != null
              ? `<br/>In: ${fmtCost(e.inputPer1M)} · Out: ${fmtCost(e.outputPer1M)}`
              : "") +
            `<br/><span style="opacity:.7">${esc(REAL_PROVENANCE_NOTE)}</span></div>`
          );
        },
      },
      xAxis: {
        type: "value",
        axisLabel: { color: muted, formatter: (v: number) => fmtCost(Number(v)) },
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
          name: "blended $/1M",
          data: measured.map((e) => e.blendedPer1M as number),
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
