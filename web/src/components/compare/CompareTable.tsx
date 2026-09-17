import type { Model } from "@/lib/types";
import { formatDate, formatPrice, formatRelative, formatScore, formatTokens, formatTps } from "@/lib/format";
import { cn } from "@/lib/utils";
import { COMPARE_METRICS, bestIndexesForMetric, type CompareMetricDef } from "./compare-data";

export interface CompareTableProps {
  models: readonly Model[];
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function cellText(model: Model, key: CompareMetricDef["key"]): { text: string; sub?: string } {
  const rec = model as unknown as {
    scores?: Record<string, unknown>;
    prices?: { inputPer1M?: unknown; outputPer1M?: unknown; currency?: unknown };
    speed?: { tps?: unknown; ttftMs?: unknown };
    context?: unknown;
    released?: unknown;
    openWeights?: unknown;
    capabilities?: { multimodal?: unknown; tools?: unknown };
  };
  switch (key) {
    case "overall":
      return { text: num(rec.scores?.["overall"]) === null ? "Not evaluated" : formatScore(num(rec.scores?.["overall"]) as number) };
    case "reasoning":
      return { text: num(rec.scores?.["reasoning"]) === null ? "Not evaluated" : formatScore(num(rec.scores?.["reasoning"]) as number) };
    case "coding":
      return { text: num(rec.scores?.["coding"]) === null ? "Not evaluated" : formatScore(num(rec.scores?.["coding"]) as number) };
    case "math":
      return { text: num(rec.scores?.["math"]) === null ? "Not evaluated" : formatScore(num(rec.scores?.["math"]) as number) };
    case "knowledge":
      return { text: num(rec.scores?.["knowledge"]) === null ? "Not evaluated" : formatScore(num(rec.scores?.["knowledge"]) as number) };
    case "vision":
      return { text: num(rec.scores?.["vision"]) === null ? "Not evaluated" : formatScore(num(rec.scores?.["vision"]) as number) };
    case "agentic":
      return { text: num(rec.scores?.["agentic"]) === null ? "Not evaluated" : formatScore(num(rec.scores?.["agentic"]) as number) };
    case "price": {
      const inp = num(rec.prices?.inputPer1M);
      const out = num(rec.prices?.outputPer1M);
      if (inp === null || out === null) return { text: "Not measured" };
      const currency = typeof rec.prices?.currency === "string" ? rec.prices.currency : "USD";
      const blended = Math.round((inp * 0.75 + out * 0.25) * 100) / 100;
      return {
        text: formatPrice(blended, currency),
        sub: `in ${formatPrice(inp, currency)} · out ${formatPrice(out, currency)}`,
      };
    }
    case "speed": {
      const tps = num(rec.speed?.tps);
      if (tps === null) return { text: "Not measured" };
      const ttft = num(rec.speed?.ttftMs);
      return {
        text: formatTps(tps),
        sub: ttft !== null ? `${Math.round(ttft)} ms to first token` : undefined,
      };
    }
    case "latency": {
      const ttft = num(rec.speed?.ttftMs);
      if (ttft === null) return { text: "Not measured" };
      return { text: `${Math.round(ttft)} ms` };
    }
    case "context": {
      const c = num(rec.context);
      return { text: c === null ? "Not measured" : formatTokens(c) };
    }
    case "released": {
      const rel = typeof rec.released === "string" ? rec.released : "";
      if (!rel) return { text: "—" };
      return { text: formatDate(rel), sub: formatRelative(rel) };
    }
    case "openWeights":
      return { text: rec.openWeights === true ? "Yes (open)" : rec.openWeights === false ? "No (closed)" : "—" };
    case "multimodal":
      return { text: rec.capabilities?.multimodal === true ? "Yes" : rec.capabilities?.multimodal === false ? "No" : "—" };
    case "toolCalling":
      return { text: rec.capabilities?.tools === true ? "Yes" : rec.capabilities?.tools === false ? "No" : "—" };
  }
}

function isMissing(model: Model, key: CompareMetricDef["key"]): boolean {
  return cellText(model, key).text === "Not evaluated" || cellText(model, key).text === "Not measured";
}

export function CompareTable({ models }: CompareTableProps) {
  return (
    <section
      data-testid="compare-table"
      aria-labelledby="compare-table-heading"
      className="overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]"
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] p-4">
        <h2 id="compare-table-heading" className="text-sm font-semibold">
          Side-by-side metrics
        </h2>
        <span className="flex-1" />
        <p className="text-[11px] text-[var(--text-secondary)]">Accent marks the stronger value per metric; tied values both highlight.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <caption className="sr-only">
            Side-by-side comparison of {models.length} models across quality, price, speed, and capability metrics.
            Highlighted cells are stronger in that single metric only; no overall winner is declared.
          </caption>
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th scope="col" className="sticky left-0 bg-[var(--surface)] shadow-[1px_0_0_0_var(--border)] p-3 text-left align-bottom z-10">
                <span className="sr-only">Metric</span>
              </th>
              {models.map((m) => (
                <th key={m.slug} scope="col" className="min-w-[140px] p-3 text-left align-bottom">
                  <span className="block font-semibold leading-tight text-[var(--text)]">{m.name}</span>
                  <span className="mt-0.5 block truncate font-mono text-[11px] font-normal text-[var(--text-tertiary)]">
                    {m.slug}
                  </span>
                  <span className="mt-0.5 block text-[11px] font-normal text-[var(--text-secondary)]">
                    {m.family} · {m.provider}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARE_METRICS.map((metric) => {
              const bestRaw = new Set(bestIndexesForMetric(models, metric.key));
              const best = new Set<number>();
              bestRaw.forEach((i) => {
                const m = models[i];
                if (m && !isMissing(m, metric.key)) best.add(i);
              });
              const tied = best.size > 1;
              return (
                <tr key={metric.key} className="border-b border-[var(--border)]/70 last:border-b-0 even:bg-[var(--surface)] odd:bg-[var(--elevated)]/25">
                  <th
                    scope="row"
                    className="sticky left-0 max-w-[180px] bg-[var(--surface)] shadow-[1px_0_0_0_var(--border)] p-3 text-left align-top font-medium z-10"
                    title={metric.hint}
                  >
                    <span className="block text-[13px]">{metric.label}</span>
                    <span className="mt-0.5 hidden text-[11px] font-normal text-[var(--text-secondary)] lg:block">
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
                        title={stronger ? `Stronger in ${metric.label} (this metric only)${tied ? ", tied" : ""}` : undefined}
                        className={cn(
                          "p-3 align-top",
                          stronger && "bg-[var(--accent-muted)]/20",
                        )}
                      >
                        <span className={cn("inline-flex items-center gap-1.5", stronger && "rounded-[4px] bg-[var(--accent-muted)] border border-[var(--accent-border)] px-1.5 py-0.5 text-[var(--accent-ink)] font-semibold font-mono")}>
                          {text}
                          {stronger ? <span className="sr-only"> (stronger in {metric.label}{tied ? ", tied" : ""})</span> : null}
                        </span>
                        {sub ? <span className="mt-0.5 block text-[11px] text-[var(--text-secondary)]">{sub}</span> : null}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="border-t border-[var(--border)] p-3 text-[11px] leading-relaxed text-[var(--text-secondary)]">
        Per-metric highlights only — no overall winner is declared. Scores 0–100 (higher is better); price and time to
        first token highlight the lower value; release highlights the newest date. Tied values both highlight.
      </p>
    </section>
  );
}
