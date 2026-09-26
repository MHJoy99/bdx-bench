import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getModel, MODELS } from "@/lib/data";
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
import { FailuresFound } from "@/components/model/Provenance";
import { altEntryFor, auditEntryFor, scoreOf } from "@/components/model/Provenance";
import LikeButton from "@/components/interactive/LikeButton";
import StarRating from "@/components/interactive/StarRating";
import Comments from "@/components/interactive/Comments";

/**
 * BDX Bench — the model page.
 *
 * Order is the creative direction, not a layout accident: the page is written
 * as artifact -> evidence -> score -> model identity.
 *
 *   1. ModelHeader      name + the large live playable build + the score
 *   2. Provenance       the build report header (and a second build, if any)
 *   3. MetricsGrid      the five audit dimensions with their evidence
 *   4. PerformanceTable the prompt the build was made from
 *   5. FailuresFound    the verified defects behind the number
 *   6. community + the unmeasured surfaces (radar, price/speed, history)
 *   7. related models + comments
 *
 * Audit lookup matches slug AND the model's published Showdown Score. Two
 * models shipped two audited builds each, so `AUDIT_BY_SLUG` (last-wins) would
 * show the wrong build and the wrong evidence; the resolvers in
 * `@/components/model/MetricsGrid` never read it.
 */

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return MODELS.map((m) => ({ slug: m.slug }));
}

interface PageProps {
  params: { slug: string } | Promise<{ slug: string }>;
}

/** Published round, highest score first. Rank is a consequence of the score. */
const RANKED = [...MODELS].sort((a, b) => (scoreOf(b) ?? 0) - (scoreOf(a) ?? 0));

function rankFor(slug: string): number {
  return RANKED.findIndex((m) => m.slug === slug) + 1;
}

function scoreTextFor(slug: string): string {
  const model = getModel(slug);
  const score = model ? scoreOf(model) : null;
  return score === null ? "Not evaluated" : score.toFixed(2);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const model = getModel(slug);
  if (!model) {
    return { title: "Model not found" };
  }
  const scoreText = scoreTextFor(slug);
  const title = `${model.name} — playable build and audit evidence`;
  const description = `${model.name}: Showdown Score ${scoreText} on Zombie Flamethrower Showdown. Play the build, read the five audit dimensions, and see every verified failure behind the number.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
    },
  };
}

export default async function ModelPage({ params }: PageProps) {
  const { slug } = await params;
  const model = getModel(slug);
  if (!model) notFound();

  const score = scoreOf(model);
  const entry = auditEntryFor(slug, score);
  const altEntry = altEntryFor(slug, score);
  const rank = rankFor(slug);

  return (
    <main className="mx-auto w-full max-w-[1120px] space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      {/* 1 + 2. Identity, PLAYABLE BUILD, score. */}
      <ModelHeader
        model={model}
        entry={entry}
        rank={rank}
        fieldSize={RANKED.length}
      />

      {/* 3. The build report header (and a second build, clearly labelled). */}
      <Provenance
        entry={entry}
        altEntry={altEntry}
        modelSlug={model.slug}
        modelName={model.name}
      />

      {/* 4. EVALUATION BREAKDOWN — five dimensions with per-dimension evidence. */}
      <MetricsGrid entry={entry} />

      {/* 5. PROMPT USED — what was asked, verbatim. */}
      <PerformanceTable
        modelSlug={model.slug}
        modelName={model.name}
        entry={entry}
      />

      {/* 6. FAILURES FOUND — the credibility weapon, never collapsed. */}
      <FailuresFound entry={entry} />

      {/* 7. Community on this build. */}
      <section
        aria-label="Community feedback"
        className="flex flex-wrap items-center gap-4 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5"
      >
        <LikeButton modelSlug={model.slug} />
        <StarRating modelSlug={model.slug} />
        <a
          href="#model-comments"
          className="ml-auto text-[12px] text-[var(--text-secondary)] underline-offset-2 hover:text-[var(--text)] hover:underline"
        >
          Read the discussion
        </a>
      </section>

      {/* 8. Unmeasured surfaces, shown as unmeasured. */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <ModelRadar model={model} />
        </div>
        <div className="lg:col-span-3">
          <PriceSpeedPanel model={model} />
        </div>
      </div>

      <ModelHistoryChart slug={model.slug} modelName={model.name} />

      <RelatedModels slug={model.slug} />

      <div id="model-comments">
        <Comments scope="model" id={model.slug} />
      </div>

      <nav aria-label="Model pages" className="flex flex-wrap gap-4 text-[13px] leading-5">
        <Link href="/leaderboard" className="underline underline-offset-2">
          Back to leaderboard
        </Link>
        <Link href="/models" className="underline underline-offset-2">
          All models
        </Link>
        <Link href="/" className="underline underline-offset-2">
          Home
        </Link>
      </nav>
    </main>
  );
}
