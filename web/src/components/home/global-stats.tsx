import { DemoDataBadge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BENCHMARKS, MODELS } from "@/lib/data";
import type { Model } from "@/lib/types";
// Local fallback (TODO Agent8 canonical `@/lib/demo-data`):
import { DEMO_GLOBAL_STATS } from "./home-demo-data";

function formatCompact(n: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(n);
}

function providerCount(models: Model[]): number {
  return new Set(models.map((m) => m.provider)).size;
}

/**
 * GLOBAL STATS — Server Component. All values DEMO DATA, never live.
 * Real placeholder counts (MODELS/BENCHMARKS) are shown as context in the
 * footnote; headline tiles stay on the demo slice per contract.
 */
export function GlobalStats() {
  const stats = DEMO_GLOBAL_STATS;
  const items: { label: string; value: string }[] = [
    { label: "Models Tracked", value: formatCompact(stats.modelsTracked) },
    { label: "Benchmarks", value: String(stats.benchmarks) },
    { label: "Evaluation Runs", value: formatCompact(stats.evalRuns) },
    { label: "Providers", value: String(stats.providers) },
    { label: "Latest Dataset Refresh", value: stats.datasetRefresh },
  ];

  return (
    <section aria-labelledby="home-stats-heading">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2
          id="home-stats-heading"
          className="text-lg font-semibold tracking-tight text-bdx-ink"
        >
          At a glance
        </h2>
        <DemoDataBadge />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-bdx-muted">
                {item.label}
              </p>
              <p className="mt-2 truncate text-2xl font-bold tabular-nums text-bdx-ink">
                {item.value}
              </p>
              <p className="mt-1 text-[11px] text-bdx-muted">DEMO DATA</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="mt-3 text-xs text-bdx-muted">
        Illustrative slice. Placeholder dataset currently holds {MODELS.length}{" "}
        models · {BENCHMARKS.length} benchmarks · {providerCount(MODELS)}{" "}
        providers.
      </p>
    </section>
  );
}
