import { formatDate, formatScore } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BenchmarkRow } from "@/lib/model-pages-demo";
import { DemoBadge } from "./DemoBadge";

/**
 * MODEL PERFORMANCE table: one row per benchmark.
 * Columns: Benchmark | Score | Avg | Percentile | Updated.
 * Owner: SUB-AGENT 5/10 MODEL PAGES.
 * TODO(@ui): swap for `@/components/ui/table` when it lands.
 */

export function PerformanceTable({ rows }: { rows: BenchmarkRow[] }) {
  return (
    <section aria-labelledby="model-performance-heading">
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id="model-performance-heading"
          className="text-lg font-semibold uppercase tracking-wide text-foreground"
        >
          Model performance <DemoBadge />
        </h2>
        <p className="text-xs text-muted-foreground">
          Avg = demo fleet average · Percentile vs demo fleet
        </p>
      </div>

      <div className="mt-3 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] border-collapse bg-card text-[13px] leading-5">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase leading-4 tracking-wide text-muted-foreground">
              <th scope="col" className="px-3 py-2 font-medium">
                Benchmark
              </th>
              <th scope="col" className="px-3 py-2 text-right font-medium">
                Score
              </th>
              <th scope="col" className="px-3 py-2 text-right font-medium">
                Avg
              </th>
              <th scope="col" className="px-3 py-2 text-right font-medium">
                Percentile
              </th>
              <th scope="col" className="px-3 py-2 text-right font-medium">
                Updated
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const delta = r.score - r.fleetAvg;
              return (
                <tr
                  key={r.benchmark.slug}
                  className="border-b border-border last:border-0 hover:bg-muted/50"
                >
                  <th scope="row" className="px-3 py-2 text-left font-medium text-foreground">
                    <span title={r.benchmark.description}>{r.benchmark.name}</span>{" "}
                    <span className="font-mono text-[11px] font-normal leading-4 text-muted-foreground">
                      {r.benchmark.category}
                    </span>
                  </th>
                  <td className="px-3 py-2 text-right font-mono font-semibold text-foreground">
                    {formatScore(r.score)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                    {formatScore(r.fleetAvg)}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2 text-right font-mono",
                      r.percentile >= 75
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    P{r.percentile}
                  </td>
                  <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                    <time dateTime={r.updatedAt}>{formatDate(r.updatedAt)}</time>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <caption className="sr-only">
            Demo benchmark scores with fleet averages, percentiles, and update dates.
            Positive deltas mean above the demo fleet average.
          </caption>
        </table>
      </div>

      <ul className="sr-only">
        {rows.map((r) => (
          <li key={r.benchmark.slug}>
            {r.benchmark.name}: score {formatScore(r.score)}, fleet average{" "}
            {formatScore(r.fleetAvg)}, percentile P{r.percentile}, updated{" "}
            {formatDate(r.updatedAt)}.
          </li>
        ))}
      </ul>
    </section>
  );
}
