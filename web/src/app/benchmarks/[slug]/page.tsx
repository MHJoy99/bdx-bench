import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BENCHMARKS, getBenchmarkEvaluations, getModel } from "@/lib/data";

const SHOWDOWN_SLUG = "zombie-flamethrower-showdown";
const SHOWDOWN_NAME = "Zombie Flamethrower Showdown";
const SHOWDOWN_LABEL = "Showdown Score (manual game-build evaluation)";

const PLAY_LINKS: Record<string, string> = {
  "muse-spark-1-3": "/play/pyro-vs-zombies",
  "deepseek-v4-1-flash": "/play/pyre-burn-horde",
  "gpt-5-6-luna": "/play/firebreak-night-shift",
  "gemini-3-8-flash": "/play/pyroclasm-inferno",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const b = BENCHMARKS.find((x) => x.slug === slug);
  const name = b?.name ?? (slug === SHOWDOWN_SLUG ? SHOWDOWN_NAME : slug);
  return {
    title: `${name} Results`,
    description: `${name}: per-build ${SHOWDOWN_LABEL} results with provenance and play links.`,
  };
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return [{ slug: SHOWDOWN_SLUG }];
}

export default async function BenchmarkDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const b = BENCHMARKS.find((x) => x.slug === slug);
  if (!b && slug !== SHOWDOWN_SLUG) notFound();
  const name = b?.name ?? SHOWDOWN_NAME;
  const description =
    b?.description ??
    "Head-to-head game-build evaluation: playability, build quality, and judge review.";

  const stored = getBenchmarkEvaluations(slug);
  const rows =
    stored.length > 0
      ? [...stored].sort((a, b2) => b2.raw - a.raw)
      : slug === SHOWDOWN_SLUG
        ? [
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
          ]
        : [];

  return (
    <div className="container max-w-4xl py-12">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        Benchmark
      </p>
      <h1 className="mt-1 text-3xl font-bold">{name}</h1>
      <p className="mt-2 text-muted-foreground">{description}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Scores are {SHOWDOWN_LABEL}.
      </p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th scope="col" className="px-3 py-2">Build</th>
              <th scope="col" className="px-3 py-2 text-right">Showdown Score</th>
              <th scope="col" className="px-3 py-2 text-right">Play</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const m = getModel(r.modelSlug);
              const label = m?.name ?? r.modelSlug;
              const play = PLAY_LINKS[r.modelSlug];
              return (
                <tr key={r.modelSlug} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">
                    <Link
                      href={`/models/${r.modelSlug}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {label}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold">
                    {Number.isFinite(r.raw) ? r.raw.toFixed(1) : "Not evaluated"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {play ? (
                      <Link href={play} className="underline underline-offset-2">
                        Play
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <section aria-label="Provenance" className="mt-6 rounded-lg border border-border bg-card p-4 text-sm">
        <h2 className="font-semibold">Provenance</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Round: September 2026 game-build review.</li>
          <li>Method: fixed prompt, playability checks, judge review and community signals.</li>
          <li>Builds: Muse Spark 1.3 (92) and Gemini 3.8 Flash (88).</li>
        </ul>
        <p className="mt-3">
          <Link href="/methodology" className="underline underline-offset-2">
            Read the full methodology
          </Link>
        </p>
      </section>
    </div>
  );
}
