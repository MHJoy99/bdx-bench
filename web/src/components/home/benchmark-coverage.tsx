import { DemoDataBadge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BENCHMARKS } from "@/lib/data";
import type { Benchmark } from "@/lib/types";

/**
 * BENCHMARK COVERAGE — Server Component. DEMO DATA.
 * Canonical benchmark list (placeholder set). Never touches backend or
 * leaderboard logic.
 */
export function BenchmarkCoverage({ items = BENCHMARKS }: { items?: Benchmark[] }) {
  return (
    <section aria-labelledby="home-coverage-heading">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2
          id="home-coverage-heading"
          className="text-lg font-semibold tracking-tight text-bdx-ink"
        >
          Benchmark coverage
        </h2>
        <DemoDataBadge />
      </div>
      {items.length === 0 ? (
        <div
          role="status"
          className="rounded-[10px] border border-dashed border-bdx-border bg-bdx-surface px-6 py-10 text-center"
        >
          <p className="text-sm font-semibold text-bdx-ink">
            No benchmarks listed yet
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-bdx-muted">
            The benchmark catalog is empty in this slice. Check back after the
            next dataset refresh.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((b) => (
            <Card key={b.slug}>
              <CardContent className="p-4">
                <p className="truncate text-sm font-semibold text-bdx-ink">
                  {b.name}
                </p>
                <p className="mt-1 text-xs capitalize text-bdx-muted">
                  {b.category} · {b.unit}
                </p>
                <p className="mt-2 text-xl font-bold tabular-nums text-bdx-ink">
                  {Math.round(b.weight * 100)}
                  <span className="ml-1 text-xs font-normal text-bdx-muted">
                    % weight
                  </span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <p className="mt-3 text-xs text-bdx-muted">
        Demo suite mix for layout. Canonical suite list is owned by the tasks
        track.
      </p>
    </section>
  );
}
