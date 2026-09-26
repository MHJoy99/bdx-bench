import {
  formatPrice,
  formatTokens,
  formatTps,
} from "@/lib/format";
import type { Model } from "@/lib/types";
import { FadeIn } from "@/components/motion/polish-motion";
import { cn } from "@/lib/utils";

/**
 * BDX Bench — cost and throughput for a model.
 *
 * Kept on the model page because a build score is only half a purchasing
 * decision, but honest about the state of the data: almost nothing here is
 * measured yet, so every unmeasured value renders as "Not measured" in the
 * token system rather than being inferred from a neighbour model. The one
 * figure that IS published (a context window) is the only one that shows a
 * number.
 */

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export function PriceSpeedPanel({ model }: { model: Model }) {
  const rec = model as unknown as {
    prices?: { inputPer1M?: unknown; outputPer1M?: unknown; currency?: unknown };
    speed?: { tps?: unknown; ttftMs?: unknown };
    context?: unknown;
  };
  const currency =
    typeof rec.prices?.currency === "string" ? rec.prices.currency : "USD";
  const input = num(rec.prices?.inputPer1M);
  const output = num(rec.prices?.outputPer1M);
  const tps = num(rec.speed?.tps);
  const ttft = num(rec.speed?.ttftMs);
  const context = num(rec.context);

  const rows: { label: string; value: string; measured: boolean }[] = [
    {
      label: "Input / 1M tokens",
      value: input === null ? "Not measured" : formatPrice(input, currency),
      measured: input !== null,
    },
    {
      label: "Output / 1M tokens",
      value: output === null ? "Not measured" : formatPrice(output, currency),
      measured: output !== null,
    },
    {
      label: "Throughput",
      value: tps === null ? "Not measured" : formatTps(tps),
      measured: tps !== null,
    },
    {
      label: "Time to first token",
      value:
        ttft === null ? "Not measured" : `${Math.round(ttft).toLocaleString()} ms`,
      measured: ttft !== null,
    },
    {
      label: "Context window",
      value: context === null ? "Not measured" : formatTokens(context),
      measured: context !== null,
    },
  ];

  const measuredCount = rows.filter((r) => r.measured).length;

  return (
    <section aria-labelledby="model-price-speed-heading" className="space-y-2.5">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b border-[var(--border)] pb-2">
        <h2
          id="model-price-speed-heading"
          className="text-[15px] font-semibold tracking-tight text-[var(--text)]"
        >
          Price and speed
        </h2>
        <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
          {measuredCount} of {rows.length} measured
        </p>
      </div>

      <FadeIn>
        <dl className="overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--surface)]">
          {rows.map((r) => (
            <div
              key={r.label}
              className="flex items-baseline justify-between gap-3 border-b border-[var(--border)] px-3 py-2 last:border-b-0"
            >
              <dt className="text-[12px] text-[var(--text-secondary)]">
                {r.label}
              </dt>
              <dd
                className={cn(
                  "tnum shrink-0 font-mono text-[13px] leading-[20px]",
                  r.measured
                    ? "font-semibold text-[var(--text)]"
                    : "text-[var(--text-tertiary)]",
                )}
              >
                {r.value}
              </dd>
            </div>
          ))}
        </dl>
      </FadeIn>

      <p className="text-[12px] leading-[17px] text-[var(--text-secondary)]">
        Pricing and speed were not measured for these builds. Values will appear
        here once vendor pricing and throughput runs are published — nothing on
        this page is filled in from a comparable model.
      </p>
    </section>
  );
}
