import { getModel } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { FadeIn } from "@/components/motion/polish-motion";

/**
 * BDX Bench — score history for a model.
 *
 * One audited round exists, so this is a single data point and says so. A
 * benchmark that drew a trend line through one measurement would be lying, so
 * the panel is a dated snapshot with an explicit note about what a second round
 * would add. Server component: the readout is static and needs no client JS.
 */

export function ModelHistoryChart({
  slug,
  modelName,
}: {
  slug: string;
  modelName: string;
}) {
  const model = getModel(slug);
  const score =
    typeof model?.scores.overall === "number" &&
    Number.isFinite(model.scores.overall)
      ? model.scores.overall
      : null;
  const evaluatedAt = model?.scores.evaluatedAt ?? null;

  return (
    <section aria-labelledby="model-history-heading" className="space-y-2.5">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b border-[var(--border)] pb-2">
        <h2
          id="model-history-heading"
          className="text-[15px] font-semibold tracking-tight text-[var(--text)]"
        >
          Score history
        </h2>
        <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
          1 evaluated round
        </p>
      </div>

      <FadeIn>
        <div className="overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--surface)]">
          <div className="grid grid-cols-1 gap-px bg-[var(--border)] sm:grid-cols-3">
            <div className="bg-[var(--surface)] px-3 py-2">
              <p className="font-mono text-[9px] uppercase leading-[12px] tracking-wider text-[var(--text-tertiary)]">
                Rounds evaluated
              </p>
              <p className="tnum mt-0.5 font-mono text-[13px] text-[var(--text)]">
                1
              </p>
            </div>
            <div className="bg-[var(--surface)] px-3 py-2">
              <p className="font-mono text-[9px] uppercase leading-[12px] tracking-wider text-[var(--text-tertiary)]">
                Snapshot
              </p>
              <p className="tnum mt-0.5 font-mono text-[13px] text-[var(--text)]">
                {score === null ? "Not evaluated" : score.toFixed(2)}
              </p>
            </div>
            <div className="bg-[var(--surface)] px-3 py-2">
              <p className="font-mono text-[9px] uppercase leading-[12px] tracking-wider text-[var(--text-tertiary)]">
                Round date
              </p>
              <p className="tnum mt-0.5 font-mono text-[13px] text-[var(--text)]">
                {evaluatedAt ? (
                  <time dateTime={evaluatedAt}>{formatDate(evaluatedAt)}</time>
                ) : (
                  "—"
                )}
              </p>
            </div>
          </div>
          <p className="border-t border-[var(--border)] px-3 py-2.5 text-[12px] leading-[17px] text-[var(--text-secondary)]">
            {score === null
              ? `${modelName} has no evaluated round yet, so there is no snapshot to plot.`
              : `${modelName} has one evaluated round. A trend appears here only once a second independent round exists — a line drawn through a single measurement would imply a change that was never measured.`}
          </p>
        </div>
      </FadeIn>
    </section>
  );
}
