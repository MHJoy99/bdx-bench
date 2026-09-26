"use client";

import Link from "next/link";
import {
  AUDIT_DIMENSIONS,
  AUDIT_TRAIL,
  dimensionStatus,
  type AuditDimensionKey,
  type AuditEntry,
} from "@/lib/audit-data";
import { MOTION_SCORE_DELAY, MOTION_STAGGER } from "@/lib/motion-tokens";
import {
  DimensionBar,
  FadeIn,
  ScoreReveal,
  StaggerGroup,
  StaggerItem,
} from "@/components/motion/polish-motion";

/**
 * Category leaders.
 *
 * The old version rendered eight identical cards that all claimed to be the
 * leader of the same category, which is how a benchmark loses an engineer's
 * trust. This presents the one measured category honestly: who leads it overall,
 * then who leads each of the five audit dimensions inside it, with the count of
 * builds that clear the pass bar. Every value is derived from `AUDIT_TRAIL`.
 */

function dimensionLeader(key: AuditDimensionKey): AuditEntry | null {
  return (
    AUDIT_TRAIL.reduce<AuditEntry | null>((best, entry) => {
      if (!best) return entry;
      const a = entry.dims[key];
      const b = best.dims[key];
      if (a > b) return entry;
      if (a === b && entry.total > best.total) return entry;
      return best;
    }, null) ?? null
  );
}

export function CategoryLeaders() {
  const leader = AUDIT_TRAIL.reduce((a, b) => (b.total > a.total ? b : a));
  const leaderBuilds = AUDIT_TRAIL.filter((e) => e.modelSlug === leader.modelSlug).length;

  const dimensions = AUDIT_DIMENSIONS.map((d) => ({
    dimension: d,
    entry: dimensionLeader(d.key),
    passing: AUDIT_TRAIL.filter((e) => dimensionStatus(e.dims[d.key]) === "pass").length,
  }));

  return (
    <section aria-labelledby="home-category-leaders-heading" className="scroll-mt-20">
      <FadeIn>
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b border-[var(--border)] pb-2">
          <div className="min-w-0">
            <h2
              id="home-category-leaders-heading"
              className="text-[15px] font-semibold tracking-tight text-[var(--text)]"
            >
              Category leaders
            </h2>
            <p className="mt-0.5 text-[12px] leading-[18px] text-[var(--text-secondary)]">
              Zombie Flamethrower Showdown · game-build · the only category with
              measured data.
            </p>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
            {AUDIT_TRAIL.length} builds · {new Set(AUDIT_TRAIL.map((e) => e.modelSlug)).size} models
          </span>
        </div>
      </FadeIn>

      {/* Overall leader for the measured category. */}
      <FadeIn delay={0.04}>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
              Showdown Score · category leader
            </p>
            <p className="mt-0.5 text-[13px] font-semibold text-[var(--text)]">
              <Link
                href={`/models/${leader.modelSlug}`}
                className="underline-offset-2 hover:underline"
              >
                {leader.modelName}
              </Link>
            </p>
            <p className="mt-0.5 text-[11px] leading-[15px] text-[var(--text-secondary)]">
              {leader.buildName} ·{" "}
              {leaderBuilds > 1
                ? `${leaderBuilds} builds audited`
                : "1 build audited"}{" "}
              · {leader.findings.length} verified findings
            </p>
          </div>
          <div className="shrink-0 text-right">
            <ScoreReveal
              value={leader.total}
              decimals={1}
              className="tnum block text-[22px] font-semibold leading-[24px] text-[var(--text)]"
            />
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
              of 100
            </span>
          </div>
        </div>
      </FadeIn>

      {/* Leaders per audit dimension. */}
      <StaggerGroup className="mt-3 grid gap-px overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-5">
        {dimensions.map(({ dimension, entry, passing }, i) => (
          <StaggerItem key={dimension.key} className="bg-[var(--surface)] p-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
              {dimension.short}
            </p>
            {entry ? (
              <>
                <p className="mt-1 truncate text-[12px] font-medium text-[var(--text)]">
                  <Link
                    href={`/models/${entry.modelSlug}`}
                    className="underline-offset-2 hover:underline"
                  >
                    {entry.modelName}
                  </Link>
                </p>
                <p className="mt-1 flex items-baseline gap-1">
                  <span className="tnum text-[15px] font-semibold leading-[18px] text-[var(--text)]">
                    <ScoreReveal
                      value={entry.dims[dimension.key]}
                      decimals={0}
                      delay={MOTION_SCORE_DELAY + i * MOTION_STAGGER.dimension}
                    />
                  </span>
                  <span className="text-[11px] text-[var(--text-tertiary)]">/20</span>
                </p>
                <DimensionBar
                  dimension={dimension}
                  points={entry.dims[dimension.key]}
                  index={i}
                  showLabel={false}
                  className="mt-1.5"
                />
                <p className="mt-1.5 text-[10px] leading-[14px] text-[var(--text-tertiary)]">
                  {passing} of {AUDIT_TRAIL.length} builds pass
                </p>
              </>
            ) : (
              <p className="mt-1 text-[12px] text-[var(--text-tertiary)]">Not evaluated</p>
            )}
          </StaggerItem>
        ))}
      </StaggerGroup>

      <p className="mt-2 text-[11px] leading-[16px] text-[var(--text-tertiary)]">
        Leaders are the highest-scoring audited build per dimension, out of 20
        points each. Other categories show as Not evaluated until measured.
      </p>
    </section>
  );
}
