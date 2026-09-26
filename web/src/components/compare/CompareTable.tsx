"use client";

import Link from "next/link";
import { ArrowUpRight, Play } from "lucide-react";
import type { Model } from "@/lib/types";
import {
  AUDIT_DIMENSIONS,
  AUDIT_TRAIL,
  dimensionStatus,
  type AuditDimensionKey,
  type AuditEntry,
} from "@/lib/audit-data";
import { DimensionBar, ScoreReveal } from "@/components/motion/polish-motion";
import {
  formatDate,
  formatPrice,
  formatRelative,
  formatScore,
  formatTokens,
  formatTps,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  COMPARE_METRICS,
  bestIndexesForMetric,
  type CompareMetricDef,
} from "./compare-data";

/**
 * COMPARE — the dimension matrix.
 *
 * Creative direction (GPT Orchestrator): engineers comparing builds want
 * TRADE-OFFS, not a verdict. So this is a per-dimension matrix — rows are the
 * five audited dimensions, columns are the selected models — plus a factual
 * per-row gap to the strongest cell in that row. No trophy, no "X wins", no
 * confetti, no giant score bars. The only ranking claim in this file is
 * per-row, and it is stated as a number ("7 points below the row max").
 */

/** 20 points per dimension, zero for an absent feature. The whole scale. */
export const DIMENSION_MAX = 20;

/**
 * Resolve a model's audited build. Two models shipped two builds each, so the
 * entry is matched against the published Showdown Score rather than taken from
 * the last row with that slug. Same rule as the leaderboard evidence table.
 */
export function auditForSlug(model: Model): AuditEntry | undefined {
  const list = AUDIT_TRAIL.filter((e) => e.modelSlug === model.slug);
  const first = list[0];
  if (!first) return undefined;
  if (typeof model.scores.overall === "number" && Number.isFinite(model.scores.overall)) {
    const exact = list.find((e) => e.total === model.scores.overall);
    if (exact) return exact;
  }
  return list.reduce((best, e) => (e.total > best.total ? e : best), first);
}

export function dimPoints(entry: AuditEntry | undefined, key: AuditDimensionKey): number | null {
  return entry ? entry.dims[key] : null;
}

export function severityBreakdown(entry: AuditEntry | undefined): {
  high: number;
  medium: number;
  low: number;
} {
  const findings = entry?.findings ?? [];
  return {
    high: findings.filter((f) => f.severity === "high").length,
    medium: findings.filter((f) => f.severity === "medium").length,
    low: findings.filter((f) => f.severity === "low").length,
  };
}

/* ------------------------------------------------------------------ *
 * Catalog metrics (unmeasured in this round) — kept so nothing that used
 * to be displayed disappears. Collapsed: it is all "Not evaluated".
 * ------------------------------------------------------------------ */

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function cellText(
  model: Model,
  key: CompareMetricDef["key"],
): { text: string; sub?: string } {
  const rec = model as unknown as {
    scores?: Record<string, unknown>;
    prices?: { inputPer1M?: unknown; outputPer1M?: unknown; currency?: unknown };
    speed?: { tps?: unknown; ttftMs?: unknown };
    context?: unknown;
    released?: unknown;
    openWeights?: unknown;
    capabilities?: { multimodal?: unknown; tools?: unknown };
  };
  switch (key) {
    case "overall":
      return { text: num(rec.scores?.["overall"]) === null ? "Not evaluated" : formatScore(num(rec.scores?.["overall"]) as number) };
    case "reasoning":
      return { text: num(rec.scores?.["reasoning"]) === null ? "Not evaluated" : formatScore(num(rec.scores?.["reasoning"]) as number) };
    case "coding":
      return { text: num(rec.scores?.["coding"]) === null ? "Not evaluated" : formatScore(num(rec.scores?.["coding"]) as number) };
    case "math":
      return { text: num(rec.scores?.["math"]) === null ? "Not evaluated" : formatScore(num(rec.scores?.["math"]) as number) };
    case "knowledge":
      return { text: num(rec.scores?.["knowledge"]) === null ? "Not evaluated" : formatScore(num(rec.scores?.["knowledge"]) as number) };
    case "vision":
      return { text: num(rec.scores?.["vision"]) === null ? "Not evaluated" : formatScore(num(rec.scores?.["vision"]) as number) };
    case "agentic":
      return { text: num(rec.scores?.["agentic"]) === null ? "Not evaluated" : formatScore(num(rec.scores?.["agentic"]) as number) };
    case "price": {
      const inp = num(rec.prices?.inputPer1M);
      const out = num(rec.prices?.outputPer1M);
      if (inp === null || out === null) return { text: "Not measured" };
      const currency = typeof rec.prices?.currency === "string" ? rec.prices.currency : "USD";
      const blended = Math.round((inp * 0.75 + out * 0.25) * 100) / 100;
      return {
        text: formatPrice(blended, currency),
        sub: `in ${formatPrice(inp, currency)} · out ${formatPrice(out, currency)}`,
      };
    }
    case "speed": {
      const tps = num(rec.speed?.tps);
      if (tps === null) return { text: "Not measured" };
      const ttft = num(rec.speed?.ttftMs);
      return {
        text: formatTps(tps),
        sub: ttft !== null ? `${Math.round(ttft)} ms to first token` : undefined,
      };
    }
    case "latency": {
      const ttft = num(rec.speed?.ttftMs);
      if (ttft === null) return { text: "Not measured" };
      return { text: `${Math.round(ttft)} ms` };
    }
    case "context": {
      const c = num(rec.context);
      return { text: c === null ? "Not measured" : formatTokens(c) };
    }
    case "released": {
      const rel = typeof rec.released === "string" ? rec.released : "";
      if (!rel) return { text: "—" };
      return { text: formatDate(rel), sub: formatRelative(rel) };
    }
    case "openWeights":
      return { text: rec.openWeights === true ? "Yes (open)" : rec.openWeights === false ? "No (closed)" : "—" };
    case "multimodal":
      return { text: rec.capabilities?.multimodal === true ? "Yes" : rec.capabilities?.multimodal === false ? "No" : "—" };
    case "toolCalling":
      return { text: rec.capabilities?.tools === true ? "Yes" : rec.capabilities?.tools === false ? "No" : "—" };
  }
}

function isMissing(model: Model, key: CompareMetricDef["key"]): boolean {
  const t = cellText(model, key).text;
  return t === "Not evaluated" || t === "Not measured";
}

function CatalogMetrics({ models }: { models: readonly Model[] }) {
  return (
    <details className="border-t border-[var(--border)]">
      <summary className="cursor-pointer px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]">
        Catalog metadata — reasoning, price, speed, context, license (
        {COMPARE_METRICS.length} rows, not evaluated this round)
      </summary>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-[13px]">
          <caption className="sr-only">
            Catalog metadata for the selected models. Every row in this table is
            unmeasured in the current audit round.
          </caption>
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th scope="col" className="p-2.5 text-left font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--text-tertiary)]">
                Metric
              </th>
              {models.map((m) => (
                <th key={m.slug} scope="col" className="p-2.5 text-left font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--text-tertiary)]">
                  {m.slug}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARE_METRICS.map((metric) => {
              const bestRaw = new Set(bestIndexesForMetric(models, metric.key));
              const best = new Set<number>();
              bestRaw.forEach((i) => {
                const m = models[i];
                if (m && !isMissing(m, metric.key)) best.add(i);
              });
              return (
                <tr key={metric.key} className="border-b border-[var(--border)]/60 last:border-b-0">
                  <th scope="row" className="max-w-[200px] p-2.5 text-left align-top text-[12px] font-medium text-[var(--text)]" title={metric.hint}>
                    {metric.label}
                  </th>
                  {models.map((m, i) => {
                    const { text, sub } = cellText(m, metric.key);
                    const stronger = best.has(i);
                    return (
                      <td
                        key={m.slug}
                        data-metric={metric.key}
                        data-stronger={stronger ? "true" : "false"}
                        className={cn("p-2.5 align-top", stronger && "bg-[var(--accent-muted)]/20")}
                      >
                        <span className={cn("tnum text-[var(--text-secondary)]", stronger && "text-[var(--accent-ink)]")}>
                          {text}
                        </span>
                        {sub ? (
                          <span className="mt-0.5 block text-[11px] text-[var(--text-tertiary)]">{sub}</span>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/* ------------------------------------------------------------------ *
 * The matrix
 * ------------------------------------------------------------------ */

export interface CompareTableProps {
  models: readonly Model[];
}

export function CompareTable({ models }: CompareTableProps) {
  const entries = models.map((m) => auditForSlug(m));

  return (
    <section
      data-testid="compare-table"
      aria-labelledby="compare-table-heading"
      className="overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]"
    >
      <div className="flex flex-wrap items-baseline gap-2 border-b border-[var(--border)] px-3 py-2.5">
        <h2 id="compare-table-heading" className="text-[13px] font-semibold text-[var(--text)]">
          Dimension matrix
        </h2>
        <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
          Showdown Score v2 · 5 dimensions × 20 pts
        </p>
        <span className="flex-1" />
        <p className="w-full text-[11px] leading-[16px] text-[var(--text-secondary)] sm:w-auto">
          Every cell is a verified audit of that model&apos;s build. Each cell
          states its own gap to the strongest value in that row. No overall
          ranking is declared.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-[13px]">
          <caption className="sr-only">
            Per-dimension Showdown Score matrix for {models.length} models. Rows
            are the five audited dimensions at 20 points each, plus the
            verified findings behind them.
          </caption>
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th
                scope="col"
                className="sticky left-0 z-10 w-[168px] bg-[var(--surface)] p-2.5 text-left align-bottom shadow-[1px_0_0_0_var(--border)]"
              >
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--text-tertiary)]">
                  Dimension
                </span>
              </th>
              {models.map((m) => (
                <th key={m.slug} scope="col" className="min-w-[168px] p-2.5 text-left align-bottom">
                  <Link
                    href={`/models/${m.slug}`}
                    className="block truncate text-[13px] font-semibold text-[var(--text)] underline-offset-4 hover:underline"
                  >
                    {m.name}
                  </Link>
                  <span className="mt-0.5 block truncate font-mono text-[10px] text-[var(--text-tertiary)]">
                    {m.slug}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-[var(--text-secondary)]">
                    {m.family} · {m.provider}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* Total: precision over theatre. */}
            <tr className="border-b border-[var(--border)]/70">
              <th
                scope="row"
                className="sticky left-0 z-10 bg-[var(--surface)] p-2.5 text-left align-top font-medium shadow-[1px_0_0_0_var(--border)]"
              >
                <span className="block text-[12px] text-[var(--text)]">Showdown Score</span>
                <span className="mt-0.5 block text-[10px] font-normal text-[var(--text-tertiary)]">
                  total, 0–100
                </span>
              </th>
              {models.map((m, i) => (
                <td key={m.slug} data-metric="overall" className="p-2.5 align-top">
                  {entries[i] ? (
                    <span className="flex items-baseline gap-1">
                      <ScoreReveal
                        value={entries[i]?.total ?? 0}
                        decimals={2}
                        className="text-[17px] font-semibold leading-none text-[var(--text)]"
                      />
                      <span className="tnum font-mono text-[10px] text-[var(--text-tertiary)]">
                        /100
                      </span>
                    </span>
                  ) : (
                    <span className="tnum text-[12px] text-[var(--text-tertiary)]">Not evaluated</span>
                  )}
                </td>
              ))}
            </tr>

            {/* The artifact itself: hierarchy is artifact -> evidence -> score. */}
            <tr className="border-b border-[var(--border)]/70">
              <th
                scope="row"
                className="sticky left-0 z-10 bg-[var(--surface)] p-2.5 text-left align-top font-medium shadow-[1px_0_0_0_var(--border)]"
              >
                <span className="block text-[12px] text-[var(--text)]">Build</span>
                <span className="mt-0.5 block text-[10px] font-normal text-[var(--text-tertiary)]">
                  the audited artifact
                </span>
              </th>
              {models.map((m, i) => {
                const e = entries[i];
                return (
                  <td key={m.slug} className="p-2.5 align-top">
                    {e ? (
                      <span className="flex flex-col gap-1">
                        <span className="block truncate font-mono text-[11px] text-[var(--text)]">
                          {e.buildId}
                        </span>
                        <span className="block truncate text-[11px] text-[var(--text-secondary)]">
                          {e.buildName}
                        </span>
                        <Link
                          href={e.playPath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex w-fit items-center gap-1 rounded-[6px] border border-[var(--accent-border)] bg-[var(--accent-muted)] px-2 py-1 font-mono text-[10px] uppercase tracking-wider leading-none text-[var(--accent-ink)] transition-colors hover:border-[var(--accent)]"
                        >
                          <Play className="size-3" aria-hidden="true" />
                          Play
                        </Link>
                      </span>
                    ) : (
                      <span className="text-[11px] text-[var(--text-tertiary)]">No audited build</span>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* The five audited dimensions: the actual comparison. */}
            {AUDIT_DIMENSIONS.map((dim) => {
              const values = entries.map((e) => dimPoints(e, dim.key));
              const present = values.filter((v): v is number => v !== null);
              const rowMax = present.length > 0 ? Math.max(...present) : null;
              return (
                <tr
                  key={dim.key}
                  data-metric={dim.key}
                  className="border-b border-[var(--border)]/70"
                >
                  <th
                    scope="row"
                    className="sticky left-0 z-10 bg-[var(--surface)] p-2.5 text-left align-top font-medium shadow-[1px_0_0_0_var(--border)]"
                  >
                    <span className="block text-[12px] text-[var(--text)]">{dim.label}</span>
                    <span className="mt-0.5 block text-[10px] font-normal text-[var(--text-tertiary)]">
                      20 pts
                    </span>
                  </th>
                  {models.map((m, i) => {
                    const v = values[i];
                    if (v === null || v === undefined || rowMax === null) {
                      return (
                        <td key={m.slug} className="p-2.5 align-top">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                            Not audited
                          </span>
                        </td>
                      );
                    }
                    const gap = rowMax - v;
                    const status = dimensionStatus(v);
                    return (
                      <td
                        key={m.slug}
                        data-stronger={gap === 0 ? "true" : "false"}
                        title={
                          gap === 0
                            ? `Highest value in the ${dim.label} row (${v} of ${DIMENSION_MAX})`
                            : `${gap} of ${DIMENSION_MAX} points below the highest value in the ${dim.label} row`
                        }
                        className="p-2.5 align-top"
                      >
                        <span className="flex flex-col gap-1">
                          <span className="flex items-baseline gap-1.5">
                            <span
                              className={cn(
                                "tnum text-[14px] font-semibold leading-none",
                                status === "pass" && "text-[var(--success)]",
                                status === "partial" && "text-[var(--warning)]",
                                status === "fail" && "text-[var(--danger)]",
                              )}
                            >
                              {v}
                            </span>
                            <span className="tnum font-mono text-[10px] text-[var(--text-tertiary)]">
                              /{DIMENSION_MAX}
                            </span>
                            <span className="ml-auto font-mono text-[10px] text-[var(--text-tertiary)]">
                              {gap === 0 ? "max" : `−${gap}`}
                            </span>
                          </span>
                          <DimensionBar dimension={dim} points={v} index={0} showLabel={false} />
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* Findings: the part that makes the score arguable. */}
            <tr className="border-b border-[var(--border)]/70">
              <th
                scope="row"
                className="sticky left-0 z-10 bg-[var(--surface)] p-2.5 text-left align-top font-medium shadow-[1px_0_0_0_var(--border)]"
              >
                <span className="block text-[12px] text-[var(--text)]">Verified findings</span>
                <span className="mt-0.5 block text-[10px] font-normal text-[var(--text-tertiary)]">
                  defects, worst first
                </span>
              </th>
              {models.map((m, i) => {
                const e = entries[i];
                if (!e) {
                  return (
                    <td key={m.slug} className="p-2.5 align-top">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                        Not audited
                      </span>
                    </td>
                  );
                }
                const b = severityBreakdown(e);
                return (
                  <td key={m.slug} className="p-2.5 align-top">
                    <span className="flex flex-wrap items-center gap-1">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-[6px] border px-1.5 py-1 font-mono text-[10px] uppercase leading-none tracking-wider",
                          b.high > 0
                            ? "border-[var(--danger)]/40 bg-[var(--danger-muted)] text-[var(--danger)]"
                            : "border-[var(--accent-border)] bg-[var(--accent-muted)] text-[var(--accent-ink)]",
                        )}
                        title="Findings verified as failures"
                      >
                        {b.high} failing
                      </span>
                      <span className="font-mono text-[10px] text-[var(--text-secondary)]">
                        {e.findings.length} total
                      </span>
                    </span>
                    <span className="mt-1 block font-mono text-[10px] leading-[14px] text-[var(--text-tertiary)]">
                      {b.high} high · {b.medium} medium · {b.low} low
                    </span>
                    <Link
                      href={`/models/${m.slug}`}
                      className="mt-1 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] underline-offset-2 hover:text-[var(--text-secondary)] hover:underline"
                    >
                      Read the audit
                      <ArrowUpRight className="size-3" aria-hidden="true" />
                    </Link>
                  </td>
                );
              })}
            </tr>

            <tr>
              <th
                scope="row"
                className="sticky left-0 z-10 bg-[var(--surface)] p-2.5 text-left align-top font-medium shadow-[1px_0_0_0_var(--border)]"
              >
                <span className="block text-[12px] text-[var(--text)]">Touch support</span>
                <span className="mt-0.5 block text-[10px] font-normal text-[var(--text-tertiary)]">
                  verified in build
                </span>
              </th>
              {models.map((m, i) => {
                const e = entries[i];
                return (
                  <td key={m.slug} className="p-2.5 align-top">
                    {e ? (
                      <span
                        className={cn(
                          "font-mono text-[11px]",
                          e.mobileReady
                            ? "text-[var(--success)]"
                            : "text-[var(--warning)]",
                        )}
                      >
                        {e.mobileReady ? "Touch ready" : "No touch support"}
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                        Not audited
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {models.length > 1 ? <CatalogMetrics models={models} /> : null}
    </section>
  );
}
