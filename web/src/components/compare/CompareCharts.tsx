"use client";

import { useMemo } from "react";
import type { Model } from "@/lib/types";
import { BarGroup, barsToTable } from "@/components/charts/BarGroup";
import { ChartShell } from "@/components/charts/ChartShell";
import { NotEnoughData } from "@/components/charts/NotEnoughData";
import { PriceBars, pricesToTable } from "@/components/charts/PriceBars";
import { RadarChart, radarToTable } from "@/components/charts/RadarChart";
import {
  NOT_EVALUATED,
  REAL_BAR_CATEGORIES,
  REAL_BAR_SERIES,
  REAL_BENCHMARK_LABEL,
  REAL_BENCHMARK_SLUG,
  REAL_EVAL_DATE,
  REAL_MATCH_ID,
  REAL_MODEL_FLASH,
  REAL_MODEL_SPARK,
  REAL_PROVENANCE_NOTE,
  REAL_RADAR,
  REAL_RADAR_AXES,
} from "@/components/charts/real-data";
import { SpeedBars, speedsToTable } from "@/components/charts/SpeedBars";

export interface CompareChartsProps {
  models: readonly Model[];
}

const REAL_SLUGS = [REAL_MODEL_SPARK.slug, REAL_MODEL_FLASH.slug] as const;

function displayName(m: Model): string {
  if (m.slug === REAL_MODEL_SPARK.slug) return REAL_MODEL_SPARK.name;
  if (m.slug === REAL_MODEL_FLASH.slug) return REAL_MODEL_FLASH.name;
  return m.name;
}

function Legend({ models }: { models: readonly Model[] }) {
  const dots = ["#B8FF5A", "#7DD3FC", "#C4B5FD", "#FCA5A5"];
  return (
    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
      {models.map((m, i) => (
        <li key={m.slug} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: dots[i % dots.length] }}
            aria-hidden="true"
          />
          <span className="font-medium text-foreground">{i + 1}</span> {displayName(m)}
        </li>
      ))}
    </ul>
  );
}

export function CompareCharts({ models }: CompareChartsProps) {
  const extraSlugs = useMemo(
    () =>
      models
        .map((m) => m.slug)
        .filter((s) => s !== REAL_MODEL_SPARK.slug && s !== REAL_MODEL_FLASH.slug),
    [models],
  );

  const radarTable = useMemo(
    () => radarToTable(REAL_RADAR, REAL_RADAR_AXES),
    [],
  );
  const barsTable = useMemo(
    () => barsToTable([...REAL_BAR_CATEGORIES], REAL_BAR_SERIES),
    [],
  );

  const priceEntries = useMemo(
    () => [
      { model: REAL_MODEL_SPARK.name, blendedPer1M: null, inputPer1M: null, outputPer1M: null },
      { model: REAL_MODEL_FLASH.name, blendedPer1M: null, inputPer1M: null, outputPer1M: null },
    ],
    [],
  );
  const speedEntries = useMemo(
    () => [
      { model: REAL_MODEL_SPARK.name, tps: null, ttftMs: null },
      { model: REAL_MODEL_FLASH.name, tps: null, ttftMs: null },
    ],
    [],
  );
  const priceTable = useMemo(() => pricesToTable(priceEntries), [priceEntries]);
  const speedTable = useMemo(() => speedsToTable(speedEntries), [speedEntries]);

  if (models.length < 2) return null;

  const names = models.map(displayName).join(", ");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold">Visual comparison</h2>
        <span className="flex-1" />
        <p className="text-[11px] text-muted-foreground">
          Same data as the tables below. Measured comparison:{" "}
          <code className="font-mono text-[11px]">
            /api/compare?models={REAL_SLUGS.join(",")}
          </code>
        </p>
      </div>
      <Legend models={models} />
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Measured snapshot: {REAL_MODEL_SPARK.name} {REAL_MODEL_SPARK.raw} vs {REAL_MODEL_FLASH.name}{" "}
        {REAL_MODEL_FLASH.raw} on {REAL_BENCHMARK_SLUG} ({REAL_PROVENANCE_NOTE}). Other models and
        dimensions are {NOT_EVALUATED}.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartShell
          title="Radar — capability profile"
          subtitle={`Evaluated dimensions only (${REAL_BENCHMARK_LABEL}). All other dimensions are ${NOT_EVALUATED}.`}
          height={340}
          table={radarTable}
          tableId="compare-table-radar"
          footer={<span>{REAL_PROVENANCE_NOTE}.</span>}
        >
          <RadarChart
            data={REAL_RADAR}
            axes={REAL_RADAR_AXES}
            height={340}
            ariaLabel={`Capability radar for ${names}, showdown dimension only`}
          />
          <p className="bdx-chart-foot">
            Single measured dimension ({REAL_BENCHMARK_LABEL}, {REAL_EVAL_DATE}). A polygon needs
            three or more measured axes; until then the table below is the source of truth.
          </p>
        </ChartShell>

        <ChartShell
          title="Grouped bars — showdown scores"
          subtitle={`${REAL_MODEL_SPARK.name} ${REAL_MODEL_SPARK.raw} vs ${REAL_MODEL_FLASH.name} ${REAL_MODEL_FLASH.raw} (0–100).`}
          height={340}
          table={barsTable}
          tableId="compare-table-bars"
          footer={<span>{REAL_PROVENANCE_NOTE}.</span>}
        >
          <BarGroup
            categories={[...REAL_BAR_CATEGORIES]}
            series={REAL_BAR_SERIES}
            height={340}
            ariaLabel={`Showdown bars for ${names}`}
          />
        </ChartShell>

        <ChartShell
          title="Price — blended $/1M"
          subtitle="Lower is better. No prices measured yet."
          height={260}
          table={priceTable}
          tableId="compare-table-price"
          isEmpty
          emptyMessage={
            <NotEnoughData tableId="compare-table-price" what="price" />
          }
        >
          <PriceBars entries={priceEntries} height={260} />
        </ChartShell>

        <ChartShell
          title="Speed — tok/s"
          subtitle="Higher tok/s is better. No speeds measured yet."
          height={260}
          table={speedTable}
          tableId="compare-table-speed"
          isEmpty
          emptyMessage={
            <NotEnoughData tableId="compare-table-speed" what="speed" />
          }
        >
          <SpeedBars entries={speedEntries} height={260} />
        </ChartShell>

        <ChartShell
          title="Quality vs price"
          subtitle="Needs measured price plus score for at least two models."
          height={280}
          table={priceTable}
          tableId="compare-table-qp"
          isEmpty
          emptyMessage={
            <NotEnoughData tableId="compare-table-qp" what="price for a quality-vs-price plot" />
          }
        >
          <p className="bdx-chart-foot">
            No Pareto frontier can be drawn from one benchmark with no measured prices. See the data
            table for the two measured scores ({REAL_MODEL_SPARK.raw}, {REAL_MODEL_FLASH.raw}).
          </p>
        </ChartShell>

        <ChartShell
          title="Quality vs speed"
          subtitle="Needs measured speed plus score for at least two models."
          height={280}
          table={speedTable}
          tableId="compare-table-qs"
          isEmpty
          emptyMessage={
            <NotEnoughData tableId="compare-table-qs" what="speed for a quality-vs-speed plot" />
          }
        >
          <p className="bdx-chart-foot">
            No speed measurements yet (match {REAL_MATCH_ID} recorded scores only). See the data
            table for the two measured scores.
          </p>
        </ChartShell>
      </div>
      {extraSlugs.length > 0 ? (
        <p className="text-[11px] text-muted-foreground" role="note">
          {extraSlugs.join(", ")}: {NOT_EVALUATED} on {REAL_BENCHMARK_SLUG} — no measured run yet.
        </p>
      ) : null}
    </div>
  );
}
