"use client";

import Link from "next/link";
import { ArrowUpRight, ShieldCheck, TriangleAlert } from "lucide-react";
import { ArtifactGrid } from "@/components/artifact/artifact-card";
import {
  AUDIT_DIMENSIONS,
  AUDIT_TRAIL,
  SEVERITY_LABEL,
  SEVERITY_ORDER,
  type AuditEntry,
  type AuditFinding,
} from "@/lib/audit-data";
import {
  ChartEntrance,
  DimensionBar,
  FadeIn,
  ScoreReveal,
  StaggerGroup,
  StaggerItem,
} from "@/components/motion/polish-motion";
import { cn } from "@/lib/utils";

/**
 * Homepage builds + audit sections.
 *
 * `BuildsGallery` is the centrepiece: the live artifacts lead, and the grid is
 * `ArtifactGrid` — a closed card costs zero frames, an open one plays a real
 * game canvas in place. No marketing copy is added on top of what the card
 * already proves.
 *
 * `AuditCredibility` is the trust engine the old homepage lacked. It is pure
 * arithmetic over `AUDIT_TRAIL`: how many defects were verified, how many are
 * failures, what the five dimensions actually pay out, and which defects cost
 * the weakest builds their points. Nothing here is asserted that the audit data
 * does not support.
 */

function worstFinding(entry: AuditEntry): AuditFinding | null {
  return (
    [...entry.findings].sort(
      (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
    )[0] ?? null
  );
}

function severityText(severity: AuditFinding["severity"]): string {
  if (severity === "high") return "text-[var(--danger)]";
  if (severity === "medium") return "text-[var(--warning)]";
  return "text-[var(--text-tertiary)]";
}

/* ------------------------------------------------------------------ *
 * Featured builds
 * ------------------------------------------------------------------ */

export function BuildsGallery({ className }: { className?: string }) {
  return (
    <section
      id="builds"
      aria-labelledby="home-builds-heading"
      className={cn("scroll-mt-20", className)}
    >
      <FadeIn>
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b border-[var(--border)] pb-2">
          <div className="min-w-0">
            <h2
              id="home-builds-heading"
              className="text-[15px] font-semibold tracking-tight text-[var(--text)]"
            >
              Featured builds
            </h2>
            <p className="mt-0.5 text-[12px] leading-[18px] text-[var(--text-secondary)]">
              {AUDIT_TRAIL.length} builds, one prompt. Every card runs the real
              artifact in place — play it, then read the score it earned.
            </p>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
            Ranked by Showdown Score v2
          </p>
        </div>
      </FadeIn>

      <ChartEntrance index={1}>
        <ArtifactGrid
          entries={AUDIT_TRAIL}
          columns="sm:grid-cols-2 lg:grid-cols-3"
          className="mt-3"
        />
      </ChartEntrance>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Audit credibility
 * ------------------------------------------------------------------ */

export function AuditCredibility({ className }: { className?: string }) {
  const all = AUDIT_TRAIL.flatMap((e) => e.findings);
  const bySeverity = {
    high: all.filter((f) => f.severity === "high").length,
    medium: all.filter((f) => f.severity === "medium").length,
    low: all.filter((f) => f.severity === "low").length,
  };

  /** Cohort mean per dimension — what the average audited build actually pays. */
  const dimensionMeans = AUDIT_DIMENSIONS.map((d) => ({
    dimension: d,
    mean:
      Math.round(
        (AUDIT_TRAIL.reduce((sum, e) => sum + e.dims[d.key], 0) / AUDIT_TRAIL.length) * 10,
      ) / 10,
  }));

  /** Lowest-scoring build first, its single worst finding. Four rows, no cherry-picking. */
  const headlineFindings = [...AUDIT_TRAIL]
    .sort((a, b) => a.total - b.total)
    .filter((e) => e.findings.some((f) => f.severity === "high"))
    .slice(0, 4)
    .map((e) => ({ entry: e, finding: worstFinding(e) }))
    .filter((x): x is { entry: AuditEntry; finding: AuditFinding } => x.finding != null);

  const ledger = [...AUDIT_TRAIL]
    .sort((a, b) => b.total - a.total)
    .map((e) => ({
      entry: e,
      findings: e.findings.length,
      high: e.findings.filter((f) => f.severity === "high").length,
      worst: worstFinding(e),
    }));

  const counters = [
    { label: "Builds audited", value: AUDIT_TRAIL.length, tone: "" },
    { label: "Verified defects", value: all.length, tone: "" },
    { label: "Failing", value: bySeverity.high, tone: "text-[var(--danger)]" },
    { label: "Partial pass", value: bySeverity.medium, tone: "text-[var(--warning)]" },
    { label: "Known issue", value: bySeverity.low, tone: "text-[var(--text-tertiary)]" },
  ];

  return (
    <section
      id="audit"
      aria-labelledby="home-audit-heading"
      className={cn("scroll-mt-20", className)}
    >
      <FadeIn>
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b border-[var(--border)] pb-2">
          <div className="min-w-0">
            <h2
              id="home-audit-heading"
              className="text-[15px] font-semibold tracking-tight text-[var(--text)]"
            >
              Audit credibility
            </h2>
            <p className="mt-0.5 text-[12px] leading-[18px] text-[var(--text-secondary)]">
              Every Showdown Score v2 number comes from reading the build&apos;s
              source and playing it, not from scanning strings. Defects are
              published, not filtered out.
            </p>
          </div>
          <p className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
            <ShieldCheck className="size-3" aria-hidden="true" />
            Implementation-level audit
          </p>
        </div>
      </FadeIn>

      {/* Defect ledger header counts. */}
      <StaggerGroup className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-[8px] border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3 lg:grid-cols-5">
        {counters.map((c) => (
          <StaggerItem key={c.label} className="bg-[var(--surface)] px-3 py-2">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
              {c.label}
            </p>
            <p
              className={cn(
                "tnum mt-0.5 text-[15px] font-semibold leading-[20px] text-[var(--text)]",
                c.tone,
              )}
            >
              <ScoreReveal value={c.value} decimals={0} />
            </p>
          </StaggerItem>
        ))}
      </StaggerGroup>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* How we score. */}
        <ChartEntrance>
          <div className="flex h-full flex-col rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4">
            <h3 className="text-[13px] font-semibold text-[var(--text)]">How we score</h3>
            <p className="mt-1 text-[12px] leading-[18px] text-[var(--text-secondary)]">
              {AUDIT_DIMENSIONS.length} dimensions × 20 points = 100. A feature earns
              points only when it is implemented <em>and</em> reachable. On-screen
              strings, comments, and dead code score zero.
            </p>

            <ul className="mt-3 space-y-2.5">
              {dimensionMeans.map((d, i) => (
                <li key={d.dimension.key}>
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <span className="truncate text-[12px] text-[var(--text)]">
                      {d.dimension.label}
                    </span>
                    <span className="tnum shrink-0 text-[11px] text-[var(--text-tertiary)]">
                      {d.mean.toFixed(1)} / 20
                    </span>
                  </div>
                  <DimensionBar
                    dimension={d.dimension}
                    points={d.mean}
                    index={i}
                    showLabel={false}
                  />
                </li>
              ))}
            </ul>

            <p className="mt-3 font-mono text-[10px] uppercase leading-[14px] tracking-wider text-[var(--text-tertiary)]">
              Bars = cohort mean · ≥16 pass · 10–15 partial pass · &lt;10 failure
            </p>

            <Link
              href="/methodology"
              className="mt-auto inline-flex items-center gap-1 pt-3 text-[12px] text-[var(--text-secondary)] underline-offset-2 hover:text-[var(--text)] hover:underline"
            >
              Read the full methodology
              <ArrowUpRight className="size-3" aria-hidden="true" />
            </Link>
          </div>
        </ChartEntrance>

        {/* Highest-severity findings. */}
        <ChartEntrance index={1}>
          <div className="h-full rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4">
            <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text)]">
              <TriangleAlert className="size-3.5 text-[var(--warning)]" aria-hidden="true" />
              Highest-severity findings
            </h3>
            <p className="mt-1 text-[12px] leading-[18px] text-[var(--text-secondary)]">
              One verified failure per build, weakest-scoring build first. A
              benchmark that hides these is not worth reading.
            </p>

            <StaggerGroup className="mt-3 divide-y divide-[var(--border)] border-t border-[var(--border)]">
              {headlineFindings.map(({ entry, finding }) => (
                <StaggerItem key={`${entry.buildId}-${finding.title}`} className="py-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[12px] font-medium text-[var(--text)]">
                      {finding.title}
                    </p>
                    <span
                      className={cn(
                        "shrink-0 font-mono text-[10px] uppercase tracking-wider",
                        severityText(finding.severity),
                      )}
                    >
                      {SEVERITY_LABEL[finding.severity]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-[16px] text-[var(--text-secondary)]">
                    {finding.impact}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                    <Link
                      href={`/models/${entry.modelSlug}`}
                      className="underline-offset-2 hover:text-[var(--text-secondary)] hover:underline"
                    >
                      {entry.buildName}
                    </Link>
                    <span aria-hidden="true">·</span>
                    <span>{entry.modelName}</span>
                    <span aria-hidden="true">·</span>
                    <span className={cn("tnum", severityText(finding.severity))}>
                      {entry.total}/100
                    </span>
                  </p>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </ChartEntrance>
      </div>

      {/* Full per-build ledger. */}
      <ChartEntrance index={2}>
        <div className="mt-3 overflow-x-auto rounded-[10px] border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <caption className="sr-only">
              Per-build audit ledger: score, verified defect count, failing count,
              and the worst verified defect for every audited build.
            </caption>
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--elevated)] font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                <th scope="col" className="px-3 py-2 font-medium">
                  Build
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Model
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Score
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Findings
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Failing
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Worst verified defect
                </th>
              </tr>
            </thead>
            <tbody>
              {ledger.map(({ entry, findings, high, worst }) => (
                <tr
                  key={entry.buildId}
                  className="border-b border-[var(--border)] last:border-0 transition-colors hover:bg-[var(--elevated)]"
                >
                  <td className="px-3 py-2 text-[12px] font-medium text-[var(--text)]">
                    <Link
                      href={entry.playPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline-offset-2 hover:underline"
                    >
                      {entry.buildName}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-[12px] text-[var(--text-secondary)]">
                    {entry.modelName}
                  </td>
                  <td className="tnum px-3 py-2 text-right text-[12px] text-[var(--text)]">
                    {entry.total}
                  </td>
                  <td className="tnum px-3 py-2 text-right text-[12px] text-[var(--text-secondary)]">
                    {findings}
                  </td>
                  <td
                    className={cn(
                      "tnum px-3 py-2 text-right text-[12px]",
                      high > 0 ? "text-[var(--danger)]" : "text-[var(--text-tertiary)]",
                    )}
                  >
                    {high}
                  </td>
                  <td className="px-3 py-2 text-[12px]">
                    {worst ? (
                      <span className="flex items-baseline gap-2">
                        <span className="truncate text-[var(--text-secondary)]">
                          {worst.title}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 font-mono text-[10px] uppercase tracking-wider",
                            severityText(worst.severity),
                          )}
                        >
                          {SEVERITY_LABEL[worst.severity]}
                        </span>
                      </span>
                    ) : (
                      <span className="text-[var(--text-tertiary)]">None recorded</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartEntrance>

      <p className="mt-2 text-[11px] leading-[16px] text-[var(--text-tertiary)]">
        Severity labels follow the audit contract: failing = the build cannot do
        the thing it advertises · partial pass = implemented but wrong · known
        issue = cosmetic or unreachable. Each build&apos;s full finding list,
        including every line of evidence, sits on its card in{" "}
        <Link href="#builds" className="underline-offset-2 hover:underline">
          Featured builds
        </Link>
        .
      </p>
    </section>
  );
}
