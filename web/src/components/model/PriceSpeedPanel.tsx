import {
  formatPrice,
  formatTokens,
  formatTps,
} from "@/lib/format";
import type { ModelPageData } from "@/lib/model-pages-demo";
import { DemoBadge } from "./DemoBadge";

/**
 * PRICE & SPEED panel: per-1M pricing, cache pricing, throughput, TTFT,
 * median latency, context window, max output — each with a tooltip.
 * Owner: SUB-AGENT 5/10 MODEL PAGES.
 */

interface PricedRow {
  label: string;
  value: string;
  tooltip: string;
}

export function PriceSpeedPanel({ data }: { data: ModelPageData }) {
  const { model } = data;
  const rows: PricedRow[] = [
    {
      label: "Input / 1M tokens",
      value: formatPrice(model.prices.inputPer1M, model.prices.currency),
      tooltip: `Demo vendor list price per 1M input tokens (${model.prices.currency}), effective ${model.prices.effectiveDate}. Placeholder — not a live quote.`,
    },
    {
      label: "Output / 1M tokens",
      value: formatPrice(model.prices.outputPer1M, model.prices.currency),
      tooltip: `Demo vendor list price per 1M output tokens (${model.prices.currency}), effective ${model.prices.effectiveDate}. Placeholder — not a live quote.`,
    },
    {
      label: "Cached input / 1M",
      value:
        model.prices.cachedInputPer1M !== undefined
          ? formatPrice(model.prices.cachedInputPer1M, model.prices.currency)
          : "—",
      tooltip:
        "Demo prompt-cache read price per 1M tokens. Placeholder — cache policies differ by vendor.",
    },
    {
      label: "Throughput",
      value: model.speed ? formatTps(model.speed.tps) : "—",
      tooltip: `Demo median output tokens/sec measured by "${model.speed?.harness ?? "unknown harness"}". Placeholder — hardware and load dependent.`,
    },
    {
      label: "TTFT",
      value: model.speed ? `${model.speed.ttftMs.toLocaleString()} ms` : "—",
      tooltip:
        "Demo time-to-first-token: milliseconds from request to first output token. Placeholder — prompt-length dependent.",
    },
    {
      label: "Median latency",
      value: `${data.latencyP50Ms.toLocaleString()} ms`,
      tooltip:
        "Demo p50 end-to-end request latency on the reference prompt set. Placeholder — not an SLA.",
    },
    {
      label: "Context window",
      value: formatTokens(model.context),
      tooltip: "Demo maximum input context in tokens. Placeholder — verify with the vendor.",
    },
    {
      label: "Max output",
      value: formatTokens(data.maxOutput),
      tooltip: "Demo maximum output tokens per request. Placeholder — verify with the vendor.",
    },
  ];

  return (
    <section aria-labelledby="model-price-speed-heading">
      <h2
        id="model-price-speed-heading"
        className="text-lg font-semibold text-foreground"
      >
        Price &amp; speed <DemoBadge />
      </h2>

      <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-baseline justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2"
          >
            <dt className="text-xs text-muted-foreground">
              <abbr
                title={r.tooltip}
                className="cursor-help underline decoration-dotted underline-offset-2"
              >
                {r.label}
              </abbr>
            </dt>
            <dd className="font-mono text-[13px] font-semibold leading-5 text-foreground">
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-muted-foreground">
        Hover or focus a label for methodology. Prices:{" "}
        {model.prices.currency}, source “{model.prices.source ?? "demo-vendor-sheet"}”.
        Speed harness: {model.speed?.harness ?? "—"}.
      </p>
    </section>
  );
}
