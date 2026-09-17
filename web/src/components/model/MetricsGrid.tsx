import {
  formatPrice,
  formatScore,
  formatTokens,
  formatTps,
} from "@/lib/format";
import { blendedPricePer1M, scoreLabel } from "@/lib/scores";
import type { Model } from "@/lib/types";
import { DemoBadge } from "./DemoBadge";

/**
 * Primary metrics grid for a model page.
 * Owner: SUB-AGENT 5/10 MODEL PAGES.
 * TODO(@ui): swap section/card divs for `@/components/ui/card` when it lands.
 */

interface Metric {
  label: string;
  value: string;
  hint: string;
}

export function MetricsGrid({ model }: { model: Model }) {
  const s = model.scores;
  const bdx = s.bdxScore ?? s.overall;
  const blended = blendedPricePer1M(
    model.prices.inputPer1M,
    model.prices.outputPer1M,
  );

  const metrics: Metric[] = [
    {
      label: "Overall",
      value: `${formatScore(s.overall)} · ${scoreLabel(s.overall)}`,
      hint: "Demo overall subscore 0-100",
    },
    {
      label: "Reasoning",
      value: formatScore(s.reasoning),
      hint: "Demo reasoning subscore 0-100",
    },
    { label: "Coding", value: formatScore(s.coding), hint: "Demo coding subscore 0-100" },
    { label: "Math", value: formatScore(s.math), hint: "Demo math subscore 0-100" },
    {
      label: "Knowledge",
      value: formatScore(s.knowledge),
      hint: "Demo knowledge subscore 0-100",
    },
    { label: "Vision", value: formatScore(s.vision), hint: "Demo vision subscore 0-100" },
    {
      label: "Agentic",
      value: formatScore(s.agentic),
      hint: "Demo agentic subscore 0-100",
    },
    {
      label: "Speed",
      value: model.speed ? formatTps(model.speed.tps) : "—",
      hint: "Demo median output throughput",
    },
    {
      label: "Input price",
      value: formatPrice(model.prices.inputPer1M, model.prices.currency),
      hint: "Demo USD per 1M input tokens",
    },
    {
      label: "Output price",
      value: formatPrice(model.prices.outputPer1M, model.prices.currency),
      hint: "Demo USD per 1M output tokens",
    },
    {
      label: "Blended price",
      value: formatPrice(blended, model.prices.currency),
      hint: "3:1 input:output weighting (lib/scores)",
    },
    {
      label: "Context",
      value: formatTokens(model.context),
      hint: "Demo context window (tokens)",
    },
  ];

  return (
    <section aria-labelledby="model-metrics-heading">
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id="model-metrics-heading"
          className="text-lg font-semibold text-foreground"
        >
          Key metrics <DemoBadge />
        </h2>
        <p className="text-xs text-muted-foreground">
          BDX Bench Score (demo composite):{" "}
          <strong className="text-foreground">
            {formatScore(bdx)} · {scoreLabel(bdx)}
          </strong>
        </p>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-lg border border-border bg-card p-3"
          >
            <dt className="text-[11px] uppercase leading-4 tracking-wide text-muted-foreground">
              {m.label}
            </dt>
            <dd
              className="mt-0.5 font-mono text-sm font-semibold text-foreground"
              title={m.hint}
            >
              {m.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
