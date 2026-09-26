import Link from "next/link";
import { ArrowUpRight, Gamepad2 } from "lucide-react";
import { MODELS } from "@/lib/data";
import { FadeIn, ScoreReveal } from "@/components/motion/polish-motion";
import { auditEntryFor, providerLabel, scoreOf } from "./Provenance";

/**
 * BDX Bench — the other models in the round.
 *
 * Competition is deliberately the smallest voice on this page (the brief calls
 * for 10%): three dense rows, no cards, no trophies. Each row is a number, the
 * provider that produced it, and the artifact it came from, so a reader can
 * put this model's score next to its neighbours in one glance.
 */

export function RelatedModels({ slug }: { slug: string }) {
  const related = MODELS.filter((m) => m.slug !== slug).slice(0, 3);
  if (related.length === 0) return null;

  const ranked = [...MODELS]
    .map((m) => ({ slug: m.slug, score: scoreOf(m) }))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const rankOf = (s: string) => ranked.findIndex((r) => r.slug === s) + 1;

  return (
    <section aria-labelledby="model-related-heading" className="space-y-2.5">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b border-[var(--border)] pb-2">
        <h2
          id="model-related-heading"
          className="text-[15px] font-semibold tracking-tight text-[var(--text)]"
        >
          Related models
        </h2>
        <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
          {MODELS.length} models · one prompt
        </p>
      </div>

      <FadeIn>
        <div className="overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--surface)]">
          {related.map((m) => {
            const score = scoreOf(m);
            const entry = auditEntryFor(m.slug, score);
            return (
              <div
                key={m.slug}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--border)] px-3 py-2 last:border-b-0"
              >
                <span className="tnum w-6 shrink-0 font-mono text-[11px] text-[var(--text-tertiary)]">
                  #{rankOf(m.slug)}
                </span>
                <Link
                  href={`/models/${m.slug}`}
                  className="min-w-0 flex-1 text-[13px] font-medium text-[var(--text)] underline-offset-2 hover:underline"
                >
                  {m.name}
                </Link>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                  {providerLabel(m.provider)}
                </span>
                <span className="tnum w-14 shrink-0 text-right font-mono text-[13px] font-semibold text-[var(--text)]">
                  {score === null ? (
                    <span className="text-[11px] font-normal text-[var(--text-tertiary)]">
                      Not evaluated
                    </span>
                  ) : (
                    <ScoreReveal value={score} decimals={2} className="tnum" />
                  )}
                </span>
                {entry ? (
                  <Link
                    href={entry.playPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Play ${entry.buildName} by ${m.name}`}
                    className="inline-flex shrink-0 items-center gap-1 rounded-[6px] border border-[var(--border)] px-1.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text)]"
                  >
                    <Gamepad2 className="size-3" aria-hidden="true" />
                    Play
                  </Link>
                ) : null}
                <Link
                  href={`/models/${m.slug}`}
                  aria-label={`Full evaluation for ${m.name}`}
                  className="inline-flex shrink-0 items-center text-[var(--text-tertiary)] transition-colors hover:text-[var(--text)]"
                >
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </Link>
              </div>
            );
          })}
        </div>
      </FadeIn>

      <p className="text-[12px] leading-[17px] text-[var(--text-secondary)]">
        Every model answered the same prompt. Scores are Showdown Score v2, so
        the numbers are comparable; the{" "}
        <Link
          href="/leaderboard"
          className="underline underline-offset-2 hover:text-[var(--text)]"
        >
          leaderboard
        </Link>{" "}
        adds the dimension-level evidence behind them.
      </p>
    </section>
  );
}
