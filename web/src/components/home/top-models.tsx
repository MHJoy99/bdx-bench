"use client";

import Link from "next/link";
import { MODELS } from "@/lib/data";
import { formatScore } from "@/lib/format";
import { AUDIT_DIMENSIONS, AUDIT_TRAIL, type AuditEntry } from "@/lib/audit-data";
import {
  DimensionBar,
  FadeIn,
  ScoreReveal,
} from "@/components/motion/polish-motion";
import { cn } from "@/lib/utils";

/**
 * Top models — the dense evidence matrix.
 *
 * The old version was a four-column card with two identical tabs. This is the
 * table an engineer actually wants: rank, model, the Showdown Score v2 number,
 * then all five audit dimensions for that model's best-scoring build, then how
 * many verified defects came with it. Score first only after the identity, and
 * never without the evidence columns beside it.
 *
 * Values are unchanged: the score map below is the Showdown Score v2 set, with
 * the dataset's overall score as the documented fallback.
 */

export const TOP_MODEL_TABS = ["Overall", "Showdown"] as const;

const SHOWDOWN_SCORES: Record<string, number> = {
  "space-bunny-free": 91,
  "deepseek-v4-1-flash": 80,
  "gpt-5-6-luna": 62,
  "gpt-6-sol": 58,
  "muse-spark-1-3": 52,
  "gpt-6-luna": 51,
  "gemini-3-8-flash": 43,
  "gemini-pro-agent": 24,
};

function showdownOf(slug: string, fallbackOverall: number): number | null {
  const v = SHOWDOWN_SCORES[slug];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return Number.isFinite(fallbackOverall) ? fallbackOverall : null;
}

interface Row {
  id: string;
  name: string;
  provider: string;
  score: number | null;
  build: AuditEntry | null;
  buildCount: number;
}

/** Best-scoring audited build per model, plus how many builds it shipped. */
function auditsByModel(): {
  best: Map<string, AuditEntry>;
  counts: Map<string, number>;
} {
  const best = new Map<string, AuditEntry>();
  const counts = new Map<string, number>();
  for (const entry of AUDIT_TRAIL) {
    counts.set(entry.modelSlug, (counts.get(entry.modelSlug) ?? 0) + 1);
    const current = best.get(entry.modelSlug);
    if (!current || entry.total > current.total) best.set(entry.modelSlug, entry);
  }
  return { best, counts };
}

function rowsFor(): Row[] {
  const { best, counts } = auditsByModel();
  return [...MODELS]
    .map((m) => {
      const rec = m as unknown as { scores?: { overall?: unknown } };
      const overall =
        typeof rec.scores?.overall === "number" ? rec.scores.overall : NaN;
      return {
        id: m.slug,
        name: m.name,
        provider: m.provider,
        score: showdownOf(m.slug, overall),
        build: best.get(m.slug) ?? null,
        buildCount: counts.get(m.slug) ?? 0,
      };
    })
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
}

export function TopModels() {
  const rows = rowsFor();

  return (
    <section aria-labelledby="home-top-models-heading" className="scroll-mt-20">
      <FadeIn>
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b border-[var(--border)] pb-2">
          <div className="min-w-0">
            <h2
              id="home-top-models-heading"
              className="text-[15px] font-semibold tracking-tight text-[var(--text)]"
            >
              Top models
            </h2>
            <p className="mt-0.5 text-[12px] leading-[18px] text-[var(--text-secondary)]">
              Ranked by Showdown Score v2. Dimension columns are the best-scoring
              audited build for each model, scored out of 20.
            </p>
          </div>
          <Link
            href="/leaderboard"
            className="shrink-0 text-[12px] text-[var(--text-secondary)] underline-offset-2 hover:text-[var(--text)] hover:underline"
          >
            Open full leaderboard
          </Link>
        </div>
      </FadeIn>

      {rows.length === 0 ? (
        <div
          role="status"
          className="mt-3 rounded-[10px] border border-dashed border-[var(--border)] px-6 py-10 text-center"
        >
          <p className="text-[13px] font-semibold text-[var(--text)]">No models yet</p>
          <p className="mx-auto mt-1 max-w-md text-[12px] text-[var(--text-secondary)]">
            The dataset is empty. Check back after the next round.
          </p>
        </div>
      ) : (
        <FadeIn delay={0.04}>
          <div className="mt-3 overflow-x-auto rounded-[10px] border border-[var(--border)] bg-[var(--surface)]">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <caption className="sr-only">
                Models ranked by Showdown Score, with all five audit dimensions
                and the verified defect count for each model&apos;s best build.
              </caption>
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--elevated)] font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                  <th scope="col" className="px-3 py-2 font-medium">
                    #
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Model
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Provider
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Showdown
                  </th>
                  {AUDIT_DIMENSIONS.map((d) => (
                    <th
                      key={d.key}
                      scope="col"
                      className="w-[68px] px-2 py-2 text-right font-medium"
                      title={d.label}
                    >
                      {d.short}
                    </th>
                  ))}
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Findings
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const high = row.build
                    ? row.build.findings.filter((f) => f.severity === "high").length
                    : 0;
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-[var(--border)] last:border-0 transition-colors hover:bg-[var(--elevated)]"
                    >
                      <td className="tnum px-3 py-2.5 text-[12px] text-[var(--text-tertiary)]">
                        {i + 1}
                      </td>
                      <td className="px-3 py-2.5">
                        <Link
                          href={`/models/${row.id}`}
                          className="text-[13px] font-medium text-[var(--text)] underline-offset-2 hover:underline"
                        >
                          {row.name}
                        </Link>
                        {row.buildCount > 1 ? (
                          <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                            {row.buildCount} builds audited
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 text-[12px] capitalize text-[var(--text-secondary)]">
                        {row.provider}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {row.score === null ? (
                          <span className="text-[12px] text-[var(--text-tertiary)]">
                            Not evaluated
                          </span>
                        ) : (
                          <>
                            <span className="tnum block text-[15px] font-semibold leading-[18px] text-[var(--text)]">
                              <ScoreReveal
                                value={row.score}
                                decimals={1}
                                delay={0.1 + i * 0.045}
                              />
                            </span>
                            <span className="block font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                              of 100
                            </span>
                          </>
                        )}
                      </td>
                      {AUDIT_DIMENSIONS.map((d, di) => (
                        <td key={d.key} className="px-2 py-2.5 align-middle">
                          {row.build ? (
                            <div className="min-w-0">
                              <span className="tnum block text-right text-[12px] text-[var(--text)]">
                                {row.build.dims[d.key]}
                              </span>
                              <DimensionBar
                                dimension={d}
                                points={row.build.dims[d.key]}
                                index={di}
                                showLabel={false}
                              />
                            </div>
                          ) : (
                            <span className="block text-right text-[11px] text-[var(--text-tertiary)]">
                              —
                            </span>
                          )}
                        </td>
                      ))}
                      <td className="px-3 py-2.5 text-right align-middle">
                        {row.build ? (
                          <>
                            <span className="tnum block text-[12px] text-[var(--text)]">
                              {row.build.findings.length}
                            </span>
                            <span
                              className={cn(
                                "tnum block font-mono text-[10px] uppercase tracking-wider",
                                high > 0
                                  ? "text-[var(--danger)]"
                                  : "text-[var(--text-tertiary)]",
                              )}
                            >
                              {high > 0 ? `${high} failing` : "no failures"}
                            </span>
                          </>
                        ) : (
                          <span className="text-[11px] text-[var(--text-tertiary)]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </FadeIn>
      )}

      <p className="mt-2 text-[11px] leading-[16px] text-[var(--text-tertiary)]">
        Bar colour is the audit status for that dimension: lime = pass, amber =
        partial pass, red = failure. Findings are verified defects, published in
        full on each build. Other dimensions show as Not evaluated until measured.
      </p>
    </section>
  );
}
