import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { BENCHMARKS } from "@/lib/data";
import type { Benchmark } from "@/lib/types";

export function BenchmarkCoverage({ items = BENCHMARKS }: { items?: Benchmark[] }) {
  const canonicalSlug = "zombie-flamethrower-showdown";
  const list =
    items.some((b) => b.slug === canonicalSlug)
      ? items.filter((b) => b.slug === canonicalSlug)
      : items.slice(0, 1);

  return (
    <section aria-labelledby="home-coverage-heading">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2
          id="home-coverage-heading"
          className="text-lg font-semibold tracking-tight text-bdx-ink"
        >
          Benchmark coverage
        </h2>
        <Link href="/benchmarks" className="text-sm text-bdx-accent underline-offset-4 hover:underline">
          All benchmarks
        </Link>
      </div>
      {list.length === 0 ? (
        <div
          role="status"
          className="rounded-[10px] border border-dashed border-bdx-border bg-bdx-surface px-6 py-10 text-center"
        >
          <p className="text-sm font-semibold text-bdx-ink">
            No benchmarks listed yet
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-bdx-muted">
            Check back after the next round.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {list.map((b) => (
            <Card key={b.slug}>
              <CardContent className="p-4">
                <p className="truncate text-sm font-semibold text-bdx-ink">
                  <Link href={`/benchmarks/${b.slug}`} className="underline-offset-4 hover:underline">
                    {b.name}
                  </Link>
                </p>
                <p className="mt-1 text-xs capitalize text-bdx-muted">
                  {b.category} · {b.unit}
                </p>
                <p className="mt-2 text-sm text-bdx-muted">
                   6 evaluated builds · Showdown Score (manual game-build
                  evaluation)
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
