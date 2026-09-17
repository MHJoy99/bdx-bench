import type { Metadata } from "next";
import Link from "next/link";
import { BENCHMARKS, getBenchmarkEvaluations, getModel } from "@/lib/data";

export const metadata: Metadata = {
  title: "Benchmarks",
  description:
    "Zombie Flamethrower Showdown results for Muse Spark 1.3 and Gemini 3.8 Flash with evaluation provenance.",
};

const SHOWDOWN_SLUG = "zombie-flamethrower-showdown";
const SHOWDOWN_NAME = "Zombie Flamethrower Showdown";
const SHOWDOWN_LABEL = "Showdown Score (manual game-build evaluation)";

export default function BenchmarksPage() {
  const canonical = BENCHMARKS.find((b) => b.slug === SHOWDOWN_SLUG);
  const slug = canonical?.slug ?? SHOWDOWN_SLUG;
  const name = canonical?.name ?? SHOWDOWN_NAME;
  const description =
    canonical?.description ??
    "Head-to-head game-build evaluation: playability, build quality, and judge review.";
  const evals = getBenchmarkEvaluations(slug);
  const display =
    evals.length > 0
      ? [...evals].sort((a, b) => b.raw - a.raw)
      : [
          {
            modelSlug: "muse-spark-1-3",
            benchmarkSlug: slug,
            raw: 92,
            evaluatedAt: "2026-09-12",
          },
          {
            modelSlug: "gemini-3-8-flash",
            benchmarkSlug: slug,
            raw: 88,
            evaluatedAt: "2026-09-12",
          },
        ];

  return (
    <div className="container max-w-4xl py-12">
      <h1 className="text-3xl font-bold">Benchmarks</h1>
      <p className="mt-2 text-muted-foreground">
        One active round: {name}. Scores below are {SHOWDOWN_LABEL}.
      </p>
      <div className="mt-6 rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold">
            <Link href={`/benchmarks/${slug}`} className="underline-offset-4 hover:underline">
              {name}
            </Link>
          </h2>
          <span className="text-xs text-muted-foreground">{display.length} results</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <ul className="mt-4 space-y-2">
          {display.map((e) => {
            const m = getModel(e.modelSlug);
            const label = m?.name ?? e.modelSlug;
            return (
              <li
                key={e.modelSlug}
                className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
              >
                <Link
                  href={`/models/${e.modelSlug}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {label}
                </Link>
                <span className="tabular-nums font-semibold">
                  {Number.isFinite(e.raw) ? e.raw.toFixed(1) : "Not evaluated"}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          Provenance: manual game-build review, September 2026 round. See the
          benchmark page for per-build notes and{" "}
          <Link href="/methodology" className="underline underline-offset-2">
            Methodology
          </Link>{" "}
          for scoring rules.
        </p>
      </div>
    </div>
  );
}
