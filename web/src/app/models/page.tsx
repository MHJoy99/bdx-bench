import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Gamepad2 } from "lucide-react";
import { BuildsGallery } from "@/components/home";
import { MODELS } from "@/lib/data";
import { AUDIT_DIMENSIONS, AUDIT_TRAIL } from "@/lib/audit-data";
import {
  FadeIn,
  ScoreReveal,
  StaggerGroup,
  StaggerItem,
} from "@/components/motion/polish-motion";
import { MOTION_STAGGER } from "@/lib/motion-tokens";
import { AuditBars } from "@/components/model/MetricsGrid";
import {
  auditEntryFor,
  providerLabel,
  scoreOf,
} from "@/components/model/Provenance";

/**
 * BDX Bench — the model index, as an evidence directory.
 *
 * This is not a card gallery. Every row carries the number, the five
 * dimension bars behind it, how many defects the audit verified, and a link
 * into the playable build — so a reader can rank and audit from this page
 * without opening eight profiles. Denser is better.
 *
 * The grid is divs with ARIA table roles rather than a real `<table>`: a
 * `<tr>` list cannot host the transform-based entrance primitive, and the
 * leaderboard already established that pattern for the same reason.
 *
 * Build lookup matches slug AND the model's published Showdown Score, never
 * `AUDIT_BY_SLUG`, because two models shipped two audited builds each.
 */

export const metadata: Metadata = {
  title: "Models — evidence directory",
  description:
    "Eight evaluated models, one prompt. Showdown Scores with the five audit dimensions, verified defect counts, and direct play links for every build.",
};

/** Highest score first. Rank is a consequence of the evidence, not a prize. */
const RANKED = [...MODELS].sort((a, b) => (scoreOf(b) ?? 0) - (scoreOf(a) ?? 0));

/** Fixed evidence tracks so every column lines up down the directory. */
const COLUMN_TRACKS = [
  "40px", // rank
  "minmax(200px, 1.4fr)", // model
  "104px", // provider
  "84px", // score
  "260px", // dimensions
  "132px", // findings
  "76px", // build
].join(" ");

const HEADERS: { label: string; align?: "right" }[] = [
  { label: "#" },
  { label: "Model" },
  { label: "Provider" },
  { label: "Score", align: "right" },
  { label: "Audit dimensions" },
  { label: "Findings", align: "right" },
  { label: "Build", align: "right" },
];

export default function ModelsIndexPage() {
  const rows = RANKED.map((m, i) => {
    const score = scoreOf(m);
    const entry = auditEntryFor(m.slug, score);
    return {
      rank: i + 1,
      slug: m.slug,
      name: m.name,
      family: m.family,
      provider: providerLabel(m.provider),
      score,
      entry,
      findings: entry?.findings.length ?? 0,
      failing: entry
        ? entry.findings.filter((f) => f.severity === "high").length
        : 0,
    };
  });

  // Capped entrance stagger across the whole directory.
  const gap = Math.min(
    MOTION_STAGGER.row,
    MOTION_STAGGER.maxTotal / Math.max(1, rows.length - 1),
  );

  return (
    <main className="mx-auto w-full max-w-[1120px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b border-[var(--border)] pb-2">
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold leading-[26px] tracking-tight text-[var(--text)]">
            Models
          </h1>
          <p className="mt-0.5 text-[12px] leading-[18px] text-[var(--text-secondary)]">
            {rows.length} evaluated models, one prompt,{" "}
            {AUDIT_TRAIL.length} audited builds. Every score is Showdown Score
            v2 — a strict implementation-level source-code audit, not a keyword
            scan.
          </p>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
          5 dimensions × 20 pts · ranked by verified score
        </p>
      </div>

      <FadeIn>
        <div className="overflow-x-auto rounded-[10px] border border-[var(--border)] bg-[var(--surface)]">
          <div
            role="table"
            aria-label="Model evidence directory: rank, provider, Showdown Score, audit dimension bars, verified findings, playable build"
            aria-rowcount={rows.length + 1}
            aria-colcount={HEADERS.length}
            className="min-w-[860px]"
          >
            <div role="rowgroup">
              <div
                role="row"
                className="grid items-center gap-x-2 border-b border-[var(--border)] bg-[var(--elevated)] px-2.5"
                style={{ gridTemplateColumns: COLUMN_TRACKS }}
              >
                {HEADERS.map((h, i) => (
                  <div
                    key={h.label}
                    role="columnheader"
                    className={`flex min-w-0 items-center px-0 py-2 font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] ${
                      h.align === "right" ? "justify-end text-right" : ""
                    }`}
                  >
                    {h.label === "Audit dimensions" ? (
                      <span className="flex flex-col">
                        <span>Audit dimensions</span>
                        <span className="normal-case tracking-normal text-[var(--text-tertiary)]/80">
                          {AUDIT_DIMENSIONS.map((d) => d.short).join(" · ")}
                        </span>
                      </span>
                    ) : (
                      h.label
                    )}
                  </div>
                ))}
              </div>
            </div>

            <StaggerGroup gap={gap}>
              {rows.map((r) => (
                <StaggerItem key={r.slug} y={4}>
                  <div
                    role="row"
                    aria-label={`Rank ${r.rank}: ${r.name}`}
                    className="grid items-center gap-x-2 border-b border-[var(--border)] px-2.5 transition-colors last:border-b-0 hover:bg-[var(--elevated)]"
                    style={{ gridTemplateColumns: COLUMN_TRACKS }}
                  >
                    <div
                      role="cell"
                      className="tnum py-2 font-mono text-[12px] text-[var(--text-tertiary)]"
                    >
                      {r.rank}
                    </div>

                    <div role="cell" className="min-w-0 py-2">
                      <Link
                        href={`/models/${r.slug}`}
                        className="block truncate text-[13px] font-semibold text-[var(--text)] underline-offset-2 hover:underline"
                      >
                        {r.name}
                      </Link>
                      <span className="block truncate font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                        {r.family}
                        {r.entry ? ` · ${r.entry.buildId}` : ""}
                      </span>
                    </div>

                    <div
                      role="cell"
                      className="min-w-0 py-2 font-mono text-[10px] uppercase leading-[14px] tracking-wider text-[var(--text-secondary)]"
                    >
                      {r.provider}
                    </div>

                    <div
                      role="cell"
                      className="tnum py-2 text-right font-mono text-[14px] font-semibold text-[var(--text)]"
                    >
                      {r.score === null ? (
                        <span className="text-[11px] font-normal text-[var(--text-tertiary)]">
                          Not evaluated
                        </span>
                      ) : (
                        <ScoreReveal value={r.score} decimals={2} />
                      )}
                    </div>

                    <div role="cell" className="min-w-0 py-2">
                      {r.entry ? (
                        <AuditBars dims={r.entry.dims} />
                      ) : (
                        <span className="text-[11px] text-[var(--text-tertiary)]">
                          Not audited
                        </span>
                      )}
                    </div>

                    <div
                      role="cell"
                      className="tnum py-2 text-right font-mono text-[12px] text-[var(--text)]"
                    >
                      {r.entry ? (
                        <>
                          {r.findings}
                          {r.failing > 0 ? (
                            <span className="text-[var(--danger)]">
                              {" · "}
                              {r.failing} failing
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-[var(--text-tertiary)]">—</span>
                      )}
                    </div>

                    <div
                      role="cell"
                      className="flex justify-end py-2 text-right"
                    >
                      {r.entry ? (
                        <Link
                          href={r.entry.playPath}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Play ${r.entry.buildName} by ${r.name}`}
                          className="inline-flex items-center gap-1 rounded-[6px] border border-[var(--border)] px-1.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-border)] hover:text-[var(--accent-ink)]"
                        >
                          <Gamepad2 className="size-3" aria-hidden="true" />
                          Play
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </div>
      </FadeIn>

      <p className="text-[12px] leading-[17px] text-[var(--text-secondary)]">
        Each bar is one audit dimension out of 20.{" "}
        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
          ≥16 pass · 10–15 partial pass · &lt;10 failure
        </span>{" "}
        Open a model for the evidence behind its bars, the prompt it answered,
        and every verified failure. Full board in the{" "}
        <Link
          href="/leaderboard"
          className="underline underline-offset-2 hover:text-[var(--text)]"
        >
          leaderboard
        </Link>
        .
      </p>

      <div className="flex flex-wrap items-center gap-2 pt-2">
        <Link
          href="/benchmarks"
          className="inline-flex items-center gap-1 rounded-[8px] border border-[var(--border)] px-2.5 py-2 text-[12px] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text)]"
        >
          The shared prompt
          <ArrowUpRight className="size-3" aria-hidden="true" />
        </Link>
        <Link
          href="/methodology"
          className="inline-flex items-center gap-1 rounded-[8px] border border-[var(--border)] px-2.5 py-2 text-[12px] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text)]"
        >
          Scoring methodology
          <ArrowUpRight className="size-3" aria-hidden="true" />
        </Link>
      </div>

      <BuildsGallery />
    </main>
  );
}
