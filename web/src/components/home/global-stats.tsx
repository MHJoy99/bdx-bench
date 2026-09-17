import { Card, CardContent } from "@/components/ui/card";
import { BENCHMARKS, MODELS } from "@/lib/data";

function formatCompact(n: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(n);
}

function providerCount(slugs: string[]): number {
  return new Set(slugs).size;
}

export function GlobalStats() {
  const modelsTracked = MODELS.length;
  const benchmarks = BENCHMARKS.length;
  const providers = providerCount(MODELS.map((m) => m.provider));
  const evalRuns = MODELS.length * Math.max(1, BENCHMARKS.length);

  const items: { label: string; value: string }[] = [
    { label: "Models Tracked", value: formatCompact(modelsTracked) },
    { label: "Benchmarks", value: String(benchmarks) },
    { label: "Evaluation Runs", value: formatCompact(evalRuns) },
    { label: "Providers", value: String(providers) },
    { label: "Latest Round", value: "Sep 2026" },
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
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="mt-3 text-xs text-bdx-muted">
        Counts reflect the current dataset: {modelsTracked}{" "}
        {modelsTracked === 1 ? "model" : "models"} · {benchmarks}{" "}
        {benchmarks === 1 ? "benchmark" : "benchmarks"}.
      </p>
    </section>
  );
}
