"use client";

import * as React from "react";
import Link from "next/link";
import {
  AUDIT_DIMENSIONS,
  dimensionStatus,
  type AuditEntry,
  type AuditDimensionKey,
} from "@/lib/audit-data";
import { StaggerGroup, StaggerItem } from "@/components/motion/polish-motion";
import {
  MOTION_BAR_DELAY,
  MOTION_DUR,
  MOTION_EASE,
  MOTION_STAGGER,
} from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";
import {
  DIMENSION_MAX,
  STATUS_LABEL,
  STATUS_TONE,
  dimensionLines,
  findingsForDimension,
  unassignedFindings,
} from "./Provenance";

/**
 * BDX Bench — EVALUATION BREAKDOWN.
 *
 * The five audit dimensions, each with its points/20 bar AND the specific
 * verified evidence for that dimension: the `implements` line the auditor
 * logged against it, and the verified defects that cost it points.
 *
 * Why the bars are local instead of the shared `DimensionBar`:
 * `DimensionBar` puts `whileInView` on its *fill* element, whose border box is
 * zero-width while the bar is at `scaleX(0)`. An IntersectionObserver on a
 * zero-area target is not a reliable "entered the viewport" signal — across
 * this page set some bars stayed at zero forever, which for an evidence
 * surface is the worst possible failure (a blank bar reads as a zero score).
 * `AuditBar` observes the full-width TRACK instead, so the trigger is always a
 * normal intersection, and the fill animates `transform: scaleX()` only, from
 * tokens, on a CSS transition that `globals.css` already zeroes for
 * reduced-motion users. Same DOM, same status colours, same stagger.
 *
 * The pure helpers this file needs (audit resolution, provider labels,
 * per-dimension attribution) live in `./Provenance`, which has no "use client"
 * directive so server pages can import them as values.
 */

const BAR_EASE = `cubic-bezier(${MOTION_EASE.out.join(", ")})`;

/** One-shot viewport gate on a non-zero-area element. */
function useOnceInView<T extends HTMLElement>(rootMargin: string) {
  const ref = React.useRef<T>(null);
  const [inView, setInView] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin, threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return [ref, inView] as const;
}

export interface AuditBarProps {
  dimension: (typeof AUDIT_DIMENSIONS)[number];
  points: number;
  /** Stagger slot; feeds MOTION_BAR_DELAY + index * MOTION_STAGGER.dimension. */
  index?: number;
  showLabel?: boolean;
  className?: string;
}

/** One dimension bar: label (optional), points/20, and a status-coloured fill. */
export function AuditBar({
  dimension,
  points,
  index = 0,
  showLabel = true,
  className,
}: AuditBarProps) {
  const status = dimensionStatus(points);
  const [trackRef, inView] = useOnceInView<HTMLDivElement>("-16px 0px -16px 0px");
  const delay = (MOTION_BAR_DELAY + index * MOTION_STAGGER.dimension) * 1000;

  return (
    <div className={cn("min-w-0", className)}>
      {showLabel ? (
        <div className="mb-1 flex items-baseline justify-between gap-2">
          <span className="truncate text-[12px] text-[var(--text)]">
            {dimension.label}
          </span>
          <span className="tnum shrink-0 text-[11px] text-[var(--text-tertiary)]">
            {points} / {DIMENSION_MAX}
          </span>
        </div>
      ) : null}
      <div
        ref={trackRef}
        className="h-1 w-full overflow-hidden rounded-full bg-[var(--elevated)]"
        role="img"
        aria-label={`${dimension.label}: ${points} of ${DIMENSION_MAX}`}
      >
        <div
          className="h-full w-full origin-left rounded-full"
          style={{
            backgroundColor:
              status === "pass"
                ? "var(--accent)"
                : status === "partial"
                  ? "var(--warning)"
                  : "var(--danger)",
            transform: inView
              ? `scaleX(${Math.max(0, points / DIMENSION_MAX)})`
              : "scaleX(0)",
            transition: `transform ${MOTION_DUR.bar * 1000}ms ${BAR_EASE} ${delay}ms`,
          }}
        />
      </div>
    </div>
  );
}

/** The compact five-up strip used in dense rows and secondary cards. */
export function AuditBars({
  dims,
  className,
}: {
  dims: Record<AuditDimensionKey, number>;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-5 gap-1.5", className)}>
      {AUDIT_DIMENSIONS.map((d, i) => (
        <AuditBar
          key={d.key}
          dimension={d}
          points={dims[d.key]}
          index={i}
          showLabel={false}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * EVALUATION BREAKDOWN
 * ------------------------------------------------------------------ */

export function MetricsGrid({ entry }: { entry?: AuditEntry }) {
  if (!entry) {
    return (
      <section aria-labelledby="model-breakdown-heading">
        <h2
          id="model-breakdown-heading"
          className="text-[15px] font-semibold tracking-tight text-[var(--text)]"
        >
          Evaluation breakdown
        </h2>
        <p className="mt-3 rounded-[10px] border border-dashed border-[var(--border-strong)] p-6 text-center text-[13px] text-[var(--text-secondary)]">
          This model has no audited build, so there are no dimensions to break
          down. Everything else on this page is unmeasured rather than assumed.
        </p>
      </section>
    );
  }

  const lines = dimensionLines(entry);
  const statuses = AUDIT_DIMENSIONS.map((d) => dimensionStatus(entry.dims[d.key]));
  const tally = {
    pass: statuses.filter((s) => s === "pass").length,
    partial: statuses.filter((s) => s === "partial").length,
    fail: statuses.filter((s) => s === "fail").length,
  };
  // Capped stagger: five items never spend more than MOTION_STAGGER.maxTotal.
  const gap = Math.min(
    MOTION_STAGGER.dimension,
    MOTION_STAGGER.maxTotal / Math.max(1, AUDIT_DIMENSIONS.length - 1),
  );
  const unassigned = unassignedFindings(entry);

  return (
    <section aria-labelledby="model-breakdown-heading">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b border-[var(--border)] pb-2">
        <div className="min-w-0">
          <h2
            id="model-breakdown-heading"
            className="text-[15px] font-semibold tracking-tight text-[var(--text)]"
          >
            Evaluation breakdown
          </h2>
          <p className="mt-0.5 text-[12px] leading-[18px] text-[var(--text-secondary)]">
            Where the {entry.total.toFixed(2)} came from:{" "}
            {AUDIT_DIMENSIONS.length} dimensions × {DIMENSION_MAX} points. Each
            bar is the points awarded; under it is the verified evidence, and
            the defect that cost it what it lost.
          </p>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
          {tally.pass} pass · {tally.partial} partial · {tally.fail} failure
        </p>
      </div>

      <StaggerGroup gap={gap} className="mt-3">
        <div className="overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--surface)]">
          {AUDIT_DIMENSIONS.map((d, i) => {
            const points = entry.dims[d.key];
            const status = dimensionStatus(points);
            const proof = lines[d.key];
            const defects = findingsForDimension(entry, d.key);
            return (
              <StaggerItem
                key={d.key}
                y={4}
                className="border-b border-[var(--border)] px-3 py-2.5 last:border-b-0"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-[13px] font-medium text-[var(--text)]">
                    {d.label}
                  </span>
                  <span className="flex shrink-0 items-baseline gap-2">
                    <span
                      className={cn(
                        "font-mono text-[10px] uppercase tracking-wider",
                        STATUS_TONE[status],
                      )}
                    >
                      {STATUS_LABEL[status]}
                    </span>
                    <span className="tnum text-[13px] font-semibold text-[var(--text)]">
                      {points}
                      <span className="text-[var(--text-tertiary)]">
                        /{DIMENSION_MAX}
                      </span>
                    </span>
                  </span>
                </div>

                <AuditBar
                  dimension={d}
                  points={points}
                  index={i}
                  showLabel={false}
                  className="mt-1.5"
                />

                <p className="mt-2 text-[12px] leading-[17px] text-[var(--text-secondary)]">
                  {proof ? (
                    <>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                        Verified
                      </span>{" "}
                      {proof}
                    </>
                  ) : (
                    <span className="text-[var(--text-tertiary)]">
                      No capability recorded in the audit&apos;s implementation
                      log for this dimension.
                    </span>
                  )}
                </p>

                {defects.length > 0 ? (
                  <ul className="mt-1 space-y-0.5">
                    {defects.map((f) => (
                      <li
                        key={f.title}
                        className="flex flex-wrap items-baseline gap-x-2 text-[11px] leading-[16px]"
                      >
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                          Costs this dimension
                        </span>
                        <span className="min-w-0 text-[var(--text-secondary)]">
                          {f.title}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-[11px] leading-[16px] text-[var(--text-tertiary)]">
                    No verified defect recorded on this dimension.
                  </p>
                )}
              </StaggerItem>
            );
          })}
        </div>
      </StaggerGroup>

      <p className="mt-2 font-mono text-[10px] uppercase leading-[14px] tracking-wider text-[var(--text-tertiary)]">
        Bars: ≥16 pass · 10–15 partial pass · &lt;10 failure · source audit{" "}
        {entry.generated} · build{" "}
        <span className="normal-case">{entry.buildId}</span>
      </p>

      {unassigned.length > 0 ? (
        <p className="mt-2 text-[11px] leading-[16px] text-[var(--text-tertiary)]">
          {unassigned.length} finding{unassigned.length === 1 ? "" : "s"} could
          not be attributed to a single dimension:{" "}
          {unassigned.map((f) => f.title).join(" · ")}. All are listed in
          Failures found.
        </p>
      ) : null}

      <p className="mt-2 text-[12px] leading-[17px] text-[var(--text-secondary)]">
        A feature earns points only when it is implemented{" "}
        <em>and</em> reachable — on-screen strings, comments, and dead code
        score zero. Full scoring rules in{" "}
        <Link
          href="/methodology"
          className="underline underline-offset-2 hover:text-[var(--text)]"
        >
          Methodology
        </Link>
        .
      </p>
    </section>
  );
}
