import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getModel } from "@/lib/data";
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
import LikeButton from "@/components/interactive/LikeButton";
import StarRating from "@/components/interactive/StarRating";
import Comments from "@/components/interactive/Comments";

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return [{ slug: "muse-spark-1-3" }, { slug: "deepseek-v4-1-flash" }, { slug: "gpt-5-6-luna" }, { slug: "gemini-3-8-flash" }];
}

interface PageProps {
  params: { slug: string } | Promise<{ slug: string }>;
}

const SHOWDOWN_SCORES: Record<string, number> = {
  "deepseek-v4-1-flash": 94,
  "muse-spark-1-3": 92,
  "gpt-5-6-luna": 91,
  "gemini-3-8-flash": 88,
};

const PLAY_LINKS: Record<string, string> = {
  "muse-spark-1-3": "/play/pyro-vs-zombies",
  "deepseek-v4-1-flash": "/play/pyre-burn-horde",
  "gpt-5-6-luna": "/play/firebreak-night-shift",
  "gemini-3-8-flash": "/play/pyroclasm-inferno",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const model = getModel(slug);
  if (!model) {
    return { title: "Model not found" };
  }
  const showdown = SHOWDOWN_SCORES[slug];
  const scoreText =
    typeof showdown === "number" ? showdown.toFixed(1) : "Not evaluated";
  return {
    title: `${model.name} Showdown Score and Profile`,
    description: `${model.name}: Showdown Score ${scoreText} on Zombie Flamethrower Showdown. Play links, evaluation details, and related builds.`,
    openGraph: {
      title: `${model.name} Showdown Score and Profile`,
      description: `Showdown Score ${scoreText} for ${model.name} on Zombie Flamethrower Showdown.`,
      type: "article",
    },
  };
}

export default async function ModelPage({ params }: PageProps) {
  const { slug } = await params;
  const model = getModel(slug);
  if (!model) notFound();

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      <ModelHeader model={model} />

      <MetricsGrid model={model} />

      <section aria-label="Community feedback" className="flex flex-wrap items-center gap-4">
        <LikeButton modelSlug={model.slug} />
        <StarRating modelSlug={model.slug} />
        {PLAY_LINKS[model.slug] ? (
          <Link href={PLAY_LINKS[model.slug] as string} className="underline underline-offset-4">
            Play this build
          </Link>
        ) : null}
      </section>

      <PerformanceTable modelSlug={model.slug} modelName={model.name} />

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

      <Provenance modelSlug={model.slug} />

      <Comments scope="model" id={model.slug} />

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
