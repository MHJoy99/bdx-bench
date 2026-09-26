"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight, Play } from "lucide-react";
import type { Model } from "@/lib/types";
import { AUDIT_DIMENSIONS } from "@/lib/audit-data";
import {
  DimensionBar,
  ScoreReveal,
  StaggerGroup,
  StaggerItem,
} from "@/components/motion/polish-motion";
import { cn } from "@/lib/utils";
import {
  DIMENSION_MAX,
  auditForSlug,
  dimPoints,
  severityBreakdown,
} from "./CompareTable";

/**
 * COMPARE — the visual read of the dimension matrix.
 *
 * Creative direction (GPT Orchestrator): no giant score bars, no winner
 * language. This is a set of equal-width per-model dimension profiles so the
 * SHAPE of each build is comparable at a glance, followed by a written,
 * factual list of the measured differences. The reader gets the trade-offs;
 * the page never declares a winner.
 */

export interface CompareChartsProps {
  models: readonly Model[];
}

interface ModelProfile {
  model: Model;
  entry: ReturnType<typeof auditForSlug>;
}

interface Difference {
  label: string;
  spread: number;
  high: { name: string; value: string };
  low: { name: string; value: string };
}

const actionClass =
  "inline-flex items-center gap-1 rounded-[6px] border px-2 py-1 font-mono text-[10px] uppercase leading-none tracking-wider transition-colors";

function ProfileCard({ profile }: { profile: ModelProfile }) {
  const { model, entry } = profile;
  const sev = severityBreakdown(entry);

  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-2.5">
      <div className="min-w-0">
        <Link
          href={`/models/${model.slug}`}
          className="block truncate text-[12px] font-semibold text-[var(--text)] underline-offset-4 hover:underline"
        >
          {model.name}
        </Link>
        <p className="truncate font-mono text-[10px] text-[var(--text-tertiary)]">
          {model.slug}
        </p>
      </div>

      {entry ? (
        <>
          <div className="flex items-baseline gap-1">
            <ScoreReveal
              value={entry.total}
              decimals={2}
              className="text-[16px] font-semibold leading-none text-[var(--text)]"
            />
            <span className="tnum font-mono text-[10px] text-[var(--text-tertiary)]">
              /100
            </span>
            <span className="ml-auto truncate font-mono text-[9px] uppercase tracking-wider text-[var(--text-tertiary)]">
              {entry.buildId}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {AUDIT_DIMENSIONS.map((d, i) => (
              <DimensionBar
                key={d.key}
                dimension={d}
                points={entry.dims[d.key]}
                index={i}
              />
            ))}
          </div>
          <p className="font-mono text-[10px] leading-[14px] text-[var(--text-tertiary)]">
            <span className="text-[var(--text-secondary)]">{entry.findings.length} findings</span>
            {" · "}
            <span
              className={cn(
                sev.high > 0 ? "text-[var(--danger)]" : "text-[var(--accent-ink)]",
              )}
            >
              {sev.high} failing
            </span>
            {" · "}
            <span className={entry.mobileReady ? "text-[var(--success)]" : "text-[var(--warning)]"}>
              {entry.mobileReady ? "touch ready" : "no touch"}
            </span>
          </p>
          <div className="mt-auto flex flex-wrap gap-1 pt-1">
            <Link
              href={entry.playPath}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                actionClass,
                "border-[var(--accent-border)] bg-[var(--accent-muted)] text-[var(--accent-ink)] hover:border-[var(--accent)]",
              )}
            >
              <Play className="size-3" aria-hidden="true" />
              Play
            </Link>
            <Link
              href={`/models/${model.slug}`}
              className={cn(
                actionClass,
                "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text)]",
              )}
            >
              Audit
              <ArrowUpRight className="size-3" aria-hidden="true" />
            </Link>
          </div>
        </>
      ) : (
        <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
          Not audited in this round
        </p>
      )}
    </div>
  );
}

export function CompareCharts({ models }: CompareChartsProps) {
  const profiles = useMemo<ModelProfile[]>(
    () => models.map((m) => ({ model: m, entry: auditForSlug(m) })),
    [models],
  );

  const differences = useMemo<Difference[]>(() => {
    const audited = profiles.filter((p) => p.entry);
    if (audited.length < 2) return [];

    const rows: Difference[] = [];

    const totals = audited.map((p) => ({
      name: p.model.name,
      value: p.entry?.total ?? 0,
    }));
    const totalMax = Math.max(...totals.map((t) => t.value));
    const totalMin = Math.min(...totals.map((t) => t.value));
    rows.push({
      label: "Showdown Score",
      spread: totalMax - totalMin,
      high: {
        name: totals.find((t) => t.value === totalMax)?.name ?? "—",
        value: totalMax.toFixed(2),
      },
      low: {
        name: totals.find((t) => t.value === totalMin)?.name ?? "—",
        value: totalMin.toFixed(2),
      },
    });

    for (const dim of AUDIT_DIMENSIONS) {
      const values = audited.map((p) => ({
        name: p.model.name,
        value: dimPoints(p.entry, dim.key) ?? 0,
      }));
      const max = Math.max(...values.map((v) => v.value));
      const min = Math.min(...values.map((v) => v.value));
      if (max === min) {
        rows.push({
          label: dim.label,
          spread: 0,
          high: { name: "all builds", value: String(max) },
          low: { name: "all builds", value: String(max) },
        });
        continue;
      }
      rows.push({
        label: dim.label,
        spread: max - min,
        high: {
          name: values.filter((v) => v.value === max).map((v) => v.name).join(" + "),
          value: String(max),
        },
        low: {
          name: values.filter((v) => v.value === min).map((v) => v.name).join(" + "),
          value: String(min),
        },
      });
    }

    const failing = audited.map((p) => ({
      name: p.model.name,
      value: severityBreakdown(p.entry).high,
    }));
    const failMax = Math.max(...failing.map((f) => f.value));
    const failMin = Math.min(...failing.map((f) => f.value));
    rows.push({
      label: "Verified failures",
      spread: failMax - failMin,
      high: {
        name: failing.filter((f) => f.value === failMin).map((f) => f.name).join(" + "),
        value: String(failMin),
      },
      low: {
        name: failing.filter((f) => f.value === failMax).map((f) => f.name).join(" + "),
        value: String(failMax),
      },
    });

    return rows.sort((a, b) => b.spread - a.spread);
  }, [profiles]);

  const measuredPrices = models.filter(
    (m) => m.prices.inputPer1M !== null && m.prices.outputPer1M !== null,
  ).length;
  const measuredSpeed = models.filter(
    (m) => m.speed !== undefined && Number.isFinite(m.speed.tps),
  ).length;

  if (models.length < 2) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-2">
        <h2 className="text-[13px] font-semibold text-[var(--text)]">
          Dimension profile
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
          {AUDIT_DIMENSIONS.length} dimensions × {DIMENSION_MAX} pts · bars fill
          once
        </span>
      </div>

      <StaggerGroup gap={0.045}>
        <div
          role="group"
          aria-label="Per-model audit dimension profiles"
          className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4"
        >
          {profiles.map((p) => (
            <StaggerItem key={p.model.slug} y={6} className="min-w-0 h-full">
              <ProfileCard profile={p} />
            </StaggerItem>
          ))}
        </div>
      </StaggerGroup>

      {differences.length > 0 ? (
        <section
          aria-labelledby="compare-differences-heading"
          className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-3"
        >
          <h3
            id="compare-differences-heading"
            className="text-[12px] font-semibold text-[var(--text)]"
          >
            Measured differences
          </h3>
          <p className="mt-0.5 text-[11px] leading-[16px] text-[var(--text-secondary)]">
            Widest gaps first. These are point differences on the audited scale,
            not a ranking.
          </p>
          <dl className="mt-2 divide-y divide-[var(--border)]">
            {differences.map((d) => (
              <div
                key={d.label}
                className="grid grid-cols-1 gap-0.5 py-1.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-3"
              >
                <dt className="min-w-0 text-[12px] text-[var(--text)]">
                  {d.label}
                </dt>
                <dd className="tnum font-mono text-[11px] text-[var(--text-secondary)]">
                  {d.spread === 0 ? (
                    <span>no spread · {d.high.value} across the selection</span>
                  ) : (
                    <span>
                      {d.spread}-pt spread · {d.high.name} {d.high.value} ·{" "}
                      {d.low.name} {d.low.value}
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-[11px] leading-[16px] text-[var(--text-tertiary)]">
            No overall winner is declared and none is implied: the five
            dimensions do not move together, so a build that leads on one axis
            routinely trails on another. Read the row you care about, then play
            the build.
          </p>
        </section>
      ) : null}

      <details className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)]">
        <summary className="cursor-pointer px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]">
          Plots that need measurements this round
        </summary>
        <div className="border-t border-[var(--border)] px-3 py-2 text-[11px] leading-[16px] text-[var(--text-secondary)]">
          <p>
            Price bars, speed bars, quality-vs-price and quality-vs-speed plots
            need verified price and throughput numbers. In this selection{" "}
            <span className="tnum text-[var(--text)]">{measuredPrices}</span> of{" "}
            <span className="tnum text-[var(--text)]">{models.length}</span>{" "}
            models have a verified price and{" "}
            <span className="tnum text-[var(--text)]">{measuredSpeed}</span> of{" "}
            <span className="tnum text-[var(--text)]">{models.length}</span>{" "}
            have a measured tok/s, so those plots stay empty rather than
            estimated. The dimension matrix above is the source of truth for
            this round.
          </p>
        </div>
      </details>
    </div>
  );
}
