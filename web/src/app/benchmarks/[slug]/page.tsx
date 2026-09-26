import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { BENCHMARKS, getBenchmarkDetail } from "@/lib/data";
import { SHOWDOWN } from "@/lib/demo-data";
import {
  AUDIT_BY_SLUG,
  AUDIT_DIMENSIONS,
  AUDIT_TRAIL,
  SECONDARY_BUILDS,
  dimensionStatus,
  type AuditEntry,
} from "@/lib/audit-data";
import { cn } from "@/lib/utils";

/**
 * /benchmarks/[slug] — the full audit record for one benchmark.
 *
 * The old version of this page invented two rows (92 / 88) when the stored
 * evaluation set was empty. Those numbers never came from an audit and they
 * contradicted Showdown Score v2, so the fallback is gone: if a benchmark has
 * no audited builds, the page says so and links to the catalogue. Everything
 * rendered here is derived from `AUDIT_TRAIL`.
 */

const LABEL = "font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]";

const SECONDARY: AuditEntry[] = Object.values(SECONDARY_BUILDS).filter(
  (e): e is AuditEntry => e != null,
);

/** Benchmarks that have an audited trail behind them. */
const AUDITED_SLUGS = new Set([SHOWDOWN.benchmarkSlug]);

function statusTone(points: number): string {
  const status = dimensionStatus(points);
  if (status === "pass") return "text-[var(--text)]";
  if (status === "partial") return "text-[var(--warning)]";
  return "text-[var(--danger)]";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const detail = getBenchmarkDetail(slug);
  const name = detail?.name ?? (slug === SHOWDOWN.benchmarkSlug ? SHOWDOWN.benchmarkName : slug);
  return {
    title: `${name} — audit record`,
    description:
      detail?.description ??
      `${name}: Showdown Score v2 audit record, per-dimension points and verified findings.`,
  };
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const audited = AUDITED_SLUGS.has(SHOWDOWN.benchmarkSlug)
    ? [{ slug: SHOWDOWN.benchmarkSlug }]
    : [];
  // Catalogue slugs without an audit trail still need a page: it renders the
  // honest "not audited yet" state rather than a 404 for a real benchmark.
  const catalogue = BENCHMARKS.map((b) => ({ slug: b.slug })).filter(
    (p) => p.slug !== SHOWDOWN.benchmarkSlug,
  );
  return [...audited, ...catalogue];
}

export default async function BenchmarkDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = getBenchmarkDetail(slug);
  if (!detail && !AUDITED_SLUGS.has(slug)) notFound();

  const name = detail?.name ?? SHOWDOWN.benchmarkName;
  const audited = AUDITED_SLUGS.has(slug);
  const builds = audited
    ? [...AUDIT_TRAIL].sort((a, b) => b.total - a.total)
    : [];
  const canonical = Object.values(AUDIT_BY_SLUG).sort((a, b) => b.total - a.total);
  const findings = builds.flatMap((e) => e.findings);
  const failing = findings.filter((f) => f.severity === "high").length;

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-3">
        <Link
          href="/benchmarks"
          className="inline-flex items-center gap-1 text-[12px] text-[var(--text-secondary)] underline-offset-2 hover:text-[var(--text)] hover:underline"
        >
          <ArrowUpRight className="size-3 rotate-180" aria-hidden="true" />
          All benchmarks
        </Link>
      </nav>

      <header className="border-b border-[var(--border)] pb-4">
        <p className={cn(LABEL, "flex flex-wrap items-center gap-x-2 gap-y-1")}>
          <span>Benchmark</span>
          <span className="text-[var(--border-strong)]" aria-hidden="true">
            /
          </span>
          <span className="text-[var(--text-secondary)]">{slug}</span>
          {detail?.version ? (
            <>
              <span className="text-[var(--border-strong)]" aria-hidden="true">
                /
              </span>
              <span>version {detail.version}</span>
            </>
          ) : null}
        </p>
        <h1 className="mt-1.5 text-[24px] font-semibold leading-[30px] tracking-tight text-[var(--text)]">
          {name}
        </h1>
        <p className="mt-2 max-w-2xl text-[13px] leading-[20px] text-[var(--text-secondary)]">
          {detail?.description ??
            "Head-to-head game-build evaluation: one shared prompt, implementation-level audit, published findings."}
        </p>

        {audited ? (
          <>
            <div className="mt-3 rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface)] p-3">
              <p className={cn(LABEL, "mb-1.5")}>Shared prompt — verbatim, no priming</p>
              <p className="font-mono text-[12px] leading-[19px] text-[var(--text)]">
                &ldquo;{SHOWDOWN.promptBody}&rdquo;
              </p>
            </div>
            <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
              {[
                ["Score label", SHOWDOWN.scoreLabel],
                ["Dimensions", `${AUDIT_DIMENSIONS.length} × 20 points`],
                ["Models", String(canonical.length)],
                ["Builds audited", String(builds.length)],
                ["Verified defects", String(findings.length)],
                ["Of which failing", failing > 0 ? String(failing) : "0"],
                ["Round date", SHOWDOWN.evalDate],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline gap-2">
                  <dt className={LABEL}>{k}</dt>
                  <dd
                    className={cn(
                      "tnum text-[12px] text-[var(--text-secondary)]",
                      k === "Of which failing" && failing > 0 ? "text-[var(--danger)]" : undefined,
                    )}
                  >
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          </>
        ) : null}
      </header>

      {audited && builds.length > 0 ? (
        <section aria-labelledby="audit-record-heading" className="mt-6">
          <h2 id="audit-record-heading" className="text-[15px] font-semibold tracking-tight text-[var(--text)]">
            Audit record
          </h2>
          <p className="mt-0.5 text-[12px] leading-[18px] text-[var(--text-secondary)]">
            Every audited build, ordered by audited total. Rows marked
            &ldquo;second build&rdquo; are an additional audited build by a model that
            shipped two; they are not the model score.
          </p>

          <div className="mt-3 overflow-x-auto rounded-[10px] border border-[var(--border)] bg-[var(--surface)]">
            <table className="w-full min-w-[860px] border-collapse">
              <caption className="sr-only">
                Per-build audit record: points per dimension, total out of 100, verified
                finding count, and audit date for every audited build.
              </caption>
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th scope="col" className="px-3 py-2 text-left">
                    <span className={cn(LABEL, "block")}>Build</span>
                    <span className="text-[11px] text-[var(--text-secondary)]">playable</span>
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
                    <span className={LABEL}>Total</span>
                    <span className="block text-[11px] text-[var(--text-secondary)]">of 100</span>
                  </th>
                  <th scope="col" className="px-3 py-2 text-right">
                    <span className={LABEL}>Findings</span>
                  </th>
                  <th scope="col" className="px-3 py-2 text-right">
                    <span className={LABEL}>Audited</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {builds.map((entry) => {
                  const isSecondary = SECONDARY.some((s) => s.buildId === entry.buildId);
                  const modelCanonical = AUDIT_BY_SLUG[entry.modelSlug];
                  const high = entry.findings.filter((f) => f.severity === "high").length;
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
                        {isSecondary ? (
                          <span className="ml-1.5 rounded-full border border-[var(--warning-border)] bg-[var(--warning-muted)] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[var(--warning)]">
                            second build
                          </span>
                        ) : null}
                        <span className="mt-0.5 block text-[11px] text-[var(--text-tertiary)]">
                          {entry.mobileReady ? "Touch ready" : "No touch support"} ·{" "}
                          <span className="font-mono">{entry.buildId}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <Link
                          href={`/models/${entry.modelSlug}`}
                          className="text-[12px] text-[var(--text-secondary)] underline-offset-2 hover:text-[var(--text)] hover:underline"
                        >
                          {entry.modelName}
                        </Link>
                        {modelCanonical ? (
                          <span className="tnum ml-1.5 text-[11px] text-[var(--text-tertiary)]">
                            ({modelCanonical.total}/100)
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
                      <td className="tnum px-3 py-2 text-right text-[13px] font-semibold text-[var(--text)]">
                        {entry.total}
                      </td>
                      <td className="px-3 py-2 text-right text-[12px]">
                        <span className="tnum text-[var(--text-secondary)]">
                          {entry.findings.length}
                        </span>
                        {high > 0 ? (
                          <>
                            <span aria-hidden="true" className="mx-1 text-[var(--border-strong)]">
                              ·
                            </span>
                            <span className="tnum text-[11px] text-[var(--danger)]">
                              {high} failing
                            </span>
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

          <section aria-labelledby="provenance-heading" className="mt-6">
            <h2 id="provenance-heading" className="text-[13px] font-semibold text-[var(--text)]">
              Provenance
            </h2>
            <ul className="mt-2 space-y-1.5 text-[12px] leading-[18px] text-[var(--text-secondary)]">
              <li>
                <span className="text-[var(--text)]">Round.</span> {SHOWDOWN.evalDate} game-build
                review, methodology {detail?.version ?? "v2"}.
              </li>
              <li>
                <span className="text-[var(--text)]">Method.</span> Fixed shared prompt,
                implementation-level source audit, {AUDIT_DIMENSIONS.length} dimensions × 20
                points. A feature scores only when implemented and reachable; on-screen
                strings, comments, and dead code score zero.
              </li>
              <li>
                <span className="text-[var(--text)]">Builds.</span> {builds.length} audited
                builds across {canonical.length} models ({findings.length} verified
                defects, {failing} of them failing). Per-model totals use the strongest
                audited build; weaker second builds are listed and labelled.
              </li>
              <li>
                <span className="text-[var(--text)]">Not included.</span> Vendor-reported
                benchmarks, community sentiment, and any feature claimed in UI copy but
                absent from the source.
              </li>
            </ul>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              <Link
                href="/methodology"
                className="text-[12px] text-[var(--text-secondary)] underline-offset-2 hover:text-[var(--text)] hover:underline"
              >
                Read the full methodology
              </Link>
              <Link
                href="/benchmarks#audit-matrix"
                className="text-[12px] text-[var(--text-secondary)] underline-offset-2 hover:text-[var(--text)] hover:underline"
              >
                Back to the audit matrix
              </Link>
              <Link
                href="/leaderboard"
                className="text-[12px] text-[var(--text-secondary)] underline-offset-2 hover:text-[var(--text)] hover:underline"
              >
                Leaderboard
              </Link>
            </div>
          </section>
        </section>
      ) : (
        <section aria-labelledby="not-audited-heading" className="mt-6">
          <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4">
            <h2 id="not-audited-heading" className="text-[13px] font-semibold text-[var(--text)]">
              Not audited yet
            </h2>
            <p className="mt-1.5 text-[12px] leading-[18px] text-[var(--text-secondary)]">
              This benchmark is in the catalogue but has no builds in the Showdown Score v2
              audit trail, so there is nothing measured to show. A benchmark with no audit
              gets no score.
            </p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              <Link
                href="/benchmarks"
                className="text-[12px] text-[var(--text-secondary)] underline-offset-2 hover:text-[var(--text)] hover:underline"
              >
                See the audited benchmark
              </Link>
              <Link
                href="/methodology"
                className="text-[12px] text-[var(--text-secondary)] underline-offset-2 hover:text-[var(--text)] hover:underline"
              >
                Methodology
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
