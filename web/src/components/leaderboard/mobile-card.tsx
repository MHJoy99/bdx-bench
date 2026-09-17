"use client";

import Link from "next/link";
import type { LeaderboardTableRow } from "./columns";
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
    <div className="flex items-center justify-between gap-2 rounded-[6px] bg-[var(--elevated)] px-2 py-1.5">
      <span className="text-[11px] uppercase tracking-wide text-[var(--text-tertiary)]">
        {label}
      </span>
      <span className="tnum text-[13px] font-medium text-[var(--text)]">
        {scoreText(value)}
      </span>
    </div>
  );
}

export function LeaderboardMobileCard({
  row,
  rank,
  activeCategory,
}: {
  row: LeaderboardTableRow;
  rank: number;
  activeCategory?: string;
}) {
  const highlight = (key: string) =>
    activeCategory === key ? "ring-1 ring-[var(--ring)]" : "";
  const overallText = scoreText(row.scores.overall);
  return (
    <article
      aria-label={`Rank ${rank}: ${row.name}, overall ${overallText}`}
      className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className="tnum inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-[6px] bg-[var(--elevated)] px-1.5 text-[13px] font-semibold"
          >
            {rank}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-[13px] font-semibold text-[var(--text)]">
              <Link href={`/models/${row.slug}`} className="underline-offset-4 hover:underline">
                {row.name}
              </Link>
            </h3>
            <p className="truncate font-mono text-[11px] text-[var(--text-tertiary)]">
              {row.slug} · <span className="capitalize">{row.provider}</span>
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[11px] uppercase tracking-wide text-[var(--text-tertiary)]">
            Overall
          </div>
          <div className="tnum text-xl font-semibold text-[var(--text)]">
            {overallText}
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
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
  activeCategory,
}: {
  rows: LeaderboardTableRow[];
  activeCategory?: string;
}) {
  return (
    <div className="space-y-3 md:hidden" role="list" aria-label="Leaderboard cards">
      {rows.map((row) => (
        <div key={row.slug} role="listitem">
          <LeaderboardMobileCard
            row={row}
            rank={row.rank ?? 0}
            activeCategory={activeCategory}
          />
        </div>
      ))}
    </div>
  );
}
