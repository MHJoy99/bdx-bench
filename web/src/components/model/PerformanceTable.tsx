import Link from "next/link";
import { formatDate } from "@/lib/format";
import { getBenchmarkEvaluations } from "@/lib/data";

const SHOWDOWN_SLUG = "zombie-flamethrower-showdown";
const SHOWDOWN_NAME = "Zombie Flamethrower Showdown";
const SHOWDOWN_LABEL = "Showdown Score (manual game-build evaluation)";

export function PerformanceTable({
  modelSlug,
  modelName,
}: {
  modelSlug: string;
  modelName: string;
}) {
  const stored = getBenchmarkEvaluations(SHOWDOWN_SLUG).filter(
    (e) => e.modelSlug === modelSlug,
  );
  const fallbackRaw =
    modelSlug === "muse-spark-1-3"
      ? 92
      : modelSlug === "deepseek-v4-1-flash"
        ? 94
        : modelSlug === "space-bunny-free"
          ? 93.5
        : modelSlug === "gpt-6-sol"
          ? 91.5
        : modelSlug === "gpt-5-6-luna"
          ? 91
          : modelSlug === "gemini-pro-agent"
            ? 90.5
          : modelSlug === "gpt-6-luna"
            ? 89.5
          : modelSlug === "gemini-3-8-flash"
            ? 88
            : null;

  const rows =
    stored.length > 0
      ? stored.map((e) => ({
          name: SHOWDOWN_SLUG,
          title: SHOWDOWN_NAME,
          score: e.raw,
          updatedAt: e.evaluatedAt,
        }))
      : fallbackRaw !== null
        ? [
            {
              name: SHOWDOWN_SLUG,
              title: SHOWDOWN_NAME,
              score: fallbackRaw,
              updatedAt: "2026-09-12",
            },
          ]
        : [];

  return (
    <section aria-labelledby="model-performance-heading">
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id="model-performance-heading"
          className="text-lg font-semibold uppercase tracking-wide text-foreground"
        >
          Model performance
        </h2>
        <p className="text-xs text-muted-foreground">{SHOWDOWN_LABEL}</p>
      </div>

      {rows.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {modelName} has no evaluated benchmarks yet. Other dimensions show
          as Not evaluated.
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[560px] border-collapse bg-card text-[13px] leading-5">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase leading-4 tracking-wide text-muted-foreground">
                <th scope="col" className="px-3 py-2 font-medium">
                  Benchmark
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Score
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.name}
                  className="border-b border-border last:border-0 hover:bg-muted/50"
                >
                  <th scope="row" className="px-3 py-2 text-left font-medium text-foreground">
                    <Link
                      href={`/benchmarks/${r.name}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {r.title}
                    </Link>
                  </th>
                  <td className="px-3 py-2 text-right font-mono font-semibold text-foreground">
                    {Number.isFinite(r.score) ? r.score.toFixed(1) : "Not evaluated"}
                  </td>
                  <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                    <time dateTime={r.updatedAt}>{formatDate(r.updatedAt)}</time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        All other benchmarks show as Not evaluated for this build.
      </p>
    </section>
  );
}
