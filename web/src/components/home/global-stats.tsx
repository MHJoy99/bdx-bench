import { Card, CardContent } from "@/components/ui/card";
import { BENCHMARKS, MODELS } from "@/lib/data";
import { Activity, Box, Cpu, Database, Layers } from "lucide-react";

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

  const items: { label: string; value: string; hint: string; icon: typeof Activity }[] = [
    { label: "Models Tracked", value: formatCompact(modelsTracked), hint: "Verified weights", icon: Cpu },
    { label: "Benchmarks", value: String(benchmarks), hint: "Standard mini suites", icon: Layers },
    { label: "Evaluation Runs", value: formatCompact(evalRuns), hint: "Automated & manual", icon: Activity },
    { label: "Providers", value: String(providers), hint: "AI Gateways & labs", icon: Box },
    { label: "Latest Round", value: "Sep 2026", hint: "Methodology v1.0", icon: Database },
  ];

  return (
    <section aria-labelledby="home-stats-heading">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2
          id="home-stats-heading"
          className="flex items-center gap-2 text-base font-semibold tracking-tight text-[var(--text)]"
        >
          <span className="h-2 w-2 rounded-full bg-[var(--accent)]" aria-hidden />
          <span>Global Benchmark Telemetry</span>
        </h2>
        <span className="font-mono text-[11px] text-[var(--text-tertiary)]">LIVE INDEX</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((item) => (
          <Card
            key={item.label}
            className="relative overflow-hidden border border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-sm transition-all duration-200 hover:border-[var(--border-strong)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-[var(--border-strong)] before:to-transparent hover:before:via-[var(--accent)]"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between font-mono text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                <span>{item.label}</span>
                <item.icon className="size-3.5 text-[var(--text-tertiary)] opacity-60" aria-hidden />
              </div>
              <p className="mt-2.5 font-mono text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-[var(--text)]">
                {item.value}
              </p>
              <p className="mt-1 truncate text-[11px] text-[var(--text-secondary)]">
                {item.hint}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="mt-3 text-xs text-[var(--text-tertiary)]">
        Counts reflect the current dataset: {modelsTracked}{" "}
        {modelsTracked === 1 ? "model" : "models"} · {benchmarks}{" "}
        {benchmarks === 1 ? "benchmark" : "benchmarks"}.
      </p>
    </section>
  );
}
