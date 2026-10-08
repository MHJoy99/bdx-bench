import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Hero } from "@/components/home";

/*
 * Below-fold sections hydrate behind their own dynamic boundaries (SSR kept,
 * so the HTML is identical). This keeps the initial hydration tree to the
 * shell + Hero, where the LCP text lives, instead of reconciling all eleven
 * sections — including the motion-heavy artifact grid — before first paint.
 */
const BuildsGallery = dynamic(() =>
  import("@/components/home/builds-gallery").then((m) => m.BuildsGallery),
);
const AuditCredibility = dynamic(() =>
  import("@/components/home/builds-gallery").then((m) => m.AuditCredibility),
);
const GlobalStats = dynamic(() =>
  import("@/components/home/global-stats").then((m) => m.GlobalStats),
);
const TopModels = dynamic(() =>
  import("@/components/home/top-models").then((m) => m.TopModels),
);
const PricePerformance = dynamic(() =>
  import("@/components/home/price-performance").then((m) => m.PricePerformance),
);
const CategoryLeaders = dynamic(() =>
  import("@/components/home/category-leaders").then((m) => m.CategoryLeaders),
);
const LatestModels = dynamic(() =>
  import("@/components/home/latest-models").then((m) => m.LatestModels),
);
const CapabilityTrend = dynamic(() =>
  import("@/components/home/capability-trend").then((m) => m.CapabilityTrend),
);
const BenchmarkCoverage = dynamic(() =>
  import("@/components/home/benchmark-coverage").then((m) => m.BenchmarkCoverage),
);
const MethodologyTeaser = dynamic(() =>
  import("@/components/home/methodology-teaser").then((m) => m.MethodologyTeaser),
);
const HomeFooter = dynamic(() =>
  import("@/components/home/home-footer").then((m) => m.HomeFooter),
);

export const metadata: Metadata = {
  title: {
    absolute: "BDX Bench — AI Model Benchmarks, Rankings & Intelligence",
  },
  description:
    "Game-build evaluation for eight verified models on Zombie Flamethrower Showdown, with Showdown Scores, play links, and methodology.",
};

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full min-w-[320px] max-w-[1280px] flex-col gap-6 bg-bdx-bg px-4 py-6 text-bdx-ink sm:gap-8 sm:px-6 lg:px-8">
      {/* 1. Scope. 2. The artifact. 3. The evidence. Then the rest of the data tool. */}
      <Hero />
      <BuildsGallery />
      <AuditCredibility />
      <GlobalStats />
      <TopModels />
      <PricePerformance />
      <CategoryLeaders />
      <LatestModels />
      <CapabilityTrend />
      <BenchmarkCoverage />
      <MethodologyTeaser />
      <HomeFooter />
    </div>
  );
}
