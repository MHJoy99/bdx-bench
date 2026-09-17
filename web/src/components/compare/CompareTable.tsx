import type { Model } from "@/lib/types";
import { formatDate, formatPrice, formatRelative, formatScore, formatTokens, formatTps } from "@/lib/format";
import { blendedPricePer1M } from "@/lib/scores";
import { cn } from "@/lib/utils";
import { COMPARE_METRICS, bestIndexesForMetric, type CompareMetricDef } from "./compare-data";

export interface CompareTableProps {
  models: readonly Model[];
  /** Show the DEMO badge (demo fixtures until live data lands). */
  demo?: boolean;
}

function cellText(model: Model, key: CompareMetricDef["key"]): { text: string; sub?: string } {
  switch (key) {
    case "overall":
      return { text: formatScore(model.scores.overall) };
    case "reasoning":
      return { text: formatScore(model.scores.reasoning) };
    case "coding":
      return { text: formatScore(model.scores.coding) };
    case "math":
      return { text: formatScore(model.scores.math) };
    case "knowledge":
      return { text: formatScore(model.scores.knowledge) };
    case "vision":
      return { text: formatScore(model.scores.vision) };
    case "agentic":
      return { text: formatScore(model.scores.agentic) };
    case "price": {
      const blended = blendedPricePer1M(model.prices.inputPer1M, model.prices.outputPer1M);
      return {
        text: formatPrice(blended, model.prices.currency),
        sub: `in ${formatPrice(model.prices.inputPer1M, model.prices.currency)} · out ${formatPrice(
          model.prices.outputPer1M,
          model.prices.currency,
        )}`,
      };
    }
    case "speed": {
      const tps = model.speed?.tps ?? model.scores.speed ?? null;
      if (tps === null || tps === undefined || !Number.isFinite(tps)) return { text: "—" };
      const ttft = model.speed?.ttftMs;
      return {
        text: formatTps(tps),
        sub: typeof ttft === "number" && Number.isFinite(ttft) ? `${Math.round(ttft)} ms TTFT` : undefined,
      };
    }
    case "latency": {
      const ttft = model.speed?.ttftMs;
      if (typeof ttft !== "number" || !Number.isFinite(ttft)) return { text: "—" };
      return { text: `${Math.round(ttft)} ms` };
    }
    case "context":
      return { text: formatTokens(model.context) };
    case "released":
      return { text: formatDate(model.released), sub: formatRelative(model.released) };
    case "openWeights":
      return { text: model.openWeights ? "Yes" : "No" };
    case "multimodal":
      return { text: model.capabilities.multimodal ? "Yes" : "No" };
    case "toolCalling":
      return { text: model.capabilities.tools ? "Yes" : "No" };
  }
}

/**
 * SUB-AGENT 6/10 COMPARE — owned: side-by-side metric table.
 *
 * Rows (spec order): Overall, Reasoning, Coding, Math, Knowledge, Vision,
 * Agentic, Price, Speed, Latency, Context, Release, OpenWeights, Multimodal,
 * ToolCalling. The stronger cell(s) per metric get an accent highlight
 * (ties all highlight). There is deliberately NO overall-winner banner, trophy,
 * rank, or summed victory count — per-metric highlights only.
 */
export function CompareTable({ models, demo = true }: CompareTableProps) {
  return (
    <section aria-labelledby="compare-table-heading" className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
        <h2 id="compare-table-heading" className="text-sm font-semibold">
          Side-by-side metrics
        </h2>
        {demo ? (
          <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            Demo
          </span>
        ) : null}
        <span className="flex-1" />
        <p className="text-[11px] text-muted-foreground">Accent marks the stronger value per metric only.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <caption className="sr-only">
            Side-by-side comparison of {models.length} models across quality, price, speed, and capability metrics.
            Highlighted cells are stronger in that single metric only; no overall winner is declared.
          </caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="sticky left-0 bg-card p-3 text-left align-bottom">
                <span className="sr-only">Metric</span>
              </th>
              {models.map((m) => (
                <th key={m.slug} scope="col" className="min-w-[140px] p-3 text-left align-bottom">
                  <span className="block font-semibold leading-tight">{m.name}</span>
                  <span className="mt-0.5 block truncate font-mono text-[11px] font-normal text-muted-foreground">
                    {m.slug}
                  </span>
                  <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
                    {m.family} · {m.provider}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARE_METRICS.map((metric) => {
              const best = new Set(bestIndexesForMetric(models, metric.key));
              return (
                <tr key={metric.key} className="border-b border-border last:border-b-0">
                  <th
                    scope="row"
                    className="sticky left-0 max-w-[180px] bg-card p-3 text-left align-top font-medium"
                    title={metric.hint}
                  >
                    <span className="block text-[13px]">{metric.label}</span>
                    <span className="mt-0.5 hidden text-[11px] font-normal text-muted-foreground lg:block">
                      {metric.hint}
                    </span>
                  </th>
                  {models.map((m, i) => {
                    const { text, sub } = cellText(m, metric.key);
                    const stronger = best.has(i);
                    return (
                      <td
                        key={m.slug}
                        data-metric={metric.key}
                        data-stronger={stronger ? "true" : "false"}
                        title={stronger ? `Stronger in ${metric.label} (this metric only)` : undefined}
                        className={cn(
                          "p-3 align-top",
                          stronger &&
                            "bg-[#B8FF5A]/10 shadow-[inset_0_2px_0_0_#3F7A00] dark:shadow-[inset_0_2px_0_0_#B8FF5A]",
                        )}
                      >
                        <span className={cn("inline-flex items-center gap-1.5", stronger && "font-semibold")}>
                          {stronger ? (
                            <span
                              aria-hidden="true"
                              className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#3F7A00] dark:bg-[#B8FF5A]"
                            />
                          ) : null}
                          {text}
                          {stronger ? <span className="sr-only"> (stronger in {metric.label})</span> : null}
                        </span>
                        {sub ? <span className="mt-0.5 block text-[11px] text-muted-foreground">{sub}</span> : null}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="border-t border-border p-3 text-[11px] leading-relaxed text-muted-foreground">
        Per-metric highlights only — no overall winner is declared. Scores 0–100 (higher is better); price and latency
        highlight the lower value; release highlights the newest date.
      </p>
    </section>
  );
}
