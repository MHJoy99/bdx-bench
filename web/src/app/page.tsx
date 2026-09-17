import type { Metadata } from "next";
import {
  BenchmarkCoverage,
  CapabilityTrend,
  CategoryLeaders,
  GlobalStats,
  Hero,
  HomeFooter,
  LatestModels,
  MethodologyTeaser,
  PricePerformance,
  TopModels,
} from "@/components/home";

/**
 * BDX Bench homepage — Server Component (default).
 * Client boundaries live inside `@/components/home/top-models` (tabs)
 * and `@/components/home/capability-trend` (SVG chart) only.
 *
 * Owned by Homepage agent (3/10). No leaderboard/compare/backend logic here
 * — links out to `/leaderboard` and `/compare` (owned by other agents).
 *
 * Data wiring (all real modules):
 *   types   `@/lib/types`   (Model, Benchmark, ...)
 *   scoring `@/lib/scores`  (bdxBenchScore, blendedPricePer1M, BDX_WEIGHTS)
 *   format  `@/lib/format`  (formatScore, formatPrice, ...)
 *   dataset `@/lib/data`    (MODELS, BENCHMARKS, getLeaderboard, getTrends)
 * Synthetic padding for thin placeholder slices lives in homepage-owned
 * `./components/home/home-demo-data` (DEMO DATA, TODO Agent8 canonical
 * `@/lib/demo-data`). Every number on this page renders under a DemoDataBadge.
 *
 * Layout/design: Agent1 `app/layout.tsx` provides NAVBAR (SiteNavWithSearch)
 * + global SiteFooter — this file renders <main>-level content only, no nav
 * duplication. Styling uses Agent2 `@/components/ui/*` primitives + `bdx-*`
 * Tailwind tokens (bg #080A0D, surface #0F1217, accent #B8FF5A).
 */

export const metadata: Metadata = {
  title: "BDX Bench — AI Model Benchmarks, Rankings & Intelligence",
  description:
    "Independent benchmarks, pricing, speed, capability and model intelligence in one place. Demo preview — transparent methodology, reproducible scoring.",
};

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full min-w-[320px] max-w-[1280px] flex-col gap-6 bg-bdx-bg px-4 py-6 text-bdx-ink sm:gap-8 sm:px-6 lg:px-8">
      <Hero />
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
