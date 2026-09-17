import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllModelSlugs,
  getModelPageData,
} from "@/lib/model-pages-demo";
import {
  MetricsGrid,
  ModelHeader,
  ModelHistoryChart,
  ModelRadar,
  PerformanceTable,
  PriceSpeedPanel,
  Provenance,
  RelatedModels,
} from "@/components/model";

/**
 * Route: /models/[slug] — model profile page.
 * Owner: SUB-AGENT 5/10 MODEL PAGES.
 *
 * Data: scoped demo via `getModelPageData()` (see `@/lib/model-pages-demo`).
 * API agent: swap the lookup for `GET /api/models/[slug]` (Zod slug) when
 * the route exists; keep section composition unchanged.
 */

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return getAllModelSlugs().map((slug) => ({ slug }));
}

interface PageProps {
  // Next 15 passes params as a Promise; older versions pass it directly.
  // `await` handles both, so this page is version-tolerant.
  params: { slug: string } | Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = getModelPageData(slug);
  if (!result.ok) {
    return { title: "Model not found | BDX Bench" };
  }
  const { model } = result.data;
  const bdx = model.scores.bdxScore ?? model.scores.overall;
  return {
    // Required SEO title format.
    title: `${model.name} Benchmarks, Pricing & Performance | BDX Bench`,
    description:
      `Demo profile for ${model.name} (${model.family}): benchmark scores, ` +
      `pricing, speed, history and related models. Synthetic placeholder data — ` +
      `not real evaluations. Composite ${bdx.toFixed(1)}.`,
    openGraph: {
      title: `${model.name} Benchmarks, Pricing & Performance | BDX Bench`,
      description: `Demo benchmark profile for ${model.name}. Synthetic placeholder data.`,
      type: "article",
    },
  };
}

export default async function ModelPage({ params }: PageProps) {
  const { slug } = await params;
  const result = getModelPageData(slug);
  if (!result.ok) notFound();
  const data = result.data;
  const { model } = data;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      {/* Demo banner — every number on this page is a placeholder. */}
      <p
        role="note"
        aria-label="Demo data notice"
        className="rounded-lg border border-[#FFC53D]/40 bg-[#FFC53D]/10 px-3 py-2 text-[13px] leading-5 text-foreground"
      >
        <strong className="font-mono text-[11px] uppercase leading-4 tracking-wide">
          Demo data
        </strong>{" "}
        — synthetic placeholders for UI development. Not real scores, prices, or
        vendor claims.{" "}
        <Link href="/methodology" className="underline underline-offset-2">
          How real scoring works
        </Link>
      </p>

      <ModelHeader model={model} reasoningModel={data.reasoningModel} />

      <MetricsGrid model={model} />

      <PerformanceTable rows={data.benchmarkRows} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <ModelRadar model={model} />
        </div>
        <div className="lg:col-span-3">
          <PriceSpeedPanel data={data} />
        </div>
      </div>

      <ModelHistoryChart slug={model.slug} modelName={model.name} />

      <RelatedModels slug={model.slug} />

      <Provenance data={data} />

      <nav aria-label="Model pages" className="flex gap-4 text-[13px] leading-5">
        <Link href="/leaderboard" className="underline underline-offset-2">
          Back to leaderboard
        </Link>
        <Link href="/" className="underline underline-offset-2">
          Home
        </Link>
      </nav>
    </main>
  );
}
