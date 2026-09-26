"use client";

import Link from "next/link";
import { ChevronRight, Play, ArrowUpRight } from "lucide-react";
import {
  AUDIT_DIMENSIONS,
  type AuditEntry,
} from "@/lib/audit-data";
import { cn } from "@/lib/utils";
import {
  DimensionBar,
  DimensionBars,
  FlipList,
  RankChangeEdge,
  ScoreReveal,
} from "@/components/motion/polish-motion";
import { AuditFindings } from "@/components/artifact/artifact-card";
import { COMPARE_MAX_MODELS } from "@/components/compare/compare-data";
import {
  altEntryFor,
  auditEntryFor,
  findingCountsFor,
  showdownScore,
  type LeaderboardTableRow,
} from "./columns";
import {
  formatDate,
  formatPrice,
  formatScore,
  formatTokens,
  formatTps,
} from "@/lib/format";

function scoreText(v: unknown): string {
  return typeof v === "number" && Number.isFinite(v)
    ? formatScore(v)
    : "Not evaluated";
}

function ScoreGridItem({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-[6px] bg-[var(--elevated)] px-2 py-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
      <span className="text-[11px] uppercase tracking-wide text-[var(--text-tertiary)]">
        {label}
      </span>
      <span className="tnum whitespace-nowrap text-[13px] font-medium text-[var(--text)]">
        {scoreText(value)}
      </span>
    </div>
  );
}

const chipClass =
  "inline-flex items-center gap-1 rounded-[6px] border px-1.5 py-1 font-mono text-[10px] uppercase leading-none tracking-wider";

const actionClass =
  "inline-flex items-center gap-1 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-[11px] leading-none text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text)]";

/** The expanded audit trail — the same trust engine the desktop row shows. */
function MobileAuditTrail({ entry, slug }: { entry: AuditEntry; slug: string }) {
  const alt = altEntryFor(slug, entry.total);
  return (
    <div className="mt-3 space-y-3 border-t border-[var(--border)] pt-3">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
          Per-dimension evidence · 20 pts each
        </p>
        <DimensionBars dims={entry.dims} className="mt-2" />
        <ul className="mt-2 space-y-0.5">
          {entry.implements.map((line) => (
            <li
              key={line}
              className="flex gap-1.5 text-[11px] leading-[16px] text-[var(--text-secondary)]"
            >
              <span aria-hidden="true" className="text-[var(--accent-ink)]">
                +
              </span>
              <span className="min-w-0">{line}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
          Audited {entry.generated} · {entry.mobileReady ? "touch ready" : "no touch support"}
        </p>
        {alt ? (
          <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
            Also shipped <span className="font-mono">{alt.buildId}</span> ·{" "}
            <span className="tnum">{alt.total.toFixed(2)}</span> / 100 ·{" "}
            {alt.findings.length} findings
          </p>
        ) : null}
      </div>
      <AuditFindings findings={entry.findings} />
    </div>
  );
}

export function LeaderboardMobileCard({
  row,
  rank,
  activeCategory,
  expanded,
  onToggleExpand,
  moved,
  moveToken,
  compareSelection,
  onToggleCompare,
}: {
  row: LeaderboardTableRow;
  rank: number;
  activeCategory?: string;
  expanded: ReadonlySet<string>;
  onToggleExpand: (slug: string) => void;
  moved: boolean;
  moveToken: number;
  compareSelection: readonly string[];
  onToggleCompare: (slug: string) => void;
}) {
  const highlight = (key: string) =>
    activeCategory === key ? "ring-1 ring-[var(--ring)]" : "";

  const score = showdownScore(row);
  const entry = auditEntryFor(row.slug, score);
  const counts = findingCountsFor(row.slug, score);
  const isOpen = expanded.has(row.slug);
  const inCompare = compareSelection.includes(row.slug);
  const overallText = scoreText(row.scores.overall);

  return (
    <article
      aria-label={`Rank ${rank}: ${row.name}, overall ${overallText}`}
      className="relative overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4"
    >
      {moved ? <RankChangeEdge token={moveToken} /> : null}

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className="tnum inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-[6px] bg-[var(--elevated)] px-1.5 text-[13px] font-semibold"
          >
            {String(rank).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-[13px] font-semibold text-[var(--text)]">
              <Link
                href={`/models/${row.slug}`}
                className="underline-offset-4 hover:underline"
              >
                {row.name}
              </Link>
            </h3>
            <p className="truncate font-mono text-[11px] text-[var(--text-tertiary)]">
              {row.slug} · <span className="capitalize">{row.provider}</span>
            </p>
            {entry ? (
              <p className="truncate font-mono text-[10px] text-[var(--text-tertiary)]">
                {entry.buildId} · {entry.buildName}
              </p>
            ) : null}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
            Showdown
          </div>
          <div className="flex items-baseline justify-end gap-1">
            <ScoreReveal
              value={score ?? 0}
              decimals={2}
              className={cn(
                "text-[18px] font-semibold leading-none",
                score !== null ? "text-[var(--text)]" : "text-[var(--text-tertiary)]",
              )}
            />
            <span className="tnum font-mono text-[10px] text-[var(--text-tertiary)]">
              /100
            </span>
          </div>
        </div>
      </div>

      {/* Evidence: dimension bars, verified defects, and the artifact itself. */}
      <div className="mt-3 grid grid-cols-5 gap-1.5">
        {AUDIT_DIMENSIONS.map((d, i) =>
          entry ? (
            <div key={d.key} className="min-w-0">
              <span className="tnum block text-center font-mono text-[10px] leading-none text-[var(--text)]">
                {entry.dims[d.key]}
                <span className="text-[var(--text-tertiary)]">/20</span>
              </span>
              <DimensionBar
                dimension={d}
                points={entry.dims[d.key]}
                index={i}
                showLabel={false}
                className="mt-1"
              />
              <span className="mt-1 block truncate text-center font-mono text-[9px] uppercase tracking-wider text-[var(--text-tertiary)]">
                {d.short}
              </span>
            </div>
          ) : (
            <div
              key={d.key}
              className="h-1 w-full rounded-full bg-[var(--elevated)]"
            />
          ),
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {entry ? (
          <Link
            href={entry.playPath}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              actionClass,
              "border-[var(--accent-border)] text-[var(--accent-ink)]",
            )}
          >
            <Play className="size-3" aria-hidden="true" />
            Play
          </Link>
        ) : null}
        <Link href={`/models/${row.slug}`} className={actionClass}>
          Evidence
          <ArrowUpRight className="size-3" aria-hidden="true" />
        </Link>
        <label className={cn(actionClass, "cursor-pointer select-none")}>
          <input
            type="checkbox"
            data-testid="compare-add"
            checked={inCompare}
            disabled={!inCompare && compareSelection.length >= COMPARE_MAX_MODELS}
            onChange={() => onToggleCompare(row.slug)}
            className="size-3 accent-[var(--accent)]"
          />
          <span className="sr-only">Add {row.name} to compare</span>
          <span aria-hidden="true">cmp</span>
        </label>
        {entry ? (
          <button
            type="button"
            onClick={() => onToggleExpand(row.slug)}
            aria-expanded={isOpen}
            className={cn(
              chipClass,
              counts
                ? counts.failing > 0
                  ? "border-[var(--danger)]/40 bg-[var(--danger-muted)] text-[var(--danger)]"
                  : "border-[var(--accent-border)] bg-[var(--accent-muted)] text-[var(--accent-ink)]"
                : "border-[var(--border-strong)] text-[var(--text-tertiary)]",
            )}
          >
            <ChevronRight
              className={cn("size-3 transition-transform duration-150", isOpen && "rotate-90")}
              aria-hidden="true"
            />
            {counts ? `${counts.total} findings · ${counts.failing} failing` : "Not audited"}
          </button>
        ) : null}
      </div>

      {isOpen && entry ? <MobileAuditTrail entry={entry} slug={row.slug} /> : null}

      <div className="mt-3 flex flex-wrap gap-1">
        <span className="rounded bg-[var(--elevated)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
          {row.openWeights ? "open-weights" : "proprietary"}
        </span>
        {row.capabilities.vision ? (
          <span className="rounded bg-[var(--elevated)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
            vision
          </span>
        ) : null}
        {row.capabilities.tools ? (
          <span className="rounded bg-[var(--elevated)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
            tools
          </span>
        ) : null}
        {typeof row.rankDelta === "number" && row.rankDelta !== 0 ? (
          <span
            className={
              row.rankDelta > 0
                ? "rounded bg-[var(--success)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[var(--success)]"
                : "rounded bg-[var(--danger)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[var(--danger)]"
            }
          >
            {row.rankDelta > 0 ? `▲${row.rankDelta}` : `▼${Math.abs(row.rankDelta)}`}
          </span>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1.5">
        <div className={`${highlight("reasoning")} rounded-[6px]`}>
          <ScoreGridItem label="Reasoning" value={row.scores.reasoning} />
        </div>
        <div className={`${highlight("coding")} rounded-[6px]`}>
          <ScoreGridItem label="Coding" value={row.scores.coding} />
        </div>
        <div className={`${highlight("math")} rounded-[6px]`}>
          <ScoreGridItem label="Math" value={row.scores.math} />
        </div>
        <div className={`${highlight("knowledge")} rounded-[6px]`}>
          <ScoreGridItem label="Knowledge" value={row.scores.knowledge} />
        </div>
        <div className={`${highlight("vision")} rounded-[6px]`}>
          <ScoreGridItem label="Vision" value={row.scores.vision} />
        </div>
        <div className={`${highlight("agentic")} rounded-[6px]`}>
          <ScoreGridItem label="Agentic" value={row.scores.agentic} />
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-[var(--border)] pt-3 text-xs sm:grid-cols-4">
        <div>
          <dt className="text-[var(--text-tertiary)]">Speed</dt>
          <dd className="tnum font-medium text-[var(--text)]">
            {row.speed && Number.isFinite(row.speed.tps) ? formatTps(row.speed.tps) : "Not measured"}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--text-tertiary)]">In / Out</dt>
          <dd className="tnum font-medium text-[var(--text)]">
            {typeof (row.prices.inputPer1M as unknown) === "number" &&
            Number.isFinite(row.prices.inputPer1M as unknown as number) &&
            typeof (row.prices.outputPer1M as unknown) === "number" &&
            Number.isFinite(row.prices.outputPer1M as unknown as number)
              ? `${formatPrice(row.prices.inputPer1M as unknown as number)} / ${formatPrice(row.prices.outputPer1M as unknown as number)}`
              : "Not measured"}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--text-tertiary)]">Context</dt>
          <dd className="tnum font-medium text-[var(--text)]">
            {typeof (row.context as unknown) === "number" &&
            Number.isFinite(row.context as unknown as number)
              ? formatTokens(row.context as unknown as number)
              : "Not measured"}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--text-tertiary)]">Released</dt>
          <dd className="tnum font-medium text-[var(--text)]">
            {row.released ? formatDate(row.released) : "—"}
          </dd>
        </div>
      </dl>
    </article>
  );
}

export function LeaderboardMobileList({
  rows,
  order,
  movedSlugs,
  moveToken,
  expanded,
  onToggleExpand,
  compareSelection,
  onToggleCompare,
  activeCategory,
}: {
  rows: LeaderboardTableRow[];
  order: string[];
  movedSlugs: ReadonlySet<string>;
  moveToken: number;
  expanded: ReadonlySet<string>;
  onToggleExpand: (slug: string) => void;
  compareSelection: readonly string[];
  onToggleCompare: (slug: string) => void;
  activeCategory?: string;
}) {
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  return (
    <div className="md:hidden" role="group" aria-label="Leaderboard cards">
      <FlipList
        className="space-y-3"
        ids={order}
        order={order}
        itemClassName="w-full"
        renderItem={(slug) => {
          const row = bySlug.get(slug);
          if (!row) return null;
          return (
            <LeaderboardMobileCard
              row={row}
              rank={row.rank ?? 0}
              activeCategory={activeCategory}
              expanded={expanded}
              onToggleExpand={onToggleExpand}
              moved={movedSlugs.has(slug)}
              moveToken={moveToken}
              compareSelection={compareSelection}
              onToggleCompare={onToggleCompare}
            />
          );
        }}
      />
    </div>
  );
}
