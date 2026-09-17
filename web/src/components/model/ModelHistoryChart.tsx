"use client";

import { useMemo, useState } from "react";
import { formatScore } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  HISTORY_METRICS,
  HISTORY_RANGES,
  getModelHistory,
  type HistoryMetric,
  type HistoryRange,
} from "@/lib/model-pages-demo";
import { DemoBadge } from "./DemoBadge";

/**
 * MODEL HISTORY chart: hand-rolled SVG line chart (no ECharts here).
 * Range switcher 1M/3M/6M/1Y/ALL × metric switcher
 * Overall/Coding/Reasoning/Math/Vision/Agentic.
 * Owner: SUB-AGENT 5/10 MODEL PAGES (client component for switching).
 * TODO(Agent7/charts): replace the SVG with shared `@/components/charts/*`
 * when it lands. Keep a textual fallback in any replacement.
 */

const W = 640;
const H = 220;
const PAD = { top: 12, right: 12, bottom: 28, left: 36 };

function toPath(
  values: number[],
  min: number,
  max: number,
): string {
  const iw = W - PAD.left - PAD.right;
  const ih = H - PAD.top - PAD.bottom;
  const span = max - min || 1;
  return values
    .map((v, i) => {
      const x = PAD.left + (values.length === 1 ? iw / 2 : (i / (values.length - 1)) * iw);
      const y = PAD.top + ih - ((v - min) / span) * ih;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

const METRIC_LABELS: Record<HistoryMetric, string> = {
  overall: "Overall",
  coding: "Coding",
  reasoning: "Reasoning",
  math: "Math",
  vision: "Vision",
  agentic: "Agentic",
};

export function ModelHistoryChart({
  slug,
  modelName,
}: {
  slug: string;
  modelName: string;
}) {
  const [range, setRange] = useState<HistoryRange>("6M");
  const [metric, setMetric] = useState<HistoryMetric>("overall");

  const points = useMemo(
    () => getModelHistory(slug, metric, range),
    [slug, metric, range],
  );

  const values = points.map((p) => p.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const min = Math.max(0, Math.floor(dataMin - 3));
  const max = Math.min(100, Math.ceil(dataMax + 3));
  const d = toPath(values, min, max);
  const last = points[points.length - 1];
  const first = points[0];

  const gridLines = [0.25, 0.5, 0.75].map((f) => {
    const v = min + (max - min) * f;
    const y = PAD.top + (H - PAD.top - PAD.bottom) * (1 - f);
    return { v, y };
  });

  return (
    <section aria-labelledby="model-history-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2
          id="model-history-heading"
          className="text-lg font-semibold uppercase tracking-wide text-foreground"
        >
          Model history <DemoBadge />
        </h2>
        <p className="text-xs text-muted-foreground">
          {METRIC_LABELS[metric]} · {range} · {points.length} points
          {last ? (
            <>
              {" "}
              · latest{" "}
              <strong className="font-mono text-foreground">
                {formatScore(last.value)}
              </strong>
            </>
          ) : null}
        </p>
      </div>

      {/* Metric switcher */}
      <div
        role="group"
        aria-label="History metric"
        className="mt-3 flex flex-wrap gap-1.5"
      >
        {HISTORY_METRICS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMetric(m)}
            aria-pressed={metric === m}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs font-medium",
              metric === m
                ? "border-bdx-accent/50 bg-bdx-accent/15 text-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {METRIC_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Range switcher */}
      <div
        role="group"
        aria-label="History range"
        className="mt-2 flex flex-wrap gap-1.5"
      >
        {HISTORY_RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            aria-pressed={range === r}
            className={cn(
              "rounded-md border px-2.5 py-1 font-mono text-xs font-medium",
              range === r
                ? "border-bdx-accent/50 bg-bdx-accent/15 text-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-lg border border-border bg-card p-3">
        <svg
          role="img"
          aria-label={`Demo ${METRIC_LABELS[metric]} history for ${modelName} over ${range}: from ${first ? `${formatScore(first.value)} on ${first.date}` : "no data"} to ${last ? `${formatScore(last.value)} on ${last.date}` : "no data"}.`}
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
        >
          {gridLines.map((g) => (
            <g key={g.v}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={g.y}
                y2={g.y}
                stroke="currentColor"
                strokeOpacity={0.15}
                strokeWidth={1}
              />
              <text
                x={PAD.left - 5}
                y={g.y + 3}
                textAnchor="end"
                fontSize={9}
                fill="currentColor"
                opacity={0.6}
              >
                {g.v.toFixed(0)}
              </text>
            </g>
          ))}
          <path d={d} fill="none" stroke="#B8FF5A" strokeWidth={2} strokeLinejoin="round" />
          {last ? (
            <circle
              cx={W - PAD.right}
              cy={
                PAD.top +
                (H - PAD.top - PAD.bottom) *
                  (1 - (last.value - min) / (max - min || 1))
              }
              r={3.5}
              fill="#B8FF5A"
            />
          ) : null}
          {points.length > 0 ? (
            <text
              x={PAD.left}
              y={H - 8}
              fontSize={9}
              fill="currentColor"
              opacity={0.6}
            >
              {first?.date}
            </text>
          ) : null}
          {points.length > 0 ? (
            <text
              x={W - PAD.right}
              y={H - 8}
              textAnchor="end"
              fontSize={9}
              fill="currentColor"
              opacity={0.6}
            >
              {last?.date}
            </text>
          ) : null}
        </svg>
      </div>

      {/* Textual fallback for the chart. */}
      <details className="mt-2 rounded-lg border border-border bg-card px-3 py-2 text-[13px] leading-5">
        <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
          View history as a data table
        </summary>
        <div className="mt-2 max-h-56 overflow-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="text-left text-[11px] uppercase leading-4 tracking-wide text-muted-foreground">
                <th scope="col" className="px-2 py-1">Date</th>
                <th scope="col" className="px-2 py-1 text-right">
                  {METRIC_LABELS[metric]}
                </th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {points.map((p) => (
                <tr key={p.date} className="border-t border-border">
                  <td className="px-2 py-1">{p.date}</td>
                  <td className="px-2 py-1 text-right">{formatScore(p.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
