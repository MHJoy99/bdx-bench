import type { Metadata } from "next";
import {
  BenchmarkCoverage,
  BuildsGallery,
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
      <Hero />
      <GlobalStats />
      <TopModels />
      <BuildsGallery />
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
