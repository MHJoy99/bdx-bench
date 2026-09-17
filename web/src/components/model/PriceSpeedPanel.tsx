import {
  formatPrice,
  formatTokens,
  formatTps,
} from "@/lib/format";
import type { Model } from "@/lib/types";

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

  const rows: { label: string; value: string }[] = [
    {
      label: "Input / 1M tokens",
      value: input === null ? "Not measured" : formatPrice(input, currency),
    },
    {
      label: "Output / 1M tokens",
      value: output === null ? "Not measured" : formatPrice(output, currency),
    },
    {
      label: "Throughput",
      value: tps === null ? "Not measured" : formatTps(tps),
    },
    {
      label: "Time to first token",
      value: ttft === null ? "Not measured" : `${Math.round(ttft).toLocaleString()} ms`,
    },
    {
      label: "Context window",
      value: context === null ? "Not measured" : formatTokens(context),
    },
  ];

  return (
    <section aria-labelledby="model-price-speed-heading">
      <h2
        id="model-price-speed-heading"
        className="text-lg font-semibold text-foreground"
      >
        Price and speed
      </h2>

      <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-baseline justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2"
          >
            <dt className="text-xs text-muted-foreground">{r.label}</dt>
            <dd className="font-mono text-[13px] font-semibold leading-5 text-foreground">
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-muted-foreground">
        Pricing and speed were not measured for these builds. Values will
        appear here once vendor pricing and throughput runs are published.
      </p>
    </section>
  );
}
