import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, FileSearch, ShieldCheck } from "lucide-react";
import { SHOWDOWN } from "@/lib/demo-data";
import {
  AUDIT_BY_SLUG,
  AUDIT_DIMENSIONS,
  AUDIT_TRAIL,
  SECONDARY_BUILDS,
  dimensionStatus,
  type AuditEntry,
} from "@/lib/audit-data";
import { ArtifactCard } from "@/components/artifact/artifact-card";
import { MatrixSection } from "@/components/benchmarks/MatrixSection";
import {
  DimensionBar,
  FadeIn,
  ScoreReveal,
  StaggerGroup,
  StaggerItem,
} from "@/components/motion/polish-motion";
import {
  MOTION_SCORE_DELAY,
  MOTION_STAGGER,
  staggerDelay,
} from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

/**
 * /benchmarks — the audit, not the gallery.
 *
 * Creative direction: "GitHub for AI-generated software artifacts", hierarchy
 * artifact -> evidence -> score -> model identity. This page used to be a
 * showreel: one hand-maintained record per model with a big Play button and
 * copy that had drifted from the builds. It is now an evidence surface.
 *
 * Order of the page is the order of an argument:
 *   1. what was asked      (the shared prompt, verbatim)
 *   2. how it was scored  (the five dimensions, 20 points each)
 *   3. the matrix         (dimensions x models, points/20, colour = verdict)
 *   4. the artifacts      (the actual playable builds, canonical + secondary)
 *   5. the coverage       (every audited build x every dimension)
 *   6. what a score is not
 *
 * Every count, date, score and finding on this page is derived from
 * `AUDIT_TRAIL`. Nothing is hardcoded, so the page cannot contradict the data.
 */

export const metadata: Metadata = {
  title: "Benchmarks — Showdown Score v2 audit matrix",
  description:
    "One shared prompt, eight models, ten audited game builds. Showdown Score v2 is a strict implementation-level source-code audit across five dimensions. The full matrix, every verified defect, and the playable build behind each score.",
};

const SHOWDOWN_SLUG = SHOWDOWN.benchmarkSlug;

/** The eight canonical builds: one per model, the strongest audited build. */
const CANONICAL: AuditEntry[] = Object.values(AUDIT_BY_SLUG).sort(
  (a, b) => b.total - a.total,
);

/** Alternate audited builds — a second build by a model that shipped two. */
const SECONDARY: AuditEntry[] = Object.values(SECONDARY_BUILDS).filter(
  (e): e is AuditEntry => e != null,
);

const SECONDARY_OF = new Map<string, AuditEntry>(
  SECONDARY.map((e) => [e.modelSlug, e]),
);

const ALL_FINDINGS = AUDIT_TRAIL.flatMap((e) => e.findings);

const AUDIT_WINDOW = {
  from: AUDIT_TRAIL.reduce((min, e) => (e.generated < min ? e.generated : min), AUDIT_TRAIL[0]?.generated ?? ""),
  to: AUDIT_TRAIL.reduce((max, e) => (e.generated > max ? e.generated : max), AUDIT_TRAIL[0]?.generated ?? ""),
};

/**
 * Stagger gap for the build grid, derived from the tokens and capped at
 * `MOTION_STAGGER.maxTotal` so eight cards never drag.
 */
const CARD_GAP = Math.min(
  MOTION_STAGGER.card,
  MOTION_STAGGER.maxTotal / Math.max(CANONICAL.length - 1, 1),
);

/** Cap the matrix column stagger so the reveal stays under ~0.5s. */
const MATRIX_STAGGER_CAP = 3;

const LABEL = "font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]";

function statusTone(points: number): string {
  const status = dimensionStatus(points);
  if (status === "pass") return "text-[var(--text)]";
  if (status === "partial") return "text-[var(--warning)]";
  return "text-[var(--danger)]";
}

/* ------------------------------------------------------------------ *
 * 1. Factual header
 * ------------------------------------------------------------------ */

function FactRow({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-[var(--border)] py-1 last:border-b-0">
      <dt className={LABEL}>{label}</dt>
      <dd className={cn("tnum text-right text-[12px] text-[var(--text-secondary)]", tone)}>
        {value}
      </dd>
    </div>
  );
}

function BenchmarkHeader() {
  const failing = ALL_FINDINGS.filter((f) => f.severity === "high").length;

  return (
    <FadeIn>
      <header className="border-b border-[var(--border)] pb-5">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={cn(LABEL, "flex items-center gap-1.5 text-[var(--accent-ink)]")}>
            <span className="size-1.5 rounded-full bg-[var(--accent)]" aria-hidden="true" />
            Benchmark p-001
          </span>
          <span className="text-[var(--border-strong)]" aria-hidden="true">
            /
          </span>
          <span className={LABEL}>{SHOWDOWN_SLUG}</span>
        </p>

        <h1 className="mt-2 text-[26px] font-semibold leading-[32px] tracking-tight text-[var(--text)] sm:text-[30px] sm:leading-[36px]">
          Zombie Flamethrower Showdown
        </h1>

        <p className="mt-2 max-w-2xl text-[13px] leading-[20px] text-[var(--text-secondary)]">
          One prompt, sent verbatim to every model with no priming.{" "}
          {CANONICAL.length} models answered; {AUDIT_TRAIL.length} builds were then read
          at implementation level and scored as{" "}
          <span className="text-[var(--text)]">{SHOWDOWN.scoreLabel}</span>. This page
          is the evidence for those numbers, including the parts that failed.
        </p>

        {/* The prompt is the input to the whole experiment. It gets a
            verbatim block, not a paraphrase. */}
        <div className="mt-4 rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface)] p-3">
          <p className={cn(LABEL, "mb-1.5")}>
            Shared prompt — identical text to every model
          </p>
          <p className="font-mono text-[12px] leading-[19px] text-[var(--text)]">
            &ldquo;{SHOWDOWN.promptBody}&rdquo;
          </p>
        </div>

        <div className="mt-4 grid gap-x-6 gap-y-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div>
            <h2 className={cn(LABEL, "text-[var(--text-secondary)]")}>
              How a score is produced
            </h2>
            <p className="mt-1.5 text-[12px] leading-[18px] text-[var(--text-secondary)]">
              {AUDIT_DIMENSIONS.length} dimensions × 20 points = 100. A feature earns
              points only when it is genuinely implemented <em>and</em> reachable at
              runtime. On-screen strings, comments, and dead code score zero. Every
              verified defect is published against the build that carries it, worst
              severity first, and nothing is filtered out for being unflattering.
            </p>
            <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
              {AUDIT_DIMENSIONS.map((d) => (
                <li key={d.key} className="text-[11px] leading-[16px] text-[var(--text-tertiary)]">
                  {d.label}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              <Link
                href="/methodology"
                className="inline-flex items-center gap-1 text-[12px] text-[var(--text-secondary)] underline-offset-2 hover:text-[var(--text)] hover:underline"
              >
                Read the full methodology
                <ArrowUpRight className="size-3" aria-hidden="true" />
              </Link>
              <Link
                href="/leaderboard"
                className="inline-flex items-center gap-1 text-[12px] text-[var(--text-secondary)] underline-offset-2 hover:text-[var(--text)] hover:underline"
              >
                Scores as a table
                <ArrowUpRight className="size-3" aria-hidden="true" />
              </Link>
              <Link
                href="/compare"
                className="inline-flex items-center gap-1 text-[12px] text-[var(--text-secondary)] underline-offset-2 hover:text-[var(--text)] hover:underline"
              >
                Compare two models
                <ArrowUpRight className="size-3" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <dl className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
            <FactRow label="Builds audited" value={String(AUDIT_TRAIL.length)} />
            <FactRow label="Models" value={String(CANONICAL.length)} />
            <FactRow label="Dimensions" value={`${AUDIT_DIMENSIONS.length} × 20 pts`} />
            <FactRow label="Verified defects" value={String(ALL_FINDINGS.length)} />
            <FactRow
              label="Of which failing"
              value={String(failing)}
              tone={failing > 0 ? "text-[var(--danger)]" : undefined}
            />
            <FactRow label="Touch-ready builds" value={String(AUDIT_TRAIL.filter((e) => e.mobileReady).length)} />
            <FactRow label="Audit window" value={`${AUDIT_WINDOW.from} → ${AUDIT_WINDOW.to}`} />
            <FactRow label="Round label" value={SHOWDOWN.scoreLabel} />
          </dl>
        </div>
      </header>
    </FadeIn>
  );
}

/* ------------------------------------------------------------------ *
 * 2. The audit matrix — the hero object
 * ------------------------------------------------------------------ */

function MatrixLegend() {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
      <span className="flex items-center gap-1.5">
        <span className="h-1 w-4 rounded-full bg-[var(--accent)]" aria-hidden="true" />
        <span className="text-[11px] text-[var(--text-secondary)]">16–20 pass</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-1 w-4 rounded-full bg-[var(--warning)]" aria-hidden="true" />
        <span className="text-[11px] text-[var(--text-secondary)]">10–15 partial pass</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-1 w-4 rounded-full bg-[var(--danger)]" aria-hidden="true" />
        <span className="text-[11px] text-[var(--text-secondary)]">0–9 failure</span>
      </span>
      <span className="text-[11px] text-[var(--text-tertiary)]">
        Bar length is points of 20. The number is the score; the colour is the verdict.
      </span>
    </div>
  );
}

function DimensionMatrix({
  entries,
  caption,
}: {
  entries: AuditEntry[];
  caption: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th
              scope="col"
              className="sticky left-0 z-20 border-b border-r border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-left align-bottom"
            >
              <span className={cn(LABEL, "block")}>Dimension</span>
              <span className="text-[11px] text-[var(--text-secondary)]">points of 20</span>
            </th>
            {entries.map((entry) => (
              <th
                key={entry.buildId}
                scope="col"
                className="border-b border-r border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-left align-bottom last:border-r-0"
              >
                <Link
                  href={`/models/${entry.modelSlug}`}
                  className="block truncate text-[12px] font-medium text-[var(--text)] underline-offset-2 hover:underline"
                  title={entry.modelName}
                >
                  {entry.modelName}
                </Link>
                <span className="mt-0.5 block truncate font-mono text-[9px] uppercase tracking-wider text-[var(--text-tertiary)]">
                  {entry.buildId}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {AUDIT_DIMENSIONS.map((dimension) => (
            <tr key={dimension.key} className="border-b border-[var(--border)] last:border-b-0">
              <th
                scope="row"
                className="sticky left-0 z-10 border-r border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-left align-middle"
              >
                <span className="block text-[12px] font-medium leading-[16px] text-[var(--text)]">
                  {dimension.label}
                </span>
                <span className={cn(LABEL, "mt-0.5 block")}>{dimension.short}</span>
              </th>
              {entries.map((entry, col) => {
                const points = entry.dims[dimension.key];
                return (
                  <td
                    key={entry.buildId}
                    className="border-r border-[var(--border)] px-2 py-2 align-middle last:border-r-0"
                  >
                    <span
                      className={cn(
                        "tnum block text-[14px] font-semibold leading-[18px]",
                        statusTone(points),
                      )}
                    >
                      {points}
                    </span>
                    <DimensionBar
                      dimension={dimension}
                      points={points}
                      index={Math.min(col, MATRIX_STAGGER_CAP)}
                      showLabel={false}
                      className="mt-1"
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-[var(--border-strong)] bg-[var(--elevated)]">
            <th
              scope="row"
              className={cn(
                "sticky left-0 z-10 border-r border-[var(--border)] bg-[var(--elevated)] px-3 py-2 text-left align-middle",
                LABEL,
              )}
            >
              Total / 100
            </th>
            {entries.map((entry, i) => (
              <td
                key={entry.buildId}
                className="border-r border-[var(--border)] px-2 py-2 align-middle last:border-r-0"
              >
                <span
                  aria-hidden="true"
                  className="tnum block text-[15px] font-semibold leading-[18px] text-[var(--text)]"
                >
                  <ScoreReveal
                    value={entry.total}
                    decimals={0}
                    delay={MOTION_SCORE_DELAY + staggerDelay(i, 0.05)}
                  />
                </span>
                <span className="sr-only">{entry.modelName}: {entry.total} of 100</span>
                <span
                  className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-[var(--surface)]"
                  aria-hidden="true"
                >
                  <span
                    className="block h-full w-full origin-left rounded-full bg-[var(--border-strong)]"
                    style={{ transform: `scaleX(${entry.total / 100})` }}
                  />
                </span>
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function AuditMatrix() {
  return (
    <section id="audit-matrix" aria-labelledby="audit-matrix-heading" className="mt-8">
      <FadeIn>
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b border-[var(--border)] pb-2">
          <div className="min-w-0">
            <h2
              id="audit-matrix-heading"
              className="flex items-center gap-1.5 text-[15px] font-semibold tracking-tight text-[var(--text)]"
            >
              <FileSearch className="size-3.5 text-[var(--text-tertiary)]" aria-hidden="true" />
              The audit matrix
            </h2>
            <p className="mt-0.5 max-w-2xl text-[12px] leading-[18px] text-[var(--text-secondary)]">
              Rows are the five audit dimensions, columns are models. Every cell is the
              points that model&apos;s canonical build earned on that dimension, out of
              20. Columns are ordered by audited total for reading order only — this is
              not a ranking claim.
            </p>
          </div>
          <p className={cn(LABEL, "shrink-0")}>
            {CANONICAL.length} models · {AUDIT_DIMENSIONS.length} dimensions
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.05}>
        <div className="mt-3 rounded-[10px] border border-[var(--border)] bg-[var(--surface)]">
          <DimensionMatrix
            entries={CANONICAL}
            caption="Showdown Score v2 audit matrix: five dimensions, points out of 20, for each model's canonical audited build."
          />
        </div>
        <MatrixLegend />
      </FadeIn>

      {SECONDARY.length > 0 ? (
        <FadeIn delay={0.05}>
          <div className="mt-4 rounded-[10px] border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-[var(--border)] px-3 py-2">
              <h3 className="text-[12px] font-semibold text-[var(--text)]">
                Second audited builds
              </h3>
              <p className={cn(LABEL, "text-[var(--text-tertiary)]")}>
                {SECONDARY.length} models shipped two builds — these are not the model
                score
              </p>
            </div>
            <DimensionMatrix
              entries={SECONDARY}
              caption="Second audited builds: five dimensions, points out of 20, for models that shipped more than one audited build."
            />
          </div>
        </FadeIn>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * 3. The artifacts
 * ------------------------------------------------------------------ */

function SecondaryBuilds() {
  if (SECONDARY.length === 0) return null;
  return (
    <div className="mt-3 overflow-x-auto rounded-[10px] border border-[var(--border)] bg-[var(--surface)]">
      <table className="w-full min-w-[720px] border-collapse">
        <caption className="sr-only">
          Second audited builds by model: total, dimension breakdown, verified findings,
          and audit date. These builds are not the model score.
        </caption>
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th scope="col" className="px-3 py-2 text-left">
              <span className={cn(LABEL, "block")}>Build</span>
              <span className="text-[11px] text-[var(--text-secondary)]">second audited build</span>
            </th>
            <th scope="col" className="px-3 py-2 text-left">
              <span className={cn(LABEL, "block")}>Model</span>
              <span className="text-[11px] text-[var(--text-secondary)]">canonical total</span>
            </th>
            {AUDIT_DIMENSIONS.map((d) => (
              <th key={d.key} scope="col" className="px-2 py-2 text-right">
                <span className={LABEL}>{d.short}</span>
              </th>
            ))}
            <th scope="col" className="px-3 py-2 text-right">
              <span className={LABEL}>Findings</span>
            </th>
            <th scope="col" className="px-3 py-2 text-right">
              <span className={LABEL}>Audited</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {SECONDARY.map((entry) => {
            const failing = entry.findings.filter((f) => f.severity === "high").length;
            const canonical = AUDIT_BY_SLUG[entry.modelSlug];
            return (
              <tr
                key={entry.buildId}
                className="border-b border-[var(--border)] transition-colors last:border-b-0 hover:bg-[var(--elevated)]"
              >
                <td className="px-3 py-2">
                  <Link
                    href={entry.playPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[12px] font-medium text-[var(--text)] underline-offset-2 hover:underline"
                  >
                    {entry.buildName}
                  </Link>
                  <span className="tnum ml-2 text-[11px] text-[var(--text-tertiary)]">
                    {entry.total}/100
                  </span>
                </td>
                <td className="px-3 py-2 text-[12px] text-[var(--text-secondary)]">
                  {entry.modelName}
                  {canonical ? (
                    <span className="tnum ml-1.5 text-[11px] text-[var(--text-tertiary)]">
                      ({canonical.total}/100)
                    </span>
                  ) : null}
                </td>
                {AUDIT_DIMENSIONS.map((d) => (
                  <td
                    key={d.key}
                    className={cn(
                      "tnum px-2 py-2 text-right text-[12px]",
                      statusTone(entry.dims[d.key]),
                    )}
                  >
                    {entry.dims[d.key]}
                  </td>
                ))}
                <td className="px-3 py-2 text-right text-[12px]">
                  <span className="tnum text-[var(--text-secondary)]">{entry.findings.length}</span>
                  {failing > 0 ? (
                    <>
                      <span aria-hidden="true" className="mx-1 text-[var(--border-strong)]">
                        ·
                      </span>
                      <span className="tnum text-[11px] text-[var(--danger)]">{failing} failing</span>
                    </>
                  ) : null}
                </td>
                <td className="tnum px-3 py-2 text-right text-[11px] text-[var(--text-tertiary)]">
                  {entry.generated}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function BuildCards() {
  return (
    <section id="builds" aria-labelledby="audit-builds-heading" className="mt-10">
      <FadeIn>
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b border-[var(--border)] pb-2">
          <div className="min-w-0">
            <h2
              id="audit-builds-heading"
              className="text-[15px] font-semibold tracking-tight text-[var(--text)]"
            >
              The builds behind the numbers
            </h2>
            <p className="mt-0.5 max-w-2xl text-[12px] leading-[18px] text-[var(--text-secondary)]">
              One card per model: the canonical audited build, the evidence it earned,
              and — where the model shipped two audited builds — a labelled link to the
              second one. Every card can run its artifact in place.
            </p>
          </div>
          <p className={cn(LABEL, "shrink-0")}>
            {CANONICAL.length} models · {SECONDARY.length} second builds
          </p>
        </div>
      </FadeIn>

      <StaggerGroup gap={CARD_GAP} className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {CANONICAL.map((entry) => (
          <StaggerItem key={entry.buildId} className="min-w-0">
            <ArtifactCard entry={entry} altEntry={SECONDARY_OF.get(entry.modelSlug)} className="h-full" />
          </StaggerItem>
        ))}
      </StaggerGroup>

      <SecondaryBuilds />
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * 5. Coverage + 6. integrity
 * ------------------------------------------------------------------ */

function IntegrityNote() {
  return (
    <section aria-labelledby="integrity-heading" className="mt-10">
      <FadeIn>
        <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2
            id="integrity-heading"
            className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text)]"
          >
            <ShieldCheck className="size-3.5 text-[var(--accent)]" aria-hidden="true" />
            What these scores are, and what they are not
          </h2>
          <div className="mt-2 grid gap-x-6 gap-y-2 text-[12px] leading-[18px] text-[var(--text-secondary)] md:grid-cols-2">
            <p>
              <span className="text-[var(--text)]">They are</span> a strict
              implementation-level audit of readable source:{" "}
              {ALL_FINDINGS.length} verified defects across {AUDIT_TRAIL.length} builds,
              each with the line of evidence that justifies it, published against the
              build that carries it.
            </p>
            <p>
              <span className="text-[var(--text)]">They are not</span> vendor claims,
              marketing benchmarks, or a vibe check. A build that advertises a feature
              and does not implement it scores zero for it, and the defect is printed
              next to the score.
            </p>
          </div>
          <p className="mt-3 border-t border-[var(--border)] pt-3 text-[12px] leading-[18px] text-[var(--text-secondary)]">
            The fastest way to check this page is to open a build and disagree with the
            auditor. The prompt is above, the artifacts are below, and every score is
            reproducible from the source.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            <Link
              href="/methodology"
              className="text-[12px] text-[var(--text-secondary)] underline-offset-2 hover:text-[var(--text)] hover:underline"
            >
              Methodology
            </Link>
            <Link
              href="/leaderboard"
              className="text-[12px] text-[var(--text-secondary)] underline-offset-2 hover:text-[var(--text)] hover:underline"
            >
              Leaderboard
            </Link>
            <Link
              href="/compare"
              className="text-[12px] text-[var(--text-secondary)] underline-offset-2 hover:text-[var(--text)] hover:underline"
            >
              Compare
            </Link>
            <Link
              href="/benchmarks/zombie-flamethrower-showdown"
              className="text-[12px] text-[var(--text-secondary)] underline-offset-2 hover:text-[var(--text)] hover:underline"
            >
              Full audit record
            </Link>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}

export default function BenchmarksPage() {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-6 lg:px-8">
      <BenchmarkHeader />
      <AuditMatrix />
      <BuildCards />

      <section id="coverage" aria-labelledby="coverage-heading" className="mt-10">
        <FadeIn>
          <div className="border-b border-[var(--border)] pb-2">
            <h2
              id="coverage-heading"
              className="text-[15px] font-semibold tracking-tight text-[var(--text)]"
            >
              Coverage
            </h2>
            <p className="mt-0.5 max-w-2xl text-[12px] leading-[18px] text-[var(--text-secondary)]">
              Every audited build against every dimension, including the second builds
              the matrix above excludes. Sort it, filter it, read it as a table.
            </p>
          </div>
        </FadeIn>
        <FadeIn delay={0.05} className="mt-3">
          <MatrixSection />
        </FadeIn>
      </section>

      <IntegrityNote />
    </div>
  );
}
