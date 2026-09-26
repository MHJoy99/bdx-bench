import Link from "next/link";
import { formatDate } from "@/lib/format";
import { getBenchmarkEvaluations, MODELS } from "@/lib/data";
import { SHOWDOWN } from "@/lib/demo-data";
import { AUDIT_TRAIL } from "@/lib/audit-data";
import { FadeIn } from "@/components/motion/polish-motion";
import type { AuditEntry } from "@/lib/audit-data";

/**
 * BDX Bench — PROMPT USED, and the result that prompt produced.
 *
 * The whole benchmark rests on one sentence. Hiding it would make the score
 * unfalsifiable, so the prompt is shown verbatim — typos included, because the
 * typos are the test — with the framing that every model received this exact
 * text with no per-model tuning. Under it sits this model's own result row for
 * that prompt, which is the only benchmark row that exists.
 */

const SHOWDOWN_SLUG = "zombie-flamethrower-showdown";
const SHOWDOWN_NAME = "Zombie Flamethrower Showdown";

export function PerformanceTable({
  modelSlug,
  modelName,
  entry,
}: {
  modelSlug: string;
  modelName: string;
  entry?: AuditEntry;
}) {
  const stored = getBenchmarkEvaluations(SHOWDOWN_SLUG).find(
    (e) => e.modelSlug === modelSlug,
  );
  const score =
    typeof stored?.raw === "number" && Number.isFinite(stored.raw)
      ? stored.raw
      : entry?.total ?? null;
  const updatedAt = stored?.evaluatedAt ?? entry?.generated ?? null;

  return (
    <section aria-labelledby="model-prompt-heading" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b border-[var(--border)] pb-2">
        <div className="min-w-0">
          <h2
            id="model-prompt-heading"
            className="text-[15px] font-semibold tracking-tight text-[var(--text)]"
          >
            Prompt used
          </h2>
          <p className="mt-0.5 text-[12px] leading-[18px] text-[var(--text-secondary)]">
            What was actually asked. The same text, verbatim and untuned, for
            every model in the round.
          </p>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
          One prompt · {MODELS.length} models · {AUDIT_TRAIL.length} audited builds
        </p>
      </div>

      <FadeIn>
        <figure className="overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--surface)]">
          <figcaption className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 border-b border-[var(--border)] bg-[var(--elevated)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
            <span>
              {SHOWDOWN.promptTitle} · {SHOWDOWN.matchId}
            </span>
            <span className="tnum">issued {SHOWDOWN.evalDate}</span>
          </figcaption>
          <blockquote className="px-3 py-3">
            <p className="font-mono text-[13px] leading-[20px] text-[var(--text)]">
              &ldquo;{SHOWDOWN.promptBody}&rdquo;
            </p>
          </blockquote>
        </figure>
      </FadeIn>

      <div className="overflow-x-auto rounded-[10px] border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full min-w-[520px] border-collapse text-left">
          <caption className="sr-only">
            {modelName}&apos;s evaluated result for the shared benchmark prompt.
          </caption>
          <thead>
            <tr className="border-b border-[var(--border)] font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
              <th scope="col" className="px-3 py-2 font-medium">
                Benchmark
              </th>
              <th scope="col" className="px-3 py-2 text-right font-medium">
                Score
              </th>
              <th scope="col" className="px-3 py-2 text-right font-medium">
                Build
              </th>
              <th scope="col" className="px-3 py-2 text-right font-medium">
                Updated
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[var(--border)] last:border-0">
              <th
                scope="row"
                className="px-3 py-2 text-left text-[13px] font-medium text-[var(--text)]"
              >
                <Link
                  href={`/benchmarks/${SHOWDOWN_SLUG}`}
                  className="underline-offset-2 hover:underline"
                >
                  {SHOWDOWN_NAME}
                </Link>
              </th>
              <td className="tnum px-3 py-2 text-right font-mono text-[13px] font-semibold text-[var(--text)]">
                {score === null ? "Not evaluated" : score.toFixed(2)}
              </td>
              <td className="px-3 py-2 text-right font-mono text-[11px] text-[var(--text-secondary)]">
                {entry ? entry.buildId : "—"}
              </td>
              <td className="tnum px-3 py-2 text-right text-[12px] text-[var(--text-secondary)]">
                {updatedAt ? (
                  <time dateTime={updatedAt}>{formatDate(updatedAt)}</time>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-[12px] leading-[17px] text-[var(--text-secondary)]">
        {SHOWDOWN.methodology} Every other benchmark dimension — reasoning, math,
        knowledge, pricing, throughput — is unmeasured for this build and is
        shown as such rather than estimated.
      </p>
    </section>
  );
}
